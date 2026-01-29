import React from "react";
import Select from "react-select";
import Creatable from "react-select/creatable";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
`;

export const SelectUI = ({
  options = [],
  value,
  onChange,
  onInputChange,
  placeholder = "Selecciona...",
  isSearchable = true,
  isCreatable = false,
  menuPlacement = "auto",
  isDisabled = false,
  minWidth = "150px",
  maxWidth = "250px",
  isMulti = false,
  label = "",
  menuWidth = "max-content",
  menuMaxWidth = "200px",
  menuMaxHeight = "300px",
}) => {
  const themeContext = useTheme();
  // Obtener el tema de la misma forma que InputUI
  const theme = themeContext?.theme || { colors: { placeholder: "#999", primary: "#000", secondary: "#666", text: "#000" } };
  
  // Función helper para convertir color a hex (si es necesario)
  // Maneja rgba, rgb y hex
  const colorToHex = (color, fallback = "#999") => {
    if (!color) return fallback;
    
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
      // Convertir a hex con padding de 2 dígitos
      const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    return fallback;
  };
  
  // Verifica si las opciones están vacías
  const isEmptyOptions =
    !options || Object.keys(options).length === 0 || options.length === 0;

  // Verifica si `value` es inválido
  const isEmptyValue =
    !value ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    Object.keys(value).length === 0;

  // Calcular el ancho del contenedor para el menu
  const menuWidthValue = minWidth === "100%" || maxWidth === "100%" ? "100%" : menuWidth;

  const customStylesSelect = {
    option: (provided, state) => ({
      ...provided,
      padding: "3px 10px",
      whiteSpace: "normal",
      wordWrap: "break-word",
      overflowWrap: "break-word",
      fontSize: "12px",
      backgroundColor: state.isFocused 
        ? (theme.colors?.selectOptionHover || theme.colors?.hover || "#f8f9fa")
        : (theme.colors?.selectMenuBackground || theme.colors?.selectBackground || theme.colors?.backgroundCard || "#ffffff"),
      color: theme.colors?.text || "#000",
      cursor: "pointer",
      "&:active": {
        backgroundColor: theme.colors?.selectOptionHover || theme.colors?.hover || "#f8f9fa",
      },
    }),
    control: (provided, state) => {
      const borderColor = state.isFocused 
        ? (theme.colors?.inputFocus || theme.colors?.focusRing || theme.colors?.primary || "#3c3c3b")
        : (theme.colors?.border || theme.colors?.inputBorder || "#dee2e6");
      
      return {
        ...provided,
        minWidth: minWidth === "100%" ? "100%" : minWidth,
        maxWidth: maxWidth === "100%" ? "100%" : maxWidth,
        width: minWidth === "100%" || maxWidth === "100%" ? "100%" : (provided.width || "100%"),
        fontSize: "12px",
        borderRadius: "5px",
        border: `1px solid ${borderColor}`,
        borderWidth: "1px",
        borderStyle: "solid",
        minHeight: "38px",
        height: "38px",
        padding: "0 4px 0 2px",
        boxShadow: "none",
        backgroundColor: theme.colors?.selectBackground || theme.colors?.inputBackground || theme.colors?.backgroundCard || "#ffffff",
        color: theme.colors?.text || "#000",
        cursor: "pointer",
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: borderColor,
        },
      };
    },
    placeholder: (provided, state) => {
      // Usar exactamente el mismo color que InputUI para el placeholder
      // InputUI usa: hexToRGBA({ hex: theme.colors.placeholder || "#666", alpha: 0.8 })
      const placeholderColor = theme.colors?.placeholder || "#666";
      const placeholderHex = colorToHex(placeholderColor, "#666");
      
      return {
        ...provided,
        color: hexToRGBA({ 
          hex: placeholderHex, 
          alpha: 0.8 
        }),
        opacity: 1,
        fontWeight: 300,
        fontSize: "12px",
        margin: 0,
      };
    },
    input: (provided) => ({
      ...provided,
      fontSize: "12px",
      padding: "0",
      margin: "0",
      color: theme.colors?.text || "#000",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: hexToRGBA({ hex: theme.colors?.secondary || "#fd4703", alpha: 0.1 }),
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: theme.colors?.text || "#000",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: theme.colors?.text || "#000",
      "&:hover": {
        backgroundColor: hexToRGBA({ hex: theme.colors?.error || "#dc3545", alpha: 0.2 }),
        color: theme.colors?.error || "#dc3545",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "2px 4px",
    }),
    menu: (provided, state) => {
      // Obtener el ancho del control desde el estado o usar el ancho del contenedor
      const controlWidth = state.selectProps.controlWidth || "100%";
      
      // El menú debe ser al menos tan ancho como el control, pero puede expandirse si el contenido lo requiere
      // Usamos minWidth del control y maxWidth más flexible para permitir expansión
      return {
        ...provided,
        zIndex: 10,
        width: "auto",
        minWidth: controlWidth,
        maxWidth: menuMaxWidth || "400px", // Permitir expansión hasta un máximo razonable
        maxHeight: menuMaxHeight,
        fontSize: "12px",
        backgroundColor: theme.colors?.selectMenuBackground || theme.colors?.selectBackground || theme.colors?.backgroundCard || "#ffffff",
      };
    },
    menuList: (provided) => ({
      ...provided,
      maxHeight: menuMaxHeight,
      padding: "2px 0",
      backgroundColor: theme.colors?.selectMenuBackground || theme.colors?.selectBackground || theme.colors?.backgroundCard || "#ffffff",
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: "12px",
      color: theme.colors.text || "#000",
      maxWidth: "100%",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      padding: "0",
      width: "24px",
      minWidth: "24px",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "2px",
    }),
  };

  const SelectComponent = isCreatable ? Creatable : Select;

  // Si minWidth o maxWidth es "100%", usar width: "100%"
  const containerWidth = minWidth === "100%" || maxWidth === "100%" ? "100%" : "fit-content";
  
  // Usar useRef para obtener el ancho del contenedor
  const containerRef = React.useRef(null);
  const [controlWidth, setControlWidth] = React.useState("100%");

  const updateControlWidth = React.useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth;
      if (width > 0) {
        setControlWidth(`${width}px`);
      }
    }
  }, []);

  React.useEffect(() => {
    updateControlWidth();
    // Actualizar cuando cambie el tamaño de la ventana
    window.addEventListener("resize", updateControlWidth);
    return () => window.removeEventListener("resize", updateControlWidth);
  }, [updateControlWidth, minWidth, maxWidth]);

  // Usar callback ref para actualizar cuando el elemento se monte
  const setContainerRef = React.useCallback((node) => {
    containerRef.current = node;
    if (node) {
      updateControlWidth();
    }
  }, [updateControlWidth]);

  return (
    <div
      ref={setContainerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        width: containerWidth,
        minWidth: minWidth === "100%" ? "100%" : minWidth,
        maxWidth: maxWidth === "100%" ? "100%" : maxWidth,
      }}
    >
      {label && <Label theme={theme}>{label}</Label>}

      <SelectComponent
        options={isEmptyOptions ? [] : options}
        value={isEmptyValue ? null : value}
        onChange={onChange}
        onInputChange={onInputChange}
        styles={customStylesSelect}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        placeholder={placeholder}
        menuPlacement={menuPlacement}
        isMulti={isMulti}
        controlWidth={controlWidth}
      />
    </div>
  );
};
