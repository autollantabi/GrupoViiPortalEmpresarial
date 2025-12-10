/**
 * @typedef {Object} RouteGroup
 * @property {string} path - Ruta base
 * @property {string} [subroute] - Subrutas disponibles
 */

import { MODULES_TREE } from "./constantsModulePermissions";

/**
 * @param {string} base
 * @param {Record<string, string>} subroutes
 * @returns {RouteGroup}
 */

const createRoutes = (base, subroutes) => {
  const routes = { path: base };
  for (const key in subroutes) {
    routes[key] = `${base}${subroutes[key]}`;
  }
  return routes;
};

/**
 * @type {Object.<string, RouteGroup | string>}
 */

export const ROUTES_FLAT = {
  [MODULES_TREE.LOGIN]: "/login",
  [MODULES_TREE.PORTAL]: "/",

  [MODULES_TREE.CARTERA.REGISTROS_BANCARIOS]: "/Cartera/RegistrosBancarios",
  [MODULES_TREE.CARTERA.H_REGISTROS_BANCARIOS]:
    "/Cartera/HistorialRegistrosBancarios",
  [MODULES_TREE.CARTERA.GESTION_CHEQUES]: "/Cartera/GestionCheques",
  [MODULES_TREE.CARTERA.SUBIR_ARCHIVO]: "/Cartera/CargarArchivoBancos",
  [MODULES_TREE.CARTERA.DESBLOQUEO_CLIENTES]: "/Cartera/DesbloqueoClientes",

  [MODULES_TREE.COMPRAS.GRAFICAS]: "/Compras/Graficas",
  [MODULES_TREE.COMPRAS.IMPORTACIONES.GENERAL]: "/Compras/Importaciones",
  [MODULES_TREE.COMPRAS.CREDITOS]: "/Compras/Creditos",
  [MODULES_TREE.COMPRAS.ANTICIPOS]: "/Compras/Anticipos",

  [MODULES_TREE.MRP.ASIGNACIONES]: "/MRP/Asignaciones",
  [MODULES_TREE.MRP.PROMOCIONES.CREAR]: "/MRP/Promociones/CrearPromocion",
  [MODULES_TREE.MRP.PROMOCIONES.CONSULTAR]: "/MRP/Promociones/Consulta",
  [MODULES_TREE.MRP.PROMOCIONES.CARGAR_ARCHIVO]:
    "/MRP/Promociones/CargaArchivo",
  [MODULES_TREE.MRP.PARAMETRIZACIONES]: "/MRP/Parametrizaciones",
  [MODULES_TREE.MRP.SIMULACION]: "/MRP/Simulacion",
  [MODULES_TREE.MRP.SIMULACION_COMERCIAL]: "/MRP/SimulacionComercial",

  [MODULES_TREE.CONTABILIDAD.CONVERSION]: "/Contabilidad/ConversionArchivos",
  [MODULES_TREE.CONTABILIDAD.REPORTE_FLUJOCAJA]: "/Contabilidad/ReporteFlujoCaja",
  [MODULES_TREE.CONTABILIDAD.COMISIONES.MAYORISTAS]:
    "/Contabilidad/Comisiones/Mayoristas",
  [MODULES_TREE.CONTABILIDAD.COMISIONES.TECNICENTRO]:
    "/Contabilidad/Comisiones/Tecnicentro",
  [MODULES_TREE.CONTABILIDAD.COMISIONES.TECNICENTRO_CATEGORIAS]:
    "/Contabilidad/Comisiones/Tecnicentro/Categorias",
  [MODULES_TREE.CONTABILIDAD.COMISIONES.LUBRICANTES]:
    "/Contabilidad/Comisiones/Lubricantes",

  [MODULES_TREE.MARKETING.INVENTARIO]: "/Marketing/Inventario",
  [MODULES_TREE.MARKETING.FACTURACIONMP]: "/Marketing/FacturacionMatPublicitario",
  [MODULES_TREE.MARKETING.COMERCIALREP]: "/Marketing/ComercialRep",

  [MODULES_TREE.GESTION_CLIENTES.REPORTES_SEGM]: "/GestionClientes/Reportes",

  [MODULES_TREE.RRHH.DOCUMENTACION]: "/RRHH/Documentacion",

  [MODULES_TREE.GOBIERNO_DATOS.MAESTROS]: "/GobiernoDatos/Maestros",

  [MODULES_TREE.TECNICENTRO.REPORTES]: "/Tecnicentro/Reportes",
  [MODULES_TREE.CYMC.REPORTES]: "/CYMC/Reportes",

  [MODULES_TREE.ADMINISTRACION]: "/Administracion",

  [MODULES_TREE.RECOVERY]: "/Recovery",
};
export const ROUTES = {
  LOGIN: "/login",
  PORTAL: "/",
  CARTERA: createRoutes("/Cartera", {
    REGISTROS_BANCARIOS: "/RegistrosBancarios",
    H_REGISTROS_BANCARIOS: "/HistorialRegistrosBancarios",
    SUBIR_ARCHIVO: "/SubirArchivo",
    GESTION_CHEQUES: "/GestionCheques",
    DESBLOQUEO_CLIENTES: "/DesbloqueoClientes",
  }),
  COMPRAS: createRoutes("/Compras", {
    GRAFICAS: "/Graficas",
    IMPORTACIONES: "/Importaciones",
    CREDITOS: "/Creditos",
    ANTICIPOS: "/Anticipos",
  }),
  MRP: createRoutes("/MRP", {
    ASIGNACIONES: "/Asignaciones",
    PROMOCIONES_CREAR: "/Promociones/CrearPromocion",
    PROMOCIONES_CONSULTA: "/Promociones/Consulta",
    PROMOCIONES_ARCHIVO: "/Promociones/CargaArchivo",
    PARAMETRIZACIONES: "/Parametrizaciones",
    SIMULACION: "/Simulacion",
    SIMULACION_COMERCIAL: "/SimulacionComercial",
  }),
  CONTABILIDAD: createRoutes("/Contabilidad", {
    CONVERSION: "/ConversionArchivos",
    COMISIONES_MAYORISTAS: "/Comisiones/Mayoristas",
    COMISIONES_TECNICENTRO: "/Comisiones/Tecnicentro",
    COMISIONES_TECNICENTRO_CATEGORIAS: "/Comisiones/Tecnicentro/Categorías",
    COMISIONES_LUBRICANTES: "/Comisiones/Lubricantes",
  }),
  MARKETING: createRoutes("/Marketing", {
    CONSULTA: "/Inventario",
    FACTURACIONMP: "/FacturacionMatPublicitario",

  }),
  GESTION_CLIENTES: createRoutes("/GestionClientes", {
    REPORTES_SEGM: "/Reportes",
  }),
  RRHH: createRoutes("/RRHH", {
    DOCUMENTACION: "/Documentacion",
  }),
  GOBIERNODATOS: createRoutes("/GobiernoDatos", {
    MAESTROS: "/Maestros",
  }),
  TECNICENTRO: createRoutes("/Tecnicentro", {
    REPORTES: "/Reportes",
  }),
  CYMC: createRoutes("/CYMC", {
    REPORTES: "/Reportes",
  }),
  ADMINISTRACION_USUARIOS: "/AdministracionUsuarios",
  RECOVERY: "/recovery",
};
