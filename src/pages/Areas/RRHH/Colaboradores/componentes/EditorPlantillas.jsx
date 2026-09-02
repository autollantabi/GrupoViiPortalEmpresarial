import React, { useEffect, useState } from "react";
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

const ModalPlantilla = ({ abierto, plantillaId, catalogos, items, onCerrar, onGuardado }) => {
  const [nombre, setNombre] = useState("");
  const [cargoId, setCargoId] = useState(null);
  const [empresaId, setEmpresaId] = useState(null);
  const [areaId, setAreaId] = useState(null);
  const [lineaId, setLineaId] = useState(null);
  const [activa, setActiva] = useState(true);
  const [renglones, setRenglones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Se carga el detalle al abrir en modo edición: el listado no trae los
  // renglones, solo cuántos son.
  useEffect(() => {
    if (!abierto) return;

    if (plantillaId === null) {
      setNombre("");
      setCargoId(null);
      setEmpresaId(null);
      setAreaId(null);
      setLineaId(null);
      setActiva(true);
      setRenglones([]);
      return;
    }

    let cancelado = false;
    setCargando(true);

    ObtenerPlantillaDotacion(plantillaId)
      .then((plantilla) => {
        if (cancelado || !plantilla) return;
        setNombre(plantilla.nombre);
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
      .catch((e) => !cancelado && toast.error(e.message || "No se pudo cargar la plantilla"))
      .finally(() => !cancelado && setCargando(false));

    return () => {
      cancelado = true;
    };
  }, [abierto, plantillaId]);

  const opciones = (lista) => (lista ?? []).map((fila) => ({ value: fila.id, label: fila.nombre }));
  const buscar = (lista, id) => opciones(lista).find((opcion) => opcion.value === id) ?? null;

  const opcionesItems = (items ?? []).map((item) => ({
    value: item.id,
    label: `${item.grupoNombre} · ${item.nombre}`,
  }));

  const agregar = (opcion) => {
    if (!opcion) return;
    if (renglones.some((renglon) => renglon.itemId === opcion.value)) {
      toast.info("Ese artículo ya está en la plantilla.");
      return;
    }
    setRenglones([
      ...renglones,
      { itemId: opcion.value, cantidad: 1, valores: {}, excluir: false, obligatorio: true },
    ]);
  };

  const cambiar = (itemId, parche) =>
    setRenglones(
      renglones.map((renglon) => (renglon.itemId === itemId ? { ...renglon, ...parche } : renglon)),
    );

  const quitar = (itemId) => setRenglones(renglones.filter((renglon) => renglon.itemId !== itemId));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!nombre.trim()) {
      toast.error("Escriba un nombre para la plantilla.");
      return;
    }

    if (!cargoId && !empresaId && !areaId && !lineaId) {
      toast.error(
        "Elija al menos un cargo, empresa, área o línea. Una plantilla sin ámbito aplicaría a todo el grupo sin decirlo.",
      );
      return;
    }

    setEnviando(true);
    try {
      const carga = {
        nombre: nombre.trim().toUpperCase(),
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

      toast.success("Plantilla guardada.");
      onGuardado();
    } catch (e) {
      toast.error(e.message || "No se pudo guardar la plantilla");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  const porItem = new Map((items ?? []).map((item) => [item.id, item]));

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={plantillaId === null ? "Nueva plantilla" : "Editar plantilla"}
      width="820px"
      maxWidth="96vw"
      noFooter
    >
      {cargando ? (
        <LoaderUI text="Cargando la plantilla…" height="200px" />
      ) : (
        <form onSubmit={enviar} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI
                value={nombre}
                onChange={(valor) => setNombre(valor.toUpperCase())}
                maxLength={150}
                placeholder="VENDEDOR LUBRICANTES"
              />
            </CampoLabel>

            <Aviso $tono="neutro">
              Deje en blanco lo que no quiera fijar: en blanco significa{" "}
              <strong>cualquiera</strong>. Una plantilla solo con cargo es la genérica de ese
              cargo; agregarle empresa y línea la vuelve más específica y gana artículo por
              artículo sobre la genérica.
            </Aviso>

            <FilaFormulario $min={180}>
              <CampoLabel etiqueta="Cargo">
                <SelectUI
                  options={opciones(catalogos.cargos)}
                  value={buscar(catalogos.cargos, cargoId)}
                  onChange={(opcion) => setCargoId(opcion?.value ?? null)}
                  isClearable
                  isSearchable
                  placeholder="Cualquiera"
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
                  placeholder="Cualquiera"
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
                  placeholder="Cualquiera"
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
                  placeholder="Cualquiera"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
            </FilaFormulario>

            <Separador />

            <TituloTarjeta style={{ margin: 0 }}>Artículos</TituloTarjeta>

            <SelectUI
              options={opcionesItems}
              value={null}
              onChange={agregar}
              isSearchable
              maxWidth="100%"
              placeholder="Agregar un artículo…"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />

            {renglones.length === 0 ? (
              <TextoTenue>
                Sin artículos. Una plantilla vacía es válida: sirve para excluir cosas que
                otra más genérica sí entrega.
              </TextoTenue>
            ) : (
              <TablaScroll>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Artículo</Th>
                      <Th>Cantidad</Th>
                      <Th>Quitar heredado</Th>
                      <Th aria-label="Acciones" />
                    </tr>
                  </thead>
                  <tbody>
                    {renglones.map((renglon) => {
                      const item = porItem.get(renglon.itemId);

                      return (
                        <Fila key={renglon.itemId}>
                          <Td>
                            {item ? `${item.grupoNombre} · ${item.nombre}` : `Artículo ${renglon.itemId}`}
                          </Td>
                          <Td style={{ maxWidth: 130 }}>
                            <InputUI
                              type="number"
                              value={renglon.cantidad === null ? "" : String(renglon.cantidad)}
                              onChange={(valor) =>
                                cambiar(renglon.itemId, {
                                  cantidad: valor === "" ? null : Number(valor),
                                })
                              }
                              min={1}
                              disabled={renglon.excluir}
                            />
                          </Td>
                          <Td>
                            <CheckboxUI
                              name={`excluir-${renglon.itemId}`}
                              checked={renglon.excluir === true}
                              onChange={(_nombre, marcado) =>
                                cambiar(renglon.itemId, { excluir: marcado })
                              }
                              label="Excluir"
                            />
                          </Td>
                          <Td>
                            <ButtonUI
                              text=""
                              iconLeft="FaTrashCan"
                              variant="ghost"
                              title="Quitar de la plantilla"
                              onClick={() => quitar(renglon.itemId)}
                            />
                          </Td>
                        </Fila>
                      );
                    })}
                  </tbody>
                </Tabla>
              </TablaScroll>
            )}

            {renglones.some((renglon) => renglon.excluir) && (
              <Aviso $tono="aviso">
                Los artículos marcados como <strong>excluir</strong> no se entregan: quitan lo
                que traería una plantilla más genérica. No se les asigna cantidad.
              </Aviso>
            )}

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
              placeholder="Sin definir"
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
              Ninguna plantilla aplica a ese ámbito. A un colaborador así habría que armarle la
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
                    Las plantillas aplican pero no dejan ningún artículo: revise si alguna los
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

  const { datos: cargos } = useConsulta(({ signal }) => ListarCargos({ signal }), []);
  const { datos: empresas } = useConsulta(({ signal }) => ListarEmpresas({ signal }), []);
  const { datos: areas } = useConsulta(({ signal }) => ListarAreas({ signal }), []);
  const { datos: lineas } = useConsulta(({ signal }) => ListarLineas({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const catalogos = { cargos, empresas, areas, lineas };

  const borrar = async (plantilla) => {
    try {
      await EliminarPlantillaDotacion(plantilla.id);
      toast.success(`${plantilla.nombre} eliminada.`);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la plantilla");
    }
  };

  if (cargando) return <LoaderUI text="Cargando las plantillas…" height="200px" />;

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
        Las plantillas se <strong>acumulan</strong>, no se reemplazan: a cada colaborador se le
        aplican todas las que calzan, de la más genérica a la más específica, y para un mismo
        artículo gana la más específica. Para quitar algo heredado se marca como excluido.
      </Aviso>

      <Tarjeta $sinRelleno>
        <div style={{ padding: 16 }}>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Plantillas</TituloTarjeta>
            <ButtonUI
              text="Nueva plantilla"
              iconLeft="FaPlus"
              variant="outlined"
              onClick={() => setEnEdicion(null)}
            />
          </Acciones>
        </div>

        {(plantillas ?? []).length === 0 ? (
          <Vacio>
            <strong>Sin plantillas</strong>
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
                  <Th>Plantilla</Th>
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
