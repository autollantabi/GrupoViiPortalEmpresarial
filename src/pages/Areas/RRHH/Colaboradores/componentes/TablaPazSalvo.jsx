import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";
import { formatearFecha, hoyIso } from "../utils/fechas";

/**
 * Checklist de paz y salvo de un colaborador dado de baja: una fila por área
 * que debe dar el visto bueno, con su estado y, si está pendiente, el botón
 * para marcarla resuelta.
 *
 * Es unidireccional a propósito (igual que el servicio): el backend no ofrece
 * "des-resolver" un área, así que una vez Resuelto no hay acción sobre esa fila.
 *
 * `seleccionados`/`onAlternarSeleccion` arman la selección para "Reenviar
 * recordatorio" (ver ColPazSalvo.jsx): solo las filas Pendiente se pueden
 * marcar, una resuelta no tiene nada que recordarle a nadie.
 */
export const TablaPazSalvo = ({
  items = [],
  ocupado,
  onResolver,
  seleccionados = new Set(),
  onAlternarSeleccion,
}) => {
  if (items.length === 0) return null;

  const hoy = hoyIso();

  return (
    <TablaScroll>
      <Tabla>
        <thead>
          <tr>
            <Th aria-label="Seleccionar" />
            <Th>Área</Th>
            <Th>Estado</Th>
            <Th>Observación</Th>
            <Th>Plazo</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const resuelto = item.estado === "Resuelto";
            const vencido = !resuelto && item.fechaLimite && item.fechaLimite < hoy;
            return (
              <Fila key={item.id}>
                <Td data-etiqueta="Seleccionar">
                  {!resuelto && (
                    <CheckboxUI
                      name={`paz-salvo-${item.id}`}
                      checked={seleccionados.has(item.id)}
                      onChange={() => onAlternarSeleccion?.(item)}
                      label=""
                    />
                  )}
                </Td>
                <Td>{item.areaNombre}</Td>
                <Td>
                  <Badge $tono={resuelto ? "exito" : "aviso"}>{item.estado}</Badge>
                  {resuelto && item.fechaResolucion && (
                    <TextoTenue> · {formatearFecha(item.fechaResolucion)}</TextoTenue>
                  )}
                  {resuelto && item.resueltoPor && (
                    <>
                      <br />
                      <TextoTenue>Por {item.resueltoPor}</TextoTenue>
                    </>
                  )}
                </Td>
                <Td>{item.observacion || "—"}</Td>
                <Td>
                  {item.fechaLimite ? (
                    <>
                      {formatearFecha(item.fechaLimite)}
                      {vencido && (
                        <>
                          {" "}
                          <Badge $tono="peligro">Vencido</Badge>
                        </>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {!resuelto && (
                    <Acciones>
                      <ButtonUI
                        text="Marcar resuelto"
                        iconLeft="FaCheck"
                        variant="outlined"
                        disabled={ocupado}
                        onClick={() => onResolver?.(item)}
                      />
                    </Acciones>
                  )}
                </Td>
              </Fila>
            );
          })}
        </tbody>
      </Tabla>
    </TablaScroll>
  );
};

export default TablaPazSalvo;
