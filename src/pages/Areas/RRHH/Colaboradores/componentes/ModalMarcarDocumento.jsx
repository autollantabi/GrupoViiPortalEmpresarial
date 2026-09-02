import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CampoLabel } from "./CampoLabel";
import { FiltroPastillas } from "./FiltroPastillas";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { ESTADO_ENTREGA, ETIQUETA_ENTREGA } from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";

/**
 * Cambia el estado de un documento, y lo crea si todavía no existe.
 *
 * El mismo modal sirve para las dos cosas porque el formulario es idéntico: la
 * diferencia está solo en si el documento llegó con `id` nulo, que es lo que el
 * backend usa para distinguir "se le exige pero nadie lo ha tocado" de "ya tiene
 * fila". Duplicar el modal para eso no aportaría nada.
 */

const ESTADOS = [
  { valor: ESTADO_ENTREGA.ENTREGADO, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.ENTREGADO] },
  { valor: ESTADO_ENTREGA.PENDIENTE, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.PENDIENTE] },
  { valor: ESTADO_ENTREGA.NO_APLICA, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.NO_APLICA] },
];

export const ModalMarcarDocumento = ({ abierto, documento, onCerrar, onConfirmar }) => {
  const [estado, setEstado] = useState(ESTADO_ENTREGA.ENTREGADO);
  const [fechaEntrega, setFechaEntrega] = useState(hoyIso());
  const [etiqueta, setEtiqueta] = useState("");
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto || !documento) return;
    setEstado(documento.estado === ESTADO_ENTREGA.PENDIENTE ? ESTADO_ENTREGA.ENTREGADO : documento.estado);
    setFechaEntrega(documento.fechaEntrega ?? hoyIso());
    setEtiqueta(documento.etiqueta ?? "");
    setObservacion(documento.observacion ?? "");
    setErrores({});
    setEnviando(false);
  }, [abierto, documento]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const entregado = estado === ESTADO_ENTREGA.ENTREGADO;
  const pideEtiqueta = documento?.permiteMultiples === true;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nuevos = {};
    if (entregado && !fechaEntrega) nuevos.fechaEntrega = "Indique cuándo se entregó.";
    if (pideEtiqueta && !etiqueta.trim()) {
      nuevos.etiqueta = "Este documento va uno por persona: indique de quién es.";
    }

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await onConfirmar({
        tipoId: documento.tipoId,
        // La etiqueta solo se manda si el tipo la admite: en los de ejemplar
        // único el backend la rechaza, y con razón (el índice único compara
        // COALESCE(etiqueta, ''), así que dos filas con etiqueta distinta serían
        // dos copias del mismo documento).
        etiqueta: pideEtiqueta ? etiqueta.trim().toUpperCase() : null,
        estado,
        fechaEntrega: entregado ? fechaEntrega : null,
        observacion: observacion.trim() || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el documento");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !documento) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={documento.tipoNombre}
      width="540px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {documento.descripcion && <Aviso $tono="neutro">{documento.descripcion}</Aviso>}

          {pideEtiqueta && (
            <CampoLabel
              etiqueta="De quién es"
              requerido
              error={errores.etiqueta}
              ayuda="Este documento va uno por hijo. El nombre distingue los ejemplares."
            >
              <InputUI
                value={etiqueta}
                onChange={(valor) => setEtiqueta(valor.toUpperCase())}
                maxLength={120}
                placeholder="MARIA PEREZ"
              />
            </CampoLabel>
          )}

          <FiltroPastillas
            leyenda="Estado"
            opciones={ESTADOS}
            value={estado}
            onChange={setEstado}
          />

          {entregado && (
            <FilaFormulario $min={200}>
              <CampoLabel etiqueta="Fecha de entrega" requerido error={errores.fechaEntrega}>
                <InputUI
                  type="date"
                  value={fechaEntrega ?? ""}
                  onChange={(valor) => setFechaEntrega(valor)}
                  max={hoyIso()}
                />
              </CampoLabel>
            </FilaFormulario>
          )}

          {entregado && !documento.archivo && (
            <Aviso $tono="aviso">
              Queda como entregado pero sin archivo digitalizado. Súbalo cuando lo tenga
              escaneado; mientras tanto aparecerá en el contador de pendientes por
              digitalizar.
            </Aviso>
          )}

          <CampoLabel etiqueta="Observación">
            <AreaTexto
              value={observacion}
              onChange={(evento) => setObservacion(evento.target.value)}
              maxLength={1000}
              rows={2}
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Guardar"}
              iconLeft="FaFloppyDisk"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalMarcarDocumento;
