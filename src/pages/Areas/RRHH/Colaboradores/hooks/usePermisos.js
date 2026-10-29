import { useMemo } from "react";
import { useAuthContext } from "context/authContext";
import { puedeEditarRecurso } from "utils/permisosRecurso";

/**
 * Un solo recurso para Colaboradores: `rrhh.colaboradores`. La acción efectiva
 * sobre ese recurso -la del rol, o la de "Sobrescribir Permisos" si el contexto
 * la trae, desde "Asignaciones importantes"- decide el nivel:
 *
 *   "editar"      -> gestión completa (crear, editar, dar de baja, reingresar,
 *                     eliminar y abrir la ficha)
 *   sin "editar"  -> solo el listado de colaboradores activos
 *
 * Es el mismo patrón que ya usa `MDM_Crud/Clientes.jsx` con
 * `puedeEditarRecurso(user, "mdm.clientes")`. Antes Colaboradores no miraba la
 * acción: solo comprobaba si el usuario tenía el recurso, lo que obligaba a
 * inventar un segundo recurso (`rrhh.colaboradores.consulta`) para el nivel de
 * consulta en vez de usar "Sobrescribir Permisos" como el resto del sistema.
 *
 * ── ESTO ES UX, NO SEGURIDAD ────────────────────────────────────────────────
 * Esconder un botón no impide que alguien haga la petición a mano. Quien de
 * verdad decide es el backend, en src/config/permisosRrhh.ts, que aplica la misma
 * regla y responde 403. Si las dos reglas divergen, la pantalla mostraría
 * acciones que el API va a rechazar; por eso el listado además recibe
 * `puedeGestionar` del servidor y ése es el que manda.
 */
export const RECURSO_GESTION = "rrhh.colaboradores";

export function usePermisosColaboradores() {
  const { user } = useAuthContext();

  return useMemo(() => {
    const puedeGestionar = puedeEditarRecurso(user, RECURSO_GESTION);

    return {
      /** Crear, editar, dar de baja, reingresar, eliminar y abrir la ficha. */
      puedeGestionar,
      /** Solo el listado de colaboradores activos. */
      soloConsulta: !puedeGestionar,
    };
  }, [user]);
}

export default usePermisosColaboradores;
