import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso, FilaFormulario, TextoTenue } from "./piezas";
import {
  ACCEPT_ARCHIVOS,
  ETIQUETA_DOCUMENTO_POR_PARENTESCO,
  ETIQUETA_PARENTESCO_CARGA,
  ETIQUETA_TIPO_DISCAPACIDAD,
  MIME_PERMITIDOS,
  PARENTESCO_CARGA,
  TAMANIO_MAXIMO_BYTES,
  TIPO_DISCAPACIDAD,
  formatearTamanio,
} from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";

/**
 * Alta y edición de una carga familiar (hijo/a, cónyuge, unión libre u otro
 * dependiente), con su documento de respaldo.
 *
 * Mismo criterio que ColaboradorForm.jsx para discapacidad (checkbox + % +
 * tipo) y que ModalSubirDocumento.jsx para el archivo: <input type="file">
 * nativo, MIME y tamaño validados en cliente como cortesía, la firma real la
 * comprueba el servidor.
 *
 * Guardar es SIEMPRE dos llamadas encadenadas, nunca una transacción del lado
 * cliente: primero los datos (crear o actualizar) y, si hay archivo elegido,
 * la subida a continuación. Es el mismo patrón que ColDocumentos.jsx usa para
 * crear-y-luego-subir cuando el documento todavía no tiene fila.
 */

const soloDigitos = (valor) => valor.replace(/\D/g, "");

const OPCIONES_TIPO_DISCAPACIDAD = TIPO_DISCAPACIDAD.map((valor) => ({
  value: valor,
  label: ETIQUETA_TIPO_DISCAPACIDAD[valor] ?? valor,
}));

/**
 * Qué tipos de carga puede elegir este colaborador: Otro siempre, Cónyuge/
 * Unión libre solo si el estado civil de Datos ya lo declara Y todavía no
 * hay una carga de ese tipo, Hijo/a solo mientras no se haya llegado al
 * "Número de hijos" declarado en Datos (salvo que la carga en edición ya sea
 * de ese mismo tipo: esa no consume un cupo nuevo).
 */
const opcionesParentesco = (estadoCivil, numeroHijos, cargasExistentes, cargaEnEdicion) => {
  const cargasDeEseTipo = (tipo) =>
    cargasExistentes.filter((c) => c.parentesco === tipo && c.id !== cargaEnEdicion?.id);

  return PARENTESCO_CARGA.filter((tipo) => {
    if (tipo === "Conyuge") return estadoCivil === "Casado" && cargasDeEseTipo(tipo).length === 0;
    if (tipo === "UnionLibre") return estadoCivil === "UnionLibre" && cargasDeEseTipo(tipo).length === 0;
    if (tipo === "Hijo") {
      return cargaEnEdicion?.parentesco === "Hijo" || cargasDeEseTipo(tipo).length < (numeroHijos ?? 0);
    }
    return true; // Otro siempre disponible.
  }).map((tipo) => ({ value: tipo, label: ETIQUETA_PARENTESCO_CARGA[tipo] }));
};

const VACIO = {
  // "Hijo" como valor por omisión: está siempre disponible sin importar el
  // estado civil, así que es el caso más común al abrir el formulario vacío.
  parentesco: "Hijo",
  parentescoDetalle: "",
  cedula: "",
  apellidos: "",
  nombres: "",
  fechaNacimiento: "",
  tieneDiscapacidad: false,
  porcentajeDiscapacidad: "",
  tipoDiscapacidad: null,
  esBeneficiarioImpuestoRenta: false,
  observacion: "",
};

const desdeCarga = (carga, parentescoInicial) =>
  !carga
    ? { ...VACIO, parentesco: parentescoInicial ?? VACIO.parentesco }
    : {
        parentesco: carga.parentesco ?? "Hijo",
        parentescoDetalle: carga.parentescoDetalle ?? "",
        cedula: carga.cedula ?? "",
        apellidos: carga.apellidos ?? "",
        nombres: carga.nombres ?? "",
        fechaNacimiento: carga.fechaNacimiento ?? "",
        tieneDiscapacidad: carga.tieneDiscapacidad === true,
        porcentajeDiscapacidad:
          carga.porcentajeDiscapacidad === null || carga.porcentajeDiscapacidad === undefined
            ? ""
            : String(carga.porcentajeDiscapacidad),
        tipoDiscapacidad: carga.tipoDiscapacidad ?? null,
        esBeneficiarioImpuestoRenta: carga.esBeneficiarioImpuestoRenta === true,
        observacion: carga.observacion ?? "",
      };

const Selector = ({ onElegir, referencia }) => (
  <input
    ref={referencia}
    type="file"
    accept={ACCEPT_ARCHIVOS}
    onChange={(evento) => onElegir(evento.target.files?.[0] ?? null)}
    style={{ fontSize: 13 }}
  />
);

export const ModalCargaFamiliar = ({
  abierto,
  carga,
  parentescoInicial,
  estadoCivil,
  numeroHijos,
  cargasExistentes = [],
  onCerrar,
  onConfirmar,
}) => {
  const [valores, setValores] = useState(VACIO);
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef(null);

  const opciones = useMemo(
    () => opcionesParentesco(estadoCivil, numeroHijos, cargasExistentes, carga),
    [estadoCivil, numeroHijos, cargasExistentes, carga],
  );

  const cupoHijosLleno =
    carga?.parentesco !== "Hijo" && !opciones.some((opcion) => opcion.value === "Hijo");

  useEffect(() => {
    if (!abierto) return;
    setValores(desdeCarga(carga, parentescoInicial));
    setArchivo(null);
    setErrorArchivo(null);
    setErrores({});
    setEnviando(false);
    // El input de archivo conserva su value entre aperturas y el navegador no
    // deja limpiarlo por estado: hay que tocarlo por referencia.
    if (entrada.current) entrada.current.value = "";
  }, [abierto, carga, parentescoInicial]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const campo = (clave) => (valor) => {
    setValores((previos) => ({ ...previos, [clave]: valor }));
    setErrores((previos) => (previos[clave] ? { ...previos, [clave]: undefined } : previos));
  };

  /**
   * Se valida acá para no gastar la subida de 10 MB por la red y recibir un 400.
   * El servidor igual comprueba tamaño, tipo y la firma real de los bytes: es él
   * quien manda, esto es solo cortesía.
   */
  const elegirArchivo = (nuevo) => {
    setErrorArchivo(null);

    if (!nuevo) {
      setArchivo(null);
      return;
    }

    if (!MIME_PERMITIDOS.includes(nuevo.type)) {
      setErrorArchivo("Solo se admiten archivos PDF o Word (.doc, .docx).");
      setArchivo(null);
      return;
    }

    if (nuevo.size > TAMANIO_MAXIMO_BYTES) {
      setErrorArchivo(`El archivo pesa ${formatearTamanio(nuevo.size)} y el máximo es 10 MB.`);
      setArchivo(null);
      return;
    }

    setArchivo(nuevo);
  };

  const validar = () => {
    const nuevos = {};
    if (!valores.parentesco) nuevos.parentesco = "Elija el tipo de carga familiar.";
    if (valores.parentesco === "Otro" && valores.parentescoDetalle.trim().length < 2) {
      nuevos.parentescoDetalle = "Indique el parentesco (ej. Padre, Hermana).";
    }
    if (valores.apellidos.trim().length < 2) nuevos.apellidos = "Escriba los apellidos.";
    if (valores.nombres.trim().length < 2) nuevos.nombres = "Escriba los nombres.";
    if (!valores.fechaNacimiento) nuevos.fechaNacimiento = "Indique la fecha de nacimiento.";

    // Misma regla que discapacidad en ColaboradorForm.jsx.
    if (valores.tieneDiscapacidad) {
      const porcentaje = Number(valores.porcentajeDiscapacidad);
      if (
        valores.porcentajeDiscapacidad === "" ||
        !Number.isFinite(porcentaje) ||
        porcentaje <= 0 ||
        porcentaje > 100
      ) {
        nuevos.porcentajeDiscapacidad = "Indique el porcentaje de discapacidad.";
      }
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;
    if (!validar()) return;

    const aTexto = (valor) => {
      const limpio = (valor ?? "").trim();
      return limpio.length === 0 ? null : limpio;
    };

    const datos = {
      parentesco: valores.parentesco,
      parentescoDetalle: valores.parentesco === "Otro" ? aTexto(valores.parentescoDetalle) : null,
      cedula: aTexto(valores.cedula),
      apellidos: valores.apellidos.trim(),
      nombres: valores.nombres.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      tieneDiscapacidad: valores.tieneDiscapacidad === true,
      porcentajeDiscapacidad:
        valores.tieneDiscapacidad && valores.porcentajeDiscapacidad !== ""
          ? Number(valores.porcentajeDiscapacidad)
          : null,
      tipoDiscapacidad: valores.tieneDiscapacidad ? (valores.tipoDiscapacidad ?? null) : null,
      esBeneficiarioImpuestoRenta: valores.esBeneficiarioImpuestoRenta === true,
      observacion: aTexto(valores.observacion),
    };

    setEnviando(true);
    try {
      await onConfirmar(datos, archivo);
    } catch (e) {
      toast.error(e.message || "No se pudo guardar la carga familiar");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={carga ? "Editar carga familiar" : "Agregar carga familiar"}
      width="640px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FilaFormulario $min={200}>
            <CampoLabel etiqueta="Tipo de carga familiar" requerido error={errores.parentesco}>
              <SelectUI
                options={opciones}
                value={opciones.find((opcion) => opcion.value === valores.parentesco) ?? null}
                onChange={(opcion) => campo("parentesco")(opcion?.value ?? null)}
                isSearchable={false}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
            {valores.parentesco === "Otro" && (
              <CampoLabel
                etiqueta="¿Qué parentesco?"
                requerido
                error={errores.parentescoDetalle}
                ayuda="Ej. Padre, Hermana con discapacidad."
              >
                <InputUI
                  value={valores.parentescoDetalle}
                  onChange={campo("parentescoDetalle")}
                  maxLength={60}
                />
              </CampoLabel>
            )}
          </FilaFormulario>

          {cupoHijosLleno && (
            <TextoTenue>
              {numeroHijos
                ? `Hijo/a no disponible: ya se registraron los ${numeroHijos} hijo(s) declarados en Datos. Suba ese número para agregar otro.`
                : "Hijo/a no disponible: declare cuántos hijos tiene el colaborador en la pestaña Datos para poder registrarlos aquí."}
            </TextoTenue>
          )}

          <FilaFormulario>
            <CampoLabel etiqueta="Apellidos" requerido error={errores.apellidos}>
              <InputUI
                value={valores.apellidos}
                onChange={(valor) => campo("apellidos")(valor.toUpperCase())}
                maxLength={120}
                placeholder="PEREZ LOPEZ"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombres" requerido error={errores.nombres}>
              <InputUI
                value={valores.nombres}
                onChange={(valor) => campo("nombres")(valor.toUpperCase())}
                maxLength={120}
                placeholder="JUAN CARLOS"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Cédula" ayuda="Solo números.">
              <InputUI
                value={valores.cedula}
                onChange={(valor) => campo("cedula")(soloDigitos(valor))}
                maxLength={20}
              />
            </CampoLabel>
            <CampoLabel
              etiqueta="Fecha de nacimiento"
              requerido
              error={errores.fechaNacimiento}
            >
              <InputUI
                type="date"
                value={valores.fechaNacimiento}
                onChange={campo("fechaNacimiento")}
                max={hoyIso()}
              />
            </CampoLabel>
          </FilaFormulario>

          <div>
            <CheckboxUI
              name="tieneDiscapacidad"
              checked={valores.tieneDiscapacidad === true}
              onChange={(_nombre, marcado) => campo("tieneDiscapacidad")(marcado)}
              label="Tiene discapacidad"
            />
          </div>

          {valores.tieneDiscapacidad && (
            <FilaFormulario $min={200}>
              <CampoLabel
                etiqueta="% de discapacidad"
                requerido
                error={errores.porcentajeDiscapacidad}
              >
                <InputUI
                  type="number"
                  value={valores.porcentajeDiscapacidad}
                  onChange={campo("porcentajeDiscapacidad")}
                  min={0.01}
                  max={100}
                  step="0.01"
                />
              </CampoLabel>
              <CampoLabel etiqueta="Tipo de discapacidad">
                <SelectUI
                  options={OPCIONES_TIPO_DISCAPACIDAD}
                  value={
                    OPCIONES_TIPO_DISCAPACIDAD.find(
                      (opcion) => opcion.value === valores.tipoDiscapacidad,
                    ) ?? null
                  }
                  onChange={(opcion) => campo("tipoDiscapacidad")(opcion?.value ?? null)}
                  isClearable
                  placeholder="Sin registrar"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
            </FilaFormulario>
          )}

          <div>
            <CheckboxUI
              name="esBeneficiarioImpuestoRenta"
              checked={valores.esBeneficiarioImpuestoRenta === true}
              onChange={(_nombre, marcado) => campo("esBeneficiarioImpuestoRenta")(marcado)}
              label="Beneficiario de impuesto a la renta"
            />
          </div>

          <CampoLabel etiqueta="Observación">
            <AreaTexto
              value={valores.observacion}
              onChange={(evento) => campo("observacion")(evento.target.value)}
              maxLength={1000}
              rows={2}
            />
          </CampoLabel>

          {carga?.archivo?.nombreOriginal && (
            <Aviso $tono="info">
              Ya tiene el documento subido: {carga.archivo?.nombreOriginal}. Elija un archivo
              nuevo solo si quiere reemplazarlo.
            </Aviso>
          )}

          <CampoLabel
            etiqueta={
              carga?.archivo?.nombreOriginal
                ? `Reemplazar ${(ETIQUETA_DOCUMENTO_POR_PARENTESCO[valores.parentesco] ?? "documento").toLowerCase()}`
                : (ETIQUETA_DOCUMENTO_POR_PARENTESCO[valores.parentesco] ?? "Documento de respaldo")
            }
            error={errorArchivo}
            ayuda="PDF o Word (.doc, .docx), hasta 10 MB. También puede subirlo más tarde desde esta misma pantalla."
          >
            <Selector referencia={entrada} onElegir={elegirArchivo} />
          </CampoLabel>

          {archivo && (
            <TextoTenue>
              {archivo.name} · {formatearTamanio(archivo.size)}
            </TextoTenue>
          )}

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

export default ModalCargaFamiliar;
