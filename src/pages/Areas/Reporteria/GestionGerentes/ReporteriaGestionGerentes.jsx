import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const ReporteriaGestionGerentesComponent = ({
  routeConfig,
  permissionsLoading,
}) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      JEFATURA: {
        REP_GESTIONGERENTES: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Gestion Gerentes 1",
              titulo: "Reporte de Gestion Gerentes - Autollanta",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZDA5YmFlM2QtOTA1ZC00NzEwLWI3OTgtZmUxNzBhY2FhNGE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4ec67f44af29730e03e6 ",
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
export const ReporteriaGestionGerentes = withPermissions(
  ReporteriaGestionGerentesComponent
);
