import React, { useEffect, useState } from "react";
import styled from "styled-components";

import Header from "./Header";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { useTheme } from "context/ThemeContext";

const ContenedorContenidoPagina = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const ContenedorCuerpoPagina = styled.div`
  height: 100%;
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: auto;
  background-color: transparent;
`;

const ContenedorCuerpoPaginaHorizontal = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContenedorDerecha = styled.div`
  display: flex;
  flex-direction: column;
  width: calc(100vw - 80px); /* Resta el ancho de los sidebars cerrados */
  height: 100vh;
  overflow: hidden;
  margin-left: 40px; /* Respeta el ancho del sidebar izquierdo cuando está cerrado */
  margin-right: 40px; /* Respeta el ancho del sidebar derecho cuando está cerrado */
`;

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
      <Sidebar />
      <RightSidebar />
      <Header />
      <ContenedorDerecha>
        <ContenedorCuerpoPaginaHorizontal
          style={{
            backgroundColor: theme.colors.background,
          }}
        >
          {props.children ? (
            <ContenedorCuerpoPagina>{props.children}</ContenedorCuerpoPagina>
          ) : (
            <span> No hay contenido disponible.</span>
          )}
        </ContenedorCuerpoPaginaHorizontal>
      </ContenedorDerecha>
    </AnimatedPage>
  );
}
