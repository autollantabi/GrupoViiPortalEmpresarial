import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";

export const ReporteriaComercialFlashdeVentas = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  // Estructura de reportes: rol (minúscula) > línea (mayúsculas) > empresa (mayúsculas)
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      coordinadora: {
        LLANTAS: {
          AUTOLLANTA: [
            {
              id: 1,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Coordinador)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYWNiNTQyN2MtYTYzNS00NWIzLThlOGMtNzY5NGM3YTI3NDQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
          MAXXIMUNDO: [
            {
              id: 2,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Coordinador)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYjhkNGMxZGYtZWVlYi00Njk2LWI1MjUtNDc2NmNmMzYxYThjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
          STOX: [
            {
              id: 3,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Coordinador)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNTExNDZlZWItNDFlYy00NWZlLWE0NjItOTBiNWMyN2Q5YzczIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        "LLANTAS MOTO": {
          MAXXIMUNDO: [
            {
              id: 4,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMWYxMzZlNzgtZjFhMC00OTViLTkxODEtODM5NjQ4NjM5NDdjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        LUBRICANTES: {
          MAXXIMUNDO: [
            {
              id: 5,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Coordinador)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        HERRAMIENTAS: {
          IKONIX: [
            {
              id: 6,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Coordinador)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
      },
      jefatura: {
        // Sin línea específica para "TODOS"
        null: {
          GRUPOVII: [
            {
              id: 7,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZjQ5NTZjZDQtMGU3NC00ZmViLTkwMDItYjQ1OWQxMWZmM2E4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        LLANTAS: {
          AUTOLLANTA: [
            {
              id: 8,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYWNiNTQyN2MtYTYzNS00NWIzLThlOGMtNzY5NGM3YTI3NDQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
          MAXXIMUNDO: [
            {
              id: 9,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYjhkNGMxZGYtZWVlYi00Njk2LWI1MjUtNDc2NmNmMzYxYThjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
          STOX: [
            {
              id: 10,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNTExNDZlZWItNDFlYy00NWZlLWE0NjItOTBiNWMyN2Q5YzczIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        "LLANTAS MOTO": {
          MAXXIMUNDO: [
            {
              id: 11,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMWYxMzZlNzgtZjFhMC00OTViLTkxODEtODM5NjQ4NjM5NDdjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        LUBRICANTES: {
          MAXXIMUNDO: [
            {
              id: 12,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        HERRAMIENTAS: {
          IKONIX: [
            {
              id: 13,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
      },
      supervisor: {
        HERRAMIENTAS: {
          IKONIX: [
            {
              id: 14,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Supervisor)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
            },
          ],
        },
        LUBRICANTES: {
          MAXXIMUNDO: [
            {
              id: 15,
              tituloBtn: "Flash de Ventas",
              titulo: "Flash de Ventas - Grupo VII (Supervisor)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
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
