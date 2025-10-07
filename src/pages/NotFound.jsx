import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { MODULES_TREE } from "config/constantsModulePermissions";
import { ROUTES_FLAT } from "config/constantsRoutes";
import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <CustomContainer
      width="100%"
      height="100%"
      flexDirection="column"
      style={{ gap: "10px" }}
    >
      <CustomText>Página no encontrada. Busque en el menú lateral.</CustomText>
      <CustomText>
        Si no encuentra lo que busca, comuníquese con el departamento de TI.
      </CustomText>
      <CustomButton
        iconLeft={"FaChevronLeft"}
        text={"Regresar al Inicio"}
        onClick={() => navigate(ROUTES_FLAT[MODULES_TREE.PORTAL])}
      />
    </CustomContainer>
  );
};

export default NotFound;
