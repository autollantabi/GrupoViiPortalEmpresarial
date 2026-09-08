import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { useTheme } from "context/ThemeContext";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { ExportToExcelUI } from "components/UI/Components/ExportarAExcelUI";
import {
  ObtenerArchivosMaestroArticulos,
  ObtenerResumenMaestroArticulos,
  ConstruirUrlDescargaArchivo,
} from "services/maestroArticulosService";

/* El botón "Generar reporte" (archivos .xlsx armados en el servidor) se
   oculta de momento -- el pedido ahora es exportar, del lado del cliente,
   los artículos ya filtrados en pantalla. Se deja el flag para poder
   reactivarlo fácilmente si hace falta más adelante. */
const MOSTRAR_GENERAR_ARCHIVOS_SERVIDOR = false;

/* Dominio fijo de PrchseItem/InvntItem: "Y", "N" o vacío (nulo/""). Se usa
   tal cual para los filtros, en vez de derivarlo de los datos cargados. */
const OPCIONES_COMPRA = [
  { value: "Y", label: "Sí" },
  { value: "N", label: "No" },
  { value: "", label: "Vacío" },
];

const OPCIONES_PRODUCTO_ACTIVO = [
  { value: "Y", label: "Activo" },
  { value: "N", label: "Inactivo" },
  { value: "", label: "Vacío" },
];

const Contenedor = styled.div`
  padding: 24px;
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

const FilaFiltros = styled(Fila)`
  align-items: flex-end;
`;

const FilaEncabezado = styled(Fila)`
  justify-content: space-between;
  align-items: flex-start;
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

/* A diferencia de la Tarjeta original (max-width: 760px), estas dos
   secciones deben ocupar el 100% del ancho disponible de la página. */
const TarjetaAncha = styled.div`
  background-color: ${({ theme }) => theme?.colors?.backgroundCard || "#fff"};
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
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

const TablaWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const FilaPaginacion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 6px;
`;

/* min-width: 100% para que nunca quede más angosta que el contenedor;
   width: max-content para que, con celdas en nowrap, crezca más allá del
   100% cuando el contenido (ej. nombres largos) lo requiera -- el scroll
   horizontal lo da TablaWrapper, en vez de que la fila crezca en alto. */
const Tabla = styled.table`
  min-width: 100%;
  width: max-content;
  border-collapse: collapse;
  font-size: 14px;
  white-space: nowrap;
`;

/* index.css define un "td { max-width: 275px; word-break: break-word; }"
   global (para otras tablas del portal). Acá lo neutralizamos: con
   white-space: nowrap ese max-width + break-word hacía que el texto largo
   se pintara encimado sobre la columna siguiente en vez de expandir la
   celda o cortarse con puntos suspensivos. */
const Th = styled.th`
  text-align: ${({ $align }) => $align || "left"};
  padding: 8px 10px;
  border-bottom: 2px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
  font-weight: 600;
  white-space: nowrap;
  max-width: none;
  word-break: normal;
`;

const Td = styled.td`
  text-align: ${({ $align }) => $align || "left"};
  padding: 8px 10px;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};
  color: ${({ theme }) => theme?.colors?.text || "#000"};
  max-width: none;
  word-break: normal;
`;

/* Columnas "congeladas" (Empresa...Descripción, ver COLUMNAS_PRINCIPAL) para
   poder scrollear en X sin perder de vista a qué artículo corresponde la
   fila. Ancho fijo + ellipsis: position: sticky necesita un ancho estable
   para que el offset "left" de cada columna no se recalcule fila a fila. */
const celdaFija = css`
  position: sticky;
  left: ${({ $left }) => $left}px;
  background-color: ${({ theme }) => theme?.colors?.backgroundCard || "#fff"};
  max-width: ${({ $width }) => $width}px;
  min-width: ${({ $width }) => $width}px;
  width: ${({ $width }) => $width}px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${({ $ultima }) => $ultima && css`box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.35);`}
`;

const ThFija = styled(Th)`
  ${celdaFija}
  z-index: 3;
`;

const TdFija = styled(Td)`
  ${celdaFija}
  z-index: 2;
`;

const FilaArticulo = styled.tr`
  cursor: pointer;
  &:hover td {
    background-color: ${({ theme }) => theme?.colors?.backgroundLight || "#fafafa"};
  }
`;

const MiniTablaWrapper = styled.div`
  overflow-x: auto;
`;

const MiniTabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;

  th {
    text-align: left;
    padding: 6px 8px;
    color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
    border-bottom: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
    font-weight: 600;
    max-width: none;
    word-break: normal;
  }

  td {
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};
    max-width: none;
    word-break: normal;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 9px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background-color: ${({ $color, theme }) => $color || theme?.colors?.textSecondary || "#6c757d"};
`;

/* "TOP" = Clase ABC (maestro externo cluster_portafolio); puede venir null
   si el ítem/empresa todavía no tiene clasificación cargada. */
const COLORES_CLASE_ABC = {
  A: "#28a745",
  B: "#fd7e14",
  C: "#6c757d",
};

const ClaseBadge = ({ valor }) => {
  if (!valor) return <TextUI size="13px" color="inherit" style={{ opacity: 0.5 }}>-</TextUI>;
  return <Badge $color={COLORES_CLASE_ABC[valor]}>{valor}</Badge>;
};

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

const formatearNumero = (valor, decimales = 0) => {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "-";
  return Number(valor).toLocaleString("es-EC", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

const formatearPorcentaje = (valor) => {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "-";
  return `${(Number(valor) * 100).toFixed(1)}%`;
};

/* Columnas de la tabla principal, en el orden pedido por negocio. Varias
   (ADU, Demanda Calificada, DLT, LTF, VF, las zonas del buffer DDMRP, NFP,
   etc.) todavía no vienen en /maestro_articulos_resumen -- esa versión
   liviana no calcula la Hoja 2/DDMRP -- así que hasta que el backend las
   agregue se van a ver en blanco ("-"); quedan ya mapeadas para no tener que
   tocar esto de nuevo cuando existan.
   "fija"/"ancho" marca las columnas congeladas (sticky) de la izquierda; el
   offset "left" de cada una se calcula más abajo, en orden. */
const COLUMNAS_PRINCIPAL = [
  { tipo: "chevron", fija: true, ancho: 32 },
  { titulo: "Empresa", campo: "Empresa", fija: true, ancho: 110 },
  { titulo: "PrchseItem", campo: "PrchseItem", fija: true, ancho: 90, align: "center" },
  { titulo: "InvntItem", campo: "InvntItem", fija: true, ancho: 90, align: "center" },
  { titulo: "Línea de negocio", campo: "LINEA DE NEGOCIO", fija: true, ancho: 140 },
  { titulo: "Código", campo: "Código Ítem", fija: true, ancho: 110 },
  { titulo: "Marca cód.", campo: "MARCA COD.", fija: true, ancho: 90, align: "right" },
  { titulo: "Descripción", campo: "DESCRIPCION", fija: true, ancho: 220 },
  { titulo: "Marca", campo: "MARCA" },
  { titulo: "Código barras", campo: "BARRAS" },
  { titulo: "Cód. proveedor", campo: "COD. PROVEEDOR" },
  { titulo: "Prov. 1", campo: "PROV. 1" },
  { titulo: "Prov. 1 cód.", campo: "PROV. 1 COD." },
  { titulo: "Proveedores registrados", campo: "PROVEEDORES REGISTRADOS" },
  { titulo: "Proveedores registrados cód.", campo: "PROVEEDORES REGISTRADOS COD." },
  { titulo: "Diseño", campo: "DISEÑO" },
  { titulo: "TOP", tipo: "clase", align: "center" },
  { titulo: "ANT", campo: "ANT" },
  { titulo: "UN(#) año", campo: "UN (#) - AÑO", numero: 0, align: "right" },
  { titulo: "Pico últ. año x factura", campo: "PICO ULT. AÑO X FACTURA", numero: 0, align: "right" },
  { titulo: "Dif. max año vs tot. año", campo: "DIF. MAX AÑO vs TOT. AÑO" },
  { titulo: "Días inv. 1año", campo: "DIAS INV 1AÑO", numero: 0, align: "right" },
  { titulo: "ADU", campo: "ADU", numero: 2, align: "right" },
  { titulo: "Demanda calificada", campo: "Demanda Calificada", numero: 1, align: "right" },
  { titulo: "Demanda mes-año", campo: "DEMANDA MES - AÑO", numero: 1, align: "right" },
  { titulo: "UN(#) 90d", campo: "UN (#) - 90D", numero: 0, align: "right" },
  { titulo: "Días inv. 90d", campo: "DIAS INV 90D", numero: 0, align: "right" },
  { titulo: "Demanda mes-90d", campo: "DEMANDA MES - 90D", numero: 1, align: "right" },
  { titulo: "%Var. demanda", campo: "% VARIACIÓN DEMANDA", porcentaje: true, align: "right" },
  { titulo: "Unidades mes anterior", campo: "UNIDADES MES ANTERIOR", numero: 0, align: "right" },
  { titulo: "Stock", campo: "EN STOCK", numero: 0, align: "right" },
  { titulo: "Cantidad en tránsito", campo: "Cantidad en Tránsito", numero: 0, align: "right" },
  { titulo: "Líneas de tránsito", campo: "Líneas de Tránsito", numero: 0, align: "right" },
  { titulo: "ETD real", campo: "bl_ETD_real" },
  { titulo: "Días en tránsito", campo: "DIAS EN TRANSITO", numero: 0, align: "right" },
  { titulo: "ETA real", campo: "bl_ETA_real" },
  { titulo: "Tránsito 15d", campo: "Transito 15d", numero: 0, align: "right" },
  { titulo: "Tránsito 30d", campo: "Transito 30d", numero: 0, align: "right" },
  { titulo: "Tránsito 45d", campo: "Transito 45d", numero: 0, align: "right" },
  { titulo: "Tránsito +45d", campo: "Transito +45d", numero: 0, align: "right" },
  { titulo: "Backorders", campo: "BACKORDERS", numero: 0, align: "right" },
  { titulo: "Líneas en backorder", campo: "Líneas en Backorder", numero: 0, align: "right" },
  { titulo: "Pedidos", campo: "PEDIDOS", numero: 0, align: "right" },
  { titulo: "Líneas de pedido", campo: "Líneas de Pedido", numero: 0, align: "right" },
  { titulo: "Fecha llegada + próxima", campo: "Fecha Llegada + Próxima" },
  { titulo: "Mes. inv. total", campo: "MES. INV. TOTAL", numero: 1, align: "right" },
  { titulo: "Stock total", campo: "STOCK TOTAL", numero: 0, align: "right" },
  { titulo: "Inv. opt", campo: "INV. OPT", numero: 0, align: "right" },
  { titulo: "DLT", campo: "DLT", numero: 0, align: "right" },
  { titulo: "Corte LTF", campo: "Corte LTF" },
  { titulo: "LTF", campo: "LTF", numero: 2, align: "right" },
  { titulo: "Corte VF", campo: "Corte VF" },
  { titulo: "VF", campo: "VF", numero: 2, align: "right" },
  { titulo: "Coef.var. 6m", campo: "COEF. VARIACIÓN - 6M", numero: 2, align: "right" },
  { titulo: "Inv. segu", campo: "INV. SEGU", numero: 0, align: "right" },
  { titulo: "Zona roja base", campo: "Zona Roja Base", numero: 0, align: "right" },
  { titulo: "Zona roja de seguridad", campo: "Zona Roja de Seguridad", numero: 0, align: "right" },
  { titulo: "Zona roja total (TOR)", campo: "Zona Roja Total (TOR)", numero: 0, align: "right" },
  { titulo: "Zona amarilla", campo: "Zona Amarilla", numero: 0, align: "right" },
  { titulo: "Zona amarilla total (TOY)", campo: "Zona Amarilla Total (TOY)", numero: 0, align: "right" },
  { titulo: "Zona verde 1", campo: "Zona Verde 1", numero: 0, align: "right" },
  { titulo: "Zona verde 2", campo: "Zona Verde 2", numero: 0, align: "right" },
  { titulo: "Zona verde final", campo: "Zona Verde Final", numero: 0, align: "right" },
  { titulo: "NFP", campo: "NFP", numero: 0, align: "right" },
  { titulo: "Cant. sugerida de compra", campo: "Cantidad Sugerida de Compra", numero: 0, align: "right" },
  { titulo: "Nuevo tamaño pedido", campo: "NUEVO TAMAÑO PEDIDO", numero: 0, align: "right" },
  { titulo: "Fecha última compra", campo: "Fecha Última Compra" },
  { titulo: "Desv. est. demanda diaria", campo: "DESV. EST. DEMANDA DIARIA", numero: 2, align: "right" },
  { titulo: "Desv. est. lead time", campo: "DESV. EST. LEAD TIME", numero: 2, align: "right" },
  { titulo: "Z nivel servicio", campo: "Z Nivel Servicio", numero: 2, align: "right" },
  { titulo: "Tránsito internacional", campo: "Transito Internacional" },
];

// Offset "left" acumulado de cada columna congelada, en el orden en que
// aparecen; la última marca $ultima para la sombra que separa lo fijo de lo
// scrolleable.
(() => {
  let acumulado = 0;
  let ultimaFija = null;
  COLUMNAS_PRINCIPAL.forEach((columna) => {
    if (!columna.fija) return;
    columna.left = acumulado;
    acumulado += columna.ancho;
    ultimaFija = columna;
  });
  if (ultimaFija) ultimaFija.ultima = true;
})();

const formatearValorPrincipal = (columna, articulo) => {
  const crudo = articulo[columna.campo];
  if (columna.numero !== undefined) return formatearNumero(crudo, columna.numero);
  if (columna.porcentaje) return formatearPorcentaje(crudo);
  return crudo ?? "";
};

/* Columnas del detalle por línea (pedido o tránsito): solo datos propios de
   esa línea. El contexto del artículo (nombre, marca, código, métricas...) ya
   no se repite acá -- vive en la fila padre, que ahora queda congelada
   (Descripción/Marca/Código/Código barras) al scrollear en X, así que siempre
   es visible sin necesidad de duplicarlo en cada línea de detalle. */
const COLUMNAS_DETALLE_LINEA = [
  { titulo: "N° Pedido", campo: "N° Pedido" },
  { titulo: "Fecha Pedido", campo: "Fecha Pedido" },
  { titulo: "Días desde Pedido", campo: "Días desde Pedido" },
  { titulo: "Cantidad Pedida", campo: "Cantidad Pedida", numero: 0 },
  { titulo: "Proveedor (Pedido)", campo: "Proveedor (Pedido)" },
  { titulo: "Fecha Entrega Prov.", campo: "Fecha Entrega Prov." },
  { titulo: "Estado Línea", campo: "Estado Línea" },
  { titulo: "Estado Backorder", campo: "Estado Backorder" },
  { titulo: "N° Factura", campo: "N° Factura" },
  { titulo: "Ref. Proveedor", campo: "Ref. Proveedor" },
  { titulo: "Fecha Factura", campo: "Fecha Factura" },
  { titulo: "Proveedor (Tránsito)", campo: "Proveedor (Tránsito)" },
  { titulo: "Nombre Proveedor", campo: "Nombre Proveedor" },
  { titulo: "Fecha Llegada Estimada", campo: "Fecha Llegada Estimada" },
  { titulo: "Días hasta Llegada", campo: "Días hasta Llegada" },
  { titulo: "Bodega", campo: "Bodega" },
  { titulo: "bl_ETD_real", campo: "bl_ETD_real" },
  { titulo: "bl_ETA_real", campo: "bl_ETA_real" },
];

const formatearValorColumna = (columna, linea) => {
  const crudo = linea[columna.campo];
  if (columna.numero !== undefined) return formatearNumero(crudo, columna.numero);
  return crudo ?? "";
};

/* Contenido del modal de detalle: una tabla propia con una fila por cada
   línea de pedido/tránsito. MiniTablaWrapper scrollea en X para las 18
   columnas sin importar el ancho del modal. */
const DetalleArticulo = ({ detalle }) => (
  <MiniTablaWrapper>
    <MiniTabla>
      <thead>
        <tr>
          {COLUMNAS_DETALLE_LINEA.map((columna) => (
            <th key={columna.titulo}>{columna.titulo}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {detalle.map((linea, i) => (
          <tr key={`${linea.Origen}-${i}`}>
            {COLUMNAS_DETALLE_LINEA.map((columna) => (
              <td key={columna.titulo}>{formatearValorColumna(columna, linea)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </MiniTabla>
  </MiniTablaWrapper>
);

export const Ddmrp_Report = ({ availableCompanies = [] }) => {
  const { theme } = useTheme();

  // ---------------------------------------------------------------------
  // Filtro: empresa (mismo origen de datos que reportes.flashventas:
  // contextos/permisos del usuario, inyectados por el router como props).
  // El filtro de "Línea" a nivel de API se sacó de acá -- ahora se filtra
  // por "Línea de negocio" en el cliente, junto a la tabla de resumen.
  // ---------------------------------------------------------------------
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const opcionesEmpresas = useMemo(
    () => (availableCompanies || []).map((e) => ({ value: e.nombre, label: e.nombre })),
    [availableCompanies]
  );

  useEffect(() => {
    if (opcionesEmpresas.length === 0) {
      if (empresaSeleccionada) setEmpresaSeleccionada(null);
      return;
    }
    if (!opcionesEmpresas.some((o) => o.value === empresaSeleccionada)) {
      setEmpresaSeleccionada(opcionesEmpresas[0].value);
    }
  }, [opcionesEmpresas, empresaSeleccionada]);

  const handleEmpresaChange = (opcion) => setEmpresaSeleccionada(opcion ? opcion.value : null);

  // ---------------------------------------------------------------------
  // Fila 1: generación de los archivos Excel (GET /maestro_articulos_archivos)
  // ---------------------------------------------------------------------
  const [estadoArchivos, setEstadoArchivos] = useState("INACTIVO"); // INACTIVO | EN_PROCESO | COMPLETADO | ERROR
  const [archivos, setArchivos] = useState([]);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [transcurridoArchivos, setTranscurridoArchivos] = useState(0);

  const cronometroArchivosRef = useRef(null);
  const inicioArchivosRef = useRef(null);

  useEffect(
    () => () => {
      if (cronometroArchivosRef.current) clearInterval(cronometroArchivosRef.current);
    },
    []
  );

  const generarArchivos = useCallback(async () => {
    if (!empresaSeleccionada) return;

    if (cronometroArchivosRef.current) clearInterval(cronometroArchivosRef.current);
    setEstadoArchivos("EN_PROCESO");
    setArchivos([]);
    setErrorArchivos("");
    setTranscurridoArchivos(0);
    inicioArchivosRef.current = Date.now();
    cronometroArchivosRef.current = setInterval(() => {
      setTranscurridoArchivos(Date.now() - inicioArchivosRef.current);
    }, 1000);

    try {
      const datos = await ObtenerArchivosMaestroArticulos(empresaSeleccionada);
      setArchivos(datos.archivos || []);
      setEstadoArchivos("COMPLETADO");
    } catch (err) {
      setEstadoArchivos("ERROR");
      setErrorArchivos(
        err?.response?.data?.detail || err?.response?.data?.message || err.message
      );
    } finally {
      clearInterval(cronometroArchivosRef.current);
      cronometroArchivosRef.current = null;
    }
  }, [empresaSeleccionada]);

  const descargarArchivo = (archivo) => {
    const url = ConstruirUrlDescargaArchivo(archivo.ruta);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const generandoArchivos = estadoArchivos === "EN_PROCESO";

  // ---------------------------------------------------------------------
  // Fila 2: resumen de artículos (GET /maestro_articulos_resumen), en tabla
  // colapsable por artículo.
  // ---------------------------------------------------------------------
  const [articulos, setArticulos] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState("");
  // Artículo cuyo detalle se muestra en el modal (null = modal cerrado).
  const [articuloDetalle, setArticuloDetalle] = useState(null);

  // Buscador: por código de ítem, nombre, diseño o código de barras
  // (búsqueda en cliente, sobre lo ya cargado -- no dispara un nuevo
  // request al backend).
  const [busqueda, setBusqueda] = useState("");

  // Filtros de Marca y Línea de negocio: se arman con los valores que ya
  // vienen en la respuesta de /maestro_articulos_resumen (no hay que pedirle
  // nada nuevo al backend), en vez de un catálogo aparte.
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [lineaNegocioSeleccionada, setLineaNegocioSeleccionada] = useState(null);

  const opcionesMarca = useMemo(() => {
    const marcas = new Set(articulos.map((a) => a.MARCA).filter(Boolean));
    return Array.from(marcas)
      .sort((a, b) => a.localeCompare(b))
      .map((m) => ({ value: m, label: m }));
  }, [articulos]);

  const opcionesLineaNegocio = useMemo(() => {
    const lineas = new Set(articulos.map((a) => a["LINEA DE NEGOCIO"]).filter(Boolean));
    return Array.from(lineas)
      .sort((a, b) => a.localeCompare(b))
      .map((l) => ({ value: l, label: l }));
  }, [articulos]);

  // Filtro de Proveedor (PROV. 1): igual que Marca/Línea de negocio, se arma
  // con los valores ya cargados. Compra (PrchseItem) y Producto (InvntItem)
  // tienen dominio fijo (Y/N/vacío), así que sus opciones van hardcodeadas
  // arriba (OPCIONES_COMPRA / OPCIONES_PRODUCTO_ACTIVO).
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  // null = todas; "Y" | "N" | "" (vacío) = filtro puntual.
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [productoActivoSeleccionado, setProductoActivoSeleccionado] = useState(null);

  const opcionesProveedor = useMemo(() => {
    const proveedores = new Set(articulos.map((a) => a["PROV. 1"]).filter(Boolean));
    return Array.from(proveedores)
      .sort((a, b) => a.localeCompare(b))
      .map((p) => ({ value: p, label: p }));
  }, [articulos]);

  // Si cambian los artículos cargados (nueva empresa) y la marca, línea de
  // negocio o proveedor elegido ya no aparece en el nuevo listado, se limpia.
  useEffect(() => {
    if (marcaSeleccionada && !opcionesMarca.some((o) => o.value === marcaSeleccionada)) {
      setMarcaSeleccionada(null);
    }
  }, [opcionesMarca, marcaSeleccionada]);

  useEffect(() => {
    if (lineaNegocioSeleccionada && !opcionesLineaNegocio.some((o) => o.value === lineaNegocioSeleccionada)) {
      setLineaNegocioSeleccionada(null);
    }
  }, [opcionesLineaNegocio, lineaNegocioSeleccionada]);

  useEffect(() => {
    if (proveedorSeleccionado && !opcionesProveedor.some((o) => o.value === proveedorSeleccionado)) {
      setProveedorSeleccionado(null);
    }
  }, [opcionesProveedor, proveedorSeleccionado]);

  const articulosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return articulos.filter((articulo) => {
      if (marcaSeleccionada && articulo.MARCA !== marcaSeleccionada) return false;
      if (
        lineaNegocioSeleccionada &&
        articulo["LINEA DE NEGOCIO"] !== lineaNegocioSeleccionada
      ) {
        return false;
      }
      if (proveedorSeleccionado && articulo["PROV. 1"] !== proveedorSeleccionado) return false;
      if (compraSeleccionada !== null && (articulo.PrchseItem || "") !== compraSeleccionada) {
        return false;
      }
      if (
        productoActivoSeleccionado !== null &&
        (articulo.InvntItem || "") !== productoActivoSeleccionado
      ) {
        return false;
      }
      if (!termino) return true;
      const codigo = String(articulo["Código Ítem"] || "").toLowerCase();
      const nombre = (articulo.Nombre || "").toLowerCase();
      const diseno = (articulo["DISEÑO"] || "").toLowerCase();
      const barras = (articulo.BARRAS || "").toLowerCase();
      return (
        codigo.includes(termino) ||
        nombre.includes(termino) ||
        diseno.includes(termino) ||
        barras.includes(termino)
      );
    });
  }, [
    articulos,
    busqueda,
    marcaSeleccionada,
    lineaNegocioSeleccionada,
    proveedorSeleccionado,
    compraSeleccionada,
    productoActivoSeleccionado,
  ]);

  // Excel de los "totales" (filas principales, sin el detalle de pedidos ni
  // tránsitos) para lo que quedó filtrado en pantalla -- empresa, búsqueda,
  // marca y línea de negocio.
  const datosExportacion = useMemo(
    () => articulosFiltrados.map(({ detalle, ...resto }) => resto),
    [articulosFiltrados]
  );

  // Paginado en el cliente: la respuesta trae TODOS los artículos de una
  // vez, así que se corta acá para no renderizar miles de filas de golpe.
  const TAMANO_PAGINA = 50;
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    empresaSeleccionada,
    busqueda,
    marcaSeleccionada,
    lineaNegocioSeleccionada,
    proveedorSeleccionado,
    compraSeleccionada,
    productoActivoSeleccionado,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(articulosFiltrados.length / TAMANO_PAGINA));
  const articulosPagina = useMemo(
    () => articulosFiltrados.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA),
    [articulosFiltrados, paginaActual]
  );

  const cargarResumen = useCallback(async () => {
    if (!empresaSeleccionada) {
      setArticulos([]);
      return;
    }
    setCargandoResumen(true);
    setErrorResumen("");
    try {
      const datos = await ObtenerResumenMaestroArticulos(empresaSeleccionada);
      setArticulos(datos.articulos || []);
    } catch (err) {
      setErrorResumen(
        err?.response?.data?.detail || err?.response?.data?.message || err.message
      );
      setArticulos([]);
    } finally {
      setCargandoResumen(false);
    }
  }, [empresaSeleccionada]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  // Se renderiza arriba y abajo de la tabla, para no obligar a hacer scroll
  // hasta el final si se quiere cambiar de página.
  const controlesPaginacion = (
    <FilaPaginacion>
      <TextUI size="12px" color={theme?.colors?.textSecondary}>
        Mostrando {(paginaActual - 1) * TAMANO_PAGINA + 1}–
        {Math.min(paginaActual * TAMANO_PAGINA, articulosFiltrados.length)} de {articulosFiltrados.length}
      </TextUI>
      <Fila>
        <ButtonUI
          text="Anterior"
          iconLeft="FaChevronLeft"
          variant="outlined"
          disabled={paginaActual === 1}
          onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
        />
        <TextUI size="12px" weight="600">
          Página {paginaActual} de {totalPaginas}
        </TextUI>
        <ButtonUI
          text="Siguiente"
          iconRight="FaChevronRight"
          variant="outlined"
          disabled={paginaActual === totalPaginas}
          onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
        />
      </Fila>
    </FilaPaginacion>
  );

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

      <FilaFiltros>
        <SelectUI
          label="Empresa"
          options={opcionesEmpresas}
          value={
            empresaSeleccionada
              ? opcionesEmpresas.find((o) => o.value === empresaSeleccionada)
              : null
          }
          onChange={handleEmpresaChange}
          placeholder="Selecciona una empresa..."
          isDisabled={opcionesEmpresas.length === 0}
          isSearchable={false}
          minWidth="220px"
        />
      </FilaFiltros>

      {MOSTRAR_GENERAR_ARCHIVOS_SERVIDOR && (
      <TarjetaAncha>
        <TextUI size="13px" color={theme?.colors?.textSecondary}>
          Genera el maestro de artículos y la auditoría asociada para la empresa
          seleccionada. El proceso consulta SAP HANA y puede tardar varios
          minutos; los archivos quedarán disponibles para descargar al terminar.
        </TextUI>

        <Fila>
          <ButtonUI
            text={generandoArchivos ? "Generando reporte..." : "Generar reporte"}
            iconLeft={generandoArchivos ? "FaSpinner" : "FaFileExcel"}
            disabled={generandoArchivos || !empresaSeleccionada}
            onClick={generarArchivos}
            pcolor={theme?.colors?.primary}
          />
          {generandoArchivos && (
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              Transcurrido: {formatearDuracion(transcurridoArchivos)}
            </TextUI>
          )}
        </Fila>

        {generandoArchivos && (
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

        {estadoArchivos === "ERROR" && (
          <Aviso $color={theme?.colors?.error || "#dc3545"}>
            <TextUI size="12px" weight="600" color={theme?.colors?.error}>
              No se pudo generar el reporte
            </TextUI>
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              {errorArchivos}
            </TextUI>
          </Aviso>
        )}

        {estadoArchivos === "COMPLETADO" && archivos.length > 0 && (
          <>
            <Aviso $color={theme?.colors?.success || "#28a745"}>
              <TextUI size="12px" weight="600" color={theme?.colors?.success}>
                Reporte generado en {formatearDuracion(transcurridoArchivos)}
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
                        {formatearTamano(archivo.tamano_bytes)}
                      </TextUI>
                    </BloqueTexto>
                  </Fila>
                  <ButtonUI
                    text="Descargar"
                    iconLeft="FaDownload"
                    variant="outlined"
                    onClick={() => descargarArchivo(archivo)}
                    pcolor={theme?.colors?.success || "#28a745"}
                  />
                </ArchivoFila>
              ))}
            </ListaArchivos>
          </>
        )}
      </TarjetaAncha>
      )}

      <TarjetaAncha>
        <FilaEncabezado>
          <BloqueTexto>
            <TextUI size="15px" weight="700">
              Resumen de artículos
            </TextUI>
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              {empresaSeleccionada
                ? `${articulosFiltrados.length} de ${articulos.length} artículo(s)`
                : "Selecciona una empresa para ver el resumen."}
            </TextUI>
          </BloqueTexto>

          {empresaSeleccionada && (
            <ExportToExcelUI
              data={datosExportacion}
              filename={`maestro_articulos_resumen_${empresaSeleccionada}`}
              habilitarBoton={datosExportacion.length === 0}
            />
          )}
        </FilaEncabezado>

        {empresaSeleccionada && articulos.length > 0 && (
          <Fila>
            <InputUI
              label="Búsqueda"
              iconLeft="FaSearch"
              placeholder="Buscar por código, nombre, diseño o código de barras..."
              value={busqueda}
              onChange={setBusqueda}
              containerStyle={{ maxWidth: "380px" }}
            />
            <SelectUI
              label="Marca"
              options={opcionesMarca}
              value={
                marcaSeleccionada
                  ? opcionesMarca.find((o) => o.value === marcaSeleccionada)
                  : null
              }
              onChange={(opcion) => setMarcaSeleccionada(opcion ? opcion.value : null)}
              placeholder="Todas"
              isClearable
              minWidth="180px"
            />
            <SelectUI
              label="Línea de negocio"
              options={opcionesLineaNegocio}
              value={
                lineaNegocioSeleccionada
                  ? opcionesLineaNegocio.find((o) => o.value === lineaNegocioSeleccionada)
                  : null
              }
              onChange={(opcion) => setLineaNegocioSeleccionada(opcion ? opcion.value : null)}
              placeholder="Todas"
              isClearable
              minWidth="200px"
            />
            <SelectUI
              label="Proveedor"
              options={opcionesProveedor}
              value={
                proveedorSeleccionado
                  ? opcionesProveedor.find((o) => o.value === proveedorSeleccionado)
                  : null
              }
              onChange={(opcion) => setProveedorSeleccionado(opcion ? opcion.value : null)}
              placeholder="Todos"
              isClearable
              minWidth="220px"
            />
            <SelectUI
              label="Compra (PrchseItem)"
              options={OPCIONES_COMPRA}
              value={
                compraSeleccionada !== null
                  ? OPCIONES_COMPRA.find((o) => o.value === compraSeleccionada)
                  : null
              }
              onChange={(opcion) => setCompraSeleccionada(opcion ? opcion.value : null)}
              placeholder="Todas"
              isClearable
              minWidth="160px"
            />
            <SelectUI
              label="Producto (InvntItem)"
              options={OPCIONES_PRODUCTO_ACTIVO}
              value={
                productoActivoSeleccionado !== null
                  ? OPCIONES_PRODUCTO_ACTIVO.find((o) => o.value === productoActivoSeleccionado)
                  : null
              }
              onChange={(opcion) => setProductoActivoSeleccionado(opcion ? opcion.value : null)}
              placeholder="Todos"
              isClearable
              minWidth="170px"
            />
          </Fila>
        )}

        {cargandoResumen && (
          <TextUI size="12px" color={theme?.colors?.textSecondary}>
            Cargando resumen...
          </TextUI>
        )}

        {errorResumen && (
          <Aviso $color={theme?.colors?.error || "#dc3545"}>
            <TextUI size="12px" weight="600" color={theme?.colors?.error}>
              No se pudo obtener el resumen
            </TextUI>
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              {errorResumen}
            </TextUI>
          </Aviso>
        )}

        {!cargandoResumen && !errorResumen && empresaSeleccionada && articulosFiltrados.length > 0 && totalPaginas > 1 && (
          controlesPaginacion
        )}

        {!cargandoResumen && !errorResumen && empresaSeleccionada && articulosFiltrados.length > 0 && (
          <TablaWrapper>
            <Tabla>
              <thead>
                <tr>
                  <ThFija $left={IZQ_CHEVRON} $width={ANCHO_CHEVRON} />
                  <ThFija $left={IZQ_DESCRIPCION} $width={ANCHO_DESCRIPCION}>Descripción</ThFija>
                  <ThFija $left={IZQ_MARCA} $width={ANCHO_MARCA}>Marca</ThFija>
                  <ThFija $left={IZQ_SKU} $width={ANCHO_SKU}>Código</ThFija>
                  <ThFija $left={IZQ_BARRAS} $width={ANCHO_BARRAS} $ultima>Código barras</ThFija>
                  <Th $align="center">TOP</Th>
                  <Th>ANT</Th>
                  <Th $align="right">UN(#) año</Th>
                  <Th $align="right">Pico últ. año x factura</Th>
                  <Th>Dif. max año vs tot. año</Th>
                  <Th $align="right">Días inv. 1año</Th>
                  <Th $align="right">Demanda mes-año</Th>
                  <Th $align="right">UN(#) 90d</Th>
                  <Th $align="right">Días inv. 90d</Th>
                  <Th $align="right">Demanda mes-90d</Th>
                  <Th $align="right">%Var. demanda</Th>
                  <Th $align="right">Unidades mes anterior</Th>
                </tr>
              </thead>
              <tbody>
                {articulosPagina.map((articulo) => (
                  <FilaArticulo key={articulo["Código Ítem"]} onClick={() => setArticuloDetalle(articulo)}>
                    <TdFija $left={IZQ_CHEVRON} $width={ANCHO_CHEVRON}>
                      <IconUI name="FaChevronRight" size={12} color={theme?.colors?.primary} />
                    </TdFija>
                    <TdFija
                      $left={IZQ_DESCRIPCION}
                      $width={ANCHO_DESCRIPCION}
                      title={articulo.DESCRIPCION}
                    >
                      {articulo.DESCRIPCION}
                    </TdFija>
                    <TdFija $left={IZQ_MARCA} $width={ANCHO_MARCA} title={articulo.MARCA}>
                      {articulo.MARCA}
                    </TdFija>
                    <TdFija $left={IZQ_SKU} $width={ANCHO_SKU} title={articulo["Código Ítem"]}>
                      {articulo["Código Ítem"]}
                    </TdFija>
                    <TdFija $left={IZQ_BARRAS} $width={ANCHO_BARRAS} $ultima title={articulo.BARRAS}>
                      {articulo.BARRAS}
                    </TdFija>
                    <Td $align="center">
                      <ClaseBadge valor={articulo.TOP} />
                    </Td>
                    <Td>{articulo.ANT}</Td>
                    <Td $align="right">{formatearNumero(articulo["UN (#) - AÑO"])}</Td>
                    <Td $align="right">{formatearNumero(articulo["PICO ULT. AÑO X FACTURA"])}</Td>
                    <Td>{articulo["DIF. MAX AÑO vs TOT. AÑO"]}</Td>
                    <Td $align="right">{formatearNumero(articulo["DIAS INV 1AÑO"])}</Td>
                    <Td $align="right">{formatearNumero(articulo["DEMANDA MES - AÑO"], 1)}</Td>
                    <Td $align="right">{formatearNumero(articulo["UN (#) - 90D"])}</Td>
                    <Td $align="right">{formatearNumero(articulo["DIAS INV 90D"])}</Td>
                    <Td $align="right">{formatearNumero(articulo["DEMANDA MES - 90D"], 1)}</Td>
                    <Td $align="right">{formatearPorcentaje(articulo["% VARIACIÓN DEMANDA"])}</Td>
                    <Td $align="right">{formatearNumero(articulo["UNIDADES MES ANTERIOR"])}</Td>
                  </FilaArticulo>
                ))}
              </tbody>
            </Tabla>
          </TablaWrapper>
        )}

        {!cargandoResumen && !errorResumen && empresaSeleccionada && articulosFiltrados.length > 0 && totalPaginas > 1 && (
          controlesPaginacion
        )}

        {!cargandoResumen && !errorResumen && empresaSeleccionada && articulos.length > 0 && articulosFiltrados.length === 0 && (
          <TextUI size="12px" color={theme?.colors?.textSecondary}>
            Ningún artículo coincide con la búsqueda.
          </TextUI>
        )}

        {!cargandoResumen && !errorResumen && empresaSeleccionada && articulos.length === 0 && (
          <TextUI size="12px" color={theme?.colors?.textSecondary}>
            No se encontraron artículos para los filtros seleccionados.
          </TextUI>
        )}
      </TarjetaAncha>

      <ModalUI
        isOpen={!!articuloDetalle}
        onClose={() => setArticuloDetalle(null)}
        title={
          articuloDetalle
            ? `Detalle ${articuloDetalle["Código Ítem"]} · ${articuloDetalle.DESCRIPCION}`
            : ""
        }
        width="95vw"
        maxWidth="720px"
        maxHeight="85vh"
        noFooter
      >
        {articuloDetalle &&
          (!articuloDetalle.detalle || articuloDetalle.detalle.length === 0 ? (
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              No hay pedidos ni tránsitos abiertos para este ítem.
            </TextUI>
          ) : (
            <DetalleArticulo detalle={articuloDetalle.detalle} />
          ))}
      </ModalUI>
    </Contenedor>
  );
};

export default Ddmrp_Report;
