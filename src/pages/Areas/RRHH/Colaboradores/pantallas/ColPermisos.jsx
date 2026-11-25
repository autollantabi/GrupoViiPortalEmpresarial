import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  ActualizarSolicitudPermiso,
  CrearSolicitudPermiso,
  EliminarSolicitudPermiso,
  ListarSolicitudesPermiso,
  ListarTiposPermiso,
} from "services/permisosService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { ModalPermiso } from "../componentes/ModalPermiso";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaPermisos } from "../componentes/TablaPermisos";
import { useConsulta } from "../hooks/useConsulta";
import { Acciones, CirculoIcono, Contenedor, Tarjeta, TextoTenue, Vacio } from "../componentes/piezas";

/** Pestaña Permisos: solicitudes de permiso de la ficha. Calco de ColVacaciones.jsx, sin PDF ni nómina. */
export const ColPermisos = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [ocupado, setOcupado] = useState(false);
  const [enEdicion, setEnEdicion] = useState(undefined);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const { datos: tipos } = useConsulta(
    ({ signal }) => ListarTiposPermiso({ soloActivos: true, signal }),
    [],
  );

  const {
    datos: solicitudes,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ListarSolicitudesPermiso(id, { signal }), [id]);

  const guardar = async (datos) => {
    await (enEdicion ? ActualizarSolicitudPermiso(enEdicion.id, datos) : CrearSolicitudPermiso(id, datos));
    setEnEdicion(undefined);
    toast.success(enEdicion ? "Solicitud actualizada." : "Solicitud registrada.");
    recargar();
  };

  const eliminar = async (solicitud) => {
    if (!window.confirm("¿Eliminar esta solicitud de permiso?")) return;
    setOcupado(true);
    try {
      await EliminarSolicitudPermiso(solicitud.id);
      toast.success("Solicitud eliminada.");
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la solicitud");
    } finally {
      setOcupado(false);
    }
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando las solicitudes…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !solicitudes) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar las solicitudes</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} />

      <Acciones>
        <ButtonUI text="Nueva solicitud" iconLeft="FaPlus" onClick={() => setEnEdicion(null)} />
      </Acciones>

      <Tarjeta $sinRelleno>
        {solicitudes.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaCalendarXmark" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Sin solicitudes registradas</strong>
            <TextoTenue>Use "Nueva solicitud" para registrar la primera.</TextoTenue>
          </Vacio>
        ) : (
          <TablaPermisos
            solicitudes={solicitudes}
            ocupado={ocupado}
            onEditar={setEnEdicion}
            onEliminar={eliminar}
          />
        )}
      </Tarjeta>

      <ModalPermiso
        abierto={enEdicion !== undefined}
        solicitud={enEdicion}
        tipos={tipos}
        onCerrar={() => setEnEdicion(undefined)}
        onGuardar={guardar}
      />
    </Contenedor>
  );
};

export default ColPermisos;
