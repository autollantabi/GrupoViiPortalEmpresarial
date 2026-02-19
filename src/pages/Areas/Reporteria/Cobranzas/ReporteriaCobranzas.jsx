import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  { id: 0, url: "https://app.powerbi.com/view?r=eyJrIjoiNzcyNWFjYzctOWE2MC00ODg1LWI3Y2YtMWRmMTcxMTY0ZGZjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9", titulo: "Reporte de Cobranzas - Autollanta", rol: "coordinadora", linea: null, empresa: "AUTOLLANTA" },
  { id: 1, url: "https://app.powerbi.com/view?r=eyJrIjoiZDlkNGIxMDAtNzBmYy00MDg0LWI1ZjEtM2JmOTFiMTI1ZTdiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9", titulo: "Reporte de Cobranzas - Maxximundo", rol: "coordinadora", linea: null, empresa: "MAXXIMUNDO" },
  { id: 2, url: "https://app.powerbi.com/view?r=eyJrIjoiOTBmMjA3N2UtYzNjNS00MWJiLTlhMmUtM2JlYmNhOTk4ZmIzIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9", titulo: "Reporte de Cobranzas - Stox", rol: "coordinadora", linea: null, empresa: "STOX" },
  { id: 3, url: "https://app.powerbi.com/view?r=eyJrIjoiOGY5OTY1YjctNDVmYi00YmJiLWIyMGYtZWE4NmVlOWZkNzE2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9", titulo: "Reporte de Cobranzas - Ikonix", rol: "coordinadora", linea: null, empresa: "IKONIX" },
];

export const ReporteriaCobranzas = ({
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
