import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { ObtenerColaborador } from "services/colaboradoresService";
import { CrearSolicitudVacaciones } from "services/vacacionesService";
import { CampoLabel } from "../componentes/CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  AreaTexto,
  Badge,
  CirculoIcono,
  Contenedor,
  Encabezado,
  EnlaceVolver,
  FilaFormulario,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";
import { RUTA_VACACIONES } from "../utils/constantesDotacion";
import { formatearFechaCorta, hoyIso } from "../utils/fechas";

const OPCIONES_TIPO = [
  { value: "Vacaciones", label: "Vacaciones" },
  { value: "Permiso", label: "Permiso" },
];

const BACKUP_VACIO = { nombre: "", cargo: "" };
const ACTIVIDAD_VACIA = { actividad: "", backupResponsable: "", documentacionSoporte: "", observaciones: "" };

/** Piezas locales de esta pantalla: pastilla de rango y tarjetas anidadas de backup/actividad. */
const PildoraRango = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  align-self: end;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ theme }) => theme?.colors?.primary};
  background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.primary ?? "#fd4703", alpha: 0.1 })};
`;

const TarjetaAnidada = styled.div`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 14px;
  background: ${({ theme }) => theme?.colors?.backgroundLight};
`;

const TarjetaActividad = styled(TarjetaAnidada)`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const GrillaBackup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 42px;
  gap: 16px;
  align-items: end;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const BotonRedondo = styled.button`
  flex: none;
  width: ${({ $tamano = 42 }) => $tamano}px;
  height: ${({ $tamano = 42 }) => $tamano}px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  border-radius: 10px;
  background: ${({ theme }) => theme?.colors?.backgroundCard};
  color: ${({ theme }) => theme?.colors?.error};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.error ?? "#dc2626", alpha: 0.08 })};
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const CirculoNumero = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: ${({ theme }) => theme?.colors?.primary};
  color: ${({ theme }) => theme?.colors?.white ?? "#fff"};
  font-size: 12px;
  font-weight: 700;
`;

const FilaSeccion = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EspaciadorFila = styled.div`
  flex: 1;
`;

/**
 * Página completa de "Nueva solicitud" de vacaciones/permisos.
 *
 * Antes era un ModalUI: con hasta 2 backups y una tabla de actividades a
 * entregarles, el formulario es demasiado largo para un cuadro de 760px y
 * quedaba todo comprimido. Ahora es una ruta propia, igual que ColNuevo/
 * ColEditar, con el ancho completo de la página para respirar.
 */
export const ColVacacionesNueva = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { datos: ficha, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerColaborador(id, { signal }),
    [id],
  );

  const [tipo, setTipo] = useState(OPCIONES_TIPO[0]);
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [fechaFin, setFechaFin] = useState(hoyIso());
  const [totalDias, setTotalDias] = useState("");
  const [fechaReincorporacion, setFechaReincorporacion] = useState("");
  const [fechaNotificacion, setFechaNotificacion] = useState(hoyIso());
  const [observacion, setObservacion] = useState("");
  const [backups, setBackups] = useState([]);
  const [actividades, setActividades] = useState([{ ...ACTIVIDAD_VACIA }]);
  const [errorValidacion, setErrorValidacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const volver = () => navigate(RUTA_VACACIONES(id));

  const actualizarBackup = (indice, campo, valor) =>
    setBackups((previos) => previos.map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)));

  const actualizarActividad = (indice, campo, valor) =>
    setActividades((previas) => previas.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const dias = Number(totalDias);
    if (!totalDias || !Number.isFinite(dias) || dias <= 0) {
      setErrorValidacion("Indique el total de días, mayor a 0.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setErrorValidacion("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setEnviando(true);
    try {
      await CrearSolicitudVacaciones(id, {
        tipo: tipo.value,
        fechaInicio,
        fechaFin,
        totalDias: dias,
        fechaReincorporacion: fechaReincorporacion || null,
        fechaNotificacion: fechaNotificacion || null,
        observacion: observacion.trim() || null,
        backups: backups
          .filter((b) => b.nombre.trim() !== "")
          .map((b) => ({ nombre: b.nombre.trim(), cargo: b.cargo.trim() || null })),
        actividades: actividades
          .filter((a) => a.actividad.trim() !== "")
          .map((a) => ({
            actividad: a.actividad.trim(),
            backupResponsable: a.backupResponsable.trim() || null,
            documentacionSoporte: a.documentacionSoporte.trim() || null,
            observaciones: a.observaciones.trim() || null,
          })),
      });
      toast.success("Solicitud registrada.");
      navigate(RUTA_VACACIONES(id), { replace: true });
    } catch (e) {
      toast.error(e.message || "No se pudo registrar la solicitud");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando la ficha…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !ficha) {
    return (
      <Contenedor>
        <EnlaceVolver to={RUTA_VACACIONES(id)}>← Volver a vacaciones</EnlaceVolver>
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar la ficha</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={RUTA_VACACIONES(id)}>← Volver a vacaciones</EnlaceVolver>
      <Encabezado>
        <div>
          <Titulo>Nueva solicitud</Titulo>
          <Subtitulo>Vacaciones y permisos · {ficha.nombresCompletos}</Subtitulo>
        </div>
      </Encabezado>

      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Tarjeta>
            <TituloTarjeta>Detalle</TituloTarjeta>
            <FilaFormulario $min={200}>
              <CampoLabel etiqueta="Tipo" requerido>
                <SelectUI
                  options={OPCIONES_TIPO}
                  value={tipo}
                  onChange={setTipo}
                  minWidth="100%"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
              <CampoLabel etiqueta="Total de días" requerido error={errorValidacion}>
                <InputUI
                  type="number"
                  value={totalDias}
                  onChange={(valor) => {
                    setTotalDias(valor);
                    setErrorValidacion(null);
                  }}
                  min={1}
                />
              </CampoLabel>
              <PildoraRango>
                <IconUI name="FaRegClock" size={14} color={theme?.colors?.primary} />
                {formatearFechaCorta(fechaInicio)} → {formatearFechaCorta(fechaFin)}
              </PildoraRango>
            </FilaFormulario>

            <FilaFormulario $min={200}>
              <CampoLabel etiqueta="Fecha de inicio" requerido>
                <InputUI type="date" value={fechaInicio} onChange={setFechaInicio} />
              </CampoLabel>
              <CampoLabel
                etiqueta="Fecha de finalización"
                requerido
                error={fechaFin < fechaInicio ? errorValidacion : null}
              >
                <InputUI type="date" value={fechaFin} onChange={setFechaFin} min={fechaInicio} />
              </CampoLabel>
              <CampoLabel etiqueta="Fecha de reincorporación">
                <InputUI type="date" value={fechaReincorporacion} onChange={setFechaReincorporacion} />
              </CampoLabel>
            </FilaFormulario>

            <FilaFormulario $min={220}>
              <CampoLabel etiqueta="Fecha de notificación">
                <InputUI type="date" value={fechaNotificacion} onChange={setFechaNotificacion} />
              </CampoLabel>
              <CampoLabel etiqueta="Observación">
                <AreaTexto
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={2}
                  maxLength={1000}
                />
              </CampoLabel>
            </FilaFormulario>
          </Tarjeta>

          <Tarjeta>
            <FilaSeccion>
              <TituloTarjeta style={{ margin: 0 }}>Backups</TituloTarjeta>
              <Badge $tono="neutro">{backups.length} de 2</Badge>
              <EspaciadorFila />
              {backups.length < 2 && (
                <ButtonUI
                  text="Agregar backup"
                  iconLeft="FaPlus"
                  variant="outlined"
                  onClick={() => setBackups((previos) => [...previos, { ...BACKUP_VACIO }])}
                />
              )}
            </FilaSeccion>
            {backups.length === 0 ? (
              <TextoTenue>Opcional: quién cubre a este colaborador mientras está fuera.</TextoTenue>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                {backups.map((backup, indice) => (
                  <TarjetaAnidada key={indice}>
                    <GrillaBackup>
                      <CampoLabel etiqueta={`Nombre backup ${indice + 1}`}>
                        <InputUI
                          value={backup.nombre}
                          onChange={(valor) => actualizarBackup(indice, "nombre", valor)}
                          maxLength={150}
                        />
                      </CampoLabel>
                      <CampoLabel etiqueta="Cargo">
                        <InputUI
                          value={backup.cargo}
                          onChange={(valor) => actualizarBackup(indice, "cargo", valor)}
                          maxLength={150}
                        />
                      </CampoLabel>
                      <BotonRedondo
                        type="button"
                        aria-label={`Quitar backup ${indice + 1}`}
                        onClick={() => setBackups((previos) => previos.filter((_b, i) => i !== indice))}
                      >
                        <IconUI name="FaTrash" size={15} color={theme?.colors?.error} />
                      </BotonRedondo>
                    </GrillaBackup>
                  </TarjetaAnidada>
                ))}
              </div>
            )}
          </Tarjeta>

          <Tarjeta>
            <FilaSeccion>
              <TituloTarjeta style={{ margin: 0 }}>Entrega de actividades al backup</TituloTarjeta>
              <EspaciadorFila />
              <ButtonUI
                text="Agregar actividad"
                iconLeft="FaPlus"
                variant="outlined"
                onClick={() => setActividades((previas) => [...previas, { ...ACTIVIDAD_VACIA }])}
              />
            </FilaSeccion>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {actividades.map((actividad, indice) => (
                <TarjetaActividad key={indice}>
                  <FilaSeccion>
                    <CirculoNumero>{indice + 1}</CirculoNumero>
                    <strong style={{ fontSize: 13 }}>Actividad {indice + 1}</strong>
                    <EspaciadorFila />
                    {actividades.length > 1 && (
                      <BotonRedondo
                        type="button"
                        $tamano={32}
                        aria-label={`Quitar actividad ${indice + 1}`}
                        onClick={() => setActividades((previas) => previas.filter((_a, i) => i !== indice))}
                      >
                        <IconUI name="FaXmark" size={14} color={theme?.colors?.error} />
                      </BotonRedondo>
                    )}
                  </FilaSeccion>
                  <FilaFormulario $min={220}>
                    <CampoLabel etiqueta="Actividad">
                      <InputUI
                        value={actividad.actividad}
                        onChange={(valor) => actualizarActividad(indice, "actividad", valor)}
                        maxLength={300}
                      />
                    </CampoLabel>
                    <CampoLabel etiqueta="Backup responsable">
                      <InputUI
                        value={actividad.backupResponsable}
                        onChange={(valor) => actualizarActividad(indice, "backupResponsable", valor)}
                        maxLength={150}
                      />
                    </CampoLabel>
                  </FilaFormulario>
                  <FilaFormulario $min={220}>
                    <CampoLabel etiqueta="Documentación / soporte">
                      <InputUI
                        value={actividad.documentacionSoporte}
                        onChange={(valor) => actualizarActividad(indice, "documentacionSoporte", valor)}
                        maxLength={300}
                      />
                    </CampoLabel>
                    <CampoLabel etiqueta="Observaciones">
                      <InputUI
                        value={actividad.observaciones}
                        onChange={(valor) => actualizarActividad(indice, "observaciones", valor)}
                        maxLength={500}
                      />
                    </CampoLabel>
                  </FilaFormulario>
                </TarjetaActividad>
              ))}
            </div>
          </Tarjeta>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Registrar solicitud"}
              iconLeft="FaCheck"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={volver} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </Contenedor>
  );
};

export default ColVacacionesNueva;
