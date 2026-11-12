import styled from "styled-components";

/**
 * Constantes y estilos compartidos por las pantallas de Administración de
 * productos. Viven aquí (y no se importan de Clientes/ClienteDetalle) para que
 * este módulo no dependa del MDM principal.
 */

export const RECURSO_ADMIN_PRODUCTOS = "mdm.administracionproductos";
export const RUTA_ADMIN_PRODUCTOS = "/mdm/administracionproductos";
export const RUTA_COPIAR_PRODUCTOS = `${RUTA_ADMIN_PRODUCTOS}/copiar`;
export const RUTA_IMPORTAR_PRODUCTOS = `${RUTA_ADMIN_PRODUCTOS}/importar`;
export const RUTA_FACTURA_PRODUCTOS = `${RUTA_ADMIN_PRODUCTOS}/factura`;
export const RUTA_FACTURA_PRECIOS = `${RUTA_ADMIN_PRODUCTOS}/precios/factura`;
export const RUTA_IMPORTAR_PRECIOS = `${RUTA_ADMIN_PRODUCTOS}/precios/importar`;
export const RUTA_ACTUALIZAR_PRECIOS_ARCHIVO = `${RUTA_ADMIN_PRODUCTOS}/actualizar-precios/archivo`;
export const RUTA_COPIAR_PRECIOS = `${RUTA_ADMIN_PRODUCTOS}/precios/copiar`;

/* Compañías con las que trabaja el MDM */
export const EMPRESAS_MDM = ["AUTOLLANTA", "MAXXIMUNDO", "STOX", "IKONIX", "AUTOMAX"];

/* Líneas de negocio: id con el que vienen en ALCANCE.LINEAS del rol-contexto ->
   nombre tal como está en core.dim_item.dit_grupo */
export const LINEAS_MDM = {
  3: "LLANTAS",
  18: "LLANTAS MOTO",
  4: "LUBRICANTES",
  9: "HERRAMIENTAS",
};

export const OPCIONES_LINEAS_MDM = Object.values(LINEAS_MDM).map((nombre) => ({
  value: nombre,
  label: nombre,
}));

export const OPCIONES_FILAS = [10, 15, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

export const AvisoObservaciones = styled.div`
  align-self: flex-end;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.error || "#dc3545"};
  background: ${({ theme }) => theme.colors.error || "#dc3545"}14;
  border: 1px solid ${({ theme }) => theme.colors.error || "#dc3545"}55;
`;

export const TextoObservacion = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.error || "#dc3545"};
`;

/* Texto "58 productos encontrados" */
export const textoEncontrados = (n) =>
  `${n} producto${n === 1 ? "" : "s"} encontrado${n === 1 ? "" : "s"}`;

/* Orden ascendente por identificador (numérico si corresponde); los sin identificador van al final */
export const ordenarPorIdentificador = (lista) =>
  [...lista].sort((a, b) => {
    const x = String(a.IDENTIFICADOR ?? "");
    const y = String(b.IDENTIFICADOR ?? "");
    if (!x !== !y) return x ? -1 : 1;
    return x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" });
  });

export const claveProducto =(producto) => producto.IDENTIFICADOR;

/* ------------------------------ Estilos ------------------------------ */

export const Contenedor = styled.div`
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

export const Encabezado = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

export const AccionesEncabezado = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
  align-items: center;
`;

export const FiltrosContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const FiltroGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const Tarjeta = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

/* Tarjeta que se estira para ocupar el alto restante (listados) */
export const TarjetaFlexible = styled(Tarjeta)`
  flex: 1;
  min-height: 0;
`;

export const TarjetaCabecera = styled(Tarjeta)`
  padding: 16px;
  border-radius: 10px;
`;

export const TablaScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;

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

export const Tabla = styled.table`
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
`;

export const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  width: ${({ $ancho }) => $ancho || "auto"};
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.secondary};
`;

export const Td = styled.td`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  word-break: ${({ $wrap }) => ($wrap ? "break-word" : "normal")};
  max-width: ${({ $wrap }) => ($wrap ? "520px" : "none")};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

export const Fila = styled.tr`
  background: ${({ theme, $par, $seleccionada }) =>
    $seleccionada
      ? `${theme.colors.primary}1a`
      : $par
        ? theme.colors.backgroundLight
        : "transparent"};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}12;
  }
`;

export const PiePaginacion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
`;

export const PageInput = styled.input`
  width: 50px;
  text-align: center;
  padding: 6px 4px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
`;

export const Vacio = styled.div`
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

export const CirculoIcono = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => $color || theme.colors.primary}15;
`;

/* Sin margen inferior: el CheckboxUI trae 10px pensados para formularios */
export const estiloCheckboxTabla = { marginBottom: 0, justifyContent: "center" };

/* ----------------------- Cabecera tipo ficha ----------------------- */

export const CabeceraColumnas = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Filas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FilaCampo = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  gap: 4px 16px;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
`;

const EtiquetaFila = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`;

const ValorFijo = styled.div`
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 10px;
  box-sizing: border-box;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  white-space: normal;
  overflow-wrap: anywhere;
`;

export function Campo({ label, theme, children }) {
  return (
    <FilaCampo>
      <EtiquetaFila theme={theme}>{label}</EtiquetaFila>
      <div style={{ minWidth: 0 }}>{children}</div>
    </FilaCampo>
  );
}

/** Campo de solo lectura: se ve como un input pero no se puede editar */
export function CampoFijo({ label, valor, theme }) {
  return (
    <Campo label={label} theme={theme}>
      <ValorFijo theme={theme} title={valor || ""}>
        {valor || "—"}
      </ValorFijo>
    </Campo>
  );
}
