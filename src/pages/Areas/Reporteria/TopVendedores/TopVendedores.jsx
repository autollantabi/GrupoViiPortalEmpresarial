import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiY2E3YTZjODUtYzJiNC00ZTRlLWI3NGMtNzZjM2M0MmY5MjE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Top Vendedores",
    rol: "usuario",
    linea: null,
    empresa: "MAXXIMUNDO"
  },
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNTA4ZWJjMTEtMDcwMy00NjE1LTgwNGQtYmZhMzBmYjQxY2YxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Top Vendedores",
    rol: "usuario",
    linea: null,
    empresa: "AUTOLLANTA"
  },
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNDgzYjFkYTMtODkxNS00ODU3LWI4OTktZTQxN2M4YTgxODU2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Top Vendedores",
    rol: "usuario",
    linea: null,
    empresa: "STOX"
  },
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNmEyZDAxODgtMGFlMS00NjBmLWI4NzEtOTNmODBjOGE2YTQyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Top Vendedores",
    rol: "usuario",
    linea: null,
    empresa: "IKONIX"
  },
];

export const ReporteTopVendedores = ({
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
