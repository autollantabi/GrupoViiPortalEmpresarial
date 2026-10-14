import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMGI2MDQ0MDYtYzFlZC00ZWJmLWJlYWYtZGQ4NzZkOWNjYTAwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte Ikonix Unidades Vencidas",
    rol: "usuario",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX",
  },
];

export const ReporteIkonixUnidadesVendidas = ({
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
