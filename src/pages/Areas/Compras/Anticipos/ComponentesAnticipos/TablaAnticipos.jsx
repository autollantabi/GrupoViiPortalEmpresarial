import styled from "styled-components";
import { useEffect, useState } from "react";
import { ListarImportaciones } from "services/importacionesService";
import { useTheme } from "context/ThemeContext";
import { IconUI } from "components/UI/Components/IconsUI";
import { hexToRGBA } from "utils/colors";

const ContenedorPrincipal = styled.div`
  display: flex;
  width: 100%;
  padding: 2px 5px;
`;

const TablaCustm = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;
  font-size: 12px;

  & > thead {
    position: sticky;
    top: 0;
    z-index: 1;
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

  & .filasTabla {
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

const dataHeaders = [
  { nombre: "EMPRESA", campo: "EMPRESA" },
  { nombre: "PROVEEDOR", campo: "PROVEEDOR" },
  { nombre: "MARCA", campo: "MARCA" },
  { nombre: "ETD", campo: "ETD" },
];

export const TablaAnticipos = ({
  filtrosActivos,
  filtroGlobal,
  dataImportacion,
}) => {
  const { theme } = useTheme();
  const [dataFiltrada, setDataFiltrada] = useState(dataImportacion);
  // const [orden, setOrden] = useState({});
  const [orden, setOrden] = useState({ columna: "EMPRESA", direccion: "asc" });

  const asignarDatos = async () => {
    // Paso 1: Obtener los datos de ListarImportaciones
    const res1 = await ListarImportaciones();
    let datos1 = res1;

    // Paso 2: Validar Estado Importación Data
    // const filtro5Activo =
    //   filtrosActivos.find((filtro) => filtro.filtro === 5).valor.length === 0;
    // if (filtro5Activo) {
    //   datos1 = datos1.filter((res) => res.ESTADO_IMPORTACION === "EN PROCESO");
    // }

    // Paso 3: Aplicar Filtros Activos
    let dataTemporal = [...datos1];
    filtrosActivos.forEach((filtro) => {
      if (filtro.filtro === "ETD") {
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

          const itemDate = new Date(item.ETA);
          const itemMonth = monthNames[itemDate.getUTCMonth()];
          const itemYear = itemDate.getUTCFullYear();

          const filterByMonth =
            months && months.length > 0 ? months.includes(itemMonth) : true;
          const filterByYear = year ? itemYear === year : true;

          return filterByMonth && filterByYear;
        });
      } else if (filtro.valor.length > 0) {
        switch (filtro.filtro) {
          case "EMPRESA":
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.EMPRESA.includes(val))
            );
            break;
          case "PROVEEDOR":
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.PROVEEDOR.includes(val))
            );
            break;
          case "MARCA":
            dataTemporal = dataTemporal.filter((item) =>
              filtro.valor.some((val) => item.MARCA.includes(val))
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
  };

  // function parseFecha(fechaString) {
  //   const [day, month, year] = fechaString.split("/");
  //   return new Date(year, month - 1, day);
  // }
  // function formatearFecha(fechaIso) {
  //   const fecha1 = new Date(fechaIso);
  //   const day = String(fecha1.getUTCDate()).padStart(2, "0");
  //   const month = String(fecha1.getUTCMonth() + 1).padStart(2, "0");
  //   const year = fecha1.getUTCFullYear();
  //   return `${day}/${month}/${year}`;
  // }

  const HeaderColumna = ({ nombre, campo, orden, ordenarData, theme }) => {
    return (
      <th onClick={() => ordenarData(campo)}>
        <ContendorHeader>
          {nombre}{" "}
          {orden.columna === campo &&
            (orden.direccion === "asc" ? (
              <IconUI 
                name="FaSortDown" 
                size={14} 
                color={theme.name === "dark" ? theme.colors.text : theme.colors.white}
              />
            ) : (
              <IconUI 
                name="FaSortUp" 
                size={14} 
                color={theme.name === "dark" ? theme.colors.text : theme.colors.white}
              />
            ))}
        </ContendorHeader>
      </th>
    );
  };
  
  function formatearFecha(fechaIso) {
    const fecha1 = new Date(fechaIso);
    const day = String(fecha1.getUTCDate()).padStart(2, "0");
    const month = String(fecha1.getUTCMonth() + 1).padStart(2, "0");
    const year = fecha1.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  const ordenarData = (campo) => {
    const esAscendente = orden.columna === campo && orden.direccion === "asc";
    setOrden({
      columna: campo,
      direccion: esAscendente ? "desc" : "asc",
    });
    asignarDatos();
  };

  useEffect(() => {
    asignarDatos();
  }, [filtrosActivos, filtroGlobal, dataImportacion, orden]);
  return (
    <ContenedorPrincipal>
      <TablaCustm>
        <thead>
          <tr>
            {dataHeaders.map((item, index) => (
              <HeaderColumna
                key={index}
                nombre={item.nombre}
                campo={item.campo}
                orden={orden}
                ordenarData={ordenarData}
                theme={theme}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {dataFiltrada.length > 0 ? (
            dataFiltrada.map((item, index) => (
              <FilaCustom key={index} className={`filasTabla`}>
                <td>{item.EMPRESA}</td>
                <td>{item.PROVEEDOR}</td>
                <td>{item.MARCA}</td>
                {/*
                <td>{item.CONTENEDORES_ESTIMADOS || "-"}</td>
                <td>{item.NUMERO_PI === null || "" ? item.NUMERO_PIP === null || "" ? "-" : item.NUMERO_PIP : item.NUMERO_PI}</td>
                */}
                <td>{item.ETD !== null ? formatearFecha(item.ETD) : "-"}</td>
                {/*
                <td
                  style={{
                    backgroundColor: item.ETA
                      ? getColorPorFecha(item.ETA)
                      : "transparent",
                  }}
                >
                  {item.ETA !== null ? formatearFecha(item.ETA) : "-"}
                </td>
                <td>
                  {item.SALDO_POR_PAGAR === null
                    ? "-"
                    : `$ ${item.SALDO_POR_PAGAR}`}
                </td>
                <td>
                  {item.FECHA_SALDO_PAGAR !== null
                    ? formatearFecha(item.FECHA_SALDO_PAGAR)
                    : "-"}
                </td> */}
              </FilaCustom>
            ))
          ) : (
            <tr>
              <td 
                colSpan={dataHeaders.length} 
                style={{ 
                  textAlign: "center", 
                  padding: "20px",
                  color: theme.colors.textSecondary || theme.colors.text
                }}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </TablaCustm>
    </ContenedorPrincipal>
  );
};
