import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  ActualizarCargaFamiliar,
  CrearCargaFamiliar,
  DescargarArchivoCarga,
  EliminarCargaFamiliar,
  ObtenerCargasFamiliares,
  SubirArchivoCarga,
} from "services/cargasFamiliaresService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { ModalCargaFamiliar } from "../componentes/ModalCargaFamiliar";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaCargasFamiliares } from "../componentes/TablaCargasFamiliares";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  CirculoIcono,
  Contenedor,
  Tarjeta,
  TextoTenue,
  Vacio,
} from "../componentes/piezas";

/**
 * Pestaña Cargas familiares de una ficha.
 *
 * Calco estructural de ColDocumentos.jsx: cabecera + pestañas + useConsulta con
 * AbortController, la misma tabla adaptable a tarjetas en móvil y el mismo
 * patrón de "guardar datos y luego, si hay archivo, subirlo" que usa
 * ColDocumentos con la partida de nacimiento. Son dos llamadas encadenadas y no
 * una transacción del lado cliente: si la segunda falla, la carga ya quedó
 * creada o actualizada y el usuario puede reintentar solo la subida editando
 * de nuevo.
 */

const ANIO_ACTUAL = new Date().getFullYear();
const OPCIONES_ANIO = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((anio) => ({
  value: anio,
  label: String(anio),
}));

/**
 * Confirmación de baja de una carga familiar.
 *
 * Local a esta pantalla y no un archivo aparte (como ModalEliminar.jsx de la
 * ficha) porque nada más la usa: mismo criterio que ModalTipo dentro de
 * EditorTiposDocumento.jsx.
 */
const ModalEliminarCarga = ({ abierto, carga, onCerrar, onConfirmar }) => {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setMotivo("");
    setError(null);
    setEnviando(false);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const limpio = motivo.trim();
    if (limpio.length < 5) {
      setError("Escriba por qué se elimina (mínimo 5 caracteres).");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar(limpio);
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la carga familiar");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !carga) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title="Eliminar carga familiar"
      width="480px"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextoTenue>
            Se eliminará a {carga.nombresCompletos} del registro de cargas familiares.
          </TextoTenue>
          <CampoLabel etiqueta="Motivo" requerido error={error}>
            <AreaTexto
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setError(null);
              }}
              maxLength={500}
              rows={3}
            />
          </CampoLabel>
          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Eliminando…" : "Eliminar"}
              iconLeft="FaTrashCan"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export const ColCargasFamiliares = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [ocupado, setOcupado] = useState(false);
  const [enEdicion, setEnEdicion] = useState(undefined); // undefined=cerrado, null=nueva, objeto=editar
  const [aEliminar, setAEliminar] = useState(null);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: cargas,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerCargasFamiliares(id, { anio, signal }), [id, anio]);

  const opcionAnio = useMemo(
    () => OPCIONES_ANIO.find((opcion) => opcion.value === anio) ?? OPCIONES_ANIO[1],
    [anio],
  );

  const ejecutar = async (accion, exito) => {
    setOcupado(true);
    try {
      await accion();
      if (exito) toast.success(exito);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo completar la acción");
    } finally {
      setOcupado(false);
    }
  };

  /**
   * Guardar sirve para crear y para actualizar. `enEdicion === null` es lo que
   * distingue el alta, igual que en ColDocumentos.jsx.
   */
  const guardar = async (datos, archivo) => {
    const esNueva = enEdicion === null;

    const carga = esNueva
      ? await CrearCargaFamiliar(id, datos)
      : await ActualizarCargaFamiliar(enEdicion.id, datos);

    const cargaId = carga?.id ?? enEdicion?.id;
    if (archivo && cargaId) {
      await SubirArchivoCarga(cargaId, archivo);
    }

    setEnEdicion(undefined);
    toast.success(esNueva ? "Carga familiar registrada." : "Carga familiar actualizada.");
    recargar();
  };

  const confirmarEliminar = (motivo) =>
    ejecutar(async () => {
      await EliminarCargaFamiliar(aEliminar.id, motivo);
      setAEliminar(null);
    }, `${aEliminar?.nombresCompletos ?? "El registro"} se quitó de las cargas familiares.`);

  const descargar = (fila) =>
    ejecutar(() => DescargarArchivoCarga(fila.id, fila.archivo?.nombreOriginal));

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando las cargas familiares…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !cargas) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar las cargas familiares</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} />

      <Tarjeta>
        <Acciones style={{ justifyContent: "space-between" }}>
          <div style={{ minWidth: 160 }}>
            <CampoLabel etiqueta="Año">
              <SelectUI
                options={OPCIONES_ANIO}
                value={opcionAnio}
                onChange={(opcion) => setAnio(opcion?.value ?? ANIO_ACTUAL)}
                isSearchable={false}
                isClearable={false}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
          </div>
          <ButtonUI
            text="Agregar hijo/a"
            iconLeft="FaPlus"
            onClick={() => setEnEdicion(null)}
            disabled={ocupado}
          />
        </Acciones>
      </Tarjeta>

      <Tarjeta $sinRelleno>
        {cargas.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaChildren" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin cargas familiares registradas para {anio}</strong>
            <TextoTenue>Use &quot;Agregar hijo/a&quot; para registrar la primera.</TextoTenue>
          </Vacio>
        ) : (
          <TablaCargasFamiliares
            cargas={cargas}
            ocupado={ocupado}
            onEditar={setEnEdicion}
            onEliminar={setAEliminar}
            onDescargar={descargar}
          />
        )}
      </Tarjeta>

      <ModalCargaFamiliar
        abierto={enEdicion !== undefined}
        carga={enEdicion}
        onCerrar={() => setEnEdicion(undefined)}
        onConfirmar={guardar}
      />

      <ModalEliminarCarga
        abierto={aEliminar !== null}
        carga={aEliminar}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
      />
    </Contenedor>
  );
};

export default ColCargasFamiliares;
