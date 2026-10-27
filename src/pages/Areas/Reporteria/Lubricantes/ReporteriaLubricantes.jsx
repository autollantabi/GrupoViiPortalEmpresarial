import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNTk3NDQwODUtMTJjOC00OGM5LWEzYzEtOWVkYTczZWU3NjhhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte Lubricantes - GRUPO VII",
    rol: "jefatura",
    linea: "LUBRICANTES",
    empresa: "GRUPOVII",
    canal: "TODOS",
  },
];

export const ReporteriaLubricantes = ({
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
