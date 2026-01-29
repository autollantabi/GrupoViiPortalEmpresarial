import { ButtonUI } from "components/UI/Components/ButtonUI";
import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import IconUI from "components/UI/Components/IconsUI";

const ContenedorBotones = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.backgroundLight || theme.colors.background};
  border-radius: 5px;
  width: 100%;
`;

const LabelContainer = styled.div`
  padding: 2px;
  display: flex;
  justify-content: end;
  text-align: right;
  width: 200px;
  color: ${({ theme }) => theme.colors.text};
`;

const FieldContainer = styled.div`
  padding: 2px;
  display: flex;
`;

const StyledList = styled.ul`
  color: ${({ theme }) => theme.colors.text};
  & > li {
    padding-top: 3px;
    width: fit-content;
  }
`;

const DialogOverlay = styled.div`
  width: 100%;
  background-color: ${({ theme }) => hexToRGBA({ hex: theme.colors.overlay || theme.colors.black, alpha: 0.5 })};
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-radius: 5px;
  z-index: 1000;
`;

const DialogContainer = styled.div`
  min-width: 45vw;
  height: auto;
  width: fit-content;
  display: flex;
  flex-direction: column;
  top: 20px;
  z-index: 110;
  background-color: ${({ theme }) => theme.colors.modalBackground || theme.colors.backgroundCard};
  padding: 35px;
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.text};
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 0 10px rgba(0, 0, 0, 0.3)"};
`;

const SuccessContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  padding: 20px;
`;

const IconContainer = styled.div`
  font-size: 3rem;
  margin: 20px 0;

  .correcta {
    color: ${({ theme }) => theme.colors.success || "green"};
  }

  .erronea {
    color: ${({ theme }) => theme.colors.danger || "red"};
  }
`;

const SuccessButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
`;

const AcceptButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    transform: scale(1.05);
  }
`;

const ConfirmationContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  h4 {
    margin-bottom: 20px;
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border || theme.colors.textSecondary};
    padding-bottom: 10px;
  }
`;

// Componente para filas de formulario
export const FormRow = ({ label, children }) => (
  <div className="fila">
    <LabelContainer>{label}</LabelContainer>
    <FieldContainer>{children}</FieldContainer>
  </div>
);

// Componente para listas
export const ItemList = ({ items, renderItem }) => (
  <StyledList>
    {items.map((item, index) => (
      <li key={`item-${index}`}>{renderItem(item, index)}</li>
    ))}
  </StyledList>
);

// Componente para diálogos de confirmación
export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  successState = 0, // 0: inicial, 1: éxito, 2: error
  onSuccess,
  successMessage = "Operación exitosa",
  errorMessage = "Ha ocurrido un error",
}) => {
  if (!isOpen) return null;
  const { theme } = useTheme();
  return (
    <DialogOverlay>
      <DialogContainer>
        {successState !== 0 ? (
          <SuccessContainer>
            <span>{successState === 1 ? successMessage : errorMessage}</span>
            <IconContainer>
              {successState === 1 ? (
                <IconUI name="FaCheck" size={14} color={theme.colors.text} />
              ) : (
                <IconUI name="FaCircleXmark" size={14} color={theme.colors.text} />
              )}
            </IconContainer>
            <SuccessButtonContainer>
              <AcceptButton onClick={onSuccess}>Aceptar</AcceptButton>
            </SuccessButtonContainer>
          </SuccessContainer>
        ) : (
          <ConfirmationContent>
            <h4>{title}</h4>
            {children}
            <ContenedorBotones>
              <ButtonUI text={"Cancelar"} onClick={onClose} />
              <ButtonUI
                text={"Aceptar"}
                pcolor={({ theme }) => theme.colors.secondary}
                onClick={onConfirm}
              />
            </ContenedorBotones>
          </ConfirmationContent>
        )}
      </DialogContainer>
    </DialogOverlay>
  );
};
