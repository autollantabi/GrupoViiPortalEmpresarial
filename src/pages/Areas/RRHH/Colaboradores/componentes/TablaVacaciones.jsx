import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";
import { formatearFecha } from "../utils/fechas";

const ESTADO_TONO = {
  Pendiente: "aviso",
  Aprobada: "exito",
  Rechazada: "peligro",
};

/**
 * Historial de solicitudes de vacaciones/permisos de una ficha. Cada fila es
 * una solicitud (con su checklist de backups/actividades adentro, que no se
 * muestra acá: el PDF trae el detalle completo).
 *
 * `permiteRegistrar` oculta el botón "Registrar": esa caja es "PARA USO
 * EXCLUSIVO DE TALENTO HUMANO" (el ingreso real a nómina) y sigue exigiendo
 * gestión completa en el backend, a diferencia del resto de estas acciones,
 * que también puede hacer quien solo tiene el permiso de Dotación.
 */
export const TablaVacaciones = ({
  solicitudes = [],
  ocupado,
  onVerPdf,
  onDecidir,
  onRegistrar,
  onEliminar,
  permiteRegistrar = true,
}) => {
  if (solicitudes.length === 0) return null;

  return (
    <TablaScroll>
      <Tabla>
        <thead>
          <tr>
            <Th>Tipo</Th>
            <Th>Periodo</Th>
            <Th>Días</Th>
            <Th>Estado</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((solicitud) => (
            <Fila key={solicitud.id}>
              <Td>{solicitud.tipo}</Td>
              <Td>
                {formatearFecha(solicitud.fechaInicio)} – {formatearFecha(solicitud.fechaFin)}
              </Td>
              <Td>{solicitud.totalDias}</Td>
              <Td>
                <Badge $tono={ESTADO_TONO[solicitud.estado] ?? "neutro"}>{solicitud.estado}</Badge>
                {solicitud.estado === "Rechazada" && solicitud.motivoRechazo && (
                  <>
                    <br />
                    <TextoTenue>{solicitud.motivoRechazo}</TextoTenue>
                  </>
                )}
                {solicitud.estado === "Aprobada" && (
                  <>
                    <br />
                    <TextoTenue>
                      {solicitud.registradaEnSistema ? "Registrada en el sistema" : "Sin registrar todavía"}
                    </TextoTenue>
                  </>
                )}
              </Td>
              <Td>
                <Acciones>
                  <ButtonUI
                    text="PDF"
                    iconLeft="FaFilePdf"
                    variant="outlined"
                    disabled={ocupado}
                    onClick={() => onVerPdf?.(solicitud)}
                  />
                  {solicitud.estado === "Pendiente" && (
                    <>
                      <ButtonUI
                        text="Decidir"
                        iconLeft="FaGavel"
                        variant="outlined"
                        disabled={ocupado}
                        onClick={() => onDecidir?.(solicitud)}
                      />
                      <ButtonUI
                        text="Eliminar"
                        iconLeft="FaTrash"
                        variant="outlined"
                        disabled={ocupado}
                        onClick={() => onEliminar?.(solicitud)}
                      />
                    </>
                  )}
                  {permiteRegistrar && solicitud.estado === "Aprobada" && !solicitud.registradaEnSistema && (
                    <ButtonUI
                      text="Registrar"
                      iconLeft="FaCheck"
                      variant="outlined"
                      disabled={ocupado}
                      onClick={() => onRegistrar?.(solicitud)}
                    />
                  )}
                </Acciones>
              </Td>
            </Fila>
          ))}
        </tbody>
      </Tabla>
    </TablaScroll>
  );
};

export default TablaVacaciones;
