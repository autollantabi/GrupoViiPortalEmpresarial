import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useContext,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import { userService_obtenerTipoUsuarioByIdUsuario } from "services/usuariosService";
import { authService_me } from "services/authService";
import { setAxiosIdSession, removeAxiosIdSession } from "config/axiosConfig";
import { encrypt, decrypt, getEncryptionKey } from "utils/encryption";

const ID_SESSION_STORAGE_KEY = "app_cache_token";

export const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [idSession, setIdSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para saber si está cargando datos del localStorage

  // Función para obtener información del usuario desde /auth/me
  const fetchUserMe = useCallback(async () => {
    try {
      const response = await authService_me();
      
      if (response.success) {
        // La nueva estructura tiene: USUARIO, EMPRESAS, LINEAS, PERMISOS, ROLES, CONTEXTOS
        // Guardar toda la información del usuario en el estado
        // response.data.CONTEXTOS es el array de contextos usuario-rol-contexto (similar a la estructura anterior)
        setUser({
          ...response.data, // Guardar toda la estructura (USUARIO, EMPRESAS, LINEAS, PERMISOS, ROLES, CONTEXTOS)
          data: response.data.CONTEXTOS || [], // Mantener 'data' como array de contextos para compatibilidad
        });
        
        return response.data.CONTEXTOS || [];
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }, []);


  // Función para consultar y guardar datos del usuario (mantener compatibilidad)
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
        return null;
      }
    } catch (error) {
      return null;
    }
  }, []);
  // useEffect para cargar datos del usuario al inicializar (solo al recargar la página)
  // Solo se ejecuta una vez al montar el componente, no cuando user cambia
  useEffect(() => {
    let isMounted = true;
    
    const cargarDatosUsuario = async () => {
      setIsLoading(true);
      
      // Intentar cargar idSession encriptado del localStorage
      const encryptedIdSession = localStorage.getItem(ID_SESSION_STORAGE_KEY);
      if (encryptedIdSession) {
        const encryptionKey = getEncryptionKey();
        const decryptedIdSession = decrypt(encryptedIdSession, encryptionKey);
        
        if (decryptedIdSession) {
          setIdSession(decryptedIdSession);
          setAxiosIdSession(decryptedIdSession);
          
          // Ahora que tenemos el idSession, consultar /auth/me
          try {
            const userData = await fetchUserMe();
            if (userData && isMounted) {
              setIsAuthenticated(true);
            } else if (isMounted) {
              // Si no hay datos del usuario, limpiar
              setIsAuthenticated(false);
              setIdSession(null);
              removeAxiosIdSession();
              localStorage.removeItem(ID_SESSION_STORAGE_KEY);
            }
          } catch (error) {
            // Si falla, limpiar todo
            if (isMounted) {
              setIsAuthenticated(false);
              setIdSession(null);
              removeAxiosIdSession();
              localStorage.removeItem(ID_SESSION_STORAGE_KEY);
            }
          }
        } else {
          // Si no se puede desencriptar, limpiar
          localStorage.removeItem(ID_SESSION_STORAGE_KEY);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    cargarDatosUsuario();
    
    return () => {
      isMounted = false;
    };
  }, []); // Solo ejecutar al montar, no cuando user o idSession cambian

  const login = useCallback(
    async function ({
      idSession,
    }) {
      setIsAuthenticated(true);

      // Guardar idSession en el estado y en la cabecera de axios
      if (idSession) {
        setIdSession(idSession);
        setAxiosIdSession(idSession);
        
        // Guardar idSession encriptado en localStorage
        const encryptionKey = getEncryptionKey();
        const encryptedIdSession = encrypt(idSession, encryptionKey);
        if (encryptedIdSession) {
          localStorage.setItem(ID_SESSION_STORAGE_KEY, encryptedIdSession);
        }
      }

      // Ahora el login solo guarda idSession, los datos del usuario se obtienen con /auth/me
      // Después de guardar idSession, consultar /auth/me para obtener todos los datos
      try {
        await fetchUserMe();
      } catch (error) {
        // Error silencioso
      }

      // Usar window.location en lugar de navigate porque el provider está fuera del Router
      window.location.href = "/";
    },
    [fetchUserMe]
  );

  const logout = useCallback(function (navigate) {
    setIsAuthenticated(false);
    setUser(null);
    setIdSession(null);
    
    // Remover la cabecera id-session de axios
    removeAxiosIdSession();
    
    // Eliminar idSession encriptado del localStorage
    localStorage.removeItem(ID_SESSION_STORAGE_KEY);

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
      idSession,
      isLoading,
      fetchUserData,
      fetchUserMe,
    }),
    [login, logout, isAuthenticated, user, idSession, isLoading, fetchUserData, fetchUserMe]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthContextProvider.propTypes = {
  children: PropTypes.object,
};

export function useAuthContext() {
  return useContext(AuthContext);
}
