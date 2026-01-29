import React from "react";
import { toast } from "react-toastify";
import { CardUI } from "components/UI/Components/CardUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { hexToRGBA } from "utils/colors";
import { CrearRol, ActualizarRol } from "services/administracionService";

export const RolesSection = ({
  theme,
  roles,
  nuevoRol,
  setNuevoRol,
  rolEditando,
  setRolEditando,
  rolEditandoNombre,
  setRolEditandoNombre,
  cargandoRoles,
  setCargandoRoles,
  cargarRoles,
}) => {
  const handleCrearRol = async () => {
    if (!nuevoRol.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    try {
      const res = await CrearRol({ NOMBRE_ROL: nuevoRol.trim() });
      if (res.success) {
        toast.success(res.message || "Rol creado exitosamente");
        setNuevoRol("");
        cargarRoles();
      } else {
        toast.error(res.message || "Error al crear el rol");
      }
    } catch (error) {
      console.error("Error al crear rol:", error);
      toast.error("Error al crear el rol");
    }
  };

  const handleIniciarEdicionRol = (rol) => {
    setRolEditando(rol);
    setRolEditandoNombre(rol.NOMBRE_ROL || "");
  };

  const handleCancelarEdicionRol = () => {
    setRolEditando(null);
    setRolEditandoNombre("");
  };

  const handleActualizarRol = async () => {
    if (!rolEditandoNombre.trim()) {
      toast.error("El nombre del rol es requerido");
      return;
    }

    try {
      const res = await ActualizarRol({
        id: rolEditando.ID_ROL,
        NOMBRE_ROL: rolEditandoNombre.trim(),
      });
      if (res.success) {
        toast.success(res.message || "Rol actualizado exitosamente");
        handleCancelarEdicionRol();
        cargarRoles();
      } else {
        toast.error(res.message || "Error al actualizar el rol");
      }
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      toast.error("Error al actualizar el rol");
    }
  };

  return (
    <CardUI
      title="Gestión de Roles"
      description="Crear y actualizar roles del sistema"
      initialOpen={false}
      headerActions={
        <ButtonUI
          iconLeft="FaArrowsRotate"
          onClick={cargarRoles}
          disabled={cargandoRoles}
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
          {/* Formulario para crear rol */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <div style={{ flex: 1 }}>
              <InputUI
                placeholder="Nombre del rol"
                value={nuevoRol}
                onChange={setNuevoRol}
                disabled={cargandoRoles}
              />
            </div>
            <ButtonUI
              text="Crear"
              onClick={handleCrearRol}
              pcolor={theme.colors.secondary}
              disabled={cargandoRoles || !nuevoRol.trim()}
            />
          </div>

          {/* Lista de roles */}
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              borderRadius: "6px",
            }}
          >
            {roles.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: theme.colors.textSecondary,
                  fontSize: "13px",
                }}
              >
                {cargandoRoles ? "Cargando..." : "No hay roles"}
              </div>
            ) : (
              roles.map((rol) => (
                <div
                  key={rol.ID_ROL}
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
                  {rolEditando?.ID_ROL === rol.ID_ROL ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flex: 1,
                        alignItems: "center",
                      }}
                    >
                      <InputUI
                        value={rolEditandoNombre}
                        onChange={setRolEditandoNombre}
                        style={{ flex: 1 }}
                      />
                      <ButtonUI
                        iconLeft="FaCheck"
                        onClick={handleActualizarRol}
                        pcolor={theme.colors.secondary}
                        style={{ padding: "5px 10px" }}
                      />
                      <ButtonUI
                        iconLeft="FaXmark"
                        onClick={handleCancelarEdicionRol}
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
                        {rol.NOMBRE_ROL}
                      </span>
                      <ButtonUI
                        iconLeft="FaPenToSquare"
                        onClick={() => handleIniciarEdicionRol(rol)}
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

