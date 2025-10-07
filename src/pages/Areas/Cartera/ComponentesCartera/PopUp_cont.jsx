import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { useTheme } from "context/ThemeContext";
import React from "react";
import { useState } from "react";
import { hexToRGBA } from "utils/colors";

const contrasenaMaestra = "2002";

function PopUpCont({ onClose, editarCampos, id, banco, editado, empresa }) {
  const { theme } = useTheme();
  const [validacion, setvalidacion] = useState(false);
  const [contrasena, setContrasena] = useState("");

  const handleValidar = () => {
    if (contrasena !== contrasenaMaestra) {
      setvalidacion(true);
      setTimeout(() => {
        // Cierra el PopUp
        onClose();
      }, 1000);
      // alert("Contraseña incorrecta. No se puede editar.");
    } else {
      editarCampos(id, banco);
      onClose(); // Cierra el PopUp
    }
  };

  return (
    <CustomContainer
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: hexToRGBA({ hex: "#000", alpha: 0.6 }),
        zIndex: 3,
      }}
    >
      <CustomContainer
        width="400px"
        style={{
          backgroundColor: hexToRGBA({ hex: theme.colors.white, alpha: 0.9 }),
          position: "relative",
          gap: "15px",
          padding: "30px",
          borderRadius: "5px",
        }}
        flexDirection="column"
      >
        <span>Contraseña Maestra:</span>
        <CustomInput
          value={contrasena}
          onChange={setContrasena}
          placeholder="Contraseña Maestra"
        />
        <CustomContainer
          width="100%"
          justifyContent="flex-end"
          style={{ gap: "10px", padding: 0 }}
        >
          <CustomButton text="Cancelar" onClick={onClose} variant="outlined" />
          <CustomButton text="Validar" onClick={handleValidar} />
        </CustomContainer>
        <CustomText size={"12px"}>
          {validacion && "*CONTRASEÑA INCORRECTA*"}
        </CustomText>
      </CustomContainer>
      {/* <div className="popup-content">
        <input
          className="input-pass"
          type="password"
          onKeyPress={handleInputKeyPress}
        />

        <button onClick={onClose}>x</button>
      </div> */}
    </CustomContainer>
  );
}

export default PopUpCont;
