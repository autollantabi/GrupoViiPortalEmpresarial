import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  ListarEmpresas,
  ListarMarcas,
  ListarProductos,
  GuardarPromocion,
} from "services/empresasMRPService";
import { InputProductos, TablaProductos } from "../Componentes";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";

const seccion = "P";

const StyledTitle = styled.h3`
  font-size: 1.3em;
  color: black;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: solid 1px;
  margin-bottom: 25px;
`;

export function Promociones() {
  const var1 = { IDENTIFICADOR: "", NOMBRE_PRODUCTO: "" };

  const [filtro, setFiltro] = useState(var1);

  const [empresas, setEmpresas] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nombrePromocion, setNombrePromocion] = useState("");

  const [productoSeleccionado, setProductoSeleccionado] = useState(var1);
  const [prodFinal, setProdFinal] = useState(var1);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState({
    IDENTIFICADOR: "",
    EMPRESA: "",
  });
  const [marcaSeleccionada, setMarcaSeleccionada] = useState({
    IDENTIFICADOR_MARCA: "",
    MARCA: "",
  });

  const [fechas, setFechas] = useState({
    FI: "",
    FF: "",
  });

  const [listaProductosGuardar, setListaProductosGuardar] = useState([]);

  const resetearEstados = () => {
    setFiltro(var1);
    setProductos([]);
    setNombrePromocion("");
    setProductoSeleccionado(var1);
    setProdFinal(var1);
    setEmpresaSeleccionada({ IDENTIFICADOR: "", EMPRESA: "" });
    setMarcaSeleccionada({ IDENTIFICADOR_MARCA: "", MARCA: "" });
    setFechas({ FI: "", FF: "" });
    setListaProductosGuardar([]);
  };

  const FiltrarLista = () => {
    const filtrados = productos.filter(
      (item) =>
        !listaProductosGuardar
          .map((producto) => producto.IDENTIFICADOR)
          .includes(item.IDENTIFICADOR)
    );
    return filtrados;
  };
  const getDataFilter = () => {
    var filteredData = FiltrarLista().filter((prod) =>
      prod.NOMBRE_PRODUCTO.includes(filtro.NOMBRE_PRODUCTO)
    );
    return filteredData;
  };

  const setData = (e) => {
    setFiltro((prev) => ({ ...prev, NOMBRE_PRODUCTO: e }));
  };

  const handleSelectEmpresa = (e) => {
    // console.log("ID:", e.target.selectedOptions[0].id);
    // console.log("Valor:", e.target.value);
    setMarcaSeleccionada({
      IDENTIFICADOR_MARCA: "",
      MARCA: "",
    });
    setEmpresaSeleccionada({
      IDENTIFICADOR: e.target.selectedOptions[0].id,
      EMPRESA: e.target.value,
    });
  };
  const handleSelectMarca = (e) => {
    // console.log("ID:", e.target.selectedOptions[0].id);
    // console.log("Valor:", e.target.value);
    setMarcaSeleccionada({
      IDENTIFICADOR_MARCA: e.target.selectedOptions[0].id,
      MARCA: e.target.value,
    });
  };

  const [mensajeDePromocion, setMensajeDePromocion] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listEmp = await ListarEmpresas();
        setEmpresas(listEmp);
      } catch (error) {}
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (empresaSeleccionada.EMPRESA !== "") {
      const fetchData = async () => {
        try {
          const listMarcas = await ListarMarcas(
            empresaSeleccionada.IDENTIFICADOR
          );
          setMarcas(listMarcas);
        } catch (error) {}
      };
      fetchData();
    }
  }, [empresaSeleccionada]);

  useEffect(() => {
    if (empresaSeleccionada.EMPRESA !== "" && marcaSeleccionada.MARCA !== "") {
      const fetchData = async () => {
        try {
          const listProductos = await ListarProductos(
            empresaSeleccionada.IDENTIFICADOR,
            marcaSeleccionada.IDENTIFICADOR_MARCA
          );
          setProductos(listProductos);
        } catch (error) {}
      };
      fetchData();
    }
  }, [empresaSeleccionada, marcaSeleccionada]);

  const GuardarProductos = () => {
    setListaProductosGuardar((prev) => [
      ...prev,
      {
        IDENTIFICADOR: prodFinal.IDENTIFICADOR,
        NOMBRE_PRODUCTO: prodFinal.NOMBRE_PRODUCTO,
      },
    ]);
    setProdFinal(var1);
    setProductoSeleccionado(var1);
  };

  const EliminarElementoDeLista = (prod) => {
    const nuevLista = listaProductosGuardar.filter((item) => item !== prod);
    setListaProductosGuardar(nuevLista);
  };

  const GuardarProdPromocion = async () => {
    console.log(empresaSeleccionada.IDENTIFICADOR);
    console.log(nombrePromocion);
    console.log(fechas.FI);
    console.log(fechas.FF);
    console.table(listaProductosGuardar);

    const estadoPromocion = await GuardarPromocion(
      empresaSeleccionada.IDENTIFICADOR,
      empresaSeleccionada.EMPRESA,
      nombrePromocion,
      fechas.FI,
      fechas.FF,
      listaProductosGuardar
    );
    if (estadoPromocion) {
      resetearEstados();
      setMensajeDePromocion("¡Promocion Creada Exitosamente!");
      setTimeout(() => {
        setMensajeDePromocion("");
      }, 3000);
    } else {
      setMensajeDePromocion(
        "Ha ocurrido un error, consultar con el administrador para mas informacion"
      );
    }
  };

  return (
    <ContenedorPadre direccion="c" alineacion="center">
      <StyledTitle>CREAR PROMOCIÓN</StyledTitle>
      <div className="contenedor-filtros-asignacion">
        <div className="contenedor-select-asignacion">
          <span>Elegir Empresa</span>
          <select
            className="select-asignacion"
            value={empresaSeleccionada.EMPRESA}
            onChange={handleSelectEmpresa}
            disabled={listaProductosGuardar.length > 0 ? true : false}
          >
            <option value="" id="">
              Seleccione una empresa
            </option>
            {empresas.map((emp, index) => (
              <option key={index} id={emp.IDENTIFICADOR} value={emp.EMPRESA}>
                {emp.EMPRESA}
              </option>
            ))}
          </select>
        </div>
        {empresaSeleccionada.EMPRESA !== "" && (
          <div className="contenedor-select-asignacion">
            <span>Elegir Marca</span>
            <select
              className="select-asignacion"
              value={marcaSeleccionada.MARCA}
              onChange={handleSelectMarca}
            >
              <option value="">Seleccione una marca</option>
              {/* {empresaSeleccionada.EMPRESA === "IKONIX" && (
                <option id="9" value="UYUSTOOLS">
                  UYUSTOOLS
                </option>
              )} */}
              {marcas.map((marca, index) => (
                <option
                  key={index}
                  id={marca.IDENTIFICADOR_MARCA}
                  value={marca.MARCA}
                >
                  {marca.MARCA}
                </option>
              ))}
            </select>
          </div>
        )}
        {empresaSeleccionada.EMPRESA !== "" &&
          marcaSeleccionada.MARCA !== "" && (
            <div className="contenedor-busqueda-asignacion">
              <div className="contenedor-pequeno-busqueda-asignacion">
                <div className="contenedor-input-busqueda-asignacion">
                  <input
                    className="input-busqueda-asignacion nombre-promocion"
                    type="text"
                    value={nombrePromocion}
                    onChange={(e) =>
                      setNombrePromocion(e.target.value.toUpperCase())
                    }
                    placeholder="Ingresar nombre para Promoción"
                  />
                  <InputProductos
                    setData={setData}
                    setProducto={setProductoSeleccionado}
                    producto={productoSeleccionado}
                    dataFilter={getDataFilter}
                    listProductos={FiltrarLista()}
                    seccion={seccion}
                    prodFinal={setProdFinal}
                    idprodFinal={prodFinal.IDENTIFICADOR}
                  />
                </div>
              </div>
              {prodFinal.IDENTIFICADOR !== "" && nombrePromocion !== "" && (
                <div className="contenedor-boton-asignacion">
                  <button
                    onClick={GuardarProductos}
                    className="boton-asignacion"
                  >
                    Agregar
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
      {mensajeDePromocion !== "" && (
        <ContenedorPadre alineacion="center">
          {mensajeDePromocion}
        </ContenedorPadre>
      )}
      {nombrePromocion !== "" && (
        <TablaProductos
          nombrePromocion={nombrePromocion}
          listaProductos={listaProductosGuardar}
          eliminarDeLista={EliminarElementoDeLista}
          setFechas={setFechas}
          fechas={fechas}
          setDataPromocion={GuardarProdPromocion}
        />
      )}
    </ContenedorPadre>
  );
}
