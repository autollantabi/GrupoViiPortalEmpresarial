import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalConfirmacionUI } from "components/UI/Components/ModalConfirmacionUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  AbrirActaAsignacion,
  AgregarItemsAsignacion,
  CrearAsignacionDotacion,
  EntregarTodoAsignacion,
  ListarGruposDotacion,
  ListarItemsDotacion,
  MarcarItemAsignacion,
  NotificarAsignacion,
  ObtenerDotacionEmpleado,
  QuitarItemAsignacion,
} from "services/dotacionService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { SelectorArticulos } from "../componentes/SelectorArticulos";
import { HistorialNotificaciones } from "../componentes/HistorialNotificaciones";
import { ModalEntregarItem } from "../componentes/ModalEntregarItem";
import { ModalNuevaComplementaria } from "../componentes/ModalNuevaComplementaria";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { SeccionCartera } from "../componentes/SeccionCartera";
import { ProgresoDotacion, TablaDotacion } from "../componentes/TablaDotacion";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  Badge,
  CirculoIcono,
  Contenedor,
  Separador,
  Tarjeta,
  TextoTenue,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";
import {
  ETIQUETA_ASIGNACION,
  ORIGEN_ASIGNACION,
  TIPO_ASIGNACION,
  TONO_ASIGNACION,
} from "../utils/constantesDotacion";
import { formatearFecha, hoyIso } from "../utils/fechas";

/**
 * Pestaña Dotación de una ficha.
 *
 * Muestra la dotación inicial y las complementarias, permite marcar entregas,
 * agregar artículos a mano y reenviar los avisos a los jefes de área.
 *
 * Los `avisos` que trae el backend se muestran tal cual: explican lo que la
 * pantalla no puede deducir sola (que una dotación viene de la migración y por eso
 * no tiene detalle, que un grupo con pendientes no tiene a quién notificar).
 */
export const ColDotacion = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [ocupado, setOcupado] = useState(false);
  const [itemEnEdicion, setItemEnEdicion] = useState(null);
  const [asignacionEnEdicion, setAsignacionEnEdicion] = useState(null);
  const [nuevaComplementariaAbierta, setNuevaComplementariaAbierta] = useState(false);
  /** Id de la asignación para la que se está confirmando "Generar e imprimir acta". */
  const [confirmarActaId, setConfirmarActaId] = useState(null);
  /**
   * Los artículos marcados, POR ASIGNACIÓN.
   *
   * Antes era un solo estado compartido, y las tarjetas de asignación se
   * dibujan en un map: con una inicial y una complementaria, lo que se elegía
   * en una aparecía marcado en la otra y los dos botones quedaban habilitados.
   * La clave externa es el id de la asignación.
   *
   * El valor ya no es un Set de ids: es un Map itemId -> {cantidad, vigente,
   * entregas, motivoBajaId, reemplazaItemId}. Cada artículo marcado necesita su
   * propia cantidad, y los que ya tienen una entrega vigente (SelectorArticulos
   * lo averigua al marcarlos) necesitan además el motivo de la baja antes de
   * poder agregarse: por eso viaja todo junto en la misma entrada.
   */
  const [elegidosPorAsignacion, setElegidosPorAsignacion] = useState({});

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: dotacion,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerDotacionEmpleado(id, { signal }), [id]);

  // El catálogo se carga una vez para poder agregar artículos a mano y para
  // conocer los `campos` de cada uno al marcar la entrega.
  const { datos: catalogo } = useConsulta(
    ({ signal }) => ListarItemsDotacion({ soloActivos: true, signal }),
    [],
  );

  // Los grupos del catálogo, solo para saber cuáles son "cartera" (esMonetario)
  // y pintarles un distintivo. Es una consulta chica y ya cacheada por
  // useConsulta, así que no vale la pena duplicar ese dato dentro de cada
  // artículo del catálogo.
  const { datos: gruposCatalogo } = useConsulta(
    ({ signal }) => ListarGruposDotacion({ signal }),
    [],
  );
  const gruposMonetarios = new Set(
    (gruposCatalogo ?? []).filter((grupo) => grupo.esMonetario).map((grupo) => grupo.nombre),
  );

  const camposDelItem = (item) =>
    (catalogo ?? []).find((fila) => fila.id === item?.itemId)?.campos ?? [];

  /** Envuelve una acción: bloquea la pantalla, avisa y recarga. */
  const ejecutar = async (accion, exito) => {
    setOcupado(true);
    try {
      await accion();
      if (exito) toast.success(exito);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo completar la acción");
    } finally {
      setOcupado(false);
    }
  };

  const generarInicial = () =>
    ejecutar(async () => {
      const { mensaje } = await CrearAsignacionDotacion(id, {
        tipo: TIPO_ASIGNACION.INICIAL,
        fecha: ficha?.fechaIngreso ?? hoyIso(),
        desdePlantilla: true,
      });
      // El backend responde 201 incluso si ninguna plantilla aplicaba, y el
      // mensaje lo explica. Se muestra el suyo en vez de uno inventado.
      toast.info(mensaje || "Dotación generada.");
    });

  const confirmarNuevaComplementaria = async (datos) => {
    await CrearAsignacionDotacion(id, {
      tipo: TIPO_ASIGNACION.COMPLEMENTARIA,
      desdePlantilla: false,
      ...datos,
    });
    setNuevaComplementariaAbierta(false);
    toast.success("Dotación complementaria creada. Agréguele los artículos.");
    recargar();
  };

  const confirmarMarcado = async (carga) => {
    await MarcarItemAsignacion(asignacionEnEdicion, itemEnEdicion.id, carga);
    setItemEnEdicion(null);
    toast.success("Artículo actualizado.");
    recargar();
  };

  const quitar = (asignacionId, item) =>
    ejecutar(
      () => QuitarItemAsignacion(asignacionId, item.id),
      `${item.itemNombre} se quitó de la dotación.`,
    );

  const entregarTodo = (asignacionId) =>
    ejecutar(
      () => EntregarTodoAsignacion(asignacionId, { fechaEntrega: hoyIso() }),
      "Todo lo pendiente quedó como entregado.",
    );

  const notificar = (asignacionId, forzar) =>
    ejecutar(async () => {
      const { mensaje } = await NotificarAsignacion(asignacionId, { forzar });
      // El endpoint responde 200 aunque algún envío falle, y el mensaje resume
      // cuántos salieron y cuántos no. Se muestra tal cual.
      toast.info(mensaje || "Avisos procesados.");
    });

  const elegidosDe = (asignacionId) =>
    elegidosPorAsignacion[asignacionId] ?? new Map();

  /** La entrada por omisión de un artículo recién marcado: aún no se sabe si está vigente. */
  const entradaPorOmision = () => ({
    cantidad: 1,
    vigente: false,
    entregas: [],
    motivoBajaId: null,
    reemplazaItemId: null,
  });

  const alternarItem = (asignacionId, item) =>
    setElegidosPorAsignacion((previo) => {
      const actuales = new Map(previo[asignacionId] ?? []);
      if (actuales.has(item.id)) actuales.delete(item.id);
      else actuales.set(item.id, entradaPorOmision());
      return { ...previo, [asignacionId]: actuales };
    });

  /** Marca o desmarca todo un grupo de una vez. */
  const alternarGrupo = (asignacionId, articulos, marcar) =>
    setElegidosPorAsignacion((previo) => {
      const actuales = new Map(previo[asignacionId] ?? []);
      articulos.forEach((item) => {
        if (marcar) {
          if (!actuales.has(item.id)) actuales.set(item.id, entradaPorOmision());
        } else {
          actuales.delete(item.id);
        }
      });
      return { ...previo, [asignacionId]: actuales };
    });

  /** Cambios de campo sobre un artículo ya marcado: cantidad, vigencia o motivo de baja. */
  const cambiarSeleccion = (asignacionId, item, parcial) =>
    setElegidosPorAsignacion((previo) => {
      const actuales = new Map(previo[asignacionId] ?? []);
      if (!actuales.has(item.id)) return previo;
      actuales.set(item.id, { ...actuales.get(item.id), ...parcial });
      return { ...previo, [asignacionId]: actuales };
    });

  const agregar = (asignacionId) => {
    const mapa = elegidosDe(asignacionId);
    if (mapa.size === 0) return;

    // Un artículo con entrega vigente necesita el motivo de la baja antes de
    // poder mandarse: sin eso no hay reemplazaItemId, y el backend lo tomaría
    // como una alta simple de algo que ya estaba (que se ignora en silencio, sin
    // avisar que faltó elegir el motivo).
    const sinMotivo = [...mapa.values()].some((datos) => datos.vigente && !datos.motivoBajaId);
    if (sinMotivo) {
      toast.error("Elija el motivo de baja de los artículos que ya tienen una entrega vigente.");
      return;
    }

    const items = [...mapa.entries()].map(([itemId, datos]) => ({
      itemId,
      cantidad: datos.cantidad,
      ...(datos.reemplazaItemId
        ? { reemplazaItemId: datos.reemplazaItemId, motivoBajaId: datos.motivoBajaId }
        : {}),
    }));

    ejecutar(
      () => AgregarItemsAsignacion(asignacionId, items),
      `${items.length} artículo(s) agregado(s).`,
    ).then(() =>
      // Se limpia solo la de esta asignación: si había algo marcado en otra
      // tarjeta, no tiene por qué perderse.
      setElegidosPorAsignacion((previo) => ({ ...previo, [asignacionId]: new Map() })),
    );
  };

  const abrirActa = (asignacionId) => ejecutar(() => AbrirActaAsignacion(asignacionId));

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando la dotación…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !dotacion) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar la dotación</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const pendientes = dotacion.asignaciones.reduce((total, fila) => total + fila.pendientes, 0);
  const tieneInicial = dotacion.asignaciones.some((fila) => fila.tipo === TIPO_ASIGNACION.INICIAL);

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha}>
        {!tieneInicial && (
          <ButtonUI
            text="Generar dotación inicial"
            iconLeft="FaWandMagicSparkles"
            disabled={ocupado}
            onClick={generarInicial}
          />
        )}
        <ButtonUI
          text="Nueva complementaria"
          iconLeft="FaPlus"
          variant="outlined"
          disabled={ocupado}
          onClick={() => setNuevaComplementariaAbierta(true)}
        />
      </CabeceraFicha>

      <PestanasFicha id={id} pendientesDotacion={pendientes} />

      {dotacion.avisos.map((aviso) => (
        <Aviso key={aviso} $tono="aviso">
          {aviso}
        </Aviso>
      ))}

      {dotacion.asignaciones.length === 0 ? (
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaBoxOpen" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin dotación registrada</strong>
            <TextoTenue>
              Genérela desde la plantilla que le corresponda por su cargo, empresa, área y
              línea, o cree una complementaria y agregue los artículos a mano.
            </TextoTenue>
          </Vacio>
        </Tarjeta>
      ) : (
        dotacion.asignaciones.map((asignacion) => (
          <Tarjeta key={asignacion.id} $sinRelleno>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Acciones style={{ justifyContent: "space-between" }}>
                <div>
                  <TituloTarjeta style={{ margin: 0 }}>
                    {asignacion.tipo === TIPO_ASIGNACION.INICIAL
                      ? "Dotación inicial"
                      : "Dotación complementaria"}{" "}
                    <Badge $tono={TONO_ASIGNACION[asignacion.estado] ?? "neutro"}>
                      {ETIQUETA_ASIGNACION[asignacion.estado] ?? asignacion.estado}
                    </Badge>
                    {asignacion.origen === ORIGEN_ASIGNACION.HISTORICO && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Histórico</Badge>
                      </>
                    )}
                  </TituloTarjeta>
                  <TextoTenue>
                    {formatearFecha(asignacion.fecha)}
                    {asignacion.motivo ? ` · ${asignacion.motivo}` : ""}
                    {asignacion.plantillasAplicadas.length > 0 &&
                      ` · desde ${asignacion.plantillasAplicadas.map((p) => p.nombre).join(", ")}`}
                  </TextoTenue>
                </div>

                <Acciones>
                  {asignacion.pendientes > 0 && (
                    <>
                      <ButtonUI
                        text="Avisar a los jefes"
                        iconLeft="FaPaperPlane"
                        variant="outlined"
                        disabled={ocupado}
                        onClick={() => notificar(asignacion.id, false)}
                      />
                      <ButtonUI
                        text="Reenviar"
                        iconLeft="FaRotateRight"
                        variant="ghost"
                        title="Reenvía incluso los avisos que ya salieron"
                        disabled={ocupado}
                        onClick={() => notificar(asignacion.id, true)}
                      />
                      <ButtonUI
                        text="Entregar todo"
                        iconLeft="FaCheckDouble"
                        variant="outlined"
                        disabled={ocupado}
                        onClick={() => entregarTodo(asignacion.id)}
                      />
                    </>
                  )}

                  {/* El acta bloquea la edición al generarse (salvo reemplazos), así
                      que solo se ofrece "Generar e imprimir acta" cuando ya no hay
                      nada pendiente: es la manera de asegurarse de que el PDF
                      refleje una dotación resuelta y no una a medio entregar. */}
                  {!asignacion.impresa && asignacion.pendientes === 0 && (
                    <ButtonUI
                      text="Generar e imprimir acta"
                      iconLeft="FaFileInvoice"
                      variant="outlined"
                      disabled={ocupado}
                      onClick={() => setConfirmarActaId(asignacion.id)}
                    />
                  )}
                  {!asignacion.impresa && asignacion.pendientes > 0 && (
                    <ButtonUI
                      text="Generar e imprimir acta"
                      iconLeft="FaFileInvoice"
                      variant="outlined"
                      disabled
                      title="Resuelva los artículos pendientes antes de generar el acta"
                    />
                  )}
                  {asignacion.impresa && (
                    <>
                      <Badge $tono="info">
                        Acta impresa · {formatearFecha(asignacion.fechaImpresion)}
                      </Badge>
                      <ButtonUI
                        text="Ver acta"
                        iconLeft="FaFileInvoice"
                        variant="ghost"
                        disabled={ocupado}
                        onClick={() => abrirActa(asignacion.id)}
                      />
                    </>
                  )}
                </Acciones>
              </Acciones>

              <ProgresoDotacion asignacion={asignacion} />

              {asignacion.observacion && <TextoTenue>{asignacion.observacion}</TextoTenue>}
            </div>

            {asignacion.totalItems === 0 ? (
              <div style={{ padding: "0 16px 16px" }}>
                <Aviso $tono="neutro">
                  Esta dotación no tiene artículos detallados. Agréguelos abajo si necesita
                  dejar constancia de qué se entregó.
                </Aviso>
              </div>
            ) : (
              <TablaDotacion
                asignacion={asignacion}
                ocupado={ocupado}
                bloqueado={asignacion.impresa}
                gruposMonetarios={gruposMonetarios}
                onMarcar={(item) => {
                  setAsignacionEnEdicion(asignacion.id);
                  setItemEnEdicion(item);
                }}
                onQuitar={(item) => quitar(asignacion.id, item)}
              />
            )}

            <Separador />

            {/* Casillas y no un desplegable de uno en uno: marcar el grupo
                completo con una casilla y destildar lo que no corresponda es
                un gesto, y antes eran tantos viajes al desplegable como
                artículos tuviera el grupo. */}
            <div style={{ padding: 16 }}>
              <TituloTarjeta style={{ margin: "0 0 8px" }}>Agregar artículos</TituloTarjeta>

              {asignacion.impresa && (
                <Aviso $tono="neutro" style={{ marginBottom: 8 }}>
                  Esta dotación ya tiene el acta impresa. Solo se puede agregar un artículo
                  aquí como <strong>reemplazo</strong> de uno ya entregado: márquelo, la
                  pantalla avisará que ya está entregado y pedirá el motivo de la baja.
                </Aviso>
              )}

              <SelectorArticulos
                items={catalogo}
                elegidos={elegidosDe(asignacion.id)}
                empleadoId={id}
                gruposMonetarios={gruposMonetarios}
                onAlternar={(item) => alternarItem(asignacion.id, item)}
                onAlternarGrupo={(articulos, marcar) =>
                  alternarGrupo(asignacion.id, articulos, marcar)
                }
                onCambiar={(item, parcial) => cambiarSeleccion(asignacion.id, item, parcial)}
              />

              <div style={{ height: 10 }} />

              <Acciones style={{ justifyContent: "flex-end" }}>
                <ButtonUI
                  text={
                    elegidosDe(asignacion.id).size === 0
                      ? "Agregar"
                      : `Agregar ${elegidosDe(asignacion.id).size}`
                  }
                  iconLeft="FaPlus"
                  variant="outlined"
                  disabled={ocupado || elegidosDe(asignacion.id).size === 0}
                  onClick={() => agregar(asignacion.id)}
                />
              </Acciones>
            </div>
          </Tarjeta>
        ))
      )}

      {/* No se muestra en absoluto si el empleado no tiene ningún crédito de
          cartera: la sección misma decide eso, para no tener que resolver acá
          "¿tiene dotación monetaria?" con una consulta aparte. */}
      <SeccionCartera empleadoId={id} />

      {dotacion.asignaciones.length > 0 && (
        <HistorialNotificaciones notificaciones={dotacion.notificaciones} />
      )}

      <ModalEntregarItem
        abierto={itemEnEdicion !== null}
        item={itemEnEdicion}
        campos={camposDelItem(itemEnEdicion)}
        onCerrar={() => setItemEnEdicion(null)}
        onConfirmar={confirmarMarcado}
      />

      <ModalNuevaComplementaria
        abierto={nuevaComplementariaAbierta}
        onCerrar={() => setNuevaComplementariaAbierta(false)}
        onConfirmar={confirmarNuevaComplementaria}
      />

      <ModalConfirmacionUI
        isOpen={confirmarActaId !== null}
        onClose={() => setConfirmarActaId(null)}
        onConfirm={() => {
          const asignacionId = confirmarActaId;
          setConfirmarActaId(null);
          abrirActa(asignacionId);
        }}
        title="Generar e imprimir acta"
        message="Se genera el PDF del acta de entrega y queda archivada: desde ese momento la dotación no se puede seguir editando, salvo para reemplazar un artículo ya entregado. ¿Continuar?"
        confirmText="Generar acta"
        cancelText="Cancelar"
        iconName="FaFileInvoice"
      />
    </Contenedor>
  );
};

export default ColDotacion;
