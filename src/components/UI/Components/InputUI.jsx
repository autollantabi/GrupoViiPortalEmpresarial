import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";
import { IconUI } from "./IconsUI";
import { useTheme } from "context/ThemeContext";

// Contenedor principal del input
const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 3px;
  border: 1px solid ${({ theme }) => theme?.colors?.border || theme?.colors?.inputBorder || "#dee2e6"};
  border-radius: 5px;
  background: ${({ theme }) => theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#ffffff"};
  position: relative;
  transition: border-color 0.2s ease;
  
  &:focus-within {
    border-color: ${({ theme }) => theme?.colors?.inputFocus || theme?.colors?.focusRing || theme?.colors?.primary || "#3c3c3b"};
    outline: none;
  }
`;

// Estilos del input
const StyledInput = styled.input`
  flex: 1;
  padding: 4px;
  border: none;
  outline: none;
  font-size: 14px;
  width: 100%;
  background: transparent;
  color: ${({ theme }) => theme.colors.text || "#000"};

  &::-webkit-input-placeholder {
    color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.placeholder || "#666", alpha: 0.8 })};
    opacity: 1;
    font-weight: 300;
  }

  &::-moz-placeholder {
    color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.placeholder || "#666", alpha: 0.8 })};
    opacity: 1;
    font-weight: 300;
  }

  &:-ms-input-placeholder {
    color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.placeholder || "#666", alpha: 0.8 })};
    opacity: 1;
    font-weight: 300;
  }

  &::placeholder {
    color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.placeholder || "#666", alpha: 0.8 })};
    opacity: 1;
    font-weight: 300;
  }
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
`;

// Estilos para los iconos
const Icon = styled.i`
  padding: 0 8px;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.placeholder};
`;

export const InputUI = ({
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  formatValue = (val) => val, // Función para formatear el valor mostrado
  iconLeft,
  iconRight,
  onClickIconleft,
  onClickIconRight,
  containerStyle,
  inputStyle,
  label,
  min,
  max,
  theme: themeProp,
  onKeyPress,
  onKeyDown,
  required,
}) => {
  const [inputValue, setInputValue] = useState(value ?? "");
  const themeContext = useTheme();
  const theme = themeProp || themeContext?.theme || { colors: { placeholder: "#999", text: "#000", secondary: "#666" } };
  
  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const originalValue = e.target.value;
    setInputValue(originalValue);
    if (onChange) onChange(originalValue);
  };

  const handleKeyDown = (e) => {
    // Pasar el evento al handler externo si existe
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleKeyPress = (e) => {
    // Pasar el evento al handler externo si existe
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...containerStyle,
      }}
    >
      {label && <Label theme={theme}>{label}</Label>}
      <InputWrapper theme={theme}>
        {iconLeft && (
          <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}>
            <IconUI
              name={iconLeft}
              onClick={onClickIconleft || (() => {})}
              size={16}
              color={theme.colors.placeholder || "#999"}
            />
          </div>
        )}
        {/* Ícono izquierdo */}
        <StyledInput
          type={type}
          placeholder={placeholder}
          value={formatValue(inputValue)} // Formato al mostrar
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          theme={theme}
          min={min}
          max={max}
          required={required}
        />
        {iconRight && (
          <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}>
            <IconUI
              name={iconRight}
              onClick={onClickIconRight || (() => {})}
              size={16}
              color={theme.colors.placeholder || "#999"}
            />
          </div>
        )}
        {/* Ícono derecho */}
      </InputWrapper>
    </div>
  );
};

