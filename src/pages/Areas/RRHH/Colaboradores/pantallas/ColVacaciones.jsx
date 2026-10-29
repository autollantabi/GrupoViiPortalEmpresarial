import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
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
  Tarjeta,
  TextoTenue,
  Vacio,
} from "../componentes/piezas";
import { RUTA_VACACIONES_NUEVA } from "../utils/constantesDotacion";

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
  const navigate = useNavigate();
  const { theme } = useTheme();

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
          onClick={() => navigate(RUTA_VACACIONES_NUEVA(id))}
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
