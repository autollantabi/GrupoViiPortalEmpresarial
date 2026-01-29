import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaImportaciones = ({ 
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      jefatura: {
        null: {
          GRUPOVII: [
            {
              id: 1,
              titulo: "Importaciones - GrupoVii (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNGRmZDg1MzMtZTczOC00MmVmLTlmNzUtNTQ4MTg1OTc0YWZjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
            },
          ],
        },
      },
    }),
    []
  );

  return (
    <TemplateReporteria
      reportesPorTipoModuloEmpresa={reportesPorTipoModuloEmpresa}
      routeConfig={routeConfig}
      availableCompanies={availableCompanies}
      availableLines={availableLines}
    />
  );
};
