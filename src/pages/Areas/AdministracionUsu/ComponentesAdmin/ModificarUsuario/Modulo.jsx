import React, { useState, useEffect } from "react";
import { ListarModulos } from "services/administracionService";
import {
  ContenedorFlex,
  ContenedorFlexColumn,
} from "../../CSS/ComponentesAdminSC";
import { GenericInputStyled } from "components/UI/ComponentesGenericos/Inputs";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

export const Modulo = (props) => {
  const [modulos, setmodulos] = useState([]);
  const [bmod, setbmod] = useState("");

  //Obtener el modulo buscado
  const buscarModulo = () => {
    const filteredData = getFilteredData(bmod);
    return filteredData;
  };

  //Obtener data de los modulos con un filtro para poder ponerlos en string a todos y en minusculas
  const getFilteredData = (valor) => {
    return modulos.filter((user) => {
      const valuesToSearch = user.MODULO.toString();
      return valuesToSearch.toLowerCase().includes(valor.toLowerCase());
    });
  };

  //Cada vez que escriba en el buscar Usuario debe cabiar la variable busu
  const handleChangeMod = (texto) => {
    setbmod(texto);
  };

  //Consulta de los usuarios en el backend para listarlos
  const ListarModulosQ = async () => {
    let res = await ListarModulos();
    res = res.filter((item) => item.PADRE === 0);
    setmodulos(res);
  };

  //Asignar Modulo al usuario
  const asignarModulo = (item, itemid) => {
    props.setearModulo(item, itemid);
  };

  useEffect(() => {
    ListarModulosQ();
  }, []);

  return (
    <ContenedorFlexColumn
      style={{
        boxShadow: "0 0 7px gray",
        padding: "10px",
        borderRadius: "5px",
      }}
    >
      <ContenedorFlex>
        Buscar Módulo:
        <GenericInputStyled
          type="text"
          onChange={(e) => handleChangeMod(e.target.value)}
        />
      </ContenedorFlex>

      <ContenedorFlex
        style={{
          flexWrap: "wrap",
          maxWidth: "55vw",
          minWidth: "55vw",
          border: "solid 1px gray",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        {buscarModulo().map((modulo, index) => (
          <ContenedorFlex
            style={{
              boxShadow: "0 0 7px gray",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <span>{modulo.MODULO}</span>
            <span>
              <CustomButton
                iconLeft={"FaEdit"}
                onClick={() => {
                  asignarModulo(modulo.MODULO, modulo.IDENTIFICADOR);
                }}
                style={{ padding: "3px 6px" }}
              />
            </span>
          </ContenedorFlex>
        ))}
      </ContenedorFlex>
    </ContenedorFlexColumn>
  );
};
