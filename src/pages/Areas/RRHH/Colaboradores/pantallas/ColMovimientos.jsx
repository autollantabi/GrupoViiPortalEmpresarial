import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ExportToExcelUI } from "components/UI/Components/ExportarAExcelUI";
import { InputUI } from "components/UI/Components/InputUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ListarEmpresas, ObtenerMovimientosPersonal } from "services/colaboradoresService";
import { FiltroPastillas } from "../componentes/FiltroPastillas";
import { useConsulta, useDebounce } from "../hooks/useConsulta";
import {
  ETIQUETA_MOVIMIENTO,
  RUTA_BASE,
  TONO_MOVIMIENTO,
  TIPO_MOVIMIENTO,
  nombreCortoEmpresa,
} from "../utils/constantes";
import { formatearFecha, hoyIso } from "../utils/fechas";
import {
  Acciones,
  Badge,
  CirculoIcono,
  colorDeTono,
  Contenedor,
  Encabezado,
  Filtros,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  Vacio,
} from "../componentes/piezas";

/**
 * Listado completo de movimientos de personal: ingresos, bajas, reingresos y
 * subrogaciones de las 4 empresas, con filtros y agrupados por mes.
 *
 * El tipo se filtra EN EL CLIENTE sobre lo ya traído (como los chips de
 * "Últimos movimientos" del tablero): la única petición de red que cambia es
 * la de empresa/período/búsqueda. Es lo que permite que los contadores de
 * arriba actúen de filtro sin ida y vuelta al servidor.
 */

const ESTADO_TODOS_TIPO = "todos";

const TODAS_EMPRESAS = "";

const PERIODO_POR_DEFECTO = "90";

const OPCIONES_PERIODO = [
  { valor: "90", etiqueta: "Últimos 90 días" },
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "anio", etiqueta: "Este año" },
  { valor: "todo", etiqueta: "Todo" },
];

const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const mesDeFecha = (iso) => {
  const [anio, mes] = String(iso).split("-");
  return `${MESES_LARGOS[Number(mes) - 1] ?? mes} ${anio}`;
};

const restarDias = (iso, dias) => {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  fecha.setUTCDate(fecha.getUTCDate() - dias);
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}-${String(
    fecha.getUTCDate(),
  ).padStart(2, "0")}`;
};

/** Rango de fechas del período elegido. "todo" no manda rango. */
const rangoDePeriodo = (periodo) => {
  const hoy = hoyIso();
  if (periodo === "mes") return { fechaInicio: `${hoy.slice(0, 7)}-01`, fechaFin: hoy };
  if (periodo === "anio") return { fechaInicio: `${hoy.slice(0, 4)}-01-01`, fechaFin: hoy };
  if (periodo === "todo") return {};
  return { fechaInicio: restarDias(hoy, 90), fechaFin: hoy };
};

const TARJETAS_TIPO = [
  { valor: ESTADO_TODOS_TIPO, etiqueta: "Todos", tono: null },
  { valor: TIPO_MOVIMIENTO.INGRESO, etiqueta: "Ingresos", tono: "exito" },
  { valor: TIPO_MOVIMIENTO.BAJA, etiqueta: "Bajas", tono: "peligro" },
  { valor: TIPO_MOVIMIENTO.SUBROGACION, etiqueta: "Subrogaciones", tono: "neutro" },
  { valor: TIPO_MOVIMIENTO.REINGRESO, etiqueta: "Reingresos", tono: "info" },
];

const RejillaTarjetas = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
`;

const TarjetaTipo = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  background: ${({ theme }) => theme?.colors?.backgroundCard};
  border: 2px solid
    ${({ theme, $activa }) => ($activa ? theme?.colors?.text : theme?.colors?.border)};
`;

const RotuloTarjeta = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const CifraTarjeta = styled.span`
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  color: ${({ theme, $tono }) => ($tono ? colorDeTono(theme, $tono) : theme?.colors?.text)};
`;

const Mes = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0 6px;
  font-size: 13px;
  font-weight: 800;
  color: ${({ theme }) => theme?.colors?.text};
`;

const CantidadMes = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const FilaMovimiento = styled.div`
  display: grid;
  grid-template-columns: 100px 120px minmax(0, 2fr) 120px minmax(0, 2fr);
  gap: 14px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight};
`;

const CeldaFecha = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const NombreMovimiento = styled.button`
  padding: 0;
  border: 0;
  background: none;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme?.colors?.text};

  &:hover {
    color: ${({ theme }) => theme?.colors?.primary};
    text-decoration: underline;
  }
`;

const CeldaTexto = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CabeceraTabla = styled.div`
  display: grid;
  grid-template-columns: 100px 120px minmax(0, 2fr) 120px minmax(0, 2fr);
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const TablaScrollInterna = styled.div`
  overflow-x: auto;
`;

const TablaAncho = styled.div`
  min-width: 760px;
  display: flex;
  flex-direction: column;
`;

export const ColMovimientos = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const tipo = params.get("tipo") ?? ESTADO_TODOS_TIPO;
  const empresaId = params.get("empresaId") ?? TODAS_EMPRESAS;
  const periodo = params.get("periodo") ?? PERIODO_POR_DEFECTO;
  const q = params.get("q") ?? "";

  const [texto, setTexto] = useState(q);
  const textoRetrasado = useDebounce(texto, 350);

  const empresas = useConsulta(({ signal }) => ListarEmpresas({ signal }), []);

  const cambiarFiltro = (cambios) => {
    setParams(
      (previos) => {
        const siguientes = new URLSearchParams(previos);
        Object.entries(cambios).forEach(([clave, valor]) => {
          if (valor === undefined || valor === null || valor === "") siguientes.delete(clave);
          else siguientes.set(clave, String(valor));
        });
        return siguientes;
      },
      { replace: true },
    );
  };

  React.useEffect(() => {
    if (textoRetrasado.trim() !== q) cambiarFiltro({ q: textoRetrasado.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoRetrasado]);

  const filtros = useMemo(
    () => ({
      empresaId: empresaId || undefined,
      buscar: textoRetrasado.trim() || undefined,
      page: 1,
      pageSize: 300,
      ...rangoDePeriodo(periodo),
    }),
    [empresaId, textoRetrasado, periodo],
  );

  const { datos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerMovimientosPersonal(filtros, { signal }),
    [empresaId, textoRetrasado, periodo],
  );

  const todos = datos?.items ?? [];

  const conteos = useMemo(() => {
    const base = { [ESTADO_TODOS_TIPO]: todos.length };
    todos.forEach((mov) => {
      base[mov.tipo] = (base[mov.tipo] ?? 0) + 1;
    });
    return base;
  }, [todos]);

  const lista = useMemo(
    () => (tipo === ESTADO_TODOS_TIPO ? todos : todos.filter((mov) => mov.tipo === tipo)),
    [todos, tipo],
  );

  const datosExcel = useMemo(
    () =>
      lista.map((mov) => ({
        fecha: formatearFecha(mov.fecha),
        tipo: ETIQUETA_MOVIMIENTO[mov.tipo] ?? mov.tipo,
        colaborador: mov.nombresCompletos,
        empresa: nombreCortoEmpresa(mov.empresa),
        motivo: mov.motivo ?? "",
      })),
    [lista],
  );

  const grupos = useMemo(() => {
    const resultado = [];
    lista.forEach((mov) => {
      const etiqueta = mesDeFecha(mov.fecha);
      const grupoActual = resultado[resultado.length - 1];
      if (!grupoActual || grupoActual.mes !== etiqueta) {
        resultado.push({ mes: etiqueta, filas: [mov] });
      } else {
        grupoActual.filas.push(mov);
      }
    });
    return resultado;
  }, [lista]);

  const opcionesEmpresa = useMemo(
    () => [
      { valor: "", etiqueta: "Todas" },
      ...(empresas.datos ?? []).map((empresa) => ({
        valor: String(empresa.id),
        etiqueta: nombreCortoEmpresa(empresa.nombre),
      })),
    ],
    [empresas.datos],
  );

  const hayFiltros =
    tipo !== ESTADO_TODOS_TIPO || Boolean(empresaId) || Boolean(textoRetrasado.trim()) || periodo !== PERIODO_POR_DEFECTO;

  const limpiarFiltros = () => {
    setTexto("");
    setParams({}, { replace: true });
  };

  return (
    <Contenedor translate="no" className="notranslate">
      <Encabezado>
        <div>
          <ButtonUI
            text="Colaboradores"
            iconLeft="FaArrowLeft"
            variant="ghost"
            onClick={() => navigate(RUTA_BASE)}
          />
          <Titulo style={{ marginTop: 6 }}>Movimientos de personal</Titulo>
          <Subtitulo>Ingresos, bajas, reingresos y subrogaciones de las empresas del grupo</Subtitulo>
        </div>
        <Acciones>
          <ExportToExcelUI
            data={datosExcel}
            filename="Movimientos de personal"
            nombresPersonalizados={{
              fecha: "Fecha",
              tipo: "Tipo",
              colaborador: "Colaborador",
              empresa: "Empresa",
              motivo: "Motivo / detalle",
            }}
            habilitarBoton={datosExcel.length === 0}
          />
        </Acciones>
      </Encabezado>

      <RejillaTarjetas>
        {TARJETAS_TIPO.map((item) => (
          <TarjetaTipo
            key={item.valor}
            type="button"
            $activa={tipo === item.valor}
            onClick={() => cambiarFiltro({ tipo: item.valor === ESTADO_TODOS_TIPO ? "" : item.valor })}
          >
            <RotuloTarjeta>{item.etiqueta}</RotuloTarjeta>
            <CifraTarjeta $tono={item.tono}>{conteos[item.valor] ?? 0}</CifraTarjeta>
          </TarjetaTipo>
        ))}
      </RejillaTarjetas>

      <Tarjeta>
        <Filtros>
          <div style={{ minWidth: 240, flex: "1 1 240px" }}>
            <InputUI
              type="search"
              placeholder="Buscar colaborador"
              value={texto}
              onChange={setTexto}
              iconLeft="FaMagnifyingGlass"
            />
          </div>
          <FiltroPastillas
            leyenda="Empresa"
            opciones={opcionesEmpresa}
            value={empresaId}
            onChange={(valor) => cambiarFiltro({ empresaId: valor })}
            disabled={empresas.cargando}
          />
          <FiltroPastillas
            leyenda="Período"
            opciones={OPCIONES_PERIODO}
            value={periodo}
            onChange={(valor) => cambiarFiltro({ periodo: valor === PERIODO_POR_DEFECTO ? "" : valor })}
          />
          {hayFiltros && (
            <ButtonUI text="Limpiar filtros" variant="ghost" iconLeft="FaXmark" onClick={limpiarFiltros} />
          )}
        </Filtros>
      </Tarjeta>

      <Tarjeta $sinRelleno style={{ padding: "0 20px 14px" }}>
        {cargando ? (
          <LoaderUI text="Cargando movimientos…" height="260px" />
        ) : error ? (
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar el listado</strong>
            <TextoTenue>{error}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        ) : lista.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="neutro">
              <IconUI name="FaMagnifyingGlass" size={24} color={theme?.colors?.textSecondary} />
            </CirculoIcono>
            <strong>No hay movimientos con estos filtros.</strong>
          </Vacio>
        ) : (
          <TablaScrollInterna>
            <TablaAncho>
              <CabeceraTabla>
                <div>Fecha</div>
                <div>Tipo</div>
                <div>Colaborador</div>
                <div>Empresa</div>
                <div>Motivo / detalle</div>
              </CabeceraTabla>
              {grupos.map((grupo) => (
                <React.Fragment key={grupo.mes}>
                  <Mes>
                    {grupo.mes} <CantidadMes>· {grupo.filas.length}</CantidadMes>
                  </Mes>
                  {grupo.filas.map((mov, indice) => (
                    <FilaMovimiento key={`${mov.empleadoId}-${mov.fecha}-${indice}`}>
                      <CeldaFecha>{formatearFecha(mov.fecha)}</CeldaFecha>
                      <div>
                        <Badge $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}>
                          {ETIQUETA_MOVIMIENTO[mov.tipo] ?? mov.tipo}
                        </Badge>
                      </div>
                      <NombreMovimiento onClick={() => navigate(`${RUTA_BASE}/empleados/${mov.empleadoId}`)}>
                        {mov.nombresCompletos}
                      </NombreMovimiento>
                      <CeldaTexto title={mov.empresa}>{nombreCortoEmpresa(mov.empresa)}</CeldaTexto>
                      <CeldaTexto title={mov.motivo ?? ""}>{mov.motivo ?? "—"}</CeldaTexto>
                    </FilaMovimiento>
                  ))}
                </React.Fragment>
              ))}
            </TablaAncho>
          </TablaScrollInterna>
        )}
      </Tarjeta>

      {datos && datos.total > todos.length && (
        <TextoTenue>
          Mostrando los primeros {todos.length} de {datos.total} movimientos. Afina los filtros para ver el resto.
        </TextoTenue>
      )}
    </Contenedor>
  );
};

export default ColMovimientos;
