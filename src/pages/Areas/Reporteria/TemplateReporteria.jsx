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

/** Canales conocidos para validar estructura por canal */
const CANALES_CONOCIDOS = ["TODOS", "B2B", "B2C"];

/**
 * Convierte la estructura en árbol (rol > línea > empresa [> canal]) a una lista de reportes.
 * Cada item queda con forma: { id, url, titulo, tituloBtn?, rol, linea, empresa, canal? }
 */
const treeToList = (tree) => {
  if (!tree || typeof tree !== "object") return [];
  const list = [];
  Object.keys(tree).forEach((rol) => {
    const lineasDelRol = tree[rol];
    if (!lineasDelRol || typeof lineasDelRol !== "object") return;
    Object.keys(lineasDelRol).forEach((lineaKey) => {
      const empresas = lineasDelRol[lineaKey];
      if (!empresas || typeof empresas !== "object") return;
      const linea = lineaKey === "null" || lineaKey === null ? null : lineaKey;
      Object.keys(empresas).forEach((empresa) => {
        const raw = empresas[empresa];
        if (!raw) return;
        if (Array.isArray(raw)) {
          raw.forEach((r) => list.push({ ...r, rol, linea, empresa, canal: null }));
          return;
        }
        if (typeof raw === "object" && CANALES_CONOCIDOS.some((c) => Object.prototype.hasOwnProperty.call(raw, c))) {
          CANALES_CONOCIDOS.forEach((canal) => {
            const arr = raw[canal];
            if (Array.isArray(arr)) arr.forEach((r) => list.push({ ...r, rol, linea, empresa, canal }));
          });
        }
      });
    });
  });
  return list;
};

/**
 * Normaliza una lista de reportes al formato interno: { id, url, titulo, rol, linea, empresa, canal }.
 * Acepta items con rol, linea, empresa, canal (opcionales); linea y canal pueden ser null.
 */
const normalizeReportesList = (reportes) => {
  if (!Array.isArray(reportes)) return [];
  return reportes.map((r, idx) => ({
    id: r.id ?? idx,
    url: r.url,
    titulo: r.titulo ?? r.tituloBtn ?? "Reporte",
    tituloBtn: r.tituloBtn ?? r.titulo,
    rol: (r.rol ?? "").toLowerCase(),
    linea: r.linea == null || r.linea === "null" ? null : r.linea,
    empresa: r.empresa,
    canal: r.canal == null || r.canal === "" ? null : r.canal,
  }));
};

/**
 * Componente template genérico para reportería.
 * Acepta reportes en formato lista (recomendado) o árbol (legacy).
 *
 * Formato lista: array de { url, rol, linea?, empresa, canal?, id?, titulo? }
 * Formato árbol: reportesPorTipoModuloEmpresa[rol][linea][empresa] = array | { TODOS: [], B2B: [], B2C: [] }
 *
 * @param {Array} [props.reportes] - Lista de reportes: [{ url, rol, linea, empresa, canal?, id?, titulo? }]
 * @param {Object} [props.reportesPorTipoModuloEmpresa] - (Legacy) Árbol rol > línea > empresa [> canal]
 * @param {Object} props.routeConfig - Configuración de la ruta
 * @param {Array} props.availableCompanies - Empresas disponibles para el usuario
 * @param {Array} props.availableLines - Líneas disponibles para el usuario
 * @param {Array} [props.availableCanales] - Canales permitidos (ej. ["TODOS","B2B","B2C"])
 */
export const TemplateReporteria = ({
  reportes: reportesProp,
  reportesPorTipoModuloEmpresa,
  routeConfig,
  availableCompanies = [],
  availableLines = [],
  availableCanales,
}) => {
  const { user } = useAuthContext();

  // Una sola fuente: lista normalizada (desde prop reportes o desde árbol legacy)
  const reportesLista = useMemo(() => {
    if (Array.isArray(reportesProp) && reportesProp.length > 0) {
      return normalizeReportesList(reportesProp);
    }
    return treeToList(reportesPorTipoModuloEmpresa || {});
  }, [reportesProp, reportesPorTipoModuloEmpresa]);

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
  const lineasDisponiblesSet = useMemo(() => {
    if (Array.isArray(availableLines)) {
      return new Set(availableLines.map(linea => linea.nombre?.toUpperCase()));
    }
    return new Set(Object.values(availableLines || {}).map(linea => (linea || "").toUpperCase()));
  }, [availableLines]);

  // Obtener el recurso actual desde routeConfig
  const recursoActual = routeConfig?.recurso || null;

  // Contextos del usuario que aplican al recurso actual (para roles y canales)
  const contextosParaRecurso = useMemo(() => {
    if (!user?.CONTEXTOS || !Array.isArray(user.CONTEXTOS) || !recursoActual) return [];
    const recursoNormalizado = recursoActual.toLowerCase();
    return user.CONTEXTOS.filter((contexto) => {
      if (!contexto.RECURSO) return false;
      const contextoRecursoNormalizado = contexto.RECURSO.toLowerCase();
      if (contextoRecursoNormalizado === recursoNormalizado) return true;
      if (contexto.HERENCIA && recursoNormalizado.startsWith(contextoRecursoNormalizado + ".")) {
        const bloqueados = contexto.BLOQUEADO && contexto.BLOQUEADO !== "null" && contexto.BLOQUEADO !== "<null>"
          ? (Array.isArray(contexto.BLOQUEADO) ? contexto.BLOQUEADO : [contexto.BLOQUEADO])
          : [];
        if (bloqueados.some(bloqueado => {
          const bloqueadoNormalizado = (typeof bloqueado === "string" ? bloqueado : bloqueado?.resource || "")?.toLowerCase();
          return bloqueadoNormalizado && recursoNormalizado.startsWith(bloqueadoNormalizado);
        })) return false;
        return true;
      }
      return false;
    });
  }, [user?.CONTEXTOS, recursoActual]);

  // Obtener roles del usuario específicos para el recurso actual
  const rolesUsuarioParaRecurso = useMemo(() => {
    if (routeConfig?.rolDelRecurso) return [routeConfig.rolDelRecurso];
    const rolesIds = new Set(contextosParaRecurso.map((ctx) => ctx.ID_ROL).filter(Boolean));
    if (user?.ROLES && Array.isArray(user.ROLES)) {
      return user.ROLES
        .filter((rol) => rolesIds.has(rol.ID_ROL))
        .map((rol) => rol.NOMBRE_ROL?.toLowerCase())
        .filter(Boolean);
    }
    return [];
  }, [routeConfig?.rolDelRecurso, contextosParaRecurso, user?.ROLES]);

  // Canales permitidos para el usuario en este recurso (desde ALCANCE.CANALES de sus contextos)
  // Si el usuario no tiene canales en sus permisos, no podrá ver reportes que tengan canal asignado.
  const canalesPermitidosUsuario = useMemo(() => {
    const set = new Set();
    contextosParaRecurso.forEach((contexto) => {
      const alcance = typeof contexto.ALCANCE === "string"
        ? (() => { try { return JSON.parse(contexto.ALCANCE); } catch { return {}; } })()
        : (contexto.ALCANCE || {});
      const canales = alcance.canales || alcance.CANALES;
      if (Array.isArray(canales) && canales.length > 0) canales.forEach((c) => set.add(c));
    });
    return set;
  }, [contextosParaRecurso]);

  const tieneAccesoALinea = (lineaNombre) => {
    if (!lineaNombre) return true;
    return lineasDisponiblesSet.has((lineaNombre || "").toUpperCase());
  };

  // Canales efectivos para filtrar: prop availableCanales (si viene del padre) o los del usuario desde contextos
  const canalesParaFiltrar = useMemo(() => {
    if (Array.isArray(availableCanales) && availableCanales.length > 0) return new Set(availableCanales);
    return canalesPermitidosUsuario;
  }, [availableCanales, canalesPermitidosUsuario]);

  // Lista de reportes filtrada por permisos del usuario (empresa, línea, canal)
  // Canal: si el reporte tiene canal, solo se muestra si el usuario tiene ese canal en su alcance.
  // Si el usuario no tiene canales en sus permisos, no puede ver reportes que tengan canal.
  const reportesFiltrados = useMemo(() => {
    return reportesLista.filter((r) => {
      if (!empresasDisponiblesSet.has(r.empresa)) return false;
      if (r.linea != null && !tieneAccesoALinea(r.linea)) return false;
      if (r.canal != null) {
        if (canalesParaFiltrar.size === 0) return false;
        if (!canalesParaFiltrar.has(r.canal)) return false;
      }
      return true;
    });
  }, [reportesLista, empresasDisponiblesSet, lineasDisponiblesSet, canalesParaFiltrar]);

  // Estados para los selects en cascada
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState(null);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [canalSeleccionado, setCanalSeleccionado] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  
  // Ref para rastrear la empresa anterior y solo resetear el recurso cuando cambia
  const empresaAnteriorRef = useRef(null);

  // Roles disponibles: únicos en reportes filtrados y que el usuario tiene para el recurso actual
  const rolesDisponibles = useMemo(() => {
    const rolesUnicos = [...new Set(reportesFiltrados.map((r) => r.rol))];
    return rolesUnicos.filter((rol) => rolesUsuarioParaRecurso.includes(rol.toLowerCase()));
  }, [reportesFiltrados, rolesUsuarioParaRecurso]);

  // Opciones para el select de roles (solo los que tienen reportes definidos y el usuario tiene)
  const opcionesTiposUsuario = useMemo(() => {
    return rolesDisponibles.map((rol) => ({
      value: rol,
      label: rol,
    }));
  }, [rolesDisponibles]);

  // Opciones para el select de empresas (rol seleccionado; ya filtradas por permisos)
  const opcionesEmpresas = useMemo(() => {
    if (!tipoUsuarioSeleccionado) return [];
    const empresas = new Set(
      reportesFiltrados
        .filter((r) => r.rol === tipoUsuarioSeleccionado)
        .map((r) => r.empresa)
    );
    return Array.from(empresas).map((empresa) => ({ value: empresa, label: empresa }));
  }, [tipoUsuarioSeleccionado, reportesFiltrados]);

  // Opciones para el select de recursos/líneas (rol + empresa seleccionados; solo líneas no null)
  const opcionesRecursos = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) return [];
    const lineas = new Set(
      reportesFiltrados
        .filter(
          (r) =>
            r.rol === tipoUsuarioSeleccionado &&
            r.empresa === empresaSeleccionada &&
            r.linea != null
        )
        .map((r) => r.linea)
    );
    return Array.from(lineas).map((linea) => ({
      value: linea,
      label: MAPEO_LINEAS[linea] || linea,
    }));
  }, [tipoUsuarioSeleccionado, empresaSeleccionada, reportesFiltrados]);

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

  // ¿Hay al menos un reporte con línea definida? (muestra select Recurso)
  const tieneRecursos = useMemo(
    () => reportesFiltrados.some((r) => r.linea != null),
    [reportesFiltrados]
  );

  // Recurso a usar cuando no hay select de recursos: "null" para buscar reportes sin línea
  const recursoAUsar = useMemo(() => {
    if (recursoSeleccionado) return recursoSeleccionado;
    if (!tieneRecursos && tipoUsuarioSeleccionado && empresaSeleccionada) return "null";
    return null;
  }, [recursoSeleccionado, tieneRecursos, tipoUsuarioSeleccionado, empresaSeleccionada]);

  // Recurso efectivo para buscar reportes (rol + linea + empresa ya están en estado)
  const recursoParaBuscar = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) return null;
    if (tieneRecursos) return recursoSeleccionado ?? null;
    return recursoAUsar === null ? "null" : recursoAUsar;
  }, [tieneRecursos, tipoUsuarioSeleccionado, empresaSeleccionada, recursoSeleccionado, recursoAUsar]);

  // Para la selección actual, ¿hay reportes con canal definido?
  const tieneCanalEnSeleccionActual = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada || recursoParaBuscar == null) return false;
    const lineaNorm = recursoParaBuscar === "null" ? null : recursoParaBuscar;
    return reportesFiltrados.some(
      (r) =>
        r.rol === tipoUsuarioSeleccionado &&
        r.empresa === empresaSeleccionada &&
        (r.linea || null) === lineaNorm &&
        r.canal != null
    );
  }, [tipoUsuarioSeleccionado, empresaSeleccionada, recursoParaBuscar, reportesFiltrados]);

  // Opciones para el select de Canal (canales únicos para rol+empresa+recurso actual)
  const opcionesCanales = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada || recursoParaBuscar == null) return [];
    const lineaNorm = recursoParaBuscar === "null" ? null : recursoParaBuscar;
    const canales = new Set(
      reportesFiltrados
        .filter(
          (r) =>
            r.rol === tipoUsuarioSeleccionado &&
            r.empresa === empresaSeleccionada &&
            (r.linea || null) === lineaNorm &&
            r.canal != null
        )
        .map((r) => r.canal)
    );
    let list = [...canales];
    if (Array.isArray(availableCanales) && availableCanales.length > 0) {
      list = list.filter((c) => availableCanales.includes(c));
    }
    return list.map((c) => ({ value: c, label: c }));
  }, [tipoUsuarioSeleccionado, empresaSeleccionada, recursoParaBuscar, reportesFiltrados, availableCanales]);

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

  // Cuando la selección actual usa canal, inicializar canal al primero disponible si no hay uno válido
  useEffect(() => {
    if (!tieneCanalEnSeleccionActual) {
      setCanalSeleccionado(null);
      return;
    }
    if (opcionesCanales.length > 0 && (!canalSeleccionado || !opcionesCanales.some((o) => o.value === canalSeleccionado))) {
      setCanalSeleccionado(opcionesCanales[0].value);
    }
  }, [tieneCanalEnSeleccionActual, opcionesCanales, canalSeleccionado]);

  // Actualizar el reporte seleccionado cuando cambian los selects (y canal si aplica)
  useEffect(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada || recursoParaBuscar == null) {
      setReporteSeleccionado(null);
      return;
    }
    if (tieneCanalEnSeleccionActual && !canalSeleccionado) {
      setReporteSeleccionado(null);
      return;
    }

    const lineaNorm = recursoParaBuscar === "null" ? null : recursoParaBuscar;
    const canalBuscar = tieneCanalEnSeleccionActual ? canalSeleccionado : null;
    const primerReporte = reportesFiltrados.find(
      (r) =>
        r.rol === tipoUsuarioSeleccionado &&
        r.empresa === empresaSeleccionada &&
        (r.linea || null) === lineaNorm &&
        (r.canal || null) === (canalBuscar || null)
    );

    if (primerReporte) {
      const canalSuffix = tieneCanalEnSeleccionActual ? `-${canalSeleccionado}` : "";
      setReporteSeleccionado({
        ...primerReporte,
        recurso: recursoParaBuscar,
        tipoUsuario: tipoUsuarioSeleccionado,
        uniqueId: `${tipoUsuarioSeleccionado}-${recursoParaBuscar}-${empresaSeleccionada}${canalSuffix}-${primerReporte.id}`,
      });
    } else {
      setReporteSeleccionado(null);
    }
  }, [
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    recursoParaBuscar,
    tieneCanalEnSeleccionActual,
    canalSeleccionado,
    reportesFiltrados,
  ]);

  // Handlers para los cambios de los selects
  const handleTipoUsuarioChange = (selectedOption) => {
    const nuevoTipo = selectedOption ? selectedOption.value : null;
    setTipoUsuarioSeleccionado(nuevoTipo);
    setCanalSeleccionado(null);
    setReporteSeleccionado(null);
  };

  const handleEmpresaChange = (selectedOption) => {
    const nuevaEmpresa = selectedOption ? selectedOption.value : null;
    setEmpresaSeleccionada(nuevaEmpresa);
    if (tieneRecursos) setRecursoSeleccionado(null);
    setCanalSeleccionado(null);
    setReporteSeleccionado(null);
  };

  const handleRecursoChange = (selectedOption) => {
    setRecursoSeleccionado(selectedOption ? selectedOption.value : null);
    setCanalSeleccionado(null);
  };

  const handleCanalChange = (selectedOption) => {
    setCanalSeleccionado(selectedOption ? selectedOption.value : null);
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

        {/* Solo mostrar Canal cuando la estructura tiene nivel canal para la selección actual */}
        {tieneCanalEnSeleccionActual && opcionesCanales.length > 0 && (
          <SelectUI
            label="Canal"
            options={opcionesCanales}
            value={
              canalSeleccionado
                ? opcionesCanales.find((opt) => opt.value === canalSeleccionado)
                : null
            }
            onChange={handleCanalChange}
            placeholder="Selecciona un canal..."
            isDisabled={opcionesCanales.length === 0}
            minWidth="140px"
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
