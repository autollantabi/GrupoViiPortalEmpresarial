import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/reportEmbed?reportId=d6049e8d-4895-4088-8e6d-b7e5d2ed01dd&autoAuth=true&ctid=2485af5c-a3e1-4a85-910b-79523940a971",
    titulo: "Reporte Consolidado",
    rol: "usuario",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaConsolidado = ({
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
