import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useAuthContext } from "context/authContext";
import { useTheme } from "context/ThemeContext";
import {
  MarcarInduccionItem,
  ObtenerColaborador,
  ObtenerInduccionEmpleado,
} from "services/colaboradoresService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  Badge,
  CirculoIcono,
  Contenedor,
  Fila,
  Kpi,
  KpiTitulo,
  KpiValor,
  Rejilla,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  Vacio,
} from "../componentes/piezas";
import { formatearFecha, hoyIso } from "../utils/fechas";

/**
 * Confirmación al marcar una actividad como completada.
 *
 * Deliberadamente simple (no un modal de varios pasos): pide la fecha en que se
 * completó, quién la completó (precargado con el usuario de la sesión, pero
 * editable porque quien la marca en el sistema no siempre es quien la hizo) y una
 * observación opcional.
 */
const ModalMarcarInduccion = ({ abierto, item, nombreUsuario, onCerrar, onConfirmar }) => {
  const [fechaCompletado, setFechaCompletado] = useState(hoyIso());
  const [completadoPor, setCompletadoPor] = useState("");
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setFechaCompletado(hoyIso());
    setCompletadoPor(nombreUsuario || "");
    setObservacion("");
    setEnviando(false);
  }, [abierto, nombreUsuario]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await onConfirmar({
        estado: "Completada",
        fechaCompletado,
        completadoPor: completadoPor.trim() || null,
        observacion: observacion.trim() || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo marcar la actividad");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !item) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title="Marcar actividad completada"
      width="460px"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextoTenue>{item.actividadNombre}</TextoTenue>
          <CampoLabel etiqueta="Fecha en que se completó" requerido>
            <InputUI
              type="date"
              value={fechaCompletado}
              onChange={setFechaCompletado}
              max={hoyIso()}
            />
          </CampoLabel>
          <CampoLabel etiqueta="Completado por">
            <InputUI value={completadoPor} onChange={setCompletadoPor} maxLength={150} />
          </CampoLabel>
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
              text={enviando ? "Guardando…" : "Marcar completada"}
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

/** Pestaña Inducción: el cronograma de un colaborador, según su área. */
export const ColInduccion = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const { user } = useAuthContext();

  const [aMarcar, setAMarcar] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: items,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerInduccionEmpleado(id, { signal }), [id]);

  const nombreUsuario = user?.USUARIO?.USUA_NOMBRE ?? "";

  const confirmarMarcado = async (carga) => {
    await MarcarInduccionItem(id, aMarcar.id, carga);
    setAMarcar(null);
    toast.success("Actividad marcada como completada.");
    recargar();
  };

  const reabrir = (item) => {
    setOcupado(true);
    MarcarInduccionItem(id, item.id, { estado: "Pendiente" })
      .then(() => {
        toast.success("Actividad devuelta a pendiente.");
        recargar();
      })
      .catch((e) => toast.error(e.message || "No se pudo actualizar la actividad"))
      .finally(() => setOcupado(false));
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando la inducción…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !items) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar la inducción</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const completadas = items.filter((item) => item.estado === "Completada").length;
  const pendientes = items.length - completadas;

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} pendientesInduccion={pendientes} />

      <Rejilla $min={180}>
        <Kpi $tono="exito">
          <KpiTitulo>Completadas</KpiTitulo>
          <KpiValor $tono="exito">{completadas}</KpiValor>
        </Kpi>
        <Kpi $tono="aviso">
          <KpiTitulo>Pendientes</KpiTitulo>
          <KpiValor $tono="aviso">{pendientes}</KpiValor>
        </Kpi>
      </Rejilla>

      <Tarjeta $sinRelleno>
        {items.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaListCheck" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin actividades de inducción</strong>
            <TextoTenue>
              Defina el cronograma en Configuración para que empiece a programarse.
            </TextoTenue>
          </Vacio>
        ) : (
          <TablaScroll>
            <Tabla>
              <thead>
                <tr>
                  <Th>Actividad</Th>
                  <Th>Fecha programada</Th>
                  <Th>Responsable</Th>
                  <Th>Estado</Th>
                  <Th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const completada = item.estado === "Completada";
                  return (
                    <Fila key={item.id}>
                      <Td>{item.actividadNombre}</Td>
                      <Td>{formatearFecha(item.fechaProgramada)}</Td>
                      <Td>{item.responsable || "—"}</Td>
                      <Td>
                        <Badge $tono={completada ? "exito" : "aviso"}>{item.estado}</Badge>
                        {completada && item.fechaCompletado && (
                          <TextoTenue> · {formatearFecha(item.fechaCompletado)}</TextoTenue>
                        )}
                        {completada && item.completadoPor && (
                          <>
                            <br />
                            <TextoTenue>Por {item.completadoPor}</TextoTenue>
                          </>
                        )}
                      </Td>
                      <Td>
                        {completada ? (
                          <ButtonUI
                            text="Reabrir"
                            iconLeft="FaRotateLeft"
                            variant="ghost"
                            disabled={ocupado}
                            onClick={() => reabrir(item)}
                          />
                        ) : (
                          <ButtonUI
                            text="Marcar completada"
                            iconLeft="FaCheck"
                            variant="outlined"
                            disabled={ocupado}
                            onClick={() => setAMarcar(item)}
                          />
                        )}
                      </Td>
                    </Fila>
                  );
                })}
              </tbody>
            </Tabla>
          </TablaScroll>
        )}
      </Tarjeta>

      <ModalMarcarInduccion
        abierto={aMarcar !== null}
        item={aMarcar}
        nombreUsuario={nombreUsuario}
        onCerrar={() => setAMarcar(null)}
        onConfirmar={confirmarMarcado}
      />
    </Contenedor>
  );
};

export default ColInduccion;
