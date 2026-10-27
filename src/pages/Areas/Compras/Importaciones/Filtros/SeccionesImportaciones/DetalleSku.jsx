import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ObtenerDetalleSkuPedido } from "services/importacionesService";
import { SectionImportacionesTitle } from "../../StylesImportaciones";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { TextUI } from "components/UI/Components/TextUI";
import { useTheme } from "context/ThemeContext";

const COLUMNAS_DETALLE_SKU = [
  { header: "Línea", field: "hfr_linea", align: "center" },
  { header: "Código Item", field: "hfr_codigoitem" },
  { header: "Nombre", field: "DIT_NOMBRE", wrap: true },
  { header: "Fabricante", field: "DIT_NOMBREFABRICANTE", wrap: true },
  { header: "Marca", field: "hfr_marca" },
  { header: "Cantidad", field: "hfr_cantidad", align: "right", isNumber: true },
  { header: "Precio", field: "hfr_precio", align: "right", isMoney: true },
  { header: "Backorder", field: "hfr_backorder", align: "right", isNumber: true },
  { header: "Total Línea", field: "_totalLinea", align: "right", isMoney: true },
  { header: "Estado", field: "hfr_estado", isBadge: true, align: "center" },
  { header: "Pedido Completo", field: "_pedidoCompleto", align: "center" },
];

// Cuando el pedido llega a estado CERRADO, hfr_pedidocompleto se limpia a
// null en origen; en ese caso se muestra "COMPLETO" en su lugar.
const getPedidoCompleto = (item) => {
  const estado = (item.hfr_estado || "").toUpperCase();
  if (estado === "CERRADO") return "COMPLETO";
  return item.hfr_pedidocompleto || "—";
};

const formatMoney = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return "—";
  return numero.toLocaleString("es-EC", { style: "currency", currency: "USD" });
};

const formatNumero = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return "—";
  return numero.toLocaleString("es-EC", { maximumFractionDigits: 2 });
};

const ContenedorRaiz = styled.div`
  width: 100%;
  /* Permite que este item flex se achique por debajo del ancho de su
     contenido (la tabla ancha), para que el scroll horizontal propio de
     cada tabla funcione en vez de forzar el crecimiento del modal. */
  min-width: 0;
`;

const PedidoBloque = styled.div`
  width: 100%;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const PedidoTitulo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  /* Sin esto, el div se comporta como flex item con min-width:auto: si el
     texto del pedido es un token largo sin espacios (p.ej. un PI de varios
     numeros unidos por guiones), no puede envolverse ni achicarse y termina
     forzando el ancho de todo el contenedor en vez del de la sección. */
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.textInverse};
  font-size: 13px;
  font-weight: 700;
`;

const PedidoNombre = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PedidoConteo = styled.span`
  flex-shrink: 0;
  white-space: nowrap;
`;

const TablaScroll = styled.div`
  width: 100%;
  overflow-x: auto;

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
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
`;

const Th = styled.th`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.backgroundLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  word-break: ${({ $wrap }) => ($wrap ? "break-word" : "normal")};
  max-width: ${({ $wrap }) => ($wrap ? "300px" : "none")};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) => ($par ? theme.colors.backgroundLight : "transparent")};
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

export const DetalleSku = ({ idImportacion }) => {
  const { theme } = useTheme();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!idImportacion) {
      setCargando(false);
      return;
    }

    let cancelado = false;
    (async () => {
      setCargando(true);
      setError(false);
      try {
        const respuesta = await ObtenerDetalleSkuPedido(idImportacion);
        if (cancelado) return;
        if (respuesta?.status === "Ok!" && respuesta.data) {
          setPedidos(respuesta.data.Pedidos || []);
        } else {
          setPedidos([]);
          setError(true);
        }
      } catch (err) {
        if (!cancelado) {
          console.error("Error al consultar detalle de SKU:", err);
          setPedidos([]);
          setError(true);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [idImportacion]);

  const colorEstado = (estado) => {
    const valor = (estado || "").toUpperCase();
    if (valor === "CERRADO") return theme.colors.success;
    if (valor === "ABIERTO") return theme.colors.info || theme.colors.primary;
    return theme.colors.textSecondary;
  };

  const colorPedidoCompleto = (valor) => {
    const v = (valor || "").toUpperCase();
    if (v === "COMPLETO") return theme.colors.success;
    if (v === "DESPACHADO") return theme.colors.info || theme.colors.primary;
    if (v === "PEDIDO") return theme.colors.warning || theme.colors.secondary;
    if (v === "BACKORDER") return theme.colors.error || theme.colors.danger;
    return theme.colors.textSecondary;
  };

  const renderCelda = (item, columna) => {
    if (columna.field === "_totalLinea") {
      return formatMoney(Number(item.hfr_cantidad) * Number(item.hfr_precio));
    }
    if (columna.field === "_pedidoCompleto") {
      const valorPedidoCompleto = getPedidoCompleto(item);
      return (
        <Badge $color={colorPedidoCompleto(valorPedidoCompleto)}>
          {valorPedidoCompleto}
        </Badge>
      );
    }

    const valor = item[columna.field];

    if (columna.isBadge) {
      return <Badge $color={colorEstado(valor)}>{valor || "—"}</Badge>;
    }
    if (columna.isMoney) {
      return formatMoney(valor);
    }
    if (columna.isNumber) {
      return formatNumero(valor);
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

  return (
    <ContenedorRaiz>
      <SectionImportacionesTitle theme={theme}>
        Detalle Sku
      </SectionImportacionesTitle>

      {cargando ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <LoaderUI />
        </div>
      ) : error ? (
        <TextUI color={theme.colors.error}>
          No se pudo obtener el detalle de SKU de esta importación.
        </TextUI>
      ) : !pedidos.length ? (
        <TextUI color={theme.colors.textSecondary}>
          No se encontraron pedidos asociados a esta importación.
        </TextUI>
      ) : (
        pedidos.map((pedido, indexPedido) => (
          <PedidoBloque key={`${pedido.Pedido}-${indexPedido}`} theme={theme}>
            <PedidoTitulo theme={theme}>
              <PedidoNombre title={`Pedido: ${pedido.Pedido}`}>
                Pedido: {pedido.Pedido}
              </PedidoNombre>
              <PedidoConteo>{(pedido.DetalleSku || []).length} ítems</PedidoConteo>
            </PedidoTitulo>

            <TablaScroll theme={theme}>
              <Tabla>
                <thead>
                  <tr>
                    {COLUMNAS_DETALLE_SKU.map((columna) => (
                      <Th key={columna.field} theme={theme} $align={columna.align}>
                        {columna.header}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(pedido.DetalleSku || []).map((item, index) => (
                    <Fila key={`${item.hfr_codigoitem}-${item.hfr_linea}-${index}`} theme={theme} $par={index % 2 === 0}>
                      {COLUMNAS_DETALLE_SKU.map((columna) => (
                        <Td key={columna.field} theme={theme} $align={columna.align} $wrap={columna.wrap}>
                          {renderCelda(item, columna)}
                        </Td>
                      ))}
                    </Fila>
                  ))}
                </tbody>
              </Tabla>
            </TablaScroll>
          </PedidoBloque>
        ))
      )}
    </ContenedorRaiz>
  );
};

export default DetalleSku;
