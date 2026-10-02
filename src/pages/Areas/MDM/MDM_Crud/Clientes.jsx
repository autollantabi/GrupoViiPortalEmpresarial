import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { getClientesMDM } from "services/mdmService";
import { ListarEmpresasAdmin } from "services/administracionService";

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const RECURSO_MDM_CLIENTES = "mdm.clientes";

/* El cliente del MDM pertenece a una de estas empresas. AUTOMAX no existe como
   compañía en la integración de SAP, pero sí maneja clientes en el portal. */
const EMPRESAS_MDM = ["AUTOLLANTA", "MAXXIMUNDO", "STOX", "IKONIX", "AUTOMAX"];

const ESTADO_PENDIENTE = "PENDIENTE";
const ESTADO_APROBADO = "APROBADO";
const ESTADO_RECHAZADO = "RECHAZADO";

const OPCIONES_ESTADO = [
  { value: ESTADO_PENDIENTE, label: "Pendientes" },
  { value: ESTADO_APROBADO, label: "Aprobados" },
  { value: ESTADO_RECHAZADO, label: "Rechazados" },
];

/* Los filtros viven en la URL para que al volver desde el detalle (o al
   recargar, o con el botón atrás del navegador) se vea exactamente el mismo
   listado. Como la ausencia del parámetro significa "Pendientes" —el filtro por
   defecto—, hace falta un valor explícito para decir "todos los estados". */
const ESTADO_TODOS = "TODOS";

const OPCIONES_FILAS = [10, 15, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

/* Columnas comunes a los tres estados. Según el estado filtrado se agregan
   "Código SAP" (solo existe cuando el cliente ya fue aprobado y creado en SAP)
   y "Razón" (solo existe cuando el cliente fue rechazado). */
const COLUMNAS_BASE = [
  { header: "Código", field: "CODIGO" },
  { header: "Nombre", field: "NOMBRE", wrap: true },
  { header: "Estado", field: "ESTADO", isBadge: true, align: "center" },
  { header: "Fecha creación", field: "FECHA_CREACION", isDate: true, align: "center" },
];

const COLUMNA_CODIGO_SAP = { header: "Código SAP", field: "CODIGO_SAP", align: "center" };
const COLUMNA_RAZON = { header: "Razón", field: "_razon", align: "center" };

/* Espera de inactividad del buscador antes de disparar la consulta: mientras el
   usuario siga escribiendo no se pide nada al backend. */
const DEBOUNCE_BUSQUEDA_MS = 500;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatFechaHora = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return valor;
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()} ${hora}:${minutos}`;
};

const etiquetaEstado = (estado) => {
  const valor = (estado || "").toUpperCase();
  if (valor === ESTADO_PENDIENTE) return "Pendiente";
  if (valor === ESTADO_APROBADO) return "Aprobado";
  if (valor === ESTADO_RECHAZADO) return "Rechazado";
  return estado || "—";
};

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

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
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  word-break: ${({ $wrap }) => ($wrap ? "break-word" : "normal")};
  max-width: ${({ $wrap }) => ($wrap ? "420px" : "none")};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) => ($par ? theme.colors.backgroundLight : "transparent")};
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

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

const DetalleRechazo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const CajaMotivo = styled.div`
  padding: 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
  white-space: pre-wrap;
  word-break: break-word;
`;

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

function Clientes() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [diccionarioEmpresas, setDiccionarioEmpresas] = useState({});

  /* Filtros leídos de la URL: es la única fuente de verdad, así no hay forma de
     que la pantalla muestre un listado distinto al que describe la dirección. */
  const empresaFiltro = searchParams.get("empresa") || null;
  const estadoParam = searchParams.get("estado") || ESTADO_PENDIENTE;
  const estadoFiltro = estadoParam === ESTADO_TODOS ? null : estadoParam;
  const busqueda = searchParams.get("busqueda") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const size = Number(searchParams.get("size")) || OPCIONES_FILAS[1].value;

  const empresaSeleccionada = empresaFiltro
    ? { value: empresaFiltro, label: empresaFiltro }
    : null;
  const estadoSeleccionado =
    OPCIONES_ESTADO.find((opt) => opt.value === estadoFiltro) || null;
  const filasPorPagina =
    OPCIONES_FILAS.find((opt) => opt.value === size) || OPCIONES_FILAS[1];

  const [busquedaInput, setBusquedaInput] = useState(busqueda);

  /**
   * Escribe los filtros en la URL. `replace` evita llenar el historial con un
   * paso por cada tecla del buscador; el botón atrás sigue llevando a la
   * pantalla anterior y no a un filtro intermedio.
   */
  const actualizarFiltros = useCallback(
    (cambios, { reiniciarPagina = true } = {}) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor === null || valor === undefined || valor === "") {
          params.delete(clave);
        } else {
          params.set(clave, String(valor));
        }
      });

      if (reiniciarPagina) params.delete("page");

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const [clientes, setClientes] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [modalRechazo, setModalRechazo] = useState({ visible: false, cliente: null });

  /* Diccionario id -> nombre de empresa, para traducir el alcance del rol */
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const resp = await ListarEmpresasAdmin();
        const dict = {};
        (resp || []).forEach((emp) => {
          dict[emp.ID] = emp.NOMBRE;
        });
        setDiccionarioEmpresas(dict);
      } catch (err) {
        console.error("Error obteniendo empresas:", err);
      }
    };
    fetchEmpresas();
  }, []);

  /* Empresas que puede ver el usuario: las del alcance de su rol en
     mdm.clientes. Si el recurso todavía no tiene alcance configurado, se
     muestran las cinco empresas del MDM. */
  const opcionesEmpresas = useMemo(() => {
    const contexto = Array.isArray(user?.CONTEXTOS)
      ? user.CONTEXTOS.find((ctx) => ctx.RECURSO === RECURSO_MDM_CLIENTES)
      : null;

    const empresasAlcance = contexto?.ALCANCE?.EMPRESAS;

    if (Array.isArray(empresasAlcance) && empresasAlcance.length) {
      const permitidas = empresasAlcance
        .map((id) => diccionarioEmpresas[id])
        .filter(Boolean)
        .map((nombre) => String(nombre).trim().toUpperCase())
        .filter((nombre) => EMPRESAS_MDM.includes(nombre));

      if (permitidas.length) {
        return permitidas.map((nombre) => ({ value: nombre, label: nombre }));
      }
    }

    return EMPRESAS_MDM.map((nombre) => ({ value: nombre, label: nombre }));
  }, [user, diccionarioEmpresas]);

  /* Búsqueda por texto: se espera a que el usuario deje de escribir antes de
     consultar, para no disparar un request por cada tecla. Si lo escrito ya
     coincide con la URL no se hace nada, así el efecto no vuelve a disparar al
     montar la pantalla con un filtro ya aplicado. */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const texto = busquedaInput.trim();
      if (texto === busqueda) return;
      actualizarFiltros({ busqueda: texto });
    }, DEBOUNCE_BUSQUEDA_MS);

    return () => clearTimeout(timeout);
  }, [busquedaInput, busqueda, actualizarFiltros]);

  const cargarClientes = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getClientesMDM({
        page,
        size,
        empresa: empresaFiltro,
        estado: estadoFiltro,
        busqueda: busqueda || null,
      });

      setClientes(data?.Clientes || []);
      setPaginacion(data?.Paginacion || null);
    } catch (err) {
      console.error("Error al consultar los clientes del MDM:", err);
      setClientes([]);
      setPaginacion(null);
      setError(true);
      toast.error("No se pudo obtener el listado de clientes");
    } finally {
      setLoading(false);
    }
  }, [page, size, empresaFiltro, estadoFiltro, busqueda]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const handleEmpresaChange = (opt) => {
    actualizarFiltros({ empresa: opt?.value || null });
  };

  const handleEstadoChange = (opt) => {
    /* Sin opción seleccionada el usuario quiere ver todos los estados, que no
       es lo mismo que "sin filtro elegido todavía" (eso son los pendientes). */
    actualizarFiltros({ estado: opt?.value || ESTADO_TODOS });
  };

  const handleFilasPorPagina = (opt) => {
    actualizarFiltros({ size: opt.value });
  };

  /* Al abrir el detalle se arrastran los filtros actuales en la dirección, para
     que la flecha de volver reconstruya este mismo listado. */
  const abrirDetalle = (cliente) => {
    const filtros = searchParams.toString();
    navigate(`/mdm/clientes/${cliente.ID}${filtros ? `?${filtros}` : ""}`);
  };

  /* Las columnas dependen del estado filtrado: el código de SAP solo existe
     cuando el cliente ya fue aprobado, y la razón solo cuando fue rechazado.
     Sin filtro de estado se muestran ambas, vacías donde no aplican. */
  const columnas = useMemo(() => {
    if (estadoFiltro === ESTADO_APROBADO) return [...COLUMNAS_BASE, COLUMNA_CODIGO_SAP];
    if (estadoFiltro === ESTADO_RECHAZADO) return [...COLUMNAS_BASE, COLUMNA_RAZON];
    if (estadoFiltro === ESTADO_PENDIENTE) return COLUMNAS_BASE;

    return [...COLUMNAS_BASE, COLUMNA_CODIGO_SAP, COLUMNA_RAZON];
  }, [estadoFiltro]);

  const colorEstado = (estado) => {
    const valor = (estado || "").toUpperCase();
    if (valor === ESTADO_APROBADO) return theme.colors.success;
    if (valor === ESTADO_RECHAZADO) return theme.colors.error;
    if (valor === ESTADO_PENDIENTE) return theme.colors.warning || theme.colors.secondary;
    return theme.colors.textSecondary;
  };

  const abrirMotivoRechazo = (cliente) => {
    setModalRechazo({ visible: true, cliente });
  };

  const cerrarMotivoRechazo = () => {
    setModalRechazo({ visible: false, cliente: null });
  };

  const renderCelda = (cliente, columna) => {
    if (columna.field === "_razon") {
      if ((cliente.ESTADO || "").toUpperCase() !== ESTADO_RECHAZADO) return "—";
      return (
        <ButtonUI
          text="Ver razón"
          iconLeft="FaCircleInfo"
          variant="outlined"
          /* La fila abre el detalle: este botón tiene que quedarse en el modal */
          onClick={(e) => {
            e?.stopPropagation?.();
            abrirMotivoRechazo(cliente);
          }}
        />
      );
    }

    const valor = cliente[columna.field];

    if (columna.isBadge) {
      return <Badge $color={colorEstado(valor)}>{etiquetaEstado(valor)}</Badge>;
    }
    if (columna.isDate) {
      return formatFechaHora(valor);
    }
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

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
          <TextUI weight="bold">Cargando clientes...</TextUI>
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
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargarClientes} />
        </Vacio>
      );
    }

    if (!clientes.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaUsers" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin clientes encontrados</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            No se encontraron clientes con los filtros seleccionados.
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
                {columnas.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente, index) => (
                <Fila
                  key={cliente.ID}
                  $par={index % 2 === 0}
                  $clickable
                  onClick={() => abrirDetalle(cliente)}
                  title="Ver detalle del cliente"
                >
                  {columnas.map((columna) => (
                    <Td key={columna.field} $align={columna.align} $wrap={columna.wrap}>
                      {renderCelda(cliente, columna)}
                    </Td>
                  ))}
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {clientes.length} de {paginacion?.total ?? 0} registros
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
            Clientes
          </TextUI>
        </Encabezado>

        <FiltrosContainer theme={theme}>
          <FiltroGrupo theme={theme} style={{ minWidth: "260px" }}>
            <label>Buscar</label>
            <InputUI
              placeholder="Código o nombre del cliente..."
              value={busquedaInput}
              onChange={setBusquedaInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <SelectUI
            label="Empresa"
            options={opcionesEmpresas}
            value={empresaSeleccionada}
            onChange={handleEmpresaChange}
            placeholder="Todas"
            isClearable
            minWidth="180px"
            maxWidth="220px"
          />

          <SelectUI
            label="Estado"
            options={OPCIONES_ESTADO}
            value={estadoSeleccionado}
            onChange={handleEstadoChange}
            placeholder="Todos"
            isSearchable={false}
            minWidth="160px"
            maxWidth="190px"
          />

          <div>
            <ButtonUI
              iconLeft="FaRotateRight"
              variant="outlined"
              onClick={cargarClientes}
              disabled={loading}
            />
          </div>
        </FiltrosContainer>

        <Tarjeta theme={theme}>{renderContenidoTabla()}</Tarjeta>
      </Contenedor>

      <ModalUI
        isOpen={modalRechazo.visible}
        onClose={cerrarMotivoRechazo}
        title={`Motivo de rechazo · ${modalRechazo.cliente?.CODIGO || ""}`}
        maxWidth="600px"
        width="90%"
        hideDefaultButtons
      >
        {modalRechazo.cliente && (
          <DetalleRechazo>
            <div>
              <TextUI size="12px" color={theme.colors.textSecondary}>
                Cliente
              </TextUI>
              <TextUI weight="bold">{modalRechazo.cliente.NOMBRE}</TextUI>
            </div>

            <div>
              <TextUI size="12px" color={theme.colors.textSecondary}>
                Razón del rechazo
              </TextUI>
              <CajaMotivo theme={theme}>
                {modalRechazo.cliente.MOTIVO_RECHAZO || "No se registró un motivo de rechazo."}
              </CajaMotivo>
            </div>

            {modalRechazo.cliente.USUARIO_REVISION && (
              <div>
                <TextUI size="12px" color={theme.colors.textSecondary}>
                  Revisado por
                </TextUI>
                <TextUI weight="bold">
                  {modalRechazo.cliente.USUARIO_REVISION}
                  {modalRechazo.cliente.FECHA_REVISION
                    ? ` · ${formatFechaHora(modalRechazo.cliente.FECHA_REVISION)}`
                    : ""}
                </TextUI>
              </div>
            )}
          </DetalleRechazo>
        )}
      </ModalUI>
    </ContainerUI>
  );
}

export default Clientes;
