import { createContext, useContext, useState, useEffect } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "utils/theme";

// Contexto de colores
const ThemeContext = createContext();

// Proveedor del contexto
export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        // Si el tema guardado no tiene la propiedad 'name', determinar por los colores
        if (!parsed.name) {
          // Si el background es muy oscuro, es dark theme
          if (parsed.colors?.background === "#121212" || parsed.colors?.background === "#1a1a1a") {
            return darkTheme;
          }
          return lightTheme;
        }
        // Si tiene name, usar el tema correspondiente
        return parsed.name === "dark" ? darkTheme : lightTheme;
      }
      return lightTheme;
    } catch (error) {
      console.warn("Error al cargar tema del localStorage:", error);
      return lightTheme;
    }
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Guardar el tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(theme));
    setIsLoading(false);
  }, [theme]);

  // 🔄 Alternar entre Light y Dark Mode
  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme?.name === "light" ? darkTheme : lightTheme
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook para usar los colores en cualquier componente
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Si no hay contexto, retornar valores por defecto para evitar errores
    console.warn("useTheme debe ser usado dentro de un ThemeProvider");
    return {
      theme: lightTheme,
      toggleTheme: () => {},
    };
  }
  return context;
};
