import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CategoriasProductosTecnicentro } from "./CategoriasProductosTecnicentro";

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

function ComisionesTecnicentroCategoriasContainer(props) {
  const navigate = useNavigate();
  return (
    <ContenedorPrincipal>
      <BotonContainer>
        <ButtonUI
          text={"Comisiones"}
          onClick={() =>
            navigate(
              "/contabilidad/comisiones/tecnicentro/reportes"
            )
          }
          isAsync
        />
      </BotonContainer>
      <CategoriasProductosTecnicentro {...props} />
    </ContenedorPrincipal>
  );
}

export { ComisionesTecnicentroCategoriasContainer };
