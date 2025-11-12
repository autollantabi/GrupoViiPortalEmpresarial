import React, { useState, useEffect } from "react";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";

import {
  DeletePermisoUsuario,
  ListarEmpresasAdmin,
  ListarModulos,
  ListarPermisosUsuario,
  UpdatePermisoUsuario,
} from "services/administracionService";

// Empresas disponibles
const availableCompanies = [
  "AUTOLLANTA",
  "MAXXIMUNDO",
  "STOX",
  "IKONIX",
  "AUTOMAX",
];

//combinar módulos con los permisos del usuario
const combinarModulosPermisos = (modulos, permisosUsuario) => {
  const modulosMap = {};

  // Crear un mapa de módulos a partir de la consulta ListarModulos
  modulos.forEach((modulo) => {
    modulosMap[modulo.IDENTIFICADOR] = {
      ...modulo,
      EMPRESAS: {}, // Inicializamos las empresas aquí
      children: [], // Inicializamos la lista de hijos
    };
  });

  // Luego, asociamos los permisos del usuario con los módulos correspondientes
  permisosUsuario.forEach((permiso) => {
    const moduloId = permiso.IDENTIFICADOR_MODULO;

    if (modulosMap[moduloId]) {
      // Si el módulo ya existe en el mapa, añadimos la empresa y el permiso
      modulosMap[moduloId].EMPRESAS[permiso.NOMBRE_EMPRESA] = permiso.PERMISO;
    }
  });

  // Construir el árbol de módulos
  const roots = [];

  Object.values(modulosMap).forEach((modulo) => {
    if (modulo.PADRE === 0) {
      roots.push(modulo); // Módulos raíz
    } else if (modulosMap[modulo.PADRE]) {
      // Añadir como hijo al padre correspondiente
      modulosMap[modulo.PADRE].children.push(modulo);
    }
  });
  //   console.log(roots);

  return roots; // Devolver la estructura del árbol
};
// Componente que renderiza cada nodo recursivamente
const PermisoNode = ({
  node,
  onChangePermission,
  onAddCompany,
  onRemoveCompany,
}) => {
  const { theme } = useTheme();

  if (!node) return null; // No renderiza nada si el nodo es indefinido

  const hasChildren = node.children && node.children.length > 0;
  const hasEmpresas = node.EMPRESAS && Object.keys(node.EMPRESAS).length > 0;

  // Opciones para agregar empresa
  const empresasDisponibles = availableCompanies
    .filter((empresa) => !Object.keys(node.EMPRESAS || {}).includes(empresa))
    .map((emp) => ({ value: emp, label: emp }));

  const handleAgregarEmpresa = (selectedOption) => {
    if (selectedOption) {
      onAddCompany(node.IDENTIFICADOR, selectedOption.value);
    }
  };

  const handleCambiarPermiso = (empresa, selectedOption) => {
    if (selectedOption) {
      onChangePermission(node.IDENTIFICADOR, empresa, selectedOption.value);
    }
  };

  return (
    <li
      style={{
        padding: "8px 0",
        listStyleType: "none",
        position: "relative",
        marginBottom: "12px",
      }}
    >
      <span
        style={{
          marginRight: "8px",
          position: "absolute",
          left: "-24px",
          top: "8px",
        }}
      >
        {node.PADRE === 0 ? (
          <i
            className="bi bi-folder-fill"
            style={{ color: theme.colors.primary }}
          ></i>
        ) : (
          <i
            className="bi bi-arrow-return-right"
            style={{ color: theme.colors.textSecondary }}
          ></i>
        )}
      </span>

      <div style={{ marginLeft: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: hasEmpresas ? "12px" : "0",
          }}
        >
          <strong style={{ fontSize: "14px", color: theme.colors.text }}>
            {node.MODULO}
          </strong>
          {!hasChildren && empresasDisponibles.length > 0 && (
            <CustomSelect
              placeholder="Agregar Empresa"
              options={empresasDisponibles}
              onChange={handleAgregarEmpresa}
              value={null}
              minWidth="180px"
              isSearchable
            />
          )}
        </div>

        {!hasChildren && hasEmpresas && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {Object.entries(node.EMPRESAS).map(([empresa, permiso]) => (
              <div
                key={empresa}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  backgroundColor: hexToRGBA({
                    hex: theme.colors.primary,
                    alpha: 0.05,
                  }),
                  border: `1px solid ${hexToRGBA({
                    hex: theme.colors.primary,
                    alpha: 0.15,
                  })}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong
                    style={{ fontSize: "12px", color: theme.colors.text }}
                  >
                    {empresa}
                  </strong>
                  <CustomButton
                    iconLeft="FaTrash"
                    onClick={() => onRemoveCompany(node.IDENTIFICADOR, empresa)}
                    pcolor={theme.colors.error}
                    style={{ padding: "4px 8px", fontSize: "12px" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    width: "100%",
                  }}
                >
                  <CustomButton
                    text="Lectura"
                    onClick={() =>
                      handleCambiarPermiso(empresa, {
                        value: "L",
                        label: "Lectura",
                      })
                    }
                    pcolor={
                      permiso === "L"
                        ? "#2196F3"
                        : theme.colors.textSecondary || "#6c757d"
                    }
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      fontSize: "11px",
                      opacity: permiso === "L" ? 1 : 0.7,
                    }}
                  />
                  <CustomButton
                    text="Escritura"
                    onClick={() =>
                      handleCambiarPermiso(empresa, {
                        value: "E",
                        label: "Escritura",
                      })
                    }
                    pcolor={
                      permiso === "E"
                        ? "#FF9800"
                        : theme.colors.textSecondary || "#6c757d"
                    }
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      fontSize: "11px",
                      opacity: permiso === "E" ? 1 : 0.7,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Renderizar los hijos si existen */}
        {hasChildren && (
          <ul style={{ marginLeft: "24px", marginTop: "8px" }}>
            {node.children.map((child) => (
              <PermisoNode
                key={child.IDENTIFICADOR}
                node={child}
                onChangePermission={onChangePermission}
                onAddCompany={onAddCompany}
                onRemoveCompany={onRemoveCompany}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

export const ListaPermisos = ({ modulo, idUsuario }) => {
  const { theme } = useTheme();
  const [permisoState, setPermisoState] = useState([]); // Estado de permisos editables
  const [moduloState, setModuloState] = useState([]); // Estado de los módulos
  const [tree, setTree] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // Función para obtener los módulos
  const consultarModulos = async () => {
    const modls = await ListarModulos();
    return modls;
  };

  // Función para obtener los permisos del usuario
  const consultarPermisosUsuario = async () => {
    const res = await ListarPermisosUsuario({ idUsuario });
    setPermisoState(res);
    return res;
  };

  const obtenerDatos = async () => {
    const modulos = await consultarModulos();
    const permisosUsuario = await consultarPermisosUsuario();

    // Combinar los módulos con los permisos del usuario
    const treeData = combinarModulosPermisos(modulos, permisosUsuario);
    setTree(treeData);
  };
  useEffect(() => {
    const consultarEmpresas = async () => {
      const emp = await ListarEmpresasAdmin();
      setEmpresas(emp);
    };
    consultarEmpresas();
  }, []);

  useEffect(() => {
    obtenerDatos();
  }, [modulo]);

  // Cambiar el tipo de permiso para una empresa

  const updateTreeWithCompany = async (
    tree,
    moduloId,
    empresa,
    nuevoPermiso
  ) => {
    let dataUpdatePermiso = {};

    // Solo ejecutamos la actualización en el lugar correcto (una sola vez)
    let permisoActualizado = false;

    // Recursivamente actualiza el árbol
    const updatedTree = await Promise.all(
      tree.map(async (modulo) => {
        if (modulo.IDENTIFICADOR === moduloId) {
          // Busca el ID de la empresa y construye los datos de la actualización
          const empresaData = empresas.find((item) => item.NOMBRE === empresa);
          if (empresaData && nuevoPermiso !== "") {
            const usuarioid = idUsuario;
            const moduloid = moduloId;
            const emprid = empresaData.ID;
            const permiso = nuevoPermiso;
            dataUpdatePermiso = {
              usuarioid,
              moduloid,
              emprid,
              permiso,
            };

            if (!permisoActualizado) {
              // Realiza la actualización del permiso solo una vez
              await UpdatePermisoUsuario({ data: dataUpdatePermiso });
              permisoActualizado = true; // Marcamos que ya se ejecutó la actualización
            }
          }
          return {
            ...modulo,
            EMPRESAS: { ...modulo.EMPRESAS, [empresa]: nuevoPermiso }, // Agregar o actualizar empresa
          };
        }

        // Si el módulo tiene hijos, llamamos a la función recursiva
        if (modulo.children && modulo.children.length > 0) {
          const updatedChildren = await updateTreeWithCompany(
            modulo.children,
            moduloId,
            empresa,
            nuevoPermiso
          );
          return { ...modulo, children: updatedChildren };
        }

        return modulo;
      })
    );

    return updatedTree;
  };
  // Función para cambiar el tipo de permiso
  const handleChangePermission = async (moduloId, empresa, nuevoPermiso) => {
    const updatedTree = await updateTreeWithCompany(
      tree,
      moduloId,
      empresa,
      nuevoPermiso
    );
    setTree(updatedTree); // Actualizar el estado del árbol
  };
  // Agregar una nueva empresa
  // Función para agregar una nueva empresa
  const handleAddCompany = async (moduloId, empresa) => {
    const updatedTree = await updateTreeWithCompany(
      tree,
      moduloId,
      empresa,
      ""
    );
    setTree(updatedTree); // Actualizar el estado del árbol
  };

  const removeCompanyFromTree = async (tree, moduloId, empresa) => {
    let permisoEliminado = false;
    let dataUpdatePermiso = {};

    // Recursivamente actualizar el árbol usando map y Promise.all
    const updatedTree = Promise.all(
      tree.map(async (modulo) => {
        // Si es el módulo correcto, eliminamos la empresa
        if (modulo.IDENTIFICADOR === moduloId) {
          // Busca el ID de la empresa y construye los datos de la eliminación
          const empresaData = empresas.find((item) => item.NOMBRE === empresa);
          if (empresaData && !permisoEliminado) {
            const usuarioid = idUsuario;
            const moduloid = moduloId;
            const emprid = empresaData.ID;
            dataUpdatePermiso = {
              usuarioid,
              moduloid,
              emprid,
            };

            // Realiza la eliminación del permiso solo una vez
            await DeletePermisoUsuario({ data: dataUpdatePermiso });
            permisoEliminado = true; // Asegura que solo elimine una vez
          }

          // Eliminar la empresa del módulo actual
          const updatedEmpresas = { ...modulo.EMPRESAS };
          delete updatedEmpresas[empresa]; // Eliminar la empresa
          return { ...modulo, EMPRESAS: updatedEmpresas }; // Devuelve el módulo actualizado
        }

        // Si el módulo tiene hijos, llamamos a la función recursiva
        if (modulo.children && modulo.children.length > 0) {
          const updatedChildren = await removeCompanyFromTree(
            modulo.children,
            moduloId,
            empresa
          );
          return { ...modulo, children: updatedChildren }; // Actualiza los hijos del módulo
        }

        return modulo; // Si no es el módulo que buscamos, lo devolvemos tal como está
      })
    );
    return updatedTree;
  };

  // Función para eliminar una empresa
  const handleRemoveCompany = async (moduloId, empresa) => {
    const updatedTree = await removeCompanyFromTree(tree, moduloId, empresa);
    setTree(updatedTree); // Actualizar el estado del árbol
  };

  const moduloActual = tree.find((permiso) => permiso.IDENTIFICADOR === modulo);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      {tree.length > 0 && moduloActual ? (
        <div
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              overflow: "auto",
              height: "100%",
              width: "100%",
              paddingRight: "8px",
            }}
          >
            <ul style={{ paddingLeft: "20px", margin: 0 }}>
              <PermisoNode
                node={moduloActual}
                onChangePermission={handleChangePermission}
                onAddCompany={handleAddCompany}
                onRemoveCompany={handleRemoveCompany}
              />
            </ul>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: theme.colors.textSecondary,
          }}
        >
          Cargando módulos...
        </div>
      )}
    </div>
  );
};
