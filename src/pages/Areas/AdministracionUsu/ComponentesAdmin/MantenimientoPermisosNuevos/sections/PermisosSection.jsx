import React from "react";
import { toast } from "react-toastify";
import { CardUI } from "components/UI/Components/CardUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { hexToRGBA } from "utils/colors";
import { CrearPermiso, ActualizarPermiso } from "services/administracionService";

export const PermisosSection = ({
  theme,
  permisos,
  nuevoPermiso,
  setNuevoPermiso,
  permisoEditando,
  setPermisoEditando,
  permisoEditandoNombre,
  setPermisoEditandoNombre,
  cargandoPermisos,
  setCargandoPermisos,
  cargarPermisos,
}) => {
  const handleCrearPermiso = async () => {
    if (!nuevoPermiso.trim()) {
      toast.error("El nombre del permiso es requerido");
      return;
    }

    try {
      const res = await CrearPermiso({ NOMBRE_ACCION: nuevoPermiso.trim() });
      if (res.success) {
        toast.success(res.message || "Permiso creado exitosamente");
        setNuevoPermiso("");
        cargarPermisos();
      } else {
        toast.error(res.message || "Error al crear el permiso");
      }
    } catch (error) {
      console.error("Error al crear permiso:", error);
      toast.error("Error al crear el permiso");
    }
  };

  const handleIniciarEdicionPermiso = (permiso) => {
    setPermisoEditando(permiso);
    setPermisoEditandoNombre(permiso.NOMBRE_ACCION || "");
  };

  const handleCancelarEdicionPermiso = () => {
    setPermisoEditando(null);
    setPermisoEditandoNombre("");
  };

  const handleActualizarPermiso = async () => {
    if (!permisoEditandoNombre.trim()) {
      toast.error("El nombre del permiso es requerido");
      return;
    }

    try {
      const res = await ActualizarPermiso({
        id: permisoEditando.ID_PERMISO,
        NOMBRE_ACCION: permisoEditandoNombre.trim(),
      });
      if (res.success) {
        toast.success(res.message || "Permiso actualizado exitosamente");
        handleCancelarEdicionPermiso();
        cargarPermisos();
      } else {
        toast.error(res.message || "Error al actualizar el permiso");
      }
    } catch (error) {
      console.error("Error al actualizar permiso:", error);
      toast.error("Error al actualizar el permiso");
    }
  };

  return (
    <CardUI
      title="Gestión de Permisos"
      description="Crear y actualizar permisos del sistema"
      initialOpen={false}
      headerActions={
        <ButtonUI
          iconLeft="FaArrowsRotate"
          onClick={cargarPermisos}
          disabled={cargandoPermisos}
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
          {/* Formulario para crear permiso */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1 }}>
              <InputUI
                placeholder="Nombre del permiso (ej: editar)"
                value={nuevoPermiso}
                onChange={setNuevoPermiso}
                disabled={cargandoPermisos}
              />
            </div>
            <ButtonUI
              text="Crear"
              onClick={handleCrearPermiso}
              pcolor={theme.colors.secondary}
              disabled={cargandoPermisos || !nuevoPermiso.trim()}
            />
          </div>

          {/* Lista de permisos */}
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              borderRadius: "6px",
            }}
          >
            {permisos.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: theme.colors.textSecondary,
                  fontSize: "13px",
                }}
              >
                {cargandoPermisos ? "Cargando..." : "No hay permisos"}
              </div>
            ) : (
              permisos.map((permiso) => (
                <div
                  key={permiso.ID_PERMISO}
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
                  {permisoEditando?.ID_PERMISO === permiso.ID_PERMISO ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flex: 1,
                        alignItems: "center",
                      }}
                    >
                      <InputUI
                        value={permisoEditandoNombre}
                        onChange={setPermisoEditandoNombre}
                        style={{ flex: 1 }}
                      />
                      <ButtonUI
                        iconLeft="FaCheck"
                        onClick={handleActualizarPermiso}
                        pcolor={theme.colors.secondary}
                        style={{ padding: "5px 10px" }}
                      />
                      <ButtonUI
                        iconLeft="FaXmark"
                        onClick={handleCancelarEdicionPermiso}
                        pcolor={theme.colors.error}
                        style={{ padding: "5px 10px" }}
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: "14px",
                          color: theme.colors.text,
                          fontWeight: "500",
                        }}
                      >
                        {permiso.NOMBRE_ACCION}
                      </span>
                      <ButtonUI
                        iconLeft="FaPenToSquare"
                        onClick={() => handleIniciarEdicionPermiso(permiso)}
                        pcolor={theme.colors.primary}
                        style={{ padding: "5px 10px" }}
                      />
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      }
      theme={theme}
    />
  );
};

