import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYzk1NzMzNTQtNTlkMi00YzIzLThmMDYtMWM1YjdjOGRhNGI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte Pareto STOX",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "STOX"
  },
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNWVlYTM0ZWYtNzFhYy00MDRiLWExZGItN2RkZDEyMmE4NTYwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Reporte Pareto Maxximundo",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
];

export const ReportePareto = ({
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
