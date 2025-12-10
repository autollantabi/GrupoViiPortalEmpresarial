import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { globalConst } from "config/constants";

import Header from "../UI/Header/Header";
import Cabecera from "components/UI/NavBar/NavBar";
import {
  ContenedorContenidoPagina,
  ContenedorCuerpoPaginaHorizontal,
  ContenedorCuerpoPagina,
} from "components/UI/ComponentesGenericos/GeneralStyled";
import Sidebar from "components/UI/Sidebar/Sidebar";
import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";

// 🔹 Agregar animación de fade-in con `styled-components`
const AnimatedPage = styled(ContenedorContenidoPagina)`
  opacity: ${(props) => (props.$show ? 1 : 0)};
  transition: opacity 0.8s ease-in-out;
`;

export default function TemplatePaginas({ seccion, ...props }) {
  const { theme } = useTheme();
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // setShowContent(true);
    setTimeout(() => setFadeIn(true), 50); // Pequeño delay para activar la animación
  }, []);

  return (
    <AnimatedPage $show={fadeIn}>
      <Header />

      <ContenedorCuerpoPaginaHorizontal
        style={{
          height: `calc(100vh - ${globalConst.alturaHeader}})`,
        }}
      >
        <Sidebar />
        <div
          style={{
            height: "100%",
            width: "100%",
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            backgroundColor: theme.colors.background,
          }}
        >
          {props.children ? (
            <>
              {seccion && <Cabecera seccion={seccion} />}
              <ContenedorCuerpoPagina
                style={{ borderTop: `solid 1px ${theme.colors.secondary}` }}
              >
                {props.children}
              </ContenedorCuerpoPagina>
            </>
          ) : (
            <span> No hay contenido disponible.</span>
          )}
        </div>
      </ContenedorCuerpoPaginaHorizontal>
    </AnimatedPage>
  );
}
