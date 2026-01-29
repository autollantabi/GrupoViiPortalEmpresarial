import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { TablaAnticipos } from "./ComponentesAnticipos/TablaAnticipos";
import {
  CampoFiltro,
  CampoFiltroporFecha,
} from "./ComponentesAnticipos/FiltrosAnticipos";
import { ListarImportaciones } from "services/importacionesService";
import { FiltroGlobalDesplegable } from "./ComponentesAnticipos/FiltroGlobalDesplegable";

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
const BotonCrearNuevo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-perla);
  border-radius: 5px;
  padding: 1px;
  gap: 1px;
  font-size: 14px;
  cursor: pointer;
  & > .icon {
    border-radius: 4px 0 0 4px;
    padding: 2px 8px;
    background-color: var(--secondary);
    color: var(--color-perla);
  }
  & > .text {
    border-radius: 0 4px 4px 0;
    padding: 2px 8px;
    background-color: var(--secondary);
    color: var(--color-perla);
  }
`;
const ContenedorTabla = styled.div`
  display: flex;
  align-items: start;
  justify-content: start;
  width: 100%;
  height: 100%;
  overflow-y: auto;
`;

const BotonRecargar = styled.button`
  border: none;
  outline: none;
  border-radius: 5px;
  height: 28px;
  width: 28px;
  display: flex;
  justify-content: content;
  align-items: center;
`;

export const Anticipos = () => {
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
    {
      filtro: "ETD",
      valor: {
        months: [],
        year: null,
      },
    },
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
    const res = await ListarImportaciones();
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
  const handleChangeFecha = (indice, nuevoValor) => {
    setFiltrosActivos((filtrosActuales) =>
      filtrosActuales.map((filtro) =>
        filtro.filtro === indice
          ? {
              ...filtro,
              valor: {
                months: nuevoValor.months, // Se espera que sea un array de meses
                year: nuevoValor.year, // Se espera que sea el año seleccionado o null
              },
            }
          : filtro
      )
    );
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
          <CampoFiltro
            nombre={"Marca"}
            nombreColumnaFiltro={"MARCA"}
            options={extractUniqueValues(data, "MARCA")}
            onChange={handleChangeFilter}
          />
          <CampoFiltroporFecha
            onChange={handleChangeFecha}
            numFiltro={"FECHA_CREACION"}
            nombre={"Fecha Creación"}
          />
          <FiltroGlobalDesplegable
            value={filtroGlobal.value}
            onChangeValue={handleChangeGlobalValue}
            onChangeCampo={handleChangeGlobalCampo}
          />
        </ContenedorFiltros>
      </ContenedorFiltrosP>
      <ContenedorTabla>
        {data.length > 0 ? (
          <TablaAnticipos
            filtrosActivos={filtrosActivos}
            filtroGlobal={filtroGlobal}
            dataImportacion={data}
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
