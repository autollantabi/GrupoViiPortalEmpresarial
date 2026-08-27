import React, { useId } from "react";
import styled from "styled-components";

/**
 * Combobox con texto libre: sugiere valores existentes pero acepta cualquiera.
 *
 * ── POR QUÉ NO SE USA SelectUI CON isCreatable ──────────────────────────────
 * Este componente sostiene el "crear al paso" de cargos, áreas, líneas y
 * ciudades: el formulario manda el NOMBRE y el backend crea la fila si no existe.
 *
 * react-select con isCreatable descarta el texto tecleado al perder el foco si el
 * usuario no confirma la opción "Crear…". En un formulario de alta eso es pérdida
 * silenciosa de dato justo en los cuatro campos donde más importa: Talento Humano
 * escribe "JEFE DE BODEGA", hace clic en Guardar, y el cargo se pierde sin que
 * nada avise.
 *
 * Con <input list> + <datalist> el texto SIEMPRE persiste, no hay gesto de
 * confirmación, el toUpperCase() al teclear sigue funcionando y el desplegable lo
 * pinta el navegador con accesibilidad nativa. Se pierde el popup estilado y el
 * filtrado difuso de react-select; es un intercambio que vale la pena, porque lo
 * que importa es la semántica del valor y no el adorno.
 *
 * Con la lista de opciones vacía sigue funcionando: es justo el caso de un
 * despliegue nuevo donde los catálogos todavía no tienen filas.
 */

const Campo = styled.input`
  width: 100%;
  padding: 7px 10px;
  border-radius: 5px;
  font-family: inherit;
  font-size: 13px;
  color: ${({ theme }) => theme?.colors?.text};
  background: ${({ theme }) => theme?.colors?.inputBackground};
  border: 1px solid ${({ theme }) => theme?.colors?.inputBorder ?? theme?.colors?.border};
  /* Sin esto el navegador pinta el desplegable con la paleta clara del sistema y
     en tema oscuro queda como un parche blanco. */
  color-scheme: ${({ theme }) => (theme?.name === "dark" ? "dark" : "light")};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.focusRing ?? theme?.colors?.primary};
    outline-offset: 1px;
    border-color: ${({ theme }) => theme?.colors?.inputFocus ?? theme?.colors?.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme?.colors?.placeholder};
  }

  &:disabled {
    color: ${({ theme }) => theme?.colors?.textDisabled};
    cursor: not-allowed;
  }
`;

/**
 * @param {Object} props
 * @param {string} props.value Texto actual. Siempre controlado.
 * @param {(valor: string) => void} props.onChange Recibe el valor, no el evento.
 * @param {string[]} props.opciones Sugerencias del catálogo.
 * @param {boolean} [props.mayusculas] Si transforma a MAYÚSCULAS al teclear.
 */
export const ComboLibreUI = ({
  value = "",
  onChange,
  opciones = [],
  placeholder = "",
  disabled = false,
  mayusculas = false,
  maxLength,
  id,
}) => {
  const idGenerado = useId();
  const idLista = `${id ?? idGenerado}-lista`;

  const manejarCambio = (evento) => {
    const crudo = evento.target.value;
    onChange?.(mayusculas ? crudo.toUpperCase() : crudo);
  };

  return (
    <>
      <Campo
        type="text"
        list={idLista}
        value={value ?? ""}
        onChange={manejarCambio}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
      />
      <datalist id={idLista}>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion} />
        ))}
      </datalist>
    </>
  );
};

export default ComboLibreUI;
