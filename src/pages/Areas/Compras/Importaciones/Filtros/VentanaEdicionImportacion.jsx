import { useEffect, useState, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { NegociacionForwarder } from "./SeccionesImportaciones/NegociacionForwarder";
import { DocumentosProveedor } from "./SeccionesImportaciones/DocumentosProveedor";
import { Transacciones } from "./SeccionesImportaciones/Transacciones";
import { PermisosImportacion } from "./SeccionesImportaciones/PermisosImportacion";
import { Nacionalizacion } from "./SeccionesImportaciones/Nacionalizacion";
import { Movilizacion } from "./SeccionesImportaciones/Movilizacion";
import { IngresoABodega } from "./SeccionesImportaciones/IngresoABodega";
import { Pricing } from "./SeccionesImportaciones/Pricing";
import { General } from "./SeccionesImportaciones/General";
import {
  BuscarDatosPorIDCarga,
  FinalizarImportacion,
  ObtenerEstadosdeFinalizacion,
} from "services/importacionesService";
import { CamionLoader } from "assets/styles/Loaders/CamionLoader";
import { hexToRGBA } from "utils/colors";
import { separarFechaHora } from "../UtilsImportaciones";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import IconUI from "components/UI/Components/IconsUI";

// Utilidades para formateo de fechas
const formatUtils = {
  // Formatea fecha en formato dd/mm/yyyy
  formatearFecha: (fechaISO) => {
    if (!fechaISO) return "";
    const fechabase = new Date(fechaISO);
    const fecha = new Date(fechabase.getTime() + 24 * 60 * 60 * 1000);
    if (isNaN(fecha.getTime())) return "";

    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const año = fecha.getFullYear();

    return `${dia}/${mes}/${año}`;
  },

  // Formato de bodega
  formatearFechadeBodega: (dateString) => {
    if (dateString === null) return "";

    const date = new Date(dateString);
    const dia = date.getDate().toString().padStart(2, "0");
    const mes = (date.getMonth() + 1).toString().padStart(2, "0");
    const año = date.getFullYear();
    return `${dia}/${mes}/${año}`;
  },

  // Formato de hora 12h
  obtenerHoraFormato12: (dateString) => {
    if (dateString === null) return "";

    const date = new Date(dateString);
    let hora = date.getHours();
    const minutos = date.getMinutes().toString().padStart(2, "0");
    const esPM = hora >= 12;
    const horaFormato12 = hora % 12 || 12;

    return `${horaFormato12}:${minutos} ${esPM ? "PM" : "AM"}`;
  },

  // Convertir blob a archivo
  convertirABlobYArchivo2: (archivo) => ({
    nombreArchivo: archivo.NOMBRE_ARCHIVO,
    extensionArchivo: archivo.EXTENSION,
    idDocumento: archivo.ID_DOCUMENTO,
  }),
};

const intro = keyframes`
    from {
        opacity: 0;
        scale: 0.6;
    }
    to {
        opacity: 1;
        scale: 1;
    }
`;
const introFondo = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const ContenedorPrincipal = styled.div`
  display: flex;
  padding: 15px;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.overlay || theme.colors.black, alpha: 0.6 })};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  animation: ${introFondo} 0.2s ease-in-out;
`;
const ContenedorVentana = styled.div`
  display: flex;
  flex-direction: row;
  padding: 5px;
  width: fit-content;
  min-width: 800px;
  height: 95%;
  border-radius: 20px;
  animation: ${intro} 0.8s ease-in-out;
`;
const ContenedorVentanaP = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  width: fit-content;
  min-width: 800px;
  height: 95%;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.modalBackground || theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.text};
  position: absolute;
  top: 5px;
  left: 50%;
  translate: -50%;
  z-index: 101;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 0 10px rgba(0, 0, 0, 0.3)"};
  animation: ${intro} 0.8s ease-in-out;
`;
const ContenedorBarraLateral = styled.div`
  display: flex;
  justify-content: left;
  align-items: start;
  flex-direction: column;
  min-width: 200px;
  width: 15%;
`;
const ContenedorInformacion = styled.div`
  display: flex;
  padding: 25px;
  width: 100%;
  min-width: 650px;
  background-color: ${({ theme }) => theme.name === "dark" 
    ? theme.colors.backgroundDark || theme.colors.backgroundCard
    : theme.colors.background || theme.colors.backgroundCard};
  border-radius: 10px;
  overflow-y: auto;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.border || "transparent"};
`;
const BotonCerrar = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
  cursor: pointer;
  padding: 0 5px;
  margin: 0;
  border-radius: 0 5px 0 5px;
  background-color: ${({ theme }) => theme.colors.error};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.error, alpha: 0.8 })};
  }
  
  & > i {
    color: ${({ theme }) => theme.colors.white};
    font-size: 20px;
    transition: color 0.2s ease;
  }
`;

const ContendorSecciones = styled.div`
  display: block;
  width: 100%;
  margin: 10% 0;
  color: ${({ theme }) => theme.colors.text};
  
  & .botonFinalizar {
    border-radius: 5px;
    padding: 10px;
    margin: 5px;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    border: none;
    box-shadow: ${({ theme }) => theme.colors.boxShadow || "0px 0px 5px rgba(0, 0, 0, 0.2)"};
    transition: all 0.5s ease;
    &:hover {
      transform: scale(1.02);
      background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.primary, alpha: 0.9 })};
    }
  }
  & > div {
    width: 100%;
    padding: 6px 2px 6px 10px;
    position: relative;
    user-select: none;
    display: flex;
    justify-content: stretch;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text};
    &:last-child {
      border: none;
    }
    & > .indicador {
      background-color: ${({ theme }) => theme.colors.success};
      transition: transform 0.5s ease;
      min-width: 3px;
      width: 3px;
      &.actual {
        background-color: ${({ theme }) => theme.colors.error};
      }
    }
    & > span {
      &.mayor {
        color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
      }
    }
    &.active {
      background-color: ${({ theme }) => theme.colors.backgroundLight || theme.colors.hover};
      border-radius: 5px 0 0 5px;
      color: ${({ theme }) => theme.colors.primary};

      & > .indicador {
        transform: translateX(185px);
        background-color: ${({ theme }) => theme.colors.primary};
      }
    }
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.backgroundLight || theme.colors.hover};
    }
  }
`;

const Boton1 = styled.button`
  outline: none;
  border-radius: 5px;
  background-color: transparent;
  &.confirmar {
    border: solid 1px ${({ theme }) => theme.colors.success};
    color: ${({ theme }) => theme.colors.success};
    background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.white, alpha: 0.05 })};
    
    &:hover {
      background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.success, alpha: 0.1 })};
    }
  }
  &.cancelar {
    border: solid 1px ${({ theme }) => theme.colors.textSecondary || theme.colors.border};
    color: ${({ theme }) => theme.colors.textSecondary || theme.colors.text};
    background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.white, alpha: 0.05 })};
    
    &:hover {
      background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.textSecondary || theme.colors.border, alpha: 0.1 })};
    }
  }
`;

// Configuración de secciones
const SECCIONES_CONFIG = [
  {
    id: 0,
    nombre: "GENERAL",
    componente: General,
    campos: [
      "PLAZO_PROVEEDOR",
      "ESTADO_CARGA",
      "ESTADO_IMPORTACION",
      "OBSERVACION",
      "USUARIO_ASIGNADO",
      "PI_PROVISIONAL",
      "ETAPA",
      "CLIENTES",
    ],
    requierePermiso: false,
  },
  {
    id: 1,
    nombre: "NEGOCIACIÓN FORWARDER",
    componente: NegociacionForwarder,
    campos: [
      "FECHA_ENTREGA_OFRECIDA",
      "ETD",
      "ETA",
      "CONTENEDORES_ESTIMADOS",
      "DIAS_LIBRES",
      "CODIGO_FORWARDER",
      "AGENTE_FORWARDER",
      "FLETE_ESTIMADO",
      "FLETE_DEFINITIVO",
      "THC",
      "ESTADO_FORWARDER",
    ],
    requierePermiso: true,
    tipoPermiso: "compras",
  },
  {
    id: 2,
    nombre: "DOCUMENTOS PROVEEDOR",
    componente: DocumentosProveedor,
    campos: [
      "PI",
      "IMP",
      "FACTURA_RESERVA",
      "TIEMPO_TRANSITO_ESTIMADO_DIAS",
      "FECHA_ENTREGA_REAL_PRODUCCION_VENDEDOR",
      "ATD",
      "ATA",
      "FECHA_OPERACION",
      "ESTADO_LIBERACION_DOCUMENTOS",
      "NUMERO_TRACKING_DOCUMENTOS",
      "DOCUMENTOS",
      "DOCUMENTOS_PARA_BODEGA",
      "COMENTARIO_1",
      "COMENTARIO_2",
    ],
    requierePermiso: false,
  },
  {
    id: 3,
    nombre: "PERMISOS IMPORTACIÓN",
    componente: PermisosImportacion,
    campos: [
      "POLIZA",
      "VALOR_POLIZA",
      "INEN",
      "PERMISOS_ECA",
      "PERMISOS_MINSA",
      "PERMISOS_FAD",
    ],
    requierePermiso: true,
    tipoPermiso: "compras",
  },
  {
    id: 4,
    nombre: "TRANSACCIONES",
    componente: Transacciones,
    campos: [
      "ESTADO_PAGO",
      "SALDO_POR_PAGAR",
      "FECHA_SALDO_PAGAR",
      "FECHA_PAGO_TOTAL",
    ],
    requierePermiso: true,
    tipoPermiso: "compras",
  },
  {
    id: 5,
    nombre: "NACIONALIZACIÓN",
    componente: Nacionalizacion,
    campos: [
      "ESTADO_MRN",
      "FECHA_PAGO_ARANCEL",
      "VALOR_ARANCEL",
      "TIPO_AFORO",
      "TIEMPO_TRANSITO_REAL",
      "AGENTE_ADUANERO",
      "ENTREGA_AGENTE",
      "ESTADO_SALIDA_AUTORIZADA",
      "NUM_LIQUIDACION",
      "FECHA_LIBERACION",
      "NUM_DAI",
    ],
    requierePermiso: true,
    tipoPermiso: "compras",
  },
  {
    id: 6,
    nombre: "MOVILIZACIÓN",
    componente: Movilizacion,
    campos: [
      "FECHA_SALIDA_BODEGA",
      "LLEGADA_ESTIMADA_BODEGA",
      "TRANSPORTE_ASIGNADO",
    ],
    requierePermiso: false,
  },
  {
    id: 7,
    nombre: "INGRESO A BODEGA",
    componente: IngresoABodega,
    campos: [
      "LLEGADA_REAL",
      "HORA_LLEGADA_REAL",
      "FECHA_DESCARGA",
      "HORA_FECHA_DESCARGA",
      "CONFIRME_IMPORTACION",
      "ARCHIVOS_BODEGA",
      "VALIDACION_INGRESO_BODEGA",
      "OBSERVACION_BODEGA",
    ],
    requierePermiso: false,
  },
  {
    id: 8,
    nombre: "PRICING",
    componente: Pricing,
    campos: ["CARGA", "ENVIO"],
    requierePermiso: true,
    tipoPermiso: "compras",
  },
];

// Componente BarraLateralImportacion refactorizado
const BarraLateralImportacion = ({
  establecerSeccion,
  seccionActual,
  etapa,
  docdecisivo,
  id,
  validacionDeDatos,
  actualizarTabla,
  estadoImportacion,
  cerrarVentana,
  permisos,
  seccionesConErrores,
  actualizarSeccionesConErrores,
  rolesUsuario = [],
}) => {
  const { theme } = useTheme();
  const secciones = [
    "GENERAL",
    "NEGOCIACIÓN FORWARDER",
    "DOCUMENTOS PROVEEDOR",
    "PERMISOS IMPORTACIÓN",
    "TRANSACCIONES",
    "NACIONALIZACIÓN",
    "MOVILIZACIÓN",
    "INGRESO A BODEGA",
    "PRICING",
  ];
  const seccionesBodega = [
    "DOCUMENTOS PROVEEDOR",
    "MOVILIZACIÓN",
    "INGRESO A BODEGA",
  ];

  const camposSecciones = {
    ESTADO_CARGA: "GENERAL",
    ESTADO_FORWARDER: "NEGOCIACIÓN FORWARDER",
    ESTADO_DOCUMENTOS: "DOCUMENTOS PROVEEDOR",
    ESTADO_PAGO: "TRANSACCIONES",
    POLIZA: "PERMISOS IMPORTACIÓN",
    INEN: "PERMISOS IMPORTACIÓN",
    PERMISOS_ECA: "PERMISOS IMPORTACIÓN",
    PERMISOS_MINSA: "PERMISOS IMPORTACIÓN",
    PERMISOS_FAD: "PERMISOS IMPORTACIÓN",
    ENTREGA_AGENTE: "PERMISOS IMPORTACIÓN",
    ESTADO_MRN: "NACIONALIZACIÓN",
    TIPO_AFORO: "NACIONALIZACIÓN",
    ESTADO_SALIDA_AUTORIZADA: "NACIONALIZACIÓN",
    CONFIRME_IMPORTACION: "INGRESO A BODEGA",
    VALIDACION_INGRESO_BODEGA: "INGRESO A BODEGA",
  };

  const tieneRolVentas = rolesUsuario.includes("usuario");
  const tieneRolBodega = rolesUsuario.includes("bodega");
  const tieneRolJefatura = rolesUsuario.includes("jefatura");

  const [confirmarFin, setConfirmarFin] = useState(false);
  const [mensajeTerminar, setMensajeTerminar] = useState("");
  // Definir qué secciones deben mostrarse para cada etapa
  // const seccionesVisibles = secciones.slice(0, etapa);

  const enviarSeccion = (index) => {
    if (index >= etapa) {
    } else {
      establecerSeccion(index);
    }
  };

  const ValidarEstadosFin = async () => {
    const estadosF = await ObtenerEstadosdeFinalizacion();
    const datosSegunIDP = await BuscarDatosPorIDCarga(id);
    const datosSegunID = datosSegunIDP.importaciones;
    const datosID = datosSegunID[0];
    const esAutomax = datosID.EMPRESA === "AUTOMAX";

    // Definir campos a validar según la empresa
    const camposAValidar = !esAutomax
      ? {
          "ESTADO DE LA CARGA": "ESTADO_CARGA",
          "ESTADO MOVILIZACION": "ESTADO_FORWARDER",
          "ESTADO LIBERACION DOCUMENTOS": "ESTADO_DOCUMENTOS",
          "ESTADO DEL PAGO": "ESTADO_PAGO",
          "POLIZA (APLICACIÓN SEGURO)": "POLIZA",
          "PERMISOS INEN": "INEN",
          "ENTREGA DOCUMENTOS AGENTE": "ENTREGA_AGENTE",
          "ESTADO MRN": "ESTADO_MRN",
          "TIPO AFORO": "TIPO_AFORO",
          "ESTADO SALIDA AUTORIZADA": "ESTADO_SALIDA_AUTORIZADA",
          "RECIBI CONFIRME DE IMPORTACIÓN": "CONFIRME_IMPORTACION",
          "VALIDACIÓN DE INGRESO A BODEGA DE VENTAS":
            "VALIDACION_INGRESO_BODEGA",
        }
      : {
          "ESTADO DE LA CARGA": "ESTADO_CARGA",
          "ESTADO MOVILIZACION": "ESTADO_FORWARDER",
          "ESTADO LIBERACION DOCUMENTOS": "ESTADO_DOCUMENTOS",
          "ESTADO DEL PAGO": "ESTADO_PAGO",
          "POLIZA (APLICACIÓN SEGURO)": "POLIZA",
          "PERMISOS ECA": "PERMISOS ECA",
          "PERMISOS MINSA": "PERMISOS MINSA",
          "PERMISOS FAD": "PERMISOS FAD",
          "ESTADO MRN": "ESTADO_MRN",
          "TIPO AFORO": "TIPO_AFORO",
          "ESTADO SALIDA AUTORIZADA": "ESTADO_SALIDA_AUTORIZADA",
          "RECIBI CONFIRME DE IMPORTACIÓN": "CONFIRME_IMPORTACION",
          "VALIDACIÓN DE INGRESO A BODEGA DE VENTAS":
            "VALIDACION_INGRESO_BODEGA",
        };

    const replaceFields = (data, replacements) => {
      return data.map((item) => {
        const trimmedCampo = item.campo.trim();
        const newCampo = replacements.hasOwnProperty(trimmedCampo)
          ? replacements[trimmedCampo]
          : trimmedCampo;
        return {
          ...item,
          campo: newCampo,
        };
      });
    };

    const transformUpdatedData = (updatedData) => {
      const transformed = {};
      updatedData.forEach(({ campo, estado }) => {
        if (!transformed[campo]) {
          transformed[campo] = [];
        }
        transformed[campo].push(estado);
      });
      return transformed;
    };
    const updatedData = replaceFields(estadosF, camposAValidar);
    const transformedUpdatedData = transformUpdatedData(updatedData);

    // Filtrar transformedUpdatedData para mantener solo los campos que están en camposAValidar
    const camposAValidarValues = Object.values(camposAValidar);
    const filteredTransformedData = {};
    camposAValidarValues.forEach((campo) => {
      if (transformedUpdatedData[campo]) {
        filteredTransformedData[campo] = transformedUpdatedData[campo];
      }
    });

    const dataToValidate = camposAValidarValues.map((campo) => {
      return {
        campo,
        estado: updatedData[campo],
      };
    });

    const compareData = (filteredTransformedData, datosSegunID) => {
      const results = Object.keys(filteredTransformedData).map((campo) => {
        const possibleValues = filteredTransformedData[campo];
        const correspondingValue = datosSegunID[campo];
        const isEqual = possibleValues.includes(correspondingValue);
        return {
          campo,
          seccion: camposSecciones[campo],
          possibleValues,
          correspondingValue,
          isEqual,
        };
      });


      return results;
    };
    const comparisonResults = compareData(filteredTransformedData, datosID);
    const allMatch = comparisonResults.every((result) => result.isEqual);

    if (!allMatch) {
      const seccionesErroneas = comparisonResults
        .filter((result) => !result.isEqual)
        .map((result) => result.seccion);

      // Usar la prop en lugar de setImportData
      actualizarSeccionesConErrores(seccionesErroneas);
    } else {
      // Usar la prop en lugar de setImportData
      actualizarSeccionesConErrores([]);
    }

    return allMatch;
  };

  const FinImportacion = async () => {
    const val = await ValidarEstadosFin();

    if (!val) {
      setConfirmarFin(false);

      setMensajeTerminar(
        "Por favor, revise todas las secciones, todos los campos de seleccionar deben estar en su estado final."
      );
    } else {
      const res = await FinalizarImportacion({ id });
      if (res.update === 0) {
        setConfirmarFin(false);

        setMensajeTerminar(
          "Por favor, revise todas las secciones, ya que falta completar algún campo antes de finalizar."
        );
      } else {
        setTimeout(() => {
          setConfirmarFin(false);
          cerrarVentana(false);
          actualizarTabla();
        }, 1000);
      }
    }
  };

  const finalizarImportacionBoton = () => {
    setConfirmarFin(true);
    setMensajeTerminar("");
  };

  const ejecutarValidaciondeDatos = async () => {
    await ValidarEstadosFin();
  };
  useEffect(() => {
    ejecutarValidaciondeDatos();
  }, [validacionDeDatos]);

  useEffect(() => {
    const fetch = async () => {
      await ValidarEstadosFin();
    };
    fetch();
  }, []);

  const seccionesAMostrar =
    tieneRolVentas || tieneRolJefatura
      ? secciones
      : seccionesBodega;

  return (
    <ContendorSecciones style={{ overflowY: "auto" }}>
      {seccionesAMostrar.map((nombreSeccion, index) => {
        const realIndex = secciones.indexOf(nombreSeccion); // Encontrar el índice real en el array original
        return (
          <div
            key={index}
            onClick={() => enviarSeccion(realIndex)}
            className={`${seccionActual === realIndex ? "active" : ""}`}
          >
            <div
              className={`indicador ${realIndex + 1 > etapa && "actual"}`}
              style={{ display: "block", width: "3px" }}
            ></div>
            <span className={`${realIndex + 1 > etapa && "mayor"}`}>
              {nombreSeccion}{" "}
              {seccionesConErrores.includes(nombreSeccion) &&
                realIndex + 1 <= etapa && (
                  <IconUI name="FaCircleExclamation" size={14} color={theme.colors.warning} />
                )}
            </span>
          </div>
        );
      })}
      {etapa >= 9 &&
        tieneRolVentas &&
        !tieneRolJefatura &&
        docdecisivo === "SI" &&
        estadoImportacion === "EN PROCESO" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              paddingRight: "10px",
            }}
          >
            <button
              className="botonFinalizar"
              onClick={() => finalizarImportacionBoton()}
            >
              FINALIZAR IMPORTACIÓN
            </button>
            {confirmarFin && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                <div>¿Seguro desea finalizar la importación?</div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    gap: "3px",
                  }}
                >
                  <Boton1
                    className="confirmar"
                    style={{ width: "100%" }}
                    onClick={() => FinImportacion()}
                  >
                    Confirmar
                  </Boton1>
                  <Boton1
                    className="cancelar"
                    style={{ width: "100%" }}
                    onClick={() => setConfirmarFin(false)}
                  >
                    Cancelar
                  </Boton1>
                </div>
              </div>
            )}
            {mensajeTerminar !== "" && <span>{mensajeTerminar}</span>}
          </div>
        )}
      {estadoImportacion === "COMPLETO" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "15px",
              justifyContent: "center",
              textAlign: "center",
              border: `solid 1px ${theme.colors.secondary}`,
              borderRadius: "10px",
              color: theme.colors.text || theme.colors.white,
            }}
          >
            LA IMPORTACIÓN YA FUE FINALIZADA
          </span>
        </div>
      )}
    </ContendorSecciones>
  );
};

export const VentanaEdicionImportacion = ({
  mostrarVentanaEdicion,
  dataImportacion,
  actualizarTabla,
  routeConfig,
}) => {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [seccionActual, setSeccionActual] = useState(0);
  const [seccionesConErrores, setSeccionesConErrores] = useState([]);
  const [actualizacionCounter, setActualizacionCounter] = useState(0);

  // Usar el rol que viene del routeConfig (ya calculado en el router)
  const rolesUsuario = useMemo(() => {
    if (routeConfig?.rolDelRecurso) {
      return [routeConfig.rolDelRecurso];
    }
    return [];
  }, [routeConfig]);

  const tieneRolVentas = rolesUsuario.includes("usuario");
  const tieneRolBodega = rolesUsuario.includes("bodega");
  const tieneRolJefatura = rolesUsuario.includes("jefatura");

  // Crear objeto de permisos para compatibilidad con componentes hijos
  const permisos = useMemo(() => ({
    bodega: tieneRolBodega ? [{ empresa: "ALL" }] : [],
    compras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
    comprasGerencias: tieneRolJefatura ? [{ empresa: "ALL" }] : [],
  }), [tieneRolBodega, tieneRolVentas, tieneRolJefatura]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      // 1. Cargar datos principales
      const resp = await BuscarDatosPorIDCarga(dataImportacion);

      if (!resp || !resp.importaciones || resp.importaciones.length === 0) {
        console.error("No se encontraron datos para esta importación");
        setCargando(false);
        return;
      }

      // Los permisos ahora se basan en roles del usuario
      // No necesitamos consultar permisos por módulo, solo usar los roles

      // 3. Guardar datos en el estado
      setDatos(resp);
      setCargando(false);

      // Incrementar el contador de actualizaciones para forzar la re-renderización
      setActualizacionCounter((prev) => prev + 1);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setCargando(false);
    }
  };

  // Función de actualización que pueden usar las secciones
  const actualizarDatos = async () => {
    await cargarDatos();
    // No es necesario llamar a actualizarTabla aquí, solo cuando se cierra la ventana
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [dataImportacion]);

  // Determinar qué secciones mostrar según permisos
  const seccionesPermitidas = useMemo(() => {
    const tienePermisoCompras = tieneRolVentas || tieneRolJefatura;

    return SECCIONES_CONFIG.filter(
      (seccion) =>
        !seccion.requierePermiso ||
        (seccion.tipoPermiso === "compras" && tienePermisoCompras)
    );
  }, [tieneRolVentas, tieneRolJefatura]);

  // Actualizar un campo específico
  const actualizarCampo = (campo, valor) => {
    if (!datos) return;

    // Clonar el primer elemento de importaciones para actualizarlo
    const importacionActualizada = {
      ...datos.importaciones[0],
      [campo]: valor,
    };

    // Actualizar el estado
    setDatos({
      ...datos,
      importaciones: [importacionActualizada, ...datos.importaciones.slice(1)],
    });
  };

  // Renderizar componente de sección actual
  const renderizarSeccion = () => {
    if (!datos || !datos.importaciones || datos.importaciones.length === 0) {
      return <div>No hay datos disponibles</div>;
    }

    const seccion = seccionesPermitidas.find((s) => s.id === seccionActual);
    if (!seccion) return <div>Sección no disponible</div>;

    // Crear una copia segura de los datos donde TODOS los valores nulos se convierten a sus valores por defecto
    const datosCrudos = datos.importaciones[0];

    // Lista de campos que sabemos que son fechas
    const camposFecha = [
      "FECHA_ENTREGA_OFRECIDA",
      "ETD",
      "ETA",
      "FECHA_SALDO_PAGAR",
      "FECHA_PAGO_TOTAL",
      "FECHA_PAGO_ARANCEL",
      "FECHA_LIBERACION",
      "FECHA_ENTREGA_REAL_PRODUCCION_VENDEDOR",
      "ATD",
      "ATA",
      "FECHA_OPERACION",
    ];

    // Lista de campos que contienen fecha Y hora que no deben transformarse
    const camposFechaHora = [
      "LLEGADA_REAL",
      "FECHA_DESCARGA",
      "FECHA_SALIDA_BODEGA",
      "LLEGADA_ESTIMADA_BODEGA",
    ];

    // Función para verificar si un valor es una fecha ISO
    const esFormatoFechaISO = (valor) => {
      if (typeof valor !== "string") return false;
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(valor);
    };

    // Función para formatear una fecha
    const formatearFecha = (fechaISO) => {
      if (!fechaISO) return null;
      try {
        // Si ya está en formato dd/mm/yyyy, devolverla sin cambios
        if (
          typeof fechaISO === "string" &&
          /^\d{2}\/\d{2}\/\d{4}$/.test(fechaISO)
        ) {
          return fechaISO;
        }

        // Si es una cadena ISO, extraer los componentes directamente de la cadena
        if (
          typeof fechaISO === "string" &&
          fechaISO.match(/^\d{4}-\d{2}-\d{2}/)
        ) {
          // Extraer directamente año, mes y día de la cadena ISO
          const [año, mes, dia] = fechaISO.split("T")[0].split("-");
          return `${dia}/${mes}/${año}`;
        }

        // Para otros formatos, usar el objeto Date (casos menos comunes)
        const fecha = new Date(fechaISO);
        if (isNaN(fecha.getTime())) return fechaISO; // Si no es una fecha válida, devolver el valor original

        const dia = fecha.getDate().toString().padStart(2, "0");
        const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
        const año = fecha.getFullYear();

        return `${dia}/${mes}/${año}`;
      } catch (error) {
        console.error("Error formateando fecha:", error);
        return fechaISO; // En caso de error, devolver el valor original
      }
    };

    // Crear una copia segura de los datos y asegurar que CLIENTES siempre sea un array
    // Asegurar que todos los campos tengan valores válidos
    const datosSeguros = {
      ...Object.keys(datosCrudos).reduce((acc, key) => {
        // Si es un valor potencialmente array (como CLIENTES, DOCUMENTOS, etc.)
        if (
          key === "CLIENTES" ||
          key === "DOCUMENTOS" ||
          key === "DOCUMENTOS_PARA_BODEGA" ||
          key === "ARCHIVOS_BODEGA" ||
          key === "CARGA" ||
          key === "ENVIO"
        ) {
          acc[key] = datosCrudos[key] || [];
        }
        // Si es un campo que contiene fecha Y hora (separar en dos campos)
        else if (camposFechaHora.includes(key)) {
          // Preservar el valor original para compatibilidad
          acc[key] = datosCrudos[key];

          // Separar en fecha y hora usando la función
          if (datosCrudos[key]) {
            const { fecha, hora } = separarFechaHora(datosCrudos[key]);

            // Crear campos separados con prefijos FECHA_ y HORA_
            acc[`FECHA_${key}`] = fecha;
            acc[`HORA_${key}`] = hora;
          } else {
            // Si es null o undefined, asignar valores vacíos
            acc[`FECHA_${key}`] = "";
            acc[`HORA_${key}`] = "";
          }
        }
        // Si es un campo de fecha conocido o tiene formato de fecha ISO
        else if (
          camposFecha.includes(key) ||
          esFormatoFechaISO(datosCrudos[key])
        ) {
          acc[key] = formatearFecha(datosCrudos[key]);
        }
        // Para campos de texto u otros tipos
        else {
          acc[key] = datosCrudos[key];
        }
        return acc;
      }, {}),
      // Asegurar que CLIENTES siempre sea un array
      CLIENTES: datos.cliente?.SOCIOS_NEGOCIO || [],
    };
    const SeccionComponente = seccion.componente;

    return (
      <SeccionComponente
        datos={datosSeguros}
        datos1={datosSeguros}
        setDatos={actualizarCampo}
        actualizar={actualizarDatos}
        permisosProp={permisos}
        rolesUsuario={rolesUsuario}
      />
    );
  };

  // Actualizar secciones con errores
  const actualizarSeccionesConErrores = (seccionesErroneas) => {
    setSeccionesConErrores(seccionesErroneas);
  };

  if (cargando) {
    return (
      <ContenedorPrincipal>
        <ContenedorVentanaP>
          <CamionLoader />
        </ContenedorVentanaP>
      </ContenedorPrincipal>
    );
  }

  return (
    <ContenedorPrincipal>
      <ContenedorVentanaP>
        <BotonCerrar
          onClick={() => {
            mostrarVentanaEdicion(false);
            actualizarTabla();
          }}
        >
          <IconUI name="FaXmark" size={14} color={theme.colors.text} />
        </BotonCerrar>

        <div style={{ display: "flex", width: "100%" }}>
          <h4
            style={{
              display: "flex",
              borderBottom: `solid 1px ${theme.colors.border || theme.colors.textSecondary}`,
              paddingBottom: "5px",
              width: "100%",
              gap: "8px",
              color: theme.colors.text,
            }}
          >
            Edición Importación
            <span>{datos?.importaciones[0]?.ID_CARGA}</span>
          </h4>
        </div>

        {datos && datos.importaciones && datos.importaciones.length > 0 ? (
          <ContenedorVentana>
            <ContenedorBarraLateral>
              <BarraLateralImportacion
                establecerSeccion={setSeccionActual}
                seccionActual={seccionActual}
                etapa={datos.importaciones[0].ETAPA || 1}
                docdecisivo={datos.importaciones[0].PRICING_ENVIADO}
                id={datos.importaciones[0].ID_CARGA}
                actualizarTabla={actualizarTabla}
                cerrarVentana={mostrarVentanaEdicion}
                estadoImportacion={datos.importaciones[0].ESTADO_IMPORTACION}
                validacionDeDatos={actualizacionCounter}
                permisos={permisos}
                seccionesConErrores={seccionesConErrores}
                actualizarSeccionesConErrores={actualizarSeccionesConErrores}
                rolesUsuario={rolesUsuario}
              />
            </ContenedorBarraLateral>

            <ContenedorInformacion>{renderizarSeccion()}</ContenedorInformacion>
          </ContenedorVentana>
        ) : (
          <div>No se encontraron datos para esta importación</div>
        )}
      </ContenedorVentanaP>
    </ContenedorPrincipal>
  );
};
