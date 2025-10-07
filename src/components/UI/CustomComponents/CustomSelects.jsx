import Select from "react-select";
import Creatable from "react-select/creatable";
import styled from "styled-components";
import { useTheme } from "styled-components";

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
`;

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  onInputChange,
  placeholder = "Selecciona...",
  isSearchable = true,
  isCreatable = false,
  menuPlacement = "auto",
  isDisabled = false,
  minWidth = "150px",
  maxWidth = "250px",
  isMulti = false,
  label = "",
  menuWidth = "max-content",
  menuMaxWidth = "200px",
  menuMaxHeight = "300px",
}) => {
  const theme = useTheme();
  // Verifica si las opciones están vacías
  const isEmptyOptions =
    !options || Object.keys(options).length === 0 || options.length === 0;

  // Verifica si `value` es inválido
  const isEmptyValue =
    !value ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    Object.keys(value).length === 0;

  const customStylesSelect = {
    option: (provided) => ({
      ...provided,
      padding: "3px 10px",
      whiteSpace: "wrap",
      fontSize: "14px",
    }),
    control: (provided) => ({
      ...provided,
      width: "100%",
      minWidth: minWidth,
      maxWidth: maxWidth,
      fontSize: "14px",
      borderRadius: "5px",
      borderColor: theme.colors.placeholder,
      boxShadow: "none",
      "&:hover": {
        borderColor: theme.colors.primary,
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 10,
      width: menuWidth,
      maxWidth: menuMaxWidth,
      maxHeight: menuMaxHeight,
      fontSize: "14px",
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: menuMaxHeight,
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: "wrap",
      wordBreak: "break-word",
      fontSize: "14px",
    }),
  };

  const SelectComponent = isCreatable ? Creatable : Select;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {label && <Label>{label}</Label>}

      <SelectComponent
        options={isEmptyOptions ? [] : options}
        value={isEmptyValue ? null : value}
        onChange={onChange}
        onInputChange={onInputChange}
        styles={customStylesSelect}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        placeholder={placeholder}
        menuPlacement={menuPlacement}
        isMulti={isMulti}
        filterOption={null}
      />
    </div>
  );
};
