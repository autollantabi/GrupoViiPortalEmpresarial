import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ObtenerCargasFamiliares } from "services/cargasFamiliaresService";
import { CampoLabel } from "./CampoLabel";
import { FiltroPastillas } from "./FiltroPastillas";
import { Acciones, AreaTexto, Aviso, FilaFormulario, TextoTenue } from "./piezas";
import { ESTADO_ENTREGA, ETIQUETA_ENTREGA } from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";
import { RUTA_BASE } from "../utils/constantes";

/**
 * Cambia el estado de un documento, y lo crea si todavía no existe.
 *
 * El mismo modal sirve para las dos cosas porque el formulario es idéntico: la
 * diferencia está solo en si el documento llegó con `id` nulo, que es lo que el
 * backend usa para distinguir "se le exige pero nadie lo ha tocado" de "ya tiene
 * fila". Duplicar el modal para eso no aportaría nada.
 *
 * Cuando el tipo es "uno por hijo" (condicion ConHijos, PARTIDA_HIJO), "De quién
 * es" deja de ser texto libre: se elige de a UNO con un desplegable armado con
 * las cargas familiares reales del colaborador (rrhh_cargas_familiares, pestaña
 * "Cargas familiares" de la ficha). Si solo tiene un hijo pendiente, queda
 * preseleccionado. Al estar creando (no editando uno que ya existe), Guardar
 * registra el documento de ese hijo y, si todavía falta el documento de otro
 * hijo ya cargado, el modal NO se cierra: queda listo para elegir ese otro
 * registro, hasta que ya ninguno quede sin su documento. Dar de alta un hijo
 * nuevo no es cosa de este modal: eso se hace en esa pestaña.
 */

const ESTADOS = [
  { valor: ESTADO_ENTREGA.ENTREGADO, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.ENTREGADO] },
  { valor: ESTADO_ENTREGA.PENDIENTE, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.PENDIENTE] },
  { valor: ESTADO_ENTREGA.NO_APLICA, etiqueta: ETIQUETA_ENTREGA[ESTADO_ENTREGA.NO_APLICA] },
];

const normalizar = (valor) => (valor ?? "").trim().toUpperCase();

export const ModalMarcarDocumento = ({
  abierto,
  documento,
  empleadoId,
  documentosDelTipo,
  onCerrar,
  onConfirmar,
}) => {
  const [estado, setEstado] = useState(ESTADO_ENTREGA.ENTREGADO);
  const [fechaEntrega, setFechaEntrega] = useState(hoyIso());
  const [etiqueta, setEtiqueta] = useState("");
  const [observacion, setObservacion] = useState("");
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const [cargas, setCargas] = useState([]);
  const [cargandoCargas, setCargandoCargas] = useState(false);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [modoLibre, setModoLibre] = useState(false);
  // Hijos para los que ya se guardó un documento EN ESTA MISMA apertura del
  // modal, antes de que la recarga del padre actualice documentosDelTipo: sin
  // esto, el desplegable seguiría ofreciendo un hijo que ya se acaba de guardar.
  const [guardadosEnSesion, setGuardadosEnSesion] = useState(new Set());

  const esNuevo = documento?.id === null || documento?.id === undefined;
  const pideEtiqueta = documento?.permiteMultiples === true;
  const usaHijos = pideEtiqueta && documento?.condicion === "ConHijos";

  useEffect(() => {
    if (!abierto || !documento) return;
    setEstado(documento.estado === ESTADO_ENTREGA.PENDIENTE ? ESTADO_ENTREGA.ENTREGADO : documento.estado);
    setFechaEntrega(documento.fechaEntrega ?? hoyIso());
    setEtiqueta(documento.etiqueta ?? "");
    setObservacion(documento.observacion ?? "");
    setErrores({});
    setEnviando(false);
    setSeleccionados(new Set());
    setModoLibre(false);
    setGuardadosEnSesion(new Set());
  }, [abierto, documento]);

  // Trae los hijos reales del colaborador solo cuando hacen falta: este tipo de
  // documento es "ConHijos" y la pantalla sigue abierta.
  useEffect(() => {
    if (!abierto || !usaHijos || !empleadoId) {
      setCargas([]);
      return undefined;
    }
    let cancelado = false;
    setCargandoCargas(true);
    ObtenerCargasFamiliares(empleadoId)
      .then((lista) => {
        if (!cancelado) setCargas(lista);
      })
      .catch(() => {
        if (!cancelado) setCargas([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoCargas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, usaHijos, empleadoId]);

  const limpiarErrorEtiqueta = () =>
    setErrores((previos) => (previos.etiqueta ? { ...previos, etiqueta: undefined } : previos));

  // Hijos que ya tienen una fila de este mismo tipo de documento: la que viene
  // del padre (documentosDelTipo, otra fila que no sea la que se está editando)
  // más los que se acaban de guardar en esta misma sesión del modal.
  const idsOcupados = new Set([
    ...cargas
      .filter((carga) =>
        (documentosDelTipo ?? [])
          .filter((fila) => fila.id !== documento?.id)
          .some((fila) => normalizar(fila.etiqueta) === normalizar(carga.nombresCompletos)),
      )
      .map((carga) => carga.id),
    ...guardadosEnSesion,
  ]);

  const pendientes = cargas.filter((carga) => !idsOcupados.has(carga.id));

  // Preselecciona según el caso: un solo hijo pendiente se marca solo; al
  // editar, intenta emparejar la etiqueta ya guardada con un hijo real.
  useEffect(() => {
    if (!abierto || !usaHijos || cargandoCargas) return;

    if (esNuevo) {
      if (pendientes.length === 1 && seleccionados.size === 0) {
        setSeleccionados(new Set([pendientes[0].id]));
        setModoLibre(false);
      }
      return;
    }

    const actual = normalizar(documento?.etiqueta);
    const coincide = cargas.find((carga) => normalizar(carga.nombresCompletos) === actual);
    if (coincide) {
      setSeleccionados(new Set([coincide.id]));
      setModoLibre(false);
    } else {
      setModoLibre(actual.length > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargas, cargandoCargas, abierto, usaHijos, esNuevo, documento?.etiqueta]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const opcionesHijos = cargas.map((carga) => ({
    value: carga.id,
    label:
      idsOcupados.has(carga.id) && !seleccionados.has(carga.id)
        ? `${carga.nombresCompletos} (ya tiene este documento)`
        : carga.nombresCompletos,
    isDisabled: idsOcupados.has(carga.id) && !seleccionados.has(carga.id),
  }));

  const elegirHijo = (opcion) => {
    setSeleccionados(new Set(opcion ? [opcion.value] : []));
    setModoLibre(false);
    limpiarErrorEtiqueta();
  };

  const entregado = estado === ESTADO_ENTREGA.ENTREGADO;

  const construirEtiquetas = () => {
    if (!pideEtiqueta) return [null];
    if (!usaHijos) return [etiqueta.trim().toUpperCase()];
    if (modoLibre) return [etiqueta.trim().toUpperCase()];
    const elegido = cargas.find((carga) => seleccionados.has(carga.id));
    return elegido ? [elegido.nombresCompletos] : [];
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nuevos = {};
    if (entregado && !fechaEntrega) nuevos.fechaEntrega = "Indique cuándo se entregó.";

    const etiquetas = construirEtiquetas();
    if (pideEtiqueta && (etiquetas.length === 0 || etiquetas.some((valor) => !valor))) {
      nuevos.etiqueta = usaHijos
        ? "Seleccione de quién es, o agregue el hijo/a si todavía no está en la lista."
        : "Este documento va uno por persona: indique de quién es.";
    }

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    const hijoGuardadoId = usaHijos && !modoLibre ? ([...seleccionados][0] ?? null) : null;
    const pendientesTrasGuardar = pendientes.filter((carga) => carga.id !== hijoGuardadoId);
    const continuar = usaHijos && esNuevo && hijoGuardadoId !== null && pendientesTrasGuardar.length > 0;

    setEnviando(true);
    try {
      const lista = etiquetas.map((valorEtiqueta) => ({
        tipoId: documento.tipoId,
        etiqueta: pideEtiqueta ? valorEtiqueta : null,
        estado,
        fechaEntrega: entregado ? fechaEntrega : null,
        observacion: observacion.trim() || null,
      }));
      await onConfirmar(lista, { finalizar: !continuar });

      if (continuar) {
        setGuardadosEnSesion((previos) => new Set([...previos, hijoGuardadoId]));
        setSeleccionados(
          pendientesTrasGuardar.length === 1 ? new Set([pendientesTrasGuardar[0].id]) : new Set(),
        );
        setEstado(ESTADO_ENTREGA.ENTREGADO);
        setFechaEntrega(hoyIso());
        setObservacion("");
        setErrores({});
        toast.info(
          pendientesTrasGuardar.length === 1
            ? `Documento guardado. Falta: ${pendientesTrasGuardar[0].nombresCompletos}.`
            : "Documento guardado. Seleccione el siguiente hijo/a.",
        );
      }
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el documento");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !documento) return null;

  const hayMasPendientesDespues =
    usaHijos && esNuevo && seleccionados.size > 0 && pendientes.length > 1;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={documento.tipoNombre}
      width="540px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {documento.descripcion && <Aviso $tono="neutro">{documento.descripcion}</Aviso>}

          {usaHijos && (
            <CampoLabel
              etiqueta="De quién es"
              requerido
              error={errores.etiqueta}
              ayuda={
                esNuevo
                  ? "Elija un hijo/a a la vez. Si falta más de uno, después de guardar se le pedirá el siguiente."
                  : "Este documento va uno por hijo. Se identifica con el nombre del hijo en la etiqueta."
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cargandoCargas && <TextoTenue>Cargando hijos…</TextoTenue>}

                {!cargandoCargas && cargas.length === 0 && (
                  <TextoTenue>
                    Este colaborador no tiene hijos registrados todavía. Regístrelos en{" "}
                    <Link to={`${RUTA_BASE}/empleados/${empleadoId}/cargas-familiares`}>
                      la pestaña Cargas familiares
                    </Link>{" "}
                    y vuelva aquí para cargar su documento.
                  </TextoTenue>
                )}

                {!cargandoCargas && cargas.length > 0 && pendientes.length === 0 && esNuevo && (
                  <TextoTenue>
                    Los {cargas.length} hijos registrados ya tienen este documento.
                  </TextoTenue>
                )}

                {!cargandoCargas && cargas.length > 0 && (pendientes.length > 0 || !esNuevo) && (
                  <SelectUI
                    options={opcionesHijos}
                    value={opcionesHijos.find((opcion) => seleccionados.has(opcion.value)) ?? null}
                    onChange={elegirHijo}
                    placeholder="Elija el hijo/a"
                    isClearable
                    minWidth="100%"
                    maxWidth="100%"
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  />
                )}

                {hayMasPendientesDespues && (
                  <TextoTenue>
                    Después de guardar, quedará{pendientes.length - 1 === 1 ? "" : "n"}{" "}
                    {pendientes.length - 1} hijo(s) más por registrar.
                  </TextoTenue>
                )}
              </div>
            </CampoLabel>
          )}

          {pideEtiqueta && !usaHijos && (
            <CampoLabel
              etiqueta="De quién es"
              requerido
              error={errores.etiqueta}
              ayuda="Este documento va uno por persona. El nombre distingue los ejemplares."
            >
              <InputUI
                value={etiqueta}
                onChange={(valor) => setEtiqueta(valor.toUpperCase())}
                maxLength={120}
                placeholder="MARIA PEREZ"
              />
            </CampoLabel>
          )}

          <FiltroPastillas
            leyenda="Estado"
            opciones={ESTADOS}
            value={estado}
            onChange={setEstado}
          />

          {entregado && (
            <FilaFormulario $min={200}>
              <CampoLabel etiqueta="Fecha de entrega" requerido error={errores.fechaEntrega}>
                <InputUI
                  type="date"
                  value={fechaEntrega ?? ""}
                  onChange={(valor) => setFechaEntrega(valor)}
                  max={hoyIso()}
                />
              </CampoLabel>
            </FilaFormulario>
          )}

          {entregado && !documento.archivo && (
            <Aviso $tono="aviso">
              Queda como entregado pero sin archivo digitalizado. Súbalo cuando lo tenga
              escaneado; mientras tanto aparecerá en el contador de pendientes por
              digitalizar.
            </Aviso>
          )}

          <CampoLabel etiqueta="Observación">
            <AreaTexto
              value={observacion}
              onChange={(evento) => setObservacion(evento.target.value)}
              maxLength={1000}
              rows={2}
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={
                enviando
                  ? "Guardando…"
                  : hayMasPendientesDespues
                    ? "Guardar y seguir"
                    : "Guardar"
              }
              iconLeft="FaFloppyDisk"
              disabled={enviando}
            />
            <ButtonUI text="Cerrar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalMarcarDocumento;
