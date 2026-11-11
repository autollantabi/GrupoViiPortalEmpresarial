import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { DocTec_ActualizarDiccionario, DocTec_ObtenerDiccionario } from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { toast } from "react-toastify";

/* =====================================================================================
   Diccionario SAP B1: tablas, campos, relaciones, JOIN y valores reales de SAP.
   Los colores vienen del tema del portal (ver estilos/RaizDoc.jsx).
   ===================================================================================== */

const Estilos = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;

  /* Subcabecera de búsqueda */
  .sub-header {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 10px 20px;
    background: var(--panel);
    border-bottom: 1px solid var(--borde);
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .sub-header-marca {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sub-header-marca h1 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    white-space: nowrap;
    color: var(--titulo);
    letter-spacing: 0.02em;
  }
  .base-pill {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    border-radius: 4px;
    padding: 3px 8px;
    font: 700 11.5px var(--fuente-mono);
    white-space: nowrap;
  }
  .buscar-wrap {
    flex: 1;
    position: relative;
    max-width: 520px;
    min-width: 220px;
  }
  .buscar-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--suave);
    font-size: 12px;
    pointer-events: none;
  }
  .buscar {
    width: 100%;
    padding: 7px 12px 7px 30px;
    border: 1px solid var(--borde);
    border-radius: 6px;
    background: var(--bg);
    color: var(--texto);
    font: inherit;
    font-size: 13px;
    transition: all 0.15s ease;
  }
  .buscar:focus {
    outline: 2px solid var(--acento);
    background: var(--panel);
    border-color: transparent;
  }

  /* Valores reales de SAP: estado de la última lectura y botón para volver a leer */
  .sap-estado {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--suave);
  }
  .sap-estado b {
    color: var(--texto);
  }
  .btn-sap {
    border: 1px solid var(--acento-boton);
    background: var(--acento-boton);
    color: var(--sobre-acento);
    border-radius: 6px;
    padding: 7px 14px;
    font: 700 12.5px var(--fuente);
    cursor: pointer;
    white-space: nowrap;
  }
  .btn-sap:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .btn-sap:disabled {
    opacity: 0.7;
    cursor: progress;
  }
  .btn-sap:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .sap-panel {
    padding: 10px 20px;
    border-bottom: 1px solid var(--borde);
    background: var(--panel);
    font-size: 12.5px;
    color: var(--texto);
    flex-shrink: 0;
    max-height: 40vh;
    overflow-y: auto;
  }
  .sap-panel p {
    margin: 0 0 6px;
  }
  .sap-panel .ok {
    color: var(--ok);
    font-weight: 700;
  }
  .sap-panel .mal {
    color: var(--error);
    font-weight: 700;
  }
  .sap-panel .aviso {
    color: var(--aviso);
    font-weight: 700;
  }
  .sap-panel details {
    margin: 4px 0;
  }
  .sap-panel summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--titulo);
  }
  .sap-panel ul {
    margin: 4px 0 4px 18px;
    padding: 0;
  }
  .sap-panel code {
    font: 12px var(--fuente-mono);
    color: var(--acento-texto);
  }
  .sap-panel .nota {
    color: var(--suave);
  }

  /* Distribución: panel lateral + detalle (cada uno con su propio scroll) */
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(220px, 27%) 1fr;
    flex: 1;
    min-height: 0;
  }
  nav.lista {
    border-right: 1px solid var(--borde);
    background: var(--panel);
    overflow-y: auto;
    min-height: 0;
  }
  .base-nav {
    padding: 12px 18px 10px;
    border-bottom: 1px solid var(--borde);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .base-nav span {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
    color: var(--suave);
  }
  .base-nav b {
    font: 700 12px var(--fuente-mono);
    color: var(--acento-texto);
    background: var(--acento-fondo);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .modulo {
    padding: 14px 18px 4px;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 800;
    color: var(--suave);
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    padding: 8px 18px;
    border: 0;
    background: none;
    color: var(--texto);
    cursor: pointer;
    font: inherit;
    border-left: 3px solid transparent;
    transition: background 0.12s, border-color 0.12s;
  }
  .item:hover {
    background: var(--hover);
  }
  .item.activo {
    background: var(--acento-fondo);
    border-left-color: var(--marca);
  }
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .item b {
    font-family: var(--fuente-mono);
    font-size: 13px;
    color: var(--titulo);
    font-weight: 700;
  }
  .item .item-es {
    color: var(--suave);
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item-count {
    font-size: 11px;
    font-family: var(--fuente-mono);
    color: var(--suave);
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
  }
  .item.activo .item-count {
    background: var(--panel);
    color: var(--acento-texto);
    font-weight: 700;
  }

  /* Detalle de tabla */
  .detalle {
    padding: 24px 28px 64px;
    overflow-y: auto;
    min-height: 0;
  }
  .detalle-interno {
    max-width: 1040px;
  }
  .hero-card {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .hero-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 6px;
  }
  .hero-titulo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .hero-titulo {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    font-family: var(--fuente-mono);
    color: var(--titulo);
    letter-spacing: 0.02em;
  }
  .hero-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .chip {
    background: var(--bg);
    color: var(--suave);
    border: 1px solid var(--borde);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
  }
  .chip.acento {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    border-color: transparent;
    font-family: var(--fuente-mono);
    font-weight: 700;
  }
  .hero-sub {
    color: var(--suave);
    font-size: 13.5px;
    margin-bottom: 12px;
  }
  .hero-desc {
    font-size: 13.5px;
    color: var(--texto);
    line-height: 1.55;
    padding-top: 12px;
    border-top: 1px solid var(--borde);
  }

  .seccion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 28px 0 12px;
    gap: 12px;
    flex-wrap: wrap;
  }
  .seccion-titulo {
    margin: 0;
    font-size: 13.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--titulo);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .contador-pill {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    font: 700 11px var(--fuente-mono);
    padding: 2px 7px;
    border-radius: 999px;
  }
  .seccion-guia {
    font-size: 12px;
    color: var(--suave);
  }

  /* Tablas crudas */
  .card-tabla {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    margin-bottom: 24px;
  }
  table.tabla-cruda {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
    table-layout: fixed;
  }
  table.tabla-cruda th {
    background: var(--bg);
    padding: 10px 14px;
    border-bottom: 1px solid var(--borde);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--suave);
    font-weight: 700;
  }
  table.tabla-cruda td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--borde);
    vertical-align: top;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  table.tabla-cruda tr:last-child td {
    border-bottom: 0;
  }
  table.campos th:nth-child(1) {
    width: 200px;
  }
  table.campos th:nth-child(2) {
    width: 28%;
  }
  table.campos td:first-child {
    overflow-wrap: normal;
    word-break: normal;
  }
  .campo-codigo {
    overflow-wrap: normal;
    word-break: normal;
  }

  tr.fila-campo {
    cursor: pointer;
    transition: background 0.1s ease;
  }
  tr.fila-campo:hover td {
    background: var(--hover);
  }
  tr.fila-campo.abierta td {
    background: var(--acento-fondo);
    border-bottom-color: transparent;
  }
  .col-campo {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chev-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: var(--bg);
    color: var(--suave);
    font-size: 10px;
    transition: transform 0.15s ease, background 0.15s;
    flex-shrink: 0;
  }
  tr.fila-campo:hover .chev-icon {
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }
  tr.fila-campo.abierta .chev-icon {
    transform: rotate(90deg);
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }
  .campo-codigo {
    font-family: var(--fuente-mono);
    font-weight: 700;
    color: var(--titulo);
    font-size: 13px;
  }
  .det {
    color: var(--suave);
    font-size: 12.5px;
  }

  /* Panel desplegable: SQL, valores y diagrama */
  tr.detalle-campo > td {
    background: var(--detalle-fondo);
    padding: 16px 20px 20px 38px;
    border-bottom: 1px solid var(--borde);
  }
  .inspector-campo {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .inspector-subtitulo {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--suave);
    margin-bottom: 6px;
  }
  .caja-sql {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    overflow: hidden;
  }
  .caja-sql-barra {
    background: var(--sub-fondo);
    padding: 6px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--borde);
  }
  .caja-sql-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--suave);
    font-family: var(--fuente-mono);
  }
  .btn-copiar {
    background: var(--panel);
    border: 1px solid var(--borde);
    color: var(--texto);
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.12s;
  }
  .btn-copiar:hover {
    border-color: var(--acento);
    color: var(--acento-texto);
  }
  .btn-copiar.copiado {
    border-color: var(--ok);
    color: var(--ok);
  }
  pre.sql-texto {
    margin: 0;
    padding: 10px 14px;
    font-family: var(--fuente-mono);
    font-size: 12px;
    line-height: 1.5;
    color: var(--texto);
    overflow-x: auto;
    background: var(--panel);
    white-space: pre-wrap;
  }
  .kw {
    color: var(--kw);
    font-weight: 700;
  }
  .st {
    color: var(--st);
  }

  .grid-inspector {
    display: grid;
    grid-template-columns: minmax(260px, 320px) 1fr;
    gap: 18px;
    align-items: start;
  }
  @media (max-width: 1100px) {
    .grid-inspector {
      grid-template-columns: 1fr;
    }
  }
  table.resultado {
    width: 100%;
    border-collapse: collapse;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    overflow: hidden;
    font-size: 12px;
  }
  table.resultado th {
    background: var(--sub-fondo);
    padding: 7px 12px;
    border-bottom: 1px solid var(--borde);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--suave);
    text-align: left;
  }
  table.resultado td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--borde);
    font-family: var(--fuente-mono);
    color: var(--texto);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 480px;
  }
  table.resultado tr:last-child td {
    border-bottom: 0;
  }
  .nulo {
    color: var(--suave);
    font-style: italic;
  }

  /* Diagrama relacional */
  .card-diagrama {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 14px 16px;
  }
  .dg-flujo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }
  .dg-nodo {
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 8px 12px;
    flex: 1;
    min-width: 0;
  }
  .dg-nodo-t {
    font-family: var(--fuente-mono);
    font-weight: 800;
    font-size: 12px;
    color: var(--titulo);
  }
  .dg-nodo-s {
    font-size: 10.5px;
    color: var(--suave);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dg-campo-pill {
    font-family: var(--fuente-mono);
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }
  .dg-campo-pill.origen {
    background: var(--acento-fondo);
    color: var(--acento-texto);
  }
  .dg-campo-pill.destino {
    background: var(--ok-fondo);
    color: var(--ok);
  }
  .dg-campo-pill .etiqueta {
    font-size: 10px;
    font-weight: 700;
    opacity: 0.8;
  }
  .dg-conector-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 130px;
  }
  .dg-regla-badge {
    font-size: 10.5px;
    font-weight: 700;
    font-family: var(--fuente-mono);
    color: var(--acento-texto);
    background: var(--sub-fondo);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    border: 1px solid var(--borde);
  }
  .dg-flecha-svg {
    width: 100%;
    height: 16px;
  }
  .dg-nota-pie {
    font-size: 11.5px;
    color: var(--suave);
    margin: 8px 0 0;
    line-height: 1.45;
  }
  .nota {
    font-size: 11.5px;
    color: var(--suave);
    margin: 6px 0 0;
  }
  .nota.aviso {
    color: var(--aviso);
  }

  /* Enlaces de tabla y usos */
  a.tabla {
    color: var(--acento-texto);
    font-family: var(--fuente-mono);
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }
  code.fuera {
    opacity: 0.6;
    font-family: var(--fuente-mono);
  }
  .usos {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .usos a.tabla,
  .usos code {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 11.5px;
  }

  /* Grid inicial */
  .grid-inicio {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 10px;
    margin-top: 16px;
  }
  .tarjeta-inicio {
    text-align: left;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 12px 14px;
    cursor: pointer;
    color: var(--texto);
    font: inherit;
    transition: all 0.12s;
  }
  .tarjeta-inicio:hover {
    border-color: var(--acento);
    background: var(--acento-fondo);
  }
  .tarjeta-inicio b {
    font-family: var(--fuente-mono);
    font-size: 13.5px;
    display: block;
    color: var(--titulo);
  }
  .tarjeta-inicio span {
    display: block;
    color: var(--suave);
    font-size: 12px;
  }
  .tarjeta-inicio span.cuenta {
    font-size: 11px;
    margin-top: 4px;
  }

  @media (max-width: 900px) {
    .cuerpo {
      grid-template-columns: 1fr;
      grid-template-rows: 40% 1fr;
    }
    nav.lista {
      border-right: 0;
      border-bottom: 1px solid var(--borde);
    }
    .detalle {
      padding: 16px;
    }
  }
`;

/* ----------------------------- utilidades ----------------------------- */

const normaliza = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const esVacio = (v) => v === "NULL" || v === "(vacío)";

const Valor = ({ v }) => (esVacio(v) ? <span className="nulo">{v}</span> : <>{v}</>);

/** Da formato legible a una consulta SELECT (una columna por línea, JOIN y ON en líneas aparte). */
function formateaSql(sql) {
  const m = /^SELECT (DISTINCT )?(.*?) FROM (.*)$/s.exec(sql);
  if (!m) return sql;
  const sel = "SELECT " + (m[1] || "");
  const sangria = " ".repeat(sel.length);
  const columnas = m[2]
    .split(/,\s*/)
    .map((c, i) => (i ? sangria : "") + c)
    .join(",\n");
  const resto = ("FROM " + m[3])
    .replace(/ (INNER JOIN|LEFT JOIN) /g, "\n$1 ")
    .replace(/ ON /g, "\n        ON ")
    .replace(/ (WHERE|GROUP BY|ORDER BY|LIMIT) /g, "\n$1 ");
  return sel + columnas + "\n" + resto;
}

const PALABRAS_SQL =
  /\b(SELECT|DISTINCT|FROM|INNER JOIN|LEFT JOIN|ON|WHERE|GROUP BY|ORDER BY|LIMIT|AS|COUNT|ASC|DESC|AND|OR)\b/g;

/** Resalta palabras clave y textos entre comillas simples, sin usar HTML crudo. */
function resaltaSql(texto) {
  return texto.split(/('[^']*')/g).map((parte, i) => {
    if (i % 2 === 1) return <span key={i} className="st">{parte}</span>;
    const trozos = [];
    let ultimo = 0;
    for (const m of parte.matchAll(PALABRAS_SQL)) {
      if (m.index > ultimo) trozos.push(parte.slice(ultimo, m.index));
      trozos.push(<span key={`${i}-${m.index}`} className="kw">{m[0]}</span>);
      ultimo = m.index + m[0].length;
    }
    if (ultimo < parte.length) trozos.push(parte.slice(ultimo));
    return <React.Fragment key={i}>{trozos}</React.Fragment>;
  });
}

/* ----------------------------- bloques ----------------------------- */

function BloqueSql({ sql }) {
  const [copiado, setCopiado] = useState(false);
  const texto = formateaSql(sql);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* sin permiso de portapapeles: el texto sigue siendo seleccionable */
    }
  };

  return (
    <div className="caja-sql">
      <div className="caja-sql-barra">
        <span className="caja-sql-label">CONSULTA SQL SAP HANA</span>
        <button type="button" className={`btn-copiar${copiado ? " copiado" : ""}`} onClick={copiar}>
          {copiado ? "✓ Copiado" : "Copiar SQL"}
        </button>
      </div>
      <pre className="sql-texto">{resaltaSql(texto)}</pre>
    </div>
  );
}

function Diagrama({ ctx, origenCod, origenCampo, destCod, destCampo, card, op = {} }) {
  const nombreCampo = ctx.nombres[destCod];
  const externa = !ctx.porCodigo[destCod];
  const textoDest = op.nombre ? op.nombre : nombreCampo ? nombreCampo : "";
  const claveDest = destCampo + (op.clave !== undefined ? " = " + op.clave : "");

  return (
    <div className="card-diagrama">
      <div className="inspector-subtitulo">Relación con otra tabla</div>
      <div className="dg-flujo">
        <div className="dg-nodo">
          <div className="dg-nodo-t">{origenCod}</div>
          <div className="dg-nodo-s">{ctx.etiquetaTabla(origenCod)}</div>
          <div className="dg-campo-pill origen">
            <span>{origenCampo}</span>
          </div>
        </div>
        <div className="dg-conector-wrap">
          <span className="dg-regla-badge">{card}</span>
          <svg className="dg-flecha-svg" viewBox="0 0 130 16" preserveAspectRatio="none">
            <line x1="2" y1="8" x2="118" y2="8" stroke="var(--acento)" strokeWidth="2" />
            <polygon points="126,8 116,4 116,12" fill="var(--acento)" />
          </svg>
        </div>
        <div className="dg-nodo">
          <div className="dg-nodo-t">{destCod}</div>
          <div className="dg-nodo-s">
            {ctx.etiquetaTabla(destCod)}
            {externa ? " · externa" : ""}
          </div>
          <div className="dg-campo-pill destino">
            <span>{claveDest}</span>
            <span className="etiqueta">LLAVE</span>
          </div>
          {textoDest && (
            <div className="dg-campo-pill destino" style={{ marginTop: 3 }}>
              <span>{textoDest}</span>
              <span className="etiqueta">NOMBRE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TablaNombres({ ctx, tabla, campo, destCod, valores }) {
  const nom = ctx.nombres[destCod];
  const cat = ctx.catalogos[destCod];
  if (!nom || !cat || !valores || !valores.length) return null;
  const mapa = new Map(cat.filas.map((f) => [String(f[0]), f[1]]));

  return (
    <div style={{ marginTop: 10 }}>
      <div className="inspector-subtitulo">Cruce con catálogo ({destCod})</div>
      <table className="resultado">
        <thead>
          <tr>
            <th>{tabla.codigo + "." + campo}</th>
            <th>{"→ " + destCod + "." + nom}</th>
          </tr>
        </thead>
        <tbody>
          {valores.map((v, i) => {
            const clave = v === "(vacío)" ? "" : v;
            let nombre;
            if (v === "NULL") nombre = <span className="nulo">(sin valor)</span>;
            else if (mapa.has(clave))
              nombre = mapa.get(clave) === "" ? <span className="nulo">(nombre vacío)</span> : mapa.get(clave);
            else
              nombre = (
                <span className="nulo">
                  {cat.parcial ? "(no está en la lista parcial)" : "(no existe en " + destCod + ")"}
                </span>
              );
            return (
              <tr key={i}>
                <td>
                  <Valor v={v} />
                </td>
                <td>{nombre}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TablaResultado({ cols, filas, estilo }) {
  return (
    <table className="resultado" style={estilo}>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>
            {f.map((v, j) => (
              <td key={j}>
                <Valor v={v} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BloqueJoin({ tabla, campo }) {
  const j = (tabla.joins || {})[campo];
  if (!j) return null;

  if (j.todas) {
    const f = j.todas_fuera || {};
    return (
      <div style={{ marginTop: 14 }}>
        <div className="inspector-subtitulo">Listado completo de valores usados ({j.todas.length})</div>
        <BloqueSql sql={j.todas_sql} />
        <TablaResultado cols={j.todas_cols} filas={j.todas} estilo={{ marginTop: 8 }} />
        <p className="nota">
          Fuera de este listado (el INNER JOIN los descarta): {f.nulos} con NULL y {f.vacios} con valor vacío.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div className="inspector-subtitulo">Consulta con el nombre (JOIN)</div>
      <BloqueSql sql={j.sql} />
      {j.filas && j.filas.length > 0 && <TablaResultado cols={j.cols} filas={j.filas} estilo={{ marginTop: 8 }} />}
      {j.filas && j.filas.length === 0 && (
        <p className="nota">Esta consulta no devuelve filas en la muestra actual.</p>
      )}
      {j.parcial && <p className="nota aviso">Catálogo parcial: solo se conocen estos nombres reales.</p>}
    </div>
  );
}

function EnlaceUso({ ctx, cod, campo }) {
  return ctx.porCodigo[cod] ? (
    <a className="tabla" onClick={() => ctx.ir(cod)}>
      {cod + "." + campo}
    </a>
  ) : (
    <code className="fuera" title="Esta tabla aún no está en el diccionario">
      {cod + "." + campo}
    </code>
  );
}

function PanelMuestra({ ctx, tabla, campo }) {
  const m = (tabla.muestras || {})[campo];
  const valores = m && m.f === "real" ? m.v : null;
  const sqlBase = `SELECT DISTINCT "${campo}" FROM "${ctx.base}"."${tabla.codigo}" ORDER BY "${campo}" ASC LIMIT 5;`;

  const muestraValores = valores && (
    <div>
      <div className="inspector-subtitulo">5 valores reales en producción</div>
      <table className="resultado">
        <thead>
          <tr>
            <th>{campo}</th>
          </tr>
        </thead>
        <tbody>
          {valores.map((v, i) => (
            <tr key={i}>
              <td>
                <Valor v={v} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Caso especial: QryGroup1..64 se cruzan con OITG por posición
  const qry = tabla.codigo === "OITM" && /^QryGroup(\d+)$/.exec(campo);
  if (qry) {
    const n = qry[1];
    const cat = ctx.catalogos.OITG;
    const fila = cat && cat.filas.find((f) => String(f[0]) === n);
    const nombreProp = fila ? fila[1] : "";
    return (
      <div className="inspector-campo">
        <BloqueSql sql={sqlBase} />
        <div className="grid-inspector">
          {muestraValores}
          <div>
            <Diagrama
              ctx={ctx}
              origenCod="OITM"
              origenCampo={campo}
              destCod="OITG"
              destCampo="ItmsTypCod"
              card="por posición fija"
              op={{ clave: n, nombre: nombreProp }}
            />
            <p className="dg-nota-pie">
              El número del campo coincide con el número de la propiedad: <code>{campo}</code> indica si el artículo
              tiene la propiedad <b>{n}</b> de OITG{nombreProp && <> (<b>{nombreProp}</b>)</>}. El JOIN posicional
              usa <code>ItmsTypCod = {n}</code> y el filtro <code>{campo} = 'Y'</code>.
            </p>
            <BloqueJoin tabla={tabla} campo={campo} />
          </div>
        </div>
      </div>
    );
  }

  const fks = (tabla.relaciones || []).filter((r) => r[0] === campo && /^N:1/.test(r[3]));
  const usos = (tabla.relaciones || []).filter((r) => r[0] === campo && /^1:N/.test(r[3]));
  const tieneFilasJoin = (tabla.joins || {})[campo] && (tabla.joins[campo].filas || []).length > 0;

  return (
    <div className="inspector-campo">
      <BloqueSql sql={sqlBase} />
      <div className="grid-inspector">
        {muestraValores}
        <div>
          {fks.map(([, destCod, destCampo, card], i) => (
            <div key={i}>
              <Diagrama
                ctx={ctx}
                origenCod={tabla.codigo}
                origenCampo={campo}
                destCod={destCod}
                destCampo={destCampo}
                card={card}
              />
              {!tieneFilasJoin && <TablaNombres ctx={ctx} tabla={tabla} campo={campo} destCod={destCod} valores={valores} />}
              <BloqueJoin tabla={tabla} campo={campo} />
            </div>
          ))}
          {usos.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div className="inspector-subtitulo">Tablas que usan este campo como clave</div>
              <div className="usos">
                {usos.map((r, i) => (
                  <EnlaceUso key={i} ctx={ctx} cod={r[1]} campo={r[2]} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListadoCatalogo({ ctx, tabla }) {
  const c = ctx.catalogos[tabla.codigo];
  const v = tabla.valores;
  if (!c || c.parcial) {
    return (
      <>
        <div className="seccion-header">
          <h2 className="seccion-titulo">{v.titulo}</h2>
        </div>
        <div className="card-tabla">
          <table className="tabla-cruda">
            <thead>
              <tr>
                {v.cols.map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {v.filas.map((f, i) => (
                <tr key={i}>
                  {f.map((y, j) => (
                    <td key={j}>{y}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="seccion-header">
        <h2 className="seccion-titulo">
          Listado completo del catálogo <span className="contador-pill">{c.filas.length}</span>
        </h2>
      </div>
      <div className="card-tabla">
        <table className="tabla-cruda">
          <thead>
            <tr>
              <th>{c.clave}</th>
              <th>{c.nombre}</th>
            </tr>
          </thead>
          <tbody>
            {c.filas.map((f, i) => (
              <tr key={i}>
                <td>
                  <code className="mono" style={{ fontWeight: 700 }}>{f[0]}</code>
                </td>
                <td>{f[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilaCampo({ ctx, tabla, campo, abierto, alternar }) {
  const [c0, c1, c2] = campo;
  const teclado = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      alternar(c0);
    }
  };
  return (
    <>
      <tr
        className={`fila-campo${abierto ? " abierta" : ""}`}
        tabIndex={0}
        role="button"
        aria-expanded={abierto}
        onClick={() => alternar(c0)}
        onKeyDown={teclado}
      >
        <td>
          <div className="col-campo">
            <span className="chev-icon">▸</span>
            <span className="campo-codigo">{c0}</span>
          </div>
        </td>
        <td>
          <strong>{c1}</strong>
        </td>
        <td className="det">{c2 ? c2 : <span style={{ opacity: 0.4 }}>—</span>}</td>
      </tr>
      {abierto && (
        <tr className="detalle-campo">
          <td colSpan={3}>
            <PanelMuestra ctx={ctx} tabla={tabla} campo={c0} />
          </td>
        </tr>
      )}
    </>
  );
}

function EnlaceTabla({ ctx, cod }) {
  const base = cod.split(/[ ./]/)[0];
  return ctx.porCodigo[base] ? (
    <a className="tabla" onClick={() => ctx.ir(base)}>
      {cod}
    </a>
  ) : (
    <code className="fuera" title="Esta tabla aún no está en el diccionario">
      {cod}
    </code>
  );
}

function DetalleTabla({ ctx, tabla, abiertos, alternar }) {
  const rel = tabla.relaciones || [];
  return (
    <>
      <div className="hero-card">
        <div className="hero-header">
          <div className="hero-titulo-wrap">
            <h1 className="hero-titulo">{tabla.codigo}</h1>
            <div className="hero-badges">
              <span className="chip acento">Llave: {tabla.llave}</span>
              <span className="chip">Módulo: {tabla.modulo}</span>
              <span className="chip">{tabla.tipo}</span>
            </div>
          </div>
          <span className="contador-pill">{tabla.campos.length} campos</span>
        </div>
        <div className="hero-sub">
          {tabla.es} · <i>{tabla.nombre}</i>
        </div>
        <div className="hero-desc">{tabla.desc}</div>
      </div>

      <div className="seccion-header">
        <h2 className="seccion-titulo">
          Campos de la tabla <span className="contador-pill">{tabla.campos.length}</span>
        </h2>
        <span className="seccion-guia">Haz clic en una fila para desplegar valores reales y relaciones</span>
      </div>

      <div className="card-tabla">
        <table className="tabla-cruda campos">
          <thead>
            <tr>
              <th>Campo</th>
              <th>Qué guarda</th>
              <th>Descripción técnica</th>
            </tr>
          </thead>
          <tbody>
            {tabla.campos.map((campo) => (
              <FilaCampo
                key={campo[0]}
                ctx={ctx}
                tabla={tabla}
                campo={campo}
                abierto={abiertos.has(campo[0])}
                alternar={alternar}
              />
            ))}
          </tbody>
        </table>
      </div>

      {rel.length > 0 && (
        <>
          <div className="seccion-header">
            <h2 className="seccion-titulo">Relaciones de la tabla</h2>
          </div>
          <div className="card-tabla">
            <table className="tabla-cruda">
              <thead>
                <tr>
                  <th>Campo local</th>
                  <th>Tabla destino</th>
                  <th>Campo destino</th>
                  <th>Cardinalidad</th>
                </tr>
              </thead>
              <tbody>
                {rel.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <code className="mono" style={{ fontWeight: 700 }}>{r[0]}</code>
                    </td>
                    <td>
                      <EnlaceTabla ctx={ctx} cod={r[1]} />
                    </td>
                    <td>
                      <code className="mono">{r[2]}</code>
                    </td>
                    <td>
                      <span className="contador-pill" style={{ fontSize: 11 }}>{r[3]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tabla.valores && <ListadoCatalogo ctx={ctx} tabla={tabla} />}
    </>
  );
}

/* ----------------------------- lectura de SAP ----------------------------- */

const fechaHora = (iso) =>
  new Date(iso)
    .toLocaleString("es-EC", { timeZone: "America/Guayaquil", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(",", "");
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* ----------------------------- pantalla ----------------------------- */

export const DocTecDiccionario = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [version, setVersion] = useState(0); // sube al actualizar: vuelve a pedir el diccionario
  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState(() => decodeURIComponent(window.location.hash.slice(1)) || null);
  const [abiertos, setAbiertos] = useState(() => new Set());
  const detalleRef = useRef(null);

  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerDiccionario()
      .then((d) => vivo && setDatos(d))
      .catch((e) => vivo && setError(e.response?.data?.message ?? "No se pudo cargar el diccionario. Revisa que la API esté disponible."));
    return () => {
      vivo = false;
    };
  }, [version]);

  const actualizar = async () => {
    setActualizando(true);
    try {
      const r = await DocTec_ActualizarDiccionario();
      const a = r.actualizacion;
      toast.success(`Valores de SAP actualizados: ${plural(a.muestras_cambiadas, "muestra cambiada", "muestras cambiadas")}, ${plural(a.fallos.length, "consulta con problemas", "consultas con problemas")}.`);
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e.response?.data?.message ?? "No se pudo actualizar desde SAP. Revisa que la API y SAP estén disponibles.");
    } finally {
      setActualizando(false);
    }
  };

  const ir = (cod) => {
    setCodigo(cod);
    setAbiertos(new Set());
    window.history.replaceState(null, "", "#" + encodeURIComponent(cod));
    detalleRef.current?.scrollTo(0, 0);
  };

  const alternar = (campo) =>
    setAbiertos((prev) => {
      const sig = new Set(prev);
      if (sig.has(campo)) sig.delete(campo);
      else sig.add(campo);
      return sig;
    });

  const ctx = useMemo(() => {
    if (!datos) return null;
    const porCodigo = Object.fromEntries(datos.tablas.map((t) => [t.codigo, t]));
    const externas = datos.externas || {};
    return {
      base: datos.base,
      porCodigo,
      nombres: datos.nombres || {},
      catalogos: datos.catalogos || {},
      etiquetaTabla: (cod) => (porCodigo[cod] && porCodigo[cod].es) || externas[cod] || "",
      ir,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos]);

  const q = normaliza(busqueda.trim());
  const coincide = (t) => {
    if (!q) return true;
    const texto = [t.codigo, t.nombre, t.es, t.desc, ...t.campos.map((c) => c[0] + " " + c[1] + " " + (c[2] || ""))].join(" ");
    return normaliza(texto).includes(q);
  };

  if (error)
    return (
      <RaizDoc>
        <div style={{ padding: 28, color: "var(--suave)" }}>{error}</div>
      </RaizDoc>
    );
  if (!datos)
    return (
      <RaizDoc>
        <LoaderUI text="Cargando diccionario…" height="100%" />
      </RaizDoc>
    );

  const tabla = ctx.porCodigo[codigo];

  return (
    <RaizDoc>
      <Estilos>
        <header className="sub-header">
          <div className="sub-header-marca">
            <h1>Diccionario SAP B1</h1>
            <span className="base-pill" title="Base de datos a la que pertenecen todas las tablas">
              {datos.base + " (" + datos.tablas.length + " tablas)"}
            </span>
          </div>
          <div className="buscar-wrap">
            <InputUI type="search" placeholder="Buscar tabla o campo: OITM, FirmCode, proveedor…" value={busqueda} onChange={setBusqueda} />
          </div>
          {(datos.puede_actualizar || datos.actualizacion) && (
            <div className="sap-estado">
              <span>
                Valores reales:{" "}
                <b>{datos.actualizacion ? `SAP, ${fechaHora(datos.actualizacion.fecha_hora)}` : "foto del proyecto Django"}</b>
              </span>
              {datos.puede_actualizar && (
                <ButtonUI text={actualizando ? "Leyendo SAP…" : "Actualizar desde SAP"} variant="outlined" onClick={actualizar} disabled={actualizando} />
              )}
            </div>
          )}
        </header>

        <div className="cuerpo">
          <nav className="lista">
            <div className="base-nav">
              <span>Base de datos</span>
              <b>{datos.base}</b>
            </div>
            {datos.modulos.map((m) => {
              const ts = datos.tablas.filter((t) => t.modulo === m && coincide(t));
              if (!ts.length) return null;
              return (
                <React.Fragment key={m}>
                  <div className="modulo">{m}</div>
                  {ts.map((t) => (
                    <button
                      type="button"
                      key={t.codigo}
                      className={`item${t.codigo === codigo ? " activo" : ""}`}
                      onClick={() => ir(t.codigo)}
                    >
                      <div className="item-info">
                        <b>{t.codigo}</b>
                        <span className="item-es">{t.es}</span>
                      </div>
                      <span className="item-count">{t.campos.length}</span>
                    </button>
                  ))}
                </React.Fragment>
              );
            })}
            {!datos.tablas.some(coincide) && (
              <div style={{ color: "var(--suave)", padding: "30px 18px", textAlign: "center" }}>Sin resultados</div>
            )}
          </nav>

          <section className="detalle" ref={detalleRef}>
            <div className="detalle-interno">
              {!tabla ? (
                <>
                  <div style={{ fontSize: 12, color: "var(--suave)", marginBottom: 4 }}>
                    Base de datos: <b className="mono" style={{ color: "var(--acento-texto)" }}>{datos.base}</b>
                  </div>
                  <h2 style={{ margin: "0 0 8px", color: "var(--titulo)", fontSize: 24, fontWeight: 800 }}>
                    Selecciona una tabla para explorar
                  </h2>
                  <p style={{ color: "var(--suave)", margin: "0 0 16px", fontSize: 13.5 }}>
                    Haz clic en una tabla del panel lateral o en las tarjetas para examinar sus campos en crudo,
                    muestras de datos y relaciones foráneas.
                  </p>
                  <div className="grid-inicio">
                    {datos.tablas.map((t) => (
                      <button type="button" key={t.codigo} className="tarjeta-inicio" onClick={() => ir(t.codigo)}>
                        <b>{t.codigo}</b>
                        <span>{t.es}</span>
                        <span className="cuenta">{t.campos.length} campos</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <DetalleTabla ctx={ctx} tabla={tabla} abiertos={abiertos} alternar={alternar} />
              )}
            </div>
          </section>
        </div>
      </Estilos>
    </RaizDoc>
  );
};
