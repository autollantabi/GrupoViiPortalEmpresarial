import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { ContainerUI } from "./ContainerUI";
import { TextUI } from "./TextUI";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed
    ${({ theme, isDragging }) =>
      isDragging ? theme.colors.secondary : theme.colors.border};
  border-radius: 8px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.white};
  transition: background-color 0.3s ease;
  text-align: center;
  width: 100%;
  min-width: 250px;
  max-width: 300px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const Message = styled.div`
  color: ${({ theme }) => theme.colors.error};
  margin-top: 10px;
  font-size: 14px;
`;

const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 10px 0;
  width: 100%;
`;

const FileItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  border-radius: 5px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  margin-bottom: 2px;
  font-size: 14px;
  position: relative;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: red;
  cursor: pointer;
  font-size: 16px;
  z-index: 10;
  position: relative;
`;

export const InputFileUI = ({
  prevFiles = [],
  setFileData,
  validExtensions = ["txt"],
  maxFiles = 5,
  inputId = "file-upload",
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const { theme } = useTheme();
  useEffect(() => {
    if (prevFiles && prevFiles.length > 0) {
      setFiles(prevFiles);
    } else {
      setFiles([]);
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.value = "";
      }
    }
  }, [prevFiles, inputId]);

  const handleChange = (newFiles) => {
    if (!newFiles.length) return;

    let updatedFiles = [...files];

    for (let file of newFiles) {  
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (!validExtensions.includes(fileExtension)) {
        setMsg(`El archivo ${file.name} no tiene una extensión válida`);
        setTimeout(() => setMsg(""), 5000);
        continue;
      }

      if (updatedFiles.some((f) => f.name === file.name)) {
        setMsg(`El archivo ${file.name} ya ha sido agregado`);
        setTimeout(() => setMsg(""), 5000);
        continue;
      }

      updatedFiles.push(file);

      if (updatedFiles.length > maxFiles) {
        setMsg(`Solo puedes subir hasta ${maxFiles} archivos`);
        updatedFiles = updatedFiles.slice(0, maxFiles);
        break;
      }
    }

    setFiles(updatedFiles);
    setFileData(updatedFiles);

    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleChange(e.dataTransfer.files);
  };

  const removeFile = (fileName, event) => {
    event.stopPropagation();
    event.preventDefault();
    const filteredFiles = files.filter((file) => file.name !== fileName);
    setFiles(filteredFiles);
    setFileData(filteredFiles);
  };

  return (
    <StyledInputContainer
      $isDragging={isDragging}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={(e) => {
        if (e.target.tagName !== "BUTTON") {
          const inputElement = document.getElementById(inputId);
          if (inputElement) {
            inputElement.click();
          }
        }
      }}
    >
      <HiddenInput
        type="file"
        id={inputId}
        accept={validExtensions.map((ext) => `.${ext}`).join(",")}
        multiple
        onChange={(e) => handleChange(e.target.files)}
      />
      <ContainerUI
        justifyContent="space-between"
        flexDirection="column"
        style={{ gap: "5px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "solid 1px rgba(0, 0, 0, 0.2)",
            padding: "2px 10px",
            borderRadius: "5px",
          }}
        >
          <IconUI name="FaFileEarmarkArrowUp" size={25} color={theme.colors.text} />
          <span>Subir Archivo</span>
        </div>

        {files.length > 0 ? (
          <FileList>
            {files.map((file) => (
              <FileItem key={file.name} title={file.name}>
                <span
                  style={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "140px",
                  }}
                >
                  {file.name}
                </span>
                <RemoveButton onClick={(e) => removeFile(file.name, e)}>
                  <IconUI name="FaTrash" size={14} color={theme.colors.text} />
                </RemoveButton>
              </FileItem>
            ))}
          </FileList>
        ) : (
          <ContainerUI flexDirection="column" alignItems="flex-start">
            <TextUI>Seleccione o arrastre el archivo aquí</TextUI>
            <TextUI
              size={"14px"}
              title={`Tipos permitidos: ${validExtensions.join(", ")}`}
            >
              Permitido: {validExtensions.join(", ")}
            </TextUI>
          </ContainerUI>
        )}
      </ContainerUI>
      {msg && <Message>{msg}</Message>}
    </StyledInputContainer>
  );
};

