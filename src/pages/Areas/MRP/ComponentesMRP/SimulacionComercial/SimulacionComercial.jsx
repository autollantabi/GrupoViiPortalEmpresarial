import React, { useEffect, useState } from "react";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { Boton } from "assets/styles/StyledComponents/Botones";
import { Loader } from "components/UI/Componentes/Loader";
import {
  DividerContainer,
  VerticalDivider,
} from "assets/styles/StyledComponents/Divisor";
import { FiltroGlobal } from "../FiltroGlobal";
import {
  ConsultarEstadoPedidoComercial,
  FinalizarPedidoComercial,
  GetCodItemsPedidosComercial,
  ListarEmpresas,
  ListarMarcas,
  Simular,
} from "services/empresasMRPService";
import { TablaJsonSimComercial } from "../TablaJsonSimulaciones";
import { SelectsMRP } from "../Componentes/SelectsMRP";
import styled from "styled-components";
import { PopUpEdicion } from "./PopUpEdicion";
import { PopUpFinalizar } from "./PopUpFinalizar";
const BotonFinalizarPedidos = styled.button`
  border-radius: 8px;
  padding: 3px 8px;
  outline: none;
  border: solid 2px var(--secondary);
  color: var(--secondary);
  transition: all 0.3s ease;
  &:hover {
    transform: scale(1.02);
  }
`;
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
  "CODIGO_BARRAS",
  "NOMBRE_MARCA",
  "EMPRESA",
  "IDENTIFICADOR_EMPRESA",
  "DIF_MAX_ANIO_TOT_ANIO",
  "ULTIMO_FOB",
  "ULTIMO_COSTO",
  "COSTO_PROMEDIO",
  "PRECIO_LISTA_A",
  "PRC_LIST_ULT_COSTO",
  "NUEVO_IDENTIFICADOR",
  "INVENTARIO_SEGURIDAD",
  "INVENTARIO_OPTIMO",
];

const ordenColumnas = [
  "NOMBRE_PRODUCTO",
  "CODIGO_BARRAS",
  "DISENIO",
  "DEMANDA_TOP",
  "ANTIGUEDAD",
  "UNIDADES_1ANIO",
  "MAXIMO_UNIDADES_1_ANIO",
  "DIAS_INV_1ANIO",
  "DEMANDA_MES_ANIO",
  "UNIDADES_100D",
  "DIAS_INV_100D",
  "DEMANDA_100D",
  "Variacion",
  "UNIDADES_MES_ACTUAL",
  "STOCK",
  "TRANSITOS_30D",
  "TRANSITOS_60D",
  "PEDIDOS",
  "STOCK_TOTAL",
  "MESES_INV_TOTAL",
  "INVENTARIO_SEGURIDAD",
  "INVENTARIO_OPTIMO",
  "SUGERIDO_COMPRA",
];

const columPersonalizadas = {
  NOMBRE_PRODUCTO: "DESCRIPCIÓN",
  CODIGO_BARRAS: "#",
  DISENIO: "DIS.",
  DEMANDA_TOP: "TOP",
  ANTIGUEDAD: "ANT.",
  UNIDADES_1ANIO: "# - AÑO",
  MAXIMO_UNIDADES_1_ANIO: "PICO ULT. AÑO X FAC.",
  // DIF_MAX_ANIO_TOT_ANIO: "DIF. MAX AÑO vs TOT. AÑO",
  DIAS_INV_1ANIO: "DIAS INV 1 AÑO",
  DEMANDA_MES_ANIO: "DEM. MES - AÑO",
  UNIDADES_100D: "# - 100D",
  DIAS_INV_100D: "DIAS INV 100D",
  DEMANDA_100D: "DEM. MES - 100D",
  Variacion: "% VAR",
  UNIDADES_MES_ACTUAL: "# - MES ACT.",
  STOCK: "STOCK",
  TRANSITOS_30D: "TRAN. 30D",
  TRANSITOS_60D: "TRAN. 60D",
  PEDIDOS: "PED.",
  MESES_INV_TOTAL: "MES. INV. TOTAL",
  STOCK_TOTAL: "STOCK TOTAL",
  INVENTARIO_SEGURIDAD: "INV. SEGU",
  INVENTARIO_OPTIMO: "INV. OPT",
  SUGERIDO_COMPRA: "SUG. COMPRA",
  // ULTIMO_FOB: "ULT. FOB",
  // COSTO_PROMEDIO: "COSTO PROM.",
  // ULTIMO_COSTO: "ULT. COSTO",
  // PRECIO_LISTA_A: "P. LISTA",
  // PRC_LIST_ULT_COSTO: "P.LISTA VS ULT.COSTO",
};

const arregloEnCasoDeNoHaberDatosConFiltro = [
  {
    CODIGO: 9999999999,
  },
];
export const SimulacionComercial = () => {
  const [empresas, setEmpresas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [seleccion, setSeleccion] = useState(sel);
  const [seleccionNombre, setSeleccionNombre] = useState(sel);
  const [datosSimulacion, setDatosSimulacion] = useState([]);
  const [datosSinTotal, setDatosSinTotal] = useState([]);
  const [datosOriginalesSimulacion, setDatosOriginalesSimulacion] = useState(
    []
  );
  // const [sugeridosGrad, setSugeridosGrad] = useState({});
  const [mostrarLoader, setMostrarLoader] = useState(false);
  // const [cadenaBusqueda, setCadenaBusqueda] = useState("");
  const [filtro, setFiltro] = useState(0);
  const [datosSimulacionFiltro, setDatosSimulacionFiltro] = useState([]);
  const [confirmacionFinPedidos, setConfirmacionFinPedidos] = useState(false);
  const [mostrarVolverAEditar, setMostrarVolverAEditar] = useState(false);
  const [mostrarFinalizacionFaltante, setMostrarFinalizacionFaltante] =
    useState(false);

  const guardarSugeridosLocal = (sug) => {
    // console.log(sug);
    // setSugeridosGrad(sug);
    let pedComercial = {
      EMPRESA: seleccionNombre.EMPRESA,
      MARCA: seleccionNombre.MARCA,
      SUGERIDOS: sug,
    };
    // console.log(pedComercial);
    localStorage.setItem("SUGERIDOS", JSON.stringify(pedComercial));
    // const sug1 = localStorage.getItem("SUGERIDOS");
    // console.log(JSON.parse(sug1));
  };
  const finalizarPedidos = () => {
    // const sug1 = localStorage.getItem("SUGERIDOS");

    setConfirmacionFinPedidos(true);

    // localStorage.removeItem("SUGERIDOS");
  };

  const EjecFinalizarPedidoComercial = async (value) => {
    const usrLocal = localStorage.getItem("identificador");

    const res = await FinalizarPedidoComercial({
      codigoEmpresa: seleccion.EMPRESA,
      codigoMarca: seleccion.MARCA,
      usuario: usrLocal,
      actualizar: value,
    });

    console.log(res ? "Actualizado" : "Error");
  };

  const consultarSiExistenIncompletos = async () => {
    const res = await GetCodItemsPedidosComercial();

    // Función para filtrar los detalles que no están en los códigos de items
    function filtrarDetallesExcluidos(items, detalles) {
      const codigos = items.map((item) => item.codItem); // Extraer todos los códigos de `items`
      return detalles.filter((detalle) => !codigos.includes(detalle.CODIGO));
    }
    const datos = filtrarDetallesExcluidos(res, datosSimulacion);
    const datosF = datos.length > 0 ? datos : [];
    return datosF;
  };
  const finalizarPedidosConfirmacion = async () => {
    // const sug1 = localStorage.getItem("SUGERIDOS");
    const resp = await consultarSiExistenIncompletos();
    let conf = resp.length > 0;
    if (conf) {
      setMostrarFinalizacionFaltante(true);
      setConfirmacionFinPedidos(false);
    } else {
      setSeleccion(sel);
      setSeleccionNombre(sel);
      setFiltro(0);
      setDatosSimulacion([]);
      setDatosSimulacion([]);
      setDatosSinTotal([]);
      setDatosOriginalesSimulacion([]);
      setConfirmacionFinPedidos(false);

      EjecFinalizarPedidoComercial(0);
    }

    // console.log(JSON.parse(sug1));
  };
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
        const empresasLocalStorage = JSON.parse(
          localStorage.getItem("modulos")
        );
        const empresasMRP = empresasLocalStorage.data.filter(
          (empresaLS) => empresaLS.MODULO === "MRP"
        );

        const empresasFiltradas = listEmp.filter((empresa) => {
          return empresasMRP.some(
            (empresaLS) => empresaLS.NOMBRE_EMPRESA === empresa.EMPRESA
          );
        });

        setEmpresas(transformarDatosEM(empresasFiltradas));
        // console.log(empresasFiltradas);
      } catch (error) {}
    };
    fetchData();
  }, []);
  useEffect(() => {
    if (seleccion.EMPRESA !== "") {
      const fetchData = async () => {
        try {
          const listMarca = await ListarMarcas(parseInt(seleccion.EMPRESA));
          // console.log(listMarca);
          setMarcas(transformarDatosMR(listMarca));
        } catch (error) {}
      };
      fetchData();
    }
  }, [seleccion]);

  const ejecutarSimulacion = async () => {
    try {
      setMostrarLoader(true);
      setFiltro(0);
      let iempresa = seleccion.EMPRESA;
      let imarca = seleccion.MARCA;
      const datos = await Simular(iempresa, imarca);
      setDatosOriginalesSimulacion(datos);
      const datosSinTot = datos.filter(
        (fila) => fila.NOMBRE_PRODUCTO !== "TOTAL"
      );
      // console.log(datosSinTot)
      setDatosSinTotal(datosSinTot);
      // console.log(datosSinTot);
      setDatosSimulacion(datosSinTot);
    } catch (error) {
      console.error("Error al simular:", error);
    } finally {
      setMostrarLoader(false);
    }
  };

  const handleSimular = async () => {
    const resF = await ConsultarEstadoPedidoComercial({
      codigoEmpresa: seleccion.EMPRESA,
      codigoMarca: seleccion.MARCA,
    });
    //Editar para lo de verificar si ya se ha guardado el pedido sugerido

    if (resF === 1) {
      setMostrarVolverAEditar(true);
    } else {
      ejecutarSimulacion();
    }
  };

  const filaTotal = () => {
    return datosOriginalesSimulacion.filter(
      (fila) => fila.NOMBRE_PRODUCTO === "TOTAL"
    );
  };

  const onChangeOption = (campo, valorID, valorNM) => {
    // console.log("=-", campo);
    limpiarDataSim();
    setFiltro(0);
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

  const SetearFiltroIC = (value) => {
    if (value === filtro) {
      setFiltro(3);
    } else {
      setFiltro(value);
    }
  };
  const ConsultarCodItems = async (filtro) => {
    const res = await GetCodItemsPedidosComercial();

    // Función para filtrar los detalles basándose en los códigos de items
    function filtrarDetalles(items, detalles) {
      const codigos = items.map((item) => item.codItem); // Extraer todos los códigos de `items`
      return detalles.filter((detalle) => codigos.includes(detalle.CODIGO));
    }

    // Función para filtrar los detalles que no están en los códigos de items
    function filtrarDetallesExcluidos(items, detalles) {
      const codigos = items.map((item) => item.codItem); // Extraer todos los códigos de `items`
      return detalles.filter((detalle) => !codigos.includes(detalle.CODIGO));
    }

    if (filtro === 1) {
      //filtro para los que estan incompletos
      const datos = filtrarDetallesExcluidos(res, datosSimulacion);
      const datosF =
        datos.length > 0 ? datos : arregloEnCasoDeNoHaberDatosConFiltro;
      setDatosSimulacionFiltro(datosF);
    } else if (filtro === 2) {
      //filtro para los que estan completos
      const datos = filtrarDetalles(res, datosSimulacion);
      const datosF =
        datos.length > 0 ? datos : arregloEnCasoDeNoHaberDatosConFiltro;
      setDatosSimulacionFiltro(datosF);
    } else if (filtro === 3) {
      setDatosSimulacionFiltro([]); // Limpiar los datos filtrados
    }
  };

  useEffect(() => {
    if (filtro !== 0) {
      ConsultarCodItems(filtro);
    }
  }, [filtro]);

  return (
    <ContenedorPadre direccion="c">
      {mostrarVolverAEditar && (
        <PopUpEdicion
          cerrar={setMostrarVolverAEditar}
          correrSimulacion={ejecutarSimulacion}
          actualizarEstado={EjecFinalizarPedidoComercial}
          empMarca={seleccionNombre}
        />
      )}
      {mostrarFinalizacionFaltante && (
        <PopUpFinalizar cerrar={setMostrarFinalizacionFaltante} />
      )}
      <ContenedorPadre
        direccion="r"
        style={{ justifyContent: "start", padding: "0 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: "row",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <FiltroGlobal
              data={datosSinTotal}
              setData={setDatosSimulacion}
              // setCadenaBusqueda={setCadenaBusqueda}
            />
            <div
              style={{
                width: "1px",
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                height: "40px",
                margin: "0 15px",
              }}
            ></div>
            {/* <DividerContainer>
              <VerticalDivider />
            </DividerContainer> */}
            {datosSimulacion.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    justifyContent: "start",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    name="incomp"
                    id="incomp"
                    checked={filtro === 1}
                    onChange={() => {
                      SetearFiltroIC(1);
                    }}
                  />
                  <label htmlFor="incomp">Incompletos</label>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    justifyContent: "start",
                    alignItems: "center",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    name="comp"
                    id="comp"
                    checked={filtro === 2}
                    onChange={() => {
                      SetearFiltroIC(2);
                    }}
                  />
                  <label htmlFor="comp">Completos</label>
                </div>
              </div>
            )}

            {datosSimulacion.length > 0 && (
              <div
                style={{
                  width: "1px",
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
                  height: "40px",
                  margin: "0 15px",
                }}
              ></div>
            )}

            {/* <DividerContainer>
              <VerticalDivider />
            </DividerContainer> */}
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
                <Boton onClick={() => handleSimular()}>GENERAR</Boton>
              </ContenedorPadre>
            )}
            <DividerContainer>
              <VerticalDivider />
            </DividerContainer>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "start",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            {datosSimulacion.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {confirmacionFinPedidos ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      fontSize: "13px",
                      gap: "2px",
                    }}
                  >
                    <label htmlFor="">¿Seguro desea finalizar?</label>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "stretch",
                        alignItems: "center",
                        flexDirection: "row",
                        gap: "5px",
                        width: "100%",
                      }}
                    >
                      <button
                        style={{
                          width: "100%",
                          border: "solid 1px var(--secondary)",
                          outline: "none",
                          borderRadius: "5px",
                          color: "var(--secondary)",
                        }}
                        onClick={() => {
                          finalizarPedidosConfirmacion();
                        }}
                      >
                        SI
                      </button>
                      <button
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          borderRadius: "5px",
                          color: "gray",
                        }}
                        onClick={() => {
                          setConfirmacionFinPedidos(false);
                        }}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                ) : (
                  <BotonFinalizarPedidos onClick={() => finalizarPedidos()}>
                    Finalizar Pedidos
                  </BotonFinalizarPedidos>
                )}
              </div>
            )}
          </div>
        </div>
      </ContenedorPadre>
      {seleccionNombre.EMPRESA !== "" && seleccionNombre.MARCA !== "" && (
        <div style={{ fontWeight: "bold", padding: "0 5px" }}>
          {seleccionNombre.EMPRESA} | {seleccionNombre.MARCA}
        </div>
      )}
      <div
        style={{
          height: "80dvh",
          overflowX: "auto",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {mostrarLoader ? (
          <Loader />
        ) : (
          // datosSimulacion.length !== 0 && (
          <TablaJsonSimComercial
            jsonData={
              datosSimulacionFiltro.length > 0
                ? datosSimulacionFiltro
                : datosSimulacion
            }
            columnasOcultas={columnasAOcultar}
            actualizarTabla={handleSimular}
            modulo="MRPSimulacion"
            nombresPersonalizados={columPersonalizadas}
            ordenColumnas={ordenColumnas}
            guardarGrad={guardarSugeridosLocal}
            filaTotal={filaTotal()}
            empresaMarca={seleccionNombre}
            idEmpresaMarca={seleccion}
          />
          // )
        )}
      </div>
    </ContenedorPadre>
  );
};
