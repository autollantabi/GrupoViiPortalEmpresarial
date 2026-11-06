import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  DocTec_DescargarCompletitudCsv,
  DocTec_ObtenerCompletitudDuplicados,
  DocTec_ObtenerCompletitudProductos,
  DocTec_ObtenerCompletitudResumen,
} from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";
import { estilosDatos } from "../comunes/estilosDatos";
import { FiltroMultiple } from "../comunes/FiltroMultiple";

/* =====================================================================================
   Completitud del maestro de productos: qué porcentaje de productos tiene todos sus datos,
   cuáles hay que corregir y qué campo falta más. Migración de apps/completitud (Django).
   ===================================================================================== */

const FILTROS = [
  ["empresa", "Empresa"],
  ["grupo", "Grupo"],
  ["fabricante", "Fabricante"],
];
const SIN_FILTROS = { empresa: [], grupo: [], fabricante: [] };

const pct1 = (p) => ((p ?? 0) * 100).toFixed(1).replace(".", ",");
const pct0 = (p) => String(Math.round((p ?? 0) * 100));
const ancho = (p) => `${((p ?? 0) * 100).toFixed(2)}%`;
const miles = (n) => Number(n).toLocaleString("de-DE");
const capfirst = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
const fechaCorte = (iso) =>
  new Date(iso).toLocaleString("es-EC", {
    timeZone: "America/Guayaquil",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");

const Estilos = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 48px;

  ${estilosDatos}

  /* ---------- Específico de Completitud ---------- */
  .com-n {
    display: inline-block;
    margin-left: 4px;
    padding: 0 7px;
    border-radius: 999px;
    font-size: 0.78rem;
    background: var(--borde);
    color: var(--texto);
    text-transform: none;
    letter-spacing: 0;
  }
  .com-matriz td.sin {
    color: var(--suave);
    background: var(--bg);
    text-align: center;
  }
  .com-matriz th {
    white-space: normal;
    min-width: 5.2rem;
    font-size: 0.78rem;
    vertical-align: bottom;
  }

  .com-heroes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin: 0 0 18px;
  }
  .com-hero {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
    text-align: left;
    font: inherit;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    color: var(--texto);
    cursor: pointer;
  }
  .com-hero:hover {
    border-color: var(--acento);
  }
  .com-hero:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .com-hero.sin-enlace {
    cursor: default;
  }
  .com-hero.sin-enlace:hover {
    border-color: var(--borde);
  }
  .com-hero-q {
    font-weight: 700;
    color: var(--suave);
    font-size: 0.95rem;
  }
  .com-hero-cifra {
    font: 700 2.6rem/1.1 var(--fuente-titulo);
    font-variant-numeric: tabular-nums;
    color: var(--sf, var(--titulo));
  }
  .com-hero-texto {
    font-size: 1.7rem;
    padding: 6px 0 2px;
    color: var(--titulo);
  }
  .com-hero-t {
    font-size: 0.92rem;
    color: var(--texto);
  }
  .com-tira {
    display: block;
    height: 10px;
    margin-top: 6px;
    border-radius: 5px;
    background: var(--borde);
    overflow: hidden;
  }
  .com-tira i {
    display: block;
    height: 100%;
  }

  .com-fila2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: 14px;
    margin: 0 0 18px;
  }
  .com-tarjeta {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    padding: 18px 20px;
    margin: 0 0 18px;
    min-width: 0;
  }
  .com-fila2 .com-tarjeta {
    margin: 0;
  }
  .com-tarjeta h2 {
    margin: 0 0 2px;
    font-size: 1.05rem;
    color: var(--titulo);
  }
  .com-nota {
    margin: 2px 0 14px;
    color: var(--suave);
    font-size: 0.88rem;
  }
  .com-cab {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .com-seg {
    display: inline-flex;
    border: 1px solid var(--borde);
    border-radius: 8px;
    overflow: hidden;
  }
  .com-seg button {
    padding: 5px 12px;
    font: 600 0.85rem var(--fuente);
    color: var(--suave);
    background: none;
    border: 0;
    cursor: pointer;
  }
  .com-seg button.on {
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }
  .com-seg button:not(.on):hover {
    background: var(--acento-fondo);
  }

  .com-barras {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .com-barras li > button,
  .com-barras li > div {
    display: grid;
    grid-template-columns: 9.5rem minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 7px 8px;
    border: 0;
    background: none;
    text-align: left;
    font: inherit;
    border-radius: 8px;
    color: inherit;
  }
  .com-barras li > button {
    cursor: pointer;
  }
  .com-barras li > button:hover {
    background: var(--acento-fondo);
  }
  .com-barras li > button:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
  }
  .com-et {
    font-size: 0.93rem;
  }
  .com-pista {
    display: block;
    height: 10px;
    border-radius: 5px;
    background: var(--borde);
    overflow: hidden;
  }
  .com-pista i {
    display: block;
    height: 100%;
    border-radius: 5px;
  }
  .com-val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    white-space: nowrap;
  }
  .com-val small {
    font-weight: 400;
    color: var(--suave);
    margin-left: 4px;
  }
  .com-campos li > button {
    grid-template-columns: 9.5rem minmax(0, 1fr) 11rem;
  }

  .com-barra {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: flex-end;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--borde);
  }
  .com-barra select,
  .com-barra input[type="search"] {
    display: block;
    margin-top: 5px;
    font: inherit;
    color: var(--texto);
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 9px 11px;
    min-width: 11rem;
  }
  .com-busca {
    flex: 1 1 18rem;
  }
  .com-busca input {
    width: 100%;
  }
  .com-barra select:focus-visible,
  .com-barra input:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .tabla-caja.com-continua {
    max-height: min(70vh, 900px);
  }
  .com-productos td {
    vertical-align: middle;
  }
  .com-ayuda {
    font-weight: 400;
    color: var(--suave);
  }
  .com-chips {
    min-width: 20rem;
    line-height: 2;
  }
  .chip {
    display: inline-block;
    margin: 0 5px 5px 0;
    padding: 2px 10px;
    border-radius: 999px;
    font: 600 0.8rem/1.5 var(--fuente);
    white-space: nowrap;
    color: var(--error);
    background: var(--error-fondo);
    border: 1px solid transparent;
    cursor: pointer;
    transition: border-color 0.12s, transform 0.12s;
  }
  .chip:hover {
    border-color: var(--error);
    transform: translateY(-1px);
  }
  .chip.aviso-chip {
    color: var(--aviso);
    background: var(--aviso-fondo);
  }
  .chip.aviso-chip:hover {
    border-color: var(--aviso);
  }
  .chip.on {
    color: var(--sobre-acento);
    background: var(--acento-boton);
    border-color: var(--acento);
  }
  .chip:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .com-pct {
    min-width: 6.5rem;
  }
  .com-mini {
    display: block;
    height: 5px;
    margin-top: 5px;
    border-radius: 3px;
    background: var(--borde);
    overflow: hidden;
  }
  .com-mini i {
    display: block;
    height: 100%;
  }
  .com-vacio {
    padding: 18px;
    text-align: center;
    color: var(--suave);
  }

  @media (max-width: 1000px) {
    .com-heroes,
    .com-fila2 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .com-barras li > button,
    .com-barras li > div,
    .com-campos li > button {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .com-pista {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

const Mensaje = ({ children }) => (
  <RaizDoc>
    <div style={{ padding: 28, color: "var(--suave)" }}>{children}</div>
  </RaizDoc>
);

/* ----------------------------- pestaña Resumen ----------------------------- */

function Resumen({ m, cfg, dim, setDim, ir }) {
  return (
    <>
      <section className="com-heroes" aria-label="Indicadores principales">
        <button type="button" className="com-hero" onClick={() => ir("corregir")}>
          <span className="com-hero-q">¿Cuántos productos tienen todos sus datos?</span>
          <span className={`com-hero-cifra sf-${m.semaforo_completos}`}>{pct1(m.pct_completos)} %</span>
          <span className="com-hero-t">
            {m.completos} de {m.total} productos están listos.
          </span>
          <span className="com-tira" role="img" aria-label={`${m.completos} listos, ${m.por_corregir} por corregir`}>
            <i className="bg-verde" style={{ width: ancho(m.pct_completos) }} />
          </span>
        </button>
        <button type="button" className="com-hero" onClick={() => ir("corregir")}>
          <span className="com-hero-q">¿Cuántos hay que corregir?</span>
          <span className="com-hero-cifra">{m.por_corregir}</span>
          <span className="com-hero-t">
            {pct1(m.pct_corregir)} % de los productos tiene al menos un campo vacío. Ver la lista →
          </span>
        </button>
        <button
          type="button"
          className={`com-hero${m.peor ? "" : " sin-enlace"}`}
          onClick={() => m.peor && ir("corregir", { campo: m.peor.campo })}
        >
          <span className="com-hero-q">¿Qué dato falta más?</span>
          {m.peor ? (
            <>
              <span className="com-hero-cifra com-hero-texto">{m.peor.campo}</span>
              <span className="com-hero-t">
                Vacío en {m.peor.vacios} productos ({pct1(m.peor.pct_vacios)} %). Ver cuáles →
              </span>
            </>
          ) : (
            <>
              <span className="com-hero-cifra com-hero-texto">Ninguno</span>
              <span className="com-hero-t">Todos los campos están llenos.</span>
            </>
          )}
        </button>
      </section>

      <div className="com-fila2">
        <section className="com-tarjeta">
          <h2>¿Cuántos campos le faltan a cada producto?</h2>
          <p className="com-nota">Clic en una fila para ver esos productos.</p>
          <ul className="com-barras">
            {m.distribucion.map((d) => {
              const etiqueta = d.n === 0 ? "Ninguno (completos)" : d.n === 4 ? "4 o más" : String(d.n);
              const color = d.n === 0 ? "bg-verde" : d.n === 1 ? "bg-amarillo" : "bg-rojo";
              const contenido = (
                <>
                  <span className="com-et">{etiqueta}</span>
                  <span className="com-pista">
                    <i className={color} style={{ width: ancho(d.pct) }} />
                  </span>
                  <span className="com-val">{d.productos}</span>
                </>
              );
              return (
                <li key={d.n}>
                  {d.n ? (
                    <button type="button" onClick={() => ir("corregir", { n: String(d.n) })}>
                      {contenido}
                    </button>
                  ) : (
                    <div>{contenido}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="com-tarjeta">
          <div className="com-cab">
            <h2>¿Dónde están los productos por corregir?</h2>
            <span className="com-seg">
              {["Empresa", "Fabricante"].map((d) => (
                <button key={d} type="button" className={dim === d ? "on" : ""} aria-current={dim === d} onClick={() => setDim(d)}>
                  {d}
                </button>
              ))}
            </span>
          </div>
          <p className="com-nota">Ordenado por más productos por corregir.</p>
          <div className="tabla-caja alta">
            <table className="tabla">
              <thead>
                <tr>
                  <th>{dim}</th>
                  <th className="num">Productos</th>
                  <th className="num">Listos</th>
                  <th className="num">Por corregir</th>
                  <th className="num">% listos</th>
                </tr>
              </thead>
              <tbody>
                {m.ranking[dim].map((e) => (
                  <tr key={e.nombre}>
                    <td>{e.nombre}</td>
                    <td className="num">{e.total}</td>
                    <td className="num">{e.listos}</td>
                    <td className="num">{e.corregir}</td>
                    <td className="num">
                      <span className={`sf-pill sf-${e.semaforo}`}>{pct1(e.pct)} %</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="com-tarjeta">
        <h2>% de completitud por campo</h2>
        <p className="com-nota">
          De peor a mejor. Clic en un campo para ver los productos que lo tienen vacío. Verde desde{" "}
          {cfg.semaforo.verde.toFixed(2).replace(".", ",")}, amarillo desde {cfg.semaforo.amarillo.toFixed(2).replace(".", ",")}.
        </p>
        <ul className="com-barras com-campos">
          {m.campos.map((c) => (
            <li key={c.campo}>
              <button type="button" onClick={() => ir("corregir", { campo: c.campo })}>
                <span className="com-et">{c.campo}</span>
                <span className="com-pista">
                  <i className={`bg-${c.semaforo}`} style={{ width: ancho(c.pct) }} />
                </span>
                <span className="com-val">
                  <span className={`sf-pill sf-${c.semaforo}`}>{pct1(c.pct)} %</span> <small>{c.vacios} vacíos</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {m.revisar.length > 0 && (
        <section className="com-tarjeta">
          <h2>¿Cuántos están clasificados como {capfirst(cfg.valores_a_revisar.join(" / "))}?</h2>
          <p className="com-nota">
            No cuenta como vacío, pero es una clasificación genérica que conviene revisar. Clic en un campo para ver los
            productos.
          </p>
          <ul className="com-barras">
            {m.revisar.map((c) => (
              <li key={c.campo}>
                <button type="button" onClick={() => ir("revisar", { campo: c.campo })}>
                  <span className="com-et">{c.campo}</span>
                  <span className="com-pista">
                    <i className="bg-amarillo" style={{ width: ancho(c.pct) }} />
                  </span>
                  <span className="com-val">
                    {c.productos} <small>{pct1(c.pct)} %</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="com-tarjeta">
        <h2>Grupo × campo</h2>
        <p className="com-nota">% de productos con el campo lleno. En gris: el campo no aplica al grupo.</p>
        <div className="tabla-caja">
          <table className="tabla com-matriz">
            <thead>
              <tr>
                <th>Grupo</th>
                <th className="num">Productos</th>
                {m.orden.map((c) => (
                  <th key={c} className="num">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {m.matriz.map((g) => (
                <tr key={g.grupo}>
                  <td>{g.grupo}</td>
                  <td className="num">{g.total}</td>
                  {g.celdas.map((c, i) =>
                    c.pct === null ? (
                      <td key={i} className="num sin">
                        —
                      </td>
                    ) : (
                      <td key={i} className={`num sf-${c.semaforo}-celda`}>
                        {pct0(c.pct)} %
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ----------------------------- pestañas Corregir / Revisar ----------------------------- */

function TablaProductos({ vista, cfg, estado, campo, alternarCampo, cajaRef, alDesplazar }) {
  const { total, siguiente, cargando } = estado;
  const revisar = vista === "revisar";
  // Al cambiar de pestaña, por un instante quedan filas de la vista anterior (otra forma de datos): se descartan.
  const filas = estado.filas.filter((x) => (revisar ? x.campos : x.faltan));
  const nombreRevisar = capfirst(cfg.valores_a_revisar.join(" / "));
  return (
    <section className="com-tarjeta">
      <div className="tabla-barra">
        <p className="cuenta">
          {total} producto{total === 1 ? "" : "s"}
        </p>
      </div>
      {!filas.length && !cargando ? (
        <p className="aviso">No hay productos con estos filtros.</p>
      ) : (
        <>
          <div className="tabla-caja com-continua" ref={cajaRef} onScroll={alDesplazar}>
            <table className="tabla com-productos">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Código</th>
                  <th>Grupo</th>
                  <th>Nombre</th>
                  <th>Fabricante</th>
                  {revisar ? (
                    <th>Campos con {nombreRevisar}</th>
                  ) : (
                    <>
                      <th>
                        Campos faltantes <small className="com-ayuda">(clic en uno para filtrar)</small>
                      </th>
                      <th className="num">% completitud</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filas.map((x) => (
                  <tr key={`${x.empresa}|${x.codigo}`}>
                    <td>{x.empresa}</td>
                    <td className="cod">{x.codigo}</td>
                    <td>{x.grupo}</td>
                    <td className="nom">{x.nombre}</td>
                    <td>{x.fabricante || "—"}</td>
                    <td className="com-chips">
                      {(revisar ? x.campos : x.faltan).map((c) => (
                        <button
                          type="button"
                          key={c}
                          className={`chip${revisar ? " aviso-chip" : ""}${c === campo ? " on" : ""}`}
                          title={c === campo ? "Quitar este filtro" : `Ver solo los que tienen «${c}» ${revisar ? "" : "vacío"}`}
                          onClick={() => alternarCampo(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </td>
                    {!revisar && (
                      <td className="num com-pct">
                        <span className={`sf-pill sf-${x.semaforo}`}>{pct0(x.pct)} %</span>
                        <span className="com-mini">
                          <i className={`bg-${x.semaforo}`} style={{ width: `${(x.pct * 100).toFixed(1)}%` }} />
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tabla-pie" aria-live="polite">
            {cargando
              ? "Cargando productos…"
              : siguiente
              ? `Mostrando ${miles(filas.length)} de ${miles(total)}. Sigue bajando para ver más.`
              : ""}
          </p>
        </>
      )}
    </section>
  );
}

/* ----------------------------- pantalla ----------------------------- */

export const DocTecCompletitud = () => {
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [aplicados, setAplicados] = useState(SIN_FILTROS); // los filtros con un pequeño retraso, para no pedir en cada clic
  const [vista, setVista] = useState("resumen");
  const [dim, setDim] = useState("Empresa");
  const [q, setQ] = useState("");
  const [qAplicado, setQAplicado] = useState("");
  const [n, setN] = useState("");
  const [campo, setCampo] = useState("");

  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  const [productos, setProductos] = useState({ filas: [], total: 0, siguiente: null, cargando: false });
  const [duplicados, setDuplicados] = useState(null);
  const [descargando, setDescargando] = useState(false);

  const cajaRef = useRef(null);
  const peticion = useRef(0);
  const cargandoMas = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setAplicados(filtros), 300);
    return () => clearTimeout(t);
  }, [filtros]);

  // Resumen (indicadores + opciones de filtros)
  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerCompletitudResumen(aplicados)
      .then((d) => vivo && (setResumen(d), setError(null)))
      .catch(() => vivo && setError("No se pudo cargar la completitud. Revisa que la API esté disponible."));
    return () => {
      vivo = false;
    };
  }, [aplicados]);

  // Tabla continua: primer lote
  useEffect(() => {
    if (vista !== "corregir" && vista !== "revisar") return undefined;
    const mia = ++peticion.current;
    cargandoMas.current = false;
    setProductos({ filas: [], total: 0, siguiente: null, cargando: true });
    DocTec_ObtenerCompletitudProductos(aplicados, { vista, q: qAplicado, n: vista === "corregir" ? n : "", campo, pagina: 1 })
      .then((d) => mia === peticion.current && setProductos({ filas: d.filas, total: d.total, siguiente: d.siguiente, cargando: false }))
      .catch(() => mia === peticion.current && (setProductos((p) => ({ ...p, cargando: false })), setError("No se pudieron cargar los productos.")));
    return undefined;
  }, [vista, aplicados, qAplicado, n, campo]);

  // Códigos repetidos
  useEffect(() => {
    if (vista !== "duplicados") return undefined;
    let vivo = true;
    setDuplicados(null);
    DocTec_ObtenerCompletitudDuplicados(aplicados)
      .then((d) => vivo && setDuplicados(d))
      .catch(() => vivo && setError("No se pudieron cargar los códigos repetidos."));
    return () => {
      vivo = false;
    };
  }, [vista, aplicados]);

  // Siguiente lote cuando se llega al final de la tabla
  const cargarMas = useCallback(() => {
    if (!productos.siguiente || cargandoMas.current) return;
    cargandoMas.current = true;
    const mia = peticion.current;
    DocTec_ObtenerCompletitudProductos(aplicados, { vista, q: qAplicado, n: vista === "corregir" ? n : "", campo, pagina: productos.siguiente })
      .then((d) => {
        if (mia !== peticion.current) return;
        setProductos((p) => ({ filas: [...p.filas, ...d.filas], total: d.total, siguiente: d.siguiente, cargando: false }));
      })
      .catch(() => undefined)
      .finally(() => {
        cargandoMas.current = false;
      });
  }, [productos.siguiente, aplicados, vista, qAplicado, n, campo]);

  const alDesplazar = useCallback(() => {
    const c = cajaRef.current;
    if (c && c.scrollTop + c.clientHeight >= c.scrollHeight - 500) cargarMas();
  }, [cargarMas]);

  // Si el primer lote no llena la caja, se pide el siguiente
  useEffect(() => {
    alDesplazar();
  }, [productos.filas.length, alDesplazar]);

  const ir = (nuevaVista, extra = {}) => {
    setVista(nuevaVista);
    setQ("");
    setQAplicado("");
    setN(extra.n || "");
    setCampo(extra.campo || "");
  };

  const hayFiltros = Object.values(filtros).some((v) => v.length);

  const descargar = async () => {
    setDescargando(true);
    try {
      await DocTec_DescargarCompletitudCsv(aplicados);
    } catch {
      setError("No se pudo descargar el CSV.");
    } finally {
      setDescargando(false);
    }
  };

  if (error && !resumen) return <Mensaje>{error}</Mensaje>;
  if (!resumen) return <Mensaje>Cargando completitud…</Mensaje>;

  const { corte, config: cfg, m, opciones } = resumen;
  const lista = m.orden;
  const nombreRevisar = capitalize(cfg.valores_a_revisar.join(" / ") || "—");
  const tabs = [
    { clave: "resumen", nombre: "Resumen", n: null },
    { clave: "corregir", nombre: "Productos a corregir", n: m.por_corregir },
    { clave: "revisar", nombre: `Clasificados como ${nombreRevisar}`, n: m.n_revisar },
    { clave: "duplicados", nombre: "Códigos repetidos", n: resumen.n_duplicados },
  ];

  return (
    <RaizDoc>
      <Estilos>
        <div className="titulo-fila">
          <h1>{cfg.titulo}</h1>
        </div>

        <form className="filtros-generales" onSubmit={(e) => { e.preventDefault(); setQAplicado(q); }} aria-labelledby="t-filtros">
          <h2 id="t-filtros">Filtros</h2>
          <div className="fg-fila">
            {FILTROS.map(([nombre, etiqueta]) => (
              <FiltroMultiple
                key={nombre}
                etiqueta={etiqueta}
                opciones={opciones[nombre]}
                seleccion={filtros[nombre]}
                onChange={(sel) => setFiltros((f) => ({ ...f, [nombre]: sel }))}
              />
            ))}
          </div>
          <div className="fg-pie">
            <p className="fg-cuenta">
              {miles(m.total)} de {miles(corte.total)} productos · {cfg.titulo} · Fuente: {cfg.fuente_tabla} (PostgreSQL) · Corte del{" "}
              {fechaCorte(corte.fecha_hora)}
            </p>
            {hayFiltros && (
              <button type="button" className="boton secundario" onClick={() => setFiltros(SIN_FILTROS)}>
                Quitar filtros
              </button>
            )}
            <button type="button" className="boton secundario" onClick={descargar} disabled={descargando}>
              {descargando ? "Descargando…" : "Descargar CSV"}
            </button>
          </div>

          {(vista === "corregir" || vista === "revisar") && (
            <div className="com-barra">
              <label className="campo-etq com-busca">
                Buscar por código, nombre o fabricante
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Escribe y pulsa Enter"
                  autoComplete="off"
                />
              </label>
              {vista === "corregir" && (
                <label className="campo-etq">
                  Cantidad de campos vacíos
                  <select value={n} onChange={(e) => setN(e.target.value)}>
                    <option value="">Cualquiera</option>
                    <option value="1">Le falta 1 campo</option>
                    <option value="2">Le faltan 2 campos</option>
                    <option value="3">Le faltan 3 campos</option>
                    <option value="4">Le faltan 4 o más</option>
                  </select>
                </label>
              )}
              <label className="campo-etq">
                {vista === "corregir" ? "Campo vacío" : "Campo"}
                <select value={campo} onChange={(e) => setCampo(e.target.value)}>
                  <option value="">Cualquiera</option>
                  {lista.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </form>

        <nav className="tabs-atributos" aria-label="Vistas de completitud">
          {tabs.map((t) => (
            <button
              type="button"
              key={t.clave}
              className={`tab${t.clave === vista ? " activa" : ""}`}
              aria-current={t.clave === vista ? "page" : undefined}
              onClick={() => ir(t.clave)}
            >
              {t.nombre}
              {t.n !== null && <span className="com-n">{t.n}</span>}
            </button>
          ))}
        </nav>

        {error && <p className="aviso">{error}</p>}

        {m.total === 0 ? (
          <p className="aviso">Ningún producto cumple los filtros. Prueba quitando alguno.</p>
        ) : vista === "resumen" ? (
          <Resumen m={m} cfg={cfg} dim={dim} setDim={setDim} ir={ir} />
        ) : vista === "corregir" || vista === "revisar" ? (
          <TablaProductos
            vista={vista}
            cfg={cfg}
            estado={productos}
            campo={campo}
            alternarCampo={(c) => setCampo((actual) => (actual === c ? "" : c))}
            cajaRef={cajaRef}
            alDesplazar={alDesplazar}
          />
        ) : (
          <section className="com-tarjeta">
            <h2>Códigos llenos pero repetidos</h2>
            <p className="com-nota">Mismo valor en más de un producto de la misma empresa.</p>
            {duplicados === null ? (
              <p className="cuenta">Cargando…</p>
            ) : !duplicados.length ? (
              <p className="cuenta">No hay códigos repetidos con los filtros actuales.</p>
            ) : (
              <div className="tabla-caja">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Valor</th>
                      <th className="num">Repeticiones</th>
                      <th>Empresa</th>
                      <th>Código</th>
                      <th>Grupo</th>
                      <th>Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicados.map((d, i) => (
                      <tr key={i}>
                        <td>{d.campo}</td>
                        <td className="cod">{d.valor}</td>
                        <td className="num">{d.repeticiones}</td>
                        <td>{d.empresa}</td>
                        <td className="cod">{d.codigo}</td>
                        <td>{d.grupo}</td>
                        <td className="nom">{d.nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </Estilos>
    </RaizDoc>
  );
};
