import React, { useState } from "react";
import {
  Tablas,
  ExpandableRow,
  TablaPProd,
  StyledRow,
} from "assets/styles/StyledComponents/Tabla";
import { TablasOS } from "assets/styles/StyledComponents/TablaOvSt";
import { EliminarPromocion } from "services/empresasMRPService";
import { BotonEliminar } from "assets/styles/StyledComponents/Botones";


export const TablaJson = ({
  jsonData = [],
  columnasOcultas = [],
  modulo,
  nombresPersonalizados = {},
  filaTotal = [],
}) => {
  const cabeceras =
    jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  return (
    <TablasOS modulo={modulo}>
      <thead>
        <tr>
          {columnasMostradas.map((titulo, index) => (
            <th key={index}>{nombresPersonalizados[titulo] || titulo}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jsonData.length === 0 ? (
          <tr>
            <td colSpan={cabeceras.length - 8}>Ningun elemento encontrado</td>
          </tr>
        ) : (
          <>
            {jsonData.map((fila, index) => (
              <tr key={index}>
                {columnasMostradas.map((columna, i) => (
                  <td key={i}>{fila[columna]}</td>
                ))}
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
    </TablasOS>
  );
};

export const TablaJsonNormal = ({
  jsonData = [],
  columnasOcultas = [],
  nombresPersonalizados = {},
  filaTotal = [],
}) => {
  const cabeceras =
    jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  return (
    <Tablas>
      <thead>
        <tr>
          {columnasMostradas.map((titulo, index) => (
            <th key={index}>{nombresPersonalizados[titulo] || titulo}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jsonData.length === 0 ? (
          <tr>
            <td colSpan={cabeceras.length}>Ningun elemento encontrado</td>
          </tr>
        ) : (
          <>
            {jsonData.map((fila, index) => (
              <tr key={index}>
                {columnasMostradas.map((columna, i) => (
                  <td key={i}>{fila[columna]}</td>
                ))}
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

export const TablaJsonDesplegable = ({
  jsonData = [],
  columnasOcultas = [],
  nombresPersonalizados = {},
  fetchD = null,
}) => {
  const [filasExpandidas, setFilasExpandidas] = useState([]);

  const ProductosEnPromocionTable = ({ productos }) => (
    <TablaPProd>
      <tbody>
        {productos.map((producto, index) => (
          <tr key={index}>
            <td>{"• " + producto.NOMBRE_PRODUCTO}</td>
          </tr>
        ))}
      </tbody>
    </TablaPProd>
  );

  const handleFilaClick = (index) => {
    if (filasExpandidas.includes(index)) {
      setFilasExpandidas(filasExpandidas.filter((i) => i !== index));
    } else {
      setFilasExpandidas([...filasExpandidas, index]);
    }
  };

  const cabeceras =
    jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  const eliminarDesDeLista = async (item, estado) => {
    await EliminarPromocion(item.IDENTIFICADOR_PROMOCION, estado, fetchD);
  };

  return (
    <Tablas tipo="consulta">
      <thead>
        <tr>
          {columnasMostradas.map((titulo, index) => (
            <th key={index}>{nombresPersonalizados[titulo] || titulo}</th>
          ))}
          <th># PRODUCTOS</th>
          <th>{""}</th>
        </tr>
      </thead>
      <tbody>
        {jsonData.length === 0 ? (
          <tr>
            <td colSpan={cabeceras.length + 2}>Ningun elemento encontrado</td>
          </tr>
        ) : (
          <React.Fragment>
            {jsonData.map((fila, index) => (
              <React.Fragment key={index}>
                <StyledRow
                  onClick={() => handleFilaClick(index)}
                  expanded={filasExpandidas.includes(index)}
                >
                  {columnasMostradas.map((columna, i) => (
                    <td key={i}>
                      {columna === "ESTADO"
                        ? fila[columna] === "F"
                          ? "Finalizado"
                          : fila[columna] === "A"
                          ? "Activo"
                          : fila[columna] === "D"
                          ? "Deshabilitado"
                          : ""
                        : fila[columna]}
                    </td>
                  ))}
                  <td>{fila.PRODUCTOS_EN_PROMOCION.length}</td>
                  <td>
                    {fila.ESTADO !== "F" ? (
                      fila.ESTADO === "D" ? (
                        <BotonEliminar
                          onClick={() => eliminarDesDeLista(fila, "A")}
                        >
                          HABILITAR
                        </BotonEliminar>
                      ) : (
                        <BotonEliminar
                          onClick={() => eliminarDesDeLista(fila, "D")}
                        >
                          DESHABILITAR
                        </BotonEliminar>
                      )
                    ) : (
                      <React.Fragment />
                    )}
                    <BotonEliminar
                      onClick={() => eliminarDesDeLista(fila, "E")}
                    >
                      <i className="bi bi-trash"></i>
                    </BotonEliminar>
                  </td>
                </StyledRow>
                {filasExpandidas.includes(index) && (
                  <ExpandableRow expanded={filasExpandidas.includes(index)}>
                    <td colSpan={6}>
                      <ProductosEnPromocionTable
                        productos={fila.PRODUCTOS_EN_PROMOCION}
                      />
                    </td>
                  </ExpandableRow>
                )}
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </tbody>
    </Tablas>
  );
};
