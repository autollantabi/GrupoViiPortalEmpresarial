/**
 * GUIAS DE REMISIÓN (Contabilidad)
 *
 * Pantalla del recurso "contabilidad.guiasremision". Qué hace:
 *   - Lista paginada de guías (filtros y paginación se resuelven en el servidor; ver guiasRemisionService.js).
 *   - Detalle de una guía en un modal; el supervisor puede marcarla como enviada.
 *   - "Descargar Excel": genera el Excel de guías aprobadas y pendientes de envío (hojas DATOS MAESTROS, LAAR y CONSOLIDADO_FINAL).
 *   - "Marcar enviadas desde Excel" (solo supervisor): se sube el Excel descargado, se VALIDA, se pide confirmación y recién entonces
 *     se marcan las guías como enviadas.
 *
 * Roles: "usuario" solo consulta y descarga; "supervisor" además marca como enviadas (routeConfig.rolDelRecurso).
 * El estado de la pantalla se organiza así: `consulta` (filtros que viajan al servidor), `guias`/`paginacion` (resultado),
 * `excelForm` (modal de descarga) y `cargaExcel` (modal de marcado desde Excel).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { DateSelectorUI } from "components/UI/Components/DateSelectorUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { ModalConfirmacionUI } from "components/UI/Components/ModalConfirmacionUI";
import { useTheme } from "context/ThemeContext";
import { useDebouncedValue } from "hooks/useDebouncedValue";
import {
  DescargarExcelGuiasRemision,
  EMPRESAS_EXCEL,
  ListarGuiasRemision,
  MarcarEnviadasDesdeExcel,
  MarcarGuiaRemisionEnviada,
  TAMANO_MAXIMO_EXCEL_MB,
} from "services/guiasRemisionService";

// Tiempo de espera tras la última tecla antes de consultar al servidor
const RETARDO_BUSQUEDA_MS = 500;

// Valores de hgr_detalle_estado_electronico (el backend compara ignorando mayúsculas)
const OPCIONES_ESTADO = [
  { value: "", label: "TODOS" },
  { value: "PENDIENTE", label: "PENDIENTE" },
  { value: "ARCHIVO XML GENERADO", label: "ARCHIVO XML GENERADO" },
  { value: "ENVIADO", label: "ENVIADO" },
  { value: "APROBADO", label: "APROBADO" },
  { value: "RECHAZADO", label: "RECHAZADO" },
];

// Por defecto el listado muestra solo las guías pendientes de envío
const OPCIONES_ENVIO = [
  { value: "false", label: "PENDIENTES DE ENVÍO" },
  { value: "true", label: "ENVIADAS" },
  { value: "", label: "TODAS" },
];

const OPCIONES_FILAS = [10, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

const COLUMNAS = [
  { header: "Fecha de Guía", field: "fechaGuia", isDate: true, align: "center" },
  { header: "Empresa", field: "empresa" },
  { header: "Nº de Guía", field: "numeroGuia" },
  { header: "Nº de Factura", field: "numeroFactura" },
  { header: "Nombre del Cliente", field: "nombreSocio", isCliente: true, wrap: true },
  { header: "Destino", field: "ciudadDestino", wrap: true },
  { header: "Transporte", field: "transportistaNombre", wrap: true },
  { header: "Estado documento", field: "detalleEstadoElectronico", isEstadoElectronico: true, align: "center" },
  { header: "Enviado", field: "enviado", isEnviado: true, align: "center" },
];

// Transportista para el que se genera guía de entrega en el courier (hgr_guia_entrega)
const ID_TRANSPORTISTA_LAAR = "1791705726001";

// Solo el rol supervisor puede marcar como enviado; "usuario" únicamente consulta
const ROL_SUPERVISOR = "supervisor";

// ================= Fechas =================
// Rango por defecto: del primer día del mes en curso hasta hoy. Si hoy ya es un mes nuevo,
// el rango arranca en el día 1 de ese mes.
const primerDiaDelMes = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
};

const hoySinHora = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

const formatFechaISO = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const formatFecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(`${valor}T00:00:00`);
  if (isNaN(d.getTime())) return valor;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
};

// ================= Estilos =================
const Contenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
`;

const FiltrosContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

// Fila superior: botones de Excel alineados a la derecha
const FilaAcciones = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
`;

// Fila de filtros
const FilaFiltros = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
`;

const FiltroGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Tarjeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

const TablaScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  opacity: ${({ $cargando }) => ($cargando ? 0.5 : 1)};
  transition: opacity 0.15s ease;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.secondary};
`;

const Td = styled.td`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  word-break: ${({ $wrap }) => ($wrap ? "break-word" : "normal")};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) => ($par ? theme.colors.backgroundLight : "transparent")};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}12;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}55;
`;

const PiePaginacion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
`;

const Vacio = styled.div`
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
`;

const CirculoIcono = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => $color || theme.colors.primary}15;
`;

const FilaClicable = styled(Fila)`
  cursor: ${({ $bloqueada }) => ($bloqueada ? "not-allowed" : "pointer")};
  ${({ $bloqueada, theme }) =>
    $bloqueada ? `background: ${theme.colors.error}12; color: ${theme.colors.textSecondary};` : ""}
`;

const CardModal = styled.div`
  padding: 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const CabeceraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
`;

const CabeceraItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PageInput = styled.input`
  width: 50px;
  text-align: center;
  padding: 6px 4px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
`;

export const GuiasRemision = ({ availableCompanies = [], routeConfig }) => {
  const { theme } = useTheme();
  const puedeMarcarEnviado = routeConfig?.rolDelRecurso === ROL_SUPERVISOR;

  const opcionesEmpresas = useMemo(() => {
    const nombres = (availableCompanies || [])
      .map((emp) => String(emp?.nombre || "").trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(nombres)).map((nombre) => ({
      value: nombre,
      label: nombre,
    }));
  }, [availableCompanies]);

  // Única fuente de verdad de lo que se consulta al servidor. Cada cambio de filtro
  // reinicia la página en la misma actualización, así se dispara una sola consulta.
  const [consulta, setConsulta] = useState(() => ({
    empresa: null,
    desde: primerDiaDelMes(),
    hasta: hoySinHora(),
    estado: "",
    enviado: "false",
    cliente: "",
    busqueda: "",
    page: 1,
    size: OPCIONES_FILAS[1].value,
  }));

  // Lo que el usuario está escribiendo; solo se aplica a `consulta` cuando deja de teclear
  const [clienteInput, setClienteInput] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const clienteDebounced = useDebouncedValue(clienteInput.trim(), RETARDO_BUSQUEDA_MS);
  const busquedaDebounced = useDebouncedValue(busquedaInput.trim(), RETARDO_BUSQUEDA_MS);

  const [guias, setGuias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [refrescos, setRefrescos] = useState(0);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);
  const [confirmandoEnvio, setConfirmandoEnvio] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Descarga del Excel de guías de remisión: su propio rango y empresas (arranca con los filtros de la tabla)
  const [excelAbierto, setExcelAbierto] = useState(false);
  const [excelForm, setExcelForm] = useState({ desde: null, hasta: null, empresas: [] });
  const [generandoExcel, setGenerandoExcel] = useState(false);

  // Marcar como enviadas las guías de un Excel: primero se valida el archivo y siempre se pide confirmación
  const inputArchivoRef = useRef(null);
  const cargaVigenteRef = useRef(0); // descarta respuestas de una carga que el usuario ya canceló
  const [cargaExcel, setCargaExcel] = useState({
    abierta: false,
    archivo: null,
    validando: false,
    marcando: false,
    resumen: null,
    error: null,
  });

  const actualizarFiltros = (cambios) =>
    setConsulta((prev) => ({ ...prev, ...cambios, page: 1 }));

  // Empresa por defecto: la primera disponible para el usuario
  useEffect(() => {
    if (!consulta.empresa && opcionesEmpresas.length) {
      setConsulta((prev) => ({ ...prev, empresa: opcionesEmpresas[0].value }));
    }
  }, [opcionesEmpresas, consulta.empresa]);

  // Aplica los textos de búsqueda una vez terminado el debounce
  useEffect(() => {
    setConsulta((prev) =>
      prev.cliente === clienteDebounced && prev.busqueda === busquedaDebounced
        ? prev
        : {
          ...prev,
          cliente: clienteDebounced,
          busqueda: busquedaDebounced,
          page: 1,
        }
    );
  }, [clienteDebounced, busquedaDebounced]);

  // Consulta paginada al servidor. Si los filtros cambian mientras hay una consulta
  // en vuelo, se cancela para que una respuesta lenta no pise a la más reciente.
  useEffect(() => {
    if (!consulta.empresa) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await ListarGuiasRemision(
          {
            empresa: consulta.empresa,
            page: consulta.page,
            size: consulta.size,
            fechaDesde: formatFechaISO(consulta.desde),
            fechaHasta: formatFechaISO(consulta.hasta),
            cliente: consulta.cliente,
            busqueda: consulta.busqueda,
            estado: consulta.estado,
            enviado: consulta.enviado,
          },
          controller.signal
        );
        // Si la página quedó vacía (p. ej. se marcó como enviada la última guía de la
        // última página), se vuelve a la última página con datos
        if (!data.Guias?.length && consulta.page > 1 && data.Paginacion?.totalPages > 0) {
          setConsulta((prev) => ({ ...prev, page: data.Paginacion.totalPages }));
          return;
        }
        setGuias(data.Guias || []);
        setPaginacion(data.Paginacion || null);
        setLoading(false);
        setConsultado(true);
      } catch (err) {
        if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
        console.error("Error al consultar guías de remisión:", err);
        setGuias([]);
        setPaginacion(null);
        setError(true);
        setLoading(false);
        setConsultado(true);
        toast.error("No se pudo obtener el listado de guías de remisión");
      }
    })();

    return () => controller.abort();
  }, [consulta, refrescos]);

  // ================= Handlers de filtros =================
  const handleEmpresa = (opt) => opt && actualizarFiltros({ empresa: opt.value });

  const handleEstado = (opt) => actualizarFiltros({ estado: opt?.value || "" });

  const handleEnvio = (opt) => opt && actualizarFiltros({ enviado: opt.value });

  // El rango nunca queda vacío ni invertido: "desde" no pasa de "hasta" y viceversa
  // (además de los min/max del selector); si se borra una fecha vuelve a su valor por defecto.
  const handleDesde = (fecha) => {
    const nueva = fecha || primerDiaDelMes();
    actualizarFiltros({
      desde: nueva,
      hasta: nueva > consulta.hasta ? nueva : consulta.hasta,
    });
  };

  const handleHasta = (fecha) => {
    const nueva = fecha || hoySinHora();
    if (nueva < consulta.desde) return;
    actualizarFiltros({ hasta: nueva });
  };

  const handleFilas = (opt) => opt && actualizarFiltros({ size: opt.value });

  const recargar = () => setRefrescos((n) => n + 1);

  // El listado no trae guías canceladas (hgr_cancelada = false); por seguridad, si llegara una, solo se avisa sin abrir el modal
  const abrirDetalle = (guia) => {
    if (guia.cancelada) {
      toast.warn("No se puede visualizar el detalle de la guía de remisión", {
        toastId: "guia-cancelada",
      });
      return;
    }
    setGuiaSeleccionada(guia);
  };

  const confirmarMarcarEnviado = async () => {
    if (!puedeMarcarEnviado || !guiaSeleccionada || enviando) return;
    setEnviando(true);
    try {
      await MarcarGuiaRemisionEnviada({
        id: guiaSeleccionada.id,
        empresa: consulta.empresa,
      });
      // El modal pasa a ENVIADO y se vuelve a consultar el listado (la guía deja de
      // aparecer si el filtro es "pendientes de envío")
      setGuiaSeleccionada((prev) => (prev ? { ...prev, enviado: true } : prev));
      recargar();
      toast.success("Guía de remisión marcada como enviada");
    } catch (err) {
      console.error("Error al marcar la guía como enviada:", err);
      toast.error(err?.response?.data?.message || "No se pudo marcar la guía como enviada");
    } finally {
      setEnviando(false);
      setConfirmandoEnvio(false);
    }
  };

  // ================= Descarga del Excel de guías de remisión =================
  const empresasExcel = useMemo(
    () => opcionesEmpresas.filter((o) => EMPRESAS_EXCEL.includes(o.value)),
    [opcionesEmpresas]
  );

  const abrirExcel = () => {
    const actual = empresasExcel.find((o) => o.value === consulta.empresa);
    setExcelForm({
      desde: consulta.desde,
      hasta: consulta.hasta,
      empresas: actual ? [actual.value] : empresasExcel.map((o) => o.value),
    });
    setExcelAbierto(true);
  };

  const cerrarExcel = () => !generandoExcel && setExcelAbierto(false);

  // desde nunca pasa de hasta (además de los min/max del selector); una fecha borrada se ignora
  const handleExcelDesde = (fecha) => {
    if (!fecha) return;
    setExcelForm((prev) => ({
      ...prev,
      desde: fecha,
      hasta: fecha > prev.hasta ? fecha : prev.hasta,
    }));
  };

  const handleExcelHasta = (fecha) => {
    if (!fecha) return;
    setExcelForm((prev) => (fecha < prev.desde ? prev : { ...prev, hasta: fecha }));
  };

  // Idempotente: CheckboxUI puede notificar el mismo cambio dos veces (clic en el contenedor y en el input)
  const toggleEmpresaExcel = (empresa, marcada) =>
    setExcelForm((prev) => {
      const sinEmpresa = prev.empresas.filter((e) => e !== empresa);
      return { ...prev, empresas: marcada ? [...sinEmpresa, empresa] : sinEmpresa };
    });

  const descargarExcel = async () => {
    if (generandoExcel || !excelForm.empresas.length) return;
    setGenerandoExcel(true);
    try {
      const { blob, nombreArchivo } = await DescargarExcelGuiasRemision({
        desde: formatFechaISO(excelForm.desde),
        hasta: formatFechaISO(excelForm.hasta),
        empresas: excelForm.empresas,
      });

      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      setExcelAbierto(false);
      // Las tablas dinámicas dependen del modelo de datos de Excel: las actualiza cada usuario al abrir el archivo
      toast.info(
        "Descargado correctamente, actualizar los datos para actualizar las tablas dinámicas.",
        { autoClose: 12000 }
      );
    } catch (err) {
      console.error("Error al descargar el archivo:", err);
      const mensaje = err?.response?.data?.message;
      const estado = err?.response?.status;
      if (estado === 404 || estado === 409) {
        toast.warn(mensaje);
      } else {
        toast.error(mensaje || "No se pudo generar el archivo");
      }
    } finally {
      setGenerandoExcel(false);
    }
  };

  // ================= Marcar como enviadas desde Excel =================
  const elegirArchivoEnvios = () => puedeMarcarEnviado && inputArchivoRef.current?.click();

  const cerrarCargaExcel = () => {
    if (cargaExcel.marcando) return;
    cargaVigenteRef.current += 1;
    setCargaExcel((prev) => ({ ...prev, abierta: false }));
  };

  const alElegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;

    if (!/\.(xlsx|xlsm)$/i.test(archivo.name)) {
      toast.warn("Seleccione el archivo Excel (.xlsx o .xlsm) descargado del portal");
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_EXCEL_MB * 1024 * 1024) {
      toast.warn(`El archivo supera el tamaño máximo de ${TAMANO_MAXIMO_EXCEL_MB} MB`);
      return;
    }

    const carga = ++cargaVigenteRef.current;
    setCargaExcel({ abierta: true, archivo, validando: true, marcando: false, resumen: null, error: null });
    try {
      // Paso 1: solo valida (no modifica nada) para mostrar qué se va a marcar
      const resumen = await MarcarEnviadasDesdeExcel(archivo, false);
      if (carga !== cargaVigenteRef.current) return;
      setCargaExcel((prev) => ({ ...prev, validando: false, resumen }));
    } catch (err) {
      if (carga !== cargaVigenteRef.current) return;
      console.error("Error al validar el Excel de guías:", err);
      setCargaExcel((prev) => ({
        ...prev,
        validando: false,
        error: err?.response?.data?.message || "No se pudo validar el archivo",
      }));
    }
  };

  const confirmarMarcadoExcel = async () => {
    const { archivo, resumen, marcando } = cargaExcel;
    if (!archivo || !resumen || marcando || resumen.porMarcar === 0) return;

    setCargaExcel((prev) => ({ ...prev, marcando: true }));
    try {
      // Paso 2: el usuario confirmó; se marcan las guías
      const resultado = await MarcarEnviadasDesdeExcel(archivo, true);
      cargaVigenteRef.current += 1;
      setCargaExcel((prev) => ({ ...prev, abierta: false, marcando: false }));

      if (resultado.marcadas < resultado.porMarcar) {
        toast.warn(
          `Se marcaron ${resultado.marcadas} de ${resultado.porMarcar} guías: el resto cambió de estado mientras se procesaba`
        );
      } else {
        toast.success(`${resultado.marcadas} guía(s) de remisión marcada(s) como enviada(s)`);
      }
      // Se vuelve a consultar el listado con los MISMOS filtros y la misma página que tenía el usuario
      // (fechas, empresa, estado, envío, búsquedas); las guías marcadas dejan de aparecer si el filtro es "pendientes"
      recargar();
    } catch (err) {
      console.error("Error al marcar las guías como enviadas desde Excel:", err);
      setCargaExcel((prev) => ({ ...prev, marcando: false }));
      toast.error(err?.response?.data?.message || "No se pudieron marcar las guías como enviadas");
    }
  };

  // ================= Paginación =================
  const totalPaginas = Math.max(1, paginacion?.totalPages || 1);

  const irAPagina = (nueva) => {
    const limitada = Math.min(Math.max(1, nueva), totalPaginas);
    setConsulta((prev) => ({ ...prev, page: limitada }));
  };

  // ================= Render =================
  // "Estado documento" = hgr_detalle_estado_electronico (Aprobado, Enviado, Archivo XML generado...)
  const colorEstadoElectronico = (estado) => {
    switch (String(estado || "").trim().toUpperCase()) {
      case "APROBADO":
        return theme.colors.success;
      case "RECHAZADO":
        return theme.colors.error;
      case "PENDIENTE":
        return theme.colors.warning || theme.colors.secondary;
      case "ENVIADO":
      case "ARCHIVO XML GENERADO":
        return theme.colors.info || theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderCelda = (item, columna) => {
    const valor = item[columna.field];

    if (columna.isEnviado) {
      return (
        <Badge $color={item.enviado ? theme.colors.success : theme.colors.textSecondary}>
          {item.enviado ? "SI" : "NO"}
        </Badge>
      );
    }
    if (columna.isEstadoElectronico) {
      const estado = item.detalleEstadoElectronico;
      return estado ? <Badge $color={colorEstadoElectronico(estado)}>{estado}</Badge> : "—";
    }

    // Nombre del cliente y, debajo, su código de socio
    if (columna.isCliente) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span>{valor || "—"}</span>
          <TextUI size="12px" color={theme.colors.textSecondary}>
            {item.codigoSocio || "—"}
          </TextUI>
        </div>
      );
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    if (columna.isDate) return formatFecha(valor);
    return valor;
  };

  const renderContenido = () => {
    // Carga inicial (sin datos previos): spinner. En cargas posteriores la tabla se
    // mantiene visible, atenuada, para que el cambio de filtros no parpadee.
    if (loading && !guias.length) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando guías de remisión...</TextUI>
        </Vacio>
      );
    }

    if (error) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.error}>
            <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
          </CirculoIcono>
          <TextUI weight="bold">No se pudo cargar la información</TextUI>
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
        </Vacio>
      );
    }

    if (!guias.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaFileLines" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin guías de remisión</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            {consultado
              ? "No se encontraron guías con los filtros seleccionados."
              : "Seleccione una empresa para consultar la información."}
          </TextUI>
        </Vacio>
      );
    }

    const inicio = (consulta.page - 1) * consulta.size;

    return (
      <>
        <TablaScroll $cargando={loading}>
          <Tabla>
            <thead>
              <tr>
                {COLUMNAS.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guias.map((guia, index) => (
                <FilaClicable
                  key={guia.id}
                  $par={index % 2 === 0}
                  $bloqueada={guia.cancelada}
                  onClick={() => abrirDetalle(guia)}
                >
                  {COLUMNAS.map((columna) => (
                    <Td key={columna.field} $align={columna.align} $wrap={columna.wrap}>
                      {renderCelda(guia, columna)}
                    </Td>
                  ))}
                </FilaClicable>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {inicio + 1}–{inicio + guias.length} de {paginacion?.total ?? 0} registros
          </TextUI>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonUI
              iconLeft="FaArrowLeft"
              onClick={() => irAPagina(consulta.page - 1)}
              disabled={loading || consulta.page <= 1}
            />
            <PageInput
              theme={theme}
              type="number"
              min={1}
              max={totalPaginas}
              value={consulta.page}
              onChange={(e) => irAPagina(Number(e.target.value) || 1)}
            />
            <TextUI size="13px" color={theme.colors.textSecondary}>
              de {totalPaginas}
            </TextUI>
            <ButtonUI
              iconLeft="FaArrowRight"
              onClick={() => irAPagina(consulta.page + 1)}
              disabled={loading || consulta.page >= totalPaginas}
            />
          </div>

          <SelectUI
            options={OPCIONES_FILAS}
            value={OPCIONES_FILAS.find((o) => o.value === consulta.size)}
            onChange={handleFilas}
            minWidth="140px"
            maxWidth="160px"
            isSearchable={false}
            menuPlacement="top"
          />
        </PiePaginacion>
      </>
    );
  };

  if (!opcionesEmpresas.length) {
    return (
      <Contenedor theme={theme}>
        <TextUI weight="bold" size="18px">
          No tiene acceso a ninguna empresa para consultar guías de remisión.
        </TextUI>
      </Contenedor>
    );
  }

  return (
    <ContainerUI
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 0, overflow: "hidden" }}
      translate="no"
      className="notranslate"
    >
      <Contenedor theme={theme}>
        <TextUI weight="bold" size="22px">
          Guías de Remisión
        </TextUI>

        <FiltrosContainer theme={theme}>
          {/* Botones de Excel (derecha). "Marcar enviadas" solo lo ve el supervisor */}
          <FilaAcciones>
            {empresasExcel.length > 0 && (
              <ButtonUI
                text="Descargar Excel"
                iconLeft="FaFileExcel"
                variant="outlined"
                onClick={abrirExcel}
              />
            )}
            {puedeMarcarEnviado && (
              <>
                <ButtonUI
                  text="Marcar enviadas desde Excel"
                  iconLeft="FaFileCircleCheck"
                  variant="outlined"
                  onClick={elegirArchivoEnvios}
                  disabled={cargaExcel.validando || cargaExcel.marcando}
                />
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".xlsx,.xlsm"
                  style={{ display: "none" }}
                  onChange={alElegirArchivo}
                />
              </>
            )}
          </FilaAcciones>

          {/* Filtros: todos se aplican en el servidor; los de texto esperan al debounce */}
          <FilaFiltros>
            <FiltroGrupo theme={theme}>
              <label>Desde</label>
              <DateSelectorUI fecha={consulta.desde} onChange={handleDesde} max={consulta.hasta} />
            </FiltroGrupo>

            <FiltroGrupo theme={theme}>
              <label>Hasta</label>
              <DateSelectorUI fecha={consulta.hasta} onChange={handleHasta} min={consulta.desde} />
            </FiltroGrupo>

            <SelectUI
              label="Empresa"
              options={opcionesEmpresas}
              value={opcionesEmpresas.find((o) => o.value === consulta.empresa) || null}
              onChange={handleEmpresa}
              placeholder="Empresa"
              isDisabled={opcionesEmpresas.length <= 1}
              isSearchable={false}
              minWidth="170px"
              maxWidth="200px"
            />

            <SelectUI
              label="Estado"
              options={OPCIONES_ESTADO}
              value={OPCIONES_ESTADO.find((o) => o.value === consulta.estado)}
              onChange={handleEstado}
              placeholder="TODOS"
              isSearchable={false}
              minWidth="220px"
              maxWidth="240px"
            />

            <SelectUI
              label="Envío"
              options={OPCIONES_ENVIO}
              value={OPCIONES_ENVIO.find((o) => o.value === consulta.enviado)}
              onChange={handleEnvio}
              isSearchable={false}
              minWidth="210px"
              maxWidth="230px"
            />

            <FiltroGrupo theme={theme} style={{ minWidth: "230px" }}>
              <label>Cliente</label>
              <InputUI
                placeholder="Código de socio o nombre..."
                value={clienteInput}
                onChange={setClienteInput}
                iconLeft="FaMagnifyingGlass"
              />
            </FiltroGrupo>

            <FiltroGrupo theme={theme} style={{ minWidth: "260px" }}>
              <label>Buscar</label>
              <InputUI
                placeholder="N° guía, factura, código o nombre..."
                value={busquedaInput}
                onChange={setBusquedaInput}
                iconLeft="FaMagnifyingGlass"
              />
            </FiltroGrupo>

            <div>
              <ButtonUI
                iconLeft="FaRotateRight"
                variant="outlined"
                onClick={recargar}
                disabled={loading}
              />
            </div>
          </FilaFiltros>
        </FiltrosContainer>

        <Tarjeta>{renderContenido()}</Tarjeta>
      </Contenedor>

      {/* Modal de detalle de la guía (con "Marcar como enviado" para el supervisor) */}

      <ModalUI
        isOpen={!!guiaSeleccionada}
        onClose={() => setGuiaSeleccionada(null)}
        title={`Guía de Remisión N° ${guiaSeleccionada?.numeroGuia ?? ""}`}
        maxWidth="900px"
        width="95%"
        hideDefaultButtons
      >
        {guiaSeleccionada && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {puedeMarcarEnviado && !guiaSeleccionada.enviado && (
              <div style={{ display: "flex", justifyContent: "end" }}>
                <ButtonUI
                  text="Marcar como enviado"
                  iconLeft="FaFileCircleCheck"
                  onClick={() => setConfirmandoEnvio(true)}
                  disabled={enviando}
                />
              </div>
            )}

            <CardModal theme={theme}>
              <CabeceraGrid>
                {[
                  ["Empresa", guiaSeleccionada.empresa],
                  ["Número de guía", guiaSeleccionada.numeroGuia],
                  ["Número de factura", guiaSeleccionada.numeroFactura],
                  ["Código de socio", guiaSeleccionada.codigoSocio],
                  ["Nombre del socio", guiaSeleccionada.nombreSocio],
                  ["Fecha", formatFecha(guiaSeleccionada.fechaGuia)],
                  ["Transportista", guiaSeleccionada.transportistaNombre],
                  ["Ciudad destino", guiaSeleccionada.ciudadDestino],
                ].map(([titulo, valor]) => (
                  <CabeceraItem key={titulo}>
                    <TextUI size="12px" color={theme.colors.textSecondary}>
                      {titulo}
                    </TextUI>
                    <TextUI weight="bold">{valor || "—"}</TextUI>
                  </CabeceraItem>
                ))}
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    Estado documento
                  </TextUI>
                  <div>
                    <Badge $color={colorEstadoElectronico(guiaSeleccionada.detalleEstadoElectronico)}>
                      {guiaSeleccionada.detalleEstadoElectronico || "—"}
                    </Badge>
                  </div>
                </CabeceraItem>
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    Estado de envío
                  </TextUI>
                  <div>
                    <Badge
                      $color={
                        guiaSeleccionada.enviado
                          ? theme.colors.success
                          : theme.colors.textSecondary
                      }
                    >
                      {guiaSeleccionada.enviado ? "ENVIADO" : "NO ENVIADO"}
                    </Badge>
                  </div>
                </CabeceraItem>
              </CabeceraGrid>
            </CardModal>

            {guiaSeleccionada.transportistaId === ID_TRANSPORTISTA_LAAR && (
              <CardModal theme={theme}>
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    GUÍA ENTREGA
                  </TextUI>
                  <TextUI weight="bold">{guiaSeleccionada.guiaEntrega || "—"}</TextUI>
                </CabeceraItem>
              </CardModal>
            )}
          </div>
        )}
      </ModalUI>

      {/* Modal "Descargar Excel": rango y empresas propios (arrancan con los filtros de la tabla) */}
      <ModalUI
        isOpen={excelAbierto}
        onClose={cerrarExcel}
        title="Descargar Excel"
        maxWidth="560px"
        width="95%"
        closeOnOverlayClick={!generandoExcel}
        showCloseButton={!generandoExcel}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <ButtonUI
              text="Cancelar"
              variant="outlined"
              onClick={cerrarExcel}
              disabled={generandoExcel}
            />
            <ButtonUI
              text={generandoExcel ? "Generando…" : "Descargar"}
              iconLeft={generandoExcel ? "FaSpinner" : "FaDownload"}
              onClick={descargarExcel}
              disabled={generandoExcel || !excelForm.empresas.length}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <FiltroGrupo theme={theme}>
              <label>Desde</label>
              <DateSelectorUI
                fecha={excelForm.desde}
                onChange={handleExcelDesde}
                max={excelForm.hasta}
                disabled={generandoExcel}
              />
            </FiltroGrupo>
            <FiltroGrupo theme={theme}>
              <label>Hasta</label>
              <DateSelectorUI
                fecha={excelForm.hasta}
                onChange={handleExcelHasta}
                min={excelForm.desde}
                disabled={generandoExcel}
              />
            </FiltroGrupo>
          </div>

          <FiltroGrupo theme={theme}>
            <label>Empresas</label>
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
              {empresasExcel.map((o) => (
                <CheckboxUI
                  key={o.value}
                  id={`excel-${o.value}`}
                  label={o.label}
                  checked={excelForm.empresas.includes(o.value)}
                  onChange={(_, marcada) => toggleEmpresaExcel(o.value, marcada)}
                  disabled={generandoExcel}
                />
              ))}
            </div>
          </FiltroGrupo>

          <TextUI size="12px" color={theme.colors.textSecondary}>
            {generandoExcel
              ? "Generando el archivo, puede tardar unos segundos. No cierre esta ventana."
              : "Incluye las guías aprobadas, no canceladas y pendientes de envío del rango (hojas DATOS MAESTROS, LAAR y CONSOLIDADO_FINAL). Las “ULT GUIA” son las máximas del rango descargado: con un rango corto o una sola empresa no representan la última guía real de cada serie. Al abrir el archivo, habilite el contenido y use Datos > Actualizar todo para actualizar las tablas dinámicas."}
          </TextUI>
        </div>
      </ModalUI>

      {/* Modal "Marcar enviadas desde Excel": resumen de la validación y confirmación */}
      <ModalUI
        isOpen={cargaExcel.abierta}
        onClose={cerrarCargaExcel}
        title="Marcar guías como enviadas desde Excel"
        maxWidth="760px"
        width="95%"
        closeOnOverlayClick={!cargaExcel.marcando}
        showCloseButton={!cargaExcel.marcando}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <ButtonUI
              text={cargaExcel.error ? "Cerrar" : "Cancelar"}
              variant="outlined"
              onClick={cerrarCargaExcel}
              disabled={cargaExcel.marcando}
            />
            {cargaExcel.resumen && (
              <ButtonUI
                text={
                  cargaExcel.marcando
                    ? "Marcando…"
                    : cargaExcel.resumen.porMarcar > 0
                    ? `Confirmar y marcar ${cargaExcel.resumen.porMarcar} guía(s)`
                    : "No hay guías por marcar"
                }
                iconLeft={cargaExcel.marcando ? "FaSpinner" : "FaFileCircleCheck"}
                onClick={confirmarMarcadoExcel}
                disabled={cargaExcel.marcando || cargaExcel.resumen.porMarcar === 0}
              />
            )}
          </div>
        }
      >
        {cargaExcel.validando && (
          <Vacio style={{ minHeight: "160px" }}>
            <CirculoIcono $color={theme.colors.primary}>
              <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
            </CirculoIcono>
            <TextUI weight="bold">Leyendo y validando el archivo…</TextUI>
          </Vacio>
        )}

        {cargaExcel.error && (
          <Vacio style={{ minHeight: "160px" }}>
            <CirculoIcono $color={theme.colors.error}>
              <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
            </CirculoIcono>
            <TextUI weight="bold">No se pudo usar el archivo</TextUI>
            <TextUI color={theme.colors.textSecondary}>{cargaExcel.error}</TextUI>
          </Vacio>
        )}

        {cargaExcel.resumen && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <TextUI>
              ¿Confirma que desea marcar como <b>enviadas</b> las guías de remisión del archivo{" "}
              <b>{cargaExcel.resumen.archivo}</b>? Solo se marcan las guías de la hoja DATOS MAESTROS que
              coinciden por empresa, N. Guía, N. Factura y destinatario.
            </TextUI>

            <CardModal theme={theme}>
              <CabeceraGrid>
                {[
                  ["Guías en el archivo", cargaExcel.resumen.guiasEnArchivo, null],
                  ["Se marcarán como enviadas", cargaExcel.resumen.porMarcar, theme.colors.success],
                  ["Ya estaban enviadas", cargaExcel.resumen.yaEnviadas, null],
                  ["Canceladas (no se marcan)", cargaExcel.resumen.canceladas, cargaExcel.resumen.canceladas ? theme.colors.error : null],
                  ["No encontradas en el sistema", cargaExcel.resumen.noEncontradas, cargaExcel.resumen.noEncontradas ? theme.colors.error : null],
                ].map(([titulo, valor, color]) => (
                  <CabeceraItem key={titulo}>
                    <TextUI size="12px" color={theme.colors.textSecondary}>
                      {titulo}
                    </TextUI>
                    <TextUI weight="bold" size="18px" color={color || undefined}>
                      {Number(valor).toLocaleString("es-EC")}
                    </TextUI>
                  </CabeceraItem>
                ))}
              </CabeceraGrid>
            </CardModal>

            {Object.keys(cargaExcel.resumen.porEmpresa || {}).length > 0 && (
              <TablaScroll style={{ maxHeight: "180px" }}>
                <Tabla>
                  <thead>
                    <tr>
                      {["Empresa", "En el archivo", "Por marcar", "Ya enviadas", "Canceladas", "No encontradas"].map((t, i) => (
                        <Th key={t} $align={i === 0 ? "left" : "center"}>
                          {t}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(cargaExcel.resumen.porEmpresa).map(([empresa, e], i) => (
                      <Fila key={empresa} $par={i % 2 === 0}>
                        <Td>{empresa}</Td>
                        <Td $align="center">{e.guiasEnArchivo}</Td>
                        <Td $align="center">{e.porMarcar}</Td>
                        <Td $align="center">{e.yaEnviadas}</Td>
                        <Td $align="center">{e.canceladas}</Td>
                        <Td $align="center">{e.noEncontradas}</Td>
                      </Fila>
                    ))}
                  </tbody>
                </Tabla>
              </TablaScroll>
            )}

            {cargaExcel.resumen.noEncontradas > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <TextUI weight="bold" color={theme.colors.error}>
                  Guías del archivo que no se encontraron (no se marcarán):
                </TextUI>
                <TablaScroll style={{ maxHeight: "170px" }}>
                  <Tabla>
                    <thead>
                      <tr>
                        {["Fila", "Empresa", "N. Guía", "N. Factura", "Destinatario"].map((t) => (
                          <Th key={t}>{t}</Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cargaExcel.resumen.ejemplosNoEncontradas.map((g, i) => (
                        <Fila key={`${g.fila}-${g.guia}`} $par={i % 2 === 0}>
                          <Td>{g.fila}</Td>
                          <Td>{g.empresa}</Td>
                          <Td>{g.guia}</Td>
                          <Td>{g.factura}</Td>
                          <Td>{g.destinatario}</Td>
                        </Fila>
                      ))}
                    </tbody>
                  </Tabla>
                </TablaScroll>
                {cargaExcel.resumen.noEncontradas > cargaExcel.resumen.ejemplosNoEncontradas.length && (
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    … y {cargaExcel.resumen.noEncontradas - cargaExcel.resumen.ejemplosNoEncontradas.length} más.
                  </TextUI>
                )}
              </div>
            )}

            {cargaExcel.resumen.errores?.total > 0 && (
              <TextUI size="12px" color={theme.colors.error}>
                {cargaExcel.resumen.errores.total} fila(s) del archivo se ignoraron por datos faltantes o inválidos
                (por ejemplo, fila {cargaExcel.resumen.errores.ejemplos[0]?.fila}:{" "}
                {cargaExcel.resumen.errores.ejemplos[0]?.motivo}).
              </TextUI>
            )}
          </div>
        )}
      </ModalUI>

      {/* Va después del modal de detalle para quedar por encima de él */}
      <ModalConfirmacionUI
        isOpen={confirmandoEnvio}
        onClose={() => !enviando && setConfirmandoEnvio(false)}
        onConfirm={confirmarMarcarEnviado}
        title="Marcar como enviado"
        message={`¿Confirma que la guía de remisión N° ${guiaSeleccionada?.numeroGuia ?? ""
          } fue enviada? Esta acción no se puede deshacer desde el portal.`}
        confirmText={enviando ? "Guardando..." : "Confirmar"}
        confirmColor={theme.colors.primary}
        iconName="FaFileCircleCheck"
      />
    </ContainerUI>
  );
};

export default GuiasRemision;
