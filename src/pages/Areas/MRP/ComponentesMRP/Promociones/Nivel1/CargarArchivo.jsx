// Importa las bibliotecas necesarias
import React, { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { Boton } from "assets/styles/StyledComponents/Botones";
import { VerificarArchivoPromocion,ConfirmarCargaArchivoPromocion } from "services/empresasMRPService";
import { LoaderRueda } from "assets/styles/StyledComponents/LoaderC";
import { TablaJsonNormal } from "./Dif_Tablas";
import { ArchivoBaseDescarga } from "./ArchivoBaseDescarga";

const StyledTitle = styled.h3`
  font-size: 1.3rem;
  color: black;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: solid 1px;
`;
// Animación de fade-in para el mensaje de archivo seleccionado
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 2px dashed var(--primary-bajo);
  border-radius: 15px;
  min-width: 450px;
  max-width: 550px;
  cursor: pointer;
  transition: border 0.3s ease-in-out;

  &:hover {
    border: 2px dashed var(--primary);
  }
`;

const UploadButton = styled.label`
  display: inline-block;
  padding: 10px 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  background-color: var(--primary);
  color: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
  transition: background-color 0.3s ease-in-out;

  &:hover {
    background-color: var(--primary-bajo);
  }
`;

const FileInput = styled.input`
  display: none;
  z-index: 15;
`;

const SelectedFileMessage = styled.p`
  margin-top: 10px;
  font-size: 14px;
  color: black;
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.5s ease-in-out;
  font-weight: 400;
  gap: 7px;

  span {
    font-weight: 600;
  }
`;

const nombrespersonalizados = {
  NOMBRE_PRODUCTO: "NOMBRE PRODUCTOS INCORRECTOS",
};

export const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [formArchive, setFormArchive] = useState(null);
  const [msg, setmsg] = useState("");
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [mensajeCorrectos, setMensajeCorrectos] = useState("");

  const [dataIncorrectos, setDataIncorrectos] = useState(null);
  const [mensajeConfirmacionCarga, setMensajeConfirmacionCarga] =
    useState(null);

  const [volverASubir, setVolverASubir] = useState(null);
  const [codUUID, setCodUUID] = useState(null);

  const verificarArchivo = (file) => {
    if (file.size > 0) {
      const fileName = file.name;

      const fileExtension = fileName.slice(
        ((fileName.lastIndexOf(".") - 1) >>> 0) + 2
      );

      if (fileExtension.toLowerCase() === "xlsx") {
        // El archivo es válido (extensión .xlsx)
        // Aquí puedes agregar el código para cargar o procesar el archivo.
        setStatus("");
        setMensajeCorrectos("");
        const formData = new FormData();

        formData.append("file", file, file.name);
        setSelectedFile(file);
        setFormArchive(formData);

        // console.log("Archivo válido:", formData);
      } else {
        // El archivo no es válido (no es .xlsx)
        console.log(msg);
        setmsg("El archivo no tiene una extension valida");

        setTimeout(() => {
          setmsg("");
        }, 5000);
        // console.log("Archivo no válido:", fileName);
      }
    }
  };
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    verificarArchivo(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    verificarArchivo(file);
  };

  const handleClick = (event) => {
    // Si el evento proviene del botón, no hace nada
    if (event.target.tagName.toLowerCase() !== "label") {
      // Simula el clic en el input cuando FileUploadContainer se clickea
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleClickVerificar = async () => {
    if (formArchive !== null) {
      setStatus("1");
      const okay = await VerificarArchivoPromocion(formArchive);
      setVolverASubir(0);
      setStatus("Subido Correctamente");
      if (okay.status === 200) {
        setMensajeCorrectos("Todos los datos son correctos");
        setCodUUID(okay.data.nombreArchivo);
        setDataIncorrectos([]);
      } else {
        setMensajeCorrectos(
          "Hay " +
            okay.resultado.PRODUCTOS_INCORRECTOS.length +
            " incorrectos de " +
            okay.resultado.CANTIDAD_PRODUCTOS +
            "."
        );

        setDataIncorrectos(okay.resultado.PRODUCTOS_INCORRECTOS);
        // setDataCorrectos(okay.PRODUCTOS_CORRECTOS);
        console.table(okay.resultado.PRODUCTOS_INCORRECTOS);
      }
    }
  };

  const handleVolverASubir = () => {
    setSelectedFile(null);
    setFormArchive(null);
    setmsg("");
    setStatus("");
    setMensajeCorrectos("");
    setDataIncorrectos(null);
    setMensajeConfirmacionCarga(null);
    setVolverASubir(null);
    setCodUUID(null);
  };

  const handleConfirmarCarga = async () => {
    if (codUUID !== null && dataIncorrectos.length === 0) {
      setMensajeConfirmacionCarga("1");
      await ConfirmarCargaArchivoPromocion(codUUID);
      setMensajeConfirmacionCarga("¡Carga Exitosa!");
    }
  };

  return (
    <ContenedorPadre direccion="c" alineacion="center">
      <StyledTitle>CARGAR PROMOCION POR ARCHIVO</StyledTitle>
      <ContenedorPadre
        direccion="r"
        alineacion="center"
        style={{ gap: "10px" }}
      >
        <span>Archivo Base:</span>
        <ArchivoBaseDescarga/>
      </ContenedorPadre>
      {volverASubir === null && (
        <FileUploadContainer
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <UploadButton>
            Subir Archivo
            <form>
              <FileInput
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </form>
          </UploadButton>
          {selectedFile ? (
            <span></span>
          ) : (
            <span>O arrastre el archivo dentro del recuadro</span>
          )}
          {selectedFile && (
            <SelectedFileMessage>
              <span>Archivo seleccionado:</span>
              {selectedFile.name}
            </SelectedFileMessage>
          )}
        </FileUploadContainer>
      )}
      {msg !== "" && <ContenedorPadre>{msg}</ContenedorPadre>}
      <ContenedorPadre>
        {selectedFile && (
          <Boton
            disabled={
              selectedFile === null || dataIncorrectos !== null ? true : false
            }
            onClick={handleClickVerificar}
          >
            {status === "" ? (
              "Verificar Archivo"
            ) : status === "1" ? (
              <LoaderRueda />
            ) : (
              status
            )}
          </Boton>
        )}
      </ContenedorPadre>
      {mensajeCorrectos !== "" && <p>{mensajeCorrectos}</p>}
      {dataIncorrectos !== null && dataIncorrectos.length >= 0 && (
        <ContenedorPadre style={{ gap: "15px" }}>
          <Boton
            onClick={
              dataIncorrectos.length > 0
                ? handleVolverASubir
                : handleConfirmarCarga
            }
            disabled={
              mensajeConfirmacionCarga === "¡Carga Exitosa!" ? true : false
            }
          >
            {mensajeConfirmacionCarga === null
              ? dataIncorrectos.length > 0
                ? "Volver a subir archivo"
                : "Confirmar Carga"
              : ""}

            {mensajeConfirmacionCarga === null ? (
              ""
            ) : mensajeConfirmacionCarga === "1" ? (
              <LoaderRueda />
            ) : (
              mensajeConfirmacionCarga
            )}
          </Boton>
          {mensajeConfirmacionCarga === "¡Carga Exitosa!" && (
            <Boton onClick={handleVolverASubir}>Subir Nueva Promocion</Boton>
          )}
        </ContenedorPadre>
      )}
      {dataIncorrectos !== null && dataIncorrectos.length > 0 && (
        <ContenedorPadre
          style={{ height: "30rem", paddingTop: "0" }}
          ovy="auto"
        >
          <TablaJsonNormal
            jsonData={dataIncorrectos}
            nombresPersonalizados={nombrespersonalizados}
          />
        </ContenedorPadre>
      )}
    </ContenedorPadre>
  );
};
