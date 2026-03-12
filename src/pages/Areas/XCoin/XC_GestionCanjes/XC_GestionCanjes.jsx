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
    const estado = apiCanje.STATUS;

    return {
        id: apiCanje.ID_REDEEM,
        nombreCanje: producto?.PRODUCT_NAME ?? "Canje XCoin",
        codigoCliente: usuario?.ACCOUNT_USER ?? null,
        nombreCliente: usuario?.NAME_USER ?? "Cliente",
        fechaOrigen: apiCanje.REDEEM_DATE,
        puntosUsados: apiCanje.POINTS_USED,
        cantidad: apiCanje.QUANTITY,
        productoImagen: producto?.PRODUCT_IMAGE_URL,
        estadoActualId: estado?.ID_STATUS,
        estadoActualNombre: estado?.STATUS_NAME,
    };
}

function formatearFecha(fecha) {
    if (!fecha) return "—";
    const d = typeof fecha === "string" ? new Date(fecha) : fecha;
    if (isNaN(d.getTime())) return String(fecha);

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
    const [filtroCliente, setFiltroCliente] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState(null);

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
        } else {
            console.error("Error al actualizar estado:", res.message);
        }
        cerrarConfirmacion();
    };

    const opcionesClientes = useMemo(() => {
        const seen = new Set();
        const list = [];
        canjes.forEach((c) => {
            if (seen.has(c.nombreCliente)) return;
            seen.add(c.nombreCliente);
            list.push({ value: c.nombreCliente, label: c.nombreCliente });
        });
        list.sort((a, b) => a.label.localeCompare(b.label));
        return [{ value: "", label: "Todos los clientes" }, ...list];
    }, [canjes]);

    const opcionesEstado = useMemo(() => [
        { value: "", label: "Todos los estados" },
        ...estadosCanjes.map(e => ({ value: e.STATUS_NAME, label: e.STATUS_NAME }))
    ], [estadosCanjes]);

    const canjesFiltrados = useMemo(() => {
        return canjes.filter((c) => {
            if (filtroCliente?.value && c.nombreCliente !== filtroCliente.value) return false;
            if (filtroEstado?.value && c.estadoActualNombre !== filtroEstado.value) return false;
            return true;
        });
    }, [canjes, filtroCliente, filtroEstado]);

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
                        <SelectUI
                            label="Clientes"
                            options={opcionesClientes}
                            value={filtroCliente ?? opcionesClientes[0]}
                            onChange={setFiltroCliente}
                            minWidth="220px"
                        />
                        <SelectUI
                            label="Estados"
                            options={opcionesEstado}
                            value={filtroEstado ?? opcionesEstado[0]}
                            onChange={setFiltroEstado}
                            minWidth="200px"
                        />
                        {(filtroCliente?.value || filtroEstado?.value) && (
                            <ButtonUI text="Limpiar" onClick={() => { setFiltroCliente(null); setFiltroEstado(null); }} variant="outlined" />
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
