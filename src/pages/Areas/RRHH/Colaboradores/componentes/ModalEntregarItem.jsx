import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CamposDinamicos, validarCamposDinamicos } from "./CamposDinamicos";
import { CampoLabel } from "./CampoLabel";
import { FiltroPastillas } from "./FiltroPastillas";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { ESTADO_ENTREGA, ETIQUETA_ENTREGA } from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";

/**
 * Marca un artículo como entregado, pendiente o no aplica.
 *
 * Usa ModalUI con noFooter y su propio <form> dentro para que Enter envíe, igual
 * que ModalBajaReingreso.
 *
 * La fecha la pone SIEMPRE el cliente, nunca el servidor: la conexión del backend
 * corre en -05:00 pero toISOString() es UTC, así que un "hoy" calculado allá
 * saldría con el día cambiado durante cinco horas cada noche.
 */

const ESTADOS = [
  { valor: ESTADO_ENTREGA.ENTREGADO, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.ENTREGADO] },
  { valor: ESTADO_ENTREGA.PENDIENTE, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.PENDIENTE] },
  { valor: ESTADO_ENTREGA.NO_APLICA, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.NO_APLICA] },
];

export const ModalEntregarItem = ({ abierto, item, campos = [], onCerrar, onConfirmar }) => {
  const [estado, setEstado] = useState(ESTADO_ENTREGA.ENTREGADO);
  const [fechaEntrega, setFechaEntrega] = useState(hoyIso());
  const [entregadoPor, setEntregadoPor] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [valores, setValores] = useState({});
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Estado limpio en cada apertura: si no, al abrir un segundo artículo se
  // arrastrarían la talla y la fecha del anterior.
  useEffect(() => {
    if (!abierto || !item) return;
    setEstado(item.estado === ESTADO_ENTREGA.PENDIENTE ? ESTADO_ENTREGA.ENTREGADO : item.estado);
    setFechaEntrega(item.fechaEntrega ?? hoyIso());
    setEntregadoPor(item.entregadoPor ?? "");
    setCantidad(item.cantidad === null || item.cantidad === undefined ? "" : String(item.cantidad));
    setValores(item.valores ?? {});
    setObservacion(item.observacion ?? "");
    setErrores({});
    setEnviando(false);
  }, [abierto, item]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const entregado = estado === ESTADO_ENTREGA.ENTREGADO;

  const validar = () => {
    const nuevos = {};

    if (entregado && !fechaEntrega) nuevos.fechaEntrega = "Indique cuándo se entregó.";
    if (cantidad !== "" && Number(cantidad) <= 0) nuevos.cantidad = "Debe ser mayor a cero.";

    // Los atributos requeridos solo se exigen al dar por entregado: mientras está
    // pendiente todavía no se sabe la talla.
    const deCampos = entregado ? validarCamposDinamicos(campos, valores) : {};

    setErrores({ ...nuevos, ...deCampos });
    return Object.keys(nuevos).length === 0 && Object.keys(deCampos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando || !validar()) return;

    setEnviando(true);
    try {
      await onConfirmar({
        estado,
        fechaEntrega: entregado ? fechaEntrega : null,
        entregadoPor: entregado ? entregadoPor.trim() || null : null,
        cantidad: cantidad === "" ? null : Number(cantidad),
        valores,
        observacion: observacion.trim() || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo actualizar el artículo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !item) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={item.itemNombre}
      width="560px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

              <CampoLabel
                etiqueta="Entregado por"
                ayuda="Quién lo entregó físicamente."
              >
                <InputUI
                  value={entregadoPor}
                  onChange={(valor) => setEntregadoPor(valor.toUpperCase())}
                  maxLength={120}
                  placeholder="BODEGA"
                />
              </CampoLabel>
            </FilaFormulario>
          )}

          <CampoLabel
            etiqueta={`Cantidad${item.unidad ? ` (${item.unidad})` : ""}`}
            error={errores.cantidad}
          >
            <InputUI
              type="number"
              value={cantidad}
              onChange={(valor) => setCantidad(valor)}
              min={1}
            />
          </CampoLabel>

          <CamposDinamicos
            campos={campos}
            valores={valores}
            errores={errores}
            onCambiar={setValores}
          />

          {/* Un artículo fuera del catálogo ya no tiene definición de atributos, y
              conviene explicar por qué no aparecen los campos. */}
          {item.itemId === null && (
            <Aviso $tono="neutro">
              Este artículo ya no está en el catálogo, así que no se pueden editar sus
              atributos. El registro de lo que se entregó se conserva igual.
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

export default ModalEntregarItem;
