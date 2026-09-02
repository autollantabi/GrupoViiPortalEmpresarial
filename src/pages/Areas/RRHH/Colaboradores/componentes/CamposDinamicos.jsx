import React from "react";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { CampoLabel } from "./CampoLabel";
import { FilaFormulario } from "./piezas";
import { TIPO_CAMPO } from "../utils/constantesDotacion";

/**
 * Dibuja los atributos que declara un artículo del catálogo.
 *
 * Los artículos no tienen campos fijos: el EPP pide talla, los uniformes marca y
 * color, los beneficios un plan, el perfil tecnológico un detalle. El backend
 * devuelve esa definición en `campos` y esta pieza la convierte en controles, así
 * que agregar un artículo con un atributo nuevo no toca el front.
 *
 * Forma de cada campo:
 *   { clave, etiqueta, tipo: 'texto'|'numero'|'lista', requerido, opciones? }
 *
 * `valores` es el objeto que se guarda tal cual en el jsonb, indexado por clave.
 */
export const CamposDinamicos = ({ campos = [], valores = {}, errores = {}, onCambiar, deshabilitado }) => {
  if (!Array.isArray(campos) || campos.length === 0) return null;

  const cambiar = (clave, valor) => onCambiar?.({ ...valores, [clave]: valor });

  return (
    <FilaFormulario $min={180}>
      {campos.map((campo) => {
        const valor = valores?.[campo.clave] ?? "";

        return (
          <CampoLabel
            key={campo.clave}
            etiqueta={campo.etiqueta || campo.clave}
            requerido={campo.requerido === true}
            error={errores?.[campo.clave]}
          >
            {campo.tipo === TIPO_CAMPO.LISTA ? (
              <SelectUI
                options={(campo.opciones ?? []).map((opcion) => ({ value: opcion, label: opcion }))}
                value={valor ? { value: valor, label: valor } : null}
                // SelectUI envuelve react-select: el onChange recibe la opción
                // completa, no el valor, y null al limpiar.
                onChange={(opcion) => cambiar(campo.clave, opcion?.value ?? "")}
                isDisabled={deshabilitado}
                placeholder="Elija…"
                // Sin portal, el desplegable queda recortado dentro del modal.
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            ) : (
              <InputUI
                type={campo.tipo === TIPO_CAMPO.NUMERO ? "number" : "text"}
                value={valor}
                // InputUI entrega el string, no el evento.
                onChange={(nuevo) => cambiar(campo.clave, nuevo)}
                disabled={deshabilitado}
                maxLength={campo.tipo === TIPO_CAMPO.NUMERO ? undefined : 120}
                placeholder={campo.etiqueta || campo.clave}
              />
            )}
          </CampoLabel>
        );
      })}
    </FilaFormulario>
  );
};

/**
 * Valida los campos requeridos y devuelve { clave: mensaje }.
 *
 * Se valida acá además de en el backend para no gastar una ida y vuelta en algo
 * que se sabe en el formulario. El backend igual lo comprueba: es él quien manda.
 */
export const validarCamposDinamicos = (campos = [], valores = {}) => {
  const errores = {};

  campos
    .filter((campo) => campo?.requerido === true)
    .forEach((campo) => {
      const valor = valores?.[campo.clave];
      if (valor === undefined || valor === null || String(valor).trim() === "") {
        errores[campo.clave] = `Complete ${campo.etiqueta || campo.clave}.`;
      }
    });

  return errores;
};

export default CamposDinamicos;
