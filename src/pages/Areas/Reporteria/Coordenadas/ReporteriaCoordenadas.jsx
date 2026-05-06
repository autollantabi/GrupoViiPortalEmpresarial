import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const MASTER_REPORTS = [
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiNGYxNzUzOGYtMGRkMS00OTQ0LTk3MmYtYmZhZjY5ODZiNTg3IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 1, // AUTOLLANTA
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiZTgwYWFjMzktYWIyZS00NzJiLTg1NmQtNWViM2Q3NTY3NDE2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 4, // IKONIX
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiODI5MmY3NjgtNWFiMi00Nzc2LWE3YjYtZDYzM2YwYjY3ZWJmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 2, // MAXXIMUNDO
    lineaId: 3, // LLANTAS
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiZDM1MTgzMWUtZTdmMi00M2ZiLTgxMDYtMDAyZjI4ZmUzOGIzIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 2, // MAXXIMUNDO
    lineaId: 18, // LLANTAS MOTO
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiMGQwZTU5MmQtYjhlMi00NGJhLWEwN2QtYmRiODcyZjdjNTE1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 2, // MAXXIMUNDO
    lineaId: 4, // LUBRICANTES
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiZjg2YmJiZjUtYzM4ZC00NTM5LWFiNGEtZjNiMzZjYWY4ZjE3IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    empresaId: 3, // STOX
  },
  {
    url: "https://app.powerbi.com/view?r=eyJrIjoiMDVhZWUwMmItNTNmNC00YzUxLWFlNjctNzM5ZGUxMThkZGQxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ba7fd71f44bcc39cda4e",
    empresaId: 6, // GRUPOVII
  },
];

export const ReporteriaCoordenadas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
  availableCanales,
}) => {
  const filteredReports = useMemo(() => {
    const reports = [];

    // Convertir IDs a números para comparación segura
    const companyIds = new Set(availableCompanies.map((c) => Number(c.id)));
    const lineIds = new Set(availableLines.map((l) => Number(l.id)));
    const currentRol = routeConfig?.rolDelRecurso || "";

    MASTER_REPORTS.forEach((report, index) => {
      const hasCompany = companyIds.has(report.empresaId);

      if (hasCompany) {
        const empresa = availableCompanies.find(
          (c) => Number(c.id) === report.empresaId
        );
        const empresaNombre = empresa?.nombre || "";

        if (report.lineaId) {
          // Reportes que dependen de una línea (como MAXXIMUNDO)
          if (lineIds.has(report.lineaId)) {
            const linea = availableLines.find(
              (l) => Number(l.id) === report.lineaId
            );
            const lineaNombre = linea?.nombre || "";

            reports.push({
              id: index + 1,
              url: report.url,
              titulo: `Coordenadas - ${empresaNombre} ${lineaNombre}`,
              empresa: empresaNombre,
              linea: lineaNombre,
              rol: currentRol,
            });
          }
        } else {
          // Reportes que solo dependen de la empresa
          reports.push({
            id: index + 1,
            url: report.url,
            titulo: `Coordenadas - ${empresaNombre}`,
            empresa: empresaNombre,
            linea: null,
            rol: currentRol,
          });
        }
      }
    });

    return reports;
  }, [availableCompanies, availableLines, routeConfig]);

  return (
    <TemplateReporteria
      reportes={filteredReports}
      routeConfig={routeConfig}
      availableCompanies={availableCompanies}
      availableLines={availableLines}
      availableCanales={availableCanales}
    />
  );
};
