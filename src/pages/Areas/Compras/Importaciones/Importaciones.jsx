import React, { useEffect, useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { CampoFiltro, CampoFiltroporFecha } from "./Filtros/Filtros";
import { FiltroGlobalDesplegable } from "./Filtros/FiltroGlobalDesplegable";
import { TablaImportaciones } from "./Filtros/TablaImportaciones";
import { ExportToExcelUI } from "components/UI/Components/ExportarAExcelUI";
import { CreacionRegistro } from "./Filtros/CreacionRegistro";
import { VentanaEdicionImportacion } from "./Filtros/VentanaEdicionImportacion";
import {
  EjecutarBatImportaciones,
  ListarImportaciones,
} from "services/importacionesService";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";


// Estilos
const ContenedorPrincipal = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
`;

const ContenedorFiltrosP = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  padding: 5px;
  border-bottom: solid 1px ${({ theme }) => theme.colors.border || "#cfcfcf"};
  width: 100%;
  gap: 15px;
`;

const ContenedorFiltros = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: start;
  flex-direction: row;
  gap: 10px;
`;

const ContenedorTabla = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const TextoMensaje = styled.p`
  color: ${({ theme }) => theme.colors.text || "#212529"};
`;

const TextoNoData = styled.span`
  width: 100%;
  text-align: center;
  padding-top: 15px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
`;

const TextoRegistros = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary || "#fd4703"};
`;


// Este componente maneja múltiples roles: ventas (IMPORTACIONES), bodega (BODEGA), jefatura (COMPRAS-GERENCIA)

const EXCEL_CONFIG = {
  datosOcultos: [
    "CODIGO_EMPRESA",
    "CODIGO_PROVEEDOR",
    "CODIGO_MARCA",
    "COMENTARIO_2",
    "USUARIO_ASIGNADO",
    "ETAPA",
  ],
  nombresPersonalizados: {
    ID_CARGA: "ID IMPORTACION",
    PEDIDO: "PEDIDOS",
    MARCA: "MARCA/S",
    FECHA_ENTREGA_OFRECIDA: "FECHA ENTREGA OFRECIDA",
    CONTENEDORES_ESTIMADOS: "CONTENEDORES ESTIMADOS",
    DIAS_LIBRES: "DÍAS LIBRES",
    CODIGO_FORWARDER: "CÓDIGO FORWARDER",
    AGENTE_FORWARDER: "AGENTE FORWARDER",
    FLETE_ESTIMADO: "FLETE ESTIMADO",
    FLETE_DEFINITIVO: "FLETE DEFINITIVO",
    ESTADO_FORWARDER: "ESTADO FORWARDER",
    NUMERO_TRANSITO: "NÚMERO TRANSITO",
    NUMERO_PI: "PI",
    NUMERO_PIP: "PI PROVISIONAL",
    FECHA_ENTREGA_REAL: "FECHA ENTREGA REAL",
    ESTADO_TRANSITO: "ESTADO TRANSITO",
    TIEMPO_TRANSITO_ESTIMADO: "TIEMPO TRANSITO ESTIMADO (DÍAS)",
    ESTADO_DOCUMENTOS: "ESTADO DOCUMENTOS",
    NUMERO_TRACKING: "NÚMERO TRACKING",
    ESTADO_PAGO: "ESTADO PAGO",
    SALDO_POR_PAGAR: "SALDO POR PAGAR ($)",
    FECHA_SALDO_PAGAR: "FECHA SALDO PAGAR",
    FECHA_PAGO_TOTAL: "FECHA PAGO TOTAL",
    VALOR_POLIZA: "VALOR_POLIZA ($)",
    AGENTE_ADUANERO: "AGENTE ADUANERO",
    ENTREGA_AGENTE: "ENTREGA AGENTE",
    ESTADO_MRN: "ESTADO MRN",
    FECHA_PAGO_ARANCEL: "FECHA PAGO ARANCEL",
    VALOR_ARANCEL: "VALOR ARANCEL",
    TIPO_AFORO: "TIPO AFORO",
    TIEMPO_TRANSITO_REAL: "TIEMPO TRÁNSITO REAL",
    ESTADO_SALIDA_AUTORIZADA: "ESTADO SALIDA AUTORIZADA",
    NUM_LIQUIDACION: "NÚMERO LIQUIDACIÓN",
    FECHA_LIBERACION: "FECHA LIBERACIÓN",
    NUM_DAI: "NÚMERO DAI",
    FECHA_SALIDA_BODEGA: "FECHA SALIDA BODEGA",
    LLEGADA_ESTIMADA_BODEGA: "LLEGADA ESTIMADA BODEGA",
    TRANSPORTE_ASIGNADO: "TRANSPORTE ASIGNADO",
    LLEGADA_REAL: "LLEGADA REAL",
    FECHA_DESCARGA: "FECHA DESCARGA",
    OBSERVACION_BODEGA: "OBSERVACIÓN BODEGA",
    CONFIRME_IMPORTACION: "CONFIRME IMPORTACIÓN",
    VALIDACION_INGRESO_BODEGA: "VALIDACIÓN INGRESO BODEGA",
    PLAZO_PROVEEDOR: "PLAZO PROVEEDOR",
    COMENTARIO_1: "COMENTARIO 1",
    ESTADO_CARGA: "ESTADO CARGA",
    ESTADO_IMPORTACION: "ESTADO IMPORTACIÓN",
    OBSERVACION: "OBSERVACIÓN GENERAL",
    FACTURA_RESERVA: "FACTURA RESERVA",
    PRICING_ENVIADO: "PRICING ENVIADO",
  },
};

// Componente principal de Importaciones
export const Importaciones = ({
  routeConfig,
  availableCompanies, // Del nuevo sistema de recursos (ProtectedContent)
  availableLines, // Del nuevo sistema de recursos (ProtectedContent)
}) => {
  const { theme } = useTheme();
  const { user } = useAuthContext();

  // Convertir availableCompanies al formato esperado
  const empresasDisponibles = useMemo(() => {
    if (availableCompanies && availableCompanies.length > 0) {
      // Convertir { id, nombre } a { empresa: nombre, idempresa: id } para compatibilidad
      return availableCompanies.map(emp => ({
        empresa: emp.nombre,
        idempresa: emp.id,
      }));
    }
    return [];
  }, [availableCompanies]);

  // Usar el rol específico del contexto del recurso que viene del router
  const rolesUsuario = useMemo(() => {
    if (routeConfig?.rolDelRecurso) {
      return [routeConfig.rolDelRecurso];
    }
    return [];
  }, [routeConfig]);
  // Estados para datos y filtros
  const [importacionesData, setImportacionesData] = useState([]);
  const [datosFiltradosExcel, setDatosFiltradosExcel] = useState([]);
  const [cantidadRegistrosFiltrados, setCantidadRegistrosFiltrados] =
    useState(0);
  const [contadorActualizaciones, setContadorActualizaciones] = useState(0);

  // Estados para modales
  const [modalConfig, setModalConfig] = useState({
    crearVisible: false,
    editarVisible: false,
    idImportacionEditar: "",
  });

  // Estados para filtros
  const [filtroGlobal, setFiltroGlobal] = useState({ value: "", campo: "" });
  const [filtrosActivos, setFiltrosActivos] = useState([
    { filtro: 0, valor: [] },
    { filtro: 1, valor: [] },
    { filtro: 2, valor: [] },
    { filtro: 3, valor: [] },
    { filtro: 4, valor: [] },
    { filtro: 5, valor: [] },
    { filtro: 6, valor: { months: [], year: null } },
  ]);

  // Los permisos se obtienen automáticamente del HOC
  // empresasAcceso contiene las empresas a las que el usuario tiene acceso

  // Funciones para manejar filtros - Refactorizadas
  const actualizarFiltro = useCallback((tipoFiltro, indice, nuevoValor) => {
    if (tipoFiltro === "global") {
      setFiltroGlobal((prevFiltro) => ({ ...prevFiltro, value: nuevoValor }));
    } else if (tipoFiltro === "globalCampo") {
      setFiltroGlobal((prevFiltro) => ({ ...prevFiltro, campo: nuevoValor }));
    } else if (tipoFiltro === "estandar") {
      setFiltrosActivos((prevFiltros) =>
        prevFiltros.map((filtro) =>
          filtro.filtro === indice
            ? {
                ...filtro,
                valor: nuevoValor !== "" ? nuevoValor.split("; ") : [],
              }
            : filtro
        )
      );
    } else if (tipoFiltro === "fecha") {
      setFiltrosActivos((prevFiltros) =>
        prevFiltros.map((filtro) =>
          filtro.filtro === indice
            ? {
                ...filtro,
                valor: { months: nuevoValor.months, year: nuevoValor.year },
              }
            : filtro
        )
      );
    }
  }, []);

  // Manipuladores de eventos refactorizados
  const handleChangeGlobalValue = useCallback(
    (valor) => {
      actualizarFiltro("global", null, valor);
    },
    [actualizarFiltro]
  );

  const handleChangeGlobalCampo = useCallback(
    (campo) => {
      actualizarFiltro("globalCampo", null, campo);
    },
    [actualizarFiltro]
  );

  const handleChange = useCallback(
    (indice, valor) => {
      actualizarFiltro("estandar", indice, valor);
    },
    [actualizarFiltro]
  );

  const handleChangeFecha = useCallback(
    (indice, valor) => {
      actualizarFiltro("fecha", indice, valor);
    },
    [actualizarFiltro]
  );

  // Funciones para gestionar modales
  const abrirModalCrear = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, crearVisible: true }));
  }, []);

  const abrirModalEditar = useCallback((id) => {
    if (!id) {
      console.error("Error: Se intentó abrir el modal sin un ID válido");
      return;
    }
    setModalConfig((prev) => ({
      ...prev,
      editarVisible: true,
      idImportacionEditar: id,
    }));
  }, []);

  const cerrarModales = useCallback(() => {
    setModalConfig({
      crearVisible: false,
      editarVisible: false,
      idImportacionEditar: "",
    });
  }, []);

  // Función para extraer valores únicos - Optimizada
  const extractUniqueValues = useCallback((data, key) => {
    const uniqueValues = new Map();
    let nextIndex = 0;

    data.forEach((item) => {
      const combinedValues = item[key];
      if (combinedValues) {
        combinedValues
          .split(";")
          .map((value) => value.trim())
          .filter(Boolean)
          .forEach((value) => {
            if (!uniqueValues.has(value)) {
              uniqueValues.set(value, nextIndex++);
            }
          });
      }
    });

    return Array.from(uniqueValues).map(([name, value]) => ({ value, name }));
  }, []);

  // Funciones para cargar datos
  const cargarImportaciones = useCallback(async () => {
    try {
      const resultado = await ListarImportaciones();
      if (resultado?.length > 0) {
        setImportacionesData(resultado);
        setDatosFiltradosExcel(resultado);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al cargar importaciones:", error);
      return false;
    }
  }, []);

  const ejecutarBatImportaciones = useCallback(async () => {
    try {
      const resultado = await EjecutarBatImportaciones();
      if (resultado) {
        await cargarImportaciones();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error ejecutando BAT:", error);
      return false;
    }
  }, [cargarImportaciones]);

  // Función para actualizar después de crear/editar
  const actualizarDespuesDeAccion = useCallback(() => {
    cargarImportaciones();
    setContadorActualizaciones((prev) => prev + 1);
    cerrarModales();
  }, [cargarImportaciones, cerrarModales]);

  // Los permisos vienen de routeConfig inyectado por SimpleRouter

  // Función para verificar ID en URL
  const verificarIdEnURL = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.size > 0) {
      const idImportacion = urlParams.get("id");
      if (idImportacion) {
        abrirModalEditar(idImportacion);
      }
    }
  }, [abrirModalEditar]);

  // Opciones de filtro memorizadas
  const opcionesFiltro = useMemo(() => {
    if (!importacionesData.length) return {};

    return {
      empresa: extractUniqueValues(importacionesData, "EMPRESA"),
      proveedor: extractUniqueValues(importacionesData, "PROVEEDOR"),
      marca: extractUniqueValues(importacionesData, "MARCA"),
      estadoCarga: extractUniqueValues(importacionesData, "ESTADO_CARGA"),
      estadoPago: extractUniqueValues(importacionesData, "ESTADO_PAGO"),
      estadoImportacion: extractUniqueValues(
        importacionesData,
        "ESTADO_IMPORTACION"
      ),
    };
  }, [importacionesData, extractUniqueValues]);

  // Verificar permisos específicos por rol
  // Mapeo: ventas → IMPORTACIONES, bodega → BODEGA, jefatura → COMPRAS-GERENCIA
  const tienePermiso = useMemo(() => {
    return {
      // Permiso para IMPORTACIONES (crear, editar, exportar) - rol: ventas
      importaciones: rolesUsuario.includes("usuario"),
      // Permiso para BODEGA (solo visualización) - rol: bodega
      bodega: rolesUsuario.includes("bodega"),
      // Permiso para COMPRAS-GERENCIA (visualización avanzada) - rol: jefatura
      comprasGerencia: rolesUsuario.includes("jefatura"),
      // Si tiene cualquier permiso (tiene empresas disponibles)
      cualquierPermiso: empresasDisponibles && empresasDisponibles.length > 0,
    };
  }, [rolesUsuario, empresasDisponibles]);

  // Efectos
  useEffect(() => {
    verificarIdEnURL();
    cargarImportaciones();
  }, [verificarIdEnURL, cargarImportaciones]);

  // Si no hay empresas con acceso, mostrar mensaje
  if (!empresasDisponibles || empresasDisponibles.length === 0) {
    return (
      <ContenedorPrincipal>
        <TextoMensaje>No tienes permisos para acceder a las importaciones.</TextoMensaje>
      </ContenedorPrincipal>
    );
  }

  return (
    <ContenedorPrincipal>
      {/* Modales */}
      {modalConfig.crearVisible && (
        <CreacionRegistro
          mostrarVentana={() =>
            setModalConfig((prev) => ({ ...prev, crearVisible: false }))
          }
          actualizar={cargarImportaciones}
          cambiar={setContadorActualizaciones}
          varcambiar={contadorActualizaciones}
        />
      )}

      {modalConfig.editarVisible && (
        <VentanaEdicionImportacion
          mostrarVentanaEdicion={() =>
            setModalConfig((prev) => ({ ...prev, editarVisible: false }))
          }
          dataImportacion={modalConfig.idImportacionEditar}
          actualizarTabla={cargarImportaciones}
          routeConfig={routeConfig}
        />
      )}

      {/* Filtros */}
      <ContenedorFiltrosP>
        <ContenedorFiltros>
          {/* Renderizar filtros estándar desde configuración */}
          {/* Filtro Empresa - visible para todos */}
          <CampoFiltro
            key="empresa"
            options={opcionesFiltro.empresa || []}
            onChange={handleChange}
            numFiltro={0}
            nombre="Empresa"
          />

          {/* Filtro Proveedor - solo para IMPORTACIONES y COMPRAS-GERENCIA */}
          {(tienePermiso.importaciones || tienePermiso.comprasGerencia) && (
            <CampoFiltro
              key="proveedor"
              options={opcionesFiltro.proveedor || []}
              onChange={handleChange}
              numFiltro={1}
              nombre="Proveedor"
            />
          )}

          {/* Filtro Marca - visible para todos */}
          <CampoFiltro
            key="marca"
            options={opcionesFiltro.marca || []}
            onChange={handleChange}
            numFiltro={2}
            nombre="Marca"
          />

          {/* Filtro Estado de Carga - visible para todos */}
          <CampoFiltro
            key="estadoCarga"
            options={opcionesFiltro.estadoCarga || []}
            onChange={handleChange}
            numFiltro={3}
            nombre="Estado de Carga"
          />

          {/* Filtro Estado de Pago - visible para todos */}
          <CampoFiltro
            key="estadoPago"
            options={opcionesFiltro.estadoPago || []}
            onChange={handleChange}
            numFiltro={4}
            nombre="Estado de Pago"
          />

          {/* Filtro Estado Importación - visible para todos */}
          <CampoFiltro
            key="estadoImportacion"
            options={opcionesFiltro.estadoImportacion || []}
            onChange={handleChange}
            numFiltro={5}
            nombre="Estado Importación"
          />
          {/* Filtro por fecha - este es único */}
          <CampoFiltroporFecha
            onChange={handleChangeFecha}
            numFiltro={6}
            nombre={"ETA"}
          />

          {/* Filtro global desplegable */}
          <FiltroGlobalDesplegable
            value={filtroGlobal.value}
            onChangeValue={handleChangeGlobalValue}
            onChangeCampo={handleChangeGlobalCampo}
          />

          {/* Botón de exportar a Excel - requiere permiso de IMPORTACIONES o COMPRAS-GERENCIA */}
          {(tienePermiso.importaciones || tienePermiso.comprasGerencia) && (
            <ExportToExcelUI
              columnasOcultas={EXCEL_CONFIG.datosOcultos}
              nombresPersonalizados={EXCEL_CONFIG.nombresPersonalizados}
              filaFinal={[]}
              data={datosFiltradosExcel}
              filename="Tabla Importaciones"
              habilitarBoton={false}
            />
          )}
        </ContenedorFiltros>

        <ContenedorFiltros>
          <ButtonUI
            iconLeft={"FaArrowsRotate"}
            onClick={ejecutarBatImportaciones}
          />

          {/* Botón Nuevo Registro - solo para IMPORTACIONES */}
          {tienePermiso.importaciones && (
            <ButtonUI
              text="Nuevo Registro +"
              onClick={abrirModalCrear}
              pcolor={theme.colors.primary}
              pcolortext={theme.colors.white}
            />
          )}
        </ContenedorFiltros>
      </ContenedorFiltrosP>

      {/* Tabla de importaciones */}
      <ContenedorTabla>
        {importacionesData.length > 0 ? (
          <TablaImportaciones
            filtrosActivos={filtrosActivos}
            filtroGlobal={filtroGlobal}
            editarRegistro={abrirModalEditar}
            // Por esta implementación más clara:
            infoRegistro={(id) => {
              if (!id) {
                console.error("Error: Se recibió un ID inválido de la tabla");
                return;
              }
              setModalConfig((prev) => ({
                ...prev,
                editarVisible: true,
                idImportacionEditar: id,
              }));
            }}
            dataImportacion={importacionesData}
            varcambiar={contadorActualizaciones}
            setExcelData={setDatosFiltradosExcel}
            lengthDataFiltrada={setCantidadRegistrosFiltrados}
            availableCompanies={availableCompanies}
            routeConfig={routeConfig}
          />
        ) : (
          <TextoNoData>
            NO DATA
          </TextoNoData>
        )}
      </ContenedorTabla>

      <TextoRegistros>
        Registros: {cantidadRegistrosFiltrados} de {importacionesData?.length}
      </TextoRegistros>
    </ContenedorPrincipal>
  );
};

