import React, { useState, useEffect } from "react";

import {
  ListarEmpresas,
  ListarMarcas,
  ListarProductosAsignaciones,
  ConsultarAsignaciones,
  AnadirAsignaciones,
} from "services/empresasMRPService";
import { InputProductos } from "../Componentes";
import { SeleccionarAlgo } from "../SeleccionarAlgo";

import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { Boton } from "assets/styles/StyledComponents/Botones";
import { TablaJsonAsignaciones } from "./TablaJsonAsignaciones";
import { FiltroGlobal } from "../FiltroGlobal";

const seccion = "A";
const sel = {
  EMPRESA: "",
  MARCA: "",
};
const columnasAOcultar = [
  "IDENTIFICADOR",
  "IDENTIFICADOR_ANTERIOR",
  "IDENTIFICADOR_NUEVO",
  "IDENTIFICADOR_MARCA",
];

const columnasAOcultarConMarca = [...columnasAOcultar, "MARCA"];

const columPersonalizadas = {
  NOMBRE_ANTERIOR: "PRODUCTO REEMPLAZADO",
  NOMBRE_NUEVO: "PRODUCTO SUSTITUTO",
};

export function Asignacion() {
  const var1 = { IDENTIFICADOR: "", NOMBRE_PRODUCTO: "" };
  const [filtro1, setFiltro1] = useState(var1);
  const [filtro2, setFiltro2] = useState(var1);

  const [empresas, setEmpresas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [seleccion, setSeleccion] = useState(sel);
  const [seleccionNombre, setSeleccionNombre] = useState(sel);

  const [producto1, setProducto1] = useState(var1);
  const [producto2, setProducto2] = useState(var1);
  const [producto1final, setProducto1Final] = useState(var1);
  const [producto2final, setProducto2Final] = useState(var1);

  const [datosTabla, setDatosTabla] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [mensajeErrorAsignar, setMensajeErrorAsignar] = useState("");

  const getDataFilter1 = () => {
    const excluir = producto2final ? producto2final.IDENTIFICADOR : "";
    var filteredData = productos.filter(
      (prod) =>
        prod.NOMBRE_PRODUCTO.includes(filtro1.NOMBRE_PRODUCTO) &&
        prod.IDENTIFICADOR !== excluir
    );
    return filteredData;
  };
  const getDataFilter2 = () => {
    const excluir = producto1final ? producto1final.IDENTIFICADOR : "";
    var filteredData = productos.filter(
      (prod) =>
        prod.NOMBRE_PRODUCTO.includes(filtro2.NOMBRE_PRODUCTO) &&
        prod.IDENTIFICADOR !== excluir
    );
    return filteredData;
  };

  const setData1 = (e) => {
    setFiltro1((prev) => ({ ...prev, NOMBRE_PRODUCTO: e }));
  };

  const setData2 = (e) => {
    setFiltro2((prev) => ({ ...prev, NOMBRE_PRODUCTO: e }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listEmp = await ListarEmpresas();
        setEmpresas(listEmp);
      } catch (error) {}
    };
    fetchData();
  }, []);

  const fetchTablaAsignaciones = async () => {
    const dataT = await ConsultarAsignaciones(
      seleccion.EMPRESA,
      seleccion.MARCA
    );
    setDatosTabla(dataT);
    setFilteredData(dataT);
  };

  const fetchDataEmpresa = async () => {
    try {
      const listMarcas = await ListarMarcas(seleccion.EMPRESA);
      setMarcas(listMarcas);
      fetchTablaAsignaciones();
    } catch (error) {}
  };
  useEffect(() => {
    if (seleccion.EMPRESA !== "") {
      fetchDataEmpresa();
    }
  }, [seleccion.EMPRESA]);

  const fetchDataAsig = async () => {
    try {
      const listProductos = await ListarProductosAsignaciones(
        seleccion.EMPRESA,
        seleccion.MARCA
      );
      // console.log(listProductos);
      setProductos(listProductos);
      const dataT = await ConsultarAsignaciones(
        seleccion.EMPRESA,
        seleccion.MARCA
      );
      setDatosTabla(dataT);
      setFilteredData(dataT);
    } catch (error) {}
  };

  useEffect(() => {
    if (seleccion.EMPRESA !== "" && seleccion.MARCA !== "") {
      fetchDataAsig();
    }
    if (seleccion.MARCA === "" && seleccion.EMPRESA !== "") {
      fetchTablaAsignaciones();
    }
  }, [seleccion.EMPRESA, seleccion.MARCA]);

  const vaciar = () => {
    setDatosTabla([]);
    setFilteredData([]);
  };
  const vaciarMarca = () => {
    setProducto1(var1);
    setProducto1Final(var1);
    setProducto2(var1);
    setProducto2Final(var1);
  };

  const Asignar = async () => {
    if (
      producto1final.IDENTIFICADOR !== "" &&
      producto2final.IDENTIFICADOR !== ""
    ) {
      setMensajeErrorAsignar("");
      const asignar = await AnadirAsignaciones(
        producto1final.IDENTIFICADOR,
        producto2final.IDENTIFICADOR,
        seleccion.EMPRESA,
        seleccionNombre.EMPRESA,
        seleccion.MARCA,
        seleccionNombre.MARCA,
        fetchDataAsig
      );
      asignar
        ? vaciarMarca()
        : setMensajeErrorAsignar(
            "Ya se encuentra asignada o ha ocurrido un error"
          );
    }
  };

  return (
    <ContenedorPadre direccion="c">
      <ContenedorPadre>
        <SeleccionarAlgo
          tituloSeleccionar="Elegir Empresa"
          etiqueta="EMPRESA"
          id="IDENTIFICADOR"
          options={empresas}
          primeraOpcion="Seleccionar empresa"
          opcionSeleccionada={seleccion.EMPRESA}
          setValor={(nuevoValor) => {
            const selectedItem = empresas.find(
              (item) => item.IDENTIFICADOR.toString() === nuevoValor.toString()
            );
            vaciar();
            if (selectedItem !== undefined) {
              if (seleccion.EMPRESA !== selectedItem.EMPRESA) {
                setSeleccion({
                  ...seleccion,
                  EMPRESA: selectedItem.IDENTIFICADOR,
                  MARCA: "",
                });
                setSeleccionNombre({
                  ...seleccionNombre,
                  EMPRESA: selectedItem.EMPRESA,
                  MARCA: "",
                });
              }
            } else {
              setSeleccion({
                ...seleccion,
                EMPRESA: "",
                MARCA: "",
              });
              setSeleccionNombre({
                ...seleccionNombre,
                EMPRESA: "",
                MARCA: "",
              });
            }
          }}
        />
        {seleccion.EMPRESA !== "" && (
          <SeleccionarAlgo
            tituloSeleccionar="Elegir Marca"
            etiqueta="MARCA"
            id="IDENTIFICADOR_MARCA"
            options={marcas}
            primeraOpcion="Seleccionar marca"
            opcionSeleccionada={seleccion.MARCA}
            setValor={(nuevoValor) => {
              const selectedItem = marcas.find(
                (item) =>
                  item.IDENTIFICADOR_MARCA.toString() === nuevoValor.toString()
              );
              vaciarMarca();
              if (selectedItem !== undefined) {
                setSeleccion({
                  ...seleccion,
                  MARCA: selectedItem.IDENTIFICADOR_MARCA,
                });
                setSeleccionNombre({
                  ...seleccionNombre,
                  MARCA: selectedItem.MARCA,
                });
              } else {
                setSeleccion({
                  ...seleccion,
                  MARCA: "",
                });
                setSeleccionNombre({
                  ...seleccionNombre,
                  MARCA: "",
                });
              }
            }}
          />
        )}
        {seleccion.EMPRESA !== "" && seleccion.MARCA !== "" && (
          <div className="contenedor-busqueda-asignacion">
            <div className="contenedor-pequeno-busqueda-asignacion">
              <div className="contenedor-input-busqueda-asignacion">
                <InputProductos
                  setData={setData1}
                  setProducto={setProducto1}
                  producto={producto1}
                  dataFilter={getDataFilter1}
                  listProductos={productos}
                  seccion={seccion}
                  prodFinal={setProducto1Final}
                  idprodFinal={producto1final.IDENTIFICADOR}
                />
              </div>
              <div>
                <span>↧</span>
              </div>
              <div className="contenedor-input-busqueda-asignacion">
                <InputProductos
                  setData={setData2}
                  setProducto={setProducto2}
                  producto={producto2}
                  dataFilter={getDataFilter2}
                  listProductos={productos}
                  seccion={seccion}
                  prodFinal={setProducto2Final}
                  idprodFinal={producto2final.IDENTIFICADOR}
                />
              </div>
            </div>
            {producto1final.IDENTIFICADOR !== "" &&
              producto2final.IDENTIFICADOR !== "" && (
                <ContenedorPadre>
                  <Boton onClick={Asignar}>Asignar</Boton>
                </ContenedorPadre>
              )}
          </div>
        )}
      </ContenedorPadre>
      {mensajeErrorAsignar !== "" && (
        <ContenedorPadre>
          <span>{mensajeErrorAsignar}</span>
        </ContenedorPadre>
      )}
      <ContenedorPadre direccion="c" alineacion="flex-start">
        <FiltroGlobal setData={setFilteredData} data={datosTabla} />
        <TablaJsonAsignaciones
          jsonData={filteredData}
          columnasOcultas={
            seleccion.MARCA === "" ? columnasAOcultar : columnasAOcultarConMarca
          }
          nombresPersonalizados={columPersonalizadas}
          fetchD={fetchTablaAsignaciones}
        />
      </ContenedorPadre>
    </ContenedorPadre>
  );
}
