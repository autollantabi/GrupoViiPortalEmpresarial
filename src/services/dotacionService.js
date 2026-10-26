import { axiosInstanceNew } from "config/axiosConfig";
import { soloFecha } from "pages/Areas/RRHH/Colaboradores/utils/fechas";

/**
 * Dotación y documentación de colaboradores (RRHH).
 *
 * Habla con /api/v1/rrhh/dotacion y /api/v1/rrhh/documentos. Archivo aparte de
 * colaboradoresService.js, que ya tiene 376 líneas y cubre otra cosa: las fichas.
 *
 * Mismas convenciones que ese servicio, y por las mismas razones:
 *  - Es el ÚNICO sitio donde se desenvuelve { status, message, data }.
 *  - Los id se pasan por Number(): el driver del backend entrega los BIGINT como
 *    texto y un === del front fallaría en silencio.
 *  - Las fechas de negocio se recortan a AAAA-MM-DD: un <input type="date">
 *    rechaza un datetime sin avisar, el campo aparece vacío y guardar borraría la
 *    fecha.
 *
 * @typedef {Object} CampoItem
 * @property {string} clave
 * @property {string} etiqueta
 * @property {"texto"|"numero"|"lista"} tipo
 * @property {boolean} requerido
 * @property {string[]} [opciones]
 *
 * @typedef {Object} DotacionGrupo
 * @property {number} id
 * @property {string} codigo
 * @property {string} nombre
 * @property {number|null} areaResponsableId
 * @property {string|null} areaResponsable
 * @property {string|null} correoResponsable
 * @property {string|null} destinatarioEfectivo  El correo al que saldría el aviso hoy
 * @property {number} orden
 * @property {boolean} activo
 * @property {number} totalItems
 * @property {boolean} esMonetario  Grupo de dotación cartera (valores en dinero, no artículos físicos)
 *
 * @typedef {Object} DotacionItem
 * @property {number} id
 * @property {number} grupoId
 * @property {string} grupoCodigo
 * @property {string} grupoNombre
 * @property {string} nombre
 * @property {string|null} unidad
 * @property {CampoItem[]} campos
 * @property {number} orden
 * @property {boolean} activo
 *
 * @typedef {Object} AsignacionItem
 * @property {number} id
 * @property {number|null} itemId
 * @property {string} grupoCodigo
 * @property {string} grupoNombre
 * @property {string} itemNombre
 * @property {string|null} unidad
 * @property {number|null} cantidad
 * @property {Object} valores
 * @property {"Pendiente"|"Entregado"|"NoAplica"|"Baja"} estado
 * @property {string|null} fechaEntrega
 * @property {string|null} entregadoPor
 * @property {string|null} observacion
 * @property {number} orden
 * @property {string|null} motivoBajaNombre  Solo lleno si estado='Baja'
 * @property {string|null} fechaBaja  Solo lleno si estado='Baja'
 * @property {string|null} dadoBajaPor  Solo lleno si estado='Baja'
 *
 * @typedef {Object} AsignacionGrupo
 * @property {string} grupoCodigo
 * @property {string} grupoNombre
 * @property {number} totalItems
 * @property {number} entregados
 * @property {number} pendientes
 * @property {number} noAplica
 * @property {number} bajas
 * @property {AsignacionItem[]} items
 *
 * @typedef {Object} Asignacion
 * @property {number} id
 * @property {number} empleadoId
 * @property {"Inicial"|"Complementaria"} tipo
 * @property {string|null} motivo
 * @property {"Pendiente"|"Parcial"|"Entregada"} estado
 * @property {"Plantilla"|"Manual"|"Historico"} origen
 * @property {string} fecha
 * @property {Object[]} plantillasAplicadas
 * @property {string|null} observacion
 * @property {number} totalItems
 * @property {number} entregados
 * @property {number} pendientes
 * @property {number} noAplica
 * @property {number} bajas
 * @property {AsignacionGrupo[]} grupos
 * @property {Object} auditoria
 * @property {boolean} impresa  Si el acta ya se generó: bloquea la edición salvo reemplazos
 * @property {string|null} fechaImpresion
 * @property {string|null} impresaPor
 *
 * @typedef {Object} EntregaVigenteItem
 * @property {number} asignacionItemId  El id que va en reemplazaItemId al reemplazarlo
 * @property {number} asignacionId
 * @property {"Inicial"|"Complementaria"} tipo
 * @property {string} fecha
 * @property {"Pendiente"|"Entregado"|"NoAplica"} estado
 * @property {string|null} fechaEntrega
 * @property {number|null} cantidad
 *
 * @typedef {Object} MotivoBaja
 * @property {number} id
 * @property {string} codigo
 * @property {string} nombre
 * @property {number} orden
 * @property {boolean} activo
 *
 * @typedef {Object} EmpleadoDocumento
 * @property {number|null} id  Nulo si se exige pero aún no tiene fila
 * @property {number} tipoId
 * @property {string} tipoCodigo
 * @property {string} tipoNombre
 * @property {"Base"|"Cargo"|"Condicion"|null} motivo
 * @property {string|null} etiqueta
 * @property {"Pendiente"|"Entregado"|"NoAplica"} estado
 * @property {string|null} fechaEntrega
 * @property {Object|null} archivo
 * @property {number} totalVersiones
 *
 * @typedef {Object} CreditoCartera
 * @property {number} id
 * @property {number} asignacionItemId
 * @property {number} empleadoId
 * @property {string} itemNombre
 * @property {string|null} fechaEntrega
 * @property {number} montoTotal
 * @property {number} totalAbonado
 * @property {number} saldoPendiente
 * @property {string|null} observacion
 * @property {Object} auditoria
 *
 * @typedef {Object} AbonoCartera
 * @property {number} id
 * @property {number} creditoId
 * @property {number} monto
 * @property {string} fecha
 * @property {string|null} observacion
 * @property {string|null} registradoPor
 * @property {string} creadoEn
 *
 * @typedef {CreditoCartera & {abonos: AbonoCartera[]}} CreditoCarteraDetalle
 */

const DOTACION = "/rrhh/dotacion";
const DOCUMENTOS = "/rrhh/documentos";

const desenvolver = (respuesta) => respuesta?.data?.data ?? null;

const mensajeDeError = (error, porOmision) => {
  if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") return null;
  return error?.response?.data?.message || error?.message || porOmision;
};

const propagar = (error, porOmision) => {
  const mensaje = mensajeDeError(error, porOmision);
  if (mensaje === null) throw error; // Cancelación: la maneja el hook.
  throw new Error(mensaje);
};

const numero = (valor) => (valor === null || valor === undefined ? null : Number(valor));

/** Los filtros vacíos no se mandan, para no ensuciar la query string. */
const soloConValor = (filtros = {}) => {
  const params = {};
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") params[clave] = valor;
  });
  return params;
};

// ── Normalizadores ──────────────────────────────────────────────────────────

const mapearCampos = (campos) => (Array.isArray(campos) ? campos : []);

const mapearGrupo = (grupo) => ({
  ...grupo,
  id: numero(grupo.id),
  areaResponsableId: numero(grupo.areaResponsableId),
  orden: numero(grupo.orden) ?? 0,
  totalItems: numero(grupo.totalItems) ?? 0,
  esMonetario: Boolean(grupo.esMonetario),
});

const mapearMotivoBaja = (motivo) => ({
  ...motivo,
  id: numero(motivo.id),
  orden: numero(motivo.orden) ?? 0,
});

const mapearItem = (item) => ({
  ...item,
  id: numero(item.id),
  grupoId: numero(item.grupoId),
  campos: mapearCampos(item.campos),
  orden: numero(item.orden) ?? 0,
});

const mapearPlantilla = (plantilla) => ({
  ...plantilla,
  id: numero(plantilla.id),
  cargoId: numero(plantilla.cargoId),
  empresaId: numero(plantilla.empresaId),
  areaId: numero(plantilla.areaId),
  lineaId: numero(plantilla.lineaId),
  totalItems: numero(plantilla.totalItems) ?? 0,
  especificidad: numero(plantilla.especificidad) ?? 0,
  items: (plantilla.items ?? []).map((renglon) => ({
    ...renglon,
    id: numero(renglon.id),
    itemId: numero(renglon.itemId),
    grupoId: numero(renglon.grupoId),
    cantidad: numero(renglon.cantidad),
    campos: mapearCampos(renglon.campos),
    orden: numero(renglon.orden) ?? 0,
  })),
});

const mapearResolucion = (resolucion) => ({
  plantillasAplicadas: (resolucion?.plantillasAplicadas ?? []).map((plantilla) => ({
    ...plantilla,
    id: numero(plantilla.id),
    especificidad: numero(plantilla.especificidad) ?? 0,
  })),
  items: (resolucion?.items ?? []).map((item) => ({
    ...item,
    itemId: numero(item.itemId),
    grupoId: numero(item.grupoId),
    cantidad: numero(item.cantidad),
    campos: mapearCampos(item.campos),
    orden: numero(item.orden) ?? 0,
    desdePlantillaId: numero(item.desdePlantillaId),
  })),
  excluidos: (resolucion?.excluidos ?? []).map((item) => ({
    ...item,
    itemId: numero(item.itemId),
  })),
});

const mapearAsignacion = (asignacion) => ({
  ...asignacion,
  id: numero(asignacion.id),
  empleadoId: numero(asignacion.empleadoId),
  fecha: soloFecha(asignacion.fecha),
  totalItems: numero(asignacion.totalItems) ?? 0,
  entregados: numero(asignacion.entregados) ?? 0,
  pendientes: numero(asignacion.pendientes) ?? 0,
  noAplica: numero(asignacion.noAplica) ?? 0,
  bajas: numero(asignacion.bajas) ?? 0,
  impresa: Boolean(asignacion.impresa),
  plantillasAplicadas: (asignacion.plantillasAplicadas ?? []).map((plantilla) => ({
    ...plantilla,
    id: numero(plantilla.id),
  })),
  grupos: (asignacion.grupos ?? []).map((grupo) => ({
    ...grupo,
    totalItems: numero(grupo.totalItems) ?? 0,
    entregados: numero(grupo.entregados) ?? 0,
    pendientes: numero(grupo.pendientes) ?? 0,
    noAplica: numero(grupo.noAplica) ?? 0,
    bajas: numero(grupo.bajas) ?? 0,
    items: (grupo.items ?? []).map((item) => ({
      ...item,
      id: numero(item.id),
      itemId: numero(item.itemId),
      cantidad: numero(item.cantidad),
      valores: item.valores ?? {},
      fechaEntrega: soloFecha(item.fechaEntrega),
      fechaBaja: soloFecha(item.fechaBaja),
      orden: numero(item.orden) ?? 0,
    })),
  })),
});

const mapearNotificacion = (notificacion) => ({
  ...notificacion,
  id: numero(notificacion.id),
  cantidadItems: numero(notificacion.cantidadItems) ?? 0,
});

const mapearDotacionEmpleado = (datos) => ({
  ...datos,
  empleadoId: numero(datos.empleadoId),
  fechaIngreso: soloFecha(datos.fechaIngreso),
  asignaciones: (datos.asignaciones ?? []).map(mapearAsignacion),
  notificaciones: (datos.notificaciones ?? []).map(mapearNotificacion),
  avisos: datos.avisos ?? [],
});

const mapearTipoDocumento = (tipo) => ({
  ...tipo,
  id: numero(tipo.id),
  orden: numero(tipo.orden) ?? 0,
  cargos: (tipo.cargos ?? []).map((cargo) => ({ ...cargo, id: numero(cargo.id) })),
});

const mapearDocumento = (documento) => ({
  ...documento,
  // OJO: id nulo es un estado legítimo, no un error. Significa "se le exige pero
  // todavía no tiene fila", y es lo que la pantalla usa para saber si al marcar
  // tiene que crear o actualizar. Por eso numero() y no Number() a secas.
  id: numero(documento.id),
  tipoId: numero(documento.tipoId),
  fechaEntrega: soloFecha(documento.fechaEntrega),
  totalVersiones: numero(documento.totalVersiones) ?? 0,
  orden: numero(documento.orden) ?? 0,
  archivo: documento.archivo
    ? {
        ...documento.archivo,
        id: numero(documento.archivo.id),
        version: numero(documento.archivo.version) ?? 1,
        tamanioBytes: numero(documento.archivo.tamanioBytes) ?? 0,
      }
    : null,
});

const mapearAbonoCartera = (abono) => ({
  ...abono,
  id: numero(abono.id),
  creditoId: numero(abono.creditoId),
  monto: numero(abono.monto),
  fecha: soloFecha(abono.fecha),
});

const mapearCreditoCartera = (credito) => ({
  ...credito,
  id: numero(credito.id),
  asignacionItemId: numero(credito.asignacionItemId),
  empleadoId: numero(credito.empleadoId),
  fechaEntrega: soloFecha(credito.fechaEntrega),
  montoTotal: numero(credito.montoTotal),
  totalAbonado: numero(credito.totalAbonado),
  saldoPendiente: numero(credito.saldoPendiente),
});

const mapearCreditoCarteraDetalle = (detalle) => ({
  ...mapearCreditoCartera(detalle),
  abonos: (detalle.abonos ?? []).map(mapearAbonoCartera),
});

const mapearDocumentacion = (datos) => ({
  ...datos,
  empleadoId: numero(datos.empleadoId),
  numeroHijos: numero(datos.numeroHijos),
  totalRequeridos: numero(datos.totalRequeridos) ?? 0,
  entregados: numero(datos.entregados) ?? 0,
  pendientes: numero(datos.pendientes) ?? 0,
  noAplica: numero(datos.noAplica) ?? 0,
  sinArchivo: numero(datos.sinArchivo) ?? 0,
  documentos: (datos.documentos ?? []).map(mapearDocumento),
  avisos: datos.avisos ?? [],
});

// ── Catálogo ────────────────────────────────────────────────────────────────

/** @returns {Promise<DotacionGrupo[]>} */
export const ListarGruposDotacion = async ({ soloActivos, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/grupos`, {
      params: soloConValor({ soloActivos: soloActivos ? "true" : undefined }),
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearGrupo);
  } catch (error) {
    return propagar(error, "No se pudo obtener los grupos de dotación");
  }
};

export const CrearGrupoDotacion = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${DOTACION}/grupos`, datos);
    const grupo = desenvolver(respuesta);
    return grupo ? mapearGrupo(grupo) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el grupo");
  }
};

export const ActualizarGrupoDotacion = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${DOTACION}/grupos/${id}`, datos);
    const grupo = desenvolver(respuesta);
    return grupo ? mapearGrupo(grupo) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el grupo");
  }
};

export const EliminarGrupoDotacion = async (id) => {
  try {
    await axiosInstanceNew.delete(`${DOTACION}/grupos/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el grupo");
  }
};

/** @returns {Promise<DotacionItem[]>} */
export const ListarItemsDotacion = async ({ grupoId, soloActivos, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/items`, {
      params: soloConValor({ grupoId, soloActivos: soloActivos ? "true" : undefined }),
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearItem);
  } catch (error) {
    return propagar(error, "No se pudo obtener los artículos de dotación");
  }
};

export const CrearItemDotacion = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${DOTACION}/items`, datos);
    const item = desenvolver(respuesta);
    return item ? mapearItem(item) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el artículo");
  }
};

export const ActualizarItemDotacion = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${DOTACION}/items/${id}`, datos);
    const item = desenvolver(respuesta);
    return item ? mapearItem(item) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el artículo");
  }
};

export const EliminarItemDotacion = async (id) => {
  try {
    await axiosInstanceNew.delete(`${DOTACION}/items/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el artículo");
  }
};

/** Quién recibe los avisos de un área. */
export const ActualizarResponsableArea = async (areaId, datos) => {
  try {
    await axiosInstanceNew.put(`${DOTACION}/areas/${areaId}/responsable`, datos);
  } catch (error) {
    propagar(error, "No se pudo actualizar el responsable del área");
  }
};

// ── Plantillas ──────────────────────────────────────────────────────────────

export const ListarPlantillasDotacion = async ({ signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/plantillas`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearPlantilla);
  } catch (error) {
    return propagar(error, "No se pudo obtener las plantillas");
  }
};

export const ObtenerPlantillaDotacion = async (id, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/plantillas/${id}`, { signal });
    const plantilla = desenvolver(respuesta);
    return plantilla ? mapearPlantilla(plantilla) : null;
  } catch (error) {
    return propagar(error, "No se pudo obtener la plantilla");
  }
};

/**
 * Vista previa: qué se le entregaría a alguien con este ámbito.
 *
 * Es la misma función que usa el alta de una ficha, así que lo que se ve acá es
 * exactamente lo que se va a asignar.
 */
export const ResolverPlantillasDotacion = async (ambito = {}, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/plantillas/resolver`, {
      params: soloConValor(ambito),
      signal,
    });
    return mapearResolucion(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo resolver las plantillas");
  }
};

export const ResolverPlantillasEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${DOTACION}/empleados/${empleadoId}/resolver`,
      { signal },
    );
    return mapearResolucion(desenvolver(respuesta));
  } catch (error) {
    return propagar(error, "No se pudo resolver la dotación del colaborador");
  }
};

export const CrearPlantillaDotacion = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${DOTACION}/plantillas`, datos);
    const plantilla = desenvolver(respuesta);
    return plantilla ? mapearPlantilla(plantilla) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear la plantilla");
  }
};

export const ActualizarPlantillaDotacion = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${DOTACION}/plantillas/${id}`, datos);
    const plantilla = desenvolver(respuesta);
    return plantilla ? mapearPlantilla(plantilla) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar la plantilla");
  }
};

export const EliminarPlantillaDotacion = async (id) => {
  try {
    await axiosInstanceNew.delete(`${DOTACION}/plantillas/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar la plantilla");
  }
};

// ── Dotación de un colaborador ──────────────────────────────────────────────

export const ObtenerDotacionEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/empleados/${empleadoId}`, { signal });
    const datos = desenvolver(respuesta);
    return datos ? mapearDotacionEmpleado(datos) : null;
  } catch (error) {
    return propagar(error, "No se pudo obtener la dotación del colaborador");
  }
};

export const CrearAsignacionDotacion = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${DOTACION}/empleados/${empleadoId}/asignaciones`,
      datos,
    );
    const asignacion = desenvolver(respuesta);
    return {
      asignacion: asignacion ? mapearAsignacion(asignacion) : null,
      mensaje: respuesta?.data?.message ?? "",
    };
  } catch (error) {
    return propagar(error, "No se pudo crear la dotación");
  }
};

export const AgregarItemAsignacion = async (asignacionId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${DOTACION}/asignaciones/${asignacionId}/items`,
      datos,
    );
    const asignacion = desenvolver(respuesta);
    return asignacion ? mapearAsignacion(asignacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo agregar el artículo");
  }
};

/**
 * Agrega VARIOS artículos de una vez, cada uno con su cantidad y, si reemplaza
 * una entrega ya vigente, con `reemplazaItemId` y `motivoBajaId`.
 *
 * Existe porque la pantalla deja marcar un grupo entero con una casilla, y un
 * grupo son entre dos y diez articulos. Con el endpoint de a uno eso serian
 * diez peticiones, y si la septima falla las seis anteriores ya entraron sin
 * que nadie sepa cuales. El lote es todo o nada.
 *
 * `cantidad` es obligatoria en cada fila: el backend ya no le pone un 1 por
 * omisión. `reemplazaItemId` y `motivoBajaId` viajan siempre juntos o ninguno.
 *
 * @param {number} asignacionId
 * @param {Array<{itemId:number, cantidad:number, reemplazaItemId?:number, motivoBajaId?:number}>} items
 * @returns {Promise<Asignacion|null>}
 */
export const AgregarItemsAsignacion = async (asignacionId, items) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${DOTACION}/asignaciones/${asignacionId}/items/lote`,
      { items },
    );
    const asignacion = desenvolver(respuesta);
    return asignacion ? mapearAsignacion(asignacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo agregar los artículos");
  }
};

/**
 * Si un artículo del catálogo ya tiene una entrega vigente para este empleado.
 *
 * Se consulta al marcar el artículo en el selector, no de entrada para todo el
 * catálogo: con treinta y cinco artículos activos eso serían treinta y cinco
 * peticiones por cada carga de pantalla para un dato que la mayoría de las veces
 * no hace falta.
 *
 * @returns {Promise<{vigente:boolean, entregas:EntregaVigenteItem[]}>}
 */
export const ObtenerEntregaVigente = async (empleadoId, itemCatalogoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${DOTACION}/empleados/${empleadoId}/items/${itemCatalogoId}/vigente`,
      { signal },
    );
    const datos = desenvolver(respuesta);
    return {
      vigente: Boolean(datos?.vigente),
      entregas: (datos?.entregas ?? []).map((entrega) => ({
        ...entrega,
        asignacionItemId: numero(entrega.asignacionItemId),
        asignacionId: numero(entrega.asignacionId),
        fecha: soloFecha(entrega.fecha),
        fechaEntrega: soloFecha(entrega.fechaEntrega),
        cantidad: numero(entrega.cantidad),
      })),
    };
  } catch (error) {
    return propagar(error, "No se pudo consultar si el artículo ya tiene entrega vigente");
  }
};

export const MarcarItemAsignacion = async (asignacionId, itemId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(
      `${DOTACION}/asignaciones/${asignacionId}/items/${itemId}`,
      datos,
    );
    const asignacion = desenvolver(respuesta);
    return asignacion ? mapearAsignacion(asignacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el artículo");
  }
};

export const QuitarItemAsignacion = async (asignacionId, itemId) => {
  try {
    const respuesta = await axiosInstanceNew.delete(
      `${DOTACION}/asignaciones/${asignacionId}/items/${itemId}`,
    );
    const asignacion = desenvolver(respuesta);
    return asignacion ? mapearAsignacion(asignacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo quitar el artículo");
  }
};

export const EntregarTodoAsignacion = async (asignacionId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${DOTACION}/asignaciones/${asignacionId}/entregar-todo`,
      datos,
    );
    const asignacion = desenvolver(respuesta);
    return asignacion ? mapearAsignacion(asignacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo marcar la dotación como entregada");
  }
};

export const EliminarAsignacionDotacion = async (asignacionId) => {
  try {
    await axiosInstanceNew.delete(`${DOTACION}/asignaciones/${asignacionId}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar la dotación");
  }
};

/**
 * Avisa a los jefes de área.
 *
 * El endpoint responde 200 aunque algún envío falle: la acción se hizo y el
 * intento quedó registrado. Por eso se devuelve también el `message`, que resume
 * cuántos salieron y cuántos no, y la pantalla lo muestra tal cual.
 */
export const NotificarAsignacion = async (asignacionId, { forzar = false } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.post(
      `${DOTACION}/asignaciones/${asignacionId}/notificar`,
      { forzar },
    );
    const datos = desenvolver(respuesta);
    return {
      enviadas: (datos?.enviadas ?? []).map(mapearNotificacion),
      omitidas: datos?.omitidas ?? [],
      mensaje: respuesta?.data?.message ?? "",
    };
  } catch (error) {
    return propagar(error, "No se pudo enviar los avisos");
  }
};

export const ListarNotificacionesAsignacion = async (asignacionId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${DOTACION}/asignaciones/${asignacionId}/notificaciones`,
      { signal },
    );
    return (desenvolver(respuesta) ?? []).map(mapearNotificacion);
  } catch (error) {
    return propagar(error, "No se pudo obtener el historial de avisos");
  }
};

/**
 * Descarga el acta y arma un object URL para mostrarla en un <iframe>, dentro
 * de un modal de la misma pantalla (ver ModalVerActa.jsx y `abrirActa()` en
 * ColDotacion.jsx).
 *
 * NO es un `<a href>`/`window.open` directo al backend: esa ruta exige la
 * cabecera id-session que pone axiosInstanceNew (no hay cookie de sesión), y
 * un enlace directo no la manda — el mismo motivo por el que
 * DescargarArchivoDocumento va por blob.
 *
 * Quien llama es responsable de revocar el object URL con
 * `window.URL.revokeObjectURL(url)` cuando cierra el modal: acá no se revoca
 * solo porque, a diferencia de la pestaña nueva de antes, el iframe sigue
 * usando esa URL mientras el modal esté abierto.
 */
export const ObtenerUrlActaAsignacion = async (asignacionId) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${DOTACION}/asignaciones/${asignacionId}/acta`,
      { responseType: "blob" },
    );
    const blob = new Blob([respuesta.data], { type: "application/pdf" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    // Con responseType blob, el JSON de error también llega como blob (ver
    // leerErrorBlob más abajo: mismo problema que en DescargarArchivoDocumento).
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo abrir el acta");
  }
};

/**
 * Acta histórica: la MISMA dotación, pero con su estado de HOY (si algún
 * artículo se dio de baja después de imprimirla, acá ya sale así). A
 * diferencia de ObtenerUrlActaAsignacion, nunca sirve bytes guardados: se
 * genera de nuevo cada vez, por eso funciona incluso si la dotación nunca se
 * llegó a imprimir.
 */
export const ObtenerUrlActaHistorica = async (asignacionId) => {
  try {
    const respuesta = await axiosInstanceNew.get(
      `${DOTACION}/asignaciones/${asignacionId}/acta-historica`,
      { responseType: "blob" },
    );
    const blob = new Blob([respuesta.data], { type: "application/pdf" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo abrir el acta histórica");
  }
};

/**
 * Acta completa: el estado acumulado de TODAS las dotaciones del colaborador
 * (lo vigente de cada una, más una sección única de bajas de toda su
 * historia). `asignacionActualId` es opcional: si se manda, los artículos de
 * esa dotación salen marcados "(nueva)".
 */
export const ObtenerUrlActaCompleta = async (empleadoId, asignacionActualId) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOTACION}/empleados/${empleadoId}/acta-completa`, {
      params: asignacionActualId ? { asignacionActualId } : undefined,
      responseType: "blob",
    });
    const blob = new Blob([respuesta.data], { type: "application/pdf" });
    return window.URL.createObjectURL(blob);
  } catch (error) {
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo abrir el acta completa");
  }
};

// ── Cartera de crédito ──────────────────────────────────────────────────────

/**
 * Créditos de cartera de un colaborador.
 *
 * NO hay un "crear crédito": nace solo en el backend cuando un renglón de un
 * grupo `esMonetario` (ver ListarGruposDotacion) se marca como Entregado con
 * MarcarItemAsignacion. Esta sección solo lee esos créditos y registra o borra
 * abonos sobre ellos.
 */
const CARTERA = `${DOTACION}/cartera`;

/** @returns {Promise<CreditoCartera[]>} */
export const ObtenerCreditosCartera = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${CARTERA}/empleados/${empleadoId}`, { signal });
    return (desenvolver(respuesta) ?? []).map(mapearCreditoCartera);
  } catch (error) {
    return propagar(error, "No se pudo obtener los créditos de cartera del colaborador");
  }
};

/** @returns {Promise<CreditoCarteraDetalle|null>} */
export const ObtenerDetalleCreditoCartera = async (creditoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${CARTERA}/creditos/${creditoId}`, { signal });
    const detalle = desenvolver(respuesta);
    return detalle ? mapearCreditoCarteraDetalle(detalle) : null;
  } catch (error) {
    return propagar(error, "No se pudo obtener el detalle del crédito");
  }
};

/**
 * 409 si `monto` supera el `saldoPendiente`: el backend arma un mensaje legible
 * ("El abono de $X supera el saldo pendiente de $Y" o similar) y `propagar` lo
 * deja pasar tal cual en `error.message`; la pantalla lo muestra sin reescribirlo.
 *
 * @returns {Promise<CreditoCarteraDetalle|null>}
 */
export const RegistrarAbonoCartera = async (creditoId, { monto, fecha, observacion }) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${CARTERA}/creditos/${creditoId}/abonos`, {
      monto,
      fecha,
      observacion: observacion || null,
    });
    const detalle = desenvolver(respuesta);
    return detalle ? mapearCreditoCarteraDetalle(detalle) : null;
  } catch (error) {
    return propagar(error, "No se pudo registrar el abono");
  }
};

/** Borrado lógico de un abono mal registrado: el backend le devuelve el saldo al crédito. */
export const EliminarAbonoCartera = async (creditoId, abonoId, motivo) => {
  try {
    const respuesta = await axiosInstanceNew.delete(
      `${CARTERA}/creditos/${creditoId}/abonos/${abonoId}`,
      { data: { motivo } },
    );
    const detalle = desenvolver(respuesta);
    return detalle ? mapearCreditoCarteraDetalle(detalle) : null;
  } catch (error) {
    return propagar(error, "No se pudo eliminar el abono");
  }
};

// ── Motivos de baja ─────────────────────────────────────────────────────────

const MOTIVOS_BAJA = `${DOTACION}/motivos-baja`;

/** @returns {Promise<MotivoBaja[]>} */
export const ObtenerMotivosBaja = async ({ soloActivos, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(MOTIVOS_BAJA, {
      params: soloConValor({ soloActivos: soloActivos ? "true" : undefined }),
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearMotivoBaja);
  } catch (error) {
    return propagar(error, "No se pudo obtener los motivos de baja");
  }
};

export const CrearMotivoBaja = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(MOTIVOS_BAJA, datos);
    const motivo = desenvolver(respuesta);
    return motivo ? mapearMotivoBaja(motivo) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el motivo de baja");
  }
};

export const ActualizarMotivoBaja = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${MOTIVOS_BAJA}/${id}`, datos);
    const motivo = desenvolver(respuesta);
    return motivo ? mapearMotivoBaja(motivo) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el motivo de baja");
  }
};

/** 409 si el motivo ya está en uso: no se puede borrar, solo desactivar. */
export const EliminarMotivoBaja = async (id) => {
  try {
    await axiosInstanceNew.delete(`${MOTIVOS_BAJA}/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el motivo de baja");
  }
};

// ── Tipos de documento ──────────────────────────────────────────────────────

export const ListarTiposDocumento = async ({ soloActivos, signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOCUMENTOS}/tipos`, {
      params: soloConValor({ soloActivos: soloActivos ? "true" : undefined }),
      signal,
    });
    return (desenvolver(respuesta) ?? []).map(mapearTipoDocumento);
  } catch (error) {
    return propagar(error, "No se pudo obtener los tipos de documento");
  }
};

export const CrearTipoDocumento = async (datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${DOCUMENTOS}/tipos`, datos);
    const tipo = desenvolver(respuesta);
    return tipo ? mapearTipoDocumento(tipo) : null;
  } catch (error) {
    return propagar(error, "No se pudo crear el tipo de documento");
  }
};

export const ActualizarTipoDocumento = async (id, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${DOCUMENTOS}/tipos/${id}`, datos);
    const tipo = desenvolver(respuesta);
    return tipo ? mapearTipoDocumento(tipo) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el tipo de documento");
  }
};

export const EliminarTipoDocumento = async (id) => {
  try {
    await axiosInstanceNew.delete(`${DOCUMENTOS}/tipos/${id}`);
  } catch (error) {
    propagar(error, "No se pudo eliminar el tipo de documento");
  }
};

// ── Documentación de un colaborador ─────────────────────────────────────────

export const ObtenerDocumentacionEmpleado = async (empleadoId, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${DOCUMENTOS}/empleados/${empleadoId}`, { signal });
    const datos = desenvolver(respuesta);
    return datos ? mapearDocumentacion(datos) : null;
  } catch (error) {
    return propagar(error, "No se pudo obtener la documentación del colaborador");
  }
};

export const CrearDocumentoEmpleado = async (empleadoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.post(`${DOCUMENTOS}/empleados/${empleadoId}`, datos);
    const documentacion = desenvolver(respuesta);
    return documentacion ? mapearDocumentacion(documentacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo registrar el documento");
  }
};

export const ActualizarDocumentoEmpleado = async (documentoId, datos) => {
  try {
    const respuesta = await axiosInstanceNew.put(`${DOCUMENTOS}/${documentoId}`, datos);
    const documentacion = desenvolver(respuesta);
    return documentacion ? mapearDocumentacion(documentacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo actualizar el documento");
  }
};

export const EliminarDocumentoEmpleado = async (documentoId) => {
  try {
    const respuesta = await axiosInstanceNew.delete(`${DOCUMENTOS}/${documentoId}`);
    const documentacion = desenvolver(respuesta);
    return documentacion ? mapearDocumentacion(documentacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo eliminar el documento");
  }
};

/**
 * Sube o reemplaza el archivo de un documento.
 *
 * OJO: NO se fija Content-Type a mano. Axios lo pone con el boundary que genera
 * FormData; escribirlo aparte deja el boundary fuera y el backend recibe un
 * multipart que no puede parsear.
 */
export const SubirArchivoDocumento = async (documentoId, archivo, { fechaEntrega } = {}) => {
  try {
    const cuerpo = new FormData();
    cuerpo.append("archivo", archivo);
    if (fechaEntrega) cuerpo.append("fechaEntrega", fechaEntrega);

    const respuesta = await axiosInstanceNew.post(
      `${DOCUMENTOS}/${documentoId}/archivo`,
      cuerpo,
    );
    const documentacion = desenvolver(respuesta);
    return documentacion ? mapearDocumentacion(documentacion) : null;
  } catch (error) {
    return propagar(error, "No se pudo subir el archivo");
  }
};

/**
 * Descarga el archivo y dispara el guardado en el navegador.
 *
 * Va por blob y no por un enlace directo porque el objeto NO es público: la
 * descarga pasa por el API, que verifica el permiso con la cabecera id-session
 * que agrega axiosInstanceNew. Un <a href> no llevaría esa cabecera.
 *
 * El object URL se revoca siempre: sin eso el blob queda en memoria hasta
 * recargar la página, y son archivos de varios MB.
 */
export const DescargarArchivoDocumento = async (documentoId, { version, nombre } = {}) => {
  let url = null;

  try {
    const respuesta = await axiosInstanceNew.get(`${DOCUMENTOS}/${documentoId}/archivo`, {
      params: soloConValor({ version }),
      responseType: "blob",
    });

    url = window.URL.createObjectURL(respuesta.data);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre || `documento-${documentoId}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  } catch (error) {
    // Con responseType blob, el JSON de error también llega como blob, así que el
    // message del backend no está en error.response.data: hay que leerlo.
    const mensaje = await leerErrorBlob(error);
    throw new Error(mensaje || "No se pudo descargar el archivo");
  } finally {
    if (url) window.URL.revokeObjectURL(url);
  }
};

const leerErrorBlob = async (error) => {
  const datos = error?.response?.data;
  if (!(datos instanceof Blob)) return mensajeDeError(error, null);

  try {
    const texto = await datos.text();
    return JSON.parse(texto)?.message ?? null;
  } catch {
    return null;
  }
};
