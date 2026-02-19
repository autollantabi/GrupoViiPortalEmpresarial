import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYTE2Mzc4MDMtMGE3ZS00NTFjLTk1ZjAtOGU1NTk5ZDIxODVkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection5ee1a0f34007764061eb",
    titulo: "Reporte de Tecnicentro - Autollanta",
    rol: "usuario",
    linea: null,
    empresa: "AUTOLLANTA",
  },
];

export const ReporteriaTecnicentro = ({
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
