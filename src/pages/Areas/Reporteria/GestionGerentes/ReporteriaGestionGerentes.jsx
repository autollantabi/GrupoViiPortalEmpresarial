import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZDA5YmFlM2QtOTA1ZC00NzEwLWI3OTgtZmUxNzBhY2FhNGE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4ec67f44af29730e03e6 ",
    titulo: "Reporte de Gestion Gerentes - Autollanta",
    rol: "jefatura",
    linea: null,
    empresa: "AUTOLLANTA",
  },
];

export const ReporteriaGestionGerentes = ({
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
