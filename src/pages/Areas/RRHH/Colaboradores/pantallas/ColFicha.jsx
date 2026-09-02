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
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { ModalBajaReingreso } from "../componentes/ModalBajaReingreso";
import { ModalEliminar } from "../componentes/ModalEliminar";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { useConsulta } from "../hooks/useConsulta";
import { ESTADO, RUTA_BASE, TONO_MOVIMIENTO } from "../utils/constantes";
import { formatearFecha, formatearMomento } from "../utils/fechas";
import { ObtenerDocumentacionEmpleado, ObtenerDotacionEmpleado } from "services/dotacionService";
import { ETIQUETA_ESTADO_CIVIL, RUTA_DOCUMENTOS, RUTA_DOTACION } from "../utils/constantesDotacion";
import { Rejilla } from "../componentes/piezas";
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
  EnlaceVolver,
  ItemTiempo,
  LineaTiempo,
  ListaDatos,
  Separador,
  Tarjeta,
  TextoTenue,
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

  /**
   * Resumen de las otras dos pestañas.
   *
   * Se pide desde acá, y no solo dentro de cada pestaña, para poder poner el
   * contador de pendientes en la pestaña misma: sin eso, RRHH tendría que entrar a
   * mirar si falta algo. Son dos consultas de lectura y no bloquean la ficha: si
   * fallan, los contadores quedan en cero y la ficha se ve igual.
   */
  const { datos: dotacion } = useConsulta(
    ({ signal }) => ObtenerDotacionEmpleado(id, { signal }),
    [id],
  );

  const { datos: documentacion } = useConsulta(
    ({ signal }) => ObtenerDocumentacionEmpleado(id, { signal }),
    [id],
  );

  const pendientesDotacion = (dotacion?.asignaciones ?? []).reduce(
    (total, fila) => total + fila.pendientes,
    0,
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
      <CabeceraFicha ficha={ficha}>
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
      </CabeceraFicha>

      <PestanasFicha
        id={id}
        pendientesDotacion={pendientesDotacion}
        pendientesDocumentos={documentacion?.pendientes ?? 0}
      />

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
          <Dato etiqueta="Estado civil">
            {ficha.estadoCivil
              ? (ETIQUETA_ESTADO_CIVIL[ficha.estadoCivil] ?? ficha.estadoCivil)
              : null}
          </Dato>
          <Dato etiqueta="Hijos">
            {ficha.numeroHijos === null || ficha.numeroHijos === undefined
              ? null
              : ficha.numeroHijos}
          </Dato>
          <Dato etiqueta="Conduce">{ficha.conduce ? "Sí" : "No"}</Dato>
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

      {/* Resumen de las otras dos pestañas, para no tener que entrar a mirar. */}
      <Rejilla $min={280}>
        <Tarjeta>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Dotación</TituloTarjeta>
            <BotonEnlace to={RUTA_DOTACION(id)}>Ver</BotonEnlace>
          </Acciones>
          {dotacion === null ? (
            <TextoTenue>Cargando…</TextoTenue>
          ) : dotacion.asignaciones.length === 0 ? (
            <TextoTenue>Sin dotación registrada.</TextoTenue>
          ) : (
            <TextoTenue>
              {dotacion.asignaciones.length} asignación(es) ·{" "}
              {pendientesDotacion === 0
                ? "todo entregado"
                : `${pendientesDotacion} artículo(s) pendiente(s)`}
            </TextoTenue>
          )}
        </Tarjeta>

        <Tarjeta>
          <Acciones style={{ justifyContent: "space-between" }}>
            <TituloTarjeta style={{ margin: 0 }}>Documentación</TituloTarjeta>
            <BotonEnlace to={RUTA_DOCUMENTOS(id)}>Ver</BotonEnlace>
          </Acciones>
          {documentacion === null ? (
            <TextoTenue>Cargando…</TextoTenue>
          ) : (
            <TextoTenue>
              {documentacion.entregados} de {documentacion.totalRequeridos} entregado
              {documentacion.sinArchivo > 0 &&
                ` · ${documentacion.sinArchivo} sin digitalizar`}
            </TextoTenue>
          )}
        </Tarjeta>
      </Rejilla>

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
