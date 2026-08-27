import { axiosInstanceNew } from "config/axiosConfig";
import { soloFecha } from "pages/Areas/RRHH/Colaboradores/utils/fechas";

/**
 * Módulo Colaboradores (RRHH). Habla con /api/v1/rrhh del back nuevo.
 *
 * La cabecera id-session la agrega automáticamente axiosInstanceNew, así que acá
 * no se hace nada para autenticarse.
 *
 * Este archivo es el ÚNICO sitio donde se desenvuelve el { status, message, data }
 * del Portal y donde se normaliza la forma de los datos. Las pantallas reciben
 * objetos ya listos y nunca ven el envoltorio.
 *
 * @typedef {Object} EmpleadoListItem
 * @property {number} id
 * @property {string} nombresCompletos
 * @property {string|null} cedula
 * @property {string} empresa
 * @property {string|null} cargo
 * @property {string|null} area
 * @property {string|null} linea
 * @property {string|null} ciudad
 * @property {string|null} correoCorporativo
 * @property {string|null} extension
 * @property {string|null} telefonoEmpresarial
 * @property {"Activo"|"Inactivo"} estado
 * @property {string|null} fechaIngreso  Formato AAAA-MM-DD
 * @property {string|null} fechaSalida   Formato AAAA-MM-DD
 *
 * @typedef {Object} Movimiento
 * @property {number} id
 * @property {"Ingreso"|"Baja"|"Reingreso"} tipo
 * @property {string} fecha
 * @property {string|null} motivo
 * @property {string|null} observacion
 * @property {string} registradoPor
 * @property {string|null} registradoDesdeIp
 * @property {string} creadoEn  ISO-8601
 *
 * @typedef {Object} AuditoriaResumen
 * @property {string} creadoPor
 * @property {string} creadoEn
 * @property {string|null} creadoDesdeIp
 * @property {string|null} modificadoPor
 * @property {string|null} modificadoEn
 * @property {string|null} modificadoDesdeIp
 *
 * @typedef {Object} EmpleadoDetalle
 * @property {number} id
 * @property {number} personaId
 * @property {string} nombresCompletos
 * @property {string} apellidos
 * @property {string} nombres
 * @property {string|null} cedula
 * @property {number} empresaId
 * @property {string} empresa
 * @property {number|null} cargoId
 * @property {string|null} cargo
 * @property {number|null} ciudadId
 * @property {string|null} ciudad
 * @property {number|null} areaId
 * @property {string|null} area
 * @property {number|null} lineaId
 * @property {string|null} linea
 * @property {string|null} fechaNacimiento
 * @property {string|null} correoCorporativo
 * @property {string|null} correoEstandar
 * @property {string|null} extension
 * @property {string|null} telefonoEmpresarial
 * @property {string|null} fechaIngreso
 * @property {string|null} fechaSalida
 * @property {"Activo"|"Inactivo"} estado
 * @property {number|null} motivoSalidaId
 * @property {string|null} motivoSalida
 * @property {string|null} observacion
 * @property {AuditoriaResumen} auditoria
 * @property {Movimiento[]} movimientos
 *
 * @typedef {Object} CatalogoItem
 * @property {number} id
 * @property {string} nombre
 * @property {number} empleados
 *
 * @typedef {Object} MotivoSalida
 * @property {number} id
 * @property {string} codigo
 * @property {string} nombre
 * @property {boolean} requiereDetalle
 */

const BASE = "/rrhh";

/** Saca el data del envoltorio del Portal. */
const desenvolver = (respuesta) => respuesta?.data?.data ?? null;

/**
 * Un mensaje que se le pueda mostrar a una persona.
 *
 * El back nuevo responde { status, message } y no el ProblemDetails del Intranet,
 * así que el mensaje de negocio ("ya tiene una ficha en MAXXIMUNDO", "complete la
 * fecha de ingreso antes de dar de baja") viene en `message`. Se propaga tal cual
 * porque está escrito para leerse en pantalla.
 */
const mensajeDeError = (error, porOmision) => {
  if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return null;
  return error?.response?.data?.message || error?.message || porOmision;
};

const propagar = (error, porOmision) => {
  const mensaje = mensajeDeError(error, porOmision);
  if (mensaje === null) throw error; // Cancelación: la maneja el hook.
  throw new Error(mensaje);
};

/**
 * Convierte los campos numéricos y de fecha a lo que esperan las pantallas.
 *
 * Es una red de seguridad deliberada: el contrato dice camelCase, números y
 * fechas AAAA-MM-DD, pero los ids pasan por un driver que devuelve BIGINT como
 * string, y una fecha que llegara como datetime vaciaría los campos del
 * formulario sin dar error. Cuesta unas líneas acá y evita bugs invisibles.
 */
const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

const mapearListItem = (fila) => ({
  ...fila,
  id: numero(fila.id),
  fechaIngreso: soloFecha(fila.fechaIngreso),
  fechaSalida: soloFecha(fila.fechaSalida),
});

const mapearDetalle = (ficha) => ({
  ...ficha,
  id: numero(ficha.id),
  personaId: numero(ficha.personaId),
  empresaId: numero(ficha.empresaId),
  cargoId: numero(ficha.cargoId),
  ciudadId: numero(ficha.ciudadId),
  areaId: numero(ficha.areaId),
  lineaId: numero(ficha.lineaId),
  motivoSalidaId: numero(ficha.motivoSalidaId),
  fechaNacimiento: soloFecha(ficha.fechaNacimiento),
  fechaIngreso: soloFecha(ficha.fechaIngreso),
  fechaSalida: soloFecha(ficha.fechaSalida),
  movimientos: (ficha.movimientos ?? []).map((mov) => ({
    ...mov,
    id: numero(mov.id),
    fecha: soloFecha(mov.fecha),
  })),
});

const mapearCatalogo = (item) => ({
  id: numero(item.id),
  nombre: item.nombre,
  empleados: numero(item.empleados) ?? 0,
});

// ── Tablero ─────────────────────────────────────────────────────────────────

/**
 * Resumen del tablero: totales, ingresos y bajas del mes, desglose por empresa y
 * los últimos movimientos.
 * @returns {Promise<Object>}
 */
export const ObtenerResumenColaboradores = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/resumen`, { signal });
    const datos = desenvolver(respuesta);
    if (!datos) return null;

    return {
      ...datos,
      porEmpresa: (datos.porEmpresa ?? []).map((item) => ({
        ...item,
        empresaId: numero(item.empresaId),
        activos: numero(item.activos) ?? 0,
        inactivos: numero(item.inactivos) ?? 0,
      })),
      movimientosRecientes: (datos.movimientosRecientes ?? []).map((mov) => ({
        ...mov,
        empleadoId: numero(mov.empleadoId),
        fecha: soloFecha(mov.fecha),
      })),
    };
  } catch (error) {
    return propagar(error, "No se pudo obtener el resumen de colaboradores");
  }
};

// ── Fichas ──────────────────────────────────────────────────────────────────

/**
 * Listado paginado. Los filtros vacíos no se mandan.
 * @param {Object} filtros buscar, estado, empresaId, cargoId, ciudadId, areaId, lineaId, page, pageSize
 * @returns {Promise<{items: EmpleadoListItem[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export const ListarColaboradores = async (filtros = {}, { signal } = {}) => {
  try {
    const params = {};
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "") params[clave] = valor;
    });

    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados`, { params, signal });
    const datos = desenvolver(respuesta);

    if (!datos) return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };

    return {
      items: (datos.items ?? []).map(mapearListItem),
      total: numero(datos.total) ?? 0,
      page: numero(datos.page) ?? 1,
      pageSize: numero(datos.pageSize) ?? 0,
      totalPages: numero(datos.totalPages) ?? 0,
    };
  } catch (error) {
    return propagar(error, "No se pudo obtener el listado de colaboradores");
  }
};

/**
 * Ficha completa, con auditoría e historial de movimientos.
 * @param {number|string} id
 * @returns {Promise<EmpleadoDetalle>}
 */
export const ObtenerColaborador = async (id, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${id}`, { signal });
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo obtener la ficha del colaborador");
  }
};

/**
 * Crea una ficha. Los catálogos van SIEMPRE por nombre (cargoNombre, areaNombre,
 * lineaNombre, ciudadNombre) y nunca por id: es lo que hace que el back los cree
 * al paso cuando el valor no existe todavía.
 * @param {Object} datos
 * @returns {Promise<EmpleadoDetalle>}
 */
export const CrearColaborador = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados`, datos);
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear la ficha");
  }
};

/**
 * Actualiza una ficha. No cambia el estado ni la salida: eso va por baja o reingreso.
 * @returns {Promise<EmpleadoDetalle>}
 */
export const ActualizarColaborador = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/empleados/${id}`, datos);
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar la ficha");
  }
};

/**
 * Da de baja. `motivoDetalle` solo hace falta si el motivo elegido tiene
 * requiereDetalle en true.
 * @returns {Promise<EmpleadoDetalle>}
 */
export const DarDeBajaColaborador = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${id}/baja`, datos);
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo registrar la baja");
  }
};

/**
 * Reingresa a un colaborador dado de baja.
 * @returns {Promise<EmpleadoDetalle>}
 */
export const ReingresarColaborador = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/empleados/${id}/reingreso`, datos);
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo registrar el reingreso");
  }
};

/**
 * Elimina una ficha (borrado lógico).
 *
 * OJO: el cuerpo va en la clave `data`. En un DELETE de axios, un segundo
 * argumento plano se interpreta como config y el cuerpo se pierde, con lo que el
 * back responde 400 por falta de motivo.
 * @param {number|string} id
 * @param {string} motivo Mínimo 5 caracteres
 */
export const EliminarColaborador = async (id, motivo) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/empleados/${id}`, { data: { motivo } });
  } catch (error) {
    propagar(error, "No se pudo eliminar la ficha");
  }
};

/**
 * Bitácora de cambios de una ficha. Los ids de catálogo ya vienen traducidos a
 * nombres desde el back.
 *
 * El orden de las claves de datosAnteriores y datosNuevos es contrato: la
 * pantalla los empareja por posición del arreglo, no por nombre.
 * @returns {Promise<Object[]>}
 */
export const ObtenerBitacoraColaborador = async (id, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${id}/auditoria`, { signal });
    const registros = desenvolver(respuesta) ?? [];
    return registros.map((registro) => ({
      ...registro,
      id: numero(registro.id),
      registroId: numero(registro.registroId),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener la bitácora de cambios");
  }
};

// ── Catálogos ───────────────────────────────────────────────────────────────

const listarCatalogo = (recurso, porOmision) => async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/catalogos/${recurso}`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearCatalogo);
  } catch (error) {
    return propagar(error, porOmision);
  }
};

/** @returns {Promise<CatalogoItem[]>} */
export const ListarEmpresas = listarCatalogo("empresas", "No se pudo obtener las empresas");
export const ListarCargos = listarCatalogo("cargos", "No se pudo obtener los cargos");
export const ListarCiudades = listarCatalogo("ciudades", "No se pudo obtener las ciudades");
export const ListarAreas = listarCatalogo("areas", "No se pudo obtener las áreas");
export const ListarLineas = listarCatalogo("lineas", "No se pudo obtener las líneas");

/** @returns {Promise<MotivoSalida[]>} */
export const ListarMotivosSalida = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/catalogos/motivos-salida`, { signal });
    return (desenvolver(respuesta) ?? []).map((motivo) => ({
      id: numero(motivo.id),
      codigo: motivo.codigo,
      nombre: motivo.nombre,
      requiereDetalle: Boolean(motivo.requiereDetalle),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener los motivos de salida");
  }
};

/** Estados posibles de una ficha. @returns {Promise<{valor: string, etiqueta: string}[]>} */
export const ListarEstados = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/catalogos/estados`, { signal });
    return desenvolver(respuesta) ?? [];
  } catch (error) {
    return propagar(error, "No se pudo obtener los estados");
  }
};
