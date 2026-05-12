import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
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
import { parseLlantas, uploadToCloudflare, getItemsByRole, saveItems, processItemAction, saveItemRole5, patchItemRole3, rejectItemPhase, uploadItemImages, getItemsDWHByLinea, createItemFromDWH, approveItemMDM } from "services/mdmService";
import { ListarEmpresasAdmin } from "services/administracionService";

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

    const handleOneDecimalInput = (value) => {
        let v = value.replace(/[^0-9.]/g, "");
        if (v.startsWith(".")) v = "0" + v;
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
        if (parts.length === 2 && parts[1].length > 1) v = parts[0] + "." + parts[1].substring(0, 1);
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

    const DICCIONARIO_COLOR_LETRA_CODIGO = {
        "00": "OWL",
        "01": "LN",
        "02": "OBL",
        "03": "OOL",
        "04": "RBL"
    };

    const OPTIONS_COLOR_LETRA = [
        { value: "00", label: "00" },
        { value: "01", label: "01" },
        { value: "02", label: "02" },
        { value: "03", label: "03" },
        { value: "04", label: "04" },
    ];

    const calcularNombreSistemaFinal = (nombreBase, colorCod) => {
        if (!nombreBase) return "";
        const codigo = DICCIONARIO_COLOR_LETRA_CODIGO[colorCod];
        if (!codigo) return nombreBase;
        return `${nombreBase} ${codigo}`.trim();
    };

    let rolPrincipal = null;
    let idRolPrincipal = null;
    let opcionesLineasPermitidas = [];
    let opcionesEmpresasPermitidas = [];

    const [diccionarioEmpresas, setDiccionarioEmpresas] = useState({});

    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const resp = await ListarEmpresasAdmin();
                const dict = {};
                resp.forEach(emp => {
                    dict[emp.ID] = emp.NOMBRE;
                });
                setDiccionarioEmpresas(dict);
            } catch (error) {
                console.error("Error fetching empresas:", error);
            }
        };
        fetchEmpresas();
    }, []);



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
                    .map(id => ({ value: id, label: diccionarioEmpresas[id] }))
                    .filter(opt => opt.label);
            }
        }
    }

    const [items, setItems] = useState([]);
    const fileInputRef = useRef(null);
    const debounceTimeouts = useRef({});

    const handleDownloadTemplate = () => {
        if (!lineaSeleccionada) return;
        const headers = ["DISENIO", "LETRA_DISENIO", "COLOR_LETRA", "DESCRIPCION", "EMPRESA", "CODIGO_PROVEEDOR", "NOMBRE_EXTRANJERO", "PARTIDA_ARANCELARIA"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        const fileName = `plantilla_importacion_${lineaSeleccionada.label.toLowerCase().replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.info("El archivo Excel está vacío.");
                    return;
                }

                const baseItems = data.map(row => {
                    // Buscar el ID de la empresa por nombre (insensible a mayúsculas/minúsculas)
                    const nombreEmpresa = String(row.EMPRESA || "").trim().toUpperCase();
                    const idEmpresa = Object.keys(diccionarioEmpresas).find(
                        key => diccionarioEmpresas[key].trim().toUpperCase() === nombreEmpresa
                    ) || "";

                    return {
                        id: Date.now() + Math.random(),
                        linea: lineaSeleccionada.value,
                        idEmpresa: idEmpresa,
                        descripcionRol5: String(row.DESCRIPCION || "").trim().toUpperCase(),
                        descripcion: String(row.DESCRIPCION || "").trim().toUpperCase(),
                        codigoProveedor: String(row.CODIGO_PROVEEDOR || "").trim().toUpperCase(),
                        nombreExtranjero: String(row.NOMBRE_EXTRANJERO || "").trim().toUpperCase(),
                        partidaArancelaria: String(row.PARTIDA_ARANCELARIA || "").trim().toUpperCase(),
                        diseño: String(row.DISENIO || "").trim().toUpperCase().slice(0, 4),
                        letraDiseño: String(row.LETRA_DISENIO || "").trim().toUpperCase(),
                        colorLetra: String(row.COLOR_LETRA || "").trim().toUpperCase(),
                        codigo: "", // Código de barras
                        cubicaje: "",
                        marca: "",
                        comentarios: ""
                    };
                });

                // Ejecutar parseLlantas para los ítems importados
                const descripciones = baseItems.map(it => it.descripcion);
                let parsedResults = [];
                if (descripciones.length > 0) {
                    try {
                        parsedResults = await parseLlantas(descripciones);
                    } catch (err) {
                        console.error("Error parsing llantas on import:", err);
                    }
                }

                const newItems = baseItems.map((it, index) => {
                    const baseName = parsedResults[index]?.NOMBRE || it.descripcion;
                    return {
                        ...it,
                        nombreSistemaBase: baseName,
                        nombreSistema: calcularNombreSistemaFinal(baseName, it.colorLetra)
                    };
                });

                setItems(prev => [...prev, ...newItems]);
                toast.success(`${newItems.length} ítems importados correctamente.`);
            } catch (error) {
                console.error("Error importando Excel:", error);
                toast.error("Error al leer el archivo Excel.");
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsBinaryString(file);
    };
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
    const [searchTermReview, setSearchTermReview] = useState("");

    const filteredItemsToReview = useMemo(() => {
        if (!searchTermReview) return itemsToReview;
        const lowSearch = searchTermReview.toLowerCase();
        return itemsToReview.filter(item =>
            String(item.DIT_NOMBRE || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_CODIGO || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_DISENIO || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_NOMBREFABRICANTE || "").toLowerCase().includes(lowSearch)
        );
    }, [itemsToReview, searchTermReview]);

    // Selector global para el nuevo ítem
    const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
    const esLlantas = lineaSeleccionada?.value === "LLANTAS" || lineaSeleccionada?.value === "LLANTAS MOTO";
    const esLubricantes = lineaSeleccionada?.value === "LUBRICANTES";
    const esHerramientas = lineaSeleccionada?.value === "HERRAMIENTAS";

    const fetchItems = useCallback(async () => {
        if (idRolPrincipal && lineaSeleccionada) {
            try {
                const rawData = await getItemsByRole(idRolPrincipal, lineaSeleccionada.value);
                if (rawData) {
                    const data = rawData.filter(it => it.LINEA_NEGOCIO === lineaSeleccionada.value);
                    let processedItems = data;
                    if (idRolPrincipal === 3) {
                        const filtered = data.filter(it =>
                            it.FASE_ACTUAL === 2 ||
                            (it.FASES && it.FASES.some(f => f.FASE === 2 && f.RECHAZO))
                        );

                        let parsedResults = [];
                        if (esLlantas && filtered.length > 0) {
                            const descripciones = filtered.map(it => it.DESCRIPCION || "");
                            try {
                                parsedResults = await parseLlantas(descripciones);
                            } catch (err) {
                                console.error("Error parsing llantas:", err);
                            }
                        }

                        processedItems = filtered.map((it, index) => {
                            const fase2 = it.FASES?.find(f => f.FASE === 2);
                            const parsed = parsedResults[index] || {};
                            return {
                                ...it,
                                id: it.ID,
                                linea: lineaSeleccionada.value,
                                diseño: parsed.diseno || it.DISENIO || "",
                                rin: parsed.rin || it.RIN || "",
                                serie: parsed.serie || it.SERIE || "",
                                lonas: parsed.lonas || it.LONAS || "",
                                ancho: parsed.ancho || it.ANCHO || "",
                                nomenclatura: parsed.tipo_medida || it.NOMENCLATURA || "",
                                carga: parsed.carga || it.CARGA || "",
                                velocidad: parsed.velocidad || it.VELOCIDAD || "",
                                categoria: it.CATEGORIA || "",
                                segmento: it.SEGMENTO || "",
                                aplicacion: parsed.Aplicacion || it.APLICACION || "",
                                eje: it.EJE || "",
                                comentarios: it.OBSERVACIONES || "",
                                descripcion: it.DESCRIPCION || "",
                                marca: parsed.marca || it.MARCA || "",
                                fueRechazado: fase2 ? fase2.RECHAZO : false,
                                motivoRechazo: fase2 ? fase2.MOTIVO_RECHAZO : ""
                            };
                        });
                    } else if (idRolPrincipal === 4) {
                        processedItems = data.filter(it =>
                            it.FASE_ACTUAL === 3 ||
                            (it.FASES && it.FASES.some(f => f.FASE === 3 && f.RECHAZO))
                        ).map(it => {
                            const fase3 = it.FASES?.find(f => f.FASE === 3);
                            return {
                                ...it,
                                id: it.ID,
                                linea: lineaSeleccionada.value,
                                codigo: it.CODIGO_BARRAS || "",
                                marca: it.MARCA || "",
                                diseño: it.DISENIO || "",
                                descripcion: it.DESCRIPCION || "",
                                comentarios: it.OBSERVACIONES || "",
                                fueRechazado: fase3 ? fase3.RECHAZO : false,
                                motivoRechazo: fase3 ? fase3.MOTIVO_RECHAZO : ""
                            };
                        });
                    } else if (idRolPrincipal === 5) {
                        const filtered = data.filter(it =>
                            it.FASES?.some(f => f.FASE === 1 && f.RECHAZO)
                        );

                        const descripciones = filtered.map(it => it.DESCRIPCION || "");
                        let parsedResults = [];
                        if (descripciones.length > 0) {
                            try {
                                parsedResults = await parseLlantas(descripciones);
                            } catch (err) {
                                console.error("Error parsing llantas (Rol 5):", err);
                            }
                        }

                        processedItems = filtered.map((it, index) => {
                            const fase1 = it.FASES?.find(f => f.FASE === 1);
                            const parsed = parsedResults[index] || {};
                            return {
                                ...it,
                                id: it.ID,
                                linea: lineaSeleccionada.value,
                                idEmpresa: Object.keys(diccionarioEmpresas).find(k => diccionarioEmpresas[k] === it.EMPRESA) || "",
                                codigo: it.CODIGO_BARRAS || "",
                                descripcionRol5: it.DESCRIPCION || "",
                                descripcion: it.DESCRIPCION || "",
                                nombreSistemaBase: parsed.NOMBRE || it.DESCRIPCION || "",
                                nombreSistema: calcularNombreSistemaFinal(parsed.NOMBRE || it.DESCRIPCION || "", it.COLOR_LETRA || ""),
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                cubicaje: it.CUBICAJE || "",
                                nombreExtranjero: it.NOMBRE_EXTRAN_G || it.NOMBRE_EXTRANJERO || "",
                                partidaArancelaria: it.PARTIDA_ARANCELARIA || "",
                                marca: it.MARCA || "",
                                diseño: it.DISENIO || "",
                                letraDiseño: it.LETRA_DISENIO || "",
                                colorLetra: it.COLOR_LETRA || "",
                                comentarios: it.OBSERVACIONES || "",
                                fueRechazado: fase1 ? fase1.RECHAZO : false,
                                motivoRechazo: fase1 ? fase1.MOTIVO_RECHAZO : ""
                            };
                        });
                    } else if (idRolPrincipal === 1) {
                        processedItems = data.filter(it => it.FASE_ACTUAL === 4 && (!it.FASES || !it.FASES.some(f => f.RECHAZO))).map(it => {
                            const f1 = it.FASES?.find(f => f.FASE === 1);
                            const f2 = it.FASES?.find(f => f.FASE === 2);
                            const f3 = it.FASES?.find(f => f.FASE === 3);

                            return {
                                ...it,
                                id: it.ID,
                                linea: lineaSeleccionada.value,
                                idEmpresa: Object.keys(diccionarioEmpresas).find(k => diccionarioEmpresas[k] === it.EMPRESA) || it.EMPRESA || "",
                                codigo: it.CODIGO_BARRAS || "",
                                marca: it.MARCA || "",
                                diseño: it.DISENIO || "",
                                descripcion: it.DESCRIPCION || "",
                                descripcionRol5: it.DESCRIPCION || "",
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                cubicaje: it.CUBICAJE || "",
                                nombreExtranjero: it.NOMBRE_EXTRAN_G || it.NOMBRE_EXTRANJERO || "",
                                partidaArancelaria: it.PARTIDA_ARANCELARIA || "",
                                rin: it.RIN || "",
                                serie: it.SERIE || "",
                                lonas: it.LONAS || "",
                                ancho: it.ANCHO || "",
                                nomenclatura: it.NOMENCLATURA || "",
                                carga: it.CARGA || "",
                                velocidad: it.VELOCIDAD || "",
                                categoria: it.CATEGORIA || "",
                                segmento: it.SEGMENTO || "",
                                aplicacion: it.APLICACION || "",
                                eje: it.EJE || "",
                                imagenUrl: it.RUTA_IMAGEN_WEBP || it.RUTA_IMAGEN_PNG || "",
                                comentariosRol5: f1?.OBSERVACIONES || "",
                                comentariosRol3: f2?.OBSERVACIONES || "",
                                comentariosRol4: f3?.OBSERVACIONES || "",
                                comentarioActual: it.OBSERVACIONES || ""
                            };
                        });
                    }
                    setItems(processedItems);
                    if (idRolPrincipal === 1) setCurrentItemIndex(0);
                }
            } catch (error) {
                console.error("Error al obtener items:", error);
                toast.error("Error al cargar los ítems pendientes.");
            }
        }
    }, [idRolPrincipal, lineaSeleccionada, diccionarioEmpresas]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);



    const eliminarItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleActionRol1 = async (itemId, action, rolesRechazo = [], observaciones = {}) => {
        try {
            if (action === "reject") {
                // Mapeo Rol -> Fase
                const roleToPhase = {
                    5: 1,
                    3: 2,
                    4: 3
                };

                for (const roleId of rolesRechazo) {
                    const phase = roleToPhase[roleId];
                    if (phase) {
                        const motivo = observaciones[roleId] || "Rechazado por Jefatura";
                        await rejectItemPhase(itemId, {
                            FASE: phase,
                            RECHAZO: true,
                            MOTIVO_RECHAZO: motivo
                        });
                    }
                }
            } else if (action === "approve") {
                await approveItemMDM(itemId);
                toast.success("Ítem aprobado correctamente.");
            } else {
                await processItemAction({
                    itemId,
                    action,
                    rolesRechazo,
                    observaciones
                });
            }
            setItems(prev => prev.filter(i => i.id !== itemId));
            // Si era el último ítem, retroceder el índice
            setCurrentItemIndex(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error al procesar acción:", error);
            toast.error("Error al procesar la acción.");
        }
    };

    const actualizarCampoFila = (id, campo, valor) => {
        let val = typeof valor === 'string' ? valor.toUpperCase() : valor;
        if (idRolPrincipal === 5) {
            if (campo === "cubicaje") {
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
        if (idRolPrincipal === 5 && campo === "descripcionRol5") {
            setItems(prev => prev.map(it => it.id === id ? { ...it, [campo]: val } : it));

            if (debounceTimeouts.current[id]) clearTimeout(debounceTimeouts.current[id]);
            debounceTimeouts.current[id] = setTimeout(async () => {
                if (!val) return;
                try {
                    const result = await parseLlantas([val]);
                    if (result && result[0]) {
                        const parsedName = result[0].NOMBRE || val;
                        setItems(prev => prev.map(it => {
                            if (it.id === id) {
                                return {
                                    ...it,
                                    nombreSistemaBase: parsedName,
                                    nombreSistema: calcularNombreSistemaFinal(parsedName, it.colorLetra)
                                };
                            }
                            return it;
                        }));
                    }
                } catch (error) {
                    console.error("Error updating nombre sistema dynamically:", error);
                }
                delete debounceTimeouts.current[id];
            }, 800);
            return;
        }

        if (idRolPrincipal === 5 && campo === "colorLetra") {
            setItems(prev => prev.map(it => {
                if (it.id === id) {
                    const baseName = it.nombreSistemaBase || it.nombreSistema || "";
                    return {
                        ...it,
                        [campo]: val,
                        nombreSistema: calcularNombreSistemaFinal(baseName, val)
                    };
                }
                return it;
            }));
        } else {
            setItems(prev => prev.map(it => it.id === id ? { ...it, [campo]: val } : it));
        }
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
                            onClick={async () => {
                                try {
                                    const data = await getItemsDWHByLinea(lineaSeleccionada.value);
                                    setItemsToReview(data);
                                    setIsReviewModalOpen(true);
                                } catch (error) {
                                    toast.error("Error al buscar ítems en el DWH.");
                                }
                            }}
                        />
                    )}
                    {idRolPrincipal !== 1 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                        <div style={{ display: "flex", gap: 12 }}>
                            <ButtonUI
                                text="Agregar ítem"
                                iconLeft="FaPlus"
                                disabled={!lineaSeleccionada}
                                onClick={() => {
                                    setItems(prev => [...prev, {
                                        id: Date.now(),
                                        linea: lineaSeleccionada.value,
                                        diseño: "",
                                        letraDiseño: "",
                                        colorLetra: ""
                                    }]);
                                }}
                                pcolor={theme?.colors?.primary}
                            />
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                style={{ display: "none" }}
                                ref={fileInputRef}
                                onChange={handleImportExcel}
                            />
                            <ButtonUI
                                text="Importar desde Excel"
                                iconLeft="FaFileExcel"
                                variant="outlined"
                                disabled={!lineaSeleccionada}
                                onClick={() => fileInputRef.current?.click()}
                                pcolor={theme?.colors?.success || "#28a745"}
                            />
                            <ButtonUI
                                text="Descargar plantilla"
                                iconLeft="FaDownload"
                                variant="outlined"
                                disabled={!lineaSeleccionada}
                                onClick={handleDownloadTemplate}
                                pcolor={theme?.colors?.info || "#17a2b8"}
                            />
                        </div>
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
                                            <div style={{
                                                backgroundColor: isDark ? '#1f2937' : '#fff3e0',
                                                padding: '20px',
                                                borderRadius: '8px',
                                                border: `1px solid ${isDark ? '#374151' : '#fde68a'}`,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                height: '100%',
                                                minHeight: '300px'
                                            }}>
                                                {item.imagenUrl ? (
                                                    <img src={item.imagenUrl} alt={item.descripcion} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <TextUI color={theme?.colors?.textSecondary}>Sin Imagen</TextUI>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ borderBottom: `1px solid ${theme?.colors?.border || '#eee'}`, paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <TextUI size="20px" weight="600" style={{ wordBreak: 'break-word' }}>{item.descripcion}</TextUI>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                                                        {item.comentariosRol3 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#f97316' : '#2563eb'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[3]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol3}</TextUI>
                                                            </div>
                                                        )}
                                                        {item.comentariosRol4 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#94a3b8' : '#ea580c'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[4]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol4}</TextUI>
                                                            </div>
                                                        )}
                                                        {item.comentariosRol5 && (
                                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                                                                <TextUI size="11px" weight="800" color={isDark ? '#3b82f6' : '#16a34a'} style={{ textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{DICCIONARIO_ROLES[5]}:</TextUI>
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary} style={{ wordBreak: 'break-word', flex: 1 }}>{item.comentariosRol5}</TextUI>
                                                            </div>
                                                        )}
                                                    </div>
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
                                                {[
                                                    { key: 'codigo', label: "Código Barras", role: 5 },
                                                    { key: 'idEmpresa', label: "Empresa", role: 5 },
                                                    { key: 'codigoProveedor', label: "Cód. Proveedor", role: 5 },
                                                    { key: 'cubicaje', label: "Cubicaje", role: 5 },
                                                    { key: 'descripcionRol5', label: "Desc. Comercial", role: 5 },
                                                    { key: 'nombreExtranjero', label: "Nombre Extranjero", role: 5 },
                                                    { key: 'partidaArancelaria', label: "Posición Arancelaria", role: 5 },
                                                    { key: 'marca', label: "Marca", role: 5 },
                                                    { key: 'diseño', label: "Diseño", role: 3 },
                                                    { key: 'rin', label: "Rin", role: 3 },
                                                    { key: 'serie', label: "Serie", role: 3 },
                                                    { key: 'lonas', label: "Lonas", role: 3 },
                                                    { key: 'ancho', label: "Ancho", role: 3 },
                                                    { key: 'nomenclatura', label: "Nomenclatura", role: 3 },
                                                    { key: 'carga', label: "Carga", role: 3 },
                                                    { key: 'velocidad', label: "Velocidad", role: 3 },
                                                    { key: 'categoria', label: "Categoría", role: 3 },
                                                    { key: 'segmento', label: "Segmento", role: 3 },
                                                    { key: 'aplicacion', label: "Aplicación", role: 3 },
                                                    { key: 'eje', label: "Eje", role: 3 },
                                                ].map(({ key, label, role }) => {
                                                    const value = item[key];
                                                    let bgColor = isDark ? '#111827' : '#fafafa';
                                                    let borderColor = isDark ? '#1f2937' : '#eee';

                                                    if (role === 3) {
                                                        bgColor = isDark ? '#7c2d12' : '#e3f2fd'; // Azul claro
                                                        borderColor = isDark ? '#9a3412' : '#bfdbfe';
                                                    } else if (role === 5) {
                                                        bgColor = isDark ? '#172554' : '#e8f5e9'; // Verde claro
                                                        borderColor = isDark ? '#1e3a8a' : '#a7f3d0';
                                                    } else if (role === 4) {
                                                        bgColor = isDark ? '#1f2937' : '#fff3e0'; // Naranja claro
                                                        borderColor = isDark ? '#374151' : '#fde68a';
                                                    }

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
                                                            <TextUI size="11px" color={isDark ? '#cbd5e1' : theme?.colors?.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</TextUI>
                                                            <TextUI size="14px" weight="600" color={isDark ? '#ffffff' : theme?.colors?.text}>
                                                                {key === 'idEmpresa' ? (diccionarioEmpresas[value] || value || '-') : (value || '-')}
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
                                                handleActionRol1(item.id, "approve");
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
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 4 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "250px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Imagen PNG</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Imagen WebP</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Letra Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Color Letra</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "300px" }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Nombre Del Sistema</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text, minWidth: "100px" }}>Acciones</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 3 ? 17 : (idRolPrincipal === 5 ? 14 : (idRolPrincipal === 4 ? 10 : 8))} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
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
                                                        <td style={{ padding: "4px 8px" }}><InputUI maxLength={4} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 4))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.robustez || ""} onChange={(v) => actualizarCampoFila(item.id, "robustez", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 3 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {item.descripcion || "-"}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI maxLength={4} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 4))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.rin || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "rin", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.serie || ""} formatValue={handleOneDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "serie", handleOneDecimalInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.lonas || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "lonas", handleNumericInput(v))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.ancho || ""} formatValue={handleOneDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "ancho", handleOneDecimalInput(v))} /></td>
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
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <ButtonUI
                                                                text="Motivo de rechazo"
                                                                variant="outlined"
                                                                pcolor={theme?.colors?.warning || "#ffc107"}
                                                                style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                                disabled={!item.fueRechazado}
                                                                onClick={() => {
                                                                    setSelectedRejectionReason(item.motivoRechazo);
                                                                    setIsViewReasonModalOpen(true);
                                                                }}
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
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <ButtonUI
                                                                text="Motivo de rechazo"
                                                                variant="outlined"
                                                                pcolor={theme?.colors?.warning || "#ffc107"}
                                                                style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }}
                                                                disabled={!item.fueRechazado}
                                                                onClick={() => {
                                                                    setSelectedRejectionReason(item.motivoRechazo);
                                                                    setIsViewReasonModalOpen(true);
                                                                }}
                                                            />
                                                        </td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI maxLength={4} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 4))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
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
                                                        <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
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
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Letra Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Color Letra</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "300px" }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cód. Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Nombre Del Sistema</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                </>
                                            )}
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 5 ? 14 : 8} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
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
                                                        {(idRolPrincipal === 3 || idRolPrincipal === 4) && (
                                                            <td style={{ padding: "4px 8px" }}>
                                                                <InputUI
                                                                    style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                    value={item.comentarios || ""}
                                                                    onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                                />
                                                            </td>
                                                        )}
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI maxLength={4} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 4))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
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
                                                        <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
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
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Descripción</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Letra Diseño</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Color Letra</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "300px" }}>Código Barras</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cód. Proveedor</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Cubicaje</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre Extranjero</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Partida Arancelaria</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px" }}>Nombre Del Sistema</th>
                                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px" }}>Comentarios</th>
                                                </>
                                            )}
                                            <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={idRolPrincipal === 5 ? 14 : 4} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
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
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></td>
                                                        {(idRolPrincipal === 3 || idRolPrincipal === 4) && (
                                                            <td style={{ padding: "4px 8px" }}>
                                                                <InputUI
                                                                    style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                    value={item.comentarios || ""}
                                                                    onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                                />
                                                            </td>
                                                        )}
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI maxLength={4} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 4))} /></td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
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
                                                        <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></td>
                                                        <td style={{ padding: "4px 8px" }}>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
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

                                try {


                                    if (idRolPrincipal === 5) {
                                        for (const item of currentItems) {
                                            if (item.fueRechazado) {
                                                const payload = {
                                                    ID: item.id,
                                                    EMPRESA: diccionarioEmpresas[item.idEmpresa] || "",
                                                    CODIGO_BARRAS: item.codigo || "",
                                                    DESCRIPCION: item.descripcionRol5 || item.descripcion || "",
                                                    CODIGO_PROVEEDOR: item.codigoProveedor || "",
                                                    CUBICAJE: item.cubicaje || "",
                                                    NOMBRE_EXTRANJERO: item.nombreExtranjero || "",
                                                    PARTIDA_ARANCELARIA: item.partidaArancelaria || "",
                                                    MARCA: item.marca || "",
                                                    DISENIO: item.diseño || "",
                                                    LETRA_DISENIO: item.letraDiseño || "",
                                                    COLOR_LETRA: item.colorLetra || "",
                                                    OBSERVACIONES: item.comentarios || "",
                                                    RECHAZO: false,
                                                    FASE: 1
                                                };
                                                await patchItemRole3(payload);
                                            } else {
                                                const payload = {
                                                    EMPRESA: diccionarioEmpresas[item.idEmpresa] || "",
                                                    CODIGO_BARRAS: item.codigo || "",
                                                    DESCRIPCION: item.descripcionRol5 || item.descripcion || "",
                                                    CODIGO_PROVEEDOR: item.codigoProveedor || "",
                                                    CUBICAJE: item.cubicaje || "",
                                                    NOMBRE_EXTRANJERO: item.nombreExtranjero || "",
                                                    PARTIDA_ARANCELARIA: item.partidaArancelaria || "",
                                                    MARCA: item.marca || "",
                                                    DISENIO: item.diseño || "",
                                                    LETRA_DISENIO: item.letraDiseño || "",
                                                    COLOR_LETRA: item.colorLetra || "",
                                                    OBSERVACIONES: item.comentarios || ""
                                                };
                                                await saveItemRole5(payload);
                                            }
                                        }
                                    } else if (idRolPrincipal === 3) {
                                        for (const item of currentItems) {
                                            const payload = {
                                                ID: item.ID,
                                                DISENIO: item.diseño || "",
                                                ANCHO: item.ancho || "",
                                                LONAS: item.lonas || "",
                                                NOMENCLATURA: item.nomenclatura || "",
                                                CARGA: item.carga || "",
                                                VELOCIDAD: item.velocidad || "",
                                                RIN: item.rin || "",
                                                SERIE: item.serie || "",
                                                OBSERVACIONES: item.comentarios || "",
                                                FASE: 2,
                                                CATEGORIA: item.categoria || "",
                                                SEGMENTO: item.segmento || "",
                                                APLICACION: item.aplicacion || "",
                                                EJE: item.eje || "",
                                                ...(item.fueRechazado && { RECHAZO: false })
                                            };
                                            await patchItemRole3(payload);
                                        }
                                    } else if (idRolPrincipal === 4) {
                                        for (const item of currentItems) {
                                            // Subir imágenes si existen
                                            if (item.imagenPng || item.imagenWebp) {
                                                try {
                                                    await uploadItemImages(item.ID, item.marca, item.diseño, item.imagenPng, item.imagenWebp);
                                                } catch (uploadError) {
                                                    console.error(`Error al subir imágenes para el ítem ${item.ID}:`, uploadError);
                                                    toast.error(`Error al subir imágenes para ${item.marca} ${item.diseño}`);
                                                }
                                            }

                                            await patchItemRole3({
                                                ID: item.ID,
                                                FASE: 3,
                                                OBSERVACIONES: item.comentarios || "",
                                                ...(item.fueRechazado && { RECHAZO: false })
                                            });
                                        }
                                    } else {
                                        await saveItems(currentItems);
                                    }

                                    toast.success(`Se enviaron a revisión ${currentItems.length} ítems seleccionados.`);
                                    setItems(prev => prev.filter(i => !(i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id))));
                                    setSelectedItemIds(new Set());
                                } catch (error) {
                                    console.error("Error al enviar a revisión:", error);
                                    toast.error("Error al enviar los ítems a revisión.");
                                }
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
                    handleActionRol1(itemToReject.id, "reject", Array.from(rejectTargetRoles), rejectObservations);
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
                    <InputUI
                        placeholder="Buscar por código, nombre, diseño o fabricante..."
                        value={searchTermReview}
                        onChange={(v) => setSearchTermReview(v)}
                        iconLeft="FaSearch"
                    />
                    <div style={{ maxHeight: "400px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}>
                                        <CheckboxUI
                                            checked={filteredItemsToReview.length > 0 && filteredItemsToReview.every(i => selectedItemsToReviewIds.has(i.DIT_CODIGO))}
                                            onChange={(_, checked) => {
                                                if (checked) {
                                                    setSelectedItemsToReviewIds(new Set(filteredItemsToReview.map(i => i.DIT_CODIGO)));
                                                } else {
                                                    setSelectedItemsToReviewIds(new Set());
                                                }
                                            }}
                                        />
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Codigo</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Diseño</th>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Fabricante</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItemsToReview.map(item => (
                                    <tr key={item.DIT_CODIGO} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            <CheckboxUI
                                                checked={selectedItemsToReviewIds.has(item.DIT_CODIGO)}
                                                onChange={(_, checked) => {
                                                    setSelectedItemsToReviewIds(prev => {
                                                        const newSet = new Set(prev);
                                                        if (checked) newSet.add(item.DIT_CODIGO);
                                                        else newSet.delete(item.DIT_CODIGO);
                                                        return newSet;
                                                    });
                                                }}
                                            />
                                        </td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_CODIGO}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NOMBRE}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_DISENIO}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NOMBREFABRICANTE}</td>
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
                            onClick={async () => {
                                try {
                                    const selectedIds = Array.from(selectedItemsToReviewIds);

                                    // Crear ítems uno por uno en el backend
                                    const promises = selectedIds.map(id => createItemFromDWH(id));
                                    const responses = await Promise.all(promises);

                                    let addedCount = 0;
                                    let skippedCount = 0;

                                    responses.forEach(resp => {
                                        if (resp && resp.action === "skipped") {
                                            skippedCount++;
                                        } else {
                                            addedCount++;
                                        }
                                    });

                                    if (addedCount > 0) {
                                        toast.success(`${addedCount} items creados desde DWH correctamente`);
                                    }
                                    if (skippedCount > 0) {
                                        toast.info(`${skippedCount} items ya existían y fueron omitidos`);
                                    }

                                    setIsReviewModalOpen(false);
                                    setSelectedItemsToReviewIds(new Set());
                                    setSearchTermReview("");

                                    // Recargar la lista principal para ver los nuevos ítems en Fase 4
                                    fetchItems();
                                } catch (error) {
                                    console.error("Error al crear ítems desde DWH:", error);
                                    toast.error("Error al procesar algunos ítems.");
                                }
                            }}
                        />
                    </div>
                </div>
            </ModalUI>
        </div>
    );
}
