import React from "react";
import * as FaIcons from "react-icons/fa";
import * as BiIcons from "react-icons/bi";
import * as HiIcons from "react-icons/hi";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";
import * as TiIcons from "react-icons/ti";
import * as WiIcons from "react-icons/wi";
import * as GiIcons from "react-icons/gi";
import * as SiIcons from "react-icons/si";
import * as CgIcons from "react-icons/cg";
import * as VscIcons from "react-icons/vsc";
import * as BsIcons from "react-icons/bs";
import * as AiIcons from "react-icons/ai";
import * as ImIcons from "react-icons/im";
import * as FiIcons from "react-icons/fi";
import * as RiIcons from "react-icons/ri";
import * as TbIcons from "react-icons/tb";
import * as LuIcons from "react-icons/lu";
import * as PiIcons from "react-icons/pi";
import * as CiIcons from "react-icons/ci";
import * as DiIcons from "react-icons/di";
import * as GrIcons from "react-icons/gr";
import * as GoIcons from "react-icons/go";

// Mapeo de prefijos a librerías de iconos
const iconLibraries = {
  Fa: FaIcons,
  Bi: BiIcons,
  Hi: HiIcons,
  Md: MdIcons,
  Io: IoIcons,
  Ti: TiIcons,
  Wi: WiIcons,
  Gi: GiIcons,
  Si: SiIcons,
  Cg: CgIcons,
  Vsc: VscIcons,
  Bs: BsIcons,
  Ai: AiIcons,
  Im: ImIcons,
  Fi: FiIcons,
  Ri: RiIcons,
  Tb: TbIcons,
  Lu: LuIcons,
  Pi: PiIcons,
  Ci: CiIcons,
  Di: DiIcons,
  Gr: GrIcons,
  Go: GoIcons,
};

/**
 * Componente CustomIcons para renderizar iconos de múltiples librerías de react-icons
 * @param {string} name - Nombre del icono (ej: "FaHome", "BiDownload", "MdDelete")
 * @param {number} size - Tamaño del icono en píxeles
 * @param {string} color - Color del icono (hex, rgb, nombre de color)
 * @param {string} className - Clases CSS adicionales
 * @param {object} style - Estilos inline adicionales
 * @param {function} onClick - Función de click (opcional)
 * @param {string} title - Tooltip del icono
 * @param {boolean} disabled - Si el icono está deshabilitado
 */
export const CustomIcon = ({
  name,
  size = 16,
  color,
  className = "",
  style = {},
  onClick,
  title,
  disabled = false,
}) => {
  const renderIcon = () => {
    if (!name) {
      console.warn("CustomIcon: No se proporcionó un nombre de icono");
      return null;
    }

    // Extraer el prefijo del nombre del icono (primeras 2 letras)
    const prefix = name.substring(0, 2);
    const iconLibrary = iconLibraries[prefix];

    if (!iconLibrary) {
      console.warn(`CustomIcon: Librería de iconos no encontrada para el prefijo "${prefix}"`);
      return null;
    }

    const IconComponent = iconLibrary[name];
    if (!IconComponent) {
      console.warn(`CustomIcon: Icono "${name}" no encontrado en la librería ${prefix}`);
      return null;
    }

    const iconStyle = {
      color: color,
      cursor: onClick && !disabled ? "pointer" : "default",
      opacity: disabled ? 0.5 : 1,
      ...style,
    };

    return (
      <IconComponent
        size={size}
        className={className}
        style={iconStyle}
        onClick={onClick && !disabled ? onClick : undefined}
        title={title}
      />
    );
  };

  return renderIcon();
};

/**
 * Hook personalizado para obtener un icono específico
 * @param {string} name - Nombre del icono
 * @returns {React.Component|null} - Componente del icono o null si no se encuentra
 */
export const useIcon = (name) => {
  if (!name) return null;

  const prefix = name.substring(0, 2);
  const iconLibrary = iconLibraries[prefix];

  if (!iconLibrary) {
    console.warn(`useIcon: Librería de iconos no encontrada para el prefijo "${prefix}"`);
    return null;
  }

  return iconLibrary[name] || null;
};

/**
 * Función utilitaria para verificar si un icono existe
 * @param {string} name - Nombre del icono
 * @returns {boolean} - True si el icono existe, false en caso contrario
 */
export const iconExists = (name) => {
  if (!name) return false;

  const prefix = name.substring(0, 2);
  const iconLibrary = iconLibraries[prefix];

  if (!iconLibrary) return false;

  return !!iconLibrary[name];
};

/**
 * Función utilitaria para obtener la lista de iconos disponibles en una librería
 * @param {string} prefix - Prefijo de la librería (ej: "Fa", "Bi", "Md")
 * @returns {string[]} - Array con los nombres de los iconos disponibles
 */
export const getAvailableIcons = (prefix) => {
  const iconLibrary = iconLibraries[prefix];
  if (!iconLibrary) {
    console.warn(`getAvailableIcons: Librería de iconos no encontrada para el prefijo "${prefix}"`);
    return [];
  }

  return Object.keys(iconLibrary);
};

export default CustomIcon; 