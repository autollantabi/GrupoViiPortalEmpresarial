import React from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, ROUTES_FLAT } from "config/constantsRoutes";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { MODULES_TREE } from "config/constantsModulePermissions";
import { CategoriasProductosTecnicentro } from "./CategoriasProductosTecnicentro";

function ComisionesTecnicentroCategoriasContainer(props) {
  const navigate = useNavigate();
  return (
    <CustomContainer
      width="100%"
      height="100%"
      style={{ position: "relative" }}
    >
      <div
        style={{ position: "absolute", top: "5px", right: "5px", zIndex: 10 }}
      >
        <CustomButton
          text={"Comisiones"}
          onClick={() =>
            navigate(
              ROUTES_FLAT[MODULES_TREE.CONTABILIDAD.COMISIONES.TECNICENTRO]
            )
          }
          isAsync
        />
      </div>
      <CategoriasProductosTecnicentro {...props} />
    </CustomContainer>
  );
}

export { ComisionesTecnicentroCategoriasContainer };
