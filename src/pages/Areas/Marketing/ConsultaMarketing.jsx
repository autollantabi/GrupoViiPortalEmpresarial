import React, { useEffect, useState } from "react";
import { useTheme } from "context/ThemeContext";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

export const ConsultaMarketing = () => {
  const { theme } = useTheme();
  const [grafico, setGrafico] = useState(0);

  if (typeof ClipboardItem == "undefined") {
    ClipboardItem = window.ClipboardItem = function (items) {
      return items;
    };
  }

  const opcionesReportes = [
    {
      id: 0,
      tituloBtn: "Inventario Artículos Publicitarios",
      titulo: "Inventario Artículos Publicitarios - Grupo Automax",
      url: "https://app.powerbi.com/view?r=eyJrIjoiMzRjNjUwMTMtYTJlZC00NjkzLWFiMDUtMjU2ZWJlYTY4YWNjIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection8f13389f02a8388215d9",
    },
  ];

  const BotonesNav = () => {
    return (
      <CustomContainer style={{ gap: "10px" }}>
        {opcionesReportes.map(({ id, tituloBtn }) => (
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
    <CustomContainer
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: "0" }}
    >
      <BotonesNav />
      {opcionesReportes.map(
        ({ id, titulo, url }) =>
          grafico === id && (
            <iframe
              key={id}
              title={titulo}
              width="100%"
              height="100%"
              src={url}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )
      )}
    </CustomContainer>
  );
};
