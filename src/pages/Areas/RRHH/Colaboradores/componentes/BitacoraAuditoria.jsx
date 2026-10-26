import React, { useState } from "react";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerBitacoraColaborador } from "services/colaboradoresService";
import { useConsulta } from "../hooks/useConsulta";
import { ACCION, ETIQUETA_ACCION, ETIQUETA_TABLA } from "../utils/constantes";
import { formatearMomento } from "../utils/fechas";
import {
  Acciones,
  Badge,
  CirculoIcono,
  Separador,
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
 * Bitácora de cambios de una ficha.
 *
 * Perezosa a propósito: no consulta hasta que alguien pulsa el botón. Son datos
 * que casi nunca se miran y la consulta cruza tres tablas.
 *
 * ── EL DETALLE QUE PARECE UN ADORNO Y NO LO ES ──────────────────────────────
 * "Antes" y "Ahora" se emparejan por POSICIÓN del arreglo de claves, no por
 * nombre. El backend construye los dos objetos en el mismo bucle justamente para
 * eso. Si alguien ordenara las claves en cualquiera de los dos lados, esta tabla
 * mostraría el valor de otro campo sin dar ningún error.
 */

const TONO_ACCION = {
  [ACCION.INSERCION]: "exito",
  [ACCION.ACTUALIZACION]: "info",
  [ACCION.ELIMINACION]: "peligro",
};

const Registro = styled.li`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme?.colors?.borderLight};

  &:last-child {
    border-bottom: 0;
  }
`;

const Lista = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Campo = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

/** El JSON del back a pares [clave, valor], con los nulos ya legibles. */
const aPares = (json) => {
  if (!json) return [];
  try {
    const objeto = JSON.parse(json);
    if (!objeto || typeof objeto !== "object") return [];
    return Object.entries(objeto).map(([clave, valor]) => [
      clave.replace(/_/g, " "),
      valor === null || valor === undefined || valor === "" ? "—" : String(valor),
    ]);
  } catch {
    return [];
  }
};

const Contenido = ({ id }) => {
  const { theme } = useTheme();
  const { datos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerBitacoraColaborador(id, { signal }),
    [id],
  );

  if (cargando) return <LoaderUI text="Cargando la bitácora…" height="140px" />;

  if (error) {
    return (
      <Vacio>
        <CirculoIcono $tono="peligro">
          <IconUI name="FaTriangleExclamation" size={22} color={theme?.colors?.error} />
        </CirculoIcono>
        <TextoTenue>{error}</TextoTenue>
        <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
      </Vacio>
    );
  }

  if (!datos || datos.length === 0) {
    return <TextoTenue>Todavía no hay cambios registrados en esta ficha.</TextoTenue>;
  }

  return (
    <Lista>
      {datos.map((registro) => {
        const antes = aPares(registro.datosAnteriores);
        const ahora = aPares(registro.datosNuevos);
        const esActualizacion = registro.accion === ACCION.ACTUALIZACION;

        return (
          <Registro key={registro.id}>
            <Acciones>
              <Badge $tono={TONO_ACCION[registro.accion] ?? "neutro"}>
                {ETIQUETA_ACCION[registro.accion] ?? registro.accion}
              </Badge>
              <TextoTenue>
                {ETIQUETA_TABLA[registro.tabla] ?? registro.tabla} ·{" "}
                {formatearMomento(registro.ocurrioEn)}
              </TextoTenue>
            </Acciones>

            <TextoTenue>
              {registro.usuario}
              {registro.ip ? ` · ${registro.ip}` : ""}
            </TextoTenue>

            {esActualizacion && ahora.length > 0 ? (
              <TablaScroll>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Campo</Th>
                      <Th>Antes</Th>
                      <Th>Ahora</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ahora.map(([campo, valorNuevo], indice) => (
                      <tr key={`${campo}-${indice}`}>
                        <Td>{campo}</Td>
                        {/* Emparejado por índice: ver la nota del encabezado. */}
                        <Td>{antes[indice]?.[1] ?? "—"}</Td>
                        <Td>{valorNuevo}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </TablaScroll>
            ) : (
              <Campo>
                {(ahora.length > 0 ? ahora : antes)
                  .map(([campo, valor]) => `${campo}: ${valor}`)
                  .join(" · ") || "Sin detalle"}
              </Campo>
            )}
          </Registro>
        );
      })}
    </Lista>
  );
};

export const BitacoraAuditoria = ({ id }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Tarjeta>
      <TituloTarjeta>Bitácora de cambios</TituloTarjeta>
      {visible ? (
        <>
          <Separador />
          <Contenido id={id} />
        </>
      ) : (
        <>
          <TextoTenue>
            Quién creó, editó o eliminó esta ficha, y qué cambió en cada caso.
          </TextoTenue>
          <div style={{ marginTop: 10 }}>
            <ButtonUI
              text="Ver bitácora de cambios"
              iconLeft="FaClipboardList"
              variant="outlined"
              onClick={() => setVisible(true)}
            />
          </div>
        </>
      )}
    </Tarjeta>
  );
};

export default BitacoraAuditoria;
