import React from "react";

import { useNavigate } from "react-router-dom";

import { ComisionesTecnicentro } from "./ReporteComisionesTecnicentro";
import { ROUTES, ROUTES_FLAT } from "config/constantsRoutes";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { MODULES_TREE } from "config/constantsModulePermissions";

function ComisionesTecnicentroContainer() {
  const navigate = useNavigate();
  return (
    <CustomContainer
      width="100%"
      height="100%"
      style={{ position: "relative" }}
    >
      <div style={{ position: "absolute", top: "5px", right: "5px" }}>
        <CustomButton
          text={"Categorías"}
          onClick={() =>
            navigate(
              ROUTES_FLAT[
                MODULES_TREE.CONTABILIDAD.COMISIONES.TECNICENTRO_CATEGORIAS
              ]
            )
          }
          isAsync
        />
      </div>
      <ComisionesTecnicentro />
    </CustomContainer>
  );
}

export { ComisionesTecnicentroContainer };
