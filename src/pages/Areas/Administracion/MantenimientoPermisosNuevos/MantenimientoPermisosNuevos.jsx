import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import {
  ListarPermisos,
  ListarRoles,
  ListarPermisosRol,
  ListarUsuariosRolContexto,
  ListarUsuariosSistema,
  ListarEmpresasAdmin,
} from "services/administracionService";
import { PermisosSection } from "./sections/PermisosSection";
import { RolesSection } from "./sections/RolesSection";
import { PermisosRolSection } from "./sections/PermisosRolSection";
import { UsuariosRolContextoSection } from "./sections/UsuariosRolContextoSection";

const TABS = {
  BASICO: "basico",
  ASIGNACIONES: "asignaciones",
};

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const TabsBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid ${({ theme }) => theme?.colors?.border || "#e0e0e0"};
  margin-bottom: 15px;
  flex-shrink: 0;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  background: transparent;
  color: ${({ theme, $active }) =>
    $active ? theme?.colors?.primary : theme?.colors?.textSecondary || "#666"};
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: ${({ theme }) => theme?.colors?.primary};
  }

  ${({ $active, theme }) =>
    $active &&
    `
    color: ${theme?.colors?.primary};
    border-bottom-color: ${theme?.colors?.primary};
  `}
`;

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0 0 10px 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
`;

export const MantenimientoPermisosNuevos = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(TABS.BASICO);

  // Estados para Permisos
  const [permisos, setPermisos] = useState([]);
  const [nuevoPermiso, setNuevoPermiso] = useState("");
  const [permisoEditando, setPermisoEditando] = useState(null);
  const [permisoEditandoNombre, setPermisoEditandoNombre] = useState("");
  const [cargandoPermisos, setCargandoPermisos] = useState(false);

  // Estados para Roles
  const [roles, setRoles] = useState([]);
  const [nuevoRol, setNuevoRol] = useState("");
  const [rolEditando, setRolEditando] = useState(null);
  const [rolEditandoNombre, setRolEditandoNombre] = useState("");
  const [cargandoRoles, setCargandoRoles] = useState(false);

  // Estados para Permisos-Rol
  const [permisosRol, setPermisosRol] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [cargandoPermisosRol, setCargandoPermisosRol] = useState(false);

  // Estados para Usuarios-Rol-Contexto
  const [usuariosRolContexto, setUsuariosRolContexto] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargandoUsuariosRolContexto, setCargandoUsuariosRolContexto] =
    useState(false);
  const [usuariosExpandidos, setUsuariosExpandidos] = useState(new Set());
  const [buscarUsuario, setBuscarUsuario] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [contextoEditando, setContextoEditando] = useState(null);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [contextoAEliminar, setContextoAEliminar] = useState(null);
  
  // Estados para el formulario de crear/editar usuario-rol-contexto
  const [usuarioSeleccionadoContexto, setUsuarioSeleccionadoContexto] =
    useState(null);
  const [rolSeleccionadoContexto, setRolSeleccionadoContexto] =
    useState(null);
  const [recurso, setRecurso] = useState(null);
  const [herencia, setHerencia] = useState(true);
  const [sobreEscribirPermisos, setSobreEscribirPermisos] = useState([]);
  const [alcanceEmpresas, setAlcanceEmpresas] = useState([]);
  const [alcanceLineas, setAlcanceLineas] = useState([]);
  const [alcanceCanales, setAlcanceCanales] = useState([]);
  const [bloqueado, setBloqueado] = useState("");

  // Cargar datos al montar
  useEffect(() => {
    cargarPermisos();
    cargarRoles();
    cargarPermisosRol();
    cargarUsuariosRolContexto();
    cargarUsuarios();
    cargarEmpresas();
  }, []);

  // Cargar permisos cuando cambien los roles o permisos
  useEffect(() => {
    if (roles.length > 0 && permisos.length > 0) {
      cargarPermisosRol();
    }
  }, [roles, permisos]);

  // ==================== PERMISOS ====================

  const cargarPermisos = async () => {
    setCargandoPermisos(true);
    try {
      const res = await ListarPermisos();
      if (res.success) {
        setPermisos(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
    } finally {
      setCargandoPermisos(false);
    }
  };

  // ==================== ROLES ====================

  const cargarRoles = async () => {
    setCargandoRoles(true);
    try {
      const res = await ListarRoles();
      if (res.success) {
        setRoles(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
    } finally {
      setCargandoRoles(false);
    }
  };

  // ==================== PERMISOS-ROL ====================

  const cargarPermisosRol = async () => {
    setCargandoPermisosRol(true);
    try {
      const res = await ListarPermisosRol();
      if (res.success) {
        setPermisosRol(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar permisos-rol:", error);
    } finally {
      setCargandoPermisosRol(false);
    }
  };

  // ==================== USUARIOS-ROL-CONTEXTO ====================

  const cargarUsuariosRolContexto = async () => {
    setCargandoUsuariosRolContexto(true);
    try {
      const res = await ListarUsuariosRolContexto();
      if (res.success) {
        setUsuariosRolContexto(res.data || []);
      }
    } catch (error) {
      console.error("Error al cargar usuarios-rol-contexto:", error);
    } finally {
      setCargandoUsuariosRolContexto(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const usuariosData = await ListarUsuariosSistema();
      setUsuarios(usuariosData || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const cargarEmpresas = async () => {
    try {
      const empresasData = await ListarEmpresasAdmin();
      setEmpresas(empresasData || []);
    } catch (error) {
      console.error("Error al cargar empresas:", error);
    }
  };

  return (
    <TabsContainer>
      <TabsBar>
        <TabButton
          type="button"
          $active={activeTab === TABS.BASICO}
          onClick={() => setActiveTab(TABS.BASICO)}
        >
          Creación y asignaciones básicas
        </TabButton>
        <TabButton
          type="button"
          $active={activeTab === TABS.ASIGNACIONES}
          onClick={() => setActiveTab(TABS.ASIGNACIONES)}
        >
          Asignaciones importantes
        </TabButton>
      </TabsBar>

      <TabContent>
        {activeTab === TABS.BASICO && (
          <>
            <PermisosSection
              theme={theme}
              permisos={permisos}
              nuevoPermiso={nuevoPermiso}
              setNuevoPermiso={setNuevoPermiso}
              permisoEditando={permisoEditando}
              setPermisoEditando={setPermisoEditando}
              permisoEditandoNombre={permisoEditandoNombre}
              setPermisoEditandoNombre={setPermisoEditandoNombre}
              cargandoPermisos={cargandoPermisos}
              setCargandoPermisos={setCargandoPermisos}
              cargarPermisos={cargarPermisos}
            />

            <RolesSection
              theme={theme}
              roles={roles}
              nuevoRol={nuevoRol}
              setNuevoRol={setNuevoRol}
              rolEditando={rolEditando}
              setRolEditando={setRolEditando}
              rolEditandoNombre={rolEditandoNombre}
              setRolEditandoNombre={setRolEditandoNombre}
              cargandoRoles={cargandoRoles}
              setCargandoRoles={setCargandoRoles}
              cargarRoles={cargarRoles}
            />

            <PermisosRolSection
              theme={theme}
              permisosRol={permisosRol}
              roles={roles}
              permisos={permisos}
              rolSeleccionado={rolSeleccionado}
              setRolSeleccionado={setRolSeleccionado}
              permisoSeleccionado={permisoSeleccionado}
              setPermisoSeleccionado={setPermisoSeleccionado}
              cargandoPermisosRol={cargandoPermisosRol}
              setCargandoPermisosRol={setCargandoPermisosRol}
              cargarPermisosRol={cargarPermisosRol}
            />
          </>
        )}

        {activeTab === TABS.ASIGNACIONES && (
          <UsuariosRolContextoSection
            theme={theme}
            usuariosRolContexto={usuariosRolContexto}
            usuarios={usuarios}
            roles={roles}
            permisos={permisos}
            empresas={empresas}
            cargandoUsuariosRolContexto={cargandoUsuariosRolContexto}
            cargarUsuariosRolContexto={cargarUsuariosRolContexto}
            usuariosExpandidos={usuariosExpandidos}
            setUsuariosExpandidos={setUsuariosExpandidos}
            buscarUsuario={buscarUsuario}
            setBuscarUsuario={setBuscarUsuario}
            mostrarFormulario={mostrarFormulario}
            setMostrarFormulario={setMostrarFormulario}
            contextoEditando={contextoEditando}
            setContextoEditando={setContextoEditando}
            mostrarModalEliminar={mostrarModalEliminar}
            setMostrarModalEliminar={setMostrarModalEliminar}
            contextoAEliminar={contextoAEliminar}
            setContextoAEliminar={setContextoAEliminar}
            usuarioSeleccionadoContexto={usuarioSeleccionadoContexto}
            setUsuarioSeleccionadoContexto={setUsuarioSeleccionadoContexto}
            rolSeleccionadoContexto={rolSeleccionadoContexto}
            setRolSeleccionadoContexto={setRolSeleccionadoContexto}
            recurso={recurso}
            setRecurso={setRecurso}
            herencia={herencia}
            setHerencia={setHerencia}
            sobreEscribirPermisos={sobreEscribirPermisos}
            setSobreEscribirPermisos={setSobreEscribirPermisos}
            alcanceEmpresas={alcanceEmpresas}
            setAlcanceEmpresas={setAlcanceEmpresas}
            alcanceLineas={alcanceLineas}
            setAlcanceLineas={setAlcanceLineas}
            alcanceCanales={alcanceCanales}
            setAlcanceCanales={setAlcanceCanales}
            bloqueado={bloqueado}
            setBloqueado={setBloqueado}
          />
        )}
      </TabContent>
    </TabsContainer>
  );
};
