import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";

const StyledText = styled.span`
  font-family: inherit;
  display: inline-block;
  color: ${({ theme, color }) => color || theme?.colors?.text || "#212529"};
  font-weight: ${({ $weight }) => $weight || "400"};
  font-size: ${({ size }) => size || "16px"};
  text-align: ${({ $align }) => $align || "left"};
  transition: color 0.2s ease;
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
  
  &:hover {
    ${({ onClick, theme, color }) =>
      onClick &&
      `
      color: ${color || theme?.colors?.primary || "#3c3c3b"};
      opacity: 0.8;
    `}
  }
`;

export const TextUI = ({
  children,
  weight,
  size,
  color,
  align,
  onClick,
  style,
  className,
}) => {
  const { theme } = useTheme();

  return (
    <StyledText
      onClick={onClick || undefined}
      $weight={weight}
      size={size}
      color={color}
      $align={align}
      style={style}
      className={className}
      theme={theme}
    >
      {children}
    </StyledText>
  );
};

export default TextUI;

