import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Select from "react-select";

import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";
// ExportToExcel removido - usar componente unificado
// Estilos de la tabla y celdas
const ContenedorPrincipal = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  padding: 2px 5px;
  flex-direction: column;
  overflow: hidden;
`;

const TablaContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  border-radius: 5px;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;
  table-layout: fixed;
`;

const Input = styled.input`
  outline: 0 !important;
  width: 95%;
  height: 38px;
  text-align: center;
  border: solid 1px gray;
  border-radius: 4px;
  border-color: hsl(0, 0%, 80%);
  box-sizing: border-box;
  padding: 0 10px;
  &:focus {
    box-shadow: 0 0 0 1px #2684ff;
  }
`;

const SelectStyled = styled.select`
  outline: 0 !important;
  width: 90%;
  height: 38px;
  text-align: left;
  border: solid 1px gray;
  border-radius: 4px;
  border-color: hsl(0, 0%, 80%);
  box-sizing: border-box;
  padding: 0 20px 0 10px;
  appearance: none;
  &:focus {
    box-shadow: 0 0 0 1px #2684ff;
  }
`;

const DivFlex = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const customStylesSelectForFilters = {
  // Estilos para las opciones (dentro del desplegable)
  option: (provided, state) => ({
    ...provided,
    padding: "3px 10px 3px 10px",
    whiteSpace: "wrap",
    fontSize: "12px",
  }),
  // Estilos para el control (el select visible)
  control: (provided) => ({
    ...provided,
    width: "100%",
    minWidth: "150px",
    maxWidth: "250px",
    fontSize: "12px",
  }),
  // Estilos para el menú (el contenedor de las opciones desplegadas)
  menu: (provided) => ({
    ...provided,
    zIndex: 10,
    width: "max-content",
    maxWidth: "200px",
    fontSize: "12px",
  }),
  // Estilos para el contenedor del valor seleccionado
  singleValue: (provided) => ({
    ...provided,
    whiteSpace: "wrap",
    wordBreak: "break-word", // Forzar el salto de línea en palabras largas
    fontSize: "12px",
  }),
};

function formatToDateInput(dateString) {
  const date = new Date(dateString); // Convertir la cadena a un objeto de fecha

  // Obtener año, mes y día
  const year = date.getUTCFullYear(); // Obtener el año
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Obtener el mes (0-11) y sumar 1
  const day = String(date.getUTCDate()).padStart(2, "0"); // Obtener el día y añadir ceros a la izquierda si es necesario

  // Retornar la fecha en formato YYYY-MM-DD
  return `${year}-${month}-${day}`;
}
// Componente de tabla solo para visualización
export const TablaInfo = ({
  data,
  columns,
  onSort,
  defaultFilters,
  onFilterChange,
  sortedInitial,
  excel,
  filenameExcel,
  columnasOcultasExcel = [],
  nombresColumnasPersonalizadosExcel = {},
  idTable = "",
  includeModal = false,
  decimales = 4,
  setIdModal,
}) => {
  const [filteredData, setFilteredData] = useState(data);
  const [sortOrder, setSortOrder] = useState(
    sortedInitial
      ? sortedInitial
      : {
          column: columns[0].field,
          direction: "asc",
        }
  );
  const [activeFilters, setActiveFilters] = useState({}); // Filtros activos
  const [lastInputFocus, setLastInputFocus] = useState("");

  useEffect(() => {
    // Solo ejecutar el ordenamiento la primera vez que los datos se cargan
    if (data.length > 0) {
      const isAsc = sortOrder.direction === "asc";
      const sortedData = [...data].sort((a, b) => {
        const aValue = a[sortOrder.column];
        const bValue = b[sortOrder.column];

        if (aValue === null) return -1; // Siempre poner null al inicio
        if (bValue === null) return 1; // Siempre poner null al inicio

        if (aValue < bValue) return isAsc ? -1 : 1;
        if (aValue > bValue) return isAsc ? 1 : -1;
        return 0;
      });

      setFilteredData(sortedData);
    }
  }, [data]);

  const handleSort = (column) => {
    const isAsc = sortOrder.column === column && sortOrder.direction === "asc";
    const direction = isAsc ? "desc" : "asc";
    setSortOrder({ column, direction });

    const sortedData = [...filteredData].sort((a, b) => {
      if (a[column] < b[column]) return direction === "asc" ? -1 : 1;
      if (a[column] > b[column]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredData(sortedData);
    onSort && onSort(column, direction);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...activeFilters, [field]: value };
    setActiveFilters(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const getUniqueValues = (field) => {
    const values = data
      .map((item) => item[field])
      .filter((value) => value !== undefined && value !== null);
    return Array.from(new Set(values));
  };

  // Obtener opciones con label y value para dropdowns
  const getDropdownOptions = (field) => {
    const uniqueValues = [
      ...new Set(data.map((item) => item[field]).filter(Boolean)),
    ];

    const uniqueOptions = uniqueValues.map((value) => ({
      value: value,
      label: value,
    }));

    return uniqueOptions;
  };

  // Estado local para los filtros activos con las etiquetas de los filtros por defecto
  const defaultFilterColumns = columns.filter(
    (column) =>
      defaultFilters.includes(column.field) && column.visible !== false
  );
  const [activeFiltersLabel, setActiveFiltersLabel] = useState([
    ...defaultFilterColumns,
  ]);

  const RenderFilters = ({
    columns,
    data,
    setFilteredData,
    defaultFilters,
  }) => {
    // Columnas opcionales, excluyendo las obligatorias y las que ya están en activeFiltersLabel
    const optionalFilters = columns.filter(
      (column) =>
        !defaultFilters.includes(column.field) && // Excluye las columnas por defecto
        column.visible !== false && // Excluye las columnas invisibles
        !activeFiltersLabel.some(
          (activeFilter) => activeFilter.field === column.field
        ) // Excluye las columnas que ya están en los filtros activos
    );

    // Función para añadir un filtro opcional
    const handleAddFilter = (selectedOption) => {
      if (selectedOption) {
        const filterToAdd = columns.find(
          (column) => column.field === selectedOption.value
        );
        if (filterToAdd && !activeFiltersLabel.includes(filterToAdd)) {
          setActiveFiltersLabel((prevFilters) => [...prevFilters, filterToAdd]);
          setLastInputFocus(selectedOption.value);
        }
      }
    };

    // Función para manejar cambios en los filtros y actualizar `activeFilters`
    const handleFilterChange = (field, value) => {
      setLastInputFocus(field);
      const newFilters = { ...activeFilters, [field]: value };
      setActiveFilters(newFilters);

      applyFilters(newFilters);
    };

    // Función para aplicar los filtros sobre los datos y actualizar `filteredData`
    const applyFilters = (filters) => {
      let filtered = [...data];

      Object.keys(filters).forEach((field) => {
        const filterValue = filters[field];
        if (filterValue) {
          filtered = filtered.filter((item) =>
            item[field]
              ?.toString()
              .toLowerCase()
              .includes(filterValue.toString().toLowerCase())
          );
        }
      });

      setFilteredData(filtered); // Actualizar el estado de `filteredData`
    };

    const eliminarFiltro = (field) => {
      // Eliminar el filtro de activeFilters
      setActiveFilters((prevFilters) => {
        const newFilters = { ...prevFilters };
        delete newFilters[field]; // Eliminar el campo específico
        return newFilters;
      });

      // Eliminar el filtro de activeFiltersLabel
      setActiveFiltersLabel((prevLabels) =>
        prevLabels.filter((column) => column.field !== field)
      );

      // Actualizar los datos filtrados después de eliminar el filtro
      applyFilters({ ...activeFilters, [field]: undefined });
    };

    // // useEffect para aplicar filtros iniciales si hay datos en `activeFilters`
    // useEffect(() => {
    //   applyFilters(activeFilters);
    // }, [data]); // Reaplicar los filtros cuando cambian los datos originales

    const renderFilterComponent = (column) => {
      const currentValue = activeFilters[column.field] || "";
      const options = getDropdownOptions(column.field);
      if (
        column.editType === "dropdown" ||
        column.editType === "dropdown-text"
      ) {
        return (
          <div
            style={{ minWidth: "100px", maxWidth: "220px" }}
            key={column.field}
          >
            <ContenedorFlex
              style={{
                justifyContent: "space-between",
                flexDirection: "row",
                padding: "0px",
                textAlign: "left",
              }}
            >
              <label style={{ fontSize: "12px" }}>{column.header}</label>
              {!defaultFilterColumns.some(
                (defaultColumn) => defaultColumn.field === column.field
              ) && (
                <span
                  onClick={() => eliminarFiltro(column.field)}
                  style={{ cursor: "pointer", color: "red", marginLeft: "5px" }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </span>
              )}
            </ContenedorFlex>
            <Select
              options={options}
              onChange={(selectedOption) =>
                handleFilterChange(column.field, selectedOption?.value || "")
              }
              value={
                currentValue
                  ? options.find((option) => option.value === currentValue)
                  : null
              }
              placeholder="Todos"
              isClearable
              isSearchable
              styles={customStylesSelectForFilters}
              menuPlacement="auto"
              maxMenuHeight="200px"
            />
          </div>
        );
      }

      if (column.editType === "date") {
        return (
          <div
            style={{ minWidth: "100px", maxWidth: "150px" }}
            key={column.field}
          >
            <ContenedorFlex
              style={{
                justifyContent: "space-between",
                flexDirection: "row",
                padding: "0px",
                textAlign: "left",
              }}
            >
              <label style={{ fontSize: "12px" }}>{column.header}</label>
              {!defaultFilterColumns.some(
                (defaultColumn) => defaultColumn.field === column.field
              ) && (
                <span
                  onClick={() => eliminarFiltro(column.field)}
                  style={{ cursor: "pointer", color: "red", marginLeft: "5px" }}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </span>
              )}
            </ContenedorFlex>
            <Input
              style={{ fontSize: "12px" }}
              type="date"
              value={currentValue}
              onChange={(e) =>
                handleFilterChange(
                  column.field,
                  e.target.value
                    ? formatToDateInput(e.target.value)
                    : e.target.value
                )
              }
            />
          </div>
        );
      }

      return (
        <div
          style={{ minWidth: "100px", maxWidth: "150px" }}
          key={column.field}
        >
          <ContenedorFlex
            style={{
              justifyContent: "space-between",
              flexDirection: "row",
              padding: "0px",
              paddingRight: "10px",
              textAlign: "left",
            }}
          >
            <label style={{ fontSize: "12px" }}>{column.header}</label>
            {!defaultFilterColumns.some(
              (defaultColumn) => defaultColumn.field === column.field
            ) && (
              <span
                onClick={() => eliminarFiltro(column.field)}
                style={{ cursor: "pointer", color: "red", marginLeft: "5px" }}
              >
                <i className="bi bi-x-circle-fill"></i>
              </span>
            )}
          </ContenedorFlex>
          <Input
            style={{ fontSize: "12px" }}
            type={column.editType}
            value={currentValue}
            placeholder={`${column.header}`}
            autoFocus={lastInputFocus ? lastInputFocus === column.field : false}
            onChange={(e) => handleFilterChange(column.field, e.target.value)}
          />
        </div>
      );
    };

    return (
      <div
        style={{
          marginBottom: "5px",
          display: "flex",
          gap: "3px",
          width: "auto",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        {/* Renderizar filtros obligatorios y activos */}
        {activeFiltersLabel.map((column) => renderFilterComponent(column))}

        {/* Botón para agregar filtros opcionales */}
        <div style={{ minWidth: "100px", maxWidth: "225px" }}>
          {/* <label style={{ fontSize: "13px" }}>Agregar Filtros</label> */}
          <Select
            options={optionalFilters.map((column) => ({
              value: column.field,
              label: column.header,
            }))}
            onChange={handleAddFilter}
            placeholder="Agregar Filtro"
            isClearable
            isSearchable
            styles={customStylesSelectForFilters}
          />
        </div>

        {/* Filtro global */}
        {/* <div style={{ minWidth: "100px", maxWidth: "150px" }}>
          <Input
            type="text"
            placeholder="Filtro global"
            onChange={(e) => handleFilterChange("global", e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </div> */}
      </div>
    );
  };

  const formatString = (format, field) => {
    // Asegúrate de que field es un número si es necesario
    let stringRet = field;

    // Formatear como dinero
    if (format === "money" && !isNaN(parseFloat(field))) {
      stringRet = `$ ${parseFloat(field).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`;
    }

    // Formatear como porcentaje
    else if (format === "porcentaje" && !isNaN(parseFloat(field))) {
      stringRet = `${parseFloat(field).toFixed(decimales || 4)} %`;
    }

    // Truncar el valor a dos decimales
    else if (format === "truncar" && !isNaN(parseFloat(field))) {
      stringRet = parseFloat(field).toFixed(2);
    }

    // Redondear el valor a dos decimales
    else if (format === "redondear" && !isNaN(parseFloat(field))) {
      stringRet = Math.round(parseFloat(field) * 100) / 100;
    }

    return stringRet;
  };

  return (
    <ContenedorPrincipal>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 15px",
        }}
      >
        <RenderFilters
          columns={columns}
          data={data}
          defaultFilters={defaultFilters}
          setFilteredData={setFilteredData}
        />
        {excel && filteredData?.length > 0 && (
          <ExportToExcel
            filename={"Reporte_" + filenameExcel}
            habilitarBoton={false}
            data={filteredData}
            columnasOcultas={columnasOcultasExcel}
            nombresPersonalizados={nombresColumnasPersonalizadosExcel}
          />
        )}
      </div>
      <div
        style={{
          width: "100%",
          height: "calc(100vh - 200px)",
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: "5px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            borderRadius: "5px",
            tableLayout: "fixed",
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              fontSize: "12px",
            }}
          >
            <tr>
              {columns
                .filter((col) => col.visible !== false)
                .map((col, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(col.field)}
                    style={{
                      width: col.width || "auto",
                      minWidth: col.width || "auto",
                      maxWidth: col.width || "none",
                      userSelect: "none",
                      backgroundColor: "var(--primary)",
                      color: "white",
                      fontWeight: 100,
                      wordWrap: "break-word",
                      borderRight: "1px solid rgba(101, 101, 101, 0.45)",
                      overflow: "visible",
                      textOverflow: "clip",
                      whiteSpace: "normal",
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                      padding: "8px 10px",
                      textAlign: "center",
                    }}
                  >
                    {col.header}{" "}
                    {sortOrder.column === col.field &&
                      (sortOrder.direction === "asc" ? (
                        <i className="bi bi-sort-up"></i>
                      ) : (
                        <i className="bi bi-sort-down-alt"></i>
                      ))}
                  </th>
                ))}
              {includeModal && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredData?.length > 0 ? (
              filteredData.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    minHeight: "30px",
                    fontSize: "12px",
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f2f2f2",
                  }}
                >
                  {columns
                    .filter((col) => col.visible !== false)
                    .map((col, index) => (
                      <td
                        key={index}
                        style={{
                          width: col.width || "auto",
                          minWidth: col.width || "auto",
                          maxWidth: col.width || "none",
                          backgroundColor: "#fff",
                          padding: "10px",
                          borderRight: "1px solid rgba(101, 101, 101, 0.45)",
                          borderBottom: "1px solid rgba(101, 101, 101, 0.45)",
                          overflow: "visible",
                          textOverflow: "clip",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          fontSize: "12px",
                        }}
                      >
                        {formatString(col.format, item[col.field])}
                      </td>
                    ))}
                  {includeModal && (
                    <td>
                      <i
                        className="bi bi-arrow-up-right-square"
                        style={{ fontSize: "16px", cursor: "pointer" }}
                        onClick={() => {
                          setIdModal(item[idTable]);
                        }}
                      />
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr className="filasTabla">
                <td colSpan={columns.length}>
                  <span style={{ fontSize: "14px" }}>
                    <i className="bi bi-database-fill-exclamation"></i> No hay
                    existencia de registros
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <span style={{ fontSize: "12px", color: "var(--primary)" }}>
        Registros {filteredData?.length} de {data?.length}
      </span>
    </ContenedorPrincipal>
  );
};
