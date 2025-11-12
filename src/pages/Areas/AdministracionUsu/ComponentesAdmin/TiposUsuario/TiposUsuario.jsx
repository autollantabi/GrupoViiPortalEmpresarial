import React, { useEffect, useState } from "react";
import {
  userService_obtenerTodosLosTiposUsuario,
  userService_crearNuevoTipoUsuario,
  userService_actualizarTipoUsuario,
  userService_eliminarTipoUsuario,
  userService_asignarTipoUsuario,
  userService_obtenerTodasLasRelacionesUsuarioTipoUsuario,
  ListarUsuarios,
  userService_eliminarRelacionUsuarioTipoUsuario,
} from "services/usuariosService";

import { toast } from "react-toastify";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomCard } from "components/UI/CustomComponents/CustomCard";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { ConfirmationDialog } from "components/common/FormComponents";
import CustomIcon from "components/UI/CustomComponents/CustomIcons";

export const TiposUsuario = () => {
  const { theme } = useTheme();

  // Estados principales
  const [tiposUsuario, setTiposUsuario] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [relacionesUsuarioTipo, setRelacionesUsuarioTipo] = useState([]);
  const [nombreTipoUsuario, setNombreTipoUsuario] = useState("");
  const [tipoUsuarioSeleccionado, setTipoUsuarioSeleccionado] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estados para diálogos de confirmación
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] =
    useState(false);
  const [mostrarConfirmacionAsignar, setMostrarConfirmacionAsignar] =
    useState(false);
  const [tipoAEliminar, setTipoAEliminar] = useState(null);

  // Estados para operaciones
  const [operacionExitosa, setOperacionExitosa] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      // Cargar tipos de usuario
      const responseTipos = await userService_obtenerTodosLosTiposUsuario();
      if (responseTipos.success) {
        setTiposUsuario(responseTipos.data);
      }

      // Cargar usuarios
      const responseUsuarios = await ListarUsuarios();
      if (responseUsuarios.status === 200) {
        setUsuarios(responseUsuarios.data);
      }

      // Cargar relaciones usuario-tipo
      const responseRelaciones =
        await userService_obtenerTodasLasRelacionesUsuarioTipoUsuario();
      if (responseRelaciones.success) {
        setRelacionesUsuarioTipo(responseRelaciones.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setNombreTipoUsuario("");
    setTipoUsuarioSeleccionado(null);
    setModoEdicion(false);
  };

  // Crear nuevo tipo de usuario
  const handleCrearTipoUsuario = async () => {
    if (!nombreTipoUsuario.trim()) {
      toast.error("El nombre del tipo de usuario es requerido");
      return;
    }

    setCargando(true);
    try {
      const response = await userService_crearNuevoTipoUsuario(
        nombreTipoUsuario.trim()
      );
      if (response.success) {
        toast.success(response.message);
        limpiarFormulario();
        cargarDatos();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error al crear tipo de usuario:", error);
      toast.error("Error al crear el tipo de usuario");
    } finally {
      setCargando(false);
    }
  };

  // Editar tipo de usuario
  const handleEditarTipoUsuario = (tipo) => {
    setTipoUsuarioSeleccionado(tipo);
    setNombreTipoUsuario(tipo.TIPO_USUARIO);
    setModoEdicion(true);
  };

  // Actualizar tipo de usuario
  const handleActualizarTipoUsuario = async () => {
    if (!nombreTipoUsuario.trim()) {
      toast.error("El nombre del tipo de usuario es requerido");
      return;
    }

    setCargando(true);
    try {
      const response = await userService_actualizarTipoUsuario(
        tipoUsuarioSeleccionado.TIPO_USUARIO_ID,
        nombreTipoUsuario.trim()
      );
      if (response.success) {
        toast.success(response.message);
        limpiarFormulario();
        cargarDatos();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error al actualizar tipo de usuario:", error);
      toast.error("Error al actualizar el tipo de usuario");
    } finally {
      setCargando(false);
    }
  };

  // Confirmar eliminación
  const confirmarEliminacion = (tipo) => {
    setTipoAEliminar(tipo);
    setMostrarConfirmacionEliminar(true);
  };

  // Eliminar tipo de usuario
  const handleEliminarTipoUsuario = async () => {
    if (!tipoAEliminar) return;

    setCargando(true);
    try {
      const response = await userService_eliminarTipoUsuario(
        tipoAEliminar.TIPO_USUARIO_ID
      );
      if (response.success) {
        toast.success(response.message);
        setOperacionExitosa(1);
        cargarDatos();
      } else {
        toast.error(response.message);
        setOperacionExitosa(2);
      }
    } catch (error) {
      console.error("Error al eliminar tipo de usuario:", error);
      toast.error("Error al eliminar el tipo de usuario");
      setOperacionExitosa(2);
    } finally {
      setCargando(false);
    }
  };

  // Confirmar asignación de tipo
  const confirmarAsignacion = () => {
    if (!usuarioSeleccionado || !tipoUsuarioSeleccionado) {
      toast.error("Debe seleccionar un usuario y un tipo de usuario");
      return;
    }
    setMostrarConfirmacionAsignar(true);
  };

  // Asignar tipo a usuario
  const handleAsignarTipoUsuario = async () => {
    if (!usuarioSeleccionado || !tipoUsuarioSeleccionado) {
      toast.error("Debe seleccionar un usuario y un tipo de usuario");
      return;
    }
    console.log(usuarioSeleccionado, tipoUsuarioSeleccionado);

    setCargando(true);
    try {
      const response = await userService_asignarTipoUsuario(
        usuarioSeleccionado.IDENTIFICADOR,
        tipoUsuarioSeleccionado.TIPO_USUARIO_ID
      );

      if (response.success) {
        toast.success(response.message);
        setOperacionExitosa(1);
        setUsuarioSeleccionado(null);
        setTipoUsuarioSeleccionado(null);
      } else {
        toast.error(response.message);
        setOperacionExitosa(2);
      }
    } catch (error) {
      console.error("Error al asignar tipo de usuario:", error);
      toast.error("Error al asignar el tipo de usuario");
      setOperacionExitosa(2);
    } finally {
      setCargando(false);
    }
  };

  // Cancelar operación
  const handleCancelar = () => {
    limpiarFormulario();
  };

  const handleEliminarRelacionUsuarioTipoUsuario = async (id) => {
    const response = await userService_eliminarRelacionUsuarioTipoUsuario(id);
    if (response.success) {
      toast.success(response.message);
      cargarDatos();
    } else {
      toast.error(response.message);
    }
  };

  return (
    <>
      <CustomContainer
        width="100%"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "15px",
          padding: "10px",
        }}
      >
        {/* Primera fila: Cards principales */}
        <div style={{ gridColumn: "1 / 2" }}>
          <CustomCard
            title={
              modoEdicion
                ? "Editar Tipo de Usuario"
                : "Crear Nuevo Tipo de Usuario"
            }
            description={
              modoEdicion
                ? "Modifica la información del tipo de usuario"
                : "Agrega un nuevo tipo de usuario al sistema"
            }
            body={
              <CustomInput
                placeholder="Nombre del Tipo de Usuario"
                value={nombreTipoUsuario}
                onChange={(value) => setNombreTipoUsuario(value.toUpperCase())}
                disabled={cargando}
              />
            }
            footer={
              <div
                style={{ display: "flex", flexDirection: "row", gap: "8px" }}
              >
                {modoEdicion && (
                  <CustomButton
                    onClick={handleCancelar}
                    text="Cancelar"
                    disabled={cargando}
                    width="100%"
                    height="35px"
                  />
                )}
                <CustomButton
                  onClick={
                    modoEdicion
                      ? handleActualizarTipoUsuario
                      : handleCrearTipoUsuario
                  }
                  text={modoEdicion ? "Actualizar" : "Crear"}
                  pcolor={theme.colors.secondary}
                  disabled={!nombreTipoUsuario.trim()}
                />
              </div>
            }
            theme={theme}
          />
        </div>

        <div style={{ gridColumn: "2 / 3" }}>
          <CustomCard
            title="Tipos de Usuario Existentes"
            description="Gestiona los tipos de usuario del sistema"
            body={
              cargando ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    fontSize: "14px",
                    color: theme.colors.textSecondary,
                  }}
                >
                  Cargando...
                </div>
              ) : tiposUsuario.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: theme.colors.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  No hay tipos de usuario registrados
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    overflowY: "auto",
                  }}
                >
                  {tiposUsuario.map((tipo, index) => (
                    <div
                      key={tipo.TIPO_USUARIO_ID}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        backgroundColor: hexToRGBA({
                          hex: theme.colors.primary,
                          alpha: 0.1,
                        }),
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "500",
                          color: theme.colors.text,
                          fontSize: "13px",
                          flex: 1,
                        }}
                      >
                        {tipo.TIPO_USUARIO}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <CustomButton
                          iconLeft="FaEdit"
                          onClick={() => handleEditarTipoUsuario(tipo)}
                          disabled={cargando}
                          title="Editar tipo de usuario"
                        />

                        <CustomButton
                          iconLeft="FaTrash"
                          onClick={() => confirmarEliminacion(tipo)}
                          disabled={cargando}
                          pcolor={theme.colors.error}
                          title="Eliminar tipo de usuario"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
            footer={
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <CustomButton
                  onClick={cargarDatos}
                  text="Actualizar"
                  disabled={cargando}
                />
              </div>
            }
            minHeight="200px"
            theme={theme}
          />
        </div>

        {/* Primera fila: Asignar tipo */}
        <div style={{ gridColumn: "3 / 4" }}>
          <CustomCard
            title="Asignar Tipo de Usuario"
            description="Asigna un tipo de usuario específico a un usuario"
            body={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <CustomSelect
                  options={usuarios.map((usuario) => ({
                    value: usuario.IDENTIFICADOR,
                    label: `${usuario.CORREO} - ${
                      usuario?.NOMBRE || "Sin nombre"
                    }`,
                  }))}
                  value={
                    usuarioSeleccionado
                      ? {
                          value: usuarioSeleccionado.IDENTIFICADOR,
                          label: `${usuarioSeleccionado.CORREO} - ${usuarioSeleccionado.NOMBRE}`,
                        }
                      : null
                  }
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      const usuario = usuarios.find(
                        (u) => u.IDENTIFICADOR === selectedOption.value
                      );
                      setUsuarioSeleccionado(usuario);
                    } else {
                      setUsuarioSeleccionado(null);
                    }
                  }}
                  placeholder="Seleccionar usuario..."
                  isDisabled={cargando}
                  menuMaxWidth="100%"
                  menuMaxHeight="400px"
                  maxWidth="100%"
                  minWidth="100%"
                />
                <CustomSelect
                  options={tiposUsuario.map((tipo) => ({
                    value: tipo.TIPO_USUARIO_ID,
                    label: tipo.TIPO_USUARIO,
                  }))}
                  value={
                    tipoUsuarioSeleccionado
                      ? {
                          value: tipoUsuarioSeleccionado.TIPO_USUARIO_ID,
                          label: tipoUsuarioSeleccionado.TIPO_USUARIO,
                        }
                      : null
                  }
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      const tipo = tiposUsuario.find(
                        (t) => t.TIPO_USUARIO_ID === selectedOption.value
                      );
                      setTipoUsuarioSeleccionado(tipo);
                    } else {
                      setTipoUsuarioSeleccionado(null);
                    }
                  }}
                  placeholder="Seleccionar tipo..."
                  isDisabled={cargando}
                  menuMaxWidth="100%"
                  menuMaxHeight="400px"
                  maxWidth="100%"
                  minWidth="100%"
                />
              </div>
            }
            footer={
              <div
                style={{ display: "flex", flexDirection: "row", gap: "8px" }}
              >
                {(usuarioSeleccionado || tipoUsuarioSeleccionado) && (
                  <CustomButton
                    onClick={() => {
                      setUsuarioSeleccionado(null);
                      setTipoUsuarioSeleccionado(null);
                    }}
                    text="Limpiar"
                    pcolor={theme.colors.textSecondary}
                    disabled={cargando}
                    width="fit-content"
                  />
                )}
                <CustomButton
                  onClick={confirmarAsignacion}
                  text="Asignar"
                  pcolor={theme.colors.success}
                  disabled={
                    cargando || !usuarioSeleccionado || !tipoUsuarioSeleccionado
                  }
                />
              </div>
            }
            theme={theme}
          />
        </div>

        {/* Segunda fila: Relaciones existentes */}
        <div style={{ gridColumn: "1 / 3" }}>
          <CustomCard
            title="Relaciones Existentes"
            description="Usuarios con tipos asignados"
            body={
              cargando ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    fontSize: "14px",
                    color: theme.colors.textSecondary,
                  }}
                >
                  Cargando...
                </div>
              ) : relacionesUsuarioTipo.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: theme.colors.textSecondary,
                    fontSize: "14px",
                  }}
                >
                  No hay relaciones asignadas
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    overflowY: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {(() => {
                    // Agrupar relaciones por usuario
                    const relacionesAgrupadas = relacionesUsuarioTipo.reduce(
                      (acc, relacion) => {
                        const usuarioId = relacion.usuario?.usua_id;
                        if (!acc[usuarioId]) {
                          acc[usuarioId] = {
                            usuario: relacion.usuario,
                            tipos: [],
                          };
                        }
                        acc[usuarioId].tipos.push(relacion.tipoUsuario);
                        return acc;
                      },
                      {}
                    );

                    return Object.values(relacionesAgrupadas).map(
                      (grupo, index) => (
                        <div
                          key={grupo.usuario?.usua_id || index}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "12px",
                            borderRadius: "6px",
                            backgroundColor: hexToRGBA({
                              hex: theme.colors.primary,
                              alpha: 0.05,
                            }),
                            border: `1px solid ${hexToRGBA({
                              hex: theme.colors.primary,
                              alpha: 0.1,
                            })}`,
                            gap: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "600",
                                color: theme.colors.text,
                                fontSize: "14px",
                              }}
                            >
                              {grupo.usuario?.usua_nombre || "Sin nombre"}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              {grupo.tipos.map((tipo, tipoIndex) => (
                                <span
                                  key={tipoIndex}
                                  style={{
                                    color: theme.colors.textSecondary,
                                    backgroundColor: hexToRGBA({
                                      hex: theme.colors.primary,
                                      alpha: 0.15,
                                    }),
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "3px 8px",
                                    borderRadius: "12px",
                                    border: `1px solid ${hexToRGBA({
                                      hex: theme.colors.primary,
                                      alpha: 0.2,
                                    })}`,
                                  }}
                                >
                                  <CustomIcon
                                    name="FaTrash"
                                    size={12}
                                    style={{ cursor: "pointer" }}
                                    onClick={async () =>
                                      await handleEliminarRelacionUsuarioTipoUsuario(
                                        tipo.TIPO_USUARIO_ID
                                      )
                                    }
                                  />
                                  <span style={{ fontSize: "11px" }}>
                                    {tipo?.TIPO_USUARIO || "Sin tipo"}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: theme.colors.textSecondary,
                            }}
                          >
                            {grupo.usuario?.usua_correo || "Sin correo"}
                          </span>
                        </div>
                      )
                    );
                  })()}
                </div>
              )
            }
            footer={
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Total: {relacionesUsuarioTipo.length} relaciones
                </span>
                <CustomButton
                  onClick={cargarDatos}
                  text="Actualizar"
                  disabled={cargando}
                />
              </div>
            }
            theme={theme}
          />
        </div>
      </CustomContainer>

      {/* Diálogos de confirmación */}
      {/* Diálogo de confirmación para eliminación */}
      <ConfirmationDialog
        isOpen={mostrarConfirmacionEliminar}
        onClose={() => setMostrarConfirmacionEliminar(false)}
        onConfirm={handleEliminarTipoUsuario}
        title="¿Confirmar eliminación?"
        successState={operacionExitosa}
        onSuccess={() => {
          setMostrarConfirmacionEliminar(false);
          setOperacionExitosa(0);
          setTipoAEliminar(null);
        }}
        successMessage="Tipo de usuario eliminado exitosamente"
        errorMessage="Error al eliminar el tipo de usuario"
      >
        <p>
          ¿Está seguro de que desea eliminar el tipo de usuario{" "}
          <strong>{tipoAEliminar?.TIPO_USUARIO}</strong>?
        </p>
        <p style={{ color: theme.colors.error, fontSize: "14px" }}>
          Esta acción no se puede deshacer.
        </p>
      </ConfirmationDialog>

      {/* Diálogo de confirmación para asignación */}
      <ConfirmationDialog
        isOpen={mostrarConfirmacionAsignar}
        onClose={() => setMostrarConfirmacionAsignar(false)}
        onConfirm={handleAsignarTipoUsuario}
        title="¿Confirmar asignación?"
        successState={operacionExitosa}
        onSuccess={() => {
          setMostrarConfirmacionAsignar(false);
          setOperacionExitosa(0);
          setUsuarioSeleccionado(null);
          setTipoUsuarioSeleccionado(null);
        }}
        successMessage="Tipo asignado exitosamente"
        errorMessage="Error al asignar el tipo"
      >
        <p>
          ¿Está seguro de que desea asignar el tipo{" "}
          <strong>{tipoUsuarioSeleccionado?.TIPO_USUARIO}</strong> al usuario{" "}
          <strong>{usuarioSeleccionado?.NOMBRE_USUARIO}</strong>?
        </p>
      </ConfirmationDialog>
    </>
  );
};
