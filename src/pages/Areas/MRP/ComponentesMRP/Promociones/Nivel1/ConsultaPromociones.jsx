import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { SeleccionarAlgo } from "../../SeleccionarAlgo";
import { ListarEmpresas, ConsultarPromocion } from "services/empresasMRPService";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { TablaJsonDesplegable } from "./Dif_Tablas";


const StyledTitle = styled.h3`
  font-size: 1.3rem;
  color: black;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: solid 1px;
`;

// const sel = {
//   EMPRESA: "",
// };

const nueva_cabecera = {
  NOMBRE_PROMOCION: "NOMPRE PROMOCIÓN",
  FECHA_DESDE: "DESDE",
  FECHA_HASTA: "HASTA",
  PROM_ESTADO: "ESTADO"
};
const ocultas = [
  "IDENTIFICADOR_PROMOCION",
  "IDENTIFICADOR_EMPRESA",
  "PRODUCTOS_EN_PROMOCION",
  "EMPRESA",
];

export function ConsultaPromociones() {
  const [empresas, setEmpresas] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState({
    IDENTIFICADOR: "",
    EMPRESA: "",
  });

  const [listaPromociones, setListaPromociones] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listEmp = await ListarEmpresas();
        setEmpresas(listEmp);
      } catch (error) {}
    };
    fetchData();
  }, []);
  const fetchConsulta = async () => {
    try {
      const consultaProm = await ConsultarPromocion(
        empresaSeleccionada.IDENTIFICADOR
      );
      setListaPromociones(consultaProm);
    } catch (error) {}
  };
  useEffect(() => {
    if (empresaSeleccionada.IDENTIFICADOR !== "") {
      fetchConsulta();
    }
  }, [empresaSeleccionada]);

  return (
    <ContenedorPadre direccion="c" alineacion="center">
      <StyledTitle>CONSULTA PROMOCIONES</StyledTitle>
      <ContenedorPadre>
        <SeleccionarAlgo
          tituloSeleccionar="Elegir Empresa"
          options={empresas}
          etiqueta="EMPRESA"
          id="IDENTIFICADOR"
          primeraOpcion="Seleccionar empresa"
          opcionSeleccionada={empresaSeleccionada.IDENTIFICADOR}
          setValor={(nuevoValor) => {
            const selectedItem = empresas.find(
              (item) => item.IDENTIFICADOR.toString() === nuevoValor.toString()
            );
            if (selectedItem !== undefined) {
              setEmpresaSeleccionada({
                ...empresaSeleccionada,
                IDENTIFICADOR: selectedItem.IDENTIFICADOR,
                EMPRESA: selectedItem.EMPRESA,
              });
            } else {
              setEmpresaSeleccionada({
                ...empresaSeleccionada,
                IDENTIFICADOR: "",
                EMPRESA: "",
              });
            }
          }}
        />
      </ContenedorPadre>
      {empresaSeleccionada.IDENTIFICADOR !== "" && (
        <ContenedorPadre>
          <TablaJsonDesplegable
            jsonData={listaPromociones}
            columnasOcultas={ocultas}
            nombresPersonalizados={nueva_cabecera}
            fetchD={fetchConsulta}
          />
        </ContenedorPadre>
      )}
    </ContenedorPadre>
  );
}
