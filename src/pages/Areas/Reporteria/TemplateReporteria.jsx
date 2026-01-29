import React, { useEffect, useState, useMemo, useRef } from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useAuthContext } from "context/authContext";

/**
 * Mapeo de líneas a nombres legibles para el select
 * Este mapeo se hace en el template para centralizar la lógica
 */
const MAPEO_LINEAS = {
  "LLANTAS": "NEUMATICOS",
  "LLANTAS MOTO": "MOTO",
  "LUBRICANTES": "LUBRICANTES",
  "HERRAMIENTAS": "HERRAMIENTAS",
};

/**
 * Componente template genérico para reportería
 * @param {Object} props
 * @param {Object} props.reportesPorTipoModuloEmpresa - Objeto que contiene los reportes organizados por rol > línea > empresa
 * @param {Object} props.routeConfig - Configuración de la ruta
 * @param {Array} props.availableCompanies - Empresas disponibles para el usuario (formato: [{ id, nombre }] o { "1": "AUTOLLANTA", ... })
 * @param {Array} props.availableLines - Líneas disponibles para el usuario (formato: [{ id, nombre }] o { "3": "LLANTAS", ... })
 */
export const TemplateReporteria = ({
  reportesPorTipoModuloEmpresa,
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  const { user } = useAuthContext();

  // Verificar si hay recursos (líneas) en la estructura (si todas las líneas son null, no hay recursos)
  const tieneRecursos = useMemo(() => {
    if (!reportesPorTipoModuloEmpresa) return false;
    // Verificar si hay al menos un rol con una línea que no sea null
    return Object.values(reportesPorTipoModuloEmpresa).some((lineasDelRol) => {
      return Object.keys(lineasDelRol).some((linea) => linea !== "null" && linea !== null);
    });
  }, [reportesPorTipoModuloEmpresa]);

  // Convertir availableCompanies a un Set de nombres de empresas para verificación rápida
  // availableCompanies puede ser un objeto { "1": "AUTOLLANTA", ... } o un array [{ id, nombre }, ...]
  const empresasDisponiblesSet = useMemo(() => {
    if (Array.isArray(availableCompanies)) {
      return new Set(availableCompanies.map(emp => emp.nombre));
    }
    // Si es un objeto, obtener los valores
    return new Set(Object.values(availableCompanies));
  }, [availableCompanies]);

  // Convertir availableLines a un Set de nombres de líneas para verificación rápida
  // availableLines puede ser un objeto { "3": "LLANTAS", ... } o un array [{ id, nombre }, ...]
  const lineasDisponiblesSet = useMemo(() => {
    if (Array.isArray(availableLines)) {
      return new Set(availableLines.map(linea => linea.nombre?.toUpperCase()));
    }
    // Si es un objeto, obtener los valores y convertir a mayúsculas
    return new Set(Object.values(availableLines).map(linea => linea.toUpperCase()));
  }, [availableLines]);

  // Obtener el recurso actual desde routeConfig
  const recursoActual = routeConfig?.recurso || null;

  // Obtener roles del usuario específicos para el recurso actual
  // Priorizar el rol que viene en routeConfig (ya calculado en el router)
  const rolesUsuarioParaRecurso = useMemo(() => {
    // Si routeConfig ya tiene el rol calculado, usarlo directamente
    if (routeConfig?.rolDelRecurso) {
      return [routeConfig.rolDelRecurso];
    }

    // Fallback: calcular desde user.CONTEXTOS si no viene en routeConfig
    if (!user?.CONTEXTOS || !Array.isArray(user.CONTEXTOS) || !recursoActual) {
      return [];
    }

    // Filtrar contextos que coinciden con el recurso actual o recursos padre (herencia)
    const contextosParaRecurso = user.CONTEXTOS.filter((contexto) => {
      if (!contexto.RECURSO) return false;
      
      // Verificar si el contexto es exactamente para este recurso
      const recursoNormalizado = recursoActual.toLowerCase();
      const contextoRecursoNormalizado = contexto.RECURSO.toLowerCase();
      
      if (contextoRecursoNormalizado === recursoNormalizado) return true;
      
      // Verificar herencia: si el recurso actual empieza con el recurso del contexto
      // Ejemplo: contexto.RECURSO = "reportes", recursoActual = "reportes.flashventas"
      if (contexto.HERENCIA && recursoNormalizado.startsWith(contextoRecursoNormalizado + ".")) {
        // Verificar que no esté bloqueado
        const bloqueados = contexto.BLOQUEADO && contexto.BLOQUEADO !== "null" && contexto.BLOQUEADO !== "<null>"
          ? (Array.isArray(contexto.BLOQUEADO) ? contexto.BLOQUEADO : [contexto.BLOQUEADO])
          : [];
        
        // Si el recurso actual está bloqueado, no incluir este contexto
        if (bloqueados.some(bloqueado => {
          const bloqueadoNormalizado = (typeof bloqueado === 'string' ? bloqueado : bloqueado.resource || '')?.toLowerCase();
          return bloqueadoNormalizado && recursoNormalizado.startsWith(bloqueadoNormalizado);
        })) {
          return false;
        }
        
        return true;
      }
      
      return false;
    });

    // Obtener los IDs de roles únicos de los contextos filtrados
    const rolesIds = new Set(contextosParaRecurso.map(ctx => ctx.ID_ROL).filter(Boolean));
    
    // Obtener los nombres de roles desde user.ROLES
    if (user?.ROLES && Array.isArray(user.ROLES)) {
      return user.ROLES
        .filter(rol => rolesIds.has(rol.ID_ROL))
        .map(rol => rol.NOMBRE_ROL?.toLowerCase())
        .filter(Boolean);
    }
    
    return [];
  }, [routeConfig, user?.CONTEXTOS, user?.ROLES, recursoActual]);

  // Estados para los selects en cascada
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState(null);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  
  // Ref para rastrear la empresa anterior y solo resetear el recurso cuando cambia
  const empresaAnteriorRef = useRef(null);

  // Función para verificar si el usuario tiene acceso a una línea específica
  const tieneAccesoALinea = (lineaNombre) => {
    if (!lineaNombre) return true; // Si no hay línea específica, solo necesita acceso al recurso base
    // Las líneas vienen en mayúsculas desde availableLines
    return lineasDisponiblesSet.has(lineaNombre.toUpperCase());
  };

  // Obtener roles disponibles del usuario que coinciden con los reportes definidos
  // Los roles en reportesPorTipoModuloEmpresa ya vienen en minúsculas (coordinadora, supervisor, jefatura)
  // Solo mostrar los roles que el usuario tiene para el recurso actual
  const rolesDisponibles = useMemo(() => {
    const rolesEnReportes = Object.keys(reportesPorTipoModuloEmpresa || {});
    return rolesEnReportes.filter((rol) => {
      // Los roles ya están en minúsculas en la estructura nueva
      // Solo incluir si el usuario tiene este rol para el recurso actual
      return rolesUsuarioParaRecurso.includes(rol.toLowerCase());
    });
  }, [rolesUsuarioParaRecurso, reportesPorTipoModuloEmpresa]);

  // Opciones para el select de roles (solo los que tienen reportes definidos y el usuario tiene)
  const opcionesTiposUsuario = useMemo(() => {
    return rolesDisponibles.map((rol) => ({
      value: rol,
      label: rol,
    }));
  }, [rolesDisponibles]);

  // Opciones para el select de empresas (basado solo en rol seleccionado)
  const opcionesEmpresas = useMemo(() => {
    if (
      !tipoUsuarioSeleccionado ||
      !reportesPorTipoModuloEmpresa?.[tipoUsuarioSeleccionado]
    ) {
      return [];
    }

    const empresasDisponibles = new Set();
    const lineasDelRol =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];

    // Obtener todas las empresas que tienen reportes en alguna línea del rol seleccionado
    Object.keys(lineasDelRol).forEach((lineaNombre) => {
      // Si la línea es null, significa que no requiere línea específica, solo verificar empresa
      // Si no es null, verificar que el usuario tenga acceso a esta línea
      if (lineaNombre !== "null" && lineaNombre !== null && !tieneAccesoALinea(lineaNombre)) {
        return;
      }

      Object.keys(lineasDelRol[lineaNombre]).forEach((empresa) => {
        // Verificar si hay reportes para esta empresa y si el usuario tiene permiso (empresa está en availableCompanies)
        if (
          lineasDelRol[lineaNombre][empresa] &&
          empresasDisponiblesSet.has(empresa)
        ) {
          empresasDisponibles.add(empresa);
        }
      });
    });

    return Array.from(empresasDisponibles).map((empresa) => ({
      value: empresa,
      label: empresa,
    }));
  }, [
    tipoUsuarioSeleccionado,
    reportesPorTipoModuloEmpresa,
    empresasDisponiblesSet,
    tieneAccesoALinea,
  ]);

  // Opciones para el select de recursos (basado en rol y empresa seleccionados)
  const opcionesRecursos = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) {
      return [];
    }

    const lineasDisponibles = new Set();
    const lineasDelRol =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];

    // Filtrar solo las líneas donde hay reportes para la empresa seleccionada
    // Verificar que el usuario tenga permiso para la empresa seleccionada y la línea correspondiente
    if (empresasDisponiblesSet.has(empresaSeleccionada)) {
      Object.keys(lineasDelRol).forEach((lineaNombre) => {
        // Si la línea es null, omitirla del select (no se muestra en el select de recursos)
        if (lineaNombre === "null" || lineaNombre === null) {
          return;
        }
        // Verificar si hay reportes para esta empresa en esta línea
        // Y si el usuario tiene acceso a esta línea
        if (
          lineasDelRol[lineaNombre]?.[empresaSeleccionada] &&
          tieneAccesoALinea(lineaNombre)
        ) {
          lineasDisponibles.add(lineaNombre);
        }
      });
    }

    return Array.from(lineasDisponibles).map((linea) => ({
      value: linea,
      label: MAPEO_LINEAS[linea] || linea,
    }));
  }, [
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    reportesPorTipoModuloEmpresa,
    empresasDisponiblesSet,
    tieneAccesoALinea,
  ]);

  // Inicializar con el primer valor de cada select (solo cuando no hay valor seleccionado)
  useEffect(() => {
    if (opcionesTiposUsuario.length > 0 && !tipoUsuarioSeleccionado) {
      // Si hay 1 o más tipos, seleccionar el primero automáticamente
      setTipoUsuarioSeleccionado(opcionesTiposUsuario[0].value);
    }
  }, [opcionesTiposUsuario, tipoUsuarioSeleccionado]);

  // Manejar empresa: solo inicializar al inicio, después solo mantener/resetear
  useEffect(() => {
    if (!tipoUsuarioSeleccionado) {
      setEmpresaSeleccionada(null);
      return;
    }

    // Si no hay opciones disponibles, resetear empresa si estaba seleccionada
    if (opcionesEmpresas.length === 0) {
      if (empresaSeleccionada) {
        setEmpresaSeleccionada(null);
      }
      return;
    }

    const empresaEstaEnOpciones = opcionesEmpresas.some(
      (opt) => opt.value === empresaSeleccionada
    );

    if (!empresaEstaEnOpciones) {
      setEmpresaSeleccionada(opcionesEmpresas[0].value);
    }
  }, [opcionesEmpresas, tipoUsuarioSeleccionado, empresaSeleccionada]);

  // Obtener el recurso a usar
  // Si no hay recursos o no hay recurso seleccionado, buscar el recurso "null" o el primero disponible
  const recursoAUsar = useMemo(() => {
    if (recursoSeleccionado) {
      return recursoSeleccionado;
    }
    // Si no hay recursos, buscar el recurso "null" o el primero disponible
    if (!tieneRecursos && tipoUsuarioSeleccionado && reportesPorTipoModuloEmpresa?.[tipoUsuarioSeleccionado]) {
      const lineasDelRol = reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];
      // Buscar primero "null", si no existe, tomar el primer recurso disponible
      if (lineasDelRol["null"] || lineasDelRol[null]) {
        return "null";
      }
      const primerRecurso = Object.keys(lineasDelRol)[0];
      return primerRecurso || null;
    }
    return null;
  }, [recursoSeleccionado, tieneRecursos, tipoUsuarioSeleccionado, reportesPorTipoModuloEmpresa]);

  // Manejar recurso: solo inicializar cuando cambia la empresa o las opciones
  useEffect(() => {
    if (!tieneRecursos || !tipoUsuarioSeleccionado || !empresaSeleccionada) {
      empresaAnteriorRef.current = empresaSeleccionada;
      setRecursoSeleccionado(null);
      return;
    }

    if (opcionesRecursos.length === 0) {
      empresaAnteriorRef.current = empresaSeleccionada;
      setRecursoSeleccionado(null);
      return;
    }

    // Solo resetear/inicializar si cambió la empresa
    const empresaCambio = empresaAnteriorRef.current !== empresaSeleccionada;
    empresaAnteriorRef.current = empresaSeleccionada;

    if (empresaCambio) {
      // Cuando cambia la empresa, seleccionar el primer recurso disponible
      setRecursoSeleccionado(opcionesRecursos[0].value);
    } else if (!recursoSeleccionado) {
      // Si no hay recurso seleccionado y no cambió la empresa, seleccionar el primero
      setRecursoSeleccionado(opcionesRecursos[0].value);
    }
    // Si el usuario seleccionó manualmente un recurso, no hacer nada
  }, [
    opcionesRecursos,
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    tieneRecursos,
    // No incluimos recursoSeleccionado para evitar bucles cuando el usuario selecciona manualmente
  ]);

  // Actualizar el reporte seleccionado cuando cambian los selects
  useEffect(() => {
    // Validaciones básicas
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) {
      setReporteSeleccionado(null);
      return;
    }

    // Determinar qué recurso usar
    let recursoParaBuscar;
    if (tieneRecursos) {
      // Si hay recursos, necesitamos el recurso seleccionado
      if (!recursoSeleccionado) {
        setReporteSeleccionado(null);
        return;
      }
      recursoParaBuscar = recursoSeleccionado;
    } else {
      // Si no hay recursos, usar "null" o el primero disponible
      recursoParaBuscar = recursoAUsar === null ? "null" : recursoAUsar;
    }

    // Buscar el reporte directamente: rol > recurso > empresa
    const reportes =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado]?.[recursoParaBuscar]?.[empresaSeleccionada];

    if (reportes && reportes.length > 0) {
      const primerReporte = reportes[0];
      setReporteSeleccionado({
        ...primerReporte,
        recurso: recursoParaBuscar,
        tipoUsuario: tipoUsuarioSeleccionado,
        uniqueId: `${tipoUsuarioSeleccionado}-${recursoParaBuscar}-${primerReporte.id}`,
      });
    } else {
      setReporteSeleccionado(null);
    }
  }, [
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    recursoSeleccionado,
    recursoAUsar,
    tieneRecursos,
    reportesPorTipoModuloEmpresa,
  ]);

  // Handlers para los cambios de los selects
  const handleTipoUsuarioChange = (selectedOption) => {
    const nuevoTipo = selectedOption ? selectedOption.value : null;
    setTipoUsuarioSeleccionado(nuevoTipo);
    // No reseteamos aquí, el useEffect se encargará de mantener o resetear según disponibilidad
    setReporteSeleccionado(null);
  };

  const handleEmpresaChange = (selectedOption) => {
    const nuevaEmpresa = selectedOption ? selectedOption.value : null;
    setEmpresaSeleccionada(nuevaEmpresa);
    // Resetear recurso cuando cambia la empresa (solo si hay recursos)
    if (tieneRecursos) {
      setRecursoSeleccionado(null);
    }
    setReporteSeleccionado(null);
  };

  const handleRecursoChange = (selectedOption) => {
    setRecursoSeleccionado(selectedOption ? selectedOption.value : null);
    // El reporte se actualizará automáticamente por el useEffect
  };

  // Verificar si tiene permisos (tiene empresas disponibles)
  const tienePermisos = availableCompanies && (Array.isArray(availableCompanies) ? availableCompanies.length > 0 : Object.keys(availableCompanies).length > 0);

  // Mostrar mensaje si no hay permisos
  if (!tienePermisos) {
    return (
      <ContainerUI
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>No tienes permisos para acceder a esta funcionalidad.</div>
      </ContainerUI>
    );
  }

  return (
    <ContainerUI
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: 0 }}
    >
      {/* Selects en cascada: Rol > Empresa > Recurso */}
      <ContainerUI
        style={{
          gap: "10px",
          padding: "10px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Solo mostrar el select de rol si hay más de 1 opción */}
        {opcionesTiposUsuario.length > 1 && (
          <SelectUI
            label="Rol"
            options={opcionesTiposUsuario}
            value={
              tipoUsuarioSeleccionado
                ? opcionesTiposUsuario.find(
                    (opt) => opt.value === tipoUsuarioSeleccionado
                  )
                : null
            }
            onChange={handleTipoUsuarioChange}
            placeholder="Selecciona un rol..."
            minWidth="200px"
          />
        )}

        <SelectUI
          label="Empresa"
          options={opcionesEmpresas}
          value={
            empresaSeleccionada
              ? opcionesEmpresas.find(
                  (opt) => opt.value === empresaSeleccionada
                )
              : null
          }
          onChange={handleEmpresaChange}
          placeholder="Selecciona una empresa..."
          isDisabled={!tipoUsuarioSeleccionado || opcionesEmpresas.length === 0}
          minWidth="200px"
        />

        {/* Solo mostrar el select de Recurso si hay recursos */}
        {tieneRecursos && (
          <SelectUI
            label="Recurso"
            options={opcionesRecursos}
            value={
              recursoSeleccionado
                ? opcionesRecursos.find(
                    (opt) => opt.value === recursoSeleccionado
                  )
                : null
            }
            onChange={handleRecursoChange}
            placeholder="Selecciona un recurso..."
            isDisabled={!empresaSeleccionada || opcionesRecursos.length === 0}
            minWidth="200px"
          />
        )}
      </ContainerUI>

      {/* Mostrar el iframe con el reporte seleccionado */}
      {reporteSeleccionado && (
        <iframe
          key={reporteSeleccionado.uniqueId}
          title={reporteSeleccionado.titulo}
          width="100%"
          height="100%"
          src={reporteSeleccionado.url}
          allowFullScreen
        />
      )}
    </ContainerUI>
  );
};
