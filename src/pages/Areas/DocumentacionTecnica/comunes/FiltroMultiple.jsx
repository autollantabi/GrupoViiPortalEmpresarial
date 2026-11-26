import React, { useEffect, useRef, useState } from "react";

/**
 * Filtro de opciones múltiples (equivale a calidad/_multi.html del proyecto Django).
 * Los estilos están en estilosDatos.js (clases .multi*).
 *
 *   etiqueta   texto sobre el campo
 *   opciones   string[]
 *   seleccion  string[]
 *   onChange   (nuevaSeleccion: string[]) => void
 */
export function FiltroMultiple({ etiqueta, opciones, seleccion, onChange, pie = "" }) {
  const [abierto, setAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const raiz = useRef(null);
  const buscable = opciones.length > 8;

  // Se cierra al hacer clic fuera
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (raiz.current && !raiz.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, [abierto]);

  const visibles = opciones.filter((o) => !buscar.trim() || o.toLowerCase().includes(buscar.trim().toLowerCase()));
  const alternar = (o) => onChange(seleccion.includes(o) ? seleccion.filter((x) => x !== o) : [...seleccion, o]);
  const quitar = (e, o) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(seleccion.filter((x) => x !== o));
  };

  return (
    <div className="multi" ref={raiz}>
      <span className="campo-etq">{etiqueta}</span>
      <details
        className="multi-caja"
        open={abierto}
        onToggle={(e) => setAbierto(e.currentTarget.open)}
      >
        <summary aria-label={etiqueta}>
          {seleccion.length ? (
            <>
              {seleccion.slice(0, 2).map((v) => (
                <span className="sel" key={v}>
                  {v}
                  <button type="button" className="sel-x" aria-label={`Quitar ${v}`} onClick={(e) => quitar(e, v)}>
                    &times;
                  </button>
                </span>
              ))}
              {seleccion.length > 2 && <span className="sel mas">+{seleccion.length - 2}</span>}
            </>
          ) : (
            <span className="vacio">Elegir opciones</span>
          )}
        </summary>
        <div className="multi-panel">
          <div className="multi-cab">
            <button type="button" onClick={() => onChange([...new Set([...seleccion, ...visibles])])}>
              Seleccionar todo
            </button>
            <button type="button" disabled={!seleccion.length} onClick={() => onChange([])}>
              Quitar selección
            </button>
          </div>
          {buscable && (
            <input
              type="search"
              className="multi-buscar"
              placeholder="Buscar en la lista"
              aria-label={`Buscar en ${etiqueta}`}
              autoComplete="off"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
          )}
          <ul>
            {visibles.map((o) => (
              <li key={o}>
                <label>
                  <input type="checkbox" checked={seleccion.includes(o)} onChange={() => alternar(o)} />
                  <span>{o}</span>
                </label>
              </li>
            ))}
            {!visibles.length && <li className="multi-vacio">No hay opciones</li>}
          </ul>
          {pie && <p className="multi-cuenta">{pie}</p>}
        </div>
      </details>
    </div>
  );
}
