import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
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
  colorDeTono,
  Contenedor,
  CuerpoAtencion,
  DetalleAtencion,
  Kpi,
  KpiTitulo,
  KpiValor,
  PistaProgreso,
  Rejilla,
  RellenoProgreso,
  Tarjeta,
  TextoTenue,
  TituloAtencion,
  Vacio,
} from "../componentes/piezas";

/**
 * Tarjeta-invitación para registrar cónyuge/unión libre, visible de entrada en
 * la pantalla en vez de depender de que alguien abra el selector genérico del
 * modal y repare en esa opción. Mismo lenguaje visual que Kpi/EnlaceAtencion
 * (borde y fondo tintados al tono), pero clicable como un botón porque abre
 * el modal en vez de navegar.
 */
const TarjetaInvitacion = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme?.colors?.text};
  background: ${({ theme, $tono = "info" }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.08 })};
  border: 1px dashed ${({ theme, $tono = "info" }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.5 })};

  &:hover:not(:disabled) {
    border-style: solid;
    border-color: ${({ theme, $tono = "info" }) => colorDeTono(theme, $tono)};
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }
`;

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
  // Qué tipo de carga precargar al abrir el modal en blanco: null = el genérico
  // "Agregar carga familiar" (queda en "Hijo/a" por omisión dentro del modal);
  // "Conyuge"/"UnionLibre" cuando se abre desde su tarjeta-invitación.
  const [parentescoSugerido, setParentescoSugerido] = useState(null);

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

  const hijosRegistrados = useMemo(
    () => (cargas ?? []).filter((c) => c.parentesco === "Hijo").length,
    [cargas],
  );
  const conyugeRegistrado = useMemo(
    () => (cargas ?? []).some((c) => c.parentesco === "Conyuge"),
    [cargas],
  );
  const unionLibreRegistrada = useMemo(
    () => (cargas ?? []).some((c) => c.parentesco === "UnionLibre"),
    [cargas],
  );

  // "neutro" sin número declarado todavía, "exito" cuando ya están todos los
  // hijos declarados en Datos registrados acá, "aviso" mientras falten.
  const tonoHijos =
    !ficha?.numeroHijos ? "neutro" : hijosRegistrados >= ficha.numeroHijos ? "exito" : "aviso";

  const abrirNueva = (parentesco = null) => {
    setParentescoSugerido(parentesco);
    setEnEdicion(null);
  };

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
            text="Agregar carga familiar"
            iconLeft="FaPlus"
            onClick={() => abrirNueva(null)}
            disabled={ocupado}
          />
        </Acciones>
      </Tarjeta>

      <Rejilla $min={220}>
        <Kpi $tono={tonoHijos}>
          <KpiTitulo>Hijos registrados</KpiTitulo>
          <KpiValor $tono={tonoHijos}>
            {hijosRegistrados} / {ficha?.numeroHijos ?? "—"}
          </KpiValor>
          <PistaProgreso>
            <RellenoProgreso
              $tono={tonoHijos}
              $porcentaje={ficha?.numeroHijos ? (hijosRegistrados / ficha.numeroHijos) * 100 : 0}
            />
          </PistaProgreso>
          <TextoTenue>
            {!ficha?.numeroHijos
              ? "Declare cuántos hijos tiene en la pestaña Datos para habilitar el registro."
              : hijosRegistrados >= ficha.numeroHijos
                ? "Completo: ya están registrados todos los hijos declarados."
                : `Faltan ${ficha.numeroHijos - hijosRegistrados} por registrar.`}
          </TextoTenue>
        </Kpi>

        {ficha?.estadoCivil === "Casado" &&
          (conyugeRegistrado ? (
            <Kpi $tono="exito">
              <KpiTitulo>Cónyuge</KpiTitulo>
              <KpiValor $tono="exito">Registrado</KpiValor>
              <TextoTenue>Ya consta como carga familiar.</TextoTenue>
            </Kpi>
          ) : (
            <TarjetaInvitacion
              type="button"
              $tono="info"
              onClick={() => abrirNueva("Conyuge")}
              disabled={ocupado}
            >
              <CirculoIcono $tono="info" $tamano={40}>
                <IconUI name="FaUserPlus" size={16} color={theme?.colors?.info} />
              </CirculoIcono>
              <CuerpoAtencion>
                <TituloAtencion>Agregar cónyuge</TituloAtencion>
                <DetalleAtencion $tono="info">
                  Datos registra su estado civil como Casado/a.
                </DetalleAtencion>
              </CuerpoAtencion>
            </TarjetaInvitacion>
          ))}

        {ficha?.estadoCivil === "UnionLibre" &&
          (unionLibreRegistrada ? (
            <Kpi $tono="exito">
              <KpiTitulo>Unión libre</KpiTitulo>
              <KpiValor $tono="exito">Registrado</KpiValor>
              <TextoTenue>Ya consta como carga familiar.</TextoTenue>
            </Kpi>
          ) : (
            <TarjetaInvitacion
              type="button"
              $tono="info"
              onClick={() => abrirNueva("UnionLibre")}
              disabled={ocupado}
            >
              <CirculoIcono $tono="info" $tamano={40}>
                <IconUI name="FaUserPlus" size={16} color={theme?.colors?.info} />
              </CirculoIcono>
              <CuerpoAtencion>
                <TituloAtencion>Agregar unión libre</TituloAtencion>
                <DetalleAtencion $tono="info">
                  Datos registra su estado civil como Unión libre.
                </DetalleAtencion>
              </CuerpoAtencion>
            </TarjetaInvitacion>
          ))}
      </Rejilla>

      <Tarjeta $sinRelleno>
        {cargas.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaChildren" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin cargas familiares registradas para {anio}</strong>
            <TextoTenue>Use &quot;Agregar carga familiar&quot; para registrar la primera.</TextoTenue>
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
        parentescoInicial={parentescoSugerido}
        estadoCivil={ficha?.estadoCivil}
        numeroHijos={ficha?.numeroHijos}
        cargasExistentes={cargas}
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
