import React from "react";
import { Select } from "assets/styles/StyledComponents/Select";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";

export const SeleccionarAlgo = ({
  tituloSeleccionar,
  primeraOpcion,
  options,
  id,
  etiqueta,
  setValor,
  opcionSeleccionada,
}) => {
  return (
    <ContenedorPadre direccion="c" alineacion="start" style={{padding: "0 15px"}}>
      <span>{tituloSeleccionar}</span>
      <Select value={opcionSeleccionada} onChange={(e)=>setValor(e.target.value)}>
        <option value="">{primeraOpcion}</option>
        {options.map((item, index) => (
          <option key={index} value={item[id]}>
            {item[etiqueta]}
          </option>
        ))}
      </Select>
    </ContenedorPadre>
  );
};
