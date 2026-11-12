import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { getProductosMDM } from "services/mdmProductosService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import {
  CirculoIcono,
  Contenedor,
  Encabezado,
  Fila,
  FiltroGrupo,
  FiltrosContainer,
  OPCIONES_FILAS,
  PageInput,
  PiePaginacion,
  RECURSO_ADMIN_PRODUCTOS,
  RUTA_COPIAR_PRECIOS,
  RUTA_COPIAR_PRODUCTOS,
  Tabla,
  TablaScroll,
  TarjetaFlexible,
  Td,
  Th,
  Vacio,
  AccionesEncabezado,
  claveProducto,
  estiloCheckboxTabla,
  RUTA_FACTURA_PRECIOS,
  RUTA_ACTUALIZAR_PRECIOS_ARCHIVO,
  RUTA_IMPORTAR_PRECIOS,
  RUTA_FACTURA_PRODUCTOS,
  RUTA_IMPORTAR_PRODUCTOS,
} from "./compartido";
import { useAlcanceProductos } from "./useAlcanceProductos";

const DEBOUNCE_BUSQUEDA_MS = 500;

const COLUMNAS = [
  { header: "Identificador", field: "IDENTIFICADOR" },
  { header: "Nombre", field: "NOMBRE", wrap: true },
  { header: "Código de barras", field: "CODIGO_BARRAS" },
  { header: "Línea", field: "LINEA_NEGOCIO" },
];

/* ----------------------- Menú de acciones ----------------------- */

const MenuWrapper = styled.div`
  position: relative;
`;

const MenuLista = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  min-width: 220px;
  padding: 6px;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
`;

const MenuOpcion = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary}14;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResumenSeleccion = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/* ----------------------- Componente ----------------------- */

function AdministracionProductos() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { opcionesEmpresas, opcionesLineas } = useAlcanceProductos();

  /* Filtros en la URL: al volver desde "Copiar productos" se reconstruye el
     mismo listado. */
  const empresaParam = searchParams.get("empresa");
  const lineaParam = searchParams.get("linea");
  const busqueda = searchParams.get("busqueda") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const size = Number(searchParams.get("size")) || OPCIONES_FILAS[1].value;

  const empresaSeleccionada =
    opcionesEmpresas.find((opt) => opt.value === empresaParam) || opcionesEmpresas[0] || null;
  const empresa = empresaSeleccionada?.value || null;
  /* Sin línea elegida se consultan todas las que el usuario tiene permitidas */
  const lineaSeleccionada = opcionesLineas.find((opt) => opt.value === lineaParam) || null;
  const lineasConsulta = useMemo(
    () => (lineaSeleccionada ? [lineaSeleccionada.value] : opcionesLineas.map((o) => o.value)),
    [lineaSeleccionada, opcionesLineas]
  );
  const filasPorPagina =
    OPCIONES_FILAS.find((opt) => opt.value === size) || OPCIONES_FILAS[1];

  const [busquedaInput, setBusquedaInput] = useState(busqueda);
  const [productos, setProductos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  /* Selección { [identificador]: producto }. Guarda el producto completo y no
     solo la clave para que sobreviva al cambio de página. */
  const [seleccion, setSeleccion] = useState({});

  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);

  const [modalDestino, setModalDestino] = useState(false);
  const [accionModal, setAccionModal] = useState("productos"); // "productos" | "precios"
  const [empresaDestino, setEmpresaDestino] = useState(null);

  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_ADMIN_PRODUCTOS), [user]);

  const actualizarFiltros = useCallback(
    (cambios, { reiniciarPagina = true } = {}) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor === null || valor === undefined || valor === "") params.delete(clave);
        else params.set(clave, String(valor));
      });
      if (reiniciarPagina) params.delete("page");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const texto = busquedaInput.trim();
      if (texto === busqueda) return;
      actualizarFiltros({ busqueda: texto });
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(timeout);
  }, [busquedaInput, busqueda, actualizarFiltros]);

  const cargarProductos = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getProductosMDM({
        empresa,
        lineas: lineasConsulta,
        page,
        size,
        busqueda: busqueda || null,
      });
      setProductos(data?.Productos || []);
      setPaginacion(data?.Paginacion || null);
    } catch (err) {
      console.error("Error al consultar los productos del MDM:", err);
      setProductos([]);
      setPaginacion(null);
      setError(true);
      toast.error("No se pudo obtener el listado de productos");
    } finally {
      setLoading(false);
    }
  }, [empresa, lineasConsulta, page, size, busqueda]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  /* Cierra el menú al hacer clic fuera */
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alClicFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [menuAbierto]);

  const handleEmpresaChange = (opt) => {
    if (!opt) return;
    /* Los productos seleccionados pertenecen a la empresa anterior */
    setSeleccion({});
    actualizarFiltros({ empresa: opt.value });
  };

  const handleLineaChange = (opt) => {
    setSeleccion({});
    actualizarFiltros({ linea: opt?.value || null });
  };

  /* ------------------------- Selección ------------------------- */

  const cantidadSeleccionada = Object.keys(seleccion).length;
  const todosEnPaginaMarcados =
    productos.length > 0 && productos.every((p) => seleccion[claveProducto(p)]);

  const alternarProducto = (producto) => {
    const clave = claveProducto(producto);
    setSeleccion((prev) => {
      const siguiente = { ...prev };
      if (siguiente[clave]) delete siguiente[clave];
      else siguiente[clave] = producto;
      return siguiente;
    });
  };

  const alternarPagina = () => {
    setSeleccion((prev) => {
      const siguiente = { ...prev };
      productos.forEach((p) => {
        if (todosEnPaginaMarcados) delete siguiente[claveProducto(p)];
        else siguiente[claveProducto(p)] = p;
      });
      return siguiente;
    });
  };

  /* ------------------------- Duplicar a empresa ------------------------- */

  const opcionesDestino = useMemo(
    () => opcionesEmpresas.filter((opt) => opt.value !== empresa),
    [opcionesEmpresas, empresa]
  );

  const abrirCargaArchivo = () => {
    setMenuAbierto(false);
    navigate(RUTA_IMPORTAR_PRODUCTOS);
  };

  const abrirPreciosFactura = () => {
    setMenuAbierto(false);
    navigate(RUTA_FACTURA_PRECIOS);
  };

  const abrirCargaFactura = () => {
    setMenuAbierto(false);
    navigate(RUTA_FACTURA_PRODUCTOS);
  };

  const abrirPreciosArchivo = () => {
    setMenuAbierto(false);
    navigate(RUTA_IMPORTAR_PRECIOS);
  };

  const abrirActualizarPreciosArchivo = () => {
    setMenuAbierto(false);
    navigate(RUTA_ACTUALIZAR_PRECIOS_ARCHIVO);
  };

  const abrirCopiarPrecios = () => {
    setMenuAbierto(false);
    setAccionModal("precios");
    setEmpresaDestino(opcionesDestino.length === 1 ? opcionesDestino[0] : null);
    setModalDestino(true);
  };

  const abrirDuplicar = () => {
    setMenuAbierto(false);
    setAccionModal("productos");
    setEmpresaDestino(opcionesDestino.length === 1 ? opcionesDestino[0] : null);
    setModalDestino(true);
  };

  const continuarCopia = () => {
    if (!empresaDestino) {
      toast.info("Seleccione la empresa destino");
      return;
    }
    const filtros = new URLSearchParams({
      origen: empresa,
      destino: empresaDestino.value,
    });
    /* Los productos viajan en el estado de la navegación: la pantalla de copia
       los muestra tal cual se seleccionaron. */
    navigate(`${accionModal === "precios" ? RUTA_COPIAR_PRECIOS : RUTA_COPIAR_PRODUCTOS}?${filtros.toString()}`, {
      state: { productos: Object.values(seleccion), volverA: searchParams.toString() },
    });
  };

  /* ------------------------- Paginación ------------------------- */

  const totalPaginas = paginacion?.totalPages || 1;

  const irAPagina = (nuevaPagina) => {
    const pagina = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    actualizarFiltros({ page: pagina === 1 ? null : pagina }, { reiniciarPagina: false });
  };

  const renderContenidoTabla = () => {
    if (loading) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando productos...</TextUI>
        </Vacio>
      );
    }

    if (error) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.error}>
            <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
          </CirculoIcono>
          <TextUI weight="bold">No se pudo cargar la información</TextUI>
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargarProductos} />
        </Vacio>
      );
    }

    if (!productos.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaBoxOpen" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin productos encontrados</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            No se encontraron productos con los filtros seleccionados.
          </TextUI>
        </Vacio>
      );
    }

    return (
      <>
        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                <Th $align="center" $ancho="48px">
                  <CheckboxUI
                    name="seleccionar-pagina"
                    checked={todosEnPaginaMarcados}
                    onChange={alternarPagina}
                    style={estiloCheckboxTabla}
                  />
                </Th>
                {COLUMNAS.map((columna) => (
                  <Th key={columna.field}>{columna.header}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => {
                const clave = claveProducto(producto);
                const marcado = Boolean(seleccion[clave]);
                return (
                  <Fila
                    key={clave}
                    $par={index % 2 === 0}
                    $seleccionada={marcado}
                    $clickable
                    onClick={() => alternarProducto(producto)}
                  >
                    <Td $align="center">
                      {/* El clic de la fila ya alterna la selección: el del
                          checkbox no debe contarse dos veces. */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <CheckboxUI
                          name={`sel-${clave}`}
                          checked={marcado}
                          onChange={() => alternarProducto(producto)}
                          style={estiloCheckboxTabla}
                        />
                      </div>
                    </Td>
                    {COLUMNAS.map((columna) => (
                      <Td key={columna.field} $wrap={columna.wrap}>
                        {producto[columna.field] || "—"}
                      </Td>
                    ))}
                  </Fila>
                );
              })}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion theme={theme}>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {productos.length} de {paginacion?.total ?? 0} registros
          </TextUI>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonUI
              iconLeft="FaArrowLeft"
              onClick={() => irAPagina(page - 1)}
              disabled={page <= 1}
            />
            <PageInput
              theme={theme}
              type="number"
              min={1}
              max={totalPaginas}
              value={page}
              onChange={(e) => irAPagina(Number(e.target.value) || 1)}
            />
            <TextUI size="13px" color={theme.colors.textSecondary}>
              de {totalPaginas}
            </TextUI>
            <ButtonUI
              iconLeft="FaArrowRight"
              onClick={() => irAPagina(page + 1)}
              disabled={page >= totalPaginas}
            />
          </div>

          <SelectUI
            options={OPCIONES_FILAS}
            value={filasPorPagina}
            onChange={(opt) => opt && actualizarFiltros({ size: opt.value })}
            minWidth="140px"
            maxWidth="160px"
            isSearchable={false}
            menuPlacement="top"
          />
        </PiePaginacion>
      </>
    );
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
          <TextUI weight="bold" size="22px">
            Administración de productos
          </TextUI>

          <AccionesEncabezado>
            {cantidadSeleccionada > 0 && (
              <ResumenSeleccion>
                <TextUI size="13px" color={theme.colors.textSecondary}>
                  {cantidadSeleccionada} seleccionado{cantidadSeleccionada === 1 ? "" : "s"}
                </TextUI>
                <ButtonUI
                  text="Limpiar"
                  variant="outlined"
                  onClick={() => setSeleccion({})}
                  title="Quitar la selección"
                />
              </ResumenSeleccion>
            )}

            <div ref={menuRef} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <MenuWrapper>
              <ButtonUI
                text="Acciones Copiar productos"
                iconLeft="FaListCheck"
                iconRight="FaChevronDown"
                onClick={() => setMenuAbierto((abierto) => (abierto === "duplicar" ? false : "duplicar"))}
                title="Acciones para duplicar productos"
              />
              {menuAbierto === "duplicar" && (
                <MenuLista theme={theme}>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirCargaFactura}
                    disabled={!puedeEditar}
                    title={
                      puedeEditar
                        ? "Copiar los productos de una factura de venta a la empresa que la compró"
                        : "Requiere el permiso de edición sobre Administración de productos"
                    }
                  >
                    <IconUI name="FaFileInvoice" size={14} color={theme.colors.primary} />
                    Cargar desde factura
                  </MenuOpcion>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirCargaArchivo}
                    disabled={!puedeEditar}
                    title={
                      puedeEditar
                        ? "Copiar productos a otra empresa a partir de un archivo txt o Excel con códigos"
                        : "Requiere el permiso de edición sobre Administración de productos"
                    }
                  >
                    <IconUI name="FaFileArrowUp" size={14} color={theme.colors.primary} />
                    Cargar desde archivo
                  </MenuOpcion>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirDuplicar}
                    disabled={!puedeEditar || cantidadSeleccionada === 0}
                    title={
                      !puedeEditar
                        ? "Requiere el permiso de edición sobre Administración de productos"
                        : cantidadSeleccionada === 0
                          ? "Seleccione uno o más productos para duplicarlos a otra empresa"
                          : "Copiar los productos seleccionados a otra empresa"
                    }
                  >
                    <IconUI name="FaCopy" size={14} color={theme.colors.primary} />
                    Duplicar a empresa
                  </MenuOpcion>
                </MenuLista>
              )}
            </MenuWrapper>
            <MenuWrapper>
              <ButtonUI
                text="Acciones Copiar Precios"
                iconLeft="FaCoins"
                iconRight="FaChevronDown"
                onClick={() => setMenuAbierto((abierto) => (abierto === "precios" ? false : "precios"))}
                title="Acciones para copiar precios"
              />
              {menuAbierto === "precios" && (
                <MenuLista theme={theme}>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirPreciosFactura}
                    disabled={!puedeEditar}
                    title={
                      puedeEditar
                        ? "Copiar los precios de los artículos de una factura a la empresa que la compró"
                        : "Requiere el permiso de edición sobre Administración de productos"
                    }
                  >
                    <IconUI name="FaFileInvoice" size={14} color={theme.colors.primary} />
                    Copiar precios desde factura
                  </MenuOpcion>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirPreciosArchivo}
                    disabled={!puedeEditar}
                    title={
                      puedeEditar
                        ? "Copiar precios a otra empresa a partir de un archivo txt o Excel con códigos"
                        : "Requiere el permiso de edición sobre Administración de productos"
                    }
                  >
                    <IconUI name="FaFileArrowUp" size={14} color={theme.colors.primary} />
                    Copiar precios desde archivo
                  </MenuOpcion>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirCopiarPrecios}
                    disabled={!puedeEditar || cantidadSeleccionada === 0}
                    title={
                      !puedeEditar
                        ? "Requiere el permiso de edición sobre Administración de productos"
                        : cantidadSeleccionada === 0
                          ? "Seleccione uno o más productos para copiar sus precios"
                          : "Copiar los precios de los productos seleccionados a otra empresa"
                    }
                  >
                    <IconUI name="FaCoins" size={14} color={theme.colors.primary} />
                    Copiar precios
                  </MenuOpcion>
                </MenuLista>
              )}
            </MenuWrapper>
            <MenuWrapper>
              <ButtonUI
                text="Acciones Actualizar precios"
                iconLeft="FaTags"
                iconRight="FaChevronDown"
                onClick={() =>
                  setMenuAbierto((abierto) => (abierto === "actualizar" ? false : "actualizar"))
                }
                title="Acciones para actualizar precios en SAP"
              />
              {menuAbierto === "actualizar" && (
                <MenuLista theme={theme}>
                  <MenuOpcion
                    theme={theme}
                    onClick={abrirActualizarPreciosArchivo}
                    disabled={!puedeEditar}
                    title={
                      puedeEditar
                        ? "Actualizar los precios de una empresa con una plantilla de precios"
                        : "Requiere el permiso de edición sobre Administración de productos"
                    }
                  >
                    <IconUI name="FaFileArrowUp" size={14} color={theme.colors.primary} />
                    Cargar desde archivo
                  </MenuOpcion>
                </MenuLista>
              )}
            </MenuWrapper>
            </div>
          </AccionesEncabezado>
        </Encabezado>

        <FiltrosContainer theme={theme}>
          <SelectUI
            label="Empresa"
            options={opcionesEmpresas}
            value={empresaSeleccionada}
            onChange={handleEmpresaChange}
            isSearchable={false}
            minWidth="180px"
            maxWidth="220px"
          />

          <SelectUI
            label="Línea de negocio"
            options={opcionesLineas}
            value={lineaSeleccionada}
            onChange={handleLineaChange}
            placeholder="Todas"
            isClearable
            isSearchable={false}
            minWidth="200px"
            maxWidth="240px"
          />

          <FiltroGrupo theme={theme} style={{ minWidth: "300px" }}>
            <label>Buscar</label>
            <InputUI
              placeholder="Identificador, nombre o código de barras..."
              value={busquedaInput}
              onChange={setBusquedaInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <div>
            <ButtonUI
              iconLeft="FaRotateRight"
              variant="outlined"
              onClick={cargarProductos}
              disabled={loading}
            />
          </div>
        </FiltrosContainer>

        <TarjetaFlexible theme={theme}>{renderContenidoTabla()}</TarjetaFlexible>
      </Contenedor>

      <ModalUI
        isOpen={modalDestino}
        onClose={() => setModalDestino(false)}
        title={accionModal === "precios" ? "Copiar precios" : "Duplicar a empresa"}
        maxWidth="520px"
        width="90%"
        saveText="Continuar"
        onSave={continuarCopia}
        isAsync={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            {accionModal === "precios" ? "Se copiarán los precios de" : "Se copiarán"} {cantidadSeleccionada} producto{cantidadSeleccionada === 1 ? "" : "s"} de{" "}
            <strong>{empresa}</strong>. {accionModal === "precios"
              ? "Elija la empresa a la que se van a copiar los precios."
              : "Elija la empresa a la que se van a duplicar."}
          </TextUI>

          {opcionesDestino.length ? (
            <SelectUI
              label="Empresa destino"
              options={opcionesDestino}
              value={empresaDestino}
              onChange={(opt) => setEmpresaDestino(opt || null)}
              placeholder="Seleccione una empresa"
              isSearchable={false}
              minWidth="100%"
              maxWidth="100%"
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            />
          ) : (
            <TextUI color={theme.colors.error}>
              No tiene otras empresas disponibles como destino.
            </TextUI>
          )}
        </div>
      </ModalUI>
    </ContainerUI>
  );
}

export default AdministracionProductos;
