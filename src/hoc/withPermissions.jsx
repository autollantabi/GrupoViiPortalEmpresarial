import React from "react";
import { usePermissions } from "../hooks/usePermissions";

/**
 * Higher Order Component que inyecta permisos automáticamente a cualquier componente
 * @param {React.Component} WrappedComponent - Componente a envolver
 * @returns {React.Component} - Componente envuelto con permisos inyectados
 */
export const withPermissions = (WrappedComponent) => {
  const WithPermissionsComponent = (props) => {
    // Obtener el módulo desde routeConfig que viene como prop
    const routeConfig = props.routeConfig;
    const moduleName = routeConfig?.modulo || routeConfig?.seccion;
    const subModule = routeConfig?.subModules;

    const { permissions, empresasAcceso, loading } = usePermissions(
      moduleName,
      subModule
    );

    // Props adicionales que se inyectan al componente
    const injectedProps = {
      permissions,
      empresasAcceso,
      permissionsLoading: loading,
      // Mantener compatibilidad con el sistema anterior
      permisos_m: permissions
        ? { [moduleName || "default"]: permissions }
        : null,
      moduleid: moduleName,
    };

    return <WrappedComponent {...props} {...injectedProps} />;
  };

  // Copiar displayName para debugging
  WithPermissionsComponent.displayName = `withPermissions(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithPermissionsComponent;
};

/**
 * Hook personalizado para usar permisos con props opcionales
 * Útil cuando necesitas especificar módulo/submódulo específicos
 */
export const usePermissionsProps = (props = {}) => {
  const { moduleName, subModule, ...otherProps } = props;
  return usePermissions(moduleName, subModule);
};

export default withPermissions;
