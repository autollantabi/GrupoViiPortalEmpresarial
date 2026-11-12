import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import {
  copiarProductosMDM,
  getBodegasMDM,
  getGruposCompraMDM,
  validarCopiaProductosMDM,
} from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import {
  AccionesEncabezado,
  AvisoObservaciones,
  CabeceraColumnas,
  Campo,
  CampoFijo,
  Contenedor,
  PantallaCarga,
  Encabezado,
  Fila,
  Filas,
  RECURSO_ADMIN_PRODUCTOS,
  RUTA_ADMIN_PRODUCTOS,
  Tabla,
  TablaScroll,
  TarjetaCabecera,
  TarjetaFlexible,
  TextoObservacion,
  Td,
  Th,
  ordenarPorIdentificador,
  claveProducto,
  textoEncontrados,
} from "./compartido";

function CopiarProductos() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const empresaOrigen = searchParams.get("origen");
  const empresaDestino = searchParams.get("destino");

  /* Los productos llegan en el estado de la navegación. Al recargar la página se
     pierden: se vuelve al listado para que el usuario los seleccione de nuevo. */
  const productosIniciales = location.state?.productos;
  const filtrosListado = location.state?.volverA || "";

  const [productos, setProductos] = useState(
    Array.isArray(productosIniciales) ? productosIniciales : []
  );
  const [bodegas, setBodegas] = useState(null); // null = cargando
  const [bodegaDestino, setBodegaDestino] = useState(null);
  const [activoEasySales, setActivoEasySales] = useState(false);
  const [gruposCompra, setGruposCompra] = useState(null); // null = cargando
  const [grupoPorLinea, setGrupoPorLinea] = useState({}); // { línea: UoMGroupEntry }
  const [observaciones, setObservaciones] = useState({}); // { IDENTIFICADOR: string[] }
  const [validando, setValidando] = useState(true);
  const [copiando, setCopiando] = useState(false);

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);

  useEffect(() => {
    if (!empresaDestino) return undefined;
    let activo = true;
    setBodegas(null);
    setBodegaDestino(null);

    getBodegasMDM(empresaDestino)
      .then((lista) => {
        if (activo) setBodegas(lista);
      })
      .catch((err) => {
        console.error("Error al consultar las bodegas:", err);
        if (!activo) return;
        setBodegas([]);
        toast.error("No se pudieron obtener las bodegas de la empresa destino");
      });

    return () => {
      activo = false;
    };
  }, [empresaDestino]);

  /* Líneas presentes en la selección: cada una necesita su unidad de compra */
  const lineas = useMemo(
    () => Array.from(new Set(productos.map((p) => p.LINEA_NEGOCIO).filter(Boolean))),
    [productos]
  );

  useEffect(() => {
    if (!empresaDestino) return undefined;
    let activo = true;
    setGruposCompra(null);

    getGruposCompraMDM(empresaDestino)
      .then((data) => {
        if (!activo) return;
        setGruposCompra(data);
        // LLANTAS y LLANTAS MOTO traen la unidad por defecto; el resto la elige el usuario
        setGrupoPorLinea((previo) => ({ ...(data.PorDefecto || {}), ...previo }));
      })
      .catch((err) => {
        console.error("Error al consultar los grupos de compra:", err);
        if (!activo) return;
        setGruposCompra({ Opciones: [], PorDefecto: {} });
        toast.error("No se pudieron obtener las unidades de compra de la empresa destino");
      });

    return () => {
      activo = false;
    };
  }, [empresaDestino]);

  /* Observaciones por producto (sin propiedad en la empresa destino) */
  useEffect(() => {
    if (!empresaOrigen || !empresaDestino || !productos.length) return undefined;
    let activo = true;
    setValidando(true);

    validarCopiaProductosMDM({
      empresaOrigen,
      empresaDestino,
      productos: productos.map(claveProducto),
    })
      .then((lista) => {
        if (!activo) return;
        setObservaciones(
          Object.fromEntries(lista.map((o) => [o.IDENTIFICADOR, o.Observaciones || []]))
        );
      })
      .catch((err) => {
        console.error("Error al validar los productos:", err);
        if (activo) toast.error("No se pudieron validar los productos");
      })
      .finally(() => {
        if (activo) setValidando(false);
      });

    return () => {
      activo = false;
    };
  }, [empresaOrigen, empresaDestino, productos]);

  const opcionesGrupos = useMemo(
    () =>
      (gruposCompra?.Opciones || []).map((g) => ({
        value: g.UOM_GROUP_ENTRY,
        label: g.TIPO ? `${g.NOMBRE} (${g.TIPO})` : g.NOMBRE,
      })),
    [gruposCompra]
  );

  const hayObservaciones = productos.some(
    (p) => (observaciones[claveProducto(p)] || []).length > 0
  );
  const [erroresSap, setErroresSap] = useState({}); // { IDENTIFICADOR: mensaje de SAP }
  const faltaUnidad = lineas.some((l) => !grupoPorLinea[l]);

  const motivoBloqueo = !puedeEditar
    ? "Requiere el permiso de edición sobre Administración de productos"
    : !bodegaDestino
      ? "Seleccione la bodega destino"
      : validando
        ? "Validando los productos..."
        : hayObservaciones
          ? "Hay productos con observaciones por revisar"
          : faltaUnidad
            ? "Seleccione la unidad de compra de cada línea"
            : "";

  const copiar = async () => {
    if (motivoBloqueo || copiando) return;
    setCopiando(true);
    setErroresSap({});
    try {
      const respuesta = await copiarProductosMDM({
        empresaOrigen,
        empresaDestino,
        bodegaDestino,
        activoEasySales,
        gruposCompra: grupoPorLinea,
        productos: productos.map(claveProducto),
      });
      const resultado = respuesta?.data || {};
      const fallidos = resultado.Fallidos || [];
      const creados = resultado.Creados || [];
      setErroresSap(Object.fromEntries(fallidos.map((f) => [f.IDENTIFICADOR, f.Motivo])));
      if (creados.length) {
        toast.success(`${creados.length} producto(s) creados en SAP`);
        // Los creados salen de la lista; quedan solo los que fallaron para corregir y reintentar
        setProductos((previo) => previo.filter((p) => !creados.includes(claveProducto(p))));
      }
      if (fallidos.length) toast.error(`${fallidos.length} producto(s) no se pudieron crear en SAP`);
      if (!creados.length && !fallidos.length) toast.success("Productos procesados");
    } catch (err) {
      const cuerpo = err?.response?.data;
      const detalle = cuerpo?.data;
      if (detalle?.Observaciones) {
        setObservaciones(
          Object.fromEntries(
            detalle.Observaciones.map((o) => [o.IDENTIFICADOR, o.Observaciones || []])
          )
        );
      }
      if (detalle?.Errores?.length) {
        setErroresSap(Object.fromEntries(detalle.Errores.map((e) => [e.IDENTIFICADOR, e.Motivo])));
      }
      toast.error(cuerpo?.message || "No se pudo copiar los productos");
    } finally {
      setCopiando(false);
    }
  };

  const opcionesBodega = useMemo(
    () =>
      (bodegas || []).map((b) => ({
        value: b.CODIGO,
        label: b.NOMBRE ? `${b.CODIGO} - ${b.NOMBRE}` : String(b.CODIGO),
      })),
    [bodegas]
  );

  const volverAlListado = () => {
    navigate(`${RUTA_ADMIN_PRODUCTOS}${filtrosListado ? `?${filtrosListado}` : ""}`);
  };

  const quitarProducto = (producto) => {
    const restantes = productos.filter((p) => claveProducto(p) !== claveProducto(producto));
    if (!restantes.length) {
      toast.info("No quedan productos por copiar");
      volverAlListado();
      return;
    }
    setProductos(restantes);
  };

  if (!empresaOrigen || !empresaDestino || !productos.length) {
    return <Navigate to={RUTA_ADMIN_PRODUCTOS} replace />;
  }

  const placeholderBodega =
    bodegas === null
      ? "Cargando bodegas..."
      : bodegas.length === 0
        ? "Sin bodegas para esta empresa"
        : "Seleccione una bodega";

  return (
    <ContainerUI
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <PantallaCarga visible={copiando} />
      <Contenedor theme={theme}>
        <Encabezado>
          <ButtonUI
            iconLeft="FaArrowLeft"
            variant="outlined"
            onClick={volverAlListado}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            Copiar Productos
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text="Sincronizar productos"
              iconLeft="FaCloudArrowUp"
              onClick={copiar}
              disabled={Boolean(motivoBloqueo) || copiando}
              title={motivoBloqueo || "Sincronizar los productos con la empresa destino"}
            />
          </AccionesEncabezado>
        </Encabezado>

        <TarjetaCabecera theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <CampoFijo theme={theme} label="Empresa origen" valor={empresaOrigen} />
              <CampoFijo theme={theme} label="Empresa destino" valor={empresaDestino} />
            </Filas>

            <Filas>
              <Campo theme={theme} label="Bodega destino">
                <SelectUI
                  options={opcionesBodega}
                  value={opcionesBodega.find((o) => o.value === bodegaDestino) || null}
                  onChange={(opt) => setBodegaDestino(opt?.value || null)}
                  placeholder={placeholderBodega}
                  isClearable
                  isDisabled={!opcionesBodega.length}
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
              {lineas.map((linea) => (
                <Campo
                  key={linea}
                  theme={theme}
                  label={lineas.length > 1 ? `Unidad de compra (${linea})` : "Unidad de compra"}
                >
                  <SelectUI
                    options={opcionesGrupos}
                    value={opcionesGrupos.find((o) => o.value === grupoPorLinea[linea]) || null}
                    onChange={(opt) =>
                      setGrupoPorLinea((previo) => ({ ...previo, [linea]: opt?.value ?? null }))
                    }
                    placeholder={
                      gruposCompra === null ? "Cargando unidades..." : "Seleccione la unidad de compra"
                    }
                    isDisabled={!opcionesGrupos.length}
                    minWidth="100%"
                    maxWidth="100%"
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  />
                </Campo>
              ))}
              <Campo theme={theme} label="Activo Easy Sales">
                <CheckboxUI
                  name="activo-easy-sales"
                  checked={activoEasySales}
                  onChange={(_nombre, valor) => setActivoEasySales(valor)}
                  style={{ marginBottom: 0 }}
                />
              </Campo>
            </Filas>
          </CabeceraColumnas>
        </TarjetaCabecera>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <TextUI weight="bold">{textoEncontrados(productos.length)}</TextUI>
          {hayObservaciones && (
            <AvisoObservaciones theme={theme}>
              Algunas observaciones necesitan ser revisadas
            </AvisoObservaciones>
          )}
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
                  <Th $align="center" $ancho="70px" />
                </tr>
              </thead>
              <tbody>
                {ordenarPorIdentificador(productos).map((producto, index) => (
                  <Fila key={claveProducto(producto)} $par={index % 2 === 0}>
                    <Td>{producto.IDENTIFICADOR || "—"}</Td>
                    <Td $wrap>
                      {producto.NOMBRE || "—"}
                      {(observaciones[claveProducto(producto)] || []).map((texto) => (
                        <TextoObservacion key={texto} theme={theme}>
                          {texto}
                        </TextoObservacion>
                      ))}
                      {erroresSap[claveProducto(producto)] && (
                        <TextoObservacion theme={theme}>
                          {erroresSap[claveProducto(producto)]}
                        </TextoObservacion>
                      )}
                    </Td>
                    <Td>{producto.CODIGO_BARRAS || "—"}</Td>
                    <Td>{producto.LINEA_NEGOCIO || "—"}</Td>
                    <Td $align="center">
                      <ButtonUI
                        iconLeft="FaXmark"
                        variant="outlined"
                        onClick={() => quitarProducto(producto)}
                        title="Quitar de la copia"
                      />
                    </Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        </TarjetaFlexible>
      </Contenedor>
    </ContainerUI>
  );
}

export default CopiarProductos;
