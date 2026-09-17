import { useState, useEffect } from "react";

export const MOBILE_BREAKPOINT = 1024;

/**
 * Detecta si el viewport actual está por debajo del breakpoint móvil/tablet.
 * Se suscribe a cambios de tamaño (rotación, resize) via matchMedia.
 */
export const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= breakpoint
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handleChange = (e) => setIsMobile(e.matches);

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
