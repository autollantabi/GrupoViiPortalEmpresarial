import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";
import {
  obtenerBonificacionesManuales,
  ObtenerReporteComisionesTecnicentroVendedores,
  obtenerVerificaciondeCategorizaciones,
} from "services/contabilidadService";
import {
  obtenerAniosDesde2020,
  transformarDataAValueLabel,
} from "utils/Utils";

import { ButtonUI } from "components/UI/Components/ButtonUI";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { SelectUI } from "components/UI/Components/SelectUI";

import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { InputUI } from "components/UI/Components/InputUI";

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

const ContenedorFlexColumn = styled(ContenedorFlex)`
  flex-direction: column;
`;

const ContenedorFlexRow = styled(ContenedorFlex)`
  flex-direction: row;
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

const TituloSeccion = styled.h5`
  color: ${({ theme }) => theme.colors.text || "#212529"};
  margin: 0;
`;

const SubtituloSeccion = styled.h6`
  color: ${({ theme }) => theme.colors.text || "#212529"};
  margin: 0;
`;

const LabelVendedor = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text || "#212529"};
`;

const CardVendedor = styled(ContenedorFlex)`
  text-align: center;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 10px;
  padding: 2px;
  max-width: 125px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || "#ffffff"};
`;

const GridBonificaciones = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const ContenedorBonificaciones = styled(ContenedorFlex)`
  flex-direction: column;
  width: 35%;
  border-right: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  height: 100%;
  justify-content: flex-start;
  min-width: 420px;
  padding: 10px;
  gap: 10px;
`;

export const ComisionesTecnicentro = ({
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
        const datosSeparados = groupData(datosReporte.resultadoFinal);
        const datosTotales = groupDataTotales(datosReporte.sumatoriaFinal);

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
      general: empresasDisponibles && empresasDisponibles.length > 0,
      // Permiso para consultar reportes
      consultar: empresasDisponibles && empresasDisponibles.length > 0,
      // Permiso para exportar a Excel
      exportar: empresasDisponibles && empresasDisponibles.length > 0,
    };
  }, [empresasDisponibles]);

  // Todos los useEffect deben estar antes de cualquier return condicional
  useEffect(() => {
    if (tienePermiso.general) {
      datosIniciales();
    }
  }, [empresasDisponibles, tienePermiso.general]);

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
        <TextoMensaje>No tienes permisos para acceder a Comisiones Tecnicentro.</TextoMensaje>
      </ContenedorPrincipal>
    );
  }

  return (
    <ContenedorPrincipal
      justifyContent="flex-start"
      alignItems="flex-start"
      flexDirection="column"
      height="100%"
      width="100%"
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
        {tienePermiso.exportar &&
          anioSl &&
          mes &&
          verificaciondeCategorias &&
          data11.length > 0 &&
          data12.length > 0 && (
            <ButtonUI
              iconLeft="FaFileExcel"
              onClick={async () => {
                try {
                  const res = await exportToExcel();
                  if (res) {
                    toast.success("Exportación exitosa");
                  } else {
                    toast.error("Error al exportar");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("Error al exportar");
                }
              }}
              isAsync={true}
              pcolor={theme?.colors?.success || "#28a745"}
            />
          )}
      </ContenedorFlex>
      <ContenedorFlex width="100%" alignItems="flex-start">
        <ContenedorBonificaciones>
          <Separador />
          <TituloSeccion>BONIFICACIONES</TituloSeccion>
          {!anioSl && !mes && (
            <TextoMensaje>Seleccione una fecha para poder consultar</TextoMensaje>
          )}
          {!verificaciondeCategorias && anioSl && mes && (
            <TextoMensaje>Hay categorías de productos pendientes por asignar</TextoMensaje>
          )}

          {anioSl &&
            mes &&
            verificaciondeCategorias &&
            Object.entries(agrupadoPorClasificacion).map(
              ([clasificacion, tipos]) => (
                <ContenedorFlex
                  flexDirection="column"
                  key={clasificacion}
                  gap="10px"
                >
                  <TituloSeccion>{clasificacion}</TituloSeccion>
                  {Object.entries(tipos).map(([tipo, vendedores]) => (
                    <div key={tipo} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <SubtituloSeccion>{tipo}</SubtituloSeccion>
                      <GridBonificaciones>
                        {vendedores.map((vendedor) => (
                          <CardVendedor
                            key={vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR}
                          >
                            <LabelVendedor>
                              {vendedor.NOMBRE_VENDEDOR}
                            </LabelVendedor>
                            <InputUI
                              type="number"
                              min={0}
                              value={
                                valores[
                                  vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR
                                ] ?? 0
                              }
                              placeholder="Valor"
                              containerStyle={{ width: "100px" }}
                              onChange={(text) =>
                                handleInputChange(
                                  vendedor.IDENTIFICADOR_AGRUPACION_VENDEDOR,
                                  text
                                )
                              }
                            />
                          </CardVendedor>
                        ))}
                      </GridBonificaciones>
                    </div>
                  ))}
                </ContenedorFlex>
              )
            )}
          {tienePermiso.consultar &&
            anioSl &&
            mes &&
            verificaciondeCategorias && (
              <ButtonUI
                text="Consultar"
                onClick={async () => {
                  try {
                    const res = await generarJSON();
                    if (res) {
                      toast.success("Consulta Exitosa");
                    } else {
                      toast.error("Error al consultar");
                    }
                  } catch (error) {
                    console.error("Error:", error);
                    toast.error("Error al consultar");
                  }
                }}
                isAsync={true}
                pcolor={theme?.colors?.secondary || "#fd4703"}
              />
            )}
        </ContenedorBonificaciones>

        <ContenedorFlex flexDirection="column" width="100%">
          <Separador />
          <ContenedorFlexColumn width="100%" padding="15px 10px" gap="10px">
            <TituloSeccion>VENDEDORES</TituloSeccion>

            <ContenedorFlexRow
              justifyContent="space-around"
              alignItems="flex-start"
              width="85%"
              gap="3%"
            >
              <TablaInfoUI
                key={`vendedores-data11-${data11.length}`}
                data={data11}
                columns={columnsConfig11}
                defaultFilters={["nombreAgrupacion", "nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreAgrupacion", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
              <TablaInfoUI
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
          <Separador />
          <ContenedorFlexColumn width="100%" padding="15px 10px" gap="10px">
            <TituloSeccion>MECÁNICOS</TituloSeccion>
            <ContenedorFlexRow
              justifyContent="space-around"
              alignItems="flex-start"
              width="85%"
              gap="3%"
            >
              <TablaInfoUI
                key={`mecanicos-data12-${data12.length}`}
                data={data12}
                columns={columnsConfig12}
                defaultFilters={["nombreAgrupacion", "nombreVendedor"]}
                onSort={handleSort}
                sortedInitial={{ column: "nombreAgrupacion", direction: "asc" }}
                onFilterChange={handleSort}
                excel={false}
              />
              <TablaInfoUI
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
    </ContenedorPrincipal>
  );
};
