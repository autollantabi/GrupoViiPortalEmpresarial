import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaCobranzas = ({ 
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  // Cobranzas no tiene línea específica, así que usamos null o una clave especial
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      coordinadora: {
        // Sin línea específica para cobranzas
        null: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Reporte Cobranzas 1",
              titulo: "Reporte de Cobranzas - Autollanta",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNzcyNWFjYzctOWE2MC00ODg1LWI3Y2YtMWRmMTcxMTY0ZGZjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
            },
          ],
          MAXXIMUNDO: [
            {
              id: 1,
              tituloBtn: "Reporte Cobranzas 2",
              titulo: "Reporte de Cobranzas - Maxximundo",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZDlkNGIxMDAtNzBmYy00MDg0LWI1ZjEtM2JmOTFiMTI1ZTdiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
            },
          ],
          STOX: [
            {
              id: 2,
              tituloBtn: "Reporte Cobranzas 3",
              titulo: "Reporte de Cobranzas - Stox",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOTBmMjA3N2UtYzNjNS00MWJiLTlhMmUtM2JlYmNhOTk4ZmIzIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
            },
          ],
          IKONIX: [
            {
              id: 3,
              tituloBtn: "Reporte Cobranzas 4",
              titulo: "Reporte de Cobranzas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOGY5OTY1YjctNDVmYi00YmJiLWIyMGYtZWE4NmVlOWZkNzE2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
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
