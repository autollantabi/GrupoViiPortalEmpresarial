import styled from "styled-components";

export const ContenedorCampoArchivos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: ${({ $fullWidth }) => ($fullWidth ? '100%' : '280px')};
`;

export const UploadLabel = styled.label`
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.3s ease;
  color: ${({ theme }) => theme.colors.textPrimary};
  background-color: ${({ theme }) => theme.colors.background};
  font-weight: 500;
  font-size: 14px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.secondary};
    background-color: ${({ theme }) => theme.colors.secondary}10;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.secondary}20;
  }

  i {
    font-size: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

export const UploadText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

export const UploadSubtext = styled.small`
  font-size: 12px;
  opacity: 0.7;
  display: block;
`;

export const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
  margin-top: 5px;
`;

export const LoadingMessage = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
`;

export const NoFilesMessage = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  text-align: center;
  
  small {
    font-size: 12px;
    opacity: 0.8;
  }
`;

export const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.placeholder};
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 2px 8px ${({ theme }) => theme.colors.primary}20;
    transform: translateY(-1px);
    
    .buttons {
      opacity: 1;
      visibility: visible;
    }
  }
`;

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const FileIcon = styled.div`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

export const FileName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FileExtension = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
`;

export const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
`;

export const ActionButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 6px;
  padding: 6px;
  width: 32px;
  height: 32px;
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: scale(1.05);
  }

  &.download {
    background-color: ${({ theme }) => theme.colors.success};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.success}dd;
    }
  }

  &.close-icon {
    background-color: ${({ theme }) => theme.colors.warning};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.warning}dd;
    }
  }
`;

export const ConfirmContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ConfirmButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  border-radius: 6px;
  padding: 6px;
  width: 32px;
  height: 32px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &.elim {
    background-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.white};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.error}dd;
      transform: scale(1.05);
    }
  }
  
  &.cancelar {
    background-color: ${({ theme }) => theme.colors.placeholder};
    color: ${({ theme }) => theme.colors.textPrimary};
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.textSecondary};
      transform: scale(1.05);
    }
  }
`;

export const HiddenInput = styled.input`
  display: none;
`;

export const FilesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 60px;
`; 