import React, { useMemo, useState } from "react";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { InputUI } from "components/UI/Components/InputUI";
import { Acciones, Badge, TextoTenue } from "./piezas";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";

/**
 * Elegir artículos con casillas, agrupados por grupo.
 *
 * Reemplaza al desplegable de "agregar un artículo" de a uno. La razón es
 * aritmética: un kit de ventas son seis artículos y el catálogo tiene treinta y
 * cinco, así que armar una plantilla eran seis viajes al mismo desplegable,
 * abriéndolo y buscando cada vez. Con las casillas se ve todo el catálogo de una
 * vez y se marca lo que va.
 *
 * El buscador está porque con treinta y cinco artículos en seis grupos, "botas"
 * se encuentra más rápido escribiéndolo que recorriendo la lista.
 */

const Caja = styled.div`
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 8px;
  max-height: 260px;
  overflow-y: auto;
`;

const Grupo = styled.div`
  &:not(:first-child) {
    border-top: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  }
`;

/* Pegajoso para que al bajar por la lista siempre se sepa en qué grupo se está:
   sin esto, con seis grupos abiertos uno pierde la referencia. */
const CabeceraGrupo = styled.div`
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  background: ${({ theme }) =>
    hexToRGBA({ hex: theme?.colors?.primary || "#fd4703", alpha: 0.08 })};
  font-size: 12px;
  font-weight: 700;
`;

const Lista = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 2px 12px;
  padding: 8px 10px;
`;

export const SelectorArticulos = ({ items, elegidos, onAlternar, onAlternarGrupo }) => {
  const [busqueda, setBusqueda] = useState("");

  const grupos = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const visibles = (items ?? []).filter(
      (item) =>
        termino.length === 0 ||
        item.nombre.toLowerCase().includes(termino) ||
        item.grupoNombre.toLowerCase().includes(termino),
    );

    // Map preserva el orden de inserción, y los artículos ya vienen ordenados
    // por grupo desde el API, así que el agrupado sale en el orden correcto sin
    // volver a ordenar nada.
    const porGrupo = new Map();

    visibles.forEach((item) => {
      const lista = porGrupo.get(item.grupoNombre) ?? [];
      lista.push(item);
      porGrupo.set(item.grupoNombre, lista);
    });

    return [...porGrupo.entries()];
  }, [items, busqueda]);

  const total = (items ?? []).length;

  return (
    <div>
      <Acciones style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <InputUI
            value={busqueda}
            onChange={setBusqueda}
            placeholder={`Buscar entre ${total} artículos…`}
          />
        </div>
        <Badge $tono={elegidos.size > 0 ? "exito" : "neutro"}>
          {elegidos.size} elegido(s)
        </Badge>
      </Acciones>

      <Caja>
        {grupos.length === 0 ? (
          <div style={{ padding: 12 }}>
            <TextoTenue>
              {total === 0
                ? "No hay artículos activos. Créelos en la sección Catálogo."
                : `Ningún artículo coincide con "${busqueda}".`}
            </TextoTenue>
          </div>
        ) : (
          grupos.map(([nombreGrupo, articulos]) => {
            const todosMarcados = articulos.every((item) => elegidos.has(item.id));

            return (
              <Grupo key={nombreGrupo}>
                <CabeceraGrupo>
                  <span>{nombreGrupo}</span>
                  <CheckboxUI
                    name={`grupo-${nombreGrupo}`}
                    checked={todosMarcados}
                    onChange={() => onAlternarGrupo(articulos, !todosMarcados)}
                    label={todosMarcados ? "quitar todos" : "todos"}
                  />
                </CabeceraGrupo>

                <Lista>
                  {articulos.map((item) => (
                    <CheckboxUI
                      key={item.id}
                      name={`item-${item.id}`}
                      checked={elegidos.has(item.id)}
                      onChange={() => onAlternar(item)}
                      /* Los atributos se anuncian acá para que no sorprendan
                         después: marcar el casco obliga a elegir una talla, y
                         conviene saberlo antes de marcarlo. */
                      label={
                        item.campos?.length > 0
                          ? `${item.nombre} (pide ${item.campos
                              .map((campo) => campo.etiqueta.toLowerCase())
                              .join(", ")})`
                          : item.nombre
                      }
                    />
                  ))}
                </Lista>
              </Grupo>
            );
          })
        )}
      </Caja>
    </div>
  );
};

export default SelectorArticulos;
