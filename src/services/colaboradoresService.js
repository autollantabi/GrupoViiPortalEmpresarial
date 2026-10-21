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
 * @property {"Ingreso"|"Baja"|"Reingreso"|"Subrogacion"} tipo
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
 * @property {string|null} estadoCivil
 * @property {number|null} numeroHijos
 * @property {boolean} conduce
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
  // Fase 3: fecha de ingreso + 70 días, null si no aplica (p. ej. inactivo). Los
  // "días restantes" se calculan en el cliente contra la fecha de hoy.
  fechaFinPeriodoPrueba: soloFecha(fila.fechaFinPeriodoPrueba),
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
  // numeroHijos distingue null ("no se sabe") de 0 ("se sabe que no tiene"), así
  // que pasa por numero() y no por Number() a secas.
  numeroHijos: numero(ficha.numeroHijos),
  conduce: ficha.conduce === true,
  fechaIngreso: soloFecha(ficha.fechaIngreso),
  fechaSalida: soloFecha(ficha.fechaSalida),
  fechaFinPeriodoPrueba: soloFecha(ficha.fechaFinPeriodoPrueba),
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

/**
 * Listado completo de movimientos de personal, con filtros. A diferencia de
 * `movimientosRecientes` del resumen (los últimos 10, sin filtrar), esta es la
 * pantalla "Movimientos de personal" con buscador, tipo, empresa y período.
 * @param {Object} filtros tipo, empresaId, fechaInicio, fechaFin, buscar, page, pageSize
 * @returns {Promise<{items: Object[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export const ObtenerMovimientosPersonal = async (filtros = {}, { signal } = {}) => {
  try {
    const params = {};
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "") params[clave] = valor;
    });

    const respuesta = await axiosInstanceNew.get(`${BASE}/movimientos`, { params, signal });
    const datos = desenvolver(respuesta);

    if (!datos) return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };

    return {
      items: (datos.items ?? []).map((mov) => ({
        ...mov,
        empleadoId: numero(mov.empleadoId),
        fecha: soloFecha(mov.fecha),
      })),
      total: numero(datos.total) ?? 0,
      page: numero(datos.page) ?? 1,
      pageSize: numero(datos.pageSize) ?? 0,
      totalPages: numero(datos.totalPages) ?? 0,
    };
  } catch (error) {
    return propagar(error, "No se pudo obtener el listado de movimientos");
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

// ── Fase 3: ciclo de vida laboral y reportes ───────────────────────────────
//
// Mismo criterio que el resto del archivo: acá se desenvuelve el envoltorio y se
// normalizan ids y fechas, y las pantallas reciben objetos ya listos.

/**
 * @typedef {Object} PerfilCargo
 * @property {number} id
 * @property {number} cargoId
 * @property {string} cargo
 * @property {string|null} nivel
 * @property {string|null} funciones
 * @property {string|null} requisitos
 * @property {string|null} competencias
 * @property {number|null} rangoSalarialMin
 * @property {number|null} rangoSalarialFijo
 * @property {number|null} rangoSalarialVariable
 * @property {number|null} reportaACargoId
 * @property {string|null} reportaACargo
 *
 * @typedef {Object} CambioCargo
 * @property {number} id
 * @property {number} cargoId
 * @property {string} cargo
 * @property {string} fechaInicio
 * @property {string|null} fechaFin
 * @property {string|null} observacion
 * @property {boolean} vigente
 *
 * @typedef {Object} InduccionCatalogoItem
 * @property {number} id
 * @property {number|null} areaId  Nulo = aplica a todas las áreas
 * @property {string|null} area
 * @property {number} orden
 * @property {string} nombreActividad
 * @property {number} diaRelativoIngreso
 * @property {string|null} responsable
 * @property {boolean} activo
 *
 * @typedef {Object} InduccionEmpleadoItem
 * @property {number} id
 * @property {number} empleadoId
 * @property {number} actividadId
 * @property {string} actividadNombre
 * @property {number} diaRelativoIngreso
 * @property {string|null} responsable
 * @property {number} orden
 * @property {string|null} fechaProgramada
 * @property {"Pendiente"|"Completada"} estado
 * @property {string|null} fechaCompletado
 * @property {string|null} completadoPor
 * @property {string|null} observacion
 *
 * @typedef {Object} PazSalvoAreaConfig
 * @property {number} id
 * @property {string} areaNombre
 * @property {number|null} cantidadResponsables  Informativo, no una lista de contactos
 * @property {string|null} correoNotificacion
 * @property {number|null} plazoDias  Días desde la salida para entregar; null = sin plazo
 * @property {boolean} activo
 *
 * @typedef {Object} PazSalvoEmpleadoItem
 * @property {number} id
 * @property {number} empleadoId
 * @property {number} movimientoId
 * @property {number} areaConfigId
 * @property {string} areaNombre
 * @property {"Pendiente"|"Resuelto"} estado
 * @property {string|null} observacion
 * @property {string|null} fechaResolucion
 * @property {string|null} resueltoPor
 * @property {string|null} fechaLimite  Snapshot: hasta cuándo puede entregar esta área
 */

// ── 3.1 — Reporte de ingresos y salidas ─────────────────────────────────────

/**
 * @param {Object} filtros empresaId (opcional), fechaInicio y fechaFin (AAAA-MM-DD, obligatorias)
 * @returns {Promise<Object[]>}
 */
export const ObtenerReporteIngresosSalidas = async (filtros = {}, { signal } = {}) => {
  try {
    const params = {};
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "") params[clave] = valor;
    });

    const respuesta = await axiosInstanceNew.get(`${BASE}/reportes/ingresos-salidas`, {
      params,
      signal,
    });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      empleadoId: numero(fila.empleadoId),
      fecha: soloFecha(fila.fecha),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener el reporte de ingresos y salidas");
  }
};

// ── 3.2 — Perfiles de cargo ──────────────────────────────────────────────────

const mapearPerfilCargo = (perfil) => ({
  ...perfil,
  id: numero(perfil.id),
  cargoId: numero(perfil.cargoId),
  reportaACargoId: numero(perfil.reportaACargoId),
  // Tres valores independientes, no un rango min/max.
  rangoSalarialMin: numero(perfil.rangoSalarialMin),
  rangoSalarialFijo: numero(perfil.rangoSalarialFijo),
  rangoSalarialVariable: numero(perfil.rangoSalarialVariable),
});

/** @returns {Promise<PerfilCargo[]>} */
export const ListarPerfilesCargo = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/perfiles-cargo`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearPerfilCargo);
  } catch (error) {
    return propagar(error, "No se pudo obtener los perfiles de cargo");
  }
};

export const CrearPerfilCargo = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/perfiles-cargo`, datos);
    const perfil = desenvolver(respuesta);
    return perfil ? mapearPerfilCargo(perfil) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el perfil de cargo");
  }
};

export const ActualizarPerfilCargo = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/perfiles-cargo/${id}`, datos);
    const perfil = desenvolver(respuesta);
    return perfil ? mapearPerfilCargo(perfil) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el perfil de cargo");
  }
};

export const EliminarPerfilCargo = async (id) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/perfiles-cargo/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el perfil de cargo");
  }
};

// ── 3.3 — Historial de cambios de cargo ─────────────────────────────────────

/** @returns {Promise<CambioCargo[]>} */
export const ObtenerHistorialCargos = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${BASE}/empleados/${empleadoId}/cambios-cargo`,
      { signal },
    );
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      id: numero(fila.id),
      cargoId: numero(fila.cargoId),
      fechaInicio: soloFecha(fila.fechaInicio),
      fechaFin: soloFecha(fila.fechaFin),
      vigente: Boolean(fila.vigente),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener el historial de cargos");
  }
};

/**
 * Cierra el renglón vigente y abre uno nuevo. Responde con la ficha actualizada,
 * igual que DarDeBajaColaborador/ReingresarColaborador.
 * @returns {Promise<EmpleadoDetalle>}
 */
export const CambiarCargoEmpleado = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${BASE}/empleados/${empleadoId}/cambios-cargo`,
      datos,
    );
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo registrar el cambio de cargo");
  }
};

/**
 * "Confirmar continuidad" del período de prueba. No hay nada más que "No
 * continuar": eso es una baja común, con el motivo "Fin de período de prueba".
 * @returns {Promise<EmpleadoDetalle>}
 */
export const ConfirmarPeriodoPrueba = async (empleadoId) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${BASE}/empleados/${empleadoId}/periodo-prueba/confirmar`,
    );
    const ficha = desenvolver(respuesta);
    return ficha ? mapearDetalle(ficha) : null;
  } catch (error) {
    return propagar(error, "No se pudo confirmar la continuidad");
  }
};

// ── 3.4 — Alertas de período de prueba ──────────────────────────────────────

/** Empleados activos dentro de la ventana de aviso. @returns {Promise<Object[]>} */
export const ObtenerPeriodoPruebaPendientes = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/periodo-prueba/pendientes`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      empleadoId: numero(fila.empleadoId),
      fechaIngreso: soloFecha(fila.fechaIngreso),
      fechaFinPeriodoPrueba: soloFecha(fila.fechaFinPeriodoPrueba),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener el período de prueba pendiente");
  }
};

/** Dispara el envío manual de avisos de período de prueba. */
export const EjecutarAvisoPeriodoPrueba = async () => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/periodo-prueba/ejecutar`);
    return respuesta?.data?.message ?? "";
  } catch (error) {
    return propagar(error, "No se pudo ejecutar el envío de avisos de período de prueba");
  }
};

// ── 3.5 — Cronograma de inducción por área ──────────────────────────────────

const mapearInduccionCatalogoItem = (item) => ({
  ...item,
  id: numero(item.id),
  areaId: numero(item.areaId),
  orden: numero(item.orden) ?? 0,
  diaRelativoIngreso: numero(item.diaRelativoIngreso),
  activo: item.activo !== false,
});

/** @returns {Promise<InduccionCatalogoItem[]>} */
export const ListarInduccionCatalogo = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/induccion/catalogo`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearInduccionCatalogoItem);
  } catch (error) {
    return propagar(error, "No se pudo obtener el catálogo de inducción");
  }
};

export const CrearInduccionCatalogoItem = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/induccion/catalogo`, datos);
    const item = desenvolver(respuesta);
    return item ? mapearInduccionCatalogoItem(item) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear la actividad de inducción");
  }
};

export const ActualizarInduccionCatalogoItem = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/induccion/catalogo/${id}`, datos);
    const item = desenvolver(respuesta);
    return item ? mapearInduccionCatalogoItem(item) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar la actividad de inducción");
  }
};

export const EliminarInduccionCatalogoItem = async (id) => {
  try {
    await axiosInstanceNew.delete(`${BASE}/induccion/catalogo/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar la actividad de inducción");
  }
};

/** @returns {Promise<InduccionEmpleadoItem[]>} */
export const ObtenerInduccionEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${BASE}/induccion/empleados/${empleadoId}`,
      { signal },
    );
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      id: numero(fila.id),
      empleadoId: numero(fila.empleadoId),
      actividadId: numero(fila.actividadId),
      diaRelativoIngreso: numero(fila.diaRelativoIngreso),
      orden: numero(fila.orden) ?? 0,
      fechaProgramada: soloFecha(fila.fechaProgramada),
      fechaCompletado: soloFecha(fila.fechaCompletado),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener la inducción del colaborador");
  }
};

/**
 * Marca una actividad de inducción. No se depende de la forma exacta de la
 * respuesta: la pantalla vuelve a pedir la lista con recargar(), igual que hace
 * ColDocumentos tras marcar un documento.
 */
export const MarcarInduccionItem = async (empleadoId, itemId, datos) => {
  try {
    await axiosInstanceNew.put(`${BASE}/induccion/empleados/${empleadoId}/${itemId}`, datos);
  } catch (error) {
    propagar(error, "No se pudo actualizar la actividad de inducción");
  }
};

// ── 3.6 — Subrogación ────────────────────────────────────────────────────────

/**
 * Traslada a un empleado a otra empresa conservando la antigüedad. Responde con
 * las DOS fichas completas: la de origen (que queda de baja por subrogación) y la
 * de destino (la nueva, activa).
 * @returns {Promise<{origen: EmpleadoDetalle, destino: EmpleadoDetalle}|null>}
 */
export const SubrogarEmpleado = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${BASE}/empleados/${empleadoId}/subrogacion`,
      datos,
    );
    const resultado = desenvolver(respuesta);
    if (!resultado) return null;
    return {
      origen: resultado.origen ? mapearDetalle(resultado.origen) : null,
      destino: resultado.destino ? mapearDetalle(resultado.destino) : null,
    };
  } catch (error) {
    return propagar(error, "No se pudo registrar la subrogación");
  }
};

// ── 3.7 — Paz y salvo ────────────────────────────────────────────────────────

const mapearPazSalvoAreaConfig = (area) => ({
  ...area,
  id: numero(area.id),
  cantidadResponsables: numero(area.cantidadResponsables),
  plazoDias: numero(area.plazoDias),
  activo: area.activo !== false,
});

/** @returns {Promise<PazSalvoAreaConfig[]>} */
export const ListarPazSalvoAreasConfig = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/paz-salvo/areas-config`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearPazSalvoAreaConfig);
  } catch (error) {
    return propagar(error, "No se pudo obtener la configuración de áreas de paz y salvo");
  }
};

export const CrearPazSalvoAreaConfig = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${BASE}/paz-salvo/areas-config`, datos);
    const area = desenvolver(respuesta);
    return area ? mapearPazSalvoAreaConfig(area) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el área de paz y salvo");
  }
};

/** No hay DELETE: se desactiva con activo:false. */
export const ActualizarPazSalvoAreaConfig = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${BASE}/paz-salvo/areas-config/${id}`, datos);
    const area = desenvolver(respuesta);
    return area ? mapearPazSalvoAreaConfig(area) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el área de paz y salvo");
  }
};

/** @returns {Promise<PazSalvoEmpleadoItem[]>} */
export const ObtenerPazSalvoEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/empleados/${empleadoId}/paz-salvo`, {
      signal,
    });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      id: numero(fila.id),
      empleadoId: numero(fila.empleadoId),
      movimientoId: numero(fila.movimientoId),
      areaConfigId: numero(fila.areaConfigId),
      fechaResolucion: soloFecha(fila.fechaResolucion),
      fechaLimite: soloFecha(fila.fechaLimite),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener el paz y salvo del colaborador");
  }
};

/**
 * Marca un área como Resuelto. Es unidireccional: el backend no ofrece
 * "des-resolver".
 */
export const ResolverPazSalvoItem = async (empleadoId, areaConfigId, datos) => {
  try {
    await axiosInstanceNew.put(
      `${BASE}/empleados/${empleadoId}/paz-salvo/${areaConfigId}`,
      datos,
    );
  } catch (error) {
    propagar(error, "No se pudo marcar el área como resuelta");
  }
};

/**
 * Reenvía el recordatorio a una o varias áreas que todavía no marcaron su
 * paz y salvo como Resuelto. areaConfigIds es siempre un arreglo, aunque sea
 * de uno solo: "de a uno o de varios a la vez" es la misma llamada.
 */
export const ReenviarPazSalvo = async (empleadoId, areaConfigIds) => {
  try {
    await axiosInstanceNew.post(`${BASE}/empleados/${empleadoId}/paz-salvo/reenviar`, {
      areaConfigIds,
    });
  } catch (error) {
    propagar(error, "No se pudo reenviar el recordatorio");
  }
};

/**
 * Banner del tablero: un renglón por colaborador con paz y salvo pendiente,
 * con cuántas áreas le faltan.
 * @returns {Promise<{empleadoId: number, nombresCompletos: string, pendientes: number}[]>}
 */
export const ObtenerPazSalvoPendienteGlobal = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/paz-salvo/pendientes`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      empleadoId: numero(fila.empleadoId),
      pendientes: numero(fila.pendientes),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener el paz y salvo pendiente");
  }
};

/**
 * Banner del tablero: un renglón por colaborador activo con documentos
 * pendientes o sin digitalizar. Son documentos YA registrados (ver el
 * comentario de DocumentosRrhhRepo.retrievePendientesGlobal en el backend);
 * uno condicional que nunca se tocó no aparece acá.
 * @returns {Promise<{empleadoId: number, nombresCompletos: string, pendientes: number, sinArchivo: number}[]>}
 */
export const ObtenerDocumentosPendientesGlobal = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/documentos/pendientes`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      empleadoId: numero(fila.empleadoId),
      pendientes: numero(fila.pendientes),
      sinArchivo: numero(fila.sinArchivo),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener los documentos pendientes");
  }
};

/**
 * "Documentos faltantes más comunes": los 3 tipos con más filas pendientes o
 * sin digitalizar, para saber qué pedir primero en lugar de un total ciego.
 * @returns {Promise<{tipoId: number, nombre: string, total: number}[]>}
 */
export const ObtenerDocumentosPendientesPorTipo = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${BASE}/documentos/pendientes-por-tipo`, { signal });
    return (desenvolver(respuesta) ?? []).map((fila) => ({
      ...fila,
      tipoId: numero(fila.tipoId),
      total: numero(fila.total),
    }));
  } catch (error) {
    return propagar(error, "No se pudo obtener los tipos de documento pendientes");
  }
};
