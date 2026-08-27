import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CrearColaborador } from "services/colaboradoresService";
import { ColaboradorForm } from "../componentes/ColaboradorForm";
import { Contenedor, Encabezado, EnlaceVolver, Subtitulo, Titulo } from "../componentes/piezas";
import { RUTA_BASE } from "../utils/constantes";

/** Alta de una ficha. Al terminar va directo a la ficha creada. */
export const ColNuevo = () => {
  const navigate = useNavigate();

  const guardar = async (datos) => {
    const creada = await CrearColaborador(datos);
    toast.success("Ficha creada.");
    // replace para que el botón atrás no vuelva al formulario ya enviado.
    navigate(`${RUTA_BASE}/empleados/${creada.id}`, { replace: true });
  };

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={`${RUTA_BASE}/empleados`}>← Volver al listado</EnlaceVolver>
      <Encabezado>
        <div>
          <Titulo>Registrar ingreso</Titulo>
          <Subtitulo>
            Si la persona ya trabaja en otra empresa del grupo, se reutiliza su
            registro en lugar de duplicarlo.
          </Subtitulo>
        </div>
      </Encabezado>

      <ColaboradorForm
        modo="crear"
        onGuardar={guardar}
        onCancelar={() => navigate(`${RUTA_BASE}/empleados`)}
      />
    </Contenedor>
  );
};

export default ColNuevo;
