import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const ReporteriaCobranzasComponent = ({ routeConfig, permissionsLoading }) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      COORDINADORA: {
        REP_COBRANZAS: {
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
      permissionsLoading={permissionsLoading}
    />
  );
};

// Exportar el componente envuelto con permisos
export const ReporteriaCobranzas = withPermissions(
  ReporteriaCobranzasComponent
);
