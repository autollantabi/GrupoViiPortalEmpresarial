import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { ListarAreas } from "services/colaboradoresService";
import {
  ActualizarGrupoDotacion,
  ActualizarItemDotacion,
  CrearGrupoDotacion,
  CrearItemDotacion,
  EliminarGrupoDotacion,
  EliminarItemDotacion,
  ListarGruposDotacion,
  ListarItemsDotacion,
} from "services/dotacionService";
import { CampoLabel } from "./CampoLabel";
import { EditorCampos, validarCampos } from "./EditorCampos";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  Badge,
  Fila,
  FilaFormulario,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
} from "./piezas";

/**
 * Catálogo de dotación: los grupos y sus artículos.
 *
 * A diferencia de los cargos, áreas y líneas —que crecen "al paso" cuando alguien
 * escribe un nombre nuevo en el formulario de la ficha—, los artículos se crean
 * con un formulario de verdad. No es una inconsistencia: un artículo necesita su
 * definición de atributos (`campos`), y eso un texto libre escrito en un
 * `<datalist>` no lo puede aportar.
 */

const ModalGrupo = ({ abierto, grupo, areas, onCerrar, onGuardar }) => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [areaId, setAreaId] = useState(null);
  const [correo, setCorreo] = useState("");
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCodigo(grupo?.codigo ?? "");
    setNombre(grupo?.nombre ?? "");
    setAreaId(grupo?.areaResponsableId ?? null);
    setCorreo(grupo?.correoResponsable ?? "");
    setOrden(String(grupo?.orden ?? 0));
    setActivo(grupo?.activo ?? true);
    setEnviando(false);
  }, [abierto, grupo]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!codigo.trim() || !nombre.trim()) {
      toast.error("El código y el nombre son obligatorios.");
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        codigo: codigo.trim().toUpperCase().replace(/\s+/g, "_"),
        nombre: nombre.trim().toUpperCase(),
        areaResponsableId: areaId,
        correoResponsable: correo.trim().toLowerCase() || null,
        orden: Number(orden) || 0,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el grupo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  const opcionesAreas = (areas ?? []).map((area) => ({ value: area.id, label: area.nombre }));

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={grupo ? "Editar grupo" : "Nuevo grupo"}
      width="560px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Código" requerido ayuda="Estable. Se copia en cada asignación.">
              <InputUI
                value={codigo}
                onChange={(valor) => setCodigo(valor.toUpperCase())}
                maxLength={40}
                placeholder="EPP"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI
                value={nombre}
                onChange={(valor) => setNombre(valor.toUpperCase())}
                maxLength={120}
              />
            </CampoLabel>
          </FilaFormulario>

          <Aviso $tono="neutro">
            El área responsable es <strong>quien entrega</strong>, no el área del nuevo
            colaborador: el EPP lo entrega Logística aunque el que entra sea de Comercial.
            De ahí sale el destinatario del aviso.
          </Aviso>

          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Área responsable">
              <SelectUI
                options={opcionesAreas}
                value={opcionesAreas.find((opcion) => opcion.value === areaId) ?? null}
                onChange={(opcion) => setAreaId(opcion?.value ?? null)}
                isClearable
                isSearchable
                placeholder="Sin área"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
            <CampoLabel
              etiqueta="Correo propio"
              ayuda="Gana sobre el área. Para buzones como bodega@."
            >
              <InputUI
                type="email"
                value={correo}
                onChange={(valor) => setCorreo(valor.toLowerCase())}
                maxLength={150}
              />
            </CampoLabel>
          </FilaFormulario>

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Orden" ayuda="Menor primero.">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
            <div style={{ paddingTop: 20 }}>
              <CheckboxUI
                name="grupo-activo"
                checked={activo}
                onChange={(_nombre, marcado) => setActivo(marcado)}
                label="Activo"
              />
            </div>
          </FilaFormulario>

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
    </ModalUI>
  );
};

const ModalItem = ({ abierto, item, grupos, grupoPorOmision, onCerrar, onGuardar }) => {
  const [grupoId, setGrupoId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [campos, setCampos] = useState([]);
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setGrupoId(item?.grupoId ?? grupoPorOmision ?? null);
    setNombre(item?.nombre ?? "");
    setUnidad(item?.unidad ?? "");
    setCampos(item?.campos ?? []);
    setOrden(String(item?.orden ?? 0));
    setActivo(item?.activo ?? true);
    setErrores({});
    setEnviando(false);
  }, [abierto, item, grupoPorOmision]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const deCampos = validarCampos(campos);
    setErrores(deCampos);

    if (!grupoId || !nombre.trim()) {
      toast.error("El grupo y el nombre son obligatorios.");
      return;
    }
    if (Object.keys(deCampos).length > 0) return;

    setEnviando(true);
    try {
      await onGuardar({
        grupoId,
        nombre: nombre.trim().toUpperCase(),
        unidad: unidad.trim() || null,
        campos,
        orden: Number(orden) || 0,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el artículo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  const opcionesGrupos = (grupos ?? []).map((grupo) => ({ value: grupo.id, label: grupo.nombre }));

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={item ? "Editar artículo" : "Nuevo artículo"}
      width="720px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={180}>
            <CampoLabel etiqueta="Grupo" requerido>
              <SelectUI
                options={opcionesGrupos}
                value={opcionesGrupos.find((opcion) => opcion.value === grupoId) ?? null}
                onChange={(opcion) => setGrupoId(opcion?.value ?? null)}
                isSearchable
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI
                value={nombre}
                onChange={(valor) => setNombre(valor.toUpperCase())}
                maxLength={150}
                placeholder="BOTAS"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Unidad" ayuda="unidad, par, caja, juego…">
              <InputUI value={unidad} onChange={setUnidad} maxLength={30} />
            </CampoLabel>
          </FilaFormulario>

          <EditorCampos campos={campos} onCambiar={setCampos} errores={errores} />

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Orden">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
            <div style={{ paddingTop: 20 }}>
              <CheckboxUI
                name="item-activo"
                checked={activo}
                onChange={(_nombre, marcado) => setActivo(marcado)}
                label="Activo"
              />
            </div>
          </FilaFormulario>

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
    </ModalUI>
  );
};

export const EditorCatalogoItems = () => {
  const { theme } = useTheme();

  const { datos: grupos, cargando: cargandoGrupos, recargar: recargarGrupos } = useConsulta(
    ({ signal }) => ListarGruposDotacion({ signal }),
    [],
  );

  const { datos: items, cargando: cargandoItems, recargar: recargarItems } = useConsulta(
    ({ signal }) => ListarItemsDotacion({ signal }),
    [],
  );

  const { datos: areas } = useConsulta(({ signal }) => ListarAreas({ signal }), []);

  const [grupoEnEdicion, setGrupoEnEdicion] = useState(undefined);
  const [itemEnEdicion, setItemEnEdicion] = useState(undefined);
  const [grupoFiltro, setGrupoFiltro] = useState(null);

  const recargar = () => {
    recargarGrupos();
    recargarItems();
  };

  const guardarGrupo = async (datos) => {
    await (grupoEnEdicion
      ? ActualizarGrupoDotacion(grupoEnEdicion.id, datos)
      : CrearGrupoDotacion(datos));
    setGrupoEnEdicion(undefined);
    toast.success("Grupo guardado.");
    recargar();
  };

  const guardarItem = async (datos) => {
    await (itemEnEdicion ? ActualizarItemDotacion(itemEnEdicion.id, datos) : CrearItemDotacion(datos));
    setItemEnEdicion(undefined);
    toast.success("Artículo guardado.");
    recargar();
  };

  const borrar = async (accion, etiqueta) => {
    try {
      await accion();
      toast.success(`${etiqueta} eliminado.`);
      recargar();
    } catch (e) {
      // El backend explica por qué no se puede (está en una plantilla, tiene
      // artículos) y propone la alternativa. Se muestra tal cual.
      toast.error(e.message || "No se pudo eliminar");
    }
  };

  if (cargandoGrupos || cargandoItems) {
    return <LoaderUI text="Cargando el catálogo…" height="220px" />;
  }

  const visibles = grupoFiltro
    ? (items ?? []).filter((item) => item.grupoId === grupoFiltro.value)
    : (items ?? []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Tarjeta $sinRelleno>
        <div style={{ padding: 16 }}>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Grupos</TituloTarjeta>
            <ButtonUI
              text="Nuevo grupo"
              iconLeft="FaPlus"
              variant="outlined"
              onClick={() => setGrupoEnEdicion(null)}
            />
          </Acciones>
        </div>

        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Nombre</Th>
                <Th>Área responsable</Th>
                <Th>Recibe los avisos</Th>
                <Th>Artículos</Th>
                <Th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {(grupos ?? []).map((grupo) => (
                <Fila key={grupo.id}>
                  <Td>{grupo.codigo}</Td>
                  <Td>
                    {grupo.nombre}
                    {!grupo.activo && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Inactivo</Badge>
                      </>
                    )}
                  </Td>
                  <Td>{grupo.areaResponsable ?? <TextoTenue>—</TextoTenue>}</Td>
                  <Td>
                    {grupo.destinatarioEfectivo ? (
                      grupo.destinatarioEfectivo
                    ) : (
                      <Badge $tono="peligro">Sin destinatario</Badge>
                    )}
                  </Td>
                  <Td>{grupo.totalItems}</Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setGrupoEnEdicion(grupo)}
                      />
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Eliminar"
                        onClick={() => borrar(() => EliminarGrupoDotacion(grupo.id), grupo.nombre)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>
      </Tarjeta>

      <Tarjeta $sinRelleno>
        <div style={{ padding: 16 }}>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Artículos</TituloTarjeta>
            <Acciones>
              <div style={{ minWidth: 220 }}>
                <SelectUI
                  options={(grupos ?? []).map((grupo) => ({ value: grupo.id, label: grupo.nombre }))}
                  value={grupoFiltro}
                  onChange={setGrupoFiltro}
                  isClearable
                  placeholder="Todos los grupos"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </div>
              <ButtonUI
                text="Nuevo artículo"
                iconLeft="FaPlus"
                variant="outlined"
                onClick={() => setItemEnEdicion(null)}
              />
            </Acciones>
          </Acciones>
        </div>

        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                <Th>Grupo</Th>
                <Th>Artículo</Th>
                <Th>Unidad</Th>
                <Th>Atributos</Th>
                <Th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibles.map((item) => (
                <Fila key={item.id}>
                  <Td>{item.grupoNombre}</Td>
                  <Td>
                    {item.nombre}
                    {!item.activo && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Inactivo</Badge>
                      </>
                    )}
                  </Td>
                  <Td>{item.unidad ?? <TextoTenue>—</TextoTenue>}</Td>
                  <Td>
                    {item.campos.length === 0 ? (
                      <TextoTenue>solo cantidad</TextoTenue>
                    ) : (
                      <Acciones>
                        {item.campos.map((campo) => (
                          <Badge key={campo.clave} $tono={campo.requerido ? "info" : "neutro"}>
                            {campo.etiqueta}
                            {campo.requerido ? " *" : ""}
                          </Badge>
                        ))}
                      </Acciones>
                    )}
                  </Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setItemEnEdicion(item)}
                      />
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Eliminar"
                        onClick={() => borrar(() => EliminarItemDotacion(item.id), item.nombre)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>
      </Tarjeta>

      <ModalGrupo
        abierto={grupoEnEdicion !== undefined}
        grupo={grupoEnEdicion}
        areas={areas}
        onCerrar={() => setGrupoEnEdicion(undefined)}
        onGuardar={guardarGrupo}
      />

      <ModalItem
        abierto={itemEnEdicion !== undefined}
        item={itemEnEdicion}
        grupos={grupos}
        grupoPorOmision={grupoFiltro?.value ?? null}
        onCerrar={() => setItemEnEdicion(undefined)}
        onGuardar={guardarItem}
      />
    </div>
  );
};

export default EditorCatalogoItems;
