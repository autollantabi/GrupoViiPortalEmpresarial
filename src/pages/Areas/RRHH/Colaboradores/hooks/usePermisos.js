import { useMemo } from "react";
import { useAuthContext } from "context/authContext";
import { hasAccessToResource } from "utils/permissionsValidator";

/**
 * Los dos niveles de acceso de Colaboradores.
 *
 *   rrhh.colaboradores           -> gestión completa (Recursos Humanos)
 *   rrhh.colaboradores.consulta  -> solo lectura del listado de activos
 *
 * Quien tenga el recurso raíz `rrhh` obtiene la gestión por herencia de prefijo.
 * Quien tenga SOLO `rrhh.colaboradores.consulta` no la obtiene, porque la
 * herencia va de padre a hijo y nunca al revés.
 *
 * Es el mismo patrón que usa XCoin con xcoin.admin / xcoin.viewer.
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
    const contextos = user?.data ?? [];
    const puedeGestionar = hasAccessToResource(contextos, RECURSO_GESTION);

    return {
      /** Crear, editar, dar de baja, reingresar, eliminar y abrir la ficha. */
      puedeGestionar,
      /** Solo el listado de colaboradores activos. */
      soloConsulta: !puedeGestionar,
    };
  }, [user]);
}

export default usePermisosColaboradores;
