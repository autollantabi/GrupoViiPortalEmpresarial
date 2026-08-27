import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import {
  DarDeBajaColaborador,
  EliminarColaborador,
  ObtenerColaborador,
  ReingresarColaborador,
} from "services/colaboradoresService";
import { BitacoraAuditoria } from "../componentes/BitacoraAuditoria";
import { ModalBajaReingreso } from "../componentes/ModalBajaReingreso";
import { ModalEliminar } from "../componentes/ModalEliminar";
import { useConsulta } from "../hooks/useConsulta";
import {
  ESTADO,
  RUTA_BASE,
  TONO_ESTADO,
  TONO_MOVIMIENTO,
} from "../utils/constantes";
import { formatearFecha, formatearMomento } from "../utils/fechas";
import {
  Acciones,
  Aviso,
  Badge,
  BotonEnlace,
  CirculoIcono,
  Contenedor,
  DatoContenedor,
  DatoEtiqueta,
  DatoValor,
  Encabezado,
  EnlaceVolver,
  ItemTiempo,
  LineaTiempo,
  ListaDatos,
  Separador,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";

/** Un dato de la ficha, con guion largo cuando está vacío. */
const Dato = ({ etiqueta, children }) => (
  <DatoContenedor>
    <DatoEtiqueta>{etiqueta}</DatoEtiqueta>
    <DatoValor>{children === null || children === undefined || children === "" ? "—" : children}</DatoValor>
  </DatoContenedor>
);

/** Ficha completa: datos, historial de movimientos y bitácora. */
export const ColFicha = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [modal, setModal] = useState(null); // 'baja' | 'reingreso' | 'eliminar'

  const { datos: ficha, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerColaborador(id, { signal }),
    [id],
  );

  const cerrarModal = () => setModal(null);

  const confirmarBaja = async (carga) => {
    await DarDeBajaColaborador(id, carga);
    toast.success("Baja registrada.");
    cerrarModal();
    recargar();
  };

  const confirmarReingreso = async (carga) => {
    await ReingresarColaborador(id, carga);
    toast.success("Reingreso registrado.");
    cerrarModal();
    recargar();
  };

  const confirmarEliminacion = async (motivo) => {
    await EliminarColaborador(id, motivo);
    toast.success("Ficha eliminada.");
    navigate(`${RUTA_BASE}/empleados`, { replace: true });
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando la ficha…" height="260px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !ficha) {
    return (
      <Contenedor>
        <EnlaceVolver to={`${RUTA_BASE}/empleados`}>← Volver al listado</EnlaceVolver>
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar la ficha</strong>
            <TextoTenue>{error ?? "La ficha ya no existe."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const activo = ficha.estado === ESTADO.ACTIVO;

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={`${RUTA_BASE}/empleados`}>← Volver al listado</EnlaceVolver>

      <Encabezado>
        <div>
          <Acciones>
            <Titulo>{ficha.nombresCompletos}</Titulo>
            <Badge $tono={TONO_ESTADO[ficha.estado] ?? "neutro"}>
              {activo ? "Activo" : "De baja"}
            </Badge>
          </Acciones>
          <Subtitulo>
            {ficha.cargo ? `${ficha.cargo} · ` : ""}
            {ficha.empresa}
          </Subtitulo>
        </div>
        <Acciones>
          {activo ? (
            <ButtonUI
              text="Dar de baja"
              iconLeft="FaUserSlash"
              variant="outlined"
              onClick={() => setModal("baja")}
            />
          ) : (
            <ButtonUI
              text="Reingresar"
              iconLeft="FaUserCheck"
              variant="outlined"
              onClick={() => setModal("reingreso")}
            />
          )}
          <BotonEnlace to={`${RUTA_BASE}/empleados/${id}/editar`}>
            <IconUI name="FaPenToSquare" size={14} />
            Editar
          </BotonEnlace>
          <ButtonUI
            text="Eliminar"
            iconLeft="FaTrashCan"
            variant="ghost"
            pcolor={theme?.colors?.error}
            onClick={() => setModal("eliminar")}
          />
        </Acciones>
      </Encabezado>

      {!activo && (
        <Aviso $tono="peligro">
          Salió el {formatearFecha(ficha.fechaSalida)}
          {ficha.motivoSalida ? ` · ${ficha.motivoSalida}` : ""}
        </Aviso>
      )}

      {activo && !ficha.fechaIngreso && (
        <Aviso $tono="aviso">
          Esta ficha viene de la carga inicial y no tiene fecha de ingreso. Complétela
          antes de dar de baja, para que quede claro el período trabajado.
        </Aviso>
      )}

      <Tarjeta>
        <TituloTarjeta>Datos</TituloTarjeta>
        <ListaDatos>
          <Dato etiqueta="Área">{ficha.area}</Dato>
          <Dato etiqueta="Línea de negocio">{ficha.linea}</Dato>
          <Dato etiqueta="Ciudad">{ficha.ciudad}</Dato>
          <Dato etiqueta="Cédula">{ficha.cedula}</Dato>
          <Dato etiqueta="Nacimiento">
            {ficha.fechaNacimiento ? formatearFecha(ficha.fechaNacimiento) : null}
          </Dato>
          <Dato etiqueta="Correo corporativo">{ficha.correoCorporativo}</Dato>
          {!ficha.correoCorporativo && ficha.correoEstandar && (
            <Dato etiqueta="Correo sugerido">{ficha.correoEstandar}</Dato>
          )}
          <Dato etiqueta="Extensión">{ficha.extension}</Dato>
          <Dato etiqueta="Teléfono empresarial">{ficha.telefonoEmpresarial}</Dato>
          <Dato etiqueta="Ingreso">
            {ficha.fechaIngreso ? formatearFecha(ficha.fechaIngreso) : null}
          </Dato>
          <Dato etiqueta="Observación">{ficha.observacion}</Dato>
        </ListaDatos>

        <Separador />
        <TextoTenue>
          Creada por {ficha.auditoria.creadoPor} el {formatearMomento(ficha.auditoria.creadoEn)}
          {ficha.auditoria.modificadoPor
            ? ` · Última edición por ${ficha.auditoria.modificadoPor} el ${formatearMomento(
                ficha.auditoria.modificadoEn,
              )}`
            : ""}
        </TextoTenue>
      </Tarjeta>

      <Tarjeta>
        <TituloTarjeta>Historial</TituloTarjeta>
        {ficha.movimientos.length === 0 ? (
          <TextoTenue>No hay movimientos registrados.</TextoTenue>
        ) : (
          <LineaTiempo>
            {ficha.movimientos.map((mov) => (
              <ItemTiempo key={mov.id} $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}>
                <Acciones>
                  <Badge $tono={TONO_MOVIMIENTO[mov.tipo] ?? "neutro"}>{mov.tipo}</Badge>
                  <TextoTenue>{formatearFecha(mov.fecha)}</TextoTenue>
                </Acciones>
                {mov.motivo && <DatoValor>{mov.motivo}</DatoValor>}
                {mov.observacion && <TextoTenue>{mov.observacion}</TextoTenue>}
                <TextoTenue>
                  Registrado por {mov.registradoPor}
                  {mov.registradoDesdeIp ? ` · ${mov.registradoDesdeIp}` : ""}
                </TextoTenue>
              </ItemTiempo>
            ))}
          </LineaTiempo>
        )}
      </Tarjeta>

      <BitacoraAuditoria id={id} />

      <ModalBajaReingreso
        abierto={modal === "baja" || modal === "reingreso"}
        modo={modal === "baja" ? "baja" : "reingreso"}
        ficha={ficha}
        onCerrar={cerrarModal}
        onConfirmar={modal === "baja" ? confirmarBaja : confirmarReingreso}
      />

      <ModalEliminar
        abierto={modal === "eliminar"}
        ficha={ficha}
        onCerrar={cerrarModal}
        onConfirmar={confirmarEliminacion}
      />
    </Contenedor>
  );
};

export default ColFicha;
