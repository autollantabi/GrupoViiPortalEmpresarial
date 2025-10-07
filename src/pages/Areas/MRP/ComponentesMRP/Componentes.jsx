import React, { useState } from "react";
import { Boton } from "assets/styles/StyledComponents/Botones";
import { DateInput } from "./InputDate";

export function InputProductos({
  setData,
  setProducto,
  producto,
  dataFilter,
  listProductos,
  seccion,
  prodFinal,
  idprodFinal,
}) {
  const var1 = { IDENTIFICADOR: "", NOMBRE_PRODUCTO: "" };
  const [validarExiste, setValidarExiste] = useState(false);
  const [onfocus, setOnFocus] = useState(false);

  const ValidarProdChange = (value) => {
    const validar = listProductos.some(
      (item) => item.NOMBRE_PRODUCTO === value.toUpperCase()
    );
    setValidarExiste(validar);
    if (!validar) {
      prodFinal(var1);
    }
  };

  const ValidarProd = (prod) => {
    const validar = listProductos.some(
      (item) => item.NOMBRE_PRODUCTO === prod.NOMBRE_PRODUCTO
    );
    setValidarExiste(validar);
    validar ? prodFinal(prod) : prodFinal(var1);
  };

  const elegirProducto = (a) => {
    const value = a.toUpperCase();
    // console.log(value);
    setProducto((prev) => ({
      ...prev,
      NOMBRE_PRODUCTO: value,
    }));
    setData(value);
    ValidarProdChange(value);
  };
  const elegirProductoFinal = (prod) => {
    // console.log(prod);
    setProducto(prod);
    setData("");
    ValidarProd(prod);
  };
  const onLeave = () => {
    setTimeout(() => {
      setOnFocus(false);
    }, 300);
  };

  return (
    <div className="contenedor-input-busqueda-asignacion">
      <input
        // className="input-busqueda-asignacion"
        className={`select-asignacion productos ${
          validarExiste === true && idprodFinal !== ""
            ? "casillero-correcto"
            : ""
        }`}
        type="text"
        value={producto.NOMBRE_PRODUCTO}
        onChange={(e) => elegirProducto(e.target.value)}
        placeholder="Buscar..."
        onFocus={() => setOnFocus(true)}
        onBlur={() => onLeave()}
      />
      <ul
        className={`lista-productos ${
          idprodFinal !== "" || onfocus === false ? "esconder-ul" : ""
        }`}
      >
        {dataFilter().map((prod, index) => (
          <li
            className="li-lista-productos"
            key={index}
            valueid={prod.IDENTIFICADOR}
            value={prod.NOMBRE_PRODUCTO}
            onClick={() => elegirProductoFinal(prod)}
          >
            {prod.NOMBRE_PRODUCTO}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TablaProductos({
  nombrePromocion,
  listaProductos,
  eliminarDeLista,
  setFechas,
  fechas,
  setDataPromocion,
}) {
  // const [fechas, setFechas] = useState({
  //   FI: "",
  //   FF: "",
  // });

  const handleFechaInicialChange = (date) => {
    setFechas({
      ...fechas,
      FI: date,
    });
  };

  const handleFechaFinalChange = (date) => {
    setFechas({
      ...fechas,
      FF: date,
    });
  };

  const handleGuardar = () => {
    setDataPromocion();
  };
  return (
    <div className="contenedor-tabla-promociones">
      <table className="tabla-promociones">
        <tbody>
          <tr>
            <th colSpan="3">{nombrePromocion}</th>
          </tr>
          {listaProductos.map((item, index) => (
            <tr key={index}>
              <td colSpan="2">{item.NOMBRE_PRODUCTO}</td>
              <td>
                <button
                  className="boton-borrar-producto-de-lista"
                  onClick={() => eliminarDeLista(item)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <DateInput
                type="date"
                etiqueta="Fecha Inicial"
                onChange={handleFechaInicialChange}
              />
            </td>
            <td>
              <DateInput
                type="date"
                etiqueta="Fecha Final"
                onChange={handleFechaFinalChange}
                minDate={fechas.FI}
                disabled={fechas.FI !== "" ? false : true}
              />
            </td>
            <td>
              <Boton
                disabled={fechas.FI !== "" && fechas.FF !== "" ? false : true}
                onClick={() => handleGuardar()}
              >
                Guardar Prom
              </Boton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
