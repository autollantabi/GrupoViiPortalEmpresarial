import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

/**
 * Reportes en formato lista: cada item tiene url, rol, linea, empresa, canal (opcional).
 * Facilita agregar nuevos reportes o dimensiones sin tocar la estructura en árbol.
 */
const REPORTES = [
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYWNiNTQyN2MtYTYzNS00NWIzLThlOGMtNzY5NGM3YTI3NDQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
  },
  {
    id: 2,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYjhkNGMxZGYtZWVlYi00Njk2LWI1MjUtNDc2NmNmMzYxYThjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO",
  },
  {
    id: 3,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNTExNDZlZWItNDFlYy00NWZlLWE0NjItOTBiNWMyN2Q5YzczIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "STOX",
  },
  {
    id: 4,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMWYxMzZlNzgtZjFhMC00OTViLTkxODEtODM5NjQ4NjM5NDdjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "coordinadora",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 5,
    rl: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 6,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 7,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZjQ5NTZjZDQtMGU3NC00ZmViLTkwMDItYjQ1OWQxMWZmM2E4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: null,
    empresa: "GRUPOVII"
  },
  {
    id: 8,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYWNiNTQyN2MtYTYzNS00NWIzLThlOGMtNzY5NGM3YTI3NDQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA"
  },
  {
    id: 9,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYjhkNGMxZGYtZWVlYi00Njk2LWI1MjUtNDc2NmNmMzYxYThjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 10,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNTExNDZlZWItNDFlYy00NWZlLWE0NjItOTBiNWMyN2Q5YzczIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "STOX"
  },
  {
    id: 11,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMWYxMzZlNzgtZjFhMC00OTViLTkxODEtODM5NjQ4NjM5NDdjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 12,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 13,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 14,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTdjNWUzOGYtOWJjZi00ZjQ2LWIyN2MtZjhjYWUxMDJhZmRkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 15,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZjBkZDE5OWYtYTRiYy00ZTUwLThiNDMtYWU3YjA0NjBmNzIyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
];

export const ReporteriaComercialFlashdeVentas = ({
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
