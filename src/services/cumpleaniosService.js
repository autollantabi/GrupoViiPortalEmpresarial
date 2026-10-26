import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Avisos de cumpleaños (RRHH).
 *
 * Habla con /api/v1/rrhh/cumpleanios. Archivo aparte de dotacionService.js
 * porque es otro submódulo: ese cubre qué se le entrega a la gente, este a quién
 * se le felicita.
 *
 * Mismas convenciones que los otros dos servicios del módulo: es el único sitio
 * donde se desenvuelve { status, message, data }, y un error de red se vuelve un
 * Error con el `message` del backend, que está escrito para mostrarse tal cual.
 *
 * @typedef {"Anticipado"|"Mensual"|"Saludo"} TipoAvisoCumpleanios
 *
 * @typedef {Object} Cumpleanero
 * @property {number} personaId
 * @property {string|null} cedula
 * @property {string} nombre
 * @property {string} fechaNacimiento
 * @property {number} dia
 * @property {number} mes
 * @property {string|null} cargo
 * @property {string} empresa
 * @property {string[]} correos  Los corporativos de sus fichas activas
 *
 * @typedef {Object} VistaPreviaCumpleanios
 * @property {TipoAvisoCumpleanios} tipo
 * @property {string} fechaObjetivo
 * @property {number} diasAnticipacion
 * @property {string} asunto
 * @property {string} cuerpo  HTML completo del correo
 * @property {number} cantidadPersonas
 * @property {Cumpleanero[]} personas
 * @property {string[]} destinatarios
 * @property {string[]} adjuntos  Las imágenes que van incrustadas
 * @property {string|null} aviso  Por qué esta vista previa no es un envío real
 *
 * @typedef {Object} ResultadoAvisoCumpleanios
 * @property {TipoAvisoCumpleanios} tipo
 * @property {string} fechaObjetivo
 * @property {number} diasAnticipacion
 * @property {number} cantidadPersonas
 * @property {string[]} destinatarios
 * @property {boolean} enviado
 * @property {string} mensaje
 * @property {string} [persona]
 */

const CUMPLEANIOS = "/rrhh/cumpleanios";

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

/**
 * El correo armado, sin enviarlo.
 *
 * OJO al pintar `cuerpo`: las imágenes van como adjuntos "cid:", que solo
 * resuelve un cliente de correo, así que en el navegador salen rotas. Por eso la
 * respuesta trae `adjuntos` aparte — hay que decírselo al usuario o va a creer
 * que el diseño está mal.
 *
 * @param {{ tipo: TipoAvisoCumpleanios, fecha?: string, dias?: number }} opciones
 * @returns {Promise<VistaPreviaCumpleanios>}
 */
export const VistaPreviaCumpleanios = async ({ tipo, fecha, dias }, { signal } = {}) => {
  try {
    const params = { tipo };
    if (fecha) params.fecha = fecha;
    if (dias !== undefined && dias !== null) params.dias = dias;

    const respuesta = await axiosInstanceNew.get(`${CUMPLEANIOS}/vista-previa`, {
      params,
      signal,
    });

    return desenvolver(respuesta);
  } catch (error) {
    return propagar(error, "No se pudo generar la vista previa");
  }
};

/**
 * Manda los avisos.
 *
 * Contesta 200 aunque no se envíe nada: cada renglón trae `enviado` y el motivo.
 * Un aviso que ya salió no se repite salvo `forzar`.
 *
 * `destinatariosPrueba` desvía TODO a esos correos en lugar de a los de verdad, y
 * es como se revisa el saludo sin escribirle a 184 personas.
 *
 * @returns {Promise<ResultadoAvisoCumpleanios[]>}
 */
export const EjecutarCumpleanios = async ({
  hoy,
  tipos,
  forzar = false,
  destinatariosPrueba,
} = {}) => {
  try {
    const cuerpo = { forzar };
    if (hoy) cuerpo.hoy = hoy;
    if (tipos?.length) cuerpo.tipos = tipos;
    if (destinatariosPrueba) cuerpo.destinatariosPrueba = destinatariosPrueba;

    const respuesta = await axiosInstanceNew.post(`${CUMPLEANIOS}/ejecutar`, cuerpo);

    return desenvolver(respuesta) ?? [];
  } catch (error) {
    return propagar(error, "No se pudieron enviar los avisos");
  }
};

/** Los últimos envíos, exitosos y fallidos. */
export const HistorialCumpleanios = async ({ cantidad = 30 } = {}, { signal } = {}) => {
  try {
    const respuesta = await axiosInstanceNew.get(`${CUMPLEANIOS}/historial`, {
      params: { cantidad },
      signal,
    });

    return desenvolver(respuesta) ?? [];
  } catch (error) {
    return propagar(error, "No se pudo obtener el historial");
  }
};
