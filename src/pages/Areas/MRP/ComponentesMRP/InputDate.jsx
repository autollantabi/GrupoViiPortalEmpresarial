import React from "react";
import styled from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";

// Styled component para el input date
const StyledInputDate = styled.input`
  padding: 0.2rem 0.5rem; 
  font-size: 14px;
  border: none;
`;

// Componente principal que renderiza el input date con el formato deseado
export const DateInput = ({ value, onChange, etiqueta, minDate,disabled }) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <ContenedorPadre direccion="c" alineacion="flex-start">
      <span>{etiqueta}</span>
      <StyledInputDate disabled={disabled} type="date" value={value} onChange={(e)=>handleChange(e)} min={minDate} />
    </ContenedorPadre>
  );
};
