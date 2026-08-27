import React from "react";
import styled from "styled-components";

/**
 * Etiqueta + control + error o ayuda.
 *
 * La asociación con el control es IMPLÍCITA: el <label> envuelve al hijo. Se hace
 * así porque InputUI del kit no acepta la prop `id`, y sin id no se puede usar
 * <label for>. Envolver es igual de válido y accesible.
 *
 * Tampoco se le pasa `label` a InputUI: su etiqueta interna tiene el color
 * hardcodeado a #6c757d, que en tema oscuro no se lee. Acá la pinta esta pieza
 * con el token del tema.
 */

const Contenedor = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const Etiqueta = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const Obligatorio = styled.span`
  margin-left: 2px;
  color: ${({ theme }) => theme?.colors?.error};
`;

const Mensaje = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: ${({ theme, $esError }) =>
    $esError ? theme?.colors?.error : theme?.colors?.textSecondary};
`;

export const CampoLabel = ({ etiqueta, requerido = false, error, ayuda, children }) => (
  <Contenedor>
    <Etiqueta>
      {etiqueta}
      {requerido && <Obligatorio aria-hidden="true">*</Obligatorio>}
    </Etiqueta>
    {children}
    {error ? (
      <Mensaje $esError role="alert">
        {error}
      </Mensaje>
    ) : (
      ayuda && <Mensaje>{ayuda}</Mensaje>
    )}
  </Contenedor>
);

export default CampoLabel;
