import React, { useEffect, useState } from "react";
import styled from "styled-components";
import "assets/styles/Portal.css";


// import cumpleanosimg from "svg/cumpleanos.webp";
import valoresA from "assets/images/webp_png_jpeg/ValoresA.png";
import { CustomPopupInputs } from "components/UI/ComponentesGenericos/Popups";
import { GuardarNombreUsuario } from "services/usuariosService";
import { useAuthContext } from "context/authContext";
import {
  CustomCard,
  CustomContainer,
  CustomImage,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";

const CuerpoPrincipal = styled.div`
  display: flex;
  justify-content: start;
  flex-direction: column;
  align-items: center;
  padding: 3vh 2vw;
  height: calc(100vh - var(--heigth-header));
  width: 100%;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 2vh 5px;
  width: 100%;
  overflow: auto;

  // Para tablets
  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr); // 3 columnas en tabletas
  }

  // Para móviles
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr); // 2 columnas en móviles
  }
`;

const GridItem = styled.div`
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  width: 100%;
  min-width: 15vw;
  min-height: 25vh;
  box-shadow: 0 0 10px var(--box-shadow);
  border-radius: 10px;
  /* border: 1px solid black; */
  text-align: center;

  // Para tablets
  @media (max-width: 768px) {
    min-width: 25vw;
  }

  // Para móviles
  @media (max-width: 480px) {
    min-width: 38vw;
  }
`;
// };

const Valores = () => {
  return (
    <CustomCard style={{ flex: 1, height: "10vh" }}>
      <CustomImage
        src={valoresA}
        width="100%"
        objectFit="cover"
        alt="Valores Empresa"
      />
    </CustomCard>
  );
};

export default function Portal() {
  const { logout } = useAuthContext();
  const [isPopupOpen, setPopupOpen] = useState(false);

  const handleCerrarSesion = () => {
    localStorage.clear();
    logout();
  };

  const handleSaveData = async (formData) => {
    const idUs = localStorage.getItem("identificador");

    if (formData.nombre) {
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
    const nomUs = localStorage.getItem("nombre");

    if (nomUs === "") {
      setPopupOpen(true);
    }
  }, []);

  return (
    <CustomContainer flexDirection="column" height="100%" weight="100%">
      <CustomText
        size="22px"
        weight="700"
        align="center"
        style={{ margin: "10px 0" }}
      >
        BIENVENIDO AL PORTAL EMPRESARIAL
      </CustomText>
      <CustomCard style={{ flex: 1, overflow: "hidden" }}>
        <CustomImage
          src={valoresA}
          width="100%"
          height="100%"
          objectFit="contain"
          alt="Valores Empresa"
        />
      </CustomCard>
      <CustomPopupInputs
        isOpen={isPopupOpen}
        onClose={() => setPopupOpen(false)}
        onSave={handleSaveData}
        inputs={inputs}
        customContent={customContent}
      />
    </CustomContainer>
  );
}
