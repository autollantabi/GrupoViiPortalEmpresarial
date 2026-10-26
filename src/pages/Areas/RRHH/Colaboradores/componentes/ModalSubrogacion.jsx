import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarEmpresas } from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { hoyIso } from "../utils/fechas";

/**
 * Modal de subrogación: traslada al colaborador a otra empresa del grupo.
 *
 * La empresa actual se excluye de las opciones (no tendría sentido
 * "subrogarlo" a donde ya está). No pide cargo: el cargo es de la persona
 * (no de la ficha), así que sigue siendo el mismo en la empresa destino sin
 * que nadie tenga que elegirlo de nuevo. Si hay que cambiarlo, es "Cambiar
 * cargo" en la ficha, aparte de esto.
 */
export const ModalSubrogacion = ({ abierto, ficha, onCerrar, onConfirmar }) => {
  const [empresaDestinoId, setEmpresaDestinoId] = useState(null);
  const [fecha, setFecha] = useState(hoyIso());
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    if (!abierto) return;
    setEmpresaDestinoId(null);
    setFecha(hoyIso());
    setObservacion("");
    setErrores({});
    setEnviando(false);
  }, [abierto, ficha]);

  useEffect(() => {
    if (!abierto) return undefined;
    let cancelado = false;

    ListarEmpresas()
      .then((listaEmpresas) => {
        if (cancelado) return;
        setEmpresas(listaEmpresas);
      })
      .catch((error) => {
        if (!cancelado) toast.error(error.message || "No se pudieron cargar las empresas");
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

  const opcionesEmpresa = useMemo(
    () =>
      empresas
        .filter((empresa) => empresa.id !== ficha?.empresaId)
        .map((empresa) => ({ value: empresa.id, label: empresa.nombre })),
    [empresas, ficha],
  );

  const validar = () => {
    const nuevos = {};
    if (!empresaDestinoId) nuevos.empresaDestinoId = "Elija la empresa destino.";
    if (!fecha) nuevos.fecha = "Indique la fecha.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando || !validar()) return;

    setEnviando(true);
    try {
      await onConfirmar({
        empresaDestinoId,
        fecha,
        observacion: observacion.trim() || null,
      });
    } catch (error) {
      toast.error(error.message || "No se pudo registrar la subrogación");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title="Subrogar a otra empresa"
      width="560px"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Aviso $tono="info">
            {ficha?.nombresCompletos} quedará de baja en {ficha?.empresa} por subrogación y se
            creará una ficha nueva, activa, en la empresa destino. La antigüedad (fecha de
            ingreso) <strong>se conserva</strong>: no vuelve a contar desde cero.
          </Aviso>

          <CampoLabel etiqueta="Empresa destino" requerido error={errores.empresaDestinoId}>
            <SelectUI
              options={opcionesEmpresa}
              value={opcionesEmpresa.find((opcion) => opcion.value === empresaDestinoId) ?? null}
              onChange={(opcion) => {
                setEmpresaDestinoId(opcion?.value ?? null);
                setErrores((previos) => ({ ...previos, empresaDestinoId: undefined }));
              }}
              isSearchable
              placeholder="Seleccione la empresa"
              minWidth="100%"
              maxWidth="100%"
            />
          </CampoLabel>

          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Fecha" requerido error={errores.fecha}>
              <InputUI type="date" value={fecha} onChange={setFecha} max={hoyIso()} />
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
              text={enviando ? "Guardando…" : "Subrogar"}
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalSubrogacion;
