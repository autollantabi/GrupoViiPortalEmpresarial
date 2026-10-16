import React, { useEffect, useMemo, useState } from "react";
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
import { ModalConfirmacionUI } from "components/UI/Components/ModalConfirmacionUI";
import { useTheme } from "context/ThemeContext";
import { useDebouncedValue } from "hooks/useDebouncedValue";
import {
  ListarGuiasRemision,
  MarcarGuiaRemisionEnviada,
} from "services/guiasRemisionService";

// Tiempo de espera tras la última tecla antes de consultar al servidor
const RETARDO_BUSQUEDA_MS = 500;

// Por defecto el listado muestra solo las guías pendientes de envío
const OPCIONES_ENVIO = [
  { value: "false", label: "PENDIENTES DE ENVÍO" },
  { value: "true", label: "ENVIADAS" },
  { value: "", label: "TODAS" },
];

const OPCIONES_FILAS = [10, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

const COLUMNAS = [
  { header: "Fecha de Guía", field: "fechaContabilizacion", isDate: true, align: "center" },
  { header: "Empresa", field: "empresa" },
  { header: "Nº de Guía", field: "numeroDocumento" },
  { header: "Nº de Factura", field: "numeroFactura" },
  { header: "Nombre del Cliente", field: "nombreSocio", isCliente: true, wrap: true },
  { header: "Destino", field: "ciudadDestino", wrap: true },
  { header: "Transporte", field: "transportistaNombre", wrap: true },
  { header: "Estado documento", field: "estadoDocumento", isBadgeDocumento: true, align: "center" },
  { header: "Enviado", field: "enviado", isEnviado: true, align: "center" },
];

// Transportista para el que se genera guía de entrega en el courier (hgr_guia_entrega)
const ID_TRANSPORTISTA_LAAR = "1791705726001";

// Solo el rol supervisor puede marcar como enviado; "usuario" únicamente consulta
const ROL_SUPERVISOR = "supervisor";

// estadoDocumento llega como código: 0 = Abierto, 1 = Cancelado
const textoEstadoDocumento = (valor) => {
  const v = String(valor ?? "").trim().toUpperCase();
  if (v === "0" || v === "ABIERTO") return "Abierto";
  if (v === "1" || v === "CANCELADO") return "Cancelado";
  return v || "—";
};

// ================= Fechas =================
// Rango por defecto: del primer día del mes en curso hasta hoy. Si hoy ya es un mes nuevo,
// el rango arranca en el día 1 de ese mes.
const primerDiaDelMes = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
};

const hoySinHora = () => {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

const formatFechaISO = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
};

const formatFecha = (valor) => {
  if (!valor) return "—";
  const d = new Date(`${valor}T00:00:00`);
  if (isNaN(d.getTime())) return valor;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${d.getFullYear()}`;
};

// ================= Estilos =================
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
  opacity: ${({ $cargando }) => ($cargando ? 0.5 : 1)};
  transition: opacity 0.15s ease;

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
  width: 100%;
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
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  word-break: ${({ $wrap }) => ($wrap ? "break-word" : "normal")};
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

const FilaClicable = styled(Fila)`
  cursor: ${({ $bloqueada }) => ($bloqueada ? "not-allowed" : "pointer")};
  ${({ $bloqueada, theme }) =>
    $bloqueada ? `background: ${theme.colors.error}12; color: ${theme.colors.textSecondary};` : ""}
`;

const CardModal = styled.div`
  padding: 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const CabeceraGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
`;

const CabeceraItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
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

export const GuiasRemision = ({ availableCompanies = [], routeConfig }) => {
  const { theme } = useTheme();
  const puedeMarcarEnviado = routeConfig?.rolDelRecurso === ROL_SUPERVISOR;

  const opcionesEmpresas = useMemo(() => {
    const nombres = (availableCompanies || [])
      .map((emp) => String(emp?.nombre || "").trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(nombres)).map((nombre) => ({
      value: nombre,
      label: nombre,
    }));
  }, [availableCompanies]);

  // Única fuente de verdad de lo que se consulta al servidor. Cada cambio de filtro
  // reinicia la página en la misma actualización, así se dispara una sola consulta.
  const [consulta, setConsulta] = useState(() => ({
    empresa: null,
    desde: primerDiaDelMes(),
    hasta: hoySinHora(),
    enviado: "false",
    cliente: "",
    busqueda: "",
    page: 1,
    size: OPCIONES_FILAS[1].value,
  }));

  // Lo que el usuario está escribiendo; solo se aplica a `consulta` cuando deja de teclear
  const [clienteInput, setClienteInput] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const clienteDebounced = useDebouncedValue(clienteInput.trim(), RETARDO_BUSQUEDA_MS);
  const busquedaDebounced = useDebouncedValue(busquedaInput.trim(), RETARDO_BUSQUEDA_MS);

  const [guias, setGuias] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [refrescos, setRefrescos] = useState(0);
  const [guiaSeleccionada, setGuiaSeleccionada] = useState(null);
  const [confirmandoEnvio, setConfirmandoEnvio] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const actualizarFiltros = (cambios) =>
    setConsulta((prev) => ({ ...prev, ...cambios, page: 1 }));

  // Empresa por defecto: la primera disponible para el usuario
  useEffect(() => {
    if (!consulta.empresa && opcionesEmpresas.length) {
      setConsulta((prev) => ({ ...prev, empresa: opcionesEmpresas[0].value }));
    }
  }, [opcionesEmpresas, consulta.empresa]);

  // Aplica los textos de búsqueda una vez terminado el debounce
  useEffect(() => {
    setConsulta((prev) =>
      prev.cliente === clienteDebounced && prev.busqueda === busquedaDebounced
        ? prev
        : {
          ...prev,
          cliente: clienteDebounced,
          busqueda: busquedaDebounced,
          page: 1,
        }
    );
  }, [clienteDebounced, busquedaDebounced]);

  // Consulta paginada al servidor. Si los filtros cambian mientras hay una consulta
  // en vuelo, se cancela para que una respuesta lenta no pise a la más reciente.
  useEffect(() => {
    if (!consulta.empresa) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await ListarGuiasRemision(
          {
            empresa: consulta.empresa,
            page: consulta.page,
            size: consulta.size,
            fechaDesde: formatFechaISO(consulta.desde),
            fechaHasta: formatFechaISO(consulta.hasta),
            cliente: consulta.cliente,
            busqueda: consulta.busqueda,
            enviado: consulta.enviado,
          },
          controller.signal
        );
        // Si la página quedó vacía (p. ej. se marcó como enviada la última guía de la
        // última página), se vuelve a la última página con datos
        if (!data.Guias?.length && consulta.page > 1 && data.Paginacion?.totalPages > 0) {
          setConsulta((prev) => ({ ...prev, page: data.Paginacion.totalPages }));
          return;
        }
        setGuias(data.Guias || []);
        setPaginacion(data.Paginacion || null);
        setLoading(false);
        setConsultado(true);
      } catch (err) {
        if (controller.signal.aborted || err?.code === "ERR_CANCELED") return;
        console.error("Error al consultar guías de remisión:", err);
        setGuias([]);
        setPaginacion(null);
        setError(true);
        setLoading(false);
        setConsultado(true);
        toast.error("No se pudo obtener el listado de guías de remisión");
      }
    })();

    return () => controller.abort();
  }, [consulta, refrescos]);

  // ================= Handlers de filtros =================
  const handleEmpresa = (opt) => opt && actualizarFiltros({ empresa: opt.value });

  const handleEnvio = (opt) => opt && actualizarFiltros({ enviado: opt.value });

  // El rango nunca queda vacío ni invertido: "desde" no pasa de "hasta" y viceversa
  // (además de los min/max del selector); si se borra una fecha vuelve a su valor por defecto.
  const handleDesde = (fecha) => {
    const nueva = fecha || primerDiaDelMes();
    actualizarFiltros({
      desde: nueva,
      hasta: nueva > consulta.hasta ? nueva : consulta.hasta,
    });
  };

  const handleHasta = (fecha) => {
    const nueva = fecha || hoySinHora();
    if (nueva < consulta.desde) return;
    actualizarFiltros({ hasta: nueva });
  };

  const handleFilas = (opt) => opt && actualizarFiltros({ size: opt.value });

  const recargar = () => setRefrescos((n) => n + 1);

  // Las guías canceladas no tienen detalle: solo se avisa, sin abrir el modal
  const abrirDetalle = (guia) => {
    if (textoEstadoDocumento(guia.estadoDocumento) === "Cancelado") {
      toast.warn("No se puede visualizar el detalle de la guía de remisión", {
        toastId: "guia-cancelada",
      });
      return;
    }
    setGuiaSeleccionada(guia);
  };

  const confirmarMarcarEnviado = async () => {
    if (!puedeMarcarEnviado || !guiaSeleccionada || enviando) return;
    setEnviando(true);
    try {
      await MarcarGuiaRemisionEnviada({
        id: guiaSeleccionada.id,
        empresa: consulta.empresa,
      });
      // El modal pasa a ENVIADO y se vuelve a consultar el listado (la guía deja de
      // aparecer si el filtro es "pendientes de envío")
      setGuiaSeleccionada((prev) => (prev ? { ...prev, enviado: true } : prev));
      recargar();
      toast.success("Guía de remisión marcada como enviada");
    } catch (err) {
      console.error("Error al marcar la guía como enviada:", err);
      toast.error(err?.response?.data?.message || "No se pudo marcar la guía como enviada");
    } finally {
      setEnviando(false);
      setConfirmandoEnvio(false);
    }
  };

  // ================= Paginación =================
  const totalPaginas = Math.max(1, paginacion?.totalPages || 1);

  const irAPagina = (nueva) => {
    const limitada = Math.min(Math.max(1, nueva), totalPaginas);
    setConsulta((prev) => ({ ...prev, page: limitada }));
  };

  // ================= Render =================
  const colorEstadoDocumento = (valor) =>
    textoEstadoDocumento(valor) === "Cancelado"
      ? theme.colors.error
      : theme.colors.info || theme.colors.primary;

  const renderCelda = (item, columna) => {
    const valor = item[columna.field];

    if (columna.isEnviado) {
      return (
        <Badge $color={item.enviado ? theme.colors.success : theme.colors.textSecondary}>
          {item.enviado ? "Verdadero" : "Falso"}
        </Badge>
      );
    }
    if (columna.isBadgeDocumento) {
      return (
        <Badge $color={colorEstadoDocumento(valor)}>
          {textoEstadoDocumento(valor)}
        </Badge>
      );
    }

    // Nombre del cliente y, debajo, su código de socio
    if (columna.isCliente) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span>{valor || "—"}</span>
          <TextUI size="12px" color={theme.colors.textSecondary}>
            {item.codigoSocio || "—"}
          </TextUI>
        </div>
      );
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    if (columna.isDate) return formatFecha(valor);
    return valor;
  };

  const renderContenido = () => {
    // Carga inicial (sin datos previos): spinner. En cargas posteriores la tabla se
    // mantiene visible, atenuada, para que el cambio de filtros no parpadee.
    if (loading && !guias.length) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando guías de remisión...</TextUI>
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
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
        </Vacio>
      );
    }

    if (!guias.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaFileLines" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin guías de remisión</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            {consultado
              ? "No se encontraron guías con los filtros seleccionados."
              : "Seleccione una empresa para consultar la información."}
          </TextUI>
        </Vacio>
      );
    }

    const inicio = (consulta.page - 1) * consulta.size;

    return (
      <>
        <TablaScroll $cargando={loading}>
          <Tabla>
            <thead>
              <tr>
                {COLUMNAS.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guias.map((guia, index) => (
                <FilaClicable
                  key={guia.id}
                  $par={index % 2 === 0}
                  $bloqueada={textoEstadoDocumento(guia.estadoDocumento) === "Cancelado"}
                  onClick={() => abrirDetalle(guia)}
                >
                  {COLUMNAS.map((columna) => (
                    <Td key={columna.field} $align={columna.align} $wrap={columna.wrap}>
                      {renderCelda(guia, columna)}
                    </Td>
                  ))}
                </FilaClicable>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {inicio + 1}–{inicio + guias.length} de {paginacion?.total ?? 0} registros
          </TextUI>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonUI
              iconLeft="FaArrowLeft"
              onClick={() => irAPagina(consulta.page - 1)}
              disabled={loading || consulta.page <= 1}
            />
            <PageInput
              theme={theme}
              type="number"
              min={1}
              max={totalPaginas}
              value={consulta.page}
              onChange={(e) => irAPagina(Number(e.target.value) || 1)}
            />
            <TextUI size="13px" color={theme.colors.textSecondary}>
              de {totalPaginas}
            </TextUI>
            <ButtonUI
              iconLeft="FaArrowRight"
              onClick={() => irAPagina(consulta.page + 1)}
              disabled={loading || consulta.page >= totalPaginas}
            />
          </div>

          <SelectUI
            options={OPCIONES_FILAS}
            value={OPCIONES_FILAS.find((o) => o.value === consulta.size)}
            onChange={handleFilas}
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
          No tiene acceso a ninguna empresa para consultar guías de remisión.
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
      translate="no"
      className="notranslate"
    >
      <Contenedor theme={theme}>
        <TextUI weight="bold" size="22px">
          Guías de Remisión
        </TextUI>

        <FiltrosContainer theme={theme}>
          <FiltroGrupo theme={theme}>
            <label>Desde</label>
            <DateSelectorUI fecha={consulta.desde} onChange={handleDesde} max={consulta.hasta} />
          </FiltroGrupo>

          <FiltroGrupo theme={theme}>
            <label>Hasta</label>
            <DateSelectorUI fecha={consulta.hasta} onChange={handleHasta} min={consulta.desde} />
          </FiltroGrupo>

          <SelectUI
            label="Empresa"
            options={opcionesEmpresas}
            value={opcionesEmpresas.find((o) => o.value === consulta.empresa) || null}
            onChange={handleEmpresa}
            placeholder="Empresa"
            isDisabled={opcionesEmpresas.length <= 1}
            isSearchable={false}
            minWidth="170px"
            maxWidth="200px"
          />

          <SelectUI
            label="Envío"
            options={OPCIONES_ENVIO}
            value={OPCIONES_ENVIO.find((o) => o.value === consulta.enviado)}
            onChange={handleEnvio}
            isSearchable={false}
            minWidth="210px"
            maxWidth="230px"
          />

          <FiltroGrupo theme={theme} style={{ minWidth: "230px" }}>
            <label>Cliente</label>
            <InputUI
              placeholder="Código de socio o nombre..."
              value={clienteInput}
              onChange={setClienteInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <FiltroGrupo theme={theme} style={{ minWidth: "260px" }}>
            <label>Buscar</label>
            <InputUI
              placeholder="N° documento, código o nombre..."
              value={busquedaInput}
              onChange={setBusquedaInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <div>
            <ButtonUI
              iconLeft="FaRotateRight"
              variant="outlined"
              onClick={recargar}
              disabled={loading}
            />
          </div>
        </FiltrosContainer>

        <Tarjeta>{renderContenido()}</Tarjeta>
      </Contenedor>

      <ModalUI
        isOpen={!!guiaSeleccionada}
        onClose={() => setGuiaSeleccionada(null)}
        title={`Guía de Remisión N° ${guiaSeleccionada?.numeroDocumento ?? ""}`}
        maxWidth="900px"
        width="95%"
        hideDefaultButtons
      >
        {guiaSeleccionada && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {puedeMarcarEnviado && !guiaSeleccionada.enviado && (
              <div style={{ display: "flex", justifyContent: "end" }}>
                <ButtonUI
                  text="Marcar como enviado"
                  iconLeft="FaFileCircleCheck"
                  onClick={() => setConfirmandoEnvio(true)}
                  disabled={enviando}
                />
              </div>
            )}

            <CardModal theme={theme}>
              <CabeceraGrid>
                {[
                  ["Empresa", guiaSeleccionada.empresa],
                  ["Número de documento", guiaSeleccionada.numeroDocumento],
                  ["Número de factura", guiaSeleccionada.numeroFactura],
                  ["Código de socio", guiaSeleccionada.codigoSocio],
                  ["Nombre del socio", guiaSeleccionada.nombreSocio],
                  ["Fecha", formatFecha(guiaSeleccionada.fechaContabilizacion)],
                  ["Transportista", guiaSeleccionada.transportistaNombre],
                  ["Ciudad destino", guiaSeleccionada.ciudadDestino],
                ].map(([titulo, valor]) => (
                  <CabeceraItem key={titulo}>
                    <TextUI size="12px" color={theme.colors.textSecondary}>
                      {titulo}
                    </TextUI>
                    <TextUI weight="bold">{valor || "—"}</TextUI>
                  </CabeceraItem>
                ))}
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    Estado documento
                  </TextUI>
                  <div>
                    <Badge $color={colorEstadoDocumento(guiaSeleccionada.estadoDocumento)}>
                      {textoEstadoDocumento(guiaSeleccionada.estadoDocumento)}
                    </Badge>
                  </div>
                </CabeceraItem>
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    Estado de envío
                  </TextUI>
                  <div>
                    <Badge
                      $color={
                        guiaSeleccionada.enviado
                          ? theme.colors.success
                          : theme.colors.textSecondary
                      }
                    >
                      {guiaSeleccionada.enviado ? "ENVIADO" : "NO ENVIADO"}
                    </Badge>
                  </div>
                </CabeceraItem>
              </CabeceraGrid>
            </CardModal>

            {guiaSeleccionada.transportistaId === ID_TRANSPORTISTA_LAAR && (
              <CardModal theme={theme}>
                <CabeceraItem>
                  <TextUI size="12px" color={theme.colors.textSecondary}>
                    GUÍA ENTREGA
                  </TextUI>
                  <TextUI weight="bold">{guiaSeleccionada.guiaEntrega || "—"}</TextUI>
                </CabeceraItem>
              </CardModal>
            )}
          </div>
        )}
      </ModalUI>

      {/* Va después del modal de detalle para quedar por encima de él */}
      <ModalConfirmacionUI
        isOpen={confirmandoEnvio}
        onClose={() => !enviando && setConfirmandoEnvio(false)}
        onConfirm={confirmarMarcarEnviado}
        title="Marcar como enviado"
        message={`¿Confirma que la guía de remisión N° ${guiaSeleccionada?.numeroDocumento ?? ""
          } fue enviada? Esta acción no se puede deshacer desde el portal.`}
        confirmText={enviando ? "Guardando..." : "Confirmar"}
        confirmColor={theme.colors.primary}
        iconName="FaFileCircleCheck"
      />
    </ContainerUI>
  );
};

export default GuiasRemision;
