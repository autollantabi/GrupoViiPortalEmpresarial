import styled from "styled-components";
import { useState } from "react";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";

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
    props.selected ? props.theme.colors.primary : props.theme.colors.backgroundLight};
  color: ${(props) => (props.selected ? props.theme.colors.white : props.theme.colors.text)};
  flex-direction: ${(props) => (props.selected ? "column" : "row")};
  height: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 5px;
  transition: all 0.3s ease;
`;
const TituloFiltro = styled.span`
  color: ${(props) => (props.selected ? props.theme.colors.white : props.theme.colors.text)};
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
  background-color: ${({ theme }) => theme.colors.selectMenuBackground || theme.colors.backgroundCard || "#ffffff"};
  min-width: 200px;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0px 8px 16px 0px rgba(0, 0, 0, 0.2)"};
  padding: 2px 2px;
  border-radius: 8px;
  z-index: 2;
  border: 1px solid ${({ theme }) => theme.colors.border};

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
  color: ${({ theme }) => theme.colors.text};
  &.select {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
  &.select:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.selectOptionHover || theme.colors.hover || "#e9e9e9"};
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
export const CampoFiltro = ({ options, onChange, nombreColumnaFiltro, nombre }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  // Convertir options al formato que SelectUI espera (value, label)
  const selectOptions = options.map((opt) => ({
    value: opt.value,
    label: opt.name,
  }));

  const handleChange = (selected) => {
    // selected puede ser null, un objeto o un array dependiendo de isMulti
    const selectedArray = selected ? (Array.isArray(selected) ? selected : [selected]) : [];
    setSelectedOptions(selectedArray);
    
    // Convertir a string con nombres separados por "; " para mantener compatibilidad con Anticipos
    const nombresString = selectedArray.map((opt) => opt.label).join("; ");
    onChange(nombreColumnaFiltro, nombresString);
  };

  return (
    <SelectUI
      options={selectOptions}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={nombre}
      isMulti={true}
      isSearchable={true}
      minWidth="150px"
      maxWidth="250px"
    />
  );
};

export const CampoFiltroporFecha = ({ numFiltro, onChange, nombre }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("es", { month: "short" }),
  }));
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
          <hr style={{ 
            width: "75%", 
            margin: "0",
            borderColor: theme.colors.border,
            borderStyle: "solid",
            borderWidth: "1px 0 0 0"
          }} />
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
