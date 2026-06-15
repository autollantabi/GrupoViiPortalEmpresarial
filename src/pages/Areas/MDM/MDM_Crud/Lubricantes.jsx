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
import { parseLlantas, getItemsByRole, saveItemRole5, patchItemRole3, rejectItemPhase, uploadItemImages, getItemsDWHByLinea, createItemFromDWH, approveItemMDM, getNeumaticosDWH, getItemsCaracteristicas } from "services/mdmService";
import { ListarEmpresasAdmin } from "services/administracionService";
import { generateSAPExport } from "assets/templates/mdmTemplate";

const EMPRESA_LUBRICANTES = "MAXXIMUNDO";

const MARCAS_POR_EMPRESA = {
    "AUTOLLANTA": ["FORTUNE", "MAXTREK", "ROADWING"],
    "STOX": ["CST", "FARROAD BRAND", "ANSU", "BAYI", "BYCROSS", "WONDERLAND", "ANTARES"],
    "MAXXIMUNDO": ["MAXXIS", "APLUS", "ROADCRUZA", "HAOHUA"],
};


const DICCIONARIO_ROLES = {
    1: 'Comercial', //Jefatura
    3: 'Tecnico',   //Supervisor
    4: 'Marketing', //Coordinadora
    5: 'Compras'    //Usuario
};

const DICCIONARIO_LINEAS = {
    4: 'LUBRICANTES'
};


const OPTIONS_ESTRATEGIA_LUB = [
    { value: "MTS", label: "MTS" },
    { value: "MTO", label: "MTO" },
];

const OPTIONS_ORIGEN_LUB = [
    { value: "Estados Unidos", label: "Estados Unidos" },
    { value: "Alemania", label: "Alemania" },
    { value: "Turquía", label: "Turquía" },
    { value: "Perú", label: "Perú" },
];

const OPTIONS_MEDIDA_LUB = [
    { value: "LT", label: "LT" },
    { value: "KG", label: "KG" },
];

// Opciones Rol 3 (Técnico/Supervisor)
const OPTIONS_CLASE_LUB = [
    { value: "Sintético", label: "Sintético" },
    { value: "Semisintético", label: "Semisintético" },
    { value: "Mineral", label: "Mineral" },
];

const OPTIONS_APLICACION_LUB = [
    { value: "ACEITES PARA MOTORES DE 2 TIEMPOS", label: "ACEITES PARA MOTORES DE 2 TIEMPOS" },
    { value: "AUTOMOTRIZ", label: "AUTOMOTRIZ" },
    { value: "AUTOMOTRIZ DIESEL", label: "AUTOMOTRIZ DIESEL" },
    { value: "AUTOMOTRIZ GASOLINA", label: "AUTOMOTRIZ GASOLINA" },
    { value: "HIDRÁULICOS", label: "HIDRÁULICOS" },
    { value: "INDUSTRIAL", label: "INDUSTRIAL" },
    { value: "MOTORES MARINOS (con API motor diesel)", label: "MOTORES MARINOS (con API motor diesel)" },
    { value: "OTROS", label: "OTROS" },
    { value: "TRANSMISIONES AUTOMÁTICAS", label: "TRANSMISIONES AUTOMÁTICAS" },
    { value: "TRANSMISIONES MANUALES Y DIFERENCIALES", label: "TRANSMISIONES MANUALES Y DIFERENCIALES" },
];

const OPTIONS_GRADO_GRASA_LUB = [
    { value: "0", label: "0" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
];

const OPTIONS_CLASIFICACION_LUB = [
    { value: "Convencional", label: "Convencional" },
    { value: "Premium", label: "Premium" },
    { value: "Refrigerante", label: "Refrigerante" },
];

const OPTIONS_PRESENTACION_LUB = [
    { value: "PACK", label: "PACK" },
    { value: "DRUM", label: "DRUM" },
    { value: "PAIL", label: "PAIL" },
];

const calcularNombreSistemaFinal = (nombreBase, isNew = false) => {
    if (!nombreBase) return "";
    // Limpiamos cualquier "NEW " previo para evitar duplicaciones si se rellama la función
    let baseLimpia = nombreBase.startsWith("NEW ") ? nombreBase.replace(/^NEW\s+/, "") : nombreBase;
    return isNew ? `NEW ${baseLimpia}` : baseLimpia;
};


// Línea fija para esta página — definida a nivel módulo para referencia estable
const LINEA_LUBRICANTES = { value: "LUBRICANTES", label: "LUBRICANTES" };

function Lubricantes() {
    const { theme } = useTheme();
    const { user } = useAuthContext();
    const [caracteristicasMDM, setCaracteristicasMDM] = useState({});

    useEffect(() => {
        const fetchCaracteristicas = async () => {
            try {
                const data = await getItemsCaracteristicas();
                setCaracteristicasMDM(data || {});
            } catch (error) {
                console.error("Error fetching caracteristicas:", error);
            }
        };
        fetchCaracteristicas();
    }, []);

    const isDark = theme?.name === 'dark';

    const handleNumericInput = (value) => {
        if (value == null) return "";
        return String(value).replace(/[^0-9]/g, "");
    };
    const handleDecimalInput = (value) => {
        if (value == null) return "";
        let val = String(value).replace(/[^0-9.]/g, "");
        if (val.startsWith(".")) val = "0" + val;
        const parts = val.split(".");
        if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
        return val;
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
        const contextoMDM = user.CONTEXTOS.find(ctx => ctx.RECURSO === 'mdm.lubricantes');
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
        const headers = ["NOMBRE", "CODIGO_PROVEEDOR", "CODIGO_SHELL", "MARCA", "NOMBRE_FORANEO", "ESTRATEGIA", "ORIGEN", "EMPAQUE", "UNIDADES", "MEDIDA"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
        const fileName = `plantilla_importacion_${lineaSeleccionada.label.toLowerCase().replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleImportExcel = (e) => {
        if (!lineaSeleccionada) {
            toast.error("Por favor, seleccione una línea de negocio primero.");
            return;
        }
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
                    let estrategia = String(row.ESTRATEGIA || "").trim().toUpperCase();
                    if (!OPTIONS_ESTRATEGIA_LUB.some(o => o.value.toUpperCase() === estrategia)) estrategia = "";

                    let origen = String(row.ORIGEN || "").trim();
                    const origenMatch = OPTIONS_ORIGEN_LUB.find(o => o.value.toUpperCase() === origen.toUpperCase() || (origen.toUpperCase() === "TURKIA" && o.value === "Turquía"));
                    origen = origenMatch ? origenMatch.value : "";

                    let medida = String(row.MEDIDA || "").trim().toUpperCase();
                    if (!OPTIONS_MEDIDA_LUB.some(o => o.value.toUpperCase() === medida)) medida = "";

                    let empaque = parseInt(row.EMPAQUE);
                    if (isNaN(empaque)) empaque = "";

                    let unidades = parseInt(row.UNIDADES);
                    if (isNaN(unidades)) unidades = "";

                    return {
                        id: Date.now() + Math.random(),
                        linea: lineaSeleccionada.value,
                        nombreLub: String(row.NOMBRE || "").trim().toUpperCase(),
                        codigoProveedor: String(row.CODIGO_PROVEEDOR || "").trim().toUpperCase(),
                        codigoShell: String(row.CODIGO_SHELL || "").trim().toUpperCase(),
                        marca: String(row.MARCA || "").trim().toUpperCase(),
                        nombreExtranjero: String(row.NOMBRE_FORANEO || "").trim().toUpperCase(),
                        estrategia: estrategia,
                        origen: origen,
                        empaque: empaque,
                        unidades: unidades,
                        medida: medida,
                        comentarios: ""
                    };
                });

                // Ejecutar parseLlantas para los ítems importados
                const descripciones = baseItems.map(it => it.nombreLub || "");
                let parsedResults = [];
                if (descripciones.length > 0) {
                    try {
                        parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value);
                    } catch (err) {
                        console.error("Error parsing lubricantes on import:", err);
                    }
                }

                const newItems = baseItems.map((it, index) => {
                    const parsed = parsedResults[index] || {};
                    const baseName = parsed["Posible Descripcion"] || it.nombreLub || "";
                    const itemWithParsed = {
                        ...it,
                        nombreSistemaBase: baseName,
                        nombreSistema: calcularNombreSistemaFinal(baseName, true),
                        parsedData: parsed
                    };
                    return itemWithParsed;
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
    const [isSAPModalOpen, setIsSAPModalOpen] = useState(false);
    const [groupedItemsByCompany, setGroupedItemsByCompany] = useState({});
    const [approvedItems, setApprovedItems] = useState([]);
    const [isSAPExportModalOpen, setIsSAPExportModalOpen] = useState(false);
    const [selectedApprovedItemIds, setSelectedApprovedItemIds] = useState(new Set());
    const [approvedItemsForExport, setApprovedItemsForExport] = useState([]);

    const filteredItemsToReview = useMemo(() => {
        if (!searchTermReview) return itemsToReview;
        const lowSearch = searchTermReview.toLowerCase();
        return itemsToReview.filter(item =>
            String(item.DIT_NOMBRE || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_NUEVOIDENTIFICADOR || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_MODELO || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_MARCA || "").toLowerCase().includes(lowSearch)
        );
    }, [itemsToReview, searchTermReview]);

    // Línea fija: LUBRICANTES (referencia estable desde módulo)
    const lineaSeleccionada = LINEA_LUBRICANTES;

    const fetchItems = useCallback(async () => {
        if (idRolPrincipal && lineaSeleccionada) {
            try {
                const rawData = await getItemsByRole(idRolPrincipal, lineaSeleccionada.value);
                if (rawData) {
                    const data = rawData;
                    let processedItems = data;
                    if (idRolPrincipal === 3) {
                        const filtered = data.filter(it =>
                            it.APROBADO_MDM ||
                            it.FASE_ACTUAL == 2 ||
                            (it.FASES && Array.isArray(it.FASES) && it.FASES.some(f => f.FASE == 2 && f.RECHAZO))
                        );

                        let parsedResults = [];
                        if (filtered.length > 0) {
                            const descripciones = filtered.map(it => {
                                const desc = it.NOMBRE || it.DESCRIPCION || "";
                                return desc.replace(/\bNEW\b/gi, "").trim().replace(/\s{2,}/g, " ");
                            });
                            try {
                                parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value);
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
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,

                                descripcion: it.NOMBRE || it.DESCRIPCION || "",
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                codigoShell: it.CODIGO_SHELL || "",
                                marca: parsed.Marca || parsed.marca || it.MARCA || "",
                                nombreExtranjero: it.NOMBRE_FORANEO || it.NOMBRE_EXTRANJERO || "",
                                estrategia: it.ESTRATEGIA || "",
                                origen: it.ORIGEN || "",
                                empaque: parsed.Empaque || it.EMPAQUE || "",
                                codigo: it.CODIGO_BARRAS || "",

                                familia: parsed.Familia || it.FAMILIA || "",
                                viscosidad: parsed.Viscosidad || it.VISCOSIDAD || "",
                                clase: it.CLASE || "",
                                sae: it.SAE || "",
                                isovg: it.ISOVG || "",
                                api: it.API || "",
                                acea: it.ACEA || "",
                                jaso: it.JASO || "",
                                isoDin: it.ISO_DIN || "",
                                presentacion: it.PRESENTACION || "",
                                unidadesPallet: it.UNIDADES_POR_PALLET || "",
                                unidadesCaja: it.UNIDADES_POR_CAJA || "",
                                aplicacion: parsed.Aplicacion || it.APLICACION || "",
                                gradoGrasa: it.GRADO_DE_LA_GRASA || "",
                                pesoMaterialBruto: it.PESO_MATERIAL_BRUTO || "",
                                clasificacion: it.CLASIFICACION || "",

                                comentarios: it.OBSERVACIONES || "",
                                fueRechazado: fase2 ? fase2.RECHAZO : false,
                                motivoRechazo: fase2 ? fase2.MOTIVO_RECHAZO : ""
                            };
                        });
                    } else if (idRolPrincipal === 4) {
                        processedItems = data.filter(it =>
                            it.APROBADO_MDM ||
                            it.FASE_ACTUAL === 3 ||
                            (it.FASES && it.FASES.some(f => f.FASE === 3 && f.RECHAZO))
                        ).map(it => {
                            const fase3 = it.FASES?.find(f => f.FASE === 3);
                            return {
                                ...it,
                                id: it.ID,
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,
                                codigo: it.CODIGO_BARRAS || "",
                                marca: it.MARCA || "",
                                descripcion: it.NOMBRE || it.DESCRIPCION || "",
                                comentarios: it.OBSERVACIONES || "",
                                fueRechazado: fase3 ? fase3.RECHAZO : false,
                                motivoRechazo: fase3 ? fase3.MOTIVO_RECHAZO : ""
                            };
                        });
                    } else if (idRolPrincipal === 5) {
                        const filtered = data.filter(it =>
                            it.APROBADO_MDM ||
                            it.FASES?.some(f => f.FASE === 1 && f.RECHAZO)
                        );

                        const descripciones = filtered.map(it => it.NOMBRE || it.DESCRIPCION || "");
                        let parsedResults = [];
                        if (descripciones.length > 0) {
                            try {
                                parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value);
                            } catch (err) {
                                console.error("Error parsing llantas (Rol 5):", err);
                            }
                        }

                        processedItems = filtered.map((it, index) => {
                            const fase1 = it.FASES?.find(f => f.FASE === 1);
                            const parsed = parsedResults[index] || {};

                            let empaqueVal = "";
                            let unidadesVal = "";
                            let medidaVal = "";
                            if (it.EMPAQUE) {
                                const match = String(it.EMPAQUE).match(/^(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
                                if (match) {
                                    empaqueVal = match[1];
                                    unidadesVal = match[2];
                                    medidaVal = match[3];
                                } else {
                                    empaqueVal = it.EMPAQUE;
                                }
                            }

                            const itemWithBase = {
                                ...it,
                                id: it.ID,
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,
                                idEmpresa: Object.keys(diccionarioEmpresas).find(k => diccionarioEmpresas[k] === it.EMPRESA) || "",
                                descripcionRol5: it.NOMBRE || it.DESCRIPCION || "",
                                descripcion: it.NOMBRE || it.DESCRIPCION || "",
                                parsedData: parsed,
                                nombreSistemaBase: parsed["Posible Descripcion"] || it.NOMBRE || it.DESCRIPCION || "",
                                nombreSistema: calcularNombreSistemaFinal(parsed["Posible Descripcion"] || it.NOMBRE || it.DESCRIPCION || "", it.COLOR_LETRA || "", false),
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                codigoShell: it.CODIGO_SHELL || "",
                                marca: it.MARCA || "",
                                nombreExtranjero: it.NOMBRE_FORANEO || it.NOMBRE_EXTRANJERO || "",
                                estrategia: it.ESTRATEGIA || "",
                                origen: it.ORIGEN || "",
                                empaque: empaqueVal,
                                unidades: unidadesVal,
                                medida: medidaVal,
                                comentarios: it.OBSERVACIONES || "",
                                fueRechazado: fase1 ? fase1.RECHAZO : false,
                                motivoRechazo: fase1 ? fase1.MOTIVO_RECHAZO : ""
                            };
                            return itemWithBase;
                        });
                    } else if (idRolPrincipal === 1) {
                        processedItems = data.filter(it => it.FASE_ACTUAL === 4 && (!it.FASES || !it.FASES.some(f => f.RECHAZO))).map(it => {
                            const f1 = it.FASES?.find(f => f.FASE === 1);
                            const f2 = it.FASES?.find(f => f.FASE === 2);
                            const f3 = it.FASES?.find(f => f.FASE === 3);

                            return {
                                ...it,
                                id: it.ID,
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,
                                idEmpresa: Object.keys(diccionarioEmpresas).find(k => diccionarioEmpresas[k] === it.EMPRESA) || it.EMPRESA || "",
                                codigo: it.CODIGO_BARRAS === "UF" ? "" : (it.CODIGO_BARRAS || ""),
                                codigoDisabled: Boolean(it.CODIGO_BARRAS && it.CODIGO_BARRAS !== "UF"),
                                marca: it.MARCA || "",
                                descripcion: it.NOMBRE || it.DESCRIPCION || "",
                                descripcionRol5: it.NOMBRE || it.DESCRIPCION || "",
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                codigoShell: it.CODIGO_SHELL || "",
                                nombreExtranjero: it.NOMBRE_FORANEO || it.NOMBRE_EXTRANJERO || "",
                                estrategia: it.ESTRATEGIA || "",
                                origen: it.ORIGEN || "",
                                empaque: it.EMPAQUE || "",
                                familia: it.FAMILIA || "",
                                viscosidad: it.VISCOSIDAD || "",
                                clase: it.CLASE || "",
                                sae: it.SAE || "",
                                isovg: it.ISOVG || "",
                                api: it.API || "",
                                acea: it.ACEA || "",
                                jaso: it.JASO || "",
                                isoDin: it.ISO_DIN || "",
                                presentacion: it.PRESENTACION || "",
                                unidadesPallet: it.UNIDADES_POR_PALLET || "",
                                unidadesCaja: it.UNIDADES_POR_CAJA || "",
                                aplicacion: it.APLICACION || "",
                                gradoGrasa: it.GRADO_DE_LA_GRASA || "",
                                pesoMaterialBruto: it.PESO_MATERIAL_BRUTO || "",
                                clasificacion: it.CLASIFICACION || "",

                                imagenUrl: it.RUTA_IMAGEN_WEBP || it.RUTA_IMAGEN_PNG || "",
                                comentariosRol5: f1?.OBSERVACIONES || "",
                                comentariosRol3: f2?.OBSERVACIONES || "",
                                comentariosRol4: f3?.OBSERVACIONES || "",
                                comentarioActual: it.OBSERVACIONES || ""
                            };
                        });
                    }
                    if (idRolPrincipal === 1) {
                        const approved = data.filter(it => it.APROBADO_MDM === true).map(it => ({ ...it, EMPRESA: EMPRESA_LUBRICANTES }));
                        setApprovedItemsForExport(approved.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
                    }

                    const pendingItems = processedItems.filter(it => !it.APROBADO_MDM);
                    const approvedList = processedItems.filter(it => it.APROBADO_MDM);

                    setItems(pendingItems);
                    setApprovedItems(approvedList);

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

    const handleFinalSubmit = async (currentItems) => {
        try {
            if (idRolPrincipal === 5) {
                for (const item of currentItems) {
                    if (item.fueRechazado) {
                        const payload = {
                            ID: item.id,
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            NOMBRE: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            CODIGO_SHELL: item.codigoShell || "",
                            MARCA: item.marca || "",
                            NOMBRE_FORANEO: item.nombreExtranjero || "",
                            ESTRATEGIA: item.estrategia || "",
                            ORIGEN: item.origen || "",
                            EMPAQUE: item.empaque + "*" + item.unidades + item.medida || "",
                            OUM: item.oum || item.OUM || item.uom || item.UOM || "",
                            EMPRESA: EMPRESA_LUBRICANTES,
                            OBSERVACIONES: item.comentarios || "",
                            RECHAZO: false,
                            FASE: 1
                        };
                        await patchItemRole3(payload);
                    } else {
                        const payload = {
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            NOMBRE: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            CODIGO_SHELL: item.codigoShell || "",
                            MARCA: item.marca || "",
                            NOMBRE_FORANEO: item.nombreExtranjero || "",
                            ESTRATEGIA: item.estrategia || "",
                            ORIGEN: item.origen || "",
                            EMPAQUE: item.empaque || "",
                            UNIDADES: item.unidades || "",
                            MEDIDA: item.medida || "",
                            OUM: item.oum || item.OUM || item.uom || item.UOM || "",
                            EMPRESA: EMPRESA_LUBRICANTES,
                            OBSERVACIONES: item.comentarios || ""
                        };
                        await saveItemRole5(payload);
                    }
                }
            } else if (idRolPrincipal === 3) {
                for (const item of currentItems) {
                    const payload = {
                        ID: item.ID,
                        LINEA_NEGOCIO: lineaSeleccionada.value,
                        FAMILIA: item.familia || "",
                        VISCOSIDAD: item.viscosidad || "",
                        CLASE: item.clase || "",
                        SAE: item.sae || "",
                        ISOVG: item.isovg || "",
                        API: item.api || "",
                        ACEA: item.acea || "",
                        JASO: item.jaso || "",
                        ISO_DIN: item.isoDin || item.iso_din || "",
                        PRESENTACION: item.presentacion || "",
                        UNIDADES_POR_PALLET: item.unidades_por_pallet || item.unidadesPallet || "",
                        UNIDADES_POR_CAJA: item.unidades_por_caja || item.unidadesCaja || "",
                        APLICACION: item.aplicacion || "",
                        GRADO_DE_LA_GRASA: item.grado_de_la_grasa || item.gradoGrasa || "",
                        PESO_MATERIAL_BRUTO: item.pesoMaterialBruto || item.peso_material_bruto || item.pesoBruto || "",
                        CLASIFICACION: item.clasificacion || "",
                        OBSERVACIONES: item.comentarios || "",
                        FASE: 2,
                        ...(item.fueRechazado && { RECHAZO: false })
                    };
                    await patchItemRole3(payload);
                }
            } else if (idRolPrincipal === 4) {
                for (const item of currentItems) {
                    if (item.imagenPng || item.imagenWebp) {
                        try {
                            await uploadItemImages(lineaSeleccionada.value, item.ID, item.marca, null, item.imagenPng, item.imagenWebp);
                        } catch (uploadError) {
                            console.error(`Error al subir imágenes para el ítem ${item.ID}:`, uploadError);
                            toast.error(`Error al subir imágenes para ${item.marca} ${item.descripcion || ""}`);
                        }
                    }
                    await patchItemRole3({
                        ID: item.ID,
                        FASE: 3,
                        OBSERVACIONES: item.comentarios || "",
                        LINEA_NEGOCIO: lineaSeleccionada.value,
                        ...(item.fueRechazado && { RECHAZO: false })
                    });
                }
            }

            toast.success(`Se enviaron a revisión ${currentItems.length} ítems seleccionados.`);
            setItems(prev => prev.filter(i => !(i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id))));
            setSelectedItemIds(new Set());
            setIsSAPModalOpen(false);
        } catch (error) {
            console.error("Error al enviar a revisión:", error);
            toast.error("Error al enviar los ítems a revisión.");
        }
    };



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
                        await rejectItemPhase(itemId, lineaSeleccionada.value, {
                            FASE: phase,
                            RECHAZO: true,
                            MOTIVO_RECHAZO: motivo
                        });
                    }
                }
            } else if (action === "approve") {
                const item = items.find(i => i.id === itemId);
                if (!item || !item.codigo || item.codigo.trim() === "") {
                    toast.error("Debe digitar el código de barras antes de aprobar el ítem.");
                    return;
                }

                await patchItemRole3({
                    ID: itemId,
                    CODIGO_BARRAS: item.codigo,
                    LINEA_NEGOCIO: lineaSeleccionada.value,
                    FASE: 2
                });

                await approveItemMDM(itemId, lineaSeleccionada.value);
                toast.success("Ítem aprobado correctamente.");
            }
            setItems(prev => prev.filter(i => i.id !== itemId));
            // Si era el último ítem, retroceder el índice
            setCurrentItemIndex(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error al procesar acción:", error);
            toast.error("Error al procesar la acción.");
        }
    };

    const getMarcasForEmpresa = useCallback((idEmp) => {
        if (!idEmp || !diccionarioEmpresas[idEmp]) return [];
        const companyName = String(diccionarioEmpresas[idEmp]).trim().toUpperCase();
        const matchKey = Object.keys(MARCAS_POR_EMPRESA).find(key =>
            companyName === key || companyName.includes(key) || key.includes(companyName)
        );
        return matchKey ? MARCAS_POR_EMPRESA[matchKey] : [];
    }, [diccionarioEmpresas]);

    const getBrandOptions = useCallback((idEmp) => {
        const brands = getMarcasForEmpresa(idEmp);
        if (brands.length > 0) {
            return brands.map(b => ({ value: b, label: b }));
        }
        const allBrands = Object.values(MARCAS_POR_EMPRESA).flat();
        const uniqueBrands = Array.from(new Set(allBrands));
        return uniqueBrands.map(b => ({ value: b, label: b }));
    }, [getMarcasForEmpresa]);

    const actualizarCampoFila = (id, campo, valor) => {
        let val = typeof valor === 'string' ? valor.toUpperCase() : valor;



        if (idRolPrincipal === 5 && campo === "idEmpresa") {
            setItems(prev => prev.map(it => {
                if (it.id === id) {
                    const baseItem = { ...it, idEmpresa: val };
                    const allowedMarcas = getMarcasForEmpresa(val);
                    const brandIsAllowed = allowedMarcas.some(b => String(b).trim().toUpperCase() === String(it.marca).trim().toUpperCase());
                    if (it.marca && !brandIsAllowed) {
                        baseItem.marca = "";
                    }
                    return baseItem;
                }
                return it;
            }));
            return;
        }

        if (idRolPrincipal === 5 && campo === "marca") {
            setItems(prev => prev.map(it => {
                if (it.id === id) {
                    const baseItem = { ...it, marca: val };

                    const brandName = String(val).trim().toUpperCase();
                    let companyKey = null;
                    for (const [comp, brands] of Object.entries(MARCAS_POR_EMPRESA)) {
                        if (brands.some(b => b.toUpperCase() === brandName)) {
                            companyKey = comp;
                            break;
                        }
                    }
                    if (companyKey) {
                        const companyId = Object.keys(diccionarioEmpresas).find(
                            k => String(diccionarioEmpresas[k]).trim().toUpperCase() === companyKey
                        );
                        if (companyId) {
                            baseItem.idEmpresa = companyId;
                        }
                    }

                    return baseItem;
                }
                return it;
            }));
            return;
        }

        if (idRolPrincipal === 5 && (campo === "descripcionRol5" || campo === "nombreLub")) {
            setItems(prev => prev.map(it => it.id === id ? { ...it, [campo]: val } : it));
            if (debounceTimeouts.current[id]) clearTimeout(debounceTimeouts.current[id]);
            debounceTimeouts.current[id] = setTimeout(async () => {
                if (!val) return;
                try {
                    const result = await parseLlantas([val], lineaSeleccionada.value);
                    if (result && result[0]) {
                        const parsed = result[0];
                        const parsedName = parsed["Posible Descripcion"] || val;
                        setItems(prev => prev.map(it => {
                            if (it.id === id) {
                                const baseItem = {
                                    ...it,
                                    parsedData: parsed,
                                    nombreSistemaBase: parsedName,
                                    nombreSistema: calcularNombreSistemaFinal(parsedName, !it.fueRechazado)
                                };
                                return baseItem;
                            }
                            return it;
                        }));
                    }
                } catch (error) {
                    console.error("Error updating dynamically:", error);
                }
                delete debounceTimeouts.current[id];
            }, 800);
            return;
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
                    {idRolPrincipal === 1 && (
                        <>
                            <ButtonUI
                                text="Revisar Items"
                                iconLeft="FaSearch"
                                variant="primary"
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
                            <ButtonUI
                                text="Exportar a SAP"
                                iconLeft="FaFileExport"
                                variant="outlined"
                                onClick={() => setIsSAPExportModalOpen(true)}
                                pcolor={theme?.colors?.info || "#17a2b8"}
                            />
                        </>
                    )}
                    {idRolPrincipal !== 1 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                        <div style={{ display: "flex", gap: 12 }}>
                            <ButtonUI
                                text="Agregar ítem"
                                iconLeft="FaPlus"
                                onClick={() => {
                                    setItems(prev => [...prev, {
                                        id: Date.now(),
                                        linea: lineaSeleccionada.value
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
                                onClick={() => fileInputRef.current?.click()}
                                pcolor={theme?.colors?.success || "#28a745"}
                            />
                            <ButtonUI
                                text="Descargar plantilla"
                                iconLeft="FaDownload"
                                variant="outlined"
                                onClick={handleDownloadTemplate}
                                pcolor={theme?.colors?.info || "#17a2b8"}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex: "0 0 100%", backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TextUI size="14px" weight="600">
                        Ítems de Lubricantes ({items.filter(i => i.linea === lineaSeleccionada.value).length})
                    </TextUI>
                </div>
                <div style={{ flex: 1, overflow: "auto" }}>
                    {(() => {
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
                                                {item.imagenUrl && (
                                                    <img
                                                        key={`img-${item.id}`}
                                                        src={item.imagenUrl}
                                                        alt={item.descripcion}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            if (e.target.nextElementSibling) {
                                                                e.target.nextElementSibling.style.display = 'block';
                                                            }
                                                        }}
                                                    />
                                                )}
                                                <div key={`text-${item.id}`} style={{ display: item.imagenUrl ? 'none' : 'block', textAlign: 'center' }}>
                                                    <TextUI color={theme?.colors?.textSecondary}>
                                                        {idRolPrincipal === 1 ? "Imagen no publicada" : "Sin Imagen"}
                                                    </TextUI>
                                                </div>
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
                                                    { key: 'codigo', label: "Código de Barras", role: 5 },
                                                    { key: 'codigoProveedor', label: "Codigo Proveedor", role: 5 },
                                                    { key: 'codigoShell', label: "Codigo SHELL", role: 5 },
                                                    { key: 'marca', label: "Marca", role: 5 },
                                                    { key: 'nombreExtranjero', label: "Nombre Foraneo", role: 5 },
                                                    { key: 'estrategia', label: "Estrategia", role: 5 },
                                                    { key: 'origen', label: "Origen", role: 5 },
                                                    { key: 'empaque', label: "Empaque", role: 5 },
                                                    { key: 'OUM', label: "OUM (Litros)", role: 5 },

                                                    { key: 'familia', label: "Familia", role: 3 },
                                                    { key: 'viscosidad', label: "Viscosidad", role: 3 },
                                                    { key: 'clase', label: "Clase", role: 3 },
                                                    { key: 'sae', label: "SAE", role: 3 },
                                                    { key: 'isovg', label: "ISOVG", role: 3 },
                                                    { key: 'api', label: "API", role: 3 },
                                                    { key: 'acea', label: "ACEA", role: 3 },
                                                    { key: 'jaso', label: "JASO", role: 3 },
                                                    { key: 'isoDin', label: "ISO DIN", role: 3 },
                                                    { key: 'presentacion', label: "Presentacion", role: 3 },
                                                    { key: 'unidadesPallet', label: "Unidades por pallet", role: 3 },
                                                    { key: 'unidadesCaja', label: "Unidades por caja", role: 3 },
                                                    { key: 'aplicacion', label: "Aplicacion", role: 3 },
                                                    { key: 'gradoGrasa', label: "Grado de grasa", role: 3 },
                                                    { key: 'pesoMaterialBruto', label: "Peso material bruto", role: 3 },
                                                    { key: 'clasificacion', label: "Clasificacion", role: 3 },
                                                ].map(({ key, label, role }) => {
                                                    const value = key === 'OUM' ? (item.oum || item.OUM || item.uom || item.UOM) : item[key];
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

                                                    if (key === 'codigo') {
                                                        return (
                                                            <div key={key} style={{
                                                                padding: '12px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px'
                                                            }}>
                                                                <TextUI size="11px" color={isDark ? '#cbd5e1' : theme?.colors?.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</TextUI>
                                                                <InputUI
                                                                    style={{ height: "30px", fontSize: "14px", minHeight: "30px", textTransform: "uppercase", width: "100%" }}
                                                                    value={value || ""}
                                                                    disabled={item.codigoDisabled}
                                                                    onChange={(v) => actualizarCampoFila(item.id, "codigo", v)}
                                                                />
                                                            </div>
                                                        );
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
                                                toast.success(`Ítem ${item.codigo || item.descripcion} aceptado exitosamente`);
                                                handleActionRol1(item.id, "approve");
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                                    <tr>
                                        <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
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
                                        {/* Rol 3: Técnico */}
                                        {idRolPrincipal === 3 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "350px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripción</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Familia</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Viscosidad</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Clase</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>SAE</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ISOVG</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>API</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ACEA</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>JASO</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ISO DIN</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "130px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Presentación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "110px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Uds. x Pallet</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "110px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Uds. x Caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "240px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Aplicación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Grado de Grasa</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Peso Mat. Bruto</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Clasificación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                            </>
                                        )}
                                        {/* Rol 1: vista consolidada */}
                                        {idRolPrincipal === 1 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Código de Barras</th>

                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cód. Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cód. SHELL</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Marca</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "180px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Extranjero</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Estrategia</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Origen</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Empaque</th>

                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripción</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Familia</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Viscosidad</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Clase</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>SAE</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ISOVG</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>API</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ACEA</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>JASO</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>ISO DIN</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "130px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Presentación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "110px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Uds. x Pallet</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "110px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Uds. x Caja</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "240px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Aplicación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Grado de Grasa</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Peso Mat. Bruto</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Clasificación</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen PNG</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "150px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen WebP</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>OUM (Litros)</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                            </>
                                        )}
                                        {/* Rol 4: Marketing */}
                                        {idRolPrincipal === 4 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "250px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripción</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen PNG</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Imagen WebP</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                            </>
                                        )}
                                        {idRolPrincipal === 5 && (
                                            <>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "220px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripcion</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cód. Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cód. SHELL</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Marca</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "180px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Extranjero</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Estrategia</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Origen</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Empaque</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Unidades</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Medida</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Del Sistema</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>OUM (Litros)</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                            </>
                                        )}
                                        <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10, minWidth: "100px" }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={idRolPrincipal === 5 ? 14 : idRolPrincipal === 3 ? 20 : idRolPrincipal === 4 ? 6 : idRolPrincipal === 1 ? 33 : 7} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
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
                                            {/* === ROL 3: Técnico === */}
                                            {idRolPrincipal === 3 && (
                                                <>
                                                    {/* Descripción */}
                                                    <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "500px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.descripcion}>{item.descripcion || "N/A"}</div></td>
                                                    {/* Familia */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.familia || ""} onChange={(v) => actualizarCampoFila(item.id, "familia", v)} /></td>
                                                    {/* Viscosidad */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.viscosidad || ""} onChange={(v) => actualizarCampoFila(item.id, "viscosidad", v)} /></td>
                                                    {/* Clase */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_CLASE_LUB}
                                                            value={item.clase ? { value: item.clase, label: item.clase } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "clase", v?.value)}
                                                            minWidth="130px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* SAE */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.sae || ""} onChange={(v) => actualizarCampoFila(item.id, "sae", v)} /></td>
                                                    {/* ISOVG */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.isovg || ""} onChange={(v) => actualizarCampoFila(item.id, "isovg", v)} /></td>
                                                    {/* API */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.api || ""} onChange={(v) => actualizarCampoFila(item.id, "api", v)} /></td>
                                                    {/* ACEA */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.acea || ""} onChange={(v) => actualizarCampoFila(item.id, "acea", v)} /></td>
                                                    {/* JASO */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.jaso || ""} onChange={(v) => actualizarCampoFila(item.id, "jaso", v)} /></td>
                                                    {/* ISO DIN */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "90px" }} value={item.isoDin || ""} onChange={(v) => actualizarCampoFila(item.id, "isoDin", v)} /></td>
                                                    {/* Presentación */}
                                                    {/* Presentación */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_PRESENTACION_LUB}
                                                            value={item.presentacion ? { value: item.presentacion, label: item.presentacion } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "presentacion", v?.value)}
                                                            minWidth="110px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Unidades por pallet */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", minWidth: "100px" }} value={item.unidadesPallet || ""} onChange={(v) => actualizarCampoFila(item.id, "unidadesPallet", handleNumericInput(v))} /></td>
                                                    {/* Unidades por caja */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", minWidth: "100px" }} value={item.unidadesCaja || ""} onChange={(v) => actualizarCampoFila(item.id, "unidadesCaja", handleNumericInput(v))} /></td>
                                                    {/* Aplicación */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_APLICACION_LUB}
                                                            value={item.aplicacion ? { value: item.aplicacion, label: item.aplicacion } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "aplicacion", v?.value)}
                                                            minWidth="230px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Grado de Grasa */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_GRADO_GRASA_LUB}
                                                            value={item.gradoGrasa ? { value: item.gradoGrasa, label: item.gradoGrasa } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "gradoGrasa", v?.value)}
                                                            minWidth="100px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Peso Material Bruto */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", minWidth: "130px" }} value={item.pesoMaterialBruto || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "pesoMaterialBruto", handleDecimalInput(v))} /></td>
                                                    {/* Clasificación */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_CLASIFICACION_LUB}
                                                            value={item.clasificacion ? { value: item.clasificacion, label: item.clasificacion } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "clasificacion", v?.value)}
                                                            minWidth="130px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Comentarios */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }} value={item.comentarios || ""} onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)} />
                                                    </td>
                                                </>
                                            )}
                                            {/* === ROL 1: vista consolidada === */}
                                            {idRolPrincipal === 1 && (
                                                <>
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.codigo || ""} disabled={item.codigoDisabled} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.codigoProveedor}>{item.codigoProveedor || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.codigoShell}>{item.codigoShell || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.marca}>{item.marca || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreExtranjero}>{item.nombreExtranjero || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.estrategia}>{item.estrategia || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.origen}>{item.origen || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.empaque}>{item.empaque || "-"}</div></td>

                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.descripcion}>{item.descripcion || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.familia}>{item.familia || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.viscosidad}>{item.viscosidad || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.clase}>{item.clase || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.sae}>{item.sae || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.isovg}>{item.isovg || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.api}>{item.api || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.acea}>{item.acea || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.jaso}>{item.jaso || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.isoDin}>{item.isoDin || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.presentacion}>{item.presentacion || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.unidadesPallet}>{item.unidadesPallet || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.unidadesCaja}>{item.unidadesCaja || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.aplicacion}>{item.aplicacion || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.gradoGrasa}>{item.gradoGrasa || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.pesoMaterialBruto}>{item.pesoMaterialBruto || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.clasificacion}>{item.clasificacion || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.imagenPng?.name}>{item.imagenPng?.name || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.imagenWebp?.name}>{item.imagenWebp?.name || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.oum || item.OUM || item.uom || item.UOM}>{item.oum || item.OUM || item.uom || item.UOM || "-"}</div></td>
                                                    <td style={{ padding: "4px 8px" }}><div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.comentarios}>{item.comentarios || "-"}</div></td>
                                                </>
                                            )}
                                            {/* === ROL 4: Marketing === */}
                                            {idRolPrincipal === 4 && (
                                                <>
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                            {item.descripcion || "-"}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <div style={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            height: '40px',
                                                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                            border: `1px dashed ${isDark ? '#475569' : '#cbd5e1'}`,
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            overflow: 'hidden'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = theme?.colors?.primary;
                                                                e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                                                                e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
                                                            }}
                                                            onClick={() => document.getElementById(`png-upload-${item.id}`).click()}
                                                        >
                                                            {item.imagenPng ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                    <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {item.imagenPng.name}
                                                                    </TextUI>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ color: theme?.colors?.primary, fontSize: '14px' }}>📄</span>
                                                                    <TextUI size="11px" color={theme?.colors?.textSecondary} weight="500">Subir PNG</TextUI>
                                                                </div>
                                                            )}
                                                            <input
                                                                id={`png-upload-${item.id}`}
                                                                type="file"
                                                                accept=".png"
                                                                style={{ display: 'none' }}
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        if (file.type !== "image/png") {
                                                                            toast.error("Solo se permiten archivos PNG");
                                                                            return;
                                                                        }
                                                                        if (file.size > 2 * 1024 * 1024) {
                                                                            toast.error("La imagen PNG no debe superar 2MB");
                                                                            return;
                                                                        }
                                                                        actualizarCampoFila(item.id, "imagenPng", file);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <div style={{
                                                            position: 'relative',
                                                            width: '100%',
                                                            height: '40px',
                                                            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                            border: `1px dashed ${isDark ? '#475569' : '#cbd5e1'}`,
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            overflow: 'hidden'
                                                        }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = theme?.colors?.primary;
                                                                e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                                                                e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#f8fafc';
                                                            }}
                                                            onClick={() => document.getElementById(`webp-upload-${item.id}`).click()}
                                                        >
                                                            {item.imagenWebp ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                    <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {item.imagenWebp.name}
                                                                    </TextUI>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ color: theme?.colors?.primary, fontSize: '14px' }}>🖼️</span>
                                                                    <TextUI size="11px" color={theme?.colors?.textSecondary} weight="500">Subir WEBP</TextUI>
                                                                </div>
                                                            )}
                                                            <input
                                                                id={`webp-upload-${item.id}`}
                                                                type="file"
                                                                accept=".webp"
                                                                style={{ display: 'none' }}
                                                                onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        if (file.type !== "image/webp") {
                                                                            toast.error("Solo se permiten archivos WEBP");
                                                                            return;
                                                                        }
                                                                        if (file.size > 2 * 1024 * 1024) {
                                                                            toast.error("La imagen WEBP no debe superar 2MB");
                                                                            return;
                                                                        }
                                                                        actualizarCampoFila(item.id, "imagenWebp", file);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <InputUI
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                            value={item.comentarios || ""}
                                                            onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                        />
                                                    </td>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    {/* Descripción */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        {item.fueRechazado ? (
                                                            <div style={{ fontSize: "12px", minHeight: "30px", display: "flex", alignItems: "center", padding: "0 8px", backgroundColor: hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }), borderRadius: "4px", color: theme?.colors?.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: "220px" }} title={item.descripcionRol5}>
                                                                {item.descripcionRol5 || "-"}
                                                            </div>
                                                        ) : (
                                                            <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "220px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} />
                                                        )}
                                                    </td>
                                                    {/* Código Proveedor */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "140px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></td>
                                                    {/* Código SHELL */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "140px" }} value={item.codigoShell || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoShell", v)} /></td>
                                                    {/* Marca */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "160px" }} value={item.marca || ""} onChange={(v) => actualizarCampoFila(item.id, "marca", v)} /></td>
                                                    {/* Nombre Foráneo */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></td>
                                                    {/* Estrategia */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_ESTRATEGIA_LUB}
                                                            value={item.estrategia ? { value: item.estrategia, label: item.estrategia } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "estrategia", v?.value)}
                                                            minWidth="110px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Origen */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_ORIGEN_LUB}
                                                            value={item.origen ? { value: item.origen, label: item.origen } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "origen", v?.value)}
                                                            minWidth="150px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Empaque (entero) */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", minWidth: "90px" }} value={item.empaque || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "empaque", handleNumericInput(v))} /></td>
                                                    {/* Unidades (entero) */}
                                                    <td style={{ padding: "4px 8px" }}><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", minWidth: "90px" }} value={item.unidades || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "unidades", handleNumericInput(v))} /></td>
                                                    {/* Medida */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={OPTIONS_MEDIDA_LUB}
                                                            value={item.medida ? { value: item.medida, label: item.medida } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "medida", v?.value)}
                                                            minWidth="90px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Nombre del Sistema */}
                                                    <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></td>
                                                    {/* oum */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.oum || item.OUM || item.uom || item.UOM || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "oum", handleDecimalInput(v))} />
                                                    </td>
                                                    {/* Comentarios */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }} value={item.comentarios || ""} onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)} />
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                                {((idRolPrincipal === 5 || idRolPrincipal === 3 || idRolPrincipal === 4) && item.fueRechazado) ? (
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
                                                ) : idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                    <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        );
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

                                if (idRolPrincipal === 5) {
                                    const createdItems = currentItems.filter(i => !i.fueRechazado);
                                    if (createdItems.length > 0) {
                                        // Agrupar items por empresa para el modal de SAP, solo los nuevos
                                        const grouped = {};
                                        createdItems.forEach(item => {
                                            const companyName = EMPRESA_LUBRICANTES;
                                            if (!grouped[companyName]) grouped[companyName] = [];
                                            grouped[companyName].push({
                                                CODIGO_PROVEEDOR: item.codigoProveedor,
                                                MARCA: item.marca,
                                                LINEA_NEGOCIO: item.linea,
                                                NOMBRE_EXTRANJERO: item.nombreExtranjero,
                                                DESCRIPCION: item.nombreSistema,
                                            });
                                        });
                                        setGroupedItemsByCompany(grouped);
                                        setIsSAPModalOpen(true);
                                        return;
                                    }
                                }

                                await handleFinalSubmit(currentItems);
                            }}
                            pcolor={theme?.colors?.primary}
                        />
                    </div>
                )}
            </div>

            {/* Sección de Aprobados */}
            {lineaSeleccionada && (idRolPrincipal === 3 || idRolPrincipal === 4 || idRolPrincipal === 5) && approvedItems.filter(i => i.linea === lineaSeleccionada.value).length > 0 && (
                <div style={{ marginTop: "200px", backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column", flex: "0 0 100%", marginBottom: "80px" }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, backgroundColor: theme?.colors?.success + "11", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <TextUI size="14px" weight="600" color={theme?.colors?.success}>
                            Aprobados {lineaSeleccionada ? `de ${lineaSeleccionada.label}` : ""} ({approvedItems.filter(i => i.linea === lineaSeleccionada.value).length})
                        </TextUI>
                    </div>
                    <div style={{ flex: 1, overflow: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Empresa</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Código SAP</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "250px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Código de barras</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "350px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Descripción</th>
                                    <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Marca</th>

                                </tr>
                            </thead>
                            <tbody>
                                {approvedItems.filter(i => i.linea === lineaSeleccionada.value).map(item => (
                                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, opacity: 0.8 }}>
                                        <td style={{ padding: "10px 16px" }}><TextUI size="12px">{EMPRESA_LUBRICANTES}</TextUI></td>
                                        <td style={{ padding: "10px 16px" }}><TextUI size="12px">{item.CODIGO_SAP || "-"}</TextUI></td>
                                        <td style={{ padding: "10px 16px" }}><TextUI size="12px">{item.codigo || item.CODIGO_BARRAS || "-"}</TextUI></td>
                                        <td style={{ padding: "10px 16px" }}><TextUI size="12px">{item.nombreSistema || item.descripcionRol5 || item.descripcion || "-"}</TextUI></td>
                                        <td style={{ padding: "10px 16px" }}><TextUI size="12px">{item.marca || "-"}</TextUI></td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                    toast.error(`Ítem ${itemToReject?.codigo || itemToReject?.descripcion} rechazado hacia: ${rolesText}.`);
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
                        placeholder="Buscar por código, nombre, modelo o fabricante..."
                        value={searchTermReview}
                        onChange={(v) => setSearchTermReview(v)}
                        iconLeft="FaSearch"
                    />
                    <div style={{ maxHeight: "400px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "40px" }}></th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: '80px' }}>Código</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Nombre</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Modelo</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Marca</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItemsToReview.map(item => (
                                    <tr
                                        key={item.DIT_NUEVOIDENTIFICADOR}
                                        style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, cursor: "pointer" }}
                                        onClick={() => {
                                            setSelectedItemsToReviewIds(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(item.DIT_NUEVOIDENTIFICADOR)) newSet.delete(item.DIT_NUEVOIDENTIFICADOR);
                                                else newSet.add(item.DIT_NUEVOIDENTIFICADOR);
                                                return newSet;
                                            });
                                        }}
                                    >
                                        <td style={{ padding: "10px", textAlign: "center" }}>
                                            <CheckboxUI
                                                checked={selectedItemsToReviewIds.has(item.DIT_NUEVOIDENTIFICADOR)}
                                                onChange={() => { }} // handled by tr onClick
                                            />
                                        </td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NUEVOIDENTIFICADOR}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_NOMBRE}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_MODELO}</td>
                                        <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.DIT_MARCA}</td>
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
                                    const promises = selectedIds.map(id => createItemFromDWH("LUBRICANTES", id));
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

            <ModalUI
                isOpen={isSAPModalOpen}
                onClose={() => setIsSAPModalOpen(false)}
                title="Descargar datos para subir a SAP"
                width="500px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <TextUI text="Se han generado los siguientes archivos por empresa. Por favor descargue cada uno para subir a SAP antes de continuar." variant="small" />
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                        {Object.keys(groupedItemsByCompany).map(companyName => (
                            <ButtonUI
                                key={companyName}
                                text={`Descargar ${companyName}`}
                                iconLeft="FaDownload"
                                onClick={() => generateSAPExport(companyName, groupedItemsByCompany[companyName], caracteristicasMDM)}
                            />
                        ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${theme?.colors?.border || "#eee"}`, paddingTop: "16px", marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <ButtonUI
                            text="Cancelar"
                            variant="outlined"
                            onClick={() => setIsSAPModalOpen(false)}
                        />
                        <ButtonUI
                            text="Continuar con el envío"
                            pcolor={theme?.colors?.primary}
                            onClick={() => {
                                const currentItems = items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id));
                                handleFinalSubmit(currentItems);
                            }}
                        />
                    </div>
                </div>
            </ModalUI>

            <ModalUI
                isOpen={isSAPExportModalOpen}
                onClose={() => setIsSAPExportModalOpen(false)}
                title="Exportar ítems aprobados a SAP"
                width="1000px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <TextUI size="14px" color={theme?.colors?.textSecondary}>
                        Se muestran todos los ítems aprobados ordenados por fecha de actualización.
                    </TextUI>
                    <div style={{ maxHeight: "500px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "50px" }}>
                                        <CheckboxUI
                                            checked={approvedItemsForExport.length > 0 && approvedItemsForExport.every(i => selectedApprovedItemIds.has(i.ID))}
                                            onChange={(_, checked) => {
                                                if (checked) setSelectedApprovedItemIds(new Set(approvedItemsForExport.map(i => i.ID)));
                                                else setSelectedApprovedItemIds(new Set());
                                            }}
                                        />
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Aprobado el</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItemsForExport.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary }}>No hay ítems aprobados para exportar.</td>
                                    </tr>
                                ) : (
                                    approvedItemsForExport.map(item => (
                                        <tr key={item.ID} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <td style={{ padding: "10px", textAlign: "center" }}>
                                                <CheckboxUI
                                                    checked={selectedApprovedItemIds.has(item.ID)}
                                                    onChange={(_, checked) => {
                                                        setSelectedApprovedItemIds(prev => {
                                                            const newSet = new Set(prev);
                                                            if (checked) newSet.add(item.ID);
                                                            else newSet.delete(item.ID);
                                                            return newSet;
                                                        });
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.CODIGO_SAP || "-"}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text, fontSize: "12px" }}>{item.NOMBRE || item.DESCRIPCION || "-"}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.textSecondary, fontSize: "11px" }}>{new Date(item.updatedAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                        {Object.entries(
                            approvedItemsForExport
                                .filter(it => selectedApprovedItemIds.has(it.ID))
                                .reduce((acc, it) => {
                                    if (!acc[it.EMPRESA]) acc[it.EMPRESA] = [];
                                    acc[it.EMPRESA].push({
                                        ...it,
                                        linea: lineaSeleccionada?.value, // Necesario para el ecovalor
                                        LINEA_NEGOCIO: it.LINEA_NEGOCIO || lineaSeleccionada?.value
                                    });
                                    return acc;
                                }, {})
                        ).map(([empresa, items]) => (
                            <ButtonUI
                                key={empresa}
                                text={`Exportar ${empresa} (${items.length})`}
                                iconLeft="FaDownload"
                                onClick={() => generateSAPExport(empresa, items, caracteristicasMDM)}
                                pcolor={theme?.colors?.success || "#28a745"}
                            />
                        ))}
                    </div>
                </div>
            </ModalUI>
        </div>
    );
}

export default Lubricantes;
