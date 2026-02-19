import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZTY4YjA0NmEtNGRkZS00Y2ViLWEyZDUtYWYwODYzYzJmMWM5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=54e3ae545eaeb75aac3e",
    titulo: "Reporte de Camiones",
    rol: "usuario",
    linea: null,
    empresa: "AUTOLLANTA",
  },
];

export const ReporteriaCamiones = ({
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
