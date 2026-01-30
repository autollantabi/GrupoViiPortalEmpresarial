import React from "react";
import { toast } from "react-toastify";
import { CardUI } from "components/UI/Components/CardUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { hexToRGBA } from "utils/colors";
import { CrearPermisoRol, EliminarPermisoRol } from "services/administracionService";

export const PermisosRolSection = ({
  theme,
  permisosRol,
  roles,
  permisos,
  rolSeleccionado,
  setRolSeleccionado,
  permisoSeleccionado,
  setPermisoSeleccionado,
  cargandoPermisosRol,
  setCargandoPermisosRol,
  cargarPermisosRol,
}) => {
  const handleCrearPermisoRol = async () => {
    if (!rolSeleccionado || !permisoSeleccionado) {
      toast.error("Debe seleccionar un rol y un permiso");
      return;
    }

    try {
      const res = await CrearPermisoRol({
        ID_ROL: rolSeleccionado.value,
        ID_PERMISO: permisoSeleccionado.value,
      });
      if (res.success) {
        toast.success(res.message || "Relación creada exitosamente");
        setRolSeleccionado(null);
        setPermisoSeleccionado(null);
        cargarPermisosRol();
      } else {
        toast.error(res.message || "Error al crear la relación");
      }
    } catch (error) {
      console.error("Error al crear permiso-rol:", error);
      toast.error("Error al crear la relación");
    }
  };

  const handleEliminarPermisoRol = async (id) => {
    try {
      const res = await EliminarPermisoRol({ id });
      if (res.success) {
        toast.success(res.message || "Relación eliminada exitosamente");
        cargarPermisosRol();
      } else {
        toast.error(res.message || "Error al eliminar la relación");
      }
    } catch (error) {
      console.error("Error al eliminar permiso-rol:", error);
      toast.error("Error al eliminar la relación");
    }
  };

  // Obtener nombre del rol por ID
  const obtenerNombreRol = (idRol) => {
    const rol = roles.find((r) => r.ID_ROL === idRol);
    return rol?.NOMBRE_ROL || "Rol no encontrado";
  };

  // Obtener nombre del permiso por ID
  const obtenerNombrePermiso = (idPermiso) => {
    const permiso = permisos.find((p) => p.ID_PERMISO === idPermiso);
    return permiso?.NOMBRE_ACCION || "Permiso no encontrado";
  };

  // Opciones para los selects
  const opcionesRoles = roles.map((rol) => ({
    value: rol.ID_ROL,
    label: rol.NOMBRE_ROL,
  }));

  const opcionesPermisos = permisos.map((permiso) => ({
    value: permiso.ID_PERMISO,
    label: permiso.NOMBRE_ACCION,
  }));

  return (
    <CardUI
      title="Gestión de Permisos-Rol"
      description="Asignar permisos a roles"
      initialOpen={false}
      headerActions={
        <ButtonUI
          iconLeft="FaArrowsRotate"
          onClick={cargarPermisosRol}
          disabled={cargandoPermisosRol}
          pcolor={theme.colors.primary}
          title="Actualizar lista"
        />
      }
      body={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Formulario para crear relación */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <SelectUI
              placeholder="Seleccionar Rol"
              options={opcionesRoles}
              value={rolSeleccionado}
              onChange={setRolSeleccionado}
              isSearchable
            />
            <SelectUI
              placeholder="Seleccionar Permiso"
              options={opcionesPermisos}
              value={permisoSeleccionado}
              onChange={setPermisoSeleccionado}
              isSearchable
            />
            <ButtonUI
              text="Asignar"
              onClick={handleCrearPermisoRol}
              pcolor={theme.colors.secondary}
              disabled={
                cargandoPermisosRol ||
                !rolSeleccionado ||
                !permisoSeleccionado
              }
            />
          </div>

          {/* Lista de relaciones */}
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              borderRadius: "6px",
              paddingRight: "8px",
            }}
          >
            {permisosRol.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: theme.colors.textSecondary,
                  fontSize: "13px",
                }}
              >
                {cargandoPermisosRol ? "Cargando..." : "No hay relaciones"}
              </div>
            ) : (
              permisosRol.map((relacion) => {
                const idRelacion =
                  relacion.IDENTIFICADOR ||
                  relacion.id ||
                  relacion.ID_PERMISO_ROL;
                const idRol =
                  relacion.ID_ROL || relacion.IDENTIFICADOR_ROL;
                const idPermiso =
                  relacion.ID_PERMISO || relacion.IDENTIFICADOR_PERMISO;

                return (
                  <div
                    key={idRelacion}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      marginBottom: "8px",
                      backgroundColor: hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.05,
                      }),
                      borderRadius: "4px",
                      border: `1px solid ${hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.1,
                      })}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: theme.colors.text,
                          fontWeight: "600",
                        }}
                      >
                        Rol: {obtenerNombreRol(idRol)}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: theme.colors.textSecondary,
                        }}
                      >
                        Permiso: {obtenerNombrePermiso(idPermiso)}
                      </span>
                    </div>
                    <ButtonUI
                      iconLeft="FaTrash"
                      onClick={() => handleEliminarPermisoRol(idRelacion)}
                      pcolor={theme.colors.error}
                      style={{ padding: "5px 10px" }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      }
      theme={theme}
    />
  );
};

