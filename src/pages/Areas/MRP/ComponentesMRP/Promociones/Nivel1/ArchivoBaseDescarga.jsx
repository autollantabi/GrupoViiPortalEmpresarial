import React from "react";
import { Boton } from "assets/styles/StyledComponents/Botones";

export const ArchivoBaseDescarga = () => {
  const descargarArchivo = () => {
    // URL del archivo que quieres descargar
    const url = "ARCHIVO_BASE.xlsx";

    // Crea un enlace temporal
    const enlace = document.createElement("a");
    enlace.href = url;

    // Especifica el nombre del archivo después de descargar
    enlace.download = "ARCHIVO_BASE.xlsx";

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  return (
    <Boton onClick={descargarArchivo}>
      Descargar <i class="bi bi-download"></i>
    </Boton>
  );
};
