import React, { useEffect, useState } from "react";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";

export const ComercialMarketing = () => {
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
      tituloBtn: "Comercial",
      titulo: "Ventas - Marketing",
      url: "https://app.powerbi.com/view?r=eyJrIjoiNTM1MGYzOWQtMWRmOS00MDZjLThlYWMtNmFiYzQwMDM5NzJkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=4f3800fc970c0309e056",
    },
  ];

  const BotonesNav = () => {
    return (
      <ContainerUI style={{ gap: "10px" }}>
        {opcionesReportes.map(({ id, tituloBtn }) => (
          <ButtonUI
            key={id}
            text={tituloBtn}
            onClick={() => setGrafico(id)}
            variant={grafico === id ? "contained" : "outlined"}
            pcolor={theme.colors.secondary}
          />
        ))}
      </ContainerUI>
    );
  };

  return (
    <ContainerUI
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
    </ContainerUI>
  );
};
