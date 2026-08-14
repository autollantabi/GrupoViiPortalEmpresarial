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
import { parseLlantas, getItemsByRole, saveItemRole5, patchItemRole3, rejectItemPhase, uploadItemImages, uploadItemImagesSharepoint, getItemsDWHByLinea, createItemFromDWH, approveItemMDM, getNeumaticosDWH, getItemsCaracteristicas } from "services/mdmService";
import { ListarEmpresasAdmin } from "services/administracionService";
import { generateSAPExport } from "assets/templates/mdmTemplate";
import styled from "styled-components";

/* ------------------------------------------------------------------ */
/* Primitivas de tabla                                                 */
/* Las tablas de MDM tienen hasta 16 columnas, así que la tabla crece   */
/* a lo ancho (width: max-content) y el contenedor scrollea en X.       */
/* La cabecera queda fija arriba y las columnas de selección/acciones   */
/* quedan congeladas a los costados para no perder la referencia.       */
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

/* Ancho exacto de la columna de selección. Es el desplazamiento (`$offset`)
   con el que se congela la segunda columna, así que las celdas de esa columna
   se fijan a este ancho (width + min + max) para que no lo negocie el
   navegador; si variara, la segunda columna quedaría solapada o con hueco. */
const ANCHO_COL_SELECCION = "76px";

/* Ancho de la columna Nombre cuando va congelada (supervisor, rol 3). Acotado
   a propósito: al quedar fija, sin tope crecería con la descripción más larga
   y se comería el ancho útil del scroll horizontal. */
const ANCHO_COL_NOMBRE = "400px";

/* Cabecera: barra oscura, mayúsculas y siempre visible al hacer scroll */
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
    /* Gris oscuro fijo en ambos temas: en oscuro el backgroundCard se leía casi negro */
    background-color: #3c3c3b;
    color: ${({ theme }) => theme?.colors?.white || "#ffffff"};
    border-bottom: 2px solid ${({ theme }) => theme?.colors?.white || "#ffffff"};
    border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.white || "#ffffff", alpha: 0.25 })};

    /* separador marcado en el borde de la zona congelada */
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
    /* index.css impone td { max-width: 275px }, que recorta las columnas anchas */
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

/* Gris muy claro para fila seleccionada / bajo el cursor.
   Sólidos a propósito: las celdas congeladas heredan este fondo y con
   cualquier alpha se vería el contenido desplazándose por debajo. */
const FILA_HOVER = { claro: "#eef0f2", oscuro: "#343434" };
const FILA_SELECCION = { claro: "#e4e7eb", oscuro: "#3d3d3d" };

const tonoFila = (theme, tono) =>
    theme?.name === "dark" ? tono.oscuro : tono.claro;

/* Filas cebra + resaltado de la fila activa.
   El fondo va en el <tr> para que las celdas congeladas lo hereden
   (background-color: inherit) y el contenido no se transparente debajo. */
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

/* Celda de solo lectura (valor calculado) dentro de las tablas editables */
const CeldaLectura = styled.div`
    font-size: 12px;
    min-height: 30px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 4px;
    background-color: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.06 })};
    color: ${({ theme }) => theme?.colors?.text || "#212529"};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

/* Número de fila: ancla visual al desplazarse horizontalmente */
const NumeroFila = styled.span`
    font-size: 11px;
    font-weight: 600;
    color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
    font-variant-numeric: tabular-nums;
`;

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
                    "RUN FLAT": ["RUN FLAT"], //Cambiar eje
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
                    "ON/OFF": ["RT( RUGGED TERRAIN)", "AT(ALL TERRAIN)"],
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
    }
};

const CATEGORIAS_LLANTAS_MOTO = {
    "2WHEEL & UTV": {
        segmentos: {
            "MOTOS": {
                aplicaciones: {
                    "PISTA": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                    "CROSS/ ENDURO": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                    "UTILITARIAS": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                    "DUAL SPORT": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"]
                },
            },
            "UTV/SSV (SIDE BY SIDE VEHICLE)": {
                aplicaciones: {
                    "SPORT": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                },
            },
            "SCOOTER": {
                aplicaciones: {
                    "PISTA": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                    "DUAL SPORT": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"]
                }
            },
            "ATV/CUADRON": {
                aplicaciones: {
                    "SPORT": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                }
            },
            "KARTING": {
                aplicaciones: {
                    "KARTING": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                }
            },
            "TUBOS": {
                aplicaciones: {
                    "UTILITARIAS": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"],
                    "URBANA": ["A (TODA POSICION)", "F (DELANTERA)", "R (POSTERIOR)"]
                },
            },
        },
    }
};

const getCategoriasPorLinea = (linea) => linea === "LLANTAS MOTO" ? CATEGORIAS_LLANTAS_MOTO : CATEGORIAS_LLANTAS;


const MARCAS_POR_EMPRESA = {
    "AUTOLLANTA": ["FORTUNE", "MAXTREK", "ROADWING"],
    "STOX": ["CST", "FARROAD BRAND", "ANSU", "BAYI", "BYCROSS", "WONDERLAND", "ANTARES"],
    "MAXXIMUNDO": ["MAXXIS LIVIANO", "MAXXIS PESADO", "APLUS", "ROADCRUZA", "HAOHUA"],
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

const calcularNombreSistemaFinal = (nombreBase, colorCod, isNew = false) => {
    if (!nombreBase) return "";
    // Limpiamos cualquier "NEW " previo para evitar duplicaciones si se rellama la función
    let baseLimpia = nombreBase.startsWith("NEW ") ? nombreBase.replace(/^NEW\s+/, "") : nombreBase;
    const codigo = DICCIONARIO_COLOR_LETRA_CODIGO[colorCod];
    const res = codigo ? `${baseLimpia} ${codigo}`.trim() : baseLimpia;
    return isNew ? `NEW ${res}` : res;
};

/* Columnas de la plantilla de importación de llantas.
   El orden es el del Excel generado. `alias` recoge los encabezados que usaba
   la plantilla anterior, para que los archivos ya descargados se sigan
   importando sin cambios. `ancho` solo afecta la vista del Excel. */
const COLUMNAS_PLANTILLA = [
    { header: "EMPRESA", ancho: 16 },
    { header: "MARCA", ancho: 16 },
    { header: "NOMBRE", alias: ["DESCRIPCION"], ancho: 42 },
    { header: "DISENIO", ancho: 18 },
    { header: "LETRA_DISENIO", ancho: 15 },
    { header: "COLOR_LETRA", ancho: 13 },
    { header: "CODIGO_BARRAS", ancho: 28 },
    { header: "CODIGO_PROVEEDOR", ancho: 20 },
    { header: "DESCRIPCION_PROVEEDOR", alias: ["NOMBRE_EXTRANJERO"], ancho: 34 },
    { header: "CUBICAJE", ancho: 12 },
    { header: "PARTIDA_ARANCELARIA", ancho: 22 },
    { header: "ES_NUEVO", ancho: 11 },
];

/* Devuelve el valor de una columna aceptando también sus encabezados antiguos. */
const valorPlantilla = (fila, header) => {
    const columna = COLUMNAS_PLANTILLA.find(c => c.header === header);
    for (const nombre of [header, ...(columna?.alias || [])]) {
        const v = fila[nombre];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
};

/* El cubicaje puede llegar como número, con coma decimal o con unidad
   ("0,45 m3"). Se toma el primer número de la celda; quitar solo los caracteres
   no numéricos pegaría el "3" de "m3" al valor. */
const normalizarCubicaje = (valor) => {
    if (valor === undefined || valor === null) return "";
    if (typeof valor === "number") return String(valor);
    const encontrado = String(valor).trim().replace(",", ".").match(/\d+(\.\d+)?/);
    return encontrado ? encontrado[0] : "";
};

/* Interpreta la columna ES_NUEVO: admite SI/NO, TRUE/FALSE, 1/0 y X.
   Vacío se toma como nuevo, que es como se comportaba la importación antes
   de que existiera la columna. */
const interpretarEsNuevo = (valor) => {
    if (valor === undefined || valor === null || String(valor).trim() === "") return true;
    if (typeof valor === "boolean") return valor;
    return ["SI", "SÍ", "S", "TRUE", "VERDADERO", "V", "1", "X", "YES", "Y"]
        .includes(String(valor).trim().toUpperCase());
};

/* Campos del detalle informativo de un ítem aprobado.
   Los ítems se construyen con `...it`, así que conservan tanto los campos
   normalizados del front (camelCase) como los que devuelve el backend
   (SCREAMING_SNAKE); se toma el primero disponible. Las filas sin valor no
   se pintan, de modo que la misma lista sirve para llantas, lubricantes y
   herramientas sin ramificar por línea de negocio. */
const CAMPOS_DETALLE = [
    { label: "Código SAP", get: (it) => it.CODIGO_SAP },
    { label: "Código de barras", get: (it) => it.codigo || it.CODIGO_BARRAS },
    { label: "Código proveedor", get: (it) => it.codigoProveedor || it.CODIGO_PROVEEDOR },
    { label: "Línea de negocio", get: (it) => it.linea || it.LINEA_NEGOCIO },
    { label: "Marca", get: (it) => it.marca || it.MARCA },
    { label: "Nombre del sistema", get: (it) => it.nombreSistema },
    { label: "Descripción", get: (it) => it.descripcion || it.DESCRIPCION },
    { label: "Descripción Proveedor", get: (it) => it.nombreExtranjero || it.NOMBRE_EXTRAN_G || it.NOMBRE_EXTRANJERO },
    { label: "Diseño", get: (it) => it.diseño || it.DISENIO },
    { label: "Letra diseño", get: (it) => it.letraDiseño || it.LETRA_DISENIO },
    { label: "Color letra", get: (it) => it.colorLetra || it.COLOR_LETRA },
    { label: "Partida arancelaria", get: (it) => it.partidaArancelaria || it.PARTIDA_ARANCELARIA },
    { label: "Cubicaje", get: (it) => it.cubicaje || it.CUBICAJE },
    { label: "Rin", get: (it) => it.rin || it.RIN },
    { label: "Serie", get: (it) => it.serie || it.SERIE },
    { label: "Lonas", get: (it) => it.lonas || it.LONAS },
    { label: "Ancho", get: (it) => it.ancho || it.ANCHO },
    { label: "Nomenclatura", get: (it) => it.nomenclatura || it.NOMENCLATURA },
    { label: "Carga", get: (it) => it.carga || it.CARGA },
    { label: "Velocidad", get: (it) => it.velocidad || it.VELOCIDAD },
    { label: "Categoría", get: (it) => it.categoria || it.CATEGORIA },
    { label: "Segmento", get: (it) => it.segmento || it.SEGMENTO },
    { label: "Aplicación", get: (it) => it.aplicacion || it.APLICACION },
    { label: "Eje", get: (it) => it.eje || it.EJE },
    { label: "Observaciones", get: (it) => it.comentarios || it.OBSERVACIONES },
];

/* Roles del flujo MDM (id_rol → nombre) */
const NOMBRES_ROL = {
    1: "Comercial",
    2: "Ventas",
    3: "Tecnico",
    4: "Marketing",
    5: "Compras",
    6: "Bodega",
};

/* Cada fase la ejecuta un rol concreto: el mapeo se corresponde con
   comentariosRol5 → fase 1, comentariosRol3 → fase 2, comentariosRol4 → fase 3,
   y la aprobación final (fase 4) la hace jefatura. */
const NOMBRES_FASE = {
    1: `Creación (${NOMBRES_ROL[5]})`,
    2: `Revisión técnica (${NOMBRES_ROL[3]})`,
    3: `Imágenes (${NOMBRES_ROL[4]})`,
    4: `Aprobación (${NOMBRES_ROL[1]})`,
};

/* Bandera "Es nuevo" del ítem. Antes se derivaba siempre de !fueRechazado;
   ahora el rol 5 la marca a mano con un checkbox. El fallback mantiene el
   comportamiento anterior para los ítems que aún no traen el campo. */
const esNuevo = (item) =>
    item?.isNew !== undefined && item?.isNew !== null
        ? Boolean(item.isNew)
        : !item?.fueRechazado;

// Se movió calcularCodigoBarras dentro del componente para usar el estado dinámico

function Llantas() {
    const { theme } = useTheme();
    const { user } = useAuthContext();
    const [mapeoMarcas, setMapeoMarcas] = useState([]);
    const [caracteristicasMDM, setCaracteristicasMDM] = useState({});


    useEffect(() => {
        const fetchMapeo = async () => {
            try {
                const data = await getNeumaticosDWH();
                setMapeoMarcas(data || []);
            } catch (error) {
                console.error("Error fetching mapeo marcas:", error);
            }
        };
        fetchMapeo();
    }, []);

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


    const calcularCodigoBarras = useCallback((item) => {
        if (!item) return "";
        const mapping = mapeoMarcas.find(m =>
            String(m.marca || "").toUpperCase() === String(item.marca || "").toUpperCase() &&
            String(m.partida_arancelaria || "").toUpperCase() === String(item.partidaArancelaria || "").toUpperCase()
        );

        const codMarca = mapping ? mapping.valor : "0000";
        const parsed = item.parsedData || {};

        // Sin ningún dato cargado el código quedaría en puros ceros (un código
        // fantasma para una fila vacía), así que no se emite.
        const tieneDatos = Boolean(
            item.marca || item.diseño || item.letraDiseño || item.colorLetra ||
            Object.keys(parsed).length > 0
        );
        if (!tieneDatos) return "";

        // Los campos ausentes se rellenan con el placeholder "00"; nunca se
        // concatena el valor crudo, porque String(undefined) => "undefined".
        const limpiar = (valor, relleno) => {
            if (valor === undefined || valor === null) return relleno;
            const texto = String(valor).trim();
            if (texto === "" || texto === "UF") return relleno;
            return texto;
        };

        const lonas = limpiar(parsed.lonas, "00").padStart(2, "0").slice(0, 2);
        const firstChar = String(item.diseño || "").charAt(0);
        const ancho = limpiar(parsed.ancho, "00");
        const alto = limpiar(parsed.serie, "00");

        let rin = String(parsed.rin || "00");
        if (rin.charAt(rin.length - 1) >= 'A' && rin.charAt(rin.length - 1) <= 'Z') {
            rin = rin.substring(0, 2);
        }

        let designNum = "00";
        if (firstChar) {
            const c = firstChar.toUpperCase();
            if (c >= 'A' && c <= 'Z') {
                designNum = (c.charCodeAt(0) - 64).toString().padStart(2, '0');
            }
        }

        const diseño = String(item.diseño || "0000");
        const letraDiseño = String(item.letraDiseño || "00");
        const colorLetra = String(item.colorLetra || "00");
        const carga = String(parsed.carga || "00");
        const velocidad = String(parsed.velocidad || "00");
        return `${codMarca}${rin}${ancho}${alto}${lonas}${designNum}${diseño}${letraDiseño}${colorLetra}${carga}${velocidad}`.toUpperCase().replace(/\s+/g, '');
    }, [mapeoMarcas]);
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
        const contextoMDM = user.CONTEXTOS.find(ctx => ctx.RECURSO === 'mdm.llantas');
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

    const handleDownloadTemplate = () => {
        if (!lineaSeleccionada) return;
        const headers = COLUMNAS_PLANTILLA.map(c => c.header);
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        ws["!cols"] = COLUMNAS_PLANTILLA.map(c => ({ wch: c.ancho }));
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
                    const leer = (header) => String(valorPlantilla(row, header)).trim().toUpperCase();

                    const nombreEmpresa = leer("EMPRESA");
                    let idEmpresa = Object.keys(diccionarioEmpresas).find(
                        key => diccionarioEmpresas[key].trim().toUpperCase() === nombreEmpresa
                    ) || "";

                    let marcaImportada = leer("MARCA");

                    if (idEmpresa) {
                        const companyName = String(diccionarioEmpresas[idEmpresa]).trim().toUpperCase();
                        const matchKey = Object.keys(MARCAS_POR_EMPRESA).find(key =>
                            companyName === key || companyName.includes(key) || key.includes(companyName)
                        );
                        const allowedMarcas = matchKey ? MARCAS_POR_EMPRESA[matchKey] : [];
                        const marcaEsValida = allowedMarcas.some(b => b.toUpperCase() === marcaImportada);

                        if (!marcaEsValida && lineaSeleccionada.value !== 'LLANTAS MOTO') {
                            marcaImportada = "";
                        }
                    } else {
                        idEmpresa = "";
                        marcaImportada = "";
                    }

                    const nombre = leer("NOMBRE");

                    return {
                        id: Date.now() + Math.random(),
                        linea: lineaSeleccionada.value,
                        idEmpresa: idEmpresa,
                        descripcionRol5: nombre,
                        descripcion: nombre,
                        codigoProveedor: leer("CODIGO_PROVEEDOR"),
                        nombreExtranjero: leer("DESCRIPCION_PROVEEDOR"),
                        partidaArancelaria: leer("PARTIDA_ARANCELARIA"),
                        diseño: leer("DISENIO").slice(0, 20),
                        letraDiseño: leer("LETRA_DISENIO"),
                        colorLetra: leer("COLOR_LETRA"),
                        codigo: leer("CODIGO_BARRAS"), // si no viene, más abajo se calcula
                        cubicaje: normalizarCubicaje(valorPlantilla(row, "CUBICAJE")),
                        isNew: interpretarEsNuevo(valorPlantilla(row, "ES_NUEVO")),
                        marca: marcaImportada,
                        comentarios: ""
                    };
                });

                // Ejecutar parseLlantas para los ítems importados
                const descripciones = baseItems.map(it => it.descripcion);
                let parsedResults = [];
                if (descripciones.length > 0) {
                    try {
                        parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value === 'LLANTAS' ? lineaSeleccionada.value : 'LLANTAS_MOTO');
                    } catch (err) {
                        console.error("Error parsing llantas on import:", err);
                    }
                }

                const newItems = baseItems.map((it, index) => {
                    const parsed = parsedResults[index] || {};
                    const baseName = parsed.NOMBRE || it.descripcion;
                    const itemWithParsed = {
                        ...it,
                        nombreSistemaBase: baseName,
                        nombreSistema: calcularNombreSistemaFinal(baseName, it.colorLetra, esNuevo(it)),
                        parsedData: parsed
                    };
                    return {
                        ...itemWithParsed,
                        codigo: it.codigo ? it.codigo : calcularCodigoBarras(itemWithParsed) // <-- Prioriza el del Excel, si no viene lo calcula
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
    const [detalleItem, setDetalleItem] = useState(null);
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
            String(item.DIT_DISENIO || "").toLowerCase().includes(lowSearch) ||
            String(item.DIT_MARCA || "").toLowerCase().includes(lowSearch)
        );
    }, [itemsToReview, searchTermReview]);

    // Selector global para el nuevo ítem
    const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
    const esLlantas = lineaSeleccionada?.value === "LLANTAS" || lineaSeleccionada?.value === "LLANTAS MOTO";
    const esLubricantes = lineaSeleccionada?.value === "LUBRICANTES";
    const esHerramientas = lineaSeleccionada?.value === "HERRAMIENTAS";

    if (idRolPrincipal === 5 && lineaSeleccionada?.value === "LLANTAS MOTO") {
        opcionesEmpresasPermitidas = opcionesEmpresasPermitidas.filter(opt => opt.label && opt.label.toUpperCase().includes("MAXXIMUNDO"));
    }

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
                        if (esLlantas && filtered.length > 0) {
                            const descripciones = filtered.map(it => it.DESCRIPCION || "");
                            try {
                                parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value === 'LLANTAS' ? lineaSeleccionada.value : 'LLANTAS_MOTO');
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
                                diseño: it.DISENIO || "",
                                descripcion: it.DESCRIPCION || "",
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

                        const descripciones = filtered.map(it => it.DESCRIPCION || "");
                        let parsedResults = [];
                        if (descripciones.length > 0) {
                            try {
                                parsedResults = await parseLlantas(descripciones, lineaSeleccionada.value === 'LLANTAS' ? lineaSeleccionada.value : 'LLANTAS_MOTO');
                            } catch (err) {
                                console.error("Error parsing llantas (Rol 5):", err);
                            }
                        }

                        processedItems = filtered.map((it, index) => {
                            const fase1 = it.FASES?.find(f => f.FASE === 1);
                            const parsed = parsedResults[index] || {};
                            // Si el backend aún no devuelve ES_NUEVO se deja sin definir,
                            // para que esNuevo() siga aplicando el fallback de siempre.
                            const banderaNueva = it.ES_NUEVO !== undefined && it.ES_NUEVO !== null
                                ? Boolean(it.ES_NUEVO)
                                : undefined;
                            const itemWithBase = {
                                ...it,
                                isNew: banderaNueva,
                                id: it.ID,
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,
                                idEmpresa: Object.keys(diccionarioEmpresas).find(k => diccionarioEmpresas[k] === it.EMPRESA) || "",
                                descripcionRol5: it.DESCRIPCION || "",
                                descripcion: it.DESCRIPCION || "",
                                parsedData: parsed,
                                nombreSistemaBase: parsed.NOMBRE || it.DESCRIPCION || "",
                                nombreSistema: calcularNombreSistemaFinal(parsed.NOMBRE || it.DESCRIPCION || "", it.COLOR_LETRA || "", banderaNueva ?? false),
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
                            return {
                                ...itemWithBase,
                                codigo: it.CODIGO_BARRAS || calcularCodigoBarras(itemWithBase)
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
                                linea: it.LINEA_NEGOCIO || lineaSeleccionada.value,
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
                    if (idRolPrincipal === 1) {
                        const approved = data.filter(it => it.APROBADO_MDM === true && it.LINEA_NEGOCIO === lineaSeleccionada.value);
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
        setIsSubmitting(true);
        try {
            if (idRolPrincipal === 5) {
                for (const item of currentItems) {
                    if (item.fueRechazado) {
                        const payload = {
                            ID: item.id,
                            EMPRESA: diccionarioEmpresas[item.idEmpresa] || "",
                            CODIGO_BARRAS: item.codigo || "",
                            DESCRIPCION: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            CUBICAJE: item.cubicaje || "",
                            NOMBRE_EXTRANJERO: item.nombreExtranjero || "",
                            PARTIDA_ARANCELARIA: item.partidaArancelaria || "",
                            MARCA: item.marca || "",
                            OBSERVACIONES: item.comentarios || "",
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            ES_NUEVO: esNuevo(item),
                            RECHAZO: false,
                            FASE: 1
                        };
                        await patchItemRole3(payload);
                    } else {
                        const payload = {
                            EMPRESA: diccionarioEmpresas[item.idEmpresa] || "",
                            CODIGO_BARRAS: item.codigo || "",
                            DESCRIPCION: item.nombreSistema || item.descripcionRol5 || item.descripcion || "",
                            CODIGO_PROVEEDOR: item.codigoProveedor || "",
                            CUBICAJE: item.cubicaje || "",
                            NOMBRE_EXTRANJERO: item.nombreExtranjero || "",
                            PARTIDA_ARANCELARIA: item.partidaArancelaria || "",
                            MARCA: item.marca || "",
                            OBSERVACIONES: item.comentarios || "",
                            LINEA_NEGOCIO: lineaSeleccionada.value,
                            ES_NUEVO: esNuevo(item),
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
                        LINEA_NEGOCIO: lineaSeleccionada.value,
                        ...(item.fueRechazado && { RECHAZO: false })
                    };
                    await patchItemRole3(payload);
                }
            } else if (idRolPrincipal === 4) {
                for (const item of currentItems) {
                    if (item.imagenWebp) {
                        try {
                            await uploadItemImages(lineaSeleccionada.value, item.ID, item.marca, item.diseño, null, item.imagenWebp);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen WebP para el ítem ${item.ID}:`, uploadError);
                            toast.error(`Error al subir imagen WebP para ${item.marca} ${item.diseño}`);
                        }
                    }
                    if (item.imagenPng) {
                        try {
                            const empresaToSend = item.EMPRESA || "";
                            await uploadItemImagesSharepoint(lineaSeleccionada.value, item.ID, item.marca, empresaToSend, item.diseño, item.imagenPng, null);
                        } catch (uploadError) {
                            console.error(`Error al subir imagen PNG para el ítem ${item.ID}:`, uploadError);
                            toast.error(`Error al subir imagen PNG para ${item.marca} ${item.diseño}`);
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
        if (idRolPrincipal === 5 && lineaSeleccionada?.value === "LLANTAS MOTO") {
            return ["CST", "KEYSTONE", "MAXXIS MOTO"].map(b => ({ value: b, label: b }));
        }
        const brands = getMarcasForEmpresa(idEmp);
        if (brands.length > 0) {
            return brands.map(b => ({ value: b, label: b }));
        }
        const allBrands = Object.values(MARCAS_POR_EMPRESA).flat();
        const uniqueBrands = Array.from(new Set(allBrands));
        return uniqueBrands.map(b => ({ value: b, label: b }));
    }, [getMarcasForEmpresa, idRolPrincipal, lineaSeleccionada]);

    const actualizarCampoFila = (id, campo, valor) => {
        let val = typeof valor === 'string' ? valor.toUpperCase() : valor;

        if (idRolPrincipal === 5 && campo === "cubicaje") {
            val = valor.replace(/[^0-9.]/g, "");
            if (val.startsWith(".")) val = "0" + val;
            const parts = val.split(".");
            if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
        } else if (idRolPrincipal === 3) {
            if (["rin", "serie", "ancho"].includes(campo)) val = handleRinSerieAncho(valor);
            else if (campo === "lonas") val = handleNumericInput(valor);
            else if (campo === "carga") val = handleCargaInput(valor);
            else if (campo === "velocidad") val = handleVelocidadInput(valor);
        }

        if (idRolPrincipal === 5 && campo === "isNew") {
            setItems(prev => prev.map(it => {
                if (it.id !== id) return it;
                const baseItem = { ...it, isNew: Boolean(val) };
                // El prefijo "NEW " del nombre del sistema depende de esta bandera
                baseItem.nombreSistema = calcularNombreSistemaFinal(
                    it.nombreSistemaBase || it.nombreSistema || "",
                    it.colorLetra,
                    baseItem.isNew
                );
                return baseItem;
            }));
            return;
        }

        if (idRolPrincipal === 5 && campo === "idEmpresa") {
            setItems(prev => prev.map(it => {
                if (it.id === id) {
                    const baseItem = { ...it, idEmpresa: val };
                    const allowedMarcas = getMarcasForEmpresa(val);
                    const brandIsAllowed = allowedMarcas.some(b => String(b).trim().toUpperCase() === String(it.marca).trim().toUpperCase());
                    if (it.marca && !brandIsAllowed && lineaSeleccionada?.value !== 'LLANTAS MOTO') {
                        baseItem.marca = "";
                        baseItem.codigo = calcularCodigoBarras(baseItem);
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
                    if (companyKey && lineaSeleccionada?.value !== 'LLANTAS MOTO') {
                        const companyId = Object.keys(diccionarioEmpresas).find(
                            k => String(diccionarioEmpresas[k]).trim().toUpperCase() === companyKey
                        );
                        if (companyId) {
                            baseItem.idEmpresa = companyId;
                        }
                    }

                    baseItem.codigo = calcularCodigoBarras(baseItem);
                    return baseItem;
                }
                return it;
            }));
            return;
        }

        if (idRolPrincipal === 5 && campo === "descripcionRol5") {
            setItems(prev => prev.map(it => it.id === id ? { ...it, [campo]: val } : it));
            if (debounceTimeouts.current[id]) clearTimeout(debounceTimeouts.current[id]);
            debounceTimeouts.current[id] = setTimeout(async () => {
                if (!val) return;
                try {
                    const result = await parseLlantas([val], lineaSeleccionada.value === 'LLANTAS' ? lineaSeleccionada.value : 'LLANTAS_MOTO');
                    if (result && result[0]) {
                        const parsed = result[0];
                        const parsedName = parsed.NOMBRE || val;
                        setItems(prev => prev.map(it => {
                            if (it.id === id) {
                                const baseItem = {
                                    ...it,
                                    parsedData: parsed,
                                    nombreSistemaBase: parsedName,
                                    nombreSistema: calcularNombreSistemaFinal(parsedName, it.colorLetra, esNuevo(it))
                                };
                                return {
                                    ...baseItem,
                                    codigo: calcularCodigoBarras(baseItem)
                                };
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

        if (idRolPrincipal === 5) {
            const barcodeFields = ["partidaArancelaria", "diseño", "letraDiseño", "colorLetra"];
            if (barcodeFields.includes(campo)) {
                setItems(prev => prev.map(it => {
                    if (it.id === id) {
                        const baseItem = { ...it, [campo]: val };
                        if (campo === "colorLetra") {
                            baseItem.nombreSistema = calcularNombreSistemaFinal(it.nombreSistemaBase || it.nombreSistema || "", val, esNuevo(it));
                        }
                        return {
                            ...baseItem,
                            codigo: calcularCodigoBarras(baseItem)
                        };
                    }
                    return it;
                }));
                return;
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
                        <>
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
                            <ButtonUI
                                text="Exportar a SAP"
                                iconLeft="FaFileExport"
                                variant="outlined"
                                disabled={!lineaSeleccionada}
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

            <div style={{ flex: "1 1 auto", minHeight: "62vh", maxHeight: "80vh", backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <TextUI size="14px" weight="600">
                        Ítems {lineaSeleccionada ? `de ${lineaSeleccionada.label}` : ""} ({items.filter(i => lineaSeleccionada ? i.linea === lineaSeleccionada.value : true).length})
                    </TextUI>
                </div>
                <TablaScroll>
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
                                                    { key: 'codigo', label: "Código Barras", role: 5 },
                                                    { key: 'idEmpresa', label: "Empresa", role: 5 },
                                                    { key: 'codigoProveedor', label: "Cód. Proveedor", role: 5 },
                                                    { key: 'cubicaje', label: "Cubicaje", role: 5 },
                                                    { key: 'descripcionRol5', label: "Descripción Comercial", role: 5 },
                                                    { key: 'nombreExtranjero', label: "Descripción Proveedor", role: 5 },
                                                    { key: 'partidaArancelaria', label: "Posición Arancelaria", role: 5 },
                                                    { key: 'marca', label: "Marca", role: 5 },
                                                    { key: 'diseño', label: "Diseño", role: 3 },
                                                    { key: 'rin', label: "Rin", role: 3 },
                                                    { key: 'serie', label: "Serie", role: 3 },
                                                    { key: 'lonas', label: "Lonas", role: 3 },
                                                    { key: 'ancho', label: "Ancho", role: 3 },
                                                    { key: 'nomenclatura', label: "Nomenclatura", role: 3 },
                                                    { key: 'carga', label: "Índice Carga", role: 3 },
                                                    { key: 'velocidad', label: "Índice Velocidad", role: 3 },
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
                                <Tabla>
                                    <thead>
                                        <tr>
                                            <Th $fija="left" $w={ANCHO_COL_SELECCION} $align="center">
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
                                            </Th>
                                            {idRolPrincipal !== 5 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                <>
                                                    <Th>Marca</Th>
                                                    <Th>Posición Arancelaria</Th>
                                                    <Th>Medida</Th>
                                                    <Th $min="150px">Diseño</Th>
                                                    <Th>Robustez</Th>
                                                    <Th>Nombre</Th>
                                                </>
                                            )}
                                            {idRolPrincipal === 3 && (
                                                <>
                                                    <Th $w={ANCHO_COL_NOMBRE} $fija="left" $offset={ANCHO_COL_SELECCION}>Nombre</Th>
                                                    <Th $min="200px">Diseño</Th>
                                                    <Th $min="100px">Rin</Th>
                                                    <Th $min="100px">Serie</Th>
                                                    <Th $min="100px">Lonas</Th>
                                                    <Th $min="100px">Ancho</Th>
                                                    <Th $min="150px">Nomenclatura</Th>
                                                    <Th $min="100px">Índice Carga</Th>
                                                    <Th $min="100px">Índice Velocidad</Th>
                                                    <Th $min="150px">Categoría</Th>
                                                    <Th $min="150px">Segmento</Th>
                                                    <Th $min="150px">Aplicación</Th>
                                                    <Th $min="150px">Eje</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                    <Th $w="100px" $align="center" $fija="right">Acciones</Th>
                                                </>
                                            )}
                                            {idRolPrincipal === 4 && (
                                                <>
                                                    <Th>Marca</Th>
                                                    <Th $min="150px">Diseño</Th>
                                                    <Th $min="250px">Nombre</Th>
                                                    <Th>Imagen PNG</Th>
                                                    <Th>Imagen WebP</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                    <Th $w="100px" $align="center" $fija="right">Acciones</Th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <Th>Empresa</Th>
                                                    <Th $min="200px">Marca</Th>
                                                    <Th $min="380px">Nombre</Th>
                                                    <Th $min="150px">Diseño</Th>
                                                    <Th>Letra Diseño</Th>
                                                    <Th>Color Letra</Th>
                                                    <Th $min="300px">Código Barras</Th>
                                                    <Th>Código Proveedor</Th>
                                                    <Th>Descripción Proveedor</Th>
                                                    <Th>Cubicaje</Th>
                                                    <Th>Partida Arancelaria</Th>
                                                    <Th $min="380px">Nombre Del Sistema</Th>
                                                    <Th $align="center" $w="90px">Es nuevo</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                    <Th $min="100px" $w="100px" $align="center" $fija="right">Acciones</Th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <Td colSpan={99} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Llantas
                                                </Td>
                                            </tr>
                                        ) : itemsFiltrados.map((item, idx) => (
                                            <Fila key={item.id} $par={idx % 2 === 0} $sel={selectedItemIds.has(item.id)}>
                                                <Td $densa $align="center" $fija="left" $w={ANCHO_COL_SELECCION}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                                        <NumeroFila>{idx + 1}</NumeroFila>
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
                                                    </div>
                                                </Td>
                                                {idRolPrincipal !== 5 && idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                    <>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.marcaRef || ""} onChange={(v) => actualizarCampoFila(item.id, "marcaRef", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.partidaArancelaria || ""} onChange={(v) => actualizarCampoFila(item.id, "partidaArancelaria", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.medida || ""} onChange={(v) => actualizarCampoFila(item.id, "medida", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.robustez || ""} onChange={(v) => actualizarCampoFila(item.id, "robustez", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></Td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 3 && (
                                                    <>
                                                        <Td $densa $fija="left" $offset={ANCHO_COL_SELECCION} $w={ANCHO_COL_NOMBRE}>
                                                            <CeldaLectura title={item.descripcion || ""}>
                                                                {item.descripcion || "-"}
                                                            </CeldaLectura>
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.rin || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "rin", handleNumericInput(v))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.serie || ""} formatValue={handleOneDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "serie", handleOneDecimalInput(v))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.lonas || ""} formatValue={handleNumericInput} onChange={(v) => actualizarCampoFila(item.id, "lonas", handleNumericInput(v))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.ancho || ""} formatValue={handleOneDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "ancho", handleOneDecimalInput(v))} /></Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={TIPOS_LLANTAS}
                                                                value={item.nomenclatura ? { value: item.nomenclatura, label: item.nomenclatura } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "nomenclatura", v?.value)}
                                                                minWidth="120px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.carga || ""} formatValue={handleCargaInput} onChange={(v) => actualizarCampoFila(item.id, "carga", handleCargaInput(v))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.velocidad || ""} formatValue={handleVelocidadInput} onChange={(v) => actualizarCampoFila(item.id, "velocidad", handleVelocidadInput(v))} /></Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={Object.keys(getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)).map(k => ({ value: k, label: k }))}
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
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={item.categoria && getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria]?.segmentos ? Object.keys(getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria].segmentos).map(k => ({ value: k, label: k })) : []}
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
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={item.categoria && item.segmento && getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria]?.segmentos?.[item.segmento]?.aplicaciones ? Object.keys(getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria].segmentos[item.segmento].aplicaciones).map(k => ({ value: k, label: k })) : []}
                                                                value={item.aplicacion ? { value: item.aplicacion, label: item.aplicacion } : null}
                                                                onChange={(v) => {
                                                                    actualizarCampoFila(item.id, "aplicacion", v?.value);
                                                                    actualizarCampoFila(item.id, "eje", "");
                                                                }}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                disabled={!item.segmento}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={item.categoria && item.segmento && item.aplicacion && getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria]?.segmentos?.[item.segmento]?.aplicaciones?.[item.aplicacion] ? getCategoriasPorLinea(item.linea || lineaSeleccionada?.value)[item.categoria].segmentos[item.segmento].aplicaciones[item.aplicacion].map(k => ({ value: k, label: k })) : []}
                                                                value={item.eje ? { value: item.eje, label: item.eje } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "eje", v?.value)}
                                                                minWidth="140px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                disabled={!item.aplicacion}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </Td>
                                                        <Td $densa $align="center" $fija="right">
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
                                                        </Td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 4 && (
                                                    <>

                                                        <Td $densa>
                                                            <CeldaLectura>
                                                                {item.marca || "-"}
                                                            </CeldaLectura>
                                                        </Td>
                                                        <Td $densa>
                                                            <CeldaLectura>
                                                                {item.diseño || "-"}
                                                            </CeldaLectura>
                                                        </Td>
                                                        <Td $densa>
                                                            <CeldaLectura>
                                                                {item.descripcion || "-"}
                                                            </CeldaLectura>
                                                        </Td>
                                                        <Td $densa>
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
                                                        </Td>
                                                        <Td $densa>
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
                                                        </Td>
                                                        <Td $densa>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </Td>
                                                        <Td $densa $align="center" $fija="right">
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
                                                        </Td>
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={getBrandOptions(item.idEmpresa)}
                                                                value={item.marca ? { value: item.marca, label: item.marca } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "marca", v?.value)}
                                                                minWidth="200px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                isCreatable={true}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></Td>
                                                        <Td $densa><InputUI maxLength={20} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 20))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></Td>
                                                        <Td $densa>
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
                                                        </Td>
                                                        <Td $densa><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></Td>
                                                        <Td $densa $align="center">
                                                            <CheckboxUI
                                                                checked={esNuevo(item)}
                                                                onChange={(_, checked) => actualizarCampoFila(item.id, "isNew", checked)}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </Td>
                                                    </>
                                                )}
                                                {/* Los roles 3 y 4 ya traen su propia celda de acciones
                                                    ("Motivo de rechazo"), así que esta quedaría vacía y sin
                                                    cabecera: una columna de más en el tbody. */}
                                                {idRolPrincipal !== 3 && idRolPrincipal !== 4 && (
                                                    <Td $align="center" $fija="right">
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
                                                        ) : (
                                                            <ButtonUI text="Eliminar" variant="outlined" pcolor={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", fontSize: "11px", minWidth: "auto" }} onClick={() => eliminarItem(item.id)} />
                                                        )}
                                                    </Td>
                                                )}
                                            </Fila>
                                        ))}
                                    </tbody>
                                </Tabla>
                            );
                        } else if (esLubricantes) {
                            return (
                                <Tabla>
                                    <thead>
                                        <tr>
                                            <Th $fija="left" $w={ANCHO_COL_SELECCION} $align="center">
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
                                            </Th>
                                            {idRolPrincipal !== 5 && (
                                                <>
                                                    <Th>Marca/Familia</Th>
                                                    <Th>Tipo</Th>
                                                    <Th>Viscosidad</Th>
                                                    <Th>Presentación</Th>
                                                    <Th>Nombre</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <Th>Empresa</Th>
                                                    <Th $min="200px">Marca</Th>
                                                    <Th $min="380px">Nombre</Th>
                                                    <Th $min="150px">Diseño</Th>
                                                    <Th>Letra Diseño</Th>
                                                    <Th>Color Letra</Th>
                                                    <Th $min="300px">Código Barras</Th>
                                                    <Th>Cód. Proveedor</Th>
                                                    <Th>Descripción Proveedor</Th>
                                                    <Th>Cubicaje</Th>
                                                    <Th>Partida Arancelaria</Th>
                                                    <Th $min="380px">Nombre Del Sistema</Th>
                                                    <Th $align="center" $w="90px">Es nuevo</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                    <Th $min="100px" $w="100px" $align="center" $fija="right">Acciones</Th>
                                                </>
                                            )}
                                            <Th $w="100px" $align="center" $fija="right">Acciones</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <Td colSpan={99} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Lubricantes
                                                </Td>
                                            </tr>
                                        ) : itemsFiltrados.map((item, idx) => (
                                            <Fila key={item.id} $par={idx % 2 === 0} $sel={selectedItemIds.has(item.id)}>
                                                <Td $densa $align="center" $fija="left" $w={ANCHO_COL_SELECCION}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                                        <NumeroFila>{idx + 1}</NumeroFila>
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
                                                    </div>
                                                </Td>
                                                {idRolPrincipal !== 5 && (
                                                    <>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.marca || ""} onChange={(v) => actualizarCampoFila(item.id, "marca", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.tipoLub || ""} onChange={(v) => actualizarCampoFila(item.id, "tipoLub", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.viscosidad || ""} onChange={(v) => actualizarCampoFila(item.id, "viscosidad", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.presentacion || ""} onChange={(v) => actualizarCampoFila(item.id, "presentacion", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></Td>
                                                        {(idRolPrincipal === 3 || idRolPrincipal === 4) && (
                                                            <Td $densa>
                                                                <InputUI
                                                                    style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                    value={item.comentarios || ""}
                                                                    onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                                />
                                                            </Td>
                                                        )}
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={getBrandOptions(item.idEmpresa)}
                                                                value={item.marca ? { value: item.marca, label: item.marca } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "marca", v?.value)}
                                                                minWidth="200px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                isCreatable={true}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></Td>
                                                        <Td $densa><InputUI maxLength={20} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 20))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></Td>
                                                        <Td $densa>
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
                                                        </Td>
                                                        <Td $densa><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></Td>
                                                        <Td $densa $align="center">
                                                            <CheckboxUI
                                                                checked={esNuevo(item)}
                                                                onChange={(_, checked) => actualizarCampoFila(item.id, "isNew", checked)}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </Td>
                                                    </>
                                                )}
                                                <Td $align="center" $fija="right">
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
                                                </Td>
                                            </Fila>
                                        ))}
                                    </tbody>
                                </Tabla>
                            );
                        } else if (esHerramientas) {
                            return (
                                <Tabla>
                                    <thead>
                                        <tr>
                                            <Th $fija="left" $w={ANCHO_COL_SELECCION} $align="center">
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
                                            </Th>
                                            {idRolPrincipal !== 5 && (
                                                <>
                                                    <Th>Nombre</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                </>
                                            )}
                                            {idRolPrincipal === 5 && (
                                                <>
                                                    <Th>Empresa</Th>
                                                    <Th $min="200px">Marca</Th>
                                                    <Th $min="380px">Nombre</Th>
                                                    <Th $min="150px">Diseño</Th>
                                                    <Th>Letra Diseño</Th>
                                                    <Th>Color Letra</Th>
                                                    <Th $min="300px">Código Barras</Th>
                                                    <Th>Cód. Proveedor</Th>
                                                    <Th>Descripción Proveedor</Th>
                                                    <Th>Cubicaje</Th>
                                                    <Th>Partida Arancelaria</Th>
                                                    <Th $min="380px">Nombre Del Sistema</Th>
                                                    <Th $align="center" $w="90px">Es nuevo</Th>
                                                    <Th $min="200px">Comentarios</Th>
                                                    <Th $min="100px" $w="100px" $align="center" $fija="right">Acciones</Th>
                                                </>
                                            )}
                                            <Th $w="100px" $align="center" $fija="right">Acciones</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsFiltrados.length === 0 ? (
                                            <tr>
                                                <Td colSpan={99} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary || "#888" }}>
                                                    No hay ítems de Herramientas
                                                </Td>
                                            </tr>
                                        ) : itemsFiltrados.map((item, idx) => (
                                            <Fila key={item.id} $par={idx % 2 === 0} $sel={selectedItemIds.has(item.id)}>
                                                <Td $densa $align="center" $fija="left" $w={ANCHO_COL_SELECCION}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                                        <NumeroFila>{idx + 1}</NumeroFila>
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
                                                    </div>
                                                </Td>
                                                {idRolPrincipal !== 5 && (
                                                    <>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "150px" }} value={item.descripcionConVariables || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionConVariables", v)} /></Td>
                                                        {(idRolPrincipal === 3 || idRolPrincipal === 4) && (
                                                            <Td $densa>
                                                                <InputUI
                                                                    style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                    value={item.comentarios || ""}
                                                                    onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                                />
                                                            </Td>
                                                        )}
                                                    </>
                                                )}
                                                {idRolPrincipal === 5 && (
                                                    <>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={opcionesEmpresasPermitidas}
                                                                value={item.idEmpresa ? { value: item.idEmpresa, label: diccionarioEmpresas[item.idEmpresa] } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "idEmpresa", v?.value)}
                                                                minWidth="130px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={getBrandOptions(item.idEmpresa)}
                                                                value={item.marca ? { value: item.marca, label: item.marca } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "marca", v?.value)}
                                                                minWidth="200px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                                isCreatable={true}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "380px" }} value={item.descripcionRol5 || ""} onChange={(v) => actualizarCampoFila(item.id, "descripcionRol5", v)} /></Td>
                                                        <Td $densa><InputUI maxLength={20} style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.diseño || ""} onChange={(v) => actualizarCampoFila(item.id, "diseño", v.slice(0, 20))} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.letraDiseño || ""} onChange={(v) => actualizarCampoFila(item.id, "letraDiseño", v)} /></Td>
                                                        <Td $densa>
                                                            <SelectUI
                                                                options={OPTIONS_COLOR_LETRA}
                                                                value={item.colorLetra ? { value: item.colorLetra, label: item.colorLetra } : null}
                                                                onChange={(v) => actualizarCampoFila(item.id, "colorLetra", v?.value)}
                                                                minWidth="100px"
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" }}
                                                            />
                                                        </Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "300px" }} value={item.codigo || ""} onChange={(v) => actualizarCampoFila(item.id, "codigo", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "100px" }} value={item.codigoProveedor || ""} onChange={(v) => actualizarCampoFila(item.id, "codigoProveedor", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "120px" }} value={item.nombreExtranjero || ""} onChange={(v) => actualizarCampoFila(item.id, "nombreExtranjero", v)} /></Td>
                                                        <Td $densa><InputUI style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "80px" }} value={item.cubicaje || ""} formatValue={handleDecimalInput} onChange={(v) => actualizarCampoFila(item.id, "cubicaje", handleDecimalInput(v))} /></Td>
                                                        <Td $densa>
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
                                                        </Td>
                                                        <Td $densa><div style={{ height: "30px", display: "flex", alignItems: "center", fontSize: "11px", textTransform: "uppercase", minWidth: "380px", color: theme?.colors?.textSecondary, backgroundColor: theme?.colors?.border + "22", padding: "0 8px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.nombreSistema}>{item.nombreSistema || "N/A"}</div></Td>
                                                        <Td $densa $align="center">
                                                            <CheckboxUI
                                                                checked={esNuevo(item)}
                                                                onChange={(_, checked) => actualizarCampoFila(item.id, "isNew", checked)}
                                                            />
                                                        </Td>
                                                        <Td $densa>
                                                            <InputUI
                                                                style={{ height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase", minWidth: "180px" }}
                                                                value={item.comentarios || ""}
                                                                onChange={(v) => actualizarCampoFila(item.id, "comentarios", v)}
                                                            />
                                                        </Td>
                                                    </>
                                                )}
                                                <Td $align="center" $fija="right">
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
                                                </Td>
                                            </Fila>
                                        ))}
                                    </tbody>
                                </Tabla>
                            );
                        }
                        return null;
                    })()}
                </TablaScroll>
                {lineaSeleccionada && idRolPrincipal !== 1 && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme?.colors?.border || "#eee"}`, display: "flex", justifyContent: "flex-end" }}>
                        <ButtonUI
                            text={isSubmitting ? "Enviando..." : "Enviar a revisión"}
                            iconLeft="FaCheck"
                            disabled={isSubmitting || items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id)).length === 0}
                            onClick={async () => {
                                const currentItems = items.filter(i => i.linea === lineaSeleccionada.value && selectedItemIds.has(i.id));
                                if (currentItems.length === 0) return;

                                if (idRolPrincipal === 5) {
                                    const createdItems = currentItems.filter(i => !i.fueRechazado);
                                    if (createdItems.length > 0) {
                                        // Agrupar items por empresa para el modal de SAP, solo los nuevos
                                        const grouped = {};
                                        createdItems.forEach(item => {
                                            const companyName = diccionarioEmpresas[item.idEmpresa] || "SIN EMPRESA";
                                            if (!grouped[companyName]) grouped[companyName] = [];
                                            grouped[companyName].push({
                                                CODIGO_BARRAS: item.codigo,
                                                CODIGO_PROVEEDOR: item.codigoProveedor,
                                                CUBICAJE: item.cubicaje,
                                                MARCA: item.marca,
                                                LINEA_NEGOCIO: item.linea,
                                                NOMBRE_EXTRANJERO: item.nombreExtranjero,
                                                DESCRIPCION: item.nombreSistema,
                                                PARTIDA_ARANCELARIA: item.partidaArancelaria
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
                <div style={{ backgroundColor: theme?.colors?.background || "#fff", borderRadius: 8, border: `1px solid ${theme?.colors?.border || "#eee"}`, overflow: "hidden", display: "flex", flexDirection: "column", flex: "0 0 auto", maxHeight: "45vh", marginBottom: "16px" }}>
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
                                    <Th $min="350px">Nombre</Th>
                                    <Th>Marca</Th>
                                    <Th $min="150px">Diseño</Th>
                                    <Th $align="center" $w="80px" $fija="right">Detalle</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItems.filter(i => i.linea === lineaSeleccionada.value).map((item, idx) => (
                                    <Fila key={item.id} $par={idx % 2 === 0}>
                                        <Td><TextUI size="12px">{diccionarioEmpresas[item.idEmpresa] || item.EMPRESA || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.CODIGO_SAP || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.codigo || item.CODIGO_BARRAS || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.nombreSistema || item.descripcionRol5 || item.descripcion || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.marca || "-"}</TextUI></Td>
                                        <Td><TextUI size="12px">{item.diseño || item.DISENIO || "-"}</TextUI></Td>
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
                    const filas = [
                        { label: "Empresa", valor: diccionarioEmpresas[detalleItem.idEmpresa] || detalleItem.EMPRESA },
                        ...CAMPOS_DETALLE.map(c => ({ label: c.label, valor: c.get(detalleItem) })),
                    ].filter(f => f.valor !== undefined && f.valor !== null && String(f.valor).trim() !== "");

                    const fases = Array.isArray(detalleItem.FASES) ? detalleItem.FASES : [];
                    const rechazada = fases.find(f => f.RECHAZO);
                    const aprobado = detalleItem.APROBADO_MDM === true;

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
                                <Etiqueta $tono={esNuevo(detalleItem) ? "info" : "neutro"}>
                                    {esNuevo(detalleItem) ? "Producto nuevo" : "Producto existente"}
                                </Etiqueta>
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
                    <TablaScroll style={{ maxHeight: "400px", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <Tabla>
                            <thead>
                                <tr>
                                    <Th $w="46px" $align="center"></Th>
                                    <Th $align="center">Código</Th>
                                    <Th $align="center">Nombre</Th>
                                    <Th $align="center">Diseño</Th>
                                    <Th $align="center">Fabricante</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItemsToReview.map((item, idx) => (
                                    <Fila
                                        key={item.DIT_CODIGO}
                                        $par={idx % 2 === 0}
                                        $sel={selectedItemsToReviewIds.has(item.DIT_CODIGO)}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => {
                                            setSelectedItemsToReviewIds(prev => {
                                                const newSet = new Set(prev);
                                                if (newSet.has(item.DIT_CODIGO)) newSet.delete(item.DIT_CODIGO);
                                                else newSet.add(item.DIT_CODIGO);
                                                return newSet;
                                            });
                                        }}
                                    >
                                        <Td $align="center">
                                            <CheckboxUI
                                                checked={selectedItemsToReviewIds.has(item.DIT_CODIGO)}
                                                onChange={() => { }} // handled by tr onClick
                                            />
                                        </Td>
                                        <Td style={{ color: theme?.colors?.text }}>{item.DIT_NUEVOIDENTIFICADOR}</Td>
                                        <Td style={{ color: theme?.colors?.text }}>{item.DIT_NOMBRE}</Td>
                                        <Td style={{ color: theme?.colors?.text }}>{item.DIT_DISENIO}</Td>
                                        <Td style={{ color: theme?.colors?.text }}>{item.DIT_MARCA}</Td>
                                    </Fila>
                                ))}
                            </tbody>
                        </Tabla>
                    </TablaScroll>

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
                                    const promises = selectedIds.map(id => createItemFromDWH("LLANTAS", id));
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
                width="1000px"
            >
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <TextUI size="14px" color={theme?.colors?.textSecondary}>
                        Se muestran todos los ítems aprobados ordenados por fecha de actualización.
                    </TextUI>
                    <TablaScroll style={{ maxHeight: "500px", border: `1px solid ${theme?.colors?.border || "#eee"}`, borderRadius: "8px" }}>
                        <Tabla>
                            <thead>
                                <tr>
                                    <Th $align="center" $w="50px">
                                        <CheckboxUI
                                            checked={approvedItemsForExport.length > 0 && approvedItemsForExport.every(i => selectedApprovedItemIds.has(i.ID))}
                                            onChange={(_, checked) => {
                                                if (checked) setSelectedApprovedItemIds(new Set(approvedItemsForExport.map(i => i.ID)));
                                                else setSelectedApprovedItemIds(new Set());
                                            }}
                                        />
                                    </Th>
                                    <Th>Empresa</Th>
                                    <Th>Código SAP</Th>
                                    <Th>Nombre</Th>
                                    <Th>Aprobado el</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedItemsForExport.length === 0 ? (
                                    <tr>
                                        <Td colSpan={5} style={{ padding: "20px", textAlign: "center", color: theme?.colors?.textSecondary }}>No hay ítems aprobados para exportar.</Td>
                                    </tr>
                                ) : (
                                    approvedItemsForExport.map((item, idx) => (
                                        <Fila key={item.ID} $par={idx % 2 === 0} $sel={selectedApprovedItemIds.has(item.ID)}>
                                            <Td $align="center">
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
                                            </Td>
                                            <Td style={{ color: theme?.colors?.text }}>{item.EMPRESA}</Td>
                                            <Td style={{ color: theme?.colors?.text }}>{item.CODIGO_SAP || "-"}</Td>
                                            <Td style={{ color: theme?.colors?.text }}>{item.DESCRIPCION}</Td>
                                            <Td style={{ color: theme?.colors?.textSecondary }}>{new Date(item.updatedAt).toLocaleString()}</Td>
                                        </Fila>
                                    ))
                                )}
                            </tbody>
                        </Tabla>
                    </TablaScroll>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
                        {Object.entries(
                            approvedItemsForExport
                                .filter(it => selectedApprovedItemIds.has(it.ID))
                                .reduce((acc, it) => {
                                    if (!acc[it.EMPRESA]) acc[it.EMPRESA] = [];
                                    acc[it.EMPRESA].push({
                                        ...it,
                                        linea: lineaSeleccionada?.value // Necesario para el ecovalor
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

export default Llantas;
