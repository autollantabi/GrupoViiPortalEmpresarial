import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { CustomContainer, CustomText } from "./CustomComponents";
import { hexToRGBA } from "utils/colors";

const StyledInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 2px dashed
    ${({ theme, isDragging }) =>
      isDragging ? theme.colors.secondary : theme.colors.placeholder};
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
  background: ${({ theme }) => theme.colors.background};
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

export const CustomInputFile = ({
  prevFiles = [],
  setFileData,
  validExtensions = ["txt"],
  maxFiles = 5,
  inputId = "file-upload",
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [msg, setMsg] = useState("");

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
    // const formData = new FormData();

    for (let file of newFiles) {
      console.log(file);

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
    // console.log("UptFiles", updatedFiles);

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

  // Función para limpiar los archivos
  //    const clearFiles = () => {
  //     setFiles([]); // Limpiar el estado de archivos
  //     setFileData(new FormData()); // Limpiar el FormData
  //     document.getElementById("file-upload").value = ""; // Limpiar el input de archivos
  //   };

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
      <CustomContainer
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
          <i
            style={{ fontSize: "25px" }}
            className="bi bi-file-earmark-arrow-up"
          />
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
                  <i className="bi bi-trash3" />
                </RemoveButton>
              </FileItem>
            ))}
          </FileList>
        ) : (
          <CustomContainer flexDirection="column" alignItems="flex-start">
            <CustomText>Seleccione o arrastre el archivo aquí</CustomText>
            <CustomText
              size={"14px"}
              title={`Tipos permitidos: ${validExtensions.join(", ")}`}
            >
              Permitido: {validExtensions.join(", ")}
            </CustomText>
          </CustomContainer>
        )}
      </CustomContainer>
      {msg && <Message>{msg}</Message>}
    </StyledInputContainer>
  );
};

// Contenedor principal del input
const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 3px;
  border: 1px solid ${({ theme }) => theme.colors.placeholder};
  border-radius: 5px;
  background: #fff;
  position: relative;

  &:focus-within {
    border-color: ${({ theme }) =>
      hexToRGBA({ hex: theme.colors.secondary, alpha: 0.5 })};
  }
`;

// Estilos del input
const StyledInput = styled.input`
  flex: 1;
  padding: 4px;
  border: none;
  outline: none;
  font-size: 14px;
  width: 100%;
  background: transparent;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
`;

// Estilos para los iconos
const Icon = styled.i`
  padding: 0 8px;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.placeholder};
`;

export const CustomInput = ({
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  formatValue = (val) => val, // Función para formatear el valor mostrado
  iconLeft,
  iconRight,
  onClickIconleft,
  onClickIconRight,
  containerStyle,
  inputStyle,
  label,
}) => {
  const [inputValue, setInputValue] = useState(value ?? "");

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  const handleChange = (e) => {
    const originalValue = e.target.value;
    setInputValue(originalValue);
    if (onChange) onChange(originalValue);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        ...containerStyle,
      }}
    >
      {label && <Label>{label}</Label>}
      <InputWrapper>
        {iconLeft && (
          <Icon
            className={`${iconLeft}`}
            onClick={onClickIconleft || (() => {})}
          />
        )}
        {/* Ícono izquierdo */}
        <StyledInput
          type={type}
          placeholder={placeholder}
          value={formatValue(inputValue)} // Formato al mostrar
          onChange={handleChange}
          style={inputStyle}
        />
        {iconRight && (
          <Icon
            className={`${iconRight}`}
            onClick={onClickIconRight || (() => {})}
          />
        )}
        {/* Ícono derecho */}
      </InputWrapper>
    </div>
  );
};
