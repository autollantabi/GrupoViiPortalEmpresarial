import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";

import { ObtenerReporteComisionesLubricantes } from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "utils/Utils";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";

const ContenedorPrincipal = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "auto"};
  gap: ${({ gap }) => gap || "0"};
  padding: ${({ padding }) => padding || "0"};
`;

const ContenedorFlex = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }) => flexDirection || "row"};
  justify-content: ${({ justifyContent }) => justifyContent || "flex-start"};
  align-items: ${({ alignItems }) => alignItems || "flex-start"};
  width: ${({ width }) => width || "auto"};
  height: ${({ height }) => height || "auto"};
  gap: ${({ gap }) => gap || "0"};
  padding: ${({ padding }) => padding || "0"};
`;

const TextoMensaje = styled.p`
  color: ${({ theme }) => theme.colors.text || "#212529"};
`;

const ContenedorTabla = styled.div`
  width: 100%;
  height: calc(100vh - 150px);
`;

export const ComisionesLubricantes = ({
  availableCompanies = [],
  availableLines = [],
}) => {
  const { theme } = useTheme();
  
  // Convertir availableCompanies de { id, nombre } a { idempresa, empresa } para compatibilidad
  const empresasDisponibles = useMemo(() => {
    if (!availableCompanies || availableCompanies.length === 0) {
      return [];
    }
    return availableCompanies.map(emp => ({
      idempresa: emp.id,
      empresa: emp.nombre,
    }));
  }, [availableCompanies]);
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
    const getEmpresasporPermiso = empresasDisponibles || [];
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

  // Verificar permisos específicos
  const tienePermiso = useMemo(() => {
    return {
      general: empresasDisponibles && empresasDisponibles.length > 0,
      consultar: empresasDisponibles && empresasDisponibles.length > 0,
      exportar: empresasDisponibles && empresasDisponibles.length > 0,
    };
  }, [empresasDisponibles]);

  useEffect(() => {
    if (tienePermiso.general) {
      datosIniciales();
    }
  }, [empresasDisponibles, tienePermiso.general]);

  const opcionesMeses = [
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
  ];

  // Si no hay empresas con acceso, mostrar mensaje
  if (!tienePermiso.general) {
    return (
      <ContenedorPrincipal
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <TextoMensaje>No tienes permisos para acceder a Comisiones Lubricantes.</TextoMensaje>
      </ContenedorPrincipal>
    );
  }

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
  };

  return (
    <ContenedorPrincipal
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      height="100%"
      width="100%"
      padding="0"
    >
      <ContenedorFlex
        width="100%"
        justifyContent="flex-start"
        gap="10px"
        padding="5px"
        style={{ marginBottom: "10px" }}
      >
        <SelectUI
          options={empresas}
          value={empresaSl}
          onChange={(selectedOption) => {
            setEmpresasSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Empresa"
          minWidth="150px"
          maxWidth="250px"
        />
        <SelectUI
          options={opcionesMeses}
          value={mes}
          onChange={(selectedOption) => {
            setMes(selectedOption);
          }}
          isSearchable={true}
          placeholder="Mes"
          minWidth="150px"
          maxWidth="250px"
        />
        <SelectUI
          options={anio}
          value={anioSl}
          onChange={(selectedOption) => {
            setAnioSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Año"
          minWidth="150px"
          maxWidth="250px"
        />
        {tienePermiso.consultar && (
          <ButtonUI
            iconLeft={"FaSistrix"}
            onClick={consultarReporte}
            style={{ padding: "5px 10px" }}
            isAsync={true}
          />
        )}
      </ContenedorFlex>

      {/* Tabla consolidada única */}
      <ContenedorTabla>
        <TablaInfoUI
          data={data}
          columns={columnsConfigConsolidado}
          onSort={handleSort}
          defaultFilters={["VENDEDOR"]}
          sortedInitial={{ column: "ID", direction: "asc" }}
          onFilterChange={handleSort}
          decimales={2}
          excel={tienePermiso.exportar}
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
      </ContenedorTabla>
    </ContenedorPrincipal>
  );
};
