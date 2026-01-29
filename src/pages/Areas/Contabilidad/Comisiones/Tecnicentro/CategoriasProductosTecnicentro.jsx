import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";

import { TablaInputsUI } from "components/UI/Components/TablaInputsUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";

import {
  ObtenerCategoriasSubcategoriasTecnicentro,
  ObtenerProductosTecnicentro,
  UpdateCategoriasSubcategoriasTecnicentro,
} from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "utils/Utils";

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
  background-color: ${({ backgroundColor, theme }) => 
    backgroundColor || "transparent"};
`;

const Separador = styled.div`
  width: 100%;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.border || "#dee2e6"};
  opacity: 0.5;
`;

const TextoTitulo = styled.span`
  align-self: flex-start;
  padding-left: 5px;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text || "#212529"};
`;

const TextoMensaje = styled.p`
  color: ${({ theme }) => theme.colors.text || "#212529"};
`;

export const CategoriasProductosTecnicentro = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
}) => {
  const { theme } = useTheme();
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
    try {
      const datosProductosTecnicentro = await ObtenerProductosTecnicentro({
        mes,
        anio,
      });

      // Validar que la respuesta sea un array
      if (
        !datosProductosTecnicentro ||
        !Array.isArray(datosProductosTecnicentro)
      ) {
        console.error(
          "La respuesta no es un array válido:",
          datosProductosTecnicentro
        );
        setData([]);
        return;
      }

      const datosPTecFin = datosProductosTecnicentro.map((item) => ({
        ...item,
        EMPRESA: "AUTOLLANTA",
      }));

      setData(datosPTecFin);
    } catch (error) {
      console.error("Error al obtener productos de Tecnicentro:", error);
      setData([]);
    }
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

  // Usar availableCompanies de routeConfig si está disponible, sino usar las props
  const companiesSource = useMemo(() => {
    return routeConfig?.availableCompanies || availableCompanies;
  }, [routeConfig?.availableCompanies, availableCompanies]);

  // Convertir availableCompanies de { id, nombre } a { idempresa, empresa } para compatibilidad
  const empresasDisponibles = useMemo(() => {
    if (!companiesSource || companiesSource.length === 0) {
      return [];
    }
    return companiesSource.map(emp => ({
      idempresa: emp.id,
      empresa: emp.nombre,
    }));
  }, [companiesSource]);

  // Verificar que AUTOLLANTA esté en las empresas disponibles (requerido para Tecnicentro)
  const tieneAccesoAutoLLanta = useMemo(() => {
    return empresasDisponibles.some(emp => emp.empresa === "AUTOLLANTA");
  }, [empresasDisponibles]);

  // Obtener el rol del recurso para determinar el tipo de permiso
  const rolDelRecurso = useMemo(() => {
    return routeConfig?.rolDelRecurso || null;
  }, [routeConfig?.rolDelRecurso]);

  // Transformar empresasDisponibles al formato que espera TablaInputsUI
  // Necesita: { empresa: string, permiso: "E" | "C" }
  // Si el rol es "jefatura" → permiso "E" (editar), sino → permiso "C" (consultar)
  const permisosFormateados = useMemo(() => {
    if (!empresasDisponibles || empresasDisponibles.length === 0) {
      return [];
    }
    const tipoPermiso = rolDelRecurso === "jefatura" ? "E" : "C";
    return empresasDisponibles.map(emp => ({
      empresa: emp.empresa,
      permiso: tipoPermiso,
      idempresa: emp.idempresa, // Mantener idempresa por si se necesita
    }));
  }, [empresasDisponibles, rolDelRecurso]);

  // Verificar permisos específicos
  // Para Tecnicentro, se requiere acceso a AUTOLLANTA específicamente
  // Solo jefatura puede editar, otros roles solo consultan
  const tienePermiso = useMemo(() => {
    const tieneAcceso = tieneAccesoAutoLLanta && empresasDisponibles && empresasDisponibles.length > 0;
    const puedeEditar = tieneAcceso && rolDelRecurso === "jefatura";
    return {
      general: tieneAcceso,
      editar: puedeEditar,
      consultar: tieneAcceso, // Todos los que tienen acceso pueden consultar
    };
  }, [tieneAccesoAutoLLanta, empresasDisponibles, rolDelRecurso]);

  useEffect(() => {
    if (tienePermiso.general) {
      datosIniciales();
    }
  }, [tienePermiso.general]);

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
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
        <TextoMensaje>
          No tienes permisos para acceder a Categorías de Productos Tecnicentro.
        </TextoMensaje>
      </ContenedorPrincipal>
    );
  }

  return (
    <ContenedorPrincipal
      justifyContent="flex-start"
      alignItems="flex-start"
      flexDirection="column"
      width="100%"
      height="100%"
      padding="0"
    >
      <TextoTitulo>TECNICENTRO</TextoTitulo>
      <ContenedorFlex
        padding="5px"
        justifyContent="flex-start"
        alignItems="center"
        gap="10px"
      >
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
      </ContenedorFlex>
      <Separador />
      <ContenedorFlex
        padding="15px 10px"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        {anioSl && mes ? (
          isConfigLoaded ? (
            <TablaInputsUI
              data={data}
              columnsConfig={columnsConfig}
              setData={setData}
              nombreID={"CODIGO"}
              estadocondiciones={[{ 0: ["CATEGORIA", "SUBCATEGORIA"] }]}
              permisoagregar={[]}
              permisos={permisosFormateados}
              sortedInitial={{ column: "CODIGO", direction: "desc" }}
              defaultFilters={["NOMBRE", "CATEGORIA", "SUBCATEGORIA"]}
              onSave={handleSave}
            />
          ) : (
            <TextoMensaje>Cargando configuración, por favor espera...</TextoMensaje>
          )
        ) : (
          <TextoMensaje>Seleccione un mes y año</TextoMensaje>
        )}
      </ContenedorFlex>
    </ContenedorPrincipal>
  );
};

// Permisos y empresas vienen de routeConfig inyectado por SimpleRouter
