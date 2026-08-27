/**
 * Constantes de la sección Colaboradores.
 *
 * Los tres enums vienen del contrato del API: eran uniones de literales en el
 * TypeScript del Intranet y acá se congelan para que un typo ("Activa") se vea
 * en un solo sitio en vez de estar disperso por cinco pantallas.
 */

/** Todas las rutas de la sección salen de acá. Absolutas, nunca relativas. */
export const RUTA_BASE = "/rrhh/colaboradores";

export const POR_PAGINA = 25;

export const ESTADO = Object.freeze({
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
});

export const TIPO_MOVIMIENTO = Object.freeze({
  INGRESO: "Ingreso",
  BAJA: "Baja",
  REINGRESO: "Reingreso",
});

export const ACCION = Object.freeze({
  INSERCION: "Insercion",
  ACTUALIZACION: "Actualizacion",
  ELIMINACION: "Eliminacion",
});

/** El filtro de estado del listado agrega "Todos", que no existe en el API. */
export const ESTADO_TODOS = "Todos";

/** Tono semántico por estado y por tipo de movimiento, para insignias y KPIs. */
export const TONO_ESTADO = Object.freeze({
  [ESTADO.ACTIVO]: "exito",
  [ESTADO.INACTIVO]: "peligro",
});

export const TONO_MOVIMIENTO = Object.freeze({
  [TIPO_MOVIMIENTO.INGRESO]: "exito",
  [TIPO_MOVIMIENTO.BAJA]: "peligro",
  [TIPO_MOVIMIENTO.REINGRESO]: "info",
});

export const ETIQUETA_ACCION = Object.freeze({
  [ACCION.INSERCION]: "Creó",
  [ACCION.ACTUALIZACION]: "Editó",
  [ACCION.ELIMINACION]: "Eliminó",
});

/** Cómo se lee cada tabla de la bitácora en pantalla. */
export const ETIQUETA_TABLA = Object.freeze({
  personas: "datos personales",
  empleados: "ficha",
  movimientos_personal: "movimiento",
});

/**
 * Los nombres de empresa se guardan con su forma legal completa, pero en los
 * filtros ocupan demasiado. Solo para mostrar, nunca para comparar.
 */
export const nombreCortoEmpresa = (nombre) =>
  (nombre ?? "").replace(/ (CIA LTDA|C LTDA)$/, "");
