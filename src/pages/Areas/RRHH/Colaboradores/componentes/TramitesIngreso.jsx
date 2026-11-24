import React from "react";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";
import { formatearMomento } from "../utils/fechas";

export const GRUPOS_TRAMITES = [
  {
    titulo: "Legalización",
    tramites: [
      {
        clave: "legalizadoIess",
        claveFecha: "legalizadoIessEn",
        etiqueta: "Legalizado IESS",
      },
      {
        clave: "legalizadoMinisterio",
        claveFecha: "legalizadoMinisterioEn",
        etiqueta: "Legalizado Ministerio",
      },
    ],
  },
  {
    titulo: "Registro en sistemas",
    tramites: [
      {
        clave: "creadoSapExcel",
        claveFecha: "creadoSapExcelEn",
        etiqueta: "Creado en SAP/Excel",
      },
      {
        clave: "creadoNomina",
        claveFecha: "creadoNominaEn",
        etiqueta: "Creado en Nómina",
      },
    ],
  },
  {
    titulo: "Cierre",
    tramites: [
      {
        clave: "archivadoIngreso",
        claveFecha: "archivadoIngresoEn",
        etiqueta: "Archivado",
      },
    ],
  },
];

const verde = (theme) => theme?.colors?.success ?? "#16a34a";

export const ColumnasIngreso = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: ${({ $dos }) => ($dos ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)")};

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ColumnaDatos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  max-width: ${({ $limitar }) => ($limitar ? "520px" : "none")};
`;

const Panel = styled.section`
  min-width: 0;
  padding-left: 24px;
  border-left: 1px solid ${({ theme }) => theme?.colors?.border};

  @media (max-width: 860px) {
    padding-left: 0;
    padding-top: 20px;
    border-left: 0;
    border-top: 1px solid ${({ theme }) => theme?.colors?.border};
  }
`;

const Cabecera = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const Subtitulo = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text};
`;

const Resumen = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary};
`;

const AnilloSvg = styled.svg`
  flex: none;
  transform: rotate(-90deg);
`;

const PistaAnillo = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme?.colors?.borderLight ?? theme?.colors?.border};
  stroke-width: 5;
`;

const ArcoAnillo = styled.circle`
  fill: none;
  stroke: ${({ theme, $completo }) =>
    $completo ? verde(theme) : (theme?.colors?.primary ?? "#fd4703")};
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
`;

const AnilloContenedor = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 52px;
  height: 52px;
`;

const AnilloTexto = styled.span`
  position: absolute;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme?.colors?.text};
`;

const Grupo = styled.div`
  & + & {
    margin-top: 14px;
  }
`;

const TituloGrupo = styled.p`
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme?.colors?.textTertiary ?? theme?.colors?.textSecondary};
`;

const Lista = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Paso = styled.li`
  position: relative;

  &:not(:last-child)::before {
    content: "";
    position: absolute;
    left: 21px;
    top: 38px;
    bottom: -2px;
    width: 2px;
    border-radius: 1px;
    background: ${({ theme, $hecho }) =>
      $hecho ? hexToRGBA({ hex: verde(theme), alpha: 0.5 }) : theme?.colors?.border};
  }
`;

const Marca = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
  color: ${({ theme, $hecho }) =>
    $hecho ? (theme?.colors?.white ?? "#fff") : theme?.colors?.textSecondary};
  background: ${({ theme, $hecho }) => ($hecho ? verde(theme) : "transparent")};
  border: 2px solid
    ${({ theme, $hecho }) => ($hecho ? verde(theme) : (theme?.colors?.inputBorder ?? theme?.colors?.border))};
`;

const Fila = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ theme, $hecho }) =>
    $hecho ? hexToRGBA({ hex: verde(theme), alpha: 0.07 }) : "transparent"};

  &:hover {
    background: ${({ theme, $hecho }) =>
      $hecho
        ? hexToRGBA({ hex: verde(theme), alpha: 0.12 })
        : hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.06 })};
  }

  &:hover ${Marca} {
    border-color: ${({ theme }) => theme?.colors?.primary};
  }

  &:focus-within {
    outline: 2px solid ${({ theme }) => theme?.colors?.focusRing ?? theme?.colors?.primary};
    outline-offset: 1px;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
`;

const Texto = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Nombre = styled.span`
  font-size: 14px;
  font-weight: ${({ $hecho }) => ($hecho ? 600 : 500)};
  color: ${({ theme, $hecho }) => ($hecho ? theme?.colors?.text : theme?.colors?.textSecondary)};
`;

const Detalle = styled.span`
  font-size: 11px;
  color: ${({ theme }) => verde(theme)};
`;

const RADIO = 22;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export const TramitesIngreso = ({ valores, onCambiar }) => {
  const todos = GRUPOS_TRAMITES.flatMap((grupo) => grupo.tramites);
  const total = todos.length;
  const hechos = todos.filter(({ clave }) => valores[clave]).length;
  const completo = hechos === total;
  let numero = 0;

  return (
    <Panel aria-label="Trámites de ingreso">
      <Cabecera>
        <div>
          <Subtitulo>Trámites de ingreso</Subtitulo>
          <Resumen>
            {completo
              ? "Todos los trámites están completos"
              : `Faltan ${total - hechos} por completar`}
          </Resumen>
        </div>
        <AnilloContenedor
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={hechos}
          aria-label="Trámites completados"
        >
          <AnilloSvg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
            <PistaAnillo cx="26" cy="26" r={RADIO} />
            <ArcoAnillo
              cx="26"
              cy="26"
              r={RADIO}
              $completo={completo}
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * (1 - hechos / total)}
            />
          </AnilloSvg>
          <AnilloTexto>
            {hechos}/{total}
          </AnilloTexto>
        </AnilloContenedor>
      </Cabecera>

      {GRUPOS_TRAMITES.map((grupo) => (
        <Grupo key={grupo.titulo}>
          <TituloGrupo>{grupo.titulo}</TituloGrupo>
          <Lista>
            {grupo.tramites.map(({ clave, claveFecha, etiqueta }) => {
              numero += 1;
              const hecho = Boolean(valores[clave]);
              const momento = valores[claveFecha];
              return (
                <Paso key={clave} $hecho={hecho}>
                  <Fila $hecho={hecho}>
                    <input
                      type="checkbox"
                      name={clave}
                      checked={hecho}
                      onChange={(evento) => onCambiar(clave)(evento.target.checked)}
                    />
                    <Marca $hecho={hecho} aria-hidden="true">
                      {hecho ? "✓" : numero}
                    </Marca>
                    <Texto>
                      <Nombre $hecho={hecho}>{etiqueta}</Nombre>
                      {hecho && momento && (
                        <Detalle>Marcado el {formatearMomento(momento)}</Detalle>
                      )}
                    </Texto>
                  </Fila>
                </Paso>
              );
            })}
          </Lista>
        </Grupo>
      ))}
    </Panel>
  );
};
