import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaTecnicentro = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  // Tecnicentro no tiene línea específica
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      usuario: {
        // Sin línea específica para tecnicentro
        null: {
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
      availableCompanies={availableCompanies}
      availableLines={availableLines}
    />
  );
};
