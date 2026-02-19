import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMDVhZWUwMmItNTNmNC00YzUxLWFlNjctNzM5ZGUxMThkZGQxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    titulo: "Coordenadas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaCoordenadas = ({
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
