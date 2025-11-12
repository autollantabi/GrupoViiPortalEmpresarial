import React, { useEffect, useState, useMemo } from "react";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { usePermissions } from "../../../hooks/usePermissions";
import { useAuthContext } from "context/authContext";

/**
 * Componente template genérico para reportería
 * @param {Object} props
 * @param {Object} props.reportesPorTipoModuloEmpresa - Objeto que contiene los reportes organizados por tipo de usuario > módulo > empresa
 * @param {Object} props.modulosMap - Mapeo de códigos de módulos a nombres legibles (ej: { REP_COM_NEUMATICOS: "NEUMATICOS" })
 * @param {Object} props.routeConfig - Configuración de la ruta con modulo y subModules
 * @param {boolean} props.permissionsLoading - Estado de carga de permisos
 */
const TemplateReporteriaComponent = ({
  reportesPorTipoModuloEmpresa,
  modulosMap = {},
  routeConfig,
  permissionsLoading,
}) => {
  const { user } = useAuthContext();

  // Obtener submódulos desde la configuración de la ruta
  const subModules = routeConfig?.subModules;
  const tieneSubModulos =
    subModules && Array.isArray(subModules) && subModules.length > 0;

  // Obtener permisos: con submódulos o solo con el módulo principal
  const { permissionsByModule } = usePermissions(
    routeConfig?.modulo,
    tieneSubModulos ? subModules : null
  );

  // Estados para los selects en cascada
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState(null);
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // Obtener nombres de tipos de usuario del usuario actual
  const tiposUsuarioActual = useMemo(() => {
    if (!user?.tipoUsuario || !Array.isArray(user.tipoUsuario)) return [];
    return user.tipoUsuario.map((tipo) => tipo.TIPO_USUARIO);
  }, [user]);

  // Opciones para el select de tipos de usuario (solo los que tienen reportes definidos)
  const opcionesTiposUsuario = useMemo(() => {
    return tiposUsuarioActual
      .filter((tipo) => reportesPorTipoModuloEmpresa?.[tipo])
      .map((tipo) => ({
        value: tipo,
        label: tipo,
      }));
  }, [tiposUsuarioActual, reportesPorTipoModuloEmpresa]);

  // Opciones para el select de empresas (basado solo en tipo seleccionado)
  const opcionesEmpresas = useMemo(() => {
    if (
      !tipoUsuarioSeleccionado ||
      !reportesPorTipoModuloEmpresa?.[tipoUsuarioSeleccionado]
    ) {
      return [];
    }

    const empresasDisponibles = new Set();
    const modulosDelTipo =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];

    // Obtener todas las empresas que tienen reportes en algún módulo del tipo seleccionado
    Object.keys(modulosDelTipo).forEach((moduloNombre) => {
      // Cuando no hay submódulos, verificar permisos del módulo principal
      // Cuando hay submódulos, verificar permisos del submódulo específico
      const moduloParaVerificar = tieneSubModulos
        ? moduloNombre
        : routeConfig?.modulo;

      // Verificar si el usuario tiene permisos en este módulo
      if (permissionsByModule[moduloParaVerificar]) {
        Object.keys(modulosDelTipo[moduloNombre]).forEach((empresa) => {
          // Verificar si hay reportes para esta empresa y si el usuario tiene permiso
          if (
            modulosDelTipo[moduloNombre][empresa] &&
            permissionsByModule[moduloParaVerificar].some(
              (permiso) => permiso.empresa === empresa
            )
          ) {
            empresasDisponibles.add(empresa);
          }
        });
      }
    });

    return Array.from(empresasDisponibles).map((empresa) => ({
      value: empresa,
      label: empresa,
    }));
  }, [
    tipoUsuarioSeleccionado,
    reportesPorTipoModuloEmpresa,
    permissionsByModule,
    tieneSubModulos,
    routeConfig?.modulo,
  ]);

  // Opciones para el select de módulos (basado en tipo y empresa seleccionados)
  const opcionesModulos = useMemo(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) {
      return [];
    }

    const modulosDisponibles = new Set();
    const modulosDelTipo =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];

    // Filtrar solo los módulos donde hay reportes para la empresa seleccionada
    Object.keys(modulosDelTipo).forEach((moduloNombre) => {
      // Cuando no hay submódulos, verificar permisos del módulo principal
      // Cuando hay submódulos, verificar permisos del submódulo específico
      const moduloParaVerificar = tieneSubModulos
        ? moduloNombre
        : routeConfig?.modulo;

      // Verificar si hay reportes para esta empresa en este módulo
      if (
        modulosDelTipo[moduloNombre]?.[empresaSeleccionada] &&
        permissionsByModule[moduloParaVerificar]?.some(
          (permiso) => permiso.empresa === empresaSeleccionada
        )
      ) {
        modulosDisponibles.add(moduloNombre);
      }
    });

    return Array.from(modulosDisponibles).map((modulo) => ({
      value: modulo,
      label: modulosMap[modulo] || modulo,
    }));
  }, [
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    reportesPorTipoModuloEmpresa,
    permissionsByModule,
    modulosMap,
    tieneSubModulos,
    routeConfig?.modulo,
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

  // Obtener el módulo a usar (cuando no hay submódulos, usar el módulo principal)
  const moduloAUsar = useMemo(() => {
    if (tieneSubModulos) {
      return moduloSeleccionado;
    }
    // Sin submódulos, obtener el primer módulo disponible del tipo seleccionado
    if (
      tipoUsuarioSeleccionado &&
      reportesPorTipoModuloEmpresa?.[tipoUsuarioSeleccionado]
    ) {
      const modulosDelTipo =
        reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado];
      const primerModulo = Object.keys(modulosDelTipo)[0];
      return primerModulo || routeConfig?.modulo;
    }
    return routeConfig?.modulo;
  }, [
    tieneSubModulos,
    moduloSeleccionado,
    tipoUsuarioSeleccionado,
    reportesPorTipoModuloEmpresa,
    routeConfig?.modulo,
  ]);

  // Manejar módulo: solo inicializar al inicio, después solo mantener/resetear (solo si hay submódulos)
  useEffect(() => {
    if (!tieneSubModulos || !tipoUsuarioSeleccionado || !empresaSeleccionada) {
      setModuloSeleccionado(null);
      return;
    }

    if (opcionesModulos.length === 0) {
      setModuloSeleccionado(null);
      return;
    }

    const moduloEstaEnOpciones = opcionesModulos.some(
      (opt) => opt.value === moduloSeleccionado
    );

    if (!moduloEstaEnOpciones) {
      setModuloSeleccionado(opcionesModulos[0].value);
    }
  }, [
    opcionesModulos,
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    moduloSeleccionado,
    tieneSubModulos,
  ]);

  // Actualizar el reporte seleccionado cuando cambian los selects
  useEffect(() => {
    if (!tipoUsuarioSeleccionado || !empresaSeleccionada) {
      setReporteSeleccionado(null);
      return;
    }

    // Si hay submódulos, necesitamos el módulo seleccionado
    if (tieneSubModulos && !moduloSeleccionado) {
      setReporteSeleccionado(null);
      return;
    }

    // Obtener el módulo a usar
    const moduloParaBuscar = tieneSubModulos ? moduloSeleccionado : moduloAUsar;

    // Obtener el reporte para la combinación seleccionada
    const reportes =
      reportesPorTipoModuloEmpresa[tipoUsuarioSeleccionado]?.[
        moduloParaBuscar
      ]?.[empresaSeleccionada];

    if (reportes && reportes.length > 0) {
      // Seleccionar el primer reporte disponible
      const primerReporte = reportes[0];
      setReporteSeleccionado({
        ...primerReporte,
        modulo: moduloParaBuscar,
        tipoUsuario: tipoUsuarioSeleccionado,
        uniqueId: `${tipoUsuarioSeleccionado}-${moduloParaBuscar}-${primerReporte.id}`,
      });
    } else {
      setReporteSeleccionado(null);
    }
  }, [
    tipoUsuarioSeleccionado,
    empresaSeleccionada,
    moduloSeleccionado,
    moduloAUsar,
    tieneSubModulos,
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
    // Resetear módulo cuando cambia la empresa (solo si hay submódulos)
    if (tieneSubModulos) {
      setModuloSeleccionado(null);
    }
    setReporteSeleccionado(null);
  };

  const handleModuloChange = (selectedOption) => {
    setModuloSeleccionado(selectedOption ? selectedOption.value : null);
    // El reporte se actualizará automáticamente por el useEffect
  };

  // Mostrar mensaje si está cargando permisos
  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>Cargando permisos...</div>
      </CustomContainer>
    );
  }

  // Verificar si tiene permisos (submódulos o módulo principal)
  const tienePermisos =
    permissionsByModule && Object.keys(permissionsByModule).length > 0;

  // Mostrar mensaje si no hay permisos
  if (!tienePermisos) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>No tienes permisos para acceder a esta funcionalidad.</div>
        <div style={{ fontSize: "12px", marginTop: "10px", color: "#666" }}>
          {tieneSubModulos
            ? `Se requieren permisos en alguno de los submódulos: ${subModules.join(
                ", "
              )}`
            : `Se requieren permisos en el módulo: ${routeConfig?.modulo}`}
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: 0 }}
    >
      {/* Selects en cascada: Tipo > Empresa > Permiso */}
      <CustomContainer
        style={{
          gap: "10px",
          padding: "10px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* Solo mostrar el select de tipo si hay más de 1 opción */}
        {opcionesTiposUsuario.length > 1 && (
          <CustomSelect
            label="Tipo de Usuario"
            options={opcionesTiposUsuario}
            value={
              tipoUsuarioSeleccionado
                ? opcionesTiposUsuario.find(
                    (opt) => opt.value === tipoUsuarioSeleccionado
                  )
                : null
            }
            onChange={handleTipoUsuarioChange}
            placeholder="Selecciona un tipo..."
            minWidth="200px"
          />
        )}

        <CustomSelect
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

        {/* Solo mostrar el select de Línea Negocio si hay submódulos */}
        {tieneSubModulos && (
          <CustomSelect
            label="Línea Negocio"
            options={opcionesModulos}
            value={
              moduloSeleccionado
                ? opcionesModulos.find(
                    (opt) => opt.value === moduloSeleccionado
                  )
                : null
            }
            onChange={handleModuloChange}
            placeholder="Selecciona un módulo..."
            isDisabled={!empresaSeleccionada || opcionesModulos.length === 0}
            minWidth="200px"
          />
        )}
      </CustomContainer>

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
    </CustomContainer>
  );
};

// Exportar el componente (sin withPermissions, ya que usa usePermissions internamente)
export const TemplateReporteria = TemplateReporteriaComponent;
