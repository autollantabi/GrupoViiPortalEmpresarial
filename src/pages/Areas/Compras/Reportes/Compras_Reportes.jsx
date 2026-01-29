import React, { useState } from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";

const ContenedorPrincipal = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "auto"};
  gap: ${({ gap }) => gap || "0"};
  padding: ${({ padding }) => padding || "0"};
`;

const ContenedorFlex = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  width: ${({ width }) => width || "auto"};
  height: ${({ height }) => height || "auto"};
  gap: ${({ gap }) => gap || "0"};
  padding: ${({ padding }) => padding || "0"};
`;

const IframeContainer = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

export const Compras_Reportes = () => {
  const { theme } = useTheme();
  const [grafico, setGrafico] = useState(0);

  const opcionesGraficos = [
    {
      id: 0,
      tituloBtn: "Control de Pedidos",
      titulo: "Control de Pedidos - Grupo Automax",
      url: "https://app.powerbi.com/view?r=eyJrIjoiM2IxOGQ2NTEtNjRiMi00MTBlLWE2OWQtMzE3NWZmN2U5ZDZmIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection816bfe1d4c0d093c159d",
    },
    {
      id: 1,
      tituloBtn: "Alerta Pedidos",
      titulo: "Alerta Pedidos - Grupo Automax",
      url: "https://app.powerbi.com/view?r=eyJrIjoiNjRlNjU4YTItMjdlMC00MzI2LWI3YTctMTIyMzk1OTc4YjA0IiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    },
  ];

  const BotonesNav = () => {
    return (
      <ContenedorFlex gap="10px">
        {opcionesGraficos.map(({ id, tituloBtn }) => (
          <ButtonUI
            key={id}
            text={tituloBtn}
            onClick={() => setGrafico(id)}
            variant={grafico === id ? "contained" : "outlined"}
            pcolor={theme.colors.primary}
            pcolortext={grafico === id ? theme.colors.white : undefined}
          />
        ))}
      </ContenedorFlex>
    );
  };
  return (
    <ContenedorPrincipal flexDirection="column" height="100%" width="100%">
      <BotonesNav />

      {opcionesGraficos.map(
        ({ id, titulo, url }) =>
          grafico === id && (
            <IframeContainer key={id}>
              <iframe
                title={titulo}
                width="100%"
                height="100%"
                src={url}
                allowFullScreen
                style={{ border: "none" }}
              />
            </IframeContainer>
          )
      )}
    </ContenedorPrincipal>
  );
};
