import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import {
  getDetallePreciosMDM,
  getListasPreciosMDM,
  sincronizarCopiaPreciosMDM,
} from "services/mdmProductosService";
import {
  AvisoObservaciones,
  CabeceraColumnas,
  Campo,
  CampoFijo,
  AccionesEncabezado,
  Contenedor,
  Encabezado,
  Fila,
  Filas,
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

const InputIncremento = styled.input`
  width: 90px;
  padding: 6px 8px;
  text-align: right;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
`;

/* Solo dígitos y un punto decimal */
const soloNumeros = (valor) => {
  const limpio = String(valor ?? "").replace(/[^0-9.]/g, "");
  const [entero, ...decimales] = limpio.split(".");
  return decimales.length ? `${entero}.${decimales.join("")}` : entero;
};

/* Los precios se manejan con dos decimales (redondeo comercial, sin errores de coma flotante) */
const redondear2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const formatear = (n) => (Number.isFinite(n) ? redondear2(n).toFixed(2) : "—");

/* PVP sin IVA
   - Resto de líneas: PVD × (1 − descuento/100) × (1 + incremento/100).
   - LLANTAS MOTO: igual que la hoja de Excel "=B10-15%+25%", donde cada % es el número
     decimal (0,15 y 0,25), no un porcentaje del precio: PVP = PVD − descuento/100 + incremento/100. */
const calcularPvp = (pvd, incremento, descuento, esMoto = false) => {
  const base = Number(pvd);
  const inc = Number(incremento);
  const desc = Number(descuento || 0);
  if (
    pvd == null ||
    incremento === "" ||
    incremento == null ||
    !Number.isFinite(base) ||
    !Number.isFinite(inc) ||
    !Number.isFinite(desc)
  ) {
    return null;
  }
  return esMoto ? base - desc / 100 + inc / 100 : base * (1 - desc / 100) * (1 + inc / 100);
};

function CopiarPrecios() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const empresaOrigen = searchParams.get("origen");
  const empresaDestino = searchParams.get("destino");

  const productosIniciales = location.state?.productos;
  const [productos, setProductos] = useState(
    Array.isArray(productosIniciales) ? productosIniciales : []
  );
  const [listas, setListas] = useState(null); // null = cargando
  const [lista, setLista] = useState(null); // delp_codigo elegido
  const [detalle, setDetalle] = useState({}); // { IDENTIFICADOR: { PrecioListaA, Marca, Incremento, Observaciones } }
  const [incrementos, setIncrementos] = useState({}); // { IDENTIFICADOR: string } (editable)

  useEffect(() => {
    if (!empresaDestino) return undefined;
    let activo = true;
    setListas(null);
    setLista(null);

    getListasPreciosMDM(empresaDestino)
      .then((data) => {
        if (activo) setListas(data);
      })
      .catch((err) => {
        console.error("Error al consultar las listas de precios:", err);
        if (!activo) return;
        setListas([]);
        toast.error("No se pudieron obtener las listas de precios de la empresa destino");
      });
    return () => {
      activo = false;
    };
  }, [empresaDestino]);

  /* Precio lista A, incremento sugerido por regla y observaciones; se recalcula al cambiar la lista */
  useEffect(() => {
    if (!empresaOrigen || !empresaDestino || !productos.length) return undefined;
    let activo = true;

    getDetallePreciosMDM({
      empresaOrigen,
      empresaDestino,
      productos: productos.map(claveProducto),
      listaPrecio: lista,
    })
      .then((filas) => {
        if (!activo) return;
        setDetalle(Object.fromEntries(filas.map((f) => [f.IDENTIFICADOR, f])));
        setIncrementos(
          Object.fromEntries(
            filas.map((f) => [f.IDENTIFICADOR, f.Incremento != null ? String(f.Incremento) : ""])
          )
        );
      })
      .catch((err) => {
        console.error("Error al obtener el detalle de precios:", err);
        if (activo) toast.error("No se pudo obtener el detalle de precios");
      });
    return () => {
      activo = false;
    };
  }, [empresaOrigen, empresaDestino, productos, lista]);

  const opcionesListas = useMemo(
    () => (listas || []).map((l) => ({ value: l.CODIGO, label: l.NOMBRE })),
    [listas]
  );

  const hayObservaciones = productos.some(
    (p) => (detalle[claveProducto(p)]?.Observaciones || []).length > 0
  );

  const [sincronizando, setSincronizando] = useState(false);

  /* PVP sin IVA de cada fila con precio calculado (es lo que se envía a SAP) */
  const preciosCalculados = productos
    .map((producto) => {
      const id = claveProducto(producto);
      const fila = detalle[id];
      const esMoto = String(producto.LINEA_NEGOCIO ?? "").trim().toUpperCase() === "LLANTAS MOTO";
      const pvp = calcularPvp(
        fila?.PrecioListaA,
        esMoto ? fila?.Incremento : incrementos[id],
        fila?.Descuento,
        esMoto
      );
      return { IDENTIFICADOR: id, PRECIO: pvp != null ? redondear2(pvp) : null, existe: !(fila?.Observaciones || []).length };
    })
    .filter((f) => f.PRECIO != null && f.PRECIO > 0 && f.existe);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const r = await sincronizarCopiaPreciosMDM({
        empresaOrigen,
        empresaDestino,
        listaPrecio: lista,
        precios: preciosCalculados.map(({ IDENTIFICADOR, PRECIO }) => ({ IDENTIFICADOR, PRECIO })),
      });
      toast.success(`${r?.Actualizados ?? preciosCalculados.length} precio(s) sincronizados con SAP (${r?.Compania ?? empresaDestino})`);
      if (r?.Omitidos?.length) {
        toast.warn(`Omitidos por no existir (o ser ambiguos) en ${empresaDestino}: ${r.Omitidos.join(", ")}`);
      }
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

  if (!empresaOrigen || !empresaDestino || !productos.length) {
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
      <Contenedor theme={theme}>
        <Encabezado>
          <ButtonUI
            iconLeft="FaArrowLeft"
            variant="outlined"
            onClick={volverAlListado}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            Copiar Precios
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text="Sincronizar precios"
              iconLeft="FaArrowsRotate"
              onClick={sincronizar}
              disabled={sincronizando || lista == null || !preciosCalculados.length}
              title={
                lista == null
                  ? "Seleccione la lista de precios (Aplicar a)"
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
              <CampoFijo theme={theme} label="Empresa origen" valor={empresaOrigen} />
              <CampoFijo theme={theme} label="Empresa destino" valor={empresaDestino} />
            </Filas>

            <Filas>
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <TextUI weight="bold">{textoEncontrados(productos.length)}</TextUI>
          {hayObservaciones && (
            <AvisoObservaciones theme={theme}>
              Algunos productos no existen en la empresa destino
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
                  <Th $align="right">Precio lista A</Th>
                  <Th $align="right">Incremento %</Th>
                  <Th $align="right">PVP sin IVA</Th>
                  <Th $align="center" $ancho="70px" />
                </tr>
              </thead>
              <tbody>
                {ordenarPorIdentificador(productos).map((producto, index) => {
                  const id = claveProducto(producto);
                  const fila = detalle[id];
                  /* LLANTAS MOTO: el PVP sale de una fórmula fija de la regla (descuento + incremento);
                     el campo de incremento se muestra deshabilitado y sin valor */
                  const esMoto = String(producto.LINEA_NEGOCIO ?? "").trim().toUpperCase() === "LLANTAS MOTO";
                  const pvp = calcularPvp(
                    fila?.PrecioListaA,
                    esMoto ? fila?.Incremento : incrementos[id],
                    fila?.Descuento,
                    esMoto
                  );
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
                        {fila?.PrecioListaA != null ? formatear(Number(fila.PrecioListaA)) : "—"}
                      </Td>
                      <Td $align="right">
                        <InputIncremento
                          theme={theme}
                          inputMode="decimal"
                          value={esMoto ? "" : incrementos[id] ?? ""}
                          disabled={esMoto}
                          onChange={(e) =>
                            setIncrementos((previo) => ({ ...previo, [id]: soloNumeros(e.target.value) }))
                          }
                          placeholder={esMoto ? "" : "0"}
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

export default CopiarPrecios;
