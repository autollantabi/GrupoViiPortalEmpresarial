import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";

const DateTimeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px;
  width: 100%;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
`;

const DateTimeRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DateSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const TimeSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const DateInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const HiddenDateInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  z-index: 2;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    height: auto;
    color: transparent;
    background: transparent;
    cursor: pointer;
  }
`;

const DateButton = styled.button`
  position: relative;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 5px;
  background-color: ${({ theme, disabled }) => 
    disabled 
      ? (theme?.colors?.backgroundDark || "#e9ecef")
      : (theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#fafafa")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 13px;
  width: 100%;
  text-align: left;
  color: ${({ theme, $hasValue }) => 
    $hasValue 
      ? (theme?.colors?.text || "#212529")
      : (theme?.colors?.placeholder || "#6c757d")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 1;
  min-height: 38px;

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
      border-color: ${props.theme?.colors?.inputFocus || props.theme?.colors?.primary || "#3c3c3b"};
      box-shadow: 0 0 0 2px ${props.theme?.colors?.inputFocus || props.theme?.colors?.primary || "#3c3c3b"}20;
    `}
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"};
    box-shadow: 0 0 0 2px ${({ theme }) => 
      theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"}20;
  }
`;

const TimeContainer = styled.div`
  position: relative;
  width: 100%;
`;

const HiddenTimeInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  z-index: 2;

  &::-webkit-calendar-picker-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    height: auto;
    color: transparent;
    background: transparent;
    cursor: pointer;
  }
`;

const TimeButton = styled.button`
  position: relative;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 5px;
  background-color: ${({ theme, disabled }) => 
    disabled 
      ? (theme?.colors?.backgroundDark || "#e9ecef")
      : (theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#fafafa")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 13px;
  width: 100%;
  text-align: left;
  color: ${({ theme, $hasValue }) => 
    $hasValue 
      ? (theme?.colors?.text || "#212529")
      : (theme?.colors?.placeholder || "#6c757d")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 1;
  min-height: 38px;

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
      border-color: ${props.theme?.colors?.inputFocus || props.theme?.colors?.primary || "#3c3c3b"};
      box-shadow: 0 0 0 2px ${props.theme?.colors?.inputFocus || props.theme?.colors?.primary || "#3c3c3b"}20;
    `}
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"};
    box-shadow: 0 0 0 2px ${({ theme }) => 
      theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"}20;
  }
`;

export const DateTimeSelectorUI = ({
  fecha = null,
  hora = "",
  onChange,
  label = "",
  disabled = false,
  min = null,
  minHora = "",
  max = null,
}) => {
  const { theme } = useTheme();
  
  // Convertir hora AM/PM a formato 24 horas (HH:MM)
  const horaTo24 = (horaString) => {
    if (!horaString || horaString === "") return "";
    try {
      const match = horaString.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (!match) return "";
      
      let hours = parseInt(match[1]);
      const minutes = match[2].padStart(2, "0");
      const meridiem = match[3].toUpperCase();
      
      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      } else if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }
      
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    } catch (error) {
      console.error("Error al convertir hora:", error);
      return "";
    }
  };

  // Convertir hora 24 horas (HH:MM) a formato AM/PM
  const hora24ToAMPM = (hora24) => {
    if (!hora24 || hora24 === "") return "";
    try {
      const [hoursStr, minutes] = hora24.split(":");
      const hours = parseInt(hoursStr);
      
      if (isNaN(hours) || hours < 0 || hours > 23) return "";
      
      const meridiem = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${displayHours}:${minutes || "00"} ${meridiem}`;
    } catch (error) {
      console.error("Error al convertir hora:", error);
      return "";
    }
  };

  // Convertir Date a formato YYYY-MM-DD para input type="date"
  const formatDateToInput = (date) => {
    if (!date) return "";
    if (typeof date === "string") {
      // Si es string DD/MM/YYYY, convertir a YYYY-MM-DD
      const parts = date.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return "";
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Convertir Date a formato DD/MM/YYYY para mostrar
  const formatDateToDisplay = (date) => {
    if (!date) return "Fecha";
    if (typeof date === "string") {
      // Si ya es string DD/MM/YYYY, retornarlo
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date;
      }
      return "Fecha";
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Fecha";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convertir string YYYY-MM-DD a Date o string DD/MM/YYYY
  const parseInputToDate = (inputValue) => {
    if (!inputValue) return null;
    const parts = inputValue.split("-");
    if (parts.length === 3) {
      // Retornar como string DD/MM/YYYY para consistencia
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return null;
  };

  const handleDateChange = (e) => {
    const inputValue = e.target.value;
    if (!inputValue || inputValue === "") {
      notifyChange(null, undefined); // undefined para mantener la hora actual
      return;
    }
    
    const dateString = parseInputToDate(inputValue);
    if (dateString) {
      // Validar que la fecha no sea menor que min si existe
      if (min) {
        const fechaMinStr = typeof min === "string" ? min : formatDateToDisplay(min);
        if (dateString < fechaMinStr) {
          // Fecha menor que la mínima, no actualizar
          return;
        }
        
        // Si las fechas son iguales, también validar la hora mínima
        if (dateString === fechaMinStr && minHora && hora) {
          const horaMin24 = horaTo24(minHora);
          const horaActual24 = horaTo24(hora);
          if (horaActual24 < horaMin24) {
            // La fecha es igual pero la hora es menor, limpiar la hora para que se ajuste
            notifyChange(dateString, "");
            return;
          }
        }
      }
      
      // Notificar cambio con la nueva fecha y mantener la hora actual
      notifyChange(dateString, undefined); // undefined para mantener la hora actual
    } else {
      // Si no se puede parsear, limpiar la fecha
      notifyChange(null, undefined);
    }
  };

  // Función para notificar cambios
  const notifyChange = (newFecha, newHora) => {
    if (onChange) {
      // Si newFecha o newHora son undefined, usar los valores actuales
      const fechaFinal = newFecha !== undefined ? (newFecha || null) : (fecha || null);
      const horaFinal = newHora !== undefined ? (newHora || "") : (hora || "");
      onChange({
        fecha: fechaFinal,
        hora: horaFinal,
      });
    }
  };

  const handleTimeChange = (e) => {
    const hora24 = e.target.value; // Formato HH:MM (24 horas)
    
    // Validar que si hay fecha mínima y es la misma fecha, la hora no sea menor
    if (hora24 && min && fecha) {
      const fechaMinStr = typeof min === "string" ? min : formatDateToDisplay(min);
      const fechaActualStr = formatDateToDisplay(fecha);
      
      // Si las fechas son iguales, validar la hora
      if (fechaActualStr === fechaMinStr && minHora) {
        const horaMin24 = horaTo24(minHora);
        if (hora24 < horaMin24) {
          // Hora menor que la mínima, no actualizar
          return;
        }
      }
    }
    
    if (hora24) {
      const horaAMPM = hora24ToAMPM(hora24);
      // Notificar cambio con la nueva hora y mantener la fecha actual
      notifyChange(undefined, horaAMPM); // undefined para mantener la fecha actual
    } else {
      notifyChange(undefined, ""); // undefined para mantener la fecha actual
    }
  };

  // Formatear hora para mostrar en el botón
  const formatTimeToDisplay = () => {
    if (!hora || hora === "") return "Hora";
    return hora;
  };

  // Formatear hora para input type="time" (formato 24 horas)
  const formatTimeToInput = () => {
    if (!hora || hora === "") return "";
    return horaTo24(hora);
  };

  return (
    <DateTimeContainer>
      {label && <Label theme={theme}>{label}</Label>}
      <DateTimeRow>
        <DateSection>
          <DateInputWrapper>
            <HiddenDateInput
              type="date"
              value={formatDateToInput(fecha)}
              onChange={handleDateChange}
              disabled={disabled}
              min={min ? formatDateToInput(min) : undefined}
              max={max ? formatDateToInput(max) : undefined}
              key={`date-${fecha}`}
            />
            <DateButton 
              type="button" 
              disabled={disabled} 
              $hasValue={!!fecha && formatDateToDisplay(fecha) !== "Fecha"} 
              theme={theme}
            >
              <span>{formatDateToDisplay(fecha)}</span>
            </DateButton>
          </DateInputWrapper>
        </DateSection>
        
        <TimeSection>
          <TimeContainer theme={theme}>
            <TimeButton 
              type="button" 
              disabled={disabled} 
              $hasValue={!!hora && formatTimeToDisplay() !== "Hora"} 
              theme={theme}
            >
              <span>{formatTimeToDisplay()}</span>
            </TimeButton>
            <HiddenTimeInput
              type="time"
              value={formatTimeToInput()}
              onChange={handleTimeChange}
              disabled={disabled}
              min={
                min && formatDateToDisplay(fecha) === formatDateToDisplay(min) && minHora
                  ? horaTo24(minHora)
                  : undefined
              }
            />
          </TimeContainer>
        </TimeSection>
      </DateTimeRow>
    </DateTimeContainer>
  );
};
