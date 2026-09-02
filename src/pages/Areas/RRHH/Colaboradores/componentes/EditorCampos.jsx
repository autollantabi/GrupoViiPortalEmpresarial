import React from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { CampoLabel } from "./CampoLabel";
import { Acciones, Aviso, Separador, TextoTenue } from "./piezas";
import { TIPO_CAMPO } from "../utils/constantesDotacion";

/**
 * Define los atributos de un artículo del catálogo.
 *
 * Esto es lo que hace que un artículo nuevo con un atributo nuevo no necesite un
 * despliegue: aquí RRHH declara que las botas piden talla o que el seguro pide un
 * plan de una lista, y el formulario de entrega dibuja esos controles solo.
 *
 * `clave` es el nombre con el que el valor se guarda en el jsonb; `etiqueta` es lo
 * que se lee en pantalla. Se piden por separado a propósito: cambiar la etiqueta
 * es cosmético, cambiar la clave deja huérfanos los valores ya guardados, y
 * separarlas hace visible esa diferencia.
 */

const TIPOS = [
  { value: TIPO_CAMPO.TEXTO, label: "Texto" },
  { value: TIPO_CAMPO.NUMERO, label: "Número" },
  { value: TIPO_CAMPO.LISTA, label: "Lista de opciones" },
];

const Bloque = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  align-items: start;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme?.colors?.borderLight};
  border-radius: 8px;
`;

/**
 * 'Talla de calzado' -> 'talla_de_calzado'. Solo para proponer, es editable.
 *
 * El rango \u0300-\u036f va escapado y no con los caracteres literales: son
 * marcas combinantes y en un archivo fuente quedan invisibles o se corrompen al
 * pasar por una herramienta que no respete la normalización.
 */
const claveSugerida = (etiqueta) =>
  (etiqueta ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

export const EditorCampos = ({ campos = [], onCambiar, errores = {} }) => {
  const { theme } = useTheme();

  const cambiar = (indice, parche) =>
    onCambiar(campos.map((campo, i) => (i === indice ? { ...campo, ...parche } : campo)));

  const agregar = () =>
    onCambiar([
      ...campos,
      { clave: "", etiqueta: "", tipo: TIPO_CAMPO.TEXTO, requerido: false, opciones: [] },
    ]);

  const quitar = (indice) => onCambiar(campos.filter((_, i) => i !== indice));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <TextoTenue>
          Atributos que se piden al entregar este artículo: talla, marca, color, plan…
          Déjelo vacío si solo hace falta la cantidad.
        </TextoTenue>
      </div>

      {campos.map((campo, indice) => (
        <Bloque key={indice}>
          <CampoLabel etiqueta="Etiqueta" requerido error={errores[`campo-${indice}-etiqueta`]}>
            <InputUI
              value={campo.etiqueta ?? ""}
              onChange={(valor) =>
                cambiar(indice, {
                  etiqueta: valor,
                  // La clave se propone solo mientras esté vacía: si RRHH ya la
                  // fijó, seguir cambiándola rompería los valores guardados.
                  clave: campo.clave ? campo.clave : claveSugerida(valor),
                })
              }
              maxLength={60}
              placeholder="Talla"
            />
          </CampoLabel>

          <CampoLabel
            etiqueta="Clave"
            requerido
            error={errores[`campo-${indice}-clave`]}
            ayuda="Con la que se guarda. No la cambie si ya se usó."
          >
            <InputUI
              value={campo.clave ?? ""}
              onChange={(valor) => cambiar(indice, { clave: claveSugerida(valor) })}
              maxLength={40}
              placeholder="talla"
            />
          </CampoLabel>

          <CampoLabel etiqueta="Tipo">
            <SelectUI
              options={TIPOS}
              value={TIPOS.find((tipo) => tipo.value === campo.tipo) ?? TIPOS[0]}
              onChange={(opcion) => cambiar(indice, { tipo: opcion?.value ?? TIPO_CAMPO.TEXTO })}
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
            />
          </CampoLabel>

          {campo.tipo === TIPO_CAMPO.LISTA && (
            <CampoLabel
              etiqueta="Opciones"
              requerido
              error={errores[`campo-${indice}-opciones`]}
              ayuda="Separadas por coma."
            >
              <InputUI
                value={(campo.opciones ?? []).join(", ")}
                onChange={(valor) =>
                  cambiar(indice, {
                    opciones: valor
                      .split(",")
                      .map((opcion) => opcion.trim())
                      .filter((opcion) => opcion.length > 0),
                  })
                }
                placeholder="Individual, Individual +1"
              />
            </CampoLabel>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
            <CheckboxUI
              name={`requerido-${indice}`}
              checked={campo.requerido === true}
              // CheckboxUI del kit entrega (name, checked), no el evento.
              onChange={(_nombre, marcado) => cambiar(indice, { requerido: marcado })}
              label="Obligatorio"
            />
            <ButtonUI
              text=""
              iconLeft="FaTrashCan"
              variant="ghost"
              pcolor={theme?.colors?.error}
              title="Quitar el atributo"
              onClick={() => quitar(indice)}
            />
          </div>
        </Bloque>
      ))}

      {campos.some((campo) => campo.requerido) && (
        <Aviso $tono="neutro">
          Los atributos obligatorios se exigen al marcar el artículo como entregado, no
          antes: mientras esté pendiente todavía no se sabe la talla.
        </Aviso>
      )}

      <Separador />

      <Acciones>
        <ButtonUI text="Agregar atributo" iconLeft="FaPlus" variant="outlined" onClick={agregar} />
      </Acciones>
    </div>
  );
};

/** Valida lo mismo que el backend, para no gastar una ida y vuelta. */
export const validarCampos = (campos = []) => {
  const errores = {};
  const claves = new Set();

  campos.forEach((campo, indice) => {
    const clave = (campo.clave ?? "").trim();
    const etiqueta = (campo.etiqueta ?? "").trim();

    if (!etiqueta) errores[`campo-${indice}-etiqueta`] = "Escriba la etiqueta.";
    if (!clave) errores[`campo-${indice}-clave`] = "Escriba la clave.";
    else if (claves.has(clave)) errores[`campo-${indice}-clave`] = "Esta clave ya está usada.";
    claves.add(clave);

    if (campo.tipo === TIPO_CAMPO.LISTA && (campo.opciones ?? []).length === 0) {
      errores[`campo-${indice}-opciones`] = "Una lista necesita al menos una opción.";
    }
  });

  return errores;
};

export default EditorCampos;
