import Portal from "pages/home/Portal";
import LoginPage from "pages/auth/LoginPage";
import PasswordRecovery from "pages/auth/PasswordRecovery";
import NotFound from "pages/NotFound";

// Administración
import { ComponenteAdministracionUsuario } from "pages/Areas/Administracion/EleccionAccion";

// App Shell
import AS_GestionCanjes from "pages/Areas/AppShell/AS_GestionCanjes/AS_GestionCanjes";

// Cartera
import { RegistrosBancarios } from "pages/Areas/Cartera/RegistrosBancarios/RegistrosBancarios";
import { DesbloqueoClientes } from "pages/Areas/Cartera/DesbloqueoClientes/DesbloqueoClientes";
import { GestionCheques } from "pages/Areas/Cartera/GestionCheques/GestionCheques";
import { RegistrosBancariosHistorial } from "pages/Areas/Cartera/RegistrosBancariosHistorial/RegistrosBancariosHistorial";
import { Cartera_CargarTransferencias } from "pages/Areas/Cartera/CargarTransferencias/Cartera_CargarTransferencias";

// Compras
import { Compras_Reportes } from "pages/Areas/Compras/Reportes/Compras_Reportes";
import { Importaciones } from "pages/Areas/Compras/Importaciones/Importaciones";
import { Creditos } from "pages/Areas/Compras/Creditos/Creditos";
import { Anticipos } from "pages/Areas/Compras/Anticipos/Anticipos";

// Contabilidad
import { Contabilidad_ConversionArchivosBancos } from "pages/Areas/Contabilidad/ConversionArchivosBancos/Contabilidad_ConversionArchivosBancos";
import { Contabilidad_ReporteFlujoCaja } from "pages/Areas/Contabilidad/FlujoDeCaja/ReporteFlujoCaja";
import { ComisionesMayoristas } from "pages/Areas/Contabilidad/Comisiones/Mayoristas/ReporteComisionesMayoristas";
import { ComisionesTecnicentroContainer } from "pages/Areas/Contabilidad/Comisiones/Tecnicentro/ComisionesTecnicentro";
import { ComisionesTecnicentroCategoriasContainer } from "pages/Areas/Contabilidad/Comisiones/Tecnicentro/ComisionesTecnicentroCategorias";
import { ComisionesLubricantes } from "pages/Areas/Contabilidad/Comisiones/Lubricantes/ReporteComisionesLubricantes";

// Marketing
import { MK_ReporteInventario } from "pages/Areas/Marketing/MK_ReporteInventario";
import { FacturacionMarketing } from "pages/Areas/Marketing/FacturacionMarketing";
import { ComercialMarketing } from "pages/Areas/Marketing/ComercialMarketing";

// RRHH
import { Documentacion } from "pages/Areas/RRHH/Documentacion";

import { ReporteriaComercial } from "pages/Areas/Reporteria/Comercial/ReporteriaComercial";
import { ReporteriaCobranzas } from "pages/Areas/Reporteria/Cobranzas/ReporteriaCobranzas";
import { ReporteriaTecnicentro } from "pages/Areas/Reporteria/Tecnicentro/ReporteriaTecnicentro";
import { ReporteriaGestionGerentes } from "pages/Areas/Reporteria/GestionGerentes/ReporteriaGestionGerentes";
import { ReporteriaCamiones } from "pages/Areas/Reporteria/Camiones/ReporteriaCamiones";
import { ReporteriaComercialFlashdeVentas } from "pages/Areas/Reporteria/ComercialFlashdeVentas/ReporteriaComercialFlashdeVentas";
import { ReporteriaCoordenadas } from "pages/Areas/Reporteria/Coordenadas/ReporteriaCoordenadas";
import { Marketing5w2h } from "pages/Areas/Marketing/Marketing.5w2h";
import { ReporteriaTecnicentroComercial } from "pages/Areas/Reporteria/TecnicentroComercial/ReporteriaTecnicentroComercial";
import { ReporteriaImportaciones } from "pages/Areas/Reporteria/Importaciones/ReporteriaImportaciones";

// Configuración centralizada - Una sola fuente de verdad
// Ahora usa recursos en lugar de módulos/secciones
// Si no se especifica path, se genera automáticamente desde el recurso
// Rutas con public: true no usan layout ni protección (login, recovery, 404)
export const RoutesConfig = [
  //// ================================= RUTAS PÚBLICAS =================================
  {
    path: "/login",
    title: "Inicio de sesión",
    component: LoginPage,
    public: true,
  },
  {
    path: "/recovery",
    title: "Recuperar contraseña",
    component: PasswordRecovery,
    public: true,
  },
  //// ================================= RUTAS PROTEGIDAS =================================
  {
    path: "/",
    title: "Inicio",
    icon: "FaHouse",
    component: Portal,
    recurso: null, // No requiere recurso, solo autenticación
  },
  // ================================= ADMINISTRACION =================================
  {
    title: "Administración",
    icon: "FaGears",
    component: ComponenteAdministracionUsuario,
    recurso: "administracion",
  },
  // ================================= APP SHELL =================================
  // Metadata de grupos (rootOnly: no genera ruta, solo nombre/icono en sidebar)
  {
    recurso: "appshell",
    title: "App Shell",
    icon: "SiShell",
    rootOnly: true,
  },
  {
    title: "Gestión de canjes",
    component: AS_GestionCanjes,
    recurso: "appshell.gestioncanjes",
  },
  // ================================= CARTERA =================================
  {
    recurso: "cartera",
    title: "Cartera",
    icon: "FaWallet",
    rootOnly: true,
  },
  {
    title: "Subir Archivo",
    component: Cartera_CargarTransferencias,
    recurso: "cartera.subirarchivo",
  },
  {
    title: "Registros Bancarios",
    component: RegistrosBancarios,
    recurso: "cartera.registrosbancarios",
    // Recursos alternativos para acceder a esta misma ruta
    recursosAlternativos: ["contabilidad.registrosbancarios"],
  },
  {
    title: "Registros Historicos",
    component: RegistrosBancariosHistorial,
    recurso: "cartera.registroshistoricos",
  },
  {
    title: "Gestión Cheques",
    component: GestionCheques,
    recurso: "cartera.gestioncheques",
  },
  {
    title: "Desbloqueo Clientes",
    component: DesbloqueoClientes,
    recurso: "cartera.desbloqueoclientes",
  },
  // ================================= COMPRAS =================================
  {
    recurso: "compras",
    title: "Compras",
    icon: "FaCartFlatbed",
    rootOnly: true,
  },
  {
    title: "Reportes",
    component: Compras_Reportes,
    recurso: "compras.graficas",
  },
  {
    title: "Importaciones",
    component: Importaciones,
    recurso: "compras.importaciones",
  },
  {
    title: "Créditos",
    component: Creditos,
    recurso: "compras.creditos",
  },
  {
    title: "Anticipos",
    component: Anticipos,
    recurso: "compras.anticipos",
  },
  // ================================= CONTABILIDAD =================================
  {
    recurso: "contabilidad",
    title: "Contabilidad",
    icon: "FaCalculator",
    rootOnly: true,
  },
  {
    title: "Conversión",
    component: Contabilidad_ConversionArchivosBancos,
    recurso: "contabilidad.conversion",
  },
  {
    title: "Reporte Flujo de Caja",
    component: Contabilidad_ReporteFlujoCaja,
    recurso: "contabilidad.reporteflujocaja",
  },
  {
    title: "Mayoristas",
    component: ComisionesMayoristas,
    recurso: "contabilidad.comisiones.mayoristas",
  },
  {
    title: "Reportes",
    component: ComisionesTecnicentroContainer,
    recurso: "contabilidad.comisiones.tecnicentro.reportes",
  },
  {
    title: "Categorías",
    component: ComisionesTecnicentroCategoriasContainer,
    recurso: "contabilidad.comisiones.tecnicentro.productos",
  },
  {
    title: "Lubricantes",
    component: ComisionesLubricantes,
    recurso: "contabilidad.comisiones.lubricantes",
  },
  // ================================= MARKETING =================================
  {
    recurso: "marketing",
    title: "Marketing",
    icon: "FaRegClipboard",
    rootOnly: true,
  },
  {
    title: "Inventario",
    component: MK_ReporteInventario,
    recurso: "marketing.inventario",
  },
  {
    title: "Comercial",
    component: ComercialMarketing,
    recurso: "marketing.comercial",
  },
  {
    title: "5W2H",
    component: Marketing5w2h,
    recurso: "marketing.5w2h",
  },
  // ================================= RRHH =================================
  {
    recurso: "rrhh",
    title: "Recursos Humanos",
    icon: "FaPeopleGroup",
    rootOnly: true,
  },

  {
    title: "Documentación",
    component: Documentacion,
    recurso: "rrhh.documentacion",
  },

  // ================================= REPORTERIA =================================
  {
    recurso: "reportes",
    title: "Reportería",
    icon: "FaChartLine",
    rootOnly: true,
  },

  {
    title: "Comercial",
    component: ReporteriaComercial,
    recurso: "reportes.comercial",
  },
  {
    title: "Tecni. Comercial",
    component: ReporteriaTecnicentroComercial,
    recurso: "reportes.tecnicentrocomercial",
  },
  {
    title: "Flash de Ventas",
    component: ReporteriaComercialFlashdeVentas,
    recurso: "reportes.flashventas",
  },
  {
    title: "Importaciones",
    component: ReporteriaImportaciones,
    recurso: "reportes.importaciones",
  },
  {
    title: "Coordenadas",
    component: ReporteriaCoordenadas,
    recurso: "reportes.coordenadas",
  },
  {
    title: "Cobranzas",
    component: ReporteriaCobranzas,
    recurso: "reportes.cobranzas",
  },
  {
    title: "Gestión Gerentes",
    component: ReporteriaGestionGerentes,
    recurso: "reportes.gestiongerentes",
  },
  {
    title: "Tecnicentro",
    component: ReporteriaTecnicentro,
    recurso: "reportes.tecnicentro",
  },
  {
    title: "Camiones",
    component: ReporteriaCamiones,
    recurso: "reportes.camiones",
  },
  // ================================= 404 (debe ir al final) =================================
  {
    path: "*",
    title: "No encontrado",
    component: NotFound,
    public: true,
  },
];
