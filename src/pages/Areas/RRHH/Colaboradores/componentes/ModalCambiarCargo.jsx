import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarCargos } from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { hoyIso } from "../utils/fechas";

/** Un día antes de la fecha ISO dada, también en ISO (YYYY-MM-DD). */
const unDiaAntes = (iso) => {
  const fecha = new Date(`${iso}T00:00:00`);
  fecha.setDate(fecha.getDate() - 1);
  return fecha.toISOString().slice(0, 10);
};

/**
 * Modal de cambio de cargo.
 *
 * Cierra el renglón vigente del historial y abre uno nuevo (lo hace el
 * backend): acá se pide el cargo nuevo, CUÁNDO TERMINA el cargo anterior,
 * CUÁNDO EMPIEZA el nuevo, y una observación opcional.
 *
 * Las dos fechas van por separado y a propósito NO pueden coincidir: el fin
 * del cargo anterior tiene que ser un día antes (o varios) del inicio del
 * nuevo, nunca el mismo día. Por eso "Fecha de inicio" arranca sugiriendo hoy
 * y "Fecha de fin del cargo anterior" se autocompleta un día antes de esa —
 * ambas editables, por si el salto es de más de un día.
 *
 * Mismo criterio de cierre con Escape y envío con Enter que ModalBajaReingreso.
 */
export const ModalCambiarCargo = ({ abierto, ficha, onCerrar, onConfirmar }) => {
  const [cargoId, setCargoId] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [fechaFinAnterior, setFechaFinAnterior] = useState(unDiaAntes(hoyIso()));
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [cargos, setCargos] = useState([]);

  useEffect(() => {
    if (!abierto) return;
    setCargoId(null);
    setFechaInicio(hoyIso());
    setFechaFinAnterior(unDiaAntes(hoyIso()));
    setObservacion("");
    setErrores({});
    setEnviando(false);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    let cancelado = false;

    ListarCargos()
      .then((lista) => {
        if (!cancelado) setCargos(lista);
      })
      .catch((error) => {
        if (!cancelado) toast.error(error.message || "No se pudieron cargar los cargos");
      });

    return () => {
      cancelado = true;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const opcionesCargo = useMemo(
    () => cargos.map((cargo) => ({ value: cargo.id, label: cargo.nombre })),
    [cargos],
  );

  const validar = () => {
    const nuevos = {};
    if (!cargoId) nuevos.cargoId = "Elija el cargo nuevo.";
    if (!fechaInicio) nuevos.fechaInicio = "Indique la fecha.";
    if (!fechaFinAnterior) nuevos.fechaFinAnterior = "Indique la fecha.";
    if (fechaInicio && fechaFinAnterior && fechaFinAnterior >= fechaInicio) {
      nuevos.fechaFinAnterior = "Debe ser anterior a la fecha de inicio del nuevo cargo.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando || !validar()) return;

    setEnviando(true);
    try {
      await onConfirmar({
        cargoId,
        fechaFinAnterior,
        fechaInicio,
        observacion: observacion.trim() || null,
      });
    } catch (error) {
      toast.error(error.message || "No se pudo registrar el cambio de cargo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI isOpen={abierto} onClose={onCerrar} title="Cambiar cargo" width="520px" noFooter>
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Aviso $tono="info">
            Se cerrará el cargo actual de {ficha?.nombresCompletos} en la fecha de fin indicada y
            se abrirá el nuevo desde la fecha de inicio: tiene que haber al menos un día de
            diferencia entre las dos.
          </Aviso>

          <CampoLabel etiqueta="Cargo nuevo" requerido error={errores.cargoId}>
            <SelectUI
              options={opcionesCargo}
              value={opcionesCargo.find((opcion) => opcion.value === cargoId) ?? null}
              onChange={(opcion) => {
                setCargoId(opcion?.value ?? null);
                setErrores((previos) => ({ ...previos, cargoId: undefined }));
              }}
              isSearchable
              placeholder="Seleccione el cargo"
              minWidth="100%"
              maxWidth="100%"
            />
          </CampoLabel>

          <FilaFormulario $min={200}>
            <CampoLabel
              etiqueta="Fecha de fin del cargo anterior"
              requerido
              error={errores.fechaFinAnterior}
              ayuda="Un día antes del inicio del nuevo, o varios si hubo un salto mayor."
            >
              <InputUI
                type="date"
                value={fechaFinAnterior}
                onChange={setFechaFinAnterior}
                max={fechaInicio || undefined}
                min={ficha?.fechaIngreso || undefined}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Fecha de inicio del nuevo cargo" requerido error={errores.fechaInicio}>
              <InputUI
                type="date"
                value={fechaInicio}
                onChange={setFechaInicio}
                max={hoyIso()}
                min={ficha?.fechaIngreso || undefined}
              />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Observación">
            <AreaTexto
              value={observacion}
              onChange={(evento) => setObservacion(evento.target.value)}
              maxLength={500}
              rows={3}
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Cambiar cargo"}
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalCambiarCargo;
