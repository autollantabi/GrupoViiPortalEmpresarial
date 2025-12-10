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

export const hexToRGBA = ({hex, alpha = 1}) => {
  // Elimina el "#" si está presente
  hex = hex.replace(/^#/, "");

  // Si el formato es corto (#FFF), lo expandimos a (#FFFFFF)
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Convertimos el HEX a RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Retornamos el color en formato RGBA
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
