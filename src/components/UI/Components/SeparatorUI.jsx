import React from "react";
import styled from "styled-components";
import { TextUI } from "./TextUI";
import { useTheme } from "context/ThemeContext";

const SeparatorContainer = styled.div`
  display: flex;
  align-items: ${({ $orientation }) => ($orientation === "vertical" ? "stretch" : "center")};
  flex-direction: ${({ $orientation }) => ($orientation === "vertical" ? "column" : "row")};
  width: ${({ $orientation, width }) => ($orientation === "vertical" ? "auto" : width || "100%")};
  height: ${({ $orientation, height }) => ($orientation === "vertical" ? (height || "100%") : "auto")};
  margin: ${({ $orientation }) => ($orientation === "vertical" ? "0 10px" : "5px 0")};
`;

const Line = styled.div`
  ${({ $orientation, theme, color }) => {
    const dividerColor = color || theme?.colors?.border || "#ccc";
    if ($orientation === "vertical") {
      return `
        width: 1px;
        height: 100%;
        background-color: ${dividerColor};
      `;
    }
    return `
      flex: 1;
      height: 1px;
      background-color: ${dividerColor};
      border-top: 1px solid ${dividerColor};
    `;
  }}
`;

export const SeparatorUI = ({ 
  style, 
  color, 
  width, 
  height,
  text, 
  orientation = "horizontal" // "horizontal" | "vertical"
}) => {
  const { theme } = useTheme();
  
  if (orientation === "vertical") {
    return (
      <SeparatorContainer 
        $orientation={orientation}
        style={style}
        height={height}
      >
        <Line $orientation={orientation} color={color} theme={theme} />
      </SeparatorContainer>
    );
  }
  
  return (
    <SeparatorContainer 
      $orientation={orientation}
      style={{ width: width || "100%", ...style }}
    >
      <Line $orientation={orientation} color={color} theme={theme} />
      {text && <TextUI color={color}>{text}</TextUI>}
      <Line $orientation={orientation} color={color} theme={theme} />
    </SeparatorContainer>
  );
};
