import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarMotivosSalida } from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { esAnterior, formatearFecha, hoyIso } from "../utils/fechas";

/**
 * Modal de baja o de reingreso.
 *
 * En el Intranet esto era un <dialog> nativo. Al pasar a ModalUI se pierden tres
 * cosas que <dialog> daba gratis, y se recuperan a mano:
 *  - Cierre con Escape: el useEffect de más abajo.
 *  - Foco inicial dentro del modal: autoFocus en el primer campo.
 *  - Enter para enviar: el <form> completo va en children, con sus propios
 *    botones. Si los botones fueran los del footer de ModalUI quedarían FUERA del
 *    form y no podrían ser type="submit".
 * El clic en el fondo ya cierra por cuenta de ModalUI.
 */
export const ModalBajaReingreso = ({ abierto, modo, ficha, onCerrar, onConfirmar }) => {
  const esBaja = modo === "baja";

  const [fecha, setFecha] = useState("");
  const [motivoId, setMotivoId] = useState(null);
  const [detalle, setDetalle] = useState("");
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [motivos, setMotivos] = useState([]);

  // Reset completo al abrir: un modal que recuerda lo de la vez anterior confunde.
  useEffect(() => {
    if (!abierto) return;
    setFecha("");
    setMotivoId(null);
    setDetalle("");
    setObservacion("");
    setErrores({});
    setEnviando(false);
  }, [abierto, modo]);

  // Los motivos solo hacen falta en la baja, y se piden al abrir.
  useEffect(() => {
    if (!abierto || !esBaja) return;
    let cancelado = false;

    ListarMotivosSalida()
      .then((lista) => {
        if (!cancelado) setMotivos(lista);
      })
      .catch((error) => {
        if (!cancelado) toast.error(error.message || "No se pudieron cargar los motivos");
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, esBaja]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const opcionesMotivo = useMemo(
    () => motivos.map((motivo) => ({ value: motivo.id, label: motivo.nombre })),
    [motivos],
  );

  const motivoElegido = useMemo(
    () => motivos.find((motivo) => motivo.id === motivoId) ?? null,
    [motivos, motivoId],
  );

  const pideDetalle = Boolean(motivoElegido?.requiereDetalle);

  /** El límite depende del caso: una baja no puede ser anterior al ingreso, y un reingreso no puede ser anterior a la baja. */
  const limiteInferior = esBaja ? ficha?.fechaIngreso : ficha?.fechaSalida;

  const validar = () => {
    const nuevos = {};

    if (!fecha) nuevos.fecha = "Indique la fecha.";
    else if (limiteInferior && esAnterior(fecha, limiteInferior)) {
      nuevos.fecha = esBaja
        ? `No puede ser anterior al ingreso (${formatearFecha(limiteInferior)}).`
        : `No puede ser anterior a la baja (${formatearFecha(limiteInferior)}).`;
    }

    if (esBaja && !motivoId) nuevos.motivoId = "Elija el motivo de salida.";

    if (esBaja && pideDetalle) {
      const limpio = detalle.trim();
      if (limpio.length < 3) nuevos.detalle = "Escriba cuál fue el motivo (mínimo 3 caracteres).";
      else if (limpio.length > 120) nuevos.detalle = "Máximo 120 caracteres.";
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando || !validar()) return;

    const carga = esBaja
      ? {
          fecha,
          motivoSalidaId: motivoId,
          motivoDetalle: pideDetalle ? detalle.trim() : null,
          observacion: observacion.trim() || null,
        }
      : { fecha, observacion: observacion.trim() || null };

    setEnviando(true);
    try {
      await onConfirmar(carga);
    } catch (error) {
      // El mensaje viene del backend y está escrito para leerse en pantalla:
      // "complétela en la ficha antes de dar de baja", "ya está dado de baja...".
      toast.error(error.message || "No se pudo completar la operación");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={esBaja ? "Dar de baja" : "Registrar reingreso"}
      width="560px"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Aviso $tono={esBaja ? "aviso" : "info"}>
            {esBaja
              ? `Se marcará a ${ficha?.nombresCompletos} como dado de baja y quedará registrado el movimiento.`
              : `Se reactivará a ${ficha?.nombresCompletos} con una nueva fecha de ingreso.`}
          </Aviso>

          <FilaFormulario $min={240}>
            <CampoLabel etiqueta="Fecha" requerido error={errores.fecha}>
              <InputUI
                type="date"
                value={fecha}
                onChange={setFecha}
                max={hoyIso()}
                min={limiteInferior || undefined}
              />
            </CampoLabel>

            {esBaja && (
              <CampoLabel etiqueta="Motivo de salida" requerido error={errores.motivoId}>
                <SelectUI
                  options={opcionesMotivo}
                  value={opcionesMotivo.find((o) => o.value === motivoId) ?? null}
                  onChange={(opcion) => {
                    setMotivoId(opcion?.value ?? null);
                    setErrores((previos) => ({ ...previos, motivoId: undefined }));
                  }}
                  placeholder="Seleccione el motivo"
                  minWidth="100%"
                  maxWidth="100%"
                />
              </CampoLabel>
            )}
          </FilaFormulario>

          {esBaja && pideDetalle && (
            <CampoLabel
              etiqueta="¿Cuál fue el motivo?"
              requerido
              error={errores.detalle}
              ayuda="Si es un motivo nuevo, se agregará al catálogo."
            >
              <InputUI value={detalle} onChange={setDetalle} maxLength={120} />
            </CampoLabel>
          )}

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
              text={enviando ? "Guardando…" : esBaja ? "Dar de baja" : "Reingresar"}
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalBajaReingreso;
