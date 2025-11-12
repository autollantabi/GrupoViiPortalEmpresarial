import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import * as XLSX from "xlsx";
import {
  obtenerBonificacionesManuales,
  ObtenerReporteComisionesTecnicentroVendedores,
  obtenerVerificaciondeCategorizaciones,
} from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "components/UI/ComponentesGenericos/Utils";

import {
  ContenedorFlex,
  ContenedorFlexColumn,
  ContenedorFlexRow,
} from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";

import {
  BotonConEstadoIconos,
  BotonConEstadoTexto,
} from "components/UI/ComponentesGenericos/Botones";

import { TablaInfo } from "components/UI/ComponentesGenericos/TablaInfo";
import { withPermissions } from "../../../../../hoc/withPermissions";
import { usePermissions } from "../../../../../hooks/usePermissions";
import { GenericTableStyled } from "components/UI/ComponentesGenericos/Tablas";
import { TablaGeneralizada } from "components/UI/ComponentesGenericos/TablaInputs";
import { GenericInputStyled } from "components/UI/ComponentesGenericos/Inputs";
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

const ComisionesTecnicentroComponent = ({
  empresasAcceso,
  permissionsLoading,
  routeConfig,
}) => {
  // Obtener permisos agrupados por submódulo
  const { permissionsByModule } = usePermissions(
    routeConfig?.modulo,
    routeConfig?.subModules
  );
  const nombresPersonalizadosExcel = {
    VENDEDOR: "VENDEDOR",
    VTAS: "VTAS ($)",
    PPTO: "PPTO ($)",
    CPTO_P: "CPTO %",
    VEN_RIN_PEQUENIO: "% VENTAS $ RIN PEQUEÑO",
    VEN_RIN_GRANDE: "% VENTAS $ RIN GRANDE",
    VEN_RIN_CAMION: "% VENTAS $ RIN CAMIÓN",
  };

  const columnsConfig11 = [
    { header: "ID", field: "ID", visible: false },
    {
      header: "TIPO",
      field: "nombreAgrupacion",
      options: [],
      editType: "dropdown",
    },
    {
      header: "VENDEDOR",
      field: "nombreVendedor",
      options: [],
      editType: "dropdown",
    },
    {
      header: "VENTAS ($)",
      field: "ventas",
      format: "money",
    },
    {
      header: "UNIDADES (UN)",
      field: "cantidad",
    },
    {
      header: "COMISIÓN ($)",
      field: "comision",
      format: "money",
    },
    // más configuraciones de columnas según sea necesario
  ];
  const columnsConfig12 = [
    { header: "ID", field: "ID", visible: false },
    {
      header: "TIPO",
      field: "nombreAgrupacion",
      editType: "dropdown",
    },
    {
      header: "MECÁNICO",
      field: "nombreVendedor",
      editType: "dropdown",
    },
    {
      header: "VENTAS ($)",
      field: "ventas",
      format: "money",
    },
    {
      header: "UNIDADES (UN)",
      field: "cantidad",
    },
    {
      header: "COMISIÓN ($)",
      field: "comision",
      format: "money",
    },
    // más configuraciones de columnas según sea necesario
  ];
  const columnsConfig1Totales = [
    {
      header: "TIPO COMISIÓN",
      field: "tipo_comision",
    },

    {
      header: "VENDEDOR",
      field: "nombreVendedor",
      options: [],
      editType: "dropdown",
    },
    {
      header: "TOTAL COMISIÓN",
      field: "comision",
      format: "money",
    },
    // más configuraciones de columnas según sea necesario
  ];
  const columnsConfig2Totales = [
    {
      header: "TIPO COMISIÓN",
      field: "tipo_comision",
    },
    {
      header: "MECÁNICOS",
      field: "nombreVendedor",
      options: [],
      editType: "dropdown",
    },
    {
      header: "TOTAL COMISIÓN",
      field: "comision",
      format: "money",
    },
    // más configuraciones de columnas según sea necesario
  ];

  // Estado que mantiene los datos de la tabla
  const [data11, setData11] = useState([]);
  const [data12, setData12] = useState([]);
  const [data1Total, setData1Total] = useState([]);
  const [data2Total, setData2Total] = useState([]);
  const [dataBonificaciones, setDataBonificaciones] = useState([]);
  const [anio, setAnio] = useState("");
  const [anioSl, setAnioSl] = useState("");
  const [mes, setMes] = useState("");
  // Estado para almacenar los valores de los inputs
  const [valores, setValores] = useState({});
  const [verificaciondeCategorias, setVerificaciondeCategorias] =
    useState(false);

  const exportToExcel = () => {
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    // Definir encabezados personalizados y columnas a incluir
    const headers1112 = (tipo) => {
      return [
        "TIPO",
        tipo === "V" ? "VENDEDOR" : "MECÁNICO",
        "VENTAS($)",
        "UNIDADES",
        "COMISIÓN ($)",
      ];
    };
    const headersTotales = (tipo) => {
      return [
        tipo === "V" ? "VENDEDOR" : "MECÁNICO",
        "TIPO COMISIÓN",
        "COMISIÓN ($)",
      ];
    };
    const headersBonificaciones = () => {
      return ["CLASE", "TIPO", "NOMBRE PERSONAL", "ÚLTIMO VALOR ($)"];
    };
    const filtData = (tipo, data) => {
      return data.map((item) => ({
        TIPO: item.nombreAgrupacion,
        [tipo === "V" ? "VENDEDOR" : "MECÁNICO"]: item.nombreVendedor,
        "VENTAS($)": item.ventas,
        UNIDADES: item.cantidad,
        "COMISIÓN ($)": item.comision,
      }));
    };
    const filtDataTotales = (tipo, data) => {
      return data.map((item) => ({
        [tipo === "V" ? "VENDEDOR" : "MECÁNICO"]: item.nombreVendedor,
        "TIPO COMISIÓN": item.tipo_comision,
        "COMISIÓN ($)": item.comision,
      }));
    };
    const filtDataBonificaciones = (data) => {
      return data.map((item) => ({
        CLASE: item.TIPO,
        TIPO: item.NOMBRE_CLASIFICACION,
        "NOMBRE PERSONAL": item.NOMBRE_VENDEDOR,
        "ÚLTIMO VALOR ($)": item.ULTIMO_VALOR,
      }));
    };
    // Crear hojas de trabajo con encabezados personalizados
    const ws1 = XLSX.utils.json_to_sheet(filtData("V", data11), {
      header: headers1112("V"),
    });
    const ws2 = XLSX.utils.json_to_sheet(filtData("M", data12), {
      header: headers1112("M"),
    });
    const ws3 = XLSX.utils.json_to_sheet(filtDataTotales("V", data1Total), {
      header: headersTotales("V"),
    });
    const ws4 = XLSX.utils.json_to_sheet(filtDataTotales("M", data2Total), {
      header: headersTotales("M"),
    });
    const joinedDataBonificaciones = dataBonificaciones.map((item) => {
      const ultimoValor = valores[item.IDENTIFICADOR_AGRUPACION_VENDEDOR] || 0;

      return {
        ...item,
        ULTIMO_VALOR: ultimoValor,
      };
    });

    const ws5 = XLSX.utils.json_to_sheet(
      filtDataBonificaciones(joinedDataBonificaciones),
      {
        header: headersBonificaciones(),
      }
    );

    // Agregar las hojas al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws1, "Vendedores");
    XLSX.utils.book_append_sheet(wb, ws2, "Mecánicos");
    XLSX.utils.book_append_sheet(wb, ws3, "Total Vendedores");
    XLSX.utils.book_append_sheet(wb, ws4, "Total Mecánicos");
    XLSX.utils.book_append_sheet(wb, ws5, "Bonificaciones");

    // Exportar el libro de trabajo a un archivo Excel
    XLSX.writeFile(
      wb,
      `Comisiones Tecnicentro ${mes.value}/${anioSl.value}.xlsx`
    );
    return true;
  };

  const groupData = (data) => {
    const grouped = {
      MECÁNICOS: [],
      VENDEDORES: [],
    };

    data.forEach((entry) => {
      grouped[entry.tipo].push(...entry.resultado);
    });

    return grouped;
  };
  const groupDataTotales = (data) => {
    const grouped = {
      MECÁNICOS: [],
      VENDEDORES: [],
    };

    data.forEach((entry) => {
      if (grouped[entry.tipo]) {
        grouped[entry.tipo].push(entry);
      }
    });

    return grouped;
  };

  // Transformación de los datos
  const formatData = (data) => {
    let idCounter = 1;
    const formatted = [];

    data.forEach((agrupacion) => {
      const nombreAgrupacion = agrupacion.nombreAgrupacion;
      const comEspNombres = new Set(
        agrupacion.comisionEspecializada.map((ce) => ce.nombreVendedor)
      );
      // console.log(agrupacion);

      agrupacion.dataComisiones.forEach((comData) => {
        if (comData.comision !== null) {
          formatted.push({
            ID: idCounter++, // Agregar un ID único
            nombreAgrupacion,
            nombreVendedor: comData.nombreVendedor,
            ventas: comData.ventas,
            cantidad: comData.cantidad === 0 ? "-" : comData.cantidad,
            comision: comData.comision !== null ? comData.comision : "-",
            comEsp: comEspNombres.has(comData.nombreVendedor),
          });
        }
      });

      // Agregar vendedores que están solo en comisionEspecializada
      agrupacion.comisionEspecializada.forEach((ce) => {
        // if (
        //   !agrupacion.dataComisiones.some(
        //     (dc) => dc.nombreVendedor === ce.nombreVendedor
        //   )
        // ) {
        formatted.push({
          ID: idCounter++, // Agregar un ID único
          nombreAgrupacion,
          nombreVendedor: ce.nombreVendedor,
          ventas: ce.ventas,
          cantidad: ce.cantidad === 0 ? "-" : ce.cantidad,
          comision: ce.comision,
          comEsp: true,
        });
        // }
      });

      // Agregar el total
      formatted.push({
        ID: idCounter++, // Agregar un ID único
        nombreAgrupacion,
        nombreVendedor: "TOTAL",
        ventas: agrupacion.totalVentas,
        cantidad: agrupacion.totalCantidad,
        comision: "-",
      });
    });

    return formatted;
  };

  const datosIniciales = async () => {
    const anios = obtenerAniosDesde2020();
    const listaAnios = transformarDataAValueLabel({
      data: anios,
      valueField: "ANIO",
      labelField: "ANIO",
    });

    setAnio(listaAnios);

    // setEmpresas(transformDataEmpresas);
  };

  const ConsultarReporte = async (datosReporte) => {
    if (mes !== "" && anioSl !== "") {
      if (Object.keys(datosReporte).length) {
        // console.log(datosReporte.resultadoFinal);
        const datosSeparados = groupData(datosReporte.resultadoFinal);
        const datosTotales = groupDataTotales(datosReporte.sumatoriaFinal);
        console.log(datosTotales);

        const dataFinalVendedores = formatData(datosSeparados.VENDEDORES);
        const dataFinalMecanicos = formatData(datosSeparados.MECÁNICOS);

        setData11(dataFinalVendedores);
        setData12(dataFinalMecanicos);
        setData1Total(datosTotales.VENDEDORES);
        setData2Total(datosTotales.MECÁNICOS);
      }

      // setData11(datosReporte.resultadoFinal);
      return Object.keys(datosReporte).length > 0 ? true : false;
    }
  };

  const fileName = () => {
    var fileN = "";
    if (mes !== "" && anioSl !== "") {
      fileN = `Comisiones_Tecnicentro_${mes.label}_${anioSl.label}`;
    }
    return fileN;
  };

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
    // console.log("Sorted:", column, direction);
  };

  // -------------------Codigo para manejar las Bonificaciones

  // Maneja los cambios en los inputs
  const handleInputChange = (identificador, valor) => {
    setValores((prev) => ({
      ...prev,
      [identificador]: valor,
    }));
  };
  // Generar JSON final
  const generarJSON = async () => {
    const vendedores = dataBonificaciones.map((item) => ({
      nombreVendedor: item.NOMBRE_VENDEDOR,
      identificadorAgrupacionVendedor: item.IDENTIFICADOR_AGRUPACION_VENDEDOR,
      valor: parseInt(valores[item.IDENTIFICADOR_AGRUPACION_VENDEDOR]) || 0,
    }));

    if (anioSl && mes) {
      const resRep = await ObtenerReporteComisionesTecnicentroVendedores({
        anio: anioSl.value,
        mes: mes.value,
        data: vendedores,
        idUsu: localStorage.getItem("identificador"),
      });

      const res = await ConsultarReporte(resRep);
      return res;
    }
    return false;
  };
  // Agrupar por NOMBRE_CLASIFICACION y TIPO
  const agrupadoPorClasificacion = dataBonificaciones.reduce((acc, item) => {
    const { NOMBRE_CLASIFICACION, TIPO } = item;
    if (!acc[NOMBRE_CLASIFICACION]) acc[NOMBRE_CLASIFICACION] = {};
    if (!acc[NOMBRE_CLASIFICACION][TIPO]) acc[NOMBRE_CLASIFICACION][TIPO] = [];
    acc[NOMBRE_CLASIFICACION][TIPO].push(item);
    return acc;
  }, {});

  // Verificar permisos específicos por submódulo
  const tienePermiso = useMemo(() => {
    // Como TECNICENTRO no tiene submódulos definidos, verificamos acceso general
    return {
      // Permiso general para ver y usar el módulo
      general: empresasAcceso && empresasAcceso.length > 0,
      // Permiso para consultar reportes
      consultar: empresasAcceso && empresasAcceso.length > 0,
      // Permiso para exportar a Excel
      exportar: empresasAcceso && empresasAcceso.length > 0,
    };
  }, [empresasAcceso]);

  // Todos los useEffect deben estar antes de cualquier return condicional
  useEffect(() => {
    if (tienePermiso.general) {
      datosIniciales();
    }
  }, [empresasAcceso, tienePermiso.general]);

  useEffect(() => {
    const fetchdatosbonificacion = async () => {
      setData11([]);
      setData12([]);
      setData1Total([]);
      setData2Total([]);
      const datosBonificaciones = await obtenerBonificacionesManuales({
        mes: mes.value,
        anio: anioSl.value,
      });

      setDataBonificaciones(datosBonificaciones);
      if (datosBonificaciones && datosBonificaciones.length > 0) {
        const nuevosValores = datosBonificaciones.reduce((acc, item) => {
          acc[item.IDENTIFICADOR_AGRUPACION_VENDEDOR] = item.ULTIMO_VALOR || 0;
          return acc;
        }, {});
        setValores(nuevosValores);
      }
    };
    const fetchVerificacionCategorias = async () => {
      const verifCat = await obtenerVerificaciondeCategorizaciones({
        anio: anioSl.value,
        mes: mes.value,
      });

      setVerificaciondeCategorias(verifCat);
    };
    if (anioSl && mes) {
      fetchVerificacionCategorias();
      if (verificaciondeCategorias) {
        fetchdatosbonificacion();
      }
    }
  }, [anioSl, mes, verificaciondeCategorias]);

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
        <p>No tienes permisos para acceder a Comisiones Tecnicentro.</p>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer
      justifyContent="flex-start"
      alignItems="flex-start"
      flexDirection="column"
      height="100%"
      width="100%"
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
        {/* <Select
          options={empresas} // Opciones pasadas desde la configuración de columnas
          value={empresaSl}
          onChange={(selectedOption) => {
            setEmpresasSl(selectedOption);
          }}
          isSearchable={true}
          placeholder="Empresa"
          styles={customStyles}
        /> */}
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
        {tienePermiso.exportar &&
          anioSl &&
          mes &&
          verificaciondeCategorias &&
          data11.length > 0 &&
          data12.length > 0 && (
            <BotonConEstadoIconos
              tipo={"excel"}
              onClickAction={exportToExcel}
            />
          )}
      </ContenedorFlex>
      <ContenedorFlex style={{ width: "100%", alignItems: "flex-start" }}>
        <ContenedorFlex
          style={{
            flexDirection: "column",
            width: "35%",
            borderRight: "solid 1px gray",
            height: "100%",
            justifyContent: "flex-start",
            minWidth: "420px",
          }}
        >
          <ContenedorFlex
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "gray",
              opacity: 0.5,
            }}
          ></ContenedorFlex>
          <h5>BONIFICACIONES</h5>
          {!anioSl && !mes && (
            <span>Seleccione una fecha para poder consultar</span>
          )}
          {!verificaciondeCategorias && anioSl && mes && (
            <span>Hay categorías de productos pendientes por asignar</span>
          )}

          {anioSl &&
            mes &&
            verificaciondeCategorias &&
            Object.entries(agrupadoPorClasificacion).map(
              ([clasificacion, tipos]) => (
                <ContenedorFlex
                  style={{ flexDirection: "column" }}
                  key={clasificacion}
                >
                  <h5>{clasificacion}</h5>
                  {Object.entries(tipos).map(([tipo, vendedores]) => (
                    <div key={tipo}>
                      <h6>{tipo}</h6>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "10px",
                        }}
                      >
                        {vendedores.map((vendedor) => (
                          <ContenedorFlex
                            key={vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR}
                            style={{
                              textAlign: "center",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "solid 1px gray",
                              borderRadius: "10px",
                              padding: "2px",
                              maxWidth: "125px",
                            }}
                          >
                            <label style={{ fontSize: "14px" }}>
                              {vendedor.NOMBRE_VENDEDOR}
                            </label>
                            <GenericInputStyled
                              type="number"
                              value={
                                valores[
                                  vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR
                                ] ?? 0
                              }
                              min={0}
                              placeholder="Valor"
                              style={{ width: "100px" }}
                              onChange={(e) =>
                                handleInputChange(
                                  vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR,
                                  e.target.value
                                )
                              }
                            />
                          </ContenedorFlex>
                        ))}
                      </div>
                    </div>
                  ))}
                </ContenedorFlex>
              )
            )}
          {tienePermiso.consultar &&
            anioSl &&
            mes &&
            verificaciondeCategorias && (
              <BotonConEstadoTexto
                textoInicial={"Consultar"}
                onClickAction={generarJSON}
                textoActualizando={"Consultando..."}
                textoError={"Error"}
                textoExito={"Consulta Exitosa"}
                time={3000}
              />
            )}
        </ContenedorFlex>

        <ContenedorFlex style={{ flexDirection: "column", width: "100%" }}>
          <ContenedorFlex
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "gray",
              opacity: 0.5,
            }}
          ></ContenedorFlex>
          <ContenedorFlexColumn style={{ width: "100%", padding: "10px 5px" }}>
            <h5>VENDEDORES</h5>

            <ContenedorFlexRow
              style={{
                justifyContent: "space-around",
                alignItems: "flex-start",
                width: "85%",
                gap: "3%",
              }}
            >
              <TablaInfo
                key={`vendedores-data11-${data11.length}`}
                data={data11}
                columns={columnsConfig11}
                defaultFilters={["nombreAgrupacion", "nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreAgrupacion", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
              <TablaInfo
                key={`vendedores-data1Total-${data1Total.length}`}
                data={data1Total}
                columns={columnsConfig1Totales}
                defaultFilters={["nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreVendedor", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
            </ContenedorFlexRow>
          </ContenedorFlexColumn>
          <ContenedorFlex
            style={{
              width: "100%",
              height: "2px",
              backgroundColor: "gray",
              opacity: 0.5,
            }}
          ></ContenedorFlex>
          <ContenedorFlexColumn style={{ width: "100%", padding: "10px 5px" }}>
            <h5>MECÁNICOS</h5>
            <ContenedorFlexRow
              style={{
                justifyContent: "space-around",
                alignItems: "flex-start",
                width: "85%",
                gap: "3%",
              }}
            >
              <TablaInfo
                key={`mecanicos-data12-${data12.length}`}
                data={data12}
                columns={columnsConfig12}
                defaultFilters={["nombreAgrupacion", "nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreAgrupacion", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
              <TablaInfo
                key={`mecanicos-data2Total-${data2Total.length}`}
                data={data2Total}
                columns={columnsConfig2Totales}
                defaultFilters={["nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreVendedor", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
            </ContenedorFlexRow>
          </ContenedorFlexColumn>
        </ContenedorFlex>
      </ContenedorFlex>
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const ComisionesTecnicentro = withPermissions(
  ComisionesTecnicentroComponent
);
