import React from "react";
import { SelectUI } from "components/UI/Components/SelectUI";

/**
 * Lista de una sola elección sobre el SelectUI del portal, para los filtros del módulo que trabajan con
 * un valor de texto (no con el objeto { value, label } de react-select).
 * `opciones` acepta textos o pares { value, label }; `onChange` recibe el valor elegido.
 */
export function SelectSimple({ value, onChange, opciones, ariaLabel, minWidth = "190px", maxWidth = "280px" }) {
  const lista = opciones.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <SelectUI
      options={lista}
      value={lista.find((o) => o.value === value) ?? null}
      onChange={(o) => onChange(o ? o.value : "")}
      isSearchable={lista.length > 8}
      minWidth={minWidth}
      maxWidth={maxWidth}
      menuMaxWidth="320px"
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      aria-label={ariaLabel}
    />
  );
}
