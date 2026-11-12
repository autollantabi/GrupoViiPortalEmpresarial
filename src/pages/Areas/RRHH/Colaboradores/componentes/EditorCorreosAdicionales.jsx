import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { useTheme } from "context/ThemeContext";
import { CampoLabel } from "./CampoLabel";
import { Acciones, Separador, TextoTenue } from "./piezas";

/**
 * Buzones adicionales que una persona también administra (ej. datos@,
 * compras@...), de solo referencia en la ficha: no reciben avisos
 * automáticos de dotación ni de cumpleaños, esos siguen yendo solo al
 * correo corporativo principal.
 *
 * Mismo patrón "lista controlada" que EditorCampos.jsx (agregar/quitar/
 * cambiar por índice), pero sobre strings sueltos en vez de objetos.
 */

const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EditorCorreosAdicionales = ({ correos = [], onCambiar, errores = {} }) => {
  const { theme } = useTheme();

  const cambiar = (indice, valor) =>
    onCambiar(correos.map((correo, i) => (i === indice ? valor : correo)));

  const agregar = () => onCambiar([...correos, ""]);

  const quitar = (indice) => onCambiar(correos.filter((_, i) => i !== indice));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <TextoTenue>
        Buzones departamentales que esta persona también administra (ej. datos@,
        compras@…). Son de solo referencia: no reciben avisos automáticos.
      </TextoTenue>

      {correos.map((correo, indice) => (
        <div key={indice} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <CampoLabel
              etiqueta={`Correo adicional ${indice + 1}`}
              error={errores[`correo-${indice}`]}
            >
              <InputUI
                type="email"
                value={correo}
                onChange={(valor) => cambiar(indice, valor.toLowerCase())}
                maxLength={150}
              />
            </CampoLabel>
          </div>
          <ButtonUI
            text=""
            iconLeft="FaTrashCan"
            variant="ghost"
            pcolor={theme?.colors?.error}
            title="Quitar este correo"
            onClick={() => quitar(indice)}
          />
        </div>
      ))}

      <Separador />

      <Acciones>
        <ButtonUI text="Agregar correo" iconLeft="FaPlus" variant="outlined" onClick={agregar} />
      </Acciones>
    </div>
  );
};

/** Valida lo mismo que el backend (formato + sin duplicados), para no gastar una ida y vuelta. */
export const validarCorreosAdicionales = (correos = [], correoCorporativo = "") => {
  const errores = {};
  const vistos = new Set(
    correoCorporativo.trim() ? [correoCorporativo.trim().toLowerCase()] : [],
  );

  correos.forEach((correo, indice) => {
    const limpio = (correo ?? "").trim().toLowerCase();

    if (!limpio) {
      errores[`correo-${indice}`] = "Escriba el correo o quite la fila.";
      return;
    }
    if (!EXPRESION_CORREO.test(limpio)) {
      errores[`correo-${indice}`] = "No es un correo válido.";
      return;
    }
    if (vistos.has(limpio)) {
      errores[`correo-${indice}`] = "Ese correo ya está usado.";
      return;
    }
    vistos.add(limpio);
  });

  return errores;
};

export default EditorCorreosAdicionales;
