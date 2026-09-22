import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarCargos, ListarEmpresas } from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, FilaFormulario } from "./piezas";
import { hoyIso } from "../utils/fechas";

/**
 * Modal de subrogación: traslada al colaborador a otra empresa del grupo.
 *
 * La empresa actual se excluye de las opciones (no tendría sentido
 * "subrogarlo" a donde ya está). El cargo destino es opcional y por defecto es
 * el mismo que tiene hoy: se manda solo si la persona lo cambia a propósito, así
 * el backend decide qué hacer cuando no viene.
 */
export const ModalSubrogacion = ({ abierto, ficha, onCerrar, onConfirmar }) => {
  const [empresaDestinoId, setEmpresaDestinoId] = useState(null);
  const [cargoDestinoId, setCargoDestinoId] = useState(null);
  const [fecha, setFecha] = useState(hoyIso());
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [cargos, setCargos] = useState([]);

  useEffect(() => {
    if (!abierto) return;
    setEmpresaDestinoId(null);
    setCargoDestinoId(ficha?.cargoId ?? null);
    setFecha(hoyIso());
    setObservacion("");
    setErrores({});
    setEnviando(false);
  }, [abierto, ficha]);

  useEffect(() => {
    if (!abierto) return undefined;
    let cancelado = false;

    Promise.all([ListarEmpresas(), ListarCargos()])
      .then(([listaEmpresas, listaCargos]) => {
        if (cancelado) return;
        setEmpresas(listaEmpresas);
        setCargos(listaCargos);
      })
      .catch((error) => {
        if (!cancelado) toast.error(error.message || "No se pudieron cargar los catálogos");
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

  const opcionesCargo = useMemo(
    () => cargos.map((cargo) => ({ value: cargo.id, label: cargo.nombre })),
    [cargos],
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
        cargoDestinoId: cargoDestinoId || undefined,
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

          <CampoLabel
            etiqueta="Cargo destino"
            ayuda="Por defecto se conserva el cargo actual."
          >
            <SelectUI
              options={opcionesCargo}
              value={opcionesCargo.find((opcion) => opcion.value === cargoDestinoId) ?? null}
              onChange={(opcion) => setCargoDestinoId(opcion?.value ?? null)}
              isSearchable
              isClearable
              placeholder="Mismo cargo actual"
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
