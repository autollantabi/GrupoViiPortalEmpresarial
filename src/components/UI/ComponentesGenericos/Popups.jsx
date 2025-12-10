import React, { useState } from "react";
import styled from "styled-components";

import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";

// Estilos del popup con styled-components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PopupContent = styled.div`
  background: var(--primary);
  padding: 25px;
  border-radius: 8px;
  width: 600px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  color: white;
`;

const CloseButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
  margin-bottom: 10px;
`;

const SaveButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px;

  cursor: pointer;
  border-radius: 5px;
  margin-top: 10px;
`;

const InputWrapper = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  font-size: 14px;
  margin-bottom: 5px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
`;

export const CustomPopupInputs = ({
  isOpen,
  onClose,
  onSave,
  inputs,
  customContent,
}) => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      //   onClose(); // Cerrar el popup después de guardar
    } catch (error) {
      console.error("Error al guardar:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <PopupContent>
        {/* <CloseButton onClick={onClose}>Cerrar</CloseButton> */}
        <form>
          {customContent && <div>{customContent}</div>}
          {inputs.map((input) => (
            <InputWrapper key={input.name}>
              {/* <Label>{input.label}</Label> */}
              <Input
                type={input.type || "text"}
                name={input.name}
                value={formData[input.name] || ""}
                onChange={handleChange}
                placeholder={input.placeholder || ""}
              />
            </InputWrapper>
          ))}
        </form>
        <ContenedorFlex style={{ justifyContent: "flex-end" }}>
          <SaveButton onClick={() => handleSave()}>Guardar</SaveButton>
        </ContenedorFlex>
      </PopupContent>
    </Overlay>
  );
};
