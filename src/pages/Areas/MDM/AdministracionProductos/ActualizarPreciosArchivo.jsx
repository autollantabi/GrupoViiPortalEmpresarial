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
} from "./compartido";

const normalizar = (v) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/* Formato de plantilla por empresa: columnas del archivo que traen el código de referencia
   del proveedor y el precio final. Las demás empresas se agregan aquí cuando se definan. */
const FORMATOS = {
  IKONIX: { columnaCodigo: "item code", columnaPrecio: "pvp sin iva", etiquetaPrecio: "PVP sin IVA" },
};

/* Busca en todas las hojas la fila de encabezados con las dos columnas y lee las filas siguientes.
   Se omiten las filas sin Item Code o sin valor de precio (totales, notas al pie). */
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
      .map((f) => ({ codigo: String(f[iCodigo] ?? "").trim(), precio: f[iPrecio] }))
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
  const [procesando, setProcesando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

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
        toast.error(`No se encontraron las columnas "Item Code" y "${formato.etiquetaPrecio.toUpperCase()}" en el archivo`);
        return;
      }
      setNombreArchivo(archivo.name);
      setFilasArchivo(lectura);
      if (!lectura.length) toast.warn("El archivo no tiene filas con Item Code y precio");
    } catch (err) {
      console.error("Error al leer el archivo:", err);
      toast.error("No se pudo leer el archivo");
    }
  };

  const buscar = async () => {
    setProcesando(true);
    try {
      setFilas(await resolverPlantillaPreciosMDM({ empresa: empresa.value, filas: filasArchivo }));
    } catch (err) {
      console.error("Error al procesar la plantilla:", err);
      toast.error(err?.response?.data?.message || "No se pudo procesar la plantilla");
    } finally {
      setProcesando(false);
    }
  };

  const quitarFila = (fila) => setFilas((previo) => previo.filter((x) => x !== fila));

  const enviables = (filas || []).filter((f) => f.IDENTIFICADOR && f.PVP_SIN_IVA > 0 && !f.Observaciones.some((o) => o.includes("corresponde a")));
  const hayObservaciones = (filas || []).some((f) => f.Observaciones.length > 0);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const r = await sincronizarPlantillaPreciosMDM({
        empresa: empresa.value,
        listaPrecio: lista,
        precios: enviables.map((f) => ({ IDENTIFICADOR: f.IDENTIFICADOR, PRECIO: f.PVP_SIN_IVA })),
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
              text="Sincronizar precios"
              iconLeft="FaArrowsRotate"
              onClick={sincronizar}
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
              <Campo theme={theme} label="Empresa destino">
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
                        ? `Se leen las columnas "Item Code" y "${formato.etiquetaPrecio}"`
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
                    <Th>Item code</Th>
                    <Th>Nombre</Th>
                    <Th>Código de proveedor</Th>
                    <Th $align="right">{formato?.etiquetaPrecio}</Th>
                    <Th $align="center" $ancho="70px" />
                  </tr>
                </thead>
                <tbody>
                  {ordenarPorIdentificador(filas).map((f, index) => (
                    <Fila key={`${f.CODIGO_PROVEEDOR}-${f.IDENTIFICADOR}-${index}`} $par={index % 2 === 0}>
                      <Td>{f.IDENTIFICADOR || "—"}</Td>
                      <Td $wrap>
                        {f.NOMBRE || "—"}
                        {f.Observaciones.map((texto) => (
                          <TextoObservacion key={texto} theme={theme}>
                            {texto}
                          </TextoObservacion>
                        ))}
                      </Td>
                      <Td>{f.CODIGO_PROVEEDOR}</Td>
                      <Td $align="right">{formatear(f.PVP_SIN_IVA)}</Td>
                      <Td $align="center">
                        <ButtonUI
                          iconLeft="FaXmark"
                          variant="outlined"
                          onClick={() => quitarFila(f)}
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

export default ActualizarPreciosArchivo;
