import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { ListarCargos } from "services/colaboradoresService";
import {
  ActualizarPerfilCargo,
  CrearPerfilCargo,
  EliminarPerfilCargo,
  ListarPerfilesCargo,
} from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  Aviso,
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
 * Perfiles de cargo: qué hace, qué se le pide y a quién reporta cada cargo.
 *
 * Mismo patrón que EditorMotivosBaja/EditorTiposDocumento: tabla + modal de alta
 * y edición. Un cargo puede tener un solo perfil (lo decide el backend); acá no
 * se valida eso de antemano, se muestra el error que devuelva el servidor.
 */

const ModalPerfil = ({ abierto, perfil, cargos, onCerrar, onGuardar }) => {
  const [cargoId, setCargoId] = useState(null);
  const [nivel, setNivel] = useState("");
  const [funciones, setFunciones] = useState("");
  const [requisitos, setRequisitos] = useState("");
  const [competencias, setCompetencias] = useState("");
  const [rangoSalarialMin, setRangoSalarialMin] = useState("");
  const [rangoSalarialFijo, setRangoSalarialFijo] = useState("");
  const [rangoSalarialVariable, setRangoSalarialVariable] = useState("");
  const [reportaACargoId, setReportaACargoId] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setCargoId(perfil?.cargoId ?? null);
    setNivel(perfil?.nivel ?? "");
    setFunciones(perfil?.funciones ?? "");
    setRequisitos(perfil?.requisitos ?? "");
    setCompetencias(perfil?.competencias ?? "");
    setRangoSalarialMin(perfil?.rangoSalarialMin != null ? String(perfil.rangoSalarialMin) : "");
    setRangoSalarialFijo(perfil?.rangoSalarialFijo != null ? String(perfil.rangoSalarialFijo) : "");
    setRangoSalarialVariable(
      perfil?.rangoSalarialVariable != null ? String(perfil.rangoSalarialVariable) : "",
    );
    setReportaACargoId(perfil?.reportaACargoId ?? null);
    setEnviando(false);
  }, [abierto, perfil]);

  const opcionesCargo = useMemo(
    () => (cargos ?? []).map((cargo) => ({ value: cargo.id, label: cargo.nombre })),
    [cargos],
  );

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!cargoId) {
      toast.error("Elija el cargo.");
      return;
    }

    setEnviando(true);
    try {
      await onGuardar({
        cargoId,
        nivel: nivel.trim() || null,
        funciones: funciones.trim() || null,
        requisitos: requisitos.trim() || null,
        competencias: competencias.trim() || null,
        rangoSalarialMin: rangoSalarialMin === "" ? null : Number(rangoSalarialMin),
        rangoSalarialFijo: rangoSalarialFijo === "" ? null : Number(rangoSalarialFijo),
        rangoSalarialVariable: rangoSalarialVariable === "" ? null : Number(rangoSalarialVariable),
        reportaACargoId: reportaACargoId || null,
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el perfil de cargo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={perfil ? "Editar perfil de cargo" : "Nuevo perfil de cargo"}
      width="640px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={220}>
            <CampoLabel etiqueta="Cargo" requerido>
              <SelectUI
                options={opcionesCargo}
                value={opcionesCargo.find((opcion) => opcion.value === cargoId) ?? null}
                onChange={(opcion) => setCargoId(opcion?.value ?? null)}
                isSearchable
                placeholder="Seleccione el cargo"
                minWidth="100%"
                maxWidth="100%"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nivel" ayuda="Operativo, supervisión, jefatura, gerencia…">
              <InputUI value={nivel} onChange={setNivel} maxLength={80} />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Funciones">
            <AreaTexto
              value={funciones}
              onChange={(evento) => setFunciones(evento.target.value)}
              maxLength={2000}
              rows={3}
            />
          </CampoLabel>

          <CampoLabel etiqueta="Requisitos">
            <AreaTexto
              value={requisitos}
              onChange={(evento) => setRequisitos(evento.target.value)}
              maxLength={2000}
              rows={3}
            />
          </CampoLabel>

          <CampoLabel etiqueta="Conocimientos">
            <AreaTexto
              value={competencias}
              onChange={(evento) => setCompetencias(evento.target.value)}
              maxLength={2000}
              rows={3}
            />
          </CampoLabel>

          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Rango salarial mínimo">
              <InputUI
                type="number"
                value={rangoSalarialMin}
                onChange={setRangoSalarialMin}
                min={0}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Rango salarial fijo">
              <InputUI
                type="number"
                value={rangoSalarialFijo}
                onChange={setRangoSalarialFijo}
                min={0}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Rango salarial variable">
              <InputUI
                type="number"
                value={rangoSalarialVariable}
                onChange={setRangoSalarialVariable}
                min={0}
              />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Reporta a" ayuda="El cargo del que depende.">
            <SelectUI
              options={opcionesCargo}
              value={opcionesCargo.find((opcion) => opcion.value === reportaACargoId) ?? null}
              onChange={(opcion) => setReportaACargoId(opcion?.value ?? null)}
              isSearchable
              isClearable
              placeholder="Ninguno"
              minWidth="100%"
              maxWidth="100%"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

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

export const EditorPerfilesCargo = () => {
  const { theme } = useTheme();

  const {
    datos: perfiles,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ListarPerfilesCargo({ signal }), []);

  const { datos: cargos } = useConsulta(({ signal }) => ListarCargos({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(undefined);

  const guardar = async (datos) => {
    await (enEdicion ? ActualizarPerfilCargo(enEdicion.id, datos) : CrearPerfilCargo(datos));
    setEnEdicion(undefined);
    toast.success("Perfil de cargo guardado.");
    recargar();
  };

  const borrar = async (perfil) => {
    try {
      await EliminarPerfilCargo(perfil.id);
      toast.success(`Perfil de ${perfil.cargo} eliminado.`);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar el perfil de cargo");
    }
  };

  if (cargando) return <LoaderUI text="Cargando los perfiles de cargo…" height="200px" />;

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
            <TituloTarjeta style={{ margin: 0 }}>Perfiles de cargo</TituloTarjeta>
            <TextoTenue>
              Funciones, requisitos, conocimientos y línea de reporte de cada cargo.
            </TextoTenue>
          </div>
          <ButtonUI
            text="Nuevo perfil"
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
              <Th>Cargo</Th>
              <Th>Nivel</Th>
              <Th>Mínimo</Th>
              <Th>Fijo</Th>
              <Th>Variable</Th>
              <Th>Reporta a</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(perfiles ?? []).length === 0 ? (
              <tr>
                <Td colSpan={7}>
                  <TextoTenue>Sin perfiles de cargo registrados.</TextoTenue>
                </Td>
              </tr>
            ) : (
              perfiles.map((perfil) => (
                <Fila key={perfil.id}>
                  <Td>{perfil.cargo}</Td>
                  <Td>{perfil.nivel || "—"}</Td>
                  <Td>{perfil.rangoSalarialMin ?? "—"}</Td>
                  <Td>{perfil.rangoSalarialFijo ?? "—"}</Td>
                  <Td>{perfil.rangoSalarialVariable ?? "—"}</Td>
                  <Td>{perfil.reportaACargo || "—"}</Td>
                  <Td>
                    <Acciones>
                      <ButtonUI
                        text=""
                        iconLeft="FaPenToSquare"
                        variant="ghost"
                        title="Editar"
                        onClick={() => setEnEdicion(perfil)}
                      />
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Eliminar"
                        onClick={() => borrar(perfil)}
                      />
                    </Acciones>
                  </Td>
                </Fila>
              ))
            )}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalPerfil
        abierto={enEdicion !== undefined}
        perfil={enEdicion}
        cargos={cargos}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorPerfilesCargo;
