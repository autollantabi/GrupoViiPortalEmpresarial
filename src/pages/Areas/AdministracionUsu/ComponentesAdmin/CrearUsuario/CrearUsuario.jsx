import React, { useState } from "react";
import {
  CrearUsuarios,
  EnviarCorreoRegistro,
} from "services/administracionService";

import { toast } from "react-toastify";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

export const CrearUsuario = () => {
  const { theme } = useTheme();
  const [correo, setcorreo] = useState("");
  const [contrasena, setcontrasena] = useState("");
  const [nombre, setnombre] = useState("");
  const [mensaje, setmensaje] = useState("");

  const handleCorreo = (e) => {
    setcorreo(e);
  };
  const handleContrasena = (e) => {
    setcontrasena(e);
  };
  const handleNombre = (e) => {
    setnombre(e);
  };
  const validarCampos = (campo, lab) => {
    let confirmacion = "";
    campo = campo.trim();
    if (lab === 1) {
      if (
        !/^(?:[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,})?$/i.test(campo)
      ) {
        confirmacion = "Correo Invalido";
      }
    } else if (lab === 2) {
      if (campo.length < 5) {
        confirmacion = "Contraseña Incorrecta";
      }
    } else if (lab === 3) {
      if (campo.length <= 15) {
        confirmacion = "Nombre muy corto, min 15 caracteres";
      }
    }

    return confirmacion;
  };

  const handleCrearUsuario = async () => {
    let conf = validarCampos(nombre, 3);
    if (conf === "") {
      conf = validarCampos(correo, 1);
      if (conf === "") {
        conf = validarCampos(contrasena, 2);
        if (conf === "") {
          const resCreacion = await CrearUsuarios({
            correo,
            contrasena,
            nombre,
          });
          if (resCreacion) {
            const respEnvioCorreo = await EnviarCorreoRegistro({
              correoDestino: correo,
              contrasena,
            });
            if (respEnvioCorreo) {
              toast.success("Usuario Creado con Exito");
              setmensaje("");
              handleContrasena("");
              handleCorreo("");
              handleNombre("");
              return true;
            } else {
              setmensaje("Ha ocurrido un error, intenta de nuevo");
              return false;
            }
          } else {
            setmensaje(
              "Error de creacion, revisar si ya existe el correo ingresado"
            );
          }
        } else {
          setmensaje(conf);
        }
      } else {
        setmensaje(conf);
      }
    } else {
      setmensaje(conf);
    }
  };

  return (
    <CustomContainer width="100%">
      <CustomContainer
        width="400px"
        style={{
          backgroundColor: hexToRGBA({ hex: theme.colors.primary, alpha: 0.5 }),
        }}
      >
        <CustomContainer
          flexDirection="column"
          width="100%"
          style={{ gap: "5px", width: "100%" }}
        >
          {mensaje !== "" && (
            <span
              style={{
                backgroundColor: "white",
                color: "red",
                padding: "2px 10px",
                border: "solid 1px red",
                borderRadius: "5px",
                fontSize: "13px",
                width: "100%",
              }}
              className="mensaje-crear"
            >
              {mensaje}
            </span>
          )}
          <CustomInput
            placeholder="Nombre Completo"
            value={nombre}
            onChange={handleNombre}
          />
          <CustomInput
            placeholder="Correo"
            value={correo}
            onChange={handleCorreo}
          />
          <CustomInput
            placeholder="Contraseña"
            value={contrasena}
            onChange={handleContrasena}
          />
          {nombre !== "" && correo !== "" && contrasena !== "" && (
            <CustomButton
              onClick={handleCrearUsuario}
              text="Crear Usuario"
              pcolor={theme.colors.secondary}
            />
          )}
        </CustomContainer>
      </CustomContainer>
    </CustomContainer>
  );
};
