import React, { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "context/ThemeContext";
import { MAP_TILES_URL } from "config/env";
import { buscarDireccion, ubicarPunto } from "services/geocodingService";
import { desglosarDireccion, evaluarPrecision } from "./desglosarDireccion";

// Centro inicial: Ecuador
const CENTRO_INICIAL = [-1.45, -78.4];
const ZOOM_INICIAL = 7;

const COLOR_PRECISION = { alta: "#198754", media: "#fd7e14", baja: "#dc3545" };

// divIcon: evita los problemas de rutas de imagen de los iconos por defecto de Leaflet con Vite
const iconoMarcador = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#dc3545;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);transform:rotate(-45deg)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

export const MapaConsulta = () => {
  const { theme } = useTheme();
  const c = theme?.colors || {};
  const contenedorRef = useRef(null);
  const mapaRef = useRef(null);
  const marcadorRef = useRef(null);
  const abortRef = useRef(null);

  const [texto, setTexto] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const colocarMarcador = useCallback((lat, lon, zoom) => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    if (!marcadorRef.current) {
      marcadorRef.current = L.marker([lat, lon], { icon: iconoMarcador, draggable: true }).addTo(mapa);
      marcadorRef.current.on("dragend", (e) => {
        const p = e.target.getLatLng();
        refinarPunto(p.lat, p.lng);
      });
    } else {
      marcadorRef.current.setLatLng([lat, lon]);
    }
    if (zoom) mapa.setView([lat, lon], zoom);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Consulta inversa de un punto (clic o arrastre): muestra lo que hay exactamente ahí
  const refinarPunto = useCallback(async (lat, lon) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setCargando(true);
    setError("");
    try {
      const r = await ubicarPunto(lat, lon, { signal: abortRef.current.signal });
      if (r?.error) {
        setSeleccion({ lat, lon, display_name: "Sin dato de dirección en este punto", address: {}, esPuntoManual: true });
      } else {
        // Se conserva la coordenada elegida por el usuario, no la del centro del objeto OSM
        setSeleccion({ ...r, lat, lon, esPuntoManual: true });
      }
      colocarMarcador(lat, lon);
    } catch (e) {
      if (e?.code !== "ERR_CANCELED") setError("No se pudo consultar el punto. Verifique el servicio de geocodificación.");
    } finally {
      setCargando(false);
    }
  }, [colocarMarcador]);

  // Inicializa el mapa una sola vez
  useEffect(() => {
    const mapa = L.map(contenedorRef.current, { center: CENTRO_INICIAL, zoom: ZOOM_INICIAL });
    L.tileLayer(MAP_TILES_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    mapa.on("click", (e) => refinarPunto(e.latlng.lat, e.latlng.lng));
    mapaRef.current = mapa;
    return () => {
      abortRef.current?.abort();
      mapa.remove();
      mapaRef.current = null;
      marcadorRef.current = null;
    };
  }, [refinarPunto]);

  const buscar = async (e) => {
    e?.preventDefault();
    const q = texto.trim();
    if (q.length < 3) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setCargando(true);
    setError("");
    setCandidatos([]);
    try {
      const res = await buscarDireccion(q, { signal: abortRef.current.signal });
      setCandidatos(res);
      if (res.length === 0) {
        setError("Sin resultados. Pruebe con calle y ciudad, o haga clic en el mapa.");
      } else {
        elegir(res[0]);
      }
    } catch (err) {
      if (err?.code !== "ERR_CANCELED") setError("No se pudo consultar el servicio de geocodificación.");
    } finally {
      setCargando(false);
    }
  };

  const elegir = (r) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    setSeleccion({ ...r, lat, lon });
    // Zoom acorde a la precisión: casa/calle muy cerca, zonas más lejos
    const nivel = evaluarPrecision(r)?.nivel;
    colocarMarcador(lat, lon, nivel === "alta" ? 19 : nivel === "media" ? 17 : 14);
  };

  const filas = seleccion ? desglosarDireccion(seleccion.address) : [];
  const precision = evaluarPrecision(seleccion);
  const coords = seleccion ? `${Number(seleccion.lat).toFixed(6)}, ${Number(seleccion.lon).toFixed(6)}` : "";

  const card = {
    background: c.backgroundCard || "#fff",
    color: c.text || "#000",
    border: `1px solid ${c.border || "#dee2e6"}`,
    borderRadius: 6,
    padding: 12,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", height: "100%", minHeight: 0 }}>
      <form onSubmit={buscar} style={{ display: "flex", gap: 8 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ingrese una dirección (calle, número, ciudad…) o haga clic en el mapa"
          style={{ ...card, flex: 1, padding: "8px 10px", fontSize: 14, outline: "none" }}
        />
        <button
          type="submit"
          disabled={cargando || texto.trim().length < 3}
          style={{
            padding: "8px 18px", border: "none", borderRadius: 6, cursor: "pointer",
            background: c.primary || "#3c3c3b", color: "#fff", opacity: cargando || texto.trim().length < 3 ? 0.6 : 1,
          }}
        >
          {cargando ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {error && <div style={{ color: "#dc3545", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 480, flexWrap: "wrap" }}>
        <div ref={contenedorRef} style={{ flex: "2 1 480px", minHeight: 480, borderRadius: 6, border: `1px solid ${c.border || "#dee2e6"}`, zIndex: 0 }} />

        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", maxHeight: 640 }}>
          {candidatos.length > 1 && (
            <div style={card}>
              <strong style={{ fontSize: 13 }}>Coincidencias</strong>
              {candidatos.map((r) => (
                <div
                  key={r.place_id}
                  onClick={() => elegir(r)}
                  style={{
                    cursor: "pointer", fontSize: 13, padding: "6px 4px", borderTop: `1px solid ${c.border || "#eee"}`,
                    fontWeight: seleccion?.place_id === r.place_id ? 700 : 400,
                  }}
                >
                  {r.display_name}
                </div>
              ))}
            </div>
          )}

          {seleccion ? (
            <div style={card}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>{seleccion.display_name}</div>
              {precision && (
                <div style={{ fontSize: 12, marginBottom: 8, color: COLOR_PRECISION[precision.nivel], fontWeight: 600 }}>
                  Precisión {precision.nivel}: {precision.texto}
                </div>
              )}
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.label} style={{ borderTop: `1px solid ${c.border || "#eee"}` }}>
                      <td style={{ padding: "4px 6px 4px 0", opacity: 0.7, whiteSpace: "nowrap" }}>{f.label}</td>
                      <td style={{ padding: "4px 0" }} title={`OSM: ${f.origen}`}>{f.valor}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `1px solid ${c.border || "#eee"}` }}>
                    <td style={{ padding: "4px 6px 4px 0", opacity: 0.7 }}>Coordenadas</td>
                    <td style={{ padding: "4px 0" }}>
                      {coords}{" "}
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(coords)}
                        style={{ border: "none", background: "transparent", color: c.primary || "#0d6efd", cursor: "pointer", fontSize: 12 }}
                      >
                        copiar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
                Arrastre el marcador o haga clic en el mapa para corregir la ubicación.
              </div>
            </div>
          ) : (
            <div style={{ ...card, fontSize: 13, opacity: 0.8 }}>
              Busque una dirección o haga clic en el mapa para ver provincia, cantón, parroquia y comunidad.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
