import { useState, useEffect } from "react";

export const MOBILE_BREAKPOINT = 1024;

/**
 * Móvil/tablet: viewport angosto o dispositivo táctil sin hover
 * (cubre tablets grandes en horizontal, como iPad Pro, que superan el breakpoint).
 */
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px), (hover: none) and (pointer: coarse)`;

export const getIsMobile = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;

/**
 * Detecta si el dispositivo actual es móvil/tablet.
 * Se suscribe a cambios (rotación, resize) via matchMedia.
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
};

export default useIsMobile;
