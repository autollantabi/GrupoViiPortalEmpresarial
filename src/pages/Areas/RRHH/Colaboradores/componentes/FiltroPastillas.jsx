import React, { useId } from "react";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";

/**
 * Grupo de opciones excluyentes presentado como pastillas.
 *
 * Por dentro son radios de verdad dentro de un fieldset con legend, así que
 * funciona con teclado y con lector de pantalla sin agregar nada. No se usa
 * SelectUI porque con tres a seis opciones un desplegable añade un clic de más, y
 * no se usa CheckboxUI porque esto no es una selección múltiple.
 */

const Grupo = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

const Leyenda = styled.legend`
  float: none;
  width: auto;
  margin: 0;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const Pastillas = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

/** El radio se esconde pero sigue existiendo: el foco vive en él. */
const Pastilla = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  color: ${({ theme, $activa }) =>
    $activa ? theme?.colors?.primary : theme?.colors?.textSecondary};
  background: ${({ theme, $activa }) =>
    $activa
      ? hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.14 })
      : "transparent"};
  border: 1px solid
    ${({ theme, $activa }) =>
      $activa
        ? hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.45 })
        : theme?.colors?.border};

  &:hover {
    border-color: ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.45 })};
  }

  input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    margin: 0;
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme?.colors?.focusRing ?? theme?.colors?.primary};
    outline-offset: 2px;
  }
`;

/**
 * @param {Object} props
 * @param {{valor: string, etiqueta: string}[]} props.opciones
 * @param {string} props.value
 * @param {(valor: string) => void} props.onChange Recibe el valor.
 */
export const FiltroPastillas = ({ leyenda, opciones = [], value, onChange, disabled = false }) => {
  const nombre = useId();

  return (
    <Grupo disabled={disabled}>
      <Leyenda>{leyenda}</Leyenda>
      <Pastillas>
        {opciones.map((opcion) => (
          <Pastilla key={opcion.valor} $activa={opcion.valor === value}>
            <input
              type="radio"
              name={nombre}
              value={opcion.valor}
              checked={opcion.valor === value}
              onChange={() => onChange?.(opcion.valor)}
              disabled={disabled}
            />
            {opcion.etiqueta}
          </Pastilla>
        ))}
      </Pastillas>
    </Grupo>
  );
};

export default FiltroPastillas;
