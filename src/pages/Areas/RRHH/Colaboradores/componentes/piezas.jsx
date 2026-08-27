import styled from "styled-components";
import { Link } from "react-router-dom";
import { hexToRGBA } from "utils/colors";

/**
 * Vocabulario visual de la sección Colaboradores.
 *
 * Reglas que hacen que esto se vea bien en tema claro y oscuro:
 *  - Cero colores literales: todo sale de theme.colors.
 *  - Transparencias con hexToRGBA, nunca concatenando el alfa al hex.
 *  - Los controles nativos llevan color-scheme, o el navegador les pinta el
 *    calendario y el desplegable con la paleta clara y quedan como un parche.
 *  - Bootstrap está importado global en este proyecto y reescribe table, label,
 *    h1..h6, así que márgenes, border-collapse y font-size van declarados.
 */

export const Contenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  /* Altura natural a propósito: la ficha y la bitácora son documentos largos y el
     scroll lo pone TemplatePaginas. Fijar height:100% acá da doble scrollbar. */
`;

export const Encabezado = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const Titulo = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  color: ${({ theme }) => theme?.colors?.text};
`;

export const Subtitulo = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

export const Acciones = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

export const Filtros = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
`;

/** Tarjeta plana. No se usa CardUI: ese es un acordeón que se colapsa al hacer click. */
export const Tarjeta = styled.section`
  background: ${({ theme }) => theme?.colors?.backgroundCard};
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 12px;
  padding: ${({ $sinRelleno }) => ($sinRelleno ? "0" : "16px")};
  overflow: hidden;
`;

export const TituloTarjeta = styled.h2`
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text};
`;

export const Rejilla = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(${({ $min = 220 }) => $min}px, 1fr));
`;

// ── Tabla ───────────────────────────────────────────────────────────────────

export const TablaScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

export const Tabla = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 13px;
`;

/**
 * Cabecera de tabla. NO se copia el patrón de otras pantallas del Portal, que
 * usan textInverse sobre secondary: en tema oscuro eso es negro sobre gris
 * oscuro y no se lee.
 */
export const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  white-space: nowrap;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textSecondary};
  background: ${({ theme }) => theme?.colors?.backgroundLight};
  border-bottom: 2px solid ${({ theme }) => theme?.colors?.border};
`;

export const Td = styled.td`
  padding: 10px 12px;
  color: ${({ theme }) => theme?.colors?.text};
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight};
  vertical-align: middle;
`;

export const Fila = styled.tr`
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.06 })};
  }
`;

// ── Insignias, KPIs y estados ───────────────────────────────────────────────

const TONOS = {
  exito: "success",
  peligro: "error",
  aviso: "warningDark",
  info: "info",
  neutro: "textSecondary",
};

const colorDeTono = (theme, tono) =>
  theme?.colors?.[TONOS[tono] ?? "textSecondary"] ?? "#64748b";

/**
 * Fórmula que da contraste suficiente en los dos temas sin tabla de excepciones:
 * texto con el token semántico, fondo el mismo token al 14%, borde al 35%.
 */
export const Badge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme, $tono }) => colorDeTono(theme, $tono)};
  background: ${({ theme, $tono }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.14 })};
  border: 1px solid ${({ theme, $tono }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.35 })};
`;

export const Kpi = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme?.colors?.backgroundCard};
  border: 1px solid ${({ theme, $tono }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.35 })};
`;

export const KpiTitulo = styled.span`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

export const KpiValor = styled.strong`
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
  color: ${({ theme, $tono }) => colorDeTono(theme, $tono)};
`;

export const Vacio = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

export const CirculoIcono = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ theme, $tono }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.12 })};
`;

/** Aviso en línea, para errores de acción y notas informativas. */
export const Aviso = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
  color: ${({ theme, $tono = "neutro" }) => colorDeTono(theme, $tono)};
  background: ${({ theme, $tono = "neutro" }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.1 })};
  border: 1px solid ${({ theme, $tono = "neutro" }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.3 })};
`;

// ── Lista de datos (la ficha) ───────────────────────────────────────────────

export const ListaDatos = styled.dl`
  display: grid;
  gap: 10px 16px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  margin: 0;
`;

export const DatoContenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const DatoEtiqueta = styled.dt`
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textTertiary ?? theme?.colors?.textSecondary};
`;

export const DatoValor = styled.dd`
  margin: 0;
  font-size: 14px;
  word-break: break-word;
  color: ${({ theme }) => theme?.colors?.text};
`;

// ── Paginación ──────────────────────────────────────────────────────────────

export const PiePaginacion = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid ${({ theme }) => theme?.colors?.border};
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

// ── Navegación y formularios ────────────────────────────────────────────────

/**
 * Enlace de vuelta. Es un Link y no un ButtonUI para conservar cmd/ctrl+click y
 * el click con la rueda; y va a una ruta fija, no a history.back().
 */
export const EnlaceVolver = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.primary};

  &:hover {
    text-decoration: underline;
  }
`;

/** Link con pinta de botón, para "Editar" desde la ficha. */
export const BotonEnlace = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 5px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.white ?? "#ffffff"};
  background: ${({ theme }) => theme?.colors?.primary};

  &:hover {
    filter: brightness(1.1);
    color: ${({ theme }) => theme?.colors?.white ?? "#ffffff"};
  }
`;

/** No existe textarea en el kit del Portal: se replica el estilo de InputUI. */
export const AreaTexto = styled.textarea`
  width: 100%;
  min-height: 76px;
  padding: 8px 10px;
  border-radius: 5px;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.45;
  resize: vertical;
  color: ${({ theme }) => theme?.colors?.text};
  background: ${({ theme }) => theme?.colors?.inputBackground};
  border: 1px solid ${({ theme }) => theme?.colors?.inputBorder ?? theme?.colors?.border};
  color-scheme: ${({ theme }) => (theme?.name === "dark" ? "dark" : "light")};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.focusRing ?? theme?.colors?.primary};
    outline-offset: 1px;
    border-color: ${({ theme }) => theme?.colors?.inputFocus ?? theme?.colors?.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme?.colors?.placeholder};
  }
`;

export const FilaFormulario = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(${({ $min = 220 }) => $min}px, 1fr));
`;

export const Separador = styled.hr`
  margin: 4px 0;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme?.colors?.divider ?? theme?.colors?.border};
`;

/** Historial de movimientos de la ficha. */
export const LineaTiempo = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const ItemTiempo = styled.li`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 12px;
  border-left: 3px solid ${({ theme, $tono }) =>
    hexToRGBA({ hex: colorDeTono(theme, $tono), alpha: 0.5 })};
`;

export const TextoTenue = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;
