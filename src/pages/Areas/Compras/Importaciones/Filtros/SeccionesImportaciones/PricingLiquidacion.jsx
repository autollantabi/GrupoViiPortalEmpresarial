import React, { useEffect, useRef, useState } from "react";
import { FormRow, ConfirmationDialog } from "components/common/FormComponents";
import { CampoListaArchivos } from "../Selects";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";
import { leerExcelsLiquidacion } from "utils/liquidacionPreciosExcel";
import { crearLiquidacionPrecios } from "services/mdmService";

/* Empresas que generan la liquidación de precios desde el Excel (MDM de precios).
   AUTOMAX sigue con el proceso anterior de Pricing. */
export const EMPRESAS_LIQUIDACION_PRECIOS = ["AUTOLLANTA", "MAXXIMUNDO", "STOX"];

export const usaLiquidacionPrecios = (empresa) =>
  EMPRESAS_LIQUIDACION_PRECIOS.includes(String(empresa || "").toUpperCase());

/* Identifica un archivo cargado para recordar el resultado de su lectura */
const claveArchivo = (archivo) =>
  `${archivo.doc?.name}|${archivo.doc?.size}|${archivo.doc?.lastModified}`;

/**
 * Pricing para AUTOLLANTA, MAXXIMUNDO y STOX: solo se cargan uno o varios Excel
 * de liquidación y se genera una nueva liquidación de precios. Los archivos
 * viven solo en el estado de esta pantalla: si se cierra la ventana de edición
 * se pierden y no se procesa nada.
 *
 * Cada archivo se lee y valida apenas se carga: si no cumple el formato se avisa
 * con una advertencia en esta misma pantalla (sin modal) y no se puede generar.
 */
export const PricingLiquidacion = ({
  datos,
  rolesUsuario = [],
  archivos = [],
  setArchivos = () => {},
}) => {
  const { theme } = useTheme();
  const tieneRolVentas = rolesUsuario.includes("usuario");
  const tieneRolJefatura = rolesUsuario.includes("jefatura");

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [procesando, setProcesando] = useState(false);
  // Los resultados (éxito o error) se muestran como mensajes en esta pantalla, no en modales
  const [mensajeExito, setMensajeExito] = useState("");
  // Error al generar (p. ej. "La importación no existe"): se muestra en esta pantalla, no en el modal
  const [mensajeError, setMensajeError] = useState("");
  const enCurso = useRef(false);
  // Resultado de leer cada archivo al cargarlo: { [clave]: { liquidacion } | { invalido: true } }
  const [lecturas, setLecturas] = useState({});

  useEffect(() => {
    let cancelado = false;
    const pendientes = archivos.filter((a) => a.doc && !lecturas[claveArchivo(a)]);
    if (pendientes.length === 0) return undefined;

    (async () => {
      const nuevas = {};
      for (const archivo of pendientes) {
        const { liquidaciones, errores } = await leerExcelsLiquidacion([archivo.doc]);
        nuevas[claveArchivo(archivo)] =
          errores.length > 0 ? { invalido: true } : { liquidacion: liquidaciones[0] };
      }
      if (!cancelado) setLecturas((prev) => ({ ...prev, ...nuevas }));
    })();

    return () => {
      cancelado = true;
    };
  }, [archivos]); // eslint-disable-line react-hooks/exhaustive-deps

  const leyendo = archivos.some((a) => a.doc && !lecturas[claveArchivo(a)]);
  const archivosInvalidos = archivos.filter((a) => lecturas[claveArchivo(a)]?.invalido);

  // Misma regla que el Pricing anterior: solo Compras (ventas) y con la importación en proceso
  const puedeGenerar =
    !tieneRolJefatura && tieneRolVentas && datos.ESTADO_IMPORTACION === "EN PROCESO";

  const cerrarConfirmacion = () => {
    if (enCurso.current) return;
    setMostrarConfirmacion(false);
  };

  // Un error ocurrido dentro del modal lo cierra y se informa como mensaje en la interfaz
  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarConfirmacion(false);
  };

  const generarLiquidacion = async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    setMensajeError("");
    setMensajeExito("");
    setProcesando(true);

    try {
      // Los archivos ya se leyeron y validaron al cargarlos
      const liquidaciones = archivos.map((a) => ({
        ...lecturas[claveArchivo(a)].liquidacion,
        nombre_archivo: a.doc?.name,
      }));

      // Una liquidación por archivo; si una falla se detiene y se informa cuáles ya quedaron generadas
      const generadas = [];
      for (const { nombre_archivo, ...liquidacion } of liquidaciones) {
        try {
          await crearLiquidacionPrecios({
            importacion_id: parseInt(datos.ID_CARGA, 10),
            ...liquidacion,
          });
          generadas.push(nombre_archivo);
        } catch (error) {
          const motivo =
            error?.response?.data?.message || "No se pudo generar la liquidación de precios";
          const previas = generadas.length
            ? ` Ya se generaron: ${generadas.join(", ")}.`
            : "";
          const origen = archivos.length > 1 ? `${nombre_archivo}: ` : "";
          mostrarError(`${origen}${motivo}.${previas}`);
          // Los archivos ya generados no deben reenviarse al reintentar
          if (generadas.length) setArchivos(archivos.filter((a) => !generadas.includes(a.doc?.name)));
          return;
        }
      }
      // Los archivos ya cumplieron su función: se limpian y se informa en la pantalla
      setArchivos([]);
      setMensajeExito("Liquidación de precios generada");
      setMostrarConfirmacion(false);
    } catch (error) {
      mostrarError("No se pudo generar la liquidación de precios");
    } finally {
      enCurso.current = false;
      setProcesando(false);
    }
  };

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        PRICING - Excel Liquidación de Precios
      </SectionImportacionesTitle>

      <FormImportacionesGrid>
        <FormRow label="CARGA EXCEL:">
          <CampoListaArchivos
            nombreCampo="CARGA"
            setArchivo={(_, valor) => {
              setMensajeError("");
              setMensajeExito("");
              setArchivos(valor);
            }}
            archivos={archivos}
            aceptados=".xlsx"
            id={1}
            limite={10}
            impFinalizado={!puedeGenerar}
          />
        </FormRow>
      </FormImportacionesGrid>

      {archivosInvalidos.length > 0 && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            color: theme.colors.warning,
            border: `1px solid ${theme.colors.warning}`,
            background: `${theme.colors.warning}1a`,
          }}
        >
          <IconUI name="FaTriangleExclamation" size={16} color={theme.colors.warning} />
          <div>
            {archivosInvalidos.map((a) => (
              <div key={claveArchivo(a)}>
                El archivo <b>{a.doc?.name}</b> no cumple con el formato correcto.
              </div>
            ))}
          </div>
        </div>
      )}

      {mensajeExito && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            color: theme.colors.success,
            border: `1px solid ${theme.colors.success}`,
            background: `${theme.colors.success}1a`,
          }}
        >
          <IconUI name="FaCircleCheck" size={16} color={theme.colors.success} />
          <div>{mensajeExito}</div>
        </div>
      )}

      {mensajeError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "6px",
            color: theme.colors.error,
            border: `1px solid ${theme.colors.error}`,
            background: `${theme.colors.error}1a`,
          }}
        >
          <IconUI name="FaCircleXmark" size={16} color={theme.colors.error} />
          <div>{mensajeError}</div>
        </div>
      )}

      {puedeGenerar && (
        <div style={{ marginTop: "16px", width: "fit-content" }}>
          <ButtonUI
            text="Generar nueva liquidación de precios"
            pcolor={({ theme }) => theme.colors.secondary}
            iconLeft="FaFileInvoiceDollar"
            disabled={archivos.length === 0 || leyendo || archivosInvalidos.length > 0}
            onClick={() => setMostrarConfirmacion(true)}
          />
        </div>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={cerrarConfirmacion}
        onConfirm={generarLiquidacion}
        title="¿Está seguro de generar una nueva liquidación de precios?"
        aceptarPrimero
      >
        {procesando ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "12px" }}>
            <LoaderUI />
          </div>
        ) : (
          <div>
            <b>Archivos:</b>{" "}
            {archivos.map((f) => f.doc?.name).join(" / ") || "Ninguno"}
          </div>
        )}
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
