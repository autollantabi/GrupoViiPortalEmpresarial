import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { useAuthContext } from "context/authContext";
import { useTheme } from "context/ThemeContext";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { hexToRGBA } from "utils/colors";
import styled from "styled-components";
import AWImage from "/src/assets/images/webp_png_jpeg/AW Color1.png";
import MImage from "/src/assets/images/webp_png_jpeg/M Color2.png";
import SImage from "/src/assets/images/webp_png_jpeg/S Color1.png";
import IImage from "/src/assets/images/webp_png_jpeg/I Color1.png";
import { authService_login } from "services/authService";
import { ImageUI } from "components/UI/Components/ImageUI";
import IconUI from "components/UI/Components/IconsUI";

const ContenedorPrincipal = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => hexToRGBA({ hex: theme.colors.primary, alpha: 0.9 })} 100%
  );
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      ${({ theme }) => hexToRGBA({ hex: theme.colors.white, alpha: 0.1 })} 0%,
      transparent 70%
    );
    animation: pulse 20s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }
`;

const ContenedorFormulario = styled.div`
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.modalBackground};
  border: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border, alpha: 0.5 })};
  box-shadow: ${({ theme }) =>
    `0 20px 60px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.3 })}`};
  padding: 40px 35px;
  gap: 30px;
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) =>
      `0 25px 70px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.4 })}`};
  }

  @media (max-width: 480px) {
    padding: 30px 25px;
    border-radius: 15px;
  }
`;

const ContenedorImagenesPrincipal = styled.div`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => hexToRGBA({ hex: theme.colors.secondary, alpha: 1 })} ;
  border-radius: 15px;
  padding: 20px 15px;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) =>
      `0 12px 25px ${hexToRGBA({ hex: theme.colors.primary, alpha: 0.4 })}`};
  }
`;

const ContenedorImagenesFila = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const ContenedorImagen = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  max-width: 50%;
  overflow: hidden;
`;

const ContenedorFormularioInterno = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 20px;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
`;

const StyledTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.colors.text};
  
  /* Gradiente solo en modo claro, texto sólido en modo oscuro */
  ${({ theme }) =>
    theme.name === "light"
      ? `
    background: linear-gradient(
      135deg,
      ${theme.colors.text} 0%,
      ${theme.colors.primary} 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `
      : `
    color: ${theme.colors.text};
  `}
`;

const StyledForgotPassword = styled.span`
  width: 100%;
  cursor: pointer !important;
  text-align: right;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
    transform: translateX(-2px);
  }
`;

const StyledErrorMessage = styled.div`
  width: 100%;
  padding: 12px 16px;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.error, alpha: 0.1 })};
  border: 1px solid
    ${({ theme }) => hexToRGBA({ hex: theme.colors.error, alpha: 0.3 })};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 13px;
  text-align: center;
  animation: slideDown 0.3s ease;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ToggleThemeButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.white, alpha: 0.2 })};
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: ${({ theme }) =>
    `0 4px 15px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.2 })}`};

  &:hover {
    background-color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.white, alpha: 0.3 })};
    transform: scale(1.1) rotate(15deg);
    box-shadow: ${({ theme }) =>
      `0 6px 20px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.3 })}`};
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    top: 15px;
    right: 15px;
    width: 45px;
    height: 45px;
  }
`;

const ContenedorImagenes = () => {
  return (
    <ContenedorImagenesPrincipal>
      <ContenedorImagenesFila>
        <ContenedorImagen>
          <ImageUI src={AWImage} objectFit={"contain"} height="50px" />
        </ContenedorImagen>
        <ContenedorImagen>
          <ImageUI src={MImage} objectFit={"contain"} height="50px" />
        </ContenedorImagen>
      </ContenedorImagenesFila>
      <ContenedorImagenesFila>
        <ContenedorImagen>
          <ImageUI src={SImage} objectFit={"contain"} height="50px" />
        </ContenedorImagen>
        <ContenedorImagen>
          <ImageUI src={IImage} objectFit={"contain"} height="50px" />
        </ContenedorImagen>
      </ContenedorImagenesFila>
    </ContenedorImagenesPrincipal>
  );
};

export const LoginPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [toggleTypeInputPassword, setToggleTypeInputPassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const formRef = useRef(null);

  const handleIniciarSesion = async (e) => {
    // Prevenir el comportamiento por defecto del formulario (recargar página)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!email || !password) {
      setErrorMessage("Por favor completa todos los campos");
      return;
    }

    try {
      const response = await authService_login({
        correo: email,
        contrasena: password,
      });

      if (response.success) {
        // Ahora el login solo devuelve idSession, no userData
        // Los datos del usuario se obtienen después con /auth/me
        const idSession = response.idSession;
        
        login({
          idSession: idSession, // Solo pasar el idSession
        });
        setErrorMessage("");
      } else {
        console.error("❌ [NEW_INICIO_SESION] Login falló:", response.message);
        setErrorMessage(response.message);
      }
    } catch (error) {
      console.error("❌ [NEW_INICIO_SESION] Error en handleIniciarSesion:", error);
      setErrorMessage("Error al iniciar sesión. Inténtalo nuevamente.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      // Disparar el submit del formulario directamente
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }
  };

  const isLight = theme?.name === "light";

  return (
    <ContenedorPrincipal>
      <ToggleThemeButton onClick={toggleTheme} title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
        <IconUI
          name={isLight ? "FaMoon" : "FaSun"}
          size={22}
          color={theme.colors.white}
        />
      </ToggleThemeButton>
      <ContenedorFormulario>
        <ContenedorImagenes />
        <StyledForm ref={formRef} onSubmit={handleIniciarSesion}>
          <ContenedorFormularioInterno>
            <StyledTitle>Portal Empresarial</StyledTitle>
            <InputUI
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={setEmail}
              iconLeft="FaRegEnvelope"
              onKeyDown={handleKeyDown}
              required
            />

            <InputUI
              type={toggleTypeInputPassword ? "password" : "text"}
              placeholder="Contraseña"
              value={password}
              onChange={setPassword}
              iconLeft="FaLock"
              iconRight={
                toggleTypeInputPassword
                  ? "FaRegEyeSlash"
                  : "FaRegEye"
              }
              onClickIconRight={() =>
                setToggleTypeInputPassword(!toggleTypeInputPassword)
              }
              onKeyDown={handleKeyDown}
              required
            />
            <StyledForgotPassword
              onClick={() => {
                navigate("/recovery");
              }}
            >
              Olvidé mi contraseña
            </StyledForgotPassword>
            <ButtonUI
              text="Iniciar sesión"
              style={{ 
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 600,
                marginTop: "5px"
              }}
              isAsync={true}
              type="submit"
            />
            {errorMessage && (
              <StyledErrorMessage>{errorMessage}</StyledErrorMessage>
            )}
          </ContenedorFormularioInterno>
        </StyledForm>
      </ContenedorFormulario>
    </ContenedorPrincipal>
  );
};

export default LoginPage;
