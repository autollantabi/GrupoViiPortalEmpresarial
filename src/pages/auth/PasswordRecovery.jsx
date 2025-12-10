import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ROUTES } from "config/constantsRoutes";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { hexToRGBA } from "utils/colors";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  authService_enviarCorreoRecuperacion,
  authService_verificarTokenRecuperacion,
  authService_actualizarContrasena,
} from "services/authService";
import { toast } from "react-toastify";

const Contenedor1 = styled.div`
  height: 100vh;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Contenedor = styled.div`
  height: auto;
  max-width: 480px;
  min-width: 350px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.white, alpha: 0.8 })};
  border-radius: 15px;
  padding: 30px;
  gap: 15px;
  position: relative;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
`;

const ContenedorCambioContrasena = styled.form`
  height: auto;
  max-width: 480px;
  min-width: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-direction: column;
  border-radius: 15px;
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

// Íconos de ojos se manejan con CustomInput.iconRight

const ErrorMensaje = styled.div`
  width: 100%;
  color: #b3261e;
  font-size: 14px;
  background: rgba(179, 38, 30, 0.08);
  border: 1px solid rgba(179, 38, 30, 0.18);
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
    ${({ theme }) => hexToRGBA({ hex: theme.colors.primary, alpha: 0.2 })};
  align-items: center;
  padding: 10px 0;
`;

function PsRecovery() {
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
    navigate(ROUTES.LOGIN);
  };

  useEffect(() => {
    if (step !== "success" || redirectCountdown === null) {
      return;
    }

    if (redirectCountdown <= 0) {
      navigate(ROUTES.LOGIN);
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, redirectCountdown, navigate]);

  const renderEmailStep = () => (
    <ContenedorCambioContrasena onSubmit={handleEmailSubmit}>
      <ContenedorInputs>
        <CustomInput
          label="Correo*"
          type="text"
          placeholder="Correo"
          value={correo}
          iconLeft={"bi bi-envelope"}
          onChange={(valor) => setCorreo(valor)}
          inputStyle={{ textTransform: "lowercase" }}
        />
      </ContenedorInputs>
      <CustomButton
        text={isLoading ? "Enviando correo..." : "Continuar"}
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
      <Divisor>
        <CustomButton
          text="Iniciar Sesión"
          onClick={handleNavigateLogin}
          variant="outlined"
          style={{ width: "100%" }}
          disabled={isLoading}
        />
      </Divisor>
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
        <span style={{ fontSize: "14px", color: "#555" }}>Correo</span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f1f1f",
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
        <span style={{ fontSize: "14px", color: "#555" }}>
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
                border: otpError ? "1px solid #d32f2f" : "1px solid #ccc",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
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
      <CustomButton
        text={isLoading ? "Validando código..." : "Validar código"}
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
      <Divisor>
        <CustomButton
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
        <span style={{ fontSize: "14px", color: "#555" }}>Correo</span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#1f1f1f",
            wordBreak: "break-word",
          }}
        >
          {correo}
        </span>
      </div>
      <ContenedorInputs>
        <CustomInput
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
            mostrarContrasena ? "bi bi-eye-slash-fill" : "bi bi-eye-fill"
          }
          onClickIconRight={togglePasswordVisibility1}
        />
      </ContenedorInputs>
      <div
        style={{
          width: "100%",
          background: "rgba(33, 150, 243, 0.08)",
          border: "1px solid rgba(33, 150, 243, 0.16)",
          color: "#1f5f8b",
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
        <CustomInput
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
              ? "bi bi-eye-slash-fill"
              : "bi bi-eye-fill"
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
      <CustomButton
        text={
          isLoading ? "Actualizando contraseña..." : "Actualizar contraseña"
        }
        type="submit"
        variant="contained"
        disabled={isLoading}
        style={{ width: "100%" }}
      />
      <Divisor>
        <CustomButton
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
            background:
              "linear-gradient(145deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.04))",
            border: "1px solid rgba(33, 150, 243, 0.24)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(33, 150, 243, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              color: "#1f5f8b",
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#1f5f8b",
            }}
          >
            ¡Tu contraseña fue actualizada con éxito!
          </div>
          <div
            style={{
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#294552",
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
          <CustomButton
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
  return (
    <Contenedor1>
      <PsRecovery />
    </Contenedor1>
  );
}
