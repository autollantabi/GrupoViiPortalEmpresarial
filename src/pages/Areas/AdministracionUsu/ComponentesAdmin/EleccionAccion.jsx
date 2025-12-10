import React, { useState } from "react";
import { Admin_ActualizarTransferencias } from "./Bancos/Admin_ActualizarTransferencias";
import { ListaModulos } from "./CrearModulo/CreacionSecciones";
import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";
import { TiposUsuario } from "./TiposUsuario/TiposUsuario";
import { GestionUsuarios } from "./GestionUsuarios/GestionUsuarios";
import { UsuariosPortalMayorista } from "./UsuariosPortalMayorista/UsuariosPortalMayorista";
import styled from "styled-components";

const EleccionAccionOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 6px 10px 15px;
  gap: 8px;
  background-color: ${({ activo, theme }) =>
    activo ? theme.colors.secondary : "transparent"};
  &:hover {
    background-color: ${({ activo, theme }) =>
      activo ? theme.colors.primaryHover : theme.colors.background};
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
  }
`;

const EleccionAccion = (props) => {
  const [activo, setActivo] = useState(1);
  const { theme } = useTheme();

  const acciones = [
    { id: 1, label: "Gestion Usuarios" },
    { id: 2, label: "Tipos de Usuario" },
    { id: 3, label: "Creacion Secciones" },
    { id: 4, label: "Bancos" },
    { id: 5, label: "Usuarios Portal Mayorista" },
  ];

  const handleAccion = (id) => {
    setActivo(id);
    props.setAccion(id);
  };

  return (
    <div
      style={{
        width: "180px",
        height: "100%",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        borderRight: `2px solid ${
          theme.colors.borderColor || theme.colors.placeholder
        }`,
      }}
    >
      {acciones.map((accion) => (
        <EleccionAccionOption
          key={accion.id}
          activo={activo === accion.id}
          onClick={() => handleAccion(accion.id)}
        >
          <CustomText
            color={
              activo === accion.id ? theme.colors.white : theme.colors.primary
            }
          >
            {accion.label}
          </CustomText>
        </EleccionAccionOption>
      ))}
    </div>
  );
};

export const ComponenteAdministracionUsuario = () => {
  const [accion, setAccion] = useState(1);

  const componentes = {
    1: GestionUsuarios,
    2: TiposUsuario,
    3: ListaModulos,
    4: Admin_ActualizarTransferencias,
    5: UsuariosPortalMayorista,
  };

  const ComponenteSeleccionado = componentes[accion];

  /*---------- Mostrar Acciones ------------*/
  const obtenerAccion = (variable) => {
    setAccion(variable);
  };

  return (
    <CustomContainer
      flexDirection="row"
      width="100%"
      height="100%"
      style={{ alignItems: "flex-start" }}
    >
      <EleccionAccion setAccion={obtenerAccion} />
      <div
        style={{
          padding: "10px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          flex: "1",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        {ComponenteSeleccionado && <ComponenteSeleccionado />}
      </div>
    </CustomContainer>
  );
};
