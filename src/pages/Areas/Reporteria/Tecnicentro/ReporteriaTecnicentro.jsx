import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const ReporteriaTecnicentroComponent = ({
  routeConfig,
  permissionsLoading,
}) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      USUARIO: {
        REP_TECNICENTRO: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Tecnicentro 1",
              titulo: "Reporte de Tecnicentro - Autollanta",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYTE2Mzc4MDMtMGE3ZS00NTFjLTk1ZjAtOGU1NTk5ZDIxODVkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection5ee1a0f34007764061eb",
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
export const ReporteriaTecnicentro = withPermissions(
  ReporteriaTecnicentroComponent
);
