import React from "react";
import { Tablas } from "assets/styles/StyledComponents/Tabla";
import { EliminarAsignaciones } from "services/empresasMRPService";

export const TablaJsonAsignaciones = ({
  jsonData = [],
  columnasOcultas = [],
  nombresPersonalizados = {},
  filaTotal = [],
  fetchD = null,
}) => {
  const cabeceras =
    jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  const eliminarDeLista = async (item) => {
    await EliminarAsignaciones(item.IDENTIFICADOR, fetchD);
  };

  return (
    <Tablas>
      <thead>
        <tr>
          {columnasMostradas.map((titulo, index) => (
            <th key={index}>{nombresPersonalizados[titulo] || titulo}</th>
          ))}
          <th>-</th>
        </tr>
      </thead>
      <tbody>
        {jsonData.length === 0 ? (
          <tr>
            <td colSpan={cabeceras.length + 1}>Ningun elemento encontrado</td>
          </tr>
        ) : (
          <>
            {jsonData.map((fila, index) => (
              <tr key={index}>
                {columnasMostradas.map((columna, i) => (
                  <td key={i}>{fila[columna]}</td>
                ))}
                <td>
                  <button
                    className="boton-borrar-producto-de-lista"
                    onClick={() => eliminarDeLista(fila)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {filaTotal.length > 0 && (
              <>
                {filaTotal.map((fila, index) => (
                  <tr key={index}>
                    {columnasMostradas.map((columna, i) => (
                      <td key={i}>{fila[columna]}</td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </>
        )}
      </tbody>
    </Tablas>
  );
};
