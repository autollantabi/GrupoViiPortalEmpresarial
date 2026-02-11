import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";

const LINEAS_NEGOCIO = [{ value: "LLANTAS", label: "LLANTAS" }];
const TIPOS_LLANTAS = [
    { value: "Americana", label: "Americana" },
    { value: "Milimetrica", label: "Milimétrica" },
    { value: "Decimal", label: "Decimal" },
];
const VELOCIDADES = "Y G R H L Q W F J M P V S I K T N".split(" ").map((v) => ({ value: v, label: v }));
const EMPRESAS_PLACEHOLDER = [
    { value: "E1", label: "Empresa 1" },
    { value: "E2", label: "Empresa 2" },
];

const ID_BORRADOR = "draft";

function validarAncho(tipo, valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const n = parseFloat(String(valor).replace(",", "."));
    if (Number.isNaN(n)) return "Debe ser número";
    if (tipo === "Americana") {
        if (n < 8 || n > 13) return "Entre 8 y 13";
        return null;
    }
    if (tipo === "Milimetrica") {
        if (!Number.isInteger(n) || n < 55 || n > 385) return "Entero entre 55 y 385";
        return null;
    }
    if (tipo === "Decimal") {
        if (n < 2.5 || n > 14) return "Entre 2.5 y 14";
        return null;
    }
    return null;
}

function validarAltura(tipo, valor) {
    if (tipo === "Decimal") return null;
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const n = parseInt(String(valor), 10);
    if (Number.isNaN(n)) return "Debe ser entero";
    if (tipo === "Americana" && (n < 18 || n > 38)) return "Entero entre 18 y 38";
    if (tipo === "Milimetrica" && (n < 35 || n > 100)) return "Entero entre 35 y 100";
    return null;
}

function validarRin(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const n = parseFloat(String(valor).replace(",", "."));
    if (Number.isNaN(n) || n < 10 || n > 24.5) return "Entre 10 y 24.5";
    return null;
}

function validarDiseño(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    return null;
}

function validarLona(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const n = parseInt(String(valor), 10);
    if (Number.isNaN(n) || n < 6 || n > 24) return "Entre 6 y 24";
    return null;
}

function validarCarga(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const s = String(valor).trim();
    if (/^\d+$/.test(s)) return null;
    if (/^\d+\/\d+$/.test(s)) return null;
    return "Formato X o X/X (2 o 3 números)";
}

function validarVelocidad(valor) {
    if (valor == null || String(valor).trim() === "") return "Requerido";
    const v = String(valor).trim().toUpperCase();
    if (v.length !== 1 || !VELOCIDADES.some((x) => x.value === v)) return "Una letra: Y,G,R,H,L,Q,W,F,J,M,P,V,S,I,K,T,N";
    return null;
}

function buildDescripcionConVariables(tipo, ancho, altura, rin, diseño, lona, carga, velocidad) {
    const r = rin != null && String(rin).trim() !== "" ? String(rin).trim() : "";
    const d = diseño != null ? String(diseño).trim() : "";
    const lo = lona != null ? String(lona).trim() : "";
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
    const [ancho, setAncho] = useState("");
    const [altura, setAltura] = useState("");
    const [rin, setRin] = useState("");
    const [diseño, setDiseño] = useState("");
    const [lona, setLona] = useState("");
    const [carga, setCarga] = useState("");
    const [velocidad, setVelocidad] = useState(null);
    const [touchedFields, setTouchedFields] = useState(() => new Set());
    const [mostrarFormularioNuevoItem, setMostrarFormularioNuevoItem] = useState(false);

    const currentGroup = useMemo(
        () => groups.find((g) => g.id === currentGroupId) || null,
        [groups, currentGroupId]
    );

    useEffect(() => {
        setMostrarFormularioNuevoItem(false);
    }, [currentGroupId]);

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
        setAncho("");
        setAltura("");
        setRin("");
        setDiseño("");
        setLona("");
        setCarga("");
        setVelocidad(null);
        setTouchedFields(new Set());
        setMostrarFormularioNuevoItem(false);
        setSelectedItemIds(new Set());
        toast.success("Nuevo grupo en edición. Asigne línea, empresa y ítems, luego Guardar grupo.");
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
        setTipo(null);
        setAncho("");
        setAltura("");
        setRin("");
        setDiseño("");
        setLona("");
        setCarga("");
        setVelocidad(null);
        setTouchedFields(new Set());
    }, []);

    const errores = useMemo(() => {
        const tipoVal = tipo?.value;
        return {
            tipo: !tipoVal ? "Requerido" : null,
            ancho: validarAncho(tipoVal, ancho),
            altura: validarAltura(tipoVal, altura),
            rin: validarRin(rin),
            diseño: validarDiseño(diseño),
            lona: validarLona(lona),
            carga: validarCarga(carga),
            velocidad: validarVelocidad(velocidad?.value ?? velocidad),
        };
    }, [tipo, ancho, altura, rin, diseño, lona, carga, velocidad]);

    const marcarTocado = useCallback((campo) => {
        setTouchedFields((prev) => new Set(prev).add(campo));
    }, []);

    const agregarItem = useCallback(() => {
        if (!currentGroup) return;
        const { tipo: errTipo, ancho: errAncho, altura: errAltura, rin: errRin, diseño: errDiseño, lona: errLona, carga: errCarga, velocidad: errVelocidad } = errores;
        const conError = [
            errTipo && { campo: "Tipo", msg: errTipo },
            errAncho && { campo: "Ancho", msg: errAncho },
            errAltura && { campo: "Altura/Serie", msg: errAltura },
            errRin && { campo: "Rin", msg: errRin },
            errDiseño && { campo: "Diseño", msg: errDiseño },
            errLona && { campo: "Lona/Robustez", msg: errLona },
            errCarga && { campo: "Carga", msg: errCarga },
            errVelocidad && { campo: "Velocidad", msg: errVelocidad },
        ].filter(Boolean);
        if (conError.length > 0) {
            setTouchedFields(new Set(["tipo", "ancho", "altura", "rin", "diseño", "lona", "carga", "velocidad"]));
            const texto = conError.map((e) => `${e.campo}: ${e.msg}`).join(" — ");
            toast.error("Campos con error: " + texto);
            return;
        }
        const descripcionConVariables = buildDescripcionConVariables(
            tipo?.value,
            ancho,
            tipo?.value === "Decimal" ? null : altura,
            rin,
            diseño,
            lona,
            carga,
            velocidad?.value ?? velocidad
        );
        const item = {
            id: `i-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            tipo: tipo?.value,
            ancho,
            altura: tipo?.value === "Decimal" ? null : altura,
            rin,
            diseño,
            lona,
            carga,
            velocidad: velocidad?.value ?? velocidad,
            descripcionConVariables,
        };
        setGroups((prev) =>
            prev.map((g) => (g.id === currentGroupId ? { ...g, items: [...g.items, item] } : g))
        );
        limpiarFormulario();
        setMostrarFormularioNuevoItem(false);
        toast.success("Item agregado");
    }, [currentGroup, currentGroupId, errores, tipo, ancho, altura, rin, diseño, lona, carga, velocidad, limpiarFormulario]);

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
    const mostrarFormulario = tieneLineaYEmpresa && currentGroup?.linea === "LLANTAS";

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
                                    onChange={setLinea}
                                    minWidth="200px"
                                />
                            </div>
                            <div style={{ minWidth: 200 }}>
                                <SelectUI
                                    label="Empresa"
                                    placeholder="Seleccionar empresa"
                                    options={EMPRESAS_PLACEHOLDER}
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
                                        padding: 16,
                                        borderRadius: 8,
                                        border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.25 })}`,
                                        backgroundColor: hexToRGBA({ hex: theme?.colors?.primary, alpha: 0.06 }),
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
                                                    Nuevo ítem (LLANTAS)
                                                </TextUI>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <SelectUI
                                                            label="Tipo"
                                                            placeholder="Tipo"
                                                            options={TIPOS_LLANTAS}
                                                            value={tipo}
                                                            onChange={(v) => { setTipo(v); setAncho(""); setAltura(""); marcarTocado("tipo"); }}
                                                            minWidth="100%"
                                                        />
                                                        {touchedFields.has("tipo") && errores.tipo && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.tipo}</TextUI>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <InputUI
                                                            label="Ancho"
                                                            placeholder={tipo?.value === "Americana" ? "8-13" : tipo?.value === "Milimetrica" ? "55-385" : "2.5-14"}
                                                            value={ancho}
                                                            onChange={(v) => { setAncho(v); marcarTocado("ancho"); }}
                                                        />
                                                        {touchedFields.has("ancho") && errores.ancho && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.ancho}</TextUI>
                                                        )}
                                                    </div>
                                                    {tipo?.value !== "Decimal" && (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                            <InputUI
                                                                label="Altura/Serie"
                                                                placeholder={tipo?.value === "Americana" ? "18-38" : "35-100"}
                                                                value={altura}
                                                                onChange={(v) => { setAltura(v); marcarTocado("altura"); }}
                                                            />
                                                            {touchedFields.has("altura") && errores.altura && (
                                                                <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.altura}</TextUI>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <InputUI label="Rin (10-24.5)" placeholder="10 a 24.5" value={rin} onChange={(v) => { setRin(v); marcarTocado("rin"); }} />
                                                        {touchedFields.has("rin") && errores.rin && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.rin}</TextUI>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <InputUI label="Diseño" placeholder="Alfanumérico" value={diseño} onChange={(v) => { setDiseño(v); marcarTocado("diseño"); }} />
                                                        {touchedFields.has("diseño") && errores.diseño && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.diseño}</TextUI>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <InputUI label="Lona/Robustez (6-24)" placeholder="6 a 24" value={lona} onChange={(v) => { setLona(v); marcarTocado("lona"); }} />
                                                        {touchedFields.has("lona") && errores.lona && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.lona}</TextUI>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <InputUI label="Carga (X o X/X)" placeholder="Ej: 8 o 12/14" value={carga} onChange={(v) => { setCarga(v); marcarTocado("carga"); }} />
                                                        {touchedFields.has("carga") && errores.carga && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.carga}</TextUI>
                                                        )}
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                        <SelectUI
                                                            label="Velocidad"
                                                            placeholder="Letra"
                                                            options={VELOCIDADES}
                                                            value={velocidad}
                                                            onChange={(v) => { setVelocidad(v); marcarTocado("velocidad"); }}
                                                            minWidth="100%"
                                                        />
                                                        {touchedFields.has("velocidad") && errores.velocidad && (
                                                            <TextUI size="11px" style={{ color: theme?.colors?.error || "#dc3545" }}>{errores.velocidad}</TextUI>
                                                        )}
                                                    </div>
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
