import { useEffect, useState } from "react";
import styled from "styled-components";

const DropdownContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const DropdownButton = styled.div`
  width: fit-content;
  min-width: 150px;
  user-select: none;

  padding: ${(props) => (props.selected ? "5px 12px" : "5px 15px")};
  display: flex;
  justify-content: space-between;
  line-height: ${(props) => (props.selected ? "100%" : "none")};
  /* line-height: none; */
  align-items: ${(props) => (props.selected ? "start" : "center")};
  gap: ${(props) => (props.selected ? "0px" : "5px")};
  background-color: ${(props) =>
    props.selected ? "var(--secondary)" : "#f0f0f0"};
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  flex-direction: ${(props) => (props.selected ? "column" : "row")};
  /* flex-direction: column; */
  /* border: 1px solid #ddd; */
  border-radius: 5px;
  transition: all 0.3s ease;
`;
// const DropdownButtonBasico = styled.div`
//   width: fit-content;
//   padding: ${(props) => (props.selected ? "5px 12px" : "2px 15px")};
//   display: flex;
//   justify-content: center;
//   line-height: ${(props) => (props.selected ? "100%" : "none")};
//   /* line-height: none; */
//   align-items: ${(props) => (props.selected ? "start" : "center")};
//   gap: ${(props) => (props.selected ? "0px" : "5px")};
//   background-color: ${(props) =>
//     props.selected ? "var(--secondary)" : "#f0f0f0"};
//   color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
//   flex-direction: ${(props) => (props.selected ? "column" : "row")};
//   /* flex-direction: column; */
//   /* border: 1px solid #ddd; */
//   border-radius: 5px;
//   transition: all 0.3s ease;

//   & > input {
//     border: none;
//     background-color: ${(props) =>
//       props.selected ? "var(--color-perla)" : "var(--color-contraste-1)"};
//     border-radius: 3px;
//     padding: 0 10px;
//     outline: none;
//     height: 22px;
//     margin-bottom: ${(props) => (props.selected ? "5px" : "0")};
//     color: black;
//   }
// `;
const TituloSelect = styled.span`
  color: ${(props) => (props.selected ? "var(--color-perla)" : "#000")};
  font-size: ${(props) => (props.selected ? "11px" : "14px")};
  font-weight: 500;
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  width: 100%;
  /* min-width: 100%; */
  min-width: 120px;
  max-height: 400px;
  height: fit-content;
  overflow-y: auto;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  padding: 2px 2px;
  border-radius: 8px;
  z-index: 15;
  color: black;
  user-select: none;

  &.seleccionFechas {
    max-height: 600px;
    padding-bottom: 30px;
  }

  ${DropdownContainer}:hover & {
    display: block;
  }
`;
const Option = styled.div`
  padding: 3px 10px;
  border-radius: 6px;
  gap: 30px;
  display: flex;
  font-size: 14px;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  cursor: pointer;
  &.wb {
    word-break: break-all;
  }

  &:hover {
    background-color: #e9e9e9;
  }
`;

export const SelectsMRP = ({
  options,
  onChange,
  nombreCampo,
  nombre,
  addWordBreak,
  readOnly,
  seleccionID,
  limpiarDS,
  seleccionNM,
}) => {
  const [isOpen, setIsOpen] = useState(false);
//   console.log("----", nombreCampo); 
  const handleOptionClick = (event, option) => {
    event.stopPropagation();
    if (!readOnly) {
      const selectedItem = options.find(
        (item) => item.value.toString() === option.value.toString()
      );
      if (selectedItem) {
        onChange(nombreCampo, selectedItem.value, selectedItem.name);
      } else {
        onChange(nombreCampo, "", "");
      }
    }
  };

  // Efecto para limpiar MARCA cuando EMPRESA cambia
  useEffect(() => {
    if (nombreCampo === "EMPRESA" && seleccionNM["EMPRESA"] !== seleccionID["EMPRESA"]) {
      onChange("MARCA", "", "");
      limpiarDS();
    }
  }, [seleccionNM["EMPRESA"]]); // Dependencia del efecto

  return (
    <div
      style={{ display: "flex", alignItems: "center", flexDirection: "row" }}
    >
      {readOnly && <i className="bi bi-lock-fill"></i>}
      <DropdownContainer
        onClick={() => !readOnly && setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <DropdownButton selected={seleccionNM[nombreCampo]?.length > 0}>
          <TituloSelect selected={seleccionNM[nombreCampo]?.length > 0}>
            {nombre}
          </TituloSelect>
          {seleccionNM[nombreCampo]?.length > 0 ? seleccionNM[nombreCampo] : "⌵"}
        </DropdownButton>

        {isOpen && !readOnly && (
          <DropdownContent>
            {options.map((option, index) => (
              <Option
                className={`${addWordBreak && "wb"}`}
                key={index}
                onClick={(e) => handleOptionClick(e, option)}
              >
                <span>{option.name}</span>
                {/* <span>{isSelected(option) ? " ✓" : ""}</span> */}
              </Option>
            ))}
          </DropdownContent>
        )}
      </DropdownContainer>
    </div>
  );
};
