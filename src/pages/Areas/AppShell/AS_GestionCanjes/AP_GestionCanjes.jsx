import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { ContenedorFlex } from "components/UI/Components/ContenedorFlex";
import { CardUI } from "components/UI/Components/CardUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { ModalConfirmacionUI } from "components/UI/Components/ModalConfirmacionUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TooltipUI } from "components/UI/Components/TooltipUI";
import { hexToRGBA } from "utils/colors";
import styled from "styled-components";
import {
    appShellService_obtenerEstadosCanjes,
    appShellService_obtenerCanjesConEstados,
    appShellService_actualizarEstadoCanje,
} from "services/appShell_Service";

// Flujo de estados del canje (el orden define la secuencia)
const ESTADOS_CANJE = [
    "Solicitado",
    "En revisión",
    "Aprobado",
    "En preparación",
    "Entregado",
];
const ESTADO_FINAL_ALTERNATIVO = "Rechazado";

// Datos ficticios para pruebas (quitar o reemplazar cuando se conecte la API)
const CANJES_FICTICIOS = [
    {
        id: 1,
        nombreCanje: "GiftCard KFC",
        codigoCliente: "SOC001",
        nombreCliente: "Distribuidora Norte S.A.S",
        historialEstados: [
            { estado: "Solicitado", fecha: "2025-01-20T09:00:00.000Z", comentario: null },
            { estado: "En revisión", fecha: "2025-01-21T14:30:00.000Z", comentario: null },
        ],
    },
    {
        id: 2,
        nombreCanje: "Vale Pizza Hut",
        codigoCliente: "SOC042",
        nombreCliente: "Comercial del Pacífico",
        historialEstados: [
            { estado: "Solicitado", fecha: "2025-01-22T10:15:00.000Z", comentario: null },
        ],
    },
    {
        id: 3,
        nombreCanje: "GiftCard KFC",
        codigoCliente: "SOC108",
        nombreCliente: "Almacén Central Ltda",
        historialEstados: [
            { estado: "Solicitado", fecha: "2025-01-18T08:00:00.000Z", comentario: null },
            { estado: "En revisión", fecha: "2025-01-19T11:00:00.000Z", comentario: null },
            { estado: "Aprobado", fecha: "2025-01-23T16:00:00.000Z", comentario: "Documentación OK" },
            { estado: "En preparación", fecha: "2025-01-24T09:30:00.000Z", comentario: null },
        ],
    },
    {
        id: 4,
        nombreCanje: "Bono Cinépolis",
        codigoCliente: "SOC205",
        nombreCliente: "Puntos de Venta Sur",
        historialEstados: [
            { estado: "Solicitado", fecha: "2025-01-25T07:45:00.000Z", comentario: null },
            { estado: "En revisión", fecha: "2025-01-25T12:00:00.000Z", comentario: null },
            { estado: "Aprobado", fecha: "2025-01-26T10:00:00.000Z", comentario: null },
            { estado: "En preparación", fecha: "2025-01-26T14:00:00.000Z", comentario: null },
            { estado: "Entregado", fecha: "2025-01-27T09:00:00.000Z", comentario: null },
        ],
    },
];

function mapCanjeApiToComponent(apiCanje) {
    const usuario = apiCanje.USUARIO ?? apiCanje.usuario;
    const producto = apiCanje.PRODUCTO ?? apiCanje.producto;
    const historialApi = apiCanje.HISTORIAL_ESTADOS ?? apiCanje.historial_estados ?? [];
    const nombreCliente = usuario
        ? [usuario.NAME ?? usuario.name, usuario.LASTNAME ?? usuario.lastname].filter(Boolean).join(" ")
        : null;
    return {
        id: apiCanje.ID ?? apiCanje.id,
        nombreCanje: producto?.NAME ?? producto?.name ?? "Canje",
        codigoCliente: usuario?.CARD_ID ?? usuario?.card_id ?? null,
        nombreCliente,
        fechaOrigen: apiCanje.REDEMPTION_DATE ?? apiCanje.redemption_date ?? null,
        historialEstados: historialApi.map((h) => ({
            estado: (h.ESTADO_CANJE ?? h.estado_canje)?.NAME ?? (h.ESTADO_CANJE ?? h.estado_canje)?.name ?? "",
            fecha: h.REGISTERED_AT ?? h.registered_at ?? h.createdAt ?? h.created_at,
            comentario: h.COMMENTS ?? h.comments ?? null,
        })),
    };
}

function getEstadoActual(canje) {
    const historial = canje?.historialEstados || [];
    if (historial.length === 0) return null;
    return historial[historial.length - 1].estado;
}

function getNombreCanje(canje) {
    return canje?.nombreCanje ?? canje?.tipoCanje ?? canje?.producto ?? "Canje";
}

function getFechaOrigen(canje) {
    if (canje?.fechaOrigen) return canje.fechaOrigen;
    const historial = canje?.historialEstados || [];
    return historial.length > 0 ? historial[0].fecha : null;
}

function getSiguienteEstado(estadoActual, listaNombresEstados = ESTADOS_CANJE) {
    if (!listaNombresEstados?.length) return estadoActual ? null : ESTADOS_CANJE[0] || null;
    if (!estadoActual) return listaNombresEstados[0] || null;
    const idx = listaNombresEstados.indexOf(estadoActual);
    if (idx === -1 || idx >= listaNombresEstados.length - 1) return null;
    return listaNombresEstados[idx + 1];
}

function formatearFecha(fecha) {
    if (!fecha) return "—";
    const d = typeof fecha === "string" ? new Date(fecha) : fecha;
    return isNaN(d.getTime())
        ? String(fecha)
        : d.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
}

// Historial horizontal: lista de estados con flechas entre ellos
const HistorialLista = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 0;
`;

const HistorialFlecha = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#94a3b8"};
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`;

const HistorialItem = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  min-width: 80px;
  background-color: ${({ $colorBg }) => $colorBg || "#f1f5f9"};
  border: 1px solid
    ${({ $colorText }) => hexToRGBA({ hex: $colorText || "#475569", alpha: 0.3 })};
  font-size: 12px;
  color: ${({ $colorText }) => $colorText || "#475569"};
  font-weight: 600;
  text-align: center;
`;

// Chip cliente: estilo suave, pill, aspecto "persona" (gris/neutro)
const ChipCliente = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ theme }) =>
        theme?.colors?.backgroundLight || "#f1f5f9"};
  color: ${({ theme }) => theme?.colors?.textSecondary || "#64748b"};
  border: 1px dashed
    ${({ theme }) =>
        hexToRGBA({ hex: theme?.colors?.text || "#334155", alpha: 0.25 })};
  letter-spacing: 0.01em;
`;

// Colores por estado (nombre normalizado a minúsculas)
const COLORS_ESTADO = {
    solicitado: { bg: "#dbeafe", text: "#1d4ed8" },
    "en revisión": { bg: "#fef3c7", text: "#b45309" },
    "en revision": { bg: "#fef3c7", text: "#b45309" },
    aprobado: { bg: "#d1fae5", text: "#047857" },
    "en preparación": { bg: "#e9d5ff", text: "#6b21a8" },
    "en preparacion": { bg: "#e9d5ff", text: "#6b21a8" },
    entregado: { bg: "#ccfbf1", text: "#0f766e" },
    rechazado: { bg: "#fee2e2", text: "#b91c1c" },
    "estado 1": { bg: "#dbeafe", text: "#1d4ed8" },
    "estado 2": { bg: "#fef3c7", text: "#b45309" },
    "estado 3": { bg: "#d1fae5", text: "#047857" },
    "estado 4": { bg: "#e9d5ff", text: "#6b21a8" },
    "estado 5": { bg: "#ccfbf1", text: "#0f766e" },
};
const DEFAULT_COLOR_ESTADO = { bg: "#f1f5f9", text: "#475569" };

function getColorEstado(nombreEstado) {
    if (!nombreEstado) return DEFAULT_COLOR_ESTADO;
    const key = String(nombreEstado).toLowerCase().trim();
    return COLORS_ESTADO[key] ?? DEFAULT_COLOR_ESTADO;
}

// Badge estado: colores por estado, más sólido y llamativo
const BadgeEstado = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  background-color: ${({ $colorBg }) => $colorBg || "#f1f5f9"};
  color: ${({ $colorText }) => $colorText || "#475569"};
  border: 1px solid
    ${({ $colorText }) => hexToRGBA({ hex: $colorText || "#475569", alpha: 0.35 })};
  transition: filter 0.2s ease, transform 0.1s ease;
  &:hover {
    filter: ${({ $clickable }) => ($clickable ? "brightness(0.92)" : "none")};
    ${({ $clickable }) => $clickable && "transform: scale(1.02);"}
  }
`;

const FiltrosBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: flex-end;
  gap: 16px;
`;

const ResultadosInfo = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#666"};
  display: flex;
  align-items: center;
  gap: 4px;
`;

/**
 * Gestión de canjes de clientes.
 * Recibe una lista de canjes; cada canje tiene historialEstados.
 * Lista desplegable (acordeón) por canje; al hacer clic en el estado actual se puede pasar al siguiente, con diálogo de confirmación.
 *
 * @param {object} props
 * @param {object} props.routeConfig - Config de la ruta (recurso, etc.)
 * @param {Array} props.availableCompanies - Empresas disponibles (opcional, como en DesbloqueoClientes)
 * @param {Array} props.availableLines - Líneas disponibles (opcional)
 * @param {Array} props.canjes - Lista de canjes. Cada item: { id, codigoCliente?, nombreCliente?, historialEstados: [{ estado, fecha, comentario? }] }
 * @param {Function} props.onCambiarEstado - (canjeId, nuevoEstado) => Promise|void. Opcional; si no se pasa, se actualiza solo en estado local.
 */
export default function AP_GestionCanjes({
    routeConfig,
    availableCompanies,
    availableLines,
    canjes: canjesProp = [],
    onCambiarEstado,
}) {
    const { theme } = useTheme();
    const [canjes, setCanjes] = useState(() => {
        if (Array.isArray(canjesProp) && canjesProp.length > 0) {
            return canjesProp.map((c) => ({ ...c }));
        }
        return [];
    });
    const [modalConfirmacion, setModalConfirmacion] = useState({
        open: false,
        canjeId: null,
        siguienteEstado: null,
    });
    const [filtroCliente, setFiltroCliente] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [estadosCanjes, setEstadosCanjes] = useState([]);
    const [loadingCanjes, setLoadingCanjes] = useState(true);

    useEffect(() => {
        appShellService_obtenerEstadosCanjes().then((res) => {
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                setEstadosCanjes(res.data);
            }
        });
    }, []);

    useEffect(() => {
        if (Array.isArray(canjesProp) && canjesProp.length > 0) return;
        setLoadingCanjes(true);
        appShellService_obtenerCanjesConEstados()
            .then((res) => {
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    const mapeados = res.data.map(mapCanjeApiToComponent);
                    setCanjes(mapeados);
                }
            })
            .finally(() => setLoadingCanjes(false));
    }, []);

    const nombresEstados = useMemo(() => {
        if (estadosCanjes.length > 0) {
            return estadosCanjes.map((e) => e.NAME ?? e.name ?? String(e.ID ?? e.id ?? ""));
        }
        return ESTADOS_CANJE;
    }, [estadosCanjes]);

    // Sincronizar con prop solo cuando la lista de ids cambie (evita bucle si canjesProp es [] por defecto)
    const prevIdsRef = React.useRef(
        Array.isArray(canjesProp) && canjesProp.length > 0
            ? canjesProp.map((c) => c.id).join(",")
            : ""
    );
    React.useEffect(() => {
        if (!Array.isArray(canjesProp) || canjesProp.length === 0) return;
        const ids = canjesProp.map((c) => c.id).join(",");
        if (ids === prevIdsRef.current) return;
        prevIdsRef.current = ids;
        setCanjes(canjesProp.map((c) => ({ ...c })));
    }, [canjesProp]);

    const abrirConfirmacion = useCallback((canjeId, siguienteEstado) => {
        setModalConfirmacion({ open: true, canjeId, siguienteEstado });
    }, []);

    const cerrarConfirmacion = useCallback(() => {
        setModalConfirmacion({ open: false, canjeId: null, siguienteEstado: null });
    }, []);

    const confirmarCambioEstado = useCallback(async () => {
        const { canjeId, siguienteEstado } = modalConfirmacion;
        if (!canjeId || !siguienteEstado) {
            cerrarConfirmacion();
            return;
        }

        // Buscar el ID del estado por su nombre
        const estadoObj = estadosCanjes.find(
            (e) => (e.NAME ?? e.name) === siguienteEstado
        );
        const estadoId = estadoObj ? (estadoObj.ID ?? estadoObj.id) : null;

        if (!estadoId) {
            console.error("No se encontró el ID del estado:", siguienteEstado);
            cerrarConfirmacion();
            return;
        }

        // Llamar al servicio para actualizar el estado
        const resultado = await appShellService_actualizarEstadoCanje(canjeId, estadoId);

        if (!resultado.success) {
            console.error("Error al actualizar estado:", resultado.message);
            // Aquí podrías mostrar un toast/notificación de error
            cerrarConfirmacion();
            return;
        }

        // Si hay callback personalizado, ejecutarlo
        if (typeof onCambiarEstado === "function") {
            try {
                await onCambiarEstado(canjeId, siguienteEstado);
            } catch (e) {
                console.error("Error en callback onCambiarEstado:", e);
            }
        }

        // Actualizar el estado local con la nueva entrada en el historial
        const entrada = {
            estado: siguienteEstado,
            fecha: new Date().toISOString(),
            comentario: null,
        };

        setCanjes((prev) =>
            prev.map((c) => {
                if (c.id !== canjeId) return c;
                const historial = [...(c.historialEstados || []), entrada];
                return { ...c, historialEstados: historial };
            })
        );
        cerrarConfirmacion();
    }, [modalConfirmacion, estadosCanjes, onCambiarEstado, cerrarConfirmacion]);

    const canjePorId = useMemo(
        () => canjes.find((c) => c.id === modalConfirmacion.canjeId) || null,
        [canjes, modalConfirmacion.canjeId]
    );

    const labelCliente = (canje) => {
        const nombre = canje.nombreCliente ?? canje.nombre_cliente ?? canje.cliente;
        const codigo = canje.codigoCliente ?? canje.codigo_cliente;
        if (nombre) return nombre;
        if (codigo) return `Cliente ${codigo}`;
        return `Canje ${canje.id}`;
    };

    // Opciones para filtros: clientes (único por id) y estados
    const opcionesClientes = useMemo(() => {
        const seen = new Set();
        const list = [];
        canjes.forEach((c) => {
            const key = c.id;
            if (seen.has(key)) return;
            seen.add(key);
            list.push({
                value: key,
                label: labelCliente(c),
            });
        });
        list.sort((a, b) => String(a.label).localeCompare(b.label));
        return [{ value: "", label: "Todos los clientes" }, ...list];
    }, [canjes]);

    const opcionesEstado = useMemo(
        () => [
            { value: "", label: "Todos los estados" },
            ...nombresEstados.map((name) => ({ value: name, label: name })),
        ],
        [nombresEstados]
    );

    const canjesFiltrados = useMemo(() => {
        return canjes.filter((c) => {
            const estadoActual = getEstadoActual(c);
            if (filtroCliente?.value && c.id !== filtroCliente.value) return false;
            if (filtroEstado?.value && estadoActual !== filtroEstado.value) return false;
            return true;
        });
    }, [canjes, filtroCliente, filtroEstado]);

    const hayFiltrosActivos = !!(filtroCliente?.value || filtroEstado?.value);
    const limpiarFiltros = useCallback(() => {
        setFiltroCliente(null);
        setFiltroEstado(null);
    }, []);

    return (
        <ContainerUI
            width="100%"
            height="100%"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            style={{ padding: 16, gap: 20, overflow: "auto" }}
        >
            <ContenedorFlex
                style={{
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <TextUI size="20px" weight="600">
                    Gestión de canjes
                </TextUI>
            </ContenedorFlex>

            {loadingCanjes ? (
                <TextUI color={theme?.colors?.textSecondary} size="14px">
                    Cargando canjes...
                </TextUI>
            ) : canjes.length === 0 ? (
                <TextUI color={theme?.colors?.textSecondary} size="14px">
                    No hay canjes para mostrar.
                </TextUI>
            ) : (
                <>
                    <FiltrosBar theme={theme}>
                        <ContenedorFlex style={{ flexDirection: "column", gap: 4, minWidth: 220 }}>

                            <SelectUI
                                options={opcionesClientes}
                                value={filtroCliente ?? opcionesClientes[0]}
                                onChange={(opt) => setFiltroCliente(opt?.value === "" ? null : opt)}
                                placeholder="Todos los clientes"
                                label="Clientes"
                                minWidth="220px"
                                maxWidth="280px"
                            />
                        </ContenedorFlex>
                        <ContenedorFlex style={{ flexDirection: "column", gap: 4, minWidth: 200 }}>

                            <SelectUI
                                options={opcionesEstado}
                                value={filtroEstado ?? opcionesEstado[0]}
                                onChange={(opt) => setFiltroEstado(opt?.value === "" ? null : opt)}
                                placeholder="Todos los estados"
                                label="Estados"
                                minWidth="200px"
                                maxWidth="240px"
                            />
                        </ContenedorFlex>
                        {hayFiltrosActivos && (
                            <ButtonUI
                                text="Limpiar filtros"
                                variant="outlined"

                                onClick={limpiarFiltros}
                                style={{ alignSelf: "flex-end" }}
                            />
                        )}
                        <ResultadosInfo theme={theme} style={{ marginLeft: "auto", alignSelf: "center" }}>
                            Mostrando {canjesFiltrados.length} de {canjes.length} canjes
                        </ResultadosInfo>
                    </FiltrosBar>

                    {canjesFiltrados.length === 0 ? (
                        <TextUI color={theme?.colors?.textSecondary} size="14px">
                            No hay canjes que coincidan con los filtros seleccionados.
                        </TextUI>
                    ) : (
                        <ContenedorFlex
                            style={{
                                width: "100%",
                                flexDirection: "column",
                                gap: 12,
                                alignItems: "stretch",
                            }}
                        >
                            {canjesFiltrados.map((canje) => {
                                const estadoActual = getEstadoActual(canje);
                                const siguienteEstado = getSiguienteEstado(estadoActual, nombresEstados);
                                const historial = canje.historialEstados || [];
                                const nombreCanje = getNombreCanje(canje);
                                const fechaOrigen = getFechaOrigen(canje);
                                const nombreCliente = labelCliente(canje);
                                const titulo = nombreCanje;
                                const descripcion = fechaOrigen
                                    ? `Fecha de solicitud: ${formatearFecha(fechaOrigen)}`
                                    : "";

                                const body = (
                                    <div key={canje.id}>
                                        <TextUI size="14px" weight="600" style={{ marginBottom: 8 }}>
                                            Historial de estados
                                        </TextUI>
                                        {historial.length === 0 ? (
                                            <TextUI size="13px" color={theme?.colors?.textSecondary}>
                                                Aún no hay movimientos.
                                            </TextUI>
                                        ) : (
                                            <HistorialLista theme={theme}>
                                                {historial.map((h, i) => {
                                                    const colores = getColorEstado(h.estado);
                                                    return (
                                                        <React.Fragment key={i}>
                                                            {i > 0 && (
                                                                <HistorialFlecha theme={theme} aria-hidden="true">
                                                                    →
                                                                </HistorialFlecha>
                                                            )}
                                                            <HistorialItem
                                                                theme={theme}
                                                                $colorBg={colores.bg}
                                                                $colorText={colores.text}
                                                                title={h.comentario ? `${formatearFecha(h.fecha)} — ${h.comentario}` : formatearFecha(h.fecha)}
                                                            >
                                                                <span style={{ whiteSpace: "nowrap" }}>{h.estado}</span>
                                                                <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>
                                                                    {formatearFecha(h.fecha)}
                                                                </span>
                                                                {h.comentario && (
                                                                    <span style={{ fontSize: 10, opacity: 0.85, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                        {h.comentario}
                                                                    </span>
                                                                )}
                                                            </HistorialItem>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </HistorialLista>
                                        )}
                                    </div>
                                );

                                const coloresEstado = getColorEstado(estadoActual);
                                const tooltipEstado = siguienteEstado
                                    ? `Clic para pasar a "${siguienteEstado}"`
                                    : (estadoActual ? "Estado actual" : "Sin estado");
                                const headerActions = (
                                    <ContenedorFlex style={{ gap: 8 }}>
                                        <ChipCliente theme={theme}>
                                            {nombreCliente}
                                        </ChipCliente>
                                        <TooltipUI title={tooltipEstado} position="top-right">
                                            <BadgeEstado
                                                $colorBg={coloresEstado.bg}
                                                $colorText={coloresEstado.text}
                                                $clickable={!!siguienteEstado}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (siguienteEstado) abrirConfirmacion(canje.id, siguienteEstado);
                                                }}
                                            >
                                                {estadoActual || "—"}
                                            </BadgeEstado>
                                        </TooltipUI>
                                    </ContenedorFlex>
                                );

                                return (
                                    <CardUI
                                        key={canje.id}
                                        title={titulo}
                                        description={descripcion}
                                        body={body}
                                        headerActions={headerActions}
                                        initialOpen={false}
                                        theme={theme}
                                    />
                                );
                            })}
                        </ContenedorFlex>
                    )}
                </>
            )}

            <ModalConfirmacionUI
                isOpen={modalConfirmacion.open}
                onClose={cerrarConfirmacion}
                onConfirm={confirmarCambioEstado}
                title="Confirmar cambio de estado"
                message={
                    canjePorId && modalConfirmacion.siguienteEstado
                        ? `¿Pasar el canje ${getNombreCanje(canjePorId)} del cliente ${labelCliente(canjePorId)} al estado "${modalConfirmacion.siguienteEstado}"?`
                        : "¿Confirmar cambio de estado?"
                }
                confirmText="Sí, pasar"
                cancelText="Cancelar"
                iconName="FaCircleCheck"
                confirmColor={theme?.colors?.primary}
            />
        </ContainerUI>
    );
}
