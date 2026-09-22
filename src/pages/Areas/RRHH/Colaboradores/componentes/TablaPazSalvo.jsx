import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";
import { formatearFecha } from "../utils/fechas";

/**
 * Checklist de paz y salvo de un colaborador dado de baja: una fila por área
 * que debe dar el visto bueno, con su estado y, si está pendiente, el botón
 * para marcarla resuelta.
 *
 * Es unidireccional a propósito (igual que el servicio): el backend no ofrece
 * "des-resolver" un área, así que una vez Resuelto no hay acción sobre esa fila.
 */
export const TablaPazSalvo = ({ items = [], ocupado, onResolver }) => {
  if (items.length === 0) return null;

  return (
    <TablaScroll>
      <Tabla>
        <thead>
          <tr>
            <Th>Área</Th>
            <Th>Estado</Th>
            <Th>Observación</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const resuelto = item.estado === "Resuelto";
            return (
              <Fila key={item.id}>
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
