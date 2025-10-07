import React, { useState, useEffect, useMemo } from "react";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import styled from "styled-components";
import { ListarEmpresasAdmin } from "services/administracionService";
import {
  ConsultarListaBancos,
  consultarTodasTransaccionesBancarias,
} from "services/carteraService";
import { CustomDateSelector } from "components/UI/CustomComponents/CustomDateSelector";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

// Styled components unificados
const FiltrosContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
`;

// ============================================================================
// COMPONENTE DE FILTROS UNIFICADO
// ============================================================================
export const FiltrosUnificadosCartera = ({
  empresasAcceso,
  permissionsLoading,
  // Callback para notificar cambios en los filtros aplicados
  onFiltersChange,
  // Trigger para refrescar datos
  refrescar = 0,
  // Tipos de transacción permitidos (C = Créditos, D = Débitos)
  tiposTransaccionPermitidos = [],
}) => {
  // Estados de datos
  const [data, setData] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Estados internos para filtros de fechas, banco y empresa
  const [fechaInicial, setFechaInicial] = useState(null);
  const [fechaFinal, setFechaFinal] = useState(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedBanco, setSelectedBanco] = useState("");

  // Estados internos para filtros de tabla
  const [filtrosEstado, setFiltrosEstado] = useState([]);
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [filtroGlobalDebounced, setFiltroGlobalDebounced] = useState("");
  const [columnaFiltro, setColumnaFiltro] = useState("0");
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [accionSeleccionada, setAccionSeleccionada] = useState(null);

  // Estados locales para empresas y bancos
  const [empresaList, setEmpresaList] = useState([]);
  const [bancoList, setBancoList] = useState([]);

  // Cargar empresas
  const fetchEmpresas = async () => {
    const permisosEmpresas = empresasAcceso || [];
    if (permisosEmpresas.length > 0) {
      const empdata = await ListarEmpresasAdmin();
      const empresaOptions = empdata.filter((item) =>
        permisosEmpresas.some((permiso) => permiso.empresa === item.NOMBRE)
      );
      setEmpresaList(empresaOptions);
    }
  };

  // Cargar bancos
  const fetchBancos = async () => {
    const bancosList = await ConsultarListaBancos();
    if (bancosList) {
      setBancoList(bancosList);
    }
  };

  // Cargar transacciones bancarias
  const fetchTransacciones = async () => {
    setCargando(true);
    try {
      const transacciones = await consultarTodasTransaccionesBancarias();
      setData(transacciones || []);
    } catch (error) {
      console.error("Error al obtener transacciones:", error);
      setData([]);
    } finally {
      setCargando(false);
    }
  };

  // Effect para cargar datos
  useEffect(() => {
    fetchEmpresas();
    fetchBancos();
    fetchTransacciones();
  }, [empresasAcceso]);

  // Effect para seleccionar automáticamente la primera empresa cuando se cargan
  useEffect(() => {
    if (empresaList.length > 0 && !selectedEmpresa) {
      const primeraEmpresa = empresaList[0].NOMBRE;
      setSelectedEmpresa(primeraEmpresa);
    }
  }, [empresaList]);

  // Effect para refrescar datos cuando se actualiza una transacción
  useEffect(() => {
    if (refrescar > 0) {
      fetchTransacciones();
    }
  }, [refrescar]);

  // Debounce para el filtro global (evita re-renders mientras escribe)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFiltroGlobalDebounced(filtroGlobal);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filtroGlobal]);

  // Función para manejar filtros de estado (para CustomSelect multiselección)
  const manejarFiltroEstado = (selectedOptions) => {
    setFiltrosEstado(selectedOptions || []);
  };

  // Función para normalizar fecha (sin hora) para comparación
  const normalizarFecha = (fecha) => {
    const fechaNormalizada = new Date(fecha);
    fechaNormalizada.setHours(0, 0, 0, 0);
    return fechaNormalizada;
  };

  // Función para obtener datos filtrados SIN el filtro de estado (para contadores)
  const getDataSinFiltroEstado = () => {
    if (!data || data.length === 0) return [];

    let datosFiltrados = [...data];

    // PRIMERO: Aplicar filtro por tipos de transacción permitidos
    if (tiposTransaccionPermitidos && tiposTransaccionPermitidos.length > 0) {
      datosFiltrados = datosFiltrados.filter((item) => {
        // Verificar si el tipo de transacción está permitido
        return tiposTransaccionPermitidos.includes(item.TIPO_TRANSACCION);
      });
    }

    // Aplicar filtro de fechas
    if (fechaInicial) {
      const fechaInicialNormalizada = normalizarFecha(fechaInicial);
      datosFiltrados = datosFiltrados.filter((item) => {
        const [dia, mes, anio] = item.FECHA_TRANSACCION.split("-");
        const fechaTransaccion = new Date(anio, mes - 1, dia);
        const fechaTransaccionNormalizada = normalizarFecha(fechaTransaccion);
        return fechaTransaccionNormalizada >= fechaInicialNormalizada;
      });
    }

    if (fechaFinal) {
      const fechaFinalNormalizada = normalizarFecha(fechaFinal);
      datosFiltrados = datosFiltrados.filter((item) => {
        const [dia, mes, anio] = item.FECHA_TRANSACCION.split("-");
        const fechaTransaccion = new Date(anio, mes - 1, dia);
        const fechaTransaccionNormalizada = normalizarFecha(fechaTransaccion);
        return fechaTransaccionNormalizada <= fechaFinalNormalizada;
      });
    }

    // Aplicar filtro de banco
    if (selectedBanco && selectedBanco !== "") {
      datosFiltrados = datosFiltrados.filter(
        (item) => item.NOMBRE_BANCO === selectedBanco
      );
    }

    // Aplicar filtro de empresa
    if (selectedEmpresa && selectedEmpresa !== "") {
      datosFiltrados = datosFiltrados.filter(
        (item) => item.NOMBRE_EMPRESA === selectedEmpresa
      );
    }

    // Aplicar filtro global (sin aplicar filtro de estado)
    if (filtroGlobalDebounced) {
      datosFiltrados = datosFiltrados.filter((item) => {
        const searchValue = filtroGlobalDebounced.toLowerCase();

        if (columnaFiltro && columnaFiltro !== "0") {
          return String(item[columnaFiltro] || "")
            .toLowerCase()
            .includes(searchValue);
        }

        return Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchValue)
        );
      });
    }

    return datosFiltrados;
  };

  // Función para contar transacciones por estado (sobre datos filtrados)
  const contarPorEstado = (estado) => {
    const datosSinFiltroEstado = getDataSinFiltroEstado();
    if (!datosSinFiltroEstado || datosSinFiltroEstado.length === 0) return 0;
    return datosSinFiltroEstado.filter(
      (item) => parseInt(item.ESTADO) === estado
    ).length;
  };

  // Función para obtener datos filtrados (CON todos los filtros incluido estado)
  const getCurrentData = () => {
    let datosFiltrados = getDataSinFiltroEstado();

    // Aplicar filtros de estado
    if (filtrosEstado.length > 0) {
      const estadosSeleccionados = filtrosEstado.map((opt) => opt.value);
      datosFiltrados = datosFiltrados.filter((item) =>
        estadosSeleccionados.includes(parseInt(item.ESTADO))
      );
    }

    return datosFiltrados;
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    await fetchTransacciones();
  };

  // Effect para notificar cambios en los filtros al componente padre
  useEffect(() => {
    if (onFiltersChange) {
      const filtros = {
        fechaInicial,
        fechaFinal,
        empresa: selectedEmpresa,
        banco: selectedBanco,
        filtrosEstado,
        filtroGlobal: filtroGlobalDebounced,
        columnaFiltro,
        rowsPerPage,
        datosFiltrados: getCurrentData(),
        cargando,
      };
      onFiltersChange(filtros);
    }
  }, [
    fechaInicial,
    fechaFinal,
    selectedEmpresa,
    selectedBanco,
    filtrosEstado,
    filtroGlobalDebounced,
    columnaFiltro,
    rowsPerPage,
    data,
    cargando,
  ]);

  // Funciones internas para manejar cambios de filtros
  const handleFechaInicialChange = (fecha) => {
    setFechaInicial(fecha);
  };

  const handleFechaFinalChange = (fecha) => {
    setFechaFinal(fecha);
  };

  const handleEmpresaChange = (empresa) => {
    setSelectedEmpresa(empresa);
  };

  const handleBancoChange = (banco) => {
    setSelectedBanco(banco);
  };

  const handleRowsPerPageChange = (rows) => {
    setRowsPerPage(rows);
  };

  const eliminarFiltro = () => {
    setFechaInicial(null);
    setFechaFinal(null);
    setSelectedEmpresa("");
    setSelectedBanco("");
    setFiltrosEstado([]);
    setFiltroGlobal("");
    setFiltroGlobalDebounced("");
    setColumnaFiltro("0");
  };

  // Función para exportar a Excel
  const handleExportarExcel = () => {
    const datos = getCurrentData();
    if (datos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Crear CSV
    const headers = Object.keys(datos[0]);
    const csvContent = [
      headers.join(","),
      ...datos.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    // Descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "datos_filtrados.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Opciones del menú de acciones
  const accionesOptions = [
    { value: "actualizar", label: "🔄 Actualizar datos" },
    { value: "exportar", label: "📊 Exportar a Excel" },
    { value: "limpiar", label: "🗑️ Limpiar filtros" },
  ];

  // Manejador de cambio de acción
  const handleAccionChange = (option) => {
    if (!option) return;

    switch (option.value) {
      case "actualizar":
        handleRefresh();
        break;
      case "exportar":
        handleExportarExcel();
        break;
      case "limpiar":
        eliminarFiltro();
        break;
      default:
        break;
    }

    // Resetear la selección después de ejecutar la acción
    setAccionSeleccionada(null);
  };

  // Opciones para el selector de filas por página
  const opcionesFilasPorPagina = [
    { value: 15, label: "15 filas" },
    { value: 25, label: "25 filas" },
    { value: 50, label: "50 filas" },
    { value: 100, label: "100 filas" },
  ];

  // Opciones para el filtro de columna
  const columnasOptions = [
    { value: "0", label: "Todo" },
    { value: "IDENTIFICADOR", label: "ID" },
    { value: "NUMERO_DOCUMENTO", label: "Documento" },
    { value: "VALOR", label: "Valor" },
    { value: "CLIENTE", label: "Cliente" },
    { value: "TIPO_TRANSACCION", label: "Tipo" },
    { value: "COMENTARIO", label: "Comentario" },
    { value: "INGRESO", label: "Ingreso" },
    { value: "VENDEDOR", label: "Vendedor" },
  ];

  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100px"
        style={{
          padding: "20px",
          backgroundColor: "rgba(248, 249, 250, 0.8)",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#6c757d",
            textAlign: "center",
          }}
        >
          Cargando filtros...
        </div>
      </CustomContainer>
    );
  }

  const bancoOptions = [
    {
      value: "",
      label: "Todos",
    },
    ...bancoList.map((banco) => ({
      value: banco.banc_nombre,
      label: banco.banc_nombre,
    })),
  ];

  const empresaOptions = empresaList.map((empresa) => ({
    value: empresa.NOMBRE,
    label: empresa.NOMBRE,
  }));

  // Opciones para el filtro de estados (se recalcula cuando cambian los filtros)
  const estadoOptions = useMemo(
    () => [
      { value: 0, label: `Pendientes (${contarPorEstado(0)})` },
      { value: 1, label: `Incompletos (${contarPorEstado(1)})` },
      { value: -1, label: `No identificados (${contarPorEstado(-1)})` },
      { value: 2, label: `Completos (${contarPorEstado(2)})` },
      { value: 3, label: `Garantías (${contarPorEstado(3)})` },
      { value: 4, label: `Tarjetas (${contarPorEstado(4)})` },
    ],
    [
      data,
      fechaInicial,
      fechaFinal,
      selectedBanco,
      selectedEmpresa,
      filtroGlobalDebounced,
      columnaFiltro,
      tiposTransaccionPermitidos, // ✅ Incluir tipos de transacción permitidos
    ]
  );

  return (
    <CustomContainer
      flexDirection="row"
      justifyContent="flex-start"
      width="100%"
      style={{ padding: "10px", gap: "10px" }}
    >
      {/* Todos los filtros en una sola fila */}
      <FiltrosContainer>
        {/* Fechas */}
        <CustomDateSelector
          fecha={fechaInicial}
          onChange={handleFechaInicialChange}
          label="Desde"
          max={fechaFinal}
        />
        <CustomDateSelector
          fecha={fechaFinal}
          onChange={handleFechaFinalChange}
          label="Hasta"
          min={fechaInicial}
        />

        {/* Banco */}
        <CustomSelect
          options={bancoOptions}
          value={bancoOptions.find((opt) => opt.value === selectedBanco)}
          onChange={(option) => handleBancoChange(option?.value || "")}
          placeholder="Seleccionar banco"
          minWidth="180px"
          maxWidth="250px"
          label="Banco"
        />

        {/* Empresa */}
        <CustomSelect
          options={empresaOptions}
          value={empresaOptions.find((opt) => opt.value === selectedEmpresa)}
          onChange={(option) => handleEmpresaChange(option?.value || "")}
          placeholder="Seleccionar empresa"
          minWidth="180px"
          maxWidth="250px"
          label="Empresa"
        />
        {/* Filtro por estados */}
        <CustomSelect
          options={estadoOptions}
          value={filtrosEstado}
          onChange={manejarFiltroEstado}
          placeholder="Filtrar por estados"
          label="Estados"
          isMulti={true}
          minWidth="200px"
          maxWidth="300px"
        />

        {/* Filtro global */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <CustomInput
            type="text"
            placeholder="Buscar..."
            value={filtroGlobal}
            onChange={(value) => setFiltroGlobal(value)}
            iconLeft="fa fa-search"
            label="Buscar"
            containerStyle={{ minWidth: "200px" }}
          />
          <CustomSelect
            options={columnasOptions}
            value={
              columnasOptions.find((opt) => opt.value === columnaFiltro) ||
              columnasOptions[0]
            }
            onChange={(option) => setColumnaFiltro(option?.value || "0")}
            placeholder="Columna"
            minWidth="140px"
            maxWidth="150px"
            isSearchable={false}
          />
        </div>

        {/* Selector de filas por página */}
        <CustomSelect
          label="Filas por página"
          options={opcionesFilasPorPagina}
          value={opcionesFilasPorPagina.find(
            (opt) => opt.value === rowsPerPage
          )}
          onChange={(option) => handleRowsPerPageChange(option?.value || 15)}
          placeholder="Filas"
          minWidth="120px"
          maxWidth="150px"
          isSearchable={false}
        />

        {/* Menu de acciones a la derecha */}
        <CustomSelect
          options={accionesOptions}
          value={accionSeleccionada}
          onChange={handleAccionChange}
          placeholder="Acciones..."
          label="Acciones"
          minWidth="180px"
          maxWidth="220px"
          isSearchable={false}
        />
      </FiltrosContainer>
    </CustomContainer>
  );
};

// ============================================================================
// COMPONENTE DE PAGINACIÓN UNIFICADO
// ============================================================================
export const PaginacionUnificada = ({
  currentPage,
  pageCount,
  handlePageChange,
  numberData,
  totalData = 0,
}) => {
  // Crear opciones para el selector de páginas
  const pageOptions = Array.from({ length: pageCount }, (_, i) => ({
    value: i + 1,
    label: `Página ${i + 1}`,
  }));

  const handlePageSelect = (option) => {
    if (option?.value) {
      handlePageChange(option.value);
    }
  };

  return (
    <CustomContainer
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      width="100%"
      style={{
        padding: "2px 15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "5px",
      }}
    >
      <div>
        <span style={{ fontSize: "14px", color: "#6c757d" }}>
          Mostrando {numberData} de {totalData} registros
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <CustomButton
          iconLeft="FaArrowLeft"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        <CustomSelect
          options={pageOptions}
          value={pageOptions.find((opt) => opt.value === currentPage)}
          onChange={handlePageSelect}
          placeholder="Seleccionar página"
          minWidth="150px"
          maxWidth="180px"
          menuMaxHeight="200px"
          menuMaxWidth="300px"
          isSearchable={false}
        />
        <CustomButton
          iconLeft="FaArrowRight"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
        />
      </div>

      <div>
        <span style={{ fontSize: "14px", color: "#6c757d" }}>
          Página {currentPage} de {pageCount}
        </span>
      </div>
    </CustomContainer>
  );
};
