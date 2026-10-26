import React from "react";
import { Acciones, Badge, ItemTiempo, LineaTiempo, TextoTenue } from "./piezas";
import { formatearFecha } from "../utils/fechas";

/**
 * Línea de tiempo de los cargos de un empleado: más reciente primero, con el
 * vigente destacado. Misma pieza (LineaTiempo/ItemTiempo) que usa el historial
 * de movimientos de ColFicha.
 */
export const HistorialCargos = ({ historial = [] }) => {
  const ordenado = [...historial].sort((a, b) => {
    if (a.vigente !== b.vigente) return a.vigente ? -1 : 1;
    return String(b.fechaInicio).localeCompare(String(a.fechaInicio));
  });

  if (ordenado.length === 0) {
    return <TextoTenue>No hay cambios de cargo registrados.</TextoTenue>;
  }

  return (
    <LineaTiempo>
      {ordenado.map((cambio) => (
        <ItemTiempo key={cambio.id} $tono={cambio.vigente ? "exito" : "neutro"}>
          <Acciones>
            <strong>{cambio.cargo}</strong>
            {cambio.vigente && <Badge $tono="exito">Actual</Badge>}
          </Acciones>
          <TextoTenue>
            {formatearFecha(cambio.fechaInicio)} –{" "}
            {cambio.fechaFin ? formatearFecha(cambio.fechaFin) : "presente"}
          </TextoTenue>
          {cambio.observacion && <TextoTenue>{cambio.observacion}</TextoTenue>}
        </ItemTiempo>
      ))}
    </LineaTiempo>
  );
};

export default HistorialCargos;
