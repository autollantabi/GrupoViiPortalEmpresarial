import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CampoLabel } from "./CampoLabel";
import { Acciones, Aviso, FilaFormulario, TextoTenue } from "./piezas";
import {
  ACCEPT_ARCHIVOS,
  ESTADO_ENTREGA,
  formatearTamanio,
  MIME_PERMITIDOS,
  TAMANIO_MAXIMO_BYTES,
} from "../utils/constantesDotacion";
import { hoyIso } from "../utils/fechas";

/**
 * Sube o reemplaza el archivo de un documento.
 *
 * Se usa <input type="file"> nativo y no InputFileUI del kit: hace falta control
 * de `accept`, del tamaño y del reset del valor, y envolver el del kit para eso
 * daría más código que usar el nativo.
 *
 * Reemplazar NO sobreescribe: el backend jubila la versión anterior e inserta la
 * siguiente. Eso es lo que hace que la documentación siga siendo editable después
 * de entregada sin perder lo que había, y el modal lo dice para que nadie dude.
 */

const Selector = ({ onElegir, referencia }) => (
  <input
    ref={referencia}
    type="file"
    accept={ACCEPT_ARCHIVOS}
    onChange={(evento) => onElegir(evento.target.files?.[0] ?? null)}
    style={{ fontSize: 13 }}
  />
);

export const ModalSubirDocumento = ({ abierto, documento, onCerrar, onConfirmar }) => {
  const [archivo, setArchivo] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(hoyIso());
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    setArchivo(null);
    setFechaEntrega(documento?.fechaEntrega ?? hoyIso());
    setError(null);
    setEnviando(false);
    // El input de archivo conserva su value entre aperturas y el navegador no
    // deja limpiarlo por estado: hay que tocarlo por referencia.
    if (entrada.current) entrada.current.value = "";
  }, [abierto, documento]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  /**
   * Se valida acá para no gastar la subida de 10 MB por la red y recibir un 400.
   * El servidor igual comprueba tamaño, tipo y la firma real de los bytes: es él
   * quien manda, esto es solo cortesía.
   */
  const elegir = (nuevo) => {
    setError(null);

    if (!nuevo) {
      setArchivo(null);
      return;
    }

    if (!MIME_PERMITIDOS.includes(nuevo.type)) {
      setError("Solo se admiten archivos PDF, JPG o PNG.");
      setArchivo(null);
      return;
    }

    if (nuevo.size > TAMANIO_MAXIMO_BYTES) {
      setError(`El archivo pesa ${formatearTamanio(nuevo.size)} y el máximo es 10 MB.`);
      setArchivo(null);
      return;
    }

    setArchivo(nuevo);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (!archivo) {
      setError("Elija un archivo.");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar(archivo, { fechaEntrega });
    } catch (e) {
      toast.error(e.message || "No se pudo subir el archivo");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !documento) return null;

  const pendiente = documento.estado === ESTADO_ENTREGA.PENDIENTE;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={documento.archivo ? "Reemplazar archivo" : "Subir archivo"}
      width="560px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <strong>{documento.tipoNombre}</strong>
            {documento.etiqueta && <strong> · {documento.etiqueta}</strong>}
            {documento.descripcion && (
              <>
                <br />
                <TextoTenue>{documento.descripcion}</TextoTenue>
              </>
            )}
          </div>

          {documento.archivo && (
            <Aviso $tono="info">
              Ahora está la versión {documento.archivo.version}:{" "}
              {documento.archivo.nombreOriginal}. Al subir el reemplazo se guarda como
              versión {documento.archivo.version + 1} y la anterior <strong>no se borra</strong>:
              se puede seguir descargando.
            </Aviso>
          )}

          <CampoLabel
            etiqueta="Archivo"
            requerido
            error={error}
            ayuda="PDF, JPG o PNG, hasta 10 MB."
          >
            <Selector referencia={entrada} onElegir={elegir} />
          </CampoLabel>

          {archivo && (
            <TextoTenue>
              {archivo.name} · {formatearTamanio(archivo.size)}
            </TextoTenue>
          )}

          {/* La fecha solo se ofrece si está pendiente: subir el escaneo suele ser
              el momento en que se da por entregado. Si ya estaba entregado, el
              backend ignora este campo y no se muestra. */}
          {pendiente && (
            <FilaFormulario $min={200}>
              <CampoLabel
                etiqueta="Fecha de entrega"
                ayuda="Al subirlo se marca como entregado con esta fecha."
              >
                <InputUI
                  type="date"
                  value={fechaEntrega ?? ""}
                  onChange={(valor) => setFechaEntrega(valor)}
                  max={hoyIso()}
                />
              </CampoLabel>
            </FilaFormulario>
          )}

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Subiendo…" : "Subir"}
              iconLeft="FaUpload"
              disabled={enviando || !archivo}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalSubirDocumento;
