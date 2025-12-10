import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const modulosMap = {
  REP_FLV_NEUMATICOS: "NEUMATICOS",
  REP_FLV_MOTOS: "NEUMATICOS MOTO",
  REP_FLV_LUBRICANTES: "LUBRICANTES",
  REP_FLV_HERRAMIENTAS: "HERRAMIENTAS",
  REP_FLV_TODOS: "TODAS",
};

const ReporteriaComercialFlashdeVentasComponent = ({
  routeConfig,
  permissionsLoading,
}) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      JEFATURA: {
        REP_FLV_TODOS: {
          GRUPOVII: [
            {
              id: 1,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZjQ5NTZjZDQtMGU3NC00ZmViLTkwMDItYjQ1OWQxMWZmM2E4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
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
      modulosMap={modulosMap}
      routeConfig={routeConfig}
      permissionsLoading={permissionsLoading}
    />
  );
};

// Exportar el componente envuelto con permisos
export const ReporteriaComercialFlashdeVentas = withPermissions(
  ReporteriaComercialFlashdeVentasComponent
);
