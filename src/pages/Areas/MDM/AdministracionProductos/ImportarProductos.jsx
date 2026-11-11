import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { resolverCodigosMDM, validarCopiaProductosMDM } from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import { useAlcanceProductos } from "./useAlcanceProductos";
import {
  AccionesEncabezado,
  AvisoObservaciones,
  Campo,
  CabeceraColumnas,
  Contenedor,
  Encabezado,
  Fila,
  Filas,
  RECURSO_ADMIN_PRODUCTOS,
  RUTA_ADMIN_PRODUCTOS,
  RUTA_COPIAR_PRODUCTOS,
  Tabla,
  TablaScroll,
  TarjetaCabecera,
  TarjetaFlexible,
  TextoObservacion,
  Td,
  Th,
  claveProducto,
  textoEncontrados,
} from "./compartido";

/* Encabezados que se ignoran si vienen como primera celda/línea del archivo */
const ENCABEZADOS = [
  "IDENTIFICADOR",
  "CODIGO",
  "CÓDIGO",
  "CODIGO SAP",
  "CÓDIGO SAP",
  "ITEMCODE",
  "CODIGO DE BARRAS",
  "CÓDIGO DE BARRAS",
  "CODIGO BARRAS",
  "BARCODE",
];

const limpiarCodigos = (valores) => {
  const codigos = valores.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (codigos.length && ENCABEZADOS.includes(codigos[0].toUpperCase())) codigos.shift();
  return Array.from(new Set(codigos));
};

/** .txt / .csv: un código por línea (también admite separados por coma, punto y coma o tab) */
const leerTexto = async (archivo) => {
  const texto = await archivo.text();
  return limpiarCodigos(texto.split(/[\r\n,;\t]+/));
};

/** Excel: la primera columna de la primera hoja */
const leerExcel = async (archivo) => {
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: "" });
  return limpiarCodigos(filas.map((fila) => fila[0]));
};

function ImportarProductos() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const inputArchivo = useRef(null);
  const { opcionesEmpresas, opcionesLineas, lineasRestringidas } = useAlcanceProductos();

  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [codigos, setCodigos] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null); // { productos, noEncontrados, fueraDeAlcance }

  const [observaciones, setObservaciones] = useState({}); // { IDENTIFICADOR: string[] }
  const [validando, setValidando] = useState(false);

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);

  const opcionesDestino = useMemo(
    () => opcionesEmpresas.filter((o) => o.value !== origen?.value),
    [opcionesEmpresas, origen]
  );

  /* Observaciones (propiedad, ya existe en destino...) cada vez que cambian el destino o la lista */
  const productosResultado = resultado?.productos;
  useEffect(() => {
    if (!origen || !destino || !productosResultado?.length) {
      setObservaciones({});
      return undefined;
    }
    let activo = true;
    setValidando(true);
    validarCopiaProductosMDM({
      empresaOrigen: origen.value,
      empresaDestino: destino.value,
      productos: productosResultado.map(claveProducto),
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
  }, [origen, destino, productosResultado]);

  const hayObservaciones = (productosResultado || []).some(
    (p) => (observaciones[claveProducto(p)] || []).length > 0
  );

  const quitarProducto = (producto) =>
    setResultado((previo) => ({
      ...previo,
      productos: previo.productos.filter((p) => claveProducto(p) !== claveProducto(producto)),
    }));

  const alElegirArchivo = async (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;

    try {
      const extension = archivo.name.split(".").pop().toLowerCase();
      let lista;
      if (["xlsx", "xls"].includes(extension)) lista = await leerExcel(archivo);
      else if (["txt", "csv"].includes(extension)) lista = await leerTexto(archivo);
      else {
        toast.error("Formato no soportado. Use un archivo .txt, .csv o Excel (.xlsx)");
        return;
      }

      if (!lista.length) {
        toast.warning("El archivo no trae códigos");
        return;
      }
      setNombreArchivo(archivo.name);
      setCodigos(lista);
      setResultado(null);
    } catch (err) {
      console.error("Error leyendo el archivo:", err);
      toast.error("No se pudo leer el archivo");
    }
  };

  const buscar = async () => {
    if (!origen) return toast.info("Seleccione la empresa origen");
    if (!codigos.length) return toast.info("Cargue un archivo con códigos");

    setBuscando(true);
    try {
      const data = await resolverCodigosMDM({ empresa: origen.value, codigos });
      const permitidas = opcionesLineas.map((o) => o.value);
      const enAlcance = [];
      const fueraDeAlcance = [];
      (data.Productos || []).forEach((p) => {
        if (!lineasRestringidas || permitidas.includes(p.LINEA_NEGOCIO)) enAlcance.push(p);
        else fueraDeAlcance.push(p);
      });
      setResultado({
        productos: enAlcance,
        noEncontrados: data.NoEncontrados || [],
        fueraDeLinea: data.FueraDeLinea || [],
        fueraDeAlcance,
      });
    } catch (err) {
      console.error("Error al buscar los productos:", err);
      toast.error(err?.response?.data?.message || "No se pudieron buscar los productos");
    } finally {
      setBuscando(false);
    }
  };

  const continuar = () => {
    if (!destino) return toast.info("Seleccione la empresa destino");
    if (!resultado?.productos.length) return toast.info("No hay productos para copiar");

    const filtros = new URLSearchParams({ origen: origen.value, destino: destino.value });
    navigate(`${RUTA_COPIAR_PRODUCTOS}?${filtros.toString()}`, {
      state: { productos: resultado.productos, volverA: "" },
    });
  };

  const cambiarOrigen = (opt) => {
    setOrigen(opt || null);
    setResultado(null);
    if (opt && destino?.value === opt.value) setDestino(null);
  };

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
            onClick={() => navigate(RUTA_ADMIN_PRODUCTOS)}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            Copiar productos desde archivo
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text="Continuar a copiar"
              iconLeft="FaArrowRight"
              onClick={continuar}
              disabled={!puedeEditar || !destino || !resultado?.productos.length || validando || hayObservaciones}
              title={
                !puedeEditar
                  ? "Requiere el permiso de edición sobre Administración de productos"
                  : !destino
                    ? "Seleccione la empresa destino"
                    : !resultado?.productos.length
                      ? "Busque los productos del archivo primero"
                      : validando
                        ? "Validando los productos..."
                        : hayObservaciones
                          ? "Hay productos con observaciones por revisar"
                          : "Ir a la pantalla de copia con los productos encontrados"
              }
            />
          </AccionesEncabezado>
        </Encabezado>

        <TarjetaCabecera theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <Campo theme={theme} label="Empresa origen">
                <SelectUI
                  options={opcionesEmpresas}
                  value={origen}
                  onChange={cambiarOrigen}
                  placeholder="Seleccione la empresa origen"
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
              <Campo theme={theme} label="Empresa destino">
                <SelectUI
                  options={opcionesDestino}
                  value={destino}
                  onChange={(opt) => setDestino(opt || null)}
                  placeholder="Seleccione la empresa destino"
                  isDisabled={!origen}
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
            </Filas>

            <Filas>
              <Campo theme={theme} label="Archivo (.txt, .csv o Excel)">
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    ref={inputArchivo}
                    type="file"
                    accept=".txt,.csv,.xlsx,.xls"
                    onChange={alElegirArchivo}
                    style={{ display: "none" }}
                  />
                  <ButtonUI
                    text="Elegir archivo"
                    iconLeft="FaFileArrowUp"
                    variant="outlined"
                    onClick={() => inputArchivo.current?.click()}
                  />
                  <TextUI size="13px" color={theme.colors.textSecondary}>
                    {nombreArchivo
                      ? `${nombreArchivo} · ${codigos.length} código${codigos.length === 1 ? "" : "s"}`
                      : "Un código por línea (txt/csv) o en la primera columna (Excel)"}
                  </TextUI>
                </div>
              </Campo>
              <ButtonUI
                text="Buscar productos"
                iconLeft="FaMagnifyingGlass"
                onClick={buscar}
                disabled={!origen || !codigos.length || buscando}
              />
            </Filas>
          </CabeceraColumnas>
        </TarjetaCabecera>

        {resultado && (
          <TarjetaCabecera theme={theme}>
            <TextUI weight="bold">{textoEncontrados(resultado.productos.length)}</TextUI>
            {resultado.fueraDeAlcance.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.fueraDeAlcance.length} fuera de sus líneas de negocio permitidas (se
                omiten): {resultado.fueraDeAlcance.map((p) => p.IDENTIFICADOR).join(", ")}
              </TextUI>
            )}
            {resultado.fueraDeLinea?.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.fueraDeLinea.length} con línea de negocio no copiable (solo LLANTAS, LLANTAS
                MOTO, LUBRICANTES y HERRAMIENTAS; se omiten):{" "}
                {resultado.fueraDeLinea.map((p) => p.IDENTIFICADOR).join(", ")}
              </TextUI>
            )}
            {resultado.noEncontrados.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.noEncontrados.length} código
                {resultado.noEncontrados.length === 1 ? "" : "s"} sin coincidencia en {origen?.value}:{" "}
                {resultado.noEncontrados.join(", ")}
              </TextUI>
            )}
          </TarjetaCabecera>
        )}

        {hayObservaciones && (
          <AvisoObservaciones theme={theme}>
            Algunas observaciones necesitan ser revisadas
          </AvisoObservaciones>
        )}

        {resultado?.productos.length > 0 && (
          <TarjetaFlexible theme={theme}>
            <TablaScroll>
              <Tabla>
                <thead>
                  <tr>
                    <Th>Identificador</Th>
                    <Th>Nombre</Th>
                    <Th>Código de barras</Th>
                    <Th>Línea</Th>
                    <Th>Observaciones</Th>
                    <Th $align="center" $ancho="70px" />
                  </tr>
                </thead>
                <tbody>
                  {resultado.productos.map((producto, index) => (
                    <Fila key={claveProducto(producto)} $par={index % 2 === 0}>
                      <Td>{producto.IDENTIFICADOR || "—"}</Td>
                      <Td $wrap>{producto.NOMBRE || "—"}</Td>
                      <Td>{producto.CODIGO_BARRAS || "—"}</Td>
                      <Td>{producto.LINEA_NEGOCIO || "—"}</Td>
                      <Td $wrap>
                        {(observaciones[claveProducto(producto)] || []).map((texto) => (
                          <TextoObservacion key={texto} theme={theme}>
                            {texto}
                          </TextoObservacion>
                        ))}
                      </Td>
                      <Td $align="center">
                        <ButtonUI
                          iconLeft="FaXmark"
                          variant="outlined"
                          onClick={() => quitarProducto(producto)}
                          title="Quitar de la lista"
                        />
                      </Td>
                    </Fila>
                  ))}
                </tbody>
              </Tabla>
            </TablaScroll>
          </TarjetaFlexible>
        )}
      </Contenedor>
    </ContainerUI>
  );
}

export default ImportarProductos;
