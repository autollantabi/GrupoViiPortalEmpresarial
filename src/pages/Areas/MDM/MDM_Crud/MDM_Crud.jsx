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
    tipo: "Tipo", ancho: "Ancho", altura: "Altura/Serie", rin: "Rin",
    diseño: "Diseño", lona: "Lona/Robustez", carga: "Carga", velocidad: "Velocidad",
    marca: "Marca", modelo: "Modelo", tipoLub: "Tipo", viscosidad: "Viscosidad", empaque: "Empaque",
};

const ID_BORRADOR = "draft";

// --- Configuración de rangos por línea de negocio ---
const LINEA_CONFIG = {
    LLANTAS: {
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
function validarModelo(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    if (!/^[A-Za-záéíóúñÁÉÍÓÚÑüÜ\s]+$/.test(String(valor).trim())) return "Solo caracteres alfabéticos";
    return null;
}

function validarViscosidad(valor) {
    if (valor == null || String(valor).trim() === "") return null; // OPCIONAL
    const s = String(valor).trim().toUpperCase();
    if (!/^\d{1,2}W\d{1,2}$/.test(s)) return "Formato XWX (ej: 5W30, 10W40)";
    return null;
}

function validarEmpaque(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const s = String(valor).trim();
    if (!/^\d+\*\d+[A-Za-záéíóúñÁÉÍÓÚÑ]+$/.test(s)) return "Formato X*XM (ej: 1*4GAL)";
    return null;
}

function buildDescripcionLubricantes(marca, modelo, tipoLub, viscosidad, empaque) {
    return [marca, modelo, tipoLub, viscosidad, empaque]
        .map((v) => (v != null ? String(v).trim() : ""))
        .filter(Boolean)
        .join(" ");
}

function buildDescripcionConVariables(tipo, ancho, altura, rin, diseño, lona, carga, velocidad) {
    const r = rin != null && String(rin).trim() !== "" ? String(rin).trim() : "";
    const d = diseño != null ? String(diseño).trim() : "";
    const lo = lona != null && String(lona).trim() !== "" ? `${String(lona).trim()}PR` : "";
    const c = carga != null ? String(carga).trim() : "";
    const v = velocidad != null ? String(velocidad).trim().toUpperCase() : "";
    const part = `R-${r} ${d} ${lo} ${c}${v}`.trim();
    if (tipo === "Americana") return `${altura || ""} x ${ancho || ""} ${part}`.trim();
    if (tipo === "Milimetrica") return `${ancho || ""}/${altura || ""} ${part}`.trim();
    if (tipo === "Decimal") return `${ancho || ""} ${part}`.trim();
    return "";
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
    // Lubricantes
    const [marca, setMarca] = useState(null);
    const [modelo, setModelo] = useState("");
    const [tipoLub, setTipoLub] = useState("");
    const [viscosidad, setViscosidad] = useState("");
    const [empaque, setEmpaque] = useState("");

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
    const esLlantas = lineaActual === "LLANTAS" || lineaActual === "LLANTAS MOTO";
    const esLubricantes = lineaActual === "LUBRICANTES";

    const opcionesAncho = useMemo(() => {
        if (!config || !tipo?.value) return [];
        const cfg = config.ancho?.[tipo.value];
        return cfg ? generarOpciones(cfg.min, cfg.max, cfg.step) : [];
    }, [config, tipo]);

    const opcionesAltura = useMemo(() => {
        if (!config || !tipo?.value) return [];
        const cfg = config.altura?.[tipo.value];
        return cfg ? generarOpciones(cfg.min, cfg.max, cfg.step) : [];
    }, [config, tipo]);

    const opcionesRin = useMemo(() => {
        if (!config) return [];
        return generarOpciones(config.rin.min, config.rin.max, config.rin.step);
    }, [config]);

    const opcionesLona = useMemo(() => {
        if (!config) return [];
        return generarOpciones(config.lona.min, config.lona.max, config.lona.step);
    }, [config]);

    const opcionesCarga = useMemo(() => {
        if (!config) return [];
        if (config.carga.tipo === "formato") return generarCargasFormato();
        if (config.carga.tipo === "rango") return generarOpciones(config.carga.min, config.carga.max, config.carga.step);
        return [];
    }, [config]);

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
        setMarca(null); setModelo(""); setTipoLub(""); setViscosidad(""); setEmpaque("");
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
        // Lubricantes
        setMarca(null); setModelo(""); setTipoLub(""); setViscosidad(""); setEmpaque("");
        // Común
        setTouchedFields(new Set());
    }, []);

    const errores = useMemo(() => {
        if (esLubricantes) {
            return {
                marca: validarRequerido(marca?.value),
                modelo: validarModelo(modelo),
                tipoLub: validarRequerido(tipoLub),
                viscosidad: validarViscosidad(viscosidad),
                empaque: validarEmpaque(empaque),
            };
        }
        const tipoVal = tipo?.value;
        return {
            tipo: !tipoVal ? "Requerido" : null,
            ancho: validarAncho(config, tipoVal, ancho?.value),
            altura: validarAltura(config, tipoVal, altura?.value),
            rin: validarRin(config, rin?.value),
            diseño: validarDiseño(diseño),
            lona: validarLona(config, lona?.value),
            carga: validarCarga(config, carga?.value),
            velocidad: validarVelocidad(velocidad?.value),
        };
    }, [esLubricantes, config, tipo, ancho, altura, rin, diseño, lona, carga, velocidad, marca, modelo, tipoLub, viscosidad, empaque]);

    const marcarTocado = useCallback((campo) => {
        setTouchedFields((prev) => new Set(prev).add(campo));
    }, []);

    const renderCampo = (campo, label, { tipoComp = "select", placeholder, options, value, onChange, onChangeExtra } = {}) => (
        <div key={campo} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {tipoComp === "select" ? (
                <SelectUI
                    label={label} placeholder={placeholder || "Seleccionar"} options={options || []}
                    value={value} onChange={(v) => { onChange(v); onChangeExtra?.(v); marcarTocado(campo); }} minWidth="100%"
                />
            ) : (
                <InputUI
                    label={label} placeholder={placeholder || ""}
                    value={value} onChange={(v) => { onChange(v); onChangeExtra?.(v); marcarTocado(campo); }}
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
                id, marca: marca?.value, modelo, tipoLub,
                viscosidad: viscosidad || null, empaque,
                descripcionConVariables: buildDescripcionLubricantes(marca?.value, modelo, tipoLub, viscosidad, empaque),
            };
        } else {
            item = {
                id, tipo: tipo?.value, ancho: ancho?.value,
                altura: tipo?.value === "Decimal" ? null : altura?.value,
                rin: rin?.value, diseño, lona: lona?.value,
                carga: carga?.value, velocidad: velocidad?.value,
                descripcionConVariables: buildDescripcionConVariables(
                    tipo?.value, ancho?.value, tipo?.value === "Decimal" ? null : altura?.value,
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
    }, [currentGroup, currentGroupId, errores, esLubricantes, tipo, ancho, altura, rin, diseño, lona, carga, velocidad, marca, modelo, tipoLub, viscosidad, empaque, limpiarFormulario]);

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
        exportarItemsATxt(currentGroup.items, `grupo-${fecha}.txt`);
        toast.success("Grupo exportado");
    }, [currentGroup]);

    const exportarSeleccionados = useCallback(() => {
        if (!currentGroup || selectedItemIds.size === 0) {
            toast.error("Seleccione al menos un ítem");
            return;
        }
        const items = currentGroup.items.filter((i) => selectedItemIds.has(i.id));
        exportarItemsATxt(items, "seleccionados.txt");
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
    const mostrarFormulario = tieneLineaYEmpresa && (esLlantas || esLubricantes);

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
                                                        {renderCampo("tipo", "Tipo", { placeholder: "Tipo", options: TIPOS_LLANTAS, value: tipo, onChange: setTipo, onChangeExtra: () => { setAncho(null); setAltura(null); } })}
                                                        {renderCampo("ancho", "Ancho", { options: opcionesAncho, value: ancho, onChange: setAncho })}
                                                        {tipo?.value !== "Decimal" && renderCampo("altura", "Altura/Serie", { options: opcionesAltura, value: altura, onChange: setAltura })}
                                                        {renderCampo("rin", "Rin", { options: opcionesRin, value: rin, onChange: setRin })}
                                                        {renderCampo("diseño", "Diseño", { tipoComp: "input", placeholder: "Alfanumérico", value: diseño, onChange: setDiseño })}
                                                        {renderCampo("lona", "Lona/Robustez", { options: opcionesLona, value: lona, onChange: setLona })}
                                                        {renderCampo("carga", "Carga", { options: opcionesCarga, value: carga, onChange: setCarga })}
                                                        {renderCampo("velocidad", "Velocidad", { placeholder: "Letra", options: VELOCIDADES, value: velocidad, onChange: setVelocidad })}
                                                    </>)}
                                                    {esLubricantes && (<>
                                                        {renderCampo("marca", "Marca", { options: MARCAS_LUBRICANTES, value: marca, onChange: setMarca })}
                                                        {renderCampo("modelo", "Modelo", { tipoComp: "input", placeholder: "Caracteres alfabéticos", value: modelo, onChange: setModelo })}
                                                        {renderCampo("tipoLub", "Tipo", { tipoComp: "input", placeholder: "Caracteres alfanuméricos", value: tipoLub, onChange: setTipoLub })}
                                                        {renderCampo("viscosidad", "Viscosidad (opcional)", { tipoComp: "input", placeholder: "Ej: 5W30, 10W40", value: viscosidad, onChange: setViscosidad })}
                                                        {renderCampo("empaque", "Empaque", { tipoComp: "input", placeholder: "Ej: 1*4GAL", value: empaque, onChange: setEmpaque })}
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
                                        exportarItemsATxt(g.items, `grupo-${fecha}.txt`);
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
