import React, { useState } from "react";
import styled from "styled-components";

const ContendorP = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
`;
const Contendor1 = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 450px;
  height: 200px;
  background-color: var(--primary);
  position: relative;
  padding: 15px 25px;
  border-radius: 10px;
  transform: translateY(-100px);
  z-index: 1000;
`;
const ContendorCerrar = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  & > button {
    background-color: transparent;
    border: none;
    outline: none;
    color: white;
  }
`;
const InputCampo = styled.input`
  outline: none;
  width: 80%;
  border: none;
  border-radius: 5px;
  padding: 2px 10px;
`;
const BotonVerificar = styled.button`
  outline: none;
  width: fit-content;
  border: none;
  border-radius: 5px;
  padding: 2px 10px;
  background-color: var(--secondary);
  color: white;
`;

const claveCorrecta = "PedidosC123.";

export const PopUpEdicion = ({
  cerrar,
  correrSimulacion,
  actualizarEstado,
  empMarca,
}) => {
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState(0);

  const validarClave = () => {
    if (clave === claveCorrecta) {
      setConfirmacion(1);
      actualizarEstado(1);
      correrSimulacion();
    } else {
      setConfirmacion(2);
    }
    setTimeout(() => {
      cerrar(false);
    }, 2000);
  };

  return (
    <ContendorP>
      <Contendor1>
        <ContendorCerrar>
          <button onClick={() => cerrar(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </ContendorCerrar>
        <div
          style={{
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: "5px",
          }}
        >
          <span>
            Ya ha finalizado los pedidos de {empMarca.EMPRESA} -{" "}
            {empMarca.MARCA}, se necesita de una clave para poder editar de
            nuevo esta sección.
          </span>
          <InputCampo type="text" onChange={(e) => setClave(e.target.value)} />
          {clave !== "" && (
            <BotonVerificar onClick={() => validarClave()}>
              {" "}
              Verificar
            </BotonVerificar>
          )}
          {confirmacion !== 0 && (
            <span style={{ fontSize: "12px" }}>
              {confirmacion === 1 ? "Clave Correcta" : "Clave Incorrecta"}
            </span>
          )}
        </div>
      </Contendor1>
    </ContendorP>
  );
};
