import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
} from "react";
import PropTypes from "prop-types";
import { ROUTES_FLAT } from "config/constantsRoutes";
import { MODULES_TREE } from "config/constantsModulePermissions";
import { useNavigate } from "react-router-dom";
const MY_AUTH_APP = "MY_AUTH_APP_1";

export const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem(MY_AUTH_APP) ?? false
  );

  const login = useCallback(function ({
    correo,
    contrasena,
    identificador,
    modulos,
    nombreUsuario,
  }) {
    localStorage.setItem(MY_AUTH_APP, JSON.stringify(true));
    localStorage.setItem("identificador", identificador);
    localStorage.setItem("modulos", modulos);
    localStorage.setItem("correo", correo);
    // localStorage.setItem("contrasena", contrasena);
    localStorage.setItem("nombre", nombreUsuario || "");

    setIsAuthenticated(true);
    navigate("/");
  },
  []);

  const logout = useCallback(function (navigate) {
    localStorage.removeItem(MY_AUTH_APP);
    localStorage.removeItem("modulos");
    localStorage.removeItem("correo");
    // localStorage.removeItem("contrasena");
    localStorage.removeItem("nombre");
    localStorage.removeItem("identificador");

    setIsAuthenticated(false);

    // Redirigir al login usando navigate
    if (navigate) {
      navigate("/login", { replace: true });
    } else {
      // Fallback si no se pasa navigate
      window.location.href = "/login";
    }
  }, []);

  const value = useMemo(
    () => ({
      login,
      logout,
      isAuthenticated,
    }),
    [login, logout, isAuthenticated]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthContextProvider.propTypes = {
  children: PropTypes.object,
};

export function useAuthContext() {
  return useContext(AuthContext);
}
