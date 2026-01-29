const getCSSVariable = (variable) =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

export const getColors = () => ({
  primary: getCSSVariable("--primary"),
  secondary: getCSSVariable("--secondary"),
  error: getCSSVariable("--error"),
  success: getCSSVariable("--success"),
  warning: getCSSVariable("--warning"),
  info: getCSSVariable("--info"),

  white: getCSSVariable("--white"),
  black: getCSSVariable("--black"),
  gray: getCSSVariable("--gray"),

  background: getCSSVariable("--background"),
  boxShadow: getCSSVariable("--box-shadow"),

  textPrimary: getCSSVariable("--text-primary"),
  textSecondary: getCSSVariable("--text-secondary"),
  placeholder: getCSSVariable("--placeholder"),
});

// Función helper para convertir color a hex
const colorToHex = (color) => {
  if (!color) return "#999";
  
  const colorStr = String(color).trim();
  
  // Si ya es hex, retornarlo
  if (colorStr.startsWith("#")) {
    return colorStr;
  }
  
  // Si es rgba o rgb, extraer RGB y convertir a hex
  const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  
  return "#999";
};

export const hexToRGBA = ({hex, alpha = 1}) => {
  // Si el color ya viene como rgba, extraer el RGB y aplicar el nuevo alpha
  if (typeof hex === "string" && hex.startsWith("rgba")) {
    const rgbaMatch = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  
  // Si viene como rgb, también manejarlo
  if (typeof hex === "string" && hex.startsWith("rgb")) {
    const rgbMatch = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  
  // Convertir a hex si es necesario
  const hexColor = colorToHex(hex);
  
  // Elimina el "#" si está presente
  let hexValue = hexColor.replace(/^#/, "");

  // Si el formato es corto (#FFF), lo expandimos a (#FFFFFF)
  if (hexValue.length === 3) {
    hexValue = hexValue
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Convertimos el HEX a RGB
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);

  // Retornamos el color en formato RGBA
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
