import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const ReporteriaCamionesComponent = ({ routeConfig, permissionsLoading }) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      USUARIO: {
        REP_CAMIONES: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Camiones",
              titulo: "Reporte de Camiones",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZTY4YjA0NmEtNGRkZS00Y2ViLWEyZDUtYWYwODYzYzJmMWM5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=54e3ae545eaeb75aac3e",
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
export const ReporteriaCamiones = withPermissions(ReporteriaCamionesComponent);
