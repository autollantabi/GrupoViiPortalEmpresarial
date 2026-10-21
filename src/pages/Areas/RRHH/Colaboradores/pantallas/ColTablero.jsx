import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import {
  ObtenerDocumentosPendientesGlobal,
  ObtenerDocumentosPendientesPorTipo,
  ObtenerPazSalvoPendienteGlobal,
  ObtenerPeriodoPruebaPendientes,
  ObtenerResumenColaboradores,
} from "services/colaboradoresService";
import { useConsulta } from "../hooks/useConsulta";
import { usePermisosColaboradores } from "../hooks/usePermisos";
import {
  ETIQUETA_MOVIMIENTO,
  RUTA_BASE,
  TONO_MOVIMIENTO,
  nombreCortoEmpresa,
} from "../utils/constantes";
import { diasHasta, formatearFecha } from "../utils/fechas";
import {
  RUTA_CONFIGURACION,
  RUTA_MOVIMIENTOS,
  RUTA_REPORTE_INGRESOS_SALIDAS,
} from "../utils/constantesDotacion";
import {
  Acciones,
  Badge,
  CampoBusqueda,
  Chip,
  CirculoIcono,
  Contenedor,
  CuerpoAtencion,
  DetalleAtencion,
  Encabezado,
  EnlaceAtencion,
  FlechaAtencion,
  Kpi,
  KpiTitulo,
  KpiValor,
  LineaTiempo,
  ItemTiempo,
  PistaProgreso,
  Rejilla,
  RellenoProgreso,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  TituloAtencion,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";

/**
 * Tablero de Colaboradores: lo primero que se ve al entrar al módulo, y desde
 * donde se navega al resto.
 *
 * Todo sale de una sola petición a /rrhh/resumen, más tres consultas chicas
 * (período de prueba, paz y salvo y documentos pendientes) solo para quien
 * gestiona.
 */

const FilaEmpresa = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.text};
`;

const CabeceraFilaEmpresa = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const NombreEmpresa = styled.span`
  font-size: 14px;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CifraEmpresa = styled.strong`
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
`;

const PieFilaEmpresa = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const ListaEmpresas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

/** Las filas de los banners de pendientes (período de prueba, paz y salvo, documentos). */
const FilaPendiente = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.text};
  border: 1px solid ${({ theme }) => theme?.colors?.borderLight};

  &:hover {
    color: ${({ theme }) => theme?.colors?.text};
    border-color: ${({ theme }) => theme?.colors?.primary};
  }
`;

const ListaPendientes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CuerpoPendiente = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const NombrePendiente = styled.span`
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FilaTipoDocumento = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  color: ${({ theme }) => theme?.colors?.text};
`;

const CabeceraBanner = styled(Acciones)`
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
`;

/**
 * Banner colapsable: una línea con el total y, al desplegar, un renglón por
 * colaborador. Arranca cerrado para no empujar el resto del tablero cuando
 * hay muchos pendientes.
 */
const BannerExpandible = ({ id, titulo, icono, tono, cantidad, children }) => {
  const { theme } = useTheme();
  const [abierto, setAbierto] = useState(false);

  if (!cantidad) return null;

  return (
    <Tarjeta id={id}>
      <CabeceraBanner onClick={() => setAbierto((previo) => !previo)}>
        <Acciones>
          <IconUI name={icono} size={18} color={theme?.colors?.[tono] ?? theme?.colors?.warning} />
          <TituloTarjeta style={{ margin: 0 }}>{titulo}</TituloTarjeta>
          <Badge $tono={tono}>{cantidad}</Badge>
        </Acciones>
        <IconUI name={abierto ? "FaChevronUp" : "FaChevronDown"} size={14} />
      </CabeceraBanner>
      {abierto && (
        <ListaPendientes style={{ marginTop: 10 }}>{children}</ListaPendientes>
      )}
    </Tarjeta>
  );
};

const Cuerpo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
`;

const ColumnaPrincipal = styled.div`
  flex: 999 1 600px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ColumnaLateral = styled.aside`
  flex: 1 1 360px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RejillaAtencion = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`;

const CabeceraMovimientos = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const AbrirMovimientos = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  color: ${({ theme }) => theme?.colors?.text};

  &:hover {
    color: ${({ theme }) => theme?.colors?.primary};
  }
`;

const ToggleMovimientos = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: ${({ theme }) => theme?.colors?.text};
`;

const ResumenCerrado = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  padding: 2px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const FiltrosMovimiento = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const FILTROS_MOVIMIENTO = ["todos", "Ingreso", "Baja", "Subrogacion", "Reingreso"];

export const ColTablero = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { puedeGestionar } = usePermisosColaboradores();

  const [busqueda, setBusqueda] = useState("");
  const [filtroMovimiento, setFiltroMovimiento] = useState("todos");
  const [movimientosAbiertos, setMovimientosAbiertos] = useState(false);

  const { datos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerResumenColaboradores({ signal }),
    [],
  );

  // Widget de período de prueba: solo tiene sentido para quien gestiona (con
  // consulta no se cuenta con el detalle de cada empleado activo).
  const { datos: periodoPrueba } = useConsulta(
    ({ signal }) => (puedeGestionar ? ObtenerPeriodoPruebaPendientes({ signal }) : Promise.resolve([])),
    [puedeGestionar],
  );

  // Los dos banners de abajo son el mismo criterio: solo para quien gestiona,
  // y no disparan nada con acceso de consulta.
  const { datos: pazSalvoPendiente } = useConsulta(
    ({ signal }) => (puedeGestionar ? ObtenerPazSalvoPendienteGlobal({ signal }) : Promise.resolve([])),
    [puedeGestionar],
  );

  const { datos: documentosPendientes } = useConsulta(
    ({ signal }) => (puedeGestionar ? ObtenerDocumentosPendientesGlobal({ signal }) : Promise.resolve([])),
    [puedeGestionar],
  );

  const { datos: documentosPorTipo } = useConsulta(
    ({ signal }) => (puedeGestionar ? ObtenerDocumentosPendientesPorTipo({ signal }) : Promise.resolve([])),
    [puedeGestionar],
  );

  const movimientosFiltrados = useMemo(() => {
    const lista = datos?.movimientosRecientes ?? [];
    if (filtroMovimiento === "todos") return lista;
    return lista.filter((mov) => mov.tipo === filtroMovimiento);
  }, [datos, filtroMovimiento]);

  const buscarColaborador = (evento) => {
    evento.preventDefault();
    const texto = busqueda.trim();
    navigate(`${RUTA_BASE}/empleados${texto ? `?q=${encodeURIComponent(texto)}` : ""}`);
  };

  const renderContenido = () => {
    if (cargando) {
      return (
        <Tarjeta>
          <LoaderUI text="Cargando el resumen…" height="220px" />
        </Tarjeta>
      );
    }

    if (error) {
      return (
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar el resumen</strong>
            <TextoTenue>{error}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      );
    }

    if (!datos) {
      return (
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="neutro">
              <IconUI name="FaUsers" size={26} color={theme?.colors?.textSecondary} />
            </CirculoIcono>
            <strong>Todavía no hay información de personal</strong>
          </Vacio>
        </Tarjeta>
      );
    }

    const prueba = periodoPrueba ?? [];
    const pazSalvo = pazSalvoPendiente ?? [];
    const documentos = documentosPendientes ?? [];
    const tiposFaltantes = documentosPorTipo ?? [];
    const hayAtencion = puedeGestionar && (prueba.length > 0 || pazSalvo.length > 0 || documentos.length > 0);

    const pruebaHoy = prueba.filter((fila) => diasHasta(fila.fechaFinPeriodoPrueba) === 0).length;
    const pruebaProxima = prueba.reduce(
      (menor, fila) =>
        !menor || String(fila.fechaFinPeriodoPrueba) < String(menor) ? fila.fechaFinPeriodoPrueba : menor,
      null,
    );

    const totalActivos = datos.totalActivos ?? 0;
    const completos = Math.max(0, totalActivos - documentos.length);
    const porcentajeCompletos = totalActivos > 0 ? Math.round((completos / totalActivos) * 100) : 0;

    const maxActivosEmpresa = Math.max(1, ...datos.porEmpresa.map((empresa) => empresa.activos));

    const conteosMovimiento = datos.movimientosRecientes.reduce((acumulado, mov) => {
      acumulado[mov.tipo] = (acumulado[mov.tipo] ?? 0) + 1;
      return acumulado;
    }, {});
    const ultimoMovimiento = datos.movimientosRecientes[0] ?? null;

    return (
      <>
        {/* Con acceso de consulta no se muestra nada de bajas: ni el total, ni las
            del mes, ni la insignia por empresa, ni el historial de movimientos. */}
        <Rejilla $min={200}>
          <Kpi $tono="exito">
            <KpiTitulo>Activos</KpiTitulo>
            <KpiValor $tono="exito">{datos.totalActivos}</KpiValor>
          </Kpi>
          <Kpi $tono="info">
            <KpiTitulo>Ingresos del mes</KpiTitulo>
            <KpiValor $tono="info">{datos.ingresosDelMes}</KpiValor>
          </Kpi>
          {puedeGestionar && (
            <Kpi $tono="aviso">
              <KpiTitulo>Bajas del mes</KpiTitulo>
              <KpiValor $tono="aviso">{datos.bajasDelMes}</KpiValor>
            </Kpi>
          )}
          {puedeGestionar && (
            <Kpi $tono="peligro">
              <KpiTitulo>Dados de baja</KpiTitulo>
              <KpiValor $tono="peligro">{datos.totalInactivos}</KpiValor>
            </Kpi>
          )}
        </Rejilla>

        {hayAtencion && (
          <Tarjeta>
            <TituloTarjeta>Requiere atención</TituloTarjeta>
            <RejillaAtencion>
              {prueba.length > 0 && (
                <EnlaceAtencion to="#prueba" $tono="aviso">
                  <CirculoIcono $tono="aviso" $tamano={44}>
                    <IconUI name="FaClock" size={20} color={theme?.colors?.warningDark ?? theme?.colors?.warning} />
                  </CirculoIcono>
                  <CuerpoAtencion>
                    <TituloAtencion>
                      {prueba.length} período{prueba.length === 1 ? "" : "s"} de prueba por vencer
                    </TituloAtencion>
                    <DetalleAtencion $tono="aviso">
                      {pruebaHoy > 0
                        ? `${pruebaHoy} vence${pruebaHoy === 1 ? "" : "n"} hoy`
                        : pruebaProxima
                          ? `el más próximo vence el ${formatearFecha(pruebaProxima)}`
                          : ""}
                    </DetalleAtencion>
                  </CuerpoAtencion>
                  <FlechaAtencion $tono="aviso">Revisar ›</FlechaAtencion>
                </EnlaceAtencion>
              )}
              {pazSalvo.length > 0 && (
                <EnlaceAtencion to="#pazysalvo" $tono="aviso">
                  <CirculoIcono $tono="aviso" $tamano={44}>
                    <IconUI
                      name="FaClipboardCheck"
                      size={20}
                      color={theme?.colors?.warningDark ?? theme?.colors?.warning}
                    />
                  </CirculoIcono>
                  <CuerpoAtencion>
                    <TituloAtencion>
                      {pazSalvo.length} paz y salvo pendiente{pazSalvo.length === 1 ? "" : "s"}
                    </TituloAtencion>
                    <DetalleAtencion $tono="aviso">salida sin liquidación cerrada</DetalleAtencion>
                  </CuerpoAtencion>
                  <FlechaAtencion $tono="aviso">Revisar ›</FlechaAtencion>
                </EnlaceAtencion>
              )}
              {documentos.length > 0 && (
                <EnlaceAtencion to="#documentos" $tono="info">
                  <CirculoIcono $tono="info" $tamano={44}>
                    <IconUI name="FaFileCircleExclamation" size={20} color={theme?.colors?.info} />
                  </CirculoIcono>
                  <CuerpoAtencion>
                    <TituloAtencion>
                      {documentos.length} expediente{documentos.length === 1 ? "" : "s"} incompleto
                      {documentos.length === 1 ? "" : "s"}
                    </TituloAtencion>
                    <PistaProgreso>
                      <RellenoProgreso $tono="info" $porcentaje={porcentajeCompletos} />
                    </PistaProgreso>
                    <DetalleAtencion $tono="info">
                      {completos} de {totalActivos} completos ({porcentajeCompletos} %)
                    </DetalleAtencion>
                  </CuerpoAtencion>
                  <FlechaAtencion $tono="info">Revisar ›</FlechaAtencion>
                </EnlaceAtencion>
              )}
            </RejillaAtencion>
          </Tarjeta>
        )}

        <Cuerpo>
          <ColumnaPrincipal>
            <Tarjeta>
              <Acciones style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <TituloTarjeta style={{ margin: 0 }}>Personal por empresa</TituloTarjeta>
                <TextoTenue>{datos.totalActivos} activos</TextoTenue>
              </Acciones>
              {datos.porEmpresa.length === 0 ? (
                <TextoTenue>No hay empresas registradas.</TextoTenue>
              ) : (
                <ListaEmpresas>
                  {datos.porEmpresa.map((empresa) => (
                    <FilaEmpresa
                      key={empresa.empresaId}
                      to={`${RUTA_BASE}/empleados?empresaId=${empresa.empresaId}`}
                      title={empresa.empresa}
                    >
                      <CabeceraFilaEmpresa>
                        <NombreEmpresa>{empresa.empresa}</NombreEmpresa>
                        <CifraEmpresa>{empresa.activos}</CifraEmpresa>
                      </CabeceraFilaEmpresa>
                      <PistaProgreso>
                        <RellenoProgreso
                          $tono="info"
                          $porcentaje={(empresa.activos / maxActivosEmpresa) * 100}
                        />
                      </PistaProgreso>
                      <PieFilaEmpresa>
                        {Math.round((empresa.activos / Math.max(1, datos.totalActivos)) * 100)}% del grupo
                        {puedeGestionar ? ` · ${empresa.inactivos} de baja` : ""}
                      </PieFilaEmpresa>
                    </FilaEmpresa>
                  ))}
                </ListaEmpresas>
              )}
            </Tarjeta>

            {puedeGestionar && (
              <Tarjeta>
                <CabeceraMovimientos>
                  <ToggleMovimientos
                    type="button"
                    aria-expanded={movimientosAbiertos}
                    onClick={() => setMovimientosAbiertos((previo) => !previo)}
                  >
                    <IconUI name={movimientosAbiertos ? "FaChevronDown" : "FaChevronRight"} size={14} />
                    <TituloTarjeta style={{ margin: 0 }}>Últimos movimientos</TituloTarjeta>
                    <Badge $tono="neutro">{datos.movimientosRecientes.length}</Badge>
                  </ToggleMovimientos>
                  <AbrirMovimientos type="button" onClick={() => navigate(RUTA_MOVIMIENTOS)}>
                    Abrir pantalla completa
                    <IconUI name="FaUpRightFromSquare" size={13} />
                  </AbrirMovimientos>
                </CabeceraMovimientos>

                {datos.movimientosRecientes.length === 0 ? (
                  <TextoTenue>Todavía no hay movimientos registrados.</TextoTenue>
                ) : !movimientosAbiertos ? (
                  <ResumenCerrado>
                    {Object.entries(conteosMovimiento).map(([tipo, cantidad]) => (
                      <span key={tipo}>
                        <strong>{cantidad}</strong> {(ETIQUETA_MOVIMIENTO[tipo] ?? tipo).toLowerCase()}
                        {cantidad === 1 ? "" : "s"}
                      </span>
                    ))}
                    {ultimoMovimiento && (
                      <span>
                        · Último: {ultimoMovimiento.nombresCompletos}, {formatearFecha(ultimoMovimiento.fecha)}
                      </span>
                    )}
                  </ResumenCerrado>
                ) : (
                  <>
                    <FiltrosMovimiento style={{ margin: "12px 0" }}>
                      {FILTROS_MOVIMIENTO.map((tipo) => (
                        <Chip
                          key={tipo}
                          type="button"
                          $activo={filtroMovimiento === tipo}
                          onClick={() => setFiltroMovimiento(tipo)}
                        >
                          {tipo === "todos" ? "Todos" : ETIQUETA_MOVIMIENTO[tipo]}
                        </Chip>
                      ))}
                    </FiltrosMovimiento>
                    {movimientosFiltrados.length === 0 ? (
                      <TextoTenue>Sin movimientos de este tipo entre los últimos registrados.</TextoTenue>
                    ) : (
                      <LineaTiempo>
                        {movimientosFiltrados.map((mov, indice) => (
                          <ItemTiempo
                            key={`${mov.empleadoId}-${mov.fecha}-${indice}`}
                            $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}
                          >
                            <Acciones>
                              <Badge $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}>
                                {ETIQUETA_MOVIMIENTO[mov.tipo] ?? mov.tipo}
                              </Badge>
                              <TextoTenue>{formatearFecha(mov.fecha)}</TextoTenue>
                            </Acciones>
                            <FilaMovimiento
                              onClick={() => navigate(`${RUTA_BASE}/empleados/${mov.empleadoId}`)}
                            >
                              {mov.nombresCompletos}
                            </FilaMovimiento>
                            <TextoTenue>
                              {nombreCortoEmpresa(mov.empresa)}
                              {mov.motivo ? ` · ${mov.motivo}` : ""}
                            </TextoTenue>
                          </ItemTiempo>
                        ))}
                      </LineaTiempo>
                    )}
                    <AbrirMovimientos
                      type="button"
                      style={{ marginTop: 10 }}
                      onClick={() => navigate(RUTA_MOVIMIENTOS)}
                    >
                      Ver los {datos.movimientosRecientes.length} movimientos con filtros por empresa y fecha
                    </AbrirMovimientos>
                  </>
                )}
              </Tarjeta>
            )}
          </ColumnaPrincipal>

          <ColumnaLateral>
            {puedeGestionar && prueba.length > 0 && (
              <Tarjeta id="prueba">
                <Acciones style={{ justifyContent: "space-between" }}>
                  <TituloTarjeta style={{ margin: 0 }}>En período de prueba</TituloTarjeta>
                  <Badge $tono="aviso">{prueba.length}</Badge>
                </Acciones>
                <ListaPendientes style={{ marginTop: 10 }}>
                  {prueba.map((fila) => {
                    const restantes = diasHasta(fila.fechaFinPeriodoPrueba);
                    return (
                      <FilaPendiente
                        key={fila.empleadoId}
                        to={`${RUTA_BASE}/empleados/${fila.empleadoId}`}
                        title={fila.nombresCompletos}
                      >
                        <CuerpoPendiente>
                          <NombrePendiente>{fila.nombresCompletos}</NombrePendiente>
                          <PieFilaEmpresa>
                            {fila.cargo || fila.empresa}
                            {" · vence "}
                            {formatearFecha(fila.fechaFinPeriodoPrueba)}
                          </PieFilaEmpresa>
                        </CuerpoPendiente>
                        <Badge $tono={restantes !== null && restantes <= 7 ? "peligro" : "aviso"}>
                          {restantes === 0 ? "hoy" : `${restantes} d.`}
                        </Badge>
                      </FilaPendiente>
                    );
                  })}
                </ListaPendientes>
              </Tarjeta>
            )}

            {puedeGestionar && (
              <BannerExpandible
                id="pazysalvo"
                titulo="Paz y salvo pendiente"
                icono="FaClipboardCheck"
                tono="aviso"
                cantidad={pazSalvo.length}
              >
                {pazSalvo.map((fila) => (
                  <FilaPendiente
                    key={fila.empleadoId}
                    to={`${RUTA_BASE}/empleados/${fila.empleadoId}/paz-salvo`}
                    title={fila.nombresCompletos}
                  >
                    <CuerpoPendiente>
                      <NombrePendiente>{fila.nombresCompletos}</NombrePendiente>
                    </CuerpoPendiente>
                    <Badge $tono="aviso">
                      {fila.pendientes} {fila.pendientes === 1 ? "área" : "áreas"}
                    </Badge>
                  </FilaPendiente>
                ))}
              </BannerExpandible>
            )}

            {puedeGestionar && (
              <BannerExpandible
                id="documentos"
                titulo="Documentos pendientes"
                icono="FaFileCircleExclamation"
                tono="info"
                cantidad={documentos.length}
              >
                {documentos.map((fila) => (
                  <FilaPendiente
                    key={fila.empleadoId}
                    to={`${RUTA_BASE}/empleados/${fila.empleadoId}/documentos`}
                    title={fila.nombresCompletos}
                  >
                    <CuerpoPendiente>
                      <NombrePendiente>{fila.nombresCompletos}</NombrePendiente>
                      {fila.sinArchivo > 0 && (
                        <PieFilaEmpresa>{fila.sinArchivo} sin digitalizar</PieFilaEmpresa>
                      )}
                    </CuerpoPendiente>
                    <Badge $tono="info">{fila.pendientes + fila.sinArchivo} doc(s)</Badge>
                  </FilaPendiente>
                ))}
              </BannerExpandible>
            )}

            {puedeGestionar && tiposFaltantes.length > 0 && (
              <Tarjeta>
                <TituloTarjeta>Documentos faltantes más comunes</TituloTarjeta>
                <TextoTenue>Qué pedir primero, en lugar de un total ciego.</TextoTenue>
                <ListaPendientes style={{ marginTop: 10 }}>
                  {tiposFaltantes.map((tipo) => (
                    <FilaTipoDocumento key={tipo.tipoId}>
                      <span>{tipo.nombre}</span>
                      <strong>{tipo.total}</strong>
                    </FilaTipoDocumento>
                  ))}
                </ListaPendientes>
              </Tarjeta>
            )}
          </ColumnaLateral>
        </Cuerpo>
      </>
    );
  };

  return (
    <Contenedor translate="no" className="notranslate">
      <Encabezado>
        <div>
          <Titulo>Colaboradores</Titulo>
          <Subtitulo>Control de personal del grupo</Subtitulo>
        </div>
        <Acciones>
          <form onSubmit={buscarColaborador}>
            <CampoBusqueda style={{ minWidth: 240 }}>
              <IconUI name="FaMagnifyingGlass" size={16} color={theme?.colors?.textSecondary} />
              <input
                type="search"
                placeholder="Buscar por nombre o cédula"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                aria-label="Buscar colaborador"
              />
            </CampoBusqueda>
          </form>
          <ButtonUI
            text="Ver listado"
            iconLeft="FaUsers"
            variant="outlined"
            onClick={() => navigate(`${RUTA_BASE}/empleados`)}
          />
          {puedeGestionar && (
            <>
              <ButtonUI
                text="Ingresos y salidas"
                iconLeft="FaFileArrowDown"
                variant="outlined"
                onClick={() => navigate(RUTA_REPORTE_INGRESOS_SALIDAS)}
              />
              {/* La configuración de dotación y documentos no tiene ítem de menú
                  propio: se entra desde acá. */}
              <ButtonUI
                text="Configuración"
                iconLeft="FaGear"
                variant="outlined"
                onClick={() => navigate(RUTA_CONFIGURACION)}
              />
              <ButtonUI
                text="Registrar ingreso"
                iconLeft="FaUserPlus"
                onClick={() => navigate(`${RUTA_BASE}/empleados/nuevo`)}
              />
            </>
          )}
        </Acciones>
      </Encabezado>

      {renderContenido()}
    </Contenedor>
  );
};

const FilaMovimiento = styled.button`
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  color: ${({ theme }) => theme?.colors?.text};

  &:hover {
    color: ${({ theme }) => theme?.colors?.primary};
    text-decoration: underline;
  }
`;

export default ColTablero;
