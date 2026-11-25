import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, FilaFormulario } from "./piezas";
import { hoyIso } from "../utils/fechas";

const OPCIONES_ESTADO = [
  { value: "Aprobada", label: "Aprobada" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Rechazada", label: "Rechazada" },
];

/**
 * Modal de "Nueva solicitud" / "Editar solicitud" de permiso. El formulario
 * es corto (sin backups ni actividades, a diferencia de vacaciones), así que
 * no necesita una página completa aparte: es un modal, calco de ModalTipo en
 * EditorTiposDocumento.jsx.
 */
export const ModalPermiso = ({ abierto, solicitud, tipos, onCerrar, onGuardar }) => {
  const [tipoPermisoId, setTipoPermisoId] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [especificarHoras, setEspecificarHoras] = useState(false);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [estado, setEstado] = useState(OPCIONES_ESTADO[0]);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setTipoPermisoId(solicitud?.tipoPermisoId ?? null);
    setFechaInicio(solicitud?.fechaInicio ?? hoyIso());
    setFechaFin(solicitud?.fechaFin ?? hoyIso());
    setEspecificarHoras(Boolean(solicitud?.horaInicio && solicitud?.horaFin));
    setHoraInicio(solicitud?.horaInicio ?? "");
    setHoraFin(solicitud?.horaFin ?? "");
    setMotivo(solicitud?.motivo ?? "");
    setEstado(OPCIONES_ESTADO.find((opcion) => opcion.value === solicitud?.estado) ?? OPCIONES_ESTADO[0]);
    setMotivoRechazo(solicitud?.motivoRechazo ?? "");
    setErrorValidacion(null);
    setEnviando(false);
  }, [abierto, solicitud]);

  const opcionesTipo = (tipos ?? []).map((tipo) => ({ value: tipo.id, label: tipo.nombre }));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!tipoPermisoId) {
      setErrorValidacion("Elija el tipo de permiso.");
      return;
    }
    if (!motivo.trim()) {
      setErrorValidacion("Indique el motivo.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setErrorValidacion("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    if (especificarHoras && (!horaInicio || !horaFin)) {
      setErrorValidacion("Indique la hora de inicio y la de fin.");
      return;
    }
    if (estado.value === "Rechazada" && !motivoRechazo.trim()) {
      setErrorValidacion("Indique el motivo del rechazo.");
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        tipoPermisoId,
        fechaInicio,
        fechaFin,
        horaInicio: especificarHoras ? horaInicio : null,
        horaFin: especificarHoras ? horaFin : null,
        motivo: motivo.trim(),
        estado: estado.value,
        motivoRechazo: estado.value === "Rechazada" ? motivoRechazo.trim() : null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar la solicitud");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={solicitud ? "Editar solicitud de permiso" : "Nueva solicitud de permiso"}
      width="560px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Tipo de permiso" requerido error={errorValidacion}>
              <SelectUI
                options={opcionesTipo}
                value={opcionesTipo.find((opcion) => opcion.value === tipoPermisoId) ?? null}
                onChange={(opcion) => {
                  setTipoPermisoId(opcion?.value ?? null);
                  setErrorValidacion(null);
                }}
                minWidth="100%"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Estado" requerido>
              <SelectUI
                options={OPCIONES_ESTADO}
                value={estado}
                onChange={setEstado}
                minWidth="100%"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
          </FilaFormulario>

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Fecha de inicio" requerido>
              <InputUI type="date" value={fechaInicio} onChange={setFechaInicio} />
            </CampoLabel>
            <CampoLabel
              etiqueta="Fecha de fin"
              requerido
              error={fechaFin < fechaInicio ? errorValidacion : null}
            >
              <InputUI type="date" value={fechaFin} onChange={setFechaFin} min={fechaInicio} />
            </CampoLabel>
          </FilaFormulario>

          <div>
            <CheckboxUI
              name="especificar-horas"
              checked={especificarHoras}
              onChange={(_nombre, marcado) => setEspecificarHoras(marcado)}
              label="Especificar horas (si no, se cuenta como día completo)"
            />
          </div>

          {especificarHoras && (
            <FilaFormulario $min={160}>
              <CampoLabel etiqueta="Hora de inicio" requerido>
                <InputUI type="time" value={horaInicio} onChange={setHoraInicio} />
              </CampoLabel>
              <CampoLabel etiqueta="Hora de fin" requerido>
                <InputUI type="time" value={horaFin} onChange={setHoraFin} />
              </CampoLabel>
            </FilaFormulario>
          )}

          <CampoLabel etiqueta="Motivo" requerido error={errorValidacion}>
            <AreaTexto
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setErrorValidacion(null);
              }}
              rows={2}
              maxLength={500}
            />
          </CampoLabel>

          {estado.value === "Rechazada" && (
            <CampoLabel
              etiqueta="Motivo del rechazo"
              requerido
              ayuda="Obligatorio solo si el estado es Rechazada."
            >
              <AreaTexto
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={2}
                maxLength={500}
              />
            </CampoLabel>
          )}

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Guardar"}
              iconLeft="FaCheck"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalPermiso;
