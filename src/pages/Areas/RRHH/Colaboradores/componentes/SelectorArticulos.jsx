import React, { useMemo, useState } from "react";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ObtenerEntregaVigente, ObtenerMotivosBaja } from "services/dotacionService";
import { useConsulta } from "../hooks/useConsulta";
import { formatearFecha } from "../utils/fechas";
import { Acciones, Badge, TextoTenue } from "./piezas";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";

/**
 * Elegir artículos con casillas, agrupados por grupo, con cantidad y con el
 * flujo de reemplazo cuando el artículo ya tiene una entrega vigente.
 *
 * Reemplaza al desplegable de "agregar un artículo" de a uno. La razón es
 * aritmética: un kit de ventas son seis artículos y el catálogo tiene treinta y
 * cinco, así que armar una plantilla eran seis viajes al mismo desplegable,
 * abriéndolo y buscando cada vez. Con las casillas se ve todo el catálogo de una
 * vez y se marca lo que va.
 *
 * El buscador está porque con treinta y cinco artículos en seis grupos, "botas"
 * se encuentra más rápido escribiéndolo que recorriendo la lista.
 *
 * `elegidos` es un Map (itemId -> {cantidad, vigente, entregas, motivoBajaId,
 * reemplazaItemId}), no un Set: cada artículo marcado necesita su propia
 * cantidad, y los que ya tienen entrega vigente necesitan además el motivo de
 * la baja antes de poder agregarse. El dueño del Map es quien renderiza esto
 * (una tarjeta por asignación), así que las mutaciones viajan hacia arriba por
 * `onAlternar` / `onAlternarGrupo` / `onCambiar`.
 *
 * La consulta de "¿ya está entregado?" se hace SOLO al marcar un artículo, y se
 * cachea por item mientras el componente vive: con un catálogo de decenas de
 * artículos, consultarlo para todos de entrada sería decenas de peticiones para
 * un dato que la mayoría de las veces nadie necesita.
 */

const Caja = styled.div`
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 8px;
  max-height: 320px;
  overflow-y: auto;
`;

const Grupo = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  }
`;

/* Pegajoso para que al bajar por la lista siempre se sepa en qué grupo se está:
   sin esto, con seis grupos abiertos uno pierde la referencia. */
const CabeceraGrupo = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.primary || "#fd4703", alpha: 0.08 })};
  font-size: 12px;
  font-weight: 700;
`;

const Lista = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 4px 12px;
  padding: 8px 10px;
`;

const FilaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 3px 0;
`;

const FilaCheckboxCantidad = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CajaCantidad = styled.div`
  width: 68px;
  flex: 0 0 auto;
`;

const PanelVigente = styled.div`
  margin-left: 26px;
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.text};
  background: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.warningDark || theme?.colors?.error || "#f59e0b", alpha: 0.1 })};
  border: 1px solid ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.warningDark || theme?.colors?.error || "#f59e0b", alpha: 0.3 })};
`;

/** La entrega vigente más reciente, para citarla en el aviso y para reemplazarla. */
const entregaMasReciente = (entregas = []) => {
  if (!entregas.length) return null;
  return [...entregas].sort((a, b) =>
    String(b.fecha ?? b.fechaEntrega ?? "").localeCompare(String(a.fecha ?? a.fechaEntrega ?? "")),
  )[0];
};

export const SelectorArticulos = ({
  items,
  elegidos,
  empleadoId,
  gruposMonetarios,
  onAlternar,
  onAlternarGrupo,
  onCambiar,
}) => {
  const [busqueda, setBusqueda] = useState("");
  // Caché de la consulta "¿ya tiene entrega vigente?" por artículo, para no
  // volver a pedirla si se destilda y se vuelve a marcar el mismo artículo.
  const [vigencias, setVigencias] = useState(new Map());

  /**
   * Este mismo selector lo usa también EditorPlantillas, que define REGLAS (no
   * entregas a una persona concreta): ahí `elegidos` es un Set simple, no hay
   * `empleadoId` ni `onCambiar`, y no tiene sentido preguntar "¿ya está
   * entregado?" porque no hay a quién. Todo lo de cantidad-inline y
   * vigencia/reemplazo se activa SOLO cuando el dueño pasa un Map (el caso de
   * ColDotacion); con un Set, el selector se comporta exactamente como antes.
   */
  const esModoAsignacion = elegidos instanceof Map;

  // Catálogo chico (motivos de baja activos), y solo si hace falta: en el modo
  // "plantilla" (Set) nunca se muestra el panel que lo usa, así que pedirlo
  // ahí sería una petición de red sin ningún uso.
  const { datos: motivos } = useConsulta(
    ({ signal }) =>
      esModoAsignacion ? ObtenerMotivosBaja({ soloActivos: true, signal }) : Promise.resolve([]),
    [esModoAsignacion],
  );
  const opcionesMotivos = (motivos ?? []).map((motivo) => ({
    value: motivo.id,
    label: motivo.nombre,
  }));

  const grupos = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const visibles = (items ?? []).filter(
      (item) =>
        termino.length === 0 ||
        item.nombre.toLowerCase().includes(termino) ||
        item.grupoNombre.toLowerCase().includes(termino),
    );

    // Map preserva el orden de inserción, y los artículos ya vienen ordenados
    // por grupo desde el API, así que el agrupado sale en el orden correcto sin
    // volver a ordenar nada.
    const porGrupo = new Map();

    visibles.forEach((item) => {
      const lista = porGrupo.get(item.grupoNombre) ?? [];
      lista.push(item);
      porGrupo.set(item.grupoNombre, lista);
    });

    return [...porGrupo.entries()];
  }, [items, busqueda]);

  const total = (items ?? []).length;

  const verificarVigente = async (item) => {
    if (!esModoAsignacion || !empleadoId) return;

    const cacheado = vigencias.get(item.id);
    if (cacheado && !cacheado.cargando) {
      onCambiar(item, { vigente: cacheado.vigente, entregas: cacheado.entregas });
      return;
    }

    setVigencias((previo) => new Map(previo).set(item.id, { cargando: true }));
    try {
      const resultado = await ObtenerEntregaVigente(empleadoId, item.id);
      setVigencias((previo) => new Map(previo).set(item.id, { cargando: false, ...resultado }));
      onCambiar(item, { vigente: resultado.vigente, entregas: resultado.entregas });
    } catch (e) {
      // Si la consulta falla no se bloquea el marcado: se deja seguir como alta
      // simple, y si en verdad ya estaba entregado el backend lo ignora sin
      // error (o lo rechaza si la dotación ya está impresa).
      setVigencias((previo) =>
        new Map(previo).set(item.id, { cargando: false, vigente: false, entregas: [] }),
      );
    }
  };

  const alternar = (item) => {
    const yaMarcado = elegidos.has(item.id);
    onAlternar(item);
    if (esModoAsignacion && !yaMarcado) verificarVigente(item);
  };

  return (
    <div>
      <Acciones style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <InputUI
            value={busqueda}
            onChange={setBusqueda}
            placeholder={`Buscar entre ${total} artículos…`}
          />
        </div>
        <Badge $tono={elegidos.size > 0 ? "exito" : "neutro"}>
          {elegidos.size} elegido(s)
        </Badge>
      </Acciones>

      <Caja>
        {grupos.length === 0 ? (
          <div style={{ padding: 12 }}>
            <TextoTenue>
              {total === 0
                ? "No hay artículos activos. Créelos en la sección Catálogo."
                : `Ningún artículo coincide con "${busqueda}".`}
            </TextoTenue>
          </div>
        ) : (
          grupos.map(([nombreGrupo, articulos]) => {
            const todosMarcados = articulos.every((item) => elegidos.has(item.id));
            const esMonetario = gruposMonetarios?.has(nombreGrupo);

            return (
              <Grupo key={nombreGrupo}>
                <CabeceraGrupo>
                  <span>
                    {nombreGrupo}
                    {esMonetario && (
                      <>
                        {" "}
                        <Badge $tono="info" title="Dotación cartera: valores en dinero">
                          $
                        </Badge>
                      </>
                    )}
                  </span>
                  <CheckboxUI
                    name={`grupo-${nombreGrupo}`}
                    checked={todosMarcados}
                    onChange={() => onAlternarGrupo(articulos, !todosMarcados)}
                    label={todosMarcados ? "quitar todos" : "todos"}
                  />
                </CabeceraGrupo>

                <Lista>
                  {articulos.map((item) => {
                    const datos = esModoAsignacion ? elegidos.get(item.id) : undefined;
                    const marcado = esModoAsignacion ? Boolean(datos) : elegidos.has(item.id);
                    const vigencia = vigencias.get(item.id);
                    const requiereMotivo = esModoAsignacion && marcado && datos.vigente;
                    const entregaElegida = requiereMotivo
                      ? entregaMasReciente(datos.entregas)
                      : null;

                    return (
                      <FilaItem
                        key={item.id}
                        style={requiereMotivo ? { gridColumn: "1 / -1" } : undefined}
                      >
                        <FilaCheckboxCantidad>
                          <CheckboxUI
                            name={`item-${item.id}`}
                            checked={marcado}
                            onChange={() => alternar(item)}
                            /* Los atributos se anuncian acá para que no sorprendan
                               después: marcar el casco obliga a elegir una talla, y
                               conviene saberlo antes de marcarlo. */
                            label={
                              item.campos?.length > 0
                                ? `${item.nombre} (pide ${item.campos
                                    .map((campo) => campo.etiqueta.toLowerCase())
                                    .join(", ")})`
                                : item.nombre
                            }
                          />
                          {esModoAsignacion && marcado && (
                            <CajaCantidad>
                              <InputUI
                                type="number"
                                min={1}
                                value={String(datos.cantidad ?? 1)}
                                onChange={(valor) =>
                                  onCambiar(item, { cantidad: Math.max(1, Number(valor) || 1) })
                                }
                                /* Sin esto, tocar el campo deja el cursor DESPUÉS del
                                   "1" que ya trae por omisión: tipear "1" encima no lo
                                   reemplaza, lo concatena a "11". Seleccionar todo al
                                   enfocar hace que cualquier dígito tipeado lo
                                   reemplace, como espera cualquiera que haya usado un
                                   campo numérico antes. */
                                onFocus={(evento) => evento.target.select()}
                              />
                            </CajaCantidad>
                          )}
                        </FilaCheckboxCantidad>

                        {esModoAsignacion && marcado && vigencia?.cargando && (
                          <TextoTenue>Verificando entregas previas…</TextoTenue>
                        )}

                        {requiereMotivo && (
                          <PanelVigente>
                            <span>
                              Ya entregado el{" "}
                              {formatearFecha(entregaElegida?.fechaEntrega ?? entregaElegida?.fecha)}{" "}
                              en la dotación #{entregaElegida?.asignacionId}. Elija el motivo de
                              la baja para reemplazarlo.
                            </span>
                            <SelectUI
                              options={opcionesMotivos}
                              value={
                                opcionesMotivos.find((opcion) => opcion.value === datos.motivoBajaId) ??
                                null
                              }
                              onChange={(opcion) =>
                                onCambiar(item, {
                                  motivoBajaId: opcion?.value ?? null,
                                  reemplazaItemId: opcion
                                    ? entregaElegida?.asignacionItemId ?? null
                                    : null,
                                })
                              }
                              placeholder="Motivo de la baja…"
                              isSearchable
                              maxWidth="100%"
                              menuPortalTarget={
                                typeof document !== "undefined" ? document.body : undefined
                              }
                            />
                            <InputUI
                              value={datos.comentarioBaja ?? ""}
                              onChange={(valor) => onCambiar(item, { comentarioBaja: valor })}
                              placeholder="Comentario (opcional): por qué se repone…"
                              maxLength={500}
                            />
                          </PanelVigente>
                        )}
                      </FilaItem>
                    );
                  })}
                </Lista>
              </Grupo>
            );
          })
        )}
      </Caja>
    </div>
  );
};

export default SelectorArticulos;
