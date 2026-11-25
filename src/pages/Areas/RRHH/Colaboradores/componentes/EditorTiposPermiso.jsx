import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import { ActualizarTipoPermiso, CrearTipoPermiso, EliminarTipoPermiso, ListarTiposPermiso } from "services/permisosService";
import { CampoLabel } from "./CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
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

/** Catálogo de tipos de permiso (Médico, Personal, Calamidad doméstica...). Calco de EditorTiposDocumento.jsx, sin las reglas de "a quién se aplica". */

const ModalTipo = ({ abierto, tipo, onCerrar, onGuardar }) => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCodigo(tipo?.codigo ?? "");
    setNombre(tipo?.nombre ?? "");
    setDescripcion(tipo?.descripcion ?? "");
    setOrden(String(tipo?.orden ?? 0));
    setActivo(tipo?.activo ?? true);
    setEnviando(false);
  }, [abierto, tipo]);

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
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        orden: Number(orden) || 0,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el tipo de permiso");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={tipo ? "Editar tipo de permiso" : "Nuevo tipo de permiso"}
      width="520px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Código" requerido>
              <InputUI
                value={codigo}
                onChange={(valor) => setCodigo(valor.toUpperCase())}
                maxLength={40}
                placeholder="CALAMIDAD_DOMESTICA"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI value={nombre} onChange={setNombre} maxLength={150} />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Descripción">
            <AreaTexto
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              maxLength={300}
              rows={2}
            />
          </CampoLabel>

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Orden">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
            <div style={{ paddingTop: 20 }}>
              <CheckboxUI
                name="tipo-permiso-activo"
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

export const EditorTiposPermiso = () => {
  const { theme } = useTheme();

  const { datos: tipos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ListarTiposPermiso({ signal }),
    [],
  );

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion ? ActualizarTipoPermiso(enEdicion.id, datos) : CrearTipoPermiso(datos));
    setEnEdicion(undefined);
    toast.success("Tipo de permiso guardado.");
    recargar();
  };

  const borrar = async (tipo) => {
    try {
      await EliminarTipoPermiso(tipo.id);
      toast.success(`${tipo.nombre} eliminado.`);
      recargar();
    } catch (e) {
      // El backend explica que hay solicitudes con ese tipo y propone desactivarlo.
      toast.error(e.message || "No se pudo eliminar");
    }
  };

  if (cargando) return <LoaderUI text="Cargando los tipos de permiso…" height="200px" />;

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
            <TituloTarjeta style={{ margin: 0 }}>Tipos de permiso</TituloTarjeta>
            <TextoTenue>Médico, Personal, Calamidad doméstica... los motivos que se pueden elegir al registrar un permiso.</TextoTenue>
          </div>
          <ButtonUI text="Nuevo tipo" iconLeft="FaPlus" variant="outlined" onClick={() => setEnEdicion(null)} />
        </Acciones>
      </div>

      <TablaScroll>
        <Tabla>
          <thead>
            <tr>
              <Th>Tipo de permiso</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(tipos ?? []).map((tipo) => (
              <Fila key={tipo.id}>
                <Td>
                  {tipo.nombre}
                  {!tipo.activo && (
                    <>
                      {" "}
                      <Badge $tono="neutro">Inactivo</Badge>
                    </>
                  )}
                  {tipo.descripcion && (
                    <>
                      <br />
                      <TextoTenue>{tipo.descripcion}</TextoTenue>
                    </>
                  )}
                </Td>
                <Td>
                  <Acciones>
                    <ButtonUI
                      text=""
                      iconLeft="FaPenToSquare"
                      variant="ghost"
                      title="Editar"
                      onClick={() => setEnEdicion(tipo)}
                    />
                    <ButtonUI
                      text=""
                      iconLeft="FaTrashCan"
                      variant="ghost"
                      pcolor={theme?.colors?.error}
                      title="Eliminar"
                      onClick={() => borrar(tipo)}
                    />
                  </Acciones>
                </Td>
              </Fila>
            ))}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalTipo abierto={enEdicion !== undefined} tipo={enEdicion} onCerrar={() => setEnEdicion(undefined)} onGuardar={guardar} />
    </Tarjeta>
  );
};

export default EditorTiposPermiso;
