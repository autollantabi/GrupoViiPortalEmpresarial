import React, { useState, useEffect } from "react";
import { ContenedorFlex } from "../../CSS/ComponentesAdminSC";
import styled from "styled-components";
import {
  AgregarModulo,
  EliminarModulo,
  ListarModulos,
} from "services/administracionService";

import { toast } from "react-toastify";
import { ToastContainerCustom } from "components/UI/ComponentesGenericos/Toasts";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

const InputStyled = styled.input`
  padding: 2px 5px;
  margin-right: 5px;
  border: solid 1px rgba(0, 0, 0, 0.4);
  border-radius: 5px;
`;

// Función para construir el árbol de módulos
const buildTree = (modules) => {
  const map = {};
  const roots = [];

  modules.forEach((modulo) => {
    map[modulo.IDENTIFICADOR] = { ...modulo, children: [] };
  });

  modules.forEach((modulo) => {
    if (modulo.PADRE === 0) {
      roots.push(map[modulo.IDENTIFICADOR]);
    } else if (map[modulo.PADRE]) {
      map[modulo.PADRE].children.push(map[modulo.IDENTIFICADOR]);
    }
  });

  return roots;
};

// Función para obtener los módulos finales (aquellos sin hijos)
const getFinalModules = (nodes, parentName = "") => {
  let finalModules = [];

  nodes.forEach((node) => {
    // Formato del nombre del módulo, incluyendo padres si los hay
    const currentName = parentName
      ? `${parentName} > ${node.MODULO}`
      : node.MODULO;

    // Agregar todos los módulos a la lista, tengan o no hijos
    finalModules.push({ id: node.IDENTIFICADOR, name: currentName });

    // Si tiene hijos, continuar el recorrido de los hijos
    if (node.children && node.children.length > 0) {
      finalModules = [
        ...finalModules,
        ...getFinalModules(node.children, currentName),
      ];
    }
  });

  return finalModules;
};

// Componente que renderiza recursivamente cada módulo
const ModuloNode = ({ node, onDeleteModulo }) => {
  if (!node) {
    return null; // No renderiza nada si el nodo es indefinido
  }

  return (
    <div
      style={
        node.PADRE === 0
          ? {
              border: "solid 1px gray",
              padding: "10px",
              borderRadius: "10px",
              boxShadow: "0 0 7px gray",
            }
          : {}
      }
    >
      <ContenedorFlex style={{ justifyContent: "flex-start" }}>
        <strong>
          {node.PADRE === 0 ? (
            <i className="bi bi-dot"></i>
          ) : (
            <i className="bi bi-arrow-return-right"></i>
          )}{" "}
          {node.MODULO}
        </strong>
        {node.children.length === 0 && (
          <BotonConEstadoIconos
            onClickAction={() => onDeleteModulo(node.IDENTIFICADOR)}
            tipo={"delete"}
            invertir
          />
        )}
      </ContenedorFlex>

      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <ModuloNode
              key={child.IDENTIFICADOR}
              node={child}
              onDeleteModulo={onDeleteModulo}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export const ListaModulos = () => {
  const [moduloState, setModuloState] = useState([]); // Estado de los módulos
  const [newModuleName, setNewModuleName] = useState(""); // Nombre del nuevo módulo
  const [selectedModuleId, setSelectedModuleId] = useState(""); // ID del módulo seleccionado
  const [tree, setTree] = useState([]);
  const [finalModules, setFinalModules] = useState([]); // Lista de módulos finales para el select

  const consultarModulos = async () => {
    const modls = await ListarModulos();

    setModuloState(modls);
    const treeData = buildTree(modls);
    setTree(treeData);
    // Obtener los módulos finales
    const finalModulesList = getFinalModules(treeData);
    setFinalModules(finalModulesList);
  };

  useEffect(() => {
    consultarModulos();
  }, []);

  // Agregar una nueva sección (módulo o submódulo)
  const handleAddSeccion = async () => {
    if (!newModuleName.trim()) return; // No agregar si el nombre está vacío

    const parentId = selectedModuleId.value
      ? parseInt(selectedModuleId.value)
      : 0; // Si hay módulo seleccionado, será el padre, sino será módulo padre

    const newModule = {
      nombreModulo: newModuleName,
      codigoPadre: parentId,
    };
    const res = await AgregarModulo({ data: newModule });
    if (res) {
      consultarModulos();
      setSelectedModuleId("");
      setNewModuleName("");
      toast.success("Sección agregada correctamente"); // Notificación de éxito
    } else {
      toast.error("Error al agregar la sección"); // Notificación de error
    }
  };

  // Eliminar un módulo o submódulo
  const handleDeleteModulo = async (moduloId) => {
    let res = false;
    const elim = await EliminarModulo({ data: { moduloid: moduloId } });
    if (elim) {
      toast.success("Eliminación correcta"); // Notificación de
      res = true;
    } else {
      toast.error("No se puede eliminar porque tiene permisos asociados"); // Notificación de error
      res = false;
    }
    consultarModulos();
    return res;
    // console.log(elim);

    // Filtrar el módulo y todos sus hij
  };

  return (
    <div>
      <h2>Gestión de Módulos y Secciones</h2>

      {/* Campo para agregar nuevos módulos o submódulos */}
      <ContenedorFlex style={{ marginBottom: "10px" }}>
        <CustomSelect
          options={finalModules.map((modulo) => ({
            value: modulo.id,
            label: modulo.name,
          }))}
          onChange={setSelectedModuleId}
          value={selectedModuleId}
          isSearchable={true}
          maxWidth="500px"
          minWidth="350px"
        />

        <CustomInput
          placeholder="Nombre de la sección"
          value={newModuleName}
          onChange={(text) => setNewModuleName(text.toUpperCase())}
          containerStyle={{ width: "250px" }}
        />
        <CustomButton text={"Agregar"} onClick={handleAddSeccion} />
      </ContenedorFlex>

      {/* Lista de módulos y submódulos */}
      <ContenedorFlex style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        {tree.map((modulo) => (
          <ModuloNode
            key={modulo.IDENTIFICADOR}
            node={modulo}
            onDeleteModulo={handleDeleteModulo}
          />
        ))}
      </ContenedorFlex>
      <ToastContainerCustom />
    </div>
  );
};
