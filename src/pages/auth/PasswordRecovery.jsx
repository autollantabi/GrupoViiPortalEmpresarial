import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { InputUI } from "components/UI/Components/InputUI";
import { hexToRGBA } from "utils/colors";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import {
  authService_enviarCorreoRecuperacion,
  authService_verificarTokenRecuperacion,
  authService_actualizarContrasena,
} from "services/authService";
import { toast } from "react-toastify";
import { TextUI } from "components/UI/Components/TextUI";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";

const Contenedor1 = styled.div`
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

const Contenedor = styled.div`
  width: 100%;
  max-width: 480px;
  min-width: 350px;
  height: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.modalBackground};
  border: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border, alpha: 0.5 })};
  border-radius: 20px;
  padding: 40px 35px;
  gap: 20px;
  position: relative;
  z-index: 1;
  box-shadow: ${({ theme }) =>
    `0 20px 60px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.3 })}`};
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) =>
      `0 25px 70px ${hexToRGBA({ hex: theme.colors.boxShadow, alpha: 0.4 })}`};
  }

  @media (max-width: 480px) {
    padding: 30px 25px;
    border-radius: 15px;
    min-width: 300px;
  }
`;

const ContenedorCambioContrasena = styled.form`
  width: 100%;
  height: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-direction: column;
`;

const ContenedorInputs = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  width: 100%;
  & > label {
    color: ${({ theme }) => theme.colors.text};
  }
`;

// Íconos de ojos se manejan con InputUI.iconRight

const ErrorMensaje = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
  background: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.error, alpha: 0.08 })};
  border: 1px solid
    ${({ theme }) => hexToRGBA({ hex: theme.colors.error, alpha: 0.18 })};
  padding: 10px 12px;
  border-radius: 10px;
  line-height: 1.4;
`;

const Mensaje = styled.div`
  color: ${({ theme }) => theme.colors.text};
`;

const Divisor = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  border-top: 1px solid
    ${({ theme }) => hexToRGBA({ hex: theme.colors.border, alpha: 0.5 })};
  align-items: center;
  padding: 15px 0 5px 0;
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

function PsRecovery() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [correo, setCorreo] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [matchPassword, setMatchPassword] = useState(true);
  const [resetToken, setResetToken] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const otpInputsRef = useRef([]);
  const otpLength = 6;
  const emptyOtpArray = Array.from({ length: otpLength }, () => "");

  const otpValue = otpValues.join("");

  const handleOtpValueChange = (index, value) => {
    const sanitized = value.replace(/\D/g, "").slice(-1);
    const updatedOtp = [...otpValues];
    updatedOtp[index] = sanitized;
    setOtpValues(updatedOtp);
    if (otpError) {
      setOtpError(false);
    }

    if (sanitized && index < otpLength - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (!sanitized && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < otpLength - 1) {
      event.preventDefault();
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const otpArray = emptyOtpArray.map((_, idx) => pasted[idx] || "");
    setOtpValues(otpArray);
    if (otpError) {
      setOtpError(false);
    }
    const lastFilledIndex = Math.min(pasted.length, otpLength) - 1;
    if (lastFilledIndex >= 0) {
      otpInputsRef.current[lastFilledIndex]?.focus();
    }
  };

  const validatePassword = (password) => {
    if (password.length < 10) {
      return "La contraseña debe tener al menos 10 caracteres.";
    }
    if (!/[0-9]/.test(password)) {
      return "Incluye al menos un número para mayor seguridad.";
    }
    return "";
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      toast.error("Ingresa un correo válido");
      return;
    }
    setIsLoading(true);
    const response = await authService_enviarCorreoRecuperacion({
      correo: correoLimpio,
    });
    setIsLoading(false);
    if (response.success) {
      const tokenGenerado = response.data?.resetToken ?? null;
      setResetToken(tokenGenerado);
      toast.success(
        response.message ||
          "Enviamos un código de verificación a tu correo electrónico"
      );
      setStep("otp");
    } else {
      toast.error(
        response.message ||
          "No pudimos enviar el correo de recuperación. Inténtalo nuevamente"
      );
    }
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    const otpIngresado = otpValue.trim();
    if (!otpIngresado) {
      setOtpError(true);
      toast.error("Ingresa el código que recibiste en tu correo");
      return;
    }
    if (!resetToken) {
      toast.error(
        "No encontramos una solicitud activa. Vuelve a ingresar tu correo"
      );
      setStep("email");
      setResetToken(null);
      setOtpValues(emptyOtpArray);
      return;
    }

    setIsLoading(true);
    setOtpError(false);
    const response = await authService_verificarTokenRecuperacion({
      token: resetToken,
      otp: otpIngresado,
    });
    setIsLoading(false);

    if (response.success) {
      toast.success("Código validado. Ingresa tu nueva contraseña");
      setStep("password");
      setResetToken(response.data?.resetToken ?? null);
      setRedirectCountdown(null);
    } else {
      setOtpError(true);
      toast.error(
        response.message || "El código ingresado es incorrecto o ha expirado"
      );
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    const nueva = nuevaContrasena.trim();
    const confirmada = confirmarContrasena.trim();

    if (!nueva || !confirmada) {
      toast.error("Completa ambos campos de contraseña");
      return;
    }

    const passwordValidationMessage = validatePassword(nueva);
    if (passwordValidationMessage) {
      setPasswordError(passwordValidationMessage);
      toast.error(passwordValidationMessage);
      return;
    }

    if (nueva !== confirmada) {
      setMatchPassword(false);
      setPasswordError("");
      toast.error("Las contraseñas deben ser iguales");
      return;
    }

    if (!resetToken) {
      toast.error(
        "No encontramos una solicitud activa. Vuelve a ingresar tu correo"
      );
      setStep("email");
      setResetToken(null);
      setRedirectCountdown(null);
      return;
    }

    setIsLoading(true);
    setMatchPassword(true);
    const respuesta = await authService_actualizarContrasena({
      token: resetToken,
      newPassword: confirmada,
    });
    setIsLoading(false);

    if (respuesta.success) {
      toast.success("Tu contraseña ha sido actualizada correctamente");
      setStep("success");
      setResetToken(null);
      setPasswordError("");
      setRedirectCountdown(5);
    } else {
      toast.error(
        respuesta.message || "No fue posible actualizar tu contraseña"
      );
      setPasswordError("");
    }
  };

  const togglePasswordVisibility1 = () => {
    setMostrarContrasena((prev) => !prev);
  };

  const togglePasswordVisibility2 = () => {
    setMostrarConfirmarContrasena((prev) => !prev);
  };

  const handleNavigateLogin = () => {
    navigate("/login");
  };

  useEffect(() => {
    if (step !== "success" || redirectCountdown === null) {
      return;
    }

    if (redirectCountdown <= 0) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, redirectCountdown, navigate]);

  const renderEmailStep = () => (
    <ContenedorCambioContrasena onSubmit={handleEmailSubmit}>
      <TextUI
        size="14px"
        align="left"
        style={{
          cursor: "pointer",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
        onClick={handleNavigateLogin}
      >
        <IconUI name="FaChevronLeft" size={12} /> Login
      </TextUI>
      <ContenedorInputs>
        <InputUI
          label="Correo*"
          type="text"
          placeholder="Correo"
          value={correo}
          iconLeft="FaRegEnvelope"
          onChange={(valor) => setCorreo(valor)}
          inputStyle={{ textTransform: "lowercase" }}
        />
      </ContenedorInputs>
      <ButtonUI
        text={isLoading ? "Enviando correo..." : "Continuar"}
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
    </ContenedorCambioContrasena>
  );

  const renderOtpStep = () => (
    <ContenedorCambioContrasena onSubmit={handleOtpSubmit}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "14px", color: theme.colors.textSecondary }}>
          Correo
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: theme.colors.text,
            wordBreak: "break-word",
          }}
        >
          {correo}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "14px", color: theme.colors.textSecondary }}>
          Ingresa el código de 6 dígitos
        </span>
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            width: "100%",
          }}
          onPaste={handleOtpPaste}
        >
          {otpValues.map((value, index) => (
            <input
              key={`otp-input-${index}`}
              ref={(element) => {
                otpInputsRef.current[index] = element;
              }}
              value={value}
              onChange={(event) =>
                handleOtpValueChange(index, event.target.value)
              }
              onKeyDown={(event) => handleOtpKeyDown(event, index)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              disabled={isLoading}
              style={{
                width: "48px",
                height: "56px",
                textAlign: "center",
                fontSize: "22px",
                borderRadius: "8px",
                border: otpError
                  ? `1px solid ${theme.colors.error}`
                  : `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                boxShadow: `0 1px 3px ${hexToRGBA({
                  hex: theme.colors.boxShadow,
                  alpha: 0.12,
                })}`,
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
            />
          ))}
        </div>
      </div>
      {otpError && (
        <ErrorMensaje>
          Código inválido o expirado. Inténtalo nuevamente
        </ErrorMensaje>
      )}
      <ButtonUI
        text={isLoading ? "Validando código..." : "Validar código"}
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
      <Divisor>
        <ButtonUI
          text="Ingresar otro correo"
          onClick={() => {
            setOtpValues(emptyOtpArray);
            setStep("email");
            setResetToken(null);
            setOtpError(false);
          }}
          variant="outlined"
          style={{ width: "100%" }}
          disabled={isLoading}
        />
      </Divisor>
    </ContenedorCambioContrasena>
  );

  const renderPasswordStep = () => (
    <ContenedorCambioContrasena onSubmit={handlePasswordSubmit}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "14px", color: theme.colors.textSecondary }}>
          Correo
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: theme.colors.text,
            wordBreak: "break-word",
          }}
        >
          {correo}
        </span>
      </div>
      <ContenedorInputs>
        <InputUI
          label="Contraseña nueva*"
          type={mostrarContrasena ? "text" : "password"}
          placeholder="Ingresa tu nueva contraseña"
          value={nuevaContrasena}
          onChange={(valor) => {
            setNuevaContrasena(valor);
            if (!matchPassword) {
              setMatchPassword(true);
            }
            if (passwordError) {
              setPasswordError("");
            }
          }}
          iconRight={
            mostrarContrasena ? "FaRegEyeSlash" : "FaRegEye"
          }
          onClickIconRight={togglePasswordVisibility1}
        />
      </ContenedorInputs>
      <div
        style={{
          width: "100%",
          background: hexToRGBA({ hex: theme.colors.info, alpha: 0.08 }),
          border: `1px solid ${hexToRGBA({
            hex: theme.colors.info,
            alpha: 0.16,
          })}`,
          color: theme.colors.infoDark || theme.colors.info,
          borderRadius: "10px",
          padding: "10px 12px",
          fontSize: "13px",
          lineHeight: 1.5,
        }}
      >
        Utiliza al menos 10 caracteres e incluye un número para que tu
        contraseña sea más segura.
      </div>
      <ContenedorInputs>
        <InputUI
          label="Confirmar contraseña*"
          type={mostrarConfirmarContrasena ? "text" : "password"}
          placeholder="Confirma tu nueva contraseña"
          value={confirmarContrasena}
          onChange={(valor) => {
            setConfirmarContrasena(valor);
            if (!matchPassword) {
              setMatchPassword(true);
            }
            if (passwordError) {
              setPasswordError("");
            }
          }}
          iconRight={
            mostrarConfirmarContrasena
              ? "FaRegEyeSlash"
              : "FaRegEye"
          }
          onClickIconRight={togglePasswordVisibility2}
        />
      </ContenedorInputs>
      {passwordError && <ErrorMensaje>{passwordError}</ErrorMensaje>}
      {!matchPassword && (
        <ErrorMensaje>
          Las contraseñas no coinciden. Revísalas e inténtalo de nuevo.
        </ErrorMensaje>
      )}
      <ButtonUI
        text={
          isLoading ? "Actualizando contraseña..." : "Actualizar contraseña"
        }
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
      <Divisor>
        <ButtonUI
          text="Cancelar"
          onClick={() => {
            setNuevaContrasena("");
            setConfirmarContrasena("");
            setStep("email");
            setResetToken(null);
            setOtpValues(emptyOtpArray);
            setPasswordError("");
            setMatchPassword(true);
            setRedirectCountdown(null);
          }}
          variant="outlined"
          style={{ width: "100%" }}
          disabled={isLoading}
        />
      </Divisor>
    </ContenedorCambioContrasena>
  );

  return (
    <Contenedor>
      {step === "success" ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "30px 20px",
            borderRadius: "16px",
            background: `linear-gradient(145deg, ${hexToRGBA({
              hex: theme.colors.success,
              alpha: 0.12,
            })}, ${hexToRGBA({ hex: theme.colors.success, alpha: 0.04 })})`,
            border: `1px solid ${hexToRGBA({
              hex: theme.colors.success,
              alpha: 0.24,
            })}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: hexToRGBA({ hex: theme.colors.success, alpha: 0.18 }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: theme.colors.successDark || theme.colors.success,
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: theme.colors.successDark || theme.colors.success,
            }}
          >
            ¡Tu contraseña fue actualizada con éxito!
          </div>
          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: theme.colors.textSecondary,
              maxWidth: "320px",
            }}
          >
            Te redirigiremos al inicio de sesión
            {redirectCountdown !== null
              ? ` en ${redirectCountdown} segundo${
                  redirectCountdown === 1 ? "" : "s"
                }.`
              : " en breve."}
          </div>
          <ButtonUI
            text="Ir al inicio de sesión ahora"
            onClick={handleNavigateLogin}
            variant="contained"
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        <>
          {step === "email" && renderEmailStep()}
          {step === "otp" && renderOtpStep()}
          {step === "password" && renderPasswordStep()}
        </>
      )}
    </Contenedor>
  );
}

export default function PasswordRecovery() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme?.name === "light";

  return (
    <Contenedor1>
      <ToggleThemeButton onClick={toggleTheme} title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}>
        <IconUI
          name={isLight ? "FaMoon" : "FaSun"}
          size={22}
          color={theme.colors.white}
        />
      </ToggleThemeButton>
      <PsRecovery />
    </Contenedor1>
  );
}
