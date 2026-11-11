import { DocTecDiccionario } from "./diccionario/DocTecDiccionario";
import { DocTecDwhMapping } from "./dwh_mapping/DocTecDwhMapping";
import { DocTecCaracterizacion } from "./caracterizacion/DocTecCaracterizacion";
import { DocTecCalidad } from "./calidad/DocTecCalidad";
import { DocTecCompletitud } from "./completitud/DocTecCompletitud";

/**
 * Módulo «Documentación Técnica» (acceso exclusivo de TI).
 *
 * - Las rutas se registran en src/router/Routes.js (...rutasDocumentacionTecnica).
 * - Los datos los sirve la API 2 (v1-portal-empresarial-back-new) en /documentacion-tecnica/*,
 *   a través de axiosInstanceNew; este módulo no tiene backend propio.
 * - El recurso `documentaciontecnica` (o el de cada sección) se asigna solo al rol de TI.
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
