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
import { toast } from "react-toastify";
import { InputUI } from "components/UI/Components/InputUI";
import {
    ListarXCoinCanjes,
    ListarXCoinEstadosCanjes,
    ActualizarXCoinEstadoCanje,
} from "services/xcoinService";
import { useAuthContext } from "context/authContext";
import { hasAccessToResource } from "utils/permissionsValidator";

/**
 * Mapea la data del API de XCoin al formato esperado por el componente.
 */
function mapXCoinCanjeToComponent(apiCanje) {
    const usuario = apiCanje.USER;
    const producto = apiCanje.PRODUCT;
    const historial = apiCanje.REDEEM_HISTORY || [];

    // El estado actual puede venir en la raíz o ser el último registro del historial
    const ultimoEstadoHistorial = historial.length > 0 ? historial[historial.length - 1]?.STATUS : null;
    const estado = apiCanje.STATUS || ultimoEstadoHistorial;

    return {
        id: apiCanje.ID_REDEEM,
        nombreCanje: producto?.PRODUCT_NAME ?? "Canje XCoin",
        codigoCliente: usuario?.ACCOUNT_USER ?? null,
        nombreCliente: usuario?.NAME_USER ?? "Cliente",
        fechaOrigen: apiCanje.REDEEM_DATE,
        puntosUsados: apiCanje.POINTS_USED,
        cantidad: apiCanje.QUANTITY,
        productoImagen: producto?.PRODUCT_IMAGE_URL,
        marca: producto?.BRAND ?? "N/A",
        empresa: producto?.ENTERPRISE ?? "N/A",
        estadoActualId: estado?.ID_STATUS,
        estadoActualNombre: estado?.STATUS_NAME,
        historialEstados: historial.map(h => ({
            estado: h.STATUS?.STATUS_NAME ?? "",
            fecha: h.createdAt,
            comentario: h.COMMENTS ?? null,
        })),
    };
}

function formatearFecha(fecha, incluirHora = false) {
    if (!fecha) return "—";
    const d = typeof fecha === "string" ? new Date(fecha) : fecha;
    if (isNaN(d.getTime())) return String(fecha);

    if (incluirHora) {
        return d.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const diaSemana = d.toLocaleDateString('es-ES', { weekday: 'long' });
    const dia = d.getDate();
    const mes = d.toLocaleDateString('es-ES', { month: 'long' });
    const anio = d.getFullYear();

    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    return `${diaSemanaCap} ${dia} de ${mes} ${anio}`;
}

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

const COLORS_ESTADO = {
    "recibido": { bg: "#dbeafe", text: "#1d4ed8" },
    "procesado": { bg: "#fef3c7", text: "#b45309" },
    "enviado": { bg: "#d1fae5", text: "#047857" },
};
const DEFAULT_COLOR_ESTADO = { bg: "#f1f5f9", text: "#475569" };

function getColorEstado(nombreEstado) {
    if (!nombreEstado) return DEFAULT_COLOR_ESTADO;
    const key = String(nombreEstado).toLowerCase().trim();
    return COLORS_ESTADO[key] ?? DEFAULT_COLOR_ESTADO;
}

const HistorialLista = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 0;
  margin-top: 8px;
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

export default function XC_GestionCanjes() {
    const { theme } = useTheme();
    const { user } = useAuthContext();
    const [canjes, setCanjes] = useState([]);
    const [estadosCanjes, setEstadosCanjes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalConfirmacion, setModalConfirmacion] = useState({
        open: false,
        canjeId: null,
        siguienteEstadoId: null,
        siguienteEstadoNombre: null,
    });
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [busquedaTexto, setBusquedaTexto] = useState("");
    const [ambitoBusqueda, setAmbitoBusqueda] = useState(null);

    // Determinar si el usuario tiene permiso de administrador (modificar)
    const isAdmin = useMemo(() => {
        if (!user || !user.data) return false;
        // Buscamos si tiene el recurso específico xcoin.admin
        return hasAccessToResource(user.data, "xcoin.admin");
    }, [user]);

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        try {
            const [resCanjes, resEstados] = await Promise.all([
                ListarXCoinCanjes(),
                ListarXCoinEstadosCanjes(),
            ]);

            if (resCanjes.success) {
                setCanjes(resCanjes.data.map(mapXCoinCanjeToComponent));
            }
            if (resEstados.success) {
                setEstadosCanjes(resEstados.data);
            }
        } catch (error) {
            console.error("Error al cargar datos de XCoin:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const getSiguienteEstado = (estadoActualId) => {
        // Lógica según requerimiento: 1 -> 2 -> 3
        if (estadoActualId === 1) return estadosCanjes.find(e => e.ID_STATUS === 2);
        if (estadoActualId === 2) return estadosCanjes.find(e => e.ID_STATUS === 3);
        return null;
    };

    const opcionesAmbito = [
        { value: "all", label: "Todo" },
        { value: "empresa", label: "Empresa" },
        { value: "marca", label: "Marca" },
        { value: "producto", label: "Producto" },
        { value: "cliente", label: "Cliente" },
    ];

    const abrirConfirmacion = (canjeId, siguienteEstado) => {
        if (!isAdmin || !siguienteEstado) return;
        setModalConfirmacion({
            open: true,
            canjeId,
            siguienteEstadoId: siguienteEstado.ID_STATUS,
            siguienteEstadoNombre: siguienteEstado.STATUS_NAME,
        });
    };

    const cerrarConfirmacion = () => {
        setModalConfirmacion({ open: false, canjeId: null, siguienteEstadoId: null, siguienteEstadoNombre: null });
    };

    const confirmarCambioEstado = async () => {
        const { canjeId, siguienteEstadoId, siguienteEstadoNombre } = modalConfirmacion;
        if (!canjeId || !siguienteEstadoId) return;

        const res = await ActualizarXCoinEstadoCanje(canjeId, { ID_STATUS: siguienteEstadoId });

        if (res.success) {
            toast.success(res.message);
            const dataActualizada = res.data;
            if (dataActualizada) {
                // Mapeamos la data retornada por el API para actualizar el estado local de forma precisa
                const canjeActualizado = mapXCoinCanjeToComponent(dataActualizada);
                setCanjes(prev => prev.map(c => {
                    if (c.id === canjeId) {
                        return {
                            ...c,
                            ...canjeActualizado
                        };
                    }
                    return c;
                }));
            } else {
                // Fallback si no viene data
                setCanjes(prev => prev.map(c => {
                    if (c.id === canjeId) {
                        return {
                            ...c,
                            estadoActualId: siguienteEstadoId,
                            estadoActualNombre: siguienteEstadoNombre,
                        };
                    }
                    return c;
                }));
            }
        } else {
            console.error("Error al actualizar estado:", res.message);
            toast.error(res.message || "Error al actualizar el estado del canje");
        }
        cerrarConfirmacion();
    };

    const opcionesEstado = useMemo(() => [
        { value: "", label: "Todos los estados" },
        ...estadosCanjes.map(e => ({ value: e.STATUS_NAME, label: e.STATUS_NAME }))
    ], [estadosCanjes]);

    const canjesFiltrados = useMemo(() => {
        return canjes.filter((c) => {
            // Filtro de Estado
            if (filtroEstado?.value && c.estadoActualNombre !== filtroEstado.value) return false;

            // Filtro de Búsqueda por Texto
            if (busquedaTexto.trim()) {
                const query = busquedaTexto.toLowerCase().trim();
                const scope = ambitoBusqueda?.value || "all";

                const matchEmpresa = c.empresa?.toLowerCase().includes(query);
                const matchMarca = c.marca?.toLowerCase().includes(query);
                const matchProducto = c.nombreCanje?.toLowerCase().includes(query);
                const matchCliente = c.nombreCliente?.toLowerCase().includes(query);

                if (scope === "empresa") return matchEmpresa;
                if (scope === "marca") return matchMarca;
                if (scope === "producto") return matchProducto;
                if (scope === "cliente") return matchCliente;

                // "all" o por defecto
                return matchEmpresa || matchMarca || matchProducto || matchCliente;
            }

            return true;
        });
    }, [canjes, filtroEstado, busquedaTexto, ambitoBusqueda]);

    return (
        <ContainerUI
            width="100%"
            height="100%"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="flex-start"
            style={{ padding: 16, gap: 20, overflow: "auto" }}
        >
            <ContenedorFlex style={{ width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <TextUI size="20px" weight="600">Gestión de Canjes XCoin</TextUI>
                <ButtonUI icon="FaRotate" onClick={cargarDatos} variant="ghost" />
            </ContenedorFlex>

            {loading ? (
                <TextUI color={theme?.colors?.textSecondary}>Cargando canjes...</TextUI>
            ) : (
                <>
                    <FiltrosBar theme={theme}>
                        <div style={{ flex: 1, minWidth: "250px" }}>
                            <InputUI
                                label="Buscar"
                                placeholder="Escribe para buscar..."
                                value={busquedaTexto}
                                onChange={setBusquedaTexto}
                                icon="FaSearch"
                            />
                        </div>
                        <SelectUI
                            label="Buscar en"
                            options={opcionesAmbito}
                            value={ambitoBusqueda ?? opcionesAmbito[0]}
                            onChange={setAmbitoBusqueda}
                            minWidth="160px"
                        />
                        <SelectUI
                            label="Estados"
                            options={opcionesEstado}
                            value={filtroEstado ?? opcionesEstado[0]}
                            onChange={setFiltroEstado}
                            minWidth="200px"
                        />
                        {(busquedaTexto || ambitoBusqueda?.value !== "all" || filtroEstado?.value) && (
                            <ButtonUI text="Limpiar" onClick={() => { setBusquedaTexto(""); setAmbitoBusqueda(opcionesAmbito[0]); setFiltroEstado(null); }} variant="outlined" />
                        )}
                        <ResultadosInfo style={{ marginLeft: "auto" }}>
                            Mostrando {canjesFiltrados.length} de {canjes.length} canjes
                        </ResultadosInfo>
                    </FiltrosBar>

                    <ContenedorFlex style={{ width: "100%", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
                        {canjesFiltrados.map((canje) => {
                            const sigEstado = getSiguienteEstado(canje.estadoActualId);
                            const colores = getColorEstado(canje.estadoActualNombre);

                            return (
                                <CardUI
                                    key={canje.id}
                                    title={canje.nombreCanje}
                                    description={`Solicitado el ${formatearFecha(canje.fechaOrigen)} | Cantidad: ${canje.cantidad} | Puntos Canjeados: ${canje.puntosUsados}`}
                                    body={
                                        <div>
                                            <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
                                                <TextUI size="13px">
                                                    <strong style={{ opacity: 0.7 }}>Empresa:</strong> {canje.empresa}
                                                </TextUI>
                                                <TextUI size="13px">
                                                    <strong style={{ opacity: 0.7 }}>Marca:</strong> {canje.marca}
                                                </TextUI>
                                            </div>
                                            <TextUI size="14px" weight="600">Historial de estados</TextUI>
                                            <HistorialLista theme={theme}>
                                                {canje.historialEstados.length === 0 ? (
                                                    <TextUI size="13px" color={theme?.colors?.textSecondary}>Sin historial</TextUI>
                                                ) : (
                                                    canje.historialEstados.map((h, i) => {
                                                        const coloresH = getColorEstado(h.estado);
                                                        return (
                                                            <React.Fragment key={i}>
                                                                {i > 0 && <HistorialFlecha theme={theme}>→</HistorialFlecha>}
                                                                <HistorialItem
                                                                    theme={theme}
                                                                    $colorBg={coloresH.bg}
                                                                    $colorText={coloresH.text}
                                                                    title={h.comentario ? `${formatearFecha(h.fecha, true)} — ${h.comentario}` : formatearFecha(h.fecha, true)}
                                                                >
                                                                    <span style={{ whiteSpace: "nowrap" }}>{h.estado}</span>
                                                                    <span style={{ fontSize: 10, opacity: 0.9, fontWeight: 500 }}>
                                                                        {formatearFecha(h.fecha, true)}
                                                                    </span>
                                                                </HistorialItem>
                                                            </React.Fragment>
                                                        );
                                                    })
                                                )}
                                            </HistorialLista>
                                        </div>
                                    }
                                    headerActions={
                                        <ContenedorFlex style={{ gap: 8 }}>
                                            <ChipCliente theme={theme}>{canje.nombreCliente}</ChipCliente>
                                            <TooltipUI title={sigEstado && isAdmin ? `Clic para pasar a "${sigEstado.STATUS_NAME}"` : (isAdmin ? (sigEstado ? "" : "Estado final") : "Solo lectura")}>
                                                <BadgeEstado
                                                    $colorBg={colores.bg}
                                                    $colorText={colores.text}
                                                    $clickable={!!sigEstado && isAdmin}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (sigEstado && isAdmin) abrirConfirmacion(canje.id, sigEstado);
                                                    }}
                                                >
                                                    {canje.estadoActualNombre}
                                                </BadgeEstado>
                                            </TooltipUI>
                                        </ContenedorFlex>
                                    }
                                    initialOpen={false}
                                />
                            );
                        })}
                    </ContenedorFlex>
                </>
            )}

            <ModalConfirmacionUI
                isOpen={modalConfirmacion.open}
                onClose={cerrarConfirmacion}
                onConfirm={confirmarCambioEstado}
                title="Confirmar cambio de estado"
                message={`¿Deseas pasar el canje al estado "${modalConfirmacion.siguienteEstadoNombre}"?`}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />
        </ContainerUI>
    );
}
