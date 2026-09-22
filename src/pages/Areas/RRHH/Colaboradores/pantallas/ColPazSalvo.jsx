import React, { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import {
  ObtenerColaborador,
  ObtenerPazSalvoEmpleado,
  ResolverPazSalvoItem,
} from "services/colaboradoresService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaPazSalvo } from "../componentes/TablaPazSalvo";
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

/** Confirmación simple: solo pide una observación opcional. */
const ModalResolverPazSalvo = ({ abierto, item, onCerrar, onConfirmar }) => {
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      await onConfirmar({ observacion: observacion.trim() || null });
      setObservacion("");
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
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
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

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: items,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerPazSalvoEmpleado(id, { signal }), [id]);

  const confirmarResolver = async (carga) => {
    await ResolverPazSalvoItem(id, aResolver.areaConfigId, carga);
    setAResolver(null);
    toast.success(`${aResolver.areaNombre} quedó como resuelto.`);
    recargar();
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
      </Rejilla>

      <Tarjeta $sinRelleno>
        {items.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaClipboardCheck" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin áreas de paz y salvo configuradas</strong>
            <TextoTenue>
              Defina las áreas en Configuración para que empiecen a pedirse en cada baja.
            </TextoTenue>
          </Vacio>
        ) : (
          <TablaPazSalvo items={items} ocupado={ocupado} onResolver={setAResolver} />
        )}
      </Tarjeta>

      <ModalResolverPazSalvo
        abierto={aResolver !== null}
        item={aResolver}
        onCerrar={() => setAResolver(null)}
        onConfirmar={confirmarResolver}
      />
    </Contenedor>
  );
};

export default ColPazSalvo;
