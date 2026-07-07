import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
    {
        id: 0,
        url: "https://app.powerbi.com/view?r=eyJrIjoiYzMwYjZmMjQtNThiMS00NjdhLThjZDktMDAwMjIwZWI4MzM0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection5ee1a0f34007764061eb",
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
