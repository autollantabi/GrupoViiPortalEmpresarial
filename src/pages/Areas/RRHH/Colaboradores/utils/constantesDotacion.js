import { RUTA_BASE } from "./constantes";

/**
 * Constantes de dotación y documentación.
 *
 * Archivo aparte de constantes.js por el mismo criterio que el servicio: son dos
 * cosas distintas y constantes.js describe la ficha.
 *
 * Los enums vienen del contrato del API y se congelan para que un typo
 * ("Entregada" por "Entregado") se vea en un solo sitio en vez de estar disperso
 * por las pantallas.
 */

/** Estado de un artículo de dotación o de un documento. */
export const ESTADO_ENTREGA = Object.freeze({
  PENDIENTE: "Pendiente",
  ENTREGADO: "Entregado",
  NO_APLICA: "NoAplica",
});

/** Estado de la cabecera de una asignación. Lo calcula el backend. */
export const ESTADO_ASIGNACION = Object.freeze({
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  ENTREGADA: "Entregada",
});

export const TIPO_ASIGNACION = Object.freeze({
  INICIAL: "Inicial",
  COMPLEMENTARIA: "Complementaria",
});

export const ORIGEN_ASIGNACION = Object.freeze({
  PLANTILLA: "Plantilla",
  MANUAL: "Manual",
  HISTORICO: "Historico",
});

export const CONDICION_DOCUMENTO = Object.freeze({
  CASADO: "Casado",
  CON_HIJOS: "ConHijos",
  CONDUCE: "Conduce",
});

export const MOTIVO_DOCUMENTO = Object.freeze({
  BASE: "Base",
  CARGO: "Cargo",
  CONDICION: "Condicion",
});

export const TIPO_CAMPO = Object.freeze({
  TEXTO: "texto",
  NUMERO: "numero",
  LISTA: "lista",
});

export const ESTADO_CIVIL = Object.freeze([
  "Soltero",
  "Casado",
  "Divorciado",
  "Viudo",
  "UnionLibre",
]);

// ── Etiquetas y tonos ───────────────────────────────────────────────────────

export const ETIQUETA_ENTREGA = Object.freeze({
  [ESTADO_ENTREGA.PENDIENTE]: "Pendiente",
  [ESTADO_ENTREGA.ENTREGADO]: "Entregado",
  [ESTADO_ENTREGA.NO_APLICA]: "No aplica",
});

export const TONO_ENTREGA = Object.freeze({
  [ESTADO_ENTREGA.PENDIENTE]: "aviso",
  [ESTADO_ENTREGA.ENTREGADO]: "exito",
  [ESTADO_ENTREGA.NO_APLICA]: "neutro",
});

export const ETIQUETA_ASIGNACION = Object.freeze({
  [ESTADO_ASIGNACION.PENDIENTE]: "Pendiente",
  [ESTADO_ASIGNACION.PARCIAL]: "Parcial",
  [ESTADO_ASIGNACION.ENTREGADA]: "Entregada",
});

export const TONO_ASIGNACION = Object.freeze({
  [ESTADO_ASIGNACION.PENDIENTE]: "aviso",
  [ESTADO_ASIGNACION.PARCIAL]: "info",
  [ESTADO_ASIGNACION.ENTREGADA]: "exito",
});

/** Por qué se le pide un documento a esta persona. */
export const ETIQUETA_MOTIVO = Object.freeze({
  [MOTIVO_DOCUMENTO.BASE]: "Obligatorio",
  [MOTIVO_DOCUMENTO.CARGO]: "Por su cargo",
  [MOTIVO_DOCUMENTO.CONDICION]: "Por su situación",
});

export const ETIQUETA_CONDICION = Object.freeze({
  [CONDICION_DOCUMENTO.CASADO]: "solo si es casado",
  [CONDICION_DOCUMENTO.CON_HIJOS]: "solo si tiene hijos",
  [CONDICION_DOCUMENTO.CONDUCE]: "solo si conduce",
});

export const ETIQUETA_ESTADO_CIVIL = Object.freeze({
  Soltero: "Soltero/a",
  Casado: "Casado/a",
  Divorciado: "Divorciado/a",
  Viudo: "Viudo/a",
  UnionLibre: "Unión libre",
});

/** Cómo se lee cada tabla nueva en la bitácora de la ficha. */
export const ETIQUETA_TABLA_DOTACION = Object.freeze({
  dotacion_grupos: "grupo de dotación",
  dotacion_items: "artículo de dotación",
  dotacion_plantillas: "plantilla de dotación",
  dotacion_plantilla_items: "renglón de plantilla",
  dotacion_asignaciones: "dotación",
  dotacion_asignacion_items: "artículo entregado",
  documentos_tipos: "tipo de documento",
  documentos_tipos_cargos: "documento por cargo",
  empleado_documentos: "documento",
  documento_archivos: "archivo",
});

// ── Rutas ───────────────────────────────────────────────────────────────────

export const RUTA_DOTACION = (id) => `${RUTA_BASE}/empleados/${id}/dotacion`;
export const RUTA_DOCUMENTOS = (id) => `${RUTA_BASE}/empleados/${id}/documentos`;
export const RUTA_FICHA = (id) => `${RUTA_BASE}/empleados/${id}`;
export const RUTA_CONFIGURACION = `${RUTA_BASE}/configuracion`;

/** Secciones de la pantalla de configuración. Van en la query string. */
export const SECCION_CONFIGURACION = Object.freeze({
  PLANTILLAS: "plantillas",
  ITEMS: "items",
  DOCUMENTOS: "documentos",
  AREAS: "areas",
});

// ── Archivos ────────────────────────────────────────────────────────────────

/**
 * Lo que acepta el backend. Se repite acá para poder avisar ANTES de subir 10 MB
 * por la red y recibir un 400; la comprobación de verdad, incluida la firma real
 * del archivo, la hace el servidor.
 */
export const TAMANIO_MAXIMO_BYTES = 10 * 1024 * 1024;

export const MIME_PERMITIDOS = Object.freeze(["application/pdf", "image/jpeg", "image/png"]);

/** Para el atributo accept del input, que además filtra el diálogo del sistema. */
export const ACCEPT_ARCHIVOS = ".pdf,.jpg,.jpeg,.png";

export const formatearTamanio = (bytes) => {
  const valor = Number(bytes);
  if (!Number.isFinite(valor) || valor <= 0) return "—";
  if (valor < 1024) return `${valor} B`;
  if (valor < 1024 * 1024) return `${Math.round(valor / 1024)} KB`;
  return `${(valor / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Los atributos de un artículo, listos para leerse: "talla: 42 · color: AZUL".
 *
 * Es lo que convierte un renglón que dice "BOTAS" en uno accionable.
 */
export const describirValores = (valores, campos = []) => {
  const entradas = Object.entries(valores ?? {}).filter(
    ([, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== "",
  );

  if (entradas.length === 0) return "";

  const etiquetas = new Map(campos.map((campo) => [campo.clave, campo.etiqueta]));

  return entradas
    .map(([clave, valor]) => `${etiquetas.get(clave) ?? clave}: ${valor}`)
    .join(" · ");
};
