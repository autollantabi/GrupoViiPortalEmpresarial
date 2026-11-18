import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOWQwNTUxY2UtZmM3OS00YjViLWIxZmQtZWU4YjFjZGI4NTlhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte de Análisis de Cartera",
    rol: "usuario",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaAnalisisCartera = ({
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
