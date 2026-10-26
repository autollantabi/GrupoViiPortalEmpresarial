import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { Acciones } from "./piezas";

/**
 * Muestra un PDF (acta de dotación o certificado) en un <iframe> dentro de un
 * modal de la misma pantalla, en vez de abrir una pestaña nueva: el visor
 * nativo del navegador sigue siendo el que renderiza el PDF, solo cambia
 * dónde vive. Genérico a propósito: lo usan tanto ColDotacion.jsx (acta) como
 * ColCertificados.jsx (certificados), que solo difieren en qué URL y qué
 * título le pasan.
 *
 * `url` es el object URL del blob que arma ObtenerUrlActaAsignacion() /
 * ObtenerUrlCertificado(). Quien use este modal es responsable de revocarlo
 * al cerrar (ver `cerrarActa` en ColDotacion.jsx): acá no se toca su ciclo de
 * vida, solo se muestra.
 */
export const ModalVerActa = ({ abierto, url, titulo = "Acta de entrega", onCerrar }) => {
  if (!abierto || !url) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={titulo}
      width="900px"
      maxWidth="96vw"
      maxHeight="94vh"
      noFooter
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "78vh" }}>
        <iframe
          title={titulo}
          src={url}
          style={{ flex: 1, width: "100%", border: "1px solid #ddd", borderRadius: 4 }}
        />
        <Acciones>
          <ButtonUI
            text="Abrir en pestaña nueva"
            iconLeft="FaArrowUpRightFromSquare"
            variant="outlined"
            onClick={() => window.open(url, "_blank")}
          />
          <ButtonUI text="Cerrar" variant="outlined" onClick={onCerrar} />
        </Acciones>
      </div>
    </ModalUI>
  );
};

export default ModalVerActa;
