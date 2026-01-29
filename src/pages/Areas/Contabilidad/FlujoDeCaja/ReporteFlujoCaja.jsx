import React from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";

export const Contabilidad_ReporteFlujoCaja = () => {
  
  if (typeof ClipboardItem == "undefined") {
    ClipboardItem = window.ClipboardItem = function (items) {
      return items;
    };
  }

  const opcionesReportes = [
    {
      id: 0,
      titulo: "FLujo de Caja - Contabilidad",
      url: "https://app.powerbi.com/view?r=eyJrIjoiM2NkZTE3YjgtNzU2NS00OWU4LWIyYTItNjg1MTI1NjhlMTQxIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9",
    },
  ];

  return (
    <ContainerUI
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: "0" }}
    >
      <iframe
        key={opcionesReportes[0].id}
        title={opcionesReportes[0].titulo}
        width="100%"
        height="100%"
        src={opcionesReportes[0].url}
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </ContainerUI>
  );
};
