import React, { useEffect, useRef, useState } from "react";
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
  ETIQUETA_TIPO_DISCAPACIDAD,
  MIME_PERMITIDOS,
  TAMANIO_MAXIMO_BYTES,
  TIPO_DISCAPACIDAD,
  formatearTamanio,
} from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";

/**
 * Alta y edición de una carga familiar (hijo/a), con su partida de nacimiento.
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

const VACIO = {
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

const desdeCarga = (carga) =>
  !carga
    ? VACIO
    : {
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

export const ModalCargaFamiliar = ({ abierto, carga, onCerrar, onConfirmar }) => {
  const [valores, setValores] = useState(VACIO);
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    setValores(desdeCarga(carga));
    setArchivo(null);
    setErrorArchivo(null);
    setErrores({});
    setEnviando(false);
    // El input de archivo conserva su value entre aperturas y el navegador no
    // deja limpiarlo por estado: hay que tocarlo por referencia.
    if (entrada.current) entrada.current.value = "";
  }, [abierto, carga]);

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
      setErrorArchivo("Solo se admiten archivos PDF, JPG o PNG.");
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
      title={carga ? "Editar carga familiar" : "Agregar hijo/a"}
      width="640px"
      maxWidth="96vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              Ya tiene la partida de nacimiento subida: {carga.archivo?.nombreOriginal}. Elija un
              archivo nuevo solo si quiere reemplazarla.
            </Aviso>
          )}

          <CampoLabel
            etiqueta={
              carga?.archivo?.nombreOriginal
                ? "Reemplazar partida de nacimiento"
                : "Partida de nacimiento"
            }
            error={errorArchivo}
            ayuda="PDF, JPG o PNG, hasta 10 MB. También puede subirla más tarde desde esta misma pantalla."
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
