import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "utils/theme";

// Contexto de colores
const ThemeContext = createContext();

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  const storedTheme = localStorage.getItem("theme");
  const initialTheme = storedTheme ? JSON.parse(storedTheme) : lightTheme;

  const [theme, setTheme] = useState(initialTheme);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Guardar el tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(theme));
    setIsLoading(false);
  }, [theme]);

  // 🔄 Alternar entre Light y Dark Mode
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === lightTheme ? darkTheme : lightTheme
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook para usar los colores en cualquier componente
export const useTheme = () => useContext(ThemeContext);
