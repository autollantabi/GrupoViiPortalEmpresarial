import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import {
  EliminarAbonoCartera,
  ObtenerCreditosCartera,
  ObtenerDetalleCreditoCartera,
  RegistrarAbonoCartera,
} from "services/dotacionService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, Badge, FilaFormulario, Tarjeta, TextoTenue, TituloTarjeta } from "./piezas";
import { formatearMonto } from "../utils/constantesDotacion";
import { formatearFecha, hoyIso } from "../utils/fechas";
import { useConsulta } from "../hooks/useConsulta";

/** Una fila de crédito, con borde propio para separarla de las demás. */
const FilaCredito = styled.div`
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 10px;
  padding: 12px;
`;

/**
 * Créditos de cartera de un colaborador (renglones de dotación monetarios ya
 * entregados) con sus abonos.
 *
 * Vive dentro de ColDotacion.jsx (no en una pestaña propia): un crédito de
 * cartera NACE de un renglón de dotación entregado (ver ModalEntregarItem +
 * MarcarItemAsignacion en el backend), así que conceptualmente es "lo que se le
 * entregó a este empleado" con un seguimiento extra de pagos, no una sección
 * aparte de la ficha. Repartirlo en su propia pestaña habría duplicado
 * CabeceraFicha/PestanasFicha para una tabla que, para la enorme mayoría de los
 * empleados (sin dotación de cartera), estaría siempre vacía.
 *
 * Por eso mismo esta sección NO se muestra en absoluto si el empleado no tiene
 * ningún crédito: no hay botón de "nuevo crédito" (no existe ese endpoint) ni un
 * estado vacío que le pida algo a nadie.
 */
export const SeccionCartera = ({ empleadoId }) => {
  const {
    datos: creditos,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerCreditosCartera(empleadoId, { signal }), [empleadoId]);

  const [expandidoId, setExpandidoId] = useState(null);

  // Nada que mostrar mientras carga (evita un parpadeo en la mayoría de fichas,
  // que no tienen dotación de cartera) ni si de plano no hay créditos.
  if (cargando) return null;

  if (error) {
    return (
      <Tarjeta>
        <TituloTarjeta>Créditos de cartera</TituloTarjeta>
        <Aviso $tono="peligro">No se pudo cargar los créditos de cartera: {error}</Aviso>
      </Tarjeta>
    );
  }

  if (!creditos || creditos.length === 0) return null;

  return (
    <Tarjeta>
      <TituloTarjeta>Créditos de cartera</TituloTarjeta>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {creditos.map((credito) => (
          <TarjetaCredito
            key={credito.id}
            credito={credito}
            expandido={expandidoId === credito.id}
            onAlternar={() =>
              setExpandidoId((previo) => (previo === credito.id ? null : credito.id))
            }
            onCambiado={recargar}
          />
        ))}
      </div>
    </Tarjeta>
  );
};

const CabeceraCredito = ({ credito, expandido, onAlternar }) => {
  const { theme } = useTheme();
  const pagado = credito.saldoPendiente <= 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div style={{ minWidth: 200 }}>
        <strong>{credito.itemNombre}</strong>
        <div>
          <TextoTenue>
            Entregado {formatearFecha(credito.fechaEntrega)} · Total {formatearMonto(credito.montoTotal)}
            {" · "}Abonado {formatearMonto(credito.totalAbonado)}
          </TextoTenue>
        </div>
      </div>

      <Acciones>
        <Badge $tono={pagado ? "exito" : "aviso"}>
          {pagado ? "Pagado" : `Saldo ${formatearMonto(credito.saldoPendiente)}`}
        </Badge>
        <ButtonUI
          text={expandido ? "Ocultar" : "Ver detalle / Registrar abono"}
          iconLeft={expandido ? "FaChevronUp" : "FaChevronDown"}
          variant="outlined"
          onClick={onAlternar}
        />
      </Acciones>
      {pagado && <IconUI name="FaCircleCheck" size={14} color={theme?.colors?.success} />}
    </div>
  );
};

/**
 * Una fila de crédito, que expande su detalle (abonos + formulario) en el
 * lugar: no un modal encima de otro, así el borrado de un abono (que sí necesita
 * un modal por el motivo) no queda apilado sobre otro modal.
 */
const TarjetaCredito = ({ credito, expandido, onAlternar, onCambiado }) => {
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!expandido) return undefined;

    let cancelado = false;
    setCargandoDetalle(true);
    setErrorDetalle(null);

    ObtenerDetalleCreditoCartera(credito.id)
      .then((datos) => {
        if (!cancelado) setDetalle(datos);
      })
      .catch((e) => {
        if (cancelado) return;
        setErrorDetalle(e.message || "No se pudo cargar el detalle del crédito");
      })
      .finally(() => {
        if (!cancelado) setCargandoDetalle(false);
      });

    return () => {
      cancelado = true;
    };
    // Se recarga cada vez que se expande, por si el saldo cambió desde afuera.
  }, [expandido, credito.id]);

  const registrarAbono = async (datos) => {
    const actualizado = await RegistrarAbonoCartera(credito.id, datos);
    setDetalle(actualizado);
    onCambiado?.();
    toast.success("Abono registrado.");
  };

  const confirmarEliminarAbono = async (motivo) => {
    setOcupado(true);
    try {
      const actualizado = await EliminarAbonoCartera(credito.id, aEliminar.id, motivo);
      setDetalle(actualizado);
      setAEliminar(null);
      onCambiado?.();
      toast.success("Abono eliminado.");
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar el abono");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <FilaCredito>
      <CabeceraCredito credito={credito} expandido={expandido} onAlternar={onAlternar} />

      {credito.observacion && (
        <div style={{ marginTop: 6 }}>
          <TextoTenue>{credito.observacion}</TextoTenue>
        </div>
      )}

      {expandido && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          {cargandoDetalle && <TextoTenue>Cargando abonos…</TextoTenue>}

          {errorDetalle && <Aviso $tono="peligro">{errorDetalle}</Aviso>}

          {detalle && (
            <>
              <ListaAbonos abonos={detalle.abonos} ocupado={ocupado} onEliminar={setAEliminar} />

              <FormularioAbono
                saldoPendiente={detalle.saldoPendiente}
                onConfirmar={registrarAbono}
              />
            </>
          )}
        </div>
      )}

      <ModalEliminarAbono
        abierto={aEliminar !== null}
        abono={aEliminar}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminarAbono}
      />
    </FilaCredito>
  );
};

const ListaAbonos = ({ abonos, ocupado, onEliminar }) => {
  const { theme } = useTheme();

  if (!abonos || abonos.length === 0) {
    return <TextoTenue>Todavía no se ha registrado ningún abono.</TextoTenue>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {abonos.map((abono) => (
        <div
          key={abono.id}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "6px 0",
            borderBottom: `1px solid ${theme?.colors?.borderLight ?? theme?.colors?.border}`,
          }}
        >
          <div>
            <strong>{formatearMonto(abono.monto)}</strong>{" "}
            <TextoTenue>
              · {formatearFecha(abono.fecha)}
              {abono.registradoPor ? ` · ${abono.registradoPor}` : ""}
              {abono.observacion ? ` · ${abono.observacion}` : ""}
            </TextoTenue>
          </div>
          <ButtonUI
            text=""
            iconLeft="FaTrashCan"
            variant="ghost"
            pcolor={theme?.colors?.error}
            disabled={ocupado}
            title="Eliminar abono"
            onClick={() => onEliminar(abono)}
          />
        </div>
      ))}
    </div>
  );
};

/** Formulario de un abono nuevo: monto, fecha (hoy por omisión) y observación opcional. */
const FormularioAbono = ({ saldoPendiente, onConfirmar }) => {
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (saldoPendiente <= 0) {
    return <Aviso $tono="exito">Este crédito ya está pagado en su totalidad.</Aviso>;
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const valor = Number(monto);
    if (monto === "" || !Number.isFinite(valor) || valor <= 0) {
      setError("Indique un monto mayor a cero.");
      return;
    }
    if (!fecha) {
      setError("Indique la fecha del abono.");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar({ monto: valor, fecha, observacion: observacion.trim() || null });
      setMonto("");
      setObservacion("");
      setFecha(hoyIso());
      setError(null);
    } catch (e) {
      // El 409 (monto > saldo) trae un mensaje ya armado por el backend: se
      // muestra tal cual, sin reescribirlo.
      toast.error(e.message || "No se pudo registrar el abono");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate>
      <FilaFormulario $min={160}>
        <CampoLabel etiqueta="Monto del abono" requerido error={error}>
          <InputUI
            type="number"
            value={monto}
            onChange={(valor) => {
              setMonto(valor);
              setError(null);
            }}
            min={0.01}
            max={saldoPendiente}
            step="0.01"
            placeholder={`Saldo ${formatearMonto(saldoPendiente)}`}
          />
        </CampoLabel>
        <CampoLabel etiqueta="Fecha">
          <InputUI type="date" value={fecha} onChange={setFecha} max={hoyIso()} />
        </CampoLabel>
        <CampoLabel etiqueta="Observación">
          <AreaTexto
            value={observacion}
            onChange={(evento) => setObservacion(evento.target.value)}
            maxLength={500}
            rows={1}
          />
        </CampoLabel>
      </FilaFormulario>

      <div style={{ height: 8 }} />

      <Acciones>
        <ButtonUI
          type="submit"
          text={enviando ? "Registrando…" : "Registrar abono"}
          iconLeft="FaPlus"
          disabled={enviando}
        />
      </Acciones>
    </form>
  );
};

/** Confirmación con motivo para borrar un abono, mismo patrón que ModalEliminarCarga. */
const ModalEliminarAbono = ({ abierto, abono, onCerrar, onConfirmar }) => {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setMotivo("");
    setError(null);
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

    const limpio = motivo.trim();
    if (limpio.length < 5) {
      setError("Escriba por qué se elimina (mínimo 5 caracteres).");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar(limpio);
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !abono) return null;

  return (
    <ModalUI isOpen={abierto} onClose={onCerrar} title="Eliminar abono" width="480px" noFooter>
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextoTenue>
            Se eliminará el abono de {formatearMonto(abono.monto)} del {formatearFecha(abono.fecha)}.
            El saldo pendiente del crédito se recalcula al instante.
          </TextoTenue>
          <CampoLabel etiqueta="Motivo" requerido error={error}>
            <AreaTexto
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setError(null);
              }}
              maxLength={500}
              rows={3}
            />
          </CampoLabel>
          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Eliminando…" : "Eliminar"}
              iconLeft="FaTrashCan"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default SeccionCartera;
