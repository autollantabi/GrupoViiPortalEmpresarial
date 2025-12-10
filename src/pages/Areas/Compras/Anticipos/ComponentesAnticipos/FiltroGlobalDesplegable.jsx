import React, { useState } from "react";
import styled from "styled-components";

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
  gap: 1px;
  background-color: #cfcfcf;
`;
const CampoBuscar = styled.input`
  border: none;
  border-radius: 5px 0 0 5px;
  padding: 0 5px 0 10px;
  height: 100%;
  outline: none;
`;

const DropdownContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const DropdownButton = styled.div`
  padding: 5px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 0 5px 5px 0;
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f0f0f0;
  min-width: 180px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  padding: 2px 2px;
  z-index: 2;
  border-radius: 5px;
  max-height: 350px;
  overflow-y: auto;

  ${DropdownContainer}:hover & {
    display: block;
  }
`;

const Option = styled.div`
  padding: 2px 15px;
  cursor: pointer;
  &:hover {
    background-color: #e9e9e9;
    border-radius: 3px;
  }
`;

const CustomSelect = ({ options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);

  const handleOptionClick = (value) => {
    setSelectedOption(value);
    onChange(value);
    setIsOpen(false);
  };

  return (
    <DropdownContainer
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <DropdownButton>{selectedOption.name}</DropdownButton>
      {isOpen && (
        <DropdownContent>
          {options.map((option, index) => (
            <Option key={index} onClick={() => handleOptionClick(option)}>
              {option.name}
            </Option>
          ))}
        </DropdownContent>
      )}
    </DropdownContainer>
  );
};

//Filtro globlal para la tabla de Bancos
export const FiltroGlobalDesplegable = ({ value, onChangeValue, onChangeCampo }) => {
  const options = [
    { value: null, name: "Todo" },
    { value: "SALDO", name: "SALDO" },
    { value: "VALOR", name: "VALOR" },
  ];

  const handleOptionChange = (selectedValue) => {
    onChangeCampo(selectedValue.value);
  };
  return (
    <ContenedorPrincipal>
      <ContenedorCampoBuscar>
        <CampoBuscar
          type="text"
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          placeholder="Buscar..."
          title="Ingrese la cadena a filtrar"
        />
        <div>
          <CustomSelect options={options} onChange={handleOptionChange} />
        </div>
      </ContenedorCampoBuscar>
    </ContenedorPrincipal>
  );
};
