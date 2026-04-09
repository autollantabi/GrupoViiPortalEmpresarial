import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiY2RlMjQwOGQtYzc1MS00NjQ5LTk4YTEtOWJkNzYyMzI3OWRhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=56aa5d7dee800782e3c0",
    titulo: "Casos Cartera",
    rol: "usuario",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaCartera = ({
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
