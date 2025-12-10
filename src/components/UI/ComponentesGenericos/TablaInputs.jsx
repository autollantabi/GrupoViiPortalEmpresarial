import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Select from "react-select";
import Creatable from "react-select/creatable";
import AsyncSelect from "react-select/async";
import { BotonConEstadoIconos } from "./Botones";
import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";

import { toast } from "react-toastify";
import { CustomButton } from "../CustomComponents/CustomButtons";

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
      background-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.white};
      font-weight: 100;
      word-wrap: break-word;
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
    height: 30px;

    &:nth-child(odd) {
      background-color: #ffffff; /* Blanco */
    }

    &:nth-child(even) {
      background-color: #f2f2f2; /* Gris claro */
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
      &:first-child {
        border-left: 1px solid rgba(101, 101, 101, 0.45);
      }
      &:last-child {
        border-right: 1px solid rgba(101, 101, 101, 0.45);
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
  border: solid 1px gray;
  border-radius: 4px;
  border-color: hsl(0, 0%, 80%);
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 13px;
  &:focus {
    box-shadow: 0 0 0 1px #2684ff;
  }
`;

const TextAreaS = styled.textarea`
  outline: 0 !important;
  width: 97%;
  min-width: 200px;
  max-height: 80px;
  text-align: center;
  border: solid 1px gray;
  border-radius: 4px;
  border-color: hsl(0, 0%, 80%);
  box-sizing: border-box;
  padding: 0 10px;

  font-size: 13px;
  &:focus {
    box-shadow: 0 0 0 1px #2684ff;
  }
`;
const SelectStyled = styled.select`
  outline: 0 !important;
  width: 90%;
  height: 38px;
  font-size: 14px;
  text-align: left;
  border: solid 1px gray;
  border-radius: 4px;
  border-color: hsl(0, 0%, 80%);
  box-sizing: border-box;
  padding: 0 20px 0 10px;
  appearance: none; /* Quita el estilo por defecto del navegador */
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
  color: rgba(0, 0, 0, 0.6);
  &.dis {
    color: rgba(0, 0, 0, 0.2);
  }
`;

const InputPagination = styled.input`
  padding: 0;
  margin: 0 5px;
  border: none;
  background-color: rgba(255, 255, 255, 0.4);
  outline: none;
  align-items: center;
  justify-content: center; /* Centra el contenido del botón */
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

const customStylesSelect = {
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
    maxWidth: "200px",
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
    whiteSpace: "normal",
    wordBreak: "break-word", // Forzar el salto de línea en palabras largas
    fontSize: "12px",
  }),
};

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

// Componente de tabla reutilizable
export const TablaGeneralizada = ({
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
}) => {
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
        toast.success("Actualizado Exitoso");
      } else {
        toast.error("No se pudo actualizar");
      }
    } catch (error) {
      console.error("Error en la actualización:", error);
      toast.error("Ocurrió un error inesperado al actualizar.");
    }

    return true;
  };

  const RenderEditableRow = React.memo(({ item, columns, lastRow }) => {
    const [editValues, setEditValues] = useState(lastRow ? lastRow : item); // Valores editados de la fila
    const [editColumns, setEditColumns] = useState(columns);
    const [filteredOptions, setFilteredOptions] = useState({}); // Estado para almacenar opciones filtradas

    const updateSomeCol = async (col, option) => {
      // Ejecutar `onDependentLoad` y actualizar columnas
      if (col.onDependentLoad) {
        const fieldOptions = await col.onDependentLoad(option);

        updateColumnOptions(fieldOptions); // Actualizar opciones de columnas
      }
    };
    // Función para manejar cambios en los campos editables
    const handleEditComponent = async (col, option) => {
      if (!option) {
        // Si no hay opción seleccionada, limpiar los valores correspondientes
        setEditValues((prevValues) => ({
          ...prevValues,
          [col.field]: "", // Limpiar label
          [col.fieldID]: null, // Limpiar value
        }));
        return;
      }

      // Actualizar ambos campos si existe fieldID
      setEditValues((prevValues) => ({
        ...prevValues,
        [col.field]: option.label, // Actualizar el label visible
        ...(col.fieldID && { [col.fieldID]: option.value }), // Actualizar el ID si existe
      }));

      // Si la columna tiene campos relacionados, restablecerlos
      if (col.columnsRelated && Array.isArray(col.columnsRelated)) {
        setEditValues((prevValues) => {
          const updatedValues = { ...prevValues };
          col.columnsRelated.forEach((relatedField) => {
            updatedValues[relatedField] = ""; // Restablecer el valor
          });

          return updatedValues;
        });
      }

      try {
        // Mostrar indicador de carga para campos dependientes
        if (col.onDependentLoad) {
          // Marcar los campos dependientes como "cargando"
          setFilteredOptions((prev) => {
            const newFilteredOptions = { ...prev };
            // Identificar campos dependientes y marcarlos
            if (col.columnsRelated) {
              col.columnsRelated.forEach((relatedField) => {
                newFilteredOptions[relatedField] = [
                  { value: "", label: "Cargando..." },
                ];
              });
            }
            return newFilteredOptions;
          });

          // Ejecutar la carga de datos dependientes
          const fieldOptions = await col.onDependentLoad(option);

          // Actualiza inmediatamente filteredOptions con los nuevos datos
          if (fieldOptions && Array.isArray(fieldOptions)) {
            const newFilteredOptions = { ...filteredOptions };

            fieldOptions.forEach((fieldOption) => {
              if (fieldOption.field && fieldOption.data) {
                newFilteredOptions[fieldOption.field] = fieldOption.data;
              }
            });

            setFilteredOptions(newFilteredOptions);
          }

          // Actualizar las opciones en las columnas
          updateColumnOptions(fieldOptions);
        }
      } catch (error) {
        console.error("Error al cargar datos dependientes:", error);
        // Restaurar opciones en caso de error
        setFilteredOptions((prev) => {
          const newFilteredOptions = { ...prev };
          if (col.columnsRelated) {
            col.columnsRelated.forEach((relatedField) => {
              newFilteredOptions[relatedField] = [
                { value: "", label: "Error al cargar" },
              ];
            });
          }
          return newFilteredOptions;
        });
      }

      // updateSomeCol(col, option);
    };

    const updateColumnOptions = (fieldOptions) => {
      if (!fieldOptions || !Array.isArray(fieldOptions)) return;

      // Actualizar opciones en las columnas
      setEditColumns((prevColumns) => {
        const updatedColumns = prevColumns.map((col) => {
          const fieldOption = fieldOptions.find(
            (opt) => opt.field === col.field
          );
          if (fieldOption && fieldOption.data) {
            return { ...col, options: fieldOption.data };
          }
          return col;
        });
        return updatedColumns;
      });

      // Actualizar también las opciones filtradas
      setFilteredOptions((prev) => {
        const newFilteredOptions = { ...prev };

        fieldOptions.forEach((fieldOption) => {
          if (fieldOption.field && fieldOption.data) {
            // Limitar a maxoptions si es necesario
            const maxoptions =
              editColumns.find((col) => col.field === fieldOption.field)
                ?.maxoptions || 30;
            newFilteredOptions[fieldOption.field] = fieldOption.data.slice(
              0,
              maxoptions
            );
          }
        });

        return newFilteredOptions;
      });
    };

    // Función para manejar cambios en el input y actualizar opciones filtradas
    const handleInputChange = (col, inputValue) => {
      if (!inputValue) inputValue = ""; // Evitar que el input sea undefined o null

      const options = col.options || [];
      const maxoptions = col.maxoptions || 30;
      try {
        if (inputValue.length >= 1) {
          const newFilteredOptions = options
            .filter((option) => {
              if (
                !option ||
                option.label === null ||
                option.label === undefined
              )
                return false;
              const optionLabel =
                typeof option.label === "string"
                  ? option.label.toLowerCase()
                  : String(option.label || "").toLowerCase();
              return optionLabel.includes(inputValue.toLowerCase());
            })
            .slice(0, maxoptions);

          setFilteredOptions((prev) => ({
            ...prev,
            [col.field]: newFilteredOptions,
          }));
        } else {
          setFilteredOptions((prev) => ({
            ...prev,
            [col.field]: options.slice(0, maxoptions),
          }));
        }
      } catch (error) {
        console.error("Error en filtrado de opciones:", error);
        setFilteredOptions((prev) => ({
          ...prev,
          [col.field]: [],
        }));
      }
    };

    // En el useEffect de inicialización de opciones filtradas
    useEffect(() => {
      const loadDependentData = async () => {
        const initialFilteredOptions = {};

        // Primero, inicializa todas las opciones básicas
        columns.forEach((col) => {
          const maxoptions = col.maxoptions || 30;
          if (col.editType === "dropdown" || col.editType === "dropdown-text") {
            initialFilteredOptions[col.field] = (col.options || []).slice(
              0,
              maxoptions
            );
          }
        });

        // Establece las opciones iniciales
        setFilteredOptions(initialFilteredOptions);

        // Después, carga las opciones dependientes
        // Busca columnas con campos dependientes que ya tengan valores
        const columnsWithDependencies = columns.filter(
          (col) => col.onDependentLoad && editValues[col.field]
        );

        // Carga datos para cada columna con dependencias
        for (const col of columnsWithDependencies) {
          try {
            if (col.fieldID && editValues[col.fieldID]) {
              const option = {
                value: editValues[col.fieldID],
                label: editValues[col.field],
              };

              // Mostrar "Cargando..." en los campos dependientes
              if (col.columnsRelated) {
                const loadingOptions = { ...initialFilteredOptions };
                col.columnsRelated.forEach((field) => {
                  loadingOptions[field] = [{ value: "", label: "Cargando..." }];
                });
                setFilteredOptions(loadingOptions);
              }

              // Cargar datos dependientes
              const fieldOptions = await col.onDependentLoad(option);
              if (fieldOptions) {
                updateColumnOptions(fieldOptions);
              }
            }
          } catch (error) {
            console.error(
              `Error cargando datos dependientes para ${col.field}:`,
              error
            );
          }
        }
      };

      loadDependentData();
    }, [item]);

    return (
      <tr className="filasTabla">
        {editColumns
          .filter((col) => col.visible !== false) // Filtrar columnas visibles
          .map((col) => {
            // Establece el ancho de la columna si está definido, o usa un valor predeterminado
            const columnWidth = col.width ? `${col.width}` : "auto";
            // Determinar las opciones para esta columna
            let colOptions = filteredOptions[col.field] || [];
            // Determinar si usar Select o CreatableSelect
            const SelectComponent =
              col.editType === "dropdown-text" ? Creatable : Select;

            // Lógica para obtener el valor adecuado del campo "value" para el select
            const selectValue = (() => {
              try {
                if (
                  col.editType === "dropdown-text" &&
                  col.options &&
                  editValues[col.field] != null
                ) {
                  return {
                    value: String(editValues[col.field]),
                    label: String(editValues[col.field]),
                  };
                }

                if (col.editType === "dropdown" && col.options) {
                  const option = col.options.find((option) => {
                    if (!option || option.value == null) return false;

                    if (col.fieldID) {
                      return (
                        editValues[col.fieldID] != null &&
                        String(option.value) === String(editValues[col.fieldID])
                      );
                    } else {
                      return (
                        editValues[col.field] != null &&
                        String(option.value) === String(editValues[col.field])
                      );
                    }
                  });

                  return option;
                }

                return null;
              } catch (error) {
                console.error("Error determinando valor seleccionado:", error);
                return null;
              }
            })();

            return (
              <td
                key={col.field}
                style={{ width: columnWidth, maxWidth: columnWidth }}
              >
                {!col.isEditable ? (
                  // Mostrar el valor original del item cuando no es editable
                  <span>{editValues[col.field]}</span>
                ) : col.editType === "dropdown" ||
                  col.editType === "dropdown-text" ? (
                  <DivFlex>
                    <SelectComponent
                      options={colOptions}
                      value={selectValue}
                      onInputChange={(inputValue) =>
                        handleInputChange(col, inputValue)
                      }
                      onChange={(selectedOption) => {
                        handleEditComponent(col, selectedOption);
                      }}
                      styles={customStylesSelect}
                      isSearchable
                      placeholder={
                        colOptions.length === 0 ? "-" : "-"
                      }
                      noOptionsMessage={() => "No hay opciones disponibles"}
                      loadingMessage={() => "Cargando..."}
                      menuPlacement="auto"
                      // Soluciona el problema de opciones que no aparecen en el primer clic
                      onMenuOpen={() => {
                        // Forzar refresco de opciones al abrir el menú
                        if (
                          col.fieldID &&
                          editValues[col.field] &&
                          col.onDependentLoad
                        ) {
                          const option = {
                            value: editValues[col.fieldID],
                            label: editValues[col.field],
                          };

                          // Solo refrescar si aún no hay opciones
                          if (
                            colOptions.length === 0 ||
                            colOptions[0].label === "Cargando..."
                          ) {
                            col.onDependentLoad(option).then((fieldOptions) => {
                              updateColumnOptions(fieldOptions);
                            });
                          }
                        }
                      }}
                    />
                  </DivFlex>
                ) : col.editType === "date" ? (
                  <DivFlex>
                    <Input
                      type={col.editType}
                      // Asignar el valor desde el item actual
                      value={
                        editValues[col.field]
                          ? formatToDateInput(editValues[col.field])
                          : ""
                      }
                      onChange={
                        (e) =>
                          handleEditComponent(col, { label: e.target.value }) // Actualizar el campo de texto
                      }
                      required={col.required}
                    />
                  </DivFlex>
                ) : col.editType === "textarea" ? (
                  <DivFlex>
                    <TextAreaS
                      rows="6"
                      // Asignar el valor desde el item actual
                      value={editValues[col.field]}
                      onChange={
                        (e) =>
                          handleEditComponent(col, { label: e.target.value }) // Actualizar el campo de texto
                      }
                      required={col.required}
                    />
                  </DivFlex>
                ) : (
                  <DivFlex>
                    <Input
                      type={col.editType}
                      // Asignar el valor desde el item actual
                      value={editValues[col.field]}
                      onChange={
                        (e) =>
                          handleEditComponent(col, { label: e.target.value }) // Actualizar el campo de texto
                      }
                      required={col.required}
                    />
                  </DivFlex>
                )}
                {validationErrors[col.field] && (
                  <span style={{ color: "red", fontSize: "12px" }}>
                    {validationErrors[col.field]}
                  </span>
                )}
              </td>
            );
          })}
        <td>
          <ContenedorFlex style={{ flexDirection: "column" }}>
            <BotonConEstadoIconos
              onClickAction={() => handleCancel()}
              tipo="cancel"
            />
            <BotonConEstadoIconos
              onClickAction={() => handleSave({ item: editValues })}
              tipo="save"
            />
          </ContenedorFlex>
        </td>
      </tr>
    );
  });

  // Componente para renderizar fila no editable
  const RenderRow = React.memo(({ item }) => {
    return (
      <tr className="filasTabla" onDoubleClick={() => handleDoubleClick(item)}>
        {columns
          .filter((col) => col.visible !== false) // Filtrar columnas visibles
          .map((col) => {
            // Establece el ancho de la columna si está definido, o usa un valor predeterminado
            const columnWidth = col.width ? `${col.width}` : "auto";
            return (
              <td
                key={col.field}
                style={{ width: columnWidth, maxWidth: columnWidth }}
              >
                {formatString(col.format, item[col.field])}
              </td>
            );
          })}
        <td>{/* Aquí puedes agregar botones u opciones adicionales */}</td>
      </tr>
    );
  });

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
                <label style={{ fontSize: "13px" }}>{column.header}</label>
                {!defaultFilterColumns.some(
                  (defaultColumn) => defaultColumn.field === column.field
                ) && (
                  <span
                    onClick={() => eliminarFiltro(column.field)}
                    style={{
                      cursor: "pointer",
                      color: "red",
                      marginLeft: "5px",
                    }}
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
                    style={{
                      cursor: "pointer",
                      color: "red",
                      marginLeft: "5px",
                    }}
                  >
                    <i className="bi bi-x-circle-fill"></i>
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
                  style={{ cursor: "pointer", color: "red", marginLeft: "5px" }}
                >
                  <i className="bi bi-x-circle-fill"></i>
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
          data={copiaData}
          defaultFilters={defaultFilters}
          setFilteredData={setFilteredData}
        />
        {/* {renderFilters()} */}
        {mostrarAgregar() && (
          <div>
            <CustomButton
              iconLeft={"FaPlusCircle"}
              onClick={handleAddRow}
              style={{ padding: "2px 5px" }}
            />
          </div>
        )}
      </div>
      <div style={{ overflowX: "auto", height: "100%", minHeight: "70vh" }}>
        <Tabla>
          <thead>
            <tr>
              {columns
                .filter((col) => col.visible !== false)
                .map((col) => (
                  <th key={col.field} onClick={() => handleSort(col.field)}>
                    {col.header}{" "}
                    {sortOrder.column === col.field &&
                      (sortOrder.direction === "asc" ? (
                        <i className="bi bi-sort-up-alt"></i>
                      ) : (
                        <i className="bi bi-sort-down"></i>
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
              currentData.map((item, index) =>
                editingRow === item[nombreID] ? (
                  <RenderEditableRow
                    key={index}
                    item={item}
                    columns={columns}
                    lastRow={lastRow}
                  />
                ) : (
                  <RenderRow key={index} item={item} />
                )
              )
            ) : (
              <tr>
                <td colSpan={columns.length + 1}>No data</td>
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
            color: "rgba(0,0,0,0.5)",
          }}
        >
          Mostrando {startItem} - {endItem} de {filteredData.length} elementos
        </span>
        {/* Controles de Paginación */}
        <PaginationControls
          style={{ alignSelf: "center", flex: "1", color: "rgba(0,0,0,0.6)" }}
        >
          <ButtonPagination
            onClick={handlePreviousPage}
            className={currentPage === 1 ? "dis" : ""}
            disabled={currentPage === 1}
          >
            <i className="bi bi-arrow-left-circle-fill"></i>
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
            <i className="bi bi-arrow-right-circle-fill"></i>
          </ButtonPagination>
        </PaginationControls>
      </ContenedorFlex>
    </ContenedorPrincipal>
  );
};
