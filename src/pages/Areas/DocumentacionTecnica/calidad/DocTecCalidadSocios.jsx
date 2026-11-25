import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import {
  DocTec_ActualizarSocios,
  DocTec_DescargarSociosCsv,
  DocTec_ObtenerSociosIdentificaciones,
  DocTec_ObtenerSociosResumen,
} from "./serviciosSocios";
import { RaizDoc } from "../estilos/RaizDoc";
import { estilosDatos } from "../comunes/estilosDatos";
import { FiltroMultiple } from "../comunes/FiltroMultiple";
import { SelectSimple } from "../comunes/SelectSimple";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";

/* =====================================================================================
   Calidad › Socios: una misma identificación (cédula o RUC) debe llevar el mismo nombre en todas
   las empresas. El nombre se compara tal cual está guardado: cualquier diferencia es una variante.
   ===================================================================================== */

const FILTROS = [
  ["empresa", "Empresa"],
  ["tipo", "Tipo de socio"],
];
const SIN_FILTROS = { empresa: [], tipo: [] };

const OPCIONES_CANTIDAD = [
  { value: "", label: "Cualquiera" },
  { value: "2", label: "2 nombres distintos" },
  { value: "3", label: "3 nombres distintos" },
  { value: "4", label: "4 o más" },
];

const miles = (n) => Number(n).toLocaleString("de-DE");
const pct1 = (p) => Number(p ?? 0).toFixed(1).replace(".", ",");
const ancho = (p) => `${Number(p ?? 0).toFixed(2)}%`;
/** Verde desde 95 %, amarillo desde 85 %, rojo por debajo. */
const semaforo = (p) => (p >= 95 ? "verde" : p >= 85 ? "amarillo" : "rojo");
const fechaCorte = (iso) =>
  new Date(iso)
    .toLocaleString("es-EC", {
      timeZone: "America/Guayaquil",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "");

const Estilos = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 48px;

  ${estilosDatos}

  /* ---------- Específico de Calidad de Socios ---------- */
  .soc-n {
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
  .soc-heroes {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin: 0 0 18px;
  }
  .soc-hero {
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
  .soc-hero:hover {
    border-color: var(--acento);
  }
  .soc-hero:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .soc-hero.sin-enlace {
    cursor: default;
  }
  .soc-hero.sin-enlace:hover {
    border-color: var(--borde);
  }
  .soc-hero-q {
    font-weight: 700;
    color: var(--suave);
    font-size: 0.95rem;
  }
  .soc-hero-cifra {
    font: 700 2.6rem/1.1 var(--fuente-titulo);
    font-variant-numeric: tabular-nums;
    color: var(--sf, var(--titulo));
  }
  .soc-hero-texto {
    font-size: 1.7rem;
    padding: 6px 0 2px;
    color: var(--titulo);
  }
  .soc-hero-t {
    font-size: 0.92rem;
    color: var(--texto);
  }
  .soc-tira {
    display: block;
    height: 10px;
    margin-top: 6px;
    border-radius: 5px;
    background: var(--borde);
    overflow: hidden;
  }
  .soc-tira i {
    display: block;
    height: 100%;
  }

  .soc-fila2 {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: 14px;
    margin: 0 0 18px;
  }
  .soc-tarjeta {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    padding: 18px 20px;
    margin: 0 0 18px;
    min-width: 0;
  }
  .soc-fila2 .soc-tarjeta {
    margin: 0;
  }
  .soc-tarjeta h2 {
    margin: 0 0 2px;
    font-size: 1.05rem;
    color: var(--titulo);
  }
  .soc-sin {
    color: var(--suave);
    font-weight: 400;
    font-size: 0.85rem;
  }
  .soc-nota {
    margin: 2px 0 14px;
    color: var(--suave);
    font-size: 0.88rem;
  }
  .soc-barras {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .soc-barras li > button,
  .soc-barras li > div {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr) auto;
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
  .soc-barras li > button {
    cursor: pointer;
  }
  .soc-barras li > button:hover {
    background: var(--acento-fondo);
  }
  .soc-barras li > button:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
  }
  .soc-et {
    font-size: 0.93rem;
  }
  .soc-pista {
    display: block;
    height: 10px;
    border-radius: 5px;
    background: var(--borde);
    overflow: hidden;
  }
  .soc-pista i {
    display: block;
    height: 100%;
    border-radius: 5px;
  }
  .soc-val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    white-space: nowrap;
  }
  .soc-val small {
    font-weight: 400;
    color: var(--suave);
    margin-left: 4px;
  }

  .soc-barra {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    align-items: flex-end;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--borde);
  }
  .soc-barra label {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .soc-busca {
    flex: 1 1 18rem;
  }
  .soc-sug-caja {
    position: relative;
  }
  .soc-sug-caja > label {
    width: 100%;
  }
  .soc-sug {
    position: absolute;
    z-index: 20;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0;
    padding: 4px;
    list-style: none;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    max-height: 320px;
    overflow-y: auto;
  }
  .soc-sug li {
    display: grid;
    grid-template-columns: 9.5rem minmax(0, 1fr) auto;
    gap: 10px;
    align-items: baseline;
    padding: 7px 10px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .soc-sug li.activo,
  .soc-sug li:hover {
    background: var(--acento-fondo);
  }
  .soc-sug .soc-sug-id {
    font-family: var(--fuente-mono);
    font-size: 0.85rem;
  }
  .soc-sug .soc-sug-nom {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .soc-sug .soc-sug-n,
  .soc-sug-vacio {
    color: var(--suave);
    font-size: 0.8rem;
  }
  .soc-sug-vacio {
    padding: 8px 10px;
  }
  .tabla-caja.soc-continua {
    max-height: min(70vh, 900px);
  }
  .soc-ids td {
    vertical-align: middle;
    white-space: nowrap;
  }
  .soc-ids th,
  .soc-ids td {
    vertical-align: top;
  }
  .soc-ids td.var {
    min-width: 15rem;
    max-width: 24rem;
    text-align: left;
    white-space: normal;
    word-break: break-word;
  }
  .soc-ids td.var b {
    display: block;
    margin-bottom: 4px;
    font: 600 0.86rem/1.35 var(--fuente-mono);
    white-space: pre-wrap;
  }
  .soc-ids td.sin-var {
    color: var(--suave);
    text-align: center;
  }
  .soc-orig {
    display: inline-block;
    margin: 0 4px 4px 0;
    padding: 1px 8px;
    border-radius: 999px;
    font: 600 0.72rem/1.5 var(--fuente);
    white-space: nowrap;
    color: var(--suave);
    background: var(--borde);
  }
  .soc-cab-lista {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  @media (max-width: 1000px) {
    .soc-heroes,
    .soc-fila2 {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 560px) {
    .soc-barras li > button,
    .soc-barras li > div {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .soc-pista {
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

/** Barras de consistencia: % de identificaciones comparables sin variantes (100 − % con variantes). */
function BarrasFallo({ filas, clave, ir }) {
  return (
    <ul className="soc-barras">
      {filas.map((f) => (
        <li key={f[clave]}>
          {f.comparables === 0 ? (
            <div title="Ninguna de sus identificaciones está en otra empresa: no hay con qué comparar">
              <span className="soc-et">{f[clave]}</span>
              <span className="soc-pista" />
              <span className="soc-val soc-sin">
                sin comparación
              </span>
            </div>
          ) : (
            <button type="button" onClick={() => ir()} title="Ver la lista">
              <span className="soc-et">{f[clave]}</span>
              <span className="soc-pista">
                <i className={`bg-${semaforo(100 - f.pct_fallo)}`} style={{ width: ancho(100 - f.pct_fallo) }} />
              </span>
              <span className="soc-val">
                {pct1(100 - f.pct_fallo)} % <small>{miles(f.comparables - f.con_variantes)} de {miles(f.comparables)}</small>
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function Resumen({ m, ir }) {
  const peor = m.por_empresa.find((e) => e.comparables > 0 && e.con_variantes > 0);
  const base = m.con_variantes || 1;
  const filas = [
    { clave: "2", etiqueta: "2 nombres distintos", n: m.distribucion["2"] },
    { clave: "3", etiqueta: "3 nombres distintos", n: m.distribucion["3"] },
    { clave: "4", etiqueta: "4 o más nombres", n: m.distribucion["4+"] },
  ];
  return (
    <>
      <section className="soc-heroes" aria-label="Indicadores principales">
        <button type="button" className="soc-hero" onClick={() => ir()}>
          <span className="soc-hero-q">¿Cuántas identificaciones tienen variantes del nombre?</span>
          <span className="soc-hero-cifra sf-rojo">{miles(m.con_variantes)}</span>
          <span className="soc-hero-t">
            {pct1(m.pct_fallo)} % de las {miles(m.comparables)} que se pueden comparar. Ver la lista →
          </span>
          <span className="soc-tira" role="img" aria-label={`${m.con_variantes} con variantes de ${m.comparables} comparables`}>
            <i className="bg-rojo" style={{ width: ancho(m.pct_fallo) }} />
          </span>
        </button>
        <button type="button" className="soc-hero sin-enlace">
          <span className="soc-hero-q">Consistencia entre empresas</span>
          <span className={`soc-hero-cifra sf-${semaforo(m.pct_consistencia ?? 0)}`}>{pct1(m.pct_consistencia)} %</span>
          <span className="soc-hero-t">
            {miles(m.consistentes)} de {miles(m.comparables)} identificaciones comparables tienen el mismo nombre en todas las empresas.
          </span>
        </button>
        <button type="button" className={`soc-hero${peor ? "" : " sin-enlace"}`} onClick={() => peor && ir()}>
          <span className="soc-hero-q">¿Qué empresa es menos consistente?</span>
          {peor ? (
            <>
              <span className="soc-hero-cifra soc-hero-texto">{peor.empresa}</span>
              <span className="soc-hero-t">
                {pct1(100 - peor.pct_fallo)} % de sus identificaciones comparables son consistentes ({miles(peor.comparables - peor.con_variantes)} de {miles(peor.comparables)}).
              </span>
            </>
          ) : (
            <>
              <span className="soc-hero-cifra soc-hero-texto">Ninguna</span>
              <span className="soc-hero-t">No hay variantes con los filtros actuales.</span>
            </>
          )}
        </button>
      </section>

      <div className="soc-fila2">
        <section className="soc-tarjeta">
          <h2>Consistencia por empresa</h2>
          <p className="soc-nota">% de identificaciones comparables con el mismo nombre en todas las empresas. De peor a mejor.</p>
          <BarrasFallo filas={m.por_empresa} clave="empresa" ir={ir} />

          <h2 style={{ marginTop: 22 }}>Por tipo de socio</h2>
          <p className="soc-nota">Una identificación cuenta en cada tipo que tiene.</p>
          <BarrasFallo filas={m.por_tipo} clave="tipo" ir={ir} />
        </section>

        <section className="soc-tarjeta">
          <h2>¿Cuántos nombres distintos tiene cada una?</h2>
          <p className="soc-nota">Solo las identificaciones con variantes. Clic en una fila para ver esas.</p>
          <ul className="soc-barras">
            {filas.map((f) => (
              <li key={f.clave}>
                <button type="button" onClick={() => ir({ cantidad: f.clave })}>
                  <span className="soc-et">{f.etiqueta}</span>
                  <span className="soc-pista">
                    <i className="bg-rojo" style={{ width: ancho((f.n / base) * 100) }} />
                  </span>
                  <span className="soc-val">{miles(f.n)}</span>
                </button>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: 22 }}>¿Cuánto se pudo comparar?</h2>
          <p className="soc-nota">
            Una identificación que está en una sola empresa no puede tener variantes, así que no entra en el porcentaje.
          </p>
          <ul className="soc-barras">
            <li>
              <div>
                <span className="soc-et">Comparables (en varias empresas)</span>
                <span className="soc-pista">
                  <i className="bg-amarillo" style={{ width: ancho(m.pct_cobertura) }} />
                </span>
                <span className="soc-val">
                  {miles(m.comparables)} <small>{pct1(m.pct_cobertura)} %</small>
                </span>
              </div>
            </li>
            <li>
              <div>
                <span className="soc-et">En una sola empresa</span>
                <span className="soc-pista">
                  <i className="bg-verde" style={{ width: ancho(m.total ? (m.en_una_empresa / m.total) * 100 : 0) }} />
                </span>
                <span className="soc-val">{miles(m.en_una_empresa)}</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

/* ----------------------------- pestaña Identificaciones con variantes ----------------------------- */

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Una fila por identificación; cada nombre distinto va en su columna, con las empresas que lo usan. */
function TablaVariantes({ estado, maxVar, cajaRef, alDesplazar }) {
  const { total, siguiente, cargando, filas } = estado;
  const columnas = Array.from({ length: Math.max(2, maxVar) }, (_, i) => i);
  return (
    <>
      {!filas.length && !cargando ? (
        <p className="aviso">No hay identificaciones con variantes con estos filtros.</p>
      ) : (
        <>
          <div className="tabla-caja soc-continua" ref={cajaRef} onScroll={alDesplazar}>
            <table className="tabla soc-ids">
              <thead>
                <tr>
                  <th>Identificación</th>
                  <th>Tipo</th>
                  <th className="num">Empresas</th>
                  {columnas.map((i) => (
                    <th key={i}>Variante {LETRAS[i]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((x) => (
                  <tr key={x.identificacion}>
                    <td className="cod">{x.identificacion}</td>
                    <td>{x.tipo_identificacion || "—"}</td>
                    <td className="num">{x.n_empresas}</td>
                    {columnas.map((i) => {
                      const v = x.variantes[i];
                      return v ? (
                        <td key={i} className="var">
                          <b>{v.nombre === "" ? "(vacío)" : v.nombre}</b>
                          {v.origen.map((o, k) => (
                            <span key={k} className="soc-orig" title={`${o.empresa} · ${o.tipo} · ${o.codigo}`}>
                              {o.empresa} · {String(o.tipo).toLowerCase()}
                            </span>
                          ))}
                        </td>
                      ) : (
                        <td key={i} className="sin-var">
                          —
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tabla-pie" aria-live="polite">
            {cargando
              ? "Cargando identificaciones…"
              : siguiente
              ? `Mostrando ${miles(filas.length)} de ${miles(total)}. Sigue bajando para ver más.`
              : ""}
          </p>
        </>
      )}
    </>
  );
}

/* ----------------------------- pantalla ----------------------------- */

export const DocTecCalidadSocios = () => {
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [aplicados, setAplicados] = useState(SIN_FILTROS); // los filtros con un pequeño retraso, para no pedir en cada clic
  const [q, setQ] = useState("");
  const [qAplicado, setQAplicado] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [tipoId, setTipoId] = useState("");

  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  const [lista, setLista] = useState({ filas: [], total: 0, siguiente: null, cargando: false });
  const [descargando, setDescargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [version, setVersion] = useState(0); // sube al pulsar «Actualizar datos» para volver a pedir todo

  const cajaRef = useRef(null);
  const listaRef = useRef(null);
  const peticion = useRef(0);
  const cargandoMas = useRef(false);
  const peticionSug = useRef(0);
  const [sugerencias, setSugerencias] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);

  useEffect(() => {
    const t = setTimeout(() => setAplicados(filtros), 300);
    return () => clearTimeout(t);
  }, [filtros]);

  // Sugerencias al escribir (desplegable): no tocan la tabla hasta que se elige una o se pulsa Enter
  useEffect(() => {
    const texto = q.trim();
    if (!texto) {
      setQAplicado("");
      setSugerencias(null);
      return undefined;
    }
    if (texto === qAplicado) return undefined; // ya aplicado (se eligió una sugerencia)
    if (texto.length < 2) {
      setSugerencias(null);
      return undefined;
    }
    const mia = ++peticionSug.current;
    const t = setTimeout(() => {
      DocTec_ObtenerSociosIdentificaciones(aplicados, { q: texto, cantidad, tipoIdentificacion: tipoId, pagina: 1 })
        .then((d) => {
          if (mia !== peticionSug.current) return;
          setSugerencias(d.filas.slice(0, 8).map((f) => ({ ...f, total: d.total })));
          setActivo(-1);
          setAbierto(true);
        })
        .catch(() => mia === peticionSug.current && setSugerencias([]));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, aplicados, cantidad, tipoId]);

  const elegir = (f) => {
    setQ(f.identificacion);
    setQAplicado(f.identificacion);
    setAbierto(false);
    setSugerencias(null);
  };

  const alTeclear = (e) => {
    if (e.key === "ArrowDown" && sugerencias?.length) {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => (a + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp" && sugerencias?.length) {
      e.preventDefault();
      setActivo((a) => (a <= 0 ? sugerencias.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (abierto && activo >= 0 && sugerencias?.[activo]) elegir(sugerencias[activo]);
      else {
        setQAplicado(q.trim());
        setAbierto(false);
      }
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  // Resumen (indicadores + opciones de filtros)
  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerSociosResumen(aplicados)
      .then((d) => vivo && (setResumen(d), setError(null)))
      .catch((e) => vivo && setError(e.response?.data?.message ?? "No se pudo cargar la calidad de socios. Revisa que la API esté disponible."));
    return () => {
      vivo = false;
    };
  }, [aplicados, version]);

  // Tabla continua: primer lote
  useEffect(() => {
    const mia = ++peticion.current;
    cargandoMas.current = false;
    setLista({ filas: [], total: 0, siguiente: null, cargando: true });
    DocTec_ObtenerSociosIdentificaciones(aplicados, { q: qAplicado, cantidad, tipoIdentificacion: tipoId, pagina: 1 })
      .then((d) => mia === peticion.current && setLista({ filas: d.filas, total: d.total, siguiente: d.siguiente, cargando: false }))
      .catch(() => mia === peticion.current && (setLista((p) => ({ ...p, cargando: false })), setError("No se pudieron cargar las identificaciones.")));
  }, [aplicados, qAplicado, cantidad, tipoId, version]);

  // Siguiente lote cuando se llega al final de la tabla
  const cargarMas = useCallback(() => {
    if (!lista.siguiente || cargandoMas.current) return;
    cargandoMas.current = true;
    const mia = peticion.current;
    DocTec_ObtenerSociosIdentificaciones(aplicados, { q: qAplicado, cantidad, tipoIdentificacion: tipoId, pagina: lista.siguiente })
      .then((d) => {
        if (mia !== peticion.current) return;
        setLista((p) => ({ filas: [...p.filas, ...d.filas], total: d.total, siguiente: d.siguiente, cargando: false }));
      })
      .catch(() => undefined)
      .finally(() => {
        cargandoMas.current = false;
      });
  }, [lista.siguiente, aplicados, qAplicado, cantidad, tipoId]);

  const alDesplazar = useCallback(() => {
    const c = cajaRef.current;
    if (c && c.scrollTop + c.clientHeight >= c.scrollHeight - 500) cargarMas();
  }, [cargarMas]);

  // Si el primer lote no llena la caja, se pide el siguiente
  useEffect(() => {
    alDesplazar();
  }, [lista.filas.length, alDesplazar]);

  /** Desde el resumen: lleva a la tabla de abajo, opcionalmente ya filtrada por cantidad de nombres. */
  const ir = (extra = {}) => {
    setQ("");
    setQAplicado("");
    setCantidad(extra.cantidad || "");
    setTipoId("");
    listaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hayFiltros = Object.values(filtros).some((v) => v.length);

  const actualizar = async () => {
    setActualizando(true);
    try {
      const r = await DocTec_ActualizarSocios();
      toast.success(`Calidad de socios actualizada: ${miles(r.identificaciones)} identificaciones leídas de la base.`);
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e.response?.data?.message ?? "No se pudo actualizar la calidad de socios. Revisa que la API y la base estén disponibles.");
    } finally {
      setActualizando(false);
    }
  };

  const descargar = async () => {
    setDescargando(true);
    try {
      await DocTec_DescargarSociosCsv(aplicados);
    } catch {
      setError("No se pudo descargar el CSV.");
    } finally {
      setDescargando(false);
    }
  };

  if (error && !resumen) return <Mensaje>{error}</Mensaje>;
  if (!resumen)
    return (
      <RaizDoc>
        <LoaderUI text="Cargando calidad de socios…" height="100%" />
      </RaizDoc>
    );

  const { corte, m, opciones } = resumen;

  return (
    <RaizDoc>
      <Estilos>
        <div className="titulo-fila">
          <h1>Calidad de Socios</h1>
          <ButtonUI text={actualizando ? "Actualizando…" : "Actualizar datos"} variant="outlined" onClick={actualizar} disabled={actualizando} />
        </div>

        <form className="filtros-generales" onSubmit={(e) => e.preventDefault()} aria-labelledby="t-filtros-soc">
          <h2 id="t-filtros-soc">Filtros</h2>
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
              {miles(m.total)} identificaciones, {miles(m.comparables)} comparables · Mismo RUC o cédula con el mismo nombre en todas las empresas · Fuente: {corte.origen} (PostgreSQL) · Corte del{" "}
              {fechaCorte(corte.fecha_hora)}
            </p>
            {hayFiltros && <ButtonUI text="Quitar filtros" variant="outlined" onClick={() => setFiltros(SIN_FILTROS)} />}
            <ButtonUI text={descargando ? "Descargando…" : "Descargar CSV"} variant="outlined" onClick={descargar} disabled={descargando} />
          </div>

        </form>

        {error && <p className="aviso">{error}</p>}

        {m.total === 0 ? (
          <p className="aviso">Ninguna identificación cumple los filtros. Prueba quitando alguno.</p>
        ) : (
          <>
            <Resumen m={m} ir={ir} />

            <section className="soc-tarjeta" ref={listaRef} aria-labelledby="t-lista-soc">
              <div className="soc-cab-lista">
                <h2 id="t-lista-soc">Identificaciones con variantes</h2>
                <p className="cuenta">
                  {miles(lista.total)} identificaci{lista.total === 1 ? "ón" : "ones"}
                </p>
              </div>
              <p className="soc-nota">
                Cada nombre distinto va en su columna, con las empresas que lo usan. Ordenado por más empresas y más variantes.
              </p>
              <form className="soc-barra" style={{ marginTop: 0, paddingTop: 0, borderTop: 0, marginBottom: 14 }} onSubmit={(e) => { e.preventDefault(); setQAplicado(q); }}>
                <div
                  className="soc-busca soc-sug-caja"
                  onKeyDown={alTeclear}
                  onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setAbierto(false)}
                >
                  <label className="campo-etq">
                    Buscar por identificación o nombre
                    <InputUI
                      type="search"
                      value={q}
                      onChange={(v) => {
                        setQ(v);
                        setAbierto(true);
                      }}
                      placeholder="Escribe un nombre o una cédula / RUC"
                    />
                  </label>
                  {abierto && sugerencias && q.trim().length >= 2 && q.trim() !== qAplicado && (
                    <ul className="soc-sug" role="listbox" aria-label="Sugerencias">
                      {sugerencias.length === 0 ? (
                        <li className="soc-sug-vacio" style={{ display: "block", cursor: "default" }}>Sin coincidencias con variantes</li>
                      ) : (
                        sugerencias.map((f, i) => (
                          <li
                            key={f.identificacion}
                            role="option"
                            aria-selected={i === activo}
                            className={i === activo ? "activo" : ""}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => elegir(f)}
                          >
                            <span className="soc-sug-id">{f.identificacion}</span>
                            <span className="soc-sug-nom">{f.variantes[0]?.nombre}</span>
                            <span className="soc-sug-n">{f.n_variantes} nombres · {f.n_empresas} empresas</span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <label className="campo-etq">
                  Tipo de identificación
                  <SelectSimple
                    value={tipoId}
                    onChange={setTipoId}
                    opciones={[{ value: "", label: "Todos" }, ...(opciones.tipo_identificacion ?? []).map((t) => ({ value: t, label: t }))]}
                    ariaLabel="Tipo de identificación"
                  />
                </label>
                <label className="campo-etq">
                  Nombres distintos
                  <SelectSimple value={cantidad} onChange={setCantidad} opciones={OPCIONES_CANTIDAD} ariaLabel="Nombres distintos" />
                </label>
              </form>
              <TablaVariantes estado={lista} maxVar={m.max_variantes} cajaRef={cajaRef} alDesplazar={alDesplazar} />
            </section>
          </>
        )}
      </Estilos>
    </RaizDoc>
  );
};
