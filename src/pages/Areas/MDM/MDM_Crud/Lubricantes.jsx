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
import { IconUI } from "components/UI/Components/IconsUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";
import { parseLlantas, getItemsByRole, saveItemRole5, patchItemRole3, rejectItemPhase, uploadItemImages, uploadItemImagesSharepoint, checkDesignImage, linkExistingItemImage, getItemsDWHByLinea, createItemFromDWH, approveItemMDM, getItemsCaracteristicas, getGruposUnidades, syncItemsToSap } from "services/mdmService";
import { ListarEmpresasAdmin } from "services/administracionService";
import { ListarProveedores } from "services/importacionesService";
import { generateSAPExport } from "assets/templates/mdmTemplate";
import styled from "styled-components";

/* ------------------------------------------------------------------ */
/* Primitivas de tabla (mismo patrón que Llantas.jsx) — usadas por la   */
/* sección "Aprobados" y por el modal "Detalle del producto".           */
/* ------------------------------------------------------------------ */

const TablaScroll = styled.div`
    flex: 1;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme?.colors?.backgroundLight || "#fafafa"};
    }
    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme?.colors?.borderDark || "#ced4da"};
        border-radius: 5px;
    }
    &::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
    }
    &::-webkit-scrollbar-corner {
        background: ${({ theme }) => theme?.colors?.backgroundLight || "#fafafa"};
    }
`;

const Tabla = styled.table`
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
    text-align: left;
`;

const Th = styled.th`
    position: sticky;
    top: 0;
    z-index: ${({ $fija }) => ($fija ? 5 : 3)};
    ${({ $fija, $offset }) => ($fija === "left" ? `left: ${$offset || "0"};` : "")}
    ${({ $fija, $offset }) => ($fija === "right" ? `right: ${$offset || "0"};` : "")}
    padding: 10px 14px;
    text-align: ${({ $align }) => $align || "left"};
    ${({ $min }) => ($min ? `min-width: ${$min};` : "")}
    ${({ $w, $fija }) =>
        !$w
            ? ""
            : $fija
                ? `width: ${$w}; min-width: ${$w}; max-width: ${$w};`
                : `width: ${$w};`}
    white-space: nowrap;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    background-color: #3c3c3b;
    color: ${({ theme }) => theme?.colors?.white || "#ffffff"};
    border-bottom: 2px solid ${({ theme }) => theme?.colors?.white || "#ffffff"};
    border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.white || "#ffffff", alpha: 0.25 })};

    ${({ $fija, theme }) =>
        $fija === "left"
            ? `border-right: 2px solid ${theme?.colors?.white || "#ffffff"};`
            : ""}
    ${({ $fija, theme }) =>
        $fija === "right"
            ? `border-left: 2px solid ${theme?.colors?.white || "#ffffff"};`
            : ""}
`;

const Td = styled.td`
    padding: ${({ $densa }) => ($densa ? "4px 8px" : "9px 14px")};
    text-align: ${({ $align }) => $align || "left"};
    vertical-align: middle;
    max-width: none;
    border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};
    border-right: 1px solid ${({ theme }) => theme?.colors?.borderLight || "#e9ecef"};

    ${({ $fija }) =>
        $fija
            ? `position: sticky; z-index: 2; background-color: inherit;`
            : ""}
    ${({ $fija, $offset }) => ($fija === "left" ? `left: ${$offset || "0"};` : "")}
    ${({ $fija, $offset }) => ($fija === "right" ? `right: ${$offset || "0"};` : "")}
    ${({ $w, $fija }) =>
        $w && $fija ? `width: ${$w}; min-width: ${$w}; max-width: ${$w};` : ""}
    ${({ $fija, theme }) =>
        $fija === "left"
            ? `border-right: 2px solid ${theme?.colors?.border || "#dee2e6"};`
            : ""}
    ${({ $fija, theme }) =>
        $fija === "right"
            ? `border-left: 2px solid ${theme?.colors?.border || "#dee2e6"};`
            : ""}
`;

const FILA_HOVER = { claro: "#eef0f2", oscuro: "#343434" };
const FILA_SELECCION = { claro: "#e4e7eb", oscuro: "#3d3d3d" };

const tonoFila = (theme, tono) =>
    theme?.name === "dark" ? tono.oscuro : tono.claro;

const Fila = styled.tr`
    background-color: ${({ theme, $par }) =>
        $par
            ? theme?.colors?.backgroundLight || "#fafafa"
            : theme?.colors?.background || "#f5f5f5"};
    transition: background-color 0.12s ease;

    ${({ theme, $sel }) =>
        $sel ? `background-color: ${tonoFila(theme, FILA_SELECCION)};` : ""}

    &:hover {
        background-color: ${({ theme }) => tonoFila(theme, FILA_HOVER)};
    }
`;

/* Distintivo de estado para el detalle informativo del ítem */
const TONOS_ETIQUETA = {
    exito: "success",
    alerta: "error",
    info: "info",
    neutro: "textSecondary",
};

const Etiqueta = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    color: ${({ theme, $tono }) => theme?.colors?.[TONOS_ETIQUETA[$tono] || "textSecondary"] || "#6c757d"};
    background-color: ${({ theme, $tono }) =>
        hexToRGBA({
            hex: theme?.colors?.[TONOS_ETIQUETA[$tono] || "textSecondary"] || "#6c757d",
            alpha: 0.12,
        })};
    border: 1px solid ${({ theme, $tono }) =>
        hexToRGBA({
            hex: theme?.colors?.[TONOS_ETIQUETA[$tono] || "textSecondary"] || "#6c757d",
            alpha: 0.35,
        })};
`;

const EMPRESA_LUBRICANTES = "MAXXIMUNDO";

// Código numérico de empresa que espera el servicio web de proveedores (distinto del ID interno del portal).
const CODIGO_EMPRESA_PROVEEDORES = {
    AUTOLLANTA: 1,
    MAXXIMUNDO: 2,
    STOX: 3,
    IKONIX: 4,
    AUTOMAX: 5,
};

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

// Opciones Estrategia
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

/* Ancho exacto de la columna de selección de fila: es el desplazamiento con
   el que se congela la columna Nombre, así que no puede negociarlo el navegador. */
const ANCHO_COL_SELECCION_LUB = "40px";

/* Bandera "Visible EasySales" del ítem: por defecto true (equivalente al "SI"
   que el export SAP enviaba siempre en U_MA_ITM_EASY antes de existir este
   checkbox), así los ítems ya cargados sin el campo no cambian de comportamiento. */
const esVisibleEasySales = (item) =>
    item?.visibleEasySales !== undefined && item?.visibleEasySales !== null
        ? Boolean(item.visibleEasySales)
        : true;

const calcularNombreSistemaFinal = (nombreBase, isNew = false) => {
    if (!nombreBase) return "";
    // Limpiamos cualquier "NEW " previo para evitar duplicaciones si se rellama la función
    let baseLimpia = nombreBase.startsWith("NEW ") ? nombreBase.replace(/^NEW\s+/, "") : nombreBase;
    return isNew ? `NEW ${baseLimpia}` : baseLimpia;
};


// Línea fija para esta página — definida a nivel módulo para referencia estable
const LINEA_LUBRICANTES = { value: "LUBRICANTES", label: "LUBRICANTES" };

/* Roles del flujo MDM (id_rol → nombre), usado solo para las etiquetas de
   fase de la Trazabilidad del modal de Detalle (genérico, igual que en Llantas.jsx). */
const NOMBRES_ROL = {
    1: "Comercial",
    2: "Ventas",
    3: "Tecnico",
    4: "Marketing",
    5: "Compras",
    6: "Bodega",
};

/* Cada fase la ejecuta un rol concreto: FASE 1 = creación (rol 5), FASE 2 =
   revisión técnica (rol 3), FASE 3 = imágenes (rol 4), FASE 4 = aprobación (rol 1). */
const NOMBRES_FASE = {
    1: `Creación (${NOMBRES_ROL[5]})`,
    2: `Revisión técnica (${NOMBRES_ROL[3]})`,
    3: `Imágenes (${NOMBRES_ROL[4]})`,
    4: `Aprobación (${NOMBRES_ROL[1]})`,
};

/* Campos del detalle informativo de un ítem aprobado de Lubricantes.
   Los ítems se construyen con `...it`, así que conservan tanto los campos
   normalizados del front (camelCase) como los que devuelve el backend
   (SCREAMING_SNAKE); se toma el primero disponible. Las filas sin valor no
   se pintan. No existe campo "diseño" en esta línea de negocio. */
const CAMPOS_DETALLE = [
    { label: "Código SAP", get: (it) => it.CODIGO_SAP },
    { label: "Código de barras", get: (it) => it.codigo || it.CODIGO_BARRAS },
    { label: "Código proveedor", get: (it) => it.codigoProveedor || it.CODIGO_PROVEEDOR },
    { label: "Código Shell", get: (it) => it.codigoShell || it.CODIGO_SHELL },
    { label: "Línea de negocio", get: (it) => it.linea || it.LINEA_NEGOCIO },
    { label: "Marca", get: (it) => it.marca || it.MARCA },
    { label: "Nombre del sistema", get: (it) => it.nombreSistema },
    { label: "Descripción", get: (it) => it.descripcion || it.descripcionRol5 || it.DESCRIPCION || it.NOMBRE },
    { label: "Nombre extranjero", get: (it) => it.nombreExtranjero || it.NOMBRE_FORANEO || it.NOMBRE_EXTRANJERO },
    { label: "Estrategia", get: (it) => it.estrategia || it.ESTRATEGIA },
    { label: "Origen", get: (it) => it.origen || it.ORIGEN },
    { label: "Empaque", get: (it) => it.empaque || it.EMPAQUE },
    { label: "OUM", get: (it) => it.oum || it.OUM || it.uom || it.UOM },
    { label: "Familia", get: (it) => it.familia || it.FAMILIA },
    { label: "Viscosidad", get: (it) => it.viscosidad || it.VISCOSIDAD },
    { label: "Clase", get: (it) => it.clase || it.CLASE },
    { label: "SAE", get: (it) => it.sae || it.SAE },
    { label: "ISOVG", get: (it) => it.isovg || it.ISOVG },
    { label: "API", get: (it) => it.api || it.API },
    { label: "ACEA", get: (it) => it.acea || it.ACEA },
    { label: "JASO", get: (it) => it.jaso || it.JASO },
    { label: "ISO DIN", get: (it) => it.isoDin || it.ISO_DIN },
    { label: "Pallets", get: (it) => it.pallets || it.PALLETS },
    { label: "Presentación", get: (it) => it.presentacion || it.PRESENTACION },
    { label: "Unidades por pallet", get: (it) => it.unidadesPallet || it.UNIDADES_POR_PALLET },
    { label: "Unidades por caja", get: (it) => it.unidadesCaja || it.UNIDADES_POR_CAJA },
    { label: "Aplicación", get: (it) => it.aplicacion || it.APLICACION },
    { label: "Grado de grasa", get: (it) => it.gradoGrasa || it.GRADO_DE_LA_GRASA },
    { label: "Peso material bruto", get: (it) => it.pesoMaterialBruto || it.PESO_MATERIAL_BRUTO },
    { label: "Clasificación", get: (it) => it.clasificacion || it.CLASIFICACION },
    { label: "Observaciones", get: (it) => it.comentarios || it.OBSERVACIONES },
];

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
    const [opcionesPallets, setOpcionesPallets] = useState([]);
    const [opcionesProveedores, setOpcionesProveedores] = useState([]);

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

    useEffect(() => {
        const fetchPalletsOptions = async () => {
            try {
                const response = await getGruposUnidades(EMPRESA_LUBRICANTES);
                if (response?.status === "Ok!" && Array.isArray(response?.data)) {
                    setOpcionesPallets(response.data.map(item => ({
                        value: item.UGP_ENTRY,
                        label: item.UGP_NAME
                    })));
                } else {
                    setOpcionesPallets([]);
                }
            } catch (error) {
                console.error(`Error fetching pallets options for ${EMPRESA_LUBRICANTES}:`, error);
                setOpcionesPallets([]);
            }
        };

        const fetchProveedoresOptions = async () => {
            try {
                const codigoEmpresa = CODIGO_EMPRESA_PROVEEDORES[EMPRESA_LUBRICANTES];
                const data = await ListarProveedores(codigoEmpresa);
                setOpcionesProveedores(Array.isArray(data) ? data.map(({ value, name }) => ({ value, label: name })) : []);
            } catch (error) {
                console.error(`Error fetching proveedores options for ${EMPRESA_LUBRICANTES}:`, error);
                setOpcionesProveedores([]);
            }
        };

        fetchPalletsOptions();
        fetchProveedoresOptions();
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const debounceTimeouts = useRef({});
    // Resultado de verificar si el diseño (MARCA + NOMBRE, clave local del front — no existe
    // campo DISEÑO en Lubricantes) ya tiene imagen en storage, indexado por esa clave, para no
    // pedirle al coordinador (rol 4) que la vuelva a subir.
    const [imagenesDisenioExistente, setImagenesDisenioExistente] = useState({});
    // Diseños cuya verificación contra el backend todavía está en curso: mientras esté aquí,
    // el input de subida se bloquea para no subir una imagen antes de saber si ya existía una.
    const [disenioVerificando, setDisenioVerificando] = useState({});
    const disenioCheckEnCurso = useRef(new Set());
    const [detalleItem, setDetalleItem] = useState(null);
    // Actualización de imágenes de un producto ya aprobado (rol 4), desde el modal de Detalle:
    // { webp: bool, png: bool } indica si hay una subida en curso para ese tipo de imagen.
    const [subiendoImagenDetalle, setSubiendoImagenDetalle] = useState({ webp: false, png: false });

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
    const [isSyncingSap, setIsSyncingSap] = useState(false);
    const [searchTermExport, setSearchTermExport] = useState("");

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

    const filteredApprovedItemsForExport = useMemo(() => {
        if (!searchTermExport) return approvedItemsForExport;
        const lowSearch = searchTermExport.toLowerCase();
        return approvedItemsForExport.filter(item =>
            String(item.EMPRESA || "").toLowerCase().includes(lowSearch) ||
            String(item.CODIGO_SAP || "").toLowerCase().includes(lowSearch) ||
            String(item.NOMBRE || item.DESCRIPCION || "").toLowerCase().includes(lowSearch)
        );
    }, [approvedItemsForExport, searchTermExport]);

    /* Paginación de los modales "Seleccionar ítems para revisar" y "Exportar ítems
       aprobados a SAP": renderizar de una sola vez listas grandes (DWH, histórico de
       aprobados) rompía la tabla, así que solo se pinta una página a la vez. */
    const ITEMS_POR_PAGINA_MODAL = 20;
    const [paginaReview, setPaginaReview] = useState(1);
    const [paginaExport, setPaginaExport] = useState(1);

    useEffect(() => { setPaginaReview(1); }, [searchTermReview, itemsToReview]);
    useEffect(() => { setPaginaExport(1); }, [searchTermExport, approvedItemsForExport]);

    const totalPaginasReview = Math.max(1, Math.ceil(filteredItemsToReview.length / ITEMS_POR_PAGINA_MODAL));
    const itemsToReviewPaginados = filteredItemsToReview.slice(
        (paginaReview - 1) * ITEMS_POR_PAGINA_MODAL,
        paginaReview * ITEMS_POR_PAGINA_MODAL,
    );

    const totalPaginasExport = Math.max(1, Math.ceil(filteredApprovedItemsForExport.length / ITEMS_POR_PAGINA_MODAL));
    const approvedItemsForExportPaginados = filteredApprovedItemsForExport.slice(
        (paginaExport - 1) * ITEMS_POR_PAGINA_MODAL,
        paginaExport * ITEMS_POR_PAGINA_MODAL,
    );

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
                                pallets: it.PALLETS || "",
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
                                // Mismo criterio que ES_NUEVO en las otras líneas: sin valor del backend, esVisibleEasySales() aplica el fallback (true)
                                visibleEasySales: it.VISIBLE_EASYSALES !== undefined && it.VISIBLE_EASYSALES !== null ? Boolean(it.VISIBLE_EASYSALES) : undefined,
                                descripcionRol5: it.NOMBRE || it.DESCRIPCION || "",
                                descripcion: it.NOMBRE || it.DESCRIPCION || "",
                                parsedData: parsed,
                                nombreSistemaBase: parsed["Posible Descripcion"] || it.NOMBRE || it.DESCRIPCION || "",
                                nombreSistema: calcularNombreSistemaFinal(parsed["Posible Descripcion"] || it.NOMBRE || it.DESCRIPCION || "", it.COLOR_LETRA || "", false),
                                codigoProveedor: it.CODIGO_PROVEEDOR || "",
                                proveedor: it.ID_PROVEEDOR || "",
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
                                proveedor: it.ID_PROVEEDOR || "",
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

    // Cuando se reemplaza una imagen ya existente, la key en storage (y por lo tanto la URL) no
    // cambia: el navegador ya tiene esa URL cacheada y seguiría mostrando la versión vieja hasta
    // recargar la página. Agregar un parámetro único fuerza a que se pida de nuevo.
    const agregarCacheBusting = (url) => {
        if (!url) return url;
        const separador = url.includes('?') ? '&' : '?';
        return `${url}${separador}_v=${Date.now()}`;
    };

    // Clave LOCAL (solo de front) para agrupar ítems que comparten la misma imagen: no existe
    // campo DISEÑO en Lubricantes, así que se usa MARCA + NOMBRE resuelto. El backend resuelve
    // el identificador real de imagen contra el DWH usando solo el ID del ítem (checkDesignImage/
    // linkExistingItemImage ya no reciben MARCA/DISEÑO); esta clave únicamente evita llamarlo
    // varias veces para ítems que, a simple vista del front, comparten diseño. Si el ítem no
    // tiene nombre resuelto, se usa una clave única por ID para no romper la deduplicación.
    const getDisenioKey = (item) => {
        if (!item) return null;
        const nombre = item.nombreSistema || item.descripcionRol5 || item.descripcion || item.NOMBRE || item.DESCRIPCION;
        if (item.marca && nombre) {
            return `${String(item.marca).trim().toUpperCase()}|${String(nombre).trim().toUpperCase()}`;
        }
        const id = item.ID ?? item.id;
        return id !== undefined && id !== null ? `ITEM_${id}` : null;
    };

    // Consulta al backend si el ítem ya tiene imagen en storage (R2/SharePoint) y guarda el
    // resultado en imagenesDisenioExistente, indexado por la clave local. Se usa tanto para la
    // grilla de pendientes (rol 4) como para el modal de Detalle del producto.
    const verificarImagenDisenio = useCallback((item, linea) => {
        const clave = getDisenioKey(item);
        if (!clave || imagenesDisenioExistente[clave] || disenioCheckEnCurso.current.has(clave)) return;
        disenioCheckEnCurso.current.add(clave);
        setDisenioVerificando(prev => ({ ...prev, [clave]: true }));
        checkDesignImage(linea, item.ID ?? item.id)
            .then(result => {
                if (result) {
                    setImagenesDisenioExistente(prev => ({ ...prev, [clave]: result }));
                }
            })
            .catch(err => {
                console.error(`Error al verificar imagen existente para ${clave}:`, err);
            })
            .finally(() => {
                disenioCheckEnCurso.current.delete(clave);
                setDisenioVerificando(prev => {
                    const next = { ...prev };
                    delete next[clave];
                    return next;
                });
            });
    }, [imagenesDisenioExistente]);

    // Rol 4 (coordinador de imágenes): las imágenes se suben una vez por diseño, no por ítem.
    // Antes de forzar la subida, se verifica si el diseño ya tiene imagen en storage (Cloudflare
    // R2 / SharePoint) para no pedirla nuevamente.
    useEffect(() => {
        if (idRolPrincipal !== 4 || !lineaSeleccionada) return;

        const pendientes = items.filter(it => it.linea === lineaSeleccionada.value && getDisenioKey(it));
        const clavesUnicas = new Map();
        pendientes.forEach(it => {
            const clave = getDisenioKey(it);
            if (clave && !clavesUnicas.has(clave)) {
                clavesUnicas.set(clave, it);
            }
        });

        clavesUnicas.forEach(it => verificarImagenDisenio(it, lineaSeleccionada.value));
    }, [idRolPrincipal, lineaSeleccionada, items, verificarImagenDisenio]);

    // Al abrir el detalle de un producto aprobado (rol 4), se verifica igual el diseño para
    // poder mostrar las miniaturas de SharePoint/R2 en la ficha, aunque el ítem ya no esté
    // en la grilla de pendientes.
    useEffect(() => {
        if (idRolPrincipal !== 4 || !detalleItem) return;
        const linea = detalleItem.linea || detalleItem.LINEA_NEGOCIO || lineaSeleccionada?.value;
        if (!linea) return;
        verificarImagenDisenio(detalleItem, linea);
    }, [idRolPrincipal, detalleItem, lineaSeleccionada, verificarImagenDisenio]);

    // Bloquea la subida mientras no se sepa con certeza si el diseño ya tiene imagen en storage:
    // subir "a ciegas" durante ese lapso podría generar un archivo huérfano o duplicado.
    const disenioEstaVerificando = (item) => {
        const clave = getDisenioKey(item);
        return clave ? Boolean(disenioVerificando[clave]) : false;
    };
    const hayVerificacionesPendientes = (currentItems) => currentItems.some(disenioEstaVerificando);

    // Actualiza la imagen (WebP en R2, o PNG en SharePoint) de un producto ya aprobado, desde el
    // modal de Detalle del producto. Al ser el mismo diseño, la subida sobrescribe la imagen
    // existente: es justamente el flujo para corregir/reemplazar una imagen ya publicada.
    const handleActualizarImagenDetalle = async (tipo, file) => {
        if (!detalleItem) return;
        const linea = detalleItem.linea || detalleItem.LINEA_NEGOCIO || lineaSeleccionada?.value;
        if (!linea) return;

        if (tipo === "webp" && file.type !== "image/webp") {
            toast.error("Solo se permiten archivos WEBP");
            return;
        }
        if (tipo === "png" && file.type !== "image/png") {
            toast.error("Solo se permiten archivos PNG");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error(`La imagen ${tipo.toUpperCase()} no debe superar 2MB`);
            return;
        }

        const clave = getDisenioKey(detalleItem);
        setSubiendoImagenDetalle(prev => ({ ...prev, [tipo]: true }));
        try {
            if (tipo === "webp") {
                const res = await uploadItemImages(linea, detalleItem.ID ?? detalleItem.id, detalleItem.marca, null, null, file);
                // Al reemplazar una imagen ya existente, la key (y por lo tanto la URL) es la misma
                // de antes: sin este parámetro el navegador sirve la versión cacheada y no se ve el
                // cambio hasta recargar la página.
                const nuevaUrl = agregarCacheBusting(res?.data?.urls?.webp);
                if (clave && nuevaUrl) {
                    setImagenesDisenioExistente(prev => ({
                        ...prev,
                        [clave]: { ...prev[clave], webp: { exists: true, key: res.data.RUTA_IMAGEN_WEBP, url: nuevaUrl } },
                    }));
                }
                setDetalleItem(prev => prev ? { ...prev, RUTA_IMAGEN_WEBP: nuevaUrl || prev.RUTA_IMAGEN_WEBP } : prev);
            } else {
                const empresaToSend = detalleItem.EMPRESA || EMPRESA_LUBRICANTES;
                const res = await uploadItemImagesSharepoint(linea, detalleItem.ID ?? detalleItem.id, detalleItem.marca, empresaToSend, null, file, null);
                const nuevaUrl = res?.data?.urls?.png;
                const nuevaPreview = agregarCacheBusting(res?.data?.urls?.pngPreview || nuevaUrl);
                if (clave && nuevaUrl) {
                    setImagenesDisenioExistente(prev => ({
                        ...prev,
                        [clave]: { ...prev[clave], png: { exists: true, key: res.data.RUTA_IMAGEN_PNG, url: nuevaUrl, previewUrl: nuevaPreview } },
                    }));
                }
                setDetalleItem(prev => prev ? { ...prev, RUTA_IMAGEN_PNG: nuevaUrl || prev.RUTA_IMAGEN_PNG } : prev);
            }
            toast.success(`Imagen ${tipo.toUpperCase()} actualizada correctamente.`);
            fetchItems();
        } catch (error) {
            console.error(`Error al actualizar imagen ${tipo}:`, error);
            toast.error(`Error al actualizar la imagen ${tipo.toUpperCase()}.`);
        } finally {
            setSubiendoImagenDetalle(prev => ({ ...prev, [tipo]: false }));
        }
    };

    const handleSyncToSap = async () => {
        const ids = Array.from(selectedApprovedItemIds);
        if (ids.length === 0) {
            toast.warning("Seleccione al menos un ítem para sincronizar con SAP.");
            return;
        }

        setIsSyncingSap(true);
        try {
            const response = await syncItemsToSap("LUBRICANTES", ids);
            const result = response?.data || {};
            const { Exitosos = 0, Fallidos = 0, Total = 0, PorEmpresa = [], ItemsOmitidos = [] } = result;

            if (Fallidos === 0 && Exitosos > 0) {
                toast.success(`Sincronización SAP: ${Exitosos} de ${Total} ítems creados correctamente.`);
            } else if (Exitosos > 0) {
                toast.warning(`Sincronización SAP: ${Exitosos} exitosos, ${Fallidos} fallidos de ${Total}. Revise la consola para el detalle.`);
            } else {
                toast.error(`Sincronización SAP: no se pudo crear ningún ítem (${Fallidos} fallidos de ${Total}). Revise la consola para el detalle.`);
            }

            console.log("Resultado sincronización SAP:", { PorEmpresa, ItemsOmitidos });

            for (const empresaResult of PorEmpresa) {
                for (const resultado of empresaResult.Resultados || []) {
                    if (!resultado.Success) {
                        console.warn(`❌ ${empresaResult.Empresa} - ${resultado.ItemName}: ${resultado.Message}`);
                    }
                }
            }
            for (const omitido of ItemsOmitidos) {
                console.warn(`⚠️ Item omitido (ID ${omitido.ItemId}): ${omitido.Motivo}`);
            }

            setSelectedApprovedItemIds(new Set());
            fetchItems();
        } catch (error) {
            console.error("Error al sincronizar con SAP:", error);
            toast.error("Error al sincronizar los ítems con SAP.");
        } finally {
            setIsSyncingSap(false);
        }
    };

    const handleFinalSubmit = async (currentItems) => {
        setIsSubmitting(true);
        try {
            if (idRolPrincipal === 5) {
                for (const item of currentItems) {
                    if (item.fueRechazado) {
                        const payload = {
                            ID: item.id,
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            NOMBRE: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            ID_PROVEEDOR: item.proveedor || "",
                            CODIGO_SHELL: item.codigoProveedor || "",
                            MARCA: item.marca || "",
                            NOMBRE_FORANEO: item.nombreExtranjero || "",
                            ESTRATEGIA: item.estrategia || "",
                            ORIGEN: item.origen || "",
                            EMPAQUE: item.empaque + "*" + item.unidades + item.medida || "",
                            OUM: item.oum || item.OUM || item.uom || item.UOM || "",
                            EMPRESA: EMPRESA_LUBRICANTES,
                            OBSERVACIONES: item.comentarios || "",
                            VISIBLE_EASYSALES: esVisibleEasySales(item),
                            RECHAZO: false,
                            FASE: 1
                        };
                        await patchItemRole3(payload);
                    } else {
                        const payload = {
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            NOMBRE: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            ID_PROVEEDOR: item.proveedor || "",
                            CODIGO_SHELL: item.codigoProveedor || "",
                            MARCA: item.marca || "",
                            NOMBRE_FORANEO: item.nombreExtranjero || "",
                            ESTRATEGIA: item.estrategia || "",
                            ORIGEN: item.origen || "",
                            EMPAQUE: item.empaque + "*" + item.unidades + item.medida || "",
                            UNIDADES: item.unidades || "",
                            MEDIDA: item.medida || "",
                            OUM: item.oum || item.OUM || item.uom || item.UOM || "",
                            EMPRESA: EMPRESA_LUBRICANTES,
                            OBSERVACIONES: item.comentarios || "",
                            VISIBLE_EASYSALES: esVisibleEasySales(item),
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
                        PALLETS: item.pallets || "",
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
                    const empresaToSend = item.EMPRESA || EMPRESA_LUBRICANTES;
                    const disenioExistente = imagenesDisenioExistente[getDisenioKey(item)];
                    // Solo se vincula lo que el diseño ya tiene en storage Y que este ítem no está subiendo de nuevo.
                    const debeVincularExistente =
                        (!item.imagenWebp && disenioExistente?.webp?.exists) ||
                        (!item.imagenPng && disenioExistente?.png?.exists);

                    if (item.imagenWebp) {
                        try {
                            await uploadItemImages(lineaSeleccionada.value, item.ID, item.marca, null, null, item.imagenWebp);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen WebP para el ítem ${item.ID}:`, uploadError);
                            toast.error(`Error al subir imagen WebP para ${item.marca} ${item.descripcion || ""}`);
                        }
                    }
                    if (item.imagenPng) {
                        try {
                            await uploadItemImagesSharepoint(lineaSeleccionada.value, item.ID, item.marca, empresaToSend, null, item.imagenPng, null);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen PNG para el ítem ${item.ID}:`, uploadError);
                            toast.error(`Error al subir imagen PNG para ${item.marca} ${item.descripcion || ""}`);
                        }
                    }
                    if (debeVincularExistente) {
                        // Las imágenes se suben una vez por diseño, no por ítem: aquí se vincula
                        // al ítem la que ya existe en storage, sin volver a subirla.
                        try {
                            await linkExistingItemImage(lineaSeleccionada.value, item.ID);
                        } catch (linkError) {
                            console.error(`Error al vincular imagen existente para el ítem ${item.ID}:`, linkError);
                            toast.error(`Error al vincular imagen existente para ${item.marca} ${item.descripcion || ""}`);
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
        } finally {
            setIsSubmitting(false);
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
            await fetchItems();
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
                                                    { key: 'proveedor', label: "Proveedor", role: 5 },
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
                                                    { key: 'pallets', label: "Pallets", role: 3 },
                                                    { key: 'presentacion', label: "Presentacion", role: 3 },
                                                    { key: 'unidadesPallet', label: "Unidades por pallet", role: 3 },
                                                    { key: 'unidadesCaja', label: "Unidades por caja", role: 3 },
                                                    { key: 'aplicacion', label: "Aplicacion", role: 3 },
                                                    { key: 'gradoGrasa', label: "Grado de grasa", role: 3 },
                                                    { key: 'pesoMaterialBruto', label: "Peso material bruto", role: 3 },
                                                    { key: 'clasificacion', label: "Clasificacion", role: 3 },
                                                ].map(({ key, label, role }) => {
                                                    const value = key === 'OUM'
                                                        ? (item.oum || item.OUM || item.uom || item.UOM)
                                                        : key === 'proveedor'
                                                            ? (item.proveedor ? `${item.proveedor} - ${opcionesProveedores.find(o => o.value === item.proveedor)?.label || ''}` : '')
                                                            : item[key];
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
                                        <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: ANCHO_COL_SELECCION_LUB, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, left: idRolPrincipal === 5 ? 0 : undefined, zIndex: idRolPrincipal === 5 ? 11 : 10 }}>
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
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "90px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10, }}>Pallets</th>
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
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "220px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, left: ANCHO_COL_SELECCION_LUB, zIndex: 11 }}>Nombre</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Cód. Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "220px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Proveedor</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Marca</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "180px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Extranjero</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Estrategia</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Origen</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Empaque</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "100px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Unidades</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "160px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Medida</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "380px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Nombre Del Sistema</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "120px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>OUM (Litros)</th>
                                                <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "140px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Visible EasySales</th>
                                                <th style={{ padding: "10px 16px", textAlign: "left", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text, minWidth: "200px", backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>Comentarios</th>
                                            </>
                                        )}
                                        <th style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: 100, color: theme?.colors?.text, backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10, minWidth: "100px" }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={idRolPrincipal === 5 ? 15 : idRolPrincipal === 3 ? 20 : idRolPrincipal === 4 ? 6 : idRolPrincipal === 1 ? 33 : 7} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                No hay ítems de Lubricantes
                                            </td>
                                        </tr>
                                    ) : itemsFiltrados.map(item => (
                                        <tr key={item.id} style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}` }}>
                                            <td style={{ padding: "4px 8px", textAlign: "center", ...(idRolPrincipal === 5 ? { position: "sticky", left: 0, zIndex: 2, backgroundColor: theme?.colors?.background || "#fff" } : {}) }}>
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
                                                    {/* Pallets */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={opcionesPallets}
                                                            value={item.pallets ? { value: item.pallets, label: (opcionesPallets.find(o => o.value == item.pallets)?.label) || item.pallets } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "pallets", v?.value)}
                                                            minWidth="130px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
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
                                                            cursor: disenioEstaVerificando(item) ? 'wait' : 'pointer',
                                                            opacity: disenioEstaVerificando(item) ? 0.6 : 1,
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
                                                            onClick={() => { if (!disenioEstaVerificando(item)) document.getElementById(`png-upload-${item.id}`).click(); }}
                                                            title={disenioEstaVerificando(item) ? "Verificando si el diseño ya tiene imagen en storage..." : (!item.imagenPng && imagenesDisenioExistente[getDisenioKey(item)]?.png?.exists ? "Ya existe una imagen PNG para este diseño. Click para reemplazarla." : undefined)}
                                                        >
                                                            {disenioEstaVerificando(item) ? (
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary}>Verificando...</TextUI>
                                                            ) : item.imagenPng ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                    <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {item.imagenPng.name}
                                                                    </TextUI>
                                                                </div>
                                                            ) : imagenesDisenioExistente[getDisenioKey(item)]?.png?.exists ? (
                                                                <img
                                                                    src={imagenesDisenioExistente[getDisenioKey(item)]?.png?.previewUrl || imagenesDisenioExistente[getDisenioKey(item)]?.png?.url}
                                                                    alt="Imagen PNG existente"
                                                                    style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
                                                                />
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
                                                                disabled={disenioEstaVerificando(item)}
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
                                                            cursor: disenioEstaVerificando(item) ? 'wait' : 'pointer',
                                                            opacity: disenioEstaVerificando(item) ? 0.6 : 1,
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
                                                            onClick={() => { if (!disenioEstaVerificando(item)) document.getElementById(`webp-upload-${item.id}`).click(); }}
                                                            title={disenioEstaVerificando(item) ? "Verificando si el diseño ya tiene imagen en storage..." : (!item.imagenWebp && imagenesDisenioExistente[getDisenioKey(item)]?.webp?.exists ? "Ya existe una imagen WebP para este diseño. Click para reemplazarla." : undefined)}
                                                        >
                                                            {disenioEstaVerificando(item) ? (
                                                                <TextUI size="11px" color={theme?.colors?.textSecondary}>Verificando...</TextUI>
                                                            ) : item.imagenWebp ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', width: '100%' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                                                    <TextUI size="11px" color={theme?.colors?.text} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {item.imagenWebp.name}
                                                                    </TextUI>
                                                                </div>
                                                            ) : imagenesDisenioExistente[getDisenioKey(item)]?.webp?.exists ? (
                                                                <img
                                                                    src={imagenesDisenioExistente[getDisenioKey(item)]?.webp?.url}
                                                                    alt="Imagen WebP existente"
                                                                    style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px' }}
                                                                />
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
                                                                disabled={disenioEstaVerificando(item)}
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
                                                    {/* Nombre */}
                                                    <td style={{ padding: "4px 8px", position: "sticky", left: ANCHO_COL_SELECCION_LUB, zIndex: 2, backgroundColor: theme?.colors?.background || "#fff" }}>
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
                                                    {/* Proveedor */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={opcionesProveedores}
                                                            value={item.proveedor ? { value: item.proveedor, label: opcionesProveedores.find(o => o.value === item.proveedor)?.label || item.proveedor } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "proveedor", v?.value)}
                                                            minWidth="200px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Marca */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <SelectUI
                                                            options={[
                                                                { value: "SHELL", label: "SHELL" },
                                                                { value: "PENNZOIL", label: "PENNZOIL" }
                                                            ]}
                                                            value={item.marca ? { value: item.marca, label: item.marca } : null}
                                                            onChange={(v) => actualizarCampoFila(item.id, "marca", v?.value)}
                                                            minWidth="160px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                            isCreatable={true}
                                                        />
                                                    </td>
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
                                                            minWidth="150px"
                                                            style={{ height: "30px", fontSize: "12px", minHeight: "30px" }}
                                                        />
                                                    </td>
                                                    {/* Nombre del Sistema */}
                                                    <td style={{ padding: "4px 8px" }}><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></td>
                                                    {/* oum */}
                                                    <td style={{ padding: "4px 8px" }}>
                                                        <InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.oum || item.OUM || item.uom || item.UOM || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "oum", handleDecimalInput(v))} />
                                                    </td>
                                                    {/* Visible EasySales */}
                                                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                                                        <CheckboxUI
                                                            checked={esVisibleEasySales(item)}
                                                            onChange={(_, checked) => actualizarCampoFila(item.id, "visibleEasySales", checked)}
                                                        />
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
                            text={isSubmitting ? "Enviando..." : (idRolPrincipal === 4 && hayVerificacionesPendientes(items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id))) ? "Verificando imágenes..." : "Enviar a revisión")}
                            iconLeft="FaCheck"
                            disabled={isSubmitting || items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id)).length === 0 || (idRolPrincipal === 4 && hayVerificacionesPendientes(items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id))))}
                            onClick={async () => {
                                const currentItems = items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id));
                                if (currentItems.length === 0) return;
                                if (idRolPrincipal === 4 && hayVerificacionesPendientes(currentItems)) return;

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
                    <TablaScroll>
                        <Tabla>
                            <thead>
                                <tr>
                                    <Th>Empresa</Th>
                                    <Th>Código SAP</Th>
                                    <Th $min="250px">Código de barras</Th>
                                    <Th $min="350px">Descripción</Th>
                                    <Th>Marca</Th>
                                    <Th $align="center" $w="80px" $fija="right">Detalle</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItems.filter(i => i.linea === lineaSeleccionada.value).map((item, idx) => (
                                    <Fila key={item.id} $par={idx % 2 === 0}>
                                        <Td><TextUI size="12px">{EMPRESA_LUBRICANTES}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.CODIGO_SAP || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.codigo || item.CODIGO_BARRAS || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.nombreSistema || item.descripcionRol5 || item.descripcion || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.marca || "-"}</TextUI></Td>
                                        <Td $align="center" $fija="right">
                                            <IconUI
                                                name="FaEye"
                                                size={16}
                                                color={theme?.colors?.primary}
                                                title="Ver detalle del producto"
                                                onClick={() => setDetalleItem(item)}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </Td>
                                    </Fila>
                                ))}
                            </tbody>
                        </Tabla>
                    </TablaScroll>
                </div>
            )}

            {/* Detalle del ítem aprobado: solo lectura, sin acciones. */}
            <ModalUI
                isOpen={Boolean(detalleItem)}
                onClose={() => setDetalleItem(null)}
                title="Detalle del producto"
                width="760px"
                saveText="Cerrar"
                onSave={() => setDetalleItem(null)}
                showCancelButton={false}
            >
                {detalleItem && (() => {
                    const filas = CAMPOS_DETALLE
                        .map(c => ({ label: c.label, valor: c.get(detalleItem) }))
                        .filter(f => f.valor !== undefined && f.valor !== null && String(f.valor).trim() !== "");

                    const fases = Array.isArray(detalleItem.FASES) ? detalleItem.FASES : [];
                    const rechazada = fases.find(f => f.RECHAZO);
                    const aprobado = detalleItem.APROBADO_MDM === true;
                    const claveImagenesDetalle = getDisenioKey(detalleItem);
                    const infoImagenesDetalle = claveImagenesDetalle ? imagenesDisenioExistente[claveImagenesDetalle] : null;
                    const verificandoImagenesDetalle = claveImagenesDetalle ? Boolean(disenioVerificando[claveImagenesDetalle]) : false;
                    const webpUrlDetalle = infoImagenesDetalle?.webp?.url || detalleItem.RUTA_IMAGEN_WEBP || null;
                    const pngUrlDetalle = infoImagenesDetalle?.png?.previewUrl || infoImagenesDetalle?.png?.url || null;

                    // El ModalBody de ModalUI scrollea sin padding propio: el padding
                    // de este contenedor evita que las tablas queden pegadas a la barra.
                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px", padding: "4px 14px 6px 2px" }}>
                            {/* Estado actual */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                                <Etiqueta $tono={aprobado ? "exito" : "neutro"}>
                                    {aprobado ? "Aprobado por MDM" : "En proceso"}
                                </Etiqueta>
                                {detalleItem.FASE_ACTUAL !== undefined && detalleItem.FASE_ACTUAL !== null && (
                                    <Etiqueta $tono="neutro">
                                        Fase actual: {NOMBRES_FASE[detalleItem.FASE_ACTUAL] || detalleItem.FASE_ACTUAL}
                                    </Etiqueta>
                                )}
                                {rechazada && <Etiqueta $tono="alerta">Tuvo rechazo</Etiqueta>}
                            </div>

                            {/* Ficha del artículo */}
                            <TablaScroll style={{ maxHeight: "46vh", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                                <Tabla>
                                    <thead>
                                        <tr>
                                            <Th $w="230px">Campo</Th>
                                            <Th>Valor</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filas.map((f, i) => (
                                            <Fila key={f.label} $par={i % 2 === 0}>
                                                <Td><TextUI size="12px" weight="600">{f.label}</TextUI></Td>
                                                <Td><TextUI size="12px">{String(f.valor)}</TextUI></Td>
                                            </Fila>
                                        ))}
                                    </tbody>
                                </Tabla>
                            </TablaScroll>

                            {/* Imágenes del diseño (SharePoint/PNG y R2/WebP), solo para el coordinador (rol 4):
                                permite ver la imagen publicada actualmente y reemplazarla sin pasar por el flujo
                                de revisión completo. */}
                            {idRolPrincipal === 4 && (
                                <div>
                                    <TextUI size="13px" weight="600" style={{ marginBottom: "8px", display: "block" }}>
                                        Imágenes del diseño
                                    </TextUI>
                                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                        {[
                                            { tipo: "png", etiqueta: "Aplicación (PNG)", src: pngUrlDetalle, accept: ".png" },
                                            { tipo: "webp", etiqueta: "Portal (WebP)", src: webpUrlDetalle, accept: ".webp" },
                                        ].map(({ tipo, etiqueta, src, accept }) => (
                                            <div key={tipo} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                                <div style={{
                                                    width: "80px",
                                                    height: "80px",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${theme?.colors?.border || "#eee"}`,
                                                    backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    overflow: "hidden",
                                                }}>
                                                    {verificandoImagenesDetalle ? (
                                                        <TextUI size="10px" color={theme?.colors?.textSecondary}>Verificando...</TextUI>
                                                    ) : src ? (
                                                        <img
                                                            src={src}
                                                            alt={etiqueta}
                                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                            onError={(e) => { e.target.style.display = "none"; }}
                                                        />
                                                    ) : (
                                                        <TextUI size="10px" color={theme?.colors?.textSecondary}>Sin imagen</TextUI>
                                                    )}
                                                </div>
                                                <TextUI size="11px" weight="600">{etiqueta}</TextUI>
                                                <ButtonUI
                                                    text={subiendoImagenDetalle[tipo] ? "Subiendo..." : "Actualizar"}
                                                    variant="outlined"
                                                    disabled={subiendoImagenDetalle[tipo] || verificandoImagenesDetalle}
                                                    style={{ padding: "4px 10px", fontSize: "11px", minWidth: "auto" }}
                                                    onClick={() => document.getElementById(`detalle-upload-${tipo}`).click()}
                                                />
                                                <input
                                                    id={`detalle-upload-${tipo}`}
                                                    type="file"
                                                    accept={accept}
                                                    style={{ display: "none" }}
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) handleActualizarImagenDetalle(tipo, file);
                                                        e.target.value = "";
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Trazabilidad por fase */}
                            {fases.length > 0 && (
                                <div>
                                    <TextUI size="13px" weight="600" style={{ marginBottom: "8px", display: "block" }}>
                                        Trazabilidad
                                    </TextUI>
                                    <TablaScroll style={{ border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                                        <Tabla>
                                            <thead>
                                                <tr>
                                                    <Th $w="220px">Fase</Th>
                                                    <Th $w="120px" $align="center">Resultado</Th>
                                                    <Th>Observaciones</Th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...fases].sort((a, b) => (a.FASE || 0) - (b.FASE || 0)).map((f, i) => (
                                                    <Fila key={f.FASE ?? i} $par={i % 2 === 0}>
                                                        <Td><TextUI size="12px">{NOMBRES_FASE[f.FASE] || `Fase ${f.FASE}`}</TextUI></Td>
                                                        <Td $align="center">
                                                            <Etiqueta $tono={f.RECHAZO ? "alerta" : "exito"}>
                                                                {f.RECHAZO ? "Rechazado" : "Aprobado"}
                                                            </Etiqueta>
                                                        </Td>
                                                        <Td><TextUI size="12px">{f.OBSERVACIONES || f.MOTIVO_RECHAZO || "-"}</TextUI></Td>
                                                    </Fila>
                                                ))}
                                            </tbody>
                                        </Tabla>
                                    </TablaScroll>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </ModalUI>

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
                width="95vw"
                maxWidth="1300px"
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
                                {itemsToReviewPaginados.map(item => (
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
                    {filteredItemsToReview.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                            <ButtonUI
                                text="Anterior"
                                variant="outlined"
                                disabled={paginaReview <= 1}
                                onClick={() => setPaginaReview(p => p - 1)}
                            />
                            <TextUI size="13px" color={theme?.colors?.textSecondary}>
                                Página {paginaReview} de {totalPaginasReview} ({filteredItemsToReview.length} ítems)
                            </TextUI>
                            <ButtonUI
                                text="Siguiente"
                                variant="outlined"
                                disabled={paginaReview >= totalPaginasReview}
                                onClick={() => setPaginaReview(p => p + 1)}
                            />
                        </div>
                    )}

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
                            text={isSubmitting ? "Enviando..." : "Continuar con el envío"}
                            pcolor={theme?.colors?.primary}
                            disabled={isSubmitting}
                            onClick={async () => {
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
                width="95vw"
                maxWidth="1300px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <TextUI size="14px" color={theme?.colors?.textSecondary}>
                        Se muestran todos los ítems aprobados ordenados por fecha de actualización.
                    </TextUI>
                    <InputUI
                        placeholder="Buscar por empresa, código SAP o descripción..."
                        value={searchTermExport}
                        onChange={(v) => setSearchTermExport(v)}
                        iconLeft="FaSearch"
                    />
                    <div style={{ maxHeight: "400px", overflow: "auto", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: theme?.colors?.backgroundCard || "#f8f9fa", position: "sticky", top: 0, zIndex: 10 }}>
                                <tr>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, width: "50px" }}>
                                        <CheckboxUI
                                            checked={filteredApprovedItemsForExport.length > 0 && filteredApprovedItemsForExport.every(i => selectedApprovedItemIds.has(i.ID))}
                                            onChange={(_, checked) => {
                                                setSelectedApprovedItemIds(prev => {
                                                    const newSet = new Set(prev);
                                                    filteredApprovedItemsForExport.forEach(i => checked ? newSet.add(i.ID) : newSet.delete(i.ID));
                                                    return newSet;
                                                });
                                            }}
                                        />
                                    </th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Empresa</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Código SAP</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Descripción</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, color: theme?.colors?.text }}>Aprobado el</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApprovedItemsForExport.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary }}>
                                            {approvedItemsForExport.length === 0 ? "No hay ítems aprobados para exportar." : "No se encontraron ítems que coincidan con la búsqueda."}
                                        </td>
                                    </tr>
                                ) : (
                                    approvedItemsForExportPaginados.map(item => (
                                        <tr
                                            key={item.ID}
                                            style={{ borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, cursor: "pointer" }}
                                            onClick={() => {
                                                setSelectedApprovedItemIds(prev => {
                                                    const newSet = new Set(prev);
                                                    if (newSet.has(item.ID)) newSet.delete(item.ID);
                                                    else newSet.add(item.ID);
                                                    return newSet;
                                                });
                                            }}
                                        >
                                            <td style={{ padding: "10px", textAlign: "center" }}>
                                                <CheckboxUI
                                                    checked={selectedApprovedItemIds.has(item.ID)}
                                                    onChange={() => { }} // handled by tr onClick
                                                />
                                            </td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.EMPRESA}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text }}>{item.CODIGO_SAP || "-"}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.text, fontSize: "12px" }}>{item.NOMBRE || item.DESCRIPCION || "-"}</td>
                                            <td style={{ padding: "10px", color: theme?.colors?.textSecondary, fontSize: "11px" }}>{new Date(item.updatedAt).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredApprovedItemsForExport.length > 0 && (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                            <ButtonUI
                                text="Anterior"
                                variant="outlined"
                                disabled={paginaExport <= 1}
                                onClick={() => setPaginaExport(p => p - 1)}
                            />
                            <TextUI size="13px" color={theme?.colors?.textSecondary}>
                                Página {paginaExport} de {totalPaginasExport} ({filteredApprovedItemsForExport.length} ítems)
                            </TextUI>
                            <ButtonUI
                                text="Siguiente"
                                variant="outlined"
                                disabled={paginaExport >= totalPaginasExport}
                                onClick={() => setPaginaExport(p => p + 1)}
                            />
                        </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                        {Object.entries(
                            approvedItemsForExport
                                .filter(it => selectedApprovedItemIds.has(it.ID))
                                .reduce((acc, it) => {
                                    if (!acc[it.EMPRESA]) acc[it.EMPRESA] = [];
                                    acc[it.EMPRESA].push({
                                        ...it,
                                        linea: lineaSeleccionada?.value,
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
                        {selectedApprovedItemIds.size > 0 && (
                            <ButtonUI
                                text={isSyncingSap ? "Sincronizando..." : `Crear artículos en SAP (${selectedApprovedItemIds.size})`}
                                iconLeft="FaCloudUploadAlt"
                                onClick={handleSyncToSap}
                                disabled={isSyncingSap}
                                pcolor={theme?.colors?.primary || "#0d6efd"}
                            />
                        )}
                    </div>
                </div>
            </ModalUI>
        </div>
    );
}

export default Lubricantes;
