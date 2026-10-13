import { useEffect, useState } from "react";

/**
 * Devuelve `value` solo después de que deja de cambiar durante `delay` ms.
 * Sirve para simular "el usuario terminó de escribir" antes de disparar una consulta.
 */
export const useDebouncedValue = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
};
