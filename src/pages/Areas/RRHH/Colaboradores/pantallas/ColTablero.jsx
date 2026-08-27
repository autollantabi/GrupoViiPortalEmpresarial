import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerResumenColaboradores } from "services/colaboradoresService";
import { useConsulta } from "../hooks/useConsulta";
import { usePermisosColaboradores } from "../hooks/usePermisos";
import {
  RUTA_BASE,
  TONO_MOVIMIENTO,
  nombreCortoEmpresa,
} from "../utils/constantes";
import { formatearFecha } from "../utils/fechas";
import {
  Acciones,
  Badge,
  CirculoIcono,
  Contenedor,
  Encabezado,
  Kpi,
  KpiTitulo,
  KpiValor,
  LineaTiempo,
  ItemTiempo,
  Rejilla,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";

/**
 * Tablero de Colaboradores: lo primero que se ve al entrar al módulo, y desde
 * donde se navega al resto.
 *
 * Todo sale de una sola petición a /rrhh/resumen.
 */

const FilaEmpresa = styled(Link)`
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

const NombreEmpresa = styled.span`
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ColTablero = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { puedeGestionar } = usePermisosColaboradores();

  const { datos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerResumenColaboradores({ signal }),
    [],
  );

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

    return (
      <>
        {/* Con acceso de consulta no se muestra nada de bajas: ni el total, ni las
            del mes, ni la insignia por empresa, ni el historial de movimientos. */}
        <Rejilla $min={200}>
          <Kpi $tono="exito">
            <KpiTitulo>Activos</KpiTitulo>
            <KpiValor $tono="exito">{datos.totalActivos}</KpiValor>
          </Kpi>
          {puedeGestionar && (
            <Kpi $tono="peligro">
              <KpiTitulo>Dados de baja</KpiTitulo>
              <KpiValor $tono="peligro">{datos.totalInactivos}</KpiValor>
            </Kpi>
          )}
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
        </Rejilla>

        <Tarjeta>
          <TituloTarjeta>Personal por empresa</TituloTarjeta>
          {datos.porEmpresa.length === 0 ? (
            <TextoTenue>No hay empresas registradas.</TextoTenue>
          ) : (
            <Rejilla $min={260}>
              {datos.porEmpresa.map((empresa) => (
                <FilaEmpresa
                  key={empresa.empresaId}
                  to={`${RUTA_BASE}/empleados?empresaId=${empresa.empresaId}`}
                  title={empresa.empresa}
                >
                  <NombreEmpresa>{nombreCortoEmpresa(empresa.empresa)}</NombreEmpresa>
                  <Acciones>
                    <Badge $tono="exito">{empresa.activos} activos</Badge>
                    {puedeGestionar && empresa.inactivos > 0 && (
                      <Badge $tono="neutro">{empresa.inactivos} de baja</Badge>
                    )}
                  </Acciones>
                </FilaEmpresa>
              ))}
            </Rejilla>
          )}
        </Tarjeta>

        {puedeGestionar && (
        <Tarjeta>
          <TituloTarjeta>Últimos movimientos</TituloTarjeta>
          {datos.movimientosRecientes.length === 0 ? (
            <TextoTenue>Todavía no hay movimientos registrados.</TextoTenue>
          ) : (
            <LineaTiempo>
              {datos.movimientosRecientes.map((mov, indice) => (
                <ItemTiempo
                  key={`${mov.empleadoId}-${mov.fecha}-${indice}`}
                  $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}
                >
                  <Acciones>
                    <Badge $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}>{mov.tipo}</Badge>
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
        </Tarjeta>
        )}
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
          <ButtonUI
            text="Ver listado"
            iconLeft="FaUsers"
            variant="outlined"
            onClick={() => navigate(`${RUTA_BASE}/empleados`)}
          />
          {puedeGestionar && (
            <ButtonUI
              text="Registrar ingreso"
              iconLeft="FaUserPlus"
              onClick={() => navigate(`${RUTA_BASE}/empleados/nuevo`)}
            />
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
