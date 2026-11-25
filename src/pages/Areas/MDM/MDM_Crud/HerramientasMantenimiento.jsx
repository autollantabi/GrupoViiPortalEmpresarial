import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TextUI } from "components/UI/Components/TextUI";
import { toast } from "react-toastify";
import { getItemsByRole, patchItemsRole3Bulk, getGruposHerramientas } from "services/mdmService";
import {
    Tabla, TablaScroll, Th, Td, ANCHO_COL_SELECCION,
    construirCatalogoHerramientas, calcularNombreSistema, esNuevo,
} from "pages/Areas/MDM/MDM_Crud/Herramientas";

/* ------------------------------------------------------------------ */
/* Mantenimiento temporal de Herramientas (rol 3 - Supervisor/Técnico) */
/*                                                                    */
/* Muestra los ítems no aprobados de items_herramientas que están en  */
/* la fase 2 y permite completar Grupo, Subgrupo, Subgrupo 1, Tipo y  */
/* corregir el nombre. Guardar deja cada ítem como está en pantalla   */
/* con la misma lógica de la fase 2 (el nombre del sistema pasa a ser */
/* el nombre vigente), pero SIN avanzar de fase, SIN observaciones y  */
/* SIN notificaciones: solo mantiene los datos.                       */
/* ------------------------------------------------------------------ */

// Recursos desde los que se acepta el rol Técnico: el propio de esta pantalla y el de Herramientas.
const RECURSOS = ["mdm.herramientas", "mdm.herramientasmantenimiento"];
const ID_ROL_TECNICO = 3;
const ITEMS_POR_PAGINA = 50;
const LOTE_GUARDADO = 100;

const ESTILO_SELECT = { height: "30px", fontSize: "12px", minHeight: "30px", textTransform: "uppercase" };
const propsSelect = {
    minWidth: "140px",
    isCreatable: true,
    placeholder: "Seleccione o escriba",
    formatCreateLabel: (texto) => `Usar "${texto}"`,
    style: ESTILO_SELECT,
};

const valorSelect = (v) => (v ? { value: v, label: v } : null);
const mayus = (v) => (v?.value || "").toUpperCase();

/* Lo que se compara para saber si una fila cambió desde la última carga/guardado */
const firma = (it) => [it.nombreSistema, it.grupo, it.subgrupo, it.subgrupo1, it.tipo].map(x => x || "").join("\u0001");

const mapear = (it) => ({
    id: it.ID,
    codigoSap: it.CODIGO_SAP || "",
    codigoProveedor: it.CODIGO_PROVEEDOR || "",
    nombre: it.NOMBRE || "",
    nombreSistema: it.NOMBRE_SISTEMA || it.NOMBRE || "",
    grupo: it.GRUPO || "",
    subgrupo: it.SUBGRUPO || "",
    subgrupo1: it.SUBGRUPO1 || "",
    tipo: it.TIPO || "",
    marca: it.MARCA || "",
    isNew: it.ES_NUEVO !== undefined && it.ES_NUEVO !== null ? Boolean(it.ES_NUEVO) : undefined,
});

const Fila = React.memo(function FilaMantenimiento({ item, idx, catalogo, modificado, onCampo }) {
    const opcionesSubgrupo = useMemo(() => catalogo.subgrupos(item.grupo), [catalogo, item.grupo]);
    const opcionesSubgrupo1 = useMemo(() => catalogo.subgrupos1(item.grupo, item.subgrupo), [catalogo, item.grupo, item.subgrupo]);
    const opcionesTipo = useMemo(() => catalogo.tipos(item.grupo, item.subgrupo, item.subgrupo1), [catalogo, item.grupo, item.subgrupo, item.subgrupo1]);
    const fondo = modificado ? { backgroundColor: "rgba(255, 193, 7, 0.14)" } : undefined;

    return (
        <tr style={fondo}>
            <Td $densa $align="center" $fija="left" $w={ANCHO_COL_SELECCION}>
                <TextUI size="11px">{idx + 1}</TextUI>
            </Td>
            <Td><TextUI size="13px">{item.codigoSap || "-"}</TextUI></Td>
            <Td><TextUI size="13px">{item.codigoProveedor || "-"}</TextUI></Td>
            <Td><TextUI size="13px">{item.nombre || "-"}</TextUI></Td>
            <Td>
                <InputUI
                    value={item.nombreSistema || ""}
                    onChange={(v) => onCampo(item.id, { nombreSistema: v.toUpperCase() })}
                    onBlur={() => {
                        // Se conserva lo escrito pero se corrige el prefijo: [NEW ] + abreviatura de la marca
                        const corregido = calcularNombreSistema(item.nombreSistema || item.nombre, esNuevo(item), item.marca);
                        if (corregido && corregido !== item.nombreSistema) onCampo(item.id, { nombreSistema: corregido });
                    }}
                    placeholder="Nombre para SAP..."
                />
            </Td>
            <Td>
                <SelectUI
                    options={catalogo.grupos}
                    value={valorSelect(item.grupo)}
                    onChange={(v) => onCampo(item.id, { grupo: mayus(v), subgrupo: "", subgrupo1: "", tipo: "" })}
                    {...propsSelect}
                />
            </Td>
            <Td>
                <SelectUI
                    options={opcionesSubgrupo}
                    value={valorSelect(item.subgrupo)}
                    onChange={(v) => onCampo(item.id, { subgrupo: mayus(v), subgrupo1: "", tipo: "" })}
                    {...propsSelect}
                />
            </Td>
            <Td>
                <SelectUI
                    options={opcionesSubgrupo1}
                    value={valorSelect(item.subgrupo1)}
                    onChange={(v) => onCampo(item.id, { subgrupo1: mayus(v), tipo: "" })}
                    {...propsSelect}
                />
            </Td>
            <Td>
                <SelectUI
                    options={opcionesTipo}
                    value={valorSelect(item.tipo)}
                    onChange={(v) => onCampo(item.id, { tipo: mayus(v) })}
                    {...propsSelect}
                />
            </Td>
        </tr>
    );
});

function HerramientasMantenimiento() {
    const { theme } = useTheme();
    const { user } = useAuthContext();

    const esTecnico = Array.isArray(user?.CONTEXTOS) &&
        user.CONTEXTOS.some(ctx => RECURSOS.includes(String(ctx.RECURSO || "").toLowerCase()) && ctx.ID_ROL === ID_ROL_TECNICO);

    const [items, setItems] = useState([]);
    const [gruposRaw, setGruposRaw] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [pagina, setPagina] = useState(1);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    // id -> firma de la fila tal como está en la BD (última carga o último guardado correcto)
    const base = useRef(new Map());
    const [, forzar] = useState(0);

    const catalogo = useMemo(() => construirCatalogoHerramientas(gruposRaw), [gruposRaw]);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const raw = await getItemsByRole(ID_ROL_TECNICO, "HERRAMIENTAS");
            const enFase2 = (raw || [])
                .filter(it => !it.APROBADO_MDM && Number(it.FASE_ACTUAL) === 2)
                .map(mapear);
            base.current = new Map(enFase2.map(it => [it.id, firma(it)]));
            setItems(enFase2);
        } catch (error) {
            console.error("Error al cargar ítems de mantenimiento:", error);
            toast.error("Error al cargar los ítems.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (!esTecnico) return;
        cargar();
        getGruposHerramientas().then(setGruposRaw).catch(() => setGruposRaw([]));
    }, [esTecnico, cargar]);

    const cambiarCampo = useCallback((id, campos) => {
        setItems(prev => prev.map(it => (it.id === id ? { ...it, ...campos } : it)));
    }, []);

    const modificados = useMemo(
        () => items.filter(it => base.current.get(it.id) !== firma(it)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [items]
    );
    const idsModificados = useMemo(() => new Set(modificados.map(it => it.id)), [modificados]);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return items;
        return items.filter(it =>
            [it.codigoSap, it.codigoProveedor, it.nombre, it.nombreSistema, it.grupo, it.subgrupo, it.subgrupo1, it.tipo]
                .some(x => (x || "").toLowerCase().includes(q)));
    }, [items, busqueda]);

    useEffect(() => { setPagina(1); }, [busqueda]);
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITEMS_POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const visibles = filtrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA);
    const offset = (paginaActual - 1) * ITEMS_POR_PAGINA;

    const guardar = async () => {
        if (modificados.length === 0) {
            toast.info("No hay cambios por guardar.");
            return;
        }
        setGuardando(true);
        try {
            const payloads = modificados.map(it => ({
                ID: it.id,
                LINEA_NEGOCIO: "HERRAMIENTAS",
                GRUPO: (it.grupo || "").toUpperCase(),
                SUBGRUPO: (it.subgrupo || "").toUpperCase(),
                SUBGRUPO1: (it.subgrupo1 || "").toUpperCase(),
                TIPO: (it.tipo || "").toUpperCase(),
                NOMBRE_SISTEMA: calcularNombreSistema(it.nombreSistema || it.nombre || "", esNuevo(it), it.marca),
                // FASE 2 hace que el nombre del sistema pase a ser el nombre vigente. Sin OBSERVACIONES ni
                // RECHAZO el backend no crea fases ni notifica a nadie.
                FASE: 2,
            }));
            let errores = [];
            for (let i = 0; i < payloads.length; i += LOTE_GUARDADO) {
                const resp = await patchItemsRole3Bulk(payloads.slice(i, i + LOTE_GUARDADO));
                errores = errores.concat(resp?.errors || []);
            }
            const idsError = new Set(errores.map(e => Number(e.id)));
            payloads.forEach(p => {
                if (!idsError.has(Number(p.ID))) {
                    const it = items.find(x => x.id === p.ID);
                    if (it) base.current.set(p.ID, firma(it));
                }
            });
            forzar(n => n + 1);
            setItems(prev => [...prev]);
            if (errores.length) toast.error(`${errores.length} ítem(s) no se pudieron guardar. Revise e intente de nuevo.`);
            else toast.success(`${payloads.length} ítem(s) guardado(s).`);
        } catch (error) {
            console.error("Error al guardar mantenimiento:", error);
            toast.error("Error al guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    };

    const recargar = async () => {
        if (modificados.length > 0 &&
            !window.confirm(`Hay ${modificados.length} ítem(s) con cambios sin guardar que se perderán. ¿Recargar de todas formas?`)) {
            return;
        }
        await cargar();
    };

    if (!esTecnico) {
        return (
            <div style={{ padding: "24px" }}>
                <TextUI>Esta pantalla es solo para el rol Técnico (Supervisor) de Herramientas.</TextUI>
            </div>
        );
    }

    const colorBorde = theme?.colors?.border || "#eee";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", borderBottom: `1px solid ${colorBorde}` }}>
                <div style={{ flex: "1 1 260px" }}>
                    <TextUI weight="700">Mantenimiento de Herramientas (Técnico)</TextUI>
                    <TextUI size="12px" color={theme?.colors?.textSecondary}>
                        {items.length} ítem(s) en fase 2 · {modificados.length} con cambios sin guardar
                    </TextUI>
                </div>
                <div style={{ flex: "0 1 280px" }}>
                    <InputUI value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, nombre, grupo..." />
                </div>
                <ButtonUI text="Recargar" iconLeft="FaRotateRight" variant="outlined" isAsync disabled={cargando || guardando} onClick={recargar} />
                <ButtonUI
                    text={guardando ? "Guardando..." : `Guardar${modificados.length ? ` (${modificados.length})` : ""}`}
                    iconLeft="FaFloppyDisk"
                    pcolor={theme?.colors?.primary}
                    disabled={guardando || cargando || modificados.length === 0}
                    onClick={guardar}
                />
            </div>

            <TablaScroll>
                <Tabla>
                    <thead>
                        <tr>
                            <Th $fija="left" $w={ANCHO_COL_SELECCION} $align="center">#</Th>
                            <Th $min="110px">Código SAP</Th>
                            <Th $min="150px">Codigo Proveedor</Th>
                            <Th $min="220px">Nombre</Th>
                            <Th $min="280px">Nombre Del Sistema</Th>
                            <Th $min="150px">Grupo</Th>
                            <Th $min="150px">Subgrupo</Th>
                            <Th $min="150px">Subgrupo 1</Th>
                            <Th $min="150px">Tipo</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibles.length === 0 ? (
                            <tr>
                                <Td colSpan={99} style={{ padding: "40px", textAlign: "center" }}>
                                    {cargando ? "Cargando..." : "No hay ítems para mostrar."}
                                </Td>
                            </tr>
                        ) : visibles.map((item, i) => (
                            <Fila
                                key={item.id}
                                item={item}
                                idx={offset + i}
                                catalogo={catalogo}
                                modificado={idsModificados.has(item.id)}
                                onCampo={cambiarCampo}
                            />
                        ))}
                    </tbody>
                </Tabla>
            </TablaScroll>

            <div style={{ padding: "8px 16px", borderTop: `1px solid ${colorBorde}`, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
                <ButtonUI text="Anterior" variant="outlined" disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)} />
                <TextUI size="12px">Página {paginaActual} de {totalPaginas} · {filtrados.length} ítem(s)</TextUI>
                <ButtonUI text="Siguiente" variant="outlined" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)} />
            </div>
        </div>
    );
}

export default HerramientasMantenimiento;
