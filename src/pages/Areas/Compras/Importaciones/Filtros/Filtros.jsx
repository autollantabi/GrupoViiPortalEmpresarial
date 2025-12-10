import styled from "styled-components";
import { useState } from "react";

const ContainerP = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
`;
const DropdownContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const DropdownButton = styled.div`
  padding: ${(props) => (props.selected ? "5px 12px" : "5px 15px")};
  display: flex;
  justify-content: center;
  line-height: ${(props) => (props.selected ? "100%" : "none")};
  align-items: ${(props) => (props.selected ? "start" : "center")};
  gap: ${(props) => (props.selected ? "0px" : "5px")};
  background-color: ${(props) =>
    props.selected ? "var(--secondary)" : "#f0f0f0"};
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  flex-direction: ${(props) => (props.selected ? "column" : "row")};
  border: 1px solid #ddd;
  border-radius: 5px;
  transition: all 0.3s ease;
`;
const TituloFiltro = styled.span`
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  font-size: ${(props) => (props.selected ? "11px" : "14px")};
  font-weight: 500;
  &.fechas {
    font-size: ${(props) => (props.selected ? "14px" : "14px")};
  }
`;

const ContendorBotonesFiltro = styled.div`
  display: flex;
  justify-content: center;
  align-content: center;
  gap: 1px;
  background-color: #cfcfcf;
  border-bottom: solid 1px #cfcfcf;
  border-radius: 6px 6px 0 0;
  font-size: 13px;
`;
const BotonesFiltro = styled.button`
  border: none;
  padding: 3px 10px;
  width: 100%;
  &:nth-child(1) {
    border-radius: 6px 0 0 0;
    &:hover {
      background-color: var(--secondary);
      color: var(--color-perla);
    }
  }

  &:nth-child(2) {
    background-color: var(--color-error);
    color: var(--color-perla);
    border-radius: 0 6px 0 0;
  }
`;
const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 200px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  padding: 2px 2px;
  border-radius: 8px;
  z-index: 2;

  ${DropdownContainer}:hover & {
    display: block;
  }
`;
const DropdownContent1 = styled.div`
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 200px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  padding: 2px 2px;
  border-radius: 8px;
  z-index: 2;

  ${DropdownContainer}:hover & {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
`;

const Option = styled.div`
  padding: 3px 10px;
  border-radius: 6px;
  display: flex;
  font-size: 13px;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    background-color: #e9e9e9;
  }
`;
const Option1 = styled.div`
  padding: 3px 10px;
  border-radius: 6px;
  display: flex;
  font-size: 13px;
  flex-direction: row;
  justify-content: center;
  cursor: pointer;
  width: 100%;
  user-select: none;
  text-align: center;
  &.select {
    background-color: var(--secondary);
    color: white;
  }
  &.select:hover {
    background-color: var(--secondary);
  }
  &:hover {
    background-color: #e9e9e9;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: fit-content;
  gap: 10px;
  padding: 10px;
`;

const YearSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: fit-content;
  gap: 10px;
  padding: 10px;
  margin-top: 10px;
`;
export const CampoFiltro = ({ options, onChange, numFiltro, nombre }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleButtonClickTodos = () => {
    setSelectedOptions(options);
    onChange(numFiltro, options.map((opt) => opt.name).join("; "));
  };
  const handleButtonClickLimpiar = () => {
    setSelectedOptions([]);
    onChange(numFiltro, "");
  };

  const handleOptionClick = (option) => {
    const isAlreadySelected = selectedOptions.some(
      (selected) => selected.value === option.value
    );
    const newSelectedOptions = isAlreadySelected
      ? selectedOptions.filter((selected) => selected.value !== option.value)
      : [...selectedOptions, option];

    setSelectedOptions(newSelectedOptions);

    // Llama a onChange con todas las opciones seleccionadas, excluyendo "Todos" y "Limpiar"
    onChange(numFiltro, newSelectedOptions.map((opt) => opt.name).join("; "));
  };

  const isSelected = (option) =>
    selectedOptions.some((selected) => selected.value === option.value);

  return (
    <DropdownContainer
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <DropdownButton selected={selectedOptions.length > 0}>
        <TituloFiltro selected={selectedOptions.length > 0}>
          {nombre}
        </TituloFiltro>
        {selectedOptions.length > 0
          ? selectedOptions.map((opt) => opt.name).join("; ")
          : "⌵"}
      </DropdownButton>

      {isOpen && (
        <DropdownContent>
          <ContendorBotonesFiltro>
            <BotonesFiltro onClick={() => handleButtonClickTodos()}>
              Todos
            </BotonesFiltro>
            <BotonesFiltro onClick={() => handleButtonClickLimpiar()}>
              Limpiar
            </BotonesFiltro>
          </ContendorBotonesFiltro>
          {[...options].map((option, index) => (
            <Option key={index} onClick={() => handleOptionClick(option)}>
              <span>{option.name}</span>
              <span>{isSelected(option) ? " ✓" : ""}</span>
            </Option>
          ))}
        </DropdownContent>
      )}
    </DropdownContainer>
  );
};

export const CampoFiltroporFecha = ({ numFiltro, onChange, nombre }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("es", { month: "short" }),
  }));
  // console.log(months);
  
  const years = Array.from(
    { length: 4 },
    (_, i) => new Date().getFullYear() - i
  );
  const handleMonthClick = (month) => {
    const isSelected = selectedMonths.includes(month.name);
    const newSelectedMonths = isSelected
      ? selectedMonths.filter((m) => m !== month.name)
      : [...selectedMonths, month.name];
    setSelectedMonths(newSelectedMonths);
    // console.log(newSelectedMonths);
    
    onChange(numFiltro, { months: newSelectedMonths, year: selectedYear });
  };

  const handleYearClick = (year) => {
    const newYear = year === selectedYear ? null : year;
    setSelectedYear(newYear);
    onChange(numFiltro, { months: selectedMonths, year: newYear });
  };

  return (
    <DropdownContainer onMouseLeave={() => setIsOpen(false)}>
      <DropdownButton
        selected={selectedMonths.length > 0 || selectedYear !== null}
        onClick={() => setIsOpen(!isOpen)}
      >
        {(selectedMonths.length > 0 || selectedYear) && (
          <TituloFiltro
            selected={selectedMonths.length > 0 || selectedYear !== null}
          >
            {nombre}
          </TituloFiltro>
        )}
        <TituloFiltro
          className="fechas"
          selected={selectedMonths.length > 0 || selectedYear !== null}
        >
          {selectedMonths.length > 0 || selectedYear
            ? `Meses: ${
                selectedMonths.length > 0 ? selectedMonths.join(", ") : "-"
              } / Año: ${selectedYear === null ? "-" : selectedYear}`
            : nombre + " ⌵"}
        </TituloFiltro>
      </DropdownButton>
      {isOpen && (
        <DropdownContent1>
          <GridContainer>
            {months.map((month) => (
              <Option1
                className={`${
                  selectedMonths.includes(month.name) ? "select" : ""
                }`}
                key={month.value}
                onClick={() => handleMonthClick(month)}
              >
                {month.name}
              </Option1>
            ))}
          </GridContainer>
          <hr style={{ width: "75%", margin: "0" }} />
          <YearSelector>
            {years.map((year) => (
              <Option1
                className={`${year === selectedYear ? "select" : ""}`}
                key={year}
                onClick={() => handleYearClick(year)}
              >
                {year}
              </Option1>
            ))}
          </YearSelector>
        </DropdownContent1>
      )}
    </DropdownContainer>
  );
};
