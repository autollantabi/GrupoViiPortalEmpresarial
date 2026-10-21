/**
 * Permisos de acción (ver, editar...) del usuario sobre un recurso del portal.
 *
 * De dónde salen (todo viene en `user`, que llena /auth/me al iniciar sesión):
 *  - user.CONTEXTOS: una fila de usuarios_rol_contexto por cada recurso al que tiene
 *    acceso: RECURSO, ID_ROL, ALCANCE (empresas), BLOQUEADO y, si se configuró,
 *    SOBRE_ESCRIBIR_PERMISOS (ids de permisos que REEMPLAZAN a los del rol).
 *  - user.ROLES: cada rol con sus PERMISOS_ROL ({ ID_PERMISO, NOMBRE_ACCION }).
 *  - user.PERMISOS: catálogo { "2": "editar", ... } (tabla `permisos`).
 *  - user.EMPRESAS: { "1": "AUTOLLANTA", ... } para traducir los ids del alcance.
 *
 * Regla: el permiso efectivo de un contexto son sus SOBRE_ESCRIBIR_PERMISOS si los
 * tiene; si no, los de su rol. El contexto aplica si su recurso es el pedido o un
 * padre con herencia ("mdm" cubre "mdm.clientes"), salvo que esté bloqueado.
 *
 * La pantalla solo usa esto para mostrar u ocultar botones: quien manda es el
 * backend, que vuelve a comprobar el permiso al ejecutar la acción.
 */

export const ACCION_EDITAR = "editar";

const normalizar = (valor) => String(valor ?? "").toLowerCase().trim();

const aLista = (valor) => {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === "string") {
    try {
      const parseado = JSON.parse(valor);
      return Array.isArray(parseado) ? parseado : [];
    } catch {
      return valor
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const estaBloqueado = (contexto, objetivo) =>
  aLista(contexto.RECURSOS_BLOQUEADOS || contexto.BLOQUEADO).some((b) => {
    const recurso = normalizar(typeof b === "string" ? b : b?.resource);
    return recurso && (recurso === objetivo || objetivo.startsWith(`${recurso}.`));
  });

const cubreRecurso = (contexto, recurso) => {
  const propio = normalizar(contexto.RECURSO);
  const objetivo = normalizar(recurso);
  if (!propio || !objetivo || estaBloqueado(contexto, objetivo)) return false;
  if (propio === objetivo) return true;
  return contexto.HERENCIA !== false && objetivo.startsWith(`${propio}.`);
};

const alcance = (contexto) => {
  const valor = contexto.ALCANCE;
  if (!valor) return {};
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return {};
  }
};

const cubreEmpresa = (user, contexto, empresa) => {
  const ids = alcance(contexto).EMPRESAS;
  if (!Array.isArray(ids) || ids.length === 0 || !empresa) return true;

  const nombres = ids.map((id) => normalizar(user?.EMPRESAS?.[id]));
  return nombres.includes(normalizar(empresa));
};

const accionesDelContexto = (user, contexto) => {
  const sobreescritos = aLista(contexto.SOBRE_ESCRIBIR_PERMISOS);

  if (sobreescritos.length > 0) {
    return sobreescritos.map((id) => normalizar(user?.PERMISOS?.[id]));
  }

  const rol = (user?.ROLES || []).find((r) => r.ID_ROL === contexto.ID_ROL);
  return (rol?.PERMISOS_ROL || []).map((p) => normalizar(p.NOMBRE_ACCION));
};

/**
 * ¿Tiene el usuario la acción sobre el recurso? `empresa` es opcional: si se da, el
 * contexto también tiene que cubrirla en su alcance.
 */
export function tienePermisoEnRecurso(user, recurso, accion, empresa = null) {
  const contextos = Array.isArray(user?.CONTEXTOS) ? user.CONTEXTOS : [];
  const buscada = normalizar(accion);

  return contextos.some(
    (contexto) =>
      cubreRecurso(contexto, recurso) &&
      cubreEmpresa(user, contexto, empresa) &&
      accionesDelContexto(user, contexto).includes(buscada)
  );
}

export const puedeEditarRecurso = (user, recurso, empresa = null) =>
  tienePermisoEnRecurso(user, recurso, ACCION_EDITAR, empresa);
