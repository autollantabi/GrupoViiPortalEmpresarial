import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import {
  ActualizarMotivoBaja,
  CrearMotivoBaja,
  EliminarMotivoBaja,
  ObtenerMotivosBaja,
} from "services/dotacionService";
import { CampoLabel } from "./CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
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
 * Catálogo de motivos de baja de un artículo de dotación.
 *
 * Un artículo se da de baja cuando se reemplaza (se rompió, se perdió, cambió de
 * talla…): el motivo queda registrado en el renglón viejo, que TablaDotacion
 * muestra atenuado y sin acciones. Mismo patrón visual que
 * EditorAreasResponsables/EditorTiposDocumento: tabla + modal de alta/edición.
 *
 * No se puede borrar un motivo que ya está en uso (409 del backend); la
 * alternativa es desactivarlo, igual que con grupos y artículos del catálogo.
 */

const ModalMotivo = ({ abierto, motivo, onCerrar, onGuardar }) => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCodigo(motivo?.codigo ?? "");
    setNombre(motivo?.nombre ?? "");
    setOrden(String(motivo?.orden ?? 0));
    setActivo(motivo?.activo ?? true);
    setEnviando(false);
  }, [abierto, motivo]);

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
        orden: Number(orden) || 0,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el motivo de baja");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={motivo ? "Editar motivo de baja" : "Nuevo motivo de baja"}
      width="520px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Código" requerido ayuda="Estable, no se ve en la dotación.">
              <InputUI
                value={codigo}
                onChange={(valor) => setCodigo(valor.toUpperCase())}
                maxLength={40}
                placeholder="DETERIORO"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombre" requerido ayuda="Lo que se muestra al reemplazar un artículo.">
              <InputUI
                value={nombre}
                onChange={(valor) => setNombre(valor.toUpperCase())}
                maxLength={120}
                placeholder="Deterioro por uso"
              />
            </CampoLabel>
          </FilaFormulario>

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Orden" ayuda="Menor primero.">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
            <div style={{ paddingTop: 20 }}>
              <CheckboxUI
                name="motivo-activo"
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

export const EditorMotivosBaja = () => {
  const { theme } = useTheme();

  const { datos: motivos, cargando, recargar } = useConsulta(
    ({ signal }) => ObtenerMotivosBaja({ signal }),
    [],
  );

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion ? ActualizarMotivoBaja(enEdicion.id, datos) : CrearMotivoBaja(datos));
    setEnEdicion(undefined);
    toast.success("Motivo de baja guardado.");
    recargar();
  };

  const borrar = async (motivo) => {
    try {
      await EliminarMotivoBaja(motivo.id);
      toast.success(`${motivo.nombre} eliminado.`);
      recargar();
    } catch (e) {
      // El backend explica que ya está en uso y que solo se puede desactivar.
      toast.error(e.message || "No se pudo eliminar");
    }
  };

  if (cargando) return <LoaderUI text="Cargando los motivos de baja…" height="200px" />;

  return (
    <Tarjeta $sinRelleno>
      <div style={{ padding: 16 }}>
        <Acciones style={{ justifyContent: "space-between" }}>
          <div>
            <TituloTarjeta style={{ margin: 0 }}>Motivos de baja</TituloTarjeta>
            <TextoTenue>
              Por qué se reemplaza un artículo ya entregado: se elige al marcar uno como dado
              de baja.
            </TextoTenue>
          </div>
          <ButtonUI
            text="Nuevo motivo"
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
              <Th>Código</Th>
              <Th>Nombre</Th>
              <Th>Orden</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(motivos ?? []).length === 0 ? (
              <tr>
                <Td colSpan={4}>
                  <TextoTenue>Sin motivos registrados.</TextoTenue>
                </Td>
              </tr>
            ) : (
              motivos.map((motivo) => (
                <Fila key={motivo.id}>
                  <Td>{motivo.codigo}</Td>
                  <Td>
                    {motivo.nombre}
                    {!motivo.activo && (
                      <>
                        {" "}
                        <Badge $tono="neutro">Inactivo</Badge>
                      </>
                    )}
                  </Td>
                  <Td>{motivo.orden}</Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setEnEdicion(motivo)}
                      />
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Eliminar"
                        onClick={() => borrar(motivo)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))
            )}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalMotivo
        abierto={enEdicion !== undefined}
        motivo={enEdicion}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorMotivosBaja;
