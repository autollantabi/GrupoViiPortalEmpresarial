import { createContext, useContext } from "react";

const PermissionsContext = createContext(null);

export const usePermissionsContext = () => {
  return useContext(PermissionsContext);
};

export const PermissionsProvider = ({ children }) => {
  const modulosPermisos = JSON.parse(localStorage.getItem("modulos")) || [];

  return (
    <PermissionsContext.Provider
      value={{
        modulosPermisos,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
