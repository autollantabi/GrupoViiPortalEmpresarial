import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { getLiquidacionesPrecios } from "services/mdmService";

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

/* AUTOMAX conserva el proceso anterior de pricing: no genera liquidaciones */
const EMPRESAS_LIQUIDACION = ["AUTOLLANTA", "MAXXIMUNDO", "STOX"];

const ESTADO_PENDIENTE = "PENDIENTE";
const ESTADO_APROBADO = "APROBADO";
const ESTADO_CANCELADO = "CANCELADO";

const OPCIONES_ESTADO = [
  { value: ESTADO_PENDIENTE, label: "Pendientes" },
  { value: ESTADO_APROBADO, label: "Aprobadas" },
  { value: ESTADO_CANCELADO, label: "Canceladas" },
];

/* Los filtros viven en la URL (igual que en Clientes) para que volver desde el
   detalle reconstruya el mismo listado. Sin parámetro, el estado es Pendientes;
   TODOS es el valor explícito para ver todos los estados. */
const ESTADO_TODOS = "TODOS";

const COLUMNAS = [
  { header: "PI", field: "NUMERO_PI" },
  { header: "Nro. liquidación", field: "NUMERO_IMPORTACION" },
  { header: "Empresa", field: "EMPRESA" },
  { header: "Fecha liquidación", field: "FECHA_LIQUIDACION", isFecha: true, align: "center" },
  { header: "Fecha creación", field: "FECHA_CREACION", isFechaHora: true, align: "center" },
  { header: "Estado", field: "ESTADO", isBadge: true, align: "center" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/* La fecha de liquidación llega como "aaaa-mm-dd" (sin hora): se formatea sin
   pasar por Date para que la zona horaria no la corra un día. */
const formatFecha = (valor) => {
  if (!valor) return "—";
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
};

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
  if (valor === ESTADO_APROBADO) return "Aprobada";
  if (valor === ESTADO_CANCELADO) return "Cancelada";
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
  white-space: nowrap;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) => ($par ? theme.colors.backgroundLight : "transparent")};
  cursor: pointer;

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

const PiePie = styled.div`
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

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

function LiquidacionesPrecios() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const empresaFiltro = searchParams.get("empresa") || null;
  const estadoParam = searchParams.get("estado") || ESTADO_PENDIENTE;
  const estadoFiltro = estadoParam === ESTADO_TODOS ? null : estadoParam;
  const busqueda = searchParams.get("busqueda") || "";

  const [busquedaInput, setBusquedaInput] = useState(busqueda);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const actualizarFiltros = useCallback(
    (cambios) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor === null || valor === undefined || valor === "") params.delete(clave);
        else params.set(clave, String(valor));
      });
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const opcionesEmpresas = useMemo(
    () => EMPRESAS_LIQUIDACION.map((nombre) => ({ value: nombre, label: nombre })),
    []
  );

  /* La búsqueda por PI / número espera a que el usuario deje de escribir */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const texto = busquedaInput.trim();
      if (texto !== busqueda) actualizarFiltros({ busqueda: texto });
    }, 500);
    return () => clearTimeout(timeout);
  }, [busquedaInput, busqueda, actualizarFiltros]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getLiquidacionesPrecios({
        empresa: empresaFiltro,
        estado: estadoFiltro,
        busqueda: busqueda || null,
      });
      setLiquidaciones(data || []);
    } catch (err) {
      console.error("Error al consultar las liquidaciones de precios:", err);
      setLiquidaciones([]);
      setError(true);
      toast.error("No se pudo obtener el listado de liquidaciones");
    } finally {
      setLoading(false);
    }
  }, [empresaFiltro, estadoFiltro, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* Se arrastran los filtros al detalle para que volver reconstruya este listado */
  const abrirDetalle = (liquidacion) => {
    const filtros = searchParams.toString();
    navigate(`/mdm/liquidacionprecios/${liquidacion.ID}${filtros ? `?${filtros}` : ""}`);
  };

  const colorEstado = (estado) => {
    const valor = (estado || "").toUpperCase();
    if (valor === ESTADO_APROBADO) return theme.colors.success;
    if (valor === ESTADO_CANCELADO) return theme.colors.error;
    return theme.colors.warning;
  };

  const renderCelda = (liquidacion, columna) => {
    const valor = liquidacion[columna.field];
    if (columna.isBadge) return <Badge $color={colorEstado(valor)}>{etiquetaEstado(valor)}</Badge>;
    if (columna.isFecha) return formatFecha(valor);
    if (columna.isFechaHora) return formatFechaHora(valor);
    if (valor === null || valor === undefined || valor === "") return "—";
    return valor;
  };

  const renderContenido = () => {
    if (loading) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando liquidaciones...</TextUI>
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
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargar} />
        </Vacio>
      );
    }

    if (!liquidaciones.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaFileInvoiceDollar" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin liquidaciones encontradas</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            No hay liquidaciones de precios con los filtros seleccionados.
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
                {COLUMNAS.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liquidaciones.map((liquidacion, index) => (
                <Fila
                  key={liquidacion.ID}
                  $par={index % 2 === 0}
                  onClick={() => abrirDetalle(liquidacion)}
                  title="Ver detalle de la liquidación"
                >
                  {COLUMNAS.map((columna) => (
                    <Td key={columna.field} $align={columna.align}>
                      {renderCelda(liquidacion, columna)}
                    </Td>
                  ))}
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>
        <PiePie>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            {liquidaciones.length} liquidación(es)
          </TextUI>
        </PiePie>
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
        <TextUI weight="bold" size="22px">
          Liquidación de precios
        </TextUI>

        <FiltrosContainer theme={theme}>
          <FiltroGrupo theme={theme} style={{ minWidth: "260px" }}>
            <label>Buscar</label>
            <InputUI
              placeholder="PI o número de liquidación..."
              value={busquedaInput}
              onChange={setBusquedaInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <SelectUI
            label="Empresa"
            options={opcionesEmpresas}
            value={empresaFiltro ? { value: empresaFiltro, label: empresaFiltro } : null}
            onChange={(opt) => actualizarFiltros({ empresa: opt?.value || null })}
            placeholder="Todas"
            isClearable
            minWidth="180px"
            maxWidth="220px"
          />

          <SelectUI
            label="Estado"
            options={OPCIONES_ESTADO}
            value={OPCIONES_ESTADO.find((opt) => opt.value === estadoFiltro) || null}
            onChange={(opt) => actualizarFiltros({ estado: opt?.value || ESTADO_TODOS })}
            placeholder="Todos"
            isClearable
            minWidth="180px"
            maxWidth="220px"
          />
        </FiltrosContainer>

        <Tarjeta theme={theme}>{renderContenido()}</Tarjeta>
      </Contenedor>
    </ContainerUI>
  );
}

export default LiquidacionesPrecios;
