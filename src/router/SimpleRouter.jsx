import { createBrowserRouter } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthContextProvider } from "context/authContext";
import { ThemeProvider } from "context/ThemeContext";
import { PermissionsProvider } from "context/PermissionsContext";

// Layout automático - se aplica a todas las rutas
import Header from "components/UI/Header/Header";
import Sidebar from "components/UI/Sidebar/Sidebar";
import Cabecera from "components/UI/NavBar/NavBar";
import {
  ContenedorCuerpoPaginaHorizontal,
  ContenedorCuerpoPagina,
} from "components/UI/ComponentesGenericos/GeneralStyled";
import { useTheme } from "context/ThemeContext";
import { globalConst } from "config/constants";

// Componentes de páginas
import Portal from "pages/home/Portal";
import NewInicioSesion from "pages/auth/NewInicioSesion";
import PasswordRecovery from "pages/auth/PasswordRecovery";
import NotFound from "pages/NotFound";

// Administración
import { ComponenteAdministracionUsuario } from "pages/Areas/AdministracionUsu/ComponentesAdmin/EleccionAccion";

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

// Gestión de Clientes
import { ReportesGestionClientes } from "pages/Areas/Gestion de Clientes/Reportes/ReportesGestionClientes";

// Gobierno de Datos
import GeneralMaestros from "pages/Areas/Gobierno de Datos/Maestros/GeneralMaestros";

// Marketing
import { ConsultaMarketing } from "pages/Areas/Marketing/ConsultaMarketing";
import { FacturacionMarketing } from "pages/Areas/Marketing/FacturacionMarketing";
import { ComercialMarketing } from "pages/Areas/Marketing/ComercialMarketing";

// MRP
import { Asignacion } from "pages/Areas/MRP/ComponentesMRP/Asignacion/Asignacion";
import { Parametrizaciones } from "pages/Areas/MRP/ComponentesMRP/Parametrizacion/Parametrizaciones";
import { Promociones } from "pages/Areas/MRP/ComponentesMRP/Promociones/Promociones";
import { FileUpload } from "pages/Areas/MRP/ComponentesMRP/Promociones/Nivel1/CargarArchivo";
import { ConsultaPromociones } from "pages/Areas/MRP/ComponentesMRP/Promociones/Nivel1/ConsultaPromociones";
import { Simulacion } from "pages/Areas/MRP/ComponentesMRP/Simulacion/Simulacion";
import { SimulacionComercial } from "pages/Areas/MRP/ComponentesMRP/SimulacionComercial/SimulacionComercial";

// RRHH
import { Documentacion } from "pages/Areas/RRHH/Documentacion";

// Tecnicentro
import { TecnicentroReportes } from "pages/Areas/Tecnicentro/Reportes/TecnicentroReportes";

// CYMC
import { ReportesCYMC } from "pages/Areas/CYMC/ReportesCYMC";

// Configuración centralizada - Una sola fuente de verdad
export const APP_CONFIG = [
  {
    path: "/",
    title: "Inicio",
    icon: "bi bi-house",
    component: Portal,
    seccion: null,
    modulo: null,
  },
  {
    path: "/administracion",
    title: "Administración",
    icon: "bi-person-badge",
    component: ComponenteAdministracionUsuario,
    seccion: "ADMINISTRACION",
    modulo: "ADMINISTRACION",
  },
  {
    path: "/cartera/subir-archivo",
    title: "Subir Archivo",
    icon: "",
    component: Cartera_CargarTransferencias,
    seccion: "CARTERA",
    modulo: "SUBIR ARCHIVO",
  },
  {
    path: "/cartera/registros-bancarios",
    title: "Registros Bancarios",
    icon: "",
    component: RegistrosBancarios,
    seccion: "CARTERA",
    modulo: "REGISTROS BANCARIOS",
  },
  {
    path: "/cartera/registros-historicos",
    title: "Registros Historicos",
    icon: "",
    component: RegistrosBancariosHistorial,
    seccion: "CARTERA",
    modulo: "REGISTROS HISTORICOS",
  },
  {
    path: "/cartera/gestion-cheques",
    title: "Gestión Cheques",
    icon: "",
    component: GestionCheques,
    seccion: "CARTERA",
    modulo: "GESTION CHEQUES",
  },
  {
    path: "/cartera/desbloqueo-clientes",
    title: "Desbloqueo Clientes",
    icon: "",
    component: DesbloqueoClientes,
    seccion: "CARTERA",
    modulo: "DESBLOQUEO CLIENTES",
  },
  {
    path: "/compras/reportes",
    title: "Reportes",
    icon: "",
    component: Compras_Reportes,
    seccion: "COMPRAS",
    modulo: "GRAFICAS",
  },
  {
    path: "/compras/importaciones",
    title: "Importaciones",
    icon: "",
    component: Importaciones,
    seccion: "COMPRAS",
    modulo: "IMPORTACIONES",
  },
  {
    path: "/compras/creditos",
    title: "Créditos",
    icon: "",
    component: Creditos,
    seccion: "COMPRAS",
    modulo: "CREDITOS",
  },
  {
    path: "/compras/anticipos",
    title: "Anticipos",
    icon: "",
    component: Anticipos,
    seccion: "COMPRAS",
    modulo: "ANTICIPOS",
  },
  {
    path: "/contabilidad/conversion",
    title: "Conversión",
    icon: "",
    component: Contabilidad_ConversionArchivosBancos,
    seccion: "CONTABILIDAD",
    modulo: "CONVERSION",
  },
  {
    path: "/contabilidad/reporte-flujo-caja",
    title: "Reporte Flujo de Caja",
    icon: "",
    component: Contabilidad_ReporteFlujoCaja,
    seccion: "CONTABILIDAD",
    modulo: "REPORTE_FLUJOCAJA",
  },
  {
    path: "/contabilidad/comisiones/mayoristas",
    title: "Mayoristas",
    icon: "",
    component: ComisionesMayoristas,
    seccion: "CONTABILIDAD",
    modulo: "MAYORISTAS",
    hierarchy: [{ title: "Comisiones", value: "COMISIONES" }],
  },
  {
    path: "/contabilidad/comisiones/tecnicentro",
    title: "Tecnicentro",
    icon: "",
    component: ComisionesTecnicentroContainer,
    seccion: "CONTABILIDAD",
    modulo: "TECNICENTRO",
    hierarchy: [{ title: "Comisiones", value: "COMISIONES" }],
  },
  {
    path: "/contabilidad/comisiones/tecnicentro/categorias",
    title: "Categorías Tecnicentro",
    icon: "",
    component: ComisionesTecnicentroCategoriasContainer,
    seccion: "CONTABILIDAD",
    modulo: "TECNICENTRO_PRODUCTOS",
    hierarchy: [
      { title: "Comisiones", value: "COMISIONES" }
    ],
  },
  {
    path: "/contabilidad/comisiones/lubricantes",
    title: "Lubricantes",
    icon: "",
    component: ComisionesLubricantes,
    seccion: "CONTABILIDAD",
    modulo: "CONTABILIDAD",
    hierarchy: [{ title: "Comisiones", value: "COMISIONES" }],
  },
  {
    path: "/gestion-clientes/reportes",
    title: "Reportes",
    icon: "",
    component: ReportesGestionClientes,
    seccion: "GESTIONCLIENTES",
    modulo: "REPORTES SEGM",
    subModules: ["NEUMATICOS", "NEUMATICOS MOTO", "LUBRICANTES"],
  },
  {
    path: "/gobierno-datos/maestros",
    title: "Maestros",
    icon: "",
    component: GeneralMaestros,
    seccion: "GOBIERNODATOS",
    modulo: "MAESTROS",
  },
  {
    path: "/marketing/inventario",
    title: "Inventario",
    icon: "",
    component: ConsultaMarketing,
    seccion: "MARKETING",
    modulo: "INVENTARIO",
  },
  {
    path: "/marketing/facturacion-mp",
    title: "Facturación Mat. Pub.",
    icon: "",
    component: FacturacionMarketing,
    seccion: "MARKETING",
    modulo: "FACTURACIONMP",
  },
  {
    path: "/marketing/comercial",
    title: "Comercial",
    icon: "",
    component: ComercialMarketing,
    seccion: "MARKETING",
    modulo: "COMERCIALREP",
  },
  {
    path: "/mrp/asignaciones",
    title: "Asignaciones",
    icon: "",
    component: Asignacion,
    seccion: "MRP",
    modulo: "ASIGNACIONES",
  },
  {
    path: "/mrp/promociones/crear",
    title: "Crear Promociones",
    icon: "",
    component: Promociones,
    seccion: "MRP",
    modulo: "CREAR PROMOCION",
    hierarchy: [{ title: "Promociones", value: "PROMOCIONES" }],
  },
  {
    path: "/mrp/promociones/consultar",
    title: "Consultar Promociones",
    icon: "",
    component: ConsultaPromociones,
    seccion: "MRP",
    modulo: "CONSULTAR PROMOCION",
    hierarchy: [{ title: "Promociones", value: "PROMOCIONES" }],
  },
  {
    path: "/mrp/promociones/cargar-archivo",
    title: "Cargar Archivo",
    icon: "",
    component: FileUpload,
    seccion: "MRP",
    modulo: "CARGAR ARCHIVO",
    hierarchy: [{ title: "Promociones", value: "PROMOCIONES" }],
  },
  {
    path: "/mrp/parametrizaciones",
    title: "Parametrización",
    icon: "",
    component: Parametrizaciones,
    seccion: "MRP",
    modulo: "PARAMETRIZACION",
  },
  {
    path: "/mrp/simulacion",
    title: "Simulación",
    icon: "",
    component: Simulacion,
    seccion: "MRP",
    modulo: "SIMULACION",
  },
  {
    path: "/mrp/simulacion-comercial",
    title: "Pedidos Comercial",
    icon: "",
    component: SimulacionComercial,
    seccion: "MRP",
    modulo: "PEDIDOS COMERCIAL",
  },
  {
    path: "/rrhh/documentacion",
    title: "Documentación",
    icon: "",
    component: Documentacion,
    seccion: "RRHH",
    modulo: "DOCUMENTACION",
  },
  {
    path: "/tecnicentro/reportes",
    title: "Reportes",
    icon: "",
    component: TecnicentroReportes,
    seccion: "TECNICENTRO",
    modulo: "REPORTES",
  },
  {
    path: "/cymc/reportes",
    title: "Reportes",
    icon: "",
    component: ReportesCYMC,
    seccion: "CYMC",
    modulo: "REPORTES",
  },
];

// Configuración de módulos padre para el sidebar
export const MODULE_CONFIG = [
  {
    title: "Cartera",
    icon: "bi-wallet2",
    modulo: "CARTERA",
  },
  {
    title: "Contabilidad",
    icon: "bi-calculator",
    modulo: "CONTABILIDAD",
  },
  {
    title: "Compras",
    icon: "bi-cart4",
    modulo: "COMPRAS",
  },
  {
    title: "MRP",
    icon: "bi bi-journal-plus",
    modulo: "MRP",
  },
  {
    title: "Marketing",
    icon: "bi bi-clipboard2-data",
    modulo: "MARKETING",
  },
  {
    title: "Gestión de Clientes",
    icon: "bi bi-journals",
    modulo: "GESTIONCLIENTES",
  },
  {
    title: "Recursos Humanos",
    icon: "bi bi-person-fill-gear",
    modulo: "RRHH",
  },
  {
    title: "Gobierno de Datos",
    icon: "bi bi-database",
    modulo: "GOBIERNODATOS",
  },
  {
    title: "Tecnicentro",
    icon: "bi bi-gear",
    modulo: "TECNICENTRO",
  },
  {
    title: "CYMC",
    icon: "bi bi-bar-chart-line-fill",
    modulo: "CYMC",
  },
];

// Función para generar configuración de rutas
export const getRoutesConfig = () => {
  const routes = {};
  APP_CONFIG.forEach((item) => {
    routes[item.path] = {
      component: item.component,
      seccion: item.seccion,
    };
  });
  return routes;
};

// Función para generar items del sidebar
export const getSidebarItems = () => {
  const modulosPermisos = JSON.parse(localStorage.getItem("modulos")) || [];

  const hasAdminAccess = modulosPermisos.some(
    (modulo) =>
      modulo.modulo === "ADMINISTRACION" ||
      (modulo.children &&
        modulo.children.some((child) => child.modulo === "ADMINISTRACION"))
  );

  // Items principales
  const items = [
    {
      title: "Inicio",
      icon: "bi bi-house",
      path: "/",
    },
  ];

  // Agregar módulos padre
  MODULE_CONFIG.forEach((module) => {
    const moduleItems = APP_CONFIG.filter(
      (item) => item.seccion === module.modulo && !item.hierarchy
    );

    if (moduleItems.length > 0) {
      const children = moduleItems.map((item) => ({
        title: item.title,
        icon: item.icon,
        path: item.path,
      }));

      // Generar submenús basados en la jerarquía
      const hierarchyGroups = {};

      // Agrupar items por jerarquía
      APP_CONFIG.filter((item) => item.seccion === module.modulo).forEach(
        (item) => {
          if (item.hierarchy && item.hierarchy.length > 0) {
            // Crear clave única para la jerarquía completa usando values
            const hierarchyKey = item.hierarchy.map((h) => h.value).join(" > ");

            if (!hierarchyGroups[hierarchyKey]) {
              hierarchyGroups[hierarchyKey] = {
                hierarchy: item.hierarchy,
                items: [],
              };
            }
            hierarchyGroups[hierarchyKey].items.push(item);
          }
        }
      );

      // Crear jerarquía anidada usando el array hierarchy
      const createHierarchyFromArray = (hierarchyArray, items) => {
        if (hierarchyArray.length === 1) {
          // Nivel final
          return {
            title: hierarchyArray[0].title,
            icon: "",
            children: items.map((item) => ({
              title: item.title,
              icon: item.icon,
              path: item.path,
            })),
          };
        } else {
          // Nivel intermedio - crear submenú padre
          const currentLevel = hierarchyArray[0];
          const remainingHierarchy = hierarchyArray.slice(1);

          return {
            title: currentLevel.title,
            icon: "",
            children: [createHierarchyFromArray(remainingHierarchy, items)],
          };
        }
      };

      // Agregar submenús para cada jerarquía
      Object.values(hierarchyGroups).forEach((group) => {
        const hierarchyItem = createHierarchyFromArray(
          group.hierarchy,
          group.items
        );
        children.push(hierarchyItem);
      });

      items.push({
        title: module.title,
        icon: module.icon,
        modulo: module.modulo,
        children,
      });
    }
  });

  // Agregar administración si tiene permisos
  if (hasAdminAccess) {
    items.push({
      title: "Administración",
      icon: "bi-person-badge",
      modulo: "ADMINISTRACION",
      path: "/administracion",
    });
  }

  return items;
};

// Componente interno del layout
function LayoutContent({ children, seccion = null }) {
  const { theme } = useTheme();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />
      <ContenedorCuerpoPaginaHorizontal
        style={{
          height: `calc(100vh - ${globalConst.alturaHeader})`,
        }}
      >
        <Sidebar />
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            backgroundColor: theme.colors.background,
          }}
        >
          {seccion && <Cabecera seccion={seccion} />}
          <ContenedorCuerpoPagina
            style={{
              flex: 1,
            }}
          >
            {children}
          </ContenedorCuerpoPagina>
        </div>
      </ContenedorCuerpoPaginaHorizontal>
    </div>
  );
}

// Páginas sin layout (login, recovery)
function AuthWrapper({ children }) {
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si ya está autenticado
    const isAuth = localStorage.getItem("MY_AUTH_APP_1");
    setAuthState(isAuth === "true");
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  // Si ya está autenticado, redirigir al home
  if (authState) {
    window.location.href = "/";
    return null;
  }

  return (
    <AuthContextProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthContextProvider>
  );
}

// Función para verificar permisos de módulo (búsqueda recursiva)
function hasModulePermission(requiredModule) {
  if (!requiredModule) return true; // Si no requiere módulo específico, permitir acceso

  const modulosPermisos = JSON.parse(localStorage.getItem("modulos")) || [];

  // Función recursiva para buscar el módulo en cualquier nivel
  const findModuleRecursively = (modules, targetModule) => {
    for (const module of modules) {
      if (module.modulo === targetModule) {
        return true;
      }
      if (module.children && module.children.length > 0) {
        if (findModuleRecursively(module.children, targetModule)) {
          return true;
        }
      }
    }
    return false;
  };

  return findModuleRecursively(modulosPermisos, requiredModule);
}

// Función para verificar si el usuario tiene al menos una empresa con permisos en el módulo
function hasAnyCompanyPermission(requiredModule) {
  if (!requiredModule) return true; // Si no requiere módulo específico, permitir acceso

  const modulosPermisos = JSON.parse(localStorage.getItem("modulos")) || [];

  // Función recursiva para buscar el módulo en cualquier nivel
  const findModuleRecursively = (modules, targetModule) => {
    for (const module of modules) {
      if (module.modulo === targetModule) {
        return module;
      }
      if (module.children && module.children.length > 0) {
        const found = findModuleRecursively(module.children, targetModule);
        if (found) return found;
      }
    }
    return null;
  };

  const moduloData = findModuleRecursively(modulosPermisos, requiredModule);

  if (!moduloData) return false;

  // Función recursiva para buscar permisos en children
  const hasPermissionsInChildren = (children) => {
    return children.some((child) => {
      // Si el child tiene permisos con empresas
      if (child.permisos && child.permisos.length > 0) {
        return child.permisos.some(
          (permiso) =>
            permiso.empresa &&
            permiso.permiso &&
            (permiso.permiso === "L" ||
              permiso.permiso === "E" ||
              permiso.permiso === "A")
        );
      }
      // Si tiene más children, buscar recursivamente
      if (child.children && child.children.length > 0) {
        return hasPermissionsInChildren(child.children);
      }
      return false;
    });
  };

  // Verificar permisos directos en el módulo
  if (moduloData.permisos && moduloData.permisos.length > 0) {
    const hasDirectPermissions = moduloData.permisos.some(
      (permiso) =>
        permiso.empresa &&
        permiso.permiso &&
        (permiso.permiso === "L" ||
          permiso.permiso === "E" ||
          permiso.permiso === "A")
    );
    if (hasDirectPermissions) return true;
  }

  // Verificar permisos en children
  if (moduloData.children && moduloData.children.length > 0) {
    return hasPermissionsInChildren(moduloData.children);
  }

  return false;
}

// Wrapper para rutas protegidas
function ProtectedWrapper({
  children,
  seccion = null,
  modulo = null,
  subModules = null,
}) {
  const [authState, setAuthState] = useState(null);
  const [permissionState, setPermissionState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación desde localStorage
    const isAuth = localStorage.getItem("MY_AUTH_APP_1");
    setAuthState(isAuth === "true");

    if (isAuth === "true") {
      if (subModules && subModules.length > 0) {
        // Para rutas con submódulos, verificar permisos en submódulos específicos
        const hasAnySubModule = subModules.some((subModule) => {
          const hasModule = hasModulePermission(subModule);
          const hasCompany = hasAnyCompanyPermission(subModule);
          return hasModule && hasCompany;
        });
        setPermissionState(hasAnySubModule);
      } else {
        // Para rutas normales, verificar permisos del módulo
        const hasModule = hasModulePermission(modulo);
        const hasCompany = hasAnyCompanyPermission(modulo);
        setPermissionState(hasModule && hasCompany);
      }
    }

    setLoading(false);
  }, [modulo, subModules]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  if (!authState) {
    // Redirigir al login si no está autenticado
    window.location.href = "/login";
    return null;
  }

  if (!permissionState) {
    // Redirigir al home si no tiene permisos
    window.location.href = "/";
    return null;
  }

  return (
    <AuthContextProvider>
      <ThemeProvider>
        <PermissionsProvider>
          <LayoutContent seccion={seccion}>{children}</LayoutContent>
        </PermissionsProvider>
      </ThemeProvider>
    </AuthContextProvider>
  );
}

// Generar rutas dinámicamente desde la configuración
const generateRoutes = () => {
  const routes = [
    // Rutas de autenticación (sin layout)
    {
      path: "/login",
      element: (
        <AuthWrapper>
          <NewInicioSesion />
        </AuthWrapper>
      ),
    },
    {
      path: "/recovery",
      element: (
        <AuthWrapper>
          <PasswordRecovery />
        </AuthWrapper>
      ),
    },
  ];

  // Generar rutas principales desde APP_CONFIG
  APP_CONFIG.forEach((item) => {
    routes.push({
      path: item.path,
      element: (
        <ProtectedWrapper
          seccion={item.seccion}
          modulo={item.subModules ? item.seccion : item.modulo}
          subModules={item.subModules}
        >
          <item.component routeConfig={item} />
        </ProtectedWrapper>
      ),
    });
  });

  // 404
  routes.push({
    path: "*",
    element: (
      <AuthWrapper>
        <NotFound />
      </AuthWrapper>
    ),
  });

  return routes;
};

// Router simple y directo
export const router = createBrowserRouter(generateRoutes());
