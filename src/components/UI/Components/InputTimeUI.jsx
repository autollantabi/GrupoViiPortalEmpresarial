import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FaClock } from "react-icons/fa";

const InputTimeUIContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: auto;
`;

const StyledInputTimeUI = styled.input`
  width: auto;
  min-width: 150px;
  padding: 5px 12px;
  border: 1px solid
    ${({ theme, $error }) =>
      $error ? (theme.colors?.error || "#dc3545") : (theme.colors?.border || "#dee2e6")};
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background-color: ${({ readOnly, theme }) =>
    readOnly 
      ? (theme.colors?.backgroundDark || "#e9ecef")
      : (theme.colors?.inputBackground || theme.colors?.backgroundCard || "#fafafa")};
  color: ${({ readOnly, theme }) =>
    readOnly
      ? (theme.colors?.textDisabled || "#ced4da")
      : (theme.colors?.text || "#212529")};

  &:focus {
    border-color: ${({ theme, $error }) =>
      $error 
        ? (theme.colors?.error || "#dc3545")
        : (theme.colors?.inputFocus || theme.colors?.primary || "#3c3c3b")};
    box-shadow: 0 0 0 2px
      ${({ theme, $error }) =>
        $error
          ? `${theme.colors?.error || "#dc3545"}20`
          : `${theme.colors?.inputFocus || theme.colors?.primary || "#3c3c3b"}20`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors?.placeholder || "#6c757d"};
  }
`;

const TimeIcon = styled(FaClock)`
  position: absolute;
  right: 10px;
  color: ${({ theme }) => theme.colors?.placeholder || "#6c757d"};
  pointer-events: none;
`;

const TimeSelector = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors?.selectMenuBackground || theme.colors?.backgroundCard || "#fafafa"};
  border: 1px solid ${({ theme }) => theme.colors?.border || "#dee2e6"};
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: ${({ $visible }) => ($visible ? "block" : "none")};
`;

const TimeOption = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: ${({ theme }) => theme.colors?.text || "#212529"};

  &:hover {
    background-color: ${({ theme }) =>
      theme.colors?.selectOptionHover || theme.colors?.hover || "#f0f0f0"};
  }

  &.selected {
    background-color: ${({ theme }) =>
      `${theme.colors?.primary || "#3c3c3b"}20`};
    font-weight: 500;
  }
`;

// Generar opciones de tiempo en intervalos de 1 minuto
const generateTimeOptions = () => {
  const options = [];
  const ampm = ["AM", "PM"];

  for (let hour = 0; hour < 24; hour++) {
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const period = ampm[Math.floor(hour / 12)];

    for (let minute = 0; minute < 60; minute++) {
      // Formato de minutos con cero a la izquierda cuando es necesario
      const displayMinute = minute < 10 ? `0${minute}` : minute;
      options.push(`${displayHour}:${displayMinute} ${period}`);
    }
  }

  return options;
};

export const InputTimeUI = ({
  valor,
  nombreCampo,
  onChange,
  readOnly = false,
  placeholder = "Hora",
  error = false,
  errorMessage = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeOptions] = useState(generateTimeOptions());
  const [inputValue, setInputValue] = useState(valor || "");
  const containerRef = useRef(null);

  // Actualizar el valor del input cuando cambia la prop valor
  useEffect(() => {
    setInputValue(valor || "");
  }, [valor]);

  // Manejar clics fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputClick = () => {
    if (!readOnly) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (time) => {
    setInputValue(time);
    onChange(nombreCampo, time);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(nombreCampo, value);
  };

  // Filtrar opciones basadas en el texto de entrada para facilitar la búsqueda
  const filteredOptions = timeOptions.filter((option) =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <InputTimeUIContainer ref={containerRef}>
      <StyledInputTimeUI
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onClick={handleInputClick}
        placeholder={placeholder}
        readOnly={readOnly}
        $error={error}
        {...props}
      />
      <TimeIcon />

      <TimeSelector $visible={isOpen}>
        {isOpen &&
          (filteredOptions.length > 0 ? (
            filteredOptions.slice(0, 60).map((time, index) => (
              <TimeOption
                key={index}
                className={inputValue === time ? "selected" : ""}
                onClick={() => handleOptionClick(time)}
              >
                {time}
              </TimeOption>
            ))
          ) : (
            <TimeOption>No hay coincidencias</TimeOption>
          ))}
      </TimeSelector>
    </InputTimeUIContainer>
  );
};

export default InputTimeUI;
