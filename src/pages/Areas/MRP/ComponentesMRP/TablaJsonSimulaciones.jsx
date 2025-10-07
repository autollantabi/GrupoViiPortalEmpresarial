import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { TablasOS } from "assets/styles/StyledComponents/TablaOvSt";
import { UpdatePedidoComercial } from "services/empresasMRPService";

const getCellStyle = (fila) => {
  if (fila["DIF_MAX_ANIO_TOT_ANIO"] === "SI") {
    return { backgroundColor: "rgba(17, 183, 0, 0.85)" };
  }
  // Aplica estilo naranja si la columna es "DIAS_INV_100D" y el valor es menor a 75
  if (fila["DIAS_INV_100D"] < 75) {
    // Comprueba condiciones adicionales para aplicar el estilo rojo
    if (fila["DIAS_INV_1ANIO"] < 275 && fila["ANTIGUEDAD"] === "  > 12") {
      return { backgroundColor: "rgba(255, 0, 0, 0.35)" };
    }
    return { backgroundColor: "rgba(255, 125, 0, 0.45)" };
  }

  return {}; // Devuelve un estilo vacío si no se cumplen las condiciones
};
const getColumnStyle = (columna) => {
  // Aplica estilo naranja si la columna es "DIAS_INV_100D" y el valor es menor a 75
  if (columna === "DEMANDA_MES_ANIO" || columna === "DEMANDA_100D") {
    return { backgroundColor: "rgba(209, 209, 209, 1)" };
  }
  if (columna === "STOCK") {
    return { backgroundColor: "rgba(167, 167, 167, 1)" };
  }
  if (columna === "STOCK_TOTAL" || columna === "MESES_INV_TOTAL") {
    return { backgroundColor: "rgba(65, 172, 239, 0.87)" };
  }
  if (columna === "SUGERIDO_COMPRA") {
    return { backgroundColor: "rgba(240, 248, 7, 1)" };
  }
  return {}; // Devuelve un estilo vacío si no se cumplen las condiciones
};

const getSelectedRow = (filaActual, filaSeleccionada) => {
  // Aquí puedes definir más reglas de estilo basadas en otras condiciones
  if (filaActual.CODIGO === filaSeleccionada) {
    return {
      border: "solid 1px red",
      boxShadow: "0 2px 10px 2px black",
      zIndex: "5",
      transition: "all ease 0.5s",
    };
  }
  return {}; // Devuelve un objeto vacío si no se cumplen las condiciones
};

export const TablaJson = ({
  jsonData = [],
  columnasOcultas = [],
  modulo,
  nombresPersonalizados = {},
  filaTotal = [],
}) => {
  const [orden, setOrden] = useState({ columna: null, direccion: "none" });

  const ordenarDatos = (columna) => {
    const nuevaDireccion =
      orden.columna === columna
        ? orden.direccion === "asc"
          ? "desc"
          : orden.direccion === "desc"
          ? "none"
          : "asc"
        : "asc";

    setOrden({
      columna: nuevaDireccion !== "none" ? columna : null,
      direccion: nuevaDireccion,
    });
  };

  const datosOrdenados = () => {
    if (orden.direccion === "none" || !orden.columna) {
      return jsonData;
    }
    const sortedData = [...jsonData];
    sortedData.sort((a, b) => {
      if (a[orden.columna] < b[orden.columna]) {
        return orden.direccion === "asc" ? -1 : 1;
      }
      if (a[orden.columna] > b[orden.columna]) {
        return orden.direccion === "asc" ? 1 : -1;
      }
      return 0;
    });
    // console.log(sortedData);
    return sortedData;
  };

  const renderSortArrow = (titulo) => {
    if (orden.columna === titulo) {
      if (orden.direccion === "asc")
        return <i className="bi bi-caret-up-fill"></i>;
      if (orden.direccion === "desc")
        return <i className="bi bi-caret-down-fill"></i>;
    }
    return "";
  };

  const cabeceras =
    jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  return (
    <TablasOS modulo={modulo} final={true}>
      <thead>
        <tr>
          {columnasMostradas.map((titulo, index) => (
            <th
              key={index}
              onClick={() => ordenarDatos(titulo)}
              style={{
                minWidth: titulo === "NOMBRE_PRODUCTO" ? "100px" : "60px",
                maxWidth: titulo === "NOMBRE_PRODUCTO" ? "100px" : "80px",
                wordBreak: "break-word",
              }}
            >
              {nombresPersonalizados[titulo] || titulo}
              {renderSortArrow(titulo)}
            </th>
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
            {datosOrdenados().map((fila, index) => (
              <tr key={index} style={getCellStyle(fila)}>
                {columnasMostradas.map((columna, i) => (
                  <td key={i} style={getColumnStyle(columna)}>
                    {columna === "Variacion"
                      ? `${fila[columna] === null ? "0" : fila[columna]} %`
                      : fila[columna]}
                  </td>
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

// const BotonSugerir = styled.button`
//   padding: 7px 10px;
//   border-radius: 15px;
//   border: none;
//   outline: none;

//   background-color: ${(props) =>
//     props.variant === "e" ? "var(--primary)" : "white"};
//   color: ${(props) =>
//     props.variant === "e" ? "white" : "var(--primary)"};
//   box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
//     rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
//   transition: all 0.5s ease;

//   &:hover {
//     background-color: ${(props) => (props.variant === "e" ? "white" : "")};
//     color: ${(props) => (props.variant === "e" ? "var(--primary)" : "")};
//   }
// `;

const InputEdit = styled.input`
  outline: none;
  border: solid 1px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 4px 8px;
  width: auto;
  min-width: 40px;
  max-width: 80px;
`;

export const TablaJsonSimComercial = ({
  jsonData = [],
  columnasOcultas = [],
  modulo,
  nombresPersonalizados = {},
  filaTotal = [],
  actualizarTabla,
  ordenColumnas,
  guardarGrad,
  empresaMarca,
  setfiltro,
  idEmpresaMarca,
}) => {
  const [editando, setEditando] = useState(null);
  const [orden, setOrden] = useState({ columna: null, direccion: "none" });
  // const [sugerido, setSugerido] = useState(0);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const inputRefs = useRef([]);
  let lS = localStorage.getItem("SUGERIDOS");
  let lSJ = JSON.parse(lS);
  let sg = lS !== null ? lSJ.SUGERIDOS : {};
  let eM = lS !== null && {
    EMPRESA: lSJ.EMPRESA,
    MARCA: lSJ.MARCA,
  };
  // console.log(jsonData);
  const [sugeridos, setSugeridos] = useState(
    eM.EMPRESA === empresaMarca.EMPRESA && eM.MARCA === empresaMarca.MARCA
      ? sg
      : {}
  );
  const [menuVisible, setMenuVisible] = useState(null);

  const editarFila = (item) => {
    // console.table(item);
    setFilaSeleccionada(item.CODIGO);
    setEditando(item.CODIGO);
    setTimeout(() => inputRefs.current[item.CODIGO]?.focus(), 100);
  };
  // const guardarCambios = () => {
  //   // console.log(valoresEditados);

  //   setEditando(null);
  // };

  const handleKeyDown = (e, item) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const currentIndex = jsonData.findIndex((i) => i.CODIGO === item.CODIGO);
      const nextIndex = (currentIndex + 1) % jsonData.length;
      editarFila(jsonData[nextIndex]);
    }
  };
  useEffect(() => {
    inputRefs.current = jsonData.reduce((acc, item) => {
      acc[item.CODIGO] = inputRefs.current[item.CODIGO] || null;
      return acc;
    }, {});
  }, [jsonData]);

  const ordenarDatos = (columna) => {
    const nuevaDireccion =
      orden.columna ===
      (columna === "NOMBRE_PRODUCTO" ? "CODIGO_BARRAS" : columna)
        ? orden.direccion === "asc"
          ? "desc"
          : orden.direccion === "desc"
          ? "none"
          : "asc"
        : "asc";

    // console.log(columna);
    // Ajustar la columna de ordenamiento si es NOMBRE_PRODUCTO
    const columnaOrden =
      columna === "NOMBRE_PRODUCTO" ? "CODIGO_BARRAS" : columna;
    setOrden({
      columna: nuevaDireccion !== "none" ? columnaOrden : null,
      direccion: nuevaDireccion,
    });
  };

  const esNumero = (valor) => {
    return !isNaN(parseFloat(valor)) && isFinite(valor);
  };

  const datosOrdenados = () => {
    if (orden.direccion === "none" || !orden.columna) {
      return jsonData;
    }
    const sortedData = [...jsonData];
    sortedData.sort((a, b) => {
      const valorA = a[orden.columna];
      const valorB = b[orden.columna];

      if (esNumero(valorA) && esNumero(valorB)) {
        const numA = parseFloat(valorA);
        const numB = parseFloat(valorB);

        if (numA < numB) {
          return orden.direccion === "asc" ? -1 : 1;
        }
        if (numA > numB) {
          return orden.direccion === "asc" ? 1 : -1;
        }
        return 0;
      } else {
        if (valorA < valorB) {
          return orden.direccion === "asc" ? -1 : 1;
        }
        if (valorA > valorB) {
          return orden.direccion === "asc" ? 1 : -1;
        }
        return 0;
      }
    });
    return sortedData;
  };

  const renderSortArrow = (titulo) => {
    const col = titulo === "NOMBRE_PRODUCTO" ? "CODIGO_BARRAS" : titulo;
    // console.log(orden);
    if (orden.columna === col) {
      if (orden.direccion === "asc")
        return <i className="bi bi-caret-up-fill"></i>;
      if (orden.direccion === "desc")
        return <i className="bi bi-caret-down-fill"></i>;
    }
    return "";
  };

  const handleChangeSugerido = async (item, CODIGO, value) => {
    if (value >= 0 && value <= 10000) {
      setSugeridos((prev) => {
        const updatedSugeridos = {
          ...prev,
          [CODIGO]: { ...prev[CODIGO], valor: value, bloqueado: false },
        };
        guardarGrad(updatedSugeridos);
        return updatedSugeridos;
      });
      // console.log(value);
      // actualizarTabla(idEmpresaMarca.EMPRESA,idEmpresaMarca.MARCA)
      let bloqueado = item.BLOQUEADO_PARA_COMPRA === "NO" ? "false" : "true";
      let codItem = parseInt(CODIGO);
      let psugerido = parseInt(value);
      let usuario = parseInt(localStorage.getItem("identificador"));
      // console.log(
      //   ">",
      //   bloqueado,
      //   " - ",
      //   codItem,
      //   " - ",
      //   psugerido,
      //   " - ",
      //   usuario,
      //   "<"
      // );

      const res = await UpdatePedidoComercial({
        codItem,
        psugerido,
        usuario,
        bloqueado,
      });
      console.log(res ? "ACT C" : "FAILED");
    }
  };

  const handleCheckboxChange = async (item, CODIGO, isChecked) => {
    setSugeridos((prev) => {
      const updatedSugeridos = {
        ...prev,
        [CODIGO]: { ...prev[CODIGO], bloqueado: isChecked },
      };
      guardarGrad(updatedSugeridos);
      // console.log(item);
      return updatedSugeridos;
    });

    let bloqueado = isChecked ? "true" : "false";
    let codItem = parseInt(CODIGO);
    let psugerido = parseInt(determinarValorInput(0, item, CODIGO));
    let usuario = parseInt(localStorage.getItem("identificador"));

    // console.log(
    //   ">",
    //   bloqueado,
    //   " - ",
    //   codItem,
    //   " - ",
    //   psugerido,
    //   " - ",
    //   usuario,
    //   "<"
    // );

    const res = await UpdatePedidoComercial({
      codItem,
      psugerido,
      usuario,
      bloqueado,
    });
    setTimeout(() => {
      setMenuVisible(null);
    }, 500);
    console.log(res ? "ACT C" : "FAILED");
  };

  const cabeceras =
    ordenColumnas.length > 0
      ? ordenColumnas
      : jsonData.length > 0
      ? Object.keys(jsonData[0])
      : Object.keys(nombresPersonalizados);
  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  const determinarValorInput = (i, fila, codigo) => {
    const valorSugerido = sugeridos[codigo] && sugeridos[codigo].valor;
    const valorPedido = fila.NUEVO_PEDIDO_SUGERIDO;

    // Caso 1: Ambos, valorPedido y valorSugerido, están definidos
    if (valorPedido !== null && valorSugerido !== undefined) {
      return valorSugerido; // Prioriza el valor sugerido si ambos están presentes
    }

    // Caso 2: Solo valorPedido está definido
    if (valorPedido !== null) {
      return parseInt(valorPedido); // Usa el valorPedido si está definido y valorSugerido no lo está
    }

    // Caso 3: Solo valorSugerido está definido
    if (valorSugerido !== undefined) {
      return valorSugerido; // Usa el valorSugerido si está definido y valorPedido no lo está
    }

    // Caso 4: Ninguno está definido
    return i === 0 ? "" : "-"; // Retorna un placeholder o vacío dependiendo del índice
  };

  const determinarValorCheckbox = (fila, codigo) => {
    const valorSugerido = sugeridos[codigo] && sugeridos[codigo].bloqueado;
    const valorPedido = fila.BLOQUEADO_PARA_COMPRA === "SI" ? true : false;
    // Caso 1: Ambos, valorPedido y valorSugerido, están definidos
    if (valorPedido !== null && valorSugerido !== undefined) {
      return valorSugerido; // Prioriza el valor sugerido si ambos están presentes
    }

    // Caso 2: Solo valorPedido está definido
    if (valorPedido !== null) {
      return valorPedido; // Usa el valorPedido si está definido y valorSugerido no lo está
    }

    // Caso 3: Solo valorSugerido está definido
    if (valorSugerido !== undefined) {
      return valorSugerido; // Usa el valorSugerido si está definido y valorPedido no lo está
    }

  };

  return (
    <TablasOS modulo={modulo}>
      <thead>
        <tr style={{ userSelect: "none" }}>
          {columnasMostradas.map((titulo, index) => (
            <th
              key={index}
              onClick={() => ordenarDatos(titulo)}
              style={{
                minWidth:
                  titulo === "NOMBRE_PRODUCTO"
                    ? "100px"
                    : titulo === "CODIGO_BARRAS"
                    ? "auto"
                    : "60px",
                maxWidth: titulo === "NOMBRE_PRODUCTO" ? "100px" : "80px",
                wordBreak: "break-word",
              }}
            >
              {nombresPersonalizados[titulo] || titulo}
              {renderSortArrow(titulo)}
            </th>
          ))}
          <th>SUGERIDO</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {jsonData.length === 0 ? (
          <tr>
            <td colSpan={cabeceras.length}>Ningun elemento encontrado</td>
          </tr>
        ) : jsonData[0].CODIGO === 9999999999 ? (
          <tr>
            <td colSpan={cabeceras.length}>
              No existen elementos con el filtro seleccionado
            </td>
          </tr>
        ) : (
          <>
            {datosOrdenados().map((fila, index) => (
              <tr
                key={index}
                style={{
                  ...getCellStyle(fila),
                  ...getSelectedRow(fila, filaSeleccionada),
                }}
                onClick={() => setFilaSeleccionada(fila.CODIGO)}
              >
                {columnasMostradas.map((columna, i) => (
                  <td key={i} style={{ ...getColumnStyle(columna) }}>
                    {columna === "CODIGO_BARRAS"
                      ? ""
                      : columna === "Variacion"
                      ? `${fila[columna] === null ? "0" : fila[columna]} %`
                      : columna === "NOMBRE_PRODUCTO"
                      ?sugeridos[fila.CODIGO]?.bloqueado  === true 
                        ? `${fila[columna]} 🚫`
                        : `${fila[columna]}`
                      : fila[columna]}
                  </td>
                ))}
                <td
                  style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                  onClick={() => editarFila(fila)}
                >
                  {editando === fila.CODIGO ? (
                    <InputEdit
                      ref={(el) => (inputRefs.current[fila.CODIGO] = el)} // Usa la referencia aquí
                      autoFocus
                      id={index}
                      type="number"
                      min={0}
                      max={10000}
                      value={determinarValorInput(0, fila, fila.CODIGO)}
                      onBlur={()=>setEditando(null)}
                      onChange={(e) =>
                        handleChangeSugerido(fila, fila.CODIGO, e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(e, fila)}
                    />
                  ) : (
                    determinarValorInput(1, fila, fila.CODIGO)
                  )}
                </td>
                <td
                  style={{ position: "relative", cursor: "pointer" }}
                  onClick={() =>
                    setMenuVisible(
                      menuVisible === fila.CODIGO ? null : fila.CODIGO
                    )
                  }
                  onBlur={() => setMenuVisible(null)}
                >
                  <div
                    style={{
                      backgroundColor: "white",
                      width: "100%",
                      height: "100%",
                      borderRadius: "10px",
                      aspectRatio: "1",
                    }}
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </div>

                  {menuVisible === fila.CODIGO && (
                    <div
                      style={{
                        position: "absolute",
                        backgroundColor: "white",
                        boxShadow: "0px 2px 6px #aaa",
                        padding: "10px",
                        borderRadius: "5px",
                        width: "150px",
                        right: "100%",
                        userSelect: "none",
                        top: 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <label>
                          <input
                            type="checkbox"
                            checked={determinarValorCheckbox(fila,fila.CODIGO)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                fila,
                                fila.CODIGO,
                                e.target.checked
                              )
                            }
                          />{" "}
                          Bloquear para compra
                        </label>
                      </div>
                    </div>
                  )}
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
    </TablasOS>
  );
};
