import React from "react";
import styled from "styled-components";

import { useNavigate } from "react-router-dom";

import { ComisionesTecnicentro } from "./ReporteComisionesTecnicentro";
import { ButtonUI } from "components/UI/Components/ButtonUI";

const ContenedorPrincipal = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const BotonContainer = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 10;
`;

function ComisionesTecnicentroContainer(props) {
  const navigate = useNavigate();
  return (
    <ContenedorPrincipal>
      <BotonContainer>
        <ButtonUI
          text={"Categorías"}
          onClick={() =>
            navigate(
              "/contabilidad/comisiones/tecnicentro/productos"
            )
          }
          isAsync
        />
      </BotonContainer>
      <ComisionesTecnicentro {...props} />
    </ContenedorPrincipal>
  );
}

export { ComisionesTecnicentroContainer };
