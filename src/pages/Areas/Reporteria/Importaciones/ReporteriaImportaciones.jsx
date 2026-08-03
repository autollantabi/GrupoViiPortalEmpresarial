import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMzczMmNlNDktMjU4Ni00MGUwLWFiYWUtMDEyM2I0MWRlOTE2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Importaciones - GrupoVii (JEFATURA)",
    rol: "jefatura",
    linea: null,
    empresa: "GRUPOVII",
  },
];

export const ReporteriaImportaciones = ({
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
