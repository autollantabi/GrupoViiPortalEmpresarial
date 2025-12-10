import React, { useState, useEffect } from "react";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { BotonEditar } from "assets/styles/StyledComponents/Botones";
import { InputText } from "assets/styles/StyledComponents/Inputs";
import { FiltroGlobal } from "../FiltroGlobal";
import {
  ListaParametrizacion,
  ActualizarParametrizaciones,
} from "services/empresasMRPService";

const cabecera = [
  "EMPRESA",
  "MARCA",
  "FABRICA",
  "ESTACIONALIDAD",
  "LEAD TIME",
  "NIVEL SERVICIO",
  "",
];
export function Parametrizaciones() {
  const [editando, setEditando] = useState(null);
  const [valoresEditados, setValoresEditados] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const editarFila = (item) => {
    // console.table(item);
    setEditando(item);
    setValoresEditados(item);
  };

  const guardarCambios = () => {
    // console.log(valoresEditados);
    ActualizarParametrizaciones(
      valoresEditados.IDENTIFICADOR,
      valoresEditados.FECHA_MAXIMA,
      valoresEditados.LEAD_TIME,
      valoresEditados.NIVEL_SERVICIO,
      fetchData
    );

    setEditando(null);
    setValoresEditados([]);
  };

  // const fechaFormateada = (fechaOriginal) => {
  //   return fechaOriginal.split("-").reverse().join("-");
  // };

  const fetchData = async () => {
    try {
      const listParam = await ListaParametrizacion();
      setData(listParam);
      setFilteredData(listParam);
    } catch (error) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ContenedorPadre direccion="c">
      <FiltroGlobal setData={setFilteredData} data={data}></FiltroGlobal>
      <table>
        <tbody>
          <tr>
            {cabecera.map((item, index) => (
              <th key={index}>{item}</th>
            ))}
          </tr>
          {filteredData.map((item, index) => (
            <tr key={index}>
              <td>{item.EMPRESA}</td>
              <td>{item.MARCA}</td>
              <td>{item.NOMBRE_SN}</td>
              <td>{item.FECHA_MAXIMA}</td>
              {/* <td>
                    <InputText
                      type="date"
                      value={fechaFormateada(valoresEditados.FECHA_MAXIMA)}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          FECHA_MAXIMA: fechaFormateada(e.target.value),
                        }))
                      }
                    ></InputText>
                  </td> */}
              {editando === item ? (
                <>
                  <td>
                    <InputText
                      type="text"
                      value={valoresEditados.LEAD_TIME}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          LEAD_TIME: e.target.value,
                        }))
                      }
                    ></InputText>
                  </td>
                  <td>
                    <InputText
                      type="text"
                      value={valoresEditados.NIVEL_SERVICIO}
                      onChange={(e) =>
                        setValoresEditados((prev) => ({
                          ...prev,
                          NIVEL_SERVICIO: e.target.value,
                        }))
                      }
                    ></InputText>
                  </td>
                </>
              ) : (
                <>
                  <td>{item.LEAD_TIME}</td>
                  <td>{item.NIVEL_SERVICIO * 100 + "%"}</td>
                </>
              )}
              <td>
                {editando === item ? (
                  <BotonEditar variant="g" onClick={() => guardarCambios()}>
                    Save
                  </BotonEditar>
                ) : (
                  <BotonEditar variant="e" onClick={() => editarFila(item)}>
                    Edit
                  </BotonEditar>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorPadre>
  );
}
