import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";

// Estilos para el componente de checkbox
const StyledCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? "0.6" : "1")};
`;

const StyledCheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

const StyledCheckmark = styled.span`
  position: relative;
  display: inline-block;
  width: 18px;
  height: 18px;
  background-color: ${({ checked, theme }) =>
    checked ? theme?.colors?.primary || "#3c3c3b" : theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#fafafa"};
  border: 1px solid
    ${({ checked, theme }) =>
      checked
        ? theme?.colors?.primary || "#3c3c3b"
        : theme?.colors?.inputBorder || theme?.colors?.border || "#dee2e6"};
  border-radius: 3px;
  transition: all 0.2s ease-in-out;

  &:after {
    content: "";
    position: absolute;
    display: ${({ checked }) => (checked ? "block" : "none")};
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid ${({ theme }) => theme?.colors?.white || "#ffffff"};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  &:hover {
    border-color: ${({ theme, disabled }) =>
      disabled
        ? theme?.colors?.inputBorder || theme?.colors?.border || "#dee2e6"
        : theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"};
    box-shadow: ${({ theme, disabled }) =>
      disabled
        ? "none"
        : `0 0 0 2px ${hexToRGBA({
            hex: theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b",
            alpha: 0.1,
          })}`};
  }
`;

const StyledCheckboxLabel = styled.label`
  margin-left: 8px;
  font-size: 14px;
  color: ${({ $color, theme }) => $color || theme?.colors?.text || "#212529"};
  user-select: none;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
`;

export const CheckboxUI = ({
  id,
  name,
  checked = false,
  onChange,
  label,
  labelColor,
  disabled = false,
  className,
  style,
  labelStyle,
  required = false,
}) => {
  const { theme } = useTheme();

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) onChange(e.target.name, e.target.checked);
  };

  return (
    <StyledCheckboxContainer
      className={className}
      style={style}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(name, !checked)}
      theme={theme}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <StyledCheckboxInput
          id={id}
          type="checkbox"
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          required={required}
        />
        <StyledCheckmark checked={checked} disabled={disabled} theme={theme} />
      </div>

      {label && (
        <StyledCheckboxLabel
          htmlFor={id}
          style={labelStyle}
          disabled={disabled}
          $color={labelColor}
          theme={theme}
        >
          {label}
          {required && (
            <span style={{ color: theme?.colors?.error || "#dc3545" }}> *</span>
          )}
        </StyledCheckboxLabel>
      )}
    </StyledCheckboxContainer>
  );
};

export default CheckboxUI;

