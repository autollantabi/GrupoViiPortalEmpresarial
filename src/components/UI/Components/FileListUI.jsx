import React, { useEffect, useState } from "react";
import { IconUI } from "./IconsUI";
import { ButtonUI } from "./ButtonUI";
import { useTheme } from "context/ThemeContext";
import styled from "styled-components";

const ContenedorCampoArchivos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "280px")};
`;

const UploadLabel = styled.label`
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
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
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

const UploadContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const UploadText = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const UploadSubtext = styled.small`
  font-size: 12px;
  opacity: 0.7;
  display: block;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 14px;
  margin-top: 5px;
`;

const LoadingMessage = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
`;

const NoFilesMessage = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  text-align: center;

  small {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
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

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

const FileIcon = styled.div`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const FileName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileExtension = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
`;

const ButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
`;

const ConfirmContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FilesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 60px;
`;

// Función para obtener el nombre del ícono según la extensión del archivo
const getIconNameForExtension = (filename) => {
  const extension = filename.split(".").pop();
  switch (extension) {
    case "pdf":
      return "FaFilePdf";
    case "doc":
      return "FaFileWord";
    case "docx":
      return "FaFileWord";
    case "xls":
      return "FaFileExcel";
    case "xlsx":
      return "FaFileExcel";
    case "csv":
      return "FaFileCsv";
    case "png":
      return "FaFileImage";
    case "zip":
      return "FaFileZipper";
    case "rar":
      return "FaFileZipper";
    case "7z":
      return "FaFileZipper";
    case "txt":
      return "FaFileLines";
    default:
      return "FaFile";
  }
};

export const FileListUI = ({
  setArchivo,
  aceptados,
  nombreCampo,
  archivos,
  impFinalizado,
  id,
  limite,
  conObtencionDeArchivos = false,
  fullWidth = false,
}) => {
  const { theme } = useTheme();
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");
  const [confirmaciones, setConfirmaciones] = useState({});

  useEffect(() => {
    // Si conObtencionDeArchivos es true, siempre inicializar con array vacío
    if (conObtencionDeArchivos) {
      setFiles([]);
      setConfirmaciones({});
    } else {
      setFiles(Array.isArray(archivos) ? archivos : []);

      // Inicializa el estado de confirmación para cada archivo
      const inicialConfirmaciones = (archivos || []).reduce((acc, archivo) => {
        acc[archivo.idDocumento] = false;
        return acc;
      }, {});
      setConfirmaciones(inicialConfirmaciones);
    }
  }, [archivos, conObtencionDeArchivos]);

  const handleToggleConfirmation = (fileId) => {
    setConfirmaciones((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newFiles = Array.isArray(files) ? [...files] : [];
    let duplicateFound = false;

    selectedFiles.forEach((file) => {
      if (newFiles.length >= limite) {
        setError(`Limite de archivos. Si desea subir uno, elimine alguno.`);
        return;
      }

      // Verificar si ya existe un archivo con el mismo nombre y tamaño
      const isDuplicate = newFiles.some(
        (f) =>
          (f.doc?.name === file.name && f.doc?.size === file.size) ||
          f.nombreArchivo === file.name
      );

      if (!isDuplicate) {
        let newIdDocumento;
        do {
          newIdDocumento = Math.floor(Math.random() * 10000);
        } while (newFiles.some((f) => f.idDocumento === newIdDocumento));

        const nombreArchivoSeparado = file.name.split(".");
        const nombreArchivo = nombreArchivoSeparado[0];
        const extensionArchivo = nombreArchivoSeparado[1];

        newFiles.push({
          doc: file,
          nombreArchivo: nombreArchivo,
          extensionArchivo: extensionArchivo,
          idDocumento: newIdDocumento,
        });
      } else {
        duplicateFound = true;
      }
    });

    if (duplicateFound) {
      setError("No se puede subir el mismo archivo más de una vez.");
      // Limpiar el input para permitir intentar con otro archivo
      event.target.value = "";
    } else {
      setError("");
    }

    setFiles(newFiles);
    setArchivo(nombreCampo, newFiles);
  };

  const handleRemoveFile = async (fileToRemove) => {
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    setFiles(updatedFiles);
    setArchivo(nombreCampo, updatedFiles);
    setError("");
    handleToggleConfirmation(fileToRemove.idDocumento);

    // Limpiar el input file para permitir subir el mismo archivo nuevamente
    const fileInput = document.getElementById(`fileInputMB-${id}`);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDownloadFile = async ({
    file,
    nombreArchivo,
    extensionArchivo,
  }) => {
    if (file) {
      const urlArchivo = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = urlArchivo;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <ContenedorCampoArchivos $fullWidth={fullWidth}>
      <HiddenInput
        type="file"
        multiple
        onChange={handleFileChange}
        accept={aceptados}
        id={"fileInputMB-" + id}
      />

      {!impFinalizado && (
        <UploadLabel htmlFor={"fileInputMB-" + id}>
          <IconUI name="FaUpload" size={16} />
          <UploadContent>
            <UploadText>Subir archivos ({aceptados})</UploadText>
            <UploadSubtext>
              Máximo {limite} archivo{limite !== 1 ? "s" : ""}
            </UploadSubtext>
          </UploadContent>
        </UploadLabel>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <FilesContainer>
        {files === null ? (
          <LoadingMessage>Cargando...</LoadingMessage>
        ) : !files || files.length === 0 ? (
          <NoFilesMessage>
            {conObtencionDeArchivos ? (
              <>
                No existen archivos <br />
                <small>(El archivo se cargará en breve si existe)</small>
              </>
            ) : (
              "No existen archivos"
            )}
          </NoFilesMessage>
        ) : (
          files.map((file, index) => (
            <FileItem key={index}>
              <FileInfo>
                <FileIcon>
                  <IconUI
                    name={getIconNameForExtension(
                      file.nombreArchivo + "." + file.extensionArchivo
                    )}
                    size={20}
                  />
                </FileIcon>
                <FileDetails>
                  <FileName>{file.nombreArchivo}</FileName>
                  <FileExtension>{file.extensionArchivo}</FileExtension>
                </FileDetails>
              </FileInfo>

              <ButtonsContainer className="buttons">
                {conObtencionDeArchivos && (
                  <ButtonUI
                    iconLeft="FaDownload"
                    onClick={() =>
                      handleDownloadFile({
                        file: file.doc,
                        nombreArchivo: file.nombreArchivo,
                        extensionArchivo: file.extensionArchivo,
                      })
                    }
                    pcolor={theme?.colors?.success || "#28a745"}
                    iconSize={16}
                    width="32px"
                    height="32px"
                    style={{
                      padding: "0",
                      minWidth: "32px",
                      minHeight: "32px",
                    }}
                    title="Descargar archivo"
                  />
                )}

                {!impFinalizado &&
                  (!confirmaciones[file.idDocumento] ? (
                    <ButtonUI
                      iconLeft="FaXmark"
                      onClick={() => handleToggleConfirmation(file.idDocumento)}
                      pcolor={theme?.colors?.warning || "#ffc107"}
                      iconSize={16}
                      width="32px"
                      height="32px"
                      style={{
                        padding: "0",
                        minWidth: "32px",
                        minHeight: "32px",
                      }}
                      title="Eliminar archivo"
                    />
                  ) : (
                    <ConfirmContainer className="confirmar">
                      <ButtonUI
                        iconLeft="FaTrash"
                        onClick={() => handleRemoveFile(file)}
                        pcolor={theme?.colors?.error || "#dc3545"}
                        iconSize={16}
                        width="32px"
                        height="32px"
                        style={{
                          padding: "0",
                          minWidth: "32px",
                          minHeight: "32px",
                        }}
                        title="Confirmar eliminación"
                      />
                      <ButtonUI
                        iconLeft="FaXmark"
                        onClick={() =>
                          handleToggleConfirmation(file.idDocumento)
                        }
                        pcolor={theme?.colors?.border || "#dee2e6"}
                        pcolortext={theme?.colors?.text || "#212529"}
                        iconSize={16}
                        width="32px"
                        height="32px"
                        style={{
                          padding: "0",
                          minWidth: "32px",
                          minHeight: "32px",
                        }}
                        title="Cancelar"
                      />
                    </ConfirmContainer>
                  ))}
              </ButtonsContainer>
            </FileItem>
          ))
        )}
      </FilesContainer>
    </ContenedorCampoArchivos>
  );
};
