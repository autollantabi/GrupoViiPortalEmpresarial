import React from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";
import {
  describirValores,
  ESTADO_ENTREGA,
  ETIQUETA_ENTREGA,
  TONO_ENTREGA,
} from "../utils/constantesDotacion";
import { formatearFecha } from "../utils/fechas";
import { Acciones, Badge, Fila, Tabla, TablaScroll, Td, TextoTenue, Th } from "./piezas";

/**
 * Los artículos de una dotación, agrupados por grupo.
 *
 * Cada <Td> lleva data-etiqueta porque bajo 900 px la tabla se convierte en
 * tarjetas y el pseudo-elemento toma de ahí el nombre de la columna. Es el mismo
 * patrón de TablaColaboradores; olvidar el atributo deja la celda sin encabezado
 * en móvil, y ahí no hay forma de saber qué es cada dato.
 */

const CabeceraGrupo = styled.tr`
  background: ${({ theme }) => theme?.colors?.backgroundLight};

  th {
    position: static;
    padding: 8px 12px;
    font-size: 12px;
    text-transform: none;
    letter-spacing: 0;
    color: ${({ theme }) => theme?.colors?.text};
    border-bottom: 1px solid ${({ theme }) => theme?.colors?.border};
  }
`;

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

export const TablaDotacion = ({ asignacion, onMarcar, onQuitar, ocupado }) => {
  const { theme } = useTheme();

  if (!asignacion?.grupos?.length) return null;

  return (
    <TablaScroll>
      <TablaAdaptable>
        <thead>
          <tr>
            <Th>Artículo</Th>
            <Th>Cantidad</Th>
            <Th>Detalle</Th>
            <Th>Estado</Th>
            <Th>Entrega</Th>
            <Th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {asignacion.grupos.map((grupo) => (
            <React.Fragment key={grupo.grupoCodigo}>
              <CabeceraGrupo>
                <th colSpan={6} scope="colgroup">
                  {grupo.grupoNombre}{" "}
                  <TextoTenue>
                    · {grupo.entregados} de {grupo.totalItems} entregado
                    {grupo.noAplica > 0 ? ` · ${grupo.noAplica} no aplica` : ""}
                  </TextoTenue>
                </th>
              </CabeceraGrupo>

              {grupo.items.map((item) => {
                const detalle = describirValores(item.valores);

                return (
                  <Fila key={item.id}>
                    <Td data-etiqueta="Artículo">
                      {item.itemNombre}
                      {/* itemId nulo = el artículo se dio de baja del catálogo. El
                          renglón sobrevive con su nombre copiado, y conviene
                          decirlo para que nadie lo busque en Configuración. */}
                      {item.itemId === null && (
                        <TextoTenue> · ya no está en el catálogo</TextoTenue>
                      )}
                    </Td>
                    <Td data-etiqueta="Cantidad">
                      {item.cantidad === null ? "—" : `${item.cantidad}${item.unidad ? ` ${item.unidad}` : ""}`}
                    </Td>
                    <Td data-etiqueta="Detalle">{detalle || "—"}</Td>
                    <Td data-etiqueta="Estado">
                      <Badge $tono={TONO_ENTREGA[item.estado] ?? "neutro"}>
                        {ETIQUETA_ENTREGA[item.estado] ?? item.estado}
                      </Badge>
                    </Td>
                    <Td data-etiqueta="Entrega">
                      {item.estado === ESTADO_ENTREGA.ENTREGADO ? (
                        <>
                          {formatearFecha(item.fechaEntrega)}
                          {item.entregadoPor && <TextoTenue> · {item.entregadoPor}</TextoTenue>}
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td data-etiqueta="Acciones">
                      <Acciones>
                        <ButtonUI
                          text={item.estado === ESTADO_ENTREGA.ENTREGADO ? "Editar" : "Entregar"}
                          iconLeft={
                            item.estado === ESTADO_ENTREGA.ENTREGADO ? "FaPenToSquare" : "FaCheck"
                          }
                          variant="outlined"
                          disabled={ocupado}
                          onClick={() => onMarcar?.(item)}
                        />
                        <ButtonUI
                          text=""
                          iconLeft="FaTrashCan"
                          variant="ghost"
                          pcolor={theme?.colors?.error}
                          disabled={ocupado}
                          title="Quitar de la dotación"
                          onClick={() => onQuitar?.(item)}
                        />
                      </Acciones>
                    </Td>
                  </Fila>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </TablaAdaptable>
    </TablaScroll>
  );
};

/** Barra de progreso de una asignación. */
export const ProgresoDotacion = ({ asignacion }) => {
  const { theme } = useTheme();

  if (!asignacion || asignacion.totalItems === 0) return null;

  const cerrados = asignacion.entregados + asignacion.noAplica;
  const porcentaje = Math.round((cerrados / asignacion.totalItems) * 100);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          flex: 1,
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: theme?.colors?.backgroundLight,
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: "100%",
            background: theme?.colors?.success,
            transition: "width .2s",
          }}
        />
      </div>
      <TextoTenue>
        {asignacion.entregados} de {asignacion.totalItems}
        {asignacion.noAplica > 0 ? ` (${asignacion.noAplica} no aplica)` : ""}
      </TextoTenue>
      {asignacion.pendientes === 0 && (
        <IconUI name="FaCircleCheck" size={14} color={theme?.colors?.success} />
      )}
    </div>
  );
};

export default TablaDotacion;
