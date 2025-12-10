import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { CampoFiltro } from "./ComponentesCreditos/FiltrosCreditos";
import { TablaCreditos } from "./ComponentesCreditos/TablaCreditos";
import { FiltroGlobalDesplegable } from "./ComponentesCreditos/FiltroGlobalDesplegable";
import {
  EjecutarBatImportaciones,
  ListarImportaciones,
} from "services/importacionesService";
import { ListarCreditosProveedores } from "services/creditosService";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";

const ContenedorPrincipal = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  flex-direction: column;
  width: 100%;
  position: relative;
`;
const ContenedorFiltrosP = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  flex-direction: row;
  padding: 5px;
  border-bottom: solid 1px #cfcfcf;
  width: 100%;
  gap: 15px;
`;
const ContenedorFiltros = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: start;
  flex-direction: row;
  gap: 10px;
`;

const ContenedorTabla = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;


export const Creditos = () => {
  const [data, setData] = useState([]);
  const [filtroGlobal, setFiltroGlobal] = useState({
    value: "",
    campo: "",
  });
  const [filtrosActivos, setFiltrosActivos] = useState([
    {
      filtro: "EMPRESA",
      valor: [],
    },
    {
      filtro: "MARCA",
      valor: [],
    },
    {
      filtro: "PROVEEDOR",
      valor: [],
    },
    // {
    //   filtro: 6,
    //   valor: {
    //     months: [],
    //     year: null,
    //   },
    // },
  ]);

  function extractUniqueValues(data, key) {
    const uniqueValues = {};
    let nextValueIndex = 0; // Índice secuencial para cada valor único

    data.forEach((item) => {
      const combinedValues = item[key];
      if (combinedValues) {
        // Dividir los valores por coma y eliminar espacios en blanco extra
        const values = combinedValues.split(";").map((value) => value.trim());
        values.forEach((value) => {
          if (value && !(value in uniqueValues)) {
            uniqueValues[value] = nextValueIndex++; // Asignar un índice secuencial y aumentarlo
          }
        });
      }
    });

    // Convertir el objeto de valores únicos en un arreglo de objetos con 'value' y 'name'
    const result = Object.keys(uniqueValues).map((name) => ({
      value: uniqueValues[name],
      name: name,
    }));

    return result;
  }

  const ConsultarImportacionesDatos = async () => {
    const res = await ListarCreditosProveedores();
    if (res.length > 0) {
      setData(res);
    }
  };

  useEffect(() => {
    ConsultarImportacionesDatos();
  }, []);

  const handleChangeGlobalValue = (nuevoValor) => {
    setFiltroGlobal((filtro) => ({
      ...filtro,
      value: nuevoValor,
    }));
  };
  const handleChangeGlobalCampo = (nuevoCampo) => {
    setFiltroGlobal((filtro) => ({
      ...filtro,
      campo: nuevoCampo,
    }));
  };
  const handleChangeFilter = (indice, nuevoValor) => {
    setFiltrosActivos((filtrosActuales) =>
      filtrosActuales.map((filtro) =>
        filtro.filtro === indice
          ? {
              ...filtro,
              valor: nuevoValor !== "" ? nuevoValor.split("; ") : [],
            }
          : filtro
      )
    );
  };

  const OnClickEjecutarBat = async () => {
    const res = await EjecutarBatImportaciones();
    if (res) {
      ConsultarImportacionesDatos();
      return true;
    } else {
      return false;
    }
  };

  return (
    <ContenedorPrincipal>
      <ContenedorFiltrosP>
        <ContenedorFiltros>
          <CampoFiltro
            nombre={"Empresa"}
            nombreColumnaFiltro={"EMPRESA"}
            options={extractUniqueValues(data, "EMPRESA")}
            onChange={handleChangeFilter}
          />
          <CampoFiltro
            nombre={"Proveedor"}
            nombreColumnaFiltro={"PROVEEDOR"}
            options={extractUniqueValues(data, "PROVEEDOR")}
            onChange={handleChangeFilter}
          />
          {/* <CampoFiltro
            nombre={"Marca"}
            nombreColumnaFiltro={"MARCA"}
            options={extractUniqueValues(data, "MARCA")}
            onChange={handleChangeFilter}
          /> */}
          <FiltroGlobalDesplegable
            value={filtroGlobal.value}
            onChangeValue={handleChangeGlobalValue}
            onChangeCampo={handleChangeGlobalCampo}
          />
        </ContenedorFiltros>
        <ContenedorFiltros>
          <CustomButton
            iconLeft={"FaSyncAlt"}
            onClick={OnClickEjecutarBat}
          />
        </ContenedorFiltros>
      </ContenedorFiltrosP>
      <ContenedorTabla>
        {data.length > 0 ? (
          <TablaCreditos
            filtrosActivos={filtrosActivos}
            filtroGlobal={filtroGlobal}
            data={data}
          />
        ) : (
          <span
            style={{ width: "100%", textAlign: "center", paddingTop: "15px" }}
          >
            NO DATA
          </span>
        )}
      </ContenedorTabla>
    </ContenedorPrincipal>
  );
};
