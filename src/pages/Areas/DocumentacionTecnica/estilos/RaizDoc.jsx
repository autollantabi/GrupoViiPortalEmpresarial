import React from "react";
import styled from "styled-components";

/** Convierte un color #rrggbb o #rgb del tema a rgba() sin depender de la firma de utils/colors del portal. */
function conOpacidad(hex, alpha = 1) {
  if (!hex || typeof hex !== "string") return `rgba(0, 0, 0, ${alpha})`;
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Contenedor raíz de las pantallas del módulo. Traduce los tokens del tema del portal
 * (theme.colors.*) a variables CSS locales, para que el CSS de las pantallas se lea igual
 * que el del diseño original y cambie solo con el tema claro/oscuro del portal.
 */
const Variables = styled.div`
  --bg: ${({ theme }) => theme.colors.background};
  --panel: ${({ theme }) => theme.colors.backgroundCard};
  --texto: ${({ theme }) => theme.colors.text};
  /* Accesibilidad: sobre fondos claros los tonos del portal (gris #6c757d, naranja #fd4703) quedan por debajo de 4,5:1
     de contraste. Para texto se usan variantes más oscuras; el naranja de marca se conserva en rellenos y bordes. */
  --suave: ${({ theme }) => (theme.name === "dark" ? theme.colors.textSecondary : "#5a6268")};
  --acento-texto: ${({ theme }) => (theme.name === "dark" ? "#ff8a5c" : "#b83200")};
  --acento-boton: ${({ theme }) => theme.colors.primary}; /* mismo relleno que ButtonUI del portal */
  --borde: ${({ theme }) => theme.colors.border};
  --acento: ${({ theme }) => theme.colors.primary};
  --acento-fondo: ${({ theme }) => conOpacidad(theme.colors.primary, 0.12)};
  --sobre-acento: #ffffff;
  --marca: ${({ theme }) => theme.colors.primary};
  --titulo: ${({ theme }) => theme.colors.text};
  /* En claro, el ámbar del portal (#e0a800) no tiene contraste suficiente para texto sobre su fondo: se usa uno más oscuro. */
  --aviso: ${({ theme }) => (theme.name === "dark" ? theme.colors.warningDark : "#8a5a00")};
  --aviso-fondo: ${({ theme }) => theme.colors.warningLight};
  --error: ${({ theme }) => (theme.name === "dark" ? theme.colors.errorDark : "#a71d2a")};
  --error-fondo: ${({ theme }) => theme.colors.errorLight};
  --ok: ${({ theme }) => (theme.name === "dark" ? theme.colors.successDark : "#1a7430")};
  --ok-fondo: ${({ theme }) => theme.colors.successLight};
  --sub-fondo: ${({ theme }) => theme.colors.backgroundDark};
  --detalle-fondo: ${({ theme }) => theme.colors.backgroundLight};
  --hover: ${({ theme }) => theme.colors.hover};
  --kw: ${({ theme }) => theme.colors.infoDark};
  --st: ${({ theme }) => theme.colors.successDark};
  --fuente: "Nunito Sans", sans-serif; /* la tipografía del portal (src/index.css) */
  /* Estados de calidad: se toman de los colores de estado del portal */
  --e-correcto: ${({ theme }) => theme.colors.success};
  --e-inconsistente: ${({ theme }) => theme.colors.error};
  --e-sin-clasificar: ${({ theme }) => theme.colors.warning};
  --e-no-verificable: ${({ theme }) => theme.colors.info};
  --e-no-evaluable: ${({ theme }) => theme.colors.gray};
  --fuente-titulo: "Nunito Sans", sans-serif;
  --fuente-mono: ui-monospace, Consolas, monospace;

  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--bg);
  color: var(--texto);
  font: 14px/1.5 var(--fuente);
  border-radius: 8px;
  overflow: hidden;

  .mono {
    font-family: var(--fuente-mono);
  }
`;

export const RaizDoc = ({ children, ...props }) => <Variables {...props}>{children}</Variables>;

/** Pantalla provisional para las secciones que aún no se construyen. */
export const SeccionPendiente = ({ titulo, detalle }) => (
  <RaizDoc>
    <div style={{ padding: "28px 36px" }}>
      <h2 style={{ margin: "0 0 8px", color: "var(--titulo)", fontSize: 24, fontWeight: 800 }}>{titulo}</h2>
      <p style={{ margin: 0, color: "var(--suave)" }}>{detalle || "Sección pendiente de construir."}</p>
    </div>
  </RaizDoc>
);
