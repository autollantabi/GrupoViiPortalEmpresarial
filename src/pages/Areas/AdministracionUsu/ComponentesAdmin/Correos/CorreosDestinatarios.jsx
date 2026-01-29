import React, { useState } from "react";
import {
  Contenedor1,
  ContenedorFlexColumn,
  ContenedorFlexRow,
  ContenedorGrid,
  ContenedorGridCelda,
  IconoGeneral,
  InputStyled,
  SelectStyled,
} from "../../CSS/ComponentesAdminSC";

export const CorreosDestinatarios = () => {
  const [moduloCorreos, setModuloCorreos] = useState("");
  const [correoEditar, setCorreoEditar] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [correosEjemp, setCorreosEjemp] = useState([
    {
      id: 1,
      correo: "correo1@autollanta.com",
    },
    {
      id: 2,
      correo: "correo2@stox.com.ec",
    },
    {
      id: 3,
      correo: "correo3@maxximundo.com",
    },
  ]);

  const mostrarCorreosSegunModulo = (value) => {
    if (value !== "") {
      if (value === "COMPRAS") {
        setModuloCorreos(value);
      }else{
        setModuloCorreos("");

      }
    } else {
      setModuloCorreos("");
    }
  };

  const editarCorreo = (id) => {
    setCorreoEditar(id);
    let varC = correosEjemp.find((item) => item.id === id);
    setValueInput(varC.correo);
  };
  const cancelarEditarCorreo = () => {
    setCorreoEditar("");
    setValueInput("");
  };

  const eliminarCorreo = (id) => {
    setCorreosEjemp((prevCorreos) =>
      prevCorreos.filter((item) => item.id !== id)
    );
  };

  const guardarEditarCorreo = () => {
    let edicionCorreo = valueInput;
    if (edicionCorreo !== "" && edicionCorreo.length > 8) {
      setCorreosEjemp((prevCorreos) =>
        prevCorreos.map((item) =>
          item.id === correoEditar ? { ...item, correo: edicionCorreo } : item
        )
      );
      setValueInput("");
      setCorreoEditar("");
    }
  };
  const agregarCorreo = () => {
    let nuevoCorreo = valueInput;
    if (nuevoCorreo !== "" && nuevoCorreo.length > 8) {
      // Verificar si el correo ya existe
      const correoExiste = correosEjemp.some(
        (item) => item.correo === nuevoCorreo
      );

      if (correoExiste) {
        return; // Salir de la función si el correo ya existe
      }
      // Genera un nuevo ID basado en el ID más alto existente + 1
      const nuevoId =
        correosEjemp.length > 0
          ? Math.max(...correosEjemp.map((item) => item.id)) + 1
          : 1;

      // Crea el nuevo objeto de correo
      const nuevoItem = {
        id: nuevoId,
        correo: nuevoCorreo,
      };

      // Actualiza el estado con el nuevo correo agregado
      setCorreosEjemp((prevCorreos) => [...prevCorreos, nuevoItem]);
      setValueInput("");
    }
  };

  return (
    <Contenedor1>
      <ContenedorFlexColumn style={{ gap: "20px" }}>
        <ContenedorFlexRow>
          <span>Elegir un modulo: </span>
          <span>
            <SelectStyled
              name="modulo"
              id="modulo"
              defaultValue=""
              onChange={(e) => mostrarCorreosSegunModulo(e.target.value)}
            >
              <option value="">------------</option>
              <option value="COMPRAS">COMPRAS</option>
              <option value="BODEGA">BODEGA</option>
            </SelectStyled>
          </span>
        </ContenedorFlexRow>
        {moduloCorreos !== "" && (
          <ContenedorFlexColumn
            style={{ alignItems: "start", minWidth: "150px" }}
          >
            <ContenedorGrid
              columns={2}
              style={{
                borderTop: "solid 1px gray",
                borderBottom: "solid 1px gray",
              }}
            >
              <ContenedorGridCelda max={"280px"}>Correos</ContenedorGridCelda>
              <ContenedorGridCelda max={"53px"}>-</ContenedorGridCelda>
            </ContenedorGrid>
            {correosEjemp.map((item) => (
              <ContenedorGrid key={item.id} columns={2}>
                <ContenedorGridCelda max={"280px"}>
                  {item.correo}
                </ContenedorGridCelda>
                <ContenedorGridCelda max={"auto"}>
                  <ContenedorFlexRow>
                    <span onClick={() => editarCorreo(item.id)}>
                      <IconoGeneral className="bi bi-pencil-square"></IconoGeneral>
                    </span>
                    <span onClick={() => eliminarCorreo(item.id)}>
                      <IconoGeneral className="bi bi-trash3-fill"></IconoGeneral>
                    </span>
                  </ContenedorFlexRow>
                </ContenedorGridCelda>
              </ContenedorGrid>
            ))}
            <ContenedorFlexRow>
              <InputStyled
                maxw={"300px"}
                type="text"
                value={valueInput}
                onChange={(e) => {
                  setValueInput(e.target.value);
                }}
              />
              {correoEditar === "" ? (
                <span onClick={() => agregarCorreo()}>
                  <IconoGeneral className="bi bi-plus-square"></IconoGeneral>
                </span>
              ) : (
                <div>
                  {" "}
                  <span onClick={() => guardarEditarCorreo()}>
                    <IconoGeneral className="bi bi-floppy-fill"></IconoGeneral>
                  </span>{" "}
                  <span onClick={() => cancelarEditarCorreo()}>
                    <IconoGeneral className="bi bi-x-circle"></IconoGeneral>
                  </span>
                </div>
              )}
            </ContenedorFlexRow>
          </ContenedorFlexColumn>
        )}
      </ContenedorFlexColumn>
    </Contenedor1>
  );
};
