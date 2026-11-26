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
   Calidad › Socios, con el mismo formato que Calidad de Productos. Atributos: Nombre e Identificación (la
   regla al revés: un mismo nombre, en una o varias empresas, con una sola identificación; cédula y su RUC = la misma).
   Una misma identificación (cédula o RUC) debe llevar el mismo nombre en todas las empresas; se compara
   tal cual está guardado. Solo se miden las que están en más de una empresa (comparables).
   ===================================================================================== */

const FILTROS = [
  ["empresa", "Empresa"],
  ["tipo", "Tipo de socio"],
];
const SIN_FILTROS = { empresa: [], tipo: [] };

const OPCIONES_ESTADO = [
  { value: "", label: "Todos" },
  { value: "CORRECTO", label: "Correcto" },
  { value: "INCONSISTENTE", label: "Inconsistente" },
];
/** Textos de cada atributo: qué se agrupa (unidad) y qué debe coincidir (variante). */
const ATRIBUTOS = {
  nombre: {
    nombre: "Nombre",
    clave: "Identificación",
    unidad: ["identificación", "identificaciones"],
    unidades: "Identificaciones",
    variante: "Variante",
    distintos: "Nombres distintos",
    desglose: "Inconsistentes según cuántos nombres tienen",
  },
  identificacion: {
    nombre: "Identificación",
    clave: "Nombre",
    unidad: ["nombre", "nombres"],
    unidades: "Nombres",
    variante: "Identificación",
    distintos: "Identificaciones distintas",
    desglose: "Inconsistentes según cuántas identificaciones tienen",
  },
};
const opcionesCantidad = (palabra) => [
  { value: "", label: "Cualquiera" },
  { value: "2", label: `2 ${palabra}` },
  { value: "3", label: `3 ${palabra}` },
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
  .soc-resumen {
    display: grid;
    grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
    gap: 28px clamp(20px, 4vw, 56px);
    margin: 18px 0 26px;
  }
  .soc-resumen h2 {
    margin: 0;
    font-size: 1.05rem;
  }
  .soc-cifra {
    color: var(--titulo);
    margin: 0.1em 0 0.25em;
    font: 700 clamp(2.8rem, 6vw, 3.6rem) / 1 var(--fuente-titulo);
  }
  .soc-cifra span {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--suave);
  }
  .soc-fuente {
    color: var(--suave);
    font-size: 0.88rem;
  }
  .soc-attr {
    display: grid;
    grid-template-columns: 8rem minmax(60px, 1fr) 4.8rem 5.6rem;
    gap: 14px;
    align-items: center;
    width: 100%;
    padding: 11px 10px;
    border: 0;
    border-bottom: 1px solid var(--borde);
    background: none;
    font: inherit;
    text-align: left;
    color: var(--texto);
    cursor: pointer;
  }
  .soc-attr:hover {
    background: var(--acento-fondo);
  }
  .soc-attr.cab {
    padding-top: 0;
    border-bottom: 2px solid var(--marca);
    font-size: 0.8rem;
    color: var(--suave);
    cursor: default;
  }
  .soc-attr.cab:hover {
    background: none;
  }
  .soc-attr .pct {
    text-align: right;
    font: 700 1.1rem var(--fuente-titulo);
    font-variant-numeric: tabular-nums;
  }
  .soc-attr.cab .pct {
    font: inherit;
  }
  .soc-attr .rev {
    text-align: right;
    color: var(--suave);
    font-variant-numeric: tabular-nums;
  }
  .soc-pista {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: var(--borde);
    overflow: hidden;
  }
  .soc-pista i {
    display: block;
    height: 100%;
    border-radius: 4px;
  }

  .soc-detalle {
    border-top: 2px solid var(--marca);
    padding-top: 14px;
  }
  .soc-detalle h2 {
    margin: 0 0 10px;
    color: var(--titulo);
  }
  .soc-tabs {
    display: flex;
    gap: 6px;
  }
  .soc-tab:not(.activa) {
    border-bottom-color: transparent;
    color: var(--suave);
  }
  .soc-tab {
    border: 0;
    background: none;
    color: var(--texto);
    cursor: pointer;
    font-family: inherit;
    display: inline-block;
    padding: 6px 12px;
    border-bottom: 3px solid var(--acento);
    font-weight: 700;
    text-transform: uppercase;
    font-size: 0.85rem;
    margin-bottom: 14px;
  }
  .soc-graficos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin: 4px 0 20px;
  }
  /* cada gráfico en su recuadro, para que no se vean como uno solo */
  .soc-graficos > div {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    padding: 16px 18px 12px;
    min-width: 0;
  }
  .soc-graficos h3 {
    margin: 0 0 10px;
    font-size: 0.98rem;
    color: var(--titulo);
  }
  .soc-columnas {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }
  .soc-columna {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: none;
    padding: 6px 4px;
    font: inherit;
    color: var(--texto);
    cursor: pointer;
  }
  .soc-columna:hover {
    background: var(--acento-fondo);
  }
  .soc-columna.activa {
    border-color: var(--acento);
  }
  .soc-columna .barra {
    height: 140px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .soc-columna .barra i {
    display: block;
    width: 52px;
    min-height: 2px;
    border-radius: 4px 4px 0 0;
  }
  .soc-columna small {
    color: var(--suave);
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
  .soc-ids .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    white-space: nowrap;
  }
  .soc-ids .punto {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .soc-ids .punto.e-correcto {
    background: var(--ok);
  }
  .soc-ids .punto.e-inconsistente {
    background: var(--error);
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
    .soc-resumen {
      grid-template-columns: 1fr;
    }
  }
`;

const Mensaje = ({ children }) => (
  <RaizDoc>
    <div style={{ padding: 28, color: "var(--suave)" }}>{children}</div>
  </RaizDoc>
);

/* ----------------------------- vista general ----------------------------- */

/**
 * Índice general (promedio de los atributos) y lista de atributos evaluados, como en Calidad de Productos.
 * Cada columna nueva que se evalúe se agrega como otra fila.
 */
function VistaGeneral({ indice, m, mi, fecha, activo, onElegir }) {
  const atributos = [
    { clave: "nombre", nombre: "Nombre", pct: m.pct_consistencia, porRevisar: m.con_variantes },
    { clave: "identificacion", nombre: "Identificación", pct: mi.pct_consistencia, porRevisar: mi.con_variantes },
  ].sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
  return (
    <section className="soc-resumen" aria-labelledby="t-resumen-soc">
      <div>
        <h2 id="t-resumen-soc">Índice general</h2>
        <p className="soc-cifra">
          {indice === null ? "N/A" : pct1(indice)}
          <span> / 100</span>
        </p>
        <p>Promedio de los atributos evaluados.</p>
        <p className="soc-fuente">
          {miles(m.comparables)} identificaciones y {miles(mi.comparables)} nombres comparables
          <br />
          Actualizado el {fecha}
        </p>
      </div>
      <div>
        <div className="soc-attr cab" aria-hidden="true">
          <span>Atributo</span>
          <span>% correcto</span>
          <span className="pct" />
          <span className="rev">Por revisar</span>
        </div>
        {atributos.map((a) => (
          <button
            type="button"
            key={a.clave}
            className="soc-attr"
            aria-current={a.clave === activo ? "true" : undefined}
            onClick={() => onElegir(a.clave)}
            title={`Ver el detalle de ${a.nombre}`}
          >
            <span>{a.nombre}</span>
            <span className="soc-pista">
              {a.pct !== null && <i className={`bg-${semaforo(a.pct)}`} style={{ width: ancho(a.pct) }} />}
            </span>
            <span className="pct">{a.pct === null ? "N/A" : `${pct1(a.pct)} %`}</span>
            <span className="rev">{miles(a.porRevisar)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Gráfico de columnas; cada columna filtra la tabla de abajo. */
function Columnas({ titulo, datos, total, activa, onElegir }) {
  const mayor = Math.max(...datos.map((d) => d.n), 1);
  return (
    <div>
      <h3>{titulo}</h3>
      <div className="soc-columnas">
        {datos.map((d) => (
          <button
            type="button"
            key={d.clave}
            className={`soc-columna${activa === d.clave ? " activa" : ""}`}
            aria-pressed={activa === d.clave}
            onClick={() => onElegir(activa === d.clave ? "" : d.clave)}
          >
            <span>{miles(d.n)}</span>
            <span className="barra">
              <i className={`bg-${d.color}`} style={{ height: `${(d.n / mayor) * 100}%` }} />
            </span>
            <span>{d.etiqueta}</span>
            <small>{pct1(total ? (d.n / total) * 100 : 0)} %</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- tabla del detalle ----------------------------- */

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Una fila por identificación; cada nombre distinto va en su columna, con las empresas que lo usan. */
function TablaVariantes({ estado, maxVar, cajaRef, alDesplazar, atributo }) {
  const t = ATRIBUTOS[atributo];
  const porIdentificacion = atributo === "nombre";
  const { total, siguiente, cargando, filas } = estado;
  const columnas = Array.from({ length: Math.max(2, maxVar) }, (_, i) => i);
  return (
    <>
      {!filas.length && !cargando ? (
        <p className="aviso">No hay {t.unidad[1]} que cumplan estos filtros.</p>
      ) : (
        <>
          <div className="tabla-caja soc-continua" ref={cajaRef} onScroll={alDesplazar}>
            <table className="tabla soc-ids">
              <thead>
                <tr>
                  <th>{t.clave}</th>
                  {porIdentificacion && <th>Tipo</th>}
                  <th className="num">Empresas</th>
                  {columnas.map((i) => (
                    <th key={i}>
                      {t.variante} {LETRAS[i]}
                    </th>
                  ))}
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((x) => (
                  <tr key={x.identificacion}>
                    <td className={porIdentificacion ? "cod" : "var"}>{x.identificacion}</td>
                    {porIdentificacion && <td>{x.tipo_identificacion || "—"}</td>}
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
                    <td>
                      <span className="chip">
                        <i className={`punto e-${x.estado.toLowerCase()}`} />
                        {x.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tabla-pie" aria-live="polite">
            {cargando
              ? `Cargando ${t.unidad[1]}…`
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
  const [estado, setEstado] = useState("");
  const [atributo, setAtributo] = useState("nombre");

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
      DocTec_ObtenerSociosIdentificaciones(aplicados, { q: texto, cantidad, tipoIdentificacion: tipoId, estado, atributo, pagina: 1 })
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
  }, [q, aplicados, cantidad, tipoId, estado, atributo]);

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
    DocTec_ObtenerSociosIdentificaciones(aplicados, { q: qAplicado, cantidad, tipoIdentificacion: tipoId, estado, atributo, pagina: 1 })
      .then((d) => mia === peticion.current && setLista({ filas: d.filas, total: d.total, siguiente: d.siguiente, cargando: false }))
      .catch(() => mia === peticion.current && (setLista((p) => ({ ...p, cargando: false })), setError("No se pudieron cargar las identificaciones.")));
  }, [aplicados, qAplicado, cantidad, tipoId, estado, atributo, version]);

  // Siguiente lote cuando se llega al final de la tabla
  const cargarMas = useCallback(() => {
    if (!lista.siguiente || cargandoMas.current) return;
    cargandoMas.current = true;
    const mia = peticion.current;
    DocTec_ObtenerSociosIdentificaciones(aplicados, { q: qAplicado, cantidad, tipoIdentificacion: tipoId, estado, atributo, pagina: lista.siguiente })
      .then((d) => {
        if (mia !== peticion.current) return;
        setLista((p) => ({ filas: [...p.filas, ...d.filas], total: d.total, siguiente: d.siguiente, cargando: false }));
      })
      .catch(() => undefined)
      .finally(() => {
        cargandoMas.current = false;
      });
  }, [lista.siguiente, aplicados, qAplicado, cantidad, tipoId, estado, atributo]);

  const alDesplazar = useCallback(() => {
    const c = cajaRef.current;
    if (c && c.scrollTop + c.clientHeight >= c.scrollHeight - 500) cargarMas();
  }, [cargarMas]);

  // Si el primer lote no llena la caja, se pide el siguiente
  useEffect(() => {
    alDesplazar();
  }, [lista.filas.length, alDesplazar]);

  /** Cambia de atributo: el detalle empieza sin filtros propios. */
  const elegirAtributo = (clave) => {
    if (clave === atributo) return;
    setAtributo(clave);
    setEstado("");
    setCantidad("");
    setTipoId("");
    setQ("");
    setQAplicado("");
    setSugerencias(null);
    setLista({ filas: [], total: 0, siguiente: null, cargando: true });
  };
  /** Desde la lista de atributos: además baja al detalle. */
  const verDetalle = (clave) => {
    elegirAtributo(clave);
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
      await DocTec_DescargarSociosCsv(aplicados, atributo);
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

  const { corte, m, mi, indice, opciones } = resumen;
  const textos = ATRIBUTOS[atributo];
  const datos = atributo === "nombre" ? m : mi; // cifras del atributo del detalle

  return (
    <RaizDoc>
      <Estilos>
        <div className="titulo-fila">
          <h1>Calidad de Socios</h1>
          <ButtonUI text={actualizando ? "Actualizando…" : "Actualizar datos"} variant="outlined" onClick={actualizar} disabled={actualizando} />
        </div>

        <form className="filtros-generales" onSubmit={(e) => e.preventDefault()} aria-labelledby="t-filtros-soc">
          <h2 id="t-filtros-soc">Filtros generales</h2>
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
          <div className="fg-fila2">
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
                  <li className="soc-sug-vacio" style={{ display: "block", cursor: "default" }}>Sin coincidencias entre las comparables</li>
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
                      <span className="soc-sug-id">{atributo === "nombre" ? f.identificacion : f.variantes[0]?.nombre}</span>
                                  <span className="soc-sug-nom">{atributo === "nombre" ? f.variantes[0]?.nombre : f.identificacion}</span>
                                  <span className="soc-sug-n">{f.n_variantes} {f.n_variantes === 1 ? "valor" : "valores"} · {f.n_empresas} empresas</span>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          </div>
          <div className="fg-pie">
            <p className="fg-cuenta">
              {miles(m.comparables)} comparables de {miles(m.total)} identificaciones · Fuente: {corte.origen} (PostgreSQL)
            </p>
            {hayFiltros && <ButtonUI text="Quitar filtros" variant="outlined" onClick={() => setFiltros(SIN_FILTROS)} />}
            <ButtonUI text={descargando ? "Descargando…" : "Descargar CSV de variantes"} variant="outlined" onClick={descargar} disabled={descargando} />
          </div>
        </form>

        {error && <p className="aviso">{error}</p>}

        {m.total === 0 ? (
          <p className="aviso">Ninguna identificación cumple los filtros. Prueba quitando alguno.</p>
        ) : (
          <>
            <VistaGeneral indice={indice} m={m} mi={mi} fecha={fechaCorte(corte.fecha_hora)} activo={atributo} onElegir={verDetalle} />

            <section className="soc-detalle" ref={listaRef} aria-labelledby="t-lista-soc">
              <h2 id="t-lista-soc">Detalle: {textos.nombre}</h2>
              <nav className="soc-tabs" aria-label="Atributo del detalle">
                {Object.entries(ATRIBUTOS).map(([clave, a]) => (
                  <button
                    type="button"
                    key={clave}
                    className={`soc-tab${clave === atributo ? " activa" : ""}`}
                    aria-current={clave === atributo ? "page" : undefined}
                    onClick={() => elegirAtributo(clave)}
                  >
                    {a.nombre}
                  </button>
                ))}
              </nav>
              <div className="soc-barra" style={{ marginTop: 0, paddingTop: 0, borderTop: 0, marginBottom: 14 }}>
                <label className="campo-etq">
                  Filtrar por estado
                  <SelectSimple value={estado} onChange={setEstado} opciones={OPCIONES_ESTADO} ariaLabel="Estado" />
                </label>
                {atributo === "nombre" && (
                  <label className="campo-etq">
                    Tipo de identificación
                    <SelectSimple
                      value={tipoId}
                      onChange={setTipoId}
                      opciones={[{ value: "", label: "Todos" }, ...(opciones.tipo_identificacion ?? []).map((t) => ({ value: t, label: t }))]}
                      ariaLabel="Tipo de identificación"
                    />
                  </label>
                )}
                <label className="campo-etq">
                  {textos.distintos}
                  <SelectSimple
                    value={cantidad}
                    onChange={setCantidad}
                    opciones={opcionesCantidad(atributo === "nombre" ? "nombres distintos" : "identificaciones")}
                    ariaLabel={textos.distintos}
                  />
                </label>
              </div>

              <div className="soc-graficos">
                <Columnas
                  titulo={`${textos.unidades} por estado`}
                  total={datos.comparables}
                  activa={estado}
                  onElegir={(v) => {
                    setEstado(v);
                    setCantidad("");
                  }}
                  datos={[
                    { clave: "CORRECTO", etiqueta: "CORRECTO", n: datos.consistentes, color: "verde" },
                    { clave: "INCONSISTENTE", etiqueta: "INCONSISTENTE", n: datos.con_variantes, color: "rojo" },
                  ]}
                />
                <Columnas
                  titulo={textos.desglose}
                  total={datos.con_variantes}
                  activa={cantidad}
                  onElegir={(v) => {
                    setCantidad(v);
                    setEstado("");
                  }}
                  datos={[
                    { clave: "2", etiqueta: "2 variantes", n: datos.distribucion["2"], color: "rojo" },
                    { clave: "3", etiqueta: "3 variantes", n: datos.distribucion["3"], color: "rojo" },
                    { clave: "4", etiqueta: "4 o más", n: datos.distribucion["4+"], color: "rojo" },
                  ]}
                />
              </div>

              <p className="cuenta">
                {miles(lista.total)} {textos.unidad[lista.total === 1 ? 0 : 1]}
              </p>
              <TablaVariantes estado={lista} maxVar={datos.max_variantes} cajaRef={cajaRef} alDesplazar={alDesplazar} atributo={atributo} />
            </section>
          </>
        )}
      </Estilos>
    </RaizDoc>
  );
};
