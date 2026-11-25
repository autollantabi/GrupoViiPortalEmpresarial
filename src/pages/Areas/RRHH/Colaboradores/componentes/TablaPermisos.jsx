import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";
import { formatearRangoPermiso } from "../utils/fechas";

const ESTADO_TONO = {
  Pendiente: "aviso",
  Aprobada: "exito",
  Rechazada: "peligro",
};

/** Historial de solicitudes de permiso de una ficha. Calco de TablaVacaciones.jsx, sin PDF ni nómina. */
export const TablaPermisos = ({ solicitudes = [], ocupado, onEditar, onEliminar }) => {
  if (solicitudes.length === 0) return null;

  return (
    <TablaScroll>
      <Tabla>
        <thead>
          <tr>
            <Th>Tipo</Th>
            <Th>Rango</Th>
            <Th>Motivo</Th>
            <Th>Estado</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((solicitud) => (
            <Fila key={solicitud.id}>
              <Td>{solicitud.tipoPermiso}</Td>
              <Td>
                {formatearRangoPermiso(
                  solicitud.fechaInicio,
                  solicitud.horaInicio,
                  solicitud.fechaFin,
                  solicitud.horaFin,
                )}
              </Td>
              <Td>{solicitud.motivo}</Td>
              <Td>
                <Badge $tono={ESTADO_TONO[solicitud.estado] ?? "neutro"}>{solicitud.estado}</Badge>
                {solicitud.estado === "Rechazada" && solicitud.motivoRechazo && (
                  <>
                    <br />
                    <TextoTenue>{solicitud.motivoRechazo}</TextoTenue>
                  </>
                )}
              </Td>
              <Td>
                <Acciones>
                  <ButtonUI
                    text="Editar"
                    iconLeft="FaPenToSquare"
                    variant="outlined"
                    disabled={ocupado}
                    onClick={() => onEditar?.(solicitud)}
                  />
                  <ButtonUI
                    text="Eliminar"
                    iconLeft="FaTrash"
                    variant="outlined"
                    disabled={ocupado}
                    onClick={() => onEliminar?.(solicitud)}
                  />
                </Acciones>
              </Td>
            </Fila>
          ))}
        </tbody>
      </Tabla>
    </TablaScroll>
  );
};

export default TablaPermisos;
