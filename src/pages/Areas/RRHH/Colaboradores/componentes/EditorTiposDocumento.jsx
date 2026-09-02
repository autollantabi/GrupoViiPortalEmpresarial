import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { ListarCargos } from "services/colaboradoresService";
import {
  ActualizarTipoDocumento,
  CrearTipoDocumento,
  EliminarTipoDocumento,
  ListarTiposDocumento,
} from "services/dotacionService";
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
import { CONDICION_DOCUMENTO, ETIQUETA_CONDICION } from "../utils/constantesDotacion";

/**
 * Tipos de documento: qué papeles se le piden a un colaborador.
 *
 * Tres disparadores INDEPENDIENTES que se suman, y la pantalla los presenta como
 * tales porque confundirlos es el error fácil:
 *  - Obligatorio para todos.
 *  - Una condición de la persona (casado, con hijos, conduce).
 *  - Un cargo concreto.
 *
 * Un vendedor casado con hijos que conduce recibe la lista completa. Quien no
 * tenga esos datos llenos en su ficha solo ve los obligatorios, y la pestaña
 * Documentos lo avisa.
 */

const CONDICIONES = [
  { value: "", label: "A nadie por condición" },
  { value: CONDICION_DOCUMENTO.CASADO, label: `Casado — ${ETIQUETA_CONDICION.Casado}` },
  { value: CONDICION_DOCUMENTO.CON_HIJOS, label: `Con hijos — ${ETIQUETA_CONDICION.ConHijos}` },
  { value: CONDICION_DOCUMENTO.CONDUCE, label: `Conduce — ${ETIQUETA_CONDICION.Conduce}` },
];

const ModalTipo = ({ abierto, tipo, cargos, onCerrar, onGuardar }) => {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [base, setBase] = useState(false);
  const [condicion, setCondicion] = useState("");
  const [permiteMultiples, setPermiteMultiples] = useState(false);
  const [cargoIds, setCargoIds] = useState([]);
  const [orden, setOrden] = useState("0");
  const [activo, setActivo] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCodigo(tipo?.codigo ?? "");
    setNombre(tipo?.nombre ?? "");
    setDescripcion(tipo?.descripcion ?? "");
    setBase(tipo?.base ?? false);
    setCondicion(tipo?.condicion ?? "");
    setPermiteMultiples(tipo?.permiteMultiples ?? false);
    setCargoIds((tipo?.cargos ?? []).map((cargo) => cargo.id));
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

    if (!base && !condicion && cargoIds.length === 0) {
      toast.error(
        "Este documento no se le pediría a nadie. Márquelo como obligatorio, dele una condición o asígnelo a un cargo.",
      );
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        codigo: codigo.trim().toUpperCase().replace(/\s+/g, "_"),
        nombre: nombre.trim().toUpperCase(),
        descripcion: descripcion.trim() || null,
        base,
        condicion: condicion || null,
        permiteMultiples,
        cargoIds,
        orden: Number(orden) || 0,
        activo,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el tipo de documento");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  const opcionesCargos = (cargos ?? []).map((cargo) => ({ value: cargo.id, label: cargo.nombre }));

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={tipo ? "Editar tipo de documento" : "Nuevo tipo de documento"}
      width="640px"
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
                placeholder="CEDULA_COPIA"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombre" requerido>
              <InputUI
                value={nombre}
                onChange={(valor) => setNombre(valor.toUpperCase())}
                maxLength={150}
              />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel
            etiqueta="Descripción"
            ayuda="Se muestra en la pestaña Documentos, para saber exactamente qué pedir."
          >
            <AreaTexto
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Copia legible de la cédula, por ambos lados."
            />
          </CampoLabel>

          <Aviso $tono="neutro">
            Las tres reglas de abajo se <strong>suman</strong>: si marca obligatorio y además
            elige un cargo, se le pedirá a todos y también, por su cargo, a esos.
          </Aviso>

          <div>
            <CheckboxUI
              name="tipo-base"
              checked={base}
              onChange={(_nombre, marcado) => setBase(marcado)}
              label="Obligatorio para todos"
            />
          </div>

          <CampoLabel
            etiqueta="Solo si la persona…"
            ayuda="Se lee de la ficha. Mientras el dato esté vacío, no se pide."
          >
            <SelectUI
              options={CONDICIONES}
              value={CONDICIONES.find((opcion) => opcion.value === condicion) ?? CONDICIONES[0]}
              onChange={(opcion) => setCondicion(opcion?.value ?? "")}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

          <CampoLabel etiqueta="Además, a estos cargos">
            <SelectUI
              options={opcionesCargos}
              value={opcionesCargos.filter((opcion) => cargoIds.includes(opcion.value))}
              onChange={(opciones) => setCargoIds((opciones ?? []).map((opcion) => opcion.value))}
              isMulti
              isSearchable
              maxWidth="100%"
              placeholder="Ningún cargo en particular"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

          <div>
            <CheckboxUI
              name="tipo-multiples"
              checked={permiteMultiples}
              onChange={(_nombre, marcado) => setPermiteMultiples(marcado)}
              label="Va uno por persona (una partida por hijo, por ejemplo)"
            />
          </div>

          <FilaFormulario $min={160}>
            <CampoLabel etiqueta="Orden">
              <InputUI type="number" value={orden} onChange={setOrden} min={0} />
            </CampoLabel>
            <div style={{ paddingTop: 20 }}>
              <CheckboxUI
                name="tipo-activo"
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

export const EditorTiposDocumento = () => {
  const { theme } = useTheme();

  const { datos: tipos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ListarTiposDocumento({ signal }),
    [],
  );

  const { datos: cargos } = useConsulta(({ signal }) => ListarCargos({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion ? ActualizarTipoDocumento(enEdicion.id, datos) : CrearTipoDocumento(datos));
    setEnEdicion(undefined);
    toast.success("Tipo de documento guardado.");
    recargar();
  };

  const borrar = async (tipo) => {
    try {
      await EliminarTipoDocumento(tipo.id);
      toast.success(`${tipo.nombre} eliminado.`);
      recargar();
    } catch (e) {
      // El backend explica que hay colaboradores con ese documento y propone
      // desactivarlo. Se muestra tal cual.
      toast.error(e.message || "No se pudo eliminar");
    }
  };

  if (cargando) return <LoaderUI text="Cargando los tipos de documento…" height="200px" />;

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
            <TituloTarjeta style={{ margin: 0 }}>Tipos de documento</TituloTarjeta>
            <TextoTenue>
              Los papeles que trae la persona. Corresponden a la columna Requerimientos de la
              hoja de dotación.
            </TextoTenue>
          </div>
          <ButtonUI
            text="Nuevo tipo"
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
              <Th>Documento</Th>
              <Th>A quién se le pide</Th>
              <Th>Ejemplares</Th>
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
                    {tipo.base && <Badge $tono="info">A todos</Badge>}
                    {tipo.condicion && (
                      <Badge $tono="aviso">{ETIQUETA_CONDICION[tipo.condicion]}</Badge>
                    )}
                    {tipo.cargos.map((cargo) => (
                      <Badge key={cargo.id} $tono="neutro">
                        {cargo.nombre}
                      </Badge>
                    ))}
                    {!tipo.base && !tipo.condicion && tipo.cargos.length === 0 && (
                      <Badge $tono="peligro">A nadie</Badge>
                    )}
                  </Acciones>
                </Td>
                <Td>{tipo.permiteMultiples ? "Varios" : "Uno"}</Td>
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

      <ModalTipo
        abierto={enEdicion !== undefined}
        tipo={enEdicion}
        cargos={cargos}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorTiposDocumento;
