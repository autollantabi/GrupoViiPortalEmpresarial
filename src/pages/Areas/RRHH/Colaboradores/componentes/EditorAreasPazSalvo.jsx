import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import {
  ActualizarPazSalvoAreaConfig,
  CrearPazSalvoAreaConfig,
  ListarPazSalvoAreasConfig,
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
 * Áreas que deben dar el visto bueno en la baja de un colaborador (paz y salvo):
 * sistemas, activos fijos, cartera…
 *
 * `cantidadResponsables` es un dato PURAMENTE INFORMATIVO/editable (cuántas
 * personas atienden ese visto bueno hoy), NO una lista de contactos: por eso es
 * un simple input numérico y no un selector de usuarios.
 *
 * No hay DELETE: un área que ya no aplica se desactiva con activo=false, mismo
 * criterio que items y grupos de dotación.
 */

const ModalArea = ({ abierto, area, onCerrar, onGuardar }) => {
  const [areaNombre, setAreaNombre] = useState("");
  const [cantidadResponsables, setCantidadResponsables] = useState("");
  const [correoNotificacion, setCorreoNotificacion] = useState("");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setAreaNombre(area?.areaNombre ?? "");
    setCantidadResponsables(
      area?.cantidadResponsables != null ? String(area.cantidadResponsables) : "",
    );
    setCorreoNotificacion(area?.correoNotificacion ?? "");
    setActivo(area?.activo ?? true);
    setEnviando(false);
  }, [abierto, area]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!areaNombre.trim()) {
      toast.error("El nombre del área es obligatorio.");
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        areaNombre: areaNombre.trim(),
        cantidadResponsables: cantidadResponsables === "" ? null : Number(cantidadResponsables),
        correoNotificacion: correoNotificacion.trim() || null,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el área de paz y salvo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={area ? "Editar área de paz y salvo" : "Nueva área de paz y salvo"}
      width="520px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CampoLabel etiqueta="Área" requerido>
            <InputUI value={areaNombre} onChange={setAreaNombre} maxLength={120} />
          </CampoLabel>

          <FilaFormulario $min={200}>
            <CampoLabel
              etiqueta="Cantidad de responsables"
              ayuda="Dato informativo: cuántas personas atienden hoy este visto bueno. No es una lista de contactos."
            >
              <InputUI
                type="number"
                value={cantidadResponsables}
                onChange={setCantidadResponsables}
                min={0}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Correo de notificación">
              <InputUI
                type="email"
                value={correoNotificacion}
                onChange={setCorreoNotificacion}
                maxLength={150}
              />
            </CampoLabel>
          </FilaFormulario>

          <div>
            <CheckboxUI
              name="area-paz-salvo-activo"
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

export const EditorAreasPazSalvo = () => {
  const {
    datos: areas,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ListarPazSalvoAreasConfig({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion
      ? ActualizarPazSalvoAreaConfig(enEdicion.id, datos)
      : CrearPazSalvoAreaConfig(datos));
    setEnEdicion(undefined);
    toast.success("Área de paz y salvo guardada.");
    recargar();
  };

  if (cargando) return <LoaderUI text="Cargando las áreas de paz y salvo…" height="200px" />;

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
            <TituloTarjeta style={{ margin: 0 }}>Áreas de paz y salvo</TituloTarjeta>
            <TextoTenue>
              Las áreas que deben dar el visto bueno en la baja de un colaborador. Se marcan
              como Resuelto una por una en la ficha de la persona dada de baja.
            </TextoTenue>
          </div>
          <ButtonUI
            text="Nueva área"
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
              <Th>Área</Th>
              <Th>Responsables</Th>
              <Th>Correo de notificación</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(areas ?? []).length === 0 ? (
              <tr>
                <Td colSpan={4}>
                  <TextoTenue>Sin áreas registradas.</TextoTenue>
                </Td>
              </tr>
            ) : (
              areas.map((area) => (
                <Fila key={area.id}>
                  <Td>
                    {area.areaNombre}
                    {!area.activo && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Inactivo</Badge>
                      </>
                    )}
                  </Td>
                  <Td>{area.cantidadResponsables ?? "—"}</Td>
                  <Td>{area.correoNotificacion || "—"}</Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setEnEdicion(area)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))
            )}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalArea
        abierto={enEdicion !== undefined}
        area={enEdicion}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorAreasPazSalvo;
