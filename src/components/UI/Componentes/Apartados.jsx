import React from "react";
import { Link } from "react-router-dom";


// Codigo para crear los botones en el parte de Portal, solo se envia el texto a mostrar y se manda el texto 
export const Apartados = ({ textoAMostrar, redireccion}) => {
  const titulo = textoAMostrar;
  return (
    <>
      <Link to={redireccion}>
        <button className="OpcionesPortal">{titulo}</button>
      </Link>
    </>
  );
};
