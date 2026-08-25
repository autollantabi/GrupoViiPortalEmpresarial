import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { DateSelectorUI } from "components/UI/Components/DateSelectorUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import {
  ListarPedidosImportacion,
  ListarProveedores,
  ListarMarcas,
} from "services/importacionesService";

const ESTADOS_PEDIDO = [
  { value: "NULL", label: "Sin estado" },
  { value: "PEDIDO", label: "Pedido" },
  { value: "DESPACHADO", label: "Despachado" },
  { value: "BACKORDER", label: "Backorder" },
];

const OPCIONES_FILAS = [10, 15, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

const COLUMNAS_PEDIDOS = [
  { header: "N° Documento", field: "hfr_numerodocumento" },
  { header: "Empresa", field: "hfr_empresa" },
  { header: "Cuenta Socio", field: "hfr_cuentasocio" },
  { header: "Fecha Documento", field: "hfr_fechadocumento", isDate: true, align: "center" },
  { header: "Fecha Necesaria", field: "hfr_fechanecesaria", isDate: true, align: "center" },
  { header: "Fecha Máx. Envío", field: "hfr_fechamaximaenvio", isDate: true, align: "center" },
  { header: "Tipo", field: "hfr_pedidocompleto", align: "center" },
  { header: "Estado", field: "hfr_estado", isBadge: true, align: "center" },
  { header: "PI(s)", field: "PIs", isList: true },
  { header: "Marca(s)", field: "Marcas", isList: true },
  { header: "Líneas", field: "TotalLineas", align: "right" },
  { header: "Cantidad", field: "TotalCantidad", align: "right" },
  { header: "Backorder", field: "TotalBackorder", align: "right" },
  { header: "Total Pedido", field: "TotalPedido", align: "right", isMoney: true },
];

const COLUMNAS_DETALLE = [
  { header: "Línea", field: "hfr_linea", align: "center" },
  { header: "Código Item", field: "hfr_codigoitem" },
  { header: "Nombre", field: "DIT_NOMBRE" },
  { header: "Fabricante", field: "DIT_NOMBREFABRICANTE" },
  { header: "N° PI", field: "hfr_numeropi", align: "center" },
  { header: "Cantidad", field: "hfr_cantidad", align: "right", isNumber: true },
  { header: "Precio", field: "hfr_precio", align: "right", isMoney: true },
  { header: "Backorder", field: "hfr_backorder", align: "right", isNumber: true },
  { header: "Total Línea", field: "hfr_totallinea", align: "right", isMoney: true },
  { header: "Estado", field: "hfr_estado", isBadge: true, align: "center" },
  { header: "Comentario", field: "hfr_comentario2" },
];

const formatFecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(`${valor}T00:00:00`);
  if (isNaN(d.getTime())) return valor;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
};

const formatFechaISO = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${year}-${mes}-${dia}`;
};

const formatMoney = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return "—";
  return numero.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
  });
};

const formatNumero = (valor) => {
  const numero = Number(valor);
  if (isNaN(numero)) return "—";
  return numero.toLocaleString("es-EC", { maximumFractionDigits: 2 });
};

const Contenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
`;

const Encabezado = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const FiltrosContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 14px;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FiltroGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Tarjeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

const TablaScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
`;

const Tabla = styled.table`
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.secondary};
`;

const Td = styled.td`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) => ($par ? theme.colors.backgroundLight : "transparent")};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}12;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}55;
`;

const PiePaginacion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
`;

const Vacio = styled.div`
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
`;

const CirculoIcono = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => $color || theme.colors.primary}15;
`;

const PageInput = styled.input`
  width: 50px;
  text-align: center;
  padding: 6px 4px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  color: ${({ theme }) => theme.colors.text};
  font-size: 13px;
`;

const DetalleHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  padding: 4px 4px 16px;
`;

const DetalleHeaderItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const PedidosImportacion = ({ availableCompanies = [] }) => {
  const { theme } = useTheme();

  const opcionesEmpresas = useMemo(
    () =>
      (availableCompanies || [])
        .filter((emp) => emp?.nombre)
        .map((emp) => ({ value: emp.id, label: emp.nombre })),
    [availableCompanies]
  );

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [numeroDocInput, setNumeroDocInput] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(null);
  const [fechaHasta, setFechaHasta] = useState(null);
  const [page, setPage] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(OPCIONES_FILAS[1]);

  const [proveedores, setProveedores] = useState([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(false);
  const [marcas, setMarcas] = useState([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);

  const [pedidos, setPedidos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [consultado, setConsultado] = useState(false);

  const [detalleModal, setDetalleModal] = useState({
    visible: false,
    cabecera: null,
    detalle: [],
  });

  // Empresa por defecto: la primera disponible para el usuario
  useEffect(() => {
    if (!empresaSeleccionada && opcionesEmpresas.length) {
      setEmpresaSeleccionada(opcionesEmpresas[0]);
    }
  }, [opcionesEmpresas, empresaSeleccionada]);

  // Búsqueda por número de documento con debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      const limpio = numeroDocInput.replace(/\D/g, "");
      setNumeroDocumento(limpio || null);
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [numeroDocInput]);

  // Proveedores dependientes de la empresa seleccionada
  useEffect(() => {
    if (!empresaSeleccionada?.value) {
      setProveedores([]);
      return;
    }
    let cancelado = false;
    (async () => {
      setCargandoProveedores(true);
      try {
        const data = await ListarProveedores(empresaSeleccionada.value);
        if (cancelado) return;
        setProveedores(
          (data || []).map(({ value, name }) => ({ value, label: name }))
        );
      } catch (err) {
        if (!cancelado) setProveedores([]);
      } finally {
        if (!cancelado) setCargandoProveedores(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [empresaSeleccionada]);

  // Marcas dependientes de empresa + proveedor seleccionados
  useEffect(() => {
    if (!empresaSeleccionada?.value || !proveedorSeleccionado?.value) {
      setMarcas([]);
      return;
    }
    let cancelado = false;
    (async () => {
      setCargandoMarcas(true);
      try {
        const data = await ListarMarcas(
          empresaSeleccionada.value,
          proveedorSeleccionado.value
        );
        if (cancelado) return;
        setMarcas(
          (data || []).map(({ value, name }) => ({ value, label: name }))
        );
      } catch (err) {
        if (!cancelado) setMarcas([]);
      } finally {
        if (!cancelado) setCargandoMarcas(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [empresaSeleccionada, proveedorSeleccionado]);

  const cargarPedidos = useCallback(async () => {
    if (!empresaSeleccionada?.label) return;

    setLoading(true);
    setError(false);
    try {
      const response = await ListarPedidosImportacion({
        page,
        size: filasPorPagina.value,
        empresa: empresaSeleccionada.label,
        cuentaSocio: proveedorSeleccionado?.value || null,
        numeroDocumento: numeroDocumento ? Number(numeroDocumento) : null,
        estado: estadoSeleccionado?.value || null,
        marca: marcaSeleccionada?.value || null,
        fechaDesde: formatFechaISO(fechaDesde),
        fechaHasta: formatFechaISO(fechaHasta),
      });

      if (response?.status === "Ok!" && response.data) {
        setPedidos(response.data.Pedidos || []);
        setPaginacion(response.data.Paginacion || null);
      } else {
        setPedidos([]);
        setPaginacion(null);
        setError(true);
      }
    } catch (err) {
      console.error("Error al consultar pedidos de importación:", err);
      setPedidos([]);
      setPaginacion(null);
      setError(true);
      toast.error("No se pudo obtener el listado de pedidos");
    } finally {
      setLoading(false);
      setConsultado(true);
    }
  }, [
    empresaSeleccionada,
    proveedorSeleccionado,
    marcaSeleccionada,
    estadoSeleccionado,
    numeroDocumento,
    fechaDesde,
    fechaHasta,
    page,
    filasPorPagina,
  ]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const handleEmpresaChange = (opt) => {
    setEmpresaSeleccionada(opt);
    setProveedorSeleccionado(null);
    setMarcaSeleccionada(null);
    setPage(1);
  };

  const handleProveedorChange = (opt) => {
    setProveedorSeleccionado(opt || null);
    setMarcaSeleccionada(null);
    setPage(1);
  };

  const handleMarcaChange = (opt) => {
    setMarcaSeleccionada(opt || null);
    setPage(1);
  };

  const handleEstadoChange = (opt) => {
    setEstadoSeleccionado(opt || null);
    setPage(1);
  };

  const handleFechaDesde = (fecha) => {
    setFechaDesde(fecha);
    setPage(1);
  };

  const handleFechaHasta = (fecha) => {
    setFechaHasta(fecha);
    setPage(1);
  };

  const handleFilasPorPagina = (opt) => {
    setFilasPorPagina(opt);
    setPage(1);
  };

  const abrirDetalle = (pedido) => {
    setDetalleModal({
      visible: true,
      cabecera: pedido.Cabecera,
      detalle: pedido.Detalle || [],
    });
  };

  const cerrarDetalle = () => {
    setDetalleModal({ visible: false, cabecera: null, detalle: [] });
  };

  const colorEstado = (estado) => {
    const valor = (estado || "").toUpperCase();
    if (valor === "DESPACHADO") return theme.colors.success;
    if (valor === "BACKORDER") return theme.colors.warning || theme.colors.error;
    if (valor === "NULL" || !valor) return theme.colors.textSecondary;
    return theme.colors.info || theme.colors.primary;
  };

  const renderCelda = (item, columna) => {
    const valor = item[columna.field];

    if (columna.isBadge) {
      const texto = valor || "—";
      return <Badge $color={colorEstado(valor)}>{texto}</Badge>;
    }
    if (columna.isList) {
      return Array.isArray(valor) && valor.length ? valor.join(", ") : "—";
    }
    if (columna.isDate) {
      return formatFecha(valor);
    }
    if (columna.isMoney) {
      return formatMoney(valor);
    }
    if (columna.isNumber) {
      return formatNumero(valor);
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

  const totalPaginas = paginacion?.totalPages || 1;

  const irAPagina = (nuevaPagina) => {
    const clamped = Math.min(Math.max(1, nuevaPagina), totalPaginas);
    setPage(clamped);
  };

  const renderContenidoTabla = () => {
    if (loading) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando pedidos...</TextUI>
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
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargarPedidos} />
        </Vacio>
      );
    }

    if (!pedidos.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaBoxOpen" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin pedidos encontrados</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            {consultado
              ? "No se encontraron pedidos con los filtros seleccionados."
              : "Seleccione una empresa para consultar la información."}
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
                {COLUMNAS_PEDIDOS.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
                <Th $align="center">Detalle</Th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido, index) => {
                const cabecera = pedido.Cabecera || {};
                return (
                  <Fila key={`${cabecera.hfr_numerodocumento}-${index}`} $par={index % 2 === 0}>
                    {COLUMNAS_PEDIDOS.map((columna) => (
                      <Td key={columna.field} $align={columna.align}>
                        {renderCelda(cabecera, columna)}
                      </Td>
                    ))}
                    <Td $align="center">
                      <ButtonUI
                        iconLeft="FaEye"
                        variant="outlined"
                        onClick={() => abrirDetalle(pedido)}
                      />
                    </Td>
                  </Fila>
                );
              })}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {pedidos.length} de {paginacion?.total ?? 0} registros
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
            onChange={(opt) => opt && handleFilasPorPagina(opt)}
            minWidth="140px"
            maxWidth="160px"
            isSearchable={false}
            menuPlacement="top"
          />
        </PiePaginacion>
      </>
    );
  };

  if (!opcionesEmpresas.length) {
    return (
      <Contenedor theme={theme}>
        <TextUI weight="bold" size="18px">
          No tiene acceso a ninguna empresa para consultar pedidos de importación.
        </TextUI>
      </Contenedor>
    );
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
          <TextUI weight="bold" size="22px">
            Pedidos de Importación
          </TextUI>
        </Encabezado>

        <FiltrosContainer theme={theme}>
          <FiltroGrupo theme={theme}>
            <label>Desde</label>
            <DateSelectorUI fecha={fechaDesde} onChange={handleFechaDesde} max={fechaHasta} />
          </FiltroGrupo>

          <FiltroGrupo theme={theme}>
            <label>Hasta</label>
            <DateSelectorUI fecha={fechaHasta} onChange={handleFechaHasta} min={fechaDesde} />
          </FiltroGrupo>

          <SelectUI
            label="Empresa"
            options={opcionesEmpresas}
            value={empresaSeleccionada}
            onChange={handleEmpresaChange}
            placeholder="Empresa"
            isDisabled={loading || opcionesEmpresas.length <= 1}
            minWidth="170px"
            maxWidth="200px"
          />

          <SelectUI
            label="Proveedor"
            options={proveedores}
            value={proveedorSeleccionado}
            onChange={handleProveedorChange}
            placeholder={cargandoProveedores ? "Cargando..." : "Todos"}
            isDisabled={cargandoProveedores}
            isClearable
            minWidth="180px"
            maxWidth="220px"
          />

          <SelectUI
            label="Marca"
            options={marcas}
            value={marcaSeleccionada}
            onChange={handleMarcaChange}
            placeholder={
              !proveedorSeleccionado
                ? "Seleccione proveedor"
                : cargandoMarcas
                ? "Cargando..."
                : "Todas"
            }
            isDisabled={!proveedorSeleccionado || cargandoMarcas}
            isClearable
            minWidth="170px"
            maxWidth="200px"
          />

          <SelectUI
            label="Estado"
            options={ESTADOS_PEDIDO}
            value={estadoSeleccionado}
            onChange={handleEstadoChange}
            placeholder="Todos"
            isClearable
            isSearchable={false}
            minWidth="150px"
            maxWidth="180px"
          />

          <FiltroGrupo theme={theme} style={{ minWidth: "180px" }}>
            <label>N° Documento</label>
            <InputUI
              placeholder="Buscar documento..."
              value={numeroDocInput}
              onChange={setNumeroDocInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <div>
            <ButtonUI
              iconLeft="FaRotateRight"
              variant="outlined"
              onClick={cargarPedidos}
              disabled={loading}
            />
          </div>
        </FiltrosContainer>

        <Tarjeta>{renderContenidoTabla()}</Tarjeta>
      </Contenedor>

      <ModalUI
        isOpen={detalleModal.visible}
        onClose={cerrarDetalle}
        title={`Detalle Pedido N° ${detalleModal.cabecera?.hfr_numerodocumento || ""}`}
        maxWidth="1200px"
        width="95%"
        hideDefaultButtons
      >
        {detalleModal.cabecera && (
          <>
            <DetalleHeader>
              <DetalleHeaderItem>
                <TextUI size="12px" color={theme.colors.textSecondary}>Empresa</TextUI>
                <TextUI weight="bold">{detalleModal.cabecera.hfr_empresa}</TextUI>
              </DetalleHeaderItem>
              <DetalleHeaderItem>
                <TextUI size="12px" color={theme.colors.textSecondary}>Cuenta Socio</TextUI>
                <TextUI weight="bold">{detalleModal.cabecera.hfr_cuentasocio}</TextUI>
              </DetalleHeaderItem>
              <DetalleHeaderItem>
                <TextUI size="12px" color={theme.colors.textSecondary}>Fecha Documento</TextUI>
                <TextUI weight="bold">{formatFecha(detalleModal.cabecera.hfr_fechadocumento)}</TextUI>
              </DetalleHeaderItem>
              <DetalleHeaderItem>
                <TextUI size="12px" color={theme.colors.textSecondary}>Estado</TextUI>
                <Badge $color={colorEstado(detalleModal.cabecera.hfr_estado)}>
                  {detalleModal.cabecera.hfr_estado || "—"}
                </Badge>
              </DetalleHeaderItem>
              <DetalleHeaderItem>
                <TextUI size="12px" color={theme.colors.textSecondary}>Total Pedido</TextUI>
                <TextUI weight="bold">{formatMoney(detalleModal.cabecera.TotalPedido)}</TextUI>
              </DetalleHeaderItem>
            </DetalleHeader>

            <TablaScroll style={{ maxHeight: "50vh" }}>
              <Tabla>
                <thead>
                  <tr>
                    {COLUMNAS_DETALLE.map((columna) => (
                      <Th key={columna.field} $align={columna.align}>
                        {columna.header}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalleModal.detalle.map((item, index) => (
                    <Fila key={`${item.hfr_codigo}-${index}`} $par={index % 2 === 0}>
                      {COLUMNAS_DETALLE.map((columna) => (
                        <Td key={columna.field} $align={columna.align}>
                          {renderCelda(item, columna)}
                        </Td>
                      ))}
                    </Fila>
                  ))}
                </tbody>
              </Tabla>
            </TablaScroll>
          </>
        )}
      </ModalUI>
    </ContainerUI>
  );
};

export default PedidosImportacion;
