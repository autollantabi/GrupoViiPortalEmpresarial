/**
 * Utilidades para validar permisos basados en recursos con notación de puntos
 * Ejemplo: "importaciones", "importaciones.compras", "importaciones.compras.reportes"
 *
 * Lógica de permisos:
 * - Si tengo permiso a "importaciones", puedo acceder a "importaciones.*" (todo lo que empiece con "importaciones.")
 * - Si tengo permiso a "importaciones.compras", puedo acceder a "importaciones.compras.*"
 * - Los recursos bloqueados impiden el acceso incluso si tengo el permiso padre
 *
 * Funciones exportadas:
 * - hasAccessToResource(userContexts, recurso)
 * - getAvailableCompanies(userContexts, recurso, empresasGlobales?)
 * - getAvailableLines(userContexts, recurso, lineasGlobales?)
 * - getAvailableCanales(userContexts, recurso) — canales desde ALCANCE.CANALES (ej. TODOS, B2B, B2C)
 */

/**
 * Verifica si un recurso está bloqueado
 * @param {Array|string|null} recursosBloqueados - Array de recursos bloqueados, string JSON, o null
 * @param {string} recurso - Recurso a verificar
 * @returns {boolean}
 */
function isResourceBlocked(recursosBloqueados, recurso) {
  // Si es null, undefined, o string vacío, no hay bloqueos
  if (!recursosBloqueados || recursosBloqueados === "" || recursosBloqueados === "[]") {
    return false;
  }
  
  // Si es un string, intentar parsearlo como JSON
  let bloqueadosArray = [];
  if (typeof recursosBloqueados === 'string') {
    try {
      bloqueadosArray = JSON.parse(recursosBloqueados);
    } catch (e) {
      // Si no se puede parsear, tratar como array vacío
      return false;
    }
  } else if (Array.isArray(recursosBloqueados)) {
    bloqueadosArray = recursosBloqueados;
  } else {
    return false;
  }
  
  if (!Array.isArray(bloqueadosArray) || bloqueadosArray.length === 0) {
    return false;
  }
  
  const targetResource = recurso?.toLowerCase()?.trim();
  if (!targetResource) return false;
  
  return bloqueadosArray.some(
    (bloqueado) => {
      // Puede ser un objeto con .resource o directamente un string
      const bloqueadoResource = (typeof bloqueado === 'string' 
        ? bloqueado 
        : bloqueado.resource)?.toLowerCase()?.trim();
      
      if (!bloqueadoResource) return false;
      
      // Si coincide exactamente o el recurso es un hijo del bloqueado
      return bloqueadoResource === targetResource || 
             targetResource.startsWith(bloqueadoResource + ".");
    }
  );
}

/**
 * Verifica si el usuario tiene acceso a un recurso específico
 * La lógica es: si tengo permiso a "importaciones", puedo acceder a "importaciones.*"
 * @param {Array} userContexts - Array de contextos del usuario (viene de user.data)
 * @param {string} recurso - Recurso a verificar (ej: "importaciones", "importaciones.compras.reportes")
 * @returns {boolean}
 */
export function hasAccessToResource(userContexts, recurso) {
  if (!userContexts || !Array.isArray(userContexts) || userContexts.length === 0) {
    return false;
  }

  if (!recurso) return false;

  const targetResource = recurso.toLowerCase().trim();

  // Buscar si algún contexto tiene acceso al recurso
  for (const context of userContexts) {
    const contextResource = context.RECURSO?.toLowerCase()?.trim();

    if (!contextResource) continue;

    // Verificar si el recurso está bloqueado en este contexto
    // La nueva estructura usa BLOQUEADO (string JSON, string vacío, o null), la antigua usa RECURSOS_BLOQUEADOS (array)
    const recursosBloqueados = context.RECURSOS_BLOQUEADOS || context.BLOQUEADO || null;
    
    if (isResourceBlocked(recursosBloqueados, targetResource)) {
      continue; // Este contexto tiene este recurso bloqueado, pasar al siguiente
    }

    // Si el recurso coincide exactamente
    if (contextResource === targetResource) {
      return true;
    }

    // Si el recurso es un hijo del contexto (ej: tengo "importaciones" y quiero "importaciones.compras")
    // Verificar si HERENCIA está activa (siempre debería estar en el nuevo sistema, pero verificamos por si acaso)
    const hasInheritance = context.HERENCIA !== false; // Si HERENCIA no está definida o es true, está activa
    
    if (hasInheritance && targetResource.startsWith(contextResource + ".")) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene las empresas disponibles para un recurso específico
 * @param {Array} userContexts - Array de contextos del usuario
 * @param {string} recurso - Recurso a verificar
 * @returns {Array} Array de objetos { id: number, nombre: string }
 */
export function getAvailableCompanies(userContexts, recurso, empresasGlobales = null) {
  if (!userContexts || !Array.isArray(userContexts) || userContexts.length === 0) {
    return [];
  }

  if (!recurso) return [];

  const companies = new Map();
  const targetResource = recurso.toLowerCase().trim();

  for (const context of userContexts) {
    const contextResource = context.RECURSO?.toLowerCase()?.trim();

    if (!contextResource) continue;

    // Verificar si tiene acceso a este recurso
    const hasAccess =
      contextResource === targetResource ||
      targetResource.startsWith(contextResource + ".");

    if (hasAccess && !isResourceBlocked(context.RECURSOS_BLOQUEADOS || context.BLOQUEADO, targetResource)) {
      // Agregar empresas del alcance
      // Usar empresasGlobales si están disponibles (nueva estructura), sino usar context.EMPRESAS (estructura antigua)
      const empresasMap = empresasGlobales || context.EMPRESAS || {};
      
      if (context.ALCANCE?.EMPRESAS && Array.isArray(context.ALCANCE.EMPRESAS)) {
        context.ALCANCE.EMPRESAS.forEach((empresaId) => {
          const empresaNombre = empresasMap[empresaId.toString()];
          if (empresaNombre && !companies.has(empresaId)) {
            companies.set(empresaId, {
              id: empresaId,
              nombre: empresaNombre,
            });
          }
        });
      }
    }
  }

  return Array.from(companies.values());
}

/**
 * Obtiene las líneas disponibles para un recurso específico
 * @param {Array} userContexts - Array de contextos del usuario
 * @param {string} recurso - Recurso a verificar
 * @returns {Array} Array de objetos { id: number, nombre: string }
 */
export function getAvailableLines(userContexts, recurso, lineasGlobales = null) {
  if (!userContexts || !Array.isArray(userContexts) || userContexts.length === 0) {
    return [];
  }

  if (!recurso) return [];

  const lines = new Map();
  const targetResource = recurso.toLowerCase().trim();

  for (const context of userContexts) {
    const contextResource = context.RECURSO?.toLowerCase()?.trim();

    if (!contextResource) continue;

    // Verificar si tiene acceso a este recurso
    const hasAccess =
      contextResource === targetResource ||
      targetResource.startsWith(contextResource + ".");

    if (hasAccess && !isResourceBlocked(context.RECURSOS_BLOQUEADOS || context.BLOQUEADO, targetResource)) {
      // Agregar líneas del alcance
      // Usar lineasGlobales si están disponibles (nueva estructura), sino usar context.LINEAS (estructura antigua)
      const lineasMap = lineasGlobales || context.LINEAS || {};
      
      if (context.ALCANCE?.LINEAS && Array.isArray(context.ALCANCE.LINEAS)) {
        context.ALCANCE.LINEAS.forEach((lineaId) => {
          const lineaNombre = lineasMap[lineaId.toString()];
          if (lineaNombre && !lines.has(lineaId)) {
            lines.set(lineaId, {
              id: lineaId,
              nombre: lineaNombre,
            });
          }
        });
      }
    }
  }

  return Array.from(lines.values());
}

/**
 * Obtiene los canales disponibles para un recurso específico (desde ALCANCE.CANALES)
 * @param {Array} userContexts - Array de contextos del usuario
 * @param {string} recurso - Recurso a verificar
 * @returns {Array<string>} Array de códigos de canal (ej. ["TODOS", "B2B", "B2C"])
 */
export function getAvailableCanales(userContexts, recurso) {
  if (!userContexts || !Array.isArray(userContexts) || userContexts.length === 0) {
    return [];
  }
  console.log("userContexts", userContexts);

  if (!recurso) return [];

  const canales = new Set();
  const targetResource = recurso.toLowerCase().trim();

  for (const context of userContexts) {
    const contextResource = context.RECURSO?.toLowerCase()?.trim();

    if (!contextResource) continue;

    const hasAccess =
      contextResource === targetResource ||
      targetResource.startsWith(contextResource + ".");

    if (hasAccess && !isResourceBlocked(context.RECURSOS_BLOQUEADOS || context.BLOQUEADO, targetResource)) {
      const alcance = typeof context.ALCANCE === "string"
        ? (() => { try { return JSON.parse(context.ALCANCE); } catch { return {}; } })()
        : (context.ALCANCE || {});

      const canalesAlcance = alcance.canales || alcance.CANALES;
      if (Array.isArray(canalesAlcance) && canalesAlcance.length > 0) {
        canalesAlcance.forEach((c) => canales.add(c));
      }
    }
  }

  return Array.from(canales);
}
