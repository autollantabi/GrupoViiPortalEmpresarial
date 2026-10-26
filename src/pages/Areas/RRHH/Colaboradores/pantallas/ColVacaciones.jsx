import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  CrearSolicitudVacaciones,
  DecidirSolicitudVacaciones,
  EliminarSolicitudVacaciones,
  ListarSolicitudesVacaciones,
  ObtenerUrlPdfSolicitudVacaciones,
  RegistrarSolicitudVacaciones,
} from "services/vacacionesService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { ModalVerActa } from "../componentes/ModalVerActa";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaVacaciones } from "../componentes/TablaVacaciones";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  CirculoIcono,
  Contenedor,
  FilaFormulario,
  Separador,
  Tarjeta,
  TextoTenue,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";
import { hoyIso } from "../utils/fechas";

const OPCIONES_TIPO = [
  { value: "Vacaciones", label: "Vacaciones" },
  { value: "Permiso", label: "Permiso" },
];

const BACKUP_VACIO = { nombre: "", cargo: "" };
const ACTIVIDAD_VACIA = { actividad: "", backupResponsable: "", documentacionSoporte: "", observaciones: "" };

/** El formulario completo: datos de la ausencia, hasta 2 backups y la tabla de actividades a entregarles. */
const ModalNuevaSolicitud = ({ abierto, onCerrar, onConfirmar }) => {
  const [tipo, setTipo] = useState(OPCIONES_TIPO[0]);
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [totalDias, setTotalDias] = useState("");
  const [fechaReincorporacion, setFechaReincorporacion] = useState("");
  const [fechaNotificacion, setFechaNotificacion] = useState(hoyIso());
  const [observacion, setObservacion] = useState("");
  const [backups, setBackups] = useState([]);
  const [actividades, setActividades] = useState([{ ...ACTIVIDAD_VACIA }]);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const reiniciar = () => {
    setTipo(OPCIONES_TIPO[0]);
    setFechaInicio(hoyIso());
    setFechaFin(hoyIso());
    setTotalDias("");
    setFechaReincorporacion("");
    setFechaNotificacion(hoyIso());
    setObservacion("");
    setBackups([]);
    setActividades([{ ...ACTIVIDAD_VACIA }]);
    setError(null);
  };

  const actualizarBackup = (indice, campo, valor) =>
    setBackups((previos) => previos.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)));

  const actualizarActividad = (indice, campo, valor) =>
    setActividades((previas) => previas.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const dias = Number(totalDias);
    if (!totalDias || !Number.isFinite(dias) || dias <= 0) {
      setError("Indique el total de días, mayor a 0.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar({
        tipo: tipo.value,
        fechaInicio,
        fechaFin,
        totalDias: dias,
        fechaReincorporacion: fechaReincorporacion || null,
        fechaNotificacion: fechaNotificacion || null,
        observacion: observacion.trim() || null,
        backups: backups
          .filter((b) => b.nombre.trim() !== "")
          .map((b) => ({ nombre: b.nombre.trim(), cargo: b.cargo.trim() || null })),
        actividades: actividades
          .filter((a) => a.actividad.trim() !== "")
          .map((a) => ({
            actividad: a.actividad.trim(),
            backupResponsable: a.backupResponsable.trim() || null,
            documentacionSoporte: a.documentacionSoporte.trim() || null,
            observaciones: a.observaciones.trim() || null,
          })),
      });
      reiniciar();
    } catch (e) {
      toast.error(e.message || "No se pudo registrar la solicitud");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={() => {
        reiniciar();
        onCerrar();
      }}
      title="Nueva solicitud de vacaciones/permiso"
      width="760px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FilaFormulario $min={180}>
            <CampoLabel etiqueta="Tipo" requerido>
              <SelectUI options={OPCIONES_TIPO} value={tipo} onChange={setTipo} minWidth="100%" />
            </CampoLabel>
            <CampoLabel etiqueta="Total de días" requerido error={error}>
              <InputUI
                type="number"
                value={totalDias}
                onChange={(valor) => {
                  setTotalDias(valor);
                  setError(null);
                }}
                min={1}
              />
            </CampoLabel>
          </FilaFormulario>

          <FilaFormulario $min={180}>
            <CampoLabel etiqueta="Fecha de inicio" requerido>
              <InputUI type="date" value={fechaInicio} onChange={setFechaInicio} />
            </CampoLabel>
            <CampoLabel etiqueta="Fecha de finalización" requerido error={fechaFin < fechaInicio ? error : null}>
              <InputUI type="date" value={fechaFin} onChange={setFechaFin} min={fechaInicio} />
            </CampoLabel>
            <CampoLabel etiqueta="Fecha de reincorporación">
              <InputUI type="date" value={fechaReincorporacion} onChange={setFechaReincorporacion} />
            </CampoLabel>
            <CampoLabel etiqueta="Fecha de notificación">
              <InputUI type="date" value={fechaNotificacion} onChange={setFechaNotificacion} />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Observación">
            <AreaTexto value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={2} maxLength={1000} />
          </CampoLabel>

          <Separador />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <TituloTarjeta style={{ margin: 0, fontSize: 14 }}>Backups (hasta 2)</TituloTarjeta>
            {backups.length < 2 && (
              <ButtonUI
                text="Agregar backup"
                iconLeft="FaPlus"
                variant="outlined"
                onClick={() => setBackups((previos) => [...previos, { ...BACKUP_VACIO }])}
              />
            )}
          </div>
          {backups.map((backup, indice) => (
            <FilaFormulario key={indice} $min={200}>
              <CampoLabel etiqueta={`Nombre backup ${indice + 1}`}>
                <InputUI
                  value={backup.nombre}
                  onChange={(valor) => actualizarBackup(indice, "nombre", valor)}
                  maxLength={150}
                />
              </CampoLabel>
              <CampoLabel etiqueta="Cargo">
                <InputUI
                  value={backup.cargo}
                  onChange={(valor) => actualizarBackup(indice, "cargo", valor)}
                  maxLength={150}
                />
              </CampoLabel>
              <ButtonUI
                text="Quitar"
                iconLeft="FaXmark"
                variant="outlined"
                onClick={() => setBackups((previos) => previos.filter((_b, i) => i !== indice))}
              />
            </FilaFormulario>
          ))}

          <Separador />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <TituloTarjeta style={{ margin: 0, fontSize: 14 }}>
              Entrega de actividades al backup
            </TituloTarjeta>
            <ButtonUI
              text="Agregar actividad"
              iconLeft="FaPlus"
              variant="outlined"
              onClick={() => setActividades((previas) => [...previas, { ...ACTIVIDAD_VACIA }])}
            />
          </div>
          {actividades.map((actividad, indice) => (
            <div
              key={indice}
              style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #e5e5e5", borderRadius: 8, padding: 10 }}
            >
              <FilaFormulario $min={220}>
                <CampoLabel etiqueta={`Actividad ${indice + 1}`}>
                  <InputUI
                    value={actividad.actividad}
                    onChange={(valor) => actualizarActividad(indice, "actividad", valor)}
                    maxLength={300}
                  />
                </CampoLabel>
                <CampoLabel etiqueta="Backup responsable">
                  <InputUI
                    value={actividad.backupResponsable}
                    onChange={(valor) => actualizarActividad(indice, "backupResponsable", valor)}
                    maxLength={150}
                  />
                </CampoLabel>
              </FilaFormulario>
              <FilaFormulario $min={220}>
                <CampoLabel etiqueta="Documentación / soporte">
                  <InputUI
                    value={actividad.documentacionSoporte}
                    onChange={(valor) => actualizarActividad(indice, "documentacionSoporte", valor)}
                    maxLength={300}
                  />
                </CampoLabel>
                <CampoLabel etiqueta="Observaciones">
                  <InputUI
                    value={actividad.observaciones}
                    onChange={(valor) => actualizarActividad(indice, "observaciones", valor)}
                    maxLength={500}
                  />
                </CampoLabel>
              </FilaFormulario>
              {actividades.length > 1 && (
                <ButtonUI
                  text="Quitar actividad"
                  iconLeft="FaXmark"
                  variant="outlined"
                  onClick={() => setActividades((previas) => previas.filter((_a, i) => i !== indice))}
                />
              )}
            </div>
          ))}

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Registrar solicitud"}
              iconLeft="FaCheck"
              disabled={enviando}
            />
            <ButtonUI
              text="Cancelar"
              variant="outlined"
              onClick={() => {
                reiniciar();
                onCerrar();
              }}
              disabled={enviando}
            />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

/** Aprobar o rechazar (con motivo): la firma del jefe inmediato, registrada por RRHH. */
const ModalDecidir = ({ abierto, solicitud, onCerrar, onConfirmar }) => {
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const decidir = async (aprobar) => {
    if (enviando) return;
    if (!aprobar && !motivoRechazo.trim()) {
      toast.error("Indique el motivo del rechazo.");
      return;
    }
    setEnviando(true);
    try {
      await onConfirmar({ aprobar, motivoRechazo: aprobar ? null : motivoRechazo.trim() });
      setMotivoRechazo("");
    } catch (e) {
      toast.error(e.message || "No se pudo registrar la decisión");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !solicitud) return null;

  return (
    <ModalUI isOpen={abierto} onClose={onCerrar} title="Decisión del jefe inmediato" width="460px" noFooter>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TextoTenue>
          Registre lo que el jefe inmediato de <strong>{solicitud.tipo}</strong> ({solicitud.fechaInicio} –{" "}
          {solicitud.fechaFin}) decidió por fuera del sistema.
        </TextoTenue>
        <CampoLabel etiqueta="Motivo del rechazo" ayuda="Obligatorio solo si va a rechazar.">
          <AreaTexto value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} rows={3} maxLength={500} />
        </CampoLabel>
        <Acciones>
          <ButtonUI
            text={enviando ? "Guardando…" : "Aprobar"}
            iconLeft="FaCheck"
            disabled={enviando}
            onClick={() => decidir(true)}
          />
          <ButtonUI
            text="Rechazar"
            variant="outlined"
            disabled={enviando}
            onClick={() => decidir(false)}
          />
          <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
        </Acciones>
      </div>
    </ModalUI>
  );
};

/** Pestaña Vacaciones: solicitudes de vacaciones/permisos y entrega de actividades al backup. */
export const ColVacaciones = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [modalNuevaAbierto, setModalNuevaAbierto] = useState(false);
  const [aDecidir, setADecidir] = useState(null);
  const [urlPdf, setUrlPdf] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: solicitudes,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ListarSolicitudesVacaciones(id, { signal }), [id]);

  const confirmarNueva = async (datos) => {
    await CrearSolicitudVacaciones(id, datos);
    setModalNuevaAbierto(false);
    toast.success("Solicitud registrada.");
    recargar();
  };

  const confirmarDecision = async (datos) => {
    await DecidirSolicitudVacaciones(aDecidir.id, datos);
    setADecidir(null);
    toast.success(datos.aprobar ? "Solicitud aprobada." : "Solicitud rechazada.");
    recargar();
  };

  const registrar = async (solicitud) => {
    setOcupado(true);
    try {
      await RegistrarSolicitudVacaciones(solicitud.id);
      toast.success("Solicitud registrada en el sistema.");
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo registrar la solicitud");
    } finally {
      setOcupado(false);
    }
  };

  const eliminar = async (solicitud) => {
    const motivo = window.prompt("Motivo de la eliminación:");
    if (!motivo || !motivo.trim()) return;
    setOcupado(true);
    try {
      await EliminarSolicitudVacaciones(solicitud.id, { motivo: motivo.trim() });
      toast.success("Solicitud eliminada.");
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la solicitud");
    } finally {
      setOcupado(false);
    }
  };

  const verPdf = async (solicitud) => {
    setOcupado(true);
    try {
      setUrlPdf(await ObtenerUrlPdfSolicitudVacaciones(solicitud.id));
    } catch (e) {
      toast.error(e.message || "No se pudo abrir el PDF");
    } finally {
      setOcupado(false);
    }
  };

  const cerrarPdf = () => {
    if (urlPdf) window.URL.revokeObjectURL(urlPdf);
    setUrlPdf(null);
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando las solicitudes…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !solicitudes) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar las solicitudes</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} />

      <Acciones>
        <ButtonUI
          text="Nueva solicitud"
          iconLeft="FaPlus"
          onClick={() => setModalNuevaAbierto(true)}
        />
      </Acciones>

      <Tarjeta $sinRelleno>
        {solicitudes.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaUmbrellaBeach" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin solicitudes registradas</strong>
            <TextoTenue>Use "Nueva solicitud" para registrar la primera.</TextoTenue>
          </Vacio>
        ) : (
          <TablaVacaciones
            solicitudes={solicitudes}
            ocupado={ocupado}
            onVerPdf={verPdf}
            onDecidir={setADecidir}
            onRegistrar={registrar}
            onEliminar={eliminar}
          />
        )}
      </Tarjeta>

      <ModalNuevaSolicitud
        abierto={modalNuevaAbierto}
        onCerrar={() => setModalNuevaAbierto(false)}
        onConfirmar={confirmarNueva}
      />

      <ModalDecidir
        abierto={aDecidir !== null}
        solicitud={aDecidir}
        onCerrar={() => setADecidir(null)}
        onConfirmar={confirmarDecision}
      />

      <ModalVerActa
        abierto={urlPdf !== null}
        url={urlPdf}
        titulo="Solicitud de vacaciones/permiso"
        onCerrar={cerrarPdf}
      />
    </Contenedor>
  );
};

export default ColVacaciones;
