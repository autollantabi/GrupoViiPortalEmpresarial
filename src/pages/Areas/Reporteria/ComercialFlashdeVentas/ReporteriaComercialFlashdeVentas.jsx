import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

/**
 * Reportes en formato lista: cada item tiene url, rol, linea, empresa, canal (opcional).
 * Facilita agregar nuevos reportes o dimensiones sin tocar la estructura en árbol.
 */
const REPORTES = [
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZmFmYTVmYTMtN2Y5Zi00MWMzLWEzNTYtNjI0YzBlOGVlMDhhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2C",
  },
  {
    id: 2,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMjc4YTNjMTMtNjYxYS00OTA3LWE4MjMtOGUzZWFkMmRlMDIxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO",
  },
  {
    id: 3,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODRhYTk4ZTMtODEyZS00NTI4LWE5NjktZDc0MTdkY2RmMTUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "STOX",
  },
  {
    id: 4,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYmFhYmJmN2UtNDdiYS00YjFiLTk5YTQtMzAzNzIzNDkzZTFkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "coordinadora",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 5,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTJmNzA3YTQtNzU5NC00YmRmLThhMjEtMTJmY2YyOTJkMWI4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 6,
    url: "https://app.powerbi.com/view?r=eyJrIjoiN2Y5ODMxNzYtODRhMS00NmI5LWIwZGMtYmQzYTNkZDAwMjYwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
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
    url: "https://app.powerbi.com/view?r=eyJrIjoiMTA4ZTBiY2EtNTljYi00MmVmLTgwYWEtYzQ1NzAyNmE5ZDljIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2C",
  },
  {
    id: 9,
    url: "https://app.powerbi.com/view?r=eyJrIjoiN2Y5ZGNkNWUtZmZiMC00NzY3LWFjNDMtODEzYjJjZWQyNzJiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 10,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNDMzOTNjZjgtYzJiYi00MmE2LTgyMDMtNzM0ZTkwOGJjM2E1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "STOX"
  },
  {
    id: 11,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZjY0OGMzNTEtZDhhMy00ZDY2LTkzODItN2Y1YmFiOGI5YmM0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 12,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMjNiZDZjZWItMTc2My00YjU0LTljMzMtNzMzMmFhYzMwMzBiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 13,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODQ1OTJkNzEtMzgxNC00MmNjLWI5NDgtNmUyZjM2OTljMzdmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 14,
    url: "https://app.powerbi.com/view?r=eyJrIjoiN2Y5ODMxNzYtODRhMS00NmI5LWIwZGMtYmQzYTNkZDAwMjYwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 15,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNzBlMjdjZDQtOTE0Yi00ZWNkLThmODQtM2ZkNzkyYzZmNTBmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 16,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMTBjOTAzNWEtZDVjNy00OGYzLWIxMGEtNjZmYjg3MzMwNWNiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2C",
  },
  {
    id: 17,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNGRjMzg2ZTQtMzEwMS00Mzg4LTg4MWEtMzUzNzczMTIzYTkzIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 18,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMmY3NGZiNmMtMTIzZS00M2U5LWE0MzgtYjhiODEzNjJlMTA4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 19,
    url: "https://app.powerbi.com/view?r=eyJrIjoiY2E1MTYxNDgtMjVmMC00NDJhLWEyMjMtNWYxYWVkNTI1NWRmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LLANTAS",
    empresa: "STOX",
  },
  {
    id: 20,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODZjMjE0MTctODc2OS00YjlhLThmMzUtOTk5OTViOGYyMmUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=34a5bb2683f353bf8077",
    titulo: "Flash de Ventas - Grupo VII (Coordinador)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "AUTOMAX",
  },
  {
    id: 21,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODZjMjE0MTctODc2OS00YjlhLThmMzUtOTk5OTViOGYyMmUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=34a5bb2683f353bf8077",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOMAX",
  },
  {
    id: 22,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODZjMjE0MTctODc2OS00YjlhLThmMzUtOTk5OTViOGYyMmUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=34a5bb2683f353bf8077",
    titulo: "Flash de Ventas - Grupo VII (Supervisor)",
    rol: "supervisor",
    linea: "LLANTAS",
    empresa: "AUTOMAX",
  },
  {
    id: 23,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTc0MTA1ZGEtNDQ4ZC00NGUzLTgyM2MtZTAzODJhZmMzYmI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Coordinador - B2B)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2B",
  },
  {
    id: 24,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTc0MTA1ZGEtNDQ4ZC00NGUzLTgyM2MtZTAzODJhZmMzYmI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (JEFATURA - B2B)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2B",
  },
  {
    id: 25,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOTc0MTA1ZGEtNDQ4ZC00NGUzLTgyM2MtZTAzODJhZmMzYmI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=5582e3f268a223001c30",
    titulo: "Flash de Ventas - Grupo VII (Supervisor - B2B)",
    rol: "supervisor",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA",
    canal: "B2B",
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
