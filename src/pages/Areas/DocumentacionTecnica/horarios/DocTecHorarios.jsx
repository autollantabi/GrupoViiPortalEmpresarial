import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  DocTec_GuardarHorarios,
  DocTec_ObtenerHorarios,
  DocTec_RestaurarHorarios,
  DocTec_ValidarHorarios,
} from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";
import { estilosDatos } from "../comunes/estilosDatos";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { toast } from "react-toastify";

/* =====================================================================================
   Horario de automatizaciones para reportes: calendario DWH → DF → MS, editable, con línea de tiempo.
   El calendario completo se edita como borrador en pantalla y se guarda de una vez
   (PUT con la revisión leída); las alertas se calculan en el backend (POST /validar).
   ===================================================================================== */

const CAPAS = [
  { id: "dwh", nombre: "Carga de datos (DWH)", corto: "DWH", padre: null },
  { id: "df", nombre: "Extracción de datos (DF)", corto: "DF", padre: "dwh" },
  { id: "ms", nombre: "Actualización del reporte (MS)", corto: "MS", padre: "df" },
];
const DURACION_INICIAL = { dwh: 20, df: 5, ms: 15 };
const ETIQUETA_REGLA = {
  ms_espera: "El MS no espera lo suficiente",
  df_lee_carga: "El DF empieza antes de que termine la carga",
  fuera_jornada: "Termina después del horario de oficina",
  simultaneo: "Dos procesos a la misma hora",
  sin_dependencia: "Falta indicar de qué depende",
};

const aMin = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));
const aHora = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const copia = (x) => JSON.parse(JSON.stringify(x));
/** Solo lo que se guarda: sin la revisión ni lo que calcula el servidor. */
const contenido = (d) => ({ oficina: d.oficina, espera_ms_min: d.espera_ms_min, procesos: d.procesos });

const Estilos = styled.div`
  --c-dwh: #2f6db5;
  --c-df: #2e8b57;
  --c-ms: #e08a1e;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 48px;
  ${estilosDatos}

  .sub { margin: 0 0 14px; color: var(--suave); max-width: 80ch; }
  .barra { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; margin: 12px 0; }
  .barra label { display: flex; align-items: center; gap: 6px; color: var(--suave); font-size: 0.88rem; }
  input[type="time"], input[type="number"], input[type="text"], select {
    font: inherit; color: var(--texto); background: var(--panel);
    border: 1px solid var(--borde); border-radius: 6px; padding: 4px 8px;
  }
  input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid var(--acento); outline-offset: 1px; }
  input[type="number"] { width: 70px; }
  .pestanas { display: flex; gap: 4px; border-bottom: 1px solid var(--borde); margin: 16px 0 14px; }
  .pestana { font: 600 0.95rem var(--fuente); background: none; border: 0; border-bottom: 3px solid transparent; padding: 8px 14px; color: var(--suave); cursor: pointer; }
  .pestana.activa { color: var(--acento-texto); border-bottom-color: var(--marca); }

  /* Resumen de alertas */
  .resumen { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
  .chip.ok { background: var(--ok-fondo); color: var(--ok); }
  .chip.error { background: var(--error-fondo); color: var(--error); }
  .chip.aviso { background: var(--aviso-fondo); color: var(--aviso); }
  .alertas { margin: 0 0 14px; padding: 0; list-style: none; display: grid; gap: 4px; }
  .alertas li { display: flex; gap: 8px; align-items: baseline; padding: 6px 10px; border-radius: 6px; font-size: 0.9rem; cursor: pointer; }
  .alertas li.error { background: var(--error-fondo); color: var(--error); }
  .alertas li.aviso { background: var(--aviso-fondo); color: var(--aviso); }
  .alertas b { white-space: nowrap; }

  /* Línea de tiempo */
  .tl { background: var(--panel); border: 1px solid var(--borde); border-radius: 12px; overflow-x: auto; }
  .tl-in { min-width: 860px; }
  .tl-fila { display: grid; grid-template-columns: 240px minmax(0, 1fr); align-items: stretch; border-top: 1px solid var(--borde); }
  .tl-fila.eje { border-top: 0; background: var(--sub-fondo); position: sticky; top: 0; z-index: 2; }
  .tl-fila.grupo { background: var(--sub-fondo); }
  .tl-fila.grupo .tl-nombre { cursor: default; }
  .tl-fila.grupo .tl-nombre span { font-weight: 800; letter-spacing: 0.03em; font-size: 0.9rem; white-space: normal; }
  .tl-nombre { padding: 7px 12px; display: flex; flex-direction: column; justify-content: center; min-width: 0; cursor: pointer; border: 0; background: none; text-align: left; font: inherit; color: var(--texto); }
  .tl-nombre small { color: var(--suave); }
  .tl-nombre span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; font-size: 0.9rem; }
  .tl-pista { position: relative; min-height: 38px; }
  .tl-fuera { position: absolute; top: 0; bottom: 0; background: var(--error-fondo); opacity: 0.45; pointer-events: none; }
  .tl-linea { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--borde); pointer-events: none; }
  .tl-eje-h { position: absolute; top: 6px; transform: translateX(-50%); font-size: 0.72rem; color: var(--suave); }
  .tl-barra {
    position: absolute; top: 7px; height: 24px; min-width: 6px; border-radius: 5px; border: 2px solid transparent;
    color: #fff; font: 700 0.68rem var(--fuente); display: flex; align-items: center; padding: 0 4px; cursor: pointer; overflow: visible; white-space: nowrap;
  }
  .tl-barra.dwh { background: var(--c-dwh); }
  .tl-barra.df { background: var(--c-df); }
  .tl-barra.ms { background: var(--c-ms); }
  .tl-barra.error { border-color: var(--error); box-shadow: 0 0 0 2px var(--error-fondo); }
  .tl-barra.aviso { border-color: var(--aviso); box-shadow: 0 0 0 2px var(--aviso-fondo); }
  .tl-hora { position: absolute; left: 100%; margin-left: 4px; color: var(--texto); font-weight: 600; font-size: 0.7rem; pointer-events: none; }
  .tl-fila.tenue .tl-barra { opacity: 0.25; }
  .tl-fila.sel { background: var(--acento-fondo); }
  .leyenda { display: flex; flex-wrap: wrap; gap: 14px; margin: 10px 2px 0; color: var(--suave); font-size: 0.84rem; }
  .leyenda i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }

  /* Procesos y horas */
  .capa-tit { display: flex; align-items: center; justify-content: space-between; margin: 24px 0 10px; border-bottom: 2px solid var(--marca); padding-bottom: 6px; }
  .capa-tit h2 { margin: 0; font-size: 1.1rem; color: var(--titulo); }
  .proceso { background: var(--panel); border: 1px solid var(--borde); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; display: grid; gap: 12px; }
  .proceso.sel { border-color: var(--marca); box-shadow: 0 0 0 2px var(--acento-fondo); }
  .proceso-cab { display: flex; align-items: center; gap: 10px; }
  .proceso .nombre { flex: 1; min-width: 0; font-weight: 800; font-size: 1.02rem; border: 1px solid transparent; background: transparent; padding: 4px 8px; margin-left: -8px; }
  .proceso .nombre:hover { border-color: var(--borde); }
  .proceso .nombre:focus { background: var(--panel); border-color: var(--acento); }
  .fila-campo { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 10px; align-items: start; }
  .fila-campo > .etq { color: var(--suave); font-size: 0.86rem; padding-top: 6px; }
  .horas { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .hora-chip { display: inline-flex; align-items: center; background: var(--acento-fondo); color: var(--acento-texto); border-radius: 999px; font-weight: 700; font-size: 0.9rem; }
  .hora-chip .valor { border: 0; background: none; font: inherit; color: inherit; cursor: text; padding: 4px 4px 4px 12px; border-radius: 999px 0 0 999px; }
  .hora-chip .valor:hover { text-decoration: underline; }
  .hora-chip .quitar { border: 0; background: none; cursor: pointer; color: inherit; font-size: 1.05rem; line-height: 1; padding: 4px 10px 4px 4px; border-radius: 0 999px 999px 0; }
  .hora-chip .quitar:hover { color: var(--error); }
  .hora-chip input[type="time"] { padding: 1px 4px; }
  .pill { font: 600 0.88rem var(--fuente); cursor: pointer; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--borde); background: var(--panel); color: var(--texto); }
  .pill:hover { border-color: var(--acento); }
  .pill.on { background: var(--acento-fondo); border-color: var(--acento); color: var(--acento-texto); }
  .pill.on::before { content: "✓ "; }
  .pill.mas { border-style: dashed; color: var(--acento-texto); }
  .repetir { display: inline-flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; background: var(--sub-fondo); border-radius: 10px; padding: 6px 10px; font-size: 0.88rem; }
  .repetir input[type="number"] { width: 56px; }
  .enlace { background: none; border: 0; padding: 2px 4px; cursor: pointer; font: 600 0.88rem var(--fuente); color: var(--acento-texto); text-decoration: underline; }
  .enlace.peligro { color: var(--error); }
  .mas-opc summary { cursor: pointer; color: var(--suave); font-size: 0.86rem; list-style: none; }
  .mas-opc summary::before { content: "▸ "; }
  .mas-opc[open] summary::before { content: "▾ "; }
  .mas-opc .cuerpo { display: grid; gap: 10px; margin-top: 10px; }
  .meta { font-size: 0.85rem; color: var(--suave); }
  .vacio { color: var(--suave); padding: 8px 2px; }
  .pie { position: sticky; bottom: -48px; margin: 18px -28px -48px; padding: 12px 28px; background: var(--bg); border-top: 1px solid var(--borde); display: flex; flex-wrap: wrap; gap: 10px 14px; align-items: center; z-index: 3; }
  .pie .espacio { flex: 1; }
`;

/** Una hora del proceso: al pulsarla se corrige ahi mismo; la x la quita. */
function HoraChip({ hora, onCambiar, onQuitar }) {
  const [editando, setEditando] = useState(false);
  if (editando) {
    return (
      <span className="hora-chip">
        <input
          type="time"
          autoFocus
          defaultValue={hora}
          aria-label={`Corregir la hora ${hora}`}
          onBlur={(e) => {
            if (e.target.value && e.target.value !== hora) onCambiar(e.target.value);
            setEditando(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditando(false);
          }}
        />
      </span>
    );
  }
  return (
    <span className="hora-chip">
      <button type="button" className="valor" title="Pulsa para cambiar la hora" onClick={() => setEditando(true)}>{hora}</button>
      <button type="button" className="quitar" aria-label={`Quitar la hora ${hora}`} onClick={onQuitar}>×</button>
    </span>
  );
}

/** Agregar horas: una sola, o varias de golpe (cada 2 horas, de 07:00 a 17:00). */
function AgregarHoras({ onAgregar }) {
  const [v, setV] = useState("");
  const [rep, setRep] = useState(false);
  const [cada, setCada] = useState(2);
  const [desde, setDesde] = useState("07:00");
  const [hasta, setHasta] = useState("17:00");
  const uno = () => {
    if (!v) return;
    onAgregar([v]);
    setV("");
  };
  const varias = () => {
    const lista = [];
    for (let m = aMin(desde); m <= aMin(hasta) && cada >= 1 && lista.length < 48; m += cada * 60) lista.push(aHora(m));
    onAgregar(lista);
    setRep(false);
  };
  return (
    <>
      <input type="time" value={v} onChange={(e) => setV(e.target.value)} aria-label="Hora a agregar" onKeyDown={(e) => e.key === "Enter" && uno()} />
      <button type="button" className="pill mas" onClick={uno} disabled={!v}>+ Agregar</button>
      <button type="button" className="enlace" onClick={() => setRep(!rep)}>Repetir varias veces…</button>
      {rep && (
        <span className="repetir">
          Cada <input type="number" min={1} max={24} value={cada} onChange={(e) => setCada(Number(e.target.value))} aria-label="Cada cuántas horas" /> horas, de
          <input type="time" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" /> a
          <input type="time" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
          <button type="button" className="pill on" onClick={varias} disabled={!desde || !hasta}>Agregar</button>
        </span>
      )}
    </>
  );
}

export function DocTecHorarios() {
  const [base, setBase] = useState(null); // lo último guardado en el servidor
  const [borrador, setBorrador] = useState(null); // lo que se está editando
  const [alertas, setAlertas] = useState([]);
  const [errorEstructura, setErrorEstructura] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState("tiempo");
  const [rango, setRango] = useState("jornada");
  const [seleccion, setSeleccion] = useState(null);
  const [nuevoId, setNuevoId] = useState(null); // proceso recien creado: su nombre toma el foco
  const peticion = useRef(0);

  const cargar = useCallback(() => {
    setCargando(true);
    setError("");
    return DocTec_ObtenerHorarios()
      .then((d) => {
        setBase(d);
        setBorrador(copia(contenido(d)));
        setAlertas(d.alertas);
        setErrorEstructura("");
      })
      .catch((e) => setError(e.response?.data?.message ?? "No se pudieron cargar los horarios. Revisa que la API esté disponible."))
      .finally(() => setCargando(false));
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const sucio = useMemo(() => !!base && !!borrador && JSON.stringify(contenido(base)) !== JSON.stringify(borrador), [base, borrador]);

  // Alertas del borrador mientras se edita (el backend aplica las reglas; aquí no se duplican)
  useEffect(() => {
    if (!borrador || !base) return undefined;
    if (!sucio) {
      setAlertas(base.alertas);
      setErrorEstructura("");
      return undefined;
    }
    const mia = ++peticion.current;
    const t = setTimeout(() => {
      DocTec_ValidarHorarios(borrador)
        .then((r) => {
          if (mia !== peticion.current) return;
          setAlertas(r.alertas);
          setErrorEstructura("");
        })
        .catch((e) => mia === peticion.current && setErrorEstructura(e.response?.data?.message ?? "No se pudo revisar el borrador."));
    }, 400);
    return () => clearTimeout(t);
  }, [borrador, base, sucio]);

  const cambiar = (fn) =>
    setBorrador((b) => {
      const n = copia(b);
      fn(n);
      return n;
    });
  const cambiarProceso = (id, fn) => cambiar((n) => fn(n.procesos.find((p) => p.id === id)));

  const guardar = async () => {
    setGuardando(true);
    try {
      const d = await DocTec_GuardarHorarios({ ...borrador, revision: base.revision });
      setBase(d);
      setBorrador(copia(contenido(d)));
      setAlertas(d.alertas);
      toast.success("Horarios guardados.");
    } catch (e) {
      toast.error(e.response?.data?.message ?? "No se pudieron guardar los horarios.");
    } finally {
      setGuardando(false);
    }
  };
  const descartar = () => {
    setBorrador(copia(contenido(base)));
    setSeleccion(null);
  };
  const restaurar = async () => {
    if (!window.confirm("Se reemplazará el calendario guardado por la propuesta inicial. ¿Continuar?")) return;
    setGuardando(true);
    try {
      const d = await DocTec_RestaurarHorarios();
      setBase(d);
      setBorrador(copia(contenido(d)));
      setAlertas(d.alertas);
      toast.success("Se restauró la propuesta inicial.");
    } catch (e) {
      toast.error(e.response?.data?.message ?? "No se pudo restaurar.");
    } finally {
      setGuardando(false);
    }
  };

  const agregarProceso = (capa) => {
    const id = `nuevo-${Date.now().toString(36)}`;
    cambiar((n) => n.procesos.push({ id, capa, nombre: "Nuevo proceso", horas: [], duracion_min: DURACION_INICIAL[capa], depende_de: [] }));
    setSeleccion(id);
    setNuevoId(id);
    setVista("procesos");
  };
  const quitarProceso = (p) => {
    if (!window.confirm(`¿Quitar «${p.nombre}» del calendario?`)) return;
    cambiar((n) => {
      n.procesos = n.procesos.filter((x) => x.id !== p.id);
      n.procesos.forEach((x) => (x.depende_de = x.depende_de.filter((d) => d !== p.id)));
    });
  };

  const porId = useMemo(() => new Map((borrador?.procesos ?? []).map((p) => [p.id, p])), [borrador]);
  const alertasDe = useMemo(() => {
    const m = new Map();
    alertas.forEach((a) => m.set(a.proceso_id, [...(m.get(a.proceso_id) ?? []), a]));
    return m;
  }, [alertas]);
  // Procesos relacionados con el seleccionado (de los que depende y los que dependen de él)
  const relacionados = useMemo(() => {
    if (!seleccion || !porId.has(seleccion)) return null;
    const s = new Set([seleccion]);
    porId.get(seleccion).depende_de.forEach((d) => s.add(d));
    (borrador?.procesos ?? []).forEach((p) => p.depende_de.includes(seleccion) && s.add(p.id));
    return s;
  }, [seleccion, porId, borrador]);

  if (cargando) {
    return (
      <RaizDoc>
        <LoaderUI />
      </RaizDoc>
    );
  }
  if (error || !borrador) {
    return (
      <RaizDoc>
        <Estilos>
          <div className="titulo-fila"><h1>Horario de automatizaciones para reportes</h1></div>
          <p className="aviso" role="alert">{error || "Sin datos."}</p>
          <ButtonUI text="Reintentar" variant="outlined" onClick={cargar} />
        </Estilos>
      </RaizDoc>
    );
  }

  const errores = alertas.filter((a) => a.nivel === "error").length;
  const avisos = alertas.length - errores;

  /* ---------------- Línea de tiempo ---------------- */
  // La ventana abarca la jornada con un margen y SIEMPRE todas las ejecuciones (p. ej. las nocturnas de la 01:00)
  const todas = borrador.procesos.flatMap((p) => p.horas.map((h) => [aMin(h), aMin(h) + p.duracion_min]));
  const minimo = Math.min(aMin(borrador.oficina.inicio) - 3 * 60, ...todas.map((t) => t[0]));
  const maximo = Math.max(aMin(borrador.oficina.fin) + 60, ...todas.map((t) => t[1]));
  const ini = rango === "dia" ? 0 : Math.max(0, Math.floor(minimo / 60) * 60);
  const fin = rango === "dia" ? 24 * 60 : Math.min(24 * 60, Math.ceil(maximo / 60) * 60);
  const pct = (m) => ((m - ini) / (fin - ini)) * 100;
  const paso = rango === "dia" ? 120 : 60;
  const marcas = [];
  for (let m = ini; m <= fin; m += paso) marcas.push(m);
  const jIni = aMin(borrador.oficina.inicio);
  const jFin = aMin(borrador.oficina.fin);
  const fuera = (
    <>
      {jIni > ini && <div className="tl-fuera" style={{ left: 0, width: `${pct(jIni)}%` }} />}
      {jFin < fin && <div className="tl-fuera" style={{ left: `${pct(jFin)}%`, right: 0 }} />}
      {marcas.map((m) => <div key={m} className="tl-linea" style={{ left: `${pct(m)}%` }} />)}
    </>
  );

  const lineaTiempo = (
    <>
      <div className="tl" role="img" aria-label="Línea de tiempo de los procesos del día">
        <div className="tl-in">
          <div className="tl-fila eje">
            <div className="tl-nombre"><small>Proceso</small></div>
            <div className="tl-pista" style={{ minHeight: 28 }}>
              {fuera}
              {marcas.map((m) => <span key={m} className="tl-eje-h" style={{ left: `${pct(m)}%` }}>{aHora(m % (24 * 60))}</span>)}
            </div>
          </div>
          {CAPAS.map((c) => (
            <React.Fragment key={c.id}>
              <div className="tl-fila grupo">
                <div className="tl-nombre"><span style={{ color: `var(--c-${c.id})` }}>{c.nombre}</span></div>
                <div className="tl-pista" style={{ minHeight: 28 }}>{fuera}</div>
              </div>
              {borrador.procesos.filter((p) => p.capa === c.id).map((p) => {
                const af = alertasDe.get(p.id) ?? [];
                return (
                  <div key={p.id} className={`tl-fila${seleccion === p.id ? " sel" : ""}${relacionados && !relacionados.has(p.id) ? " tenue" : ""}`}>
                    <button type="button" className="tl-nombre" onClick={() => setSeleccion(seleccion === p.id ? null : p.id)} title="Ver con qué procesos se relaciona">
                      <span>{p.nombre}</span>
                      <small>{p.horas.length} {p.horas.length === 1 ? "vez" : "veces"} al día{p.nocturno ? " · de madrugada" : ""}</small>
                    </button>
                    <div className="tl-pista">
                      {fuera}
                      {p.horas.filter((h) => aMin(h) >= ini && aMin(h) < fin).map((h) => {
                        const a = af.filter((x) => x.hora === h || !x.hora);
                        const nivel = a.some((x) => x.nivel === "error") ? "error" : a.length ? "aviso" : "";
                        const w = Math.max(0.5, (p.duracion_min / (fin - ini)) * 100);
                        return (
                          <div
                            key={h}
                            className={`tl-barra ${p.capa} ${nivel}`}
                            style={{ left: `${pct(aMin(h))}%`, width: `${w}%` }}
                            title={`${p.nombre} · ${h}–${aHora(aMin(h) + p.duracion_min)}${a.length ? "\n" + a.map((x) => x.mensaje).join("\n") : ""}`}
                            onClick={() => { setSeleccion(p.id); }}
                          >
                            <span className="tl-hora">{h}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="leyenda">
        <span><i style={{ background: "var(--c-dwh)" }} />Carga de datos</span>
        <span><i style={{ background: "var(--c-df)" }} />Extracción</span>
        <span><i style={{ background: "var(--c-ms)" }} />Actualización del reporte</span>
        <span><i style={{ background: "var(--error-fondo)", border: "1px solid var(--borde)" }} />Fuera del horario de oficina ({borrador.oficina.inicio}–{borrador.oficina.fin})</span>
        <span>Un borde rojo o ámbar indica que ese proceso necesita revisión. Pulsa un proceso para ver con cuáles se relaciona.</span>
      </div>
    </>
  );

  /* ---------------- Procesos y horas ---------------- */
  const agregarHoras = (id, lista) => cambiarProceso(id, (x) => (x.horas = [...new Set([...x.horas, ...lista])].sort()));
  const tabla = CAPAS.map((c) => {
    const lista = borrador.procesos.filter((p) => p.capa === c.id);
    const padres = c.padre ? borrador.procesos.filter((p) => p.capa === c.padre) : [];
    return (
      <section key={c.id}>
        <div className="capa-tit">
          <h2 style={{ color: `var(--c-${c.id})` }}>{c.nombre}</h2>
          <ButtonUI text="+ Agregar proceso" variant="outlined" onClick={() => agregarProceso(c.id)} />
        </div>
        {!lista.length && <p className="vacio">Todavía no hay procesos en este grupo.</p>}
        {lista.map((p) => (
          <div key={p.id} className={`proceso${seleccion === p.id ? " sel" : ""}`} onFocusCapture={() => setSeleccion(p.id)}>
            <div className="proceso-cab">
              <input
                type="text"
                className="nombre"
                value={p.nombre}
                maxLength={60}
                autoFocus={p.id === nuevoId}
                onFocus={(e) => p.id === nuevoId && e.target.select()}
                aria-label="Nombre del proceso"
                title="Pulsa para cambiar el nombre"
                onChange={(e) => cambiarProceso(p.id, (x) => (x.nombre = e.target.value))}
              />
              <button type="button" className="enlace peligro" onClick={() => quitarProceso(p)}>Quitar proceso</button>
            </div>
            <div className="fila-campo">
              <span className="etq">Se ejecuta a las</span>
              <div className="horas">
                {[...p.horas].sort().map((h) => (
                  <HoraChip
                    key={h}
                    hora={h}
                    onCambiar={(n) => cambiarProceso(p.id, (x) => (x.horas = [...new Set(x.horas.map((y) => (y === h ? n : y)))].sort()))}
                    onQuitar={() => cambiarProceso(p.id, (x) => (x.horas = x.horas.filter((y) => y !== h)))}
                  />
                ))}
                {!p.horas.length && <span className="meta">Aún sin horas.</span>}
                <AgregarHoras onAgregar={(l) => agregarHoras(p.id, l)} />
              </div>
            </div>
            {c.padre && (
              <div className="fila-campo">
                <span className="etq">{c.id === "df" ? "Toma los datos de" : "Se actualiza después de"}</span>
                <div className="horas">
                  {padres.length ? padres.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={p.depende_de.includes(d.id)}
                      className={`pill${p.depende_de.includes(d.id) ? " on" : ""}`}
                      onClick={() => cambiarProceso(p.id, (x) => (x.depende_de = x.depende_de.includes(d.id) ? x.depende_de.filter((y) => y !== d.id) : [...x.depende_de, d.id]))}
                    >
                      {d.nombre}
                    </button>
                  )) : <span className="meta">Primero agrega el proceso del que depende en el grupo anterior.</span>}
                </div>
              </div>
            )}
            <details className="mas-opc">
              <summary>Más opciones (nota, duración, madrugada, paralelo)</summary>
              <div className="cuerpo">
                <input type="text" value={p.nota ?? ""} maxLength={300} placeholder="Nota (opcional): por ejemplo, por qué corre a esa hora" aria-label="Nota" onChange={(e) => cambiarProceso(p.id, (x) => (x.nota = e.target.value))} />
                <div className="horas">
                  <label className="meta">Tarda aprox. (minutos){" "}
                    <input type="number" min={1} max={240} value={p.duracion_min} onChange={(e) => cambiarProceso(p.id, (x) => (x.duracion_min = Number(e.target.value)))} />
                  </label>
                  <label className="meta" style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <input type="checkbox" checked={!!p.nocturno} onChange={(e) => cambiarProceso(p.id, (x) => (x.nocturno = e.target.checked || undefined))} />
                    Corre de madrugada (no avisar por el horario de oficina)
                  </label>
                  <label className="meta" style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <input type="checkbox" checked={!!p.paralelo} onChange={(e) => cambiarProceso(p.id, (x) => (x.paralelo = e.target.checked || undefined))} />
                    Puede correr en paralelo con otros (no avisar por coincidir en la misma hora)
                  </label>
                </div>
              </div>
            </details>
            {(alertasDe.get(p.id) ?? []).length > 0 && (
              <ul className="alertas" style={{ margin: 0 }}>
                {alertasDe.get(p.id).map((a, i) => <li key={i} className={a.nivel}><b>{a.nivel === "error" ? "Corregir" : "Revisar"}</b>{a.mensaje}</li>)}
              </ul>
            )}
          </div>
        ))}
      </section>
    );
  });

  return (
    <RaizDoc>
      <Estilos>
        <div className="titulo-fila"><h1>Horario de automatizaciones para reportes</h1></div>
        <p className="sub">
          Así se ven los procesos que corren durante el día.
        </p>
        <div className="barra">
          <label>Horario de oficina: de
            <input type="time" value={borrador.oficina.inicio} onChange={(e) => cambiar((n) => (n.oficina.inicio = e.target.value))} aria-label="Inicio de la jornada" />
            a
            <input type="time" value={borrador.oficina.fin} onChange={(e) => cambiar((n) => (n.oficina.fin = e.target.value))} aria-label="Fin de la jornada" />
          </label>
          <label title="Tiempo que debe pasar entre que termina el DF y empieza su MS">Espera entre el DF y su MS (minutos)
            <input type="number" min={0} max={240} value={borrador.espera_ms_min} onChange={(e) => cambiar((n) => (n.espera_ms_min = Number(e.target.value)))} />
          </label>
          {base.actualizado && (
            <span className="meta">Último cambio guardado por {base.actualizado.por} el {new Date(base.actualizado.fecha).toLocaleString("es-EC")}</span>
          )}
          {!base.personalizado && <span className="meta">Estás viendo la propuesta inicial; todavía nadie ha guardado cambios.</span>}
        </div>

        <div className="resumen" aria-live="polite">
          {errorEstructura ? (
            <span className="chip error">{errorEstructura}</span>
          ) : alertas.length === 0 ? (
            <span className="chip ok">Todo en orden</span>
          ) : (
            <>
              {errores > 0 && <span className="chip error">{errores} {errores === 1 ? "problema por corregir" : "problemas por corregir"}</span>}
              {avisos > 0 && <span className="chip aviso">{avisos} {avisos === 1 ? "cosa por revisar" : "cosas por revisar"}</span>}
            </>
          )}
        </div>
        {alertas.length > 0 && !errorEstructura && (
          <ul className="alertas">
            {alertas.map((a, i) => (
              <li key={i} className={a.nivel} onClick={() => setSeleccion(a.proceso_id)} title="Ver este proceso">
                <b>{ETIQUETA_REGLA[a.regla] ?? a.regla}</b>{a.mensaje}
              </li>
            ))}
          </ul>
        )}

        <div className="pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={vista === "tiempo"} className={`pestana${vista === "tiempo" ? " activa" : ""}`} onClick={() => { setVista("tiempo"); setSeleccion(null); }}>Línea de tiempo</button>
          <button type="button" role="tab" aria-selected={vista === "procesos"} className={`pestana${vista === "procesos" ? " activa" : ""}`} onClick={() => setVista("procesos")}>Procesos y horas</button>
          {vista === "tiempo" && (
            <span style={{ marginLeft: "auto", alignSelf: "center" }}>
              <label className="meta" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="checkbox" checked={rango === "dia"} onChange={(e) => setRango(e.target.checked ? "dia" : "jornada")} />
                Ver el día completo (24 horas)
              </label>
            </span>
          )}
        </div>

        {vista === "tiempo" ? lineaTiempo : tabla}

        <div className="pie">
          <ButtonUI text={guardando ? "Guardando…" : "Guardar cambios"} onClick={guardar} disabled={!sucio || guardando || !!errorEstructura} />
          <ButtonUI text="Descartar cambios" variant="outlined" onClick={descartar} disabled={!sucio || guardando} />
          {sucio && <span className="meta">Tienes cambios sin guardar.</span>}
          <span className="espacio" />
          <button type="button" className="enlace" onClick={restaurar} disabled={guardando}>Restaurar propuesta inicial</button>
        </div>
      </Estilos>
    </RaizDoc>
  );
}
