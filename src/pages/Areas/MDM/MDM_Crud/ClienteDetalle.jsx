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
import {
  actualizarClienteMDM,
  getClienteMDM,
  getCotizacionMDM,
  getCodigosImpuestoMDM,
  getCotizacionesCliente,
  getRutasMDM,
  getVendedoresMDM,
} from "services/mdmService";

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
  { id: "cotizaciones", label: "Cotizaciones" },
];

/* Dónde vive cada campo, para poder llevar al usuario a la pestaña correcta
   cuando el guardado falla por una validación. */
const UBICACION_CAMPO = {
  NOMBRE: { tab: "general" },
  TELEFONO1: { tab: "general" },
  CORREO_ELECTRONICO: { tab: "general" },
  TIPO_DOCUMENTO: { tab: "localizacion", subTab: "ats" },
  TIPO_SOCIO_NEGOCIO: { tab: "localizacion", subTab: "ats" },
  TIPO_CONTRIBUYENTE: { tab: "localizacion", subTab: "ats" },
  ENTREGA_RETENCION: { tab: "localizacion", subTab: "ats" },
  RIMPE: { tab: "localizacion", subTab: "ats" },
  TIPO_RIMPE: { tab: "localizacion", subTab: "ats" },
  CLASE_SUJETO: { tab: "localizacion", subTab: "dinardap" },
  ORIGEN_INGRESOS: { tab: "localizacion", subTab: "dinardap" },
  SEXO: { tab: "localizacion", subTab: "dinardap" },
  ESTADO_CIVIL: { tab: "localizacion", subTab: "dinardap" },
  DIRECCIONES: { tab: "direcciones" },
};

/**
 * Recorta espacios y tabuladores. Todo lo que el usuario escribe pasa por aquí
 * antes de guardarse: un espacio al inicio o al final generaría clientes que
 * parecen distintos siendo el mismo.
 */
const recortar = (valor) =>
  valor === null || valor === undefined ? "" : String(valor).trim();

/** Igual que recortar, pero deja null cuando no quedó contenido */
const recortarONulo = (valor) => recortar(valor) || null;

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

/** Fecha con hora: en una cotización importa el momento, no solo el día */
const formatFechaHora = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "—";
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()} ${hora}:${minutos}`;
};

const formatMoneda = (valor) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-EC", { style: "currency", currency: "USD" });
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
  flex-wrap: wrap;
  gap: 12px;
`;

/* Los botones de acción se van al extremo derecho del encabezado y, si no
   caben, bajan completos en lugar de partirse. */
const AccionesEncabezado = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
`;

const AreaTexto = styled.textarea`
  width: 100%;
  min-height: 150px;
  box-sizing: border-box;
  padding: 10px 12px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.inputBackground || theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.colors.inputFocus || theme.colors.primary};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.inputFocus || theme.colors.primary};
  }
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

/* Check de solo lectura que se ve en el color del tema. El deshabilitado nativo
   se pinta gris y no permite cambiarlo, así que se dibuja a mano. */
const CheckAzul = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  border: 1.5px solid ${({ theme }) => theme.colors.primary};
  border-radius: 3px;
  background: transparent;
  cursor: default;
  display: inline-grid;
  place-content: center;
  vertical-align: middle;

  &:checked {
    background: ${({ theme }) => theme.colors.primary};
  }

  &:checked::after {
    content: "";
    width: 4px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: translateY(-1px) rotate(45deg);
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

/* Tablas de la pestaña de cotizaciones: mismo aspecto que las del listado de
   clientes, para que las dos pantallas se vean como una sola. */
const TablaScroll = styled.div`
  width: 100%;
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
  padding: 11px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.secondary};
`;

const Td = styled.td`
  padding: 9px 10px;
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

/* ButtonUI es display:flex, o sea un bloque: el text-align de la celda no lo
   centra. Este contenedor sí. */
const CeldaAccion = styled.div`
  display: flex;
  justify-content: center;
`;

const CabeceraCotizacion = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ResumenCotizacion = styled.div`
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-left: auto;
`;

const CajaComentario = styled.div`
  margin: 6px 0 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
`;

const Spaciador = styled.div`
  height: 10px;
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

  const [guardando, setGuardando] = useState(false);

  /* Vendedores activos de la empresa del cliente. null = todavía no llegaron;
     [] = llegaron y la empresa no tiene ninguno. */
  const [vendedores, setVendedores] = useState(null);

  /* Rutas activas de la empresa del cliente, con la misma convención. */
  const [rutas, setRutas] = useState(null);

  /* Códigos RI de impuesto sobre la renta de la empresa, con la regla de cuáles
     se marcan. null = todavía no llegaron. */
  const [impuestos, setImpuestos] = useState(null);

  /* Cotizaciones del cliente: se cargan al abrir la pestaña, no antes */
  const [cotizaciones, setCotizaciones] = useState(null);
  const [cargandoCotizaciones, setCargandoCotizaciones] = useState(false);
  const [cotizacionAbierta, setCotizacionAbierta] = useState(null);
  const [cargandoCotizacion, setCargandoCotizacion] = useState(false);

  /* La dirección del detalle arrastra los filtros del listado, así que volver
     es simplemente regresar a la misma dirección de la que se vino. Funciona
     igual si la pestaña se recarga o se abre el enlace directo. */
  const volverAlListado = useCallback(() => {
    navigate(`${RUTA_LISTADO}${location.search}`);
  }, [navigate, location.search]);

  /**
   * Vuelca el cliente del backend en el estado de la pantalla. Se usa tanto al
   * abrir la ficha como después de guardar, para que lo que se ve sea siempre
   * lo que quedó registrado.
   */
  const aplicarCliente = useCallback((data) => {
    setCliente(data);
    setForm({
      NOMBRE: data.NOMBRE ?? "",
      NOMBRE_COMERCIAL: data.NOMBRE_COMERCIAL ?? "",
      TELEFONO1: data.TELEFONO1 ?? "",
      TELEFONO2: data.TELEFONO2 ?? "",
      TELEFONO_MOVIL: data.TELEFONO_MOVIL ?? "",
      CORREO_ELECTRONICO: data.CORREO_ELECTRONICO ?? "",
      // El vendedor se identifica por su código. Si el backend lo encontró en el
      // listado se usan el código y el nombre tal como están en el maestro; si
      // no, se conserva lo que el cliente tenía para no perderlo al guardar.
      VENDEDOR_CODIGO: data.VENDEDOR_COINCIDENCIA?.CODIGO ?? data.VENDEDOR_CODIGO ?? null,
      VENDEDOR: data.VENDEDOR_COINCIDENCIA?.NOMBRE ?? data.VENDEDOR ?? null,
      // La ruta se identifica por su serial (dr_serial), igual que el vendedor.
      RUTA_SERIAL: data.RUTA_COINCIDENCIA?.SERIAL ?? data.RUTA_SERIAL ?? null,
      RUTA: data.RUTA_COINCIDENCIA?.NOMBRE ?? data.RUTA ?? null,
      COMENTARIOS: data.COMENTARIOS ?? "",
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

    /* Se abre la de facturación, o la primera si no hubiera, para que la ficha
       no arranque vacía. */
    setDireccionActivaId((actual) => {
      if (actual && direcciones.some((d) => d.ID === actual)) return actual;
      if (!direcciones.length) return null;
      const facturacion = direcciones.find((d) => d.TIPO === "bo_BillTo");
      return (facturacion || direcciones[0]).ID;
    });
  }, []);

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

      aplicarCliente(data);
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
  }, [id, aplicarCliente]);

  useEffect(() => {
    cargarCliente();
  }, [cargarCliente]);

  const actualizarCampo = (campo, valor) => {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  };

  /**
   * Arma lo que se va a guardar: todo el texto recortado y las direcciones con
   * su identificador, que es lo que el backend usa para saber cuál actualizar.
   */
  const construirPayload = useCallback(() => {
    const direcciones = Object.entries(direccionesForm).map(([id, d]) => ({
      ID: Number(id),
      UBICACION: recortar(d.UBICACION),
      CALLE: recortar(d.CALLE),
      CIUDAD: recortar(d.CIUDAD),
      PROVINCIA: recortar(d.PROVINCIA),
      SECTOR: recortar(d.SECTOR),
    }));

    return {
      NOMBRE: recortar(form.NOMBRE),
      NOMBRE_COMERCIAL: recortar(form.NOMBRE_COMERCIAL),
      TIPO_DOCUMENTO: form.TIPO_DOCUMENTO,
      TELEFONO1: recortar(form.TELEFONO1),
      TELEFONO2: recortar(form.TELEFONO2),
      TELEFONO_MOVIL: recortar(form.TELEFONO_MOVIL),
      CORREO_ELECTRONICO: recortar(form.CORREO_ELECTRONICO),
      VENDEDOR: recortarONulo(form.VENDEDOR),
      VENDEDOR_CODIGO: recortarONulo(form.VENDEDOR_CODIGO),
      RUTA: recortarONulo(form.RUTA),
      RUTA_SERIAL: form.RUTA_SERIAL ?? null,
      COMENTARIOS: recortar(form.COMENTARIOS),
      ACTIVO: form.ACTIVO === true,
      TIPO_SOCIO_NEGOCIO: form.TIPO_SOCIO_NEGOCIO,
      TIPO_CONTRIBUYENTE: form.TIPO_CONTRIBUYENTE,
      ENTREGA_RETENCION: form.ENTREGA_RETENCION,
      RIMPE: form.RIMPE,
      TIPO_RIMPE: form.RIMPE === "SI" ? form.TIPO_RIMPE : null,
      CLASE_SUJETO: form.CLASE_SUJETO,
      ORIGEN_INGRESOS: form.ORIGEN_INGRESOS,
      SEXO: form.SEXO,
      ESTADO_CIVIL: form.ESTADO_CIVIL,
      DIRECCIONES: direcciones,
    };
  }, [form, direccionesForm]);

  /**
   * Revisa los obligatorios antes de salir a la red. El backend vuelve a
   * validar, pero avisar aquí evita un viaje y permite abrir la pestaña donde
   * está el campo que falta.
   */
  const validar = (payload) => {
    const obligatorios = [
      ["NOMBRE", "Nombre"],
      ["TELEFONO1", "Teléfono 1"],
      ["CORREO_ELECTRONICO", "Correo electrónico"],
      ["TIPO_DOCUMENTO", "Tipo de Identificación"],
      ["TIPO_SOCIO_NEGOCIO", "Tipo de Socio de Negocio"],
      ["TIPO_CONTRIBUYENTE", "Tipo de Contribuyente"],
      ["ENTREGA_RETENCION", "Entrega Retención"],
      ["RIMPE", "RIMPE"],
      ["CLASE_SUJETO", "Clase del Sujeto"],
      ["ORIGEN_INGRESOS", "Origen de Ingresos"],
      ["SEXO", "Sexo"],
      ["ESTADO_CIVIL", "Estado Civil"],
    ];

    for (const [campo, etiqueta] of obligatorios) {
      if (!recortar(payload[campo])) {
        return { campo, mensaje: `El campo "${etiqueta}" es obligatorio` };
      }
    }

    if (payload.RIMPE === "SI" && !payload.TIPO_RIMPE) {
      return {
        campo: "TIPO_RIMPE",
        mensaje: 'Si el cliente es RIMPE hay que indicar el "Tipo RIMPE"',
      };
    }

    const sinProvincia = payload.DIRECCIONES.find((d) => !d.PROVINCIA);
    if (sinProvincia) {
      const nombre =
        (cliente.DIRECCIONES || []).find((d) => d.ID === sinProvincia.ID)?.NOMBRE ||
        sinProvincia.ID;
      return {
        campo: "DIRECCIONES",
        mensaje: `La dirección "${nombre}" necesita una provincia`,
      };
    }

    return null;
  };

  /** Lleva al usuario a donde está el campo que impidió guardar */
  const irAlCampo = (campo) => {
    const destino = UBICACION_CAMPO[campo];
    if (!destino) return;
    setTabActiva(destino.tab);
    if (destino.subTab) {
      setSubTabActiva((actual) => ({ ...actual, [destino.tab]: destino.subTab }));
    }
  };

  const empresaCliente = cliente?.EMPRESA;

  useEffect(() => {
    if (!empresaCliente) return;

    let cancelado = false;
    setVendedores(null);

    (async () => {
      try {
        const data = await getVendedoresMDM(empresaCliente);
        if (!cancelado) setVendedores(data);
      } catch (err) {
        if (!cancelado) {
          setVendedores([]);
          toast.error("No se pudo cargar el listado de vendedores");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaCliente]);

  useEffect(() => {
    if (!empresaCliente) return;

    let cancelado = false;
    setRutas(null);

    (async () => {
      try {
        const data = await getRutasMDM(empresaCliente);
        if (!cancelado) setRutas(data);
      } catch (err) {
        if (!cancelado) {
          setRutas([]);
          toast.error("No se pudo cargar el listado de rutas");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaCliente]);

  useEffect(() => {
    if (!empresaCliente) return;

    let cancelado = false;
    setImpuestos(null);

    (async () => {
      try {
        const data = await getCodigosImpuestoMDM(empresaCliente);
        if (!cancelado) setImpuestos(data);
      } catch (err) {
        if (!cancelado) {
          setImpuestos({ CODIGOS: [], SELECCIONADOS: { SI: [], NO: [] } });
          toast.error("No se pudo cargar el listado de códigos de impuesto");
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [empresaCliente]);

  /* Valor con el que el selector identifica al vendedor actual: su código. Un
     cliente con nombre pero sin código (ingresó por la integración con el nombre
     escrito a mano y no hubo coincidencia) no tiene código; para esos se usa el
     propio nombre con un prefijo que no puede chocar con un código real. */
  const PREFIJO_SIN_CODIGO = "NOMBRE:";
  const valorVendedor =
    form?.VENDEDOR_CODIGO ||
    (form?.VENDEDOR ? `${PREFIJO_SIN_CODIGO}${form.VENDEDOR}` : null);

  /* Opciones del selector de vendedor, identificadas por código. Si el actual no
     está en el listado (ya no es vendedor activo, o nunca coincidió) se agrega
     como una opción marcada: así no se pierde en silencio al guardar. */
  const opcionesVendedor = useMemo(() => {
    const lista = (vendedores || []).map((v) => ({ value: v.CODIGO, label: v.NOMBRE }));

    if (valorVendedor && !lista.some((o) => o.value === valorVendedor)) {
      return [
        {
          value: valorVendedor,
          label: vendedores === null ? form.VENDEDOR : `${form.VENDEDOR} (no está en el listado)`,
        },
        ...lista,
      ];
    }

    return lista;
  }, [vendedores, valorVendedor, form?.VENDEDOR]);

  /* Al elegir se guardan el código y el nombre juntos. Volver a elegir la opción
     marcada (sin código) no cambia nada. */
  const elegirVendedor = (valor) => {
    if (!valor) {
      setForm((actual) => ({ ...actual, VENDEDOR_CODIGO: null, VENDEDOR: null }));
      return;
    }
    if (valor.startsWith(PREFIJO_SIN_CODIGO)) return;

    const elegido = (vendedores || []).find((v) => v.CODIGO === valor);
    if (!elegido) return;

    setForm((actual) => ({
      ...actual,
      VENDEDOR_CODIGO: elegido.CODIGO,
      VENDEDOR: elegido.NOMBRE,
    }));
  };

  /* Ruta: mismo esquema que el vendedor, con el serial como identidad. Una ruta
     con texto pero sin serial (ingresó por la integración y no coincidió con el
     maestro) usa el texto con prefijo para no chocar con un serial real. */
  const valorRuta =
    form?.RUTA_SERIAL != null
      ? String(form.RUTA_SERIAL)
      : form?.RUTA
        ? `${PREFIJO_SIN_CODIGO}${form.RUTA}`
        : null;

  const opcionesRuta = useMemo(() => {
    const lista = (rutas || []).map((r) => ({ value: String(r.SERIAL), label: r.NOMBRE }));

    if (valorRuta && !lista.some((o) => o.value === valorRuta)) {
      return [
        {
          value: valorRuta,
          label: rutas === null ? form.RUTA : `${form.RUTA} (no está en el listado)`,
        },
        ...lista,
      ];
    }

    return lista;
  }, [rutas, valorRuta, form?.RUTA]);

  /* Al elegir se guardan el serial y la descripción juntos. */
  const elegirRuta = (valor) => {
    if (!valor) {
      setForm((actual) => ({ ...actual, RUTA_SERIAL: null, RUTA: null }));
      return;
    }
    if (valor.startsWith(PREFIJO_SIN_CODIGO)) return;

    const elegida = (rutas || []).find((r) => String(r.SERIAL) === valor);
    if (!elegida) return;

    setForm((actual) => ({
      ...actual,
      RUTA_SERIAL: elegida.SERIAL,
      RUTA: elegida.NOMBRE,
    }));
  };

  /* Las cotizaciones se piden la primera vez que se abre la pestaña: no tiene
     sentido traerlas al cargar la ficha si nadie las va a mirar. */
  useEffect(() => {
    if (tabActiva !== "cotizaciones" || cotizaciones !== null) return;

    let cancelado = false;
    (async () => {
      setCargandoCotizaciones(true);
      try {
        const data = await getCotizacionesCliente(id);
        if (!cancelado) setCotizaciones(data);
      } catch (err) {
        if (!cancelado) {
          setCotizaciones([]);
          toast.error("No se pudieron cargar las cotizaciones del cliente");
        }
      } finally {
        if (!cancelado) setCargandoCotizaciones(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [tabActiva, cotizaciones, id]);

  const abrirCotizacion = async (idCotizacion) => {
    setCargandoCotizacion(true);
    try {
      setCotizacionAbierta(await getCotizacionMDM(idCotizacion));
    } catch (err) {
      toast.error("No se pudo cargar la cotización");
    } finally {
      setCargandoCotizacion(false);
    }
  };

  const guardar = async () => {
    const payload = construirPayload();
    const error = validar(payload);

    if (error) {
      irAlCampo(error.campo);
      toast.error(error.mensaje);
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarClienteMDM(id, payload);
      // Se repuebla con lo que respondió el backend: así la pantalla queda con
      // los valores ya normalizados (recortados y en mayúsculas) y no con los
      // que se escribieron.
      aplicarCliente(actualizado);
      toast.success("Cliente guardado");
    } catch (err) {
      const respuesta = err?.response?.data;
      if (respuesta?.campo) irAlCampo(respuesta.campo);
      toast.error(respuesta?.message || "No se pudo guardar el cliente");
    } finally {
      setGuardando(false);
    }
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

  /* El color del estado se usa para el cliente y para cada cotización */
  const colorEstadoTexto = useCallback(
    (estado) => {
      const valor = (estado || "").toUpperCase();
      if (valor === ESTADO_APROBADO) return theme.colors.success;
      if (valor === ESTADO_RECHAZADO) return theme.colors.error;
      if (valor === ESTADO_PENDIENTE) return theme.colors.warning || theme.colors.secondary;
      return theme.colors.textSecondary;
    },
    [theme]
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
          <CampoCatalogo
            theme={theme}
            label="Empleado del dpto. de ventas"
            valor={valorVendedor}
            catalogo={opcionesVendedor}
            onChange={elegirVendedor}
            placeholder={
              vendedores === null
                ? "Cargando vendedores..."
                : vendedores.length === 0
                  ? "Sin vendedores para esta empresa"
                  : "Seleccione un vendedor"
            }
          />
          <CampoCatalogo
            theme={theme}
            label="Ruta"
            valor={valorRuta}
            catalogo={opcionesRuta}
            onChange={elegirRuta}
            placeholder={
              rutas === null
                ? "Cargando rutas..."
                : rutas.length === 0
                  ? "Sin rutas para esta empresa"
                  : "Seleccione una ruta"
            }
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

  /** Comentarios con los que el cliente entró al MDM */
  const renderComentarios = () => (
    <>
      <TextUI size="12px" color={theme.colors.textSecondary}>
        Comentarios registrados al ingresar el cliente. Se guardan junto con el
        resto de la ficha.
      </TextUI>
      <Spaciador />
      <AreaTexto
        theme={theme}
        value={form.COMENTARIOS ?? ""}
        onChange={(e) => actualizarCampo("COMENTARIOS", e.target.value)}
        placeholder="Sin comentarios"
      />
    </>
  );

  /** Listado de cotizaciones del cliente, o el detalle de la que se abrió */
  const renderCotizaciones = () => {
    if (cotizacionAbierta || cargandoCotizacion) {
      return renderDetalleCotizacion();
    }

    if (cargandoCotizaciones) {
      return (
        <Vacio>
          <IconUI name="FaSpinner" size={26} color={theme.colors.primary} />
          <TextUI weight="bold">Cargando cotizaciones...</TextUI>
        </Vacio>
      );
    }

    if (!cotizaciones || cotizaciones.length === 0) {
      return (
        <Vacio>
          <IconUI name="FaFileInvoiceDollar" size={26} color={theme.colors.textSecondary} />
          <TextUI weight="bold">Este cliente no tiene cotizaciones</TextUI>
        </Vacio>
      );
    }

    return (
      <TablaScroll>
        <Tabla>
          <thead>
            <tr>
              <Th>Cotización</Th>
              <Th>Fecha</Th>
              <Th $align="center">Estado</Th>
              <Th $align="right">Artículos</Th>
              <Th $align="right">Total</Th>
              <Th $align="center">Detalle</Th>
            </tr>
          </thead>
          <tbody>
            {cotizaciones.map((c, i) => (
              <Fila
                key={c.ID}
                $par={i % 2 === 0}
                $clickable
                onClick={() => abrirCotizacion(c.ID)}
                title="Ver artículos de la cotización"
              >
                <Td>N° {c.ID}</Td>
                <Td>{formatFechaHora(c.FECHA_CREACION)}</Td>
                <Td $align="center">
                  <Badge $color={colorEstadoTexto(c.ESTADO)}>
                    {etiquetaEstado(c.ESTADO)}
                  </Badge>
                </Td>
                <Td $align="right">{c.TOTAL_ARTICULOS}</Td>
                <Td $align="right">{formatMoneda(c.TOTAL)}</Td>
                <Td $align="center">
                  <CeldaAccion>
                    <ButtonUI
                      iconLeft="FaEye"
                      variant="outlined"
                      onClick={(e) => {
                        e?.stopPropagation?.();
                        abrirCotizacion(c.ID);
                      }}
                    />
                  </CeldaAccion>
                </Td>
              </Fila>
            ))}
          </tbody>
        </Tabla>
      </TablaScroll>
    );
  };

  /** Cabecera de la cotización y los artículos que incluye */
  const renderDetalleCotizacion = () => {
    if (cargandoCotizacion) {
      return (
        <Vacio>
          <IconUI name="FaSpinner" size={26} color={theme.colors.primary} />
          <TextUI weight="bold">Cargando la cotización...</TextUI>
        </Vacio>
      );
    }

    const c = cotizacionAbierta;

    return (
      <>
        <CabeceraCotizacion>
          <ButtonUI
            iconLeft="FaArrowLeft"
            variant="outlined"
            onClick={() => setCotizacionAbierta(null)}
            title="Volver a las cotizaciones"
          />
          <TextUI weight="bold" size="16px">
            Cotización N° {c.ID}
          </TextUI>
          <Badge $color={colorEstadoTexto(c.ESTADO)}>{etiquetaEstado(c.ESTADO)}</Badge>
          <ResumenCotizacion>
            <TextUI size="13px" color={theme.colors.textSecondary}>
              {c.TOTAL_ARTICULOS} {c.TOTAL_ARTICULOS === 1 ? "artículo" : "artículos"}
            </TextUI>
            <TextUI weight="bold" size="15px">
              {formatMoneda(c.TOTAL)}
            </TextUI>
          </ResumenCotizacion>
        </CabeceraCotizacion>

        {c.COMENTARIOS && (
          <>
            <TextUI size="12px" color={theme.colors.textSecondary}>
              Comentarios de la cotización
            </TextUI>
            <CajaComentario theme={theme}>{c.COMENTARIOS}</CajaComentario>
          </>
        )}

        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                <Th $align="center">#</Th>
                <Th>Código</Th>
                <Th>Artículo</Th>
                <Th $align="right">Cantidad</Th>
                <Th $align="right">Precio</Th>
                <Th $align="right">Subtotal</Th>
              </tr>
            </thead>
            <tbody>
              {(c.DETALLE || []).map((l, i) => (
                <Fila key={l.ID} $par={i % 2 === 0}>
                  <Td $align="center">{l.LINEA}</Td>
                  <Td>{l.CODIGO_ITEM}</Td>
                  {/* Si el artículo ya no está en el maestro se deja constancia
                      en vez de mostrar la celda en blanco. */}
                  <Td $wrap>
                    {l.NOMBRE || (
                      <TextUI size="13px" color={theme.colors.textSecondary}>
                        (artículo no encontrado en el maestro)
                      </TextUI>
                    )}
                  </Td>
                  <Td $align="right">{l.CANTIDAD}</Td>
                  <Td $align="right">{formatMoneda(l.PRECIO)}</Td>
                  <Td $align="right">{formatMoneda(l.SUBTOTAL)}</Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>
      </>
    );
  };

  /* Finanzas > Impuesto. Nada de esto se edita ni se guarda: todo se deduce de
     Entrega Retención, así que cambiarlo en Localización se refleja aquí al
     instante, también antes de guardar. */
  const renderImpuesto = () => {
    const sujetoRetencion = form.ENTREGA_RETENCION === "SI";
    const marcados = new Set(
      impuestos?.SELECCIONADOS?.[sujetoRetencion ? "SI" : "NO"] || []
    );
    const codigos = impuestos?.CODIGOS || [];

    return (
      <>
        <CampoFijo
          fila
          theme={theme}
          label="Entrega Retención"
          valor={form.ENTREGA_RETENCION}
        />

        <TituloSeccion theme={theme} style={{ marginTop: 22 }}>
          Código RI impuesto sobre la renta permitido
        </TituloSeccion>

        {impuestos === null ? (
          <Vacio>
            <IconUI name="FaSpinner" size={26} color={theme.colors.primary} />
            <TextUI weight="bold">Cargando códigos de impuesto...</TextUI>
          </Vacio>
        ) : codigos.length === 0 ? (
          <Vacio>
            <TextUI weight="bold">Esta empresa no tiene códigos de impuesto</TextUI>
          </Vacio>
        ) : (
          <TablaScroll style={{ maxHeight: 440 }}>
            <Tabla>
              <thead>
                <tr>
                  <Th>Código</Th>
                  <Th>Descripción</Th>
                  <Th $align="center">Sel.</Th>
                </tr>
              </thead>
              <tbody>
                {codigos.map((c, i) => (
                  <Fila key={c.CODIGO} $par={i % 2 === 0}>
                    <Td>{c.CODIGO}</Td>
                    <Td $wrap>{c.NOMBRE}</Td>
                    <Td $align="center">
                      <CheckAzul
                        theme={theme}
                        type="checkbox"
                        checked={marcados.has(c.CODIGO)}
                        disabled
                        readOnly
                        aria-label={`Código ${c.CODIGO}`}
                      />
                    </Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        )}
      </>
    );
  };

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
    if (tabActual.id === "comentarios") return renderComentarios();
    if (tabActual.id === "cotizaciones") return renderCotizaciones();

    if (tabActual.subTabs?.length) {
      const sub = tabActual.subTabs.find((s) => s.id === subTabActual);
      if (tabActual.id === "localizacion" && sub?.id === "ats") return renderAts();
      if (tabActual.id === "localizacion" && sub?.id === "dinardap")
        return renderDinardap();
      if (tabActual.id === "finanzas" && sub?.id === "impuesto") return renderImpuesto();
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

          <AccionesEncabezado>
            <ButtonUI
              text={guardando ? "Guardando..." : "Guardar"}
              iconLeft="FaFloppyDisk"
              onClick={guardar}
              disabled={guardando}
            />
            {/* El envío a SAP reutilizará la integración de clientes que ya
                existe; por ahora solo está el botón. */}
            <ButtonUI
              text="Sincronizar en SAP"
              iconLeft="FaCloudArrowUp"
              variant="outlined"
              onClick={() =>
                toast.info("La sincronización con SAP todavía no está habilitada")
              }
            />
          </AccionesEncabezado>
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
