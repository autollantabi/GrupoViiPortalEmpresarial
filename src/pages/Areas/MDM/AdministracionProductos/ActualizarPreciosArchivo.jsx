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
import {
  getListasPreciosMDM,
  resolverPlantillaPreciosMDM,
  sincronizarPlantillaPreciosMDM,
} from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import { useAlcanceProductos } from "./useAlcanceProductos";
import {
  AccionesEncabezado,
  AvisoObservaciones,
  PantallaCarga,
  ConfirmarActualizarSap,
  CabeceraColumnas,
  Campo,
  Contenedor,
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
  ordenarPorIdentificador,
  Th,
  InputIncremento,
  soloNumeros,
  redondear2,
  calcularPvp,
} from "./compartido";

const normalizar = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/* Formato de plantilla por empresa (columnas del archivo, normalizadas sin acentos).
   - IKONIX: "Item Code" (código de proveedor) y "PVP SIN IVA", que ya es el precio final.
   - Resto: "Número de artículo" (código SAP) y "PRECIO"; el PVP sale de aplicar la regla de
     incremento/descuento de la lista de precios elegida. */
const FORMATO_IKONIX = {
  columnaCodigo: "item code",
  columnaPrecio: "pvp sin iva",
  etiquetaCodigo: "Item Code",
  etiquetaPrecio: "PVP SIN IVA",
  conIncremento: false,
};
const FORMATO_NUMERO_ARTICULO = {
  columnaCodigo: "numero de articulo",
  columnaPrecio: "precio",
  etiquetaCodigo: "Número de artículo",
  etiquetaPrecio: "PRECIO",
  conIncremento: true,
};
const FORMATOS = {
  IKONIX: FORMATO_IKONIX,
  AUTOLLANTA: FORMATO_NUMERO_ARTICULO,
  MAXXIMUNDO: FORMATO_NUMERO_ARTICULO,
  STOX: FORMATO_NUMERO_ARTICULO,
};

/* Precio del archivo como número ("47,10" o "1 234,5" también); null si no es un número */
const numeroDePrecio = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return String(v ?? "").trim() !== "" && Number.isFinite(n) ? n : null;
};

/* Busca en todas las hojas la fila de encabezados con las dos columnas y lee las filas siguientes.
   Se omiten las filas sin código de artículo o sin precio válido (totales, notas al pie, "NO LLEGO"). */
const leerPlantilla = async (archivo, formato) => {
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  for (const nombre of libro.SheetNames) {
    const filas = XLSX.utils.sheet_to_json(libro.Sheets[nombre], { header: 1, raw: true, defval: "" });
    const cab = filas.findIndex(
      (f) => f.some((c) => normalizar(c) === formato.columnaCodigo) && f.some((c) => normalizar(c) === formato.columnaPrecio)
    );
    if (cab < 0) continue;
    const iCodigo = filas[cab].findIndex((c) => normalizar(c) === formato.columnaCodigo);
    const iPrecio = filas[cab].findIndex((c) => normalizar(c) === formato.columnaPrecio);
    return filas
      .slice(cab + 1)
      .map((f) => ({
        codigo: String(f[iCodigo] ?? "").trim(),
        precio: formato.conIncremento ? numeroDePrecio(f[iPrecio]) : f[iPrecio],
      }))
      .filter((f) => f.codigo && f.precio !== "" && f.precio != null);
  }
  return null;
};

const formatear = (n) =>
  n != null && Number.isFinite(Number(n)) ? (Math.round((Number(n) + Number.EPSILON) * 100) / 100).toFixed(2) : "—";

function ActualizarPreciosArchivo() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const inputArchivo = useRef(null);
  const { opcionesEmpresas } = useAlcanceProductos();

  const [empresa, setEmpresa] = useState(null);
  const [listas, setListas] = useState(null);
  const [lista, setLista] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [filasArchivo, setFilasArchivo] = useState([]);
  const [filas, setFilas] = useState(null); // resultado resuelto contra dim_item
  const [incrementos, setIncrementos] = useState({}); // { IDENTIFICADOR: string } (editable)
  const filasRef = useRef(null);
  filasRef.current = filas;
  const [procesando, setProcesando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);
  const empresasConFormato = useMemo(
    () => opcionesEmpresas.filter((o) => FORMATOS[o.value]),
    [opcionesEmpresas]
  );
  const formato = empresa ? FORMATOS[empresa.value] : null;

  useEffect(() => {
    setListas(null);
    setLista(null);
    if (!empresa) return undefined;
    let activo = true;
    getListasPreciosMDM(empresa.value)
      .then((data) => activo && setListas(data))
      .catch(() => {
        if (!activo) return;
        setListas([]);
        toast.error("No se pudieron obtener las listas de precios de la empresa");
      });
    return () => {
      activo = false;
    };
  }, [empresa]);

  const opcionesListas = useMemo(
    () => (listas || []).map((l) => ({ value: l.CODIGO, label: l.NOMBRE })),
    [listas]
  );

  const cambiarEmpresa = (opt) => {
    setEmpresa(opt || null);
    setNombreArchivo("");
    setFilasArchivo([]);
    setFilas(null);
    if (inputArchivo.current) inputArchivo.current.value = "";
  };

  const alElegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo || !formato) return;
    setFilas(null);
    try {
      const extension = archivo.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls"].includes(extension)) {
        toast.error("Formato no soportado. Use un archivo Excel (.xlsx)");
        return;
      }
      const lectura = await leerPlantilla(archivo, formato);
      if (!lectura) {
        toast.error(`No se encontraron las columnas "${formato.etiquetaCodigo}" y "${formato.etiquetaPrecio}" en el archivo`);
        return;
      }
      setNombreArchivo(archivo.name);
      setFilasArchivo(lectura);
      if (!lectura.length) toast.warn(`El archivo no tiene filas con ${formato.etiquetaCodigo} y precio`);
    } catch (err) {
      console.error("Error al leer el archivo:", err);
      toast.error("No se pudo leer el archivo");
    }
  };

  /* Aplica el resultado y deja en cada incremento el valor de la regla (vacío si no hay) */
  const aplicarResultado = (resultado) => {
    setFilas(resultado);
    setIncrementos(
      Object.fromEntries(
        resultado
          .filter((f) => f.IDENTIFICADOR)
          .map((f) => [f.IDENTIFICADOR, f.Incremento != null ? String(f.Incremento) : ""])
      )
    );
  };

  const buscar = async () => {
    setProcesando(true);
    try {
      aplicarResultado(
        await resolverPlantillaPreciosMDM({ empresa: empresa.value, filas: filasArchivo, listaPrecio: lista })
      );
    } catch (err) {
      console.error("Error al procesar la plantilla:", err);
      toast.error(err?.response?.data?.message || "No se pudo procesar la plantilla");
    } finally {
      setProcesando(false);
    }
  };

  /* Al cambiar la lista de precios se consultan de nuevo las reglas (incremento, descuento, mostrar, editar)
     de los artículos que siguen en la tabla; IKONIX no usa reglas */
  useEffect(() => {
    const actuales = filasRef.current;
    if (!formato?.conIncremento || !actuales?.length) return undefined;
    let activo = true;
    setProcesando(true);
    resolverPlantillaPreciosMDM({
      empresa: empresa.value,
      filas: actuales.map((f) => ({ codigo: f.CODIGO, precio: f.PRECIO })),
      listaPrecio: lista,
    })
      .then((resultado) => activo && aplicarResultado(resultado))
      .catch((err) => {
        console.error("Error al consultar las reglas de la lista:", err);
        if (activo) toast.error("No se pudieron consultar las reglas de la lista de precios");
      })
      .finally(() => activo && setProcesando(false));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  const quitarFila = (fila) => setFilas((previo) => previo.filter((x) => x !== fila));

  /* PVP sin IVA de la fila: IKONIX trae el final en el archivo; el resto aplica incremento/descuento sobre PRECIO.
     LLANTAS MOTO con regla usa la fórmula fija (igual que Copiar precios); delmi_editar define si se edita. */
  const calcularFila = (f) => {
    if (!formato?.conIncremento) return { pvp: f.PRECIO, mostrar: false, editable: false };
    const esMoto = String(f.LINEA_NEGOCIO ?? "").trim().toUpperCase() === "LLANTAS MOTO";
    const formulaMoto = esMoto && f.Incremento != null;
    return {
      pvp: calcularPvp(f.PRECIO, incrementos[f.IDENTIFICADOR], f.Descuento, formulaMoto),
      mostrar: f.MostrarIncremento !== false,
      editable: f.Editable !== false,
    };
  };

  const enviables = (filas || [])
    .map((f) => ({ f, pvp: calcularFila(f).pvp }))
    .filter(
      ({ f, pvp }) =>
        f.IDENTIFICADOR &&
        pvp != null &&
        redondear2(pvp) > 0 &&
        !f.Observaciones.some((o) => o.includes("corresponde a"))
    );
  const hayObservaciones = (filas || []).some((f) => f.Observaciones.length > 0);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const r = await sincronizarPlantillaPreciosMDM({
        empresa: empresa.value,
        listaPrecio: lista,
        precios: enviables.map(({ f, pvp }) => ({ IDENTIFICADOR: f.IDENTIFICADOR, PRECIO: redondear2(pvp) })),
      });
      toast.success(`${r?.Actualizados ?? enviables.length} precio(s) sincronizados con SAP (${r?.Compania ?? empresa.value})`);
      if (r?.Omitidos?.length) toast.warn(`Omitidos: ${r.Omitidos.join(", ")}`);
    } catch (err) {
      console.error("Error al sincronizar precios:", err);
      toast.error(err?.response?.data?.message || "No se pudieron sincronizar los precios con SAP");
    } finally {
      setSincronizando(false);
    }
  };

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
          <ButtonUI
            iconLeft="FaArrowLeft"
            variant="outlined"
            onClick={() => navigate(RUTA_ADMIN_PRODUCTOS)}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            Actualizar precios desde archivo
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text="Actualizar precios sap"
              iconLeft="FaArrowsRotate"
              onClick={() => setConfirmando(true)}
              disabled={!puedeEditar || sincronizando || lista == null || !enviables.length}
              title={
                !puedeEditar
                  ? "Requiere el permiso de edición sobre Administración de productos"
                  : lista == null
                    ? "Seleccione la lista de precios"
                    : !enviables.length
                      ? "No hay artículos con precio para enviar"
                      : "Enviar los precios a SAP con la lista de precios seleccionada"
              }
            />
          </AccionesEncabezado>
        </Encabezado>

        <TarjetaCabecera theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <Campo theme={theme} label="Empresa">
                <SelectUI
                  options={empresasConFormato}
                  value={empresa}
                  onChange={cambiarEmpresa}
                  placeholder="Seleccione la empresa"
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
              <Campo theme={theme} label="Aplicar a">
                <SelectUI
                  options={opcionesListas}
                  value={opcionesListas.find((o) => o.value === lista) || null}
                  onChange={(opt) => setLista(opt?.value ?? null)}
                  placeholder={
                    !empresa
                      ? "Seleccione primero la empresa"
                      : listas === null
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

            <Filas>
              <Campo theme={theme} label="Plantilla (Excel)">
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    ref={inputArchivo}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={alElegirArchivo}
                    style={{ display: "none" }}
                  />
                  <ButtonUI
                    text="Elegir archivo"
                    iconLeft="FaFileArrowUp"
                    variant="outlined"
                    onClick={() => inputArchivo.current?.click()}
                    disabled={!empresa}
                  />
                  <TextUI size="13px" color={theme.colors.textSecondary}>
                    {nombreArchivo
                      ? `${nombreArchivo} · ${filasArchivo.length} fila${filasArchivo.length === 1 ? "" : "s"}`
                      : formato
                        ? `Se leen las columnas "${formato.etiquetaCodigo}" y "${formato.etiquetaPrecio}"`
                        : "Seleccione la empresa para ver el formato"}
                  </TextUI>
                </div>
              </Campo>
              <ButtonUI
                text="Buscar productos"
                iconLeft="FaMagnifyingGlass"
                onClick={buscar}
                disabled={!empresa || !filasArchivo.length || procesando}
              />
            </Filas>
          </CabeceraColumnas>
        </TarjetaCabecera>

        {filas && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <TextUI weight="bold">
              {filas.length} fila{filas.length === 1 ? "" : "s"} · {enviables.length} con precio para enviar
            </TextUI>
            {hayObservaciones && (
              <AvisoObservaciones theme={theme}>Algunas filas tienen observaciones</AvisoObservaciones>
            )}
          </div>
        )}

        {filas?.length > 0 && (
          <TarjetaFlexible theme={theme}>
            <TablaScroll>
              <Tabla>
                <thead>
                  <tr>
                    <Th>Identificador</Th>
                    <Th>Nombre</Th>
                    <Th>Código de barras</Th>
                    <Th>Línea</Th>
                    {formato?.conIncremento && <Th $align="right">Precio</Th>}
                    {formato?.conIncremento && <Th $align="right">Incremento %</Th>}
                    <Th $align="right">PVP sin IVA</Th>
                    <Th $align="center" $ancho="70px" />
                  </tr>
                </thead>
                <tbody>
                  {ordenarPorIdentificador(filas).map((f, index) => {
                    const { pvp, mostrar, editable } = calcularFila(f);
                    return (
                    <Fila key={`${f.CODIGO}-${f.IDENTIFICADOR}-${index}`} $par={index % 2 === 0}>
                      <Td>{f.IDENTIFICADOR || "—"}</Td>
                      <Td $wrap>
                        {f.NOMBRE || "—"}
                        {f.Observaciones.map((texto) => (
                          <TextoObservacion key={texto} theme={theme}>
                            {texto}
                          </TextoObservacion>
                        ))}
                      </Td>
                      <Td>{f.CODIGO_BARRAS || "—"}</Td>
                      <Td>{f.LINEA_NEGOCIO || "—"}</Td>
                      {formato?.conIncremento && <Td $align="right">{formatear(f.PRECIO)}</Td>}
                      {formato?.conIncremento && (
                        <Td $align="right">
                          {f.IDENTIFICADOR && (
                            <InputIncremento
                              theme={theme}
                              inputMode="decimal"
                              value={mostrar ? incrementos[f.IDENTIFICADOR] ?? "" : ""}
                              disabled={lista == null || !editable || !mostrar}
                              onChange={(e) =>
                                setIncrementos((previo) => ({ ...previo, [f.IDENTIFICADOR]: soloNumeros(e.target.value) }))
                              }
                              placeholder={mostrar && editable ? "0" : ""}
                            />
                          )}
                        </Td>
                      )}
                      <Td $align="right">{formatear(pvp)}</Td>
                      <Td $align="center">
                        <ButtonUI
                          iconLeft="FaXmark"
                          variant="outlined"
                          onClick={() => quitarFila(f)}
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
        )}
      </Contenedor>
    </ContainerUI>
  );
}

export default ActualizarPreciosArchivo;
