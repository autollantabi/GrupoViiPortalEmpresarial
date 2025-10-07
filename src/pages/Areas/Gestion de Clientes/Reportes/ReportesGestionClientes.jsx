import React, { useEffect, useState, useMemo } from "react";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";
import { usePermissions } from "../../../../hooks/usePermissions";
import { withPermissions } from "../../../../hoc/withPermissions";

const ReportesGestionClientesComponent = ({
  routeConfig,
  empresasAcceso,
  permissionsLoading,
}) => {
  const { theme } = useTheme();

  // Obtener submódulos desde la configuración de la ruta
  const subModules = routeConfig?.subModules;

  // Obtener permisos de múltiples submódulos
  // Usamos el módulo padre (REPORTES SEGM) pero filtramos por los submódulos específicos
  const { permissionsByModule } = usePermissions(
    routeConfig?.modulo, // Módulo padre donde están los submódulos
    subModules
  );

  // Estados
  const [empresaActiva, setEmpresaActiva] = useState(null);
  const [grafico, setGrafico] = useState(0);
  const [reportesDisponibles, setReportesDisponibles] = useState([]);

  // Organizamos los reportes por módulo y empresa (usando nombres de empresas)
  const reportesPorModuloEmpresa = useMemo(
    () => ({
      NEUMATICOS: {
        AUTOLLANTA: [
          {
            id: 0,
            tituloBtn: "Cobranzas",
            titulo: "Gestión Coord. Ventas - Autollanta (Cartera)",
            url: "https://app.powerbi.com/view?r=eyJrIjoiMGJhMWQ5YzgtMzU0Ny00M2QwLWIzNDItNGU2YmNmNzA1ZWE4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
          },
          {
            id: 1,
            tituloBtn: "Comercial",
            titulo: "Gestión Coord. Ventas - Autollanta (Comercial)",
            url: "https://app.powerbi.com/view?r=eyJrIjoiZWE4YzgwNTUtYTZkNy00YTc5LTk3MmYtOGNjNTllMTc2MDY3IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
          },
          {
            id: 2,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Coordinacion Ventas Autollanta",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNmNmMmYxYjktZDU1YS00ZTM0LTgxYTYtYTBmYmI5MDU5NmY0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
        MAXXIMUNDO: [
          {
            id: 0,
            tituloBtn: "Cobranzas",
            titulo: "Report Section - Maxximundo",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNGI5NmY1YjgtYTAyMC00MGM2LWJlNmMtYWY3NjY4NGUxNWQ4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection7262b3e2253d60e2910b",
          },
          {
            id: 1,
            tituloBtn: "Comercial",
            titulo: "Gestión Coord. Ventas - Maxximundo (Comercial)",
            url: "https://app.powerbi.com/view?r=eyJrIjoiODZlMmU5ZDgtYjRjZS00OGRkLTk0MDYtNDc4MjM1MmY0NTcwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSectionacee135451af941d2a65",
          },
          {
            id: 2,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Neumáticos - Maxximundo",
            url: "https://app.powerbi.com/view?r=eyJrIjoiZDZlM2EyYjYtNGYyYi00ZDZiLTliZTItMWJkMGMxNDJhYzBjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
        STOX: [
          {
            id: 0,
            tituloBtn: "Cobranzas",
            titulo: "Gestión Coord. Ventas - Stox",
            url: "https://app.powerbi.com/view?r=eyJrIjoiYWVlYWYxZjAtODBkYi00ZDE2LWE2ODUtOTAyNTI5YWQ4YTAxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
          },
          {
            id: 1,
            tituloBtn: "Comercial",
            titulo: "Gestión Coord. Ventas - Stox (Comercial)",
            url: "https://app.powerbi.com/view?r=eyJrIjoiMTgyNTQ2NTAtNjQzOS00ZTI5LWI1Y2ItZjgxOTM1MTVlODM5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSectionacee135451af941d2a65",
          },
          {
            id: 2,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Coordinacion Ventas - Stox",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNGU4NzI0MjYtNWJjMi00NGY3LWE2MDUtYjAzMzk2NWIyZTk2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
        IKONIX: [
          {
            id: 0,
            tituloBtn: "Cobranzas",
            titulo: "Gestión Coord. Ventas - Ikonix",
            url: "https://app.powerbi.com/view?r=eyJrIjoiZmMzNzcwZGQtMWRhNi00MmQ3LWFkNTMtMGQ1ZTcxYjExYjY3IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
          },
          {
            id: 1,
            tituloBtn: "Comercial",
            titulo: "Gestión Coord. Ventas - Ikonix (Comercial)",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNjMwOTdlMTktN2M5YS00YTc3LWFmNmItZWY5ZmRlMGVmNzllIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSectionacee135451af941d2a6",
          },
          {
            id: 2,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Coordinacion Ventas - Ikonix",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNWVjNDM0MmItY2E1NC00ZTRjLWJiYTUtMmFhYWQ1ZTMxOWYxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
      },
      "NEUMATICOS MOTO": {
        MAXXIMUNDO: [
          {
            id: 0,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Neumáticos Moto - Maxximundo",
            url: "https://app.powerbi.com/view?r=eyJrIjoiNDIwYjdmNDUtNWZiNS00NTBiLWI4NTktZWFlNGI3ZGFlZWM5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
      },
      LUBRICANTES: {
        MAXXIMUNDO: [
          {
            id: 0,
            tituloBtn: "Comercial V2",
            titulo: "Comercial V2 Lubricantes - Maxximundo",
            url: "https://app.powerbi.com/view?r=eyJrIjoiZWU3NGE4MmMtNTBiMi00YjBmLWIxMjktYTQ0MTYzM2RlYWZhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
          },
        ],
      },
    }),
    []
  );

  // Inicializar empresa activa cuando se cargan los permisos
  useEffect(() => {
    if (permissionsByModule && Object.keys(permissionsByModule).length > 0) {
      // Obtener todas las empresas únicas de todos los módulos
      const todasEmpresas = new Set();
      Object.values(permissionsByModule).forEach((permisosModulo) => {
        permisosModulo.forEach((permiso) => {
          todasEmpresas.add(permiso.empresa);
        });
      });

      // Seleccionar la primera empresa por defecto
      if (todasEmpresas.size > 0) {
        setEmpresaActiva(Array.from(todasEmpresas)[0]);
      }
    }
  }, [permissionsByModule]);

  // Actualizar reportes disponibles cuando cambia la empresa activa
  useEffect(() => {
    if (!empresaActiva || !permissionsByModule) return;

    // Recopilamos los reportes disponibles para esta empresa
    const reportes = [];

    Object.keys(permissionsByModule).forEach((moduloNombre) => {
      // Verificar si el usuario tiene permiso para esta empresa en este módulo
      const tienePermisoEnModulo = permissionsByModule[moduloNombre].some(
        (permiso) => permiso.empresa === empresaActiva
      );

      if (tienePermisoEnModulo) {
        // Si hay reportes disponibles para este módulo y empresa
        if (
          reportesPorModuloEmpresa[moduloNombre] &&
          reportesPorModuloEmpresa[moduloNombre][empresaActiva]
        ) {
          // Agregar los reportes al array con información del módulo
          const reportesModulo =
            reportesPorModuloEmpresa[moduloNombre][empresaActiva];
          reportesModulo.forEach((reporte) => {
            reportes.push({
              ...reporte,
              modulo: moduloNombre,
              // Crear un ID único combinando el módulo y el ID original
              uniqueId: `${moduloNombre}-${reporte.id}`,
            });
          });
        }
      }
    });

    setReportesDisponibles(reportes);

    // Resetear el gráfico seleccionado con el ID único
    if (reportes.length > 0) {
      setGrafico(reportes[0].uniqueId);
    } else {
      setGrafico(null);
    }
  }, [empresaActiva, permissionsByModule, reportesPorModuloEmpresa]);

  // Componente para mostrar botones de empresas
  const BotonesEmpresas = () => {
    // Obtener todas las empresas únicas de todos los módulos
    const todasEmpresas = new Set();
    Object.values(permissionsByModule).forEach((permisosModulo) => {
      permisosModulo.forEach((permiso) => {
        todasEmpresas.add(permiso.empresa);
      });
    });

    return (
      <CustomContainer
        style={{ gap: "10px", padding: "5px", flexWrap: "wrap" }}
      >
        {Array.from(todasEmpresas).map((empresa) => (
          <CustomButton
            key={empresa}
            text={empresa}
            onClick={() => {
              setEmpresaActiva(empresa);
            }}
            variant={empresaActiva === empresa ? "contained" : "outlined"}
            pcolor={theme.colors.primary}
          />
        ))}
      </CustomContainer>
    );
  };

  // Componente para mostrar botones de reportes
  const BotonesReportes = () => (
    <CustomContainer style={{ gap: "10px", padding: "5px", flexWrap: "wrap" }}>
      {reportesDisponibles.length > 0 ? (
        reportesDisponibles.map(({ uniqueId, tituloBtn, modulo }) => (
          <CustomButton
            key={uniqueId}
            text={`${tituloBtn} ${
              modulo !== "NEUMATICOS" ? `(${modulo})` : ""
            }`}
            onClick={() => setGrafico(uniqueId)}
            variant={grafico === uniqueId ? "contained" : "outlined"}
            pcolor={theme.colors.secondary}
          />
        ))
      ) : (
        <p>No hay reportes disponibles para esta empresa.</p>
      )}
    </CustomContainer>
  );

  // Obtener el reporte activo
  const getReporteActivo = () => {
    if (!grafico) return null;

    // Usamos el ID único para encontrar el reporte correcto
    return reportesDisponibles.find((reporte) => reporte.uniqueId === grafico);
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

  // Verificar si tiene permisos en alguno de los submódulos específicos
  const tienePermisosSubmodulos =
    permissionsByModule && Object.keys(permissionsByModule).length > 0;

  // Mostrar mensaje si no hay permisos en ninguno de los submódulos
  if (!tienePermisosSubmodulos) {
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
          Se requieren permisos en alguno de los submódulos:{" "}
          {subModules.join(", ")}
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
      <BotonesEmpresas />

      {empresaActiva && (
        <>
          <BotonesReportes />
        </>
      )}

      {/* Mostrar el iframe con el reporte seleccionado */}
      {empresaActiva &&
        grafico &&
        (() => {
          const reporteActivo = getReporteActivo();
          if (reporteActivo) {
            return (
              <iframe
                key={reporteActivo.uniqueId}
                title={reporteActivo.titulo}
                width="100%"
                height="100%"
                src={reporteActivo.url}
                allowFullScreen
              />
            );
          }
          return null;
        })()}
    </CustomContainer>
  );
};

// Exportar el componente envuelto con permisos
export const ReportesGestionClientes = withPermissions(
  ReportesGestionClientesComponent
);
