import React from "react";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";
import { formatearMonto } from "../utils/constantesDotacion";
import { formatearFecha } from "../utils/fechas";

/** Nombre legible de cada tipo, y el tono de su badge. */
const TIPO = {
  Trabajo: { etiqueta: "Trabajo", tono: "info" },
  Ingresos: { etiqueta: "Ingresos", tono: "info" },
  Antiguedad: { etiqueta: "Antigüedad", tono: "info" },
  PazYSalvo: { etiqueta: "Paz y salvo", tono: "exito" },
};

/**
 * Historial de certificados emitidos para un colaborador: cada fila es un PDF
 * ya generado y archivado (ver CertificadosRrhhService.guardarEmision en el
 * backend), nunca una plantilla a medio llenar. "Ver" abre ese mismo PDF, no
 * uno regenerado con datos de hoy.
 */
export const TablaCertificados = ({ certificados = [], ocupado, onVer }) => {
  if (certificados.length === 0) return null;

  return (
    <TablaScroll>
      <Tabla>
        <thead>
          <tr>
            <Th>Tipo</Th>
            <Th>Destino</Th>
            <Th>Monto</Th>
            <Th>Emitido por</Th>
            <Th>Fecha</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {certificados.map((certificado) => {
            const tipo = TIPO[certificado.tipo] ?? { etiqueta: certificado.tipo, tono: "neutro" };
            return (
              <Fila key={certificado.id}>
                <Td>
                  <Badge $tono={tipo.tono}>{tipo.etiqueta}</Badge>
                </Td>
                <Td>{certificado.destino || "—"}</Td>
                <Td>
                  {certificado.montoDeclarado !== null
                    ? `$ ${formatearMonto(certificado.montoDeclarado)}`
                    : "—"}
                </Td>
                <Td>
                  <TextoTenue>{certificado.emitidoPor}</TextoTenue>
                </Td>
                <Td>{formatearFecha(certificado.emitidoEn)}</Td>
                <Td>
                  <ButtonUI
                    text="Ver"
                    iconLeft="FaEye"
                    variant="outlined"
                    disabled={ocupado}
                    onClick={() => onVer?.(certificado)}
                  />
                </Td>
              </Fila>
            );
          })}
        </tbody>
      </Tabla>
    </TablaScroll>
  );
};

export default TablaCertificados;
