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
  ConstruirUrlDescarga,
} from "services/maestroArticulosService";
import { postgresService } from "services/postgresService";

/* Nueva versión (aún sin publicar): la sección de generación de archivos
   .xlsx en el servidor (GET /maestro_articulos_archivos) vuelve a ser lo
   principal de esta página. */
const MOSTRAR_GENERAR_ARCHIVOS_SERVIDOR = true;

/* El resumen de artículos con sus filtros (Marca, Línea de negocio,
   Proveedor, Compra, Producto, búsqueda) y la tabla/Excel asociados se
   ocultan para la nueva versión -- todavía no se van a publicar. Se deja
   el flag (y el código) para poder reactivarlos más adelante. */
const MOSTRAR_RESUMEN_ARTICULOS = false;

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

/* El backend puede devolver el detalle de error de dos formas:
   - 400: {"detail": "mensaje"} (string)
   - 422: {"detail": [{type, loc, msg, input}, ...]} (validación de Pydantic)
   Esta función normaliza ambos casos (y el caso genérico de axios/network)
   a un string simple para mostrar en pantalla. */
const extraerMensajeError = (err) => {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d?.msg || JSON.stringify(d)).join("; ");
  }
  if (typeof detail === "string" && detail) return detail;
  return err?.response?.data?.message || err.message;
};

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

/* La descripción del artículo vino con distinto nombre de campo entre una
   versión y otra de /maestro_articulos_resumen (DESCRIPCION, Descripción,
   Nombre...). Probamos todas las variantes conocidas en vez de apostar a
   una sola, para no volver a romper esto si el backend cambia el nombre. */
const CAMPOS_DESCRIPCION = ["DESCRIPCION", "Descripción", "Descripcion", "Nombre"];
const obtenerDescripcion = (articulo) => {
  for (const campo of CAMPOS_DESCRIPCION) {
    const valor = articulo?.[campo];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return "";
};

/* Columnas de la tabla principal (y del Excel exportado). Empresa,
   PrchseItem, InvntItem, LINEA DE NEGOCIO, Código Ítem, MARCA COD., MARCA,
   COD. PROVEEDOR, PROV. 1(+cód.), PROVEEDORES REGISTRADOS(+cód.), DIF. MAX
   AÑO vs TOT. AÑO, ADU, Demanda Calificada, Líneas de Tránsito/Backorder/
   Pedido, Fecha Llegada + Próxima, INV. OPT, DLT, Corte LTF/LTF, Corte VF/VF,
   COEF. VARIACIÓN - 6M, Zona Verde 1/2/Final, NFP, DESV. EST. (demanda
   diaria y lead time), Z Nivel Servicio y Transito Internacional no se
   muestran (a pedido de negocio) -- pero esos
   campos siguen viniendo en `articulos` y se usan igual para los filtros
   (Marca, Línea de negocio, Proveedor, Compra, Producto), que no dependen de
   esta lista de columnas.
   "fija"/"ancho" marca la columna congelada (sticky) de la izquierda -- por
   ahora solo Descripción; el offset "left" se calcula más abajo. */
const COLUMNAS_PRINCIPAL = [
  { tipo: "chevron", fija: true, ancho: 32 },
  { titulo: "Descripción", tipo: "descripcion", fija: true, ancho: 280 },
  { titulo: "Código barras", campo: "BARRAS" },
  { titulo: "Diseño", campo: "DISEÑO" },
  { titulo: "TOP", campo: "TOP", tipo: "clase", align: "center" },
  { titulo: "ANT", campo: "ANT" },
  { titulo: "UN(#) año", campo: "UN (#) - AÑO", numero: 0, align: "right" },
  { titulo: "Pico últ. año x factura", campo: "PICO ULT. AÑO X FACTURA", numero: 0, align: "right" },
  { titulo: "Días inv. 1año", campo: "DIAS INV 1AÑO", numero: 0, align: "right" },
  { titulo: "Demanda mes-año", campo: "DEMANDA MES - AÑO", numero: 1, align: "right" },
  { titulo: "UN(#) 90d", campo: "UN (#) - 90D", numero: 0, align: "right" },
  { titulo: "Días inv. 90d", campo: "DIAS INV 90D", numero: 0, align: "right" },
  { titulo: "Demanda mes-90d", campo: "DEMANDA MES - 90D", numero: 1, align: "right" },
  { titulo: "%Var. demanda", campo: "% VARIACIÓN DEMANDA", porcentaje: true, align: "right" },
  { titulo: "Unidades mes anterior", campo: "UNIDADES MES ANTERIOR", numero: 0, align: "right" },
  { titulo: "Stock", campo: "EN STOCK", numero: 0, align: "right" },
  { titulo: "Cantidad en tránsito", campo: "Cantidad en Tránsito", numero: 0, align: "right" },
  { titulo: "ETD real", campo: "bl_ETD_real" },
  { titulo: "Días en tránsito", campo: "DIAS EN TRANSITO", numero: 0, align: "right" },
  { titulo: "ETA real", campo: "bl_ETA_real" },
  { titulo: "Tránsito 15d", campo: "Transito 15d", numero: 0, align: "right" },
  { titulo: "Tránsito 30d", campo: "Transito 30d", numero: 0, align: "right" },
  { titulo: "Tránsito 45d", campo: "Transito 45d", numero: 0, align: "right" },
  { titulo: "Tránsito +45d", campo: "Transito +45d", numero: 0, align: "right" },
  { titulo: "Backorders", campo: "BACKORDERS", numero: 0, align: "right" },
  { titulo: "Pedidos", campo: "PEDIDOS", numero: 0, align: "right" },
  { titulo: "Mes. inv. total", campo: "MES. INV. TOTAL", numero: 2, align: "right" },
  { titulo: "Stock total", campo: "STOCK TOTAL", numero: 0, align: "right" },
  { titulo: "Inv. segu", campo: "INV. SEGU", numero: 2, align: "right" },
  { titulo: "Zona roja base", campo: "Zona Roja Base", numero: 2, align: "right" },
  { titulo: "Zona roja de seguridad", campo: "Zona Roja de Seguridad", numero: 2, align: "right" },
  { titulo: "Zona roja total (TOR)", campo: "Zona Roja Total (TOR)", numero: 2, align: "right" },
  { titulo: "Zona amarilla", campo: "Zona Amarilla", numero: 2, align: "right" },
  { titulo: "Zona amarilla total (TOY)", campo: "Zona Amarilla Total (TOY)", numero: 2, align: "right" },
  { titulo: "Cantidad Sugerida de Compra", campo: "Cantidad Sugerida de Compra", numero: 0, align: "right" },
  { titulo: "Nuevo tamaño pedido", campo: "NUEVO TAMAÑO PEDIDO", numero: 0, align: "right" },
  { titulo: "Fecha última compra", campo: "Fecha Última Compra" },
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
  // core.dim_empresa_linea_marca: combinaciones válidas de empresa, línea de
  // negocio y marca. Arman en cascada los tres filtros de esta página
  // (empresa única -> línea de negocio única -> una o más marcas), en vez de
  // depender de un dominio fijo en el frontend.
  // ---------------------------------------------------------------------
  const [empresaLineaMarca, setEmpresaLineaMarca] = useState([]);
  const [cargandoEmpresaLineaMarca, setCargandoEmpresaLineaMarca] = useState(false);
  const [errorEmpresaLineaMarca, setErrorEmpresaLineaMarca] = useState("");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCargandoEmpresaLineaMarca(true);
      setErrorEmpresaLineaMarca("");
      const resultado = await postgresService.obtenerEmpresaLineaMarca();
      if (cancelado) return;
      if (resultado.success) {
        setEmpresaLineaMarca(resultado.data);
      } else {
        setErrorEmpresaLineaMarca(resultado.message);
      }
      setCargandoEmpresaLineaMarca(false);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // ---------------------------------------------------------------------
  // Filtro: empresa (intersección entre los permisos del usuario --
  // availableCompanies, inyectado por el router-- y las empresas que de
  // verdad tienen registros en dim_empresa_linea_marca). Mientras la tabla
  // todavía no responde no se filtra, para no dejar el select vacío de
  // entrada.
  // ---------------------------------------------------------------------
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  const empresasConParametros = useMemo(
    () => new Set(empresaLineaMarca.map((d) => d.DELM_EMPRESA)),
    [empresaLineaMarca]
  );

  const opcionesEmpresas = useMemo(() => {
    const base = (availableCompanies || []).map((e) => ({ value: e.nombre, label: e.nombre }));
    if (empresaLineaMarca.length === 0) return base;
    return base.filter((o) => empresasConParametros.has(o.value));
  }, [availableCompanies, empresaLineaMarca, empresasConParametros]);

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
  // Fila 1: generación de los archivos Excel (POST /maestro_articulos_archivos)
  // ---------------------------------------------------------------------
  const [estadoArchivos, setEstadoArchivos] = useState("INACTIVO"); // INACTIVO | EN_PROCESO | COMPLETADO | ERROR
  const [archivos, setArchivos] = useState([]);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [transcurridoArchivos, setTranscurridoArchivos] = useState(0);

  // Línea de negocio (única) y marca (una o más): ambas obligatorias para el
  // nuevo contrato de POST /maestro_articulos_archivos, y ambas en cascada
  // sobre dim_empresa_linea_marca (línea depende de la empresa; marca
  // depende de empresa + línea).
  const [lineaNegocioArchivos, setLineaNegocioArchivos] = useState(null);
  const [marcasArchivos, setMarcasArchivos] = useState([]);

  const opcionesLineaNegocioArchivos = useMemo(() => {
    if (!empresaSeleccionada) return [];
    const lineas = new Set(
      empresaLineaMarca
        .filter((d) => d.DELM_EMPRESA === empresaSeleccionada)
        .map((d) => d.DELM_LINEA_NEGOCIO)
    );
    return Array.from(lineas)
      .sort((a, b) => a.localeCompare(b))
      .map((l) => ({ value: l, label: l }));
  }, [empresaLineaMarca, empresaSeleccionada]);

  // El valor que se envía al backend (y que se usa como "value" del select)
  // es siempre DELM_MARCA; DELM_MARCA_VISIBLE es solo el texto a mostrar, y
  // si viene vacío se cae a DELM_MARCA.
  const opcionesMarcasArchivos = useMemo(() => {
    if (!empresaSeleccionada || !lineaNegocioArchivos) return [];
    const porMarca = new Map();
    empresaLineaMarca
      .filter(
        (d) => d.DELM_EMPRESA === empresaSeleccionada && d.DELM_LINEA_NEGOCIO === lineaNegocioArchivos
      )
      .forEach((d) => {
        if (!porMarca.has(d.DELM_MARCA)) {
          porMarca.set(d.DELM_MARCA, d.DELM_MARCA_VISIBLE || d.DELM_MARCA);
        }
      });
    return Array.from(porMarca, ([value, label]) => ({ value, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [empresaLineaMarca, empresaSeleccionada, lineaNegocioArchivos]);

  // Si cambia la empresa y la línea elegida ya no aplica, se limpia (misma
  // idea que el resto de filtros en cascada de esta página).
  useEffect(() => {
    if (lineaNegocioArchivos && !opcionesLineaNegocioArchivos.some((o) => o.value === lineaNegocioArchivos)) {
      setLineaNegocioArchivos(null);
    }
  }, [opcionesLineaNegocioArchivos, lineaNegocioArchivos]);

  // Marca(s) depende de línea de negocio: cada vez que la línea cambia (o se
  // limpia), las marcas elegidas para la línea anterior dejan de tener
  // sentido, así que se resetean por completo en vez de solo podar las que
  // ya no existan.
  useEffect(() => {
    setMarcasArchivos([]);
  }, [lineaNegocioArchivos]);

  const handleLineaNegocioArchivosChange = (opcion) =>
    setLineaNegocioArchivos(opcion ? opcion.value : null);

  const handleMarcasArchivosChange = (opciones) =>
    setMarcasArchivos((opciones || []).map((o) => o.value));

  // Empresa es siempre obligatoria; línea de negocio y marca(s) son
  // opcionales pero acumulativos (no se puede elegir marca sin línea -- la UI
  // ya lo impide dejando el select de marca deshabilitado hasta elegir una
  // línea). Los 3 modos válidos: solo empresa, empresa+línea, o
  // empresa+línea+marca(s).
  const puedeGenerarArchivos = !!empresaSeleccionada;

  const cronometroArchivosRef = useRef(null);
  const inicioArchivosRef = useRef(null);

  useEffect(
    () => () => {
      if (cronometroArchivosRef.current) clearInterval(cronometroArchivosRef.current);
    },
    []
  );

  const generarArchivos = useCallback(async () => {
    if (!puedeGenerarArchivos) return;

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
      const datos = await ObtenerArchivosMaestroArticulos(
        empresaSeleccionada,
        lineaNegocioArchivos,
        marcasArchivos
      );
      setArchivos(datos.archivos || []);
      setEstadoArchivos("COMPLETADO");
    } catch (err) {
      setEstadoArchivos("ERROR");
      setErrorArchivos(extraerMensajeError(err));
    } finally {
      clearInterval(cronometroArchivosRef.current);
      cronometroArchivosRef.current = null;
    }
  }, [puedeGenerarArchivos, empresaSeleccionada, lineaNegocioArchivos, marcasArchivos]);

  const descargarArchivo = (archivo) => {
    const url = ConstruirUrlDescarga(archivo);
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

  // Filtros de Marca, Línea de negocio, Proveedor, Compra y Producto: todos
  // multi-selección (array vacío = sin filtro, es decir "todas"). Marca,
  // Línea de negocio y Proveedor arman sus opciones con los valores que ya
  // vienen en la respuesta de /maestro_articulos_resumen (no hay que
  // pedirle nada nuevo al backend); Compra (PrchseItem) y Producto
  // (InvntItem) tienen dominio fijo (Y/N/vacío), hardcodeado arriba
  // (OPCIONES_COMPRA / OPCIONES_PRODUCTO_ACTIVO).
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState([]);
  const [lineasNegocioSeleccionadas, setLineasNegocioSeleccionadas] = useState([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [comprasSeleccionadas, setComprasSeleccionadas] = useState([]);
  const [productosActivosSeleccionados, setProductosActivosSeleccionados] = useState([]);

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

  const opcionesProveedor = useMemo(() => {
    const proveedores = new Set(articulos.map((a) => a["PROV. 1"]).filter(Boolean));
    return Array.from(proveedores)
      .sort((a, b) => a.localeCompare(b))
      .map((p) => ({ value: p, label: p }));
  }, [articulos]);

  // Si cambian los artículos cargados (nueva empresa) y alguna marca, línea
  // de negocio o proveedor elegido ya no aparece en el nuevo listado, se
  // saca de la selección (el resto de las opciones marcadas se mantiene).
  useEffect(() => {
    setMarcasSeleccionadas((previas) => previas.filter((m) => opcionesMarca.some((o) => o.value === m)));
  }, [opcionesMarca]);

  useEffect(() => {
    setLineasNegocioSeleccionadas((previas) =>
      previas.filter((l) => opcionesLineaNegocio.some((o) => o.value === l))
    );
  }, [opcionesLineaNegocio]);

  useEffect(() => {
    setProveedoresSeleccionados((previas) =>
      previas.filter((p) => opcionesProveedor.some((o) => o.value === p))
    );
  }, [opcionesProveedor]);

  const articulosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return articulos.filter((articulo) => {
      if (marcasSeleccionadas.length > 0 && !marcasSeleccionadas.includes(articulo.MARCA)) {
        return false;
      }
      if (
        lineasNegocioSeleccionadas.length > 0 &&
        !lineasNegocioSeleccionadas.includes(articulo["LINEA DE NEGOCIO"])
      ) {
        return false;
      }
      if (
        proveedoresSeleccionados.length > 0 &&
        !proveedoresSeleccionados.includes(articulo["PROV. 1"])
      ) {
        return false;
      }
      if (
        comprasSeleccionadas.length > 0 &&
        !comprasSeleccionadas.includes(articulo.PrchseItem || "")
      ) {
        return false;
      }
      if (
        productosActivosSeleccionados.length > 0 &&
        !productosActivosSeleccionados.includes(articulo.InvntItem || "")
      ) {
        return false;
      }
      if (!termino) return true;
      const codigo = String(articulo["Código Ítem"] || "").toLowerCase();
      const nombre = obtenerDescripcion(articulo).toLowerCase();
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
    marcasSeleccionadas,
    lineasNegocioSeleccionadas,
    proveedoresSeleccionados,
    comprasSeleccionadas,
    productosActivosSeleccionados,
  ]);

  // Excel de los "totales" (filas principales, sin el detalle de pedidos ni
  // tránsitos) para lo que quedó filtrado en pantalla. Usa las mismas
  // columnas que se ven en la tabla (COLUMNAS_PRINCIPAL) -- ni la tabla ni
  // el Excel muestran los campos que negocio pidió ocultar, aunque esos
  // campos se sigan usando para los filtros.
  const datosExportacion = useMemo(
    () =>
      articulosFiltrados.map((articulo) => {
        const fila = {};
        COLUMNAS_PRINCIPAL.forEach((columna) => {
          if (columna.tipo === "descripcion") {
            fila[columna.titulo] = obtenerDescripcion(articulo);
            return;
          }
          if (!columna.campo) return;
          fila[columna.titulo] = articulo[columna.campo] ?? "";
        });
        return fila;
      }),
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
    marcasSeleccionadas,
    lineasNegocioSeleccionadas,
    proveedoresSeleccionados,
    comprasSeleccionadas,
    productosActivosSeleccionados,
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
    if (!MOSTRAR_RESUMEN_ARTICULOS) return;
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
          isDisabled={opcionesEmpresas.length === 0 || cargandoEmpresaLineaMarca}
          isSearchable={false}
          minWidth="220px"
        />
        <SelectUI
          label="Línea de negocio (opcional)"
          options={opcionesLineaNegocioArchivos}
          value={
            lineaNegocioArchivos
              ? opcionesLineaNegocioArchivos.find((o) => o.value === lineaNegocioArchivos)
              : null
          }
          onChange={handleLineaNegocioArchivosChange}
          placeholder={empresaSeleccionada ? "Todas" : "Primero selecciona una empresa"}
          isSearchable={false}
          isClearable
          isDisabled={generandoArchivos || !empresaSeleccionada}
          minWidth="220px"
        />
        <SelectUI
          label="Marca(s) (opcional)"
          options={opcionesMarcasArchivos}
          value={opcionesMarcasArchivos.filter((o) => marcasArchivos.includes(o.value))}
          onChange={handleMarcasArchivosChange}
          placeholder={lineaNegocioArchivos ? "Todas" : "Primero selecciona una línea"}
          isMulti
          isClearable
          isDisabled={generandoArchivos || !lineaNegocioArchivos}
          minWidth="280px"
          maxWidth="420px"
        />
        {cargandoEmpresaLineaMarca && (
          <TextUI size="12px" color={theme?.colors?.textSecondary}>
            Cargando líneas de negocio y marcas...
          </TextUI>
        )}
      </FilaFiltros>

      {errorEmpresaLineaMarca && (
        <Aviso $color={theme?.colors?.error || "#dc3545"}>
          <TextUI size="12px" weight="600" color={theme?.colors?.error}>
            No se pudieron cargar las líneas de negocio y marcas disponibles
          </TextUI>
          <TextUI size="12px" color={theme?.colors?.textSecondary}>
            {errorEmpresaLineaMarca}
          </TextUI>
        </Aviso>
      )}

      {MOSTRAR_GENERAR_ARCHIVOS_SERVIDOR && (
      <TarjetaAncha>
        <TextUI size="13px" color={theme?.colors?.textSecondary}>
          Genera el maestro de artículos y la auditoría asociada para la empresa
          seleccionada. Línea de negocio y marca(s) son opcionales: podés
          buscar solo por empresa, empresa + línea de negocio, o acotar además
          a una o más marcas. El proceso consulta SAP HANA y puede tardar
          varios minutos; los archivos quedarán disponibles para descargar al
          terminar.
        </TextUI>

        <Fila>
          <ButtonUI
            text="Generar reporte DDMRP"
            iconLeft="FaFileExcel"
            isAsync
            disabled={generandoArchivos || !puedeGenerarArchivos}
            onClick={generarArchivos}
            pcolor={theme?.colors?.primary}
          />
          {generandoArchivos && (
            <TextUI size="12px" color={theme?.colors?.textSecondary}>
              Transcurrido: {formatearDuracion(transcurridoArchivos)}
            </TextUI>
          )}
        </Fila>

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
            <BloqueTexto>
              <TextUI size="18px" weight="700">
                Reporte Generado
              </TextUI>
              <TextUI size="13px" color={theme?.colors?.textSecondary}>
                Descargar archivos
              </TextUI>
            </BloqueTexto>

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

      {MOSTRAR_RESUMEN_ARTICULOS && (
      <>
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
              value={opcionesMarca.filter((o) => marcasSeleccionadas.includes(o.value))}
              onChange={(opciones) => setMarcasSeleccionadas((opciones || []).map((o) => o.value))}
              placeholder="Todas"
              isMulti
              isClearable
              minWidth="220px"
            />
            <SelectUI
              label="Línea de negocio"
              options={opcionesLineaNegocio}
              value={opcionesLineaNegocio.filter((o) => lineasNegocioSeleccionadas.includes(o.value))}
              onChange={(opciones) =>
                setLineasNegocioSeleccionadas((opciones || []).map((o) => o.value))
              }
              placeholder="Todas"
              isMulti
              isClearable
              minWidth="240px"
            />
            <SelectUI
              label="Proveedor"
              options={opcionesProveedor}
              value={opcionesProveedor.filter((o) => proveedoresSeleccionados.includes(o.value))}
              onChange={(opciones) =>
                setProveedoresSeleccionados((opciones || []).map((o) => o.value))
              }
              placeholder="Todos"
              isMulti
              isClearable
              minWidth="260px"
            />
            <SelectUI
              label="Compra (PrchseItem)"
              options={OPCIONES_COMPRA}
              value={OPCIONES_COMPRA.filter((o) => comprasSeleccionadas.includes(o.value))}
              onChange={(opciones) => setComprasSeleccionadas((opciones || []).map((o) => o.value))}
              placeholder="Todas"
              isMulti
              isClearable
              minWidth="200px"
            />
            <SelectUI
              label="Producto (InvntItem)"
              options={OPCIONES_PRODUCTO_ACTIVO}
              value={OPCIONES_PRODUCTO_ACTIVO.filter((o) =>
                productosActivosSeleccionados.includes(o.value)
              )}
              onChange={(opciones) =>
                setProductosActivosSeleccionados((opciones || []).map((o) => o.value))
              }
              placeholder="Todos"
              isMulti
              isClearable
              minWidth="210px"
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
                  {COLUMNAS_PRINCIPAL.map((columna, indice) => {
                    const key = columna.campo || columna.tipo || indice;
                    if (columna.fija) {
                      return (
                        <ThFija
                          key={key}
                          $left={columna.left}
                          $width={columna.ancho}
                          $ultima={columna.ultima}
                          $align={columna.align}
                        >
                          {columna.titulo}
                        </ThFija>
                      );
                    }
                    return (
                      <Th key={key} $align={columna.align}>
                        {columna.titulo}
                      </Th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {articulosPagina.map((articulo) => (
                  <FilaArticulo key={articulo["Código Ítem"]} onClick={() => setArticuloDetalle(articulo)}>
                    {COLUMNAS_PRINCIPAL.map((columna, indice) => {
                      const key = columna.campo || columna.tipo || indice;
                      let contenido;
                      if (columna.tipo === "chevron") {
                        contenido = (
                          <IconUI name="FaChevronRight" size={12} color={theme?.colors?.primary} />
                        );
                      } else if (columna.tipo === "clase") {
                        contenido = <ClaseBadge valor={articulo.TOP} />;
                      } else if (columna.tipo === "descripcion") {
                        contenido = obtenerDescripcion(articulo);
                      } else {
                        contenido = formatearValorPrincipal(columna, articulo);
                      }
                      const esTexto = typeof contenido === "string";

                      if (columna.fija) {
                        return (
                          <TdFija
                            key={key}
                            $left={columna.left}
                            $width={columna.ancho}
                            $ultima={columna.ultima}
                            $align={columna.align}
                            title={esTexto ? contenido : undefined}
                          >
                            {contenido}
                          </TdFija>
                        );
                      }
                      return (
                        <Td key={key} $align={columna.align}>
                          {contenido}
                        </Td>
                      );
                    })}
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
            ? `Detalle ${articuloDetalle["Código Ítem"]} · ${obtenerDescripcion(articuloDetalle)}`
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
      </>
      )}
    </Contenedor>
  );
};

export default Ddmrp_Report;
