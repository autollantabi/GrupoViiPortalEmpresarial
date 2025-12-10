import React from "react";
import { InputText } from "assets/styles/StyledComponents/Inputs";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";

export const FiltroGlobal = (props) => {
  // const [filtro, setFiltro] = useState("");
  //Obtener el usuario buscado
  const buscarCadena = (filtro) => {
    const filteredData = getFilteredData(filtro);
    props.setData(filteredData);
  };

  //Obtener data de los usuarios con un filtro para poder ponerlos en string a todos y en minusculas
  const getFilteredData = (valor) => {
    return props.data.filter((item) => {
      const valuesToSearch = Object.values(item).join(" ").toLowerCase();
      return valuesToSearch.includes(valor.toLowerCase());
    });
  };
  return (
    <ContenedorPadre alineacion="center">
      {props.title && <span style={{ padding: "0px" }}>Filtro Global: </span>}
      
      <InputText
        largo={"180px"}
        onChange={(e) => buscarCadena(e.target.value)}
        placeholder="Buscar..."
      ></InputText>
    </ContenedorPadre>
  );
};
