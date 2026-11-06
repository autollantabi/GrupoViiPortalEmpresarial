import { DocTecDiccionario } from "./diccionario/DocTecDiccionario";
import { DocTecDwhMapping } from "./dwh_mapping/DocTecDwhMapping";
import { DocTecCaracterizacion } from "./caracterizacion/DocTecCaracterizacion";
import { DocTecCalidad } from "./calidad/DocTecCalidad";
import { DocTecCompletitud } from "./completitud/DocTecCompletitud";

/**
 * Módulo «Documentación Técnica» (acceso exclusivo de TI).
 *
 * Integración en el Portal Empresarial:
 *   1. Copiar esta carpeta a src/pages/Areas/.
 *   2. En src/router/Routes.js:
 *        import { rutasDocumentacionTecnica } from "pages/Areas/DocumentacionTecnica";
 *        ...y dentro de RoutesConfig:  ...rutasDocumentacionTecnica,
 *   3. Definir VITE_API_URL_DOC en el .env y añadir el interceptor de sesión (ver api.js).
 *   4. Asignar el recurso `documentaciontecnica` solo al rol de TI en el backend de permisos.
 */
export const rutasDocumentacionTecnica = [
  // Grupo del menú (rootOnly: solo da nombre e icono al sidebar, no genera ruta)
  { recurso: "documentaciontecnica", title: "Documentación Técnica", icon: "FaBook", rootOnly: true },
  { title: "Diccionario", component: DocTecDiccionario, recurso: "documentaciontecnica.diccionario" },
  { title: "DWH mapping", component: DocTecDwhMapping, recurso: "documentaciontecnica.dwhmapping" },
  { title: "Caracterización", component: DocTecCaracterizacion, recurso: "documentaciontecnica.caracterizacion" },
  { title: "Calidad", component: DocTecCalidad, recurso: "documentaciontecnica.calidad" },
  { title: "Completitud", component: DocTecCompletitud, recurso: "documentaciontecnica.completitud" },
];
