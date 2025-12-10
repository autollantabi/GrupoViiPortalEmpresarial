import React from 'react'
import "./VentanaEmergente.css"

export const VentanaEmergente = (props) => {
  return (
    <div className="contenedor-ventaja-emergente">
        <div className="ventaja-emergente">
            <div className="mensaje-ventaja-emergente">{props.mensaje}</div>
        </div>
    </div>
  )
}
