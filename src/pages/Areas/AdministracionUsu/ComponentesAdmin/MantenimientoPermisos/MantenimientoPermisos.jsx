import React, { useState, useEffect } from "react";
import {
  ContenedorFlex,
  ContenedorFlexColumn,
} from "../../CSS/ComponentesAdminSC";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import styled from "styled-components";

import {
  DeletePermisoUsuario,
  ListarEmpresasAdmin,
  ListarModulos,
  ListarPermisosUsuario,
  UpdatePermisoUsuario,
} from "services/administracionService";

const SelectStyled = styled.select`
  padding: 2px 5px;
  border: solid 1px rgba(0, 0, 0, 0.4);
  border-radius: 5px;
`;

const ContenedorPermiso = styled(ContenedorFlex)`
  justify-content: flex-start;
  border: solid 1px rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  padding: 0;
`;
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
  if (!node) return null; // No renderiza nada si el nodo es indefinido

  const hasChildren = node.children && node.children.length > 0;
  const hasEmpresas = node.EMPRESAS && Object.keys(node.EMPRESAS).length > 0;

  //   console.log(node);

  return (
    <li style={{ padding: "2px", listStyleType: "none", position: "relative" }}>
      <span style={{ marginRight: "5px", position: "absolute", left: "-20px" }}>
        {node.PADRE === 0 ? (
          <i className="bi bi-dot"></i>
        ) : (
          <i className="bi bi-arrow-return-right"></i>
        )}
      </span>

      <ContenedorFlex style={{ justifyContent: "flex-start" }}>
        <strong>{node.MODULO}</strong>
        {!hasChildren && (
          <SelectStyled
            onChange={(e) => onAddCompany(node.IDENTIFICADOR, e.target.value)}
            value={""}
          >
            <option value="" disabled>
              Añadir Empresa
            </option>
            {availableCompanies
              .filter(
                (empresa) => !Object.keys(node.EMPRESAS).includes(empresa)
              ) // Filtrar empresas que ya están asignadas
              .map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
          </SelectStyled>
        )}
      </ContenedorFlex>

      {!hasChildren && hasEmpresas && (
        <ContenedorFlex
          style={{
            justifyContent: "flex-start",
            padding: "5px",
            flexWrap: "wrap",
          }}
        >
          {Object.entries(node.EMPRESAS).map(([empresa, permiso]) => (
            <ContenedorPermiso key={empresa}>
              <ContenedorFlex
                style={{
                  alignItems: "flex-start",
                  padding: "10px",
                  width: "fit-content",
                  position: "relative",
                  flexDirection: "column",
                }}
              >
                <ContenedorFlex
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <strong>{empresa}</strong>
                  <BotonConEstadoIconos
                    tipo={"delete"}
                    onClickAction={() =>
                      onRemoveCompany(node.IDENTIFICADOR, empresa)
                    }
                    invertir
                  />
                </ContenedorFlex>
                <ContenedorFlex>
                  <label>
                    <input
                      type="radio"
                      name={`permiso-${node.IDENTIFICADOR}-${empresa}`}
                      value="L"
                      checked={permiso === "L"}
                      onChange={(e) =>
                        onChangePermission(
                          node.IDENTIFICADOR,
                          empresa,
                          e.target.value
                        )
                      }
                    />
                    <span style={{ paddingLeft: "2px" }}>Lectura</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`permiso-${node.IDENTIFICADOR}-${empresa}`}
                      value="E"
                      checked={permiso === "E"}
                      onChange={(e) =>
                        onChangePermission(
                          node.IDENTIFICADOR,
                          empresa,
                          e.target.value
                        )
                      }
                    />
                    <span style={{ paddingLeft: "2px" }}>Escritura</span>
                  </label>
                </ContenedorFlex>
              </ContenedorFlex>
            </ContenedorPermiso>
          ))}
        </ContenedorFlex>
      )}

      {/* Renderizar los hijos si existen */}
      {hasChildren && (
        <ul>
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
    </li>
  );
};

export const ListaPermisos = ({ modulo, idUsuario }) => {
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
  return (
    <ContenedorFlex style={{ height: "100%" }}>
      {tree.length > 0 && (
        <ContenedorFlexColumn style={{ height: "100%", width: "70%" }}>
          <h3>
            Permisos{" "}
            {tree.map((permiso) => {
              return permiso.IDENTIFICADOR === modulo ? permiso.MODULO : "";
            })}
          </h3>
          <ContenedorFlex
            style={{
              overflow: "auto",
              height: "100%",
              width: "100%",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <ul>
              <PermisoNode
                node={tree.find((permiso) => permiso.IDENTIFICADOR === modulo)} // Renderizar el primer módulo en el árbol como ejemplo
                onChangePermission={handleChangePermission}
                onAddCompany={handleAddCompany}
                onRemoveCompany={handleRemoveCompany}
              />
            </ul>
          </ContenedorFlex>
        </ContenedorFlexColumn>
      )}
    </ContenedorFlex>
  );
};
