import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";
import {
  RUTA_CARGAS_FAMILIARES,
  RUTA_CERTIFICADOS,
  RUTA_DOCUMENTOS,
  RUTA_DOTACION,
  RUTA_FICHA,
  RUTA_INDUCCION,
  RUTA_PAZ_SALVO,
  RUTA_VACACIONES,
} from "../utils/constantesDotacion";

/**
 * Pestañas de la ficha: Datos, Dotación y Documentos.
 *
 * Son NavLink y no estado local a propósito: cada pestaña tiene URL propia, así
 * que el enlace es compartible ("mírale la documentación a este"), el botón atrás
 * del navegador funciona y recargar no devuelve a Datos. Es el mismo criterio con
 * el que el listado guarda sus filtros en la query string.
 *
 * `end` en la de Datos es imprescindible: sin eso, /empleados/7/dotacion también
 * marcaría Datos como activa, porque su ruta es un prefijo.
 */

const Barra = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.border};
`;

const Pestana = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 4px;
  margin-right: 22px;
  border: 0;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: inset 0 -3px 0 transparent;
  color: ${({ theme }) => theme?.colors?.textSecondary};

  &:hover {
    color: ${({ theme }) => theme?.colors?.text};
  }

  /* react-router pone .active en el NavLink que corresponde a la URL actual. */
  &.active {
    font-weight: 800;
    color: ${({ theme }) => theme?.colors?.primary};
    box-shadow: inset 0 -3px 0 ${({ theme }) => theme?.colors?.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.focusRing ?? theme?.colors?.primary};
    outline-offset: -2px;
  }
`;

/** Cuenta lo pendiente al lado del nombre de la pestaña. */
const Contador = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.warningDark ?? theme?.colors?.warning};
  background: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.warningDark ?? "#b45309", alpha: 0.16 })};
`;

/**
 * @param {Object} props
 * @param {boolean} [props.mostrarPazSalvo] Solo tiene sentido con la ficha de
 *   baja: con un empleado activo no hay checklist de salida que revisar.
 */
export const PestanasFicha = ({
  id,
  pendientesDotacion = 0,
  pendientesDocumentos = 0,
  pendientesInduccion = 0,
  pendientesVacaciones = 0,
  mostrarPazSalvo = false,
}) => (
  <Barra aria-label="Secciones de la ficha">
    <Pestana to={RUTA_FICHA(id)} end>
      Datos
    </Pestana>
    <Pestana to={RUTA_DOTACION(id)}>
      Dotación
      {pendientesDotacion > 0 && <Contador title="Artículos pendientes">{pendientesDotacion}</Contador>}
    </Pestana>
    <Pestana to={RUTA_DOCUMENTOS(id)}>
      Documentos
      {pendientesDocumentos > 0 && <Contador title="Documentos pendientes">{pendientesDocumentos}</Contador>}
    </Pestana>
    <Pestana to={RUTA_CARGAS_FAMILIARES(id)}>Cargas familiares</Pestana>
    <Pestana to={RUTA_INDUCCION(id)}>
      Inducción
      {pendientesInduccion > 0 && <Contador title="Actividades pendientes">{pendientesInduccion}</Contador>}
    </Pestana>
    <Pestana to={RUTA_VACACIONES(id)}>
      Vacaciones
      {pendientesVacaciones > 0 && <Contador title="Solicitudes pendientes">{pendientesVacaciones}</Contador>}
    </Pestana>
    {mostrarPazSalvo && <Pestana to={RUTA_PAZ_SALVO(id)}>Paz y salvo</Pestana>}
    <Pestana to={RUTA_CERTIFICADOS(id)}>Certificados</Pestana>
  </Barra>
);

export default PestanasFicha;
