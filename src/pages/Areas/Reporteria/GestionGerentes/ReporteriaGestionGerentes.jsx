import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaGestionGerentes = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  // Gestión Gerentes no tiene línea específica
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      jefatura: {
        // Sin línea específica para gestión gerentes
        null: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Gestion Gerentes 1",
              titulo: "Reporte de Gestion Gerentes - Autollanta",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZDA5YmFlM2QtOTA1ZC00NzEwLWI3OTgtZmUxNzBhY2FhNGE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4ec67f44af29730e03e6 ",
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
