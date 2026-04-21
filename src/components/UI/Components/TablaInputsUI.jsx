import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ContenedorFlex } from "components/UI/Components/ContenedorFlex";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";
import { SelectUI } from "./SelectUI";

import { ButtonUI } from "./ButtonUI";
import IconUI from "./IconsUI";

// Estilos de la tabla y celdas
const ContenedorPrincipal = styled.div`
  display: flex;
  width: 100%;
  padding: 2px 5px;
  flex-direction: column;
  height: 100%;
  position: relative;
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;

  & > thead {
    position: sticky;
    top: 0;
    z-index: 1;
    th {
      user-select: none;
      background-color: ${({ theme }) => 
        theme.name === "dark" 
          ? (theme.colors.backgroundCard || theme.colors.backgroundLight)
          : theme.colors.secondary
      };
      color: ${({ theme }) => 
        theme.name === "dark"
          ? theme.colors.text
          : theme.colors.white
      };
      font-weight: 100;
      word-wrap: break-word;
      border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border || "#656565", alpha: 0.45 })};
      &:first-child {
        border-top-left-radius: 5px;
      }
      &:last-child {
        border-top-right-radius: 5px;
      }
    }
  }

  & .filasTabla {
    height: 30px;

    &:nth-child(odd) {
      background-color: ${({ theme, $oddColor }) => $oddColor || theme.colors.backgroundCard || theme.colors.backgroundLight || "#fafafa"};
    }

    &:nth-child(even) {
      background-color: ${({ theme, $evenColor }) => $evenColor || theme.colors.backgroundDark || theme.colors.background || "#f5f5f5"};
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
      border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border || "#656565", alpha: 0.45 })};
      border-bottom: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border || "#656565", alpha: 0.45 })};
      &:first-child {
        border-left: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border || "#656565", alpha: 0.45 })};
      }
      &:last-child {
        border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme.colors.border || "#656565", alpha: 0.45 })};
      }
    }
  }
`;

const Input = styled.input`
  outline: 0 !important;
  width: 97%;
  min-width: 80px;
  height: 38px;
  text-align: center;
  border: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 4px;
  border-color: ${({ theme }) => theme.colors.border || "#dee2e6"};
  background-color: ${({ theme, $transparent }) => $transparent ? "transparent" : (theme.colors.inputBackground || theme.colors.backgroundCard || "#fafafa")};
  color: ${({ theme }) => theme.colors.text || "#212529"};
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 13px;
  border-width: ${({ $transparent }) => $transparent ? "0 0 1px 0" : "1px"}; // Estilo sutil si es transparente
  border-radius: ${({ $transparent }) => $transparent ? "0" : "4px"};
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
  }
`;

const TextAreaS = styled.textarea`
  outline: 0 !important;
  width: 97%;
  min-width: 200px;
  max-height: 80px;
  text-align: center;
  border: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 4px;
  border-color: ${({ theme }) => theme.colors.border || "#dee2e6"};
  background-color: ${({ theme }) => theme.colors.inputBackground || theme.colors.backgroundCard || "#fafafa"};
  color: ${({ theme }) => theme.colors.text || "#212529"};
  box-sizing: border-box;
  padding: 0 10px;

  font-size: 13px;
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
  }
`;
const SelectStyled = styled.select`
  outline: 0 !important;
  width: 90%;
  height: 38px;
  font-size: 14px;
  text-align: left;
  border: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  border-radius: 4px;
  border-color: ${({ theme }) => theme.colors.border || "#dee2e6"};
  background-color: ${({ theme }) => theme.colors.selectBackground || theme.colors.inputBackground || "#fafafa"};
  color: ${({ theme }) => theme.colors.text || "#212529"};
  box-sizing: border-box;
  padding: 0 20px 0 10px;
  appearance: none; /* Quita el estilo por defecto del navegador */
  &:focus {
    border-color: ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.inputFocus || theme.colors.primary || "#3c3c3b"};
  }
`;
const DivFlex = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ButtonPagination = styled.button`
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  border: none;
  background-color: transparent;
  font-size: 22px;
  align-items: center;
  justify-content: center; /* Centra el contenido del botón */
  margin: 0 5px;
  color: ${({ theme }) => theme.colors.textSecondary || "#6c757d"};
  &.dis {
    color: ${({ theme }) => theme.colors.textDisabled || "#ced4da"};
  }
`;

const InputPagination = styled.input`
  padding: 0;
  margin: 0 5px;
  border: none;
  background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.backgroundCard || theme.colors.white || "#ffffff", alpha: 0.4 })};
  outline: none;
  align-items: center;
  justify-content: center; /* Centra el contenido del botón */
`;


function formatDateToDDMMYYYY(dateString) {
  const date = new Date(dateString); // Convertir la cadena a un objeto de fecha

  // Obtener día, mes y año
  const day = String(date.getUTCDate()).padStart(2, "0"); // Obtener el día y añadir ceros a la izquierda si es necesario
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Obtener el mes (0-11) y sumar 1
  const year = date.getUTCFullYear(); // Obtener el año

  // Retornar la fecha en formato dd/mm/YYYY
  return `${day}/${month}/${year}`;
}

function formatToDateInput(dateString) {
  // Verificar si dateString es válido
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return "";

    // Obtener año, mes y día
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    // Retornar la fecha en formato YYYY-MM-DD
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "";
  }
}

// Componentes internos movidos fuera para evitar re-montajes y pérdida de foco
const RenderRowHorizontal = React.memo(({ 
  item, 
  columns, 
  theme, 
  nombreID, 
  onDelete, 
  handleDoubleClick, 
  getMargenStyle, 
  formatString 
}) => {
  return (
    <tr
      className="filasTabla"
      onDoubleClick={() => handleDoubleClick(item)}
      style={{ cursor: "pointer" }}
    >
      {columns
        .filter((col) => col.visible !== false)
        .map((col) => {
          const columnWidth = col.width ? `${col.width}` : "auto";
          const cellStyle = col.style && typeof col.style === "function" ? col.style(item) : col.style || {};
          const isBackgroundStyle = cellStyle.backgroundColor && cellStyle.backgroundColor !== "transparent";

          return (
            <td
              key={col.field}
              style={{
                width: columnWidth,
                maxWidth: columnWidth,
                padding: isBackgroundStyle ? "0" : "0 5px",
                textAlign: "center"
              }}
            >
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "100%", 
                height: "100%",
                minHeight: "38px",
                color: theme?.colors?.text || "#212529",
                ...cellStyle
              }}>
                {formatString(col.format, item[col.field])}
              </div>
            </td>
          );
        })}
      <td style={{ textAlign: "center" }}>
        {onDelete && (
          <ButtonUI
            iconLeft="FaTrashCan"
            variant="outlined"
            pcolortext={theme?.colors?.error || "#dc3545"}
            style={{ padding: "4px 8px", minWidth: "auto" }}
            onClick={() => onDelete(item)}
          />
        )}
      </td>
    </tr>
  );
});

const RenderEditableRowHorizontal = React.memo(({ 
  item, 
  columns, 
  lastRow, 
  theme, 
  alwaysEditable, 
  hideActions, 
  onDelete, 
  onRowChange, 
  handleCancel, 
  handleSave,
  validationErrors,
  formatString,
  formatToDateInput
}) => {
  const [editValues, setEditValues] = useState(lastRow ? lastRow : item);
  const [editColumns, setEditColumns] = useState(columns);
  const [filteredOptions, setFilteredOptions] = useState({});

  useEffect(() => {
    if (alwaysEditable) {
      setEditValues(item);
    }
  }, [item, alwaysEditable]);

  useEffect(() => {
    setEditColumns(columns);
  }, [columns]);

  useEffect(() => {
    const initialOptions = {};
    editColumns.forEach((col) => {
      const maxoptions = col.maxoptions || 30;
      if (col.editType === "dropdown" || col.editType === "dropdown-text") {
        initialOptions[col.field] = (col.options || []).slice(0, maxoptions);
      }
    });
    setFilteredOptions(initialOptions);
  }, [editColumns]);

  const handleEditComponent = async (col, option) => {
    if (!option) {
      const next = { ...editValues, [col.field]: "", ...(col.fieldID && { [col.fieldID]: null }) };
      setEditValues(next);
      onRowChange(next);
      return;
    }

    let finalLabel = option.label;
    if (col.editType === "number" && finalLabel !== "") {
      const numVal = parseFloat(finalLabel);
      if (!isNaN(numVal)) {
        if (col.max !== undefined && numVal > col.max) finalLabel = String(col.max);
        if (col.min !== undefined && numVal < col.min) finalLabel = String(col.min);
      }
    }

    let next = { ...editValues, [col.field]: finalLabel, ...(col.fieldID && { [col.fieldID]: option.value }) };
    
    if (col.columnsRelated && Array.isArray(col.columnsRelated)) {
      col.columnsRelated.forEach((relatedField) => { next[relatedField] = ""; });
    }
    
    setEditValues(next);
    onRowChange(next);

    if (col.onDependentLoad) {
      const dependentResult = await col.onDependentLoad(option);
      if (dependentResult && Array.isArray(dependentResult)) {
        setEditColumns((prevColumns) =>
          prevColumns.map((column) => {
            const update = dependentResult.find(
              (res) => res.field === column.field
            );
            if (update) {
              return { ...column, options: update.data };
            }
            return column;
          })
        );
      }
    }
  };

  const handleInputChange = (col, inputValue) => {
    const options = col.options || [];
    const q = (inputValue || "").toLowerCase();
    const newOptions = options.filter(o => String(o.label || "").toLowerCase().includes(q)).slice(0, 30);
    setFilteredOptions(prev => ({ ...prev, [col.field]: newOptions }));
  };

  return (
    <tr className="filasTabla">
      {editColumns
        .filter((col) => col.visible !== false)
        .map((col) => {
          const columnWidth = col.width ? col.width : "auto";
          const colOptions = filteredOptions[col.field] || [];
          
          return (
            <td key={col.field} style={{ width: columnWidth, maxWidth: columnWidth }}>
              {!col.isEditable ? (
                <div style={{ 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", height: "100%", minHeight: "38px",
                  color: theme?.colors?.text || "#212529", padding: "0 10px",
                  ...(col.style && typeof col.style === "function" ? col.style(editValues) : col.style || {})
                }}>
                  {formatString(col.format, editValues[col.field])}
                </div>
              ) : col.editType?.includes("dropdown") ? (
                <DivFlex style={{ width: "100%" }}>
                  <SelectUI
                    options={colOptions}
                    value={col.editType === "dropdown-text" ? { value: editValues[col.field], label: editValues[col.field] } : col.options?.find(o => String(o.value) === String(editValues[col.fieldID || col.field]))}
                    onInputChange={(val) => handleInputChange(col, val)}
                    onChange={(opt) => handleEditComponent(col, opt)}
                    isSearchable
                    isCreatable={col.editType === "dropdown-text"}
                    minWidth="100%"
                  />
                </DivFlex>
              ) : (
                <DivFlex>
                  <Input
                    type={col.editType || "text"}
                    $transparent={alwaysEditable}
                    value={col.editType === "date" ? formatToDateInput(editValues[col.field]) : editValues[col.field]}
                    onChange={(e) => handleEditComponent(col, { label: e.target.value, value: e.target.value })}
                    required={col.required}
                    min={col.min}
                    max={col.max}
                    step={col.step || "any"}
                  />
                </DivFlex>
              )}
              {validationErrors[col.field] && (
                <span style={{ color: theme?.colors?.error || "#dc3545", fontSize: "12px" }}>
                  {validationErrors[col.field]}
                </span>
              )}
            </td>
          );
        })}
      <td style={{ textAlign: "center" }}>
        <ContenedorFlex style={{ flexDirection: "row", justifyContent: "center", gap: "8px" }}>
          {!hideActions && (
            <>
              <ButtonUI iconLeft="FaXmark" onClick={handleCancel} variant="outlined" pcolortext={theme?.colors?.error || "#dc3545"} style={{ padding: "2px 6px", minWidth: "auto" }} iconSize={14} />
              <ButtonUI iconLeft="FaFloppyDisk" onClick={() => handleSave({ item: editValues })} isAsync={true} pcolor={theme?.colors?.success || "#28a745"} style={{ padding: "2px 6px", minWidth: "auto" }} iconSize={14} />
            </>
          )}
          {onDelete && (
            <ButtonUI iconLeft="FaTrashCan" variant="outlined" pcolortext={theme?.colors?.error || "#dc3545"} style={{ padding: "4px 8px", minWidth: "auto" }} onClick={() => onDelete(item)} />
          )}
        </ContenedorFlex>
      </td>
    </tr>
  );
});

// Componente de tabla reutilizable
export const TablaInputsUI = ({
  data = [],
  columnsConfig = [],
  defaultFilters = [],
  onSort = () => {},
  onDoubleClickRow = () => {},
  onSave = async () => ({ res: false }),
  newRow = () => ({}),
  permisos = [],
  permisoagregar,
  estadocondiciones = [],
  nombreID = "ID",
  pageSize = 20,
  onRowChange = () => {},
  showFilters = true,
  addButtonText = "",
  onAddRowClick = null,
  externalEditingRowId = null,
  onDelete = null,
  alwaysEditable = false,
  hideActions = false,
  oddRowColor = null,
  evenRowColor = null,
  extraHeaderContent = null,
  hideOptionalFilters = false,
}) => {
  const { theme } = useTheme();
  const [copiaData, setCopiaData] = useState(data);
  const [filteredData, setFilteredData] = useState(data);
  const [sortOrder, setSortOrder] = useState({
    column: columnsConfig ? columnsConfig[0].field : "ID",
    direction: "desc",
  });
  const [columns, setColumns] = useState(columnsConfig);
  const [editingRow, setEditingRow] = useState(null); // Fila en edición
  const [validationErrors, setValidationErrors] = useState({});
  const [lastRow, setLastRow] = useState(null);
  const [lastInputFocus, setLastInputFocus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState(currentPage);

  useEffect(() => {
    if (externalEditingRowId !== null) {
      setEditingRow(externalEditingRowId);
    }
  }, [externalEditingRowId]);

  // Calcula el total de páginas
  const totalPages = Math.ceil(filteredData.length / pageSize);
  // Calcula los datos para la página actual
  const currentData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Funciones para ir a la siguiente o anterior página
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };
  const handlePageClick = () => {
    setIsEditingPage(true);
    setPageInput(currentPage); // Inicializa el input con el valor de la página actual
  };
  const handlePageInputChange = (e) => {
    setLastInputFocus("");
    setPageInput(e.target.value);
  };
  const handlePageInputBlur = () => {
    setIsEditingPage(false);
    const newPage = Math.max(1, Math.min(totalPages, parseInt(pageInput) || 1));
    setCurrentPage(newPage);
  };
  const handlePageInputKeyPress = (e) => {
    if (e.key === "Enter") {
      handlePageInputBlur();
    }
  };

  // Calcula el rango de elementos mostrados
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredData.length);

  useEffect(() => {
    // Sincronizar copiaData y filteredData con el prop data
    setCopiaData(data);
    
    // Aplicar ordenamiento actual a los nuevos datos
    const isAsc = sortOrder.direction === "asc";
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[sortOrder.column];
      const bValue = b[sortOrder.column];

      if (aValue === null || aValue === undefined) return -1;
      if (bValue === null || bValue === undefined) return 1;

      if (aValue < bValue) return isAsc ? -1 : 1;
      if (aValue > bValue) return isAsc ? 1 : -1;
      return 0;
    });

    setFilteredData(sortedData);
  }, [data]);

  const handleSort = useCallback(
    (column) => {
      try {
        const isAsc =
          sortOrder.column === column && sortOrder.direction === "asc";
        const direction = isAsc ? "desc" : "asc";
        setSortOrder({ column, direction });

        const sortedData = [...filteredData].sort((a, b) => {
          const aValue = a[column];
          const bValue = b[column];

          // Manejar valores nulos/undefined
          if (aValue === null || aValue === undefined) return -1;
          if (bValue === null || bValue === undefined) return 1;

          // Detectar si son fechas
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);

          if (!isNaN(aDate) && !isNaN(bDate)) {
            return direction === "asc"
              ? aDate.getTime() - bDate.getTime()
              : bDate.getTime() - aDate.getTime();
          }

          // Comparación estándar (string o número)
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();

          if (aStr < bStr) return direction === "asc" ? -1 : 1;
          if (aStr > bStr) return direction === "asc" ? 1 : -1;
          return 0;
        });

        setFilteredData(sortedData);
        onSort && onSort(column, direction);
      } catch (error) {
        console.error("Error al ordenar datos:", error);
        // Mantener los datos sin cambios en caso de error
      }
    },
    [filteredData, sortOrder, onSort]
  );

  const handleDoubleClick = useCallback(
    (item) => {
      try {
        if (permisos && permisos.length > 0) {
          const empresa = item.EMPRESA || "";
          const validacion = permisos.find((aux) => aux.empresa === empresa);

          if (!validacion) {
            console.warn("No tiene permisos para esta empresa");
            return;
          }

          if (validacion) {
            if (validacion.permiso === "E") {
              if (editingRow === item[nombreID]) return; // Si ya está en edición, no hacer nada
              setEditingRow(item[nombreID]); // Activa la edición de la fila
              // setEditValues(item); // Copia los valores actuales para edición
              onDoubleClickRow && onDoubleClickRow(item);
            } else {
              // Buscar el estado en la columna que tenga `estadofield: true`
              const columnaEstado = columns.find(
                (col) => col.estadofield === true
              );
              const estadoActual = columnaEstado
                ? item[columnaEstado.field]
                : null;

              if (estadoActual === 0) {
                // Si el estado es 0, no permite edición
                return;
              } else if (estadoActual === -1) {
                // Si el estado es -1, usa valores por defecto para campos editables
                const updatedColumns = columns.map((col) => ({
                  ...col,
                  isEditable: col.defaultEditable || false, // Usar propiedad por defecto si existe
                }));

                setColumns(updatedColumns);
                if (editingRow === item[nombreID]) return;
                setEditingRow(item[nombreID]);
                onDoubleClickRow && onDoubleClickRow(item);
              } else if (estadoActual !== null) {
                // Para otros estados, aplicar las condiciones de `estadocondiciones`
                const condicionesEstado = estadocondiciones.find(
                  (condicion) => condicion[estadoActual] !== undefined
                );

                if (condicionesEstado) {
                  const camposEditables = condicionesEstado[estadoActual];

                  // Actualiza la propiedad `isEditable` de las columnas según el estado
                  const updatedColumns = columns.map((col) => ({
                    ...col,
                    isEditable: camposEditables.includes(col.field), // Solo es editable si está en la lista
                  }));

                  setColumns(updatedColumns);
                  if (editingRow === item[nombreID]) return;
                  setEditingRow(item[nombreID]);
                  onDoubleClickRow && onDoubleClickRow(item);
                }
              }
            }
          }
        } else {
          if (editingRow === item[nombreID]) return;
          setEditingRow(item[nombreID]);
          onDoubleClickRow && onDoubleClickRow(item);
        }
      } catch (error) {
        console.error("Error al activar edición:", error);
      }
    },
    [permisos, editingRow, columns, estadocondiciones]
  );

  const handleCancel = () => {
    setFilteredData((prevData) => {
      const newData = [...prevData]; // Copiar datos actuales

      // Encontrar el índice de la fila en edición (supongamos que `editingRow` tiene el ID)
      const indexToRemove = newData.findIndex((row) => row[nombreID] === "");

      if (indexToRemove !== -1) {
        newData.splice(indexToRemove, 1); // Eliminar la fila en edición si es nueva
      }

      return newData; // Retornar los datos actualizados
    });
    setEditingRow(null); // Activa la edición de la fila
    setLastRow(null);
    setColumns(columnsConfig);
    return true;
  };

  const handleSave = async ({ item }) => {
    const errors = {};
    setLastRow(item);

    // Validar si los campos requeridos están completos
    columns.forEach((column) => {
      if (column.required) {
        // Verificar si el campo visible o el ID está vacío
        const value = item[column.field] || item[column.fieldID];
        if (!value) {
          errors[column.field] = `${column.header} es un campo obligatorio`;
        }
      }
    });

    // Si hay errores, actualizar el estado de errores y no guardar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Limpiar errores y proceder con el guardado
    setValidationErrors({});

    try {
      // Llama a onSave y espera el resultado
      const result = await onSave(item);

      // Verifica que el resultado sea válido
      if (result?.res) {
        const updatedItem = {
          ...item,
          [nombreID]: item[nombreID] !== "" ? item[nombreID] : result.id, // Si no tiene ID, usa el ID devuelto por onSave
        };

        // Actualiza `filteredData`
        setFilteredData((prevData) => {
          const exists = prevData.some(
            (row) => row[nombreID] === updatedItem[nombreID]
          );
          if (exists) {
            // Actualiza el registro existente
            return prevData.map((row) =>
              row[nombreID] === updatedItem[nombreID]
                ? { ...row, ...updatedItem }
                : row
            );
          } else {
            const newData = [...prevData]; // Copiar datos actuales

            // Encontrar el índice de la fila en edición (con ID vacío o temporal)
            const indexToRemove = newData.findIndex(
              (row) => row[nombreID] === ""
            );

            if (indexToRemove !== -1) {
              newData.splice(indexToRemove, 1); // Eliminar la fila temporal
            }

            // Inserta el nuevo registro
            newData.push(updatedItem);
            return newData; // Retornar los datos actualizados
          }
        });
        // Actualiza `filteredData`
        setCopiaData((prevData) => {
          const exists = prevData.some(
            (row) => row[nombreID] === updatedItem[nombreID]
          );
          if (exists) {
            // Actualiza el registro existente
            return prevData.map((row) =>
              row[nombreID] === updatedItem[nombreID]
                ? { ...row, ...updatedItem }
                : row
            );
          } else {
            const newData = [...prevData]; // Copiar datos actuales

            // Encontrar el índice de la fila en edición (con ID vacío o temporal)
            const indexToRemove = newData.findIndex(
              (row) => row[nombreID] === ""
            );

            if (indexToRemove !== -1) {
              newData.splice(indexToRemove, 1); // Eliminar la fila temporal
            }

            // Inserta el nuevo registro
            newData.push(updatedItem);
            return newData; // Retornar los datos actualizados
          }
        });
        setEditingRow(null);
        setColumns(columnsConfig);
        setLastRow(null);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error en la actualización:", error);
      return false;
    }
  };

  // Componentes internos eliminados para evitar re-montajes y pérdida de foco


  const getDisplayValue = (item, column) => {
    if (column.editType === "dropdown" || column.editType === "dropdown-text") {
      const option = column.options.find(
        (option) => option.value === item[column.field]
      );
      return option ? option.label : item[column.field];
    }
    return item[column.field];
  };

  // Función para obtener valores únicos solo para campos de tipo 'dropdown'
  const getUniqueValues = (field) => {
    const values = data
      .map((item) => item[field])
      .filter((value) => value !== undefined && value !== null); // Filtra valores nulos o indefinidos

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

  const [activeFilters, setActiveFilters] = useState({}); // Filtros activos
  // Estado local para los filtros activos con las etiquetas de los filtros por defecto
  const defaultFilterColumns = columns.filter(
    (column) =>
      defaultFilters.includes(column.field) && column.visible !== false
  );
  const [activeFiltersLabel, setActiveFiltersLabel] = useState([
    ...defaultFilterColumns,
  ]);

  const RenderFilters = React.memo(
    ({ columns, data, setFilteredData, defaultFilters }) => {
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
            setActiveFiltersLabel((prevFilters) => [
              ...prevFilters,
              filterToAdd,
            ]);
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
            filtered = filtered.filter((item) => {
              const fieldValue = item[field];
              // Si el valor del campo es nulo o indefinido, no incluirlo en el filtro
              if (fieldValue === null || fieldValue === undefined) {
                return false;
              }
              // Convertir con seguridad a string y luego a minúsculas
              const fieldValueStr = String(fieldValue).toLowerCase();
              const filterValueStr = String(filterValue).toLowerCase();
              return fieldValueStr.includes(filterValueStr);
            });
          }
        });

        setFilteredData(filtered);
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
                  padding: "0px 10px",
                  textAlign: "left",
                }}
              >
                <label style={{ fontSize: "13px", color: theme?.colors?.textSecondary || "#6c757d" }}>{column.header}</label>
                {!defaultFilterColumns.some(
                  (defaultColumn) => defaultColumn.field === column.field
                ) && (
                  <span
                    onClick={() => eliminarFiltro(column.field)}
                    style={{
                      cursor: "pointer",
                      color: theme?.colors?.error || "#dc3545",
                      marginLeft: "5px",
                    }}
                  >
                    <IconUI name="FaCircleXmark" size={14} color={theme.colors.text} />
                  </span>
                )}
              </ContenedorFlex>
              <SelectUI
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
                isSearchable
                minWidth="150px"
                maxWidth="250px"
                menuMaxHeight="200px"
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
                  padding: "0px 10px",
                  textAlign: "left",
                }}
              >
                <label style={{ fontSize: "13px", color: theme?.colors?.textSecondary || "#6c757d" }}>{column.header}</label>
                {!defaultFilterColumns.some(
                  (defaultColumn) => defaultColumn.field === column.field
                ) && (
                  <span
                    onClick={() => eliminarFiltro(column.field)}
                    style={{
                      cursor: "pointer",
                      color: theme?.colors?.error || "#dc3545",
                      marginLeft: "5px",
                    }}
                  >
                    <IconUI name="FaCircleXmark" size={14} color={theme.colors.text} />
                  </span>
                )}
              </ContenedorFlex>
              <Input
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
                padding: "0px 10px",
                textAlign: "left",
              }}
            >
              <label style={{ fontSize: "13px" }}>{column.header}</label>
              {!defaultFilterColumns.some(
                (defaultColumn) => defaultColumn.field === column.field
              ) && (
                <span
                  onClick={() => eliminarFiltro(column.field)}
                  style={{ cursor: "pointer", color: theme?.colors?.error || "#dc3545", marginLeft: "5px" }}
                >
                  <IconUI name="FaCircleXmark" size={14} color={theme.colors.text} />
                </span>
              )}
            </ContenedorFlex>
            <Input
              type={column.editType}
              value={currentValue}
              placeholder={`${column.header}`}
              autoFocus={
                lastInputFocus ? lastInputFocus === column.field : false
              }
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
          {!hideOptionalFilters && (
            <div style={{ minWidth: "100px", maxWidth: "225px" }}>
              <SelectUI
                options={optionalFilters.map((column) => ({
                  value: column.field,
                  label: column.header,
                }))}
                onChange={handleAddFilter}
                placeholder="Agregar Filtro"
                isSearchable
                minWidth="150px"
                maxWidth="250px"
              />
            </div>
          )}

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
    }
  );

  // Función para manejar la adición de una nueva fila
  // Definir la función `newRow` como una función que recibe `data`
  const handleAddRow = () => {
    const newRowData = newRow(filteredData); // Llamar a `newRow` con los datos actuales
    setFilteredData([newRowData, ...filteredData]); // Añadir la nueva fila a los datos existentes
    setEditingRow("");
    return true;
  };

  const formatString = (format, field) => {
    // Si no hay formato especificado, retornar el campo tal cual
    if (!format)
      return field === null || field === undefined ? "" : String(field);

    // Si el campo es nulo o indefinido, retornar cadena vacía
    if (field === null || field === undefined) return "";

    let stringRet = field;

    try {
      // Formatear como dinero
      if (format === "money" && !isNaN(parseFloat(field))) {
        stringRet = `$ ${parseFloat(field).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        })}`;
      }

      // Formatear como porcentaje
      else if (format === "porcentaje" && !isNaN(parseFloat(field))) {
        stringRet = `${parseFloat(field).toFixed(4)} %`;
      }

      // Truncar el valor a dos decimales
      else if (format === "truncar" && !isNaN(parseFloat(field))) {
        stringRet = parseFloat(field).toFixed(2);
      }

      // Redondear el valor a dos decimales
      else if (format === "redondear" && !isNaN(parseFloat(field))) {
        stringRet = Math.round(parseFloat(field) * 100) / 100;
      } else if (format === "date") {
        stringRet = formatDateToDDMMYYYY(field);
      } else if (format === "date") {
        if (field) {
          const date = new Date(field);
          if (!isNaN(date.getTime())) {
            stringRet = formatDateToDDMMYYYY(field);
          } else {
            stringRet = field; // Mantener el valor original si no es fecha válida
          }
        } else {
          stringRet = "";
        }
      }
    } catch (error) {
      console.error(`Error al formatear campo ${format}:`, error);
      stringRet = field; // Valor original en caso de error
    }

    return stringRet;
  };

  const mostrarAgregar = () => {
    if (permisoagregar) {
      const correo = localStorage.getItem("correo");
      return permisoagregar.some((item) => item === correo);
    } else {
      return true;
    }
  };

  return (
    <ContenedorPrincipal translate="no">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "flex-end",
          padding: "5px 15px",
          gap: "20px",
          width: "100%",
          flexWrap: "wrap",
          borderBottom: `1px solid ${theme?.colors?.border || "#dee2e6"}`,
          paddingBottom: "15px",
          marginBottom: "10px"
        }}
      >
        {extraHeaderContent}
        {showFilters && (
          <RenderFilters
            columns={columns}
            data={copiaData}
            defaultFilters={defaultFilters}
            setFilteredData={setFilteredData}
          />
        )}
        {mostrarAgregar() && (
          <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonUI
              iconLeft={"FaPlus"}
              text={addButtonText}
              onClick={onAddRowClick || handleAddRow}
              style={{ padding: "5px 15px" }}
            />
          </div>
        )}
      </div>
      <div style={{ overflowX: "auto", height: "100%", minHeight: "70vh" }}>
        <Tabla $oddColor={oddRowColor} $evenColor={evenRowColor}>
          <thead>
            <tr>
              {columns
                .filter((col) => col.visible !== false)
                .map((col) => (
                  <th key={col.field} onClick={() => handleSort(col.field)}>
                    {col.header}{" "}
                    {sortOrder.column === col.field &&
                      (sortOrder.direction === "asc" ? (
                        <IconUI name="FaSortUp" size={14} color={theme.colors.text} />
                      ) : (
                        <IconUI name="FaSortDown" size={14} color={theme.colors.text} />
                      ))}
                  </th>
                ))}
              <th style={{ width: "30px", maxWidth: "30px", minWidth: "30px" }}>
                {" "}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              currentData.map((item, index) => {
                // Generar una key estable: si no hay ID, usamos un prefijo con el índice
                const rowKey = item[nombreID] ? `row-${item[nombreID]}` : `idx-${index}`;
                
                return (alwaysEditable || editingRow === item[nombreID]) ? (
                  <RenderEditableRowHorizontal
                    key={`${rowKey}-edit`}
                    item={item}
                    columns={columns}
                    lastRow={lastRow}
                    theme={theme}
                    alwaysEditable={alwaysEditable}
                    hideActions={hideActions}
                    onDelete={onDelete}
                    onRowChange={onRowChange}
                    handleCancel={handleCancel}
                    handleSave={handleSave}
                    validationErrors={validationErrors}
                    formatString={formatString}
                    formatToDateInput={formatToDateInput}
                  />
                ) : (
                  <RenderRowHorizontal
                    key={`${rowKey}-view`}
                    item={item}
                    columns={columns}
                    theme={theme}
                    nombreID={nombreID}
                    onDelete={onDelete}
                    handleDoubleClick={handleDoubleClick}
                    formatString={formatString}
                  />
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} style={{ backgroundColor: theme?.colors?.backgroundCard || theme?.colors?.backgroundLight }}>
                  <span style={{ color: theme?.colors?.textSecondary || "#6c757d" }}>No data</span>
                </td>
              </tr>
            )}
          </tbody>
        </Tabla>
      </div>
      <ContenedorFlex
        style={{
          marginTop: "5px",
          position: "relative",
          justifyContent: "space-between",
          alignItems: "center",
          minWidth: "730px",
        }}
      >
        {/* Información de elementos mostrados */}
        <span
          style={{
            position: "absolute",
            fontSize: "14px",
            color: theme?.colors?.textSecondary || "#6c757d",
          }}
        >
          Mostrando {startItem} - {endItem} de {filteredData.length} elementos
        </span>
        {/* Controles de Paginación */}
        <PaginationControls
          style={{ alignSelf: "center", flex: "1", color: theme?.colors?.textSecondary || "#6c757d" }}
        >
          <ButtonPagination
            onClick={handlePreviousPage}
            className={currentPage === 1 ? "dis" : ""}
            disabled={currentPage === 1}
          >
            <IconUI name="FaCircleArrowLeft" size={14} color={theme.colors.text} />
          </ButtonPagination>
          <span onClick={handlePageClick}>
            {isEditingPage ? (
              <span>
                {"Página "}
                <InputPagination
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputBlur}
                  onKeyPress={handlePageInputKeyPress}
                  min="1"
                  max={totalPages}
                  autoFocus
                  style={{ width: "50px", textAlign: "center" }}
                />
                {`de ${totalPages}`}
              </span>
            ) : (
              `Página ${currentPage} de ${totalPages}`
            )}
          </span>
          <ButtonPagination
            onClick={handleNextPage}
            className={currentPage === totalPages ? "dis" : ""}
            disabled={currentPage === totalPages}
          >
            <IconUI name="FaCircleArrowRight" size={14} color={theme.colors.text} />
          </ButtonPagination>
        </PaginationControls>
      </ContenedorFlex>
    </ContenedorPrincipal>
  );
};
