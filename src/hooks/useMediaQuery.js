import { useEffect, useState } from "react";

/**
 * true mientras el viewport cumple la media query (p. ej. "(max-width: 640px)").
 * Se suscribe a cambios (rotación, resize) via matchMedia.
 */
export const useMediaQuery = (query) => {
  const [coincide, setCoincide] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const alCambiar = (e) => setCoincide(e.matches);

    setCoincide(mediaQuery.matches);
    mediaQuery.addEventListener("change", alCambiar);
    return () => mediaQuery.removeEventListener("change", alCambiar);
  }, [query]);

  return coincide;
};

export default useMediaQuery;
