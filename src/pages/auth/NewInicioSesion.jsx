import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  CustomContainer,
  CustomImage,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { MODULES_TREE } from "config/constantsModulePermissions";
import { ROUTES_FLAT } from "config/constantsRoutes";
import { useAuthContext } from "context/authContext";
import { useTheme } from "context/ThemeContext";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPermisosDeUsuarioArbol } from "utils/permisosArbol";
import { hexToRGBA } from "utils/colors";
import styled from "styled-components";
import AWImage from "/src/assets/images/webp_png_jpeg/AW Color1.png";
import MImage from "/src/assets/images/webp_png_jpeg/M Color2.png";
import SImage from "/src/assets/images/webp_png_jpeg/S Color1.png";
import IImage from "/src/assets/images/webp_png_jpeg/I Color1.png";
import { authService_login } from "services/authService";

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const ContenedorImagenes = () => {
  const { theme } = useTheme();

  return (
    <CustomContainer
      flexDirection="column"
      style={{ backgroundColor: theme.colors.primary, borderRadius: "5px" }}
    >
      <CustomContainer>
        <CustomImage src={AWImage} objectFit={"contain"} height="50px" />
        <CustomImage src={MImage} objectFit={"contain"} height="50px" />
      </CustomContainer>
      <CustomContainer>
        <CustomImage src={SImage} objectFit={"contain"} height="50px" />
        <CustomImage src={IImage} objectFit={"contain"} height="50px" />
      </CustomContainer>
    </CustomContainer>
  );
};

const NewInicioSesion = () => {
  const { theme } = useTheme();
  const { login } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [toggleTypeInputPassword, setToggleTypeInputPassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleIniciarSesion = async (e) => {
    if (e) {
      e.preventDefault();
    }

    const response = await authService_login({
      correo: email,
      contrasena: password,
    });

    if (response.success) {
      const res_permisos = await getPermisosDeUsuarioArbol({
        usuarioID: response.data.USER_ID,
      });
      login({
        correo: email,
        identificador: response.data.USER_ID,
        modulos: JSON.stringify(res_permisos),
        nombreUsuario: response.data.NOMBRE,
      });
    }
    setErrorMessage(response.message);
  };

  return (
    <CustomContainer
      width="100%"
      height="100%"
      style={{ backgroundColor: theme.colors.primary }}
    >
      <CustomContainer
        width="fit-content"
        height="fit-content"
        flexDirection="column"
        style={{
          borderRadius: "5px",
          backgroundColor: hexToRGBA({ hex: theme.colors.white, alpha: 0.75 }),
        }}
      >
        <ContenedorImagenes />
        <StyledForm onSubmit={handleIniciarSesion}>
          <CustomContainer
            flexDirection="column"
            width="80%"
            style={{ gap: "10px" }}
          >
            <CustomText weight={600} size={"25px"}>
              Portal Empresarial
            </CustomText>
            <CustomInput
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={setEmail}
              iconLeft="bi bi-envelope"
              required
            />

            <CustomInput
              type={toggleTypeInputPassword ? "password" : "text"}
              placeholder="Contraseña"
              value={password}
              onChange={setPassword}
              iconLeft="bi bi-lock"
              iconRight={
                toggleTypeInputPassword
                  ? "bi bi-eye-slash-fill"
                  : "bi bi-eye-fill"
              }
              onClickIconRight={() =>
                setToggleTypeInputPassword(!toggleTypeInputPassword)
              }
              required
            />
            <CustomText
              size="12px"
              align="right"
              style={{ width: "100%" }}
              onClick={() => {
                navigate(ROUTES_FLAT[MODULES_TREE.RECOVERY]);
              }}
            >
              Olvide mi contraseña
            </CustomText>
            <CustomButton
              text="Iniciar sesión"
              style={{ width: "100%" }}
              onClick={handleIniciarSesion}
              type="submit"
            />
            <CustomText size={"13px"} color={theme.colors.error}>
              {errorMessage}
            </CustomText>
          </CustomContainer>
        </StyledForm>
      </CustomContainer>
    </CustomContainer>
  );
};

export default NewInicioSesion;
