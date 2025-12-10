import React, { useMemo } from "react";
import { TemplateReporteria } from "../../TemplateReporteria";
import { withPermissions } from "../../../../../hoc/withPermissions";

const ReporteriaGarantiasHerramientasComponent = ({
  routeConfig,
  permissionsLoading,
}) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      USUARIO: {
        REP_GAR_HERRAMIENTAS: {
          IKONIX: [
            {
              id: 0,
              tituloBtn: "Reporte Garantias Herramientas 1",
              titulo: "Reporte de Garantias Herramientas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMzExYjA1OTMtM2ZmYS00MjU1LWE4ZTEtNDExN2FiNDhkNDFiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=223706378e9e40d970c8",
            },
          ],
        },
      },
    }),
    []
  );

  return (
    <TemplateReporteria
      reportesPorTipoModuloEmpresa={reportesPorTipoModuloEmpresa}
      routeConfig={routeConfig}
      permissionsLoading={permissionsLoading}
    />
  );
};

// Exportar el componente envuelto con permisos
export const ReporteriaGarantiasHerramientas = withPermissions(
  ReporteriaGarantiasHerramientasComponent
);
