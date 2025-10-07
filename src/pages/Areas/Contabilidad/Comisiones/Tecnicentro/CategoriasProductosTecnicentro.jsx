import React, { useEffect, useState } from "react";
import Select from "react-select";

import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";
import { withPermissions } from "../../../../../hoc/withPermissions";
import { TablaGeneralizada } from "components/UI/ComponentesGenericos/TablaInputs";

import {
  ObtenerCategoriasSubcategoriasTecnicentro,
  ObtenerProductosTecnicentro,
  UpdateCategoriasSubcategoriasTecnicentro,
} from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "components/UI/ComponentesGenericos/Utils";
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

const CategoriasProductosTecnicentroComponent = ({
  empresasAcceso,
  permissionsLoading,
}) => {
  const [permisosSeccion, setPermisosSeccion] = useState([]);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false); // Indica si la configuración está cargada
  const [anio, setAnio] = useState("");
  const [anioSl, setAnioSl] = useState("");
  const [mes, setMes] = useState("");

  const nombresPersonalizadosExcel = {
    VENDEDOR: "VENDEDOR",
    VTAS: "VTAS ($)",
    PPTO: "PPTO ($)",
    CPTO_P: "CPTO %",
    VEN_RIN_PEQUENIO: "% VENTAS $ RIN PEQUEÑO",
    VEN_RIN_GRANDE: "% VENTAS $ RIN GRANDE",
    VEN_RIN_CAMION: "% VENTAS $ RIN CAMIÓN",
  };

  const [columnsConfig, setColumnsConfig] = useState([
    { header: "CODIGO", field: "CODIGO", visible: true },
    {
      header: "ITEM",
      field: "IDENTIFICADOR",
    },
    {
      header: "NOMBRE",
      field: "NOMBRE",
      width: "750px",
    },
    {
      header: "CATEGORIA",
      field: "CATEGORIA",
      editType: "dropdown",
      isEditable: true,
      maxoptions: 20,
      options: [],
      required: true,
    },
    {
      header: "SUBCATEGORIA",
      field: "SUBCATEGORIA",
      editType: "dropdown",
      maxoptions: 40,
      isEditable: true,
      options: [],
      required: true,
    },
    { header: "ESTADO", field: "ESTADO", visible: false },
    // más configuraciones de columnas según sea necesario
  ]);

  // Estado que mantiene los datos de la tabla
  const [data, setData] = useState([]);

  const datosIniciales = async () => {
    const anios = obtenerAniosDesde2020();
    const listaAnios = transformarDataAValueLabel({
      data: anios,
      valueField: "ANIO",
      labelField: "ANIO",
    });

    setAnio(listaAnios);
  };

  const datosCategorias = async ({ mes, anio }) => {
    const datosProductosTecnicentro = await ObtenerProductosTecnicentro({
      mes,
      anio,
    });
    console.log(datosProductosTecnicentro);

    const datosPTecFin = datosProductosTecnicentro.map((item) => ({
      ...item,
      EMPRESA: "AUTOLLANTA",
    }));

    setData(datosPTecFin);
  };
  useEffect(() => {
    if (anioSl && mes) {
      datosCategorias({ mes: mes.value, anio: anioSl.value });
    }
  }, [anioSl, mes]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (data.length > 0) {
        try {
          // Llamadas asíncronas
          const categoriassubcategorias =
            await ObtenerCategoriasSubcategoriasTecnicentro();

          const categorias = transformarDataAValueLabel({
            data: categoriassubcategorias.CATEGORIAS,
          });

          const subcategorias = transformarDataAValueLabel({
            data: categoriassubcategorias.SUBCATEGORIAS,
          });

          // Actualizar configuración de columnas con las opciones cargadas
          const updatedColumns = columnsConfig.map((col) => {
            if (col.field === "CATEGORIA") {
              return {
                ...col,
                options: categorias,
              };
            }
            if (col.field === "SUBCATEGORIA") {
              return {
                ...col,
                options: subcategorias,
              };
            }
            return col;
          });

          setColumnsConfig(updatedColumns);
          // Marcar la configuración como cargada
          setIsConfigLoaded(true);
        } catch (error) {
          console.error("Error al cargar datos:", error);
        }
      }
    };
    cargarDatos();
  }, [data]);

  // const fileName = () => {
  //   var fileN = "";
  //   if (mes !== "" && anioSl !== "") {
  //     fileN = `Comisiones_Tecnicentro_${mes.label}_${anioSl.label}`;
  //   }
  //   return fileN;
  // };

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      // Los permisos se obtienen automáticamente del HOC
      setPermisosSeccion(empresasAcceso || []);
    };

    cargarDatosIniciales();
  }, [empresasAcceso]);

  useEffect(() => {
    datosIniciales();
  }, []);

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
    console.log("Sorted:", column, direction);
  };
  // Manejar el guardado de datos
  const handleSave = async (item) => {
    let updateConf = false;
    const dataUpdate = {
      identificadorItem: parseInt(item.CODIGO),
      categoria: item.CATEGORIA,
      subcategoria: item.SUBCATEGORIA,
      creadorPor: parseInt(localStorage.getItem("identificador")),
    };

    try {
      const update = await UpdateCategoriasSubcategoriasTecnicentro({
        data: dataUpdate,
      });
      updateConf = { id: item.CODIGO, res: update };
    } catch (error) {
      console.error("Error al actualizar el cheque:", error);
      updateConf = { id: item.CODIGO, res: false }; // Respuesta fallida
    }
    return updateConf;
  };

  return (
    <CustomContainer
      justifyContent="flex-start"
      alignItems="flex-start"
      flexDirection="column"
      width="100%"
      height="100%"
      style={{ padding: "0" }}
    >
      <span
        style={{
          alignSelf: "flex-start",
          paddingLeft: "5px",
          fontSize: "20px",
        }}
      >
        TECNICENTRO
      </span>
      <ContenedorFlex
        style={{
          padding: "5px",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
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
      </ContenedorFlex>
      <ContenedorFlex
        style={{
          width: "100%",
          height: "2px",
          backgroundColor: "gray",
          opacity: 0.5,
        }}
      ></ContenedorFlex>
      <ContenedorFlex
        style={{
          padding: "5px",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        {anioSl && mes ? (
          isConfigLoaded ? (
            <TablaGeneralizada
              data={data}
              columnsConfig={columnsConfig}
              setData={setData}
              nombreID={"CODIGO"}
              estadocondiciones={[{ 0: ["CATEGORIA", "SUBCATEGORIA"] }]}
              permisoagregar={[]}
              permisos={permisosSeccion}
              sortedInitial={{ column: "CODIGO", direction: "desc" }}
              defaultFilters={["NOMBRE", "CATEGORIA", "SUBCATEGORIA"]}
              onSave={handleSave}
            />
          ) : (
            <p>Cargando configuración, por favor espera...</p>
          )
        ) : (
          <p>Seleccione un mes y año</p>
        )}
      </ContenedorFlex>
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const CategoriasProductosTecnicentro = withPermissions(
  CategoriasProductosTecnicentroComponent
);
