import React, { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "context/ThemeContext";
import { MAP_TILES_URL } from "config/env";
import { buscarDireccion, ubicarPunto } from "services/geocodingService";
import { IconUI } from "components/UI/Components/IconsUI";
import { desglosarDireccion, evaluarPrecision } from "./desglosarDireccion";

// Centro inicial: Ecuador
const CENTRO_INICIAL = [-1.45, -78.4];
const ZOOM_INICIAL = 7;

const COLOR_PRECISION = { alta: "#198754", media: "#fd7e14", baja: "#dc3545" };

// divIcon: evita los problemas de rutas de imagen de los iconos por defecto de Leaflet con Vite
const iconoMarcador = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#fd4703;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);transform:rotate(-45deg)"></div>',
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
    const mapa = L.map(contenedorRef.current, { center: CENTRO_INICIAL, zoom: ZOOM_INICIAL, zoomControl: false, attributionControl: false });
    L.control.attribution({ prefix: false }).addTo(mapa);
    L.control.zoom({ position: "topleft" }).addTo(mapa);
    L.tileLayer(MAP_TILES_URL, {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
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

  const limpiar = () => {
    abortRef.current?.abort();
    marcadorRef.current?.remove();
    marcadorRef.current = null;
    mapaRef.current?.setView(CENTRO_INICIAL, ZOOM_INICIAL);
    setTexto("");
    setCandidatos([]);
    setSeleccion(null);
    setError("");
  };

  const filas = seleccion ? desglosarDireccion(seleccion.address) : [];
  const precision = evaluarPrecision(seleccion);
  const coords = seleccion ? `${Number(seleccion.lat).toFixed(6)}, ${Number(seleccion.lon).toFixed(6)}` : "";

  const primario = c.primary || "#fd4703";
  const borde = c.border || "#dee2e6";
  const tarjeta = {
    background: c.backgroundCard || "#fff",
    color: c.text || "#000",
    border: `1px solid ${borde}`,
    borderRadius: 16,
    padding: 20,
  };
  const boton = {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "10px 8px", borderRadius: 12, border: `1px solid ${borde}`, cursor: "pointer",
    background: "transparent", color: c.text || "#000", fontSize: 14, fontWeight: 600,
  };
  const sinTexto = texto.trim().length < 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <style>{`.leaflet-control-attribution{background:transparent!important;font-size:10px;opacity:.7}`}</style>
      <form onSubmit={buscar} style={{ display: "flex", gap: 14 }}>
        <div style={{ ...tarjeta, flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 14, borderColor: primario }}>
          <IconUI name="FaMagnifyingGlass" size={16} color={c.textSecondary} />
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ingrese una dirección o haga clic en el mapa"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "inherit", fontSize: 16 }}
          />
        </div>
        <button
          type="submit"
          disabled={cargando || sinTexto}
          style={{ padding: "0 32px", border: "none", borderRadius: 14, cursor: "pointer", background: primario, color: "#fff", fontWeight: 700, fontSize: 16, opacity: cargando || sinTexto ? 0.6 : 1 }}
        >
          {cargando ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {error && <div style={{ color: "#dc3545", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          ref={contenedorRef}
          style={{ flex: "2 1 480px", height: 560, borderRadius: 16, border: `1px solid ${borde}`, zIndex: 0, overflow: "hidden" }}
        />

        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16 }}>
          {candidatos.length > 1 && (
            <div style={{ ...tarjeta, padding: 14 }}>
              <strong style={{ fontSize: 13 }}>Coincidencias</strong>
              {candidatos.map((r) => (
                <div
                  key={r.place_id}
                  onClick={() => elegir(r)}
                  style={{ cursor: "pointer", fontSize: 13, padding: "8px 4px", borderTop: `1px solid ${borde}`, fontWeight: seleccion?.place_id === r.place_id ? 700 : 400 }}
                >
                  {r.display_name}
                </div>
              ))}
            </div>
          )}

          <div style={tarjeta}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: `1px solid ${borde}` }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${primario}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconUI name="FaLocationDot" size={20} color={primario} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15 }}>
                  {seleccion ? "Ubicación encontrada" : "Consulte una ubicación"}
                </div>
                <div style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>
                  {seleccion ? coords : "Busque o haga clic en el mapa"}
                </div>
              </div>
            </div>

            {seleccion && (
              <>
                {precision && (
                  <div style={{ fontSize: 12, marginTop: 12, color: COLOR_PRECISION[precision.nivel], fontWeight: 600 }}>
                    Precisión {precision.nivel}: {precision.texto}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                  {filas.map((f) => (
                    <div key={f.label} title={`OSM: ${f.origen}`}>
                      <div style={{ fontSize: 14, color: c.textSecondary }}>{f.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>{f.valor}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button type="button" style={boton} onClick={() => navigator.clipboard?.writeText(coords)}>
                    <IconUI name="FaRegCopy" size={16} /> Copiar
                  </button>
                  <button type="button" style={boton} onClick={limpiar}>
                    <IconUI name="FaXmark" size={16} /> Limpiar
                  </button>
                </div>
                <div style={{ fontSize: 11, color: c.textSecondary, marginTop: 12 }}>
                  Arrastre el marcador o haga clic en el mapa para corregir la ubicación.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
