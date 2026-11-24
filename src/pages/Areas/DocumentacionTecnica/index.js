import { DocTecDiccionario } from "./diccionario/DocTecDiccionario";
import { DocTecDwhMapping } from "./dwh_mapping/DocTecDwhMapping";
import { DocTecCaracterizacion } from "./caracterizacion/DocTecCaracterizacion";
import { DocTecCalidad } from "./calidad/DocTecCalidad";
import { DocTecCalidadSocios } from "./calidad/DocTecCalidadSocios";
import { DocTecCompletitud } from "./completitud/DocTecCompletitud";
import { DocTecHorarios } from "./horarios/DocTecHorarios";
import { DocTecLineas } from "./lineas/DocTecLineas";
import { DocTecVendedor } from "./vendedor/DocTecVendedor";

const RAIZ = "documentaciontecnica";

/**
 * Pantalla que cambió de lugar en el menú. Genera dos rutas:
 *  - la nueva (visible en el menú), con su recurso nuevo y el antiguo como alternativo;
 *  - la antigua, oculta del menú, para que sigan funcionando los enlaces y favoritos guardados.
 * Así, quien tenía asignado solo el recurso antiguo no pierde el acceso.
 */
const movida = (title, component, recursoNuevo, recursoAntiguo) => [
  { title, component, recurso: recursoNuevo, recursosAlternativos: [recursoAntiguo] },
  {
    title,
    component,
    recurso: recursoAntiguo,
    recursosAlternativos: [recursoNuevo],
    path: `/${recursoAntiguo.replace(/\./g, "/")}`,
    hideInSidebar: true,
  },
];

/**
 * Módulo «Gobierno de Datos» (antes «Documentación Técnica»; acceso exclusivo de TI).
 *
 * - Las rutas se registran en src/router/Routes.js (...rutasDocumentacionTecnica).
 * - Los datos los sirve la API 2 (v1-portal-empresarial-back-new) en /documentacion-tecnica/*,
 *   a través de axiosInstanceNew; este módulo no tiene backend propio.
 * - El recurso `documentaciontecnica` (o el de cada sección) se asigna solo al rol de TI.
 * - Los submenús salen de los puntos del recurso; los `rootOnly` con recurso de varios niveles
 *   solo dan el título (con tildes) al grupo del menú.
 */
export const rutasDocumentacionTecnica = [
  // Grupo del menú (rootOnly: solo da nombre e icono al sidebar, no genera ruta)
  { recurso: RAIZ, title: "Gobierno de Datos", icon: "FaBook", rootOnly: true },

  // Títulos de los submenús
  { recurso: `${RAIZ}.documentacion`, title: "Documentación", rootOnly: true },
  { recurso: `${RAIZ}.caracterizacion`, title: "Caracterización", rootOnly: true },
  { recurso: `${RAIZ}.calidad`, title: "Calidad", rootOnly: true },
  { recurso: `${RAIZ}.completitud`, title: "Completitud", rootOnly: true },
  { recurso: `${RAIZ}.parametrizacion`, title: "Parametrización Mapping", rootOnly: true },
  { recurso: `${RAIZ}.parametrizacion.productos`, title: "Productos", rootOnly: true },

  // Documentación
  ...movida("Diccionario", DocTecDiccionario, `${RAIZ}.documentacion.diccionario`, `${RAIZ}.diccionario`),
  ...movida("DWH mapping", DocTecDwhMapping, `${RAIZ}.documentacion.dwhmapping`, `${RAIZ}.dwhmapping`),
  ...movida("Horario Automatizaciones", DocTecHorarios, `${RAIZ}.documentacion.horarios`, `${RAIZ}.horarios`),

  // Caracterización, Calidad y Completitud (la pantalla actual pasa a «Productos»; «Socios» llegará después)
  ...movida("Productos", DocTecCaracterizacion, `${RAIZ}.caracterizacion.productos`, `${RAIZ}.caracterizacion`),
  ...movida("Productos", DocTecCalidad, `${RAIZ}.calidad.productos`, `${RAIZ}.calidad`),
  { title: "Socios", component: DocTecCalidadSocios, recurso: `${RAIZ}.calidad.socios` },
  ...movida("Productos", DocTecCompletitud, `${RAIZ}.completitud.productos`, `${RAIZ}.completitud`),

  // Parametrización Mapping → Productos
  ...movida("Líneas", DocTecLineas, `${RAIZ}.parametrizacion.productos.lineas`, `${RAIZ}.lineas`),
  ...movida("Vendedor", DocTecVendedor, `${RAIZ}.parametrizacion.productos.vendedor`, `${RAIZ}.vendedor`),
];
