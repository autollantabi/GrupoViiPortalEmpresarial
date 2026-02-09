import React, { useMemo } from "react";
import { TemplateReporteria } from "../../TemplateReporteria";

export const ReporteriaGarantiasHerramientas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      jefatura: {
        HERRAMIENTAS: {
          IKONIX: [
            {
              id: 0,
              tituloBtn: "Reporte Garantias Herramientas 1",
              titulo: "Reporte de Garantias Herramientas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZmYyODE0YTgtNjVmNC00NzlkLWIzYmEtNThhN2NlNDdiYjJmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=0e0ebcdc611fe7079915",
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
