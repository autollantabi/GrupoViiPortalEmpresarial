import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaCamiones = ({ 
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  // Camiones no tiene línea específica
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      usuario: {
        // Sin línea específica para camiones
        null: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Camiones",
              titulo: "Reporte de Camiones",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZTY4YjA0NmEtNGRkZS00Y2ViLWEyZDUtYWYwODYzYzJmMWM5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=54e3ae545eaeb75aac3e",
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
