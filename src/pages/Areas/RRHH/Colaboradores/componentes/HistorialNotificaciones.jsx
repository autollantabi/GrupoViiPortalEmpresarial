import React, { useState } from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";
import { formatearMomento } from "../utils/fechas";
import {
  Acciones,
  Badge,
  Fila,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
  Vacio,
} from "./piezas";

/**
 * El log de avisos enviados a los jefes de área.
 *
 * Muestra los FALLIDOS igual que los exitosos, y eso es el punto: es como
 * Recursos Humanos se entera de que a Logística no le llegó el correo, en vez de
 * que el fallo muera en un log del servidor. El motivo viene escrito para leerse
 * tal cual, e incluye qué hacer ("asigne un responsable al área").
 *
 * Arranca colapsado porque en una dotación con varios reenvíos son muchas filas y
 * lo normal es no necesitarlas.
 */
export const HistorialNotificaciones = ({ notificaciones = [] }) => {
  const { theme } = useTheme();
  const [abierto, setAbierto] = useState(false);

  const fallidos = notificaciones.filter((fila) => !fila.exitoso).length;

  return (
    <Tarjeta>
      <Acciones style={{ justifyContent: "space-between" }}>
        <TituloTarjeta style={{ margin: 0 }}>
          Avisos enviados
          {notificaciones.length > 0 && <TextoTenue> · {notificaciones.length}</TextoTenue>}
          {fallidos > 0 && (
            <>
              {" "}
              <Badge $tono="peligro">{fallidos} sin enviar</Badge>
            </>
          )}
        </TituloTarjeta>
        <ButtonUI
          text={abierto ? "Ocultar" : "Ver historial"}
          iconLeft={abierto ? "FaChevronUp" : "FaChevronDown"}
          variant="outlined"
          onClick={() => setAbierto((previo) => !previo)}
        />
      </Acciones>

      {abierto &&
        (notificaciones.length === 0 ? (
          <Vacio>
            <TextoTenue>Todavía no se ha enviado ningún aviso para esta dotación.</TextoTenue>
          </Vacio>
        ) : (
          <TablaScroll style={{ marginTop: 12 }}>
            <Tabla>
              <thead>
                <tr>
                  <Th>Cuándo</Th>
                  <Th>Grupo</Th>
                  <Th>Destinatario</Th>
                  <Th>Ítems</Th>
                  <Th>Resultado</Th>
                  <Th>Quién</Th>
                </tr>
              </thead>
              <tbody>
                {notificaciones.map((fila) => (
                  <Fila key={fila.id}>
                    <Td>{formatearMomento(fila.fechaEnvio)}</Td>
                    <Td>{fila.grupoCodigo}</Td>
                    <Td>{fila.destinatarios}</Td>
                    <Td>{fila.cantidadItems}</Td>
                    <Td>
                      {fila.exitoso ? (
                        <Acciones>
                          <IconUI name="FaCircleCheck" size={13} color={theme?.colors?.success} />
                          <TextoTenue>Enviado</TextoTenue>
                        </Acciones>
                      ) : (
                        <TextoTenue style={{ color: theme?.colors?.error }}>
                          {fila.mensaje}
                        </TextoTenue>
                      )}
                    </Td>
                    <Td>{fila.disparadoPor}</Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        ))}
    </Tarjeta>
  );
};

export default HistorialNotificaciones;
