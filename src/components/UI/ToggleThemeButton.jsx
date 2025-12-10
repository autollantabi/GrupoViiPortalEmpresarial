import React from "react";
import { useTheme } from "context/ThemeContext";
import styled from "styled-components";

const ToggleButton = styled.button`
  background: ${(props) => props.theme.colors.secondary};
  color: ${(props) => props.theme.colors.white};
  border: none;
  padding: 10px;
  cursor: pointer;
`;

const ToggleThemeButton = () => {
  const { toggleTheme } = useTheme();

  return <ToggleButton onClick={toggleTheme}>🌗 Cambiar Tema</ToggleButton>;
};

export default ToggleThemeButton;
