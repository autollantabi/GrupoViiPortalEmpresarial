import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { PaginacionUnificada } from "./ComponentesUnificadosCartera";
import {
  columnasTablaTransacciones,
  clasesEstado,
  getNombreEstado,
  getColorEstado,
} from "./configTablaTransacciones";

const ChipEstado = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${(props) => props.$bgColor};
  color: ${(props) => props.$textColor};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  gap: 16px;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.span`
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
`;

// Contenedor de la tabla con scroll
const TablaContainer = styled.div`
  width: 100%;
  height: 100%; /* Altura fija para la tabla */
  overflow-y: auto;
  overflow-x: auto;
  overflow: visible;
  border-radius: 5px;
`;

// Contenedor para la paginación con overflow visible
const PaginacionWrapper = styled.div`
  width: 100%;
  position: relative;
  overflow: visible;
  flex-shrink: 0; /* No permitir que se encoja */
`;

// Styled component para la tabla
const TablaCustom = styled.table`
  width: max-content;
  min-width: 100%;
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
      background-color: var(--primary);
      color: ${({ theme }) => theme.colors.white};
      font-weight: 100;
      padding: 6px 8px;
      border-right: 1px solid rgba(101, 101, 101, 0.45);
      &:first-child {
        border-top-left-radius: 5px;
      }
      &:last-child {
        border-top-right-radius: 5px;
      }
    }
  }

  & .filasTabla {
    cursor: pointer;
    transition: all 0.2s ease;

    &:nth-child(odd) {
      background-color: #ffffff;
    }

    &:nth-child(even) {
      background-color: #f2f2f2;
    }

    &.fila-verde {
      background-color: rgba(0, 191, 0, 0.113);
    }

    &.fila-amarillo {
      background-color: rgba(255, 230, 1, 0.227);
    }

    &.fila-roja {
      background-color: rgba(255, 1, 1, 0.199);
    }

    &.fila-rosa {
      background-color: rgba(222, 193, 255, 0.552);
    }

    &.fila-azul {
      background-color: rgba(1, 234, 255, 0.199);
    }

    &.fila-seleccionada {
      font-weight: 600;
      box-shadow: inset 0 2px 3px 1px
        ${({ theme }) => `${theme.colors.primary}66`};
      position: relative;

      td:first-child {
        border-left: 5px solid
          ${({ theme }) => `${theme.colors.primary}66 !important`};
      }
    }

    &:hover:not(.fila-seleccionada) {
      background-color: rgba(0, 0, 0, 0.05) !important;
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
      border-right: 1px solid rgba(101, 101, 101, 0.45);
      border-bottom: 1px solid rgba(101, 101, 101, 0.45);
      padding: 4px 8px;
      line-height: 1.2;
      font-size: 12px;

      &:first-child {
        border-left: 1px solid rgba(101, 101, 101, 0.45);
      }
      &:last-child {
        border-right: 1px solid rgba(101, 101, 101, 0.45);
      }
    }
  }
`;

// Componente principal de la tabla
const TablaTransaccionesCompleto = ({
  // Datos filtrados
  datosFiltrados = [],
  // Callback para editar
  onEdit,
  // Configuración de paginación
  filasPorPagina = 15,
  // Estado de carga
  cargando = false,
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);

  // Función para convertir fecha yyyy-mm-dd a objeto Date
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return new Date(0);
    const partes = fechaStr.split(/[-/]/);
    // Formato yyyy-mm-dd (como llega desde el backend)
    const anio = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const dia = parseInt(partes[2], 10);
    return new Date(anio, mes - 1, dia);
  };

  // Ordenar datos: primero por fecha DESC, luego por ID ASC (estable)
  const datosOrdenados = useMemo(() => {
    // Agregar índice original para mantener orden estable
    const datosConIndice = datosFiltrados.map((item, index) => ({
      ...item,
      _indiceOriginal: index,
    }));

    return datosConIndice.sort((a, b) => {
      // 1. Ordenar por fecha descendente (más reciente primero)
      const fechaA = parseFecha(a.FECHA);
      const fechaB = parseFecha(b.FECHA);

      if (fechaB.getTime() !== fechaA.getTime()) {
        return fechaB.getTime() - fechaA.getTime(); // DESC
      }

      // 2. Si las fechas son iguales, ordenar por ID descendente
      const idA = parseInt(a.IDENTIFICADOR || 0);
      const idB = parseInt(b.IDENTIFICADOR || 0);

      if (idA !== idB) {
        return idB - idA; // DESC
      }

      // 3. Si todo es igual, mantener orden original (estable)
      return a._indiceOriginal - b._indiceOriginal;
    });
  }, [datosFiltrados]);

  // Calcular paginación con datos ordenados
  const totalPaginas = Math.ceil(datosOrdenados.length / filasPorPagina);
  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const datosPagina = datosOrdenados
    .slice(inicio, fin)
    .map(({ _indiceOriginal, ...item }) => item);

  // Resetear página cuando cambian los datos filtrados
  useEffect(() => {
    setPaginaActual(1);
  }, [datosFiltrados.length]);

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
  };

  const manejarClickFila = (transaccion) => {
    const id = transaccion?.IDENTIFICADOR_VERSION || transaccion?.IDENTIFICADOR;
    setFilaSeleccionada(id === filaSeleccionada ? null : id);
  };

  // Mostrar indicador de carga
  if (cargando) {
    return (
      <CustomContainer
        flexDirection="column"
        width="100%"
        style={{ flexShrink: 1, gap: "10px", overflow: "hidden" }}
      >
        <LoadingContainer>
          <Spinner />
          <LoadingText>Cargando transacciones bancarias...</LoadingText>
        </LoadingContainer>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer
      flexDirection="column"
      width="100%"
      style={{
        gap: "10px",
        overflow: "visible",
        height: "100%",
        display: "flex",
      }}
    >
      {/* Tabla con scroll */}
      <TablaContainer>
        <TablaCustom>
          <thead className="cabecera-tabla">
            <tr>
              {columnasTablaTransacciones.map((columna) => (
                <th
                  key={columna.key}
                  className={columna.className || ""}
                  style={{ width: columna.width, minWidth: columna.width }}
                >
                  {columna.header}
                </th>
              ))}
              <th className="uns" style={{ width: "20px" }}>
                ...
              </th>
            </tr>
          </thead>
          <tbody>
            {datosPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={columnasTablaTransacciones.length + 1}
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    fontSize: "14px",
                    color: "#6c757d",
                    fontStyle: "italic",
                  }}
                >
                  No existen datos con los filtros aplicados
                </td>
              </tr>
            ) : (
              datosPagina
                .filter((transaccion) => transaccion != null)
                .map((transaccion, index) => {
                  const estadoNum = parseInt(transaccion.ESTADO);
                  const claseEstado = clasesEstado[estadoNum] || "fila-default";
                  const idFila =
                    transaccion?.IDENTIFICADOR_VERSION ||
                    transaccion?.IDENTIFICADOR;
                  const estaSeleccionada = filaSeleccionada === idFila;

                  return (
                    <tr
                      key={`${
                        transaccion?.IDENTIFICADOR_VERSION || index
                      }-${index}`}
                      className={`filasTabla ${claseEstado} ${
                        estaSeleccionada ? "fila-seleccionada" : ""
                      }`}
                      onClick={() => manejarClickFila(transaccion)}
                    >
                      {columnasTablaTransacciones.map((columna) => {
                        const valor = transaccion[columna.key];

                        // Si es la columna de estado
                        if (columna.isEstado) {
                          const colorEstado = getColorEstado(estadoNum);
                          return (
                            <td
                              key={columna.key}
                              style={{
                                width: columna.width,
                                minWidth: columna.width,
                              }}
                            >
                              <ChipEstado
                                $bgColor={colorEstado.bg}
                                $textColor={colorEstado.text}
                              >
                                <span>
                                  {getNombreEstado(estadoNum)?.substring(0, 5)}
                                </span>
                              </ChipEstado>
                            </td>
                          );
                        }

                        // Si tiene función de formato
                        if (columna.format) {
                          return (
                            <td
                              key={columna.key}
                              style={{
                                width: columna.width,
                                minWidth: columna.width,
                              }}
                            >
                              {columna.format(valor, transaccion)}
                            </td>
                          );
                        }

                        // Valor normal
                        return (
                          <td
                            key={columna.key}
                            style={{
                              width: columna.width,
                              minWidth: columna.width,
                            }}
                          >
                            {valor || ""}
                          </td>
                        );
                      })}

                      {/* Columna de acciones */}
                      <td style={{ width: "20px" }}>
                        <CustomButton
                          iconLeft="FaEdit"
                          onClick={() => onEdit(transaccion)}
                          variant="text"
                        />
                      </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </TablaCustom>
      </TablaContainer>

      {/* Paginación con overflow visible */}
      <PaginacionWrapper>
        <PaginacionUnificada
          currentPage={paginaActual}
          pageCount={totalPaginas}
          handlePageChange={cambiarPagina}
          numberData={datosPagina.length}
          totalData={datosOrdenados.length}
        />
      </PaginacionWrapper>
    </CustomContainer>
  );
};

export default TablaTransaccionesCompleto;
