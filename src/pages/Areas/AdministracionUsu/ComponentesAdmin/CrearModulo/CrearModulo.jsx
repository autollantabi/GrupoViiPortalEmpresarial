import React, { useState } from "react";
import { axiosInstance } from "config/axiosConfig";

export const CrearModulo = () => {
  const [modulo, setmodulo] = useState("");
  const [mensaje, setmensaje] = useState("");

  const CrearModulo = async () => {
    await axiosInstance
      .post(`/modulo/${modulo}`)
      .then(() => {
        setmensaje("Modulo '" + modulo + "' creado con exito!");
        setTimeout(() => {
          setmensaje("");
        }, 2000);
      })
      .catch((error) => {
        setmodulo("");
        setmensaje("Modulo '" + modulo + "' ya existe o hubo un error!");
        // Manejar errores en caso de que la solicitud falle
        console.error("Error en crear modulo:", error);
        setTimeout(() => {
          setmensaje("");
        }, 2000);
      });
  };

  return (
    <div>
      <section className="contenedor-CU">
        <div className="contenedor-formulario">
          <div>
            <input
              type="text"
              id="Modulo"
              placeholder="Nombre Módulo"
              className="input-usuario"
              value={modulo}
              onChange={(e) => setmodulo(e.target.value.toUpperCase())}
            />
          </div>
          <div className="contenedor-boton">
            <button className="boton-crear" onClick={() => CrearModulo()}>
              CREAR
            </button>
          </div>
          {
            <div>
              <span className="mensaje-crear">{mensaje}</span>
            </div>
          }
        </div>
      </section>
    </div>
  );
};
