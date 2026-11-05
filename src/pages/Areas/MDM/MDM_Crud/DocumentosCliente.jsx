import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import {
  getArchivoDocumentoClienteMDM,
  getDocumentosClienteMDM,
} from "services/mdmService";

/* Pestaña "Documentos" del detalle del cliente: a la izquierda el listado de los
   archivos del expediente y a la derecha
   un visor que muestra la imagen o el PDF seleccionado. */

const Cuerpo = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Lista = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 70vh;
  overflow: auto;
`;

const Fila = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $activa }) => ($activa ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $activa }) =>
    $activa ? `${theme.colors.primary}14` : theme.colors.backgroundCard || theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextoFila = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  & > span:first-child {
    font-size: 13px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
`;

const Visor = styled.div`
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
`;

const BarraVisor = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  & > :first-child {
    flex: 1;
    min-width: 160px;
    overflow-wrap: anywhere;
  }
`;

const Lienzo = styled.div`
  height: 70vh;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background || "#f3f4f6"};

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
  }
`;

const Centro = styled.div`
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 30px 20px;
`;

const iconoDe = (categoria) =>
  categoria === "pdf" ? "FaFilePdf" : categoria === "imagen" ? "FaFileImage" : "FaFile";

const formatearTamanio = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const formatearFecha = (iso) => {
  if (!iso) return "";
  const f = new Date(iso);
  return Number.isNaN(f.getTime())
    ? ""
    : f.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
};

const DocumentosCliente = ({ clienteId }) => {
  const { theme } = useTheme();
  const [documentos, setDocumentos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorLista, setErrorLista] = useState(null);

  const [seleccionado, setSeleccionado] = useState(null);
  const [vista, setVista] = useState({ url: null, cargando: false, error: null });

  /* Cada apertura lleva un número: si el usuario cambia de documento antes de que
     llegue el anterior, la respuesta vieja se descarta en lugar de pisar la nueva. */
  const aperturaActual = useRef(0);
  const urlActual = useRef(null);

  const liberarUrl = () => {
    if (urlActual.current) {
      window.URL.revokeObjectURL(urlActual.current);
      urlActual.current = null;
    }
  };

  const cargarDocumentos = useCallback(async () => {
    setCargando(true);
    setErrorLista(null);
    try {
      const data = await getDocumentosClienteMDM(clienteId);
      setDocumentos(data);
      setSeleccionado((actual) => data.find((d) => d.CLAVE === actual?.CLAVE) ?? data[0] ?? null);
    } catch (err) {
      setDocumentos([]);
      setErrorLista("No se pudieron cargar los documentos del cliente");
    } finally {
      setCargando(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  /* Al elegir un documento se baja del API y se muestra con un object URL. */
  useEffect(() => {
    const numero = ++aperturaActual.current;
    liberarUrl();

    if (!seleccionado) {
      setVista({ url: null, cargando: false, error: null });
      return undefined;
    }

    // Lo que el visor no sabe mostrar no se baja hasta que el usuario lo pida
    if (seleccionado.CATEGORIA === "otro") {
      setVista({ url: null, cargando: false, error: null });
      return undefined;
    }

    setVista({ url: null, cargando: true, error: null });

    (async () => {
      try {
        const blob = await getArchivoDocumentoClienteMDM(
          clienteId,
          seleccionado.CLAVE,
          seleccionado.TIPO_MIME,
        );
        if (numero !== aperturaActual.current) return;
        const url = window.URL.createObjectURL(blob);
        urlActual.current = url;
        setVista({ url, cargando: false, error: null });
      } catch (err) {
        if (numero !== aperturaActual.current) return;
        setVista({ url: null, cargando: false, error: err.message });
      }
    })();

    return undefined;
  }, [clienteId, seleccionado]);

  /* Al salir de la pestaña no queda el archivo en memoria */
  useEffect(
    () => () => {
      aperturaActual.current++;
      liberarUrl();
    },
    [],
  );

  const descargar = async () => {
    if (!seleccionado) return;
    try {
      const url =
        vista.url ||
        window.URL.createObjectURL(
          await getArchivoDocumentoClienteMDM(clienteId, seleccionado.CLAVE, seleccionado.TIPO_MIME),
        );
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = seleccionado.NOMBRE;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      // Si se creó solo para descargar, se libera; el del visor se libera al cambiar de documento
      if (!vista.url) setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const abrirEnPestana = () => {
    if (vista.url) window.open(vista.url, "_blank", "noopener");
  };

  if (cargando && documentos === null) {
    return (
      <Centro>
        <IconUI name="FaSpinner" size={26} color={theme.colors.primary} />
        <TextUI weight="bold">Cargando documentos...</TextUI>
      </Centro>
    );
  }

  if (errorLista) {
    return (
      <Centro>
        <IconUI name="FaTriangleExclamation" size={26} color={theme.colors.error} />
        <TextUI weight="bold">{errorLista}</TextUI>
        <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargarDocumentos} />
      </Centro>
    );
  }

  if (!documentos || documentos.length === 0) {
    return (
      <Centro>
        <IconUI name="FaFolderOpen" size={26} color={theme.colors.textSecondary} />
        <TextUI weight="bold">Este cliente no tiene documentos</TextUI>
        <TextUI size="12px" color={theme.colors.textSecondary}>
          Los documentos se buscan por la identificación del cliente en su expediente.
        </TextUI>
      </Centro>
    );
  }

  const renderVisor = () => {
    if (vista.cargando) {
      return (
        <Centro>
          <IconUI name="FaSpinner" size={26} color={theme.colors.primary} />
          <TextUI weight="bold">Cargando documento...</TextUI>
        </Centro>
      );
    }

    if (vista.error) {
      return (
        <Centro>
          <IconUI name="FaTriangleExclamation" size={26} color={theme.colors.error} />
          <TextUI weight="bold">{vista.error}</TextUI>
        </Centro>
      );
    }

    if (seleccionado?.CATEGORIA === "otro") {
      return (
        <Centro>
          <IconUI name="FaFile" size={30} color={theme.colors.textSecondary} />
          <TextUI weight="bold">Este tipo de archivo no tiene vista previa</TextUI>
          <TextUI size="12px" color={theme.colors.textSecondary}>
            Descárguelo para abrirlo.
          </TextUI>
        </Centro>
      );
    }

    if (!vista.url) return null;

    return seleccionado.CATEGORIA === "imagen" ? (
      <img src={vista.url} alt={seleccionado.NOMBRE} />
    ) : (
      <iframe src={vista.url} title={seleccionado.NOMBRE} />
    );
  };

  return (
    <Cuerpo>
      <Lista>
        {documentos.map((d) => (
          <Fila
            key={d.CLAVE}
            type="button"
            theme={theme}
            $activa={d.CLAVE === seleccionado?.CLAVE}
            onClick={() => setSeleccionado(d)}
          >
            <IconUI
              name={iconoDe(d.CATEGORIA)}
              size={20}
              color={d.CATEGORIA === "pdf" ? theme.colors.error : theme.colors.primary}
            />
            <TextoFila>
              <span>{d.NOMBRE}</span>
              <TextUI size="11px" color={theme.colors.textSecondary}>
                {[formatearTamanio(d.TAMANIO_BYTES), formatearFecha(d.MODIFICADO)]
                  .filter(Boolean)
                  .join(" · ")}
              </TextUI>
            </TextoFila>
          </Fila>
        ))}
      </Lista>

      <Visor theme={theme}>
        <BarraVisor theme={theme}>
          <TextUI weight="bold" size="13px">
            {seleccionado?.NOMBRE}
          </TextUI>
          <ButtonUI
            text="Abrir en pestaña"
            iconLeft="FaUpRightFromSquare"
            variant="outlined"
            onClick={abrirEnPestana}
            disabled={!vista.url}
          />
          <ButtonUI text="Descargar" iconLeft="FaDownload" onClick={descargar} />
        </BarraVisor>
        <Lienzo theme={theme}>{renderVisor()}</Lienzo>
      </Visor>
    </Cuerpo>
  );
};

export default DocumentosCliente;
