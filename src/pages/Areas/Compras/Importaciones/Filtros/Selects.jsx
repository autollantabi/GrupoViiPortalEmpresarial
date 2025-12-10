import { useEffect, useState } from "react";
import styled from "styled-components";
import DatePicker from "react-datepicker";
import { CalendarioPersonalizado } from "./CalendarioPersonalizado";
import {
  DescargarArchivoProveedor,
  EliminarArchivo,
} from "services/importacionesService";

import "react-datepicker/dist/react-datepicker.css";
import { hexToRGBA } from "utils/colors";

const DropdownContainer = styled.div`
  position: relative;
  cursor: pointer;
  min-width: 150px;
`;

const DropdownButton = styled.div`
  min-width: 150px;

  padding: ${(props) => (props.selected ? "5px 12px" : "5px 15px")};
  display: flex;
  justify-content: space-between;
  line-height: ${(props) => (props.selected ? "100%" : "none")};
  /* line-height: none; */
  align-items: ${(props) => (props.selected ? "start" : "center")};
  gap: ${(props) => (props.selected ? "0px" : "5px")};
  background-color: ${(props) =>
    props.selected ? "var(--secondary)" : "#f0f0f0"};
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  flex-direction: ${(props) => (props.selected ? "column" : "row")};
  /* flex-direction: column; */
  /* border: 1px solid #ddd; */
  border-radius: 5px;
  transition: all 0.3s ease;
`;
const DropdownButtonBasico = styled.div`
  padding: ${(props) => (props.selected ? "5px 12px" : "2px 15px")};
  display: flex;
  justify-content: space-between;
  line-height: ${(props) => (props.selected ? "100%" : "none")};
  /* line-height: none; */
  align-items: ${(props) => (props.selected ? "start" : "center")};
  gap: ${(props) => (props.selected ? "0px" : "5px")};
  background-color: ${(props) =>
    props.selected ? "var(--secondary)" : "#f0f0f0"};
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  flex-direction: ${(props) => (props.selected ? "column" : "row")};
  /* flex-direction: column; */
  /* border: 1px solid #ddd; */
  border-radius: 5px;
  transition: all 0.3s ease;

  & > input {
    border: none;
    background-color: ${(props) =>
      props.selected ? "var(--color-perla)" : "var(--color-contraste-1)"};
    border-radius: 3px;
    padding: 0 10px;
    outline: none;
    height: 22px;
    margin-bottom: ${(props) => (props.selected ? "5px" : "0")};
    color: black;
  }
`;
const TituloSelect = styled.span`
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  font-size: ${(props) => (props.selected ? "11px" : "14px")};
  font-weight: 500;
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  width: fit-content;
  /* min-width: 100%; */
  min-width: 120px;
  max-height: 400px;
  height: fit-content;
  overflow-y: auto;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  padding: 2px 2px;
  border-radius: 8px;
  z-index: 1;
  color: black;
  user-select: none;

  &.seleccionFechas {
    max-height: 600px;
    padding-bottom: 30px;
  }

  ${DropdownContainer}:hover & {
    display: block;
  }
`;

const Option = styled.div`
  padding: 3px 10px;
  border-radius: 6px;
  gap: 30px;
  display: flex;
  font-size: 14px;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  cursor: pointer;
  &.wb {
    word-break: break-all;
  }

  &:hover {
    background-color: #e9e9e9;
  }
`;
const ButtonLimpiar = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  border: solid 1px var(--secondary);
  border-radius: 5px;
  outline: none;
  padding: 2px 8px;
  color: var(--secondary);
`;

const InputFCustom = styled.input`
  border-radius: 5px;
  padding: 2px 10px;
  width: auto;
  border: solid 1px
    ${({ theme }) => hexToRGBA({ hex: theme.colors.white, alpha: 0.2 })};

  background-color: transparent;
  outline: none;
  height: 30px;
  min-width: 20vw;
  font-size: 14px;
  color: var(--color-perla);
  &:focus {
    border: solid 1px var(--secondary);
  }
  &.numFormat {
    padding: 2px 10px 2px 22px;
  }

  &.readonly {
    border: solid 1px rgba(255, 255, 255, 0.2);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.2) 100%
    );
  }
`;

const ContenedorHora = styled.div`
  display: flex;
  gap: 10px;
  padding: 0 10px;
  & > div {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    & input,
    select {
      border: none;
      padding: 2px 5px;
      border-radius: 5px;
      outline: none;
      width: 55px;
      min-width: 40px;
    }
    & select {
      width: fit-content;
    }
  }
`;

export const Selects = ({
  options,
  onChange,
  nombreCampo,
  nombre,
  valueInfo,
  isMultiple,
  addWordBreak,
  readOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (option) => {
    if (!readOnly) {
      if (isMultiple) {
        // Verificar si la opción ya está seleccionada
        const isAlreadySelected = valueInfo.some(
          (v) => v.value === option.value
        );
        let newSelectedOptions = isAlreadySelected
          ? valueInfo.filter((v) => v.value !== option.value) // Eliminar si ya está seleccionada
          : [...valueInfo, option]; // Añadir si no está seleccionada

        onChange(nombreCampo, newSelectedOptions);
      } else {
        // Ajustar la selección a un solo objeto, aún manejado como array
        onChange(nombreCampo, [option]);
      }
    }
  };

  const isSelected = (option) => {
    return valueInfo.some((v) => v.value === option.value);
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <DropdownContainer
        onClick={() => !readOnly && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <DropdownButton selected={valueInfo.length > 0}>
          <TituloSelect selected={valueInfo.length > 0}>{nombre}</TituloSelect>
          {valueInfo.length > 0 ? valueInfo.map((v) => v.name).join(", ") : "⌵"}
        </DropdownButton>

        {isOpen && !readOnly && (
          <DropdownContent>
            {options.map((option, index) => (
              <Option
                className={`${addWordBreak && "wb"}`}
                key={index}
                onClick={() => handleOptionClick(option)}
              >
                <span>{option.name}</span>
                <span>{isSelected(option) ? " ✓" : ""}</span>
              </Option>
            ))}
          </DropdownContent>
        )}
      </DropdownContainer>
    </div>
  );
};
export const SelectBasico = ({
  options,
  onChange,
  nombreCampo,
  nombre,
  isMultiple,
  defaultValue,
  readOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    if (defaultValue) {
      const defaultOption = options.find(
        (option) => option.name === defaultValue
      );
      if (defaultOption) {
        setSelectedOptions(isMultiple ? [defaultOption] : [defaultOption]); // Asegúrate de manejar isMultiple aquí si es necesario
      }
    }
  }, [defaultValue, options, isMultiple]);

  const handleOptionClick = (option) => {
    if (!readOnly) {
      if (isMultiple) {
        const isAlreadySelected = selectedOptions.some(
          (selected) => selected.value === option.value
        );
        let newSelectedOptions = isAlreadySelected
          ? selectedOptions.filter(
              (selected) => selected.value !== option.value
            )
          : [...selectedOptions, option].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
        setSelectedOptions(newSelectedOptions);
        onChange(
          nombreCampo,
          newSelectedOptions.map((opt) => opt.name).join(", ")
        );
      } else {
        setSelectedOptions([option]);
        onChange(nombreCampo, option.name);
      }
    }
  };

  const isSelected = (option) =>
    selectedOptions.some((selected) => selected.value === option.value);

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <DropdownContainer
        onClick={() => !readOnly && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <DropdownButtonBasico selected={selectedOptions.length > 0}>
          <TituloSelect selected={selectedOptions.length > 0}>
            {""}
          </TituloSelect>
          {selectedOptions.length > 0
            ? selectedOptions.map((opt) => opt.name).join(", ")
            : "⌵"}
        </DropdownButtonBasico>

        {isOpen && !readOnly && (
          <DropdownContent>
            {[...options]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((option, index) => (
                <Option key={index} onClick={() => handleOptionClick(option)}>
                  <span>{option.name}</span>
                  <span>{isSelected(option) ? " ✓" : ""}</span>
                </Option>
              ))}
          </DropdownContent>
        )}
      </DropdownContainer>
    </div>
  );
};

export const TimeInput = ({ onChange, nombreCampo, value }) => {
  // Estados para horas, minutos y AM/PM
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [meridiem, setMeridiem] = useState("AM");
  // Efecto para inicializar los valores
  useEffect(() => {
    if (value) {
      const parts = value.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (parts) {
        setHour(parts[1]);
        setMinute(parts[2]);
        setMeridiem(parts[3]);
      }
    }
  }, [value]);
  const validateAndUpdateTime = (newHour, newMinute, newMeridiem) => {
    // Construir la hora con ceros a la izquierda si es necesario
    if (newHour === "") {
      if (newMinute === "") {
        onChange(nombreCampo, "");
      } else {
        const fullTime = `01:${newMinute} ${newMeridiem}`;
        onChange(nombreCampo, fullTime);
      }
    } else {
      if (newMinute === "") {
        const fullTime = `${newHour}:00 ${newMeridiem}`;
        onChange(nombreCampo, fullTime);
      } else {
        const fullTime = `${newHour}:${newMinute} ${newMeridiem}`;
        onChange(nombreCampo, fullTime);
      }
    }
  };

  const handleHourChange = (e) => {
    const newHour = e.target.value;
    if (newHour === "" || (newHour > 0 && newHour <= 12)) {
      setHour(newHour);
      validateAndUpdateTime(newHour, minute, meridiem);
    }
  };

  const handleMinuteChange = (e) => {
    const newMinute = e.target.value;
    if (newMinute === "" || (newMinute >= 0 && newMinute < 60)) {
      setMinute(newMinute);
      validateAndUpdateTime(hour, newMinute, meridiem);
    }
  };

  const handleMeridiemChange = (e) => {
    const newMeridiem = e.target.value;
    setMeridiem(newMeridiem);
    validateAndUpdateTime(hour, minute, newMeridiem);
  };

  return (
    <ContenedorHora>
      <div>
        <label htmlFor="hour">HH:</label>
        <input
          type="number"
          id="hour"
          value={hour}
          onChange={handleHourChange}
          placeholder="HH"
        />
      </div>
      <div>
        <label htmlFor="minute">MM:</label>
        <input
          type="number"
          id="minute"
          value={minute}
          onChange={handleMinuteChange}
          placeholder="MM"
        />
      </div>
      <div>
        {/* <label htmlFor="meridiem">AM/PM:</label> */}
        <select id="meridiem" value={meridiem} onChange={handleMeridiemChange}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </ContenedorHora>
  );
};

export const SelectsFechas = ({
  onChange,
  nombreCampo,
  nombre,
  minFecha,
  all,
  value,
  readOnly,
}) => {
  // Asegurar que startDate siempre sea al menos una cadena vacía, nunca null
  const [startDate, setStartDate] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  function parseFecha(fechaString) {
    if (!fechaString || typeof fechaString !== "string") return new Date();

    const [day, month, year] = fechaString.split("/");
    return new Date(year, month - 1, day);
  }

  function formatearFecha(fecha) {
    // Si no hay fecha, retornar cadena vacía
    if (!fecha) return "";

    // Si es una cadena, verificar si ya tiene el formato dd/mm/yyyy
    if (typeof fecha === "string") {
      // Si ya está en formato válido (dd/mm/yyyy), mantenerlo como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        return fecha; // Mantener el formato original
      }
    }

    // Si es un objeto Date, formatearlo a dd/mm/yyyy
    if (fecha instanceof Date) {
      const day = fecha.getDate().toString().padStart(2, "0");
      const month = (fecha.getMonth() + 1).toString().padStart(2, "0");
      const year = fecha.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return fecha; // Devolver el valor original si no se aplica ninguna regla
  }

  let hoyDate = new Date();
  let minDateP = false;

  if (!all) {
    minDateP = new Date();
    minDateP = minFecha ? parseFecha(minFecha) : minDateP;
    minDateP.setHours(minDateP.getHours() - 24);
  } else {
    if (minFecha) {
      minDateP = parseFecha(minFecha);
      minDateP.setHours(minDateP.getHours() - 24);
    }
  }

  function validarFechas() {
    // Solo validar si tanto minFecha como startDate son strings válidos
    if (
      minFecha &&
      startDate &&
      typeof startDate === "string" &&
      startDate.trim() !== ""
    ) {
      try {
        let f1 = parseFecha(minFecha);
        let f2 = parseFecha(startDate);
        if (f1 > f2) {
          handleChangeDate("");
        }
      } catch (error) {
        console.error("Error validando fechas:", error);
      }
    }
  }

  useEffect(() => {
    validarFechas();
  }, [minFecha]);

  useEffect(() => {
    // Asegurar que siempre se establezca un string, nunca null
    setStartDate(value || "");
  }, [value]);

  const handleChangeDate = (date) => {
    if (!readOnly) {
      // Convertir la fecha al formato dd/MM/yyyy si es necesario
      const formattedDate = formatearFecha(date);

      setStartDate(formattedDate || "");
      onChange(nombreCampo, formattedDate || "");
    }
  };

  const handleDateFormatSelectedDate = () => {
    let newDate = "";

    if (value) {
      newDate = parseFecha(value);
    } else {
      if (minFecha) {
        newDate = parseFecha(minFecha);
      }
      newDate =
        !startDate || startDate === "" ? hoyDate : parseFecha(startDate);
    }
    return newDate;
  };

  // Asegurar que startDate sea siempre un string para evitar errores al acceder a .length
  const startDateSafe = startDate || "";

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <DropdownContainer
        onClick={() => !readOnly && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <DropdownButton selected={startDateSafe.length > 0}>
          <TituloSelect selected={startDateSafe.length > 0}>
            {nombre}
          </TituloSelect>
          {startDateSafe.length > 0 ? startDateSafe : "⌵"}
        </DropdownButton>

        {isOpen && !readOnly && (
          <DropdownContent className="seleccionFechas">
            <CalendarioPersonalizado
              setDate={handleChangeDate}
              selectedDateP={handleDateFormatSelectedDate}
              minDate={minDateP}
            />
            <ButtonLimpiar onClick={() => handleChangeDate("")}>
              Limpiar
            </ButtonLimpiar>
          </DropdownContent>
        )}
      </DropdownContainer>
    </div>
  );
};

const InputDelSelect = styled.input`
  padding: 10px 0px;
  outline: none;
  width: 100%;
  border: none;
  border-top: solid 1px
    ${(props) => (props.selected ? "rgba(255, 255, 255, 0.7)" : "black")};
  /* background-color: rgba(255, 255, 255, 0.7); */
  background-color: transparent;

  height: 24px;
  margin-bottom: ${(props) => (props.selected ? "5px" : "0")};
  color: ${(props) => (props.selected ? "white" : "black")};
  &::placeholder {
    color: ${(props) =>
      props.selected ? "rgba(255, 255, 255, 0.7)" : "black"};
  }
`;

export const SelectsConInput = ({
  options,
  onChange,
  nombreCampo,
  nombre,
  valueInfo,
  isMultiple,
  addWordBreak,
  readOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Garantizar que valueInfo sea tratado siempre como un valor válido
  const valueInfoSafe = valueInfo || (isMultiple ? [] : "");

  const handleOptionClick = (option) => {
    if (!readOnly) {
      if (isMultiple) {
        // Verificar que valueInfoSafe sea un array antes de usar .some()
        const isAlreadySelected =
          Array.isArray(valueInfoSafe) &&
          valueInfoSafe.some((selected) => selected.value === option.value);

        let newSelectedOptions = isAlreadySelected
          ? valueInfoSafe.filter((selected) => selected.value !== option.value)
          : [
              ...(Array.isArray(valueInfoSafe) ? valueInfoSafe : []),
              option,
            ].sort((a, b) => a.name.localeCompare(b.name));

        onChange(nombreCampo, newSelectedOptions);
        setFilter("");
      } else {
        onChange(nombreCampo, option.name);
        setFilter("");
      }
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Función segura para verificar si una opción está seleccionada
  const isSelected = (option) => {
    if (isMultiple) {
      return (
        Array.isArray(valueInfoSafe) &&
        valueInfoSafe.some((selected) => selected.value === option.value)
      );
    } else {
      return valueInfoSafe === option.value;
    }
  };

  // Verificar si hay algo seleccionado de forma segura
  const hasSelection = isMultiple
    ? Array.isArray(valueInfoSafe) && valueInfoSafe.length > 0
    : valueInfoSafe !== null && valueInfoSafe !== "";

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <DropdownContainer
        onClick={() => !readOnly && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <DropdownButton
          style={{ flexDirection: "column", alignItems: "flex-start" }}
          selected={hasSelection}
        >
          <div
            style={
              hasSelection
                ? { display: "flex", flexDirection: "column" }
                : { display: "flex", flexDirection: "row" }
            }
          >
            <TituloSelect selected={hasSelection}>{nombre}</TituloSelect>
            {hasSelection
              ? isMultiple
                ? valueInfoSafe.map((opt) => opt.name).join(", ")
                : valueInfoSafe
              : "⌵"}
          </div>
          <InputDelSelect
            type="text"
            placeholder="Buscar..."
            value={filter}
            selected={hasSelection}
            onChange={handleFilterChange}
          />
        </DropdownButton>

        {isOpen && !readOnly && (
          <DropdownContent>
            {filteredOptions.length >= 1 ? (
              filteredOptions.map((option, index) => (
                <Option
                  className={`${addWordBreak && "wb"}`}
                  key={index}
                  onClick={() => handleOptionClick(option)}
                >
                  <span>{option.name}</span>
                  <span>{isSelected(option) ? " ✓" : ""}</span>
                </Option>
              ))
            ) : (
              <Option>No existen registros con esa cadena</Option>
            )}
          </DropdownContent>
        )}
      </DropdownContainer>
    </div>
  );
};
export const InputField = ({
  onChange,
  nombreCampo,
  nombre,
  valor,
  tipo,
  readOnly,
  min,
  max,
  formatoNumero,
  entero,
}) => {
  const [inputValue, setInputValue] = useState(valor || "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      if (formatoNumero && tipo === "number" && !entero) {
        // Protección contra valores nulos o undefined
        if (valor === null || valor === undefined) {
          setInputValue("");
          return;
        }

        // Usar toString() solo cuando estemos seguros de que valor no es null o undefined
        const numericValue = parseFloat(
          (valor || "").toString().replace(/,/g, "")
        );

        if (!isNaN(numericValue)) {
          const formattedValue = numericValue.toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          setInputValue(formattedValue);
        } else {
          setInputValue("");
        }
      } else {
        // Para otros tipos, simplemente asegúrate de que nunca sea null
        setInputValue(valor === null || valor === undefined ? "" : valor);
      }
    }
  }, [valor, tipo, formatoNumero, isEditing, entero]);

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (tipo === "number") {
      newValue = newValue.replace(/[^\d.-]/g, "");
      if (entero) {
        newValue = newValue.replace(/[^\d-]/g, "");
      }
    }

    setInputValue(newValue);
    onChange(nombreCampo, newValue);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let finalValue = inputValue;

    if (tipo === "number") {
      let numericValue = parseFloat(inputValue.toString().replace(/,/g, ""));
      if (isNaN(numericValue)) {
        numericValue = ""; // Establecer un valor predeterminado si no es un número
      }

      if (numericValue !== "") {
        if (min !== undefined && numericValue < min) {
          numericValue = min;
        } else if (max !== undefined && numericValue > max) {
          numericValue = max;
        }

        if (entero) {
          finalValue = Math.floor(numericValue).toString();
        } else {
          finalValue = numericValue.toFixed(2);
        }

        if (formatoNumero && !entero) {
          finalValue = parseFloat(finalValue).toLocaleString("en-GB", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
      }
    } else {
      if (min !== undefined && inputValue.length < min) {
        finalValue = inputValue.padEnd(min, " ");
      } else if (max !== undefined && inputValue.length > max) {
        finalValue = inputValue.substring(0, max);
      }
    }

    setInputValue(finalValue);
    onChange(nombreCampo, finalValue);
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      {formatoNumero && tipo === "number" && (
        <span style={{ marginRight: "-20px", paddingLeft: "10px" }}>$</span>
      )}
      <InputFCustom
        className={`${readOnly ? "readonly" : ""} ${
          formatoNumero ? "numFormat" : ""
        }`}
        type="text"
        placeholder={`${nombre ? `${nombre}` : ""} ${
          min ? `Min: ${min}` : ""
        } ${max ? `Max: ${max}` : ""}`}
        value={inputValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        readOnly={readOnly}
        min={min}
        max={max}
      />
    </div>
  );
};
export const CampoTextoArchivos = ({ setArchivo, aceptados, nombreCampo }) => {
  const [file, setFile] = useState(null);

  // Función para manejar la selección de archivos
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile === undefined) {
      setFile(null);
      setArchivo(nombreCampo, "");
    } else if (selectedFile) {
      setFile(selectedFile);
      setArchivo(nombreCampo, selectedFile);
      // Aquí podrías hacer más operaciones como leer el archivo o prepararlo para enviar a un servidor
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <input
        type="file"
        onChange={handleFileChange}
        accept={aceptados}
        style={{ display: "none" }} // Oculta el input
        id="fileInputMB" // Asegúrate de que el ID sea único si usas múltiples inputs en la misma página
      />
      <label
        htmlFor="fileInputMB"
        style={{
          cursor: "pointer",
          display: "flex",
          gap: "10px",
          border: "solid 1px var(--color-perla)",
          justifyContent: "center",
          borderRadius: "5px",
          padding: "2px 10px",
        }}
      >
        <i className="bi bi-upload"></i>Subir archivo (.xlsx, .docx, .pdf)
      </label>
      {file && (
        <span style={{ fontSize: "14px" }}>
          Archivo seleccionado: {file.name}
        </span>
      )}
    </div>
  );
};

const TAP = styled.textarea`
  outline: none;
  border: solid 1px
    ${({ theme }) => hexToRGBA({ hex: theme.colors.white, alpha: 0.2 })};
  border-radius: 5px;
  min-height: 100px;
  padding: 2px 10px;
  max-height: 300px;
  height: 60px;
  width: 400px;
  background-color: transparent;
  color: var(--color-perla);
  &:focus {
    border: solid 1px var(--secondary);
  }
  &.readonly {
    border: solid 1px rgba(255, 255, 255, 0.2);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0.2) 100%
    );
  }
`;

export const TextArea = ({ valor, setValue, nombreCampo, readOnly }) => {
  const newValue = valor || ""; // Asegurarse de que valor nunca sea null o undefined
  const handleChange = (event) => {
    const val = event.target.value;
    setValue(nombreCampo, val);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        flexDirection: "row",
      }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <TAP
        className={readOnly && "readonly"}
        value={newValue}
        onChange={handleChange}
        readOnly={readOnly}
      />
    </div>
  );
};

const ContenedorCampoArchivos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;

  & > .archivos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    /* align-items: center; */
    gap: 5px;
    width: 467px;
    min-height: 126px;
    background-color: var(--color-contraste-2);
    border-radius: 5px;
    border: solid 1px rgba(255, 255, 255, 0.5);
    padding: 4px 2px;

    & > .archivoname {
      border: solid 1px white;
      border-radius: 5px;
      padding: 3px 8px;
      width: 150px;
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      position: relative;
      height: auto;
      & > i {
        font-size: 50px;
      }

      &:hover .buttons {
        display: flex;
      }

      & > span {
        width: 100%;
        word-wrap: break-word;
        font-size: 14px;
        text-align: center;
      }
      & > .buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        gap: 3px;
        top: 5px;
        right: 5px;
      }

      .buttons > .close-icon,
      .download {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 5px;
        padding: 0;
        width: 26px;
        height: 26px;
        color: white;
        background-color: rgba(0, 0, 0, 0.3);
        cursor: pointer;

        &:hover {
          background-color: rgba(255, 255, 255, 0.12);
        }
      }
      .buttons > .confirmar {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4px 2px;
        border-radius: 5px;
        width: fit-content;
        height: 26px;
        color: white;
        gap: 3px;
        background-color: rgba(0, 0, 0, 0.3);
        cursor: pointer;
        & > div {
          width: 20px;
          height: 20px;
          font-size: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 3px;
          &.elim {
            background-color: red;
          }
          &.cancelar {
            background-color: transparent;
          }
        }
      }
    }
  }
`;
const getIconForExtension = (filename) => {
  const extension = filename.split(".").pop();
  switch (extension) {
    case "pdf":
      return "bi bi-filetype-pdf";
    case "doc":
      return "bi bi-filetype-doc";
    case "docx":
      return "bi bi-filetype-docx";
    case "xls":
      return "bi bi-filetype-xls";
    case "xlsx":
      return "bi bi-filetype-xlsx";
    case "csv":
      return "bi bi-filetype-csv";
    case "png":
      return "bi bi-filetype-png";
    case "zip":
      return "bi bi-file-earmark-zip";
    case "rar":
      return "bi bi-file-earmark-zip";
    case "7z":
      return "bi bi-file-earmark-zip";
    default:
      return "bi bi-file-earmark"; // Un ícono genérico para otros tipos de archivos
  }
};

export const CampoListaArchivos = ({
  setArchivo,
  aceptados,
  nombreCampo,
  archivos,
  impFinalizado,
  id,
  limite,
}) => {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");
  const [confirmaciones, setConfirmaciones] = useState({});

  useEffect(() => {
    setFiles(Array.isArray(archivos) ? archivos : []); // Asegúrate de que files sea un array

    // Inicializa el estado de confirmación para cada archivo
    const inicialConfirmaciones = (archivos || []).reduce((acc, archivo) => {
      acc[archivo.idDocumento] = false; // Usa un identificador único por archivo si está disponible
      return acc;
    }, {});
    setConfirmaciones(inicialConfirmaciones);
  }, [archivos]);

  const handleToggleConfirmation = (fileId) => {
    setConfirmaciones((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newFiles = Array.isArray(files) ? [...files] : [];
    let duplicateFound = false;

    selectedFiles.forEach((file) => {
      if (newFiles.length >= limite) {
        setError(`Limite de archivos. Si desea subir uno, elimine alguno.`);
        return;
      }
      if (newFiles.length !== 0) {
        if (
          !newFiles.some(
            (f) =>
              (f.doc?.name === file.name && f.doc?.size === file.size) ||
              f.nombreArchivo === file.name
          )
        ) {
          let newIdDocumento;
          do {
            newIdDocumento = Math.floor(Math.random() * 10000); // Genera un ID aleatorio
          } while (newFiles.some((f) => f.idDocumento === newIdDocumento)); // Asegúrate de que el ID sea único

          const nombreArchivoSeparado = file.name.split(".");

          const nombreArchivo = nombreArchivoSeparado[0];
          const extensionArchivo = nombreArchivoSeparado[1];

          newFiles.push({
            doc: file,
            nombreArchivo: nombreArchivo,
            extensionArchivo: extensionArchivo,
            idDocumento: newIdDocumento,
          });
        } else {
          duplicateFound = true;
        }
      } else {
        let newIdDocumento;
        newIdDocumento = Math.floor(Math.random() * 10000); // Genera un ID aleatorio

        //Se obtiene el nombre del archivo

        const nombreArchivoSeparado = file.name.split(".");

        const nombreArchivo = nombreArchivoSeparado[0];
        const extensionArchivo = nombreArchivoSeparado[1];

        newFiles.push({
          doc: file,
          nombreArchivo: nombreArchivo,
          extensionArchivo: extensionArchivo,
          idDocumento: newIdDocumento,
        });
      }
    });

    if (duplicateFound) {
      setError("No se puede subir el mismo archivo más de una vez.");
    } else {
      setError(""); // Limpia cualquier mensaje de error anterior
    }
    setFiles(newFiles);
    setArchivo(nombreCampo, newFiles);
  };

  const handleRemoveFile = async (fileToRemove) => {
    let idD = fileToRemove.idDocumento;
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    await EliminarArchivo({ id_documento: idD });

    setFiles(updatedFiles);
    setArchivo(nombreCampo, updatedFiles);
    setError("");
    // Asegura limpiar el estado de confirmación
    handleToggleConfirmation(fileToRemove.idDocumento);
  };

  const handleDownloadFile2 = async ({
    file,
    id,
    nombreArchivo,
    extensionArchivo,
  }) => {
    let nombreArchivoDescargar = "";
    let urlArchivo = "";
    const link = document.createElement("a");

    if (file) {
      //Si existe el archivo en el navegador
      urlArchivo = URL.createObjectURL(file);
      console.log("file.name", file.name);
      nombreArchivoDescargar = file.name;
    } else {
      try {
        // Si no existe, se consulta en la base de datos
        // Asegúrate que el servicio devuelve una respuesta con
        // responseType: 'arraybuffer' o 'blob'
        const response = await DescargarArchivoProveedor({ id });

        // Determinar el tipo MIME basado en la extensión
        const mimeType = getMimeType(extensionArchivo);

        // Crear el blob con el tipo MIME adecuado
        const blob = new Blob([response.data], { type: mimeType });
        urlArchivo = window.URL.createObjectURL(blob);
        nombreArchivoDescargar = `${nombreArchivo}.${extensionArchivo}`;
      } catch (error) {
        console.error("Error al descargar el archivo:", error);
        alert(
          "No se pudo descargar el archivo. Por favor, inténtelo de nuevo."
        );
        return;
      }
    }

    link.href = urlArchivo;
    link.download = nombreArchivoDescargar;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función auxiliar para determinar el tipo MIME
  const getMimeType = (extension) => {
    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      // Añadir más según sea necesario
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  };

  return (
    <ContenedorCampoArchivos>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        accept={aceptados}
        style={{ display: "none" }}
        id={"fileInputMB-" + id}
      />
      {!impFinalizado && (
        <label
          htmlFor={"fileInputMB-" + id}
          style={{
            width: "100%",
            cursor: "pointer",
            display: "flex",
            gap: "10px",
            border: "solid 1px var(--color-perla)",
            justifyContent: "center",
            borderRadius: "5px",
            padding: "2px 10px",
          }}
        >
          <i className="bi bi-upload"></i> Subir archivos ({aceptados})
        </label>
      )}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div className="archivos">
        {files === null ? (
          <span>Cargando...</span>
        ) : !files || files.length === 0 ? (
          <span>
            No existen archivos <br />
            <small>(El archivo se cargará en breve si existe)</small>
          </span>
        ) : (
          files.map((file, index) => (
            <div className="archivoname" key={index}>
              <i
                className={`bi ${getIconForExtension(
                  file.nombreArchivo + "." + file.extensionArchivo
                )}`}
              ></i>
              <span>{file.nombreArchivo}</span>

              <div className="buttons">
                <div
                  className="download"
                  onClick={() =>
                    handleDownloadFile2({
                      file: file.doc,
                      id: file.idDocumento,
                      nombreArchivo: file.nombreArchivo,
                      extensionArchivo: file.extensionArchivo,
                    })
                  }
                >
                  <i className="bi bi-download"></i>
                </div>
                {!impFinalizado &&
                  (!confirmaciones[file.idDocumento] ? (
                    <div
                      className="close-icon"
                      onClick={() => handleToggleConfirmation(file.idDocumento)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </div>
                  ) : (
                    <div className="confirmar">
                      <div
                        className="elim"
                        onClick={() => handleRemoveFile(file)}
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </div>
                      <div
                        className="cancelar"
                        onClick={() =>
                          handleToggleConfirmation(file.idDocumento)
                        }
                      >
                        <i className="bi bi-x-lg"></i>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </ContenedorCampoArchivos>
  );
};
