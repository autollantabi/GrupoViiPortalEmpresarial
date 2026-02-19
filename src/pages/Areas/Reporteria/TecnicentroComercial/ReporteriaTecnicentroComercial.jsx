import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMDY1N2U3MmItMTg3Ny00ZGRjLTkyMTgtMWVhNWIxZjY3ODA4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Tecnicentro Comercial - Autollanta (JEFATURA)",
    rol: "jefatura",
    linea: null,
    empresa: "AUTOLLANTA",
  },
];

export const ReporteriaTecnicentroComercial = ({
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
