import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { IconUI } from "./IconsUI";
import { ButtonUI } from "./ButtonUI";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.text || "#000", alpha: 0.5 })};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  background-color: ${({ theme }) =>
    theme.colors.modalBackground || theme.colors.backgroundCard || "#ffffff"};
  border-radius: 8px;
  padding: ${({ $noPadding }) => ($noPadding ? "0" : "24px")};
  max-width: ${({ $maxWidth }) => $maxWidth || "800px"};
  width: ${({ $width }) => $width || "90%"};
  max-height: ${({ $maxHeight }) => $maxHeight || "90vh"};
  overflow-y: auto;
  box-shadow: 0 4px 20px
    ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.text || "#000", alpha: 0.2 })};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ $noHeader }) => ($noHeader ? "0" : "20px")};
  padding-bottom: ${({ $noHeader }) => ($noHeader ? "0" : "16px")};
  border-bottom: ${({ $noHeader, theme }) =>
    $noHeader
      ? "none"
      : `2px solid ${theme.colors.border || theme.colors.divider || "#dee2e6"}`};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text || "#000"};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textSecondary || "#666"};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) =>
      hexToRGBA({
        hex: theme.colors.textSecondary || "#666",
        alpha: 0.1,
      })};
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  margin-top: 20px;
  border-top: ${({ $noFooter, theme }) =>
    $noFooter
      ? "none"
      : `1px solid ${theme.colors.border || theme.colors.divider || "#dee2e6"}`};
`;

export const ModalUI = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  maxWidth,
  width,
  maxHeight,
  noHeader = false,
  noFooter = false,
  noPadding = false,
  closeOnOverlayClick = true,
  // Botones por defecto
  showCancelButton = true,
  showSaveButton = true,
  onSave,
  cancelText = "Cancelar",
  saveText = "Guardar",
  saveButtonColor,
  cancelButtonColor,
  additionalButtons = [], // Array de objetos { text, onClick, pcolor, ...props }
  hideDefaultButtons = false, // Si true, oculta los botones por defecto
  isAsync = true,
}) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Renderizar footer
  const renderFooter = () => {
    // Si se pasa un footer personalizado, usar ese
    if (footer) {
      return <ModalFooter theme={theme} $noFooter={noFooter}>{footer}</ModalFooter>;
    }

    // Si noFooter es true, no mostrar footer
    if (noFooter) {
      return null;
    }

    // Si hideDefaultButtons es true, no mostrar botones por defecto
    if (hideDefaultButtons && additionalButtons.length === 0) {
      return null;
    }

    // Renderizar botones por defecto y adicionales
    return (
      <ModalFooter theme={theme} $noFooter={noFooter}>
        {!hideDefaultButtons && showCancelButton && (
          <ButtonUI
            text={cancelText}
            onClick={onClose}
            pcolor={cancelButtonColor || theme.colors.textSecondary || "#666"}
          />
        )}
        {additionalButtons.map((button, index) => (
          <ButtonUI
            key={index}
            text={button.text}
            onClick={button.onClick}
            pcolor={button.pcolor || theme.colors.primary}
            {...button.props}
          />
        ))}
        {!hideDefaultButtons && showSaveButton && onSave && (
          <ButtonUI
            text={saveText}
            onClick={onSave}
            pcolor={saveButtonColor || theme.colors.primary}
            isAsync={isAsync}
          />
        )}
      </ModalFooter>
    );
  };

  return (
    <ModalOverlay theme={theme} onClick={handleOverlayClick}>
      <ModalContainer
        theme={theme}
        $maxWidth={maxWidth}
        $width={width}
        $maxHeight={maxHeight}
        $noPadding={noPadding}
      >
        {!noHeader && (
          <ModalHeader theme={theme} $noHeader={noHeader}>
            {title && <ModalTitle theme={theme}>{title}</ModalTitle>}
            {showCloseButton && (
              <CloseButton theme={theme} onClick={onClose}>
                <IconUI
                  name="FaXmark"
                  size={20}
                  color={theme.colors.textSecondary || "#666"}
                />
              </CloseButton>
            )}
          </ModalHeader>
        )}

        <ModalBody>{children}</ModalBody>

        {renderFooter()}
      </ModalContainer>
    </ModalOverlay>
  );
};
