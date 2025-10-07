import React, { useState, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";
import { registerLocale } from "react-datepicker";
import styled from "styled-components";

// Registrar locale español
registerLocale("es", es);

// Styled components
const DateSelectorContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const DateInputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DateLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  margin-bottom: 2px;
`;

const DateInput = styled(DatePicker)`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  min-width: 140px;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &:hover {
    border-color: #adb5bd;
  }
`;

const ClearButton = styled.button`
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a6268;
  }

  &:disabled {
    background-color: #adb5bd;
    cursor: not-allowed;
  }
`;

const DateSelector = forwardRef(
  (
    {
      fechaInicial = null,
      fechaFinal = null,
      onFechaInicialChange,
      onFechaFinalChange,
      onClear,
      placeholderInicial = "Fecha inicial",
      placeholderFinal = "Fecha final",
      showClearButton = true,
      disabled = false,
      minDate = null,
      maxDate = null,
      ...props
    },
    ref
  ) => {
    // Estados locales para las fechas
    const [fechaIni, setFechaIni] = useState(fechaInicial);
    const [fechaFin, setFechaFin] = useState(fechaFinal);

    // Función para manejar cambio de fecha inicial
    const handleFechaInicialChange = (date) => {
      setFechaIni(date);
      if (onFechaInicialChange) {
        onFechaInicialChange(date);
      }
    };

    // Función para manejar cambio de fecha final
    const handleFechaFinalChange = (date) => {
      setFechaFin(date);
      if (onFechaFinalChange) {
        onFechaFinalChange(date);
      }
    };

    // Función para limpiar fechas
    const handleClear = () => {
      setFechaIni(null);
      setFechaFin(null);
      if (onFechaInicialChange) onFechaInicialChange(null);
      if (onFechaFinalChange) onFechaFinalChange(null);
      if (onClear) onClear();
    };

    // Determinar fecha mínima para fecha final (no puede ser anterior a fecha inicial)
    const minDateFinal = fechaIni ? new Date(fechaIni) : minDate;

    return (
      <DateSelectorContainer ref={ref} {...props}>
        {/* Fecha Inicial */}
        <DateInputContainer>
          <DateLabel>Desde:</DateLabel>
          <DateInput
            selected={fechaIni}
            onChange={handleFechaInicialChange}
            selectsStart
            startDate={fechaIni}
            endDate={fechaFin}
            placeholderText={placeholderInicial}
            locale="es"
            dateFormat="dd/MM/yyyy"
            isClearable
            disabled={disabled}
            minDate={minDate}
            maxDate={maxDate || fechaFin}
            autoComplete="off"
          />
        </DateInputContainer>

        {/* Fecha Final */}
        <DateInputContainer>
          <DateLabel>Hasta:</DateLabel>
          <DateInput
            selected={fechaFin}
            onChange={handleFechaFinalChange}
            selectsEnd
            startDate={fechaIni}
            endDate={fechaFin}
            minDate={minDateFinal}
            placeholderText={placeholderFinal}
            locale="es"
            dateFormat="dd/MM/yyyy"
            isClearable
            disabled={disabled}
            maxDate={maxDate}
            autoComplete="off"
          />
        </DateInputContainer>

        {/* Botón Limpiar */}
        {showClearButton && (
          <ClearButton
            onClick={handleClear}
            disabled={!fechaIni && !fechaFin}
            title="Limpiar fechas"
          >
            🗑️
          </ClearButton>
        )}
      </DateSelectorContainer>
    );
  }
);

DateSelector.displayName = "DateSelector";

export default DateSelector;
