import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hooks de carga de la sección Colaboradores.
 *
 * Son locales a la feature y no globales porque `src/hooks/` no existe en este
 * proyecto (el alias sí está declarado en vite.config.js, la carpeta no) y
 * ninguna otra área usa este patrón todavía. Si mañana otra lo quiere, se
 * promueve moviendo el archivo.
 *
 * El patrón se necesita una docena de veces en estas cinco pantallas —el
 * formulario solo dispara cinco catálogos— así que inlinearlo sería copiar el
 * mismo useEffect doce veces.
 */

/**
 * Ejecuta una consulta y expone { datos, cargando, error, recargar }.
 *
 * `fn` recibe { signal } para poder cancelar de verdad: se pasa a axios y una
 * cancelación produce code "ERR_CANCELED", que NO coincide con los códigos que
 * disparan el reintento con backoff del interceptor de axiosConfig, así que no
 * genera peticiones fantasma.
 *
 * El flag `cancelado` es lo que protege los setState, y hace falta aparte del
 * AbortController porque StrictMode monta y desmonta cada efecto dos veces en
 * desarrollo.
 */
export function useConsulta(fn, deps = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  // La función se guarda en un ref para que un cambio de closure no vuelva a
  // disparar la consulta: lo único que la dispara son las deps y recargar().
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let cancelado = false;
    const controlador = new AbortController();

    setCargando(true);
    setError(null);

    fnRef
      .current({ signal: controlador.signal })
      .then((resultado) => {
        if (!cancelado) setDatos(resultado);
      })
      .catch((e) => {
        if (cancelado || e?.code === "ERR_CANCELED" || e?.name === "CanceledError") return;
        setError(e?.message || "No se pudo completar la consulta");
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
      controlador.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return { datos, cargando, error, recargar };
}

/**
 * Retrasa el valor hasta que deja de cambiar por `ms`. Lo usa el buscador del
 * listado para no disparar una petición por tecla.
 */
export function useDebounce(valor, ms = 350) {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);

  return retrasado;
}
