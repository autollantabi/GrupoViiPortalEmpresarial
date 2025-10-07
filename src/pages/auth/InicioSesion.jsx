import React, { useState } from "react";
import styled from "styled-components";
// import "Css/InicioSesion.css";
import { NavLink } from "react-router-dom";
import { useAuthContext } from "context/authContext";
import { Loader1 } from "components/UI/Componentes/Loader1";
import { ROUTES } from "config/constantsRoutes";
import { ObtenerIDUsuario, UpdatePass } from "services/usuariosService";
import {
  ListarModulos,
  ListarPermisosUsuario,
} from "services/administracionService";
import {
  obtenerUsuario,
  getPermisosDeUsuarioArbol,
} from "services/loginService";

// import { input } from "@material-tailwind/react";
// import { faClose } from "@fortawesome/free-solid-svg-icons";

const ContenedorBg = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--primary);
`;

const ContenedorLogin = styled.div`
  box-shadow: 0 0 10px 0 var(--box-shadow-intense);
  background-color: rgba(84, 84, 87, 1);
  border-radius: 10px;
  animation: openPage 2s ease;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 15px;
  color: var(--color-perla);

  /* @keyframes openPage {
    0% {
      opacity: 0;
      transform: translateY(50vw) scale(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0px) scale(1);
    }
  } */
`;
const ContendorContenido = styled.div`
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  flex-grow: 1;
  gap: 15px;
  color: var(--color-perla);
  min-height: 20vh;
  width: 100%;

  

  @media (max-width: 430px) {
    flex-direction: column;
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
`;

const FormInputs = styled.input`
  width: 100%;
  outline: none;
  border: none;
  border-radius: 5px;
  padding: 2px;
  padding-left: 10px;
  min-width: 205px;

  &::placeholder {
    font-weight: 100;
  }
  &.contrasena {
    padding-right: 30px;
  }
`;

const FormInputSubmit = styled.input`
  border-radius: 5px;
  outline: none;
  border: none;
  padding: 3px;

  background-size: 200% 100%;
  background-position: 0 0;
  background-image: linear-gradient(
    to right,
    var(--color-3) 50%,
    var(--secondary) 50%
  );
  color: white;
  transition: background-position 1s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  text-decoration: none;

  &:hover {
    background-position: -100% 0;
  }
`;

const FormStructure = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 100%;
  min-width: 205px;
`;

const ContenidoAdicional = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 10vw;
  min-width: 100px;
`;

const SeparadorVertical = styled.div`
  height: 18vh;
  width: 1px;
  background-color: var(--separador);
  margin: 0 10px;
  @media (max-width: 430px) {
    height: 1px;
    width: 80%;
  }
`;
const AlertaMensaje = styled.div`
  color: var(--color-error);
  font-size: 13px;
`;
const MensajeConfirmacion = styled.div`
  color: var(--color-perla);
  font-size: 15px;
`;

const Texto = styled(NavLink)`
  font-size: 11px;
  font-weight: 500;
  padding-left: 5px;
  text-decoration: none;
  color: var(--color-perla);
`;

export default function InicioSesion() {
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarNuevaContrasena, setMostrarNuevaContrasena] = useState(false);
  const [mostrarConfirmacionContrasena, setMostrarConfirmacionContrasena] =
    useState(false);
  const [contrasena, setContrasena] = useState("");
  const [correo, setCorreo] = useState("");
  // const [error, setError] = useState(true, false);
  const [mensajeError, setMensajeError] = useState(""); // Variable para controlar el mensaje de error
  const [nuevaContrasena, setNuevaContrasena] = useState({
    nueva: "",
    confnueva: "",
  });
  const [primerInicioSesion, setPrimerInicioSesion] = useState(false);
  const [
    mostrarConfirmacionCambioContrasena,
    setMostrarConfirmacionCambioContrasena,
  ] = useState(false);
  const { login } = useAuthContext();

  const validarCorreoIngreso = (correo) => {
    // Aquí puedes realizar tu validación en tiempo real del correo
    // Si la validación falla, muestra el mensaje de error correspondiente
    // y si es exitosa, borra el mensaje de error.
    if (
      !/^(?:[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,})?$/i.test(correo)
    ) {
      setMensajeError("*El correo es incorrecto");
    } else {
      setMensajeError(""); // Borra el mensaje de error
    }
    setCorreo(correo);
  };

  const handleContrasenaChange = (e) => {
    setMensajeError("");
    setContrasena(e.target.value);
  };
  const handleContrasenaNuevaChange = (e) => {
    setMensajeError("");
    setNuevaContrasena((prevState) => ({
      ...prevState,
      nueva: e.target.value.trim(),
    }));
  };
  const handleContrasenaConfirmarChange = (e) => {
    setMensajeError("");
    setNuevaContrasena((prevState) => ({
      ...prevState,
      confnueva: e.target.value.trim(),
    }));
  };

  const togglePasswordVisibility = () => {
    setMostrarContrasena(!mostrarContrasena);
  };
  const togglePasswordVisibility1 = () => {
    setMostrarNuevaContrasena(!mostrarNuevaContrasena);
  };
  const togglePasswordVisibility2 = () => {
    setMostrarConfirmacionContrasena(!mostrarConfirmacionContrasena);
  };

  const actualizarContrasena = async (usuario, contrasena) => {
    const idUsuario = await ObtenerIDUsuario(usuario);

    let idU = idUsuario[0].IDENTIFICADOR;
    const resp = await UpdatePass(idU, contrasena);

    return resp;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (correo.trim() !== "") {
      const result = await obtenerUsuario(correo, contrasena);

      if (result !== undefined) {
        if (result.data.correo !== false) {
          if (result.data.mensaje !== false) {
            const primerRegistro = await ObtenerIDUsuario(correo);

            if (!primerInicioSesion) {
              if (primerRegistro.length > 0) {
                let pReg = primerRegistro[0].PRIMERASESION;

                if (pReg === 0) {
                  setPrimerInicioSesion(true);
                } else {
                  // const usu = await ObtenerIDUsuario(correo)
                  // console.log(usu);

                  let idUsu = result.data.id;
                  let permisos = await getPermisosDeUsuarioArbol({
                    usuarioID: idUsu,
                  });
                  let nombreUsuario = primerRegistro[0].NOMBRE;

                  permisos = JSON.stringify(permisos);

                  login(correo, contrasena, idUsu, permisos, nombreUsuario);
                }
              }
            } else {
              if (nuevaContrasena.nueva !== nuevaContrasena.confnueva) {
                setMensajeError("Las contraseñas no coinciden");
              } else {
                let actContrasena = actualizarContrasena(
                  correo,
                  nuevaContrasena.confnueva
                );
                if (actContrasena) {
                  setMostrarConfirmacionCambioContrasena(true);
                  setPrimerInicioSesion(false);
                  setContrasena("");
                  setTimeout(() => {
                    setMostrarConfirmacionCambioContrasena(false);
                  }, 4000);
                } else {
                  setMensajeError("Ha ocurrido un error");
                }
              }
            }
          } else {
            setMensajeError("*Contraseña incorrecta");
          }
        } else {
          setMensajeError("*El correo no se encuentra registrado");
        }
      }
    }
  };

  return (
    <ContenedorBg>
      <ContenedorLogin>
        <h2>Portal Empresarial</h2>
        <ContendorContenido>
          <ContenidoAdicional>
            <Loader1 />
            {/* <ImagenMostrar src={imagenUsuario} alt="..." /> */}
          </ContenidoAdicional>
          <SeparadorVertical />
          <FormStructure onSubmit={handleSubmit}>
            {mensajeError && (
              <AlertaMensaje className="alerta">{mensajeError}</AlertaMensaje>
            )}
            {mostrarConfirmacionCambioContrasena && (
              <MensajeConfirmacion className="conf">
                Su contraseña fue existosamente actualizada
              </MensajeConfirmacion>
            )}
            <FormInputs
              value={correo}
              type="text"
              placeholder="Correo electrónico"
              onChange={(e) => {
                validarCorreoIngreso(e.target.value);
              }}
            />
            {primerInicioSesion ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <div>
                  Como es tu primer inicio de sesión, por favor asigna una nueva
                  contraseña que recuerdes
                </div>
                <PasswordContainer>
                  <FormInputs
                    type={mostrarNuevaContrasena ? "text" : "password"}
                    placeholder="Contraseña Nueva"
                    value={nuevaContrasena.nueva}
                    onChange={handleContrasenaNuevaChange}
                    className="contrasena"
                    required={true}
                    minLength={8}
                  />

                  <ToggleButton
                    onClick={togglePasswordVisibility1}
                    className={
                      mostrarNuevaContrasena
                        ? "bi bi-eye-slash-fill"
                        : "bi bi-eye-fill"
                    }
                  />
                </PasswordContainer>
                <PasswordContainer>
                  <FormInputs
                    type={mostrarConfirmacionContrasena ? "text" : "password"}
                    placeholder="Confirmación Contraseña"
                    value={nuevaContrasena.confnueva}
                    onChange={handleContrasenaConfirmarChange}
                    className="contrasena"
                    required={true}
                    minLength={8}
                  />

                  <ToggleButton
                    onClick={togglePasswordVisibility2}
                    className={
                      mostrarConfirmacionContrasena
                        ? "bi bi-eye-slash-fill"
                        : "bi bi-eye-fill"
                    }
                  />
                </PasswordContainer>
              </div>
            ) : (
              <div>
                <PasswordContainer>
                  <FormInputs
                    type={mostrarContrasena ? "text" : "password"}
                    placeholder="Contraseña"
                    value={contrasena}
                    onChange={handleContrasenaChange}
                    className="contrasena"
                  />

                  <ToggleButton
                    onClick={togglePasswordVisibility}
                    className={
                      mostrarContrasena
                        ? "bi bi-eye-slash-fill"
                        : "bi bi-eye-fill"
                    }
                  />
                </PasswordContainer>
                <Texto to={ROUTES.RECOVERY}>Has olvidado tu contraseña?</Texto>
              </div>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
            >
              Ingresar
            </button>
          </FormStructure>
        </ContendorContenido>
      </ContenedorLogin>
    </ContenedorBg>
  );
}
