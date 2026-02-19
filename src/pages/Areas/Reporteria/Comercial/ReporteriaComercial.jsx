import React from "react";
import { TemplateReporteria } from "../TemplateReporteria";

const REPORTES = [
  {
    id: 0,
    url: "https://app.powerbi.com/view?r=eyJrIjoiOGFlNWRhMDEtNjZiNy00OTBkLTgzY2QtYWJjNjNhMTEwYTVhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Coordinacion Ventas Autollanta",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA"
  },
  {
    id: 1,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYzI1YzNhY2UtNmZiMy00OWIwLWE0ZTQtY2ZhZGMyODU5N2M0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos - Maxximundo (COORDINADORA)",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 2,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMDc0MzczYmYtYzA1Yy00NWM1LWJiYzctY2Y4OTk5MzllNjQwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Coordinacion Ventas - Stox",
    rol: "coordinadora",
    linea: "LLANTAS",
    empresa: "STOX"
  },
  {
    id: 3,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMmQ3MDM0MWEtY2NlNy00MGFlLWExY2MtNDNkNWQzZmVhNGZmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos Moto - Maxximundo",
    rol: "coordinadora",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 4,
    url: "https://app.powerbi.com/view?r=eyJrIjoiM2Q2NjRhMmYtY2IyYy00NWI2LWFhMzQtZTEyNDJlNGQwMmEyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Lubricantes - Maxximundo",
    rol: "coordinadora",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 5,
    url: "https://app.powerbi.com/view?r=eyJrIjoiYTU4MzU3NjQtM2VmYS00NDNlLWFhNGYtYTVkYjFhMDk0MWE5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Herramientas - Ikonix",
    rol: "coordinadora",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 6,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZThiYzFjMjMtYzUzNC00MzI3LWIxMzYtNDQ5Y2FlYzAxNTY4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Herramientas - Ikonix",
    rol: "supervisor",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 7,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMTQyMjJkYjYtNGVmOS00ZjVkLTg5YmMtY2IyNDk3NzliZmQ0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial Lubricantes - Maxximundo",
    rol: "supervisor",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 8,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMGMzMTYwMWYtMDljMy00MjQyLWFmNTctM2Q0MzEwZjY1OWI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos - Autollanta (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOLLANTA"
  },
  {
    id: 9,
    url: "https://app.powerbi.com/view?r=eyJrIjoiZmJhMjY4ZWMtMjNlZi00NTM4LWE1MDAtY2QyZjUzNWI4MjUxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos - Maxximundo (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 10,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNDVmOTdlZjUtODJhZC00NDUxLWIxOWUtNDVjYzU3ZDMxMTU0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos - Stox (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "STOX"
  },
  {
    id: 11,
    url: "https://app.powerbi.com/view?r=eyJrIjoiODZjMjE0MTctODc2OS00YjlhLThmMzUtOTk5OTViOGYyMmUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=dd58a1f1a4fe654f1300",
    titulo: "Comercial V2 Neumáticos - Automax (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS",
    empresa: "AUTOMAX"
  },
  {
    id: 12,
    url: "https://app.powerbi.com/view?r=eyJrIjoiNGEyOWRmZjQtN2NiYy00YTU4LTljNGItZGRlMzdjNWY5MzhiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Herramientas - Ikonix (JEFATURA)",
    rol: "jefatura",
    linea: "HERRAMIENTAS",
    empresa: "IKONIX"
  },
  {
    id: 13,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMjkzMWYxNzItMmRlNi00ZjhkLTlmYjAtNDIyOThmNzAxMjkyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Neumáticos - Maxximundo (JEFATURA)",
    rol: "jefatura",
    linea: "LLANTAS MOTO",
    empresa: "MAXXIMUNDO"
  },
  {
    id: 14,
    url: "https://app.powerbi.com/view?r=eyJrIjoiMTBkN2ZkOWUtYTllMi00OTYyLTk5ZGEtMDk1MGZlYmEwZGQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    titulo: "Comercial V2 Lubricantes - Maxximundo (JEFATURA)",
    rol: "jefatura",
    linea: "LUBRICANTES",
    empresa: "MAXXIMUNDO"
  },
];

export const ReporteriaComercial = ({
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
