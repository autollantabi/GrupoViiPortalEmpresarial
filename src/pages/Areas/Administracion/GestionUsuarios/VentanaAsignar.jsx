import React from "react";
import { ListaPermisos } from "./MantenimientoPermisos/MantenimientoPermisos";
import styled, { keyframes } from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import IconUI from "components/UI/Components/IconsUI";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeIn1 = keyframes`
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const ContenedorPopUp = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease forwards;
`;

const PopUp = styled.div`
  background-color: white;
  border-radius: 10px;
  height: 85vh;
  width: 80%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  position: relative;
  transform: scale(0.9);
  opacity: 0;
  animation: ${fadeIn1} 0.3s ease forwards;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const IconoX = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  color: red;
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ContenedorInterno = styled.div`
  padding: 25px;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TituloVentana = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid
    ${({ theme }) => hexToRGBA({ hex: theme.colors.primary, alpha: 0.2 })};
`;

const ContenedorLista = styled.div`
  flex: 1;
  overflow: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.primary, alpha: 0.05 })};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.primary, alpha: 0.3 })};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) =>
        hexToRGBA({ hex: theme.colors.primary, alpha: 0.5 })};
    }
  }
`;

export const VentanaAsignar = (props) => {
  const { theme } = useTheme();

  //Acción del botón Cancelar
  const cancelar = async () => {
    await props.actualizarDataUsuario();
    props.setearmodulo("", "");
  };

  return (
    <ContenedorPopUp
      onClick={(e) => e.target === e.currentTarget && cancelar()}
    >
      <PopUp onClick={(e) => e.stopPropagation()}>
        <IconoX onClick={cancelar}>
          <IconUI name="FaCircleXmark" size={14} color={theme.colors.text} />
        </IconoX>
        <ContenedorInterno>
          <TituloVentana theme={theme}>
            Asignar Permisos - {props.modulo || "Módulo"}
          </TituloVentana>
          <ContenedorLista theme={theme}>
            <ListaPermisos modulo={props.idmodulo} idUsuario={props.usuario} />
          </ContenedorLista>
        </ContenedorInterno>
      </PopUp>
    </ContenedorPopUp>
  );
};
