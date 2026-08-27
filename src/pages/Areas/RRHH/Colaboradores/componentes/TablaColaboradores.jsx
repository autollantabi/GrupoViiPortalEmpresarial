import React from "react";
import styled from "styled-components";
import { Badge, Fila, Tabla, TablaScroll, Td, Th } from "./piezas";
import { ESTADO, TONO_ESTADO } from "../utils/constantes";

/**
 * Las nueve columnas del listado de colaboradores.
 *
 * En pantallas angostas la tabla se convierte en tarjetas, igual que hacía el
 * Intranet: se esconde el thead, todo pasa a display:block y cada celda muestra
 * su nombre con `td::before { content: attr(data-etiqueta) }`.
 *
 * De ahí que CADA <Td> lleve su data-etiqueta. Si a alguna le falta, en móvil ese
 * valor aparece suelto sin decir de qué es, y en escritorio no se nota.
 *
 * No se usa TablaInfoUI del kit: no pagina (y acá la paginación es de servidor),
 * revienta si columns llega vacío, sus filtros de cliente contradirían los del
 * servidor y solo ofrece doble clic, no clic simple para navegar.
 */

const CELDAS = [
  { clave: "nombresCompletos", etiqueta: "Apellidos y nombres" },
  { clave: "cargo", etiqueta: "Cargo" },
  { clave: "area", etiqueta: "Área" },
  { clave: "linea", etiqueta: "Línea" },
  { clave: "ciudad", etiqueta: "Ciudad" },
  { clave: "correoCorporativo", etiqueta: "Correo" },
  { clave: "extension", etiqueta: "Ext." },
  { clave: "telefonoEmpresarial", etiqueta: "Tel. empresarial" },
];

const TablaResponsiva = styled(Tabla)`
  @media (max-width: 900px) {
    thead {
      display: none;
    }

    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    tr {
      margin-bottom: 12px;
      padding: 8px 0;
      border: 1px solid ${({ theme }) => theme?.colors?.border};
      border-radius: 10px;
    }

    td {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 0;
      padding: 6px 12px;
      text-align: right;
    }

    td::before {
      content: attr(data-etiqueta);
      flex: 0 0 auto;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      text-align: left;
      color: ${({ theme }) => theme?.colors?.textSecondary};
    }
  }
`;

const Nombre = styled.span`
  font-weight: 600;
`;

const Correo = styled.span`
  word-break: break-all;
`;

/**
 * @param {Object} props
 * @param {boolean} [props.puedeGestionar] Con false: sin columna Estado (todos son
 *   activos) y sin fila clicable, porque no hay ficha que abrir.
 */
export const TablaColaboradores = ({ filas = [], onAbrir, puedeGestionar = true }) => (
  <TablaScroll>
    <TablaResponsiva>
      <thead>
        <tr>
          {CELDAS.map((celda) => (
            <Th key={celda.clave}>{celda.etiqueta}</Th>
          ))}
          {puedeGestionar && <Th>Estado</Th>}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <Fila
            key={fila.id}
            $clickable={puedeGestionar}
            onClick={puedeGestionar ? () => onAbrir?.(fila) : undefined}
          >
            <Td data-etiqueta="Apellidos y nombres">
              <Nombre>{fila.nombresCompletos}</Nombre>
            </Td>
            <Td data-etiqueta="Cargo">{fila.cargo || "—"}</Td>
            <Td data-etiqueta="Área">{fila.area || "—"}</Td>
            <Td data-etiqueta="Línea">{fila.linea || "—"}</Td>
            <Td data-etiqueta="Ciudad">{fila.ciudad || "—"}</Td>
            <Td data-etiqueta="Correo">
              <Correo>{fila.correoCorporativo || "—"}</Correo>
            </Td>
            <Td data-etiqueta="Ext.">{fila.extension || "—"}</Td>
            <Td data-etiqueta="Tel. empresarial">{fila.telefonoEmpresarial || "—"}</Td>
            {puedeGestionar && (
              <Td data-etiqueta="Estado">
                <Badge $tono={TONO_ESTADO[fila.estado] ?? "neutro"}>
                  {fila.estado === ESTADO.ACTIVO ? "Activo" : "De baja"}
                </Badge>
              </Td>
            )}
          </Fila>
        ))}
      </tbody>
    </TablaResponsiva>
  </TablaScroll>
);

export default TablaColaboradores;
