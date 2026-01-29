import React from "react";
import { useTheme } from "context/ThemeContext";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";
import { lightTheme } from "utils/theme";
import IconUI from "./IconsUI";

const ToggleButton = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding-left: 10px;
  gap: 10px;
  height: 37px;
  width: ${(props) => (props.$isexpanded ? "216px" : "37px")};
  cursor: pointer;
  user-select: none;
  border-radius: 5px;
  background-color: transparent;
  flex-grow: 1;
  flex-shrink: 0;
  transition: background-color 0.3s ease-in-out, width 0.4s ease-in-out;

  &:hover {
    background-color: ${(props) =>
      hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })};
  }
`;

const Icon = styled.div`
  color: ${(props) => props.theme.colors.white};
  font-size: 18px;
  transition: transform 0.3s ease-in-out;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex: 0 0 auto;
`;

const Title = styled.span.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  white-space: nowrap;
  text-align: left;
  font-size: 15px;
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  max-width: ${(props) => (props.$isexpanded ? "100%" : "0")};
  overflow: hidden;
  transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
  color: ${(props) => props.theme.colors.white};
  flex: 1;
`;

const ToggleThemeButtonUI = ({ isexpanded = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme?.name === "light";

  return (
    <ToggleButton onClick={toggleTheme} $isexpanded={isexpanded}>
      <Icon>
        {isLight ? (
          <IconUI name="FaSun" size={14} color={theme.colors.white} />
        ) : (
          <IconUI name="FaMoon" size={14} color={theme.colors.white} />
        )}
      </Icon>
      {isexpanded && (
        <Title $isexpanded={isexpanded}>
          {isLight ? "Modo Oscuro" : "Modo Claro"}
        </Title>
      )}
    </ToggleButton>
  );
};

export default ToggleThemeButtonUI;
