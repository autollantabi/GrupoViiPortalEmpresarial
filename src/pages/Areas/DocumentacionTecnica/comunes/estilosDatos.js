import { css } from "styled-components";

/**
 * Estilos compartidos por las secciones de datos (Completitud y Calidad): filtros generales,
 * pestañas, tablas, botones y semáforo. Solo usan las variables de RaizDoc.
 * Equivalen a lo que en el proyecto Django vivía en calidad.css.
 */
export const estilosDatos = css`
  .titulo-fila {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 4px;
  }
  .titulo-fila h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: var(--titulo);
  }
  .aviso {
    background: var(--aviso-fondo);
    color: var(--aviso);
    padding: 10px 14px;
    border-radius: 8px;
    max-width: 70ch;
  }

  /* Botones */
  .boton {
    font: 600 0.92rem var(--fuente);
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--acento);
    background: var(--acento-boton);
    color: var(--sobre-acento);
    text-decoration: none;
    display: inline-block;
  }
  .boton:hover {
    filter: brightness(1.08);
  }
  .boton.secundario {
    background: var(--panel);
    color: var(--acento-texto);
  }
  .boton.secundario:hover {
    background: var(--acento-fondo);
    filter: none;
  }
  .boton:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }

  /* Filtros generales */
  .filtros-generales {
    margin: 6px 0 28px;
    padding: 20px 22px 16px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
  }
  .filtros-generales h2 {
    margin: 0 0 14px;
    font-size: 1.05rem;
    color: var(--titulo);
  }
  .campo-etq {
    display: block;
    margin-bottom: 5px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--texto);
  }
  .fg-fila {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 16px;
  }
  .fg-pie {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin-top: 14px;
  }
  .fg-cuenta {
    margin: 0;
    color: var(--suave);
    font-size: 0.9rem;
  }

  /* Filtro de opciones múltiples */
  .multi {
    position: relative;
    min-width: 0;
  }
  .multi-caja summary {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    min-height: 42px;
    padding: 6px 34px 6px 10px;
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 8px;
    cursor: pointer;
    position: relative;
  }
  .multi-caja summary::-webkit-details-marker {
    display: none;
  }
  .multi-caja summary::after {
    content: "";
    position: absolute;
    right: 13px;
    top: 50%;
    width: 7px;
    height: 7px;
    border-right: 2px solid var(--suave);
    border-bottom: 2px solid var(--suave);
    transform: translateY(-70%) rotate(45deg);
  }
  .multi-caja[open] summary {
    border-color: var(--acento);
  }
  .multi-caja[open] summary::after {
    transform: translateY(-30%) rotate(-135deg);
  }
  .multi-caja summary:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .multi-caja .vacio {
    color: var(--suave);
  }
  .multi-caja .sel {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--acento-fondo);
    color: var(--acento-texto);
    padding: 2px 9px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .multi-caja .sel.mas {
    background: var(--borde);
    color: var(--texto);
  }
  .sel-x {
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0 2px;
  }
  .multi-panel {
    position: absolute;
    z-index: 40;
    left: 0;
    top: calc(100% + 4px);
    min-width: 100%;
    width: max(100%, 17rem);
    max-width: min(23rem, 90vw);
    max-height: 380px;
    overflow: auto;
    padding: 8px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
  }
  .multi-panel ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .multi-panel li label {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.92rem;
  }
  .multi-panel li label:hover {
    background: var(--acento-fondo);
  }
  .multi-panel li input {
    accent-color: var(--acento);
    width: 16px;
    height: 16px;
    flex: none;
  }
  .multi-vacio {
    padding: 8px;
    color: var(--suave);
    font-size: 0.88rem;
  }
  .multi-buscar {
    width: 100%;
    margin-bottom: 6px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--texto);
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 6px 9px;
  }
  .multi-cuenta {
    margin: 8px 2px 0;
    padding-top: 6px;
    border-top: 1px solid var(--borde);
    font-size: 0.82rem;
    color: var(--suave);
  }
  .multi-cab {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: -2px 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--borde);
  }
  .multi-cab button {
    padding: 4px 6px;
    font: 600 0.85rem var(--fuente);
    color: var(--acento-texto);
    background: none;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
  }
  .multi-cab button:hover:not(:disabled) {
    background: var(--acento-fondo);
  }
  .multi-cab button:disabled {
    color: var(--suave);
    opacity: 0.6;
    cursor: default;
  }

  /* Pestañas */
  .tabs-atributos {
    display: flex;
    gap: 0 2px;
    overflow-x: auto;
    margin: 0 0 16px;
    border-bottom: 1px solid var(--borde);
    scrollbar-width: thin;
  }
  .tab {
    flex: none;
    padding: 10px 12px;
    margin-bottom: -1px;
    font: 600 0.86rem var(--fuente);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--suave);
    background: none;
    border: 0;
    border-bottom: 3px solid transparent;
    cursor: pointer;
  }
  .tab:hover {
    color: var(--texto);
  }
  .tab.activa {
    color: var(--titulo);
    border-bottom-color: var(--marca);
  }
  .tab:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
    border-radius: 4px;
  }

  /* Tablas */
  .cuenta {
    margin: 0;
    color: var(--suave);
    font-size: 0.9rem;
  }
  .tabla-barra {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin: 6px 0 8px;
  }
  .tabla-caja {
    position: relative;
    overflow: auto;
    border: 1px solid var(--borde);
    border-radius: 8px;
    background: var(--panel);
    max-height: 560px;
  }
  .tabla-caja.alta {
    max-height: 380px;
  }
  .tabla-pie {
    margin: 8px 2px 0;
    min-height: 1.3em;
    color: var(--suave);
    font-size: 0.88rem;
  }
  .tabla {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .tabla th {
    position: sticky;
    top: 0;
    background: var(--panel);
    text-align: left;
    font-weight: 700;
    padding: 8px 10px;
    color: var(--titulo);
    border-bottom: 2px solid var(--titulo);
    white-space: nowrap;
    z-index: 1;
  }
  .tabla td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--borde);
    vertical-align: top;
  }
  .tabla tbody tr:hover {
    background: var(--acento-fondo);
  }
  .tabla td:first-child {
    white-space: nowrap;
  }
  .tabla .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .tabla .cod {
    font-family: var(--fuente-mono);
    font-size: 0.84rem;
    white-space: nowrap;
  }
  .tabla .nom {
    min-width: 16rem;
  }

  /* Semáforo */
  .sf-verde {
    --sf: var(--ok);
    --sf-fondo: var(--ok-fondo);
  }
  .sf-amarillo {
    --sf: var(--aviso);
    --sf-fondo: var(--aviso-fondo);
  }
  .sf-rojo {
    --sf: var(--error);
    --sf-fondo: var(--error-fondo);
  }
  .bg-verde {
    background: var(--ok);
  }
  .bg-amarillo {
    background: var(--aviso);
  }
  .bg-rojo {
    background: var(--error);
  }
  .sf-pill {
    display: inline-block;
    padding: 1px 9px;
    border-radius: 999px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--sf);
    background: var(--sf-fondo);
  }
  .sf-verde-celda,
  .sf-amarillo-celda,
  .sf-rojo-celda {
    font-weight: 600;
  }
  .sf-verde-celda {
    color: var(--ok);
    background: var(--ok-fondo);
  }
  .sf-amarillo-celda {
    color: var(--aviso);
    background: var(--aviso-fondo);
  }
  .sf-rojo-celda {
    color: var(--error);
    background: var(--error-fondo);
  }
`;
