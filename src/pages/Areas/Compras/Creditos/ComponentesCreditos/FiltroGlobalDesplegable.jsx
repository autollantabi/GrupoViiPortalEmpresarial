import React, { useState } from "react";
import styled from "styled-components";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";

const ContenedorPrincipal = styled.div`
  display: flex;
  align-content: center;
  justify-content: center;
  gap: 2px;
  font-size: 14px;
`;

const ContenedorCampoBuscar = styled.div`
  border: none;
  display: flex;
  gap: 2px;
  align-items: center;
`;

//Filtro globlal para la tabla de Bancos
export const FiltroGlobalDesplegable = ({ value, onChangeValue, onChangeCampo }) => {
  const options = [
    { value: null, label: "Todo" },
    { value: "CREDITO", label: "CRÉDITO" },
    { value: "USO_DOLARES", label: "USO $" },
    { value: "USO_PORCENTAJE", label: "USO %" },
    { value: "SALDO", label: "SALDO" },
  ];

  const [selectedOption, setSelectedOption] = useState(options[0]);

  const handleOptionChange = (selected) => {
    // selected puede ser null o un objeto { value, label }
    const selectedValue = selected ? selected.value : null;
    setSelectedOption(selected || options[0]);
    if (onChangeCampo) {
      onChangeCampo(selectedValue);
    }
  };

  return (
    <ContenedorPrincipal>
      <ContenedorCampoBuscar>
        <InputUI
          type="text"
          value={value || ""}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Buscar..."
          style={{ flex: 1, minWidth: "200px" }}
        />
        <SelectUI
          options={options}
          value={selectedOption}
          onChange={handleOptionChange}
          placeholder="Campo"
          isSearchable={false}
          minWidth="120px"
          maxWidth="150px"
        />
      </ContenedorCampoBuscar>
    </ContenedorPrincipal>
  );
};
