import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import {
  IniciarReporteDdmrp,
  ConsultarReporteDdmrp,
  DescargarArchivoDdmrp,
} from "services/ddmrpService";

/* Cada cuántos ms se pregunta al backend por el estado. El script tarda
   minutos, así que consultar más seguido solo añade ruido. */
const INTERVALO_CONSULTA_MS = 4000;

/* Corte de seguridad: si a los 30 minutos sigue "EN_PROCESO" se deja de
   consultar para no dejar un intervalo vivo indefinidamente. */
const ESPERA_MAXIMA_MS = 30 * 60 * 1000;

const Contenedor = styled.div`
  padding: 24px;
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Tarjeta = styled.div`
  background-color: ${({ theme }) => theme?.colors?.backgroundCard || "#fff"};
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 760px;
`;

const Encabezado = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CirculoIcono = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: ${({ theme, $color }) =>
    `${$color || theme?.colors?.primary || "#000"}1f`};
`;

/* TextUI renderiza un <span> inline-block: dos seguidos quedan pegados en la
   misma línea. Este contenedor los apila y les da aire entre sí. */
const BloqueTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const Fila = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Aviso = styled.div`
  border-left: 3px solid ${({ theme, $color }) => $color || theme?.colors?.border};
  background-color: ${({ theme }) => theme?.colors?.backgroundLight || "#fafafa"};
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Consola = styled.pre`
  margin: 0;
  max-height: 160px;
  overflow: auto;
  font-size: 11px;
  line-height: 1.5;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
  background-color: ${({ theme }) => theme?.colors?.background || "#f5f5f5"};
  border: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};
  border-radius: 6px;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ListaArchivos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ArchivoFila = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};
  border-radius: 8px;
  background-color: ${({ theme }) => theme?.colors?.background || "#f5f5f5"};
`;

const formatearTamano = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatearDuracion = (ms) => {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return min > 0 ? `${min} min ${seg} s` : `${seg} s`;
};

export const Ddmrp_Report = () => {
  const { theme } = useTheme();

  const [estado, setEstado] = useState("INACTIVO"); // INACTIVO | EN_PROCESO | COMPLETADO | ERROR
  const [trabajoId, setTrabajoId] = useState(null);
  const [archivos, setArchivos] = useState([]);
  const [mensajeError, setMensajeError] = useState("");
  const [log, setLog] = useState([]);
  const [transcurrido, setTranscurrido] = useState(0);
  /* Nombre del archivo que se está bajando, para deshabilitar solo su botón. */
  const [descargandoNombre, setDescargandoNombre] = useState(null);

  const intervaloRef = useRef(null);
  const cronometroRef = useRef(null);
  const inicioRef = useRef(null);

  const detenerConsulta = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    if (cronometroRef.current) {
      clearInterval(cronometroRef.current);
      cronometroRef.current = null;
    }
  }, []);

  /* Al desmontar hay que cortar los intervalos: si no, siguen consultando y
     actualizando estado sobre un componente que ya no existe. */
  useEffect(() => detenerConsulta, [detenerConsulta]);

  /* La descarga la dispara el usuario con el botón de cada archivo. */
  const descargarUno = useCallback(
    async (nombre) => {
      setDescargandoNombre(nombre);
      try {
        await DescargarArchivoDdmrp(trabajoId, nombre);
      } catch (err) {
        console.error("Error al descargar el archivo DDMRP:", err);
        const detalle =
          err?.response?.status === 404
            ? "El archivo ya no está disponible: el reporte expiró. Generalo de nuevo."
            : "No se pudo descargar el archivo.";
        toast.error(detalle);
      } finally {
        setDescargandoNombre(null);
      }
    },
    [trabajoId]
  );

  const consultar = useCallback(
    async (id) => {
      try {
        const datos = await ConsultarReporteDdmrp(id);
        setLog(datos.log || []);

        if (datos.estado === "COMPLETADO") {
          detenerConsulta();
          setEstado("COMPLETADO");
          setArchivos(datos.archivos || []);
          return;
        }

        if (datos.estado === "ERROR") {
          detenerConsulta();
          setEstado("ERROR");
          setMensajeError(datos.error || "El reporte terminó con error.");
          return;
        }

        if (Date.now() - inicioRef.current > ESPERA_MAXIMA_MS) {
          detenerConsulta();
          setEstado("ERROR");
          setMensajeError(
            "El reporte superó los 30 minutos y se dejó de consultar. " +
              "Puede que siga ejecutándose en el servidor; revisá los logs del backend."
          );
        }
      } catch (err) {
        detenerConsulta();
        setEstado("ERROR");
        const detalle =
          err?.response?.status === 404
            ? "El reporte ya no está disponible (expiró o el backend se reinició)."
            : err?.response?.data?.message || err.message;
        setMensajeError(detalle);
      }
    },
    [detenerConsulta]
  );

  const generar = useCallback(async () => {
    detenerConsulta();
    setEstado("EN_PROCESO");
    setArchivos([]);
    setMensajeError("");
    setLog([]);
    setTranscurrido(0);
    inicioRef.current = Date.now();

    try {
      const trabajo = await IniciarReporteDdmrp();
      setTrabajoId(trabajo.id);

      // El backend puede responder con un trabajo ya terminado (por ejemplo si
      // se pidió de nuevo uno recién completado): se resuelve en la primera
      // consulta, sin esperar al primer tick del intervalo.
      await consultar(trabajo.id);

      if (intervaloRef.current === null) {
        intervaloRef.current = setInterval(() => consultar(trabajo.id), INTERVALO_CONSULTA_MS);
        cronometroRef.current = setInterval(
          () => setTranscurrido(Date.now() - inicioRef.current),
          1000
        );
      }
    } catch (err) {
      setEstado("ERROR");
      setMensajeError(err?.response?.data?.details || err?.response?.data?.message || err.message);
    }
  }, [consultar, detenerConsulta]);

  const enProceso = estado === "EN_PROCESO";

  return (
    <Contenedor>
      <Encabezado>
        <CirculoIcono $color={theme?.colors?.primary}>
          <IconUI name="FaChartLine" size={22} color={theme?.colors?.primary} />
        </CirculoIcono>
        <BloqueTexto>
          <TextUI size="18px" weight="700">
            Reporte DDMRP
          </TextUI>
          <TextUI size="13px" color={theme?.colors?.textSecondary}>
            Maestro de artículos y auditoría DLT / LTF / VF
          </TextUI>
        </BloqueTexto>
      </Encabezado>

      <Tarjeta>
        <TextUI size="13px" color={theme?.colors?.textSecondary}>
          Genera el maestro de artículos consolidando las cinco empresas y la auditoría
          asociada. El proceso consulta SAP HANA y puede tardar varios minutos; los
          archivos quedarán disponibles para descargar al terminar.
        </TextUI>

        <Fila>
          <ButtonUI
            text={enProceso ? "Generando reporte..." : "Generar reporte"}
            iconLeft={enProceso ? "FaSpinner" : "FaFileExcel"}
            disabled={enProceso}
            onClick={generar}
            pcolor={theme?.colors?.primary}
          />
          {enProceso && (
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              Transcurrido: {formatearDuracion(transcurrido)}
            </TextUI>
          )}
        </Fila>

        {enProceso && (
          <Aviso $color={theme?.colors?.info || "#17a2b8"}>
            <TextUI size="12px" weight="600">
              No cierres esta pestaña
            </TextUI>
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              El reporte se está generando en el servidor. Al terminar vas a poder
              descargar los archivos desde aquí.
            </TextUI>
          </Aviso>
        )}

        {estado === "ERROR" && (
          <Aviso $color={theme?.colors?.error || "#dc3545"}>
            <TextUI size="12px" weight="600" color={theme?.colors?.error}>
              No se pudo generar el reporte
            </TextUI>
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              {mensajeError}
            </TextUI>
          </Aviso>
        )}

        {estado === "COMPLETADO" && archivos.length > 0 && (
          <>
            <Aviso $color={theme?.colors?.success || "#28a745"}>
              <TextUI size="12px" weight="600" color={theme?.colors?.success}>
                Reporte generado en {formatearDuracion(transcurrido)}
              </TextUI>
              <TextUI size="12px" color={theme?.colors?.textSecondary}>
                Descargá cada archivo con su botón.
              </TextUI>
            </Aviso>

            <ListaArchivos>
              {archivos.map((archivo) => (
                <ArchivoFila key={archivo.nombre}>
                  <Fila>
                    <IconUI
                      name="FaFileExcel"
                      size={16}
                      color={theme?.colors?.success || "#28a745"}
                    />
                    <BloqueTexto>
                      <TextUI size="12px" weight="600">
                        {archivo.nombre}
                      </TextUI>
                      <TextUI size="11px" color={theme?.colors?.textSecondary}>
                        {formatearTamano(archivo.bytes)}
                      </TextUI>
                    </BloqueTexto>
                  </Fila>
                  <ButtonUI
                    text="Descargar"
                    iconLeft="FaDownload"
                    variant="outlined"
                    disabled={descargandoNombre === archivo.nombre}
                    onClick={() => descargarUno(archivo.nombre)}
                    pcolor={theme?.colors?.success || "#28a745"}
                  />
                </ArchivoFila>
              ))}
            </ListaArchivos>
          </>
        )}

        {log.length > 0 && (
          <div>
            <TextUI size="12px" weight="600" style={{ marginBottom: "6px", display: "block" }}>
              Avance del proceso
            </TextUI>
            <Consola>{log.join("\n")}</Consola>
          </div>
        )}
      </Tarjeta>
    </Contenedor>
  );
};

export default Ddmrp_Report;
