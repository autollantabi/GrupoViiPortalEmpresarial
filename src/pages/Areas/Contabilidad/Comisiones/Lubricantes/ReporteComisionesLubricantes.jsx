import React, { useEffect, useState } from "react";
import Select from "react-select";

import { ObtenerReporteComisionesLubricantes } from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "components/UI/ComponentesGenericos/Utils";
import { TablaInfo } from "components/UI/ComponentesGenericos/TablaInfo";
import { withPermissions } from "../../../../../hoc/withPermissions";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";

const customStyles = {
  // Estilos para las opciones (dentro del desplegable)
  option: (provided, state) => ({
    ...provided,
    padding: "2px 10px 2px 10px", // Ajustar el padding
    whiteSpace: "nowrap", // Evitar que el texto se divida en varias líneas
    overflow: "hidden", // Ocultar el texto que sobrepasa
    textOverflow: "ellipsis", // Añadir "..." cuando el texto sea demasiado largo
    fontSize: "12px",
  }),
  // Estilos para el control (el select visible)
  control: (provided) => ({
    ...provided,
    width: "max-content", // Ajustar el ancho del control
    maxWidth: "250px",
    fontSize: "12px",
  }),
  // Estilos para el menú (el contenedor de las opciones desplegadas)
  menu: (provided) => ({
    ...provided,
    zIndex: 10,
    width: "150px", // Asegurar que el menú también tenga el mismo ancho que el control
    fontSize: "12px",
  }),
};

const ComisionesLubricantesComponent = ({
  empresasAcceso,
  permissionsLoading,
}) => {
  const nombresPersonalizados = {
    // Columnas principales
    VENDEDOR: "VENDEDOR",

    // Convencional
    CONV_PRESUPUESTO_LITROS: "Conv. Presupuesto (litros)",
    CONV_LITROS_VENDIDOS: "Conv. Litros Vendidos",
    CONV_PORCENTAJE_CUMPLIMIENTO: "Conv. % Cumplimiento",

    // Premium
    PREM_PRESUPUESTO_LITROS: "Prem. Presupuesto (litros)",
    PREM_LITROS_VENDIDOS: "Prem. Litros Vendidos",
    PREM_PORCENTAJE_CUMPLIMIENTO: "Prem. % Cumplimiento",

    // Refrigerante
    REF_PRESUPUESTO_LITROS: "Ref. Presupuesto (litros)",
    REF_LITROS_VENDIDOS: "Ref. Litros Vendidos",
    REF_PORCENTAJE_CUMPLIMIENTO: "Ref. % Cumplimiento",

    // Totales
    TOTAL_PRESUPUESTO_LITROS: "Total Presupuesto (litros)",
    TOTAL_LITROS_VENDIDOS: "Total Litros Vendidos",
    TOTAL_PORCENTAJE_CUMPLIMIENTO: "Total % Cumplimiento",
    TOTAL_TOTAL_VENTA: "Total Venta $",
  };

  // Función para transformar los datos del reporte a formato de tabla
  const transformarDatosReporte = (datosOriginales) => {
    if (!Array.isArray(datosOriginales)) return [];

    return datosOriginales.map((item, index) => {
      const convencional = item.clasificaciones.convencional || {};
      const premium = item.clasificaciones.premium || {};
      const refrigerante = item.clasificaciones.refrigerante || {};
      const totales = item.totales || {};

      return {
        ID: index + 1,
        VENDEDOR: item.vendedor,
        // Convencional
        CONV_PRESUPUESTO_LITROS: convencional.PresupuestoLitros || 0,
        CONV_LITROS_VENDIDOS: convencional.LitrosVendidos || 0,
        CONV_PORCENTAJE_CUMPLIMIENTO: convencional.PorcentajeCumplimiento || 0,
        CONV_CUMPLIMIENTO_PREMIUM: convencional.CumplimientoPremium || 0,
        CONV_TOTAL_VENTA: convencional.TotalVenta || 0,
        // Premium
        PREM_PRESUPUESTO_LITROS: premium.PresupuestoLitros || 0,
        PREM_LITROS_VENDIDOS: premium.LitrosVendidos || 0,
        PREM_PORCENTAJE_CUMPLIMIENTO: premium.PorcentajeCumplimiento || 0,
        PREM_CUMPLIMIENTO_PREMIUM: premium.CumplimientoPremium || 0,
        PREM_TOTAL_VENTA: premium.TotalVenta || 0,
        // Refrigerante
        REF_PRESUPUESTO_LITROS: refrigerante.PresupuestoLitros || 0,
        REF_LITROS_VENDIDOS: refrigerante.LitrosVendidos || 0,
        REF_PORCENTAJE_CUMPLIMIENTO: refrigerante.PorcentajeCumplimiento || 0,
        REF_CUMPLIMIENTO_PREMIUM: refrigerante.CumplimientoPremium || 0,
        REF_TOTAL_VENTA: refrigerante.TotalVenta || 0,
        // Totales
        TOTAL_PRESUPUESTO_LITROS: totales.PresupuestoLitros || 0,
        TOTAL_LITROS_VENDIDOS: totales.LitrosVendidos || 0,
        TOTAL_PORCENTAJE_CUMPLIMIENTO: totales.PorcentajeCumplimiento || 0,
        TOTAL_TOTAL_VENTA: totales.TotalVenta || 0,
      };
    });
  };

  // Configuración de columnas consolidada para una sola tabla
  const columnsConfigConsolidado = [
    { header: "ID", field: "ID", visible: false, width: "60px" },
    { header: "Vendedor", field: "VENDEDOR", visible: true, width: "120px" },

    // Convencional
    {
      header: "Conv. Presupuesto (litros)",
      field: "CONV_PRESUPUESTO_LITROS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Conv. Litros Vendidos",
      field: "CONV_LITROS_VENDIDOS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Conv. % Cumplimiento",
      field: "CONV_PORCENTAJE_CUMPLIMIENTO",
      visible: true,
      format: "porcentaje",
      width: "80px",
    },

    // Premium
    {
      header: "Prem. Presupuesto (litros)",
      field: "PREM_PRESUPUESTO_LITROS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Prem. Litros Vendidos",
      field: "PREM_LITROS_VENDIDOS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Prem. % Cumplimiento",
      field: "PREM_PORCENTAJE_CUMPLIMIENTO",
      visible: true,
      format: "porcentaje",
      width: "80px",
    },

    // Refrigerante
    {
      header: "Ref. Presupuesto (litros)",
      field: "REF_PRESUPUESTO_LITROS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Ref. Litros Vendidos",
      field: "REF_LITROS_VENDIDOS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Ref. % Cumplimiento",
      field: "REF_PORCENTAJE_CUMPLIMIENTO",
      visible: true,
      format: "porcentaje",
      width: "80px",
    },

    // Totales
    {
      header: "Total Presupuesto (litros)",
      field: "TOTAL_PRESUPUESTO_LITROS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Total Litros Vendidos",
      field: "TOTAL_LITROS_VENDIDOS",
      visible: true,
      format: "number",
      width: "80px",
    },
    {
      header: "Total % Cumplimiento",
      field: "TOTAL_PORCENTAJE_CUMPLIMIENTO",
      visible: true,
      format: "porcentaje",
      width: "80px",
    },
    {
      header: "Total Venta $",
      field: "TOTAL_TOTAL_VENTA",
      visible: true,
      format: "money",
      width: "90px",
    },
  ];

  // Estado que mantiene los datos de la tabla
  const [data, setData] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSl, setEmpresasSl] = useState("");
  const [anio, setAnio] = useState("");
  const [anioSl, setAnioSl] = useState("");
  const [mes, setMes] = useState("");

  const datosIniciales = async () => {
    // const getEmpresas = await ListarEmpresas();
    // Los permisos se obtienen automáticamente del HOC
    const getEmpresasporPermiso = empresasAcceso || [];
    const transformDataEmpresas = transformarDataAValueLabel({
      data: getEmpresasporPermiso,
      labelField: "empresa",
      valueField: "idempresa",
    });
    const anios = obtenerAniosDesde2020();
    const listaAnios = transformarDataAValueLabel({
      data: anios,
      valueField: "ANIO",
      labelField: "ANIO",
    });

    setAnio(listaAnios);
    setEmpresas(transformDataEmpresas);
  };

  const consultarReporte = async () => {
    if (empresaSl !== "" && mes !== "" && anioSl !== "") {
      const datosReporte = await ObtenerReporteComisionesLubricantes({
        codigoEmpresa: empresaSl.value,
        mes: mes.value,
        anio: anioSl.value,
      });

      // Transformar los datos antes de establecerlos en el estado
      const datosTransformados = transformarDatosReporte(datosReporte);
      setData(datosTransformados);

      return datosTransformados.length > 0 ? true : false;
    }
  };

  // Función para exportar a Excel
  const exportarExcel = () => {
    if (!data || data.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Crear el nombre del archivo
    const nombreArchivo = `Comisiones_Lubricantes_${empresaSl?.label || ""}_${
      mes?.label || ""
    }_${anioSl?.label || ""}`;

    // Función para exportar a Excel usando la librería xlsx
    const exportToExcel = () => {
      import("xlsx")
        .then((XLSX) => {
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Comisiones");

          // Ajustar el ancho de las columnas
          const colWidths = [
            { wch: 8 }, // ID
            { wch: 25 }, // Vendedor
            { wch: 20 }, // Conv. Presupuesto
            { wch: 20 }, // Conv. Litros
            { wch: 20 }, // Conv. %
            { wch: 20 }, // Prem. Presupuesto
            { wch: 20 }, // Prem. Litros
            { wch: 20 }, // Prem. %
            { wch: 20 }, // Ref. Presupuesto
            { wch: 20 }, // Ref. Litros
            { wch: 20 }, // Ref. %
            { wch: 20 }, // Total Presupuesto
            { wch: 20 }, // Total Litros
            { wch: 20 }, // Total %
            { wch: 20 }, // Total Venta
          ];
          ws["!cols"] = colWidths;

          XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
        })
        .catch((error) => {
          console.error("Error al exportar:", error);
          alert("Error al exportar el archivo");
        });
    };

    exportToExcel();
  };

  useEffect(() => {
    datosIniciales();
  }, [empresasAcceso]);

  // Mostrar mensaje si no hay permisos
  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>Cargando permisos...</div>
      </CustomContainer>
    );
  }

  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>No tienes permisos para acceder a esta funcionalidad.</div>
      </CustomContainer>
    );
  }

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
    console.log("Sorted:", column, direction);
  };

  return (
    <CustomContainer
      flexDirection="column"
      justifyContent="flex-start"
      alignItem="flex-start"
      height="100%"
      width="100%"
      style={{ padding: "0" }}
    >
      <CustomContainer
        width="100%"
        justifyContent="flex-start"
        style={{ gap: "10px", marginBottom: "10px" }}
      >
        <Select
          options={empresas}
          value={empresaSl}
          onChange={(selectedOption) => {
            setEmpresasSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Empresa"
          styles={customStyles}
        />
        <Select
          options={[
            { value: 1, label: "Enero" },
            { value: 2, label: "Febrero" },
            { value: 3, label: "Marzo" },
            { value: 4, label: "Abril" },
            { value: 5, label: "Mayo" },
            { value: 6, label: "Junio" },
            { value: 7, label: "Julio" },
            { value: 8, label: "Agosto" },
            { value: 9, label: "Septiembre" },
            { value: 10, label: "Octubre" },
            { value: 11, label: "Noviembre" },
            { value: 12, label: "Diciembre" },
          ]}
          value={mes}
          onChange={(selectedOption) => {
            setMes(selectedOption);
          }}
          isSearchable={true}
          placeholder="Mes"
          styles={customStyles}
        />
        <Select
          options={anio}
          value={anioSl}
          onChange={(selectedOption) => {
            setAnioSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Año"
          styles={customStyles}
        />
        <CustomButton
          iconLeft={"FaSearch"}
          onClick={consultarReporte}
          style={{ padding: "5px 10px" }}
          isAsync={true}
        />
      </CustomContainer>

      {/* Tabla consolidada única */}
      <div style={{ width: "100%", height: "calc(100vh - 150px)" }}>
        <TablaInfo
          data={data}
          columns={columnsConfigConsolidado}
          onSort={handleSort}
          defaultFilters={["VENDEDOR"]}
          sortedInitial={{ column: "ID", direction: "asc" }}
          onFilterChange={handleSort}
          decimales={2}
          excel={true}
          filenameExcel={`Comisiones_Lubricantes_${empresaSl?.label || ""}_${
            mes?.label || ""
          }_${anioSl?.label || ""}`}
          nombresColumnasPersonalizadosExcel={nombresPersonalizados}
          columnasOcultasExcel={[
            "ID",
            "CONV_CUMPLIMIENTO_PREMIUM",
            "CONV_TOTAL_VENTA",
            "PREM_CUMPLIMIENTO_PREMIUM",
            "PREM_TOTAL_VENTA",
            "REF_CUMPLIMIENTO_PREMIUM",
            "REF_TOTAL_VENTA",
          ]}
        />
      </div>
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const ComisionesLubricantes = withPermissions(
  ComisionesLubricantesComponent
);
