import React from "react";
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
  width: 560px;
  height: 220px;
  background-color: var(--primary);
  position: relative;
  padding: 15px 25px;
  border-radius: 10px;
  transform: translateY(-100px);
  z-index: 1000;
`;
// const ContendorCerrar = styled.div`
//   position: absolute;
//   top: 2px;
//   right: 2px;
//   & > button {
//     background-color: transparent;
//     border: none;
//     outline: none;
//     color: white;
//   }
// `;
// const InputCampo = styled.input`
//   outline: none;
//   width: 80%;
//   border: none;
//   border-radius: 5px;
//   padding: 2px 10px;
// `;
const BotonVerificar = styled.button`
  outline: none;
  width: fit-content;
  border: none;
  border-radius: 5px;
  padding: 2px 10px;
  background-color: var(--secondary);
  color: white;
`;

export const PopUpFinalizar = ({ cerrar }) => {
  // const [clave, setClave] = useState("");
  // const [confirmacion, setConfirmacion] = useState(0);

  // const validarClave = () => {
  //   if (clave === claveCorrecta) {
  //     setConfirmacion(1);
  //   } else {
  //     setConfirmacion(2);
  //   }
  //   setTimeout(() => {
  //     cerrar(false);
  //   }, 2000);
  // };

  return (
    <ContendorP>
      <Contendor1>
        {/* <ContendorCerrar>
          <button onClick={() => cerrar(false)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </ContendorCerrar> */}
        <div
          style={{
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: "15px",
          }}
        >
          <span>
            No se puede finalizar ya que hay campos de 'sugerido' que aun estan
            vacios.
            <br />
            Recuerde que todos los campos deberán estar llenos,
            <br /> incluso si esta bloqueado para compra debera llenarlo con 0
          </span>
          <BotonVerificar onClick={() => cerrar(false)}>
            {" "}
            Aceptar
          </BotonVerificar>
          {/* {confirmacion !== 0 && (
            <span style={{ fontSize: "12px" }}>
              {confirmacion === 1 ? "Clave Correcta" : "Clave Incorrecta"}
            </span>
          )} */}
        </div>
      </Contendor1>
    </ContendorP>
  );
};
