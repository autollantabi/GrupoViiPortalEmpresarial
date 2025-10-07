import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ROUTES } from "config/constantsRoutes";
import { EnviarCorreoRec, ObtenerIDUsuario, UpdatePass } from "services/usuariosService";
import { ObtenerTokenVal } from "services/recoveryService";

const Contenedor = styled.div`
  height: auto;
  max-width: 480px;
  min-width: 350px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  background-color: var(--bg-site);
  border-radius: 15px;
  padding: 30px;
  gap: 15px;
  position: relative;
  box-shadow: 0 0 8px var(--box-shadow-intense);
`;
const LinkLogin = styled(NavLink)`
  text-decoration: none;
  color: var(--color-perla);
  transition: transform 0.5s ease;
  position: absolute;
  bottom: -25px;
  left: 15px;
`;

const InputsCompletar = styled.input`
  width: 100%;
  border-radius: 5px;
  border: none;
  outline: none;
  padding: 4px 10px;
`;
const SubmitContrasena = styled.input`
  width: 90%;
  border-radius: 5px;
  border: none;
  outline: none;
  color: var(--color-perla);
  background-color: var(--color-3);
  padding: 4px 10px;

  &.enviando {
    background-color: var(--secondary);
    animation: sending 2s ease-in-out infinite;
    @keyframes sending {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  }
  &.enviado {
    background-color: var(--primary);
  }
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
// const ContenedorRecolectorCorreo = styled.div`
//   height: auto;
//   width: 100%;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   gap: 15px;
//   flex-direction: column;
// `;
const ContenedorInputs = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  width: 90%;
  & > label {
    color: var(--color-perla);
  }
`;

const ToggleButton = styled.i`
  position: absolute;
  right: 10px;
  cursor: pointer;
  color: var(--color-3);
`;

const PasswordContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const ErrorMensaje = styled.label`
  color: red;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 5px;
`;
const Mensaje = styled.div`
  color: var(--color-perla);
`;

export const PsRecovery = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] =
    useState(false);
  const [confirmarContrasena, setconfirmarContrasena] = useState("");
  const [correo, setCorreo] = useState("");
  const [correoUrl, setCorreoUrl] = useState(null);
  const [tokenUrl, setTokenUrl] = useState(null);
  const [deshabilitar, setDeshabilitar] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(false);
  const [actualizacionExitosa, setActualizacionExitosa] = useState(false);
  const [matchPassword, setMatchPassword] = useState(true);
  const [confirmacionValidacionToken, setConfirmacionValidacionToken] =
    useState(false);
  const [validarCorreo, setValidarCorreo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    let urlData = urlParams.get("y");
    let decodedQuery = decodeURIComponent(atob(urlData));
    const params = new URLSearchParams(decodedQuery);
    // console.log(decodedQuery);
    let corrulr = params.get("c");
    let tokulr = params.get("t");
    setCorreoUrl(params.get("c"));
    setTokenUrl(params.get("t"));
    if (corrulr !== null) {
      obtenerToken(corrulr, tokulr);
    }
  }, []);

  const obtenerToken = async (correo, token) => {
    const val = await ObtenerTokenVal(correo);
    if (val.data.length > 0) {
      console.log(val.data[0]);
      let tk = val.data[0].TOKEN;
      let timeLimit = val.data[0].EXPIRACION;
      let currentDate = new Date();
      let expirationDate = new Date(timeLimit);
      console.log("Current: " + currentDate);
      console.log("Limit: " + timeLimit);
      if (currentDate > expirationDate) {
        tk = tk.trim();
        if (tk.toString() === token.toString()) {
          setConfirmacionValidacionToken(true);
        }
      }
    }
  };

  const handleContrasenaChange = (e) => {
    setNuevaContrasena(e.target.value);
  };
  const handleConfirmarContrasenaChange = (e) => {
    setconfirmarContrasena(e.target.value);
  };
  const handleCorreo = (e) => {
    setCorreo(e.target.value);
  };
  const handleContrasenaKeyDown = (e) => {
    if (e.key === "Enter") {
      document.activeElement.blur();
    }
  };

  const togglePasswordVisibility1 = () => {
    setMostrarContrasena(!mostrarContrasena);
  };
  const togglePasswordVisibility2 = () => {
    setMostrarConfirmarContrasena(!mostrarConfirmarContrasena);
  };

  const enviarCorreoRecuperacion = async (e) => {
    e.preventDefault();
    const idUsuario = await ObtenerIDUsuario(correo);
    if (idUsuario.data.length > 0) {
      setDeshabilitar(true);
      const resp = await EnviarCorreoRec(correo);
      console.log(resp);
      if (resp.status === 200) {
        setTimeout(() => {
          setCorreoEnviado(true);
          // setDeshabilitar(false);
          setCorreo("");
        }, 3000);
      } else {
        setErrorEnvio(true);
      }
    } else {
      setValidarCorreo(true);
      setTimeout(() => {
        setValidarCorreo(false);
      }, 5000);
    }
    console.log(idUsuario);
  };
  const updatePassword = async (e) => {
    e.preventDefault();
    if (nuevaContrasena === confirmarContrasena) {
      const idUsuario = await ObtenerIDUsuario(correoUrl);

      let idU = idUsuario.data[0].IDENTIFICADOR;
      const resp = await UpdatePass(idU, confirmarContrasena);

      console.log(resp);
      if (resp.status === 200) {
        setActualizacionExitosa(true);
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 4000);
      } else {
        setErrorEnvio(true);
      }
    } else {
      setMatchPassword(false);
      setTimeout(() => {
        setMatchPassword(true);
      }, 10000);
    }
  };

  return (
    <Contenedor>
      {correoUrl !== null && tokenUrl !== null ? (
        actualizacionExitosa ? (
          <Mensaje>Su contraseña ha sido actualizada correctamente</Mensaje>
        ) : confirmacionValidacionToken ? (
          <ContenedorCambioContrasena onSubmit={updatePassword}>
            <ContenedorInputs>
              <label>Correo</label>
              <InputsCompletar
                type="text"
                placeholder="Correo"
                value={correoUrl}
                onChange={handleContrasenaChange}
                onKeyDown={handleContrasenaKeyDown}
                readOnly={true}
                className="contrasena"
              />
            </ContenedorInputs>
            <ContenedorInputs>
              <label>Contraseña Nueva*</label>
              <PasswordContainer>
                <InputsCompletar
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Contraseña nueva"
                  value={nuevaContrasena}
                  onChange={handleContrasenaChange}
                  onKeyDown={handleContrasenaKeyDown}
                  required={true}
                  className="contrasena"
                />

                <ToggleButton
                  onClick={togglePasswordVisibility1}
                  className={
                    mostrarContrasena
                      ? "bi bi-eye-slash-fill"
                      : "bi bi-eye-fill"
                  }
                />
              </PasswordContainer>
            </ContenedorInputs>
            <ContenedorInputs>
              <label>Confirmar Contraseña*</label>
              <PasswordContainer>
                <InputsCompletar
                  type={mostrarConfirmarContrasena ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmarContrasena}
                  onChange={handleConfirmarContrasenaChange}
                  onKeyDown={handleContrasenaKeyDown}
                  required={true}
                  className="contrasena"
                />

                <ToggleButton
                  onClick={togglePasswordVisibility2}
                  className={
                    mostrarConfirmarContrasena
                      ? "bi bi-eye-slash-fill"
                      : "bi bi-eye-fill"
                  }
                />
              </PasswordContainer>
            </ContenedorInputs>
            {!matchPassword && (
              <ErrorMensaje>Las contraseñas no coinciden</ErrorMensaje>
            )}
            <SubmitContrasena type="submit" value={"Cambiar Contraseña"} />
          </ContenedorCambioContrasena>
        ) : (
          <Mensaje>
            El link al que ingreso no es valido. Vuelva a solicitar un correo de
            recuperación
          </Mensaje>
        )
      ) : (
        <ContenedorCambioContrasena onSubmit={enviarCorreoRecuperacion}>
          <ContenedorInputs>
            <label>Correo*</label>
            <InputsCompletar
              type={"text"}
              placeholder="Correo"
              value={correo}
              onChange={handleCorreo}
              required={true}
              className="correo"
            />
          </ContenedorInputs>
          {validarCorreo && <ErrorMensaje>Correo no registrado</ErrorMensaje>}
          <SubmitContrasena
            className={
              correoEnviado ? "enviado" : deshabilitar ? "enviando" : ""
            }
            disabled={deshabilitar}
            type="submit"
            value={
              correoEnviado
                ? "Correo enviado, revise su bandeja"
                : deshabilitar
                ? "Enviando Correo ..."
                : errorEnvio
                ? "✖ Ha ocurrido un error, inténtelo mas tarde"
                : "Continuar"
            }
          />
        </ContenedorCambioContrasena>
      )}
      <LinkLogin to={ROUTES.LOGIN}>{"<-"} Iniciar Sesión</LinkLogin>
    </Contenedor>
  );
};
