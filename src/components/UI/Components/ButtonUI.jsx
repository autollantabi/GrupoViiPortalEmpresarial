import { useTheme } from "context/ThemeContext";
import { useState } from "react";
import styled from "styled-components";
import React from "react";
import { IconUI } from "./IconsUI";
import { LoaderUI } from "./LoaderUI";


// Estilos base sin props en styled-components
const StyledButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.3s ease;
  font-size: 16px;
  font-weight: 500;
  border: none;
  outline: none;
  cursor: ${({ disabled, loading }) =>
    disabled || loading ? "not-allowed" : "pointer"};
  opacity: ${({ disabled, loading }) => (disabled || loading ? "0.5" : "1")};
  box-sizing: border-box !important;
  background-color: ${({ theme, $variant, $pcolor }) =>
    $variant === "contained" ? $pcolor || theme.colors.primary : "transparent"};
  color: ${({ theme, $variant, $pcolortext }) =>
    $variant === "contained"
      ? theme.colors.white
      : $pcolortext || theme.colors.primary};
  border: ${({ theme, $variant, $pcolortext }) =>
    $variant === "outlined"
      ? `1px solid ${$pcolortext || theme.colors.primary}`
      : "none"};
  width: ${({ $width }) => $width || "auto"};
  height: ${({ $height }) => $height || "auto"};
  min-height: 26px;

  &:hover {
    filter: ${({ disabled, loading }) =>
      !disabled && !loading ? "brightness(1.2)" : "none"};
    background-color: ${({ theme, $variant, disabled, loading, $pcolor }) =>
      !disabled && !loading && $variant === "contained"
        ? ($pcolor || theme.colors.primary)
        : "transparent"};
    border-color: ${({ theme, $variant, disabled, loading, $pcolortext }) =>
      !disabled && !loading && $variant === "outlined"
        ? ($pcolortext || theme.colors.primary)
        : "none"};
  }
`;


// -------------------------------------------------------------------------------------------- //

export const ButtonUI = ({
  style,
  text,
  iconLeft,
  iconRight,
  onClick,
  isAsync = false,
  disabled = false,
  variant = "contained",
  pcolor,
  pcolortext,
  iconSize = 16,
  width = "auto",
  height = "auto",
  type = "button",
}) => {
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleClick = async (e) => {
    if (!onClick || disabled) return;

    if (isAsync) {
      setLoading(true);
      try {
        await onClick(e);
      } catch (error) {
        console.error("Error en el botón:", error);
      }
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } else {
      onClick(e);
    }
  };

  // Función para renderizar iconos usando IconUI
  const renderIcon = (iconName) => {
    if (!iconName || loading) return null;

    return (
      <IconUI
        name={iconName}
        size={iconSize}
        style={{ pointerEvents: "none" }}
      />
    );
  };

  return (
    <StyledButton
      style={style}
      onClick={handleClick}
      disabled={disabled || loading}
      $variant={variant}
      $pcolor={pcolor}
      $pcolortext={pcolortext}
      $width={width}
      $height={height}
      type={type}
    >
      {iconLeft && !loading && renderIcon(iconLeft)}
      {loading ? (
        <LoaderUI
          size="16px"
          borderSize="3px"
          primaryColor={theme?.colors?.white || "#ffffff"}
          borderColor="rgba(255, 255, 255, 0.3)"
          speed="1s"
          fullScreen={false}
          height="16px"
          width="16px"
          inline={true}
        />
      ) : (
        text
      )}
      {iconRight && !loading && renderIcon(iconRight)}
    </StyledButton>
  );
};
