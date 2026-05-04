import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";
import { parseLlantas, uploadToCloudflare } from "services/mdmService";

const LINEAS_NEGOCIO = [
    { value: "LLANTAS", label: "LLANTAS" },
    { value: "LUBRICANTES", label: "LUBRICANTES" },
    { value: "HERRAMIENTAS", label: "HERRAMIENTAS" },
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
    descripcionHerramienta: "Descripción",
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
    LUBRICANTES: {
        formType: "lubricantes",
    },
    HERRAMIENTAS: {
        formType: "herramientas",
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


export default function MDM_Crud() {
    const { theme } = useTheme();
    const { user } = useAuthContext();
    const isDark = theme?.name === 'dark';

    const handleNumericInput = (value) => value.replace(/[^0-9]/g, "");
    const handleDecimalInput = (value) => {
        let val = value.replace(/[^0-9.]/g, "");
        if (val.startsWith(".")) val = "0" + val;
        const parts = val.split(".");
        if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
        return val;
    };

    const handleRinSerieAncho = (value) => {
        let v = value.replace(/[^0-9.]/g, "");
        if (v.startsWith(".")) v = "0" + v;
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 2) v = parts[0] + "." + parts[1].substring(0, 2);
        return v;
    };

    const handleCargaInput = (value) => {
        let v = value.replace(/[^0-9/]/g, "");
        if (v.includes("/")) {
            const parts = v.split("/");
            const before = parts[0];
            if (before.length < 2) return before;
            return before + "/" + parts.slice(1).join("").replace(/\//g, "");
        }
        return v;
    };

    const handleVelocidadInput = (value) => value.replace(/[^A-Za-z]/g, "").substring(0, 1).toUpperCase();

    const DICCIONARIO_ROLES = {
        1: 'Comercial', //Jefatura
        3: 'Tecnico', //Supervisor
        4: 'Marketing', //Coordinadora
        5: 'Compras'//Usuario
    };

    const DICCIONARIO_LINEAS = {
        3: 'LLANTAS',
        4: 'LUBRICANTES',
        9: 'HERRAMIENTAS',
        18: 'LLANTAS MOTO'
    };

    let rolPrincipal = null;
    let idRolPrincipal = null;
    let opcionesLineasPermitidas = [];
    let opcionesEmpresasPermitidas = [];

    const DICCIONARIO_EMPRESAS = {
        1: 'AUTOLLANTA',
        2: 'MAXXIMUNDO',
        3: 'STOX',
        4: 'IKONIX'
    };

    if (user?.CONTEXTOS && Array.isArray(user.CONTEXTOS)) {
        const contextoMDM = user.CONTEXTOS.find(ctx => ctx.RECURSO === 'mdm.crud');
        if (contextoMDM && contextoMDM.ID_ROL) {
            const nombreRol = DICCIONARIO_ROLES[contextoMDM.ID_ROL];
            if (nombreRol) {
                rolPrincipal = nombreRol;
                idRolPrincipal = contextoMDM.ID_ROL;
            }
            if (contextoMDM.ALCANCE && Array.isArray(contextoMDM.ALCANCE.LINEAS)) {
                opcionesLineasPermitidas = contextoMDM.ALCANCE.LINEAS
                    .map(codigo => DICCIONARIO_LINEAS[codigo])
                    .filter(Boolean)
                    .map(nombre => ({ value: nombre, label: nombre }));
            }
            if (contextoMDM.ALCANCE && Array.isArray(contextoMDM.ALCANCE.EMPRESAS)) {
                opcionesEmpresasPermitidas = contextoMDM.ALCANCE.EMPRESAS
                    .map(id => ({ value: id, label: DICCIONARIO_EMPRESAS[id] }))
                    .filter(opt => opt.label);
            }
        }
    }

    const [items, setItems] = useState([]);
    const [selectedItemIds, setSelectedItemIds] = useState(new Set());
    const [currentItemIndex, setCurrentItemIndex] = useState(0); // Para visualización Rol 1
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectTargetRoles, setRejectTargetRoles] = useState(new Set());
    const [rejectObservations, setRejectObservations] = useState({});
    const [itemToReject, setItemToReject] = useState(null);
    const [isViewReasonModalOpen, setIsViewReasonModalOpen] = useState(false);
    const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [itemsToReview, setItemsToReview] = useState([]);
    const [selectedItemsToReviewIds, setSelectedItemsToReviewIds] = useState(new Set());

    // Selector global para el nuevo ítem
    const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
    const esLlantas = lineaSeleccionada?.value === "LLANTAS" || lineaSeleccionada?.value === "LLANTAS MOTO";
    const esLubricantes = lineaSeleccionada?.value === "LUBRICANTES";
    const esHerramientas = lineaSeleccionada?.value === "HERRAMIENTAS";

    useEffect(() => {
        const fetchLlantas = async () => {
            if (idRolPrincipal === 3 && lineaSeleccionada) {
                try {
                    const data = await parseLlantas([
                        "MAXXIS LT265/70 R-17 MT754 6PR 112/109Q OWL"
                    ]);

                    if (data && data.length > 0) {
                        const parsedItems = data.map((itemData, index) => {
                            let nomenclaturaMap = "";
                            if (itemData.tipo_medida === "MILIMETRICA") nomenclaturaMap = "Milimetrica";
                            else if (itemData.tipo_medida === "AMERICANA") nomenclaturaMap = "Americana";
                            else if (itemData.tipo_medida === "DECIMAL") nomenclaturaMap = "Decimal";

                            return {
                                id: `item-parsed-${index}-${Date.now()}`,
                                linea: lineaSeleccionada.value,
                                descripcion: itemData.descripcion_original,
                                diseño: itemData.diseno,
                                rin: itemData.rin,
                                serie: itemData.serie,
                                lonas: itemData.lonas,
                                ancho: itemData.ancho,
                                nomenclatura: nomenclaturaMap,
                                carga: itemData.carga,
                                velocidad: itemData.velocidad,
                            };
                        });
                        setItems(parsedItems);
                    }
                } catch (error) {
                    console.error("Error al obtener parse-llantas:", error);
                    toast.error("Error al cargar la información de llantas.");
                }
            }

            if (idRolPrincipal === 4 && lineaSeleccionada) {
                try {
                    // Simulación de endpoint para rol 4 (Coordinadora)
                    // Los items llegarán en un endpoint con descripcion, codigo, diseño y marca
                    const data = [
                    ];

                    if (data && data.length > 0) {
                        const parsedItems = data.map((itemData, index) => {
                            const cleanMarca = itemData.marca ? itemData.marca.toLowerCase().replace(/\s+/g, '') : "marca";
                            const cleanDiseno = itemData.diseño ? itemData.diseño.toLowerCase().replace(/\s+/g, '') : "diseno";
                            return {
                                id: `item-rol4-${index}-${Date.now()}`,
                                linea: lineaSeleccionada.value,
                                descripcion: itemData.descripcion,
                                codigo: itemData.codigo,
                                diseño: itemData.diseño,
                                marca: itemData.marca,
                                imagenPng: null,
                                imagenWebp: null,
                                pathWebp: `/imagenesautomax/${cleanMarca}/${cleanDiseno}.webp`
                            };
                        });
                        setItems(parsedItems);
                    }
                } catch (error) {
                    console.error("Error al obtener items para rol 4:", error);
                    toast.error("Error al cargar la información para rol 4.");
                }
            }
            if (idRolPrincipal === 1 && lineaSeleccionada) {
                try {
                    // Mock de endpoint para rol 1 (Aprobador Final)
                    const data = [
                        {
                            descripcion: "LLANTA MAXXIS 205/55R16 MT754",
                            diseño: "MT754",
                            marca: "MAXXIS",
                            partidaArancelaria: "4011.10.10.00",
                            medida: "205/55R16",
                            robustez: "Normal",
                            rin: "16",
                            serie: "55",
                            lonas: "6",
                            ancho: "205",
                            nomenclatura: "Milimetrica",
                            carga: "91",
                            velocidad: "V",
                            categoria: "Auto",
                            segmento: "Pasajero",
                            aplicacion: "HT",
                            eje: "Ambos",
                            idEmpresa: 1,
                            codigo: "1000123",
                            codigoSap: "5000123",
                            codigoProveedor: "MAXX-882",
                            cubicaje: "0.085",
                            nombreExtranjero: "MAXXIS RADIAL TIRE",
                            imagenUrl: "https://via.placeholder.com/400x400.png?text=Llanta+MAXXIS"
                        },
                        {
                            descripcion: "LLANTA APLUS 195/65R15 A607",
                            diseño: "A607",
                            marca: "APLUS",
                            partidaArancelaria: "4011.20.10.00",
                            medida: "195/65R15",
                            robustez: "Reforzada",
                            rin: "15",
                            serie: "65",
                            lonas: "8",
                            ancho: "195",
                            nomenclatura: "Milimetrica",
                            carga: "95",
                            velocidad: "H",
                            categoria: "Auto",
                            segmento: "Pasajero",
                            aplicacion: "AT",
                            eje: "Ambos",
                            idEmpresa: 2,
                            codigo: "1000567",
                            codigoSap: "5000567",
                            codigoProveedor: "APL-771",
                            cubicaje: "0.072",
                            nombreExtranjero: "APLUS COMFORT TIRE",
                            imagenUrl: "https://via.placeholder.com/400x400.png?text=Llanta+APLUS"
                        }
                    ];
                    const parsedItems = data.map((d, index) => ({
                        id: `item-rol1-${index}-${Date.now()}`,
                        linea: lineaSeleccionada.value,
                        ...d
                    }));
                    setItems(parsedItems);
                    setCurrentItemIndex(0);
                } catch (error) {
                    console.error("Error al obtener items para rol 1:", error);
                }
            }
            if (idRolPrincipal === 5 && lineaSeleccionada) {
                // Mock para rol 5 (Usuario)
                const data = [
                    {
                        id: `item-rech-1-${Date.now()}`,
                        linea: lineaSeleccionada.value,
                        codigo: "1000888",
                        codigoSap: "5000123",
                        marca: "TOYO",
                        diseño: "PROXES",
                        descripcionRol5: "LLANTA TOYO 225/45R17",
                        codigoProveedor: "TOYO-123",
                        cubicaje: "0.095",
                        nombreExtranjero: "TOYO PROXES T1R",
                        partidaArancelaria: "4011.10.10.00",
                        fueRechazado: true,
                        motivoRechazo: "La descripción comercial no cumple con el formato estándar. Por favor incluir el índice de carga y código de velocidad."
                    },
                    {
                        id: `item-norm-1-${Date.now()}`,
                        linea: lineaSeleccionada.value,
                        codigo: "1000999",
                        codigoSap: "5000456",
                        marca: "BRIDGESTONE",
                        diseño: "TURANZA",
                        descripcionRol5: "LLANTA BRIDGESTONE 205/55R16",
                        codigoProveedor: "BS-456",
                        cubicaje: "0.082",
                        nombreExtranjero: "BRIDGESTONE TURANZA T005",
                        partidaArancelaria: "4011.10.10.00",
                        fueRechazado: false
                    }
                ];
                setItems(data);
            }
        };

        fetchLlantas();
    }, [lineaSeleccionada, idRolPrincipal]);



    const eliminarItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleActionRol1 = (itemId) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
        setCurrentItemIndex(prev => {
            const currentLineItems = items.filter(i => i.linea === lineaSeleccionada?.value);
            if (prev >= currentLineItems.length - 1) {
                return Math.max(0, currentLineItems.length - 2);
            }
            return prev;
        });
    };

    const actualizarCampoFila = (id, campo, valor) => {
        let val = typeof valor === 'string' ? valor.toUpperCase() : valor;
        if (idRolPrincipal === 5) {
            if (campo === "codigoSap") {
                val = valor.replace(/[^0-9]/g, "");
            } else if (campo === "cubicaje") {
                val = valor.replace(/[^0-9.]/g, "");
                if (val.startsWith(".")) val = "0" + val;
                const parts = val.split(".");
                if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
            }
        } else if (idRolPrincipal === 3) {
            if (["rin", "serie", "ancho"].includes(campo)) {
                val = handleRinSerieAncho(valor);
            } else if (campo === "lonas") {
                val = handleNumericInput(valor);
            } else if (campo === "carga") {
                val = handleCargaInput(valor);
            } else if (campo === "velocidad") {
                val = handleVelocidadInput(valor);
            }
        }
        setItems(prev => prev.map(it => it.id === id ? { ...it, [campo]: val } : it));
    };

    if (!rolPrincipal) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: theme?.colors?.error || "#dc3545", fontWeight: "600", fontSize: "16px" }}>
                No tiene acceso a este recurso.
            </div>
        );
    }

    return (
        <div style={{ padding: 20, gap: 16, overflow: "auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <SelectUI
                        placeholder="Línea de negocio"
                        options={opcionesLineasPermitidas.length > 0 ? opcionesLineasPermitidas : LINEAS_NEGOCIO}
                        value={lineaSeleccionada}
                        onChange={(v) => {
                            setLineaSeleccionada(v);
                        }}
                        minWidth="200px"
                    />
                    {idRolPrincipal === 1 && (
                        <ButtonUI
                            text="Revisar Items"
                            iconLeft="FaSearch"
                            variant="primary"
                            disabled={!lineaSeleccionada}
                            onClick={() => {
                                // Mock data for items to review
                                setItemsToReview([
                                    { id: 'ext-1', descripcion: 'LLANTA PIRELLI 225/45R17 P7', marca: 'PIRELLI', diseño: 'P7' },
                                    { id: 'ext-2', descripcion: 'LLANTA MICHELIN 205/55R16 PS4', marca: 'MICHELIN', diseño: 'PILOT SPORT 4' },
                                    { id: 'ext-3', descripcion: 'LLANTA CONTINENTAL 215/60R16 UC6', marca: 'CONTINENTAL', diseño: 'UC6' }
                                ]);
                                setIsReviewModalOpen(true);
                            }}
                        />
                    )}
                    {idRolPrincipal !== 1 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                        <ButtonUI
                            text="Agregar ítem"
                            iconLeft="FaPlus"
                            disabled={!lineaSeleccionada}
                            onClick={() => {
                                setItems(prev => [...prev, {
                                    id: Date.now(),
                                    linea: lineaSeleccionada.value
                                }]);
                            }}
                            pcolor={theme?.colors?.primary}
                        />
                    )}
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TextUI size="14px" weight="600">
                        Ítems {lineaSeleccionada ? `de ${lineaSeleccionada.label}` : ""} ({items.filter(i => lineaSeleccionada ? i.linea === lineaSeleccionada.value : true).length})
                    </TextUI>
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {!lineaSeleccionada ? (
                        <div style={{ padding: "40px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                            Seleccione una línea de negocio para ver y agregar ítems
                        </div>
                    ) : (() => {
                        const itemsFiltrados = items.filter(i => i.linea === lineaSeleccionada.value);

                        if (idRolPrincipal === 1) {
                            if (itemsFiltrados.length === 0) {
                                return (
                                    <div style={{ padding: "40px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                        No hay ítems pendientes de revisión
                                    </div>
                                );
                            }

                            const item = itemsFiltrados[currentItemIndex];
                            if (!item) return null;


                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '24px', flex: 1, overflow: 'auto' }}>
                                        <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ backgroundColor: theme?.colors?.backgroundCard || '#fafafa', padding: '20px', borderRadius: '8px', border: `1px solid ${theme?.colors?.border || '#eee'}`, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
                                                {item.imagenUrl ? (
                                                    <img src={item.imagenUrl} alt={item.descripcion} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                                                ) : (
                                                    <TextUI color={theme?.colors?.textSecondary}>Sin Imagen</TextUI>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ borderBottom: `1px solid ${theme?.colors?.border || '#eee'}`, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <TextUI size="20px" weight="600">{item.descripcion}</TextUI>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <TextUI size="10px" weight="600" color={theme?.colors?.textSecondary} style={{ textTransform: 'uppercase', marginBottom: '2px' }}>Leyenda de Roles</TextUI>
                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#7c2d12' : '#e3f2fd', border: `1px solid ${isDark ? '#9a3412' : '#bfdbfe'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[3]}</TextUI>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#1f2937' : '#fff3e0', border: `1px solid ${isDark ? '#374151' : '#fde68a'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[4]}</TextUI>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: isDark ? '#172554' : '#e8f5e9', border: `1px solid ${isDark ? '#1e3a8a' : '#a7f3d0'}` }}></div>
                                                            <TextUI size="10px" style={{ textTransform: 'capitalize' }}>{DICCIONARIO_ROLES[5]}</TextUI>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', overflow: 'auto', paddingRight: '8px' }}>
                                                {Object.entries(item).filter(([k, v]) => !['id', 'linea', 'imagenUrl', 'descripcion'].includes(k)).map(([key, value]) => {
                                                    const role3Fields = ['medida', 'diseño', 'marca', 'rin', 'serie', 'lonas', 'ancho', 'nomenclatura', 'carga', 'velocidad', 'categoria', 'segmento', 'aplicacion', 'eje', 'robustez'];
                                                    const role5Fields = ['idEmpresa', 'codigo', 'codigoSap', 'descripcionRol5', 'codigoProveedor', 'cubicaje', 'nombreExtranjero', 'partidaArancelaria'];

                                                    let bgColor = isDark ? '#111827' : '#fafafa';
                                                    let borderColor = isDark ? '#1f2937' : '#eee';

                                                    if (role3Fields.includes(key)) {
                                                        bgColor = isDark ? '#7c2d12' : '#e3f2fd'; // Anaranjado oscuro / Azul claro
                                                        borderColor = isDark ? '#9a3412' : '#bfdbfe';
                                                    } else if (role5Fields.includes(key)) {
                                                        bgColor = isDark ? '#172554' : '#e8f5e9'; // Azul marino / Verde claro
                                                        borderColor = isDark ? '#1e3a8a' : '#a7f3d0';
                                                    } else {
                                                        bgColor = isDark ? '#1f2937' : '#fff3e0'; // Gris oscuro / Naranja claro
                                                        borderColor = isDark ? '#374151' : '#fde68a';
                                                    }

                                                    const labels = {
                                                        idEmpresa: "Empresa",
                                                        codigo: "Código Barras",
                                                        codigoSap: "Código SAP",
                                                        diseño: "Diseño",
                                                        marca: "Marca",
                                                        medida: "Medida",
                                                        rin: "Rin",
                                                        serie: "Serie",
                                                        lonas: "Lonas",
                                                        ancho: "Ancho",
                                                        nomenclatura: "Nomenclatura",
                                                        carga: "Carga",
                                                        velocidad: "Velocidad",
                                                        categoria: "Categoría",
                                                        segmento: "Segmento",
                                                        aplicacion: "Aplicación",
                                                        eje: "Eje",
                                                        robustez: "Robustez",
                                                        partidaArancelaria: "Posición Arancelaria",
                                                        codigoProveedor: "Cód. Proveedor",
                                                        cubicaje: "Cubicaje",
                                                        nombreExtranjero: "Nombre Extranjero",
                                                        descripcionRol5: "Desc. Comercial"
                                                    };

                                                    return (
                                                        <div key={key} style={{
                                                            backgroundColor: bgColor,
                                                            padding: '12px',
                                                            borderRadius: '6px',
                                                            border: `1px solid ${borderColor}`,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '6px'
                                                        }}>
                                                            <TextUI size="11px" color={isDark ? '#cbd5e1' : theme?.colors?.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{labels[key] || key}</TextUI>
                                                            <TextUI size="14px" weight="600" color={isDark ? '#ffffff' : theme?.colors?.text}>
                                                                {key === 'idEmpresa' ? (DICCIONARIO_EMPRESAS[value] || value || '-') : (value || '-')}
                                                            </TextUI>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: theme?.colors?.backgroundCard || '#fafafa', borderRadius: '8px', border: `1px solid ${theme?.colors?.border || '#eee'}` }}>
                                        <ButtonUI
                                            text="Rechazar"
                                            iconLeft="FaTimes"
                                            variant="outlined"
                                            pcolor={theme?.colors?.error || '#dc3545'}
                                            onClick={() => {
                                                setItemToReject(item);
                                                setIsRejectModalOpen(true);
                                            }}
                                        />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <ButtonUI
                                                text="Anterior ítem"
                                                iconLeft="FaChevronLeft"
                                                variant="outlined"
                                                disabled={currentItemIndex <= 0}
                                                onClick={() => setCurrentItemIndex(prev => prev - 1)}
                                            />
                                            <TextUI size="13px" weight="500" color={theme?.colors?.textSecondary}>
                                                Ítem {currentItemIndex + 1} de {itemsFiltrados.length}
                                            </TextUI>
                                            <ButtonUI
                                                text="Siguiente ítem"
                                                iconRight="FaChevronRight"
                                                variant="outlined"
                                                disabled={currentItemIndex >= itemsFiltrados.length - 1}
                                                onClick={() => setCurrentItemIndex(prev => prev + 1)}
                                            />
                                        </div>
                                        <ButtonUI
                                            text="Aceptar"
                                            iconLeft="FaCheck"
                                            pcolor={theme?.colors?.success || '#28a745'}
                                            onClick={() => {
                                                toast.success(`Ítem ${item.codigo || item.diseño} aceptado exitosamente`);
                                                handleActionRol1(item.id);
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        if (esLlantas) {
                            return (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead style={{ backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.05 }), position: "sticky", top: 0 }}>
                                        <tr>
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}>
                                                <CheckboxUI
                                                    checked={itemsFiltrados.length > 0 && itemsFiltrados.every(i => selectedItemIds.has(i.id))}
                                                    onChange={(_, checked) => {
                                                        if (checked) {
                                                            setSelectedItemIds(new Set([...selectedItemIds, ...itemsFiltrados.map(i => i.id)]));
                                                        } else {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                itemsFiltrados.forEach(i => newSet.delete(i.id));
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </th>
                                            {idRolPrincipal !== 5 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Posición Arancelaria</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Medida</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Robustez</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 3 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "400px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Rin</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Serie</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Lonas</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Ancho</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px" }}>Nomenclatura</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Carga</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px" }}>Velocidad</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px" }}>Categoría</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px" }}>Segmento</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px" }}>Aplicación</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px" }}>Eje</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 4 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "250px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Imagen PNG</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Imagen WebP</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 3 ? 15 : (idRolPrincipal === 5 ? 11 : (idRolPrincipal === 4 ? 8 : 8))} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Llantas
                                                </td>
                                            </tr>
                                        ) : itemsFiltrados.map(item => (
                                            <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                                    <CheckboxUI
                                                        checked={selectedItemIds.has(item.id)}
                                                        onChange={(_, checked) => {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                if (checked) newSet.add(item.id);
                                                                else newSet.delete(item.id);
                                                                return newSet;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                                {idRolPrincipal !== 5 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.marcaRef || ""} onChange={(v) => actualizarCampoFila(item.id, "marcaRef", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.partidaArancelaria || ""} onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.medida || ""} onChange={(v) => actualizarCampoFila(item.id, "medida", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.robustez || ""} onChange={(v) => actualizarCampoFila(item.id, "robustez", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 3 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                MAXXIS LT265/70 R-17 MT754 6PR 112/109Q OWL


                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.rin || ""} formatValue={handleRinSerieAncho} onChange={(v) => actualizarCampoFila(item.id, "rin", handleRinSerieAncho(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.serie || ""} formatValue={handleRinSerieAncho} onChange={(v) => actualizarCampoFila(item.id, "serie", handleRinSerieAncho(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.lonas || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "lonas", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.ancho || ""} formatValue={handleRinSerieAncho} onChange={(v) => actualizarCampoFila(item.id, "ancho", handleRinSerieAncho(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={TIPOS_LLANTAS}
                                                                value={item.nomenclatura ? { value: item.nomenclatura, label: item.nomenclatura } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "nomenclatura", v?.value)}
                                                                minWidth="120px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.carga || ""} formatValue={handleCargaInput} onChange={(v) => actualizarCampoFila(item.id, "carga", handleCargaInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.velocidad || ""} formatValue={handleVelocidadInput} onChange={(v) => actualizarCampoFila(item.id, "velocidad", handleVelocidadInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={Object.keys(CATEGORIAS_LLANTAS).map(k => ({ value: k, label: k }))}
                                                                value={item.categoria ? { value: item.categoria, label: item.categoria } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "categoria", v?.value);
                                                                    actualizarCampoFila(item.id, "segmento", "");
                                                                    actualizarCampoFila(item.id, "aplicacion", "");
                                                                    actualizarCampoFila(item.id, "eje", "");
                                                                }}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={item.categoria && CATEGORIAS_LLANTAS[item.categoria]?.segmentos ? Object.keys(CATEGORIAS_LLANTAS[item.categoria].segmentos).map(k => ({ value: k, label: k })) : []}
                                                                value={item.segmento ? { value: item.segmento, label: item.segmento } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "segmento", v?.value);
                                                                    actualizarCampoFila(item.id, "aplicacion", "");
                                                                    actualizarCampoFila(item.id, "eje", "");
                                                                }}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                disabled={!item.categoria}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={item.categoria && item.segmento && CATEGORIAS_LLANTAS[item.categoria]?.segmentos?.[item.segmento]?.aplicaciones ? Object.keys(CATEGORIAS_LLANTAS[item.categoria].segmentos[item.segmento].aplicaciones).map(k => ({ value: k, label: k })) : []}
                                                                value={item.aplicacion ? { value: item.aplicacion, label: item.aplicacion } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "aplicacion", v?.value);
                                                                    actualizarCampoFila(item.id, "eje", "");
                                                                }}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                disabled={!item.segmento}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={item.categoria && item.segmento && item.aplicacion && CATEGORIAS_LLANTAS[item.categoria]?.segmentos?.[item.segmento]?.aplicaciones?.[item.aplicacion] ? CATEGORIAS_LLANTAS[item.categoria].segmentos[item.segmento].aplicaciones[item.aplicacion].map(k => ({ value: k, label: k })) : []}
                                                                value={item.eje ? { value: item.eje, label: item.eje } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "eje", v?.value)}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                disabled={!item.aplicacion}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 4 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap" }}>
                                                                {item.codigo || "-"}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap" }}>
                                                                {item.marca || "-"}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap" }}>
                                                                {item.diseño || "-"}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {item.descripcion || "-"}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                                <label style={{
                                                                    cursor: 'pointer',
                                                                    border: `1px solid ${theme?.colors?.border || '#ccc'}`,
                                                                    backgroundColor: theme?.colors?.background || '#fff',
                                                                    color: theme?.colors?.text || '#333',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    Elegir archivo
                                                                    <input
                                                                        type="file"
                                                                        accept=".png"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) actualizarCampoFila(item.id, "imagenPng", file);
                                                                        }}
                                                                        style={{ display: "none" }}
                                                                    />
                                                                </label>
                                                                <span style={{ fontSize: "10px", color: theme?.colors?.textSecondary || "#666", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", title: item.imagenPng?.name }}>
                                                                    {item.imagenPng ? item.imagenPng.name : "Sin archivos seleccionados"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                                                <label style={{
                                                                    cursor: 'pointer',
                                                                    border: `1px solid ${theme?.colors?.border || '#ccc'}`,
                                                                    backgroundColor: theme?.colors?.background || '#fff',
                                                                    color: theme?.colors?.text || '#333',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    Elegir archivo
                                                                    <input
                                                                        type="file"
                                                                        accept=".webp"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) actualizarCampoFila(item.id, "imagenWebp", file);
                                                                        }}
                                                                        style={{ display: "none" }}
                                                                    />
                                                                </label>
                                                                <span style={{ fontSize: "10px", color: theme?.colors?.textSecondary || "#666", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", title: item.imagenWebp?.name }}>
                                                                    {item.imagenWebp ? item.imagenWebp.name : "Sin archivos seleccionados"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: DICCIONARIO_EMPRESAS[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoSap || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "codigoSap", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.marca || ""} onChange={(v) => actualizarCampoFila(item.id, "marca", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={
                                                                    lineaSeleccionada?.value === "LLANTAS MOTO"
                                                                        ? [{ value: "4011.40.00.00", label: "4011.40.00.00" }]
                                                                        : [
                                                                            { value: "4011.20.10.00", label: "4011.20.10.00" },
                                                                            { value: "4011.20.90.00", label: "4011.20.90.00" },
                                                                            { value: "4011.10.10.00", label: "4011.10.10.00" },
                                                                            { value: "4011.80.00.12", label: "4011.80.00.12" },
                                                                            { value: "4011.10.90.00", label: "4011.10.90.00" },
                                                                        ]
                                                                }
                                                                value={item.partidaArancelaria ? { value: item.partidaArancelaria, label: item.partidaArancelaria } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v?.value)}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    {idRolPrincipal === 5 && item.fueRechazado ? (
                                                        <ButtonUI
                                                            text="Motivo Rechazo"
                                                            variant="outlined"
                                                            pcolor={theme?.colors?.warning || "#ffc107"}
                                                            style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                            onClick={() => {
                                                                setSelectedRejectionReason(item.motivoRechazo);
                                                                setIsViewReasonModalOpen(true);
                                                            }}
                                                        />
                                                    ) : idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                        <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        } else if (esLubricantes) {
                            return (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead style={{ backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.05 }), position: "sticky", top: 0 }}>
                                        <tr>
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}>
                                                <CheckboxUI
                                                    checked={itemsFiltrados.length > 0 && itemsFiltrados.every(i => selectedItemIds.has(i.id))}
                                                    onChange={(_, checked) => {
                                                        if (checked) {
                                                            setSelectedItemIds(new Set([...selectedItemIds, ...itemsFiltrados.map(i => i.id)]));
                                                        } else {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                itemsFiltrados.forEach(i => newSet.delete(i.id));
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </th>
                                            {idRolPrincipal !== 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca/Familia</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Tipo</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Viscosidad</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Presentación</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cód. Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                </>
                                            )}
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 5 ? 10 : 7} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Lubricantes
                                                </td>
                                            </tr>
                                        ) : itemsFiltrados.map(item => (
                                            <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                                    <CheckboxUI
                                                        checked={selectedItemIds.has(item.id)}
                                                        onChange={(_, checked) => {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                if (checked) newSet.add(item.id);
                                                                else newSet.delete(item.id);
                                                                return newSet;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                                {idRolPrincipal !== 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.marca || ""} onChange={(v) => actualizarCampoFila(item.id, "marca", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.tipoLub || ""} onChange={(v) => actualizarCampoFila(item.id, "tipoLub", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.viscosidad || ""} onChange={(v) => actualizarCampoFila(item.id, "viscosidad", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.presentacion || ""} onChange={(v) => actualizarCampoFila(item.id, "presentacion", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: DICCIONARIO_EMPRESAS[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoSap || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "codigoSap", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={[
                                                                    { value: "4011.20.10.00", label: "4011.20.10.00" },
                                                                    { value: "4011.20.90.00", label: "4011.20.90.00" },
                                                                    { value: "4011.10.10.00", label: "4011.10.10.00" },
                                                                    { value: "4011.80.00.12", label: "4011.80.00.12" },
                                                                    { value: "4011.10.90.00", label: "4011.10.90.00" },

                                                                ]}
                                                                value={item.partidaArancelaria ? { value: item.partidaArancelaria, label: item.partidaArancelaria } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v?.value)}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    {idRolPrincipal === 5 && item.fueRechazado ? (
                                                        <ButtonUI
                                                            text="Motivo de rechazo"
                                                            variant="outlined"
                                                            pcolor={theme?.colors?.warning || "#ffc107"}
                                                            style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                            onClick={() => {
                                                                setSelectedRejectionReason(item.motivoRechazo);
                                                                setIsViewReasonModalOpen(true);
                                                            }}
                                                        />
                                                    ) : (
                                                        <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        } else if (esHerramientas) {
                            return (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead style={{ backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.05 }), position: "sticky", top: 0 }}>
                                        <tr>
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}>
                                                <CheckboxUI
                                                    checked={itemsFiltrados.length > 0 && itemsFiltrados.every(i => selectedItemIds.has(i.id))}
                                                    onChange={(_, checked) => {
                                                        if (checked) {
                                                            setSelectedItemIds(new Set([...selectedItemIds, ...itemsFiltrados.map(i => i.id)]));
                                                        } else {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                itemsFiltrados.forEach(i => newSet.delete(i.id));
                                                                return newSet;
                                                            });
                                                        }
                                                    }}
                                                />
                                            </th>
                                            {idRolPrincipal !== 5 && (
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cód. Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                </>
                                            )}
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 5 ? 10 : 3} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Herramientas
                                                </td>
                                            </tr>
                                        ) : itemsFiltrados.map(item => (
                                            <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                                    <CheckboxUI
                                                        checked={selectedItemIds.has(item.id)}
                                                        onChange={(_, checked) => {
                                                            setSelectedItemIds(prev => {
                                                                const newSet = new Set(prev);
                                                                if (checked) newSet.add(item.id);
                                                                else newSet.delete(item.id);
                                                                return newSet;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                                {idRolPrincipal !== 5 && (
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></td>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: DICCIONARIO_EMPRESAS[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoSap || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "codigoSap", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={[
                                                                    { value: "4011.20.10.00", label: "4011.20.10.00" },
                                                                    { value: "4011.20.90.00", label: "4011.20.90.00" },
                                                                    { value: "4011.10.10.00", label: "4011.10.10.00" },
                                                                    { value: "4011.80.00.12", label: "4011.80.00.12" },
                                                                    { value: "4011.10.90.00", label: "4011.10.90.00" },

                                                                ]}
                                                                value={item.partidaArancelaria ? { value: item.partidaArancelaria, label: item.partidaArancelaria } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v?.value)}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                    {idRolPrincipal === 5 && item.fueRechazado ? (
                                                        <ButtonUI
                                                            text="Motivo de rechazo"
                                                            variant="outlined"
                                                            pcolor={theme?.colors?.warning || "#ffc107"}
                                                            style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                            onClick={() => {
                                                                setSelectedRejectionReason(item.motivoRechazo);
                                                                setIsViewReasonModalOpen(true);
                                                            }}
                                                        />
                                                    ) : (
                                                        <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        }
                        return null;
                    })()}
                </div>
                {lineaSeleccionada && idRolPrincipal !== 1 && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "flex-end" }}>
                        <ButtonUI
                            text="Enviar a revisión"
                            iconLeft="FaCheck"
                            disabled={items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id)).length === 0}
                            onClick={async () => {
                                const currentItems = items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id));

                                if (currentItems.length === 0) return;

                                // Subida a Cloudflare para Rol 4 antes de enviar
                                if (idRolPrincipal === 4) {
                                    let uploadedCount = 0;
                                    for (const item of currentItems) {
                                        if (item.imagenWebp) {
                                            try {
                                                const cleanMarca = item.marca ? item.marca.toLowerCase().replace(/\s+/g, '') : "marca";
                                                const cleanDiseno = item.diseño ? item.diseño.toLowerCase().replace(/\s+/g, '') : "diseno";
                                                await uploadToCloudflare(item.imagenWebp, cleanMarca, cleanDiseno);
                                                uploadedCount++;
                                            } catch (error) {
                                                toast.error(`Error al subir imagen WebP del diseño ${item.diseño} a Cloudflare.`);
                                            }
                                        }
                                    }
                                    if (uploadedCount > 0) {
                                        toast.success(`Se subieron ${uploadedCount} imágenes WebP a Cloudflare.`);
                                    }
                                }

                                const cantidad = currentItems.length;
                                toast.success(`Se enviaron a revisión ${cantidad} ítems seleccionados de ${lineaSeleccionada.label}`);

                                setItems(prev => prev.filter(i => !(i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id))));
                                setSelectedItemIds(prev => {
                                    const newSet = new Set(prev);
                                    currentItems.forEach(i => newSet.delete(i.id));
                                    return newSet;
                                });
                            }}
                            pcolor={theme?.colors?.primary}
                        />
                    </div>
                )}
            </div>

            <ModalUI
                isOpen={isRejectModalOpen}
                onClose={() => {
                    setIsRejectModalOpen(false);
                    setRejectTargetRoles(new Set());
                    setItemToReject(null);
                }}
                title="Rechazar Ítem"
                saveText="Confirmar Rechazo"
                onSave={() => {
                    if (rejectTargetRoles.size === 0) {
                        toast.warning("Seleccione al menos un rol para rechazar");
                        return;
                    }

                    // Validar que todos los roles seleccionados tengan un motivo escrito
                    for (const roleId of rejectTargetRoles) {
                        if (!rejectObservations[roleId] || rejectObservations[roleId].trim() === "") {
                            toast.warning(`Debe ingresar un motivo de rechazo para el rol: ${DICCIONARIO_ROLES[roleId]}`);
                            return;
                        }
                    }

                    const rolesText = Array.from(rejectTargetRoles).map(r => DICCIONARIO_ROLES[r]).join(", ");
                    toast.error(`Ítem ${itemToReject?.codigo || itemToReject?.diseño} rechazado hacia: ${rolesText}.`);
                    handleActionRol1(itemToReject.id);
                    setIsRejectModalOpen(false);
                    setRejectTargetRoles(new Set());
                    setRejectObservations({});
                    setItemToReject(null);
                }}
            >
                <div style={{ padding: "10px 0" }}>
                    <TextUI style={{ marginBottom: "16px" }}>Seleccione a qué rol(es) desea retornar el ítem para corrección:</TextUI>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[3, 4, 5].map(roleId => (
                            <div key={roleId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <CheckboxUI
                                    label={DICCIONARIO_ROLES[roleId]}
                                    checked={rejectTargetRoles.has(roleId)}
                                    onChange={(_, checked) => {
                                        setRejectTargetRoles(prev => {
                                            const newSet = new Set(prev);
                                            if (checked) newSet.add(roleId);
                                            else {
                                                newSet.delete(roleId);
                                                setRejectObservations(obs => {
                                                    const newObs = { ...obs };
                                                    delete newObs[roleId];
                                                    return newObs;
                                                });
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                                {rejectTargetRoles.has(roleId) && (
                                    <InputUI
                                        placeholder={`Escriba el motivo de rechazo para ${DICCIONARIO_ROLES[roleId]}...`}
                                        value={rejectObservations[roleId] || ""}
                                        onChange={(v) => setRejectObservations(prev => ({ ...prev, [roleId]: v }))}
                                        style={{ marginLeft: '28px', fontSize: '12px' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isViewReasonModalOpen}
                onClose={() => {
                    setIsViewReasonModalOpen(false);
                    setSelectedRejectionReason("");
                }}
                title="Motivo de Rechazo"
                saveText="Cerrar"
                onSave={() => setIsViewReasonModalOpen(false)}
                showCancelButton={false}
            >
                <div style={{ padding: "16px", backgroundColor: isDark ? "#1e293b" : "#fff8e1", borderRadius: "8px", border: `1px solid ${isDark ? "#334155" : "#ffe082"}`, marginTop: "10px" }}>
                    <TextUI weight="600" color={theme?.colors?.warning || "#f57c00"} style={{ marginBottom: "8px", display: "block" }}>Observación del Aprobador:</TextUI>
                    <TextUI color={isDark ? "#cbd5e1" : "#5d4037"}>{selectedRejectionReason || "No se especificó un motivo detallado."}</TextUI>
                </div>
            </ModalUI>
            <ModalUI
                isOpen={isReviewModalOpen}
                onClose={() => {
                    setIsReviewModalOpen(false);
                    setSelectedItemsToReviewIds(new Set());
                }}
                title="Seleccionar ítems para revisar"
                width="800px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ maxHeight: "400px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}>
                                        <CheckboxUI
                                            checked={itemsToReview.length > 0 && itemsToReview.every(i => selectedItemsToReviewIds.has(i.id))}
                                            onChange={(_, checked) => {
                                                if (checked) {
                                                    setSelectedItemsToReviewIds(new Set(itemsToReview.map(i => i.id)));
                                                } else {
                                                    setSelectedItemsToReviewIds(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsToReview.map(item => (
                                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            <CheckboxUI
                                                checked={selectedItemsToReviewIds.has(item.id)}
                                                onChange={(_, checked) => {
                                                    setSelectedItemsToReviewIds(prev => {
                                                        const newSet = new Set(prev);
                                                        if (checked) newSet.add(item.id);
                                                        else newSet.delete(item.id);
                                                        return newSet;
                                                    });
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.descripcion}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.marca}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.diseño}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <ButtonUI
                            text="Cancelar"
                            variant="outlined"
                            onClick={() => {
                                setIsReviewModalOpen(false);
                                setSelectedItemsToReviewIds(new Set());
                            }}
                        />
                        <ButtonUI
                            text={`Agregar (${selectedItemsToReviewIds.size})`}
                            variant="primary"
                            disabled={selectedItemsToReviewIds.size === 0}
                            onClick={() => {
                                const selectedItems = itemsToReview.filter(i => selectedItemsToReviewIds.has(i.id));
                                // Transform items to match the expected structure if necessary
                                const formattedItems = selectedItems.map(i => ({
                                    ...i,
                                    linea: lineaSeleccionada?.value,
                                    // Default values for fields to avoid undefined errors in detail view
                                    medida: '-', rin: '-', serie: '-', lonas: '-', ancho: '-', nomenclatura: '-',
                                    carga: '-', velocidad: '-', categoria: '-', segmento: '-', aplicacion: '-', eje: '-', robustez: '-',
                                    codigo: 'N/A', codigoSap: 'N/A', descripcionRol5: i.descripcion, codigoProveedor: '-',
                                    cubicaje: '-', nombreExtranjero: '-', partidaArancelaria: '-'
                                }));

                                setItems(prev => [...prev, ...formattedItems]);
                                setIsReviewModalOpen(false);
                                setSelectedItemsToReviewIds(new Set());
                                toast.success(`${selectedItemsToReviewIds.size} items agregados a revisión`);
                            }}
                        />
                    </div>
                </div>
            </ModalUI>
        </div>
    );
}
