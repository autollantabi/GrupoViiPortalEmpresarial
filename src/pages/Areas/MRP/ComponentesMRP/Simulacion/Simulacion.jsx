import React, { useEffect, useState } from "react";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { Boton } from "assets/styles/StyledComponents/Botones";
import { TablaJson } from "../TablaJsonSimulaciones";
import { Loader } from "components/UI/Componentes/Loader";
import {
  DividerContainer,
  VerticalDivider,
} from "assets/styles/StyledComponents/Divisor";
import { FiltroGlobal } from "../FiltroGlobal";
import {ExportToExcel} from "components/UI/Componentes/ExportarAExcel";
import {
  ListarEmpresas,
  ListarMarcas,
  Simular,
} from "services/empresasMRPService";
import { SelectsMRP } from "../Componentes/SelectsMRP";
import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";

// const inicial = {
//   IDENTIFICADOR_EMPRESA: "",
//   IDENTIFICADOR_MARCA: "",
//   IDENTIFICADOR_CUENTA: "",
// };
const sel = {
  EMPRESA: "",
  MARCA: "",
};
const columnasAOcultar = [
  "IDENTIFICADOR_PRODUCTO",
  "IDENTIFICADOR_MARCA",
  "NOMBRE_MARCA",
  "EMPRESA",
  "IDENTIFICADOR_EMPRESA",
  "CODIGO",
  "BLOQUEADO_PARA_COMPRA",
  "NUEVO_PEDIDO_SUGERIDO",
];

const columPersonalizadas = {
  NOMBRE_PRODUCTO: "DESCRIPCIÓN",
  CODIGO_BARRAS: "BARRAS",
  DISENIO: "DISEÑO",
  ANTIGUEDAD: "ANT.",
  UNIDADES_1ANIO: "UN (#) - AÑO",
  MAXIMO_UNIDADES_1_ANIO: "PICO ULT. AÑO X FAC.",
  DIF_MAX_ANIO_TOT_ANIO: "DIF. MAX AÑO vs TOT. AÑO",
  DIAS_INV_1ANIO: "DIAS INV 1 AÑO",
  DEMANDA_MES_ANIO: "DEMANDA MES - AÑO",
  UNIDADES_100D: "UN (#) - 100D",
  DIAS_INV_100D: "DIAS INV 100D",
  DEMANDA_100D: "DEMANDA MES - 100D",
  Variacion: "% VAR",
  UNIDADES_MES_ACTUAL: "UN (#) - MES ACT.",
  STOCK: "EN STOCK",
  TRANSITOS_30D: "TRAN. 30D",
  TRANSITOS_60D: "TRAN. 60D",
  PEDIDOS: "PEDIDOS",
  MESES_INV_TOTAL: "MES. INV. TOTAL",
  STOCK_TOTAL: "STOCK TOTAL",
  INVENTARIO_SEGURIDAD: "INV. SEGU",
  INVENTARIO_OPTIMO: "INV. OPT",
  SUGERIDO_COMPRA: "SUGERIDO COMPRA",
  ULTIMO_FOB: "ULT. FOB",
  COSTO_PROMEDIO: "COSTO PROM.",
  ULTIMO_COSTO: "ULT. COSTO",
  PRECIO_LISTA_A: "P. LISTA",
  PRC_LIST_ULT_COSTO: "P.LISTA VS ULT.COSTO",
};
export const Simulacion = () => {
  const [empresas, setEmpresas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [seleccion, setSeleccion] = useState(sel);
  const [seleccionNombre, setSeleccionNombre] = useState(sel);
  const [datosSimulacion, setDatosSimulacion] = useState([]);
  const [datosSinTotal, setDatosSinTotal] = useState([]);
  const [datosOriginalesSimulacion, setDatosOriginalesSimulacion] = useState(
    []
  );
  const [mostrarLoader, setMostrarLoader] = useState(false);
  const [cadenaBusqueda, setCadenaBusqueda] = useState("");

  function transformarDatosEM(originales) {
    return originales.map((item) => ({
      value: item.IDENTIFICADOR,
      name: item.EMPRESA,
    }));
  }
  function transformarDatosMR(originales) {
    return originales.map((item) => ({
      value: item.IDENTIFICADOR_MARCA,
      name: item.MARCA,
    }));
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listEmp = await ListarEmpresas();
        setEmpresas(transformarDatosEM(listEmp));
      } catch (error) {}
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (seleccion.EMPRESA !== "") {
      const fetchData = async () => {
        try {
          const listMarca = await ListarMarcas(parseInt(seleccion.EMPRESA));
          setMarcas(transformarDatosMR(listMarca));
        } catch (error) {}
      };
      fetchData();
    }
  }, [seleccion]);

  const handleSimular = async (iempresa, imarca) => {
    try {
      setMostrarLoader(true);
      iempresa = seleccion.EMPRESA;
      imarca = seleccion.MARCA;
      const datos = await Simular(iempresa, imarca);
      setDatosOriginalesSimulacion(datos);
      const datosSinTot = datos.filter(
        (fila) => fila.NOMBRE_PRODUCTO !== "TOTAL"
      );
      // console.log(datosSinTot)
      setDatosSinTotal(datosSinTot);
      setDatosSimulacion(datosSinTot);
    } catch (error) {
      console.error("Error al simular:", error);
    } finally {
      setMostrarLoader(false);
    }
  };
  const onChangeOption = (campo, valorID, valorNM) => {
    // console.log("=-", campo);
    setSeleccion({
      ...seleccion,
      [campo]: valorID,
    });
    setSeleccionNombre({
      ...seleccionNombre,
      [campo]: valorNM,
    });
  };

  const limpiarDataSim = () => {
    setDatosSimulacion([]);
    setDatosOriginalesSimulacion([]);
  };

  const filaTotal = () => {
    return datosOriginalesSimulacion.filter(
      (fila) => fila.NOMBRE_PRODUCTO === "TOTAL"
    );
  };

  return (
    <ContenedorFlex
      style={{
        height: "100%",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <ContenedorPadre direccion="r" style={{ justifyContent: "start" }}>
        <FiltroGlobal
          data={datosSinTotal}
          setData={setDatosSimulacion}
          setCadenaBusqueda={setCadenaBusqueda}
        />
        <DividerContainer>
          <VerticalDivider />
        </DividerContainer>
        <div style={{ display: "flex", gap: "15px" }}>
          <SelectsMRP
            isMultiple={false}
            options={empresas}
            nombreCampo={"EMPRESA"}
            nombre={"Empresa"}
            onChange={onChangeOption}
            limpiarDS={() => limpiarDataSim()}
            seleccionID={seleccion}
            seleccionNM={seleccionNombre}
          />

          {seleccion.EMPRESA !== "" && (
            <SelectsMRP
              isMultiple={false}
              options={marcas}
              nombreCampo={"MARCA"}
              nombre={"Marca"}
              onChange={onChangeOption}
              limpiarDS={() => limpiarDataSim()}
              seleccionID={seleccion}
              seleccionNM={seleccionNombre}
            />
          )}
        </div>
        {seleccion.EMPRESA !== "" && seleccion.MARCA !== "" && (
          <ContenedorPadre alineacion={"center"}>
            <Boton onClick={() => handleSimular()}>SIMULAR</Boton>
          </ContenedorPadre>
        )}
        <DividerContainer>
          <VerticalDivider />
        </DividerContainer>
        {datosSimulacion.length > 0 && (
          <ExportToExcel
            data={datosSimulacion}
            filename={`SIMULACION_${seleccionNombre.EMPRESA}_${
              seleccionNombre.MARCA
            }${cadenaBusqueda !== "" ? `_${cadenaBusqueda}` : ""}`}
            columnasOcultas={columnasAOcultar}
            nombresPersonalizados={columPersonalizadas}
            filaFinal={filaTotal()}
            habilitarBoton={datosSimulacion.length > 0 ? false : true}
          />
        )}
      </ContenedorPadre>
      <div
        style={{
          height: "100%",
          overflowX: "auto",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {mostrarLoader ? (
          <Loader />
        ) : (
          // datosSimulacion.length !== 0 && (
          <TablaJson
            jsonData={datosSimulacion}
            columnasOcultas={columnasAOcultar}
            modulo="MRPSimulacion"
            nombresPersonalizados={columPersonalizadas}
            filaTotal={filaTotal()}
          />
          // )
        )}
      </div>
    </ContenedorFlex>
  );
};
