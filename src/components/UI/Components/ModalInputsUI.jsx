import React, { useState } from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";

// Overlay con backdrop blur para mejor efecto visual
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.overlay || "#000000", alpha: 0.6 })};
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Contenedor principal del modal con mejor diseño
const ModalContainer = styled.div`
  background: ${({ theme }) => theme?.colors?.modalBackground || theme?.colors?.backgroundCard || "#fafafa"};
  padding: 28px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px ${({ theme }) => hexToRGBA({ hex: theme?.colors?.boxShadow || "#000000", alpha: 0.3 })};
  color: ${({ theme }) => theme?.colors?.text || "#212529"};
  border: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#dee2e6", alpha: 0.2 })};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

// Header del modal
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#dee2e6", alpha: 0.3 })};
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.text || "#212529"};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 20px;
  width: 32px;
  height: 32px;
  
  &:hover {
    background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.error || "#dc3545", alpha: 0.1 })};
    color: ${({ theme }) => theme?.colors?.error || "#dc3545"};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Contenedor del formulario
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme?.colors?.inputBorder || theme?.colors?.border || "#dee2e6"};
  border-radius: 6px;
  font-size: 14px;
  background-color: ${({ theme }) => theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#fafafa"};
  color: ${({ theme }) => theme?.colors?.text || "#212529"};
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b"};
    box-shadow: 0 0 0 3px ${({ theme }) => hexToRGBA({ hex: theme?.colors?.inputFocus || theme?.colors?.primary || "#3c3c3b", alpha: 0.1 })};
    background-color: ${({ theme }) => theme?.colors?.backgroundCard || theme?.colors?.white || "#ffffff"};
  }
  
  &:hover:not(:focus) {
    border-color: ${({ theme }) => theme?.colors?.borderDark || "#ced4da"};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme?.colors?.placeholder || "#6c757d"};
    opacity: 0.7;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme?.colors?.backgroundDark || "#e9ecef"};
    color: ${({ theme }) => theme?.colors?.textDisabled || "#ced4da"};
    cursor: not-allowed;
  }
`;

// Footer del modal con botones
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#dee2e6", alpha: 0.3 })};
`;

const SaveButton = styled.button`
  background: ${({ theme }) => theme?.colors?.success || "#28a745"};
  color: ${({ theme }) => theme?.colors?.white || "#ffffff"};
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme?.colors?.successDark || "#1e7e34"};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => hexToRGBA({ hex: theme?.colors?.success || "#28a745", alpha: 0.3 })};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: ${({ theme }) => theme?.colors?.grayMedium || "#adb5bd"};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const CancelButton = styled.button`
  background: transparent;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#6c757d"};
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme?.colors?.backgroundDark || "#e9ecef"};
    border-color: ${({ theme }) => theme?.colors?.borderDark || "#ced4da"};
    color: ${({ theme }) => theme?.colors?.text || "#212529"};
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

export const ModalInputsUI = ({
  isOpen,
  onClose,
  onSave,
  inputs = [],
  customContent,
  title = "Formulario",
  saveText = "Guardar",
  cancelText = "Cancelar",
  showCancel = true,
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const { theme } = useTheme();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      // Opcional: limpiar el formulario después de guardar
      // setFormData({});
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  const handleCancel = () => {
    setFormData({});
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay theme={theme} onClick={handleCancel}>
      <ModalContainer theme={theme} onClick={(e) => e.stopPropagation()}>
        <ModalHeader theme={theme}>
          <ModalTitle theme={theme}>{title}</ModalTitle>
          {onClose && (
            <CloseButton onClick={handleCancel} theme={theme} title="Cerrar">
              ×
            </CloseButton>
          )}
        </ModalHeader>

        <FormContainer>
          {customContent && <div>{customContent}</div>}
          {inputs.map((input) => (
            <InputWrapper key={input.name}>
              {input.label && (
                <Label theme={theme} htmlFor={input.name}>
                  {input.label}
                </Label>
              )}
              <Input
                id={input.name}
                type={input.type || "text"}
                name={input.name}
                value={formData[input.name] || ""}
                onChange={handleChange}
                placeholder={input.placeholder || ""}
                disabled={input.disabled || loading}
                required={input.required}
                theme={theme}
              />
            </InputWrapper>
          ))}
        </FormContainer>

        <ModalFooter theme={theme}>
          {showCancel && (
            <CancelButton onClick={handleCancel} theme={theme}>
              {cancelText}
            </CancelButton>
          )}
          <SaveButton onClick={handleSave} disabled={loading} theme={theme}>
            {loading ? "Guardando..." : saveText}
          </SaveButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  );
};

export default ModalInputsUI;

