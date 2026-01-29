import React, { useMemo } from "react";
import { TemplateReporteria } from "../../TemplateReporteria";

export const ReporteriaGarantiasHerramientas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      usuario: {
        HERRAMIENTAS: {
          IKONIX: [
            {
              id: 0,
              tituloBtn: "Reporte Garantias Herramientas 1",
              titulo: "Reporte de Garantias Herramientas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMzExYjA1OTMtM2ZmYS00MjU1LWE4ZTEtNDExN2FiNDhkNDFiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=223706378e9e40d970c8",
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
