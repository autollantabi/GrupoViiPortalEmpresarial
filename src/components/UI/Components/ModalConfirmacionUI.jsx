import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { ButtonUI } from "./ButtonUI";
import IconUI from "./IconsUI";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.text || "#000", alpha: 0.5 })};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  background-color: ${({ theme }) => theme?.colors?.modalBackground || theme?.colors?.backgroundCard || "#ffffff"};
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 4px 20px
    ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.text || "#000", alpha: 0.2 })};
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid
    ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.1 })};
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.error || "#f44336", alpha: 0.1 })};
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.text || "#000"};
`;

const Message = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#666"};
  line-height: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

export const ModalConfirmacionUI = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message = "¿Está seguro de que desea eliminar este elemento?",
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  confirmColor,
  iconName = "FaTriangleExclamation",
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Overlay theme={theme} onClick={handleOverlayClick}>
      <ModalContainer theme={theme}>
        <ModalHeader theme={theme}>
          <IconContainer theme={theme}>
            <IconUI
              name={iconName}
              size={20}
              color={theme?.colors?.error || "#f44336"}
            />
          </IconContainer>
          <Title theme={theme}>{title}</Title>
        </ModalHeader>

        <Message theme={theme}>{message}</Message>

        <ButtonContainer>
          <ButtonUI
            text={cancelText}
            onClick={onClose}
            pcolor={theme?.colors?.textSecondary || "#666"}
            style={{ minWidth: "100px" }}
          />
          <ButtonUI
            text={confirmText}
            onClick={onConfirm}
            pcolor={confirmColor || theme?.colors?.error || "#f44336"}
            style={{ minWidth: "100px" }}
          />
        </ButtonContainer>
      </ModalContainer>
    </Overlay>
  );
};

