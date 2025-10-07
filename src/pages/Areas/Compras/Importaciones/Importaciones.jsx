import React, { useEffect, useState, useMemo, useCallback } from "react";
import styled from "styled-components";
import { CampoFiltro, CampoFiltroporFecha } from "./Filtros/Filtros";
import { FiltroGlobalDesplegable } from "./Filtros/FiltroGlobalDesplegable";
import { TablaImportaciones } from "./Filtros/TablaImportaciones";
// ExportToExcel removido - usar componente unificado
import { CreacionRegistro } from "./Filtros/CreacionRegistro";
import { VentanaEdicionImportacion } from "./Filtros/VentanaEdicionImportacion";
import {
  EjecutarBatImportaciones,
  ListarImportaciones,
} from "services/importacionesService";
import { withPermissions } from "../../../../hoc/withPermissions";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

// Este componente maneja múltiples submódulos: BODEGA, COMPRAS-GERENCIA, e IMPORTACIONES

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
const ImportacionesComponent = ({ empresasAcceso, permissionsLoading }) => {
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

  // Los permisos se cargan automáticamente con withPermissions

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

  // Verificar si el usuario tiene acceso (simplificado con el nuevo sistema)
  const tienePermiso = useMemo(
    () => ({
      compras: empresasAcceso && empresasAcceso.length > 0,
      comprasGerencia: empresasAcceso && empresasAcceso.length > 0,
      cualquierPermiso: empresasAcceso && empresasAcceso.length > 0,
    }),
    [empresasAcceso]
  );

  // Efectos
  useEffect(() => {
    verificarIdEnURL();
    cargarImportaciones();
  }, [verificarIdEnURL, cargarImportaciones]);

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <ContenedorPrincipal>
        <p>Cargando permisos, por favor espera...</p>
      </ContenedorPrincipal>
    );
  }

  // Si no hay empresas con acceso, mostrar mensaje
  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <ContenedorPrincipal>
        <p>No tienes permisos para acceder a las importaciones.</p>
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
        />
      )}

      {/* Filtros */}
      <ContenedorFiltrosP>
        <ContenedorFiltros>
          {/* Renderizar filtros estándar desde configuración */}
          {[
            {
              key: "empresa",
              nombre: "Empresa",
              numFiltro: 0,
              requiresPermission: false,
            },
            {
              key: "proveedor",
              nombre: "Proveedor",
              numFiltro: 1,
              requiresPermission: true,
              permissionType: "cualquierPermiso",
            },
            {
              key: "marca",
              nombre: "Marca",
              numFiltro: 2,
              requiresPermission: false,
            },
            {
              key: "estadoCarga",
              nombre: "Estado de Carga",
              numFiltro: 3,
              requiresPermission: false,
            },
            {
              key: "estadoPago",
              nombre: "Estado de Pago",
              numFiltro: 4,
              requiresPermission: false,
            },
            {
              key: "estadoImportacion",
              nombre: "Estado Importación",
              numFiltro: 5,
              requiresPermission: false,
            },
          ].map(
            (filtroConfig) =>
              (!filtroConfig.requiresPermission ||
                tienePermiso[filtroConfig.permissionType]) && (
                <CampoFiltro
                  key={filtroConfig.key}
                  options={opcionesFiltro[filtroConfig.key] || []}
                  onChange={handleChange}
                  numFiltro={filtroConfig.numFiltro}
                  nombre={filtroConfig.nombre}
                />
              )
          )}
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

          {/* Botón de exportar a Excel */}
          {tienePermiso.compras && (
            <ExportToExcel
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
          <CustomButton
            iconLeft={"FaSyncAlt"}
            onClick={ejecutarBatImportaciones}
          />

          {tienePermiso.compras && (
            <BotonCrearNuevo onClick={abrirModalCrear}>
              <span style={{ color: "white" }}>Nuevo Registro +</span>
            </BotonCrearNuevo>
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
          />
        ) : (
          <span
            style={{ width: "100%", textAlign: "center", paddingTop: "15px" }}
          >
            NO DATA
          </span>
        )}
      </ContenedorTabla>

      <span style={{ fontSize: "14px", color: "var(--primary)" }}>
        Registros: {cantidadRegistrosFiltrados} de {importacionesData?.length}
      </span>
    </ContenedorPrincipal>
  );
};

// Exportar el componente envuelto con withPermissions
export const Importaciones = withPermissions(ImportacionesComponent);

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
  border-bottom: solid 1px #cfcfcf;
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

const BotonCrearNuevo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  padding: 3px 10px;
  gap: 1px;
  font-size: 14px;
  background-color: var(--primary);
  cursor: pointer;
  color: "white";
`;

const ContenedorTabla = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;
