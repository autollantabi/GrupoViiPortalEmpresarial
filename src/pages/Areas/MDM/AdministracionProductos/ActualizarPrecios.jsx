import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import {
  getDetalleActualizacionPreciosMDM,
  getListasPreciosMDM,
  sincronizarPlantillaPreciosMDM,
} from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import {
  AccionesEncabezado,
  AvisoObservaciones,
  CabeceraColumnas,
  Campo,
  CampoFijo,
  ConfirmarActualizarSap,
  Contenedor,
  Encabezado,
  Fila,
  Filas,
  InputIncremento,
  PantallaCarga,
  RECURSO_ADMIN_PRODUCTOS,
  RUTA_ADMIN_PRODUCTOS,
  Tabla,
  TablaScroll,
  TarjetaCabecera,
  TarjetaFlexible,
  TextoObservacion,
  Td,
  Th,
  calcularPvp,
  claveProducto,
  formatear,
  ordenarPorIdentificador,
  redondear2,
  soloNumeros,
  textoEncontrados,
} from "./compartido";

/**
 * Actualizar precios de los productos seleccionados en el listado: el usuario escribe el precio de cada
 * artículo y el PVP sin IVA sale de aplicarle el incremento/descuento de la regla (línea, marca y lista de
 * precios de la empresa, sin empresa destino). Luego se envía a SAP con "Actualizar precios sap".
 */
function ActualizarPrecios() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const empresa = searchParams.get("empresa");
  const productosIniciales = location.state?.productos;
  const [productos, setProductos] = useState(Array.isArray(productosIniciales) ? productosIniciales : []);
  const [listas, setListas] = useState(null); // null = cargando
  const [lista, setLista] = useState(null); // delp_codigo elegido
  const [detalle, setDetalle] = useState({}); // { IDENTIFICADOR: { Incremento, Descuento, MostrarIncremento, Editable, Observaciones } }
  const [incrementos, setIncrementos] = useState({}); // { IDENTIFICADOR: string } (editable)
  const [precios, setPrecios] = useState({}); // { IDENTIFICADOR: string } (lo escribe el usuario)
  const [sincronizando, setSincronizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);

  useEffect(() => {
    if (!empresa) return undefined;
    let activo = true;
    setListas(null);
    setLista(null);
    getListasPreciosMDM(empresa)
      .then((data) => activo && setListas(data))
      .catch((err) => {
        console.error("Error al consultar las listas de precios:", err);
        if (!activo) return;
        setListas([]);
        toast.error("No se pudieron obtener las listas de precios de la empresa");
      });
    return () => {
      activo = false;
    };
  }, [empresa]);

  /* Reglas de incremento y observaciones; se recalculan al cambiar la lista */
  useEffect(() => {
    if (!empresa || !productos.length) return undefined;
    let activo = true;
    getDetalleActualizacionPreciosMDM({
      empresa,
      productos: productos.map(claveProducto),
      listaPrecio: lista,
    })
      .then((filas) => {
        if (!activo) return;
        setDetalle(Object.fromEntries(filas.map((f) => [f.IDENTIFICADOR, f])));
        setIncrementos(
          Object.fromEntries(filas.map((f) => [f.IDENTIFICADOR, f.Incremento != null ? String(f.Incremento) : ""]))
        );
      })
      .catch((err) => {
        console.error("Error al obtener el detalle de precios:", err);
        if (activo) toast.error("No se pudo obtener el detalle de precios");
      });
    return () => {
      activo = false;
    };
  }, [empresa, productos, lista]);

  const opcionesListas = useMemo(
    () => (listas || []).map((l) => ({ value: l.CODIGO, label: l.NOMBRE })),
    [listas]
  );

  const hayObservaciones = productos.some((p) => (detalle[claveProducto(p)]?.Observaciones || []).length > 0);

  /* LLANTAS MOTO con regla usa la fórmula fija (igual que Copiar precios); delmi_editar define si se edita */
  const calcularFila = (producto) => {
    const id = claveProducto(producto);
    const fila = detalle[id];
    const esMoto = String(producto.LINEA_NEGOCIO ?? "").trim().toUpperCase() === "LLANTAS MOTO";
    const formulaMoto = esMoto && fila?.Incremento != null;
    const precio = precios[id];
    const pvp = precio ? calcularPvp(precio, incrementos[id], fila?.Descuento, formulaMoto) : null;
    return {
      id,
      fila,
      pvp,
      mostrarIncremento: fila?.MostrarIncremento !== false,
      editable: fila?.Editable !== false,
    };
  };

  const preciosCalculados = productos
    .map((producto) => {
      const { id, fila, pvp } = calcularFila(producto);
      return { IDENTIFICADOR: id, PRECIO: pvp != null ? redondear2(pvp) : null, existe: !(fila?.Observaciones || []).length };
    })
    .filter((f) => f.PRECIO != null && f.PRECIO > 0 && f.existe);

  /* Cualquier fila sin precio (vacío o 0) impide actualizar: hay que completarla o quitarla de la lista */
  const hayFilasSinPrecio = productos.some((p) => !(Number(precios[claveProducto(p)]) > 0));

  const sincronizar = async () => {
    if (lista == null) {
      toast.warn("Seleccione la lista de precios (Aplicar a)");
      return;
    }
    setSincronizando(true);
    try {
      const r = await sincronizarPlantillaPreciosMDM({
        empresa,
        listaPrecio: lista,
        precios: preciosCalculados.map(({ IDENTIFICADOR, PRECIO }) => ({ IDENTIFICADOR, PRECIO })),
      });
      toast.success(`${r?.Actualizados ?? preciosCalculados.length} precio(s) sincronizados con SAP (${r?.Compania ?? empresa})`);
      if (r?.Omitidos?.length) toast.warn(`Omitidos: ${r.Omitidos.join(", ")}`);
    } catch (err) {
      console.error("Error al sincronizar precios:", err);
      toast.error(err?.response?.data?.message || "No se pudieron sincronizar los precios con SAP");
    } finally {
      setSincronizando(false);
    }
  };

  const volverAlListado = () => navigate(RUTA_ADMIN_PRODUCTOS);

  const quitarProducto = (producto) => {
    const restantes = productos.filter((p) => claveProducto(p) !== claveProducto(producto));
    if (!restantes.length) {
      toast.info("No quedan productos");
      volverAlListado();
      return;
    }
    setProductos(restantes);
  };

  if (!empresa || !productos.length) {
    return <Navigate to={RUTA_ADMIN_PRODUCTOS} replace />;
  }

  return (
    <ContainerUI
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <PantallaCarga visible={sincronizando} />
      <ConfirmarActualizarSap
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          sincronizar();
        }}
      />
      <Contenedor theme={theme}>
        <Encabezado>
          <ButtonUI iconLeft="FaArrowLeft" variant="outlined" onClick={volverAlListado} title="Volver al listado" />
          <TextUI weight="bold" size="20px">
            Actualizar precios
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text="Actualizar precios sap"
              iconLeft="FaArrowsRotate"
              onClick={() => setConfirmando(true)}
              disabled={!puedeEditar || sincronizando || lista == null || hayFilasSinPrecio || !preciosCalculados.length}
              title={
                !puedeEditar
                  ? "Requiere el permiso de edición sobre Administración de productos"
                  : lista == null
                    ? "Seleccione la lista de precios"
                    : hayFilasSinPrecio
                      ? "Hay productos sin precio (vacío o 0): ingréselo o quite el producto de la lista"
                      : !preciosCalculados.length
                      ? "No hay precios calculados para enviar"
                      : "Enviar los PVP sin IVA a SAP con la lista de precios seleccionada"
              }
            />
          </AccionesEncabezado>
        </Encabezado>

        <TarjetaCabecera theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <CampoFijo theme={theme} label="Empresa" valor={empresa} />
              <Campo theme={theme} label="Aplicar a">
                <SelectUI
                  options={opcionesListas}
                  value={opcionesListas.find((o) => o.value === lista) || null}
                  onChange={(opt) => setLista(opt?.value ?? null)}
                  placeholder={
                    listas === null
                      ? "Cargando listas de precios..."
                      : listas.length === 0
                        ? "Sin listas de precios para esta empresa"
                        : "Seleccione la lista de precios"
                  }
                  isClearable
                  isDisabled={!opcionesListas.length}
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
            </Filas>
          </CabeceraColumnas>
        </TarjetaCabecera>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <TextUI weight="bold">{textoEncontrados(productos.length)}</TextUI>
          {hayObservaciones && <AvisoObservaciones theme={theme}>Algunos productos no existen en la empresa</AvisoObservaciones>}
        </div>

        <TarjetaFlexible theme={theme}>
          <TablaScroll>
            <Tabla>
              <thead>
                <tr>
                  <Th>Identificador</Th>
                  <Th>Nombre</Th>
                  <Th>Código de barras</Th>
                  <Th>Línea</Th>
                  <Th $align="right">Precio</Th>
                  <Th $align="right">Incremento %</Th>
                  <Th $align="right">PVP sin IVA</Th>
                  <Th $align="center" $ancho="70px" />
                </tr>
              </thead>
              <tbody>
                {ordenarPorIdentificador(productos).map((producto, index) => {
                  const { id, fila, mostrarIncremento, editable, pvp } = calcularFila(producto);
                  return (
                    <Fila key={id} $par={index % 2 === 0}>
                      <Td>{producto.IDENTIFICADOR || "—"}</Td>
                      <Td $wrap>
                        {producto.NOMBRE || "—"}
                        {(fila?.Observaciones || []).map((texto) => (
                          <TextoObservacion key={texto} theme={theme}>
                            {texto}
                          </TextoObservacion>
                        ))}
                      </Td>
                      <Td>{producto.CODIGO_BARRAS || "—"}</Td>
                      <Td>{producto.LINEA_NEGOCIO || "—"}</Td>
                      <Td $align="right">
                        <InputIncremento
                          theme={theme}
                          inputMode="decimal"
                          value={precios[id] ?? ""}
                          onChange={(e) => setPrecios((previo) => ({ ...previo, [id]: soloNumeros(e.target.value) }))}
                          placeholder="0.00"
                        />
                      </Td>
                      <Td $align="right">
                        <InputIncremento
                          theme={theme}
                          inputMode="decimal"
                          value={mostrarIncremento ? incrementos[id] ?? "" : ""}
                          disabled={lista == null || !editable || !mostrarIncremento}
                          onChange={(e) =>
                            setIncrementos((previo) => ({ ...previo, [id]: soloNumeros(e.target.value) }))
                          }
                          placeholder={mostrarIncremento && editable ? "0" : ""}
                        />
                      </Td>
                      <Td $align="right">{pvp != null ? formatear(pvp) : "—"}</Td>
                      <Td $align="center">
                        <ButtonUI
                          iconLeft="FaXmark"
                          variant="outlined"
                          onClick={() => quitarProducto(producto)}
                          title="Quitar de la lista"
                        />
                      </Td>
                    </Fila>
                  );
                })}
              </tbody>
            </Tabla>
          </TablaScroll>
        </TarjetaFlexible>
      </Contenedor>
    </ContainerUI>
  );
}

export default ActualizarPrecios;
