import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaCoordenadas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  // Coordenadas no tiene línea específica
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      jefatura: {
        // Sin línea específica para coordenadas
        null: {
          GRUPOVII: [
            {
              id: 1,
              tituloBtn: "Coordenadas",
              titulo: "Coordenadas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMDVhZWUwMmItNTNmNC00YzUxLWFlNjctNzM5ZGUxMThkZGQxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
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
