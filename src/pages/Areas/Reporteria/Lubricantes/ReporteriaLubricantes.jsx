import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNzdhMWJjODgtMDQzYS00OTQ0LWJjZDItYjEwNmZmOGYwZjg5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=52299b7243303e5b5514",
    titulo: "Reporte Lubricantes - GRUPO VII",
    rol: "jefatura",
    linea: "LUBRICANTES",
    empresa: "GRUPOVII",
    canal: "TODOS",
  },
];

export const ReporteriaLubricantes = ({
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
