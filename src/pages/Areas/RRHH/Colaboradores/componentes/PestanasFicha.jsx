import React from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";
import { RUTA_DOCUMENTOS, RUTA_DOTACION, RUTA_FICHA } from "../utils/constantesDotacion";

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
  padding: 9px 14px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  margin-bottom: -1px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: ${({ theme }) => theme?.colors?.textSecondary};

  &:hover {
    color: ${({ theme }) => theme?.colors?.text};
    background: ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.06 })};
  }

  /* react-router pone .active en el NavLink que corresponde a la URL actual. */
  &.active {
    color: ${({ theme }) => theme?.colors?.primary};
    background: ${({ theme }) => theme?.colors?.backgroundCard};
    border-color: ${({ theme }) => theme?.colors?.border};
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

export const PestanasFicha = ({ id, pendientesDotacion = 0, pendientesDocumentos = 0 }) => (
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
  </Barra>
);

export default PestanasFicha;
