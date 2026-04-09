import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";

const LINEAS_NEGOCIO = [
    { value: "LLANTAS", label: "LLANTAS" },
    { value: "LLANTAS MOTO", label: "LLANTAS MOTO" },
    { value: "LUBRICANTES", label: "LUBRICANTES" },
];
const TIPOS_LLANTAS = [
    { value: "Americana", label: "Americana" },
    { value: "Milimetrica", label: "Milimétrica" },
    { value: "Decimal", label: "Decimal" },
];
const VELOCIDADES = "Y G R H L Q W F J M P V S I K T N".split(" ").map((v) => ({ value: v, label: v }));
const MARCAS_LUBRICANTES = [
    { value: "SHELL", label: "SHELL" },
    { value: "PENNZOIL", label: "PENNZOIL" },
    { value: "AC DELCO", label: "AC DELCO" },
];
const OPCIONES_EMPAQUE = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const OPCIONES_UNIDAD_LUB = ["L", "QT", "UGL", "KG", "LB"].map((v) => ({ value: v, label: v }));
const OPCIONES_FAMILIA_LUB = [
    "AC DELCO", "ADVANCE", "AEROSHELL", "ARGINA", "CAPRINUS",
    "CORENA", "GADINIA", "GADUS", "HELIX", "HYDRAULIC",
    "MORLINA", "MYSELLA", "NAUTILUS", "OMALA", "PENNZOIL",
    "REFRIGERANTE", "RIM", "RIMULA", "ROTELLA", "SHELLZONE",
    "SPIRAX", "TELLUS", "TONNA", "TURBO"
].map((v) => ({ value: v, label: v }));

// --- Marcas de llantas (value = marca referencial para descripción, marcaOriginal = para BD) ---
const MARCAS_LLANTAS = [
    { value: "APLUS", label: "APLUS", marcaOriginal: "APLUS" },
    { value: "ANSU", label: "ANSU", marcaOriginal: "WONDERLAND" },
    { value: "CST", label: "CST", marcaOriginal: "CST" },
    { value: "FARROAD BRAND", label: "FARROAD BRAND", marcaOriginal: "FARROAD BRAND" },
    { value: "FORTUNE", label: "FORTUNE", marcaOriginal: "FORTUNE" },
    { value: "HAOHUA", label: "HAOHUA", marcaOriginal: "HAOHUA" },
    { value: "MAXTREK", label: "MAXTREK", marcaOriginal: "MAXTREK" },
    { value: "MAXXIS", label: "MAXXIS", marcaOriginal: "MAXXIS" },
    { value: "WONDERLAND", label: "WONDERLAND", marcaOriginal: "WONDERLAND" },
];

// --- Jerarquía CATEGORIA → SEGMENTO → APLICACION → EJE (llantas) ---
const CATEGORIAS_LLANTAS = {
    "PCR (PASSENGER CAR RADIAL)": {
        segmentos: {
            "PASAJERO(PCR)": {
                aplicaciones: {
                    "PASAJERO": ["P(PASSENGER)", "HP (HIGH PERFORMANCE)", "UHP (ULTRA HIGH PERFORMANCE)"],
                    "TAXI": ["TAXI"],
                    "RUN FLAT": ["RUN FLAT"],
                },
            },
            "COMPETENCIA": {
                aplicaciones: {
                    "RALLY": ["S(SOFT)", "M(MEDIUM)", "H(HARD)", "SLICK", "SEMI SLICK"],
                    "PISTA": ["S(SOFT)", "M(MEDIUM)", "H(HARD)", "SLICK", "SEMI SLICK"],
                },
            },
        },
    },
    "LT 4X4 (LIGHT TRUCK)": {
        segmentos: {
            "LT/4X4/SUV(LTR)": {
                aplicaciones: {
                    "ON": ["P(PASSENGER)", "RUN FLAT", "UHP (ULTRA HIGH PERFORMANCE)", "HP (HIGH PERFORMANCE)", "HT (HIGHWAY TERRAIN)"],
                    "ON/OFF": ["RT(RUGGED TERRAIN)", "AT(ALL TERRAIN)"],
                    "OFF": ["MT(MUD TERRAIN)"],
                },
            },
            "COMERCIAL": {
                aplicaciones: {
                    "COMERCIAL (CARGA) & VAN": ["HT (HIGHWAY TERRAIN)", "AT(ALL TERRAIN)"],
                },
            },
            "RUNFLAT": {
                aplicaciones: {
                    "HP": ["HP (HIGH PERFORMANCE)"],
                    "UHP": ["UHP (ULTRA HIGH PERFORMANCE)"],
                },
            },
            "LT BIAS (LIGHT TRUCK BIAS)": {
                aplicaciones: {
                    "ON": ["DIRECCIONAL (TODA POSICION)", "MIXTA", "TRACCION", "TRAILER (ARRASTRE)"],
                    "ON/OFF": ["DIRECCIONAL (TODA POSICION)", "MIXTA", "TRACCION", "TRAILER (ARRASTRE)"],
                    "OFF": ["DIRECCIONAL (TODA POSICION)", "MIXTA", "TRACCION", "TRAILER (ARRASTRE)"],
                },
            },
        },
    },
    "CAMION PESADO": {
        segmentos: {
            "TBR (TRUCK & BUS RADIAL)": {
                aplicaciones: {
                    "LONG HAUL": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "REGIONAL": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "URBANA": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "ON/OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "MIXTA"],
                    "OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                },
            },
            "TBB (TRUCK & BUS BIAS)": {
                aplicaciones: {
                    "ON": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "ON/OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                },
            },
        },
    },
    "CAMION LIVIANO": {
        segmentos: {
            "LTSR (LIGHT TRUCK SERVICE RADIAL)": {
                aplicaciones: {
                    "OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "REGIONAL": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "URBANA": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "ON/OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                },
            },
            "LTSB (LIGHT TRUCK SERVICE BIAS)": {
                aplicaciones: {
                    "OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "REGIONAL": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "URBANA": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                    "ON/OFF": ["DIRECCIONAL (TODA POSICION)", "TRACCION", "TRAILER (ARRASTRE)", "MIXTA"],
                },
            },
        },
    },
};

const EMPRESAS_POR_LINEA = {
    LLANTAS: [
        { value: "AUTOLLANTA", label: "AUTOLLANTA" },
        { value: "MAXXIMUNDO", label: "MAXXIMUNDO" },
        { value: "STOX", label: "STOX" },
        { value: "AUTOMAX", label: "AUTOMAX" },
    ],
    "LLANTAS MOTO": [
        { value: "MAXXIMUNDO", label: "MAXXIMUNDO" },
    ],
    LUBRICANTES: [
        { value: "MAXXIMUNDO", label: "MAXXIMUNDO" },
    ],
};
const CAMPO_LABELS = {
    marcaLlanta: "Marca", categoria: "Categoría", segmento: "Segmento", aplicacion: "Aplicación", eje: "Eje",
    tipo: "Tipo", ancho: "Ancho", altura: "Altura/Serie", rin: "Rin",
    diseño: "Diseño", lona: "Lona/Robustez", carga: "Carga", velocidad: "Velocidad",
    marca: "Marca", familia: "Familia", tipoLub: "Tipo", viscosidad: "Viscosidad", empaqueLub: "Empaque", cantidadLub: "Cantidad", unidadLub: "Unidad",
};

const ID_BORRADOR = "draft";

// --- Configuración por línea de negocio ---
const LINEA_CONFIG = {
    LLANTAS: {
        formType: "llantas",
        marcas: MARCAS_LLANTAS,
        categorias: CATEGORIAS_LLANTAS,
        ancho: {
            Americana: { min: 8, max: 13, step: 0.5 },
            Milimetrica: { min: 55, max: 385, step: 5 },
            Decimal: { min: 2.5, max: 14, step: 0.5 },
        },
        altura: {
            Americana: { min: 18, max: 38, step: 1 },
            Milimetrica: { min: 35, max: 100, step: 5 },
        },
        rin: { min: 10, max: 24.5, step: 0.5 },
        lona: { min: 6, max: 24, step: 1 },
        carga: { tipo: "formato" },
    },
    "LLANTAS MOTO": {
        formType: "llantas",
        ancho: {
            Americana: { min: 4.5, max: 11, step: 0.5 },
            Milimetrica: { min: 60, max: 245, step: 5 },
            Decimal: { min: 2.5, max: 4.6, step: 0.1 },
        },
        altura: {
            Americana: { min: 10, max: 32, step: 1 },
            Milimetrica: { min: 40, max: 100, step: 5 },
        },
        rin: { min: 5, max: 21, step: 1 },
        lona: { min: 2, max: 8, step: 1 },
        carga: { tipo: "rango", min: 14, max: 98, step: 1 },
    },
    LUBRICANTES: {
        formType: "lubricantes",
    },
};

function generarOpciones(min, max, step) {
    const arr = [];
    const factor = 10000;
    const minI = Math.round(min * factor);
    const maxI = Math.round(max * factor);
    const stepI = Math.round(step * factor);
    for (let i = minI; i <= maxI; i += stepI) {
        const v = i / factor;
        const s = Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(2)).toString();
        arr.push({ value: s, label: s });
    }
    return arr;
}

function generarCargasFormato() {
    const arr = [];
    for (let i = 2; i <= 30; i++) arr.push({ value: String(i), label: String(i) });
    for (let i = 4; i <= 30; i += 2) arr.push({ value: `${i}/${i - 2}`, label: `${i}/${i - 2}` });
    return arr;
}

function validarRequerido(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    return null;
}

function validarEnRango(valor, min, max) {
    const err = validarRequerido(valor);
    if (err) return err;
    const n = parseFloat(String(valor).replace(",", "."));
    if (Number.isNaN(n)) return "Debe ser número";
    if (n < min || n > max) return `Entre ${min} y ${max}`;
    return null;
}

function validarAncho(config, tipo, valor) {
    if (!config || !tipo) return validarRequerido(valor);
    const cfg = config.ancho?.[tipo];
    if (!cfg) return validarRequerido(valor);
    return validarEnRango(valor, cfg.min, cfg.max);
}

function validarAltura(config, tipo, valor) {
    if (tipo === "Decimal") return null;
    if (!config || !tipo) return validarRequerido(valor);
    const cfg = config.altura?.[tipo];
    if (!cfg) return validarRequerido(valor);
    return validarEnRango(valor, cfg.min, cfg.max);
}

function validarRin(config, valor) {
    if (!config) return validarRequerido(valor);
    return validarEnRango(valor, config.rin.min, config.rin.max);
}

function validarDiseño(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    return null;
}

function validarLona(config, valor) {
    if (!config) return validarRequerido(valor);
    return validarEnRango(valor, config.lona.min, config.lona.max);
}

function validarCarga(config, valor) {
    const err = validarRequerido(valor);
    if (err) return err;
    if (!config) return null;
    if (config.carga.tipo === "formato") {
        const s = String(valor).trim();
        if (/^\d+$/.test(s)) return null;
        if (/^\d+\/\d+$/.test(s)) return null;
        return "Formato X o X/X";
    }
    if (config.carga.tipo === "rango") {
        const n = parseInt(String(valor), 10);
        if (Number.isNaN(n) || n < config.carga.min || n > config.carga.max)
            return `Entero entre ${config.carga.min} y ${config.carga.max}`;
        return null;
    }
    return null;
}

function validarVelocidad(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const v = String(valor).trim().toUpperCase();
    if (v.length !== 1 || !VELOCIDADES.some((x) => x.value === v)) return "Una letra: Y,G,R,H,L,Q,W,F,J,M,P,V,S,I,K,T,N";
    return null;
}

// --- Validaciones LUBRICANTES ---
function validarFamilia(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    if (!/^[A-Za-záéíóúñÁÉÍÓÚÑüÜ\s]+$/.test(String(valor).trim())) return "Solo caracteres alfabéticos";
    return null;
}

function validarViscosidad(valor) {
    if (valor == null || String(valor).trim() === "") return null; // Opcional
    const s = String(valor).trim().toUpperCase();
    if (!/^\d{1,3}(W\d{1,3})?$/.test(s)) return "Formato XWX o X (ej: 5W30, 50, 100W250)";
    return null;
}

function validarSoloNumero(valor) {
    if (valor == null || String(valor).trim() === "") return null; // No mostrar Requerido
    if (!/^\d+$/.test(String(valor).trim())) return "Solo números";
    return null;
}

function validarUnidad(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    if (!/^[A-Za-z]+$/.test(String(valor).trim())) return "Solo letras";
    return null;
}

function buildDescripcionLubricantes(marca, familia, tipoLub, viscosidad, empaque, cantidad, unidad) {
    const empaqueFinal = `${empaque}*${cantidad}${unidad}`;
    // Si marca y familia son lo mismo, evitamos duplicar el nombre (ej. AC DELCO AC DELCO)
    const nombreBase = marca === familia ? [marca] : [marca, familia];
    return [...nombreBase, tipoLub, viscosidad, empaqueFinal]
        .map((v) => (v != null ? String(v).trim().toUpperCase() : ""))
        .filter(Boolean)
        .join(" ");
}

function buildDescripcionConVariables(marcaRef, tipo, ancho, altura, rin, diseño, lona, carga, velocidad) {
    const m = marcaRef != null ? String(marcaRef).trim().toUpperCase() : "";
    const r = rin != null && String(rin).trim() !== "" ? String(rin).trim().toUpperCase() : "";
    const d = diseño != null ? String(diseño).trim().toUpperCase() : "";
    const lo = lona != null && String(lona).trim() !== "" ? `${String(lona).trim().toUpperCase()}PR` : "";
    const c = carga != null ? String(carga).trim().toUpperCase() : "";
    const v = velocidad != null ? String(velocidad).trim().toUpperCase() : "";
    const part = `R-${r} ${d} ${lo} ${c}${v}`.trim();
    let desc = "";
    if (tipo === "Americana") desc = `${altura || ""} x ${ancho || ""} ${part}`.trim();
    else if (tipo === "Milimetrica") desc = `${ancho || ""}/${altura || ""} ${part}`.trim();
    else if (tipo === "Decimal") desc = `${ancho || ""} ${part}`.trim();
    return m ? `${m} ${desc}` : desc;
}

function exportarItemsATxt(items, nombreArchivo) {
    const lineas = items.map((it) => it.descripcionConVariables || "");
    const blob = new Blob([lineas.filter(Boolean).join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo || "exportacion.txt";
    a.click();
    URL.revokeObjectURL(url);
}

export default function MDM_Crud() {
    const { theme } = useTheme();
    const [groups, setGroups] = useState([]);
    const [currentGroupId, setCurrentGroupId] = useState(null);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());

    const [linea, setLinea] = useState(null);
    const [empresa, setEmpresa] = useState(null);
    const [tipo, setTipo] = useState(null);
    const [ancho, setAncho] = useState(null);
    const [altura, setAltura] = useState(null);
    const [rin, setRin] = useState(null);
    const [diseño, setDiseño] = useState("");
    const [lona, setLona] = useState(null);
    const [carga, setCarga] = useState(null);
    const [velocidad, setVelocidad] = useState(null);
    // Clasificación llantas
    const [marcaLlanta, setMarcaLlanta] = useState(null);
    const [categoria, setCategoria] = useState(null);
    const [segmento, setSegmento] = useState(null);
    const [aplicacion, setAplicacion] = useState(null);
    const [eje, setEje] = useState(null);
    // Lubricantes
    const [marca, setMarca] = useState(null);
    const [familia, setFamilia] = useState(null);
    const [tipoLub, setTipoLub] = useState("");
    const [viscosidad, setViscosidad] = useState("");
    const [empaqueLub, setEmpaqueLub] = useState(null);
    const [cantidadLub, setCantidadLub] = useState("");
    const [unidadLub, setUnidadLub] = useState(null);

    const [touchedFields, setTouchedFields] = useState(() => new Set());
    const [mostrarFormularioNuevoItem, setMostrarFormularioNuevoItem] = useState(false);

    const currentGroup = useMemo(
        () => groups.find((g) => g.id === currentGroupId) || null,
        [groups, currentGroupId]
    );

    useEffect(() => {
        setMostrarFormularioNuevoItem(false);
    }, [currentGroupId]);

    const lineaActual = currentGroup?.linea;
    const config = LINEA_CONFIG[lineaActual] || null;
    const esLlantas = config?.formType === "llantas";
    const esLubricantes = config?.formType === "lubricantes";

    // Opciones en cascada: Marca, Categoría → Segmento → Aplicación → Eje
    const opcionesMarcaLlanta = useMemo(() => config?.marcas || [], [config]);

    const opcionesCategoria = useMemo(() => {
        if (!config?.categorias) return [];
        return Object.keys(config.categorias).map((v) => ({ value: v, label: v }));
    }, [config]);

    const opcionesSegmento = useMemo(() => {
        if (!config?.categorias || !categoria?.value) return [];
        const cat = config.categorias[categoria.value];
        return cat ? Object.keys(cat.segmentos).map((v) => ({ value: v, label: v })) : [];
    }, [config, categoria]);

    const opcionesAplicacion = useMemo(() => {
        if (!config?.categorias || !categoria?.value || !segmento?.value) return [];
        const seg = config.categorias[categoria.value]?.segmentos?.[segmento.value];
        return seg ? Object.keys(seg.aplicaciones).map((v) => ({ value: v, label: v })) : [];
    }, [config, categoria, segmento]);

    const opcionesEje = useMemo(() => {
        if (!config?.categorias || !categoria?.value || !segmento?.value || !aplicacion?.value) return [];
        const ejes = config.categorias[categoria.value]?.segmentos?.[segmento.value]?.aplicaciones?.[aplicacion.value];
        return ejes ? ejes.map((v) => ({ value: v, label: v })) : [];
    }, [config, categoria, segmento, aplicacion]);

    const opcionesAncho = useMemo(() => {
        if (!esLlantas || !config?.ancho || !tipo?.value) return [];
        const cfg = config.ancho[tipo.value];
        return cfg ? generarOpciones(cfg.min, cfg.max, cfg.step) : [];
    }, [esLlantas, config, tipo]);

    const opcionesAltura = useMemo(() => {
        if (!esLlantas || !config?.altura || !tipo?.value) return [];
        const cfg = config.altura[tipo.value];
        return cfg ? generarOpciones(cfg.min, cfg.max, cfg.step) : [];
    }, [esLlantas, config, tipo]);

    const opcionesRin = useMemo(() => {
        if (!esLlantas || !config?.rin) return [];
        return generarOpciones(config.rin.min, config.rin.max, config.rin.step);
    }, [esLlantas, config]);

    const opcionesLona = useMemo(() => {
        if (!esLlantas || !config?.lona) return [];
        return generarOpciones(config.lona.min, config.lona.max, config.lona.step);
    }, [esLlantas, config]);

    const opcionesCarga = useMemo(() => {
        if (!esLlantas || !config?.carga) return [];
        if (config.carga.tipo === "formato") return generarCargasFormato();
        if (config.carga.tipo === "rango") return generarOpciones(config.carga.min, config.carga.max, config.carga.step);
        return [];
    }, [esLlantas, config]);

    const opcionesFamiliaLub = useMemo(() => {
        if (!esLubricantes || !marca?.value) return [];
        if (marca.value === "AC DELCO") return OPCIONES_FAMILIA_LUB.filter((f) => f.value === "AC DELCO");
        if (marca.value === "PENNZOIL") return OPCIONES_FAMILIA_LUB.filter((f) => f.value === "PENNZOIL");
        if (marca.value === "SHELL") return OPCIONES_FAMILIA_LUB.filter((f) => f.value !== "AC DELCO" && f.value !== "PENNZOIL");
        return [];
    }, [esLubricantes, marca]);

    const gruposGuardados = useMemo(() => groups.filter((g) => g.id !== ID_BORRADOR), [groups]);

    const crearGrupo = useCallback(() => {
        setGroups((prev) => {
            const sinBorrador = prev.filter((g) => g.id !== ID_BORRADOR);
            return [...sinBorrador, { id: ID_BORRADOR, createdAt: new Date().toISOString(), linea: null, empresa: null, items: [] }];
        });
        setCurrentGroupId(ID_BORRADOR);
        setLinea(null);
        setEmpresa(null);
        setTipo(null);
        setAncho(null); setAltura(null); setRin(null); setDiseño("");
        setLona(null); setCarga(null); setVelocidad(null);
        setMarcaLlanta(null); setCategoria(null); setSegmento(null); setAplicacion(null); setEje(null);
        setMarca(null); setFamilia(null); setTipoLub(""); setViscosidad(""); setEmpaqueLub(null); setCantidadLub(""); setUnidadLub(null);
        setTouchedFields(new Set());
        setMostrarFormularioNuevoItem(false);
        setSelectedItemIds(new Set());
    }, []);

    const asignarLineaEmpresa = useCallback(() => {
        if (!currentGroupId) return;
        if (!linea?.value || !empresa?.value) {
            toast.error("Seleccione línea y empresa");
            return;
        }
        setGroups((prev) =>
            prev.map((g) => (g.id === currentGroupId ? { ...g, linea: linea.value, empresa: empresa.value } : g))
        );
        toast.success("Línea y empresa asignados");
    }, [currentGroupId, linea, empresa]);

    const limpiarFormulario = useCallback(() => {
        // Llantas
        setTipo(null); setAncho(null); setAltura(null); setRin(null);
        setDiseño(""); setLona(null); setCarga(null); setVelocidad(null);
        // Clasificación llantas
        setMarcaLlanta(null); setCategoria(null); setSegmento(null); setAplicacion(null); setEje(null);
        // Lubricantes
        setMarca(null); setFamilia(null); setTipoLub(""); setViscosidad(""); setEmpaqueLub(null); setCantidadLub(""); setUnidadLub(null);
        // Común
        setTouchedFields(new Set());
    }, []);

    const errores = useMemo(() => {
        if (esLubricantes) {
            return {
                marca: validarRequerido(marca?.value),
                familia: validarRequerido(familia?.value),
                tipoLub: validarRequerido(tipoLub),
                viscosidad: validarViscosidad(viscosidad),
                empaqueLub: validarRequerido(empaqueLub?.value),
                cantidadLub: validarSoloNumero(cantidadLub),
                unidadLub: validarRequerido(unidadLub?.value),
            };
        }
        const tipoVal = tipo?.value;
        return {
            marcaLlanta: config?.marcas ? validarRequerido(marcaLlanta?.value) : null,
            categoria: config?.categorias ? validarRequerido(categoria?.value) : null,
            segmento: config?.categorias ? validarRequerido(segmento?.value) : null,
            aplicacion: config?.categorias ? validarRequerido(aplicacion?.value) : null,
            eje: config?.categorias ? validarRequerido(eje?.value) : null,
            tipo: !tipoVal ? "Requerido" : null,
            ancho: validarAncho(config, tipoVal, ancho?.value),
            altura: validarAltura(config, tipoVal, altura?.value),
            rin: validarRin(config, rin?.value),
            diseño: validarDiseño(diseño),
            lona: validarLona(config, lona?.value),
            carga: validarCarga(config, carga?.value),
            velocidad: validarVelocidad(velocidad?.value),
        };
    }, [esLubricantes, config, tipo, ancho, altura, rin, diseño, lona, carga, velocidad, marca, familia, tipoLub, viscosidad, empaqueLub, cantidadLub, unidadLub, marcaLlanta, categoria, segmento, aplicacion, eje]);

    const marcarTocado = useCallback((campo) => {
        setTouchedFields((prev) => new Set(prev).add(campo));
    }, []);

    const renderCampo = (campo, label, { tipoComp = "select", placeholder, options, value, onChange, onChangeExtra, ...rest } = {}) => (
        <div key={campo} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tipoComp === "select" ? (
                <SelectUI
                    label={label} placeholder={placeholder || "Seleccionar"} options={options || []}
                    value={value} onChange={(v) => { onChange(v); onChangeExtra?.(v); marcarTocado(campo); }} minWidth="100%"
                    {...rest}
                />
            ) : (
                <InputUI
                    label={label} placeholder={placeholder || ""}
                    value={value} onChange={(v) => { onChange(v); onChangeExtra?.(v); marcarTocado(campo); }}
                    {...rest}
                />
            )}
            {touchedFields.has(campo) && errores[campo] && (
                <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores[campo]}</TextUI>
            )}
        </div>
    );

    const agregarItem = useCallback(() => {
        if (!currentGroup) return;
        const camposConError = Object.entries(errores)
            .filter(([, msg]) => msg != null)
            .map(([campo, msg]) => ({ campo: CAMPO_LABELS[campo] || campo, msg }));
        if (camposConError.length > 0) {
            setTouchedFields(new Set(Object.keys(errores)));
            toast.error("Campos con error: " + camposConError.map((e) => `${e.campo}: ${e.msg}`).join(" — "));
            return;
        }
        const id = `i-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let item;
        if (esLubricantes) {
            item = {
                id, marca: marca?.value, familia: familia?.value, tipoLub,
                viscosidad: viscosidad || null, empaqueLub: empaqueLub?.value, cantidadLub, unidadLub: unidadLub?.value,
                descripcionConVariables: buildDescripcionLubricantes(marca?.value, familia?.value, tipoLub, viscosidad, empaqueLub?.value, cantidadLub, unidadLub?.value),
            };
        } else {
            item = {
                id,
                marcaRef: marcaLlanta?.value || null,
                marcaOriginal: marcaLlanta?.marcaOriginal || marcaLlanta?.value || null,
                categoria: categoria?.value || null,
                segmento: segmento?.value || null,
                aplicacion: aplicacion?.value || null,
                eje: eje?.value || null,
                tipo: tipo?.value, ancho: ancho?.value,
                altura: tipo?.value === "Decimal" ? null : altura?.value,
                rin: rin?.value, diseño, lona: lona?.value,
                carga: carga?.value, velocidad: velocidad?.value,
                descripcionConVariables: buildDescripcionConVariables(
                    marcaLlanta?.value, tipo?.value, ancho?.value,
                    tipo?.value === "Decimal" ? null : altura?.value,
                    rin?.value, diseño, lona?.value, carga?.value, velocidad?.value
                ),
            };
        }
        setGroups((prev) =>
            prev.map((g) => (g.id === currentGroupId ? { ...g, items: [...g.items, item] } : g))
        );
        limpiarFormulario();
        setMostrarFormularioNuevoItem(false);
        toast.success("Item agregado");
    }, [currentGroup, currentGroupId, errores, esLubricantes, tipo, ancho, altura, rin, diseño, lona, carga, velocidad, marca, familia, tipoLub, viscosidad, empaqueLub, cantidadLub, unidadLub, marcaLlanta, categoria, segmento, aplicacion, eje, limpiarFormulario]);

    const toggleSeleccionItem = useCallback((id) => {
        setSelectedItemIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const seleccionarTodosItems = useCallback(() => {
        if (!currentGroup?.items?.length) return;
        setSelectedItemIds(new Set(currentGroup.items.map((i) => i.id)));
    }, [currentGroup]);

    const exportarGrupo = useCallback(() => {
        if (!currentGroup?.items?.length) {
            toast.error("No hay ítems en el grupo");
            return;
        }
        const fecha = new Date(currentGroup.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }).replace(/[/:]/g, "-");
        exportarItemsATxt(currentGroup.items, `MDM_SAP_${fecha}.txt`);
        toast.success("Grupo exportado");
    }, [currentGroup]);

    const exportarSeleccionados = useCallback(() => {
        if (!currentGroup || selectedItemIds.size === 0) {
            toast.error("Seleccione al menos un ítem");
            return;
        }
        const items = currentGroup.items.filter((i) => selectedItemIds.has(i.id));
        const fecha = new Date(currentGroup.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }).replace(/[/:]/g, "-");
        exportarItemsATxt(items, `MDM_SAP_${fecha}.txt`);
        toast.success("Exportados " + items.length + " ítem(s)");
    }, [currentGroup, selectedItemIds]);

    const eliminarGrupo = useCallback(
        (idGrupo) => {
            const confirmado = window.confirm("¿Desea eliminar este grupo y sus ítems?");
            if (!confirmado) return;

            setGroups((prev) => {
                const next = prev.filter((g) => g.id !== idGrupo);

                if (currentGroupId === idGrupo) {
                    const nuevoActual = next[next.length - 1] || null;
                    setCurrentGroupId(nuevoActual?.id ?? null);
                    setLinea(null);
                    setEmpresa(null);
                    limpiarFormulario();
                    setSelectedItemIds(new Set());
                    setTouchedFields(new Set());
                    setMostrarFormularioNuevoItem(false);
                }

                return next;
            });

            toast.success("Grupo eliminado");
        },
        [currentGroupId, limpiarFormulario]
    );

    const tieneLineaYEmpresa = currentGroup?.linea && currentGroup?.empresa;
    const mostrarFormulario = tieneLineaYEmpresa && !!config;

    return (
        <div
            style={{ padding: 20, gap: 16, overflow: "auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextUI size="20px" weight="600">
                        {currentGroup
                            ? `Grupo — ${new Date(currentGroup.createdAt).toLocaleString("es-ES")}`
                            : "Grupos de ingreso"}
                    </TextUI>
                    {currentGroup && tieneLineaYEmpresa && (
                        <TextUI size="13px" color={theme?.colors?.textSecondary}>
                            Línea: <strong>{currentGroup.linea}</strong> — Empresa: <strong>{currentGroup.empresa}</strong>
                        </TextUI>
                    )}
                </div>
                {currentGroup ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <ButtonUI
                            text="Cancelar"
                            variant="outlined"
                            onClick={() => {
                                if (currentGroupId === ID_BORRADOR) {
                                    setGroups((prev) => prev.filter((g) => g.id !== ID_BORRADOR));
                                }
                                setCurrentGroupId(null);
                                setMostrarFormularioNuevoItem(false);
                            }}
                        />
                        <ButtonUI
                            text="Guardar grupo"
                            iconLeft="FaSave"
                            disabled={!currentGroup?.items?.length}
                            onClick={() => {
                                if (!currentGroup?.items?.length) {
                                    toast.error("No se puede guardar un grupo sin ítems. Agregue al menos un ítem.");
                                    return;
                                }
                                if (currentGroupId === ID_BORRADOR) {
                                    setGroups((prev) =>
                                        prev.map((g) => (g.id === ID_BORRADOR ? { ...g, id: `g-${Date.now()}` } : g))
                                    );
                                }
                                setCurrentGroupId(null);
                                setMostrarFormularioNuevoItem(false);
                                toast.success("Grupo guardado");
                            }}
                            pcolor={theme?.colors?.primary}
                        />
                    </div>
                ) : (
                    gruposGuardados.length > 0 && (
                        <ButtonUI text="Crear otro grupo" iconLeft="FaPlus" onClick={crearGrupo} variant="outlined" />
                    )
                )}
            </div>

            {gruposGuardados.length === 0 && !currentGroupId && (
                <div
                    style={{
                        padding: 20,
                        borderRadius: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.2 })}`,
                        backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.04 }),
                    }}
                >
                    <TextUI size="16px" weight="600" style={{ marginBottom: 4 }}>
                        Crear grupo de ingreso
                    </TextUI>
                    <TextUI size="13px" color={theme?.colors?.textSecondary} style={{ marginBottom: 12 }}>
                        Cree un grupo para comenzar a cargar ítems. Luego seleccione línea de negocio y empresa.
                    </TextUI>
                    <ButtonUI
                        text="Crear grupo de ingreso"
                        iconLeft="FaPlus"
                        onClick={crearGrupo}
                        pcolor={theme?.colors?.primary}
                    />
                </div>
            )}

            {currentGroup && (
                <div
                    style={{
                        padding: 20,
                        borderRadius: 8,
                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.2 })}`,
                        backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.04 }),
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    {!tieneLineaYEmpresa ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                            <div style={{ minWidth: 200 }}>
                                <SelectUI
                                    label="Línea de negocio"
                                    placeholder="Seleccionar línea"
                                    options={LINEAS_NEGOCIO}
                                    value={linea}
                                    onChange={(v) => { setLinea(v); setEmpresa(null); }}
                                    minWidth="200px"
                                />
                            </div>
                            <div style={{ minWidth: 200 }}>
                                <SelectUI
                                    label="Empresa"
                                    placeholder="Seleccionar empresa"
                                    options={EMPRESAS_POR_LINEA[linea?.value] || []}
                                    value={empresa}
                                    onChange={setEmpresa}
                                    minWidth="200px"
                                />
                            </div>
                            <ButtonUI text="Continuar" onClick={asignarLineaEmpresa} pcolor={theme?.colors?.primary} />
                        </div>
                    ) : (
                        <>
                            {mostrarFormulario && (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 12,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {currentGroup.items.length > 0 && (
                                                <CheckboxUI
                                                    id="select-all-items"
                                                    checked={selectedItemIds.size === currentGroup.items.length}
                                                    onChange={() => {
                                                        if (selectedItemIds.size === currentGroup.items.length) {
                                                            setSelectedItemIds(new Set());
                                                        } else {
                                                            setSelectedItemIds(new Set(currentGroup.items.map((i) => i.id)));
                                                        }
                                                    }}
                                                    style={{ flexShrink: 0 }}
                                                />
                                            )}
                                            <TextUI size="14px" weight="600">
                                                Lista de ítems ({currentGroup.items.length})
                                            </TextUI>
                                        </div>
                                        {currentGroup.items.length > 0 && (
                                            <ButtonUI
                                                text={selectedItemIds.size > 0 ? `Exportar ${selectedItemIds.size}` : "Exportar grupo"}
                                                iconLeft="FaFileLines"
                                                onClick={selectedItemIds.size > 0 ? exportarSeleccionados : exportarGrupo}
                                                pcolor={theme?.colors?.primary}
                                            />
                                        )}
                                    </div>

                                    <ul
                                        style={{
                                            listStyle: "none",
                                            padding: 0,
                                            margin: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 6,
                                        }}
                                    >
                                        {currentGroup.items.map((item) => (
                                            <li
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 12,
                                                    padding: "10px 12px",
                                                    minHeight: 40,
                                                    borderRadius: 8,
                                                    backgroundColor: selectedItemIds.has(item.id)
                                                        ? hexToRGBA({ hex: theme?.colors?.secondary, alpha: 0.12 })
                                                        : hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.05 }),
                                                    border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.12 })}`,
                                                }}
                                            >
                                                <CheckboxUI
                                                    id={item.id}
                                                    checked={selectedItemIds.has(item.id)}
                                                    onChange={() => toggleSeleccionItem(item.id)}
                                                    style={{ flexShrink: 0 }}
                                                />
                                                <TextUI size="13px" color={theme?.colors?.text} style={{ flex: 1, wordBreak: "break-word" }}>
                                                    {item.descripcionConVariables}
                                                </TextUI>
                                            </li>
                                        ))}
                                        {mostrarFormularioNuevoItem ? (
                                            <li
                                                style={{
                                                    padding: 16,
                                                    borderRadius: 8,
                                                    backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.06 }),
                                                    border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.2 })}`,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 12,
                                                }}
                                            >
                                                <TextUI size="14px" weight="600">
                                                    Nuevo ítem ({currentGroup?.linea})
                                                </TextUI>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                                                    {esLlantas && (<>
                                                        {config?.marcas && renderCampo("marcaLlanta", "Marca", { options: opcionesMarcaLlanta, value: marcaLlanta, onChange: setMarcaLlanta })}
                                                        {config?.categorias && (<>
                                                            {renderCampo("categoria", "Categoría", { options: opcionesCategoria, value: categoria, onChange: setCategoria, onChangeExtra: () => { setSegmento(null); setAplicacion(null); setEje(null); } })}
                                                            {renderCampo("segmento", "Segmento", { options: opcionesSegmento, value: segmento, onChange: setSegmento, onChangeExtra: () => { setAplicacion(null); setEje(null); } })}
                                                            {renderCampo("aplicacion", "Aplicación", { options: opcionesAplicacion, value: aplicacion, onChange: setAplicacion, onChangeExtra: () => { setEje(null); } })}
                                                            {renderCampo("eje", "Eje", { options: opcionesEje, value: eje, onChange: setEje })}
                                                        </>)}
                                                        {renderCampo("tipo", "Tipo", { placeholder: "Tipo", options: TIPOS_LLANTAS, value: tipo, onChange: setTipo, onChangeExtra: () => { setAncho(null); setAltura(null); } })}
                                                        {renderCampo("ancho", "Ancho", { options: opcionesAncho, value: ancho, onChange: setAncho })}
                                                        {tipo?.value !== "Decimal" && renderCampo("altura", "Altura/Serie", { options: opcionesAltura, value: altura, onChange: setAltura })}
                                                        {renderCampo("rin", "Rin", { options: opcionesRin, value: rin, onChange: setRin })}
                                                        {renderCampo("diseño", "Diseño", { tipoComp: "input", placeholder: "Alfanumérico", value: diseño, onChange: (v) => setDiseño(v.toUpperCase()) })}
                                                        {renderCampo("lona", "Lona/Robustez", { options: opcionesLona, value: lona, onChange: setLona })}
                                                        {renderCampo("carga", "Carga", { options: opcionesCarga, value: carga, onChange: setCarga })}
                                                        {renderCampo("velocidad", "Velocidad", { placeholder: "Letra", options: VELOCIDADES, value: velocidad, onChange: setVelocidad })}
                                                    </>)}
                                                    {esLubricantes && (<>
                                                        {renderCampo("marca", "Marca", { options: MARCAS_LUBRICANTES, value: marca, onChange: (v) => { setMarca(v); setFamilia(null); } })}
                                                        {renderCampo("familia", "Familia", { options: opcionesFamiliaLub, value: familia, onChange: setFamilia })}
                                                        {renderCampo("tipoLub", "Tipo", { tipoComp: "input", placeholder: "Caracteres alfanuméricos", value: tipoLub, onChange: (v) => setTipoLub(v.toUpperCase()) })}
                                                        {renderCampo("viscosidad", "Viscosidad", { tipoComp: "input", placeholder: "Ej: 5W30, 50", value: viscosidad, onChange: (v) => setViscosidad(v.toUpperCase().replace(/[^0-9W]/g, "")) })}
                                                        {renderCampo("empaqueLub", "Empaque", { options: OPCIONES_EMPAQUE, value: empaqueLub, onChange: setEmpaqueLub })}
                                                        {renderCampo("cantidadLub", "Cantidad", { tipoComp: "input", type: "number", inputMode: "numeric", placeholder: "Ej: 4", value: cantidadLub, onChange: (v) => setCantidadLub(v.replace(/\D/g, "")) })}
                                                        {renderCampo("unidadLub", "Unidad", { options: OPCIONES_UNIDAD_LUB, value: unidadLub, onChange: setUnidadLub })}
                                                    </>)}
                                                </div>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                    <ButtonUI
                                                        text="Cancelar"
                                                        variant="outlined"
                                                        onClick={() => { setMostrarFormularioNuevoItem(false); limpiarFormulario(); }}
                                                    />
                                                    <ButtonUI text="Agregar ítem" iconLeft="FaPlus" onClick={agregarItem} pcolor={theme?.colors?.secondary} />
                                                </div>
                                            </li>
                                        ) : (
                                            <li
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setMostrarFormularioNuevoItem(true)}
                                                onKeyDown={(e) => e.key === "Enter" && setMostrarFormularioNuevoItem(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 8,
                                                    padding: "14px 12px",
                                                    borderRadius: 8,
                                                    border: `2px dashed ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.4 })}`,
                                                    backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.03 }),
                                                    cursor: "pointer",
                                                    color: theme?.colors?.textSecondary,
                                                    fontSize: 13,
                                                }}
                                            >
                                                + Agregar ítem
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                        </>
                    )}
                </div>
            )}

            {gruposGuardados.length > 0 && !currentGroupId && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                    {gruposGuardados.map((g) => (
                        <li
                            key={g.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                minHeight: 36,
                                borderRadius: 6,
                                backgroundColor: g.id === currentGroupId ? hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.1 }) : "transparent",
                                border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.15 })}`,
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    color: theme?.colors?.text,
                                }}
                            >
                                {new Date(g.createdAt).toLocaleString("es-ES")} — {g.linea || "Sin línea"} / {g.empresa || "Sin empresa"} ({g.items?.length ?? 0} ítems)
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <ButtonUI
                                    text="Editar"
                                    variant="outlined"
                                    onClick={() => setCurrentGroupId(g.id)}
                                    style={{ padding: "4px 8px", minWidth: "auto", fontSize: 11 }}
                                />
                                <ButtonUI
                                    text="Eliminar"
                                    variant="outlined"
                                    onClick={() => eliminarGrupo(g.id)}
                                    style={{ padding: "4px 8px", minWidth: "auto", fontSize: 11 }}
                                    pcolor={theme?.colors?.error || "#dc3545"}
                                />
                                <ButtonUI
                                    text="Exportar TXT"
                                    onClick={() => {
                                        if (!g.items?.length) {
                                            toast.error("El grupo no tiene ítems");
                                            return;
                                        }
                                        const fecha = new Date(g.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }).replace(/[/:]/g, "-");
                                        exportarItemsATxt(g.items, `MDM_SAP_${fecha}.txt`);
                                        toast.success("Grupo exportado");
                                    }}
                                    style={{ padding: "4px 8px", minWidth: "auto", fontSize: 11 }}
                                    pcolor={theme?.colors?.primary}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
