import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNzIyYWY0MWUtZjRhMy00ZTlmLWI2ZjktZGIwMDhmODYxY2I5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=55bbc48a8c2024893d31",
    titulo: "Talento Humano",
    rol: "usuario",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaTalentoHumano = ({
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
