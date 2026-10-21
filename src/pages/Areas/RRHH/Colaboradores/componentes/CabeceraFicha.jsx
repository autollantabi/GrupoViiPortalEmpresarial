import React from "react";
import { ESTADO, RUTA_BASE, TONO_ESTADO } from "../utils/constantes";
import { formatearFecha } from "../utils/fechas";
import {
  Acciones,
  AvatarIniciales,
  Aviso,
  Badge,
  Encabezado,
  EnlaceVolver,
  Subtitulo,
  Titulo,
} from "./piezas";

/** "Ronald" + "Acuña" → "RA". No hay foto en el Portal: solo iniciales. */
const inicialesDe = (ficha) => {
  const nombre = String(ficha?.nombres ?? "").trim()[0] ?? "";
  const apellido = String(ficha?.apellidos ?? "").trim()[0] ?? "";
  const resultado = `${nombre}${apellido}`.toUpperCase();
  return resultado || "?";
};

/**
 * Nombre, estado y avisos de una ficha, compartidos por sus tres pestañas.
 *
 * Está extraída de ColFicha porque Dotación y Documentación necesitan la misma
 * cabecera: sin esto, al abrir una pestaña el nombre de la persona desaparecería
 * de la pantalla y ya no se sabría de quién es la dotación que se está mirando.
 *
 * Las acciones van por `children` y no fijas acá: cada pestaña tiene las suyas
 * (Datos trae dar de baja, editar y eliminar; Dotación trae reenviar avisos).
 */
export const CabeceraFicha = ({ ficha, chipPrueba, children }) => {
  if (!ficha) return null;

  const activo = ficha.estado === ESTADO.ACTIVO;

  return (
    <>
      <EnlaceVolver to={`${RUTA_BASE}/empleados`}>← Volver al listado</EnlaceVolver>

      <Encabezado>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <AvatarIniciales>{inicialesDe(ficha)}</AvatarIniciales>
          <div>
            <Acciones>
              <Titulo>{ficha.nombresCompletos}</Titulo>
              <Badge $tono={TONO_ESTADO[ficha.estado] ?? "neutro"}>
                {activo ? "Activo" : "De baja"}
              </Badge>
              {chipPrueba}
            </Acciones>
            <Subtitulo>
              {ficha.cargo ? `${ficha.cargo} · ` : ""}
              {ficha.empresa}
            </Subtitulo>
          </div>
        </div>
        {children && <Acciones>{children}</Acciones>}
      </Encabezado>

      {!activo && (
        <Aviso $tono="peligro">
          Salió el {formatearFecha(ficha.fechaSalida)}
          {ficha.motivoSalida ? ` · ${ficha.motivoSalida}` : ""}
        </Aviso>
      )}
    </>
  );
};

export default CabeceraFicha;
