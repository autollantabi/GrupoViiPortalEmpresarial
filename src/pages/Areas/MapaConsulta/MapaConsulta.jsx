import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "context/ThemeContext";
import { ubicarPunto } from "services/geocodingService";
import { IconUI } from "components/UI/Components/IconsUI";
import { consultarLugares } from "./consultarLugares";
import { desglosarDireccion, evaluarPrecision } from "./desglosarDireccion";
import { cargarGoogleMaps } from "./cargarGoogleMaps";

// Centro inicial: Ecuador
const CENTRO_INICIAL = { lat: -1.45, lng: -78.4 };
const ZOOM_INICIAL = 7;

const COLOR_PRECISION = { alta: "#198754", media: "#fd7e14", baja: "#dc3545" };

// Pin SVG propio: no depende de imágenes ni de un Map ID de Google
const ICONO_PIN = {
  path: "M12 0C5.9 0 1 4.9 1 11c0 8 11 21 11 21s11-13 11-21C23 4.9 18.1 0 12 0z",
  fillColor: "#fd4703",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 2,
  scale: 1,
  anchor: { x: 12, y: 32 },
};

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
  const [sugerir, setSugerir] = useState(false); // true solo mientras el usuario escribe
  const [mostrarLista, setMostrarLista] = useState(false);
  const sugerenciasRef = useRef(null);
  const [error, setError] = useState("");

  const colocarMarcador = useCallback((lat, lon, zoom) => {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const pos = { lat, lng: lon };
    if (!marcadorRef.current) {
      marcadorRef.current = new window.google.maps.Marker({ position: pos, map: mapa, draggable: true, icon: { ...ICONO_PIN, anchor: new window.google.maps.Point(12, 32) } });
      marcadorRef.current.addListener("dragend", (e) => refinarPunto(e.latLng.lat(), e.latLng.lng()));
    } else {
      marcadorRef.current.setPosition(pos);
      marcadorRef.current.setMap(mapa);
    }
    if (zoom) {
      mapa.setCenter(pos);
      mapa.setZoom(zoom);
    }
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
        // Se conserva la coordenada elegida por el usuario, no la del centro del objeto encontrado
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
    let vivo = true;
    cargarGoogleMaps()
      .then((maps) => {
        if (!vivo || !contenedorRef.current) return;
        const mapa = new maps.Map(contenedorRef.current, {
          center: CENTRO_INICIAL,
          zoom: ZOOM_INICIAL,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false, // un clic sobre un comercio también consulta ese punto
        });
        mapa.addListener("click", (e) => refinarPunto(e.latLng.lat(), e.latLng.lng()));
        mapaRef.current = mapa;
      })
      .catch((e) => vivo && setError(`No se pudo cargar el mapa: ${e.message}`));
    return () => {
      vivo = false;
      abortRef.current?.abort();
      marcadorRef.current?.setMap(null);
      mapaRef.current = null;
      marcadorRef.current = null;
    };
  }, [refinarPunto]);

  // Centro del mapa, solo si está acercado (a nivel país no orienta nada)
  const centroActual = () => {
    const m = mapaRef.current;
    if (!m || m.getZoom() < 11) return undefined;
    const c = m.getCenter();
    return [c.lat(), c.lng()];
  };

  const sinResultados = (esCruce) => {
    // No dejar la tarjeta/marcador anterior como si fueran la respuesta
    marcadorRef.current?.setMap(null);
    marcadorRef.current = null;
    setSeleccion(null);
    setError(
      esCruce
        ? "No se encontró ese cruce. Revise los nombres de las calles o agregue la ciudad (ej. \"Junín y 5 de Junio, Riobamba\")."
        : "Sin resultados. Pruebe con calle y ciudad, o haga clic en el mapa."
    );
  };

  // Sugerencias mientras se escribe: muestran los lugares posibles (con ciudad y provincia)
  // para que el usuario elija el correcto, en vez de asumir el primero.
  useEffect(() => {
    const q = texto.trim();
    if (!sugerir || q.length < 4) return undefined;
    const espera = setTimeout(async () => {
      sugerenciasRef.current?.abort();
      sugerenciasRef.current = new AbortController();
      try {
        const { candidatos: res } = await consultarLugares(q, { signal: sugerenciasRef.current.signal, centro: centroActual() });
        setCandidatos(res);
        setMostrarLista(true);
      } catch { /* una sugerencia fallida no muestra error */ }
    }, 700);
    return () => clearTimeout(espera);
  }, [texto, sugerir]); // eslint-disable-line react-hooks/exhaustive-deps

  const buscar = async (e) => {
    e?.preventDefault();
    const q = texto.trim();
    if (q.length < 3) return;
    sugerenciasRef.current?.abort();
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setSugerir(false);
    setMostrarLista(false);
    setCargando(true);
    setError("");
    try {
      const { candidatos: res, esCruce } = await consultarLugares(q, { signal: abortRef.current.signal, centro: centroActual() });
      setCandidatos(res);
      if (res.length === 0) sinResultados(esCruce);
      else elegir(res[0]);
    } catch (err) {
      if (err?.code !== "ERR_CANCELED") {
        setError(
          err?.response?.status === 429
            ? "El servicio de mapas está limitando las consultas. Espere un minuto e intente de nuevo."
            : "No se pudo consultar el servicio de geocodificación."
        );
      }
    } finally {
      setCargando(false);
    }
  };

  const elegir = (r) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    setSeleccion({ ...r, lat, lon });
    // El marcador se mueve de inmediato; no espera a ninguna consulta
    const nivel = evaluarPrecision(r)?.nivel;
    colocarMarcador(lat, lon, nivel === "alta" ? 19 : nivel === "media" ? 17 : 14);
  };

  const limpiar = () => {
    abortRef.current?.abort();
    marcadorRef.current?.setMap(null);
    marcadorRef.current = null;
    mapaRef.current?.setCenter(CENTRO_INICIAL);
    mapaRef.current?.setZoom(ZOOM_INICIAL);
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
      <form onSubmit={buscar} style={{ display: "flex", gap: 14 }}>
        <div style={{ ...tarjeta, flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 14, borderColor: primario, position: "relative", zIndex: 5 }}>
          <IconUI name="FaMagnifyingGlass" size={16} color={c.textSecondary} />
          <input
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setSugerir(true); }}
            onFocus={() => candidatos.length > 0 && sugerir && setMostrarLista(true)}
            onBlur={() => setMostrarLista(false)}
            placeholder="Ingrese una dirección o haga clic en el mapa"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: "inherit", fontSize: 16 }}
          />
          {mostrarLista && candidatos.length > 0 && (
            <div style={{ ...tarjeta, position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, padding: 6, borderRadius: 14, maxHeight: 320, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
              {candidatos.map((r) => (
                <div
                  key={r.place_id}
                  // onMouseDown: se ejecuta antes del blur del input, que cerraría la lista
                  onMouseDown={() => { setTexto(r.display_name); setSugerir(false); setMostrarLista(false); elegir(r); }}
                  style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 14 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${primario}1f`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <IconUI name={r.category === "interseccion" ? "FaRoadBarrier" : "FaLocationDot"} size={14} color={primario} />
                  <span>{r.display_name}</span>
                </div>
              ))}
            </div>
          )}
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
          {candidatos.length > 1 && !mostrarLista && (
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
                    <div key={f.label} title={`Origen: ${f.origen}`}>
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
