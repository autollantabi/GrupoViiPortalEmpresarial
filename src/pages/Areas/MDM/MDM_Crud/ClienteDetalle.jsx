import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { getClienteMDM } from "services/mdmService";

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const RUTA_LISTADO = "/mdm/clientes";

const ESTADO_PENDIENTE = "PENDIENTE";
const ESTADO_APROBADO = "APROBADO";
const ESTADO_RECHAZADO = "RECHAZADO";

/* Tipos de dirección de SAP y el nombre con el que se muestran en la ficha.
   El orden es el del menú de direcciones: primero facturación, luego envíos. */
const GRUPOS_DIRECCION = [
  { tipo: "bo_BillTo", label: "Destinatario de factura" },
  { tipo: "bo_ShipTo", label: "Destino" },
];

/* Dentro de cada grupo van primero las direcciones con nombre fijo y después
   las numeradas (01, 02, ...), que es el orden en el que las crea la
   integración. */
const ORDEN_NOMBRES_FIJOS = ["PRINCIPAL", "GENERAL"];

const PAIS_POR_DEFECTO = "Ecuador";

/* ------------------------------------------------------------------ */
/* Catálogos de la localización ecuatoriana (pestaña ATS)              */
/*                                                                     */
/* El backend guarda y devuelve el CÓDIGO; las etiquetas viven aquí    */
/* porque solo las necesita la pantalla.                               */
/* ------------------------------------------------------------------ */

const TIPOS_IDENTIFICACION = [
  { value: "01", label: "RUC" },
  { value: "02", label: "Cédula" },
];

const TIPOS_SOCIO_NEGOCIO = [
  { value: "01", label: "Persona Natural" },
  { value: "02", label: "Sociedad" },
];

const TIPOS_PAGO_RESIDENCIA = [
  { value: "01", label: "Pago a Residente" },
  { value: "02", label: "Pago a No Residente" },
];

const TIPOS_CONTRIBUYENTE = [
  { value: "01", label: "Persona Natural No Obligado a Llevar Contabilidad" },
  { value: "02", label: "Persona Natural Obligado a Llevar Contabilidad" },
  { value: "03", label: "Sociedad" },
  { value: "04", label: "Contribuyente Especial" },
  { value: "05", label: "Contribuyente Régimen Simplificado RISE" },
  { value: "06", label: "Otros" },
  { value: "07", label: "Servicios Profesionales" },
];

const TIPOS_RIMPE = [
  { value: "01", label: "RIMPE Emprendedores" },
  { value: "02", label: "RIMPE Negocios Populares" },
];

/* Campos donde la clave y el valor son el mismo texto */
const OPCIONES_SI_NO = [
  { value: "SI", label: "SI" },
  { value: "NO", label: "NO" },
];

/* --------------------------- DINARDAP --------------------------- */

const CLASES_SUJETO = [
  { value: "N", label: "Persona Natural" },
  { value: "J", label: "Persona Jurídica" },
];

const ORIGENES_INGRESOS = [
  { value: "B", label: "Empleado público" },
  { value: "V", label: "Empleado privado" },
  { value: "I", label: "Independiente" },
  { value: "A", label: "Ama de casa o estudiante" },
  { value: "R", label: "Rentista" },
  { value: "J", label: "Jubilado" },
  { value: "M", label: "Remesas del exterior" },
];

const SEXOS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

const ESTADOS_CIVILES = [
  { value: "S", label: "Soltero" },
  { value: "C", label: "Casado" },
  { value: "D", label: "Divorciado" },
  { value: "U", label: "Unión Libre" },
  { value: "V", label: "Viudo" },
];


/* Pestañas de la ficha de socio de negocios de SAP. Por ahora solo General
   y Direcciones tienen contenido; el resto queda definido para ir llenándolo
   por fases. */
const TABS = [
  { id: "general", label: "General" },
  { id: "direcciones", label: "Direcciones" },
  {
    id: "localizacion",
    label: "Localización Ecuador",
    subTabs: [
      { id: "ats", label: "ATS" },
      { id: "dinardap", label: "DINARDAP" },
    ],
  },
  {
    id: "finanzas",
    label: "Finanzas",
    subTabs: [{ id: "impuesto", label: "Impuesto" }],
  },
  { id: "comentarios", label: "Comentarios" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const formatFecha = (valor) => {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
};

/**
 * Ordena las direcciones de un grupo: PRINCIPAL y GENERAL primero, luego las
 * numeradas en orden ascendente (01, 02, 10 y no 01, 10, 02).
 */
const ordenarDirecciones = (direcciones) =>
  [...direcciones].sort((a, b) => {
    const posA = ORDEN_NOMBRES_FIJOS.indexOf(a.NOMBRE);
    const posB = ORDEN_NOMBRES_FIJOS.indexOf(b.NOMBRE);

    if (posA !== -1 || posB !== -1) {
      if (posA === -1) return 1;
      if (posB === -1) return -1;
      return posA - posB;
    }

    const numA = Number(a.NOMBRE);
    const numB = Number(b.NOMBRE);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

    return String(a.NOMBRE).localeCompare(String(b.NOMBRE));
  });

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
  flex-wrap: wrap;
  gap: 12px;
`;

const Tarjeta = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
`;

/* Rejilla fluida: las columnas se acomodan solas según el ancho disponible, así
   que no hay posiciones fijas que se puedan solapar al encoger la ventana. */
const Rejilla = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px 20px;
  align-items: start;
`;

/* Disposición en filas: una etiqueta por línea y el control ocupando todo el
   ancho restante. Se usa donde los valores son largos (razón social, dirección)
   y en columnas se cortaban a media palabra. */
const Filas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/* Cabecera a dos columnas, como la ficha de SAP. Cada columna apila sus campos
   en filas; por debajo de 900px pasan a una sola columna para que la etiqueta
   y el input no queden demasiado estrechos. */
const CabeceraColumnas = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const FilaCampo = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  gap: 4px 16px;
  align-items: center;

  /* En pantallas angostas la etiqueta pasa arriba, así el input no se queda
     con 80px de ancho. */
  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
`;

const EtiquetaFila = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`;

/* min-width: 0 evita que un valor largo empuje la columna y desalinee el resto */
const CampoContenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;

  > label {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const ValorFijo = styled.div`
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 8px 10px;
  box-sizing: border-box;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  /* El valor se parte en varias líneas antes que recortarse: el motivo del
     cambio a filas fue justamente dejar de perder el final de los textos. */
  white-space: normal;
  overflow-wrap: anywhere;
`;

const BarraTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button`
  border: none;
  background: ${({ theme, $activa }) =>
    $activa ? theme.colors.backgroundCard || theme.colors.white : "transparent"};
  color: ${({ theme, $activa }) =>
    $activa ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 13px;
  font-weight: ${({ $activa }) => ($activa ? 700 : 500)};
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  border-bottom: 3px solid
    ${({ theme, $activa }) => ($activa ? theme.colors.primary : "transparent")};
  margin-bottom: -2px;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const BarraSubTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const SubTab = styled.button`
  border: 1px solid
    ${({ theme, $activa }) => ($activa ? theme.colors.primary : theme.colors.border)};
  background: ${({ theme, $activa }) =>
    $activa ? `${theme.colors.primary}15` : "transparent"};
  color: ${({ theme, $activa }) =>
    $activa ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  white-space: nowrap;
`;

const PanelTab = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-top: none;
  border-radius: 0 0 10px 10px;
`;

const Seccion = styled.div`
  & + & {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const TituloSeccion = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 14px;
`;

const GrupoRadios = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  min-height: 38px;
  align-items: center;
`;

const OpcionRadio = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};

  input {
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    width: 16px;
    height: 16px;
    margin: 0;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}55;
`;

/* Direcciones: menú a la izquierda y ficha de la seleccionada a la derecha.
   Por debajo de 860px las dos zonas se apilan, así el menú no se estrangula ni
   los campos se montan unos sobre otros. */
const LayoutDirecciones = styled.div`
  display: grid;
  grid-template-columns: minmax(200px, 260px) 1fr;
  gap: 20px;
  align-items: start;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const MenuDirecciones = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.backgroundLight};
  padding: 6px;
  max-height: 420px;
  overflow: auto;

  @media (max-width: 860px) {
    max-height: 240px;
  }
`;

const GrupoDirecciones = styled.div`
  & + & {
    margin-top: 6px;
  }
`;

const TituloGrupo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const ItemDireccion = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid
    ${({ theme, $activa }) => ($activa ? theme.colors.primary : "transparent")};
  background: ${({ theme, $activa }) =>
    $activa ? `${theme.colors.primary}18` : "transparent"};
  color: ${({ theme, $activa }) =>
    $activa ? theme.colors.primary : theme.colors.text};
  font-size: 13px;
  font-weight: ${({ $activa }) => ($activa ? 700 : 500)};
  padding: 7px 10px 7px 26px;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}12;
  }
`;

const SinDirecciones = styled.div`
  padding: 8px 10px 10px 26px;
  font-size: 12px;
  font-style: italic;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const FichaDireccion = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  min-width: 0;
`;

const TituloFicha = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Vacio = styled.div`
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 30px 20px;
`;

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */

/**
 * Envoltura de un campo. Con `fila` la etiqueta va a la izquierda y el control
 * ocupa el resto del ancho; sin ella, la etiqueta va encima (que es como se
 * arman las rejillas de varias columnas).
 */
function Campo({ label, theme, fila, children }) {
  if (fila) {
    return (
      <FilaCampo>
        <EtiquetaFila theme={theme}>{label}</EtiquetaFila>
        <div style={{ minWidth: 0 }}>{children}</div>
      </FilaCampo>
    );
  }

  return (
    <CampoContenedor theme={theme}>
      <label>{label}</label>
      {children}
    </CampoContenedor>
  );
}

/** Campo de solo lectura: se ve como un input pero no se puede editar */
function CampoFijo({ label, valor, theme, fila }) {
  return (
    <Campo label={label} theme={theme} fila={fila}>
      <ValorFijo theme={theme} title={valor || ""}>
        {valor || "—"}
      </ValorFijo>
    </Campo>
  );
}

function CampoTexto({ label, valor, onChange, theme, placeholder, fila }) {
  return (
    <Campo label={label} theme={theme} fila={fila}>
      <InputUI value={valor ?? ""} onChange={onChange} placeholder={placeholder} />
    </Campo>
  );
}

/**
 * Selector sobre un catálogo de código/etiqueta: muestra la etiqueta y guarda
 * el código, que es lo que viaja al backend y a SAP.
 */
function CampoCatalogo({
  label,
  valor,
  catalogo,
  onChange,
  theme,
  fila,
  placeholder = "Seleccione",
  soloLectura = false,
}) {
  const seleccionado = catalogo.find((opcion) => opcion.value === valor) || null;

  if (soloLectura) {
    return (
      <CampoFijo label={label} theme={theme} fila={fila} valor={seleccionado?.label} />
    );
  }

  return (
    <Campo label={label} theme={theme} fila={fila}>
      <SelectUI
        options={catalogo}
        value={seleccionado}
        onChange={(opt) => onChange(opt?.value || null)}
        placeholder={placeholder}
        isClearable
        minWidth="100%"
        maxWidth="100%"
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      />
    </Campo>
  );
}

/**
 * Selector sin catálogo todavía (vendedores, rutas). Se muestra para que la
 * ficha quede completa, pero no hay de dónde sacar las opciones: si el cliente
 * ya tiene un valor guardado, ese es el único que aparece.
 */
function CampoSelect({ label, valor, opciones, onChange, theme, placeholder, fila }) {
  const seleccionado = valor ? { value: valor, label: valor } : null;

  return (
    <Campo label={label} theme={theme} fila={fila}>
      <SelectUI
        options={opciones}
        value={seleccionado}
        onChange={(opt) => onChange(opt?.value || null)}
        placeholder={placeholder}
        isClearable
        minWidth="100%"
        maxWidth="100%"
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      />
    </Campo>
  );
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

function ClienteDetalle() {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [cliente, setCliente] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tabActiva, setTabActiva] = useState(TABS[0].id);
  const [subTabActiva, setSubTabActiva] = useState({});

  /* Direcciones editables, indexadas por su id, y cuál está abierta en la ficha */
  const [direccionesForm, setDireccionesForm] = useState({});
  const [direccionActivaId, setDireccionActivaId] = useState(null);

  /* La dirección del detalle arrastra los filtros del listado, así que volver
     es simplemente regresar a la misma dirección de la que se vino. Funciona
     igual si la pestaña se recarga o se abre el enlace directo. */
  const volverAlListado = useCallback(() => {
    navigate(`${RUTA_LISTADO}${location.search}`);
  }, [navigate, location.search]);

  const cargarCliente = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClienteMDM(id);

      if (!data) {
        setError("No se encontró el cliente solicitado.");
        setCliente(null);
        setForm(null);
        return;
      }

      setCliente(data);
      setForm({
        NOMBRE: data.NOMBRE ?? "",
        NOMBRE_COMERCIAL: data.NOMBRE_COMERCIAL ?? "",
        TELEFONO1: data.TELEFONO1 ?? "",
        TELEFONO2: data.TELEFONO2 ?? "",
        TELEFONO_MOVIL: data.TELEFONO_MOVIL ?? "",
        CORREO_ELECTRONICO: data.CORREO_ELECTRONICO ?? "",
        VENDEDOR: data.VENDEDOR ?? null,
        RUTA: data.RUTA ?? null,
        ACTIVO: data.ACTIVO !== false,
        // Localización Ecuador / ATS
        TIPO_DOCUMENTO: data.TIPO_DOCUMENTO ?? null,
        TIPO_SOCIO_NEGOCIO: data.TIPO_SOCIO_NEGOCIO ?? null,
        PAGO_RESIDENCIA: data.PAGO_RESIDENCIA ?? "01",
        TIPO_CONTRIBUYENTE: data.TIPO_CONTRIBUYENTE ?? null,
        PARTE_RELACIONADA: data.PARTE_RELACIONADA ?? "NO",
        ENTREGA_RETENCION: data.ENTREGA_RETENCION ?? "NO",
        RIMPE: data.RIMPE ?? "NO",
        TIPO_RIMPE: data.TIPO_RIMPE ?? null,
        // DINARDAP
        CLASE_SUJETO: data.CLASE_SUJETO ?? null,
        ORIGEN_INGRESOS: data.ORIGEN_INGRESOS ?? null,
        SEXO: data.SEXO ?? null,
        ESTADO_CIVIL: data.ESTADO_CIVIL ?? null,
      });

      const direcciones = data.DIRECCIONES || [];
      setDireccionesForm(
        Object.fromEntries(
          direcciones.map((direccion) => [
            direccion.ID,
            {
              NOMBRE: direccion.NOMBRE ?? "",
              UBICACION: direccion.UBICACION ?? "",
              CALLE: direccion.CALLE ?? "",
              SECTOR: direccion.SECTOR ?? "",
              CIUDAD: direccion.CIUDAD ?? "",
              PROVINCIA: direccion.PROVINCIA ?? "",
            },
          ])
        )
      );
      /* Se abre la primera dirección para que la ficha no arranque vacía */
      setDireccionActivaId(direcciones.length ? direcciones.find(a => a.TIPO  == 'bo_BillTo').ID : null);
    } catch (err) {
      console.error("Error al consultar el detalle del cliente:", err);
      const noExiste = err?.response?.status === 404;
      setError(
        noExiste
          ? "No se encontró el cliente solicitado."
          : "No se pudo cargar el detalle del cliente."
      );
      if (!noExiste) toast.error("No se pudo cargar el detalle del cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarCliente();
  }, [cargarCliente]);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  const actualizarCampoDireccion = (idDireccion, campo, valor) => {
    setDireccionesForm((actual) => ({
      ...actual,
      [idDireccion]: { ...actual[idDireccion], [campo]: valor },
    }));
  };

  /* Direcciones agrupadas por tipo, en el orden del menú de SAP */
  const gruposDirecciones = useMemo(() => {
    const direcciones = cliente?.DIRECCIONES || [];

    return GRUPOS_DIRECCION.map((grupo) => ({
      ...grupo,
      direcciones: ordenarDirecciones(
        direcciones.filter((direccion) => direccion.TIPO === grupo.tipo)
      ),
    }));
  }, [cliente]);

  const direccionActiva = useMemo(
    () => (cliente?.DIRECCIONES || []).find((d) => d.ID === direccionActivaId) || null,
    [cliente, direccionActivaId]
  );

  const colorEstado = useMemo(() => {
    const valor = (cliente?.ESTADO || "").toUpperCase();
    if (valor === ESTADO_APROBADO) return theme.colors.success;
    if (valor === ESTADO_RECHAZADO) return theme.colors.error;
    if (valor === ESTADO_PENDIENTE) return theme.colors.warning || theme.colors.secondary;
    return theme.colors.textSecondary;
  }, [cliente, theme]);

  const tabActual = TABS.find((tab) => tab.id === tabActiva) || TABS[0];
  const subTabActual =
    subTabActiva[tabActual.id] || tabActual.subTabs?.[0]?.id || null;

  /* --------------------------- Render --------------------------- */

  if (loading) {
    return (
      <ContainerUI width="100%" height="100%" style={{ padding: 0 }}>
        <Contenedor theme={theme}>
          <Vacio>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
            <TextUI weight="bold">Cargando detalle del cliente...</TextUI>
          </Vacio>
        </Contenedor>
      </ContainerUI>
    );
  }

  if (error || !cliente || !form) {
    return (
      <ContainerUI width="100%" height="100%" style={{ padding: 0 }}>
        <Contenedor theme={theme}>
          <Encabezado>
            <ButtonUI iconLeft="FaArrowLeft" variant="outlined" onClick={volverAlListado} />
            <TextUI weight="bold" size="20px">
              Detalle de cliente
            </TextUI>
          </Encabezado>
          <Vacio>
            <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
            <TextUI weight="bold">{error || "No se pudo cargar el cliente"}</TextUI>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargarCliente} />
          </Vacio>
        </Contenedor>
      </ContainerUI>
    );
  }

  const renderGeneral = () => (
    <>
      <Seccion theme={theme}>
        <TituloSeccion theme={theme}>Contacto</TituloSeccion>
        <Rejilla>
          <CampoTexto
            theme={theme}
            label="Teléfono 1"
            valor={form.TELEFONO1}
            onChange={(v) => actualizarCampo("TELEFONO1", v)}
          />
          <CampoTexto
            theme={theme}
            label="Teléfono 2"
            valor={form.TELEFONO2}
            onChange={(v) => actualizarCampo("TELEFONO2", v)}
          />
          <CampoTexto
            theme={theme}
            label="Teléfono móvil"
            valor={form.TELEFONO_MOVIL}
            onChange={(v) => actualizarCampo("TELEFONO_MOVIL", v)}
          />
          <CampoTexto
            theme={theme}
            label="Correo electrónico"
            valor={form.CORREO_ELECTRONICO}
            onChange={(v) => actualizarCampo("CORREO_ELECTRONICO", v)}
          />
        </Rejilla>
      </Seccion>

      <Seccion theme={theme}>
        <TituloSeccion theme={theme}>Asignación comercial</TituloSeccion>
        <Rejilla>
          <CampoSelect
            theme={theme}
            label="Empleado del dpto. de ventas"
            valor={form.VENDEDOR}
            opciones={form.VENDEDOR ? [{ value: form.VENDEDOR, label: form.VENDEDOR }] : []}
            onChange={(v) => actualizarCampo("VENDEDOR", v)}
            placeholder="Sin catálogo disponible"
          />
          <CampoSelect
            theme={theme}
            label="Ruta"
            valor={form.RUTA}
            opciones={form.RUTA ? [{ value: form.RUTA, label: form.RUTA }] : []}
            onChange={(v) => actualizarCampo("RUTA", v)}
            placeholder="Sin catálogo disponible"
          />
        </Rejilla>
      </Seccion>

      <Seccion theme={theme}>
        <TituloSeccion theme={theme}>Estado del socio</TituloSeccion>
        <Rejilla>
          <CampoContenedor theme={theme}>
            <label>Situación</label>
            <GrupoRadios>
              <OpcionRadio theme={theme}>
                <input
                  type="radio"
                  name="situacion"
                  checked={form.ACTIVO === true}
                  onChange={() => actualizarCampo("ACTIVO", true)}
                />
                Activo
              </OpcionRadio>
              <OpcionRadio theme={theme}>
                <input
                  type="radio"
                  name="situacion"
                  checked={form.ACTIVO === false}
                  onChange={() => actualizarCampo("ACTIVO", false)}
                />
                Inactivo
              </OpcionRadio>
            </GrupoRadios>
          </CampoContenedor>

          {/* La fecha la pone SAP al crear el socio; en el MDM solo se muestra */}
          <CampoFijo
            theme={theme}
            label="Desde"
            valor={formatFecha(cliente.FECHA_CREACION_SAP)}
          />
        </Rejilla>
      </Seccion>
    </>
  );

  const renderDirecciones = () => {
    const hayDirecciones = (cliente.DIRECCIONES || []).length > 0;

    if (!hayDirecciones) {
      return (
        <Vacio>
          <IconUI name="FaMapLocationDot" size={26} color={theme.colors.textSecondary} />
          <TextUI weight="bold">Este cliente no tiene direcciones registradas</TextUI>
        </Vacio>
      );
    }

    const datos = direccionActiva ? direccionesForm[direccionActiva.ID] : null;
    const grupoActivo = GRUPOS_DIRECCION.find((g) => g.tipo === direccionActiva?.TIPO);

    return (
      <LayoutDirecciones>
        <MenuDirecciones theme={theme}>
          {gruposDirecciones.map((grupo) => (
            <GrupoDirecciones key={grupo.tipo}>
              <TituloGrupo theme={theme}>
                <IconUI name="FaCaretDown" size={12} color={theme.colors.textSecondary} />
                {grupo.label}
              </TituloGrupo>

              {grupo.direcciones.length === 0 ? (
                <SinDirecciones theme={theme}>Sin direcciones</SinDirecciones>
              ) : (
                grupo.direcciones.map((direccion) => (
                  <ItemDireccion
                    key={direccion.ID}
                    theme={theme}
                    $activa={direccion.ID === direccionActivaId}
                    onClick={() => setDireccionActivaId(direccion.ID)}
                    title={direccion.NOMBRE}
                  >
                    {direccion.NOMBRE}
                  </ItemDireccion>
                ))
              )}
            </GrupoDirecciones>
          ))}
        </MenuDirecciones>

        {direccionActiva && datos ? (
          <FichaDireccion theme={theme}>
            <TituloFicha theme={theme}>
              <TextUI weight="bold" size="14px">
                {grupoActivo?.label || direccionActiva.TIPO}
              </TextUI>
              <TextUI size="12px" color={theme.colors.textSecondary}>
                {direccionActiva.NOMBRE}
              </TextUI>
            </TituloFicha>

            <Filas>
              {/* El nombre identifica a la dirección dentro del cliente
                  (PRINCIPAL, GENERAL, 01...) y lo asigna la integración. */}
              <CampoFijo
                fila
                theme={theme}
                label="ID de dirección"
                valor={datos.NOMBRE}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Ubicación"
                valor={datos.UBICACION}
                onChange={(v) =>
                  actualizarCampoDireccion(direccionActiva.ID, "UBICACION", v)
                }
                placeholder={`0°00'21.9"N 79°24'11.4"W`}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Dirección"
                valor={datos.CALLE}
                onChange={(v) => actualizarCampoDireccion(direccionActiva.ID, "CALLE", v)}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Parroquia"
                valor={datos.SECTOR}
                onChange={(v) => actualizarCampoDireccion(direccionActiva.ID, "SECTOR", v)}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Cantón"
                valor={datos.CIUDAD}
                onChange={(v) => actualizarCampoDireccion(direccionActiva.ID, "CIUDAD", v)}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Provincia"
                valor={datos.PROVINCIA}
                onChange={(v) =>
                  actualizarCampoDireccion(direccionActiva.ID, "PROVINCIA", v)
                }
              />
              {/* Todos los clientes del MDM son de Ecuador: la integración
                  siempre manda EC y SAP no admite otro país por esta vía. */}
              <CampoFijo fila theme={theme} label="País/Región" valor={PAIS_POR_DEFECTO} />
            </Filas>
          </FichaDireccion>
        ) : (
          <FichaDireccion theme={theme}>
            <Vacio>
              <TextUI color={theme.colors.textSecondary}>
                Seleccione una dirección del menú para ver su detalle.
              </TextUI>
            </Vacio>
          </FichaDireccion>
        )}
      </LayoutDirecciones>
    );
  };

  /**
   * Pestaña ATS de la localización ecuatoriana. Los campos guardan el código
   * del catálogo; la pantalla solo muestra la etiqueta.
   */
  const renderAts = () => {
    const esRimpe = form.RIMPE === "SI";

    /* Misma regla que valida la integración: el tipo solo tiene sentido con
       RIMPE en SI, así que al pasar a NO se limpia en vez de quedar colgado. */
    const cambiarRimpe = (valor) => {
      setForm((actual) => ({
        ...actual,
        RIMPE: valor || "NO",
        TIPO_RIMPE: valor === "SI" ? actual.TIPO_RIMPE : null,
      }));
    };

    return (
      <Filas>
        <CampoCatalogo
          fila
          theme={theme}
          label="Tipo de Identificación"
          valor={form.TIPO_DOCUMENTO}
          catalogo={TIPOS_IDENTIFICACION}
          onChange={(v) => actualizarCampo("TIPO_DOCUMENTO", v)}
        />
        <CampoCatalogo
          fila
          theme={theme}
          label="Tipo de Socio de Negocio"
          valor={form.TIPO_SOCIO_NEGOCIO}
          catalogo={TIPOS_SOCIO_NEGOCIO}
          onChange={(v) => actualizarCampo("TIPO_SOCIO_NEGOCIO", v)}
        />
        {/* Hoy siempre "Pago a Residente": se muestra el valor guardado pero no
            se elige, hasta que el negocio habilite el caso de no residente. */}
        <CampoCatalogo
          fila
          soloLectura
          theme={theme}
          label="Pago Residente o no Residente"
          valor={form.PAGO_RESIDENCIA}
          catalogo={TIPOS_PAGO_RESIDENCIA}
        />
        <CampoCatalogo
          fila
          theme={theme}
          label="Tipo de Contribuyente"
          valor={form.TIPO_CONTRIBUYENTE}
          catalogo={TIPOS_CONTRIBUYENTE}
          onChange={(v) => actualizarCampo("TIPO_CONTRIBUYENTE", v)}
        />
        {/* Siempre NO: igual que el pago a residente, se muestra el valor
            guardado pero no se elige, hasta que el negocio lo habilite. */}
        <CampoCatalogo
          fila
          soloLectura
          theme={theme}
          label="Parte Relacionada"
          valor={form.PARTE_RELACIONADA}
          catalogo={OPCIONES_SI_NO}
        />
        <CampoCatalogo
          fila
          theme={theme}
          label="Entrega Retención"
          valor={form.ENTREGA_RETENCION}
          catalogo={OPCIONES_SI_NO}
          onChange={(v) => actualizarCampo("ENTREGA_RETENCION", v || "NO")}
        />
        <CampoCatalogo
          fila
          theme={theme}
          label="RIMPE"
          valor={form.RIMPE}
          catalogo={OPCIONES_SI_NO}
          onChange={cambiarRimpe}
        />
        {esRimpe ? (
          <CampoCatalogo
            fila
            theme={theme}
            label="Tipo RIMPE"
            valor={form.TIPO_RIMPE}
            catalogo={TIPOS_RIMPE}
            onChange={(v) => actualizarCampo("TIPO_RIMPE", v)}
          />
        ) : (
          /* Con RIMPE en NO el tipo no aplica: se deja a la vista para que no
             desaparezca un campo de la ficha, pero sin opción que elegir. */
          <CampoFijo fila theme={theme} label="Tipo RIMPE" valor="" />
        )}
      </Filas>
    );
  };

  /** Pestaña DINARDAP: los cuatro catálogos del sujeto */
  const renderDinardap = () => (
    <Filas>
      <CampoCatalogo
        fila
        theme={theme}
        label="Clase del Sujeto"
        valor={form.CLASE_SUJETO}
        catalogo={CLASES_SUJETO}
        onChange={(v) => actualizarCampo("CLASE_SUJETO", v)}
      />
      <CampoCatalogo
        fila
        theme={theme}
        label="Origen de Ingresos"
        valor={form.ORIGEN_INGRESOS}
        catalogo={ORIGENES_INGRESOS}
        onChange={(v) => actualizarCampo("ORIGEN_INGRESOS", v)}
      />
      <CampoCatalogo
        fila
        theme={theme}
        label="Sexo"
        valor={form.SEXO}
        catalogo={SEXOS}
        onChange={(v) => actualizarCampo("SEXO", v)}
      />
      <CampoCatalogo
        fila
        theme={theme}
        label="Estado Civil"
        valor={form.ESTADO_CIVIL}
        catalogo={ESTADOS_CIVILES}
        onChange={(v) => actualizarCampo("ESTADO_CIVIL", v)}
      />
    </Filas>
  );

  const renderPendiente = (titulo) => (
    <Vacio>
      <IconUI name="FaScrewdriverWrench" size={26} color={theme.colors.textSecondary} />
      <TextUI weight="bold">{titulo}</TextUI>
      <TextUI color={theme.colors.textSecondary}>
        Esta sección todavía no tiene campos definidos.
      </TextUI>
    </Vacio>
  );

  const renderContenidoTab = () => {
    if (tabActual.id === "general") return renderGeneral();
    if (tabActual.id === "direcciones") return renderDirecciones();

    if (tabActual.subTabs?.length) {
      const sub = tabActual.subTabs.find((s) => s.id === subTabActual);
      if (tabActual.id === "localizacion" && sub?.id === "ats") return renderAts();
      if (tabActual.id === "localizacion" && sub?.id === "dinardap")
        return renderDinardap();
      return renderPendiente(`${tabActual.label} · ${sub?.label ?? ""}`);
    }

    return renderPendiente(tabActual.label);
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
            onClick={volverAlListado}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            {cliente.CODIGO}
          </TextUI>
          <Badge $color={colorEstado}>{etiquetaEstado(cliente.ESTADO)}</Badge>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            {cliente.EMPRESA}
          </TextUI>
        </Encabezado>

        {/* Cabecera: los mismos campos de la ficha de socio de negocios de SAP,
            sin el tipo de código (siempre manual), el tipo de socio (siempre
            cliente) ni la moneda. */}
        <Tarjeta theme={theme}>
          <CabeceraColumnas>
            <Filas>
              <CampoFijo fila theme={theme} label="Código" valor={cliente.CODIGO} />
              <CampoTexto
                fila
                theme={theme}
                label="Nombre"
                valor={form.NOMBRE}
                onChange={(v) => actualizarCampo("NOMBRE", v)}
              />
              <CampoTexto
                fila
                theme={theme}
                label="Nombre comercial"
                valor={form.NOMBRE_COMERCIAL}
                onChange={(v) => actualizarCampo("NOMBRE_COMERCIAL", v)}
              />
            </Filas>

            <Filas>
              {/* El grupo no se elige aquí: es el que quedó registrado en el MDM
                  (la integración siempre lo crea como MAYORISTA A). */}
              <CampoFijo fila theme={theme} label="Grupo" valor={cliente.GRUPO} />
              {/* El código del socio se arma como "C" + RUT, así que cambiarlo
                  aquí dejaría los dos campos en desacuerdo. */}
              <CampoFijo fila theme={theme} label="RUT" valor={cliente.IDENTIFICACION} />
            </Filas>
          </CabeceraColumnas>
        </Tarjeta>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <BarraTabs theme={theme}>
            {TABS.map((tab) => (
              <Tab
                key={tab.id}
                theme={theme}
                $activa={tab.id === tabActiva}
                onClick={() => setTabActiva(tab.id)}
              >
                {tab.label}
              </Tab>
            ))}
          </BarraTabs>

          <PanelTab theme={theme}>
            {tabActual.subTabs?.length > 0 && (
              <BarraSubTabs>
                {tabActual.subTabs.map((sub) => (
                  <SubTab
                    key={sub.id}
                    theme={theme}
                    $activa={sub.id === subTabActual}
                    onClick={() =>
                      setSubTabActiva((actual) => ({ ...actual, [tabActual.id]: sub.id }))
                    }
                  >
                    {sub.label}
                  </SubTab>
                ))}
              </BarraSubTabs>
            )}

            {renderContenidoTab()}
          </PanelTab>
        </div>
      </Contenedor>
    </ContainerUI>
  );
}

export default ClienteDetalle;
