import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { DocTec_ObtenerCaracterizacion } from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";

/* =====================================================================================
   Caracterización: de dónde viene cada dato mínimo del producto
   (su campo en el DWH y su campo en SAP), agrupado por tema.
   ===================================================================================== */

const Estilos = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 48px;

  h1 {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 800;
    color: var(--titulo);
  }
  .sub {
    margin: 0;
    color: var(--suave);
  }
  /* Panel lateral de grupos */
  .car-layout {
    display: grid;
    grid-template-columns: minmax(200px, 260px) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .car-nav {
    position: sticky;
    top: 0;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    overflow: hidden;
  }
  .car-nav-tit {
    padding: 12px 18px 10px;
    border-bottom: 1px solid var(--borde);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--suave);
  }
  .car-grupo-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    text-align: left;
    font: inherit;
    color: var(--texto);
    background: none;
    border: 0;
    border-left: 3px solid transparent;
    padding: 12px 16px 12px 15px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .car-grupo-btn:hover {
    background: var(--acento-fondo);
  }
  .car-grupo-btn:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
  }
  .car-grupo-btn.activo {
    background: var(--acento-fondo);
    border-left-color: var(--marca);
  }
  .car-grupo-nombre {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 0.93rem;
    line-height: 1.25;
  }

  /* Sección del grupo */
  .car-seccion h2 {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin: 0 0 12px;
    font-size: 1.25rem;
    color: var(--titulo);
    border-bottom: 2px solid var(--marca);
    padding-bottom: 8px;
  }
  .car-cuenta {
    font: 400 0.85rem var(--fuente);
    color: var(--suave);
  }

  /* Lista de atributos */
  .car-lista {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 12px;
    overflow: hidden;
  }
  .car-attr + .car-attr {
    border-top: 1px solid var(--borde);
  }
  .car-attr summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) auto 16px;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    list-style: none;
  }
  .car-attr summary::-webkit-details-marker {
    display: none;
  }
  .car-attr summary::after {
    content: "";
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--suave);
    border-bottom: 2px solid var(--suave);
    transform: rotate(45deg);
    transition: transform 0.15s;
    justify-self: end;
  }
  .car-attr[open] summary::after {
    transform: rotate(-135deg);
  }
  .car-attr summary:hover {
    background: var(--acento-fondo);
  }
  .car-attr summary:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: -2px;
  }
  .car-attr[open] summary {
    background: var(--bg);
  }
  .car-attr-nombre {
    font-weight: 600;
  }
  .car-attr-desc {
    color: var(--suave);
    font-size: 0.9rem;
  }
  .car-etq {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--suave);
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 2px 8px;
    white-space: nowrap;
  }
  .car-etq-verificar {
    color: var(--aviso);
    background: var(--aviso-fondo);
    border-color: transparent;
  }

  /* Origen: campo DWH ← campo SAP */
  .car-origen {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 32px minmax(0, 1fr);
    align-items: center;
    padding: 6px 16px 18px;
    background: var(--bg);
  }
  .car-caja {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 10px;
    padding: 10px 14px;
  }
  .car-caja-vacia {
    border-style: dashed;
  }
  .car-ancho {
    grid-column: 1 / -1;
  }
  .car-etiqueta {
    font-size: 0.78rem;
    color: var(--suave);
  }
  .car-valor {
    margin-top: 2px;
    font: 600 0.95rem var(--fuente-mono);
    word-break: break-word;
  }
  .car-sin {
    font: 600 0.95rem var(--fuente);
    color: var(--texto);
  }
  .car-detalle {
    margin-top: 2px;
    font-size: 0.82rem;
    color: var(--suave);
  }
  .car-flecha {
    text-align: center;
    color: var(--suave);
    font-size: 1.2rem;
  }

  /* Selector de línea de negocio */
  .car-lineas {
    margin: 18px 0 6px;
  }
  .car-lineas-tit {
    display: block;
    margin: 0 0 8px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--suave);
  }
  .car-lineas-botones {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .car-linea {
    padding: 9px 18px;
    font: 600 0.92rem var(--fuente);
    color: var(--texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .car-linea:hover {
    border-color: var(--acento);
  }
  .car-linea.on {
    background: var(--acento-boton);
    border-color: var(--acento-boton);
    color: var(--sobre-acento);
  }
  .car-linea:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 2px;
  }
  .car-pronto {
    margin: 22px 0 0;
    padding: 28px 24px;
    text-align: center;
    background: var(--panel);
    border: 1px dashed var(--borde);
    border-radius: 12px;
    color: var(--suave);
  }
  .car-pronto b {
    display: block;
    margin-bottom: 4px;
    font-size: 1.05rem;
    color: var(--titulo);
  }  .car-solo {
    display: block;
    margin-top: 2px;
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--acento-texto);
  }
  @media (max-width: 900px) {
    .car-layout {
      grid-template-columns: 1fr;
    }
    .car-nav {
      position: static;
    }
  }
  @media (max-width: 640px) {
    .car-attr summary {
      grid-template-columns: minmax(0, 1fr) auto 16px;
    }
    .car-attr-desc {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .car-origen {
      grid-template-columns: 1fr;
    }
    .car-flecha {
      transform: rotate(90deg);
      padding: 4px 0;
    }
  }
`;

function Atributo({ a }) {
  return (
    <details className="car-attr">
      <summary>
        <span className="car-attr-nombre">
          {a.nombre}
          {a.solo && <small className="car-solo">Solo {a.solo}</small>}
        </span>
        <span className="car-attr-desc">{a.descripcion || a.nota || ""}</span>
        {a.estado === "verificar" && <span className="car-etq car-etq-verificar">Por verificar</span>}
        {a.estado === "pendiente" && <span className="car-etq">Pendiente</span>}
        {a.estado === "completo" && <span />}
      </summary>

      <div className="car-origen">
        {a.estado === "verificar" ? (
          <div className="car-caja car-caja-vacia car-ancho">
            <div className="car-etiqueta">Pendiente de verificar</div>
            <div className="car-detalle">{a.nota}</div>
          </div>
        ) : (
          <>
            <div className={`car-caja${a.dwh.length ? "" : " car-caja-vacia"}`}>
              <div className="car-etiqueta">Campo DWH</div>
              {a.dwh.length ? (
                <>
                  {a.dwh.map((c) => (
                    <div key={c} className="car-valor">
                      {c}
                    </div>
                  ))}
                  <div className="car-detalle">Tabla: core.dim_item</div>
                </>
              ) : (
                <div className="car-valor car-sin">Aún sin campo en el DWH</div>
              )}
            </div>
            <div className="car-flecha" aria-hidden="true">
              ←
            </div>
            <div className={`car-caja${a.sap ? "" : " car-caja-vacia"}`}>
              <div className="car-etiqueta">Campo SAP</div>
              {a.sap ? (
                <>
                  <div className="car-valor">{a.sap.campo}</div>
                  <div className="car-detalle">Tabla: {a.sap.tabla}</div>
                </>
              ) : (
                <>
                  <div className="car-valor car-sin">Fuente en SAP por identificar</div>
                  {a.nota && <div className="car-detalle">{a.nota}</div>}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </details>
  );
}

export const DocTecCaracterizacion = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [linea, setLinea] = useState(() => new URLSearchParams(window.location.search).get("linea") || "");

  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerCaracterizacion(linea)
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        // se conserva el grupo abierto si la línea elegida lo tiene; si no, el primero que quede
        const m = window.location.hash.match(/^#grupo-(\d+)$/);
        setGrupoActivo((actual) => {
          const candidato = actual ?? (m ? Number(m[1]) : null);
          return d.grupos.some((g) => g.n === candidato) ? candidato : d.grupos[0]?.n ?? null;
        });
      })
      .catch(() => vivo && setError("No se pudo cargar la caracterización. Revisa que la API esté disponible."));
    return () => {
      vivo = false;
    };
  }, [linea]);

  const elegir = (n) => {
    setGrupoActivo(n);
    window.history.replaceState(null, "", window.location.pathname + window.location.search + "#grupo-" + n);
  };

  const elegirLinea = (clave) => {
    setLinea(clave);
    const url = new URL(window.location.href);
    url.searchParams.set("linea", clave);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
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
        <div style={{ padding: 28, color: "var(--suave)" }}>Cargando caracterización…</div>
      </RaizDoc>
    );

  const grupo = datos.grupos.find((g) => g.n === grupoActivo) ?? datos.grupos[0];
  const nombreLinea = datos.lineas.find((l) => l.clave === datos.linea)?.nombre ?? datos.linea;

  return (
    <RaizDoc>
      <Estilos>
        <h1>Caracterización</h1>
        <p className="sub">De dónde viene cada dato mínimo del producto: su campo en el DWH y su campo en SAP.</p>
        <div className="car-lineas" role="group" aria-label="Línea de negocio">
          <span className="car-lineas-tit">Línea de negocio</span>
          <div className="car-lineas-botones">
            {datos.lineas.map((l) => (
              <button
                type="button"
                key={l.clave}
                className={`car-linea${datos.linea === l.clave ? " on" : ""}`}
                aria-pressed={datos.linea === l.clave}
                onClick={() => elegirLinea(l.clave)}
              >
                {l.nombre}
              </button>
            ))}
          </div>
        </div>

        {!datos.linea_activa || !grupo ? (
          <div className="car-pronto">
            <b>La caracterización de {nombreLinea} se está definiendo</b>
            Se irá actualizando a futuro.
          </div>
        ) : (
        <div className="car-layout">
          <nav className="car-nav" aria-label="Grupos de atributos">
            <div className="car-nav-tit">Grupos</div>
            {datos.grupos.map((g) => (
              <button
                type="button"
                key={g.n}
                className={`car-grupo-btn${g.n === grupo.n ? " activo" : ""}`}
                aria-pressed={g.n === grupo.n}
                onClick={() => elegir(g.n)}
              >
                <span className="car-grupo-nombre">{g.nombre}</span>
              </button>
            ))}
          </nav>

          <div>
            <section className="car-seccion" aria-labelledby={`titulo-grupo-${grupo.n}`}>
              <h2 id={`titulo-grupo-${grupo.n}`}>
                {grupo.nombre} <span className="car-cuenta">{grupo.atributos.length} atributos</span>
              </h2>
              <div className="car-lista">
                {grupo.atributos.map((a) => (
                  <Atributo key={a.nombre} a={a} />
                ))}
              </div>
            </section>
          </div>
        </div>
        )}
      </Estilos>
    </RaizDoc>
  );
};