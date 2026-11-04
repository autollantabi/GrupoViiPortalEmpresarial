import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import {
  getLiquidacionPrecios,
  guardarDetalleLiquidacionPrecios,
} from "services/mdmService";
import { puedeEditarRecurso } from "utils/permisosRecurso";

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

const RECURSO_LIQUIDACION = "mdm.liquidacionprecios";
const RUTA_LISTADO = "/mdm/liquidacionprecios";
const ESTADO_PENDIENTE = "PENDIENTE";
const ESTADO_APROBADO = "APROBADO";
const ESTADO_CANCELADO = "CANCELADO";

/* Columnas de solo lectura, en el orden del Excel. PVD y margen son editables y
   el PVP sin IVA se calcula; esos tres se pintan aparte. */
const COLUMNAS_ANTES = [
  { header: "Código", field: "CODIGO_ITEM" },
  { header: "Descripción", field: "DESCRIPCION", wrap: true },
  { header: "Und", field: "UNIDAD", align: "center" },
  { header: "Cant", field: "CANTIDAD", num: 0 },
  { header: "FOB", field: "FOB", num: 4 },
  { header: "Total FOB", field: "TOTAL_FOB", num: 2 },
  { header: "Adv & Fodinfa", field: "ADV_FODINFA", num: 2 },
  { header: "Total Adv & Fodinfa", field: "TOTAL_ADV_FODINFA", num: 2 },
  { header: "Gastos", field: "GASTOS", num: 4 },
  { header: "Total Gastos", field: "TOTAL_GASTOS", num: 2 },
  { header: "Costo", field: "COSTO", num: 4 },
  { header: "Total Costo", field: "TOTAL_COSTO", num: 2 },
];
const COLUMNAS_DESPUES = [
  { header: "Último costo", field: "ULTIMO_COSTO", num: 4 },
  { header: "Variación", field: "VARIACION", num: 2 },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/* Texto del campo editable -> número; vacío o no numérico -> null. Acepta coma decimal. */
const aNumero = (texto) => {
  const limpio = String(texto ?? "").trim().replace(",", ".");
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
};

/* PVP sin IVA = PVD + (PVD * margen / 100). Misma regla que el backend: sin PVD no
   hay precio y sin margen se toma 0. */
const calcularPvp = (pvdTexto, margenTexto) => {
  const pvd = aNumero(pvdTexto);
  if (pvd === null || pvd <= 0) return null;
  const margen = aNumero(margenTexto) ?? 0;
  // Los precios se manejan con dos decimales (igual que el backend)
  return Math.round((pvd + pvd * (margen / 100) + Number.EPSILON) * 100) / 100;
};

const formatNumero = (valor, decimales) => {
  if (valor === null || valor === undefined || valor === "") return "—";
  return Number(valor).toLocaleString("es-EC", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

const formatFecha = (valor) => {
  if (!valor) return "—";
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
};

const aTexto = (valor) => (valor === null || valor === undefined ? "" : String(valor));

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
  overflow-y: auto;
  color: ${({ theme }) => theme.colors.text};
`;

const Encabezado = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const Acciones = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
`;

const CabeceraCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px 24px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
`;

const Observaciones = styled.div`
  gap: 14px 24px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
`;

const Dato = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  & > span:first-child {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  & > span:last-child {
    font-size: 14px;
    word-break: break-word;
  }
`;

const Tarjeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: none;
  max-height: ${({ $alto }) => $alto || "none"};
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

const Leyenda = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Muestra = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.warning}55;
  border: 1px solid ${({ theme }) => theme.colors.warning};
`;

const TablaScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

/* Fila de totales fija al final de la tabla */
const TdTotal = styled.td`
  position: sticky;
  bottom: 0;
  z-index: 1;
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.backgroundLight};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const TablaCostos = styled.table`
  width: 100%;
  max-width: 720px;
  border-collapse: collapse;
  font-size: 13px;

  th {
    padding: 10px;
    text-align: right;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.colors.textInverse};
    background: ${({ theme }) => theme.colors.secondary};
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
  td {
    padding: 8px 10px;
    text-align: right;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  tr.total td {
    font-weight: 700;
    background: ${({ theme }) => theme.colors.backgroundLight};
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
  background: ${({ theme, $editable }) =>
    $editable ? theme.colors.primary : theme.colors.secondary};
`;

const Td = styled.td`
  padding: 8px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: ${({ $wrap }) => ($wrap ? "normal" : "nowrap")};
  min-width: ${({ $wrap }) => ($wrap ? "260px" : "auto")};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

/* La fila completa se pinta si el artículo está repetido (amarillo) o no fue encontrado (rojo) */
const Fila = styled.tr`
  background: ${({ theme, $par, $repetido, $noEncontrado }) =>
    $noEncontrado
      ? `${theme.colors.error}26`
      : $repetido
      ? `${theme.colors.warning}33`
      : $par
      ? theme.colors.backgroundLight
      : "transparent"};
`;

const CampoEditable = styled.input`
  width: 96px;
  padding: 6px 8px;
  text-align: right;
  border-radius: 5px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.backgroundCard || theme.colors.white};
  border: 1px solid ${({ theme, $invalido }) => ($invalido ? theme.colors.error : theme.colors.border)};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

const Vacio = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
`;

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

function LiquidacionPrecioDetalle() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [cabecera, setCabecera] = useState(null);
  /* Cada fila lleva PVD_TXT y MARGEN_TXT: lo que el usuario está escribiendo */
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [sinGuardar, setSinGuardar] = useState(false);
  /* Filas sin PVD detectadas al intentar sincronizar: se señalan en la tabla */
  const [sinPvd, setSinPvd] = useState(false);

  const volverAlListado = useCallback(() => {
    navigate(`${RUTA_LISTADO}${location.search}`);
  }, [navigate, location.search]);

  const volcar = useCallback((data) => {
    setCabecera(data);
    setFilas(
      (data.DETALLE || []).map((d) => ({
        ...d,
        PVD_TXT: aTexto(d.PVD),
        MARGEN_TXT: aTexto(d.MARGEN),
      }))
    );
    setSinGuardar(false);
    setSinPvd(false);
  }, []);

  useEffect(() => {
    let cancelado = false;
    const cargar = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await getLiquidacionPrecios(id);
        if (cancelado) return;
        if (!data) {
          setError(true);
          return;
        }
        volcar(data);
      } catch (err) {
        if (cancelado) return;
        console.error("Error al cargar la liquidación:", err);
        setError(true);
        toast.error("No se pudo cargar la liquidación de precios");
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    cargar();
    return () => {
      cancelado = true;
    };
  }, [id, volcar]);

  /* Un código puede repetirse en la liquidación con valores distintos. Esos
     artículos comparten PVD y margen: lo que se escribe en una fila se copia a
     las demás con el mismo código. */
  const repetidos = useMemo(() => {
    const conteo = {};
    filas.forEach((f) => {
      conteo[f.CODIGO_ITEM] = (conteo[f.CODIGO_ITEM] || 0) + 1;
    });
    return new Set(Object.keys(conteo).filter((codigo) => conteo[codigo] > 1));
  }, [filas]);

  /* Totales como en el Excel. Se calculan de los artículos (todas las filas, repetidas
     incluidas) y de la tabla de costos; no se guardan. Los porcentajes de Valor compra,
     Impuesto Adv y Gastos totales se calculan contra el SUBTOTAL. */
  const totales = useMemo(() => {
    const suma = (campo) => filas.reduce((acc, f) => acc + (Number(f[campo]) || 0), 0);
    const valorCompra = suma("TOTAL_FOB");
    const impuestoAdv = suma("TOTAL_ADV_FODINFA");
    const gastos = suma("TOTAL_GASTOS");
    const subtotal = valorCompra + impuestoAdv + gastos;
    const pct = (valor, base) => (base > 0 ? (valor / base) * 100 : null);

    const costos = cabecera?.COSTOS || [];
    const subtotalCostos = costos.reduce((acc, c) => acc + (Number(c.IMPORTE) || 0), 0);
    const subtotalFactor = costos.reduce((acc, c) => acc + (Number(c.FACTOR) || 0), 0);
    // Factor de Advaloren Fodinfa en la tabla de costos: igual que los factores del Excel, sobre el valor de compra
    const factorAdv = pct(impuestoAdv, valorCompra);

    return {
      unidades: suma("CANTIDAD"),
      valorCompra,
      pctValorCompra: pct(valorCompra, subtotal),
      impuestoAdv,
      pctImpuestoAdv: pct(impuestoAdv, subtotal),
      gastos,
      pctGastos: pct(gastos, subtotal),
      subtotal,
      subtotalCostos,
      subtotalFactor,
      factorAdv,
      totalCostos: subtotalCostos + impuestoAdv,
      totalFactor: subtotalFactor + (factorAdv ?? 0),
    };
  }, [filas, cabecera]);

  const filasTotales = [
    { etiqueta: "Unidades", campoEtiqueta: "UNIDAD", campoValor: "CANTIDAD", valor: totales.unidades, decimales: 0 },
    { etiqueta: "Valor compra", campoEtiqueta: "FOB", campoValor: "TOTAL_FOB", valor: totales.valorCompra, decimales: 2, pct: totales.pctValorCompra },
    { etiqueta: "Impuesto Adv", campoEtiqueta: "ADV_FODINFA", campoValor: "TOTAL_ADV_FODINFA", valor: totales.impuestoAdv, decimales: 2, pct: totales.pctImpuestoAdv },
    { etiqueta: "Gastos totales", campoEtiqueta: "GASTOS", campoValor: "TOTAL_GASTOS", valor: totales.gastos, decimales: 2, pct: totales.pctGastos },
    { etiqueta: "Subtotal", campoEtiqueta: "COSTO", campoValor: "TOTAL_COSTO", valor: totales.subtotal, decimales: 2 },
  ];

  const noEncontrados = filas.filter((f) => !f.ENCONTRADO).length;

  const editable =
    cabecera?.ESTADO === ESTADO_PENDIENTE &&
    puedeEditarRecurso(user, RECURSO_LIQUIDACION, cabecera?.EMPRESA);

  const cambiarCampo = (codigo, campo, valor) => {
    setFilas((prev) => prev.map((f) => (f.CODIGO_ITEM === codigo ? { ...f, [campo]: valor } : f)));
    setSinGuardar(true);
  };

  const detalleParaGuardar = () =>
    filas.map((f) => ({ ID: f.ID, PVD: aNumero(f.PVD_TXT), MARGEN: aNumero(f.MARGEN_TXT) }));

  /* Texto escrito que no es un número: no se guarda en silencio como vacío */
  const hayValoresInvalidos = () =>
    filas.some(
      (f) =>
        (f.PVD_TXT.trim() !== "" && aNumero(f.PVD_TXT) === null) ||
        (f.MARGEN_TXT.trim() !== "" && aNumero(f.MARGEN_TXT) === null)
    );

  /* Guarda el estado actual del detalle. No exige PVD ni margen: eso solo se
     valida al sincronizar con SAP. */
  const guardar = async () => {
    if (hayValoresInvalidos()) {
      toast.error("Hay valores de PVD o margen que no son números");
      return false;
    }
    setGuardando(true);
    try {
      const respuesta = await guardarDetalleLiquidacionPrecios(id, detalleParaGuardar());
      if (respuesta?.data) volcar(respuesta.data);
      toast.success("Guardado correctamente");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "No se pudo guardar la liquidación");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  /* Sincronizar = guardar y luego enviar a SAP. Antes de nada todos los artículos
     deben tener PVD distinto de vacío y de 0; el margen no se exige. */
  const sincronizarSap = async () => {
    const faltan = filas.filter((f) => !(aNumero(f.PVD_TXT) > 0));
    if (faltan.length > 0) {
      setSinPvd(true);
      toast.error(
        `Hay ${faltan.length} artículo(s) sin PVD. Complete el PVD de todos los artículos para sincronizar.`
      );
      return;
    }
    setSinPvd(false);

    const guardado = await guardar();
    if (!guardado) return;

    // El registro del precio en SAP es la siguiente fase; por ahora solo se deja guardado
    toast.info("Liquidación guardada. La sincronización con SAP se habilitará en la siguiente fase.");
  };

  const colorEstado = (estado) => {
    if (estado === ESTADO_APROBADO) return theme.colors.success;
    if (estado === ESTADO_CANCELADO) return theme.colors.error;
    return theme.colors.warning;
  };

  const etiquetaEstado = (estado) =>
    ({ [ESTADO_PENDIENTE]: "Pendiente", [ESTADO_APROBADO]: "Aprobada", [ESTADO_CANCELADO]: "Cancelada" }[
      estado
    ] || estado);

  if (loading) {
    return (
      <ContainerUI width="100%" height="100%">
        <Vacio>
          <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          <TextUI weight="bold">Cargando liquidación...</TextUI>
        </Vacio>
      </ContainerUI>
    );
  }

  if (error || !cabecera) {
    return (
      <ContainerUI width="100%" height="100%">
        <Vacio>
          <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
          <TextUI weight="bold">No se pudo cargar la liquidación</TextUI>
          <ButtonUI text="Volver al listado" iconLeft="FaArrowLeft" onClick={volverAlListado} />
        </Vacio>
      </ContainerUI>
    );
  }

  const celdaNumero = (fila, columna) => (
    <Td key={columna.field} $align="right">
      {formatNumero(fila[columna.field], columna.num)}
    </Td>
  );

  const celdaLectura = (fila, columna) => {
    if (columna.num !== undefined) return celdaNumero(fila, columna);
    const valor = fila[columna.field];
    // Código que no existe en dim_item de la empresa: se avisa y la fila queda bloqueada
    if (columna.field === "DESCRIPCION" && !fila.ENCONTRADO) {
      return (
        <Td key={columna.field} $wrap={columna.wrap}>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600, color: theme.colors.error, }} 
            title="El código no pertenece a un artículo de la empresa"
          >
            <IconUI name="FaTriangleExclamation" size={14} />
            No encontrado
          </span>
        </Td>
      );
    }
    return (
      <Td key={columna.field} $align={columna.align} $wrap={columna.wrap}>
        {valor === null || valor === undefined || valor === "" ? "—" : valor}
      </Td>
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
          <ButtonUI
            iconLeft="FaArrowLeft"
            variant="outlined"
            onClick={volverAlListado}
            title="Volver al listado"
          />
          <TextUI weight="bold" size="20px">
            Liquidación {cabecera.NUMERO_IMPORTACION}
          </TextUI>
          <Badge $color={colorEstado(cabecera.ESTADO)}>{etiquetaEstado(cabecera.ESTADO)}</Badge>

          {editable && (
            <Acciones>
              <ButtonUI
                text={guardando ? "Guardando..." : "Guardar"}
                iconLeft="FaFloppyDisk"
                onClick={guardar}
                disabled={guardando || !sinGuardar}
              />
              <ButtonUI
                text="Sincronizar a SAP"
                iconLeft="FaCloudArrowUp"
                variant="outlined"
                onClick={sincronizarSap}
                disabled={guardando}
              />
            </Acciones>
          )}
        </Encabezado>

        <CabeceraCard theme={theme}>
          <Dato theme={theme}>
            <span>Empresa</span>
            <span>{cabecera.EMPRESA}</span>
          </Dato>
          <Dato theme={theme}>
            <span>Liquidación Nro.</span>
            <span>{cabecera.NUMERO_IMPORTACION}</span>
          </Dato>
          <Dato theme={theme}>
            <span>Proveedor</span>
            <span>
              {cabecera.PROVEEDOR_NOMBRE
                ? `${cabecera.PROVEEDOR} - ${cabecera.PROVEEDOR_NOMBRE}`
                : cabecera.PROVEEDOR}
            </span>
          </Dato>
          <Dato theme={theme}>
            <span>Fecha de liquidación</span>
            <span>{formatFecha(cabecera.FECHA_LIQUIDACION)}</span>
          </Dato>
          <Dato theme={theme}>
            <span>PI #</span>
            <span>{cabecera.NUMERO_PI}</span>
          </Dato>
          <Dato theme={theme}>
            <span>DAI</span>
            <span>{cabecera.DAI}</span>
          </Dato>
        </CabeceraCard>

        {noEncontrados > 0 || repetidos.size > 0 && (
          <Observaciones>
          {noEncontrados > 0 && (
            <Leyenda theme={theme} style={{ color: theme.colors.error }}>
              <IconUI name="FaTriangleExclamation" size={14} color={theme.colors.error} />
              {noEncontrados} artículo(s) no fueron encontrados. No se pueden editar. 
            </Leyenda>
          )}
          {repetidos.size > 0 && (
            <Leyenda theme={theme}>
              <Muestra theme={theme} />
              Artículo repetido
            </Leyenda>
          )}
        </Observaciones>
        )}
        

        <Tarjeta theme={theme} $alto="65vh">
          <TablaScroll>
            <Tabla>
              <thead>
                <tr>
                  {COLUMNAS_ANTES.map((c) => (
                    <Th key={c.field} $align={c.align || (c.num !== undefined ? "right" : "left")}>
                      {c.header}
                    </Th>
                  ))}
                  <Th $align="right" $editable>
                    PVD
                  </Th>
                  {COLUMNAS_DESPUES.map((c) => (
                    <Th key={c.field} $align="right">
                      {c.header}
                    </Th>
                  ))}
                  <Th $align="right" $editable>
                    Margen %
                  </Th>
                  <Th $align="right">PVP sin IVA</Th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, index) => {
                  const repetido = repetidos.has(fila.CODIGO_ITEM);
                  const pvp = calcularPvp(fila.PVD_TXT, fila.MARGEN_TXT);
                  const pvdInvalido =
                    fila.PVD_TXT.trim() !== "" && aNumero(fila.PVD_TXT) === null;
                  const margenInvalido =
                    fila.MARGEN_TXT.trim() !== "" && aNumero(fila.MARGEN_TXT) === null;
                  const faltaPvd = sinPvd && !(aNumero(fila.PVD_TXT) > 0);

                  return (
                    <Fila
                      key={fila.ID}
                      $par={index % 2 === 0}
                      $repetido={repetido}
                      $noEncontrado={!fila.ENCONTRADO}
                      theme={theme}
                    >
                      {COLUMNAS_ANTES.map((c) => celdaLectura(fila, c))}
                      <Td $align="right">
                        <CampoEditable
                          theme={theme}
                          inputMode="decimal"
                          value={fila.PVD_TXT}
                          disabled={!editable || !fila.ENCONTRADO}
                          $invalido={pvdInvalido || faltaPvd}
                          onChange={(e) => cambiarCampo(fila.CODIGO_ITEM, "PVD_TXT", e.target.value)}
                        />
                      </Td>
                      {COLUMNAS_DESPUES.map((c) => celdaNumero(fila, c))}
                      <Td $align="right">
                        <CampoEditable
                          theme={theme}
                          inputMode="decimal"
                          value={fila.MARGEN_TXT}
                          disabled={!editable || !fila.ENCONTRADO}
                          $invalido={margenInvalido}
                          onChange={(e) =>
                            cambiarCampo(fila.CODIGO_ITEM, "MARGEN_TXT", e.target.value)
                          }
                        />
                      </Td>
                      <Td $align="right" style={{ fontWeight: 700 }}>
                        {formatNumero(pvp, 2)}
                      </Td>
                    </Fila>
                  );
                })}
              </tbody>
              {/* Una sola fila de totales fija al final de la tabla: cada nombre va bajo su
                  columna (Und, FOB, Adv & Fodinfa, Gastos, Costo) y cada total bajo la
                  columna del total (Cant, Total FOB, Total Adv & Fodinfa, Total Gastos, Total Costo) */}
              <tfoot>
                <tr>
                  {COLUMNAS_ANTES.map((c) => {
                    const etiqueta = filasTotales.find((t) => t.campoEtiqueta === c.field);
                    const total = filasTotales.find((t) => t.campoValor === c.field);
                    return (
                      <TdTotal key={c.field} $align={etiqueta ? "center" : "right"}>
                        {etiqueta && etiqueta.etiqueta}
                        {total && formatNumero(total.valor, total.decimales)}
                        {total && total.pct !== undefined && total.pct !== null && (
                          <div style={{ fontWeight: 400, fontSize: "12px" }}>
                            {formatNumero(total.pct, 2)} %
                          </div>
                        )}
                      </TdTotal>
                    );
                  })}
                  {[0, 1, 2, 3, 4].map((k) => (
                    <TdTotal key={k} />
                  ))}
                </tr>
              </tfoot>
            </Tabla>
          </TablaScroll>
        </Tarjeta>

        {/* Los costos son informativos: sin registros no se muestra la tabla */}
        {(cabecera.COSTOS || []).length > 0 && (
        <Tarjeta theme={theme} style={{ padding: "14px" }}>
          <TextUI weight="bold" size="16px" style={{ marginBottom: "10px" }}>
            Costos de liquidación
          </TextUI>
          <TablaCostos theme={theme}>
            <thead>
              <tr>
                <th>Costos</th>
                <th>Importe</th>
                <th>Factor</th>
              </tr>
            </thead>
            <tbody>
              {(cabecera.COSTOS || []).map((c) => (
                <tr key={c.ID}>
                  <td>{c.COSTO}</td>
                  <td>{formatNumero(c.IMPORTE, 2)}</td>
                  <td>{formatNumero(c.FACTOR, 2)}</td>
                </tr>
              ))}
              <tr className="total">
                <td>Subtotal costos:</td>
                <td>{formatNumero(totales.subtotalCostos, 2)}</td>
                <td>{formatNumero(totales.subtotalFactor, 2)}</td>
              </tr>
              <tr className="total">
                <td>Advaloren Fodinfa:</td>
                <td>{formatNumero(totales.impuestoAdv, 2)}</td>
                <td>{formatNumero(totales.factorAdv, 2)}</td>
              </tr>
              <tr className="total">
                <td>Total costos:</td>
                <td>{formatNumero(totales.totalCostos, 2)}</td>
                <td>{formatNumero(totales.totalFactor, 2)}</td>
              </tr>
            </tbody>
          </TablaCostos>
        </Tarjeta>
        )}
      </Contenedor>
    </ContainerUI>
  );
}

export default LiquidacionPrecioDetalle;
