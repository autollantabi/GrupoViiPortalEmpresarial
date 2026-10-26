import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ObtenerMotivosBaja } from "services/dotacionService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso } from "./piezas";
import { useConsulta } from "../hooks/useConsulta";

/**
 * Da de baja un artículo que YA está Entregado y carga su reemplazo, de a uno,
 * directo desde la tabla — sin tener que ir a "Agregar artículos" y volver a
 * tildar el mismo artículo (ese flujo sigue existiendo en SelectorArticulos.jsx
 * para cuando se agregan varios a la vez; este modal es el atajo para un solo
 * renglón).
 *
 * Funciona aunque la dotación ya tenga el acta impresa: el backend admite esta
 * excepción a propósito (perder o dañar algo entregado no espera a la próxima
 * dotación complementaria), ver DotacionAsignacionesRrhhService.agregarItems().
 */
export const ModalReemplazarItem = ({ abierto, item, onCerrar, onConfirmar }) => {
  const [cantidad, setCantidad] = useState("1");
  const [motivoBajaId, setMotivoBajaId] = useState(null);
  const [comentarioBaja, setComentarioBaja] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const { datos: motivos } = useConsulta(
    ({ signal }) => ObtenerMotivosBaja({ soloActivos: true, signal }),
    [],
  );

  useEffect(() => {
    if (!abierto || !item) return;
    setCantidad(item.cantidad !== null ? String(item.cantidad) : "1");
    setMotivoBajaId(null);
    setComentarioBaja("");
    setErrores({});
    setEnviando(false);
  }, [abierto, item]);

  const opcionesMotivos = (motivos ?? []).map((motivo) => ({ value: motivo.id, label: motivo.nombre }));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nuevos = {};
    const numeroCantidad = Number(cantidad);
    if (!cantidad || !Number.isFinite(numeroCantidad) || numeroCantidad <= 0) {
      nuevos.cantidad = "Indique una cantidad válida, mayor a 0.";
    }
    if (!motivoBajaId) nuevos.motivoBajaId = "Elija el motivo de la baja.";

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await onConfirmar({
        cantidad: numeroCantidad,
        motivoBajaId,
        comentarioBaja: comentarioBaja.trim() || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo reemplazar el artículo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !item) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={`Reemplazar ${item.itemNombre}`}
      width="480px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Aviso $tono="aviso">
            Este artículo queda dado de baja y se carga uno nuevo en su lugar, aunque la dotación ya
            tenga el acta impresa.
          </Aviso>

          <CampoLabel etiqueta="Motivo de la baja" requerido error={errores.motivoBajaId}>
            <SelectUI
              options={opcionesMotivos}
              value={opcionesMotivos.find((opcion) => opcion.value === motivoBajaId) ?? null}
              onChange={(opcion) => setMotivoBajaId(opcion?.value ?? null)}
              placeholder="Elija un motivo…"
              isSearchable
              minWidth="100%"
              maxWidth="100%"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

          <CampoLabel etiqueta="Comentario" ayuda="Opcional. Sale junto al motivo en el acta.">
            <AreaTexto
              value={comentarioBaja}
              onChange={(evento) => setComentarioBaja(evento.target.value)}
              maxLength={500}
              rows={2}
            />
          </CampoLabel>

          <CampoLabel etiqueta="Cantidad del nuevo" requerido error={errores.cantidad}>
            <InputUI
              type="number"
              min={1}
              value={cantidad}
              onChange={setCantidad}
              onFocus={(evento) => evento.target.select()}
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Reemplazando…" : "Dar de baja y reemplazar"}
              iconLeft="FaRotate"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalReemplazarItem;
