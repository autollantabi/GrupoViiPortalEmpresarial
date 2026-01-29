import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";

import { ObtenerReporteComisionesMayoristas } from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "utils/Utils";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { SelectUI } from "components/UI/Components/SelectUI";

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

export const ComisionesMayoristas = ({
  availableCompanies = [],
  availableLines = [],
}) => {
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
    VENDEDOR: "VENDEDOR",
    VTAS: "VTAS ($)",
    PPTO: "PPTO ($)",
    CPTO_P: "CPTO %",
    VEN_RIN_PEQUENIO: "% VENTAS $ RIN PEQUEÑO",
    VEN_RIN_GRANDE: "% VENTAS $ RIN GRANDE",
    VEN_RIN_CAMION: "% VENTAS $ RIN CAMIÓN",
  };

  const columnsConfig = [
    { header: "ID", field: "CODIGO", visible: false },
    {
      header: "VENDEDOR",
      field: "VENDEDOR",
      editType: "dropdown",
    },
    {
      header: "VTAS ($)",
      field: "VTAS",
      editType: "text",
      format: "money",
    },
    {
      header: "PPTO ($)",
      field: "PPTO",
      editType: "text",
      format: "money",
    },
    {
      header: "CPTO %",
      field: "CPTO_P",
      editType: "text",
      format: "porcentaje",
    },
    {
      header: "% Ventas $ Rin Pequeño",
      field: "VEN_RIN_PEQUENIO",
      editType: "text",
      format: "porcentaje",
    },
    {
      header: "% Ventas $ Rin Grande",
      field: "VEN_RIN_GRANDE",
      editType: "text",
      format: "porcentaje",
    },
    {
      header: "% Ventas $ Rin Camión",
      field: "VEN_RIN_CAMION",
      editType: "text",
      format: "porcentaje",
    },
    // más configuraciones de columnas según sea necesario
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
      const datosReporte = await ObtenerReporteComisionesMayoristas({
        codigoEmpresa: empresaSl.value,
        mes: mes.value,
        anio: anioSl.value,
      });
      setData(datosReporte);
      return datosReporte.length > 0 ? true : false;
    }
  };

  const fileName = () => {
    var fileN = "";
    if (empresaSl !== "" && mes !== "" && anioSl !== "") {
      fileN = `Comisiones_Mayoristas_${empresaSl.label}_${mes.label}_${anioSl.label}_`;
    }
    return fileN;
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
        <p>No tienes permisos para acceder a Comisiones Mayoristas.</p>
      </ContenedorPrincipal>
    );
  }

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
  };

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

  return (
    <ContenedorPrincipal
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      height="100%"
      width="100%"
      padding="0"
    >
      <ContenedorPrincipal
        width="100%"
        justifyContent="flex-start"
        gap="10px"
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
      </ContenedorPrincipal>
      <TablaInfoUI
        data={data}
        columns={columnsConfig}
        onSort={handleSort}
        defaultFilters={["VENDEDOR"]}
        sortedInitial={{ column: "CODIGO", direction: "asc" }}
        onFilterChange={handleSort}
        excel={tienePermiso.exportar}
        filenameExcel={fileName()}
        nombresColumnasPersonalizadosExcel={nombresPersonalizados}
      />
    </ContenedorPrincipal>
  );
};
