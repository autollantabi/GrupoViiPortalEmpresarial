import React, { useEffect, useState } from "react";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";
import { withPermissions } from "../../../hoc/withPermissions";

const ReportesCYMCComponent = ({ empresasAcceso, permissionsLoading }) => {
  const { theme } = useTheme();

  // Estados
  const [empresaActiva, setEmpresaActiva] = useState(null);
  const [grafico, setGrafico] = useState(0);
  const [reportesDisponibles, setReportesDisponibles] = useState([]);

  // Organizamos los reportes por empresa
  const reportesPorEmpresa = {
    AUTOLLANTA: [
      {
        id: 0,
        tituloBtn: "Neumáticos",
        titulo: "Report Section - Neumáticos",
        url: "https://app.powerbi.com/view?r=eyJrIjoiNmI2YjMxM2EtOTJmYS00NTkxLWFmMmMtMDVmNDg4M2Y5N2MxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
    ],
    MAXXIMUNDO: [
      {
        id: 0,
        tituloBtn: "Neumáticos",
        titulo: "Report Section - Neumáticos",
        url: "https://app.powerbi.com/view?r=eyJrIjoiNGU4MDUzODQtNjU3OC00YzE5LTg5OWEtMjBkNDhkM2RlNjAxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
      {
        id: 1,
        tituloBtn: "Motos",
        titulo: "Report Section - Motos",
        url: "https://app.powerbi.com/view?r=eyJrIjoiYTZlYjkzNzEtYTAyZi00NmI4LTg3YzctZWY5ZjZjNmRiNjI0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
      {
        id: 2,
        tituloBtn: "Lubricantes",
        titulo: "Report Section - Lubricantes",
        url: "https://app.powerbi.com/view?r=eyJrIjoiNzUwNWYwZWQtYmI5ZC00MWRjLWIxZTEtN2M1YWViMDkwYjg2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
    ],
    IKONIX: [
      {
        id: 0,
        tituloBtn: "Herramientas",
        titulo: "Report Section - Herramientas",
        url: "https://app.powerbi.com/view?r=eyJrIjoiYjFjZTRjMDktNjVhMi00NWU2LTkxODgtZTFlNjQzYjY1YzE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
    ],
    STOX: [
      {
        id: 0,
        tituloBtn: "Neumáticos",
        titulo: "Report Section - Neumáticos",
        url: "https://app.powerbi.com/view?r=eyJrIjoiNDNiNDE0YTYtZGRmMS00ZjFkLWE5NTYtYjEyMDUzM2VjN2YzIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
      },
    ],
  };

  // Inicializar datos al cargar el componente
  useEffect(() => {
    if (permissionsLoading || !empresasAcceso || empresasAcceso.length === 0)
      return;

    // Filtrar solo empresas que tienen reportes disponibles
    const empresasConReportes = empresasAcceso.filter(
      ({ empresa }) =>
        reportesPorEmpresa[empresa] && reportesPorEmpresa[empresa].length > 0
    );

    // Seleccionar la primera empresa con reportes por defecto
    if (empresasConReportes.length > 0) {
      setEmpresaActiva(empresasConReportes[0].empresa);
    }
  }, [empresasAcceso, permissionsLoading]);

  // Actualizar reportes disponibles cuando cambia la empresa activa
  useEffect(() => {
    if (!empresaActiva || permissionsLoading || !empresasAcceso) return;

    // Verificar si el usuario tiene permiso para esta empresa
    const tienePermisoEmpresa = empresasAcceso.some(
      (empresa) => empresa.empresa === empresaActiva
    );

    // Si tiene permiso y hay reportes disponibles para esta empresa
    if (tienePermisoEmpresa && reportesPorEmpresa[empresaActiva]) {
      const reportesEmpresa = reportesPorEmpresa[empresaActiva];
      const reportes = reportesEmpresa.map((reporte) => ({
        ...reporte,
        // Crear un ID único usando el ID de la empresa y el ID del reporte
        uniqueId: `${empresaActiva}-${reporte.id}`,
      }));

      setReportesDisponibles(reportes);

      // Resetear el gráfico seleccionado con el ID único
      if (reportes.length > 0) {
        setGrafico(reportes[0].uniqueId);
      } else {
        setGrafico(null);
      }
    } else {
      setReportesDisponibles([]);
      setGrafico(null);
    }
  }, [empresaActiva, empresasAcceso, permissionsLoading]);

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <CustomContainer style={{ padding: "20px", textAlign: "center" }}>
        <div>Cargando permisos...</div>
      </CustomContainer>
    );
  }

  // Si no hay empresas con acceso, mostrar mensaje
  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <CustomContainer style={{ padding: "20px", textAlign: "center" }}>
        <div>No tienes permisos para acceder a los reportes de CYMC.</div>
      </CustomContainer>
    );
  }

  // Componente para mostrar botones de empresas (solo las que tienen reportes)
  const BotonesEmpresas = () => {
    // Filtrar solo empresas que tienen reportes disponibles
    const empresasConReportes = empresasAcceso.filter(
      ({ empresa }) =>
        reportesPorEmpresa[empresa] && reportesPorEmpresa[empresa].length > 0
    );

    return (
      <CustomContainer
        style={{ gap: "10px", padding: "5px", flexWrap: "wrap" }}
      >
        {empresasConReportes.map(({ empresa }, index) => (
          <CustomButton
            key={`${empresa}-${index}`}
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
        reportesDisponibles.map(({ uniqueId, tituloBtn }) => (
          <CustomButton
            key={uniqueId}
            text={tituloBtn}
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

  // Verificar si hay empresas con reportes disponibles
  const empresasConReportes =
    empresasAcceso?.filter(
      ({ empresa }) =>
        reportesPorEmpresa[empresa] && reportesPorEmpresa[empresa].length > 0
    ) || [];

  return (
    <CustomContainer
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: 0 }}
    >
      {empresasConReportes.length > 0 ? (
        <>
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
        </>
      ) : (
        <p>
          No hay reportes disponibles para las empresas a las que tienes acceso.
        </p>
      )}
    </CustomContainer>
  );
};

// Exportar el componente envuelto con permisos automáticos
export const ReportesCYMC = withPermissions(ReportesCYMCComponent);
