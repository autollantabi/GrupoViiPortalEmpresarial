import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "context/ThemeContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { TextUI } from "components/UI/Components/TextUI";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";
import {
    appShellService_obtenerUsuariosPortalMayorista,
    appShellService_habilitarSeccionUsuario,
    appShellService_quitarPermisoSeccionUsuario,
} from "services/appShell_Service";

function normalizarLista(data) {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
}

/** Indica si el usuario tiene la sección habilitada (ACCESS_APP_SHELL) */
function tieneSeccionHabilitada(usuario) {
    const v = usuario?.ACCESS_APP_SHELL ?? usuario?.access_app_shell;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
    return false;
}

function formatFecha(val) {
    if (val == null) return null;
    try {
        const d = typeof val === "string" ? new Date(val) : val;
        return Number.isNaN(d.getTime()) ? null : d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    } catch {
        return null;
    }
}

export default function AS_HabShellForm() {
    const { theme } = useTheme();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [habilitandoId, setHabilitandoId] = useState(null);
    const [quitandoPermisoId, setQuitandoPermisoId] = useState(null);
    const [filtroBusqueda, setFiltroBusqueda] = useState("");

    const usuariosFiltrados = useMemo(() => {
        const list = Array.isArray(usuarios) ? usuarios : [];
        const busqueda = (filtroBusqueda || "").trim().toLowerCase();
        const filtrados = busqueda
            ? list.filter((u) => {
                const nombre = (u.NAME_USER ?? u.name_user ?? "").toLowerCase();
                const email = (u.EMAIL ?? u.email ?? "").toLowerCase();
                return nombre.includes(busqueda) || email.includes(busqueda);
            })
            : [...list];
        return filtrados.sort((a, b) => {
            const dateA = a.createdAt ?? a.created_at ?? "";
            const dateB = b.createdAt ?? b.created_at ?? "";
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
    }, [usuarios, filtroBusqueda]);

    const cargarUsuarios = async () => {
        setCargando(true);
        const res = await appShellService_obtenerUsuariosPortalMayorista();
        if (res.success) {
            setUsuarios(normalizarLista(res.data));
        } else {
            toast.error(res.message || "Error al obtener los usuarios");
            setUsuarios([]);
        }
        setCargando(false);
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const handleHabilitarSeccion = async (usuario) => {
        const email = usuario.EMAIL ?? usuario.email ?? "";
        const nombre = usuario.NAME_USER ?? usuario.name_user ?? "este usuario";
        if (!email) {
            toast.error("El usuario no tiene correo asociado");
            return;
        }
        const confirmado = window.confirm(`¿Está seguro que desea habilitar esta sección al usuario ${nombre}?`);
        if (!confirmado) return;

        setHabilitandoId(email);
        const res = await appShellService_habilitarSeccionUsuario(email);
        setHabilitandoId(null);

        if (res.success) {
            toast.success(res.message || "Sección habilitada");
            await cargarUsuarios();
        } else {
            toast.error(res.message || "Error al habilitar la sección");
        }
    };

    const handleQuitarPermiso = async (usuario) => {
        const email = usuario.EMAIL ?? usuario.email ?? "";
        const nombre = usuario.NAME_USER ?? usuario.name_user ?? "este usuario";
        if (!email) {
            toast.error("El usuario no tiene correo asociado");
            return;
        }
        const confirmado = window.confirm(`¿Está seguro que desea quitar el permiso de esta sección al usuario ${nombre}?`);
        if (!confirmado) return;

        setQuitandoPermisoId(email);
        const res = await appShellService_quitarPermisoSeccionUsuario(email);
        setQuitandoPermisoId(null);

        if (res.success) {
            toast.success(res.message || "Permiso quitado");
            await cargarUsuarios();
        } else {
            toast.error(res.message || "Error al quitar el permiso");
        }
    };

    return (
        <div style={{ padding: 20, gap: 16, overflow: "auto", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <TextUI size="20px" weight="600">
                    Habilitar formulario de registro de App Shell Maxx para mayoristas en ViiCommerce 
                </TextUI>
                <ButtonUI
                    iconLeft="FaArrowsRotate"
                    onClick={cargarUsuarios}
                    disabled={cargando}
                    pcolor={theme?.colors?.primary}
                    title="Actualizar lista"
                />
            </div>

            {!cargando && usuarios.length > 0 && (
                <InputUI
                    iconLeft="FaSistrix"
                    placeholder="Buscar por nombre o correo..."
                    value={filtroBusqueda}
                    onChange={setFiltroBusqueda}
                />
            )}

            {cargando ? (
                <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
                    Cargando usuarios...
                </div>
            ) : usuarios.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
                    No hay usuarios registrados.
                </div>
            ) : usuariosFiltrados.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: theme?.colors?.textSecondary, fontSize: 14 }}>
                    No hay usuarios que coincidan con la búsqueda.
                </div>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {usuariosFiltrados.map((usuario, index) => {
                        const id = usuario.ID_USER ?? usuario.id_user ?? usuario.id;
                        const nombre = usuario.NAME_USER ?? usuario.name_user ?? "—";
                        const correo = usuario.EMAIL ?? usuario.email ?? "—";
                        const createdAt = formatFecha(usuario.createdAt ?? usuario.created_at);
                        const tieneSeccion = tieneSeccionHabilitada(usuario);
                        const estaHabilitando = habilitandoId === correo;
                        const estaQuitandoPermiso = quitandoPermisoId === correo;

                        return (
                            <li
                                key={id ?? index}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 12,
                                    padding: "14px 16px",
                                    borderRadius: 8,
                                    backgroundColor: hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: index % 2 === 0 ? 0.06 : 0.03 }),
                                    border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: 0.15 })}`,
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                                    <TextUI size="15px" weight="600" color={theme?.colors?.text}>
                                        {nombre}
                                    </TextUI>
                                    <TextUI size="13px" color={theme?.colors?.textSecondary}>
                                        {correo}
                                    </TextUI>
                                    {createdAt && (
                                        <TextUI size="12px" color={theme?.colors?.textSecondary}>
                                            Fecha de registro: {createdAt}
                                        </TextUI>
                                    )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    {tieneSeccion ? (
                                        <>
                                            <span
                                                style={{
                                                    padding: "6px 12px",
                                                    borderRadius: 6,
                                                    backgroundColor: hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: 0.12 }),
                                                    border: `1px solid ${hexToRGBA({ hex: theme?.colors?.primary ?? "#334155", alpha: 0.2 })}`,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    color: theme?.colors?.textSecondary,
                                                }}
                                            >
                                                Ya tiene sección habilitada
                                            </span>
                                            <ButtonUI
                                                text="Quitar permiso"
                                                variant="outlined"
                                                iconLeft="FaXmark"
                                                onClick={() => handleQuitarPermiso(usuario)}
                                                disabled={estaQuitandoPermiso}
                                                pcolor={theme?.colors?.error || "#dc3545"}
                                                style={{ fontSize: 12 }}
                                            />
                                        </>
                                    ) : (
                                        <ButtonUI
                                            text="Habilitar sección"
                                            iconLeft="FaCheck"
                                            onClick={() => handleHabilitarSeccion(usuario)}
                                            disabled={estaHabilitando}
                                            pcolor={theme?.colors?.primary}
                                            style={{ fontSize: 12 }}
                                        />
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
