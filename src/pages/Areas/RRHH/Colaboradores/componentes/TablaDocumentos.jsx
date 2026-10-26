import React from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";
import {
  ESTADO_ENTREGA,
  ETIQUETA_CONDICION,
  ETIQUETA_ENTREGA,
  ETIQUETA_MOTIVO,
  formatearTamanio,
  TONO_ENTREGA,
} from "../utils/constantesDotacion";
import { formatearFecha } from "../utils/fechas";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";

/**
 * La documentación de un colaborador.
 *
 * La lista mezcla tres cosas y la tabla las distingue:
 *  - Documentos exigidos que aún no tienen fila (id nulo): se ven pendientes y sin
 *    archivo. Sin mostrarlos, RRHH no sabría qué falta.
 *  - Documentos con fila y archivo.
 *  - Documentos con fila pero SIN archivo, que es lo que dejó la migración: el
 *    papel existe en físico y lo que falta es escanearlo.
 *  - Documentos que ya no se exigen (motivo nulo) pero se conservan porque fueron
 *    entregados.
 *
 * Cada <Td> lleva data-etiqueta para la vista de tarjetas bajo 900 px.
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

export const TablaDocumentos = ({ documentos = [], onSubir, onMarcar, onDescargar, onQuitar, ocupado }) => {
  const { theme } = useTheme();

  if (documentos.length === 0) return null;

  return (
    <TablaScroll>
      <TablaAdaptable>
        <thead>
          <tr>
            <Th>Documento</Th>
            <Th>Se pide</Th>
            <Th>Estado</Th>
            <Th>Archivo</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {documentos.map((documento) => {
            // La clave incluye la etiqueta porque un tipo de varios ejemplares
            // aparece repetido, y una de esas filas puede tener id nulo.
            const clave = `${documento.tipoId}-${documento.etiqueta ?? ""}-${documento.id ?? "nuevo"}`;
            const entregado = documento.estado === ESTADO_ENTREGA.ENTREGADO;
            const sinDigitalizar = entregado && !documento.archivo;

            return (
              <Fila key={clave}>
                <Td data-etiqueta="Documento">
                  <Nombre>
                    <span>
                      {documento.tipoNombre}
                      {documento.etiqueta && <strong> · {documento.etiqueta}</strong>}
                    </span>
                    {documento.descripcion && <TextoTenue>{documento.descripcion}</TextoTenue>}
                  </Nombre>
                </Td>

                <Td data-etiqueta="Se pide">
                  {documento.motivo ? (
                    <>
                      {ETIQUETA_MOTIVO[documento.motivo] ?? documento.motivo}
                      {documento.condicion && (
                        <TextoTenue> · {ETIQUETA_CONDICION[documento.condicion]}</TextoTenue>
                      )}
                    </>
                  ) : (
                    <TextoTenue>Ya no se le exige</TextoTenue>
                  )}
                </Td>

                <Td data-etiqueta="Estado">
                  <Badge $tono={TONO_ENTREGA[documento.estado] ?? "neutro"}>
                    {ETIQUETA_ENTREGA[documento.estado] ?? documento.estado}
                  </Badge>
                  {entregado && documento.fechaEntrega && (
                    <TextoTenue> · {formatearFecha(documento.fechaEntrega)}</TextoTenue>
                  )}
                </Td>

                <Td data-etiqueta="Archivo">
                  {documento.archivo ? (
                    <Nombre>
                      <span>{documento.archivo.nombreOriginal}</span>
                      <TextoTenue>
                        v{documento.archivo.version}
                        {documento.totalVersiones > 1 && ` de ${documento.totalVersiones}`} ·{" "}
                        {formatearTamanio(documento.archivo.tamanioBytes)}
                      </TextoTenue>
                    </Nombre>
                  ) : sinDigitalizar ? (
                    <TextoTenue>Sin archivo digitalizado</TextoTenue>
                  ) : (
                    "—"
                  )}
                </Td>

                <Td data-etiqueta="Acciones">
                  <Acciones>
                    <ButtonUI
                      text={documento.archivo ? "Reemplazar" : "Subir"}
                      iconLeft="FaUpload"
                      variant="outlined"
                      disabled={ocupado}
                      onClick={() => onSubir?.(documento)}
                    />
                    {documento.archivo && (
                      <ButtonUI
                        text=""
                        iconLeft="FaDownload"
                        variant="ghost"
                        title="Descargar"
                        disabled={ocupado}
                        onClick={() => onDescargar?.(documento)}
                      />
                    )}
                    <ButtonUI
                      text=""
                      iconLeft="FaPenToSquare"
                      variant="ghost"
                      title="Cambiar el estado"
                      disabled={ocupado}
                      onClick={() => onMarcar?.(documento)}
                    />
                    {documento.id !== null && (
                      <ButtonUI
                        text=""
                        iconLeft="FaTrashCan"
                        variant="ghost"
                        pcolor={theme?.colors?.error}
                        title="Quitar el registro"
                        disabled={ocupado}
                        onClick={() => onQuitar?.(documento)}
                      />
                    )}
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

export default TablaDocumentos;
