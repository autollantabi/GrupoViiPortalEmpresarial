import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ActualizarColaborador, ObtenerColaborador } from "services/colaboradoresService";
import { ColaboradorForm } from "../componentes/ColaboradorForm";
import { useConsulta } from "../hooks/useConsulta";
import {
  CirculoIcono,
  Contenedor,
  Encabezado,
  EnlaceVolver,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  Vacio,
} from "../componentes/piezas";
import { RUTA_BASE } from "../utils/constantes";

/** Edición de una ficha. No toca el estado ni la salida: eso va por baja o reingreso. */
export const ColEditar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const { datos: ficha, cargando, error, recargar } = useConsulta(
    ({ signal }) => ObtenerColaborador(id, { signal }),
    [id],
  );

  const guardar = async (datos) => {
    await ActualizarColaborador(id, datos);
    toast.success("Ficha actualizada.");
    navigate(`${RUTA_BASE}/empleados/${id}`, { replace: true });
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

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={`${RUTA_BASE}/empleados/${id}`}>← Volver a la ficha</EnlaceVolver>
      <Encabezado>
        <div>
          <Titulo>Editar ficha</Titulo>
          <Subtitulo>
            {ficha.nombresCompletos} · {ficha.empresa}
          </Subtitulo>
        </div>
      </Encabezado>

      <ColaboradorForm
        modo="editar"
        ficha={ficha}
        onGuardar={guardar}
        onCancelar={() => navigate(`${RUTA_BASE}/empleados/${id}`)}
      />
    </Contenedor>
  );
};

export default ColEditar;
