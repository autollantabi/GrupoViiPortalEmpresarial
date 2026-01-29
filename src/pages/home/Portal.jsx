import React, { useEffect, useState } from "react";

import valoresA from "assets/images/webp_png_jpeg/ValoresA.png";
import { ModalInputsUI } from "components/UI/Components/ModalInputsUI";
import { GuardarNombreUsuario } from "services/usuariosService";
import { useAuthContext } from "context/authContext";
import {
  ContainerUI,
} from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { ImageUI } from "components/UI/Components/ImageUI";

export default function Portal() {
  const { logout, user } = useAuthContext();
  const [isPopupOpen, setPopupOpen] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.clear();
    logout();
  };

  const handleSaveData = async (formData) => {
    const idUs = user?.USUARIO?.id || user?.USUARIO?.ID_USUARIO;

    if (formData.nombre && idUs) {
      if (formData.nombre.length > 10) {
        const nombreUs = formData.nombre;
        const res = await GuardarNombreUsuario({
          idUsuario: idUs,
          nombreUsuario: nombreUs,
        });

        if (res) {
          handleCerrarSesion();
          setPopupOpen(false);
        }
      }
    }
  };

  const inputs = [
    {
      name: "nombre",
      label: "Nombre",
      type: "text",
      placeholder: "Ingresa tu nombre",
    },
  ];
  // Contenido personalizado que deseas pasar al popup
  const customContent = (
    <div>
      <h3>¡Bienvenido!</h3>
      <p>
        Necesitamos tu ayuda, ingresa por favor tu nombre completo. Es para
        poder guiarnos en cualquier proceso, esto no sera compartido.{" "}
      </p>
      <p>Ejem: Juan José Pérez Torres</p>
    </div>
  );

  useEffect(() => {
    const nomUs = user?.USUARIO?.USUA_NOMBRE ||"";

    if (!nomUs || nomUs === "") {
      setPopupOpen(true);
    }
  }, [user]);

  return (
    <ContainerUI flexDirection="column" height="100%" weight="100%">
      <TextUI
        size="22px"
        weight="700"
        align="center"
        style={{ margin: "10px 0" }}
      >
        BIENVENIDO AL PORTAL EMPRESARIAL
      </TextUI>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ImageUI
          src={valoresA}
          width="100%"
          height="100%"
          objectFit="contain"
          alt="Valores Empresa"
        />
      </div>
      <ModalInputsUI
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onSave={handleSaveData}
        inputs={inputs}
        customContent={customContent}
      />
    </ContainerUI>
  );
}
