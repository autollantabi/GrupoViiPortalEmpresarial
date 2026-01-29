import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "context/ThemeContext";
import { IconUI } from "components/UI/Components/IconsUI";
import {
  Listar5w2hCabeceras,
  Crear5w2hCabecera,
  Crear5w2hDetalle,
  Actualizar5w2hCabecera,
  Actualizar5w2hDetalle,
  Eliminar5w2hDetalle,
  Listar5w2hDetallesPorCabecera,
} from "services/marketingService";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { DateTimeSelectorUI } from "components/UI/Components/DateTimeSelectorUI";
import { ConfirmationDialog } from "components/common/FormComponents";
import { toast } from "react-toastify";
import styled from "styled-components";

// Función helper para convertir hex a rgba
const hexToRGBA = ({ hex, alpha = 1 }) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
  width: 100%;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const FormRowTwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  
  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  /* Para campos que necesitan más espacio */
  & > ${FormRow}:last-child {
    grid-column: 1 / -1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
  font-style: italic;
  background-color: ${({ theme }) => theme.colors.backgroundLight || "#f8f9fa"};
  border-radius: 8px;
  border: 2px dashed ${({ theme }) => theme.colors.border || "#dee2e6"};
`;

const EstadoClickable = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.7;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text || "#000"};
 
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const CheckboxContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
`;

const AccordionContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const AccordionItem = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 8px;
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.backgroundCard || "#fff"};
  margin-bottom: 8px;
`;

const AccordionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background-color: ${({ theme, $isOpen }) => 
    $isOpen 
      ? (theme.colors.backgroundLight || "#f0f0f0")
      : (theme.colors.backgroundCard || "#fff")
  };
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight || "#f0f0f0"};
  }
`;

const AccordionHeaderContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 20px;
`;

const AccordionHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const AccordionHeaderRight = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
`;

const AccordionHeaderInfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
  text-align: right;
`;

const AccordionHeaderButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: ${({ theme }) => theme.colors.text || "#000"};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight || "#f0f0f0"};
    border-color: ${({ theme }) => theme.colors.primary || "#007bff"};
    color: ${({ theme }) => theme.colors.primary || "#007bff"};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const AccordionHeaderTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text || "#000"};
`;

const AccordionHeaderSubtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
`;

const AccordionHeaderInfo = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text || "#000"};
`;

const AccordionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16px;
  transition: transform 0.2s ease;
  transform: ${({ $isOpen }) => $isOpen ? "rotate(180deg)" : "rotate(0deg)"};
`;

const AccordionContent = styled.div`
  padding: ${({ $isOpen }) => $isOpen ? "16px 20px" : "0 20px"};
  max-height: ${({ $isOpen }) => $isOpen ? "5000px" : "0"};
  overflow: hidden;
  transition: all 0.3s ease;
  border-top: ${({ $isOpen, theme }) => 
    $isOpen 
      ? `1px solid ${theme.colors.border || "#dee2e6"}`
      : "none"
  };
`;

const ListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
`;

const ListTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  width: 100%;
  text-align: center;
  color: ${({ theme }) => theme.colors.text || "#000"};
`;


const DetalleHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 80px;
  gap: 12px;
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.backgroundLight || "#f0f0f0"};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
  font-weight: 600;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
  text-transform: uppercase;
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr 1fr 80px;
    font-size: 11px;
  }
`;

const DetalleHeaderCell = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
`;

const AccordionDetalleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1.5fr 1fr 1fr 1fr 1fr 1fr 80px;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${({ $selected, theme }) => {
    if ($selected) {
      const primaryColor = theme.colors.primary || "#007bff";
      if (primaryColor.startsWith("#")) {
        return hexToRGBA({ hex: primaryColor, alpha: 0.1 });
      }
      return theme.colors.primaryLight || "rgba(0, 123, 255, 0.1)";
    }
    return "transparent";
  }};
  
  &:hover {
    background-color: ${({ $selected, theme }) => {
      if ($selected) {
        const primaryColor = theme.colors.primary || "#007bff";
        if (primaryColor.startsWith("#")) {
          return hexToRGBA({ hex: primaryColor, alpha: 0.15 });
        }
        return theme.colors.primaryLight || "rgba(0, 123, 255, 0.15)";
      }
      return theme.colors.backgroundLight || "#f0f0f0";
    }};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1400px) {
    grid-template-columns: 1fr 1.2fr 1.2fr 1fr 1fr 1fr 1fr 1fr 80px;
    font-size: 12px;
  }
`;

const AccordionDetalleCell = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text || "#000"};
  word-break: break-word;
  display: flex;
  align-items: center;
`;

const EmptyDetailsState = styled.div`
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
  font-style: italic;
`;

const FiltrosContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || "#fff"};
  border: 1px solid ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 8px;
`;


export const Marketing5w2h = ({ routeConfig }) => {
  const { theme } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Verificar si el usuario tiene rol de jefatura para este recurso
  const tieneRolJefatura = useMemo(() => {
    if (routeConfig?.rolDelRecurso) {
      return routeConfig.rolDelRecurso.toLowerCase() === "jefatura";
    }
    return false;
  }, [routeConfig]);
  const [mostrarModalAgregar, setMostrarModalAgregar] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cabeceraIdEditar, setCabeceraIdEditar] = useState(null);
  
  // Estados para el formulario de agregar/editar
  const [cabecera, setCabecera] = useState({
    QUE: "",
    PORQUE: "",
  });
  const [detalles, setDetalles] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [detalleEditando, setDetalleEditando] = useState(null); // Índice del detalle que se está editando
  const [mostrarConfirmacionEstado, setMostrarConfirmacionEstado] = useState(false);
  const [detalleCambiarEstado, setDetalleCambiarEstado] = useState(null); // { index, estadoActual, idDetalle }
  const [estadoConfirmacion, setEstadoConfirmacion] = useState(0); // 0: inicial, 1: éxito, 2: error
  const [expandedItems, setExpandedItems] = useState(new Set()); // IDs de cabeceras expandidas
  const [filasSeleccionadas, setFilasSeleccionadas] = useState(new Set()); // IDs de filas seleccionadas
  const [mostrarModalAgregarDetalle, setMostrarModalAgregarDetalle] = useState(false);
  const [cabeceraIdAgregarDetalle, setCabeceraIdAgregarDetalle] = useState(null);
  const [mostrarModalEditarCabecera, setMostrarModalEditarCabecera] = useState(false);
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState(null); // null = todos, true = completados, false = pendientes
  const [filtroTexto, setFiltroTexto] = useState(""); // Búsqueda en QUE y PORQUE
  const [filtroCumplimiento, setFiltroCumplimiento] = useState(null); // null = todos, "alto" = >= 50%, "medio" = 25-49%, "bajo" = < 25%

  // Función para toggle de items expandidos
  const toggleAccordion = (cabeceraId) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cabeceraId)) {
        newSet.delete(cabeceraId);
      } else {
        newSet.add(cabeceraId);
      }
      return newSet;
    });
  };

  // Función para toggle de selección de filas
  const toggleSeleccionFila = (filaId, event) => {
    event.stopPropagation(); // Evitar que se propague el evento al acordeón
    setFilasSeleccionadas((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filaId)) {
        newSet.delete(filaId);
      } else {
        newSet.add(filaId);
      }
      return newSet;
    });
  };

  // Función para abrir modal de agregar detalle
  const abrirModalAgregarDetalle = (cabeceraId, event) => {
    event.stopPropagation(); // Evitar que se propague el evento al acordeón
    setCabeceraIdAgregarDetalle(cabeceraId);
    
    // Buscar la cabecera para cargar QUE y PORQUE
    const cabeceraEncontrada = data.find(
      (cab) => (cab.ID || cab.id || cab.ID_CABECERA) === cabeceraId
    );
    
    if (cabeceraEncontrada) {
      setCabecera({
        QUE: cabeceraEncontrada.QUE || "",
        PORQUE: cabeceraEncontrada.PORQUE || "",
      });
    }
    
    setDetalles([{
      DONDE: "",
      CUANDO_INICIO: "",
      CUANDO_INICIO_HORA: "",
      CUANDO_FIN: "",
      CUANDO_FIN_HORA: "",
      QUIEN: "",
      COMO: "",
      RECURSO: "",
      TIEMPO: "",
      DINERO: "",
      ESTADO: false,
    }]);
    
    setModoEdicion(false);
    setMostrarModalAgregarDetalle(true);
  };

  // Función para abrir modal de editar cabecera
  const abrirModalEditarCabecera = (cabeceraId, event) => {
    event.stopPropagation(); // Evitar que se propague el evento al acordeón
    
    // Buscar la cabecera para cargar QUE y PORQUE
    const cabeceraEncontrada = data.find(
      (cab) => (cab.ID || cab.id || cab.ID_CABECERA) === cabeceraId
    );
    
    if (cabeceraEncontrada) {
      setCabecera({
        QUE: cabeceraEncontrada.QUE || "",
        PORQUE: cabeceraEncontrada.PORQUE || "",
      });
      setCabeceraIdEditar(cabeceraId);
      setModoEdicion(false);
      setDetalles([]);
      setMostrarModalEditarCabecera(true);
    } else {
      toast.error("No se encontró la cabecera para editar");
    }
  };

  // Función para convertir timestamp ISO a fecha y hora DD/MM/YYYY HH:MM AM/PM (para usar en useMemo)
  const isoToDateTimeForTable = React.useCallback((isoString) => {
    if (!isoString) return null;
    try {
      const date = isoString instanceof Date ? isoString : new Date(isoString);
      if (isNaN(date.getTime())) {
        return null;
      }
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const meridiem = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${day}/${month}/${year} ${hours}:${minutes} ${meridiem}`;
    } catch (error) {
      return null;
    }
  }, []);

  // Transformar datos: expandir detalles en filas separadas y formatear
  const datosExpandidos = useMemo(() => {
    const filas = [];
    data.forEach((cabecera) => {
      if (cabecera.DETALLES && cabecera.DETALLES.length > 0) {
        cabecera.DETALLES.forEach((detalle) => {
          // El API puede devolver CUANDO (que es CUANDO_INICIO) o CUANDO_INICIO directamente
          const fechaInicioRaw = detalle.CUANDO || detalle.CUANDO_INICIO || null;
          const fechaFinRaw = detalle.CUANDO_FIN || null;
          
          filas.push({
            QUE: cabecera.QUE,
            PORQUE: cabecera.PORQUE,
            CABECERA_ID: cabecera.ID || cabecera.id || cabecera.ID_CABECERA, // Agregar ID de cabecera
            ID_DETALLE: detalle.ID || detalle.id || detalle.ID_DETALLE, // Agregar ID del detalle
            CUANDO_INICIO: fechaInicioRaw ? isoToDateTimeForTable(fechaInicioRaw) : "-",
            CUANDO_FIN: fechaFinRaw ? isoToDateTimeForTable(fechaFinRaw) : "-",
            DONDE: detalle.DONDE || "-",
            QUIEN: detalle.QUIEN || "-",
            COMO: detalle.COMO || "-",
            RECURSO: detalle.RECURSO || "-",
            TIEMPO: detalle.TIEMPO,
            DINERO: detalle.DINERO,
            ESTADO: detalle.ESTADO,
          });
        });
      } else {
        // Si no hay detalles, crear una fila con solo la cabecera
        filas.push({
          QUE: cabecera.QUE,
          PORQUE: cabecera.PORQUE,
          CABECERA_ID: cabecera.ID || cabecera.id || cabecera.ID_CABECERA, // Agregar ID de cabecera
          CUANDO_INICIO: "-",
          CUANDO_FIN: "-",
          DONDE: "-",
          QUIEN: "-",
          COMO: "-",
          RECURSO: "-",
          TIEMPO: null,
          DINERO: null,
          ESTADO: null,
        });
      }
    });
    return filas;
  }, [data, isoToDateTimeForTable]);

  // Agrupar datos por ID de cabecera
  const datosAgrupados = useMemo(() => {
    const grupos = {};
    
    datosExpandidos.forEach((item) => {
      const cabeceraId = item.CABECERA_ID;
      if (!cabeceraId) return; // Saltar si no hay ID de cabecera
      
      if (!grupos[cabeceraId]) {
        // Buscar la cabecera original para obtener CUMPLIMIENTO, QUE y PORQUE
        const cabeceraOriginal = data.find(
          (cab) => (cab.ID || cab.id || cab.ID_CABECERA) === cabeceraId
        );
        
        if (cabeceraOriginal) {
          grupos[cabeceraId] = {
            QUE: cabeceraOriginal.QUE || item.QUE || "",
            PORQUE: cabeceraOriginal.PORQUE || item.PORQUE || "",
            CABECERA_ID: cabeceraId,
            CUMPLIMIENTO: cabeceraOriginal.CUMPLIMIENTO !== null && cabeceraOriginal.CUMPLIMIENTO !== undefined 
              ? cabeceraOriginal.CUMPLIMIENTO 
              : null,
            detalles: [],
          };
        }
      }
      
      // Solo agregar detalles que tengan ID_DETALLE (excluir filas sin detalles)
      if (item.ID_DETALLE && grupos[cabeceraId]) {
        grupos[cabeceraId].detalles.push(item);
      }
    });
    
    return Object.values(grupos);
  }, [datosExpandidos, data]);

  // Aplicar filtros a los datos agrupados
  const datosFiltrados = useMemo(() => {
    let gruposFiltrados = [...datosAgrupados];
    
    // Filtro por texto (QUE y PORQUE)
    if (filtroTexto.trim() !== "") {
      const textoBusqueda = filtroTexto.toLowerCase().trim();
      gruposFiltrados = gruposFiltrados.filter((grupo) => {
        const que = (grupo.QUE || "").toLowerCase();
        const porque = (grupo.PORQUE || "").toLowerCase();
        return que.includes(textoBusqueda) || porque.includes(textoBusqueda);
      });
    }
    
    // Filtro por cumplimiento
    if (filtroCumplimiento) {
      gruposFiltrados = gruposFiltrados.filter((grupo) => {
        const cumplimiento = grupo.CUMPLIMIENTO !== null && grupo.CUMPLIMIENTO !== undefined 
          ? parseFloat(grupo.CUMPLIMIENTO) 
          : 0;
        
        switch (filtroCumplimiento) {
          case "alto":
            return cumplimiento >= 50;
          case "medio":
            return cumplimiento >= 25 && cumplimiento < 50;
          case "bajo":
            return cumplimiento < 25;
          default:
            return true;
        }
      });
    }
    
    // Filtro por estado de detalles
    if (filtroEstado !== null) {
      gruposFiltrados = gruposFiltrados.map((grupo) => {
        const detallesFiltrados = grupo.detalles.filter((detalle) => {
          if (filtroEstado === true) {
            return detalle.ESTADO === true;
          } else if (filtroEstado === false) {
            return detalle.ESTADO === false;
          }
          return true;
        });
        
        return {
          ...grupo,
          detalles: detallesFiltrados,
        };
      }).filter((grupo) => grupo.detalles.length > 0); // Solo mostrar grupos que tengan detalles después del filtro
    }
    
    return gruposFiltrados;
  }, [datosAgrupados, filtroTexto, filtroCumplimiento, filtroEstado]);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const respuesta = await Listar5w2hCabeceras();
        if (respuesta.success && respuesta.data) {
          setData(respuesta.data);
        } else {
          toast.error(respuesta.message || "Error al cargar los datos");
          setData([]);
        }
      } catch (error) {
        console.error("Error al cargar datos 5W2H:", error);
        toast.error("Error al cargar los datos");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Limpiar formulario al cerrar el modal
  useEffect(() => {
    if (!mostrarModalAgregar && !mostrarModalAgregarDetalle && !mostrarModalEditarCabecera) {
      setCabecera({ QUE: "", PORQUE: "" });
      setDetalles([]);
      setModoEdicion(false);
      setCabeceraIdEditar(null);
      setDetalleEditando(null);
      setMostrarConfirmacionEstado(false);
      setDetalleCambiarEstado(null);
      setEstadoConfirmacion(0);
      setCabeceraIdAgregarDetalle(null);
    }
  }, [mostrarModalAgregar, mostrarModalAgregarDetalle, mostrarModalEditarCabecera]);

  // Función para manejar el clic en el estado (desde el modal de edición)
  const handleClickEstado = (detalle, index) => {
    if (!modoEdicion) return; // Solo funciona en modo edición (visualización)
    
    setDetalleCambiarEstado({
      index,
      estadoActual: detalle.ESTADO || false,
      idDetalle: detalle.ID_DETALLE || null,
    });
    setMostrarConfirmacionEstado(true);
  };

  // Función para manejar el clic en el estado desde el acordeón
  const handleClickEstadoAccordion = async (detalle, event) => {
    event.stopPropagation(); // Evitar que se propague el evento al acordeón
    
    if (!detalle.ID_DETALLE) {
      toast.error("No se pudo identificar el detalle");
      return;
    }

    setDetalleCambiarEstado({
      index: null, // No hay índice en el acordeón
      estadoActual: detalle.ESTADO || false,
      idDetalle: detalle.ID_DETALLE,
      cabeceraId: detalle.CABECERA_ID,
      detalleCompleto: detalle, // Guardar el detalle completo para actualizar
    });
    setMostrarConfirmacionEstado(true);
  };

  // Función para confirmar el cambio de estado
  const handleConfirmarCambioEstado = async () => {
    if (!detalleCambiarEstado || !detalleCambiarEstado.idDetalle) {
      toast.error("No se pudo identificar el detalle a actualizar");
      setEstadoConfirmacion(2);
      return;
    }

    try {
      const nuevoEstado = !detalleCambiarEstado.estadoActual;
      
      // Si viene desde el acordeón (tiene detalleCompleto)
      if (detalleCambiarEstado.detalleCompleto && detalleCambiarEstado.cabeceraId) {
        const detalleCompleto = detalleCambiarEstado.detalleCompleto;
        
        // Obtener los detalles de la cabecera para obtener el detalle completo con todos los campos
        const respuestaDetalles = await Listar5w2hDetallesPorCabecera(detalleCambiarEstado.cabeceraId);
        
        if (!respuestaDetalles.success || !respuestaDetalles.data) {
          toast.error("Error al cargar los datos del detalle");
          setEstadoConfirmacion(2);
          return;
        }

        const detalleEncontrado = respuestaDetalles.data.find(
          (det) => (det.ID || det.id || det.ID_DETALLE) === detalleCambiarEstado.idDetalle
        );

        if (!detalleEncontrado) {
          toast.error("No se encontró el detalle para actualizar");
          setEstadoConfirmacion(2);
          return;
        }

        // Las fechas del API vienen en formato ISO, las usamos directamente
        const fechaInicio = detalleEncontrado.CUANDO || detalleEncontrado.CUANDO_INICIO || null;
        const fechaFin = detalleEncontrado.CUANDO_FIN || null;

        // Preparar los datos para actualizar (solo el estado cambia, el resto se mantiene igual)
        const datosActualizar = {
          CABECERA_ID: detalleCambiarEstado.cabeceraId,
          DONDE: detalleEncontrado.DONDE || null,
          CUANDO_INICIO: fechaInicio || null,
          CUANDO_FIN: fechaFin || null,
          QUIEN: detalleEncontrado.QUIEN || null,
          COMO: detalleEncontrado.COMO || null,
          RECURSO: detalleEncontrado.RECURSO || null,
          TIEMPO: detalleEncontrado.TIEMPO !== null && detalleEncontrado.TIEMPO !== undefined ? parseFloat(detalleEncontrado.TIEMPO) : null,
          DINERO: detalleEncontrado.DINERO !== null && detalleEncontrado.DINERO !== undefined ? parseFloat(detalleEncontrado.DINERO) : null,
          ESTADO: nuevoEstado,
        };

        const respuesta = await Actualizar5w2hDetalle(detalleCambiarEstado.idDetalle, datosActualizar);

        if (respuesta.success) {
          // Recargar los datos principales para reflejar el cambio
          const respuestaTabla = await Listar5w2hCabeceras();
          if (respuestaTabla.success && respuestaTabla.data) {
            setData(respuestaTabla.data);
          }
          
          setEstadoConfirmacion(1);
          toast.success(respuesta.message || "Estado actualizado exitosamente");
        } else {
          setEstadoConfirmacion(2);
          toast.error(respuesta.message || "Error al actualizar el estado");
        }
      } else {
        // Modo edición desde el modal (código original)
        const detalleActual = detalles[detalleCambiarEstado.index];
        
        // Preparar los datos para actualizar (solo el estado)
        const datosActualizar = {
          CABECERA_ID: cabeceraIdEditar,
          DONDE: detalleActual.DONDE || null,
          CUANDO_INICIO: fechaHoraToISO(detalleActual.CUANDO_INICIO, detalleActual.CUANDO_INICIO_HORA),
          CUANDO_FIN: fechaHoraToISO(detalleActual.CUANDO_FIN, detalleActual.CUANDO_FIN_HORA),
          QUIEN: detalleActual.QUIEN || null,
          COMO: detalleActual.COMO || null,
          RECURSO: detalleActual.RECURSO || null,
          TIEMPO: detalleActual.TIEMPO ? parseFloat(detalleActual.TIEMPO) : null,
          DINERO: detalleActual.DINERO ? parseFloat(detalleActual.DINERO) : null,
          ESTADO: nuevoEstado,
        };

        const respuesta = await Actualizar5w2hDetalle(detalleCambiarEstado.idDetalle, datosActualizar);

        if (respuesta.success) {
          // Actualizar el estado local del modal
          const nuevosDetalles = [...detalles];
          nuevosDetalles[detalleCambiarEstado.index] = {
            ...nuevosDetalles[detalleCambiarEstado.index],
            ESTADO: nuevoEstado,
          };
          setDetalles(nuevosDetalles);
          
          // Recargar los datos principales de la tabla para reflejar el cambio
          try {
            const respuestaTabla = await Listar5w2hCabeceras();
            if (respuestaTabla.success && respuestaTabla.data) {
              setData(respuestaTabla.data);
            }
          } catch (error) {
            console.error("Error al recargar datos de la tabla:", error);
            // No mostramos error al usuario porque el estado ya se actualizó exitosamente
          }
          
          setEstadoConfirmacion(1);
          toast.success(respuesta.message || "Estado actualizado exitosamente");
        } else {
          setEstadoConfirmacion(2);
          toast.error(respuesta.message || "Error al actualizar el estado");
        }
      }
    } catch (error) {
      console.error("Error al actualizar estado del detalle:", error);
      setEstadoConfirmacion(2);
      toast.error("Error al actualizar el estado");
    }
  };

  // Función para cerrar el modal de confirmación después del éxito
  const handleCerrarConfirmacionEstado = async () => {
    setMostrarConfirmacionEstado(false);
    setDetalleCambiarEstado(null);
    setEstadoConfirmacion(0);
    
    // Recargar los datos del modal para asegurar sincronización
    if (cabeceraIdEditar) {
      await cargarDatosParaEditar({ CABECERA_ID: cabeceraIdEditar });
    }
    
    // También recargar los datos de la tabla principal para reflejar el cambio
    try {
      const respuestaTabla = await Listar5w2hCabeceras();
      if (respuestaTabla.success && respuestaTabla.data) {
        setData(respuestaTabla.data);
      }
    } catch (error) {
      console.error("Error al recargar datos de la tabla:", error);
    }
  };

  // Función para convertir timestamp ISO a fecha DD/MM/YYYY
  const isoToDate = (isoString) => {
    if (!isoString) return "";
    try {
      // Aceptar tanto strings ISO como Date objects
      const date = isoString instanceof Date ? isoString : new Date(isoString);
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.error("Fecha inválida:", isoString);
        return "";
      }
      
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error al convertir fecha:", error, "Valor recibido:", isoString);
      return "";
    }
  };

  // Función para convertir timestamp ISO a hora HH:MM AM/PM
  const isoToTime = (isoString) => {
    if (!isoString) return "";
    try {
      // Aceptar tanto strings ISO como Date objects
      const date = isoString instanceof Date ? isoString : new Date(isoString);
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.error("Fecha/hora inválida:", isoString);
        return "";
      }
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const meridiem = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${meridiem}`;
    } catch (error) {
      console.error("Error al convertir hora:", error, "Valor recibido:", isoString);
      return "";
    }
  };

  // Función para cargar datos al modal cuando se hace doble click
  const cargarDatosParaEditar = async (item) => {
    try {
      // Obtener el ID de la cabecera y del detalle desde el item
      const cabeceraId = item.CABECERA_ID || item.cabecera_id;
      const detalleId = item.ID_DETALLE || item.id_detalle;
      
      if (!cabeceraId) {
        toast.error("No se pudo obtener el ID de la cabecera");
        return;
      }

      if (!detalleId) {
        toast.error("No se pudo obtener el ID del detalle");
        return;
      }

      // Buscar la cabecera en los datos originales para obtener QUE y PORQUE
      const cabeceraEncontrada = data.find(
        (cab) => (cab.ID || cab.id || cab.ID_CABECERA) === cabeceraId
      );
      
      if (!cabeceraEncontrada) {
        toast.error("No se encontró la cabecera para editar");
        return;
      }

      // Cargar datos de la cabecera (solo para mostrar, no editable)
      setCabecera({
        QUE: cabeceraEncontrada.QUE || "",
        PORQUE: cabeceraEncontrada.PORQUE || "",
      });

      // Guardar el ID de la cabecera y del detalle para edición
      setCabeceraIdEditar(cabeceraId);

      // Obtener todos los detalles de la cabecera desde la API para encontrar el detalle específico
      const respuestaDetalles = await Listar5w2hDetallesPorCabecera(cabeceraId);

      if (respuestaDetalles.success && respuestaDetalles.data) {
        // Buscar el detalle específico que se está editando
        const detalleEncontrado = respuestaDetalles.data.find(
          (det) => (det.ID || det.id || det.ID_DETALLE) === detalleId
        );

        if (!detalleEncontrado) {
          toast.error("No se encontró el detalle para editar");
          return;
        }

        // Convertir el detalle del formato API al formato del formulario
        const fechaInicio = detalleEncontrado.CUANDO || detalleEncontrado.CUANDO_INICIO || null;
        const fechaFin = detalleEncontrado.CUANDO_FIN || null;
        
        const detalleCargado = {
          DONDE: detalleEncontrado.DONDE || "",
          CUANDO_INICIO: fechaInicio ? isoToDate(fechaInicio) : "",
          CUANDO_INICIO_HORA: fechaInicio ? isoToTime(fechaInicio) : "",
          CUANDO_FIN: fechaFin ? isoToDate(fechaFin) : "",
          CUANDO_FIN_HORA: fechaFin ? isoToTime(fechaFin) : "",
          QUIEN: detalleEncontrado.QUIEN || "",
          COMO: detalleEncontrado.COMO || "",
          RECURSO: detalleEncontrado.RECURSO || "",
          TIEMPO: detalleEncontrado.TIEMPO ? String(detalleEncontrado.TIEMPO) : "",
          DINERO: detalleEncontrado.DINERO ? String(detalleEncontrado.DINERO) : "",
          ESTADO: detalleEncontrado.ESTADO || false,
          ID_DETALLE: detalleEncontrado.ID || detalleEncontrado.id || detalleEncontrado.ID_DETALLE,
        };

        // Solo cargar el detalle específico que se está editando
        setDetalles([detalleCargado]);
      } else {
        toast.error(respuestaDetalles.message || "Error al cargar los detalles");
        setDetalles([]);
      }

      setModoEdicion(true);
      setMostrarModalAgregar(true);
    } catch (error) {
      console.error("Error al cargar datos para editar:", error);
      toast.error("Error al cargar los datos para editar");
    }
  };

  // Función para convertir hora HH:MM AM/PM a formato 24 horas
  const horaTo24 = (horaString) => {
    if (!horaString || horaString === "") return "00:00";
    try {
      const match = horaString.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (!match) return "00:00";
      
      let hours = parseInt(match[1]);
      const minutes = match[2].padStart(2, "0");
      const meridiem = match[3].toUpperCase();
      
      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }
      
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    } catch (error) {
      console.error("Error al convertir hora:", error);
      return "00:00";
    }
  };

  // Función para convertir fecha DD/MM/YYYY y hora a formato ISO timestamp con timezone -05:00
  const fechaHoraToISO = (fechaString, horaString) => {
    if (!fechaString || fechaString === "") return null;
    try {
      const [day, month, year] = fechaString.split("/");
      const hora24 = horaTo24(horaString || "00:00 AM");
      const [hours, minutes] = hora24.split(":");
      
      // Formatear directamente como ISO timestamp con timezone -05:00 (Ecuador)
      const yearISO = parseInt(year);
      const monthISO = String(month).padStart(2, "0");
      const dayISO = String(day).padStart(2, "0");
      const hoursISO = String(hours || "00").padStart(2, "0");
      const minutesISO = String(minutes || "00").padStart(2, "0");
      
      // Formato: YYYY-MM-DDTHH:mm:ss-05:00
      return `${yearISO}-${monthISO}-${dayISO}T${hoursISO}:${minutesISO}:00-05:00`;
    } catch (error) {
      console.error("Error al convertir fecha y hora:", error);
      return null;
    }
  };

  // Agregar un nuevo detalle
  const agregarDetalle = () => {
    setDetalles([
      ...detalles,
      {
        DONDE: "",
        CUANDO_INICIO: "",
        CUANDO_INICIO_HORA: "",
        CUANDO_FIN: "",
        CUANDO_FIN_HORA: "",
        QUIEN: "",
        COMO: "",
        RECURSO: "",
        TIEMPO: "",
        DINERO: "",
        ESTADO: false,
      },
    ]);
  };

  // Eliminar un detalle
  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  // Actualizar un detalle específico
  const actualizarDetalle = (index, campo, valor) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      [campo]: valor,
    };
    setDetalles(nuevosDetalles);
  };

  // Actualizar múltiples campos de un detalle a la vez
  const actualizarDetalleMultiple = (index, campos) => {
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index] = {
      ...nuevosDetalles[index],
      ...campos,
    };
    setDetalles(nuevosDetalles);
  };

  // Función para guardar el registro
  const handleGuardar = async () => {
    setGuardando(true);
    try {
      if (mostrarModalAgregarDetalle && cabeceraIdAgregarDetalle) {
        // Modo agregar detalle a cabecera existente
        if (detalles.length === 0) {
          toast.error("Debe agregar al menos un detalle");
          setGuardando(false);
          return;
        }

        let detallesCreados = 0;
        let erroresDetalles = [];

        for (let i = 0; i < detalles.length; i++) {
          const detalle = detalles[i];
          const datosDetalle = {
            CABECERA_ID: cabeceraIdAgregarDetalle,
            DONDE: detalle.DONDE?.trim() || null,
            CUANDO_INICIO: fechaHoraToISO(detalle.CUANDO_INICIO, detalle.CUANDO_INICIO_HORA),
            CUANDO_FIN: fechaHoraToISO(detalle.CUANDO_FIN, detalle.CUANDO_FIN_HORA),
            QUIEN: detalle.QUIEN?.trim() || null,
            COMO: detalle.COMO?.trim() || null,
            RECURSO: detalle.RECURSO?.trim() || null,
            TIEMPO: detalle.TIEMPO ? parseFloat(detalle.TIEMPO) : null,
            DINERO: detalle.DINERO ? parseFloat(detalle.DINERO) : null,
            ESTADO: detalle.ESTADO || false,
          };

          const respuestaDetalle = await Crear5w2hDetalle(datosDetalle);

          if (
            respuestaDetalle.status === "Ok!" ||
            respuestaDetalle.success ||
            respuestaDetalle.status === 200 ||
            (respuestaDetalle.status && respuestaDetalle.status >= 200 && respuestaDetalle.status < 300)
          ) {
            detallesCreados++;
          } else {
            const mensajeError = respuestaDetalle.message || respuestaDetalle.error || "Error desconocido";
            erroresDetalles.push(`Detalle ${i + 1}: ${mensajeError}`);
          }
        }

        if (detallesCreados === detalles.length) {
          toast.success(`${detallesCreados} detalle(s) agregado(s) exitosamente`);
        } else {
          toast.warning(
            `${detallesCreados} de ${detalles.length} detalle(s) creado(s). Errores: ${erroresDetalles.join(", ")}`
          );
        }

        // Limpiar formulario
        setCabecera({ QUE: "", PORQUE: "" });
        setDetalles([]);
        setMostrarModalAgregarDetalle(false);
        setCabeceraIdAgregarDetalle(null);
        
        // Recargar datos
        const nuevaRespuesta = await Listar5w2hCabeceras();
        if (nuevaRespuesta.success && nuevaRespuesta.data) {
          setData(nuevaRespuesta.data);
        }
      } else if (mostrarModalEditarCabecera && cabeceraIdEditar) {
        // Modo editar cabecera: actualizar QUE y PORQUE
        if (!cabecera.QUE.trim() || !cabecera.PORQUE.trim()) {
          toast.error("Debe ingresar QUE y PORQUE");
          setGuardando(false);
          return;
        }

        const datosCabecera = {
          QUE: cabecera.QUE.trim(),
          PORQUE: cabecera.PORQUE.trim(),
        };

        const respuesta = await Actualizar5w2hCabecera(cabeceraIdEditar, datosCabecera);

        if (respuesta.success) {
          toast.success(respuesta.message || "Cabecera actualizada exitosamente");
          setCabecera({ QUE: "", PORQUE: "" });
          setDetalles([]);
          setMostrarModalEditarCabecera(false);
          setCabeceraIdEditar(null);
          
          // Recargar datos
          const nuevaRespuesta = await Listar5w2hCabeceras();
          if (nuevaRespuesta.success && nuevaRespuesta.data) {
            setData(nuevaRespuesta.data);
          }
        } else {
          toast.error(respuesta.message || "Error al actualizar la cabecera");
        }
      } else if (modoEdicion) {
        // Modo edición: solo actualizar el detalle específico
        if (detalles.length === 0 || !detalles[0].ID_DETALLE) {
          toast.error("No se pudo identificar el detalle a actualizar");
          setGuardando(false);
          return;
        }

        const detalle = detalles[0];
        const datosActualizar = {
          CABECERA_ID: cabeceraIdEditar,
          DONDE: detalle.DONDE?.trim() || null,
          CUANDO_INICIO: fechaHoraToISO(detalle.CUANDO_INICIO, detalle.CUANDO_INICIO_HORA),
          CUANDO_FIN: fechaHoraToISO(detalle.CUANDO_FIN, detalle.CUANDO_FIN_HORA),
          QUIEN: detalle.QUIEN?.trim() || null,
          COMO: detalle.COMO?.trim() || null,
          RECURSO: detalle.RECURSO?.trim() || null,
          TIEMPO: detalle.TIEMPO ? parseFloat(detalle.TIEMPO) : null,
          DINERO: detalle.DINERO ? parseFloat(detalle.DINERO) : null,
          ESTADO: detalle.ESTADO || false,
        };

        const respuesta = await Actualizar5w2hDetalle(detalle.ID_DETALLE, datosActualizar);

        if (respuesta.success) {
          toast.success(respuesta.message || "Detalle actualizado exitosamente");
          setCabecera({ QUE: "", PORQUE: "" });
          setDetalles([]);
          setMostrarModalAgregar(false);
          setModoEdicion(false);
          setCabeceraIdEditar(null);
          
          // Recargar datos
          const nuevaRespuesta = await Listar5w2hCabeceras();
          if (nuevaRespuesta.success && nuevaRespuesta.data) {
            setData(nuevaRespuesta.data);
          }
        } else {
          toast.error(respuesta.message || "Error al actualizar el detalle");
        }
      } else {
        // Modo agregar: solo crear la cabecera
        if (!cabecera.QUE.trim() || !cabecera.PORQUE.trim()) {
          toast.error("Debe ingresar QUE y PORQUE");
          setGuardando(false);
          return;
        }

        const datosCabecera = {
          QUE: cabecera.QUE.trim(),
          PORQUE: cabecera.PORQUE.trim(),
        };

        const respuestaCabecera = await Crear5w2hCabecera(datosCabecera);

        if (!respuestaCabecera.success) {
          toast.error(
            respuestaCabecera.message || "Error al crear la cabecera"
          );
          setGuardando(false);
          return;
        }

        toast.success("Cabecera creada exitosamente");
        // Limpiar formulario
        setCabecera({ QUE: "", PORQUE: "" });
        setDetalles([]);
        setMostrarModalAgregar(false);
        
        // Recargar datos
        const nuevaRespuesta = await Listar5w2hCabeceras();
        if (nuevaRespuesta.success && nuevaRespuesta.data) {
          setData(nuevaRespuesta.data);
        }
      }
    } catch (error) {
      console.error("Error al guardar registro 5W2H:", error);
      toast.error("Error al guardar el registro");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
        }}
      >
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width:"100%"}}>
      <ListHeader>
        <ListTitle>Registros 5W2H</ListTitle>
        {tieneRolJefatura && (
          <ButtonUI
            text="Agregar"
            onClick={() => {
              setModoEdicion(false);
              setCabeceraIdEditar(null);
              setCabecera({ QUE: "", PORQUE: "" });
              setDetalles([]);
              setMostrarModalAgregar(true);
            }}
            pcolor={theme.colors.primary}
          />
        )}
      </ListHeader>
      
      {/* Filtros */}
      <FiltrosContainer theme={theme}>
        <InputUI
          label="Buscar"
          placeholder="Buscar en ¿Qué? o ¿Por qué?"
          value={filtroTexto}
          onChange={(valor) => setFiltroTexto(valor)}
          iconLeft="FaSistrix"
          containerStyle={{ minWidth: "250px", flex: 1 }}
        />
        
        <SelectUI
          label="Estado de detalles"
          options={[
            { value: null, label: "Todos" },
            { value: true, label: "Completados" },
            { value: false, label: "Pendientes" },
          ]}
          value={
            filtroEstado === null
              ? { value: null, label: "Todos" }
              : filtroEstado === true
              ? { value: true, label: "Completados" }
              : { value: false, label: "Pendientes" }
          }
          onChange={(option) => setFiltroEstado(option?.value ?? null)}
          placeholder="Filtrar por estado"
          minWidth="180px"
          maxWidth="200px"
          isSearchable={false}
        />
        
        <SelectUI
          label="Cumplimiento"
          options={[
            { value: null, label: "Todos" },
            { value: "alto", label: "Alto (≥50%)" },
            { value: "medio", label: "Medio (25-49%)" },
            { value: "bajo", label: "Bajo (<25%)" },
          ]}
          value={
            filtroCumplimiento === null
              ? { value: null, label: "Todos" }
              : filtroCumplimiento === "alto"
              ? { value: "alto", label: "Alto (≥50%)" }
              : filtroCumplimiento === "medio"
              ? { value: "medio", label: "Medio (25-49%)" }
              : { value: "bajo", label: "Bajo (<25%)" }
          }
          onChange={(option) => setFiltroCumplimiento(option?.value ?? null)}
          placeholder="Filtrar por cumplimiento"
          minWidth="180px"
          maxWidth="200px"
          isSearchable={false}
        />
        
        {(filtroTexto.trim() !== "" || filtroEstado !== null || filtroCumplimiento !== null) && (
          <ButtonUI
            text="Limpiar filtros"
            onClick={() => {
              setFiltroTexto("");
              setFiltroEstado(null);
              setFiltroCumplimiento(null);
            }}
            pcolor={theme.colors.secondary || "#6c757d"}
            style={{ marginLeft: "auto" }}
          />
        )}
      </FiltrosContainer>
      
      {datosFiltrados.length === 0 ? (
        <EmptyState>
          {datosAgrupados.length === 0
            ? "No hay registros disponibles. Haz clic en \"Agregar\" para crear uno nuevo."
            : "No hay registros que coincidan con los filtros aplicados."}
        </EmptyState>
      ) : (
        <AccordionContainer>
          {datosFiltrados.map((grupo) => {
            const cabeceraId = grupo.CABECERA_ID;
            const isOpen = expandedItems.has(cabeceraId);
            
            return (
              <AccordionItem key={cabeceraId}>
                <AccordionHeader
                  onClick={() => toggleAccordion(cabeceraId)}
                  $isOpen={isOpen}
                  theme={theme}
                >
                  <AccordionHeaderContent>
                    <AccordionHeaderLeft>
                      <AccordionHeaderTitle theme={theme}>
                        ¿Qué?: {grupo.QUE}
                      </AccordionHeaderTitle>
                      <AccordionHeaderSubtitle theme={theme}>
                        ¿Por qué?: {grupo.PORQUE}
                      </AccordionHeaderSubtitle>
                    </AccordionHeaderLeft>
                    <AccordionHeaderRight>
                      <AccordionHeaderInfoColumn>
                        <AccordionHeaderInfo theme={theme}>
                          Cumplimiento: {grupo.CUMPLIMIENTO !== null && grupo.CUMPLIMIENTO !== undefined 
                            ? parseFloat(grupo.CUMPLIMIENTO).toFixed(2) 
                            : "0.00"}%
                        </AccordionHeaderInfo>
                        <AccordionHeaderSubtitle theme={theme}>
                          {grupo.detalles.length} {grupo.detalles.length === 1 ? "detalle" : "detalles"}
                        </AccordionHeaderSubtitle>
                      </AccordionHeaderInfoColumn>
                      {tieneRolJefatura && (
                        <AccordionHeaderButtons>
                          <IconButton
                            theme={theme}
                            onClick={(e) => abrirModalAgregarDetalle(grupo.CABECERA_ID, e)}
                            title="Agregar detalle"
                          >
                            <IconUI
                              name="FaPlus"
                              size={16}
                              color={theme.colors.text || "#000"}
                            />
                          </IconButton>
                          <IconButton
                            theme={theme}
                            onClick={(e) => abrirModalEditarCabecera(grupo.CABECERA_ID, e)}
                            title="Editar cabecera"
                          >
                            <IconUI
                              name="FaPen"
                              size={16}
                              color={theme.colors.text || "#000"}
                            />
                          </IconButton>
                        </AccordionHeaderButtons>
                      )}
                    </AccordionHeaderRight>
                  </AccordionHeaderContent>
                  <AccordionIcon $isOpen={isOpen}>
                    <IconUI
                      name="FaChevronDown"
                      size={16}
                      color={theme.colors.textSecondary || "#6c757d"}
                    />
                  </AccordionIcon>
                </AccordionHeader>
                <AccordionContent $isOpen={isOpen} theme={theme}>
                  {grupo.detalles.length === 0 ? (
                    <EmptyDetailsState theme={theme}>
                      No hay detalles para este registro.
                    </EmptyDetailsState>
                  ) : (
                    <>
                      <DetalleHeaderRow theme={theme}>
                        <DetalleHeaderCell>¿Dónde?</DetalleHeaderCell>
                        <DetalleHeaderCell>¿Cuándo inicia?</DetalleHeaderCell>
                        <DetalleHeaderCell>¿Cuándo finaliza?</DetalleHeaderCell>
                        <DetalleHeaderCell>¿Quién?</DetalleHeaderCell>
                        <DetalleHeaderCell>¿Cómo?</DetalleHeaderCell>
                        <DetalleHeaderCell>Recursos</DetalleHeaderCell>
                        <DetalleHeaderCell>Tiempo</DetalleHeaderCell>
                        <DetalleHeaderCell>Dinero</DetalleHeaderCell>
                        <DetalleHeaderCell>¿Completado?</DetalleHeaderCell>
                      </DetalleHeaderRow>
                      {grupo.detalles.map((detalle, detalleIndex) => {
                        const tiempoFormateado = detalle.TIEMPO !== null && detalle.TIEMPO !== undefined 
                          ? `${detalle.TIEMPO} días` 
                          : "-";
                        const dineroFormateado = detalle.DINERO !== null && detalle.DINERO !== undefined
                          ? `$${parseFloat(detalle.DINERO).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "-";
                        
                        const filaId = `${grupo.CABECERA_ID}-${detalle.ID_DETALLE || detalleIndex}`;
                        const isSelected = filasSeleccionadas.has(filaId);
                        
                        return (
                          <AccordionDetalleRow
                            key={detalleIndex}
                            theme={theme}
                            $selected={isSelected}
                            onClick={(e) => toggleSeleccionFila(filaId, e)}
                            onDoubleClick={tieneRolJefatura ? () => cargarDatosParaEditar(detalle) : undefined}
                            title={tieneRolJefatura ? "Click para seleccionar, doble clic para editar" : "Click para seleccionar"}
                            style={{ cursor: tieneRolJefatura ? "pointer" : "default" }}
                          >
                            <AccordionDetalleCell theme={theme}>
                              {detalle.DONDE || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.CUANDO_INICIO || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.CUANDO_FIN || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.QUIEN || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.COMO || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.RECURSO || "-"}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {tiempoFormateado}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {dineroFormateado}
                            </AccordionDetalleCell>
                            <AccordionDetalleCell theme={theme}>
                              {detalle.ESTADO === true ? (
                                tieneRolJefatura ? (
                                  <EstadoClickable
                                    onClick={(e) => handleClickEstadoAccordion(detalle, e)}
                                    title="Marcar como pendiente"
                                  >
                                    <IconUI
                                      name="FaCircleCheck"
                                      size={18}
                                      color={theme.colors.success || "#28a745"}
                                    />
                                  </EstadoClickable>
                                ) : (
                                  <IconUI
                                    name="FaCircleCheck"
                                    size={18}
                                    color={theme.colors.success || "#28a745"}
                                  />
                                )
                              ) : detalle.ESTADO === false ? (
                                tieneRolJefatura ? (
                                  <EstadoClickable
                                    onClick={(e) => handleClickEstadoAccordion(detalle, e)}
                                    title="Marcar como completado"
                                  >
                                    <IconUI
                                      name="FaMinus"
                                      size={18}
                                      color={theme.colors.warning || "#dc3545"}
                                    />
                                  </EstadoClickable>
                                ) : (
                                  <IconUI
                                    name="FaMinus"
                                    size={18}
                                    color={theme.colors.warning || "#dc3545"}
                                  />
                                )
                              ) : (
                                "-"
                              )}
                            </AccordionDetalleCell>
                          </AccordionDetalleRow>
                        );
                      })}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </AccordionContainer>
      )}
      {/* Modal para agregar nuevo registro */}
      <ModalUI
        isOpen={mostrarModalAgregar}
        onClose={() => {
          setMostrarModalAgregar(false);
          setModoEdicion(false);
          setCabeceraIdEditar(null);
        }}
        title={modoEdicion ? "Editar Registro 5W2H" : "Agregar Nueva Cabecera"}
        maxWidth="1000px"
        width="95%"
        maxHeight="90vh"
        onSave={handleGuardar}
        saveText={modoEdicion ? "Guardar" : "Crear"}
      >
        <ModalContent>
          {/* Formulario de Cabecera - Solo cuando NO está en modo edición */}
          {!modoEdicion && (
            <FormSection>
              <FormRowTwoColumns>
                <FormRow>
                  <InputUI
                    label="QUE"
                    placeholder="¿Qué se va a hacer?"
                    value={cabecera.QUE}
                    onChange={(valor) => setCabecera({ ...cabecera, QUE: valor })}
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="PORQUE"
                    placeholder="¿Por qué se va a hacer?"
                    value={cabecera.PORQUE}
                    onChange={(valor) => setCabecera({ ...cabecera, PORQUE: valor })}
                  />
                </FormRow>
              </FormRowTwoColumns>
            </FormSection>
          )}
          
          {/* Formulario de Detalle - Solo en modo edición */}
          {modoEdicion && detalles.length > 0 && (
            <FormSection>
              <DetailGrid>
                <FormRow>
                  <InputUI
                    label="DONDE"
                    placeholder="¿Dónde?"
                    value={detalles[0].DONDE}
                    onChange={(valor) =>
                      actualizarDetalle(0, "DONDE", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="QUIEN"
                    placeholder="¿Quién?"
                    value={detalles[0].QUIEN}
                    onChange={(valor) =>
                      actualizarDetalle(0, "QUIEN", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <DateTimeSelectorUI
                    label="CUANDO (Inicio)"
                    fecha={detalles[0].CUANDO_INICIO}
                    hora={detalles[0].CUANDO_INICIO_HORA}
                    onChange={({ fecha, hora }) => {
                      actualizarDetalleMultiple(0, {
                        CUANDO_INICIO: fecha !== null && fecha !== undefined ? fecha : "",
                        CUANDO_INICIO_HORA: hora !== null && hora !== undefined ? hora : "",
                      });
                    }}
                  />
                </FormRow>
                <FormRow>
                  <DateTimeSelectorUI
                    label="CUANDO (Fin)"
                    fecha={detalles[0].CUANDO_FIN}
                    hora={detalles[0].CUANDO_FIN_HORA}
                    onChange={({ fecha, hora }) => {
                      // Validar que la fecha/hora fin no sea menor que la inicio
                      if (fecha && detalles[0].CUANDO_INICIO) {
                        const fechaInicio = new Date(
                          detalles[0].CUANDO_INICIO.split("/").reverse().join("-")
                        );
                        const fechaFin = new Date(
                          fecha.split("/").reverse().join("-")
                        );

                        // Si las fechas son iguales, validar la hora
                        if (fechaInicio.getTime() === fechaFin.getTime()) {
                          if (detalles[0].CUANDO_INICIO_HORA && hora) {
                            const horaInicio24 = (() => {
                              const match = detalles[0].CUANDO_INICIO_HORA.match(/(\d+):(\d+)\s?(AM|PM)/i);
                              if (!match) return "00:00";
                              let h = parseInt(match[1]);
                              const m = match[2].padStart(2, "0");
                              const meridiem = match[3].toUpperCase();
                              if (meridiem === "PM" && h !== 12) h += 12;
                              else if (meridiem === "AM" && h === 12) h = 0;
                              return `${String(h).padStart(2, "0")}:${m}`;
                            })();

                            const horaFin24 = (() => {
                              const match = hora.match(/(\d+):(\d+)\s?(AM|PM)/i);
                              if (!match) return "00:00";
                              let h = parseInt(match[1]);
                              const m = match[2].padStart(2, "0");
                              const meridiem = match[3].toUpperCase();
                              if (meridiem === "PM" && h !== 12) h += 12;
                              else if (meridiem === "AM" && h === 12) h = 0;
                              return `${String(h).padStart(2, "0")}:${m}`;
                            })();

                            if (horaFin24 < horaInicio24) {
                              toast.error(
                                "La fecha/hora de fin no puede ser menor que la de inicio"
                              );
                              return;
                            }
                          }
                        } else if (fechaFin < fechaInicio) {
                          toast.error(
                            "La fecha de fin no puede ser menor que la de inicio"
                          );
                          return;
                        }
                      }

                      actualizarDetalleMultiple(0, {
                        CUANDO_FIN: fecha !== null && fecha !== undefined ? fecha : "",
                        CUANDO_FIN_HORA: hora !== null && hora !== undefined ? hora : "",
                      });
                    }}
                    min={
                      detalles[0].CUANDO_INICIO
                        ? (() => {
                            try {
                              const [day, month, year] = detalles[0].CUANDO_INICIO.split("/");
                              return new Date(year, month - 1, day);
                            } catch {
                              return null;
                            }
                          })()
                        : null
                    }
                    minHora={detalles[0].CUANDO_INICIO_HORA || ""}
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="COMO"
                    placeholder="¿Cómo?"
                    value={detalles[0].COMO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "COMO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="RECURSO"
                    placeholder="Recursos necesarios"
                    value={detalles[0].RECURSO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "RECURSO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="TIEMPO (días)"
                    type="number"
                    placeholder="0.0"
                    value={detalles[0].TIEMPO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "TIEMPO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="DINERO ($)"
                    type="number"
                    placeholder="0.00"
                    value={detalles[0].DINERO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "DINERO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <CheckboxContainer>
                    <input
                      type="checkbox"
                      checked={detalles[0].ESTADO || false}
                      onChange={(e) =>
                        actualizarDetalle(0, "ESTADO", e.target.checked)
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      style={{
                        fontSize: "13px",
                        color: theme.colors.text,
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Estado (Completado)
                    </label>
                  </CheckboxContainer>
                </FormRow>
              </DetailGrid>
            </FormSection>
          )}
        </ModalContent>
      </ModalUI>

      {/* Modal para agregar detalle a cabecera existente */}
      <ModalUI
        isOpen={mostrarModalAgregarDetalle}
        onClose={() => {
          setMostrarModalAgregarDetalle(false);
          setCabeceraIdAgregarDetalle(null);
        }}
        title="Agregar Detalle"
        maxWidth="1000px"
        width="95%"
        maxHeight="90vh"
        onSave={handleGuardar}
        saveText="Guardar"
      >
        <ModalContent>
          {/* Formulario de Detalle */}
          {detalles.length > 0 && (
            <FormSection>
              <DetailGrid>
                <FormRow>
                  <InputUI
                    label="DONDE"
                    placeholder="¿Dónde?"
                    value={detalles[0].DONDE}
                    onChange={(valor) =>
                      actualizarDetalle(0, "DONDE", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="QUIEN"
                    placeholder="¿Quién?"
                    value={detalles[0].QUIEN}
                    onChange={(valor) =>
                      actualizarDetalle(0, "QUIEN", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <DateTimeSelectorUI
                    label="CUANDO (Inicio)"
                    fecha={detalles[0].CUANDO_INICIO}
                    hora={detalles[0].CUANDO_INICIO_HORA}
                    onChange={({ fecha, hora }) => {
                      actualizarDetalleMultiple(0, {
                        CUANDO_INICIO: fecha !== null && fecha !== undefined ? fecha : "",
                        CUANDO_INICIO_HORA: hora !== null && hora !== undefined ? hora : "",
                      });
                    }}
                  />
                </FormRow>
                <FormRow>
                  <DateTimeSelectorUI
                    label="CUANDO (Fin)"
                    fecha={detalles[0].CUANDO_FIN}
                    hora={detalles[0].CUANDO_FIN_HORA}
                    onChange={({ fecha, hora }) => {
                      // Validar que la fecha/hora fin no sea menor que la inicio
                      if (fecha && detalles[0].CUANDO_INICIO) {
                        const fechaInicio = new Date(
                          detalles[0].CUANDO_INICIO.split("/").reverse().join("-")
                        );
                        const fechaFin = new Date(
                          fecha.split("/").reverse().join("-")
                        );

                        // Si las fechas son iguales, validar la hora
                        if (fechaInicio.getTime() === fechaFin.getTime()) {
                          if (detalles[0].CUANDO_INICIO_HORA && hora) {
                            const horaInicio24 = (() => {
                              const match = detalles[0].CUANDO_INICIO_HORA.match(/(\d+):(\d+)\s?(AM|PM)/i);
                              if (!match) return "00:00";
                              let h = parseInt(match[1]);
                              const m = match[2].padStart(2, "0");
                              const meridiem = match[3].toUpperCase();
                              if (meridiem === "PM" && h !== 12) h += 12;
                              else if (meridiem === "AM" && h === 12) h = 0;
                              return `${String(h).padStart(2, "0")}:${m}`;
                            })();

                            const horaFin24 = (() => {
                              const match = hora.match(/(\d+):(\d+)\s?(AM|PM)/i);
                              if (!match) return "00:00";
                              let h = parseInt(match[1]);
                              const m = match[2].padStart(2, "0");
                              const meridiem = match[3].toUpperCase();
                              if (meridiem === "PM" && h !== 12) h += 12;
                              else if (meridiem === "AM" && h === 12) h = 0;
                              return `${String(h).padStart(2, "0")}:${m}`;
                            })();

                            if (horaFin24 < horaInicio24) {
                              toast.error(
                                "La fecha/hora de fin no puede ser menor que la de inicio"
                              );
                              return;
                            }
                          }
                        } else if (fechaFin < fechaInicio) {
                          toast.error(
                            "La fecha de fin no puede ser menor que la de inicio"
                          );
                          return;
                        }
                      }

                      actualizarDetalleMultiple(0, {
                        CUANDO_FIN: fecha !== null && fecha !== undefined ? fecha : "",
                        CUANDO_FIN_HORA: hora !== null && hora !== undefined ? hora : "",
                      });
                    }}
                    min={
                      detalles[0].CUANDO_INICIO
                        ? (() => {
                            try {
                              const [day, month, year] = detalles[0].CUANDO_INICIO.split("/");
                              return new Date(year, month - 1, day);
                            } catch {
                              return null;
                            }
                          })()
                        : null
                    }
                    minHora={detalles[0].CUANDO_INICIO_HORA || ""}
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="COMO"
                    placeholder="¿Cómo?"
                    value={detalles[0].COMO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "COMO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="RECURSO"
                    placeholder="Recursos necesarios"
                    value={detalles[0].RECURSO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "RECURSO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="TIEMPO (días)"
                    type="number"
                    placeholder="0.0"
                    value={detalles[0].TIEMPO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "TIEMPO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <InputUI
                    label="DINERO ($)"
                    type="number"
                    placeholder="0.00"
                    value={detalles[0].DINERO}
                    onChange={(valor) =>
                      actualizarDetalle(0, "DINERO", valor)
                    }
                  />
                </FormRow>
                <FormRow>
                  <CheckboxContainer>
                    <input
                      type="checkbox"
                      checked={detalles[0].ESTADO || false}
                      onChange={(e) =>
                        actualizarDetalle(0, "ESTADO", e.target.checked)
                      }
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      style={{
                        fontSize: "13px",
                        color: theme.colors.text,
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Estado (Completado)
                    </label>
                  </CheckboxContainer>
                </FormRow>
              </DetailGrid>
            </FormSection>
          )}
        </ModalContent>
      </ModalUI>

      {/* Modal para editar cabecera */}
      <ModalUI
        isOpen={mostrarModalEditarCabecera}
        onClose={() => {
          setMostrarModalEditarCabecera(false);
          setCabeceraIdEditar(null);
        }}
        title="Editar Cabecera"
        maxWidth="800px"
        width="95%"
        maxHeight="90vh"
        onSave={handleGuardar}
        saveText="Guardar"
      >
        <ModalContent>
          {/* Sección de Cabecera */}
          <FormSection>
            <SectionTitle>Información General</SectionTitle>
            <FormRowTwoColumns>
              <FormRow>
                <InputUI
                  label="QUE"
                  placeholder="¿Qué se va a hacer?"
                  value={cabecera.QUE}
                  onChange={(valor) => setCabecera({ ...cabecera, QUE: valor })}
                />
              </FormRow>
              <FormRow>
                <InputUI
                  label="PORQUE"
                  placeholder="¿Por qué se va a hacer?"
                  value={cabecera.PORQUE}
                  onChange={(valor) => setCabecera({ ...cabecera, PORQUE: valor })}
                />
              </FormRow>
            </FormRowTwoColumns>
          </FormSection>
        </ModalContent>
      </ModalUI>

      {/* Modal de confirmación para cambiar estado */}
      <ConfirmationDialog
        isOpen={mostrarConfirmacionEstado}
        onClose={() => {
          setMostrarConfirmacionEstado(false);
          setDetalleCambiarEstado(null);
          setEstadoConfirmacion(0);
        }}
        onConfirm={handleConfirmarCambioEstado}
        title={
          detalleCambiarEstado?.estadoActual
            ? "¿Estás seguro que deseas marcar este registro como pendiente?"
            : "¿Estás seguro que deseas completar este registro?"
        }
        successState={estadoConfirmacion}
        onSuccess={handleCerrarConfirmacionEstado}
        successMessage="Estado actualizado exitosamente"
        errorMessage="Error al actualizar el estado"
      >
        <p>
          {detalleCambiarEstado?.estadoActual
            ? "El registro será marcado como pendiente."
            : "El registro será marcado como completado."}
        </p>
      </ConfirmationDialog>
    </div>
  );
};
