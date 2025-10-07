import React from "react";
import styled from "styled-components";

const DateContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
`;

const Label = styled.span`
  font-size: 13px;
  color: #333;
  font-weight: 500;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  display: inline-block;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: ${(props) => (props.disabled ? "#f5f5f5" : "#fff")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 13px;
  min-width: 150px;
  width: 100%;
  text-align: left;
  color: ${(props) => (props.$hasValue ? "#333" : "#999")};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  pointer-events: none;
  z-index: 1;

  &:hover {
    ${(props) =>
      !props.disabled &&
      `
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
    `}
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }
`;

export const CustomDateSelector = ({
  fecha = null,
  onChange,
  label = "",
  disabled = false,
  min = null,
  max = null,
}) => {
  // Convertir Date a formato YYYY-MM-DD para input type="date"
  const formatDateToInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Convertir Date a formato DD/MM/YYYY para mostrar
  const formatDateToDisplay = (date) => {
    if (!date) return "Seleccionar fecha";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Seleccionar fecha";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convertir string YYYY-MM-DD a Date
  const parseInputToDate = (inputValue) => {
    if (!inputValue) return null;
    return new Date(inputValue + "T00:00:00");
  };

  const handleChange = (e) => {
    const date = parseInputToDate(e.target.value);
    onChange?.(date);
  };

  return (
    <DateContainer>
      {label && <Label>{label}:</Label>}
      <InputWrapper>
        <HiddenDateInput
          type="date"
          value={formatDateToInput(fecha)}
          onChange={handleChange}
          disabled={disabled}
          min={min ? formatDateToInput(min) : undefined}
          max={max ? formatDateToInput(max) : undefined}
        />
        <DateButton type="button" disabled={disabled} $hasValue={!!fecha}>
          <span>{formatDateToDisplay(fecha)}</span>
        </DateButton>
      </InputWrapper>
    </DateContainer>
  );
};
