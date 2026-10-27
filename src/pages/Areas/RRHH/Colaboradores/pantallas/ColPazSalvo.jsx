import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import {
  ObtenerColaborador,
  ObtenerPazSalvoEmpleado,
  ObtenerUrlResumenPazSalvo,
  ReenviarPazSalvo,
  ResolverPazSalvoItem,
} from "services/colaboradoresService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { ModalVerActa } from "../componentes/ModalVerActa";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaPazSalvo } from "../componentes/TablaPazSalvo";
import { formatearMonto } from "../utils/constantesDotacion";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  CirculoIcono,
  Contenedor,
  Kpi,
  KpiTitulo,
  KpiValor,
  Rejilla,
  Tarjeta,
  TextoTenue,
  Vacio,
} from "../componentes/piezas";
import { ESTADO, RUTA_BASE } from "../utils/constantes";

/** Pide SI/NO tiene novedad y, si la tiene, el valor a descontar — igual al Excel de Talento Humano. */
const ModalResolverPazSalvo = ({ abierto, item, onCerrar, onConfirmar }) => {
  const [tieneNovedad, setTieneNovedad] = useState(false);
  const [valorTexto, setValorTexto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const reiniciar = () => {
    setTieneNovedad(false);
    setValorTexto("");
    setObservacion("");
    setError(null);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const valorNumero = Number(valorTexto);
    if (tieneNovedad && (valorTexto === "" || !Number.isFinite(valorNumero) || valorNumero <= 0)) {
      setError("Indique el valor de la novedad, mayor a cero.");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar({
        tieneNovedad,
        valor: tieneNovedad ? valorNumero : null,
        observacion: observacion.trim() || null,
      });
      reiniciar();
    } catch (e) {
      toast.error(e.message || "No se pudo marcar el área como resuelta");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !item) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title="Marcar área resuelta"
      width="460px"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextoTenue>
            Se marcará <strong>{item.areaNombre}</strong> como Resuelto. Esta acción no se puede
            deshacer.
          </TextoTenue>
          <CheckboxUI
            name="tieneNovedad"
            label="Tiene novedad (se descuenta un valor de la liquidación)"
            checked={tieneNovedad}
            onChange={(_nombre, marcado) => {
              setTieneNovedad(marcado);
              if (!marcado) setValorTexto("");
              setError(null);
            }}
          />
          {tieneNovedad && (
            <CampoLabel etiqueta="Valor" requerido error={error}>
              <InputUI
                type="number"
                value={valorTexto}
                onChange={(valor) => {
                  setValorTexto(valor);
                  setError(null);
                }}
                min={0.01}
                step="0.01"
                placeholder="0.00"
              />
            </CampoLabel>
          )}
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
              text={enviando ? "Guardando…" : "Marcar resuelto"}
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

/**
 * Pestaña Paz y salvo: el checklist de la baja de un colaborador.
 *
 * Solo tiene sentido con la ficha de baja, así que si el empleado sigue activo
 * (por ejemplo, escribiendo la URL a mano) redirige a la ficha en vez de mostrar
 * una pantalla vacía sin contexto.
 */
export const ColPazSalvo = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [aResolver, setAResolver] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [reenviando, setReenviando] = useState(false);
  const [urlResumen, setUrlResumen] = useState(null);
  const [abriendoResumen, setAbriendoResumen] = useState(false);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerPazSalvoEmpleado(id, { signal }), [id]);

  const items = datos?.items ?? null;
  const activaEnOtraEmpresa = datos?.activaEnOtraEmpresa ?? false;

  const confirmarResolver = async (carga) => {
    await ResolverPazSalvoItem(id, aResolver.areaConfigId, carga);
    setAResolver(null);
    toast.success(`${aResolver.areaNombre} quedó como resuelto.`);
    recargar();
  };

  const alternarSeleccion = (item) =>
    setSeleccionados((previos) => {
      const copia = new Set(previos);
      if (copia.has(item.id)) copia.delete(item.id);
      else copia.add(item.id);
      return copia;
    });

  const abrirResumen = async () => {
    if (abriendoResumen) return;
    setAbriendoResumen(true);
    try {
      setUrlResumen(await ObtenerUrlResumenPazSalvo(id));
    } catch (e) {
      toast.error(e.message || "No se pudo abrir el resumen de paz y salvo");
    } finally {
      setAbriendoResumen(false);
    }
  };

  const cerrarResumen = () => {
    if (urlResumen) window.URL.revokeObjectURL(urlResumen);
    setUrlResumen(null);
  };

  const reenviar = async () => {
    if (seleccionados.size === 0) return;

    const areaConfigIds = (items ?? [])
      .filter((item) => seleccionados.has(item.id))
      .map((item) => item.areaConfigId);

    setReenviando(true);
    try {
      await ReenviarPazSalvo(id, areaConfigIds);
      toast.success(
        areaConfigIds.length === 1
          ? "Recordatorio reenviado."
          : `Recordatorio reenviado a ${areaConfigIds.length} áreas.`,
      );
      setSeleccionados(new Set());
    } catch (e) {
      toast.error(e.message || "No se pudo reenviar el recordatorio");
    } finally {
      setReenviando(false);
    }
  };

  if (ficha && ficha.estado === ESTADO.ACTIVO) {
    return <Navigate to={`${RUTA_BASE}/empleados/${id}`} replace />;
  }

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando el paz y salvo…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !items) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} mostrarPazSalvo />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar el paz y salvo</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const resueltos = items.filter((item) => item.estado === "Resuelto").length;
  const pendientes = items.length - resueltos;
  const totalValor = items.reduce(
    (suma, item) => suma + (item.tieneNovedad ? item.valor ?? 0 : 0),
    0,
  );

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} mostrarPazSalvo />

      <Rejilla $min={180}>
        <Kpi $tono="exito">
          <KpiTitulo>Resueltos</KpiTitulo>
          <KpiValor $tono="exito">{resueltos}</KpiValor>
        </Kpi>
        <Kpi $tono="aviso">
          <KpiTitulo>Pendientes</KpiTitulo>
          <KpiValor $tono="aviso">{pendientes}</KpiValor>
        </Kpi>
        <Kpi>
          <KpiTitulo>Total a descontar</KpiTitulo>
          <KpiValor>{formatearMonto(totalValor)}</KpiValor>
        </Kpi>
      </Rejilla>

      <Acciones>
        {pendientes > 0 && (
          <>
            <ButtonUI
              text={
                reenviando
                  ? "Reenviando…"
                  : seleccionados.size > 1
                    ? `Reenviar recordatorio (${seleccionados.size})`
                    : "Reenviar recordatorio"
              }
              iconLeft="FaPaperPlane"
              variant="outlined"
              disabled={seleccionados.size === 0 || reenviando}
              onClick={reenviar}
            />
            <TextoTenue>Marque una o varias áreas pendientes para avisarles de nuevo.</TextoTenue>
          </>
        )}
        {items.length > 0 && (
          <ButtonUI
            text={abriendoResumen ? "Abriendo…" : "Descargar resumen"}
            iconLeft="FaFilePdf"
            variant="outlined"
            disabled={abriendoResumen}
            onClick={abrirResumen}
          />
        )}
      </Acciones>

      <Tarjeta $sinRelleno>
        {items.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaClipboardCheck" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            {activaEnOtraEmpresa ? (
              <>
                <strong>Aún no aplica</strong>
                <TextoTenue>
                  El paz y salvo es de la persona, no de esta ficha: como sigue activa en otra
                  empresa del grupo, se generará cuando se le dé de baja de esa última ficha.
                </TextoTenue>
              </>
            ) : (
              <>
                <strong>Sin áreas de paz y salvo configuradas</strong>
                <TextoTenue>
                  Defina las áreas en Configuración para que empiecen a pedirse en cada salida.
                </TextoTenue>
              </>
            )}
          </Vacio>
        ) : (
          <TablaPazSalvo
            items={items}
            ocupado={ocupado}
            onResolver={setAResolver}
            seleccionados={seleccionados}
            onAlternarSeleccion={alternarSeleccion}
          />
        )}
      </Tarjeta>

      <ModalResolverPazSalvo
        abierto={aResolver !== null}
        item={aResolver}
        onCerrar={() => setAResolver(null)}
        onConfirmar={confirmarResolver}
      />

      <ModalVerActa
        abierto={urlResumen !== null}
        url={urlResumen}
        titulo="Paz y salvo — resumen de novedades"
        onCerrar={cerrarResumen}
      />
    </Contenedor>
  );
};

export default ColPazSalvo;
