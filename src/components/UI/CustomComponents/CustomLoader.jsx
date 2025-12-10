// Loader component with custom styles
import React from "react";
import styled, { keyframes } from "styled-components";

// Definir la animación de rotación
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Contenedor del loader con opciones configurables
const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${({ $fullScreen, height }) =>
    $fullScreen ? "100vh" : height || "auto"};
  width: ${({ width }) => width || "100%"};
  flex-direction: column;
  gap: 15px;
`;

// Componente de spinner con propiedades personalizables
const Spinner = styled.div`
  border: ${({ $borderSize }) => $borderSize || "4px"} solid
    ${({ theme, borderColor }) =>
      borderColor || theme.colors.background || "#f3f3f3"};
  border-top: ${({ $borderSize }) => $borderSize || "4px"} solid
    ${({ theme, primaryColor }) =>
      primaryColor || theme.colors.secondary || "#3498db"};
  border-radius: 50%;
  width: ${({ size }) => size || "40px"};
  height: ${({ size }) => size || "40px"};
  animation: ${spin} ${({ speed }) => speed || "1s"} linear infinite;
`;

// Texto opcional para el loader
const LoaderText = styled.div`
  font-size: ${({ fontSize }) => fontSize || "14px"};
  color: ${({ theme, textColor }) => textColor || theme.colors.text || "#333"};
  text-align: center;
`;

export const CustomLoader = ({
  size = "40px", // Tamaño del spinner
  borderSize = "4px", // Grosor del borde
  primaryColor, // Color principal (borde superior)
  borderColor, // Color del resto del borde
  textColor, // Color del texto
  speed = "1s", // Velocidad de la animación
  fullScreen = false, // Si debe ocupar toda la pantalla
  height, // Altura personalizada si no es fullScreen
  width, // Ancho personalizado
  text = "", // Texto opcional a mostrar
  fontSize, // Tamaño del texto
}) => {
  return (
    <LoaderContainer $fullScreen={fullScreen} height={height} width={width}>
      <Spinner
        size={size}
        $borderSize={borderSize}
        primaryColor={primaryColor}
        borderColor={borderColor}
        speed={speed}
      />
      {text && (
        <LoaderText fontSize={fontSize} textColor={textColor}>
          {text}
        </LoaderText>
      )}
    </LoaderContainer>
  );
};
