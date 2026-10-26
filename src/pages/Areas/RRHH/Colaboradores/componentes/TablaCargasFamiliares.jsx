import React from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";
import { ETIQUETA_TIPO_DISCAPACIDAD } from "../utils/constantesDotacion";
import { formatearFecha } from "../utils/fechas";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";

/**
 * Las cargas familiares de un colaborador para el año consultado.
 *
 * "Beneficiario IR" (esBeneficiarioImpuestoRenta) y "elegible este año"
 * (elegibleImpuestoRenta) son cosas distintas a propósito: la primera es la
 * intención que RRHH registró, la segunda es lo que el backend calculó según la
 * edad de la carga al cierre del año consultado. Pueden divergir cuando el hijo
 * ya cumplió 18 (o 21, si sigue estudiando) y nadie ha actualizado el registro
 * todavía; por eso se avisa con una insignia aparte en vez de ocultar el dato.
 *
 * Cada <Td> lleva data-etiqueta para la vista de tarjetas bajo 900 px, igual que
 * TablaDocumentos.jsx.
 */

const TablaAdaptable = styled(Tabla)`
  @media (max-width: 900px) {
    thead {
      display: none;
    }

    tr {
      display: block;
      padding: 8px 0;
      border-bottom: 1px solid ${({ theme }) => theme?.colors?.border};
    }

    td {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      border: 0;
      padding: 4px 12px;
    }

    td::before {
      content: attr(data-etiqueta);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: ${({ theme }) => theme?.colors?.textSecondary};
    }
  }
`;

const Nombre = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const TablaCargasFamiliares = ({
  cargas = [],
  ocupado,
  onEditar,
  onEliminar,
  onDescargar,
}) => {
  const { theme } = useTheme();

  if (cargas.length === 0) return null;

  return (
    <TablaScroll>
      <TablaAdaptable>
        <thead>
          <tr>
            <Th>Nombre completo</Th>
            <Th>Cédula</Th>
            <Th>Nacimiento</Th>
            <Th>Edad al 31/dic</Th>
            <Th>Discapacidad</Th>
            <Th>Beneficiario IR</Th>
            <Th>Archivo</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {cargas.map((carga) => {
            // Aunque RRHH la marcó como beneficiaria, si ya no es elegible por
            // edad este año se avisa aparte: ocultarlo llevaría a declarar mal
            // el impuesto a la renta.
            const noElegiblePorEdad = carga.esBeneficiarioImpuestoRenta && !carga.elegibleImpuestoRenta;

            return (
              <Fila key={carga.id}>
                <Td data-etiqueta="Nombre completo">
                  <Nombre>
                    <span>{carga.nombresCompletos}</span>
                    {carga.observacion && <TextoTenue>{carga.observacion}</TextoTenue>}
                  </Nombre>
                </Td>

                <Td data-etiqueta="Cédula">{carga.cedula || "—"}</Td>

                <Td data-etiqueta="Nacimiento">{formatearFecha(carga.fechaNacimiento)}</Td>

                <Td data-etiqueta="Edad al 31/dic">
                  {carga.edadAlCierreAnio === null || carga.edadAlCierreAnio === undefined
                    ? "—"
                    : carga.edadAlCierreAnio}
                </Td>

                <Td data-etiqueta="Discapacidad">
                  {carga.tieneDiscapacidad ? (
                    <Nombre>
                      <Badge $tono="info">
                        {carga.porcentajeDiscapacidad ? `${carga.porcentajeDiscapacidad}%` : "Sí"}
                      </Badge>
                      {carga.tipoDiscapacidad && (
                        <TextoTenue>
                          {ETIQUETA_TIPO_DISCAPACIDAD[carga.tipoDiscapacidad] ??
                            carga.tipoDiscapacidad}
                        </TextoTenue>
                      )}
                    </Nombre>
                  ) : (
                    "—"
                  )}
                </Td>

                <Td data-etiqueta="Beneficiario IR">
                  <Acciones>
                    <Badge $tono={carga.esBeneficiarioImpuestoRenta ? "exito" : "neutro"}>
                      {carga.esBeneficiarioImpuestoRenta ? "Sí" : "No"}
                    </Badge>
                    {noElegiblePorEdad && (
                      <Badge
                        $tono="aviso"
                        title="Ya no es elegible este año: la carga cumplió 18 (o 21, si estudia) años."
                      >
                        No elegible este año
                      </Badge>
                    )}
                  </Acciones>
                </Td>

                <Td data-etiqueta="Archivo">
                  {carga.archivo?.nombreOriginal ? (
                    <span>{carga.archivo.nombreOriginal}</span>
                  ) : (
                    <Badge $tono="peligro">Falta partida de nacimiento</Badge>
                  )}
                </Td>

                <Td data-etiqueta="Acciones">
                  <Acciones>
                    {carga.archivo?.nombreOriginal && (
                      <ButtonUI
                        text=""
                        iconLeft="FaDownload"
                        variant="ghost"
                        title="Descargar partida de nacimiento"
                        disabled={ocupado}
                        onClick={() => onDescargar?.(carga)}
                      />
                    )}
                    <ButtonUI
                      text=""
                      iconLeft="FaPenToSquare"
                      variant="ghost"
                      title="Editar"
                      disabled={ocupado}
                      onClick={() => onEditar?.(carga)}
                    />
                    <ButtonUI
                      text=""
                      iconLeft="FaTrashCan"
                      variant="ghost"
                      pcolor={theme?.colors?.error}
                      title="Eliminar"
                      disabled={ocupado}
                      onClick={() => onEliminar?.(carga)}
                    />
                  </Acciones>
                </Td>
              </Fila>
            );
          })}
        </tbody>
      </TablaAdaptable>
    </TablaScroll>
  );
};

export default TablaCargasFamiliares;
