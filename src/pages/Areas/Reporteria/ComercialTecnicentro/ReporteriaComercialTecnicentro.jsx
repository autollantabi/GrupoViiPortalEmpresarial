import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
    {
        id: 0,
        url: "https://app.powerbi.com/view?r=eyJrIjoiZDQyN2E5NmMtMjhlMS00YjMxLWJkNjItY2Q4MTgyOTRjYTdmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
        titulo: "Reporte Comecial Tenicentro",
        rol: "usuario",
        linea: null,
        empresa: "AUTOLLANTA",
    },
];

export const ReporteriaComecialTecnicentro = ({
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
