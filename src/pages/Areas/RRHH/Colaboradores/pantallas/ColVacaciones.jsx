import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
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
  Badge,
  CirculoIcono,
  Contenedor,
  FilaFormulario,
  Tarjeta,
  TextoTenue,
  Vacio,
} from "../componentes/piezas";
import { formatearFechaCorta, hoyIso } from "../utils/fechas";

const OPCIONES_TIPO = [
  { value: "Vacaciones", label: "Vacaciones" },
  { value: "Permiso", label: "Permiso" },
];

const BACKUP_VACIO = { nombre: "", cargo: "" };
const ACTIVIDAD_VACIA = { actividad: "", backupResponsable: "", documentacionSoporte: "", observaciones: "" };

/**
 * Vocabulario visual del modal "Nueva solicitud", calcado del mockup
 * viewModalSolicitud.html que trajo RRHH: cabecera con insignia, secciones con
 * etiqueta en mayúsculas, pastilla de rango de fechas y tarjetas anidadas para
 * cada backup/actividad. Son piezas locales (no van a piezas.jsx) porque por
 * ahora solo las usa este modal.
 */
const EncabezadoModal = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border};
`;

const InsigniaEncabezado = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.12 })};
`;

const BloqueTituloModal = styled.div`
  flex: 1;
  min-width: 0;
`;

const TituloModal = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text};
`;

const SubtituloModal = styled.p`
  margin: 2px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const BotonCerrarModal = styled.button`
  flex: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: ${({ theme }) => theme?.colors?.backgroundLight};
  color: ${({ theme }) => theme?.colors?.textSecondary};
  cursor: pointer;

  &:hover {
    filter: brightness(0.96);
  }
`;

const CuerpoModal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 24px;
`;

const SeccionModal = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const EtiquetaSeccion = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textTertiary ?? theme?.colors?.textSecondary};
`;

const FilaSeccion = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EspaciadorFila = styled.div`
  flex: 1;
`;

const PildoraRango = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: end;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ theme }) => theme?.colors?.primary};
  background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.1 })};
`;

const TarjetaAnidada = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 14px;
  background: ${({ theme }) => theme?.colors?.backgroundLight};
`;

const TarjetaActividad = styled(TarjetaAnidada)`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const GrillaBackup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 42px;
  gap: 16px;
  align-items: end;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BotonRedondo = styled.button`
  flex: none;
  width: ${({ $tamano = 42 }) => $tamano}px;
  height: ${({ $tamano = 42 }) => $tamano}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 10px;
  background: ${({ theme }) => theme?.colors?.backgroundCard};
  color: ${({ theme }) => theme?.colors?.error};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.error ?? "#dc2626", alpha: 0.08 })};
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const CirculoNumero = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: ${({ theme }) => theme?.colors?.primary};
  color: ${({ theme }) => theme?.colors?.white ?? "#fff"};
  font-size: 12px;
  font-weight: 700;
`;

const PieModal = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme?.colors?.border};
  background: ${({ theme }) => theme?.colors?.backgroundLight};
`;

/** El formulario completo: datos de la ausencia, hasta 2 backups y la tabla de actividades a entregarles. */
const ModalNuevaSolicitud = ({ abierto, ficha, onCerrar, onConfirmar }) => {
  const { theme } = useTheme();
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

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  return (
    <ModalUI isOpen={abierto} onClose={cerrar} width="760px" maxWidth="96vw" noHeader noPadding noFooter>
      <EncabezadoModal>
        <InsigniaEncabezado>
          <IconUI name="FaRegCalendarDays" size={22} color={theme?.colors?.primary} />
        </InsigniaEncabezado>
        <BloqueTituloModal>
          <TituloModal>Nueva solicitud</TituloModal>
          <SubtituloModal>
            Vacaciones y permisos{ficha?.nombresCompletos ? ` · ${ficha.nombresCompletos}` : ""}
          </SubtituloModal>
        </BloqueTituloModal>
        <BotonCerrarModal type="button" aria-label="Cerrar" onClick={cerrar}>
          <IconUI name="FaXmark" size={18} color={theme?.colors?.textSecondary} />
        </BotonCerrarModal>
      </EncabezadoModal>

      <form onSubmit={enviar} noValidate>
        <CuerpoModal>
          <SeccionModal>
            <EtiquetaSeccion>Detalle</EtiquetaSeccion>
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
              <PildoraRango>
                <IconUI name="FaRegClock" size={14} color={theme?.colors?.primary} />
                {formatearFechaCorta(fechaInicio)} → {formatearFechaCorta(fechaFin)}
              </PildoraRango>
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
            </FilaFormulario>

            <FilaFormulario $min={220}>
              <CampoLabel etiqueta="Fecha de notificación">
                <InputUI type="date" value={fechaNotificacion} onChange={setFechaNotificacion} />
              </CampoLabel>
              <CampoLabel etiqueta="Observación">
                <AreaTexto value={observacion} onChange={(e) => setObservacion(e.target.value)} rows={1} maxLength={1000} />
              </CampoLabel>
            </FilaFormulario>
          </SeccionModal>

          <SeccionModal>
            <FilaSeccion>
              <EtiquetaSeccion>Backups</EtiquetaSeccion>
              <Badge $tono="neutro">{backups.length} de 2</Badge>
              <EspaciadorFila />
              {backups.length < 2 && (
                <ButtonUI
                  text="Agregar backup"
                  iconLeft="FaPlus"
                  variant="outlined"
                  onClick={() => setBackups((previos) => [...previos, { ...BACKUP_VACIO }])}
                />
              )}
            </FilaSeccion>
            {backups.length === 0 && (
              <TextoTenue>Opcional: quién cubre a este colaborador mientras está fuera.</TextoTenue>
            )}
            {backups.map((backup, indice) => (
              <TarjetaAnidada key={indice}>
                <GrillaBackup>
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
                  <BotonRedondo
                    type="button"
                    aria-label={`Quitar backup ${indice + 1}`}
                    onClick={() => setBackups((previos) => previos.filter((_b, i) => i !== indice))}
                  >
                    <IconUI name="FaTrash" size={15} color={theme?.colors?.error} />
                  </BotonRedondo>
                </GrillaBackup>
              </TarjetaAnidada>
            ))}
          </SeccionModal>

          <SeccionModal>
            <FilaSeccion>
              <EtiquetaSeccion>Entrega de actividades al backup</EtiquetaSeccion>
              <EspaciadorFila />
              <ButtonUI
                text="Agregar actividad"
                iconLeft="FaPlus"
                variant="outlined"
                onClick={() => setActividades((previas) => [...previas, { ...ACTIVIDAD_VACIA }])}
              />
            </FilaSeccion>
            {actividades.map((actividad, indice) => (
              <TarjetaActividad key={indice}>
                <FilaSeccion>
                  <CirculoNumero>{indice + 1}</CirculoNumero>
                  <strong style={{ fontSize: 13 }}>Actividad {indice + 1}</strong>
                  <EspaciadorFila />
                  {actividades.length > 1 && (
                    <BotonRedondo
                      type="button"
                      $tamano={32}
                      aria-label={`Quitar actividad ${indice + 1}`}
                      onClick={() => setActividades((previas) => previas.filter((_a, i) => i !== indice))}
                    >
                      <IconUI name="FaXmark" size={14} color={theme?.colors?.error} />
                    </BotonRedondo>
                  )}
                </FilaSeccion>
                <FilaFormulario $min={220}>
                  <CampoLabel etiqueta="Actividad">
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
              </TarjetaActividad>
            ))}
          </SeccionModal>
        </CuerpoModal>

        <PieModal>
          <ButtonUI text="Cancelar" variant="outlined" onClick={cerrar} disabled={enviando} />
          <ButtonUI
            type="submit"
            text={enviando ? "Guardando…" : "Registrar solicitud"}
            iconLeft="FaCheck"
            disabled={enviando}
          />
        </PieModal>
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
        ficha={ficha}
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
