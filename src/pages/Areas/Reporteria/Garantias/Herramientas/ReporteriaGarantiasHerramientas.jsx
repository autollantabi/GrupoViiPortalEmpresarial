import React from "react";
import { TemplateReporteria } from "../../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZmYyODE0YTgtNjVmNC00NzlkLWIzYmEtNThhN2NlNDdiYjJmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=0e0ebcdc611fe7079915",
    titulo: "Reporte de Garantias Herramientas - Ikonix",
    rol: "jefatura",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX",
  },
];

export const ReporteriaGarantiasHerramientas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
  availableCanales,
}) => {
  return (
    <TemplateReporteria
      reportes={REPORTES}
      routeConfig={routeConfig}
      availableCompanies={availableCompanies}
      availableLines={availableLines}
      availableCanales={availableCanales}
    />
  );
};
