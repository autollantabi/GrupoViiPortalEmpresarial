import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto } from "./piezas";
import { hoyIso } from "../utils/fechas";

/**
 * Datos de una dotación complementaria nueva: motivo, observación y fecha.
 *
 * Antes "Nueva complementaria" creaba la asignación directo, sin preguntar nada
 * (motivo/observación quedaban null). Con el acta de entrega ahora es un
 * documento que se imprime y se archiva, dejar constancia de POR QUÉ se hizo esta
 * complementaria (se dañó el uniforme, cambio de cargo, etc.) importa: es lo que
 * después explica el renglón en la bitácora y en el acta.
 *
 * Mismo patrón que ModalEliminar/ModalEntregarItem: ModalUI con noFooter y su
 * propio <form>, para que Enter envíe.
 */
export const ModalNuevaComplementaria = ({ abierto, onCerrar, onConfirmar }) => {
  const [motivo, setMotivo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setMotivo("");
    setObservacion("");
    setFecha(hoyIso());
    setEnviando(false);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await onConfirmar({
        fecha,
        motivo: motivo.trim() || null,
        observacion: observacion.trim() || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo crear la dotación complementaria");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title="Nueva dotación complementaria"
      width="520px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CampoLabel etiqueta="Fecha">
            <InputUI type="date" value={fecha} onChange={setFecha} max={hoyIso()} />
          </CampoLabel>

          <CampoLabel etiqueta="Motivo" ayuda="Por qué se entrega esto aparte de la dotación inicial.">
            <InputUI
              value={motivo}
              onChange={setMotivo}
              maxLength={200}
              placeholder="Uniforme dañado"
            />
          </CampoLabel>

          <CampoLabel etiqueta="Observación">
            <AreaTexto
              value={observacion}
              onChange={(evento) => setObservacion(evento.target.value)}
              maxLength={1000}
              rows={3}
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Creando…" : "Crear"}
              iconLeft="FaPlus"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalNuevaComplementaria;
