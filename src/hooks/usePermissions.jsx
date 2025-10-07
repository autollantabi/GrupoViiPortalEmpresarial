import { useEffect, useState, useMemo } from "react";

// Mapeo de empresas a IDs
const EMPRESAS_IDS = {
  AUTOLLANTA: 1,
  MAXXIMUNDO: 2,
  STOX: 3,
  IKONIX: 4,
  AUTOMAX: 5,
};

// Mapeo de submódulos alternativos para casos especiales
const SUBMODULE_ALTERNATIVES = {
  "TECNICENTRO CATEGORIAS": "TECNICENTRO_PRODUCTOS",
  "CATEGORIAS TECNICENTRO": "TECNICENTRO_PRODUCTOS",
  CATEGORIAS: "TECNICENTRO_PRODUCTOS",
};

/**
 * Hook para obtener permisos del usuario desde localStorage
 * @param {string} moduleName - Nombre del módulo (ej: "CYMC", "CARTERA")
 * @param {string|Array} subModule - Nombre del submódulo o array de submódulos (ej: "REPORTES" o ["NEUMATICOS", "LUBRICANTES"])
 * @returns {Object} - Objeto con permisos y empresas disponibles
 */
export const usePermissions = (moduleName, subModule = null) => {
  const [permissions, setPermissions] = useState([]);
  const [empresasAcceso, setEmpresasAcceso] = useState([]);
  const [loading, setLoading] = useState(true);

  // Memoizar los parámetros para evitar cambios innecesarios
  const memoizedModuleName = useMemo(() => moduleName, [moduleName]);
  const memoizedSubModule = useMemo(() => {
    // Para arrays, crear una versión serializada estable
    if (Array.isArray(subModule)) {
      return subModule.sort().join(",");
    }
    return subModule;
  }, [subModule]);

  useEffect(() => {
    const loadPermissions = () => {
      try {
        // Obtener permisos desde localStorage
        const modulosPermisos =
          JSON.parse(localStorage.getItem("modulos")) || [];

        // Función recursiva para encontrar módulos
        const findModuleRecursively = (modules, targetModule) => {
          for (const module of modules) {
            if (module.modulo === targetModule) {
              return module;
            }
            if (module.children && module.children.length > 0) {
              const found = findModuleRecursively(
                module.children,
                targetModule
              );
              if (found) return found;
            }
          }
          return null;
        };

        const moduloData = findModuleRecursively(
          modulosPermisos,
          memoizedModuleName
        );

        if (moduloData) {
          // Función para extraer permisos
          const extractPermissions = (children, targetSubModules = null) => {
            const allPermissions = [];

            // Manejar tanto arrays como strings
            let subModulesArray = null;
            if (targetSubModules) {
              if (Array.isArray(targetSubModules)) {
                subModulesArray = targetSubModules;
              } else if (
                typeof targetSubModules === "string" &&
                targetSubModules.includes(",")
              ) {
                // Deserializar string de vuelta a array
                subModulesArray = targetSubModules.split(",");
              } else {
                subModulesArray = [targetSubModules];
              }
            }

            children.forEach((child) => {
              if (subModulesArray) {
                const isTargetModule = subModulesArray.includes(child.modulo);
                if (isTargetModule && child.permisos) {
                  child.permisos.forEach((permiso) => {
                    allPermissions.push({
                      empresa: permiso.empresa,
                      permiso: permiso.permiso,
                      modulo: child.modulo, // Agregar información del submódulo
                    });
                  });
                }
                if (child.children) {
                  allPermissions.push(
                    ...extractPermissions(child.children, targetSubModules)
                  );
                }
              } else {
                if (child.permisos) {
                  child.permisos.forEach((permiso) => {
                    allPermissions.push({
                      empresa: permiso.empresa,
                      permiso: permiso.permiso,
                      modulo: child.modulo, // Agregar información del submódulo
                    });
                  });
                }
                if (child.children) {
                  allPermissions.push(
                    ...extractPermissions(child.children, null)
                  );
                }
              }
            });

            return allPermissions;
          };

          let allPermissions = [];

          // Permisos directos del módulo (solo si no hay submódulo específico)
          if (!memoizedSubModule && moduloData.permisos) {
            allPermissions.push(
              ...moduloData.permisos.map((p) => ({
                empresa: p.empresa,
                permiso: p.permiso,
                modulo: memoizedModuleName, // Agregar información del módulo principal
              }))
            );
          }

          // Permisos de children
          if (moduloData.children) {
            const childrenPermissions = extractPermissions(
              moduloData.children,
              memoizedSubModule
            );
            allPermissions.push(...childrenPermissions);

            // Buscar submódulo alternativo si no se encuentra
            if (memoizedSubModule && childrenPermissions.length === 0) {
              const alternative = Array.isArray(memoizedSubModule)
                ? null
                : SUBMODULE_ALTERNATIVES[memoizedSubModule];

              if (alternative) {
                const alternativePermissions = extractPermissions(
                  moduloData.children,
                  alternative
                );
                allPermissions.push(...alternativePermissions);
              } else if (moduloData.permisos) {
                allPermissions.push(
                  ...moduloData.permisos.map((p) => ({
                    empresa: p.empresa,
                    permiso: p.permiso,
                    modulo: memoizedModuleName, // Agregar información del módulo principal
                  }))
                );
              }
            }
          }

          // Eliminar duplicados por empresa
          const empresasUnicas = [];
          const empresasNames = new Set();

          allPermissions.forEach((permiso) => {
            if (!empresasNames.has(permiso.empresa)) {
              empresasNames.add(permiso.empresa);
              empresasUnicas.push({
                ...permiso,
                idempresa: EMPRESAS_IDS[permiso.empresa] || null,
                // Mantener la información del módulo
              });
            }
          });

          setPermissions(allPermissions);
          setEmpresasAcceso(empresasUnicas);
          setLoading(false);
        } else {
          setPermissions([]);
          setEmpresasAcceso([]);
          setLoading(false);
        }
      } catch (error) {
        setPermissions([]);
        setEmpresasAcceso([]);
        setLoading(false);
      }
    };

    loadPermissions();
  }, [memoizedModuleName, memoizedSubModule]);

  // Agrupar permisos por módulo
  const permissionsByModule = useMemo(() => {
    const grouped = {};
    permissions.forEach((permiso) => {
      if (!grouped[permiso.modulo]) {
        grouped[permiso.modulo] = [];
      }
      grouped[permiso.modulo].push({
        empresa: permiso.empresa,
        permiso: permiso.permiso,
        idempresa: EMPRESAS_IDS[permiso.empresa] || null,
      });
    });
    return grouped;
  }, [permissions]);

  return {
    permissions,
    empresasAcceso,
    permissionsByModule, // ← Nueva propiedad agrupada
    permissionsLoading: loading,
  };
};
