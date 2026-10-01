import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMGZlODkzNzUtNjgyMC00ZGU0LWFiOWMtNmQ5YWQ2YjNlNGVkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte Automax Neumáticos",
    rol: "jefatura",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteAutomaxNeumaticos = ({
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
