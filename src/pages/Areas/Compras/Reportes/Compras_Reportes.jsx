import React, { useState } from "react";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";

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
      <CustomContainer style={{ gap: "10px" }}>
        {opcionesGraficos.map(({ id, tituloBtn }) => (
          <CustomButton
            key={id}
            text={tituloBtn}
            onClick={() => setGrafico(id)}
            variant={grafico === id ? "contained" : "outlined"}
            pcolor={theme.colors.secondary}
          />
        ))}
      </CustomContainer>
    );
  };
  return (
    <CustomContainer flexDirection="column" height="100%" width="100%">
      <BotonesNav />

      {opcionesGraficos.map(
        ({ id, titulo, url }) =>
          grafico === id && (
            <iframe
              key={id}
              title={titulo}
              width="100%"
              height="100%"
              src={url}
              allowFullScreen
            />
          )
      )}
    </CustomContainer>
  );
};
