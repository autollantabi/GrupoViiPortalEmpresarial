import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMzczMmNlNDktMjU4Ni00MGUwLWFiYWUtMDEyM2I0MWRlOTE2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4db73340167da195bd92",
    titulo: "Importaciones Cobus",
    rol: "usuario",
    linea: null,
    empresa: "GRUPOVII"
  },
];

export const ReporteImportacionesCobus = ({
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
