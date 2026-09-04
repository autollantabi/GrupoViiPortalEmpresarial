import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import {
  ListarAreas,
  ListarCargos,
  ListarEmpresas,
  ListarLineas,
} from "services/colaboradoresService";
import {
  ActualizarPlantillaDotacion,
  CrearPlantillaDotacion,
  EliminarPlantillaDotacion,
  ListarItemsDotacion,
  ListarPlantillasDotacion,
  ObtenerPlantillaDotacion,
  ResolverPlantillasDotacion,
} from "services/dotacionService";
import { CampoLabel } from "./CampoLabel";
import { CamposDinamicos } from "./CamposDinamicos";
import { SelectorArticulos } from "./SelectorArticulos";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  Badge,
  Fila,
  FilaFormulario,
  Separador,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
  Vacio,
} from "./piezas";
import { describirValores } from "../utils/constantesDotacion";

/**
 * Plantillas de dotación: qué recibe cada cargo.
 *
 * ── LO QUE HAY QUE ENTENDER PARA USAR ESTA PANTALLA ─────────────────────────
 * Las plantillas NO se reemplazan entre sí, se ACUMULAN. A un colaborador se le
 * aplican todas las que calzan con su cargo, empresa, área y línea, de la más
 * genérica a la más específica, y para un mismo artículo gana la más específica.
 *
 * Eso permite tener una plantilla "todos en la empresa" con reglamento, agenda y
 * esfero, y otra de "vendedor de lubricantes" que solo agrega el kit de ventas sin
 * repetir la base. Para QUITAR algo heredado se marca el artículo como excluido.
 *
 * La vista previa usa el MISMO endpoint que el alta de una ficha, así que lo que
 * se ve acá es exactamente lo que se va a asignar.
 */

const ambitoLegible = (plantilla) => {
  const partes = [
    plantilla.cargo && `cargo ${plantilla.cargo}`,
    plantilla.empresa && plantilla.empresa,
    plantilla.area && `área ${plantilla.area}`,
    plantilla.linea && `línea ${plantilla.linea}`,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : "sin ámbito";
};

/**
 * Alta y edición de una plantilla.
 *
 * ── POR QUÉ ESTÁ ARMADO EN TRES PASOS ─────────────────────────────────────
 * La versión anterior pedía las cosas en el orden en que están en la base:
 * nombre, ámbito, artículos. Eso obligaba a escribir a mano un nombre que
 * describe el ámbito que todavía no se había elegido, y a agregar los artículos
 * de a uno por un desplegable.
 *
 * Acá el orden es el de las preguntas que uno se hace: para quién es, qué ya
 * recibiría por otras plantillas, y qué agrega esta. Con eso:
 *
 *  - el nombre se propone solo desde el ámbito y queda editable, así que no hay
 *    que escribir dos veces lo mismo ni puede contradecirse;
 *  - los artículos se marcan con casillas sobre todo el catálogo a la vez;
 *  - y "excluir" deja de ser un misterio: solo aparece sobre lo HEREDADO, que
 *    es lo único que se puede quitar. Antes se ofrecía en cualquier renglón, y
 *    excluir algo que nadie entrega no hace nada.
 */
const ModalPlantilla = ({ abierto, plantillaId, catalogos, items, onCerrar, onGuardado }) => {
  const [nombre, setNombre] = useState("");
  const [nombreTocado, setNombreTocado] = useState(false);
  const [nombreOriginal, setNombreOriginal] = useState("");
  const [cargoId, setCargoId] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [areaId, setAreaId] = useState(null);
  const [lineaId, setLineaId] = useState(null);
  const [activa, setActiva] = useState(true);
  const [renglones, setRenglones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [heredado, setHeredado] = useState(null);

  const hayAmbito = Boolean(cargoId || empresaId || areaId || lineaId);

  // Se carga el detalle al abrir en modo edición: el listado no trae los
  // renglones, solo cuántos son.
  useEffect(() => {
    if (!abierto) return;

    if (plantillaId === null) {
      setNombre("");
      setNombreTocado(false);
      setNombreOriginal("");
      setCargoId(null);
      setEmpresaId(null);
      setAreaId(null);
      setLineaId(null);
      setActiva(true);
      setRenglones([]);
      setHeredado(null);
      return;
    }

    let cancelado = false;
    setCargando(true);

    ObtenerPlantillaDotacion(plantillaId)
      .then((plantilla) => {
        if (cancelado || !plantilla) return;
        setNombre(plantilla.nombre);
        // Editando, el nombre ya lo escribió alguien: no se toca.
        setNombreTocado(true);
        setNombreOriginal(plantilla.nombre);
        setCargoId(plantilla.cargoId);
        setEmpresaId(plantilla.empresaId);
        setAreaId(plantilla.areaId);
        setLineaId(plantilla.lineaId);
        setActiva(plantilla.activa);
        setRenglones(
          plantilla.items.map((renglon) => ({
            itemId: renglon.itemId,
            cantidad: renglon.cantidad,
            valores: renglon.valores ?? {},
            excluir: renglon.excluir,
            obligatorio: renglon.obligatorio,
          })),
        );
      })
      .catch((e) => !cancelado && toast.error(e.message || "No se pudo cargar la regla"))
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [abierto, plantillaId]);

  /**
   * Qué recibiría alguien con este ámbito por las OTRAS plantillas.
   *
   * Es el dato que faltaba para poder decidir: sin él uno agrega artículos que
   * ya venían heredados, y la resolución final los cuenta una sola vez pero la
   * plantilla queda llena de renglones que no aportan nada.
   *
   * Editando se descuenta la propia plantilla, o se vería a sí misma como
   * herencia. Se compara por el nombre con el que vino del API y no por el del
   * formulario, que se puede estar editando en este momento.
   */
  useEffect(() => {
    if (!abierto || !hayAmbito) {
      setHeredado(null);
      return;
    }

    let cancelado = false;

    ResolverPlantillasDotacion({ cargoId, empresaId, areaId, lineaId })
      .then((resolucion) => {
        if (cancelado) return;

        setHeredado(
          (resolucion?.items ?? []).filter(
            (item) => item.desdePlantilla !== nombreOriginal,
          ),
        );
      })
      .catch(() => !cancelado && setHeredado(null));

    return () => {
      cancelado = true;
    };
  }, [abierto, hayAmbito, cargoId, empresaId, areaId, lineaId, nombreOriginal]);

  const opciones = (lista) => (lista ?? []).map((fila) => ({ value: fila.id, label: fila.nombre }));
  const buscar = (lista, id) => opciones(lista).find((opcion) => opcion.value === id) ?? null;

  const porItem = useMemo(
    () => new Map((items ?? []).map((item) => [item.id, item])),
    [items],
  );

  /**
   * El nombre que se propone desde el ámbito.
   *
   * Se recalcula mientras nadie lo haya escrito a mano. En cuanto alguien
   * escribe, deja de proponerse: sobrescribir lo que la persona tecleó porque
   * cambió un select es la clase de cosa que hace desconfiar de un formulario.
   */
  const nombreSugerido = useMemo(() => {
    const partes = [
      buscar(catalogos.cargos, cargoId)?.label,
      buscar(catalogos.empresas, empresaId)?.label,
      buscar(catalogos.areas, areaId)?.label,
      buscar(catalogos.lineas, lineaId)?.label,
    ].filter(Boolean);

    return partes.join(" · ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogos, cargoId, empresaId, areaId, lineaId]);

  const nombreEfectivo = nombreTocado ? nombre : nombreSugerido;

  // Los que ESTA plantilla entrega, separados de los que quita.
  const entregados = renglones.filter((renglon) => !renglon.excluir);
  const excluidos = renglones.filter((renglon) => renglon.excluir);
  const elegidos = new Set(entregados.map((renglon) => renglon.itemId));

  const alternar = (item) =>
    setRenglones((previo) =>
      previo.some((renglon) => renglon.itemId === item.id && !renglon.excluir)
        ? previo.filter((renglon) => !(renglon.itemId === item.id && !renglon.excluir))
        : [
            ...previo,
            { itemId: item.id, cantidad: 1, valores: {}, excluir: false, obligatorio: true },
          ],
    );

  const alternarGrupo = (articulos, marcar) =>
    setRenglones((previo) => {
      const ids = new Set(articulos.map((item) => item.id));
      const resto = previo.filter((renglon) => !(ids.has(renglon.itemId) && !renglon.excluir));

      if (!marcar) return resto;

      const yaExcluidos = new Set(
        previo.filter((renglon) => renglon.excluir).map((renglon) => renglon.itemId),
      );

      return [
        ...resto,
        ...articulos
          .filter((item) => !yaExcluidos.has(item.id))
          .map((item) => ({
            itemId: item.id,
            cantidad: 1,
            valores: {},
            excluir: false,
            obligatorio: true,
          })),
      ];
    });

  const cambiar = (itemId, parche) =>
    setRenglones((previo) =>
      previo.map((renglon) =>
        renglon.itemId === itemId && !renglon.excluir ? { ...renglon, ...parche } : renglon,
      ),
    );

  /** Quita o devuelve un artículo heredado. Es el único uso real de `excluir`. */
  const alternarExclusion = (itemId) =>
    setRenglones((previo) =>
      previo.some((renglon) => renglon.itemId === itemId && renglon.excluir)
        ? previo.filter((renglon) => !(renglon.itemId === itemId && renglon.excluir))
        : [
            ...previo.filter((renglon) => renglon.itemId !== itemId),
            { itemId, cantidad: null, valores: {}, excluir: true, obligatorio: true },
          ],
    );

  // OJO: este bloque tiene un useMemo, asi que va ARRIBA del
  // "if (!abierto) return null" de mas abajo. Con el retorno en medio, el
  // modal cerrado ejecutaba menos hooks que el abierto y React abortaba con
  // "Rendered more hooks than during the previous render" al abrirlo.
  const idsExcluidos = new Set(excluidos.map((renglon) => renglon.itemId));

  /**
   * La tabla de "lo que ya recibiría", en UNA lista sin repetidos.
   *
   * Un artículo heredado que además está quitado pertenece a los dos conjuntos
   * —sigue siendo herencia, y hay un renglón `excluir` para él—, así que
   * concatenar las dos listas lo mostraba dos veces con la misma clave. Se
   * arma una sola lista indexada por itemId: la herencia manda para los datos
   * (trae cantidad y de qué plantilla viene) y el estado quitado se pinta
   * aparte con idsExcluidos.
   */
  const filasHeredadas = useMemo(() => {
    const porId = new Map();

    (heredado ?? [])
      .filter((item) => !elegidos.has(item.itemId))
      .forEach((item) => porId.set(item.itemId, item));

    // Un artículo quitado que la herencia ya no trae —porque cambió otra
    // plantilla— seguiría teniendo su renglón `excluir`. Se muestra igual para
    // que se pueda devolver, en vez de quedar invisible y sin forma de deshacerlo.
    excluidos.forEach((renglon) => {
      if (porId.has(renglon.itemId)) return;

      const item = porItem.get(renglon.itemId);

      porId.set(renglon.itemId, {
        itemId: renglon.itemId,
        itemNombre: item?.nombre ?? `Artículo ${renglon.itemId}`,
        grupoNombre: item?.grupoNombre ?? "",
        cantidad: null,
        desdePlantilla: "ya no se hereda",
      });
    });

    return [...porId.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heredado, renglones, porItem]);

  // Cuántos artículos recibiría de verdad alguien con este ámbito, ya contando
  // lo heredado, lo que agrega esta plantilla y lo que quita.
  const totalFinal =
    entregados.length +
    filasHeredadas.filter((item) => !idsExcluidos.has(item.itemId)).length;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nombreFinal = nombreEfectivo.trim();

    if (!nombreFinal) {
      toast.error("Escriba un nombre para la regla, o elija un ámbito para que se proponga.");
      return;
    }

    if (!hayAmbito) {
      toast.error(
        "Elija al menos un cargo, empresa, área o línea. Una regla sin ámbito aplicaría a todo el grupo sin decirlo.",
      );
      return;
    }

    // Los atributos requeridos se comprueban acá para poder señalar CUÁL falta.
    // El API los valida igual, pero su mensaje llega después de un viaje y sin
    // el contexto de la pantalla.
    for (const renglon of entregados) {
      const item = porItem.get(renglon.itemId);
      const faltante = (item?.campos ?? []).find(
        (campo) => campo.requerido && !String(renglon.valores?.[campo.clave] ?? "").trim(),
      );

      if (faltante) {
        toast.error(`Falta ${faltante.etiqueta.toLowerCase()} en ${item.nombre}.`);
        return;
      }
    }

    setEnviando(true);
    try {
      const carga = {
        nombre: nombreFinal.toUpperCase(),
        cargoId,
        empresaId,
        areaId,
        lineaId,
        activa,
        items: renglones.map((renglon, indice) => ({ ...renglon, orden: indice })),
      };

      await (plantillaId === null
        ? CrearPlantillaDotacion(carga)
        : ActualizarPlantillaDotacion(plantillaId, carga));

      toast.success("Regla guardada.");
      onGuardado();
    } catch (e) {
      toast.error(e.message || "No se pudo guardar la regla");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;


  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={plantillaId === null ? "Nueva regla de dotación" : "Editar regla de dotación"}
      width="860px"
      maxWidth="96vw"
      noFooter
    >
      {cargando ? (
        <LoaderUI text="Cargando la regla…" height="200px" />
      ) : (
        <form onSubmit={enviar} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* ── 1. Para quién ─────────────────────────────────────────── */}
            <TituloTarjeta style={{ margin: 0 }}>1 · ¿Para quién es?</TituloTarjeta>

            <TextoTenue>
              Deje en blanco lo que no quiera fijar: en blanco significa <b>cualquiera</b>. Cuantos
              más campos llene, más específica es la regla y más manda sobre las genéricas.
            </TextoTenue>

            <FilaFormulario $min={180}>
              <CampoLabel etiqueta="Cargo">
                <SelectUI
                  options={opciones(catalogos.cargos)}
                  value={buscar(catalogos.cargos, cargoId)}
                  onChange={(opcion) => setCargoId(opcion?.value ?? null)}
                  isClearable
                  isSearchable
                  maxWidth="100%"
                  placeholder="Cualquiera"
                  noOptionsMessage={() =>
                    catalogos.cargos === null ? "Cargando cargos…" : "No hay cargos registrados"
                  }
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
              <CampoLabel etiqueta="Empresa">
                <SelectUI
                  options={opciones(catalogos.empresas)}
                  value={buscar(catalogos.empresas, empresaId)}
                  onChange={(opcion) => setEmpresaId(opcion?.value ?? null)}
                  isClearable
                  isSearchable
                  maxWidth="100%"
                  placeholder="Cualquiera"
                  noOptionsMessage={() =>
                    catalogos.empresas === null
                      ? "Cargando empresas…"
                      : "No hay empresas registradas"
                  }
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
              <CampoLabel etiqueta="Área">
                <SelectUI
                  options={opciones(catalogos.areas)}
                  value={buscar(catalogos.areas, areaId)}
                  onChange={(opcion) => setAreaId(opcion?.value ?? null)}
                  isClearable
                  isSearchable
                  maxWidth="100%"
                  placeholder="Cualquiera"
                  noOptionsMessage={() =>
                    catalogos.areas === null ? "Cargando áreas…" : "No hay áreas registradas"
                  }
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
              <CampoLabel etiqueta="Línea">
                <SelectUI
                  options={opciones(catalogos.lineas)}
                  value={buscar(catalogos.lineas, lineaId)}
                  onChange={(opcion) => setLineaId(opcion?.value ?? null)}
                  isClearable
                  isSearchable
                  maxWidth="100%"
                  placeholder="Cualquiera"
                  noOptionsMessage={() =>
                    catalogos.lineas === null
                      ? "Cargando líneas…"
                      : "No hay líneas registradas: deje el campo en blanco"
                  }
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
            </FilaFormulario>

            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI
                value={nombreEfectivo}
                onChange={(valor) => {
                  setNombreTocado(true);
                  setNombre(valor.toUpperCase());
                }}
                maxLength={150}
                placeholder="Se propone solo al elegir el ámbito"
              />
            </CampoLabel>

            {!nombreTocado && nombreSugerido ? (
              <TextoTenue>
                Nombre propuesto desde el ámbito. Escriba encima si prefiere otro.
              </TextoTenue>
            ) : null}

            <Separador />

            {/* ── 2. Lo heredado ────────────────────────────────────────── */}
            <TituloTarjeta style={{ margin: 0 }}>2 · Lo que ya recibiría</TituloTarjeta>

            {!hayAmbito ? (
              <TextoTenue>Elija un ámbito arriba para ver qué se hereda.</TextoTenue>
            ) : heredado === null ? (
              <TextoTenue>Calculando…</TextoTenue>
            ) : filasHeredadas.length === 0 ? (
              <TextoTenue>
                Nada: con este ámbito no hay otra regla que aporte artículos, así que todo lo
                que reciba sale de esta.
              </TextoTenue>
            ) : (
              <>
                <TextoTenue>
                  Otras reglas ya entregan esto. No hace falta volver a agregarlo; si a esta
                  gente NO le corresponde, quítelo.
                </TextoTenue>

                <TablaScroll>
                  <Tabla>
                    <thead>
                      <tr>
                        <Th>Artículo</Th>
                        <Th>Viene de</Th>
                        <Th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {filasHeredadas.map((item) => {
                        const quitado = idsExcluidos.has(item.itemId);

                        return (
                          <Fila key={`h-${item.itemId}`}>
                            <Td data-etiqueta="Artículo">
                              <span style={quitado ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
                                {item.grupoNombre} · {item.itemNombre}
                                {item.cantidad !== null ? ` × ${item.cantidad}` : ""}
                              </span>
                            </Td>
                            <Td data-etiqueta="Viene de">
                              <TextoTenue>{item.desdePlantilla}</TextoTenue>
                            </Td>
                            <Td data-etiqueta="Acciones">
                              <ButtonUI
                                text={quitado ? "Devolver" : "Quitar"}
                                iconLeft={quitado ? "FaRotateLeft" : "FaBan"}
                                variant="outlined"
                                onClick={() => alternarExclusion(item.itemId)}
                              />
                            </Td>
                          </Fila>
                        );
                      })}
                    </tbody>
                  </Tabla>
                </TablaScroll>
              </>
            )}

            <Separador />

            {/* ── 3. Lo que agrega ──────────────────────────────────────── */}
            <TituloTarjeta style={{ margin: 0 }}>3 · ¿Qué agrega esta regla?</TituloTarjeta>

            <SelectorArticulos
              items={items}
              elegidos={elegidos}
              onAlternar={alternar}
              onAlternarGrupo={alternarGrupo}
            />

            {entregados.length > 0 ? (
              <TablaScroll>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Artículo</Th>
                      <Th>Cantidad</Th>
                      <Th>Detalle</Th>
                      <Th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {entregados.map((renglon) => {
                      const item = porItem.get(renglon.itemId);

                      return (
                        <Fila key={renglon.itemId}>
                          <Td data-etiqueta="Artículo">
                            {item ? `${item.grupoNombre} · ${item.nombre}` : `Artículo ${renglon.itemId}`}
                          </Td>
                          <Td data-etiqueta="Cantidad" style={{ maxWidth: 120 }}>
                            <InputUI
                              type="number"
                              value={renglon.cantidad === null ? "" : String(renglon.cantidad)}
                              onChange={(valor) =>
                                cambiar(renglon.itemId, {
                                  cantidad: valor === "" ? null : Number(valor),
                                })
                              }
                              min={1}
                            />
                          </Td>
                          <Td data-etiqueta="Detalle">
                            {item?.campos?.length > 0 ? (
                              <CamposDinamicos
                                campos={item.campos}
                                valores={renglon.valores}
                                onCambiar={(valores) => cambiar(renglon.itemId, { valores })}
                              />
                            ) : (
                              <TextoTenue>—</TextoTenue>
                            )}
                          </Td>
                          <Td data-etiqueta="Acciones">
                            <ButtonUI
                              text=""
                              iconLeft="FaTrashCan"
                              variant="ghost"
                              title="Quitar de la regla"
                              onClick={() => alternar({ id: renglon.itemId })}
                            />
                          </Td>
                        </Fila>
                      );
                    })}
                  </tbody>
                </Tabla>
              </TablaScroll>
            ) : null}

            <Separador />

            <Aviso $tono={totalFinal > 0 ? "exito" : "aviso"}>
              {totalFinal > 0 ? (
                <>
                  Con este ámbito, un colaborador recibiría <b>{totalFinal} artículo(s)</b>:{" "}
                  {entregados.length} de esta regla
                  {filasHeredadas.length > 0
                    ? ` y ${filasHeredadas.filter((i) => !idsExcluidos.has(i.itemId)).length} heredado(s)`
                    : ""}
                  {excluidos.length > 0 ? `, quitando ${excluidos.length}` : ""}.
                </>
              ) : (
                <>
                  Con este ámbito no recibiría nada. Una regla vacía es válida —sirve para
                  quitar lo que otra entrega— pero si esperaba entregar algo, márquelo arriba.
                </>
              )}
            </Aviso>

            <div style={{ paddingTop: 4 }}>
              <CheckboxUI
                name="plantilla-activa"
                checked={activa}
                onChange={(_nombre, marcado) => setActiva(marcado)}
                label="Activa"
              />
            </div>

            <Acciones>
              <ButtonUI
                type="submit"
                text={enviando ? "Guardando…" : "Guardar"}
                iconLeft="FaFloppyDisk"
                disabled={enviando}
              />
              <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
            </Acciones>
          </div>
        </form>
      )}
    </ModalUI>
  );
};


/** Vista previa: qué recibiría alguien con este ámbito. */
const VistaPrevia = ({ catalogos }) => {
  const [ambito, setAmbito] = useState({});
  const [resolucion, setResolucion] = useState(null);
  const [cargando, setCargando] = useState(false);

  const opciones = (lista) => (lista ?? []).map((fila) => ({ value: fila.id, label: fila.nombre }));

  const probar = async () => {
    setCargando(true);
    try {
      setResolucion(await ResolverPlantillasDotacion(ambito));
    } catch (e) {
      toast.error(e.message || "No se pudo resolver");
    } finally {
      setCargando(false);
    }
  };

  return (
    <Tarjeta>
      <TituloTarjeta>Probar qué recibiría</TituloTarjeta>
      <TextoTenue>
        Usa el mismo cálculo que el alta de una ficha, así que lo que salga acá es exactamente
        lo que se va a asignar.
      </TextoTenue>

      <div style={{ height: 12 }} />

      <FilaFormulario $min={170}>
        {[
          ["cargoId", "Cargo", catalogos.cargos],
          ["empresaId", "Empresa", catalogos.empresas],
          ["areaId", "Área", catalogos.areas],
          ["lineaId", "Línea", catalogos.lineas],
        ].map(([clave, etiqueta, lista]) => (
          <CampoLabel key={clave} etiqueta={etiqueta}>
            <SelectUI
              options={opciones(lista)}
              value={opciones(lista).find((opcion) => opcion.value === ambito[clave]) ?? null}
              onChange={(opcion) => setAmbito({ ...ambito, [clave]: opcion?.value ?? undefined })}
              isClearable
              isSearchable
              maxWidth="100%"
              placeholder="Sin definir"
              noOptionsMessage={() => (lista === null ? "Cargando…" : "Sin registros")}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>
        ))}
      </FilaFormulario>

      <div style={{ height: 12 }} />

      <Acciones>
        <ButtonUI
          text={cargando ? "Calculando…" : "Probar"}
          iconLeft="FaMagnifyingGlass"
          variant="outlined"
          disabled={cargando}
          onClick={probar}
        />
      </Acciones>

      {resolucion && (
        <>
          <Separador />

          {resolucion.plantillasAplicadas.length === 0 ? (
            <Aviso $tono="aviso">
              Ninguna regla aplica a ese ámbito. A un colaborador así habría que armarle la
              dotación a mano.
            </Aviso>
          ) : (
            <>
              <TextoTenue>
                Se aplican, de más genérica a más específica:{" "}
                {resolucion.plantillasAplicadas.map((plantilla) => plantilla.nombre).join(" → ")}
              </TextoTenue>

              <div style={{ height: 8 }} />

              <TablaScroll>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Grupo</Th>
                      <Th>Artículo</Th>
                      <Th>Cantidad</Th>
                      <Th>Detalle</Th>
                      <Th>Viene de</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolucion.items.map((item) => (
                      <Fila key={item.itemId}>
                        <Td>{item.grupoNombre}</Td>
                        <Td>{item.itemNombre}</Td>
                        <Td>
                          {item.cantidad === null
                            ? "—"
                            : `${item.cantidad}${item.unidad ? ` ${item.unidad}` : ""}`}
                        </Td>
                        <Td>{describirValores(item.valores, item.campos) || "—"}</Td>
                        <Td>
                          <TextoTenue>{item.desdePlantilla}</TextoTenue>
                        </Td>
                      </Fila>
                    ))}
                  </tbody>
                </Tabla>
              </TablaScroll>

              {resolucion.items.length === 0 && (
                <Vacio>
                  <TextoTenue>
                    Las reglas aplican pero no dejan ningún artículo: revise si alguna los
                    está excluyendo.
                  </TextoTenue>
                </Vacio>
              )}

              {resolucion.excluidos.length > 0 && (
                <Aviso $tono="neutro">
                  Excluidos:{" "}
                  {resolucion.excluidos
                    .map((item) => `${item.itemNombre} (por ${item.porPlantilla})`)
                    .join(", ")}
                </Aviso>
              )}
            </>
          )}
        </>
      )}
    </Tarjeta>
  );
};

export const EditorPlantillas = () => {
  const { theme } = useTheme();

  const { datos: plantillas, cargando, error, recargar } = useConsulta(
    ({ signal }) => ListarPlantillasDotacion({ signal }),
    [],
  );

  const { datos: items } = useConsulta(
    ({ signal }) => ListarItemsDotacion({ soloActivos: true, signal }),
    [],
  );

  const cargos = useConsulta(({ signal }) => ListarCargos({ signal }), []);
  const empresas = useConsulta(({ signal }) => ListarEmpresas({ signal }), []);
  const areas = useConsulta(({ signal }) => ListarAreas({ signal }), []);
  const lineas = useConsulta(({ signal }) => ListarLineas({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const catalogos = {
    cargos: cargos.datos,
    empresas: empresas.datos,
    areas: areas.datos,
    lineas: lineas.datos,
  };

  // Antes estos cuatro errores se descartaban. Un catalogo que falla deja su
  // select sin opciones, que en pantalla es exactamente igual a "no hay nada
  // configurado" o a un select roto: hay que decir cual fallo y dejar
  // reintentar, o el usuario se queda mirando un desplegable vacio sin pista.
  const catalogosFallidos = [
    ["cargos", cargos],
    ["empresas", empresas],
    ["áreas", areas],
    ["líneas", lineas],
  ].filter(([, consulta]) => consulta.error);

  const borrar = async (plantilla) => {
    try {
      await EliminarPlantillaDotacion(plantilla.id);
      toast.success(`${plantilla.nombre} eliminada.`);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la regla");
    }
  };

  if (cargando) return <LoaderUI text="Cargando las reglas…" height="200px" />;

  if (error) {
    return (
      <Aviso $tono="peligro">
        {error} <ButtonUI text="Reintentar" variant="ghost" onClick={recargar} />
      </Aviso>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Aviso $tono="info">
        Las reglas se <strong>acumulan</strong>, no se reemplazan: a cada colaborador se le
        aplican todas las que calzan, de la más genérica a la más específica, y para un mismo
        artículo gana la más específica. Para quitar algo heredado se usa Quitar.
      </Aviso>

      {catalogosFallidos.length > 0 && (
        <Aviso $tono="peligro">
          No se pudo cargar {catalogosFallidos.map(([nombre]) => nombre).join(", ")}, así que
          esos selectores van a salir vacíos y no podrá fijar el ámbito.{" "}
          <ButtonUI
            text="Reintentar"
            variant="ghost"
            onClick={() => catalogosFallidos.forEach(([, consulta]) => consulta.recargar())}
          />
        </Aviso>
      )}

      <Tarjeta $sinRelleno>
        <div style={{ padding: 16 }}>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Reglas de dotación</TituloTarjeta>
            <ButtonUI
              text="Nueva regla"
              iconLeft="FaPlus"
              variant="outlined"
              onClick={() => setEnEdicion(null)}
            />
          </Acciones>
        </div>

        {(plantillas ?? []).length === 0 ? (
          <Vacio>
            <strong>Sin reglas de dotación</strong>
            <TextoTenue>
              Mientras no haya ninguna, los colaboradores nuevos nacen con la dotación vacía y
              hay que armarla a mano.
            </TextoTenue>
          </Vacio>
        ) : (
          <TablaScroll>
            <Tabla>
              <thead>
                <tr>
                  <Th>Regla</Th>
                  <Th>Ámbito</Th>
                  <Th>Artículos</Th>
                  <Th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {plantillas.map((plantilla) => (
                  <Fila key={plantilla.id}>
                    <Td>
                      {plantilla.nombre}
                      {!plantilla.activa && (
                        <>
                          {" "}
                          <Badge $tono="neutro">Inactiva</Badge>
                        </>
                      )}
                    </Td>
                    <Td>
                      {ambitoLegible(plantilla)}
                      <TextoTenue> · especificidad {plantilla.especificidad}</TextoTenue>
                    </Td>
                    <Td>{plantilla.totalItems}</Td>
                    <Td>
                      <Acciones>
                        <ButtonUI
                          text=""
                          iconLeft="FaPenToSquare"
                          variant="ghost"
                          title="Editar"
                          onClick={() => setEnEdicion(plantilla.id)}
                        />
                        <ButtonUI
                          text=""
                          iconLeft="FaTrashCan"
                          variant="ghost"
                          pcolor={theme?.colors?.error}
                          title="Eliminar"
                          onClick={() => borrar(plantilla)}
                        />
                      </Acciones>
                    </Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        )}
      </Tarjeta>

      <VistaPrevia catalogos={catalogos} />

      <ModalPlantilla
        abierto={enEdicion !== undefined}
        plantillaId={enEdicion}
        catalogos={catalogos}
        items={items}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardado={() => {
          setEnEdicion(undefined);
          recargar();
        }}
      />
    </div>
  );
};

export default EditorPlantillas;
