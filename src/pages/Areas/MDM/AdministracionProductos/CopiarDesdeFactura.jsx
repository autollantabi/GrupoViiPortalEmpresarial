import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { buscarFacturaMDM } from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import { useAlcanceProductos } from "./useAlcanceProductos";
import {
  AccionesEncabezado,
  Campo,
  CabeceraColumnas,
  Contenedor,
  Encabezado,
  Fila,
  Filas,
  RECURSO_ADMIN_PRODUCTOS,
  RUTA_ADMIN_PRODUCTOS,
  RUTA_COPIAR_PRECIOS,
  RUTA_COPIAR_PRODUCTOS,
  Tabla,
  TablaScroll,
  TarjetaCabecera,
  TarjetaFlexible,
  Td,
  Th,
  ordenarPorIdentificador,
  claveProducto,
  textoEncontrados,
} from "./compartido";

/* modo "productos" copia artículos; modo "precios" copia los precios de los artículos de la factura */
function CopiarDesdeFactura({ modo = "productos" }) {
  const esPrecios = modo === "precios";
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { opcionesEmpresas, opcionesLineas, lineasRestringidas } = useAlcanceProductos();

  const [empresa, setEmpresa] = useState(null);
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null); // respuesta de /mdm/productos/factura + fueraDeAlcance

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);

  const cambiarEmpresa = (opt) => {
    setEmpresa(opt || null);
    setResultado(null);
  };

  const buscar = async () => {
    const texto = String(numero).trim();
    if (!empresa) return toast.info("Seleccione la empresa");
    if (!/^\d+$/.test(texto)) return toast.info("Ingrese el número de la factura (solo dígitos)");

    setBuscando(true);
    try {
      const data = await buscarFacturaMDM({ empresa: empresa.value, numeroFactura: texto });
      const permitidas = opcionesLineas.map((o) => o.value);
      const enAlcance = [];
      const fueraDeAlcance = [];
      (data.Productos || []).forEach((p) => {
        if (!lineasRestringidas || permitidas.includes(p.LINEA_NEGOCIO)) enAlcance.push(p);
        else fueraDeAlcance.push(p);
      });
      setResultado({ ...data, Productos: enAlcance, fueraDeAlcance });
    } catch (err) {
      console.error("Error al buscar la factura:", err);
      setResultado(null);
      toast.error(err?.response?.data?.message || "No se pudo buscar la factura");
    } finally {
      setBuscando(false);
    }
  };

  const destino = resultado?.EmpresaDestino || null;
  const destinoPermitido = !destino || opcionesEmpresas.some((o) => o.value === destino);
  const hayProductos = (resultado?.Productos || []).length > 0;

  const motivoBloqueo = !puedeEditar
    ? "Requiere el permiso de edición sobre Administración de productos"
    : !hayProductos
      ? "Busque una factura con productos primero"
      : !destino
        ? resultado?.MotivoSinDestino || "No se pudo determinar la empresa destino"
        : !destinoPermitido
          ? `No tiene acceso a la empresa destino ${destino}`
          : "";

  const confirmar = () => {
    if (motivoBloqueo) return toast.info(motivoBloqueo);
    const filtros = new URLSearchParams({ origen: empresa.value, destino });
    navigate(`${esPrecios ? RUTA_COPIAR_PRECIOS : RUTA_COPIAR_PRODUCTOS}?${filtros.toString()}`, {
      state: { productos: resultado.Productos, volverA: "" },
    });
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
            {esPrecios ? "Copiar precios desde factura" : "Copiar productos desde factura"}
          </TextUI>

          <AccionesEncabezado>
            <ButtonUI
              text={esPrecios ? "Confirmar y revisar precios" : "Confirmar y revisar productos"}
              iconLeft="FaCheck"
              onClick={confirmar}
              disabled={Boolean(motivoBloqueo)}
              title={
                motivoBloqueo ||
                (esPrecios
                  ? "La factura es correcta: revisar los precios a copiar"
                  : "La factura es correcta: revisar los productos a copiar")
              }
            />
          </AccionesEncabezado>
        </Encabezado>

        <TarjetaCabecera theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <Campo theme={theme} label="Empresa">
                <SelectUI
                  options={opcionesEmpresas}
                  value={empresa}
                  onChange={cambiarEmpresa}
                  placeholder="Seleccione la empresa que emitió la factura"
                  minWidth="100%"
                  maxWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                />
              </Campo>
              <Campo theme={theme} label="Número de factura">
                <InputUI
                  placeholder="Ej: 410001635"
                  value={numero}
                  onChange={(valor) => {
                    setNumero(String(valor ?? "").replace(/\D/g, ""));
                    setResultado(null);
                  }}
                  iconLeft="FaFileInvoice"
                />
              </Campo>
            </Filas>

            <Filas>
              <ButtonUI
                text="Buscar factura"
                iconLeft="FaMagnifyingGlass"
                onClick={buscar}
                disabled={!empresa || !numero || buscando}
              />
            </Filas>
          </CabeceraColumnas>
        </TarjetaCabecera>

        {resultado && resultado.TotalRegistros === 0 && (
          <TarjetaCabecera theme={theme}>
            <TextUI weight="bold" color={theme.colors.error}>
              No se encontraron registros
            </TextUI>
            <TextUI size="13px" color={theme.colors.textSecondary}>
              No existe la factura {resultado.NumeroFactura} en {resultado.Empresa}.
            </TextUI>
          </TarjetaCabecera>
        )}

        {resultado && resultado.TotalRegistros > 0 && (
          <TarjetaCabecera theme={theme}>
            <TextUI weight="bold">
              Factura {resultado.NumeroFactura} · {resultado.Empresa}
            </TextUI>
            <TextUI size="13px">
              Cliente: {resultado.Cliente?.NOMBRE || "—"} ({resultado.Cliente?.CODIGO || "—"})
            </TextUI>
            {destino ? (
              <TextUI size="13px">
                Empresa destino: <strong>{destino}</strong>
              </TextUI>
            ) : (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.MotivoSinDestino || "No se pudo determinar la empresa destino"}
              </TextUI>
            )}
            {!destinoPermitido && (
              <TextUI size="13px" color={theme.colors.error}>
                No tiene acceso a la empresa destino {destino}
              </TextUI>
            )}
            <TextUI weight="bold">{textoEncontrados(resultado.Productos.length)}</TextUI>
            {resultado.fueraDeAlcance.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.fueraDeAlcance.length} fuera de sus líneas de negocio permitidas (se
                omiten): {resultado.fueraDeAlcance.map((p) => p.IDENTIFICADOR).join(", ")}
              </TextUI>
            )}
            {resultado.FueraDeLinea?.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.FueraDeLinea.length} con línea de negocio no copiable (solo LLANTAS, LLANTAS
                MOTO, LUBRICANTES y HERRAMIENTAS; se omiten):{" "}
                {resultado.FueraDeLinea.map((p) => p.IDENTIFICADOR).join(", ")}
              </TextUI>
            )}
            {resultado.SinCatalogo?.length > 0 && (
              <TextUI size="13px" color={theme.colors.error}>
                {resultado.SinCatalogo.length} artículo{resultado.SinCatalogo.length === 1 ? "" : "s"}{" "}
                de la factura sin ficha en el catálogo de productos (se omiten):{" "}
                {resultado.SinCatalogo.join(", ")}
              </TextUI>
            )}
          </TarjetaCabecera>
        )}

        {hayProductos && (
          <TarjetaFlexible theme={theme}>
            <TablaScroll>
              <Tabla>
                <thead>
                  <tr>
                    <Th>Identificador</Th>
                    <Th>Nombre</Th>
                    <Th>Código de barras</Th>
                    <Th>Línea</Th>
                  </tr>
                </thead>
                <tbody>
                  {ordenarPorIdentificador(resultado.Productos).map((producto, index) => (
                    <Fila key={claveProducto(producto)} $par={index % 2 === 0}>
                      <Td>{producto.IDENTIFICADOR || "—"}</Td>
                      <Td $wrap>{producto.NOMBRE || "—"}</Td>
                      <Td>{producto.CODIGO_BARRAS || "—"}</Td>
                      <Td>{producto.LINEA_NEGOCIO || "—"}</Td>
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

export const CopiarPreciosDesdeFactura = () => <CopiarDesdeFactura modo="precios" />;

export default CopiarDesdeFactura;
