import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { withPermissions } from "../../../../hoc/withPermissions";

const modulosMap = {
  REP_COM_NEUMATICOS: "NEUMATICOS",
  REP_COM_MOTOS: "NEUMATICOS MOTO",
  REP_COM_LUBRICANTES: "LUBRICANTES",
  REP_COM_HERRAMIENTAS: "HERRAMIENTAS",
};

const ReporteriaComercialComponent = ({ routeConfig, permissionsLoading }) => {
  // Organizamos los reportes por tipo de usuario > módulo > empresa
  const reportesPorTipoModuloEmpresa = useMemo(
    () => ({
      COORDINADORA: {
        REP_COM_NEUMATICOS: {
          AUTOLLANTA: [
            {
              id: 0,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Coordinacion Ventas Autollanta",
              url: "https://app.powerbi.com/view?r=eyJrIjoiOGFlNWRhMDEtNjZiNy00OTBkLTgzY2QtYWJjNjNhMTEwYTVhIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
          MAXXIMUNDO: [
            {
              id: 1,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Maxximundo (COORDINADORA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYzI1YzNhY2UtNmZiMy00OWIwLWE0ZTQtY2ZhZGMyODU5N2M0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
          STOX: [
            {
              id: 2,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Coordinacion Ventas - Stox",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMDc0MzczYmYtYzA1Yy00NWM1LWJiYzctY2Y4OTk5MzllNjQwIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
        REP_COM_MOTOS: {
          MAXXIMUNDO: [
            {
              id: 3,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos Moto - Maxximundo",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMmQ3MDM0MWEtY2NlNy00MGFlLWExY2MtNDNkNWQzZmVhNGZmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
        REP_COM_LUBRICANTES: {
          MAXXIMUNDO: [
            {
              id: 4,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Lubricantes - Maxximundo",
              url: "https://app.powerbi.com/view?r=eyJrIjoiM2Q2NjRhMmYtY2IyYy00NWI2LWFhMzQtZTEyNDJlNGQwMmEyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
        REP_COM_HERRAMIENTAS: {
          IKONIX: [
            {
              id: 5,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Herramientas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiYTU4MzU3NjQtM2VmYS00NDNlLWFhNGYtYTVkYjFhMDk0MWE5IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
      },
      SUPERVISOR: {
        REP_COM_HERRAMIENTAS: {
          IKONIX: [
            {
              id: 6,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Herramientas - Ikonix",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZThiYzFjMjMtYzUzNC00MzI3LWIxMzYtNDQ5Y2FlYzAxNTY4IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
      },
      JEFATURA: {
        REP_COM_NEUMATICOS: {
          AUTOLLANTA: [
            {
              id: 7,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Autollanta (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMGMzMTYwMWYtMDljMy00MjQyLWFmNTctM2Q0MzEwZjY1OWI1IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
          MAXXIMUNDO: [
            {
              id: 8,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Maxximundo (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiZmJhMjY4ZWMtMjNlZi00NTM4LWE1MDAtY2QyZjUzNWI4MjUxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
          STOX: [
            {
              id: 9,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Stox (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNDVmOTdlZjUtODJhZC00NDUxLWIxOWUtNDVjYzU3ZDMxMTU0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
          AUTOMAX: [
            {
              id: 13,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Automax (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiODZjMjE0MTctODc2OS00YjlhLThmMzUtOTk5OTViOGYyMmUyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=dd58a1f1a4fe654f1300",
            },
          ],
        },
        REP_COM_HERRAMIENTAS: {
          IKONIX: [
            {
              id: 10,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Herramientas - Ikonix (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiNGEyOWRmZjQtN2NiYy00YTU4LTljNGItZGRlMzdjNWY5MzhiIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
        REP_COM_MOTOS: {
          MAXXIMUNDO: [
            {
              id: 11,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Neumáticos - Maxximundo (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMjkzMWYxNzItMmRlNi00ZjhkLTlmYjAtNDIyOThmNzAxMjkyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
            },
          ],
        },
        REP_COM_LUBRICANTES: {
          MAXXIMUNDO: [
            {
              id: 12,
              tituloBtn: "Comercial V2",
              titulo: "Comercial V2 Lubricantes - Maxximundo (JEFATURA)",
              url: "https://app.powerbi.com/view?r=eyJrIjoiMTBkN2ZkOWUtYTllMi00OTYyLTk5ZGEtMDk1MGZlYmEwZGQ2IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
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
export const ReporteriaComercial = withPermissions(
  ReporteriaComercialComponent
);
