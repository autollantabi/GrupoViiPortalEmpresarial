import React, { useEffect, useState } from "react";
import {
  ContenedorCampoArchivos,
  UploadLabel,
  UploadContent,
  UploadText,
  UploadSubtext,
  ErrorMessage,
  LoadingMessage,
  NoFilesMessage,
  FileItem,
  FileInfo,
  FileIcon,
  FileDetails,
  FileName,
  FileExtension,
  ButtonsContainer,
  ActionButton,
  ConfirmContainer,
  ConfirmButton,
  HiddenInput,
  FilesContainer,
} from "./CampoListaArchivosStyled";
import { CustomIcon } from "./CustomIcons";

// Función para obtener el nombre del ícono según la extensión del archivo
const getIconNameForExtension = (filename) => {
  const extension = filename.split(".").pop();
  switch (extension) {
    case "pdf":
      return "BsFiletypePdf";
    case "doc":
      return "BsFiletypeDoc";
    case "docx":
      return "BsFiletypeDocx";
    case "xls":
      return "BsFiletypeXls";
    case "xlsx":
      return "BiFiletypeXls";
    case "csv":
      return "BsFiletypeCsv";
    case "png":
      return "BsFiletypePng";
    case "zip":
      return "GoFileZip";
    case "rar":
      return "GoFileZip";
    case "7z":
      return "GoFileZip";
    case "txt":
      return "BsFiletypeTxt";
    default:
      return "BsFileEarmark";
  }
};

export const CampoListaArchivosMejorado = ({
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
          <CustomIcon name="BiUpload" size={16} />
          <UploadContent>
            <UploadText>
              Subir archivos ({aceptados})
            </UploadText>
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
                  <CustomIcon
                    name={getIconNameForExtension(
                      file.nombreArchivo + "." + file.extensionArchivo
                    )}
                    size={20}
                  />
                </FileIcon>
                <FileDetails>
                  <FileName>{file.nombreArchivo}</FileName>
                  <FileExtension>
                    {file.extensionArchivo}
                  </FileExtension>
                </FileDetails>
              </FileInfo>

              <ButtonsContainer className="buttons">
                {conObtencionDeArchivos && (
                  <ActionButton
                    className="download"
                    onClick={() =>
                      handleDownloadFile({
                        file: file.doc,
                        nombreArchivo: file.nombreArchivo,
                        extensionArchivo: file.extensionArchivo,
                      })
                    }
                    title="Descargar archivo"
                  >
                    <CustomIcon name="BiDownload" size={16} />
                  </ActionButton>
                )}

                {!impFinalizado &&
                  (!confirmaciones[file.idDocumento] ? (
                    <ActionButton
                      className="close-icon"
                      onClick={() => handleToggleConfirmation(file.idDocumento)}
                      title="Eliminar archivo"
                    >
                      <CustomIcon name="BiX" size={16} />
                    </ActionButton>
                  ) : (
                    <ConfirmContainer className="confirmar">
                      <ConfirmButton
                        className="elim"
                        onClick={() => handleRemoveFile(file)}
                        title="Confirmar eliminación"
                      >
                        <CustomIcon name="BiTrash" size={16} />
                      </ConfirmButton>
                      <ConfirmButton
                        className="cancelar"
                        onClick={() =>
                          handleToggleConfirmation(file.idDocumento)
                        }
                        title="Cancelar"
                      >
                        <CustomIcon name="BiX" size={16} />
                      </ConfirmButton>
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
