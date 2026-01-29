import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuthContext } from "context/authContext";
import { ThemeProvider } from "context/ThemeContext";
import { SidebarProvider } from "context/SidebarContext";
import {
  hasAccessToResource,
  getAvailableCompanies,
  getAvailableLines,
} from "utils/permissionsValidator";

// Layout automático - se aplica a todas las rutas
import TemplatePaginas from "components/layout/TemplatePaginas";

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

// Gobierno de Datos
import GeneralMaestros from "pages/Areas/Gobierno de Datos/Maestros/GeneralMaestros";

// Marketing
import { ConsultaMarketing } from "pages/Areas/Marketing/ConsultaMarketing";
import { FacturacionMarketing } from "pages/Areas/Marketing/FacturacionMarketing";
import { ComercialMarketing } from "pages/Areas/Marketing/ComercialMarketing";

// MRP
// import { Asignacion } from "pages/Areas/MRP/ComponentesMRP/Asignacion/Asignacion";
// import { Parametrizaciones } from "pages/Areas/MRP/ComponentesMRP/Parametrizacion/Parametrizaciones";
// import { Promociones } from "pages/Areas/MRP/ComponentesMRP/Promociones/Promociones";
// import { FileUpload } from "pages/Areas/MRP/ComponentesMRP/Promociones/Nivel1/CargarArchivo";
// import { ConsultaPromociones } from "pages/Areas/MRP/ComponentesMRP/Promociones/Nivel1/ConsultaPromociones";
// import { Simulacion } from "pages/Areas/MRP/ComponentesMRP/Simulacion/Simulacion";
// import { SimulacionComercial } from "pages/Areas/MRP/ComponentesMRP/SimulacionComercial/SimulacionComercial";

// RRHH
import { Documentacion } from "pages/Areas/RRHH/Documentacion";

// Tecnicentro
import { TecnicentroReportes } from "pages/Areas/Tecnicentro/Reportes/TecnicentroReportes";

import { ReporteriaComercial } from "pages/Areas/Reporteria/Comercial/ReporteriaComercial";
import { ReporteriaCobranzas } from "pages/Areas/Reporteria/Cobranzas/ReporteriaCobranzas";
import { ReporteriaTecnicentro } from "pages/Areas/Reporteria/Tecnicentro/ReporteriaTecnicentro";
import { ReporteriaGestionGerentes } from "pages/Areas/Reporteria/GestionGerentes/ReporteriaGestionGerentes";
import { ReporteriaGarantiasHerramientas } from "pages/Areas/Reporteria/Garantias/Herramientas/ReporteriaGarantiasHerramientas";
import { ReporteriaCamiones } from "pages/Areas/Reporteria/Camiones/ReporteriaCamiones";
import { ReporteriaComercialFlashdeVentas } from "pages/Areas/Reporteria/ComercialFlashdeVentas/ReporteriaComercialFlashdeVentas";
import { ReporteriaCoordenadas } from "pages/Areas/Reporteria/Coordenadas/ReporteriaCoordenadas";
import { Marketing5w2h } from "pages/Areas/Marketing/Marketing.5w2h";
import { ReporteriaTecnicentroComercial } from "pages/Areas/Reporteria/TecnicentroComercial/ReporteriaTecnicentroComercial";
import { ReporteriaImportaciones } from "pages/Areas/Reporteria/Importaciones/ReporteriaImportaciones";


// Función para convertir un recurso a path automáticamente
// Ejemplo: "reportes.coordenadas" -> "/reportes/coordenadas"
function recursoToPath(recurso) {
  if (!recurso) return null;
  return "/" + recurso.replace(/\./g, "/");
}

// Configuración centralizada - Una sola fuente de verdad
// Ahora usa recursos en lugar de módulos/secciones
// Si no se especifica path, se genera automáticamente desde el recurso
export const APP_CONFIG = [
  {
    path: "/",
    title: "Inicio",
    icon: "FaHouse",
    component: Portal,
    recurso: null, // No requiere recurso, solo autenticación
  },
  {
    title: "Administración",
    icon: "FaGears",
    component: ComponenteAdministracionUsuario,
    recurso: "administracion",
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
  {
    title: "Maestros",
    component: GeneralMaestros,
    recurso: "gobiernodatos.maestros",
  },
  {
    title: "Inventario",
    component: ConsultaMarketing,
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
  {
    title: "Documentación",
    component: Documentacion,
    recurso: "rrhh.documentacion",
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
];

// Función para generar configuración de rutas
export const getRoutesConfig = () => {
  const routes = {};
  APP_CONFIG.forEach((item) => {
    routes[item.path] = {
      component: item.component,
      recurso: item.recurso,
    };
  });
  return routes;
};

// Función para obtener el primer nivel de un recurso (ej: "importaciones" de "importaciones.compras.reportes")
function getResourceRoot(recurso) {
  if (!recurso) return null;
  return recurso.split(".")[0];
}

// Función para obtener el nombre legible de un recurso raíz
function getResourceRootName(recursoRoot) {
  const names = {
    compras: "Compras",
    cartera: "Cartera",
    contabilidad: "Contabilidad",
    reportes: "Reportería",
    marketing: "Marketing",
    rrhh: "Recursos Humanos",
    gobiernodatos: "Gobierno de Datos",
    administracion: "Administración",
  };
  return names[recursoRoot?.toLowerCase()] || recursoRoot;
}

// Función para obtener el icono de un recurso raíz
function getResourceRootIcon(recursoRoot) {
  const icons = {
    compras: "FaCartFlatbed",
    cartera: "FaWallet",
    contabilidad: "FaCalculator",
    reportes: "FaChartLine",
    marketing: "FaRegClipboard",
    rrhh: "FaPeopleGroup",
    gobiernodatos: "FaDatabase",
    administracion: "FaGears",
  };
  return icons[recursoRoot?.toLowerCase()] || "";
}

// Función para generar items del sidebar basados en recursos
export const getSidebarItems = (userContexts = []) => {
  // Items principales
  const items = [
    {
      title: "Inicio",
      icon: "FaHouse",
      path: "/",
    },
  ];

  // Agrupar items por recurso raíz
  const itemsByRoot = {};
  // Items que son exactamente el root (sin hijos) - se mostrarán directamente
  const rootItems = [];

  APP_CONFIG.forEach((item) => {
    // Saltar items sin recurso (como "/")
    if (!item.recurso) return;

    // Verificar acceso al recurso
    const hasAccess = hasAccessToResource(userContexts, item.recurso);
    
    // También verificar recursos alternativos si existen
    const hasAltAccess = item.recursosAlternativos?.some((recursoAlt) =>
      hasAccessToResource(userContexts, recursoAlt)
    );

    if (hasAccess || hasAltAccess) {
      const root = getResourceRoot(item.recurso);
      if (!root) return;

      // Si el recurso es exactamente el root (sin puntos adicionales), mostrarlo directamente
      if (item.recurso === root) {
        const path = item.path || recursoToPath(item.recurso);
        rootItems.push({
          title: item.title,
          icon: item.icon || getResourceRootIcon(root),
          path: path,
        });
        return; // No agregar a itemsByRoot
      }

      // Si tiene hijos (tiene puntos), crear el grupo padre
      if (!itemsByRoot[root]) {
        itemsByRoot[root] = {
          title: getResourceRootName(root),
          icon: getResourceRootIcon(root),
          children: [],
        };
      }

      // Función recursiva para construir la jerarquía completa
      const construirJerarquia = (partes, nivelActual, contenedor, recursoParcial = "") => {
        // Construir el recurso parcial hasta este punto para poder buscar items existentes
        const recursoHastaAqui = recursoParcial 
          ? `${recursoParcial}.${partes[0]}` 
          : partes[0];
        
        // Si solo queda una parte, es el item final
        if (partes.length === 1) {
          const nivelFinal = partes[0];
          const nivelFinalKey = nivelActual ? `${nivelActual}.${nivelFinal}` : nivelFinal;
          const pathFinal = item.path || recursoToPath(item.recurso);
          
          // Verificar si ya existe un item o grupo con esta key o path
          const itemExistente = contenedor.find(
            (child) => child.hierarchyKey === nivelFinalKey || child.path === pathFinal
          );
          
          // Si existe y es un grupo (tiene children), agregar el item a sus children
          if (itemExistente && itemExistente.children) {
            itemExistente.children.push({
              title: item.title,
              icon: item.icon,
              path: pathFinal,
            });
          } else if (!itemExistente) {
            // Si no existe, crear el item final
            contenedor.push({
              title: item.title,
              icon: item.icon,
              path: pathFinal,
            });
          }
          return;
        }

        // Obtener el nivel actual (ej: "comisiones" de "contabilidad.comisiones.tecnicentro")
        const nivelActualNombre = partes[0];
        const nivelActualTitle = nivelActualNombre.charAt(0).toUpperCase() + nivelActualNombre.slice(1);
        
        // Construir la key única para este nivel
        const nivelKey = nivelActual ? `${nivelActual}.${nivelActualNombre}` : nivelActualNombre;
        
        // Construir el path del recurso hasta este nivel para buscar items existentes
        const recursoHastaEsteNivel = root ? `${root}.${recursoHastaAqui}` : recursoHastaAqui;
        const pathHastaEsteNivel = recursoToPath(recursoHastaEsteNivel);
        
        // Buscar si ya existe un grupo o item para este nivel
        let grupoNivel = contenedor.find(
          (child) => child.hierarchyKey === nivelKey
        );
        
        // También buscar por path en caso de que sea un item final que necesita convertirse en grupo
        if (!grupoNivel) {
          const itemPorPath = contenedor.find(
            (child) => child.path === pathHastaEsteNivel && !child.hierarchyKey
          );
          if (itemPorPath) {
            grupoNivel = itemPorPath;
          }
        }

        // Si existe pero no tiene children (es un item final), convertirlo en grupo
        if (grupoNivel && !grupoNivel.children) {
          // Encontrar el índice del item original
          const indexOriginal = contenedor.findIndex(
            (child) => child === grupoNivel || (child.path === pathHastaEsteNivel && !child.hierarchyKey)
          );
          
          if (indexOriginal !== -1) {
            // Convertir el item final en un grupo
            const itemFinal = { ...grupoNivel };
            grupoNivel = {
              title: nivelActualTitle,
              icon: "",
              hierarchyKey: nivelKey,
              children: [itemFinal], // Mover el item anterior como hijo
            };
            // Reemplazar el item en el contenedor
            contenedor[indexOriginal] = grupoNivel;
          } else {
            // Si no se encontró, crear nuevo grupo
            grupoNivel = {
              title: nivelActualTitle,
              icon: "",
              hierarchyKey: nivelKey,
              children: [],
            };
            contenedor.push(grupoNivel);
          }
        } else if (!grupoNivel) {
          // Si no existe, crearlo como grupo
          grupoNivel = {
            title: nivelActualTitle,
            icon: "",
            hierarchyKey: nivelKey,
            children: [],
          };
          contenedor.push(grupoNivel);
        }

        // Continuar recursivamente con las partes restantes
        const partesRestantes = partes.slice(1);
        construirJerarquia(partesRestantes, nivelKey, grupoNivel.children, recursoHastaAqui);
      };

      // Agrupar automáticamente por niveles del recurso (separados por puntos)
      const partesRecurso = item.recurso.split(".");
      
      // Si tiene más de 2 partes, crear estructura anidada recursiva
      if (partesRecurso.length > 2) {
        // Omitir el root (primera parte) y construir jerarquía con el resto
        const partesSinRoot = partesRecurso.slice(1);
        construirJerarquia(partesSinRoot, null, itemsByRoot[root].children, "");
      } else {
        // Item directo sin jerarquía adicional (solo 2 niveles: root.hijo)
        // Generar path automáticamente si no está especificado
        const path = item.path || recursoToPath(item.recurso);
        
        itemsByRoot[root].children.push({
          title: item.title,
          icon: item.icon,
          path: path,
        });
      }
    }
  });

  // Agregar items que son exactamente el root (sin hijos) directamente
  rootItems.forEach((rootItem) => {
    items.push(rootItem);
  });

  // Agregar items agrupados al sidebar (con hijos)
  Object.values(itemsByRoot).forEach((rootItem) => {
    if (rootItem.children.length === 0) return;

    // Siempre mostrar el grupo padre con sus hijos, incluso si solo hay un hijo
    // Esto permite que se vea "Cartera > Registros Bancarios" aunque solo tenga acceso a un recurso hijo
    items.push(rootItem);
  });

  return items;
};

// Componente interno del layout
function LayoutContent({ children }) {
  return <TemplatePaginas>{children}</TemplatePaginas>;
}

// Páginas sin layout (login, recovery)
function AuthWrapper({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// Las funciones de validación de permisos ahora están en utils/permissionsValidator.js

// Componente interno que usa el contexto
function ProtectedContent({
  children,
  recurso = null,
  recursosAlternativos = null,
}) {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthContext();
  const [permissionState, setPermissionState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableLines, setAvailableLines] = useState([]);

  // Extraer el rol del recurso principal o del primer recurso alternativo con acceso
  // Este hook debe estar antes de cualquier return condicional
  const rolDelRecurso = useMemo(() => {
    if (!user || !user.CONTEXTOS || !user.ROLES || !recurso) return null;
    
    // Función auxiliar para extraer el rol de un recurso específico
    const getRolDelRecurso = (recursoTarget, userContexts, userRoles) => {
      if (!recursoTarget || !userContexts || !userRoles) return null;
      
      // Buscar el contexto que tenga el recurso
      const contextoEncontrado = userContexts.find(
        (ctx) => ctx.RECURSO?.toLowerCase() === recursoTarget.toLowerCase()
      );
      
      if (!contextoEncontrado?.ID_ROL) return null;
      
      // Buscar el rol que corresponde a ese ID_ROL
      const rolEncontrado = userRoles.find(
        (rol) => rol.ID_ROL === contextoEncontrado.ID_ROL
      );
      
      return rolEncontrado?.NOMBRE_ROL?.toLowerCase() || null;
    };
    
    // Primero intentar con el recurso principal
    let rol = getRolDelRecurso(recurso, user.CONTEXTOS, user.ROLES);
    
    // Si no se encuentra y hay recursos alternativos, buscar en ellos
    if (!rol && recursosAlternativos && Array.isArray(recursosAlternativos)) {
      for (const recursoAlt of recursosAlternativos) {
        rol = getRolDelRecurso(recursoAlt, user.CONTEXTOS, user.ROLES);
        if (rol) break;
      }
    }
    
    return rol;
  }, [user, recurso, recursosAlternativos]);

  // Crear el objeto routeConfig con toda la información necesaria
  // Este hook también debe estar antes de cualquier return condicional
  const routeConfig = useMemo(() => {
    return {
      recurso,
      recursosAlternativos,
      rolDelRecurso,
      availableCompanies,
      availableLines,
    };
  }, [recurso, recursosAlternativos, rolDelRecurso, availableCompanies, availableLines]);

  useEffect(() => {
    // Esperar a que termine de cargar los datos del localStorage
    if (authLoading) {
      setLoading(true);
      return;
    }

    // Si no hay recurso requerido (como la ruta "/"), solo verificar autenticación
    // No necesita permisos específicos, solo estar autenticado
    if (!recurso) {
      setPermissionState(isAuthenticated);
      setLoading(false);
      return;
    }

    // Si hay recurso requerido, verificar permisos
    if (!isAuthenticated) {
      setPermissionState(false);
      setLoading(false);
      return;
    }

    // Si está autenticado pero aún no hay datos del usuario, esperar
    if (!user || !user.CONTEXTOS) {
      setLoading(true);
      return;
    }

    const userContexts = user.CONTEXTOS || []; // Array de contextos usuario-rol-contexto

    // TEMPORAL: Permitir acceso completo a administración para poder agregar permisos
    // TODO: Remover esta condición después de configurar los permisos
    if (recurso === "administracion") {
      setPermissionState(true);
      setLoading(false);
      return;
    }

    // Verificar acceso al recurso principal
    let hasAccess = hasAccessToResource(userContexts, recurso);
    const recursosConAcceso = []; // Array de recursos que dan acceso

    // Si tiene acceso al recurso principal, agregarlo
    if (hasAccess) {
      recursosConAcceso.push(recurso);
    }

    // Verificar recursos alternativos
    if (recursosAlternativos && Array.isArray(recursosAlternativos)) {
      for (const recursoAlt of recursosAlternativos) {
        const tieneAccesoAlt = hasAccessToResource(userContexts, recursoAlt);
        if (tieneAccesoAlt) {
          hasAccess = true;
          recursosConAcceso.push(recursoAlt); // Agregar recurso alternativo que da acceso
        }
      }
    }

    setPermissionState(hasAccess);

    // Si tiene acceso, obtener empresas y líneas disponibles
    // Combinar empresas y líneas de TODOS los recursos que dan acceso (principal + alternativos)
    // Pasar empresas y líneas globales del usuario (nueva estructura)
    if (hasAccess && recursosConAcceso.length > 0) {
      const empresasGlobales = user.EMPRESAS || null;
      const lineasGlobales = user.LINEAS || null;
      
      // Combinar empresas y líneas de todos los recursos que dan acceso
      const allCompanies = new Map();
      const allLines = new Map();
      
      for (const recursoConAcceso of recursosConAcceso) {
        const companies = getAvailableCompanies(userContexts, recursoConAcceso, empresasGlobales);
        const lines = getAvailableLines(userContexts, recursoConAcceso, lineasGlobales);
        
        // Agregar empresas sin duplicados
        companies.forEach((emp) => {
          if (!allCompanies.has(emp.id)) {
            allCompanies.set(emp.id, emp);
          }
        });
        
        // Agregar líneas sin duplicados
        lines.forEach((line) => {
          if (!allLines.has(line.id)) {
            allLines.set(line.id, line);
          }
        });
      }

      setAvailableCompanies(Array.from(allCompanies.values()));
      setAvailableLines(Array.from(allLines.values()));
      
    }

    setLoading(false);
  }, [isAuthenticated, user, recurso, recursosAlternativos, authLoading]);

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

  if (!isAuthenticated) {
    // Redirigir al login si no está autenticado
    window.location.href = "/login";
    return null;
  }

  // Solo redirigir si permissionState es explícitamente false (no null, que significa "aún cargando")
  if (permissionState === false) {
    // Redirigir al home si no tiene permisos
    window.location.href = "/";
    return null;
  }
  
  // Si permissionState es null, aún está cargando, mostrar loading
  if (permissionState === null) {
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

  return (
    <ThemeProvider>
      <SidebarProvider>
        <LayoutContent>
          {React.cloneElement(children, {
            routeConfig,
            availableCompanies,
            availableLines,
          })}
        </LayoutContent>
      </SidebarProvider>
    </ThemeProvider>
  );
}

// Wrapper para rutas protegidas
function ProtectedWrapper({
  children,
  recurso = null,
  recursosAlternativos = null,
}) {
  return (
    <ProtectedContent
      recurso={recurso}
      recursosAlternativos={recursosAlternativos}
    >
      {children}
    </ProtectedContent>
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
    // Si no hay path especificado, generarlo automáticamente desde el recurso
    const path = item.path || (item.recurso ? recursoToPath(item.recurso) : "/");
    
    routes.push({
      path: path,
      element: (
        <ProtectedWrapper
          recurso={item.recurso}
          recursosAlternativos={item.recursosAlternativos}
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
