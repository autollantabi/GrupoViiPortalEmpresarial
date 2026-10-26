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
  ActualizarInduccionCatalogoItem,
  CrearInduccionCatalogoItem,
  EliminarInduccionCatalogoItem,
  ListarAreas,
  ListarInduccionCatalogo,
} from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
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
 * Catálogo de inducción: las actividades que se le programan a un colaborador
 * según el área a la que ingresa, y en qué día relativo al ingreso.
 *
 * Mismo patrón que EditorMotivosBaja/EditorTiposDocumento. Un renglón sin área
 * (areaId nulo) aplica a todas las áreas.
 */

const ModalActividad = ({ abierto, item, areas, onCerrar, onGuardar }) => {
  const [areaId, setAreaId] = useState(null);
  const [orden, setOrden] = useState("0");
  const [nombreActividad, setNombreActividad] = useState("");
  const [diaRelativoIngreso, setDiaRelativoIngreso] = useState("0");
  const [responsable, setResponsable] = useState("");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setAreaId(item?.areaId ?? null);
    setOrden(String(item?.orden ?? 0));
    setNombreActividad(item?.nombreActividad ?? "");
    setDiaRelativoIngreso(String(item?.diaRelativoIngreso ?? 0));
    setResponsable(item?.responsable ?? "");
    setActivo(item?.activo ?? true);
    setEnviando(false);
  }, [abierto, item]);

  const opcionesArea = useMemo(
    () => (areas ?? []).map((area) => ({ value: area.id, label: area.nombre })),
    [areas],
  );

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!nombreActividad.trim()) {
      toast.error("El nombre de la actividad es obligatorio.");
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        areaId: areaId || null,
        orden: Number(orden) || 0,
        nombreActividad: nombreActividad.trim(),
        diaRelativoIngreso: Number(diaRelativoIngreso) || 0,
        responsable: responsable.trim() || null,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar la actividad de inducción");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={item ? "Editar actividad de inducción" : "Nueva actividad de inducción"}
      width="560px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CampoLabel etiqueta="Nombre de la actividad" requerido>
            <InputUI value={nombreActividad} onChange={setNombreActividad} maxLength={150} />
          </CampoLabel>

          <CampoLabel
            etiqueta="Área"
            ayuda="Déjelo vacío para que aplique a todas las áreas."
          >
            <SelectUI
              options={opcionesArea}
              value={opcionesArea.find((opcion) => opcion.value === areaId) ?? null}
              onChange={(opcion) => setAreaId(opcion?.value ?? null)}
              isSearchable
              isClearable
              placeholder="Todas las áreas"
              minWidth="100%"
              maxWidth="100%"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

          <FilaFormulario $min={200}>
            <CampoLabel
              etiqueta="Día relativo al ingreso"
              requerido
              ayuda="0 = el mismo día de ingreso."
            >
              <InputUI
                type="number"
                value={diaRelativoIngreso}
                onChange={setDiaRelativoIngreso}
                min={0}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Orden">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Responsable">
            <InputUI value={responsable} onChange={setResponsable} maxLength={150} />
          </CampoLabel>

          <div>
            <CheckboxUI
              name="induccion-activo"
              checked={activo}
              onChange={(_nombre, marcado) => setActivo(marcado)}
              label="Activo"
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
    </ModalUI>
  );
};

export const EditorInduccion = () => {
  const { theme } = useTheme();

  const {
    datos: catalogo,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ListarInduccionCatalogo({ signal }), []);

  const { datos: areas } = useConsulta(({ signal }) => ListarAreas({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion
      ? ActualizarInduccionCatalogoItem(enEdicion.id, datos)
      : CrearInduccionCatalogoItem(datos));
    setEnEdicion(undefined);
    toast.success("Actividad de inducción guardada.");
    recargar();
  };

  const borrar = async (item) => {
    try {
      await EliminarInduccionCatalogoItem(item.id);
      toast.success(`${item.nombreActividad} eliminada.`);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la actividad");
    }
  };

  if (cargando) return <LoaderUI text="Cargando el catálogo de inducción…" height="200px" />;

  if (error) {
    return (
      <Aviso $tono="peligro">
        {error} <ButtonUI text="Reintentar" variant="ghost" onClick={recargar} />
      </Aviso>
    );
  }

  return (
    <Tarjeta $sinRelleno>
      <div style={{ padding: 16 }}>
        <Acciones style={{ justifyContent: "space-between" }}>
          <div>
            <TituloTarjeta style={{ margin: 0 }}>Cronograma de inducción</TituloTarjeta>
            <TextoTenue>
              Las actividades que se le programan a un colaborador nuevo, por área y por día
              relativo al ingreso.
            </TextoTenue>
          </div>
          <ButtonUI
            text="Nueva actividad"
            iconLeft="FaPlus"
            variant="outlined"
            onClick={() => setEnEdicion(null)}
          />
        </Acciones>
      </div>

      <TablaScroll>
        <Tabla>
          <thead>
            <tr>
              <Th>Actividad</Th>
              <Th>Área</Th>
              <Th>Día</Th>
              <Th>Responsable</Th>
              <Th>Orden</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(catalogo ?? []).length === 0 ? (
              <tr>
                <Td colSpan={6}>
                  <TextoTenue>Sin actividades registradas.</TextoTenue>
                </Td>
              </tr>
            ) : (
              catalogo.map((item) => (
                <Fila key={item.id}>
                  <Td>
                    {item.nombreActividad}
                    {!item.activo && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Inactiva</Badge>
                      </>
                    )}
                  </Td>
                  <Td>{item.area || "Todas"}</Td>
                  <Td>{item.diaRelativoIngreso}</Td>
                  <Td>{item.responsable || "—"}</Td>
                  <Td>{item.orden}</Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setEnEdicion(item)}
                      />
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Eliminar"
                        onClick={() => borrar(item)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))
            )}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalActividad
        abierto={enEdicion !== undefined}
        item={enEdicion}
        areas={areas}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorInduccion;
