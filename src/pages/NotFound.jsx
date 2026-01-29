import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "context/ThemeContext";

const NotFound = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  return (
    <ContainerUI
      width="100%"
      height="100%"
      flexDirection="column"
      style={{ gap: "10px", padding: "20px" }}
    >
      <TextUI color={theme.colors.text} size="18px" weight={600}>
        Página no encontrada. Busque en el menú lateral.
      </TextUI>
      <TextUI color={theme.colors.textSecondary} size="14px">
        Si no encuentra lo que busca, comuníquese con el departamento de TI.
      </TextUI>
      <ButtonUI
        iconLeft={"FaChevronLeft"}
        text={"Regresar al Inicio"}
        onClick={() => navigate("/")}
      />
    </ContainerUI>
  );
};

export default NotFound;
