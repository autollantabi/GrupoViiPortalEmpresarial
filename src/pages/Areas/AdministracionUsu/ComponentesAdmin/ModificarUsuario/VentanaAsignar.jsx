import React from "react";
import { ListaPermisos } from "../MantenimientoPermisos/MantenimientoPermisos";
import styled, { keyframes } from "styled-components";
import {
  ContenedorFlex,
  ContenedorFlexColumn,
} from "../../CSS/ComponentesAdminSC";

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
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const ContenedorPopUp = styled(ContenedorFlex)`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  height: 100%;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 10px;

  align-items: flex-start;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease forwards;
`;

const PopUp = styled(ContenedorFlex)`
  background-color: white;
  border-radius: 10px;
  height: 100%;
  width: 75%;
  justify-content: flex-start;
  transform: scale(0);
  animation: ${fadeIn1} 1s ease forwards;
`;

const IconoX = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  padding: 10px 15px 0 0;
  color: red;
  font-size: 20px;
  cursor: pointer;
`;

export const VentanaAsignar = (props) => {
  //url para poder hacer la consulta al backend

  //Acción del botón Cancelar
  const cancelar = async () => {
    await props.actualizarDataUsuario();
    props.setearmodulo("", "");
  };

  return (
    <ContenedorPopUp>
      <PopUp>
        <IconoX>
          <i className="bi bi-x-circle-fill" onClick={() => cancelar()}></i>
        </IconoX>
        <ContenedorFlexColumn
          style={{
            padding: "25px",
            height: "100%",
            width: "100%",
            alignItems: "stretch",
            justifyContent: "stretch",
          }}
        >
          <ListaPermisos modulo={props.idmodulo} idUsuario={props.usuario} />
         
        </ContenedorFlexColumn>
      </PopUp>
    </ContenedorPopUp>
  );
};
