import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  DocTec_ActualizarCalidad,
  DocTec_BuscarCalidad,
  DocTec_DescargarCalidadCsv,
  DocTec_ObtenerCalidadEvolucion,
  DocTec_ObtenerCalidadFilas,
  DocTec_ObtenerCalidadResumen,
} from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";
import { estilosDatos } from "../comunes/estilosDatos";
import { FiltroMultiple } from "../comunes/FiltroMultiple";

/* =====================================================================================
   Calidad de datos: compara cada atributo de la base con lo que dice el nombre del producto.
   Migración de apps/calidad (Django): índice general, detalle por producto y evolución semanal.
   ===================================================================================== */

const ETIQUETAS = {
  empresa: "Empresa",
  proveedor: "Proveedor principal",
  marca: "Marca",
  grupo: "Grupo",
  tipo: "Tipo de producto",
};
const SIN_FILTROS = { empresa: [], proveedor: [], marca: [], grupo: [], tipo: [] };
const POR_DEFECTO = { filtros: SIN_FILTROS, pmin: "0.00", pmax: "1.00", q: "" };

const coma = (n, dec) => Number(n).toFixed(dec).replace(".", ",");
const miles = (n) => Number(n).toLocaleString("de-DE");
const fechaHora = (iso) =>
  new Date(iso)
    .toLocaleString("es-EC", { timeZone: "America/Guayaquil", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(",", "");
const diaMes = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const fechaLarga = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;

const Estilos = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 48px;
  /* El diseño responde al ancho del contenido (el menú del portal ocupa parte de la ventana), no al de la ventana */
  container-type: inline-size;

  ${estilosDatos}

  code {
    font-family: var(--fuente-mono);
    font-size: 0.9em;
  }
  h2 {
    color: var(--titulo);
  }

  /* Puntos y rellenos de color (semáforo y estados) */
  .punto {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
    background: var(--suave);
  }
  .s-ok {
    background: var(--e-correcto);
  }
  .s-aviso {
    background: var(--e-sin-clasificar);
  }
  .s-error {
    background: var(--e-inconsistente);
  }
  .s-nd {
    background: var(--suave);
  }
  .e-correcto {
    background: var(--e-correcto);
  }
  .e-inconsistente {
    background: var(--e-inconsistente);
  }
  .e-sin-clasificar {
    background: var(--e-sin-clasificar);
  }
  .e-no-verificable {
    background: var(--e-no-verificable);
  }
  .e-no-evaluable {
    background: var(--e-no-evaluable);
  }
  #resultados.cargando {
    opacity: 0.5;
  }
  #resultados {
    transition: opacity 0.15s;
  }

  /* Resumen: el índice a la izquierda y la lista de atributos a la derecha */
  .resumen {
    display: grid;
    grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
    gap: 28px clamp(24px, 5vw, 64px);
    align-items: start;
    margin: 8px 0 48px;
  }
  .resumen-general h2 {
    margin: 0;
    font-size: 1.05rem;
  }
  .resumen-general .cifra {
    color: var(--titulo);
    margin: 0.1em 0 0.25em;
    font: 700 clamp(2.8rem, 6vw, 3.6rem) / 1 var(--fuente-titulo);
    letter-spacing: -0.01em;
  }
  .resumen-general .cifra span {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--suave);
    margin-left: 6px;
  }
  .resumen-general .expl {
    margin: 0 0 0.5em;
    max-width: 34ch;
  }
  .resumen-general .fuente {
    margin: 0 0 16px;
    color: var(--suave);
    font-size: 0.88rem;
  }
  .boton.activo {
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }
  .attr {
    display: grid;
    grid-template-columns: 8rem minmax(60px, 1fr) 4.4rem 5.2rem;
    gap: 14px;
    align-items: center;
    width: 100%;
    padding: 11px 10px;
    border: 0;
    border-bottom: 1px solid var(--borde);
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
  }
  .attr.cab {
    padding: 0 10px 8px;
    border-bottom: 2px solid var(--marca);
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--suave);
  }
  .atributos {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  button.attr {
    cursor: pointer;
  }
  button.attr:hover {
    background: var(--acento-fondo);
  }
  button.attr:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
  }
  button.attr.activa {
    background: var(--acento-fondo);
  }
  button.attr.activa .nom {
    font-weight: 700;
  }
  .attr .nom {
    font-size: 1rem;
  }
  .attr .pista {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: var(--borde);
    overflow: hidden;
  }
  .attr .pista i {
    display: block;
    height: 100%;
    border-radius: 4px;
  }
  .attr .pct {
    text-align: right;
    font: 700 1.1rem var(--fuente-titulo);
    font-variant-numeric: tabular-nums;
  }
  .attr .rev {
    text-align: right;
    color: var(--suave);
    font-size: 0.92rem;
    font-variant-numeric: tabular-nums;
  }
  .aparte-titulo {
    margin: 22px 0 4px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--suave);
  }
  .resumen-lista {
    max-width: 1100px;
  }

  /* Secciones */
  .detalle,
  .evolucion {
    margin-top: 12px;
  }
  .evolucion {
    margin-top: 52px;
    padding-top: 6px;
    border-top: 2px solid var(--marca);
  }
  .detalle h2,
  .evolucion h2 {
    font-size: 1.35rem;
    margin: 0 0 14px;
  }
  .evolucion h3 {
    font-size: 1rem;
    margin: 26px 0 8px;
    color: var(--titulo);
  }
  .detalle-estado {
    max-width: 26rem;
    margin: 0 0 18px;
  }

  /* Rango de puntaje y buscador */
  .fg-fila2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
    gap: 16px 32px;
    margin-top: 20px;
    align-items: end;
  }
  .campo-rango {
    min-width: 0;
  }
  .rango-vals {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--acento-texto);
    font-variant-numeric: tabular-nums;
  }
  .rango {
    position: relative;
    height: 28px;
  }
  .rango-pista {
    position: absolute;
    left: 9px;
    right: 9px;
    top: 12px;
    height: 4px;
    border-radius: 2px;
    background: var(--borde);
  }
  .rango-relleno {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 2px;
    background: var(--acento);
    left: calc(var(--a) * 100%);
    right: calc((1 - var(--b)) * 100%);
  }
  .rango input[type="range"] {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 28px;
    margin: 0;
    background: none;
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
  }
  .rango input[type="range"]::-webkit-slider-runnable-track {
    background: transparent;
    height: 28px;
  }
  .rango input[type="range"]::-moz-range-track {
    background: transparent;
  }
  .rango input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    pointer-events: auto;
    width: 18px;
    height: 18px;
    margin-top: 5px;
    border-radius: 50%;
    background: var(--acento);
    border: 2px solid var(--panel);
    box-shadow: 0 0 0 1px var(--acento);
    cursor: grab;
  }
  .rango input[type="range"]::-moz-range-thumb {
    pointer-events: auto;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--acento);
    border: 2px solid var(--panel);
    box-shadow: 0 0 0 1px var(--acento);
    cursor: grab;
  }
  .rango input[name="pmax"] {
    z-index: 2;
  }
  .busca-caja {
    position: relative;
  }
  .busca-caja input {
    width: 100%;
    font: inherit;
    color: var(--texto);
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .busca-caja input:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .sugerencias {
    position: absolute;
    z-index: 30;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    margin: 0;
    padding: 4px;
    list-style: none;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    max-height: 360px;
    overflow: auto;
    font-weight: 400;
  }
  .sug {
    display: grid;
    grid-template-columns: minmax(7.5rem, auto) 1fr;
    gap: 2px 12px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--texto);
    font-size: 0.9rem;
  }
  .sug .sug-cod {
    font-family: var(--fuente-mono);
    font-size: 0.84rem;
    white-space: nowrap;
  }
  .sug .sug-nom {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sug .sug-emp {
    grid-column: 1 / -1;
    font-size: 0.76rem;
    color: var(--suave);
  }
  .sug[aria-selected="true"],
  .sug:hover {
    background: var(--acento-fondo);
  }
  .sug.todos {
    display: block;
    font-weight: 700;
    color: var(--acento-texto);
    border-bottom: 1px solid var(--borde);
    border-radius: 6px 6px 0 0;
    margin-bottom: 2px;
  }
  .sug-vacio {
    padding: 10px;
    color: var(--suave);
    font-size: 0.9rem;
  }

  /* Gráficos */
  .graficos {
    margin: 0 0 14px;
  }
  .graficos.dos {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .graficos figure,
  figure.graficos {
    margin: 0;
  }
  figcaption {
    font-weight: 700;
    font-size: 0.95rem;
    margin-bottom: 8px;
    color: var(--titulo);
  }
  .columnas {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 210px;
    padding-top: 6px;
  }
  .col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    height: 100%;
    min-width: 0;
  }
  .col-n {
    font-size: 0.78rem;
    color: var(--suave);
  }
  .col-barra {
    width: 100%;
    max-width: 64px;
    min-height: 2px;
    border-radius: 3px 3px 0 0;
  }
  .col-etq {
    font-size: 0.78rem;
    text-align: center;
    line-height: 1.15;
    min-height: 2.4em;
  }
  .col-etq small {
    display: block;
    color: var(--suave);
  }
  .columnas.estados {
    height: 240px;
  }
  .apiladas {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .ap-fila {
    display: grid;
    grid-template-columns: 7rem 1fr;
    gap: 10px;
    align-items: center;
    font-size: 0.85rem;
  }
  .ap-barra {
    display: flex;
    height: 18px;
    border-radius: 3px;
    overflow: hidden;
    background: var(--borde);
  }
  .seg {
    display: block;
    height: 100%;
  }
  .leyenda {
    margin: 6px 0 18px;
    font-size: 0.92rem;
  }
  .leyenda summary {
    cursor: pointer;
    color: var(--acento-texto);
    font-weight: 600;
    width: max-content;
  }
  .leyenda ul {
    list-style: none;
    padding: 8px 0 0;
    margin: 0;
    display: grid;
    gap: 5px;
  }
  .leyenda li {
    display: flex;
    gap: 9px;
    align-items: baseline;
  }
  .leyenda li .punto {
    transform: translateY(1px);
  }

  /* Tabla de detalle */
  .tabla-caja.continua {
    max-height: min(70vh, 1000px);
  }
  .tabla .est {
    text-align: center;
    padding: 6px 4px;
  }
  .tabla.ancha th.est {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 8px 4px;
  }
  .vacio-fila {
    text-align: center;
    color: var(--suave);
    padding: 22px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }
  .chip-punto {
    display: inline-block;
    width: 13px;
    height: 13px;
    border-radius: 50%;
  }
  .sube {
    color: var(--ok);
    font-weight: 700;
  }
  .baja {
    color: var(--error);
    font-weight: 700;
  }

  /* Evolución */
  .filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    align-items: flex-end;
    margin-bottom: 18px;
  }
  .filtros label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--suave);
  }
  .filtros select {
    font: inherit;
    color: var(--texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 7px 10px;
    min-width: 9rem;
  }
  .evo-resumen {
    display: flex;
    flex-wrap: wrap;
    gap: 20px 48px;
    margin: 0 0 16px;
  }
  .evo-resumen > div {
    display: flex;
    flex-direction: column;
  }
  .evo-cifra {
    font: 700 2.4rem/1.05 var(--fuente-titulo);
    color: var(--titulo);
  }
  .evo-cifra.sube {
    color: var(--ok);
  }
  .evo-cifra.baja {
    color: var(--error);
  }
  .evo-etq {
    font-size: 0.85rem;
    color: var(--suave);
  }
  svg.linea {
    width: 100%;
    max-width: 760px;
    height: auto;
    display: block;
  }
  svg.linea .guia {
    stroke: var(--borde);
    stroke-width: 1;
  }
  svg.linea .eje {
    fill: var(--suave);
    font: 12px var(--fuente);
  }
  svg.linea .trazo {
    fill: none;
    stroke: var(--acento);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  svg.linea .lpunto {
    fill: var(--acento);
    stroke: var(--panel);
    stroke-width: 2;
  }
  svg.linea .valor {
    fill: var(--texto);
    font: 700 12px var(--fuente);
  }

  @container (max-width: 900px) {
    .graficos.dos {
      grid-template-columns: 1fr;
    }
    .resumen {
      grid-template-columns: 1fr;
      margin-bottom: 40px;
    }
    .fg-fila2 {
      grid-template-columns: 1fr;
    }
  }
  @container (max-width: 680px) {
    .columnas.estados {
      gap: 4px;
    }
    .columnas.estados .col-etq {
      font-size: 0.64rem;
      overflow-wrap: anywhere;
    }
    .ap-fila {
      grid-template-columns: 5.5rem 1fr;
    }
    .attr {
      grid-template-columns: 6.4rem minmax(40px, 1fr) 4rem;
      gap: 10px;
    }
    .attr .rev,
    .attr.cab .rev {
      display: none;
    }
  }
`;

/* ----------------------------- piezas ----------------------------- */

/** Deslizador de puntaje con dos extremos. */
function RangoPuntaje({ pmin, pmax, onChange }) {
  const a = parseFloat(pmin);
  const b = parseFloat(pmax);
  const cambiar = (cual, valor) => {
    let x = parseFloat(valor);
    // los extremos no se cruzan: el que se mueve se detiene en el otro
    if (cual === "min" && x > b) x = b;
    if (cual === "max" && x < a) x = a;
    onChange(cual === "min" ? { pmin: x.toFixed(2), pmax } : { pmin, pmax: x.toFixed(2) });
  };
  return (
    <div className="campo-rango">
      <span className="campo-etq">Puntaje de calidad</span>
      <div className="rango-vals">
        <output>{pmin}</output>
        <output>{pmax}</output>
      </div>
      <div className="rango" style={{ "--a": a, "--b": b }}>
        <span className="rango-pista">
          <span className="rango-relleno" />
        </span>
        <input type="range" name="pmin" min="0" max="1" step="0.01" value={pmin} aria-label="Puntaje mínimo" onChange={(e) => cambiar("min", e.target.value)} />
        <input type="range" name="pmax" min="0" max="1" step="0.01" value={pmax} aria-label="Puntaje máximo" onChange={(e) => cambiar("max", e.target.value)} />
      </div>
    </div>
  );
}

/** Buscador por código o nombre con sugerencias en vivo (equivale al combobox del original). */
function BuscadorProducto({ aplicados, texto, onTexto, onAplicar }) {
  const [sugerencias, setSugerencias] = useState(null);
  const [activo, setActivo] = useState(-1);
  const [enfocado, setEnfocado] = useState(false);
  const peticion = useRef(0);

  useEffect(() => {
    const t = texto.trim();
    if (!enfocado || t.length < 2) {
      setSugerencias(null);
      return undefined;
    }
    const mia = ++peticion.current;
    const espera = setTimeout(() => {
      DocTec_BuscarCalidad(aplicados, t)
        .then((d) => mia === peticion.current && (setSugerencias({ ...d, texto: t }), setActivo(-1)))
        .catch(() => mia === peticion.current && setSugerencias(null));
    }, 180);
    return () => clearTimeout(espera);
  }, [texto, enfocado, aplicados]);

  const opciones = sugerencias?.items ?? [];
  const total = opciones.length + 1; // la primera opción es «Ver los N productos con…»
  const elegir = (valor) => {
    setSugerencias(null);
    onTexto(valor);
    onAplicar(valor);
  };
  const teclado = (e) => {
    if (!sugerencias) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((a) => (a + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((a) => (a - 1 + total) % total);
    } else if (e.key === "Escape") {
      setSugerencias(null);
    } else if (e.key === "Enter" && activo >= 0) {
      e.preventDefault();
      elegir(activo === 0 ? texto.trim() : opciones[activo - 1].codigo);
    }
  };

  return (
    <div className="busca">
      <label className="campo-etq" htmlFor="q-calidad">
        Buscar por código o nombre (escribe para ver coincidencias)
      </label>
      <div className="busca-caja">
        <input
          id="q-calidad"
          type="search"
          value={texto}
          placeholder="Escribe un código o un nombre (ej.: maxtrek)"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={!!sugerencias}
          onChange={(e) => {
            onTexto(e.target.value);
            if (e.target.value === "") onAplicar("");
          }}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setTimeout(() => setEnfocado(false), 120)}
          onKeyDown={teclado}
        />
        {sugerencias && (
          <ul className="sugerencias" role="listbox">
            {!opciones.length ? (
              <li className="sug-vacio">Ningún producto coincide con «{sugerencias.texto}» con los filtros actuales.</li>
            ) : (
              <>
                <li
                  className="sug todos"
                  role="option"
                  aria-selected={activo === 0}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(sugerencias.texto);
                  }}
                >
                  Ver los {sugerencias.total} producto{sugerencias.total === 1 ? "" : "s"} con «{sugerencias.texto}»
                </li>
                {opciones.map((it, n) => (
                  <li
                    key={`${it.empresa}|${it.codigo}`}
                    className="sug"
                    role="option"
                    aria-selected={activo === n + 1}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      elegir(it.codigo);
                    }}
                  >
                    <span className="sug-cod">{it.codigo}</span>
                    <span className="sug-nom">{it.nombre}</span>
                    <span className="sug-emp">{it.empresa}</span>
                  </li>
                ))}
                {sugerencias.total > opciones.length && (
                  <li className="sug-vacio">
                    Se muestran {opciones.length} de {sugerencias.total}. Sigue escribiendo para acotar.
                  </li>
                )}
              </>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilaAtributo({ a, activa, onElegir }) {
  return (
    <li>
      <button type="button" className={`attr${activa ? " activa" : ""}`} aria-current={activa ? "true" : undefined} onClick={() => onElegir(a.clave)}>
        <span className="nom">{a.nombre}</span>
        <span className="pista" title={`${a.pct === null ? "n/d" : coma(a.pct, 1)} % correcto`}>
          <i className={`s-${a.semaforo}`} style={{ width: `${a.ancho.toFixed(1)}%` }} />
        </span>
        <span className="pct">{a.pct === null ? "n/d" : `${coma(a.pct, 1)} %`}</span>
        <span className="rev">{a.por_revisar}</span>
      </button>
    </li>
  );
}

/** Línea del índice general por semana (mismo cálculo que linea_svg del original). */
function LineaIndice({ puntos }) {
  const ancho = 720;
  const alto = 260;
  const mi = 48;
  const md = 16;
  const ms = 16;
  const minf = 34;
  const valores = puntos.map((p) => p.indice).filter((v) => v !== null);
  if (!valores.length) return null;
  let lo = Math.min(...valores);
  let hi = Math.max(...valores);
  if (hi - lo < 1) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.15;
  lo -= pad;
  hi += pad;
  const x = (i) => (puntos.length === 1 ? mi + (ancho - mi - md) / 2 : mi + (i * (ancho - mi - md)) / (puntos.length - 1));
  const y = (v) => ms + ((hi - v) / (hi - lo)) * (alto - ms - minf);
  const coords = puntos.map((p, i) => (p.indice === null ? null : [x(i), y(p.indice)])).filter(Boolean);
  return (
    <svg className="linea" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Índice general por semana">
      {[0, 1, 2, 3, 4].map((k) => {
        const v = lo + ((hi - lo) * k) / 4;
        return (
          <React.Fragment key={k}>
            <line className="guia" x1={mi} x2={ancho - md} y1={y(v).toFixed(1)} y2={y(v).toFixed(1)} />
            <text className="eje" x={mi - 8} y={(y(v) + 4).toFixed(1)} textAnchor="end">
              {v.toFixed(1)}
            </text>
          </React.Fragment>
        );
      })}
      {coords.length > 1 && <polyline className="trazo" points={coords.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ")} />}
      {puntos.map((p, i) =>
        p.indice === null ? null : (
          <React.Fragment key={p.semana}>
            <circle className="lpunto" cx={x(i).toFixed(1)} cy={y(p.indice).toFixed(1)} r="5">
              <title>{`${p.semana}: ${p.indice.toFixed(2)}`}</title>
            </circle>
            <text className="valor" x={x(i).toFixed(1)} y={(y(p.indice) - 10).toFixed(1)} textAnchor="middle">
              {p.indice.toFixed(2)}
            </text>
            <text className="eje" x={x(i).toFixed(1)} y={alto - 10} textAnchor="middle">
              {diaMes(p.semana)}
            </text>
          </React.Fragment>
        )
      )}
    </svg>
  );
}

function TablaPivote({ filas, semanas, titulo, claseNombre }) {
  return (
    <div className="tabla-caja">
      <table className="tabla">
        <thead>
          <tr>
            <th>{titulo}</th>
            {semanas.map((s) => (
              <th key={s} className="num">
                {diaMes(s)}
              </th>
            ))}
            <th className="num">Cambio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((r) => (
            <tr key={r.nombre}>
              <td>{claseNombre(r.nombre)}</td>
              {r.valores.map((v, i) => (
                <td key={i} className="num">
                  {v === null ? "—" : coma(v, 2)}
                </td>
              ))}
              <td className={`num ${r.variacion ? (r.variacion > 0 ? "sube" : "baja") : ""}`}>{r.variacion === null ? "—" : coma(r.variacion, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Evolucion({ evo, ant, act, setAnt, setAct }) {
  if (!evo) return <p className="cuenta">Cargando evolución…</p>;
  if (!evo.hay_datos)
    return (
      <p className="aviso">
        Aún no hay semanas registradas desde la base. Cada vez que se ejecuta <code>cargar_calidad</code> con la base como origen se guarda una
        semana; la línea aparece desde la segunda.
      </p>
    );
  const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <>
      <div className="evo-resumen">
        <div>
          <span className="evo-cifra">{coma(evo.ultima.indice, 2)}</span>
          <span className="evo-etq">índice de la última semana ({fechaLarga(evo.ultima.semana)})</span>
        </div>
        <div>
          <span className={`evo-cifra${evo.variacion ? (evo.variacion > 0 ? " sube" : " baja") : ""}`}>
            {evo.variacion === null ? "—" : `${evo.variacion > 0 ? "+" : ""}${coma(evo.variacion, 2)}`}
          </span>
          <span className="evo-etq">cambio frente a la semana anterior</span>
        </div>
        <div>
          <span className="evo-cifra">{evo.puntos.length}</span>
          <span className="evo-etq">
            semana{evo.puntos.length === 1 ? "" : "s"} registrada{evo.puntos.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <figure className="graficos una">
        <figcaption>Índice general por semana (última corrida de cada viernes; solo corridas desde la base)</figcaption>
        <LineaIndice puntos={evo.puntos} />
      </figure>
      {evo.puntos.length < 2 && <p className="aviso">Hay una sola semana registrada. Desde la segunda se verá la línea y las variaciones.</p>}

      <h3>Porcentaje correcto por atributo</h3>
      <TablaPivote filas={evo.por_atributo} semanas={evo.semanas} titulo="Atributo" claseNombre={cap} />

      <h3>Índice por empresa</h3>
      <TablaPivote filas={evo.por_empresa} semanas={evo.semanas} titulo="Empresa" claseNombre={(n) => n} />

      {evo.opciones.length >= 2 && (
        <>
          <h3>Productos que cambiaron entre dos semanas</h3>
          <div className="filtros">
            <label>
              Semana anterior
              <select value={ant ?? evo.ant} onChange={(e) => setAnt(e.target.value)}>
                {evo.opciones.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Semana actual
              <select value={act ?? evo.act} onChange={(e) => setAct(e.target.value)}>
                {evo.opciones.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {evo.cambios ? (
            <>
              <p className="cuenta">
                {evo.cambios.mejoran} mejoraron · {evo.cambios.empeoran} empeoraron · {evo.cambios.nuevos} nuevos
              </p>
              <div className="tabla-caja alta">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Código</th>
                      <th className="num">Antes</th>
                      <th className="num">Ahora</th>
                      <th className="num">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evo.cambios.filas.map((r) => (
                      <tr key={`${r.empresa}|${r.codigo}`}>
                        <td>{r.empresa}</td>
                        <td className="cod">{r.codigo}</td>
                        <td className="num">{r.antes === null ? "—" : coma(r.antes, 1)}</td>
                        <td className="num">{r.ahora === null ? "—" : coma(r.ahora, 1)}</td>
                        <td className={`num ${r.diferencia ? (r.diferencia > 0 ? "sube" : "baja") : ""}`}>
                          {r.diferencia === null ? "—" : coma(r.diferencia, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {evo.cambios.total > 200 && <p className="cuenta">Se muestran los primeros 200 de {evo.cambios.total}.</p>}
            </>
          ) : (
            <p className="cuenta">Sin cambios entre esas semanas.</p>
          )}
        </>
      )}
    </>
  );
}

/* ----------------------------- pantalla ----------------------------- */

export const DocTecCalidad = () => {
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [pmin, setPmin] = useState("0.00");
  const [pmax, setPmax] = useState("1.00");
  const [q, setQ] = useState("");
  const [entradaQ, setEntradaQ] = useState("");
  const [aplicados, setAplicados] = useState(POR_DEFECTO);
  const [atributo, setAtributo] = useState("GENERAL");
  const [estado, setEstado] = useState([]);

  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [tabla, setTabla] = useState({ filas: [], total: 0, siguiente: null, cargando: false, general: true, columnas_estado: [] });
  const [evo, setEvo] = useState(null);
  const [ant, setAnt] = useState(null);
  const [act, setAct] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [avisoActualizar, setAvisoActualizar] = useState(null); // { ok, texto }
  const [version, setVersion] = useState(0); // sube al recalcular: vuelve a pedir los datos

  const cajaRef = useRef(null);
  const detalleRef = useRef(null);
  const evoRef = useRef(null);
  const peticion = useRef(0);
  const cargandoMas = useRef(false);

  // Los filtros se aplican con un pequeño retraso, para no pedir datos en cada clic o cada movimiento del deslizador
  useEffect(() => {
    const t = setTimeout(() => setAplicados({ filtros, pmin, pmax, q }), 300);
    return () => clearTimeout(t);
  }, [filtros, pmin, pmax, q]);

  // Resumen, opciones de filtros y gráficos del detalle
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    DocTec_ObtenerCalidadResumen(aplicados, atributo)
      .then((d) => vivo && (setResumen(d), setError(null)))
      .catch((e) => vivo && setError(e.response?.data?.error ?? "No se pudo cargar la calidad. Revisa que la API esté disponible."))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [aplicados, atributo, version]);

  // Tabla continua: primer lote
  useEffect(() => {
    const mia = ++peticion.current;
    cargandoMas.current = false;
    setTabla((t) => ({ ...t, filas: [], total: 0, siguiente: null, cargando: true }));
    DocTec_ObtenerCalidadFilas(aplicados, atributo, estado, 1)
      .then((d) => mia === peticion.current && setTabla({ filas: d.filas, total: d.total, siguiente: d.siguiente, cargando: false, general: d.general, columnas_estado: d.columnas_estado }))
      .catch(() => mia === peticion.current && setTabla((t) => ({ ...t, cargando: false })));
  }, [aplicados, atributo, estado, version]);

  const cargarMas = useCallback(() => {
    if (!tabla.siguiente || cargandoMas.current) return;
    cargandoMas.current = true;
    const mia = peticion.current;
    DocTec_ObtenerCalidadFilas(aplicados, atributo, estado, tabla.siguiente)
      .then((d) => mia === peticion.current && setTabla((t) => ({ ...t, filas: [...t.filas, ...d.filas], total: d.total, siguiente: d.siguiente })))
      .catch(() => undefined)
      .finally(() => {
        cargandoMas.current = false;
      });
  }, [tabla.siguiente, aplicados, atributo, estado]);

  const alDesplazar = useCallback(() => {
    const c = cajaRef.current;
    if (c && c.scrollTop + c.clientHeight >= c.scrollHeight - 500) cargarMas();
  }, [cargarMas]);

  useEffect(() => {
    alDesplazar();
  }, [tabla.filas.length, alDesplazar]);

  // Evolución semanal (no depende de los filtros)
  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerCalidadEvolucion(ant ?? undefined, act ?? undefined)
      .then((d) => vivo && setEvo(d))
      .catch(() => vivo && setEvo({ hay_datos: false }));
    return () => {
      vivo = false;
    };
  }, [ant, act, version]);

  const irA = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const elegirAtributo = (clave, desplazar = true) => {
    setAtributo(clave);
    setEstado([]);
    if (desplazar) setTimeout(() => irA(detalleRef), 50);
  };
  const aplicarQ = (texto) => {
    setQ(texto);
    setAplicados((a) => ({ ...a, q: texto }));
  };
  const hayFiltros =
    Object.values(filtros).some((v) => v.length) || q || pmin !== "0.00" || pmax !== "1.00";
  const quitarFiltros = () => {
    setFiltros(SIN_FILTROS);
    setPmin("0.00");
    setPmax("1.00");
    setQ("");
    setEntradaQ("");
    setAplicados(POR_DEFECTO);
    setEstado([]);
  };
  const descargar = async () => {
    setDescargando(true);
    try {
      await DocTec_DescargarCalidadCsv(aplicados, atributo, estado);
    } catch {
      setError("No se pudo descargar el CSV.");
    } finally {
      setDescargando(false);
    }
  };

  const actualizar = async () => {
    setActualizando(true);
    setAvisoActualizar(null);
    try {
      const r = await DocTec_ActualizarCalidad();
      setAvisoActualizar({ ok: true, texto: `Calidad actualizada: ${miles(r.corrida.registros)} llantas, índice ${coma(r.corrida.indice_general, 2)}.` });
      setVersion((v) => v + 1);
    } catch (e) {
      setAvisoActualizar({ ok: false, texto: e.response?.data?.error ?? "No se pudo actualizar la calidad. Revisa que la API y la base estén disponibles." });
    } finally {
      setActualizando(false);
    }
  };

  if (error && !resumen)
    return (
      <RaizDoc>
        <div style={{ padding: 28, color: "var(--suave)" }}>{error}</div>
      </RaizDoc>
    );
  if (!resumen)
    return (
      <RaizDoc>
        <div style={{ padding: 28, color: "var(--suave)" }}>Cargando calidad…</div>
      </RaizDoc>
    );
  if (!resumen.hay_datos)
    return (
      <RaizDoc>
        <Estilos>
          <div className="titulo-fila">
            <h1>Calidad de datos</h1>
            {resumen.puede_actualizar && (
              <button type="button" className="boton secundario" onClick={actualizar} disabled={actualizando} aria-busy={actualizando}>
                {actualizando ? "Actualizando… (puede tardar unos segundos)" : "Actualizar datos"}
              </button>
            )}
          </div>
          <p className="aviso">
            Todavía no hay datos de calidad.{" "}
            {resumen.puede_actualizar
              ? "Pulsa «Actualizar datos» para calcularlos desde la base."
              : "Configura las credenciales de PostgreSQL (DB_*) en el backend para poder calcularlos."}
          </p>
          {avisoActualizar && (
            <p className="aviso" role={avisoActualizar.ok ? "status" : "alert"}>
              {avisoActualizar.texto}
            </p>
          )}
        </Estilos>
      </RaizDoc>
    );

  const r = resumen;
  const res = r.resumen;
  const filtrosVisibles = Object.keys(ETIQUETAS).filter((n) => n !== "proveedor" || r.con_proveedor);
  const sinFilas = !tabla.cargando && tabla.filas.length === 0;
  const filasVista = tabla.filas.filter((x) => (tabla.general ? x.celdas : x.estado));

  return (
    <RaizDoc>
      <Estilos>
        <div className="titulo-fila">
          <h1>Calidad de datos</h1>
          {r.puede_actualizar && (
            <button type="button" className="boton secundario" onClick={actualizar} disabled={actualizando} aria-busy={actualizando}>
              {actualizando ? "Actualizando… (puede tardar unos segundos)" : "Actualizar datos"}
            </button>
          )}
        </div>
        {avisoActualizar && (
          <p className="aviso" role={avisoActualizar.ok ? "status" : "alert"}>
            {avisoActualizar.texto}
          </p>
        )}

        <form className="filtros-generales" onSubmit={(e) => { e.preventDefault(); aplicarQ(entradaQ); }} aria-labelledby="t-filtros">
          <h2 id="t-filtros">Filtros generales</h2>
          <div className="fg-fila">
            {filtrosVisibles.map((nombre) => (
              <FiltroMultiple
                key={nombre}
                etiqueta={ETIQUETAS[nombre]}
                opciones={r.opciones[nombre]}
                seleccion={filtros[nombre]}
                onChange={(sel) => setFiltros((f) => ({ ...f, [nombre]: sel }))}
              />
            ))}
          </div>

          <div className="fg-fila2">
            <RangoPuntaje pmin={pmin} pmax={pmax} onChange={(v) => { setPmin(v.pmin); setPmax(v.pmax); }} />
            <BuscadorProducto
              aplicados={aplicados}
              texto={entradaQ}
              onTexto={setEntradaQ}
              onAplicar={(t) => aplicarQ(t)}
            />
          </div>

          <div className="fg-pie">
            <p className="fg-cuenta">
              {miles(r.cuenta.filtrados)} de {miles(r.cuenta.total)} registros
            </p>
            {hayFiltros && (
              <button type="button" className="boton secundario" onClick={quitarFiltros}>
                Quitar filtros
              </button>
            )}
          </div>
        </form>

        <div id="resultados" className={cargando ? "cargando" : ""} aria-busy={cargando}>
          {error && <p className="aviso">{error}</p>}
          {res.n === 0 ? (
            <p className="aviso">Ningún producto cumple los filtros. Prueba quitando alguno.</p>
          ) : (
            <section className="resumen" aria-labelledby="t-resumen">
              <div className="resumen-general">
                <h2 id="t-resumen">Índice general</h2>
                <p className="cifra">
                  {coma(res.indice_txt, 1)}
                  <span> / 100</span>
                </p>
                <p className="expl">Qué tan bien coincide cada producto con su descripción, en promedio.</p>
                <p className="fuente">
                  {miles(res.n)} {r.unidad}
                  {r.excluidos > 0 && ` (y ${r.excluidos} de otros tipos, fuera del índice)`} · Fuente: {r.fuente}
                  <br />
                  Actualizado el {fechaHora(r.corrida.fecha_hora)}
                </p>
                <button
                  type="button"
                  className={`boton secundario${atributo === "GENERAL" ? " activo" : ""}`}
                  aria-current={atributo === "GENERAL" ? "true" : undefined}
                  onClick={() => elegirAtributo("GENERAL")}
                >
                  Ver detalle general
                </button>
              </div>

              <div className="resumen-lista">
                <div className="attr cab" aria-hidden="true">
                  <span>Atributo</span>
                  <span>% correcto</span>
                  <span className="pct" />
                  <span className="rev">Por revisar</span>
                </div>
                <ul className="atributos" aria-label="Atributos, de menos a más correcto">
                  {res.en_indice.map((a) => (
                    <FilaAtributo key={a.clave} a={a} activa={a.clave === atributo} onElegir={elegirAtributo} />
                  ))}
                </ul>
                {res.aparte.length > 0 && (
                  <>
                    <p className="aparte-titulo">No entra al índice</p>
                    <ul className="atributos">
                      {res.aparte.map((a) => (
                        <FilaAtributo key={a.clave} a={a} activa={a.clave === atributo} onElegir={elegirAtributo} />
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          )}

          <section className="detalle" ref={detalleRef} aria-labelledby="t-detalle">
            <h2 id="t-detalle">Detalle: {r.nombre_atributo}</h2>

            <nav className="tabs-atributos" aria-label="Atributo del detalle">
              {r.tabs.map((t) => (
                <button
                  type="button"
                  key={t.clave}
                  className={`tab${t.clave === atributo ? " activa" : ""}`}
                  aria-current={t.clave === atributo ? "page" : undefined}
                  onClick={() => elegirAtributo(t.clave, false)}
                >
                  {t.nombre}
                </button>
              ))}
              <button type="button" className="tab" onClick={() => irA(evoRef)}>
                Evolución
              </button>
            </nav>

            {res.n > 0 && !r.no_aplica && (
              <div className="detalle-estado">
                <FiltroMultiple
                  etiqueta={`Filtrar por estado de ${r.nombre_atributo.toLowerCase()}`}
                  opciones={r.estados}
                  seleccion={estado}
                  onChange={setEstado}
                  pie={`${miles(tabla.total)} productos`}
                />
              </div>
            )}

            {res.n === 0 ? (
              <p className="cuenta">Sin productos con los filtros actuales.</p>
            ) : r.no_aplica ? (
              <p className="aviso">{r.nombre_atributo} no aplica a este tipo de producto: no cuenta para el puntaje.</p>
            ) : (
              <>
                {r.general ? (
                  <div className="graficos dos">
                    <figure>
                      <figcaption>Productos por puntaje (1,0 = todos los atributos correctos)</figcaption>
                      <div className="columnas" role="img" aria-label="Productos por puntaje">
                        {r.detalle.puntajes.map((c) => (
                          <div className="col" key={c.puntaje} title={`Puntaje ${c.puntaje}: ${c.n} productos`}>
                            <span className="col-n">{c.n}</span>
                            <span className="col-barra e-correcto" style={{ height: `${c.alto.toFixed(1)}%` }} />
                            <span className="col-etq">{c.puntaje}</span>
                          </div>
                        ))}
                      </div>
                    </figure>
                    <figure>
                      <figcaption>Estado de cada atributo</figcaption>
                      <div className="apiladas" role="img" aria-label="Estado de cada atributo">
                        {r.detalle.apiladas.map((a) => (
                          <div className="ap-fila" key={a.atributo}>
                            <span className="ap-etq">{a.atributo.charAt(0) + a.atributo.slice(1).toLowerCase()}</span>
                            <span className="ap-barra">
                              {a.segmentos.map(
                                (s) =>
                                  s.n > 0 && (
                                    <span
                                      key={s.estado}
                                      className={`seg e-${s.clase}`}
                                      style={{ width: `${s.pct.toFixed(2)}%` }}
                                      title={`${a.atributo.charAt(0) + a.atributo.slice(1).toLowerCase()} · ${s.estado}: ${s.n} (${coma(s.pct, 1)} %)`}
                                    />
                                  )
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </figure>
                  </div>
                ) : (
                  <figure className="graficos una">
                    <figcaption>Productos por estado</figcaption>
                    <div className="columnas estados" role="img" aria-label="Productos por estado">
                      {r.detalle.distribucion.map((c) => (
                        <div className="col" key={c.estado} title={`${c.estado}: ${c.n} (${c.pct} %)`}>
                          <span className="col-n">{c.n}</span>
                          <span className={`col-barra e-${c.clase}`} style={{ height: `${c.alto.toFixed(1)}%` }} />
                          <span className="col-etq">
                            {c.estado}
                            <small>{coma(c.pct, 1)} %</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </figure>
                )}

                <details className="leyenda">
                  <summary>¿Qué significa cada estado?</summary>
                  <ul>
                    {r.leyenda.map((l) => (
                      <li key={l.estado}>
                        <span className={`punto e-${l.clase}`} />
                        <b>{l.estado}</b>: {l.significado}
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="tabla-barra">
                  <p className="cuenta">
                    {miles(tabla.total)} producto{tabla.total === 1 ? "" : "s"}
                    {hayFiltros && " con los filtros actuales"}
                  </p>
                  <button type="button" className="boton secundario" onClick={descargar} disabled={descargando}>
                    {descargando ? "Descargando…" : "Descargar esta vista (CSV)"}
                  </button>
                </div>

                <div className="tabla-caja continua" ref={cajaRef} onScroll={alDesplazar}>
                  {tabla.general ? (
                    <table className="tabla ancha">
                      <thead>
                        <tr>
                          <th>Creado</th>
                          <th>Empresa</th>
                          <th>Código</th>
                          <th>Nombre</th>
                          {r.con_proveedor && <th>Proveedor principal</th>}
                          <th className="num">Puntaje</th>
                          {tabla.columnas_estado.map((c) => (
                            <th key={c.atributo} className="est" title={c.nombre}>
                              {c.nombre}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filasVista.map((x) => (
                          <tr key={`${x.empresa}|${x.codigo}`}>
                            <td>{x.fecha_creacion}</td>
                            <td>{x.empresa}</td>
                            <td className="cod">{x.codigo}</td>
                            <td className="nom">{x.nombre}</td>
                            {r.con_proveedor && <td>{x.proveedor || "—"}</td>}
                            <td className="num">{x.score === null ? "" : coma(x.score, 1)}</td>
                            {x.celdas.map((c, i) => (
                              <td key={i} className="est">
                                {c && (
                                  <span
                                    className={`chip-punto e-${c.estado.toLowerCase().replace(/ /g, "-")}`}
                                    title={`${c.estado}. Base: ${c.bd || "—"} · Nombre: ${c.extraido || "—"}`}
                                  />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {sinFilas && (
                          <tr>
                            <td colSpan={15} className="vacio-fila">
                              Ningún producto cumple los filtros.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Creado</th>
                          <th>Empresa</th>
                          <th>Código</th>
                          <th>Nombre</th>
                          {r.con_proveedor && <th>Proveedor principal</th>}
                          {r.detalle.con_categoria && <th>Categoría</th>}
                          <th>Base</th>
                          <th>Extraído del nombre</th>
                          <th>Estado</th>
                          <th className="num">Puntaje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filasVista.map((x) => (
                          <tr key={`${x.empresa}|${x.codigo}`}>
                            <td>{x.fecha_creacion}</td>
                            <td>{x.empresa}</td>
                            <td className="cod">{x.codigo}</td>
                            <td className="nom">{x.nombre}</td>
                            {r.con_proveedor && <td>{x.proveedor || "—"}</td>}
                            {r.detalle.con_categoria && <td>{x.extra || "—"}</td>}
                            <td className="cod">{x.bd || "—"}</td>
                            <td className="cod">{x.extraido || "—"}</td>
                            <td>
                              <span className="chip">
                                <i className={`punto e-${x.estado.toLowerCase().replace(/ /g, "-")}`} />
                                {x.estado}
                              </span>
                            </td>
                            <td className="num">{x.score === null ? "" : coma(x.score, 1)}</td>
                          </tr>
                        ))}
                        {sinFilas && (
                          <tr>
                            <td colSpan={10} className="vacio-fila">
                              Ningún producto cumple los filtros.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="tabla-pie" aria-live="polite">
                  {tabla.cargando
                    ? "Cargando productos…"
                    : tabla.siguiente
                    ? `Mostrando ${miles(tabla.filas.length)} de ${miles(tabla.total)}. Sigue bajando para ver más.`
                    : ""}
                </p>
              </>
            )}
          </section>
        </div>

        <section className="evolucion" ref={evoRef} aria-labelledby="t-evo">
          <h2 id="t-evo">Evolución semanal</h2>
          <Evolucion evo={evo} ant={ant} act={act} setAnt={setAnt} setAct={setAct} />
        </section>
      </Estilos>
    </RaizDoc>
  );
};
