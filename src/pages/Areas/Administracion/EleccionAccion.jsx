import React, { useState } from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { useTheme } from "context/ThemeContext";
import { GestionUsuarios } from "./GestionUsuarios/GestionUsuarios";
import { UsuariosAppShell } from "./UsuariosAppShell/UsuariosAppShell";
import { MantenimientoPermisosNuevos } from "./MantenimientoPermisosNuevos/MantenimientoPermisosNuevos";
import styled from "styled-components";

/** Una sola fuente de verdad: label y componente por opción (el índice del array es la clave) */
const OPCIONES_ADMIN = [
  { label: "Gestion Usuarios", component: GestionUsuarios },
  { label: "Usuarios App Shell", component: UsuariosAppShell },
  { label: "Mantenimiento de Permisos", component: MantenimientoPermisosNuevos },
];

const EleccionAccionOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 6px 10px 15px;
  gap: 8px;
  cursor: pointer;
  background-color: ${({ $activo, $theme }) =>
    $activo ? ($theme?.colors?.secondary ?? "#3c3c3b") : "transparent"};
  color: ${({ $activo, $theme }) =>
    $activo
      ? ($theme?.colors?.textInverse ?? $theme?.colors?.white ?? "#fff")
      : ($theme?.colors?.text ?? "#212529")};
  transition: background-color 0.15s ease, color 0.15s ease;

  & * {
    color: inherit;
  }

  &:hover {
    background-color: ${({ $activo, $theme }) =>
    $activo
      ? ($theme?.colors?.secondary ?? "#3c3c3b")
      : ($theme?.colors?.backgroundLight ?? "#fafafa")};
    color: ${({ $activo, $theme }) =>
    $activo
      ? ($theme?.colors?.textInverse ?? $theme?.colors?.white ?? "#fff")
      : ($theme?.colors?.primary ?? "#fd4703")};
  }
`;

const EleccionAccion = ({ opciones, indiceSeleccionado, onCambiarAccion }) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        width: "180px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        borderRight: `2px solid ${theme.colors.border || theme.colors.divider}`,
        backgroundColor: theme.colors.backgroundCard ?? theme.colors.background,
      }}
    >
      {opciones.map((opcion, index) => (
        <EleccionAccionOption
          key={index}
          $activo={indiceSeleccionado === index}
          $theme={theme}
          onClick={() => onCambiarAccion(index)}
        >
          <TextUI>{opcion.label}</TextUI>
        </EleccionAccionOption>
      ))}
    </div>
  );
};

export const ComponenteAdministracionUsuario = () => {
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);

  const ComponenteSeleccionado = OPCIONES_ADMIN[indiceSeleccionado]?.component;

  return (
    <ContainerUI
      flexDirection="row"
      width="100%"
      height="100%"
      style={{ alignItems: "flex-start" }}
    >
      <EleccionAccion
        opciones={OPCIONES_ADMIN}
        indiceSeleccionado={indiceSeleccionado}
        onCambiarAccion={setIndiceSeleccionado}
      />
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
    </ContainerUI>
  );
};
