import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { userService_obtenerTipoUsuarioByIdUsuario } from "services/usuariosService";
const MY_AUTH_APP = "MY_AUTH_APP_1";

export const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem(MY_AUTH_APP) ?? false
  );
  const [user, setUser] = useState(null);

  // Función para consultar y guardar datos del usuario
  const fetchUserData = useCallback(async (userId) => {
    try {
      const response = await userService_obtenerTipoUsuarioByIdUsuario(userId);
      if (response.success) {

        // Extraer los tipos de usuario del array de relaciones
        const tiposUsuario = response.data.map(
          (relacion) => relacion.tipoUsuario
        );

        // Actualizar el estado del usuario con los tipos
        setUser((prevUser) => ({
          ...prevUser,
          tipoUsuario: tiposUsuario,
        }));

        return tiposUsuario;
      } else {
        console.error("Error al obtener datos del usuario:", response.message);
        return null;
      }
    } catch (error) {
      console.error("Error en fetchUserData:", error);
      return null;
    }
  }, []);
  // useEffect para cargar datos del usuario al inicializar
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      const identificador = localStorage.getItem("identificador");
      const isAuth = localStorage.getItem(MY_AUTH_APP);

      if (isAuth && identificador && !user) {
        console.log("Cargando datos del usuario al inicializar...");
        await fetchUserData(identificador);
      }
    };

    cargarDatosUsuario();
  }, [fetchUserData, user]);

  const login = useCallback(
    async function ({
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

      // Consultar datos del usuario después del login
      await fetchUserData(identificador);

      navigate("/");
    },
    [fetchUserData]
  );

  const logout = useCallback(function (navigate) {
    localStorage.removeItem(MY_AUTH_APP);
    localStorage.removeItem("modulos");
    localStorage.removeItem("correo");
    // localStorage.removeItem("contrasena");
    localStorage.removeItem("nombre");
    localStorage.removeItem("identificador");

    setIsAuthenticated(false);
    setUser(null);

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
      user,
      fetchUserData,
    }),
    [login, logout, isAuthenticated, user, fetchUserData]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthContextProvider.propTypes = {
  children: PropTypes.object,
};

export function useAuthContext() {
  return useContext(AuthContext);
}
