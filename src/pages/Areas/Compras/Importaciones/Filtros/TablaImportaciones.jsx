import styled from "styled-components";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTheme } from "context/ThemeContext";
import { IconUI } from "components/UI/Components/IconsUI";
import { hexToRGBA } from "utils/colors";

const BODEGA = ["COMPRAS", "BODEGA"];
const COMPRASGERENCIA = ["COMPRAS", "COMPRAS-GERENCIA"];
const IMPORTACIONES = ["COMPRAS", "IMPORTACIONES"];

const ContenedorPrincipal = styled.div`
  display: flex;
  width: 100%;
  padding: 2px 5px;
`;

const TablaImp = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;

  & > thead {
    position: sticky;
    top: 0;
    z-index: 1;
    font-size: 12px;
    th {
      user-select: none;
      background-color: ${({ theme }) => 
        theme.name === "dark"
          ? (theme.colors.backgroundCard || theme.colors.backgroundLight)
          : (theme.colors.secondary || "#3c3c3b")};
      color: ${({ theme }) => 
        theme.name === "dark"
          ? (theme.colors.text || "#212529")
          : (theme.colors.white || "#ffffff")};
      font-weight: 100;
      word-wrap: break-word;
      border-right: 1px solid ${({ theme }) => theme.colors.border};
      &:first-child {
        border-top-left-radius: 5px;
      }
      &:last-child {
        border-top-right-radius: 5px;
      }
    }
  }

  & .filasTablaImportaciones {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text};

    &:nth-child(odd) {
      background-color: ${({ theme }) => theme.colors.backgroundCard};
    }

    &:nth-child(even) {
      background-color: ${({ theme }) => theme.colors.backgroundLight};
    }
    &:last-child {
      td:first-child {
        border-bottom-left-radius: 5px;
      }
      td:last-child {
        border-bottom-right-radius: 5px;
      }
    }

    td {
      border-right: 1px solid ${({ theme }) => theme.colors.border};
      border-bottom: 1px solid ${({ theme }) => theme.colors.border};

      &:first-child {
        border-left: 1px solid ${({ theme }) => theme.colors.border};
      }
      &:last-child {
        border-right: 1px solid ${({ theme }) => theme.colors.border};
      }
    }
  }
`;
const FilaCustom = styled.tr`
  &.completo {
    background-color: ${({ theme }) => theme.colors.successLight || hexToRGBA({ hex: theme.colors.success, alpha: 0.2 })};
  }
`;
const CeldaDIVCustom = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

const ContendorHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
`;

const IndicadorIcon = styled.div`
  font-size: 9px;
  border-radius: 100%;
  width: 10px;
  aspect-ratio: 1;
  background-color: ${({ theme }) => theme.colors.white};
  border: solid 1px ${({ theme }) => theme.colors.text};

  &.verde {
    border: none;
    background-color: ${({ theme }) => theme.colors.success};
  }
  &.amarillo {
    border: none;
    background-color: ${({ theme }) => theme.colors.warning};
  }
  &.rojo {
    border: none;
    background-color: ${({ theme }) => theme.colors.error};
  }
`;

const dataHeadersCompras = [
  { nombre: "ID", campo: "ID_CARGA" },
  { nombre: "EMPRESA", campo: "EMPRESA" },
  { nombre: "PROVEEDOR", campo: "PROVEEDOR" },
  { nombre: "MARCA", campo: "MARCA" },
  { nombre: "NRO. CONT", campo: "CONTENEDORES_ESTIMADOS" },
  { nombre: "PI", campo: "NUMERO_PI" },
  { nombre: "ETD", campo: "ETD" },
  { nombre: "ETA", campo: "ETA" },
  { nombre: "SALDO A PAGAR ($)", campo: "SALDO_POR_PAGAR" },
  { nombre: "FECHA PAGO", campo: "FECHA_SALDO_PAGAR" },
  { nombre: "ESTADO PAGO", campo: "ESTADO_PAGO" },
  { nombre: "ESTADO CARGA", campo: "ESTADO_CARGA" },
];

const dataHeadersBodega = [
  { nombre: "ID", campo: "ID_CARGA" },
  { nombre: "EMPRESA", campo: "EMPRESA" },
  { nombre: "MARCA", campo: "MARCA" },
  { nombre: "NRO. CONT", campo: "CONTENEDORES_ESTIMADOS" },
  { nombre: "PI", campo: "NUMERO_PI" },
  { nombre: "ETA", campo: "ETA" },
  { nombre: "LLEGADA BODEGA", campo: "LLEGADA_ESTIMADA_BODEGA" },
];

const columnasBasicasCompras = [
  { nombre: "ID", campo: "ID_CARGA" },
  { nombre: "EMPRESA", campo: "EMPRESA" },
  { nombre: "PROVEEDOR", campo: "PROVEEDOR" },
  { nombre: "MARCA", campo: "MARCA" },
  { nombre: "NRO. CONT", campo: "CONTENEDORES_ESTIMADOS" },
  { nombre: "PI", campo: "NUMERO_PI" },
  { nombre: "ETD", campo: "ETD" },
  { nombre: "ETA", campo: "ETA" },
  { nombre: "SALDO A PAGAR ($)", campo: "SALDO_POR_PAGAR" },
  { nombre: "FECHA PAGO", campo: "FECHA_SALDO_PAGAR" },
  { nombre: "ESTADO PAGO", campo: "ESTADO_PAGO" },
  { nombre: "ESTADO CARGA", campo: "ESTADO_CARGA" },
];

const columnasInen = [{ nombre: "INEN", campo: "INEN" }];

const columnasAutomax = [
  { nombre: "PERMISOS ECA", campo: "PERMISOS_ECA" },
  { nombre: "PERMISOS MINSA", campo: "PERMISOS_MINSA" },
  { nombre: "PERMISOS FAD", campo: "PERMISOS_FAD" },
];

const columnasFinales = [{ nombre: "POLIZA", campo: "POLIZA" }];

export const TablaImportaciones = ({
  filtrosActivos,
  filtroGlobal,
  editarRegistro,
  infoRegistro,
  dataImportacion,
  varcambiar,
  setExcelData,
  lengthDataFiltrada,
  availableCompanies, // Empresas disponibles del nuevo sistema de recursos
  routeConfig,
}) => {
  const { theme } = useTheme();
  const [dataFiltrada, setDataFiltrada] = useState(dataImportacion || []);
  const [dataHeaders, setDataHeaders] = useState([]);
  const [orden, setOrden] = useState({ columna: "ATA", direccion: "desc" });
  const [permisosComprasL, setPermisosComprasL] = useState(0);

  // Usar el rol específico del contexto del recurso que viene del router
  const rolesUsuario = useMemo(() => {
    if (routeConfig?.rolDelRecurso) {
      return [routeConfig.rolDelRecurso];
    }
    return [];
  }, [routeConfig]);

  // Memoizar nombres de empresas para evitar recálculos innecesarios
  const nombresEmpresas = useMemo(() => {
    if (availableCompanies && availableCompanies.length > 0) {
      return availableCompanies.map(emp => emp.nombre);
    }
    return [];
  }, [availableCompanies]);

  const asignarDatos = useCallback(() => {
    // Usar dataImportacion directamente (ya viene filtrado desde Importaciones.jsx)
    if (!dataImportacion || dataImportacion.length === 0) {
      setDataFiltrada([]);
      lengthDataFiltrada(0);
      setExcelData([]);
      return;
    }

    // Paso 1: Filtrar por empresas disponibles (del nuevo sistema de recursos)
    let datosf1 = [];
    if (nombresEmpresas.length > 0) {
      datosf1 = dataImportacion.filter((res) =>
        nombresEmpresas.includes(res.EMPRESA)
      );
    } else {
      // Si no hay empresas disponibles, no mostrar datos
      datosf1 = [];
    }

    // Paso 2: Validar Estado Importación Data
    const filtro5Activo =
      filtrosActivos.find((filtro) => filtro.filtro === 5).valor.length === 0;
    if (filtro5Activo) {
      datosf1 = datosf1.filter(
        (res) => res.ESTADO_IMPORTACION === "EN PROCESO"
      );
    }

    // Paso 3: Aplicar Filtros Activos
    let dataTemporal = [...datosf1];
    filtrosActivos.forEach((filtro) => {
      if (filtro.filtro === 6) {
        const { months, year } = filtro.valor;
        const monthNames = [
          "ene",
          "feb",
          "mar",
          "abr",
          "may",
          "jun",
          "jul",
          "ago",
          "sept",
          "oct",
          "nov",
          "dic",
        ];
        if (months.length === 0 && year === null) {
          return dataTemporal;
        }

        dataTemporal = dataTemporal.filter((item) => {
          if (!months && !year) {
            return true;
          }
          if (item.ETA === null) {
            return false;
          }

          const itemDate = new Date(item.ATA);
          const itemMonth = monthNames[itemDate.getUTCMonth()];
          const itemYear = itemDate.getUTCFullYear();

          const filterByMonth =
            months && months.length > 0 ? months.includes(itemMonth) : true;
          const filterByYear = year ? itemYear === year : true;

          return filterByMonth && filterByYear;
        });
      } else if (filtro.valor.length > 0) {
        switch (filtro.filtro) {
          case 0:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.EMPRESA.includes(val))
            );
            break;
          case 1:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.PROVEEDOR.includes(val))
            );
            break;
          case 2:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.MARCA.includes(val))
            );
            break;
          case 3:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.ESTADO_CARGA.includes(val))
            );
            break;
          case 4:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.ESTADO_PAGO.includes(val))
            );
            break;
          case 5:
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.ESTADO_IMPORTACION.includes(val))
            );
            break;
          default:
            break;
        }
      }
    });

    // Paso 4: Aplicar Filtro Global
    if (filtroGlobal.value) {
      if (filtroGlobal.campo) {
        dataTemporal = dataTemporal.filter((item) =>
          item[filtroGlobal.campo]
            ?.toString()
            .toLowerCase()
            .includes(filtroGlobal.value.toLowerCase())
        );
      } else {
        dataTemporal = dataTemporal.filter((item) =>
          Object.values(item).some((value) =>
            value
              ?.toString()
              .toLowerCase()
              .includes(filtroGlobal.value.toLowerCase())
          )
        );
      }
    }

    // Paso 5: Ordenar Datos
    if (orden.columna) {
      dataTemporal = dataTemporal.sort((a, b) => {
        let valorA = a[orden.columna];
        let valorB = b[orden.columna];

        if (valorA === null || valorA === undefined || valorA === "") {
          return orden.direccion === "asc" ? 1 : -1;
        }
        if (valorB === null || valorB === undefined || valorB === "") {
          return orden.direccion === "asc" ? -1 : 1;
        }

        return orden.direccion === "asc"
          ? valorA < valorB
            ? -1
            : 1
          : valorA > valorB
          ? -1
          : 1;
      });
    }

    // Actualizar data filtrada
    setDataFiltrada(dataTemporal);
    setExcelData(dataTemporal);
  }, [dataImportacion, nombresEmpresas, filtrosActivos, filtroGlobal, orden, setExcelData]);

  const establecerImportacionEditar = (item) => {
    editarRegistro(true);
    infoRegistro(item.ID_CARGA);
  };

  function formatearFecha(fechaIso) {
    const fecha1 = new Date(fechaIso);
    const day = String(fecha1.getUTCDate()).padStart(2, "0");
    const month = String(fecha1.getUTCMonth() + 1).padStart(2, "0");
    const year = fecha1.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  const HeaderColumna = ({ nombre, campo, orden, ordenarData }) => {
    return (
      <th onClick={() => ordenarData(campo)}>
        <ContendorHeader>
          {nombre}{" "}
          {orden.columna === campo &&
            (orden.direccion === "asc" ? (
              <IconUI name="FaSortDown" size={12} color={theme.name === "dark" ? theme.colors.text : theme.colors.white} />
            ) : (
              <IconUI name="FaSortUp" size={12} color={theme.name === "dark" ? theme.colors.text : theme.colors.white} />
            ))}
        </ContendorHeader>
      </th>
    );
  };
  // Dependencia en dataImportacion para reaccionar a sus cambios

  // Función para calcular la diferencia en días entre dos fechas
  function diferenciaDias(fecha1, fecha2) {
    const diffTime = Math.abs(fecha2 - fecha1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Función para obtener el color basado en la diferencia de días
  function getColorPorFecha(fecha) {
    const hoy = new Date();
    const etd = new Date(fecha);
    const diasDiferencia = diferenciaDias(hoy, etd);

    // Establece el número máximo de días para el rango de colores
    const maxDias = 30; // ajusta según sea necesario

    if (etd > hoy) {
      // Fecha futura: más verde a medida que se aleja
      const green = Math.min(255, (255 * diasDiferencia) / maxDias);
      const red = Math.max(0, 255 - green);
      return `rgba(${red}, ${green}, 0, 0.5)`;
    } else {
      // Fecha pasada o presente: más roja a medida que se aleja
      const red = Math.min(255, (255 * diasDiferencia) / maxDias);
      const alpha = 0.3 + (0.4 * red) / 255; // ajusta la transparencia según la intensidad del rojo
      return `rgba(255, 0, 0, ${alpha})`;
    }
  }

  const ordenarData = (campo) => {
    const esAscendente = orden.columna === campo && orden.direccion === "asc";
    setOrden({
      columna: campo,
      direccion: esAscendente ? "desc" : "asc",
    });
    // asignarDatos();
  };

  useEffect(() => {
    asignarDatos();
  }, [asignarDatos]);

  // Actualizar el contador de registros filtrados por separado para evitar bucles
  useEffect(() => {
    if (dataFiltrada) {
      lengthDataFiltrada(dataFiltrada.length);
    }
  }, [dataFiltrada, lengthDataFiltrada]);

  const formatearNumeros = (value) => {
    const numericValue = parseFloat(value.toString().replace(/,/g, ""));
    let formattedValue = 0;
    if (!isNaN(numericValue)) {
      formattedValue = numericValue.toLocaleString("en-GB", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return formattedValue;
  };

  useEffect(() => {
    const fetchDataHeaders = () => {
      // Verificar roles del usuario para determinar qué columnas mostrar
      const tieneRolVentas = rolesUsuario.includes("usuario");
      const tieneRolJefatura = rolesUsuario.includes("jefatura");
      const tieneRolBodega = rolesUsuario.includes("bodega");

      if (tieneRolVentas || tieneRolJefatura) {
        // Determinar las empresas a las que tiene acceso
        const empresasPermitidas = availableCompanies
          ? availableCompanies.map((emp) => emp.nombre)
          : [];

        // Verificar si tiene acceso a AUTOMAX
        const tieneAutomax = empresasPermitidas.includes("AUTOMAX");
        const tieneOtrasEmpresas = empresasPermitidas.some(
          (emp) => emp !== "AUTOMAX"
        );

        // Construir las columnas dinámicamente
        let columnasDinamicas = [...columnasBasicasCompras];

        // Agregar columnas según acceso a empresas
        if (tieneOtrasEmpresas && !tieneAutomax) {
          // Solo otras empresas: mostrar INEN
          columnasDinamicas = [...columnasDinamicas, ...columnasInen];
        } else if (tieneAutomax && !tieneOtrasEmpresas) {
          // Solo AUTOMAX: mostrar ECA, MINSA, FAD
          columnasDinamicas = [...columnasDinamicas, ...columnasAutomax];
        } else if (tieneAutomax && tieneOtrasEmpresas) {
          // Ambos tipos: mostrar todas las columnas
          columnasDinamicas = [
            ...columnasDinamicas,
            ...columnasInen,
            ...columnasAutomax,
          ];
        }

        // Agregar columnas finales
        columnasDinamicas = [...columnasDinamicas, ...columnasFinales];

        setDataHeaders(columnasDinamicas);
        setPermisosComprasL(1);
      } else if (tieneRolBodega) {
        // Para usuarios de bodega mantener las columnas originales
        setDataHeaders(dataHeadersBodega);
      } else {
        // Por defecto, usar columnas básicas
        setDataHeaders(columnasBasicasCompras);
      }
    };

    fetchDataHeaders();
  }, [availableCompanies, rolesUsuario]);

  return (
    <ContenedorPrincipal style={{ flexDirection: "column" }}>
      <TablaImp>
        <thead>
          <tr>
            {dataHeaders.map((item, index) => (
              <HeaderColumna
                key={index}
                nombre={item.nombre}
                campo={
                  item.campo === "ETA"
                    ? "ATA"
                    : item.campo === "ETD"
                    ? "ATD"
                    : item.campo
                }
                orden={orden}
                ordenarData={ordenarData}
              />
            ))}
            <th></th>
          </tr>
        </thead>

        <tbody>
          {dataFiltrada.length > 0 ? (
            dataFiltrada.map((item, index) => (
              <FilaCustom
                key={index}
                className={`filasTablaImportaciones ${
                  item.ESTADO_IMPORTACION !== "EN PROCESO" && "completo"
                }`}
              >
                {/* Renderizar celdas dinámicamente según las columnas mostradas */}
                {dataHeaders.map((header, idx) => {
                  const campo = header.campo;
                  const valor = item[campo];

                  // Renderizar celda según el tipo de campo
                  switch (campo) {
                    case "ID_CARGA":
                    case "EMPRESA":
                    case "PROVEEDOR":
                    case "MARCA":
                      return <td key={idx}>{valor || "-"}</td>;

                    case "CONTENEDORES_ESTIMADOS":
                      return <td key={idx}>{valor || "-"}</td>;

                    case "NUMERO_PI":
                      return (
                        <td key={idx}>
                          {item.NUMERO_PI === null || item.NUMERO_PI === ""
                            ? item.NUMERO_PIP === null || item.NUMERO_PIP === ""
                              ? "-"
                              : item.NUMERO_PIP
                            : item.NUMERO_PI}
                        </td>
                      );

                    case "ETD":
                      return (
                        <td key={idx}>
                          

                          {item["ATD"]
                            ? formatearFecha(item["ATD"])
                            : valor
                            ? formatearFecha(valor)
                            : "-"}
                          {/* {valor !== null ? formatearFecha(valor) : "-"} */}
                        </td>
                      );

                    case "ETA":
                      return (
                        <td
                          key={idx}
                          style={{
                            backgroundColor: item["ATA"]
                              ? getColorPorFecha(item["ATA"])
                              : "transparent",
                          }}
                        >
                          {item["ATA"] ? formatearFecha(item["ATA"]) : "-"}
                        </td>
                      );

                    case "SALDO_POR_PAGAR":
                      return (
                        <td key={idx}>
                          {valor === null
                            ? "-"
                            : `$ ${formatearNumeros(valor)}`}
                        </td>
                      );

                    case "FECHA_SALDO_PAGAR":
                    case "FECHA_LIBERACION":
                    case "LLEGADA_ESTIMADA_BODEGA":
                      return (
                        <td key={idx}>
                          {valor !== null ? formatearFecha(valor) : "-"}
                        </td>
                      );

                    case "ESTADO_PAGO":
                      return (
                        <td key={idx}>
                          <CeldaDIVCustom>
                            <IndicadorIcon
                              className={`circle ${
                                valor === "CON ANTICIPO"
                                  ? "amarillo"
                                  : valor === "PAGADO"
                                  ? "verde"
                                  : valor === "PENDIENTE" && "rojo"
                              }`}
                            />
                            {valor}
                          </CeldaDIVCustom>
                        </td>
                      );

                    case "ESTADO_CARGA":
                      return (
                        <td key={idx}>
                          <CeldaDIVCustom>
                            <IndicadorIcon
                              className={`circle ${
                                valor === "CERRADO POR PAGAR"
                                  ? "amarillo"
                                  : valor === "CERRADO"
                                  ? "rojo"
                                  : valor === "ABIERTO" && "verde"
                              }`}
                            />
                            {valor}
                          </CeldaDIVCustom>
                        </td>
                      );

                    case "INEN":
                    case "PERMISOS_ECA":
                    case "PERMISOS_MINSA":
                    case "PERMISOS_FAD":
                      return (
                        <td key={idx}>
                          <CeldaDIVCustom>
                            <IndicadorIcon
                              className={`circle ${
                                valor === "NINGUNO"
                                  ? "rojo"
                                  : valor === "AUTORIZADO"
                                  ? "naranja"
                                  : valor === "SUBSANADO"
                                  ? "amarillo"
                                  : valor === "APROBADO" && "verde"
                              }`}
                            />
                            {valor}
                          </CeldaDIVCustom>
                        </td>
                      );

                    case "POLIZA":
                      return (
                        <td key={idx}>
                          <CeldaDIVCustom>
                            <IndicadorIcon
                              className={`circle ${
                                valor === "PENDIENTE"
                                  ? "rojo"
                                  : valor === "APLICADO" && "verde"
                              }`}
                            />
                            {valor}
                          </CeldaDIVCustom>
                        </td>
                      );

                    default:
                      return <td key={idx}>{valor || "-"}</td>;
                  }
                })}

                {/* Botón de edición siempre al final */}
                <td
                  style={{ 
                    cursor: "pointer", 
                    userSelect: "none",
                    textAlign: "center",
                    verticalAlign: "middle",
                    padding: "8px"
                  }}
                  onClick={() => establecerImportacionEditar(item)}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <IconUI 
                      name="FaPenToSquare" 
                      size={18} 
                      color={theme.colors.textSecondary || theme.colors.text}
                      style={{ transition: "all 0.2s ease" }}
                    />
                  </div>
                </td>
              </FilaCustom>
            ))
          ) : (
            <tr>
              <td colSpan={dataHeaders.length + 1}>No data available</td>
            </tr>
          )}
        </tbody>
      </TablaImp>
    </ContenedorPrincipal>
  );
};
