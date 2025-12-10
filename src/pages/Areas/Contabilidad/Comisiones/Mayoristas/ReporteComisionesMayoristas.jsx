import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";

import { ObtenerReporteComisionesMayoristas } from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "components/UI/ComponentesGenericos/Utils";
import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import { TablaInfo } from "components/UI/ComponentesGenericos/TablaInfo";
import { withPermissions } from "../../../../../hoc/withPermissions";
import { usePermissions } from "../../../../../hooks/usePermissions";
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

const ComisionesMayoristasComponent = ({
  empresasAcceso,
  permissionsLoading,
  routeConfig,
}) => {
  // Obtener permisos agrupados por submódulo
  const { permissionsByModule } = usePermissions(
    routeConfig?.modulo,
    routeConfig?.subModules
  );
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
      const datosReporte = await ObtenerReporteComisionesMayoristas({
        codigoEmpresa: empresaSl.value,
        mes: mes.value,
        anio: anioSl.value,
      });
      console.log(datosReporte);
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
      general: empresasAcceso && empresasAcceso.length > 0,
      consultar: empresasAcceso && empresasAcceso.length > 0,
      exportar: empresasAcceso && empresasAcceso.length > 0,
    };
  }, [empresasAcceso]);

  useEffect(() => {
    if (tienePermiso.general) {
      datosIniciales();
    }
  }, [empresasAcceso, tienePermiso.general]);

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <p>Cargando permisos, por favor espera...</p>
      </CustomContainer>
    );
  }

  // Si no hay empresas con acceso, mostrar mensaje
  if (!tienePermiso.general) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <p>No tienes permisos para acceder a Comisiones Mayoristas.</p>
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
        style={{ gap: "10px" }}
      >
        <Select
          options={empresas} // Opciones pasadas desde la configuración de columnas
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
          ]} // Opciones pasadas desde la configuración de columnas
          value={mes}
          onChange={(selectedOption) => {
            setMes(selectedOption);
          }}
          isSearchable={true}
          placeholder="Mes"
          styles={customStyles}
        />
        <Select
          options={anio} // Opciones pasadas desde la configuración de columnas
          value={anioSl}
          onChange={(selectedOption) => {
            setAnioSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Año"
          styles={customStyles}
        />
        {tienePermiso.consultar && (
          <CustomButton
            iconLeft={"FaSearch"}
            onClick={consultarReporte}
            style={{ padding: "5px 10px" }}
            isAsync={true}
          />
        )}
      </CustomContainer>
      <TablaInfo
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
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const ComisionesMayoristas = withPermissions(
  ComisionesMayoristasComponent
);
