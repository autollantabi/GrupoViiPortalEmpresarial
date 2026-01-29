import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaTecnicentroComercial = ({ 
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      jefatura: {
        null: {
          AUTOLLANTA: [
            {
              id: 1,
              titulo: "Tecnicentro Comercial - Autollanta (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMDY1N2U3MmItMTg3Ny00ZGRjLTkyMTgtMWVhNWIxZjY3ODA4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
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
