import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CardUI } from "components/UI/Components/CardUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
import IconUI from "components/UI/Components/IconsUI";
import { ModalConfirmacionUI } from "components/UI/Components/ModalConfirmacionUI";
import { hexToRGBA } from "utils/colors";
import { useAuthContext } from "context/authContext";
import {
  CrearUsuarioRolContexto,
  ActualizarUsuarioRolContexto,
  EliminarUsuarioRolContexto,
} from "services/administracionService";

export const UsuariosRolContextoSection = ({
  theme,
  usuariosRolContexto,
  usuarios,
  roles,
  permisos,
  empresas: empresasProp, // Mantener el prop por compatibilidad pero no usarlo
  cargandoUsuariosRolContexto,
  cargarUsuariosRolContexto,
  usuariosExpandidos,
  setUsuariosExpandidos,
  buscarUsuario,
  setBuscarUsuario,
  mostrarFormulario,
  setMostrarFormulario,
  contextoEditando,
  setContextoEditando,
  mostrarModalEliminar,
  setMostrarModalEliminar,
  contextoAEliminar,
  setContextoAEliminar,
  // Estados del formulario
  usuarioSeleccionadoContexto,
  setUsuarioSeleccionadoContexto,
  rolSeleccionadoContexto,
  setRolSeleccionadoContexto,
  recurso,
  setRecurso,
  herencia,
  setHerencia,
  sobreEscribirPermisos,
  setSobreEscribirPermisos,
  alcanceEmpresas,
  setAlcanceEmpresas,
  alcanceLineas,
  setAlcanceLineas,
  alcanceCanales,
  setAlcanceCanales,
  bloqueado,
  setBloqueado,
}) => {
  const { user } = useAuthContext();
  const [buscarPermiso, setBuscarPermiso] = useState("");

  // Opciones fijas para Canal (Alcance): Todos, B2B, B2C
  const opcionesCanales = [
    { value: "TODOS", label: "Todos" },
    { value: "B2B", label: "B2B" },
    { value: "B2C", label: "B2C" },
  ];

  // Mapeo de nombres de empresas a abreviaturas
  const obtenerAbreviaturaEmpresa = (nombre) => {
    const mapeo = {
      "AUTOLLANTA": "AUT",
      "MAXXIMUNDO": "MAX",
      "STOX": "STX",
      "IKONIX": "IKO",
      "AUTOMAX": "ATX",
      "GRUPOVII": "VII",
    };
    return mapeo[nombre?.toUpperCase()] || nombre?.substring(0, 3).toUpperCase() || "";
  };

  // Mapeo de nombres de líneas a abreviaturas
  const obtenerAbreviaturaLinea = (nombre) => {
    const mapeo = {
      "LLANTAS": "LLA",
      "LLANTAS MOTO": "LMO",
      "HERRAMIENTAS": "HER",
      "LUBRICANTES": "LUB",
      "ILUMINACION": "ILU",
      "ILUMINACIÓN": "ILU",
    };
    return mapeo[nombre?.toUpperCase()] || nombre?.substring(0, 3).toUpperCase() || "";
  };

  // Obtener empresas del usuario (formato: { "1": "AUTOLLANTA", "2": "MAXXIMUNDO", ... })
  const empresas = useMemo(() => {
    if (!user?.EMPRESAS) return [];

    // Si es un objeto, convertirlo a array
    if (typeof user.EMPRESAS === 'object' && !Array.isArray(user.EMPRESAS)) {
      return Object.entries(user.EMPRESAS).map(([id, nombre]) => ({
        ID: parseInt(id),
        NOMBRE: nombre,
      }));
    }

    // Si ya es un array, usarlo directamente
    return Array.isArray(user.EMPRESAS) ? user.EMPRESAS : [];
  }, [user?.EMPRESAS]);

  // Obtener líneas del usuario (formato: { "3": "LLANTAS", "4": "LUBRICANTES", ... })
  const lineasNegocio = useMemo(() => {
    if (!user?.LINEAS) return [];

    // Si es un objeto, convertirlo a array con formato { value, label }
    if (typeof user.LINEAS === 'object' && !Array.isArray(user.LINEAS)) {
      return Object.entries(user.LINEAS).map(([id, nombre]) => ({
        value: parseInt(id),
        label: nombre,
      }));
    }

    // Si ya es un array, convertirlo al formato esperado
    if (Array.isArray(user.LINEAS)) {
      return user.LINEAS.map((linea) => ({
        value: linea.ID || linea.id || linea.value,
        label: linea.NOMBRE || linea.nombre || linea.label,
      }));
    }

    return [];
  }, [user?.LINEAS]);
  const handleCrearUsuarioRolContexto = async () => {
    const recursoValue = recurso?.value || recurso || "";
    if (!usuarioSeleccionadoContexto || !rolSeleccionadoContexto || !recursoValue.trim()) {
      toast.error("Debe completar usuario, rol y recurso");
      return;
    }

    try {
      const data = {
        ID_USUARIO: usuarioSeleccionadoContexto.value,
        ID_ROL: rolSeleccionadoContexto.value,
        RECURSO: recursoValue.trim(),
        HERENCIA: herencia,
        SOBRE_ESCRIBIR_PERMISOS:
          sobreEscribirPermisos.length > 0 ? sobreEscribirPermisos.map((p) => p.value) : null,
        ALCANCE: {
          EMPRESAS: alcanceEmpresas.map((e) => e.value),
          LINEAS: alcanceLineas.map((l) => l.value),
          CANALES: alcanceCanales.map((c) => c.value),
        },
        BLOQUEADO:
          bloqueado.trim() !== ""
            ? bloqueado
              .split(",")
              .map((b) => b.trim())
              .filter(Boolean)
            : null,
      };

      const res = await CrearUsuarioRolContexto(data);
      if (res.success) {
        toast.success(res.message || "Usuario-rol-contexto creado exitosamente");
        handleCerrarFormulario();
        cargarUsuariosRolContexto();
      } else {
        toast.error(res.message || "Error al crear el usuario-rol-contexto");
      }
    } catch (error) {
      console.error("Error al crear usuario-rol-contexto:", error);
      toast.error("Error al crear el usuario-rol-contexto");
    }
  };

  const handleActualizarUsuarioRolContexto = async () => {
    if (!contextoEditando) return;

    const recursoValue = recurso?.value || recurso || "";
    if (!usuarioSeleccionadoContexto || !rolSeleccionadoContexto || !recursoValue.trim()) {
      toast.error("Debe completar usuario, rol y recurso");
      return;
    }

    try {
      const data = {
        ID_USUARIO: usuarioSeleccionadoContexto.value,
        ID_ROL: rolSeleccionadoContexto.value,
        RECURSO: recursoValue.trim(),
        HERENCIA: herencia,
        SOBRE_ESCRIBIR_PERMISOS:
          sobreEscribirPermisos.length > 0 ? sobreEscribirPermisos.map((p) => p.value) : null,
        ALCANCE: {
          EMPRESAS: alcanceEmpresas.map((e) => e.value),
          LINEAS: alcanceLineas.map((l) => l.value),
          CANALES: alcanceCanales.map((c) => c.value),
        },
        BLOQUEADO:
          bloqueado.trim() !== ""
            ? bloqueado
              .split(",")
              .map((b) => b.trim())
              .filter(Boolean)
            : null,
      };

      const res = await ActualizarUsuarioRolContexto({
        id: contextoEditando.ID_USUARIO_ROL_CONTEXTO,
        ...data,
      });
      if (res.success) {
        toast.success(res.message || "Usuario-rol-contexto actualizado exitosamente");
        handleCerrarFormulario();
        cargarUsuariosRolContexto();
      } else {
        toast.error(res.message || "Error al actualizar el usuario-rol-contexto");
      }
    } catch (error) {
      console.error("Error al actualizar usuario-rol-contexto:", error);
      toast.error("Error al actualizar el usuario-rol-contexto");
    }
  };

  const handleAbrirModalEliminar = (id) => {
    setContextoAEliminar(id);
    setMostrarModalEliminar(true);
  };

  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setContextoAEliminar(null);
  };

  const handleEliminarUsuarioRolContexto = async () => {
    if (!contextoAEliminar) return;

    try {
      const res = await EliminarUsuarioRolContexto({ id: contextoAEliminar });
      if (res.success) {
        toast.success(res.message || "Usuario-rol-contexto eliminado exitosamente");
        cargarUsuariosRolContexto();
        handleCerrarModalEliminar();
      } else {
        toast.error(res.message || "Error al eliminar el usuario-rol-contexto");
      }
    } catch (error) {
      console.error("Error al eliminar usuario-rol-contexto:", error);
      toast.error("Error al eliminar el usuario-rol-contexto");
    }
  };

  // Agrupar usuarios-rol-contexto por usuario con filtro de búsqueda
  const agruparPorUsuario = () => {
    const agrupados = {};
    usuariosRolContexto.forEach((item) => {
      const idUsuario = item.ID_USUARIO || item.USUARIO?.USUA_ID;
      if (!agrupados[idUsuario]) {
        agrupados[idUsuario] = {
          usuario: item.USUARIO,
          contextos: [],
        };
      }
      agrupados[idUsuario].contextos.push(item);
    });

    let grupos = Object.values(agrupados);

    // Filtrar por búsqueda de permisos primero (si hay búsqueda de permisos)
    if (buscarPermiso.trim()) {
      grupos = grupos.map((grupo) => {
        const contextosFiltrados = filtrarContextos(grupo.contextos);
        return {
          ...grupo,
          contextos: contextosFiltrados,
        };
      }).filter((grupo) => grupo.contextos.length > 0); // Solo mantener usuarios con al menos un permiso que coincida
    }

    // Filtrar por búsqueda de usuario
    if (buscarUsuario.trim()) {
      const busqueda = buscarUsuario.toLowerCase().trim();
      grupos = grupos.filter((grupo) => {
        const nombre = (grupo.usuario?.USUA_NOMBRE || "").toLowerCase();
        const correo = (grupo.usuario?.USUA_CORREO || "").toLowerCase();
        return nombre.includes(busqueda) || correo.includes(busqueda);
      });
    }

    return grupos;
  };

  // Toggle expandir/contraer usuario
  const toggleExpandirUsuario = (idUsuario) => {
    const nuevosExpandidos = new Set(usuariosExpandidos);
    if (nuevosExpandidos.has(idUsuario)) {
      nuevosExpandidos.delete(idUsuario);
    } else {
      nuevosExpandidos.add(idUsuario);
    }
    setUsuariosExpandidos(nuevosExpandidos);
  };

  // Prellenar formulario con usuario seleccionado y mostrar formulario
  const handleAgregarPermisoUsuario = (usuario) => {
    if (!usuario) {
      toast.error("Error: Usuario no proporcionado");
      return;
    }

    const idUsuario = usuario.USUA_ID || usuario.IDENTIFICADOR || usuario.ID || usuario.id;

    if (!idUsuario) {
      toast.error("Error: No se pudo obtener el ID del usuario");
      return;
    }

    const usuarioEncontrado = usuarios.find(
      (u) => (u.USUA_ID || u.IDENTIFICADOR || u.ID) === idUsuario
    );

    const usuarioFinal = usuarioEncontrado || usuario;

    const usuarioEnOpciones = {
      value: usuarioFinal.IDENTIFICADOR || usuarioFinal.USUA_ID || usuarioFinal.ID || idUsuario,
      label: `${usuarioFinal.USUA_NOMBRE || usuarioFinal.NOMBRE || "Usuario"} (${usuarioFinal.USUA_CORREO || usuarioFinal.CORREO || ""})`,
    };

    setUsuarioSeleccionadoContexto(usuarioEnOpciones);
    setMostrarFormulario(true);

    toast.success(`Usuario ${usuarioFinal.USUA_NOMBRE || usuarioFinal.NOMBRE || "Usuario"} seleccionado`);

    setTimeout(() => {
      const formulario = document.querySelector('[data-formulario-contexto]');
      if (formulario) {
        formulario.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Función para abrir el formulario
  const handleAbrirFormulario = () => {
    setMostrarFormulario(true);
    setTimeout(() => {
      const formulario = document.querySelector('[data-formulario-contexto]');
      if (formulario) {
        formulario.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Función para iniciar edición de contexto
  const handleIniciarEdicionContexto = (contexto) => {
    setContextoEditando(contexto);

    const usuarioEncontrado = usuarios.find(
      (u) => (u.USUA_ID || u.IDENTIFICADOR) === contexto.ID_USUARIO
    );
    if (usuarioEncontrado) {
      setUsuarioSeleccionadoContexto({
        value: usuarioEncontrado.IDENTIFICADOR || usuarioEncontrado.USUA_ID,
        label: `${usuarioEncontrado.USUA_NOMBRE || usuarioEncontrado.NOMBRE} (${usuarioEncontrado.USUA_CORREO || usuarioEncontrado.CORREO})`,
      });
    }

    const rolEncontrado = roles.find((r) => r.ID_ROL === contexto.ID_ROL);
    if (rolEncontrado) {
      setRolSeleccionadoContexto({
        value: rolEncontrado.ID_ROL,
        label: rolEncontrado.NOMBRE_ROL,
      });
    }

    if (contexto.RECURSO) {
      setRecurso({
        value: contexto.RECURSO,
        label: contexto.RECURSO,
      });
    }

    setHerencia(contexto.HERENCIA || false);

    if (contexto.SOBRE_ESCRIBIR_PERMISOS && contexto.SOBRE_ESCRIBIR_PERMISOS !== "null") {
      const permisosIds = Array.isArray(contexto.SOBRE_ESCRIBIR_PERMISOS)
        ? contexto.SOBRE_ESCRIBIR_PERMISOS
        : [];
      const permisosSeleccionados = permisosIds
        .map((id) => permisos.find((p) => p.ID_PERMISO === id))
        .filter(Boolean)
        .map((p) => ({
          value: p.ID_PERMISO,
          label: p.NOMBRE_ACCION,
        }));
      setSobreEscribirPermisos(permisosSeleccionados);
    } else {
      setSobreEscribirPermisos([]);
    }

    const alcance = typeof contexto.ALCANCE === "string"
      ? JSON.parse(contexto.ALCANCE)
      : contexto.ALCANCE || {};
    const empresasIds = alcance.empresas || alcance.EMPRESAS || [];
    const empresasSeleccionadas = empresasIds
      .map((id) => empresas.find((e) => e.ID === id))
      .filter(Boolean)
      .map((e) => ({
        value: e.ID,
        label: e.NOMBRE,
      }));
    setAlcanceEmpresas(empresasSeleccionadas);

    const lineasIds = alcance.lineas || alcance.LINEAS || [];
    // Usar lineasNegocio del useMemo (viene del user)
    const lineasSeleccionadas = lineasIds
      .map((id) => lineasNegocio.find((l) => l.value === id))
      .filter(Boolean);
    setAlcanceLineas(lineasSeleccionadas);

    const canalesIds = alcance.canales || alcance.CANALES || [];
    const canalesSeleccionados = canalesIds
      .map((id) => opcionesCanales.find((c) => c.value === id))
      .filter(Boolean);
    setAlcanceCanales(canalesSeleccionados);

    if (contexto.BLOQUEADO && contexto.BLOQUEADO !== "<null>" && contexto.BLOQUEADO !== "null") {
      let bloqueadosArray = [];

      if (Array.isArray(contexto.BLOQUEADO)) {
        bloqueadosArray = contexto.BLOQUEADO;
      } else if (typeof contexto.BLOQUEADO === "string") {
        try {
          const parsed = JSON.parse(contexto.BLOQUEADO);
          if (Array.isArray(parsed)) {
            bloqueadosArray = parsed;
          } else {
            bloqueadosArray = contexto.BLOQUEADO.split(",").map((b) => b.trim()).filter(Boolean);
          }
        } catch (e) {
          bloqueadosArray = contexto.BLOQUEADO.split(",").map((b) => b.trim()).filter(Boolean);
        }
      }

      setBloqueado(bloqueadosArray.join(", "));
    } else {
      setBloqueado("");
    }

    setMostrarFormulario(true);

    setTimeout(() => {
      const formulario = document.querySelector('[data-formulario-contexto]');
      if (formulario) {
        formulario.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Función para cerrar el formulario
  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    setContextoEditando(null);
    setUsuarioSeleccionadoContexto(null);
    setRolSeleccionadoContexto(null);
    setRecurso(null);
    setHerencia(true);
    setSobreEscribirPermisos([]);
    setAlcanceEmpresas([]);
    setAlcanceLineas([]);
    setAlcanceCanales([]);
    setBloqueado("");
  };

  // Obtener nombre del permiso por ID
  const obtenerNombrePermiso = (idPermiso) => {
    const permiso = permisos.find((p) => p.ID_PERMISO === idPermiso);
    return permiso?.NOMBRE_ACCION || "Permiso no encontrado";
  };

  // Filtrar contextos por término de búsqueda
  const filtrarContextos = (contextos) => {
    if (!buscarPermiso.trim()) return contextos;

    const busqueda = buscarPermiso.toLowerCase().trim();

    return contextos.filter((item) => {
      // Buscar en recurso
      const recurso = (item.RECURSO || "").toLowerCase();
      if (recurso.includes(busqueda)) return true;

      // Buscar en nombre del rol
      const nombreRol = (item.ROL?.NOMBRE_ROL || "").toLowerCase();
      if (nombreRol.includes(busqueda)) return true;

      // Buscar en permisos sobrescritos
      if (item.SOBRE_ESCRIBIR_PERMISOS && item.SOBRE_ESCRIBIR_PERMISOS !== "null") {
        const permisosArray = Array.isArray(item.SOBRE_ESCRIBIR_PERMISOS)
          ? item.SOBRE_ESCRIBIR_PERMISOS
          : [];
        const nombresPermisos = permisosArray
          .map((id) => obtenerNombrePermiso(id))
          .join(" ")
          .toLowerCase();
        if (nombresPermisos.includes(busqueda)) return true;
      }

      // Buscar en empresas del alcance
      const alcance = typeof item.ALCANCE === "string"
        ? JSON.parse(item.ALCANCE)
        : item.ALCANCE || {};
      const empresasIds = alcance.empresas || alcance.EMPRESAS || [];
      const nombresEmpresas = empresasIds
        .map((id) => empresas.find((e) => e.ID === id)?.NOMBRE || "")
        .join(" ")
        .toLowerCase();
      if (nombresEmpresas.includes(busqueda)) return true;

      // Buscar en líneas del alcance
      const lineasIds = alcance.lineas || alcance.LINEAS || [];
      const nombresLineas = lineasIds
        .map((id) => lineasNegocio.find((l) => l.value === id)?.label || "")
        .join(" ")
        .toLowerCase();
      if (nombresLineas.includes(busqueda)) return true;

      // Buscar en canales del alcance (TODOS, B2B, B2C)
      const canalesIds = alcance.canales || alcance.CANALES || [];
      const nombresCanales = canalesIds.join(" ").toLowerCase();
      if (nombresCanales.includes(busqueda)) return true;

      // Buscar en recursos bloqueados
      if (item.BLOQUEADO && item.BLOQUEADO !== "<null>" && item.BLOQUEADO !== "null") {
        const bloqueadosArray = Array.isArray(item.BLOQUEADO)
          ? item.BLOQUEADO
          : typeof item.BLOQUEADO === "string"
            ? item.BLOQUEADO.split(",").map((b) => b.trim())
            : [];
        const bloqueadosStr = bloqueadosArray.join(" ").toLowerCase();
        if (bloqueadosStr.includes(busqueda)) return true;
      }

      return false;
    });
  };

  // Agrupar contextos por el primer segmento del recurso
  const agruparContextosPorRecurso = (contextos) => {
    const grupos = {};

    contextos.forEach((item) => {
      const recurso = item.RECURSO || "";
      // Obtener el primer segmento (antes del primer punto) o el recurso completo si no tiene puntos
      const grupoKey = recurso.includes(".") ? recurso.split(".")[0] : recurso || "otros";

      if (!grupos[grupoKey]) {
        grupos[grupoKey] = [];
      }
      grupos[grupoKey].push(item);
    });

    // Ordenar cada grupo y devolver como array de objetos { grupo, items }
    return Object.entries(grupos)
      .map(([grupo, items]) => ({
        grupo,
        items: items.sort((a, b) => (a.RECURSO || "").localeCompare(b.RECURSO || "")),
      }))
      .sort((a, b) => a.grupo.localeCompare(b.grupo));
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

  const opcionesUsuarios = usuarios.map((usuario) => ({
    value: usuario.IDENTIFICADOR || usuario.USUA_ID,
    label: `${usuario.NOMBRE || usuario.USUA_NOMBRE} (${usuario.CORREO || usuario.USUA_CORREO})`,
  }));

  const opcionesEmpresas = empresas.map((empresa) => ({
    value: empresa.ID,
    label: empresa.NOMBRE,
  }));

  // Extraer recursos únicos de usuarios-rol-contexto existentes
  const recursosExistentes = useMemo(() => {
    const recursosSet = new Set();
    usuariosRolContexto.forEach((item) => {
      if (item.RECURSO && item.RECURSO.trim()) {
        recursosSet.add(item.RECURSO.trim());
      }
    });
    return Array.from(recursosSet)
      .sort()
      .map((recurso) => ({
        value: recurso,
        label: recurso,
      }));
  }, [usuariosRolContexto]);

  // lineasNegocio ya está definido en el useMemo arriba, usando user.LINEAS

  return (
    <>
      <CardUI
        title="Usuarios Rol Contexto"
        description="Gestionar permisos de usuarios por recurso y contexto"
        initialOpen={true}
        headerActions={
          <ButtonUI
            iconLeft="FaArrowsRotate"
            onClick={cargarUsuariosRolContexto}
            disabled={cargandoUsuariosRolContexto}
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
            {/* Botón para crear nuevo contexto o mostrar formulario */}
            {!mostrarFormulario ? (
              <ButtonUI
                text="Crear nuevo contexto de usuario"
                iconLeft="FaPlus"
                onClick={handleAbrirFormulario}
                pcolor={theme.colors.secondary}
                style={{ width: "100%" }}
              />
            ) : (
              /* Formulario para crear usuario-rol-contexto */
              <div
                data-formulario-contexto
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: hexToRGBA({
                    hex: theme.colors.primary,
                    alpha: 0.03,
                  }),
                  borderRadius: "6px",
                  border: `1px solid ${hexToRGBA({
                    hex: theme.colors.primary,
                    alpha: 0.1,
                  })}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: theme.colors.primary,
                    }}
                  >
                    {contextoEditando
                      ? "Editar Usuario-Rol-Contexto"
                      : "Crear Nuevo Usuario-Rol-Contexto"}
                  </div>
                  <ButtonUI
                    iconLeft="FaXmark"
                    onClick={handleCerrarFormulario}
                    pcolor={theme.colors.error}
                    style={{ padding: "5px 10px", minWidth: "auto" }}
                    title="Cerrar formulario"
                  />
                </div>

                {/* 1. Usuario | 2. Rol */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Seleccionar Usuario"
                      options={opcionesUsuarios}
                      value={usuarioSeleccionadoContexto}
                      onChange={setUsuarioSeleccionadoContexto}
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Seleccionar Rol"
                      options={opcionesRoles}
                      value={rolSeleccionadoContexto}
                      onChange={setRolSeleccionadoContexto}
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                </div>

                {/* 3. Recurso | 4. Herencia */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Recurso (ej: reportes, reportes.comercial)"
                      options={recursosExistentes}
                      value={recurso}
                      onChange={setRecurso}
                      isCreatable
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                  <CheckboxUI
                    id="herencia"
                    name="herencia"
                    checked={herencia}
                    style={{ marginBottom: "0" }}
                    onChange={(name, checked) => setHerencia(checked)}
                    label="Heredar permisos de recursos hijos"
                  />
                </div>

                {/* 5. Alcances: Empresas, Líneas de Negocio, Canal */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Empresas (Alcance)"
                      options={opcionesEmpresas}
                      value={alcanceEmpresas}
                      onChange={setAlcanceEmpresas}
                      isMulti
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Líneas de Negocio (Alcance)"
                      options={lineasNegocio}
                      value={alcanceLineas}
                      onChange={setAlcanceLineas}
                      isMulti
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Canal (Alcance)"
                      options={opcionesCanales}
                      value={alcanceCanales}
                      onChange={setAlcanceCanales}
                      isMulti
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                </div>

                {/* 6. Bloqueados (opcional) | 7. Sobrescribir Permisos (opcional) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <InputUI
                    placeholder="Bloqueados (opcional, ej: reportes.comercial, reportes.ventas)"
                    value={bloqueado}
                    onChange={setBloqueado}
                  />
                  <div style={{ width: "100%" }}>
                    <SelectUI
                      placeholder="Sobrescribir Permisos (opcional)"
                      options={opcionesPermisos}
                      value={sobreEscribirPermisos}
                      onChange={setSobreEscribirPermisos}
                      isMulti
                      isSearchable
                      minWidth="100%"
                      maxWidth="100%"
                    />
                  </div>
                </div>

                <ButtonUI
                  text={contextoEditando ? "Actualizar Usuario-Rol-Contexto" : "Crear Usuario-Rol-Contexto"}
                  onClick={contextoEditando ? handleActualizarUsuarioRolContexto : handleCrearUsuarioRolContexto}
                  pcolor={theme.colors.secondary}
                  disabled={
                    cargandoUsuariosRolContexto ||
                    !usuarioSeleccionadoContexto ||
                    !rolSeleccionadoContexto ||
                    !recurso ||
                    !(recurso?.value || recurso || "").trim()
                  }
                />
              </div>
            )}

            {/* Buscadores */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <InputUI
                iconLeft={"FaSistrix"}
                placeholder="Buscar usuario por nombre o correo..."
                value={buscarUsuario}
                onChange={setBuscarUsuario}
              />
              <InputUI
                iconLeft={"FaSistrix"}
                placeholder="Buscar por recurso, rol, permisos, empresas, líneas, canales o bloqueados..."
                value={buscarPermiso}
                onChange={setBuscarPermiso}
              />
            </div>

            {/* Lista de usuarios-rol-contexto agrupada por usuario */}
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                borderRadius: "6px",
              }}
            >
              {usuariosRolContexto.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: theme.colors.textSecondary,
                    fontSize: "13px",
                  }}
                >
                  {cargandoUsuariosRolContexto
                    ? "Cargando..."
                    : "No hay usuarios-rol-contexto"}
                </div>
              ) : agruparPorUsuario().length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: theme.colors.textSecondary,
                    fontSize: "13px",
                  }}
                >
                  No se encontraron usuarios con ese criterio de búsqueda
                </div>
              ) : (
                agruparPorUsuario().map((grupo) => {
                  const idUsuario = grupo.usuario?.USUA_ID || grupo.usuario?.IDENTIFICADOR;
                  const estaExpandido = usuariosExpandidos.has(idUsuario);

                  return (
                    <div
                      key={idUsuario}
                      style={{
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: hexToRGBA({
                          hex: theme.colors.primary,
                          alpha: 0.08,
                        }),
                        borderRadius: "6px",
                        border: `1px solid ${hexToRGBA({
                          hex: theme.colors.primary,
                          alpha: 0.15,
                        })}`,
                      }}
                    >
                      {/* Header del usuario */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: estaExpandido ? "12px" : "0",
                          paddingBottom: estaExpandido ? "8px" : "0",
                          borderBottom: estaExpandido
                            ? `1px solid ${hexToRGBA({
                              hex: theme.colors.primary,
                              alpha: 0.2,
                            })}`
                            : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flex: 1,
                            cursor: "pointer",
                          }}
                          onClick={() => toggleExpandirUsuario(idUsuario)}
                        >
                          <IconUI
                            name={estaExpandido ? "FaChevronDown" : "FaChevronRight"}
                            size={14}
                            color={theme.colors.primary}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: theme.colors.primary,
                                marginBottom: "4px",
                              }}
                            >
                              {grupo.usuario?.USUA_NOMBRE || "Usuario desconocido"}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                color: theme.colors.textSecondary,
                              }}
                            >
                              {grupo.usuario?.USUA_CORREO || ""}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              padding: "4px 8px",
                              backgroundColor: hexToRGBA({
                                hex: theme.colors.secondary,
                                alpha: 0.2,
                              }),
                              borderRadius: "4px",
                              color: theme.colors.secondary,
                              fontWeight: "600",
                            }}
                          >
                            {grupo.contextos.length}{" "}
                            {grupo.contextos.length === 1
                              ? "contexto"
                              : "contextos"}
                          </div>
                          <ButtonUI
                            iconLeft="FaPlus"
                            onClick={(e) => {
                              if (e) {
                                e.stopPropagation();
                              }
                              handleAgregarPermisoUsuario(grupo.usuario);
                            }}
                            pcolor={theme.colors.secondary}
                            style={{ padding: "6px 10px", minWidth: "auto" }}
                            title="Agregar permiso a este usuario"
                          />
                        </div>
                      </div>

                      {/* Lista de contextos del usuario */}
                      {estaExpandido && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {(() => {
                            // grupo.contextos ya viene filtrado por buscarPermiso en agruparPorUsuario
                            const contextosFiltrados = buscarPermiso.trim() 
                              ? grupo.contextos 
                              : filtrarContextos(grupo.contextos);
                            const gruposRecursos = agruparContextosPorRecurso(contextosFiltrados);

                            if (gruposRecursos.length === 0) {
                              // Este caso solo debería ocurrir si no hay búsqueda activa y no hay contextos
                              // (pero esto ya está manejado arriba, así que no debería aparecer)
                              return null;
                            }

                            return gruposRecursos.map((grupoRecurso) => (
                              <div
                                key={grupoRecurso.grupo}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "8px",
                                  marginBottom: "12px",
                                }}
                              >
                                {/* Encabezado del grupo */}
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: theme.colors.primary,
                                    textTransform: "capitalize",
                                    paddingBottom: "4px",
                                    borderBottom: `1px solid ${hexToRGBA({
                                      hex: theme.colors.primary,
                                      alpha: 0.2,
                                    })}`,
                                  }}
                                >
                                  {grupoRecurso.grupo}
                                </div>

                                {/* Chips del grupo */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  {grupoRecurso.items.map((item) => {
                                    const alcance =
                                      typeof item.ALCANCE === "string"
                                        ? JSON.parse(item.ALCANCE)
                                        : item.ALCANCE || {};
                                    const empresasAlcance =
                                      alcance.empresas || alcance.EMPRESAS || [];
                                    const lineasAlcance =
                                      alcance.lineas || alcance.LINEAS || [];
                                    const canalesAlcance =
                                      alcance.canales || alcance.CANALES || [];
                                    const bloqueados =
                                      item.BLOQUEADO &&
                                        item.BLOQUEADO !== "<null>" &&
                                        item.BLOQUEADO !== "null"
                                        ? Array.isArray(item.BLOQUEADO)
                                          ? item.BLOQUEADO
                                          : typeof item.BLOQUEADO === "string"
                                            ? item.BLOQUEADO.split(",").map((b) => b.trim())
                                            : []
                                        : [];
                                    const sobrescribirCount =
                                      item.SOBRE_ESCRIBIR_PERMISOS &&
                                        item.SOBRE_ESCRIBIR_PERMISOS !== "null" &&
                                        Array.isArray(item.SOBRE_ESCRIBIR_PERMISOS)
                                        ? item.SOBRE_ESCRIBIR_PERMISOS.length
                                        : 0;
                                    const tituloCompleto = [
                                      item.HERENCIA !== false ? "Herencia: Sí" : "Herencia: No",
                                      sobrescribirCount > 0 && `Sobrescribir: ${(Array.isArray(item.SOBRE_ESCRIBIR_PERMISOS) ? item.SOBRE_ESCRIBIR_PERMISOS : []).map((id) => obtenerNombrePermiso(id)).join(", ")}`,
                                      empresasAlcance.length > 0 && `Empresas: ${empresasAlcance.map((id) => empresas.find((e) => e.ID === id)?.NOMBRE || id).join(", ")}`,
                                      lineasAlcance.length > 0 && `Líneas: ${lineasAlcance.map((id) => lineasNegocio.find((l) => l.value === id)?.label || id).join(", ")}`,
                                      canalesAlcance.length > 0 && `Canales: ${canalesAlcance.join(", ")}`,
                                      bloqueados.length > 0 && `Bloqueados: ${bloqueados.join(", ")}`,
                                    ].filter(Boolean).join(" · ");

                                    // Obtener abreviaturas de empresas
                                    const abreviaturasEmpresas = empresasAlcance
                                      .map((id) => {
                                        const empresa = empresas.find((e) => e.ID === id);
                                        return empresa ? obtenerAbreviaturaEmpresa(empresa.NOMBRE) : null;
                                      })
                                      .filter(Boolean);

                                    // Obtener abreviaturas de líneas
                                    const abreviaturasLineas = lineasAlcance
                                      .map((id) => {
                                        const linea = lineasNegocio.find((l) => l.value === id);
                                        return linea ? obtenerAbreviaturaLinea(linea.label) : null;
                                      })
                                      .filter(Boolean);

                                    return (
                                      <div
                                        key={item.ID_USUARIO_ROL_CONTEXTO}
                                        title={tituloCompleto}
                                        style={{
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "flex-start",
                                          gap: "10px",
                                          padding: "8px 12px",
                                          backgroundColor: hexToRGBA({
                                            hex: theme.colors.primary,
                                            alpha: 0.06,
                                          }),
                                          borderRadius: "12px",
                                          border: `1px solid ${hexToRGBA({
                                            hex: theme.colors.primary,
                                            alpha: 0.15,
                                          })}`,
                                          fontSize: "13px",
                                          minWidth: "fit-content",
                                        }}
                                      >
                                        {/* Columna 1: Nombre del recurso + chips */}
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px",
                                            flex: 1,
                                            minWidth: 0,
                                          }}
                                        >
                                          {/* Primera línea: Recurso, Rol, Herencia */}
                                          <div
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              alignItems: "center",
                                              gap: "6px",
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontWeight: "600",
                                                color: theme.colors.text,
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {item.RECURSO}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: "11px",
                                                padding: "2px 8px",
                                                backgroundColor: hexToRGBA({
                                                  hex: theme.colors.secondary,
                                                  alpha: 0.2,
                                                }),
                                                borderRadius: "12px",
                                                color: theme.colors.secondary,
                                                fontWeight: "600",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {item.ROL?.NOMBRE_ROL || "Sin rol"}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: "10px",
                                                color: theme.colors.textSecondary,
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              H:{item.HERENCIA ? "Sí" : "No"}
                                            </span>
                                          </div>

                                          {/* Segunda línea: Empresas, Líneas y Canales como chips */}
                                          {(abreviaturasEmpresas.length > 0 || abreviaturasLineas.length > 0 || canalesAlcance.length > 0) && (
                                            <div
                                              style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                alignItems: "center",
                                                gap: "4px",
                                              }}
                                            >
                                              {abreviaturasEmpresas.map((abrev, index) => (
                                                <span
                                                  key={`emp-${index}`}
                                                  style={{
                                                    fontSize: "10px",
                                                    padding: "2px 6px",
                                                    backgroundColor: hexToRGBA({
                                                      hex: theme.colors.primary,
                                                      alpha: 0.15,
                                                    }),
                                                    borderRadius: "8px",
                                                    color: theme.colors.primary,
                                                    fontWeight: "600",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {abrev}
                                                </span>
                                              ))}
                                              {abreviaturasLineas.map((abrev, index) => (
                                                <span
                                                  key={`lin-${index}`}
                                                  style={{
                                                    fontSize: "10px",
                                                    padding: "2px 6px",
                                                    backgroundColor: hexToRGBA({
                                                      hex: theme.colors.secondary,
                                                      alpha: 0.15,
                                                    }),
                                                    borderRadius: "8px",
                                                    color: theme.colors.secondary,
                                                    fontWeight: "600",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {abrev}
                                                </span>
                                              ))}
                                              {canalesAlcance.map((canal, index) => (
                                                <span
                                                  key={`canal-${index}`}
                                                  style={{
                                                    fontSize: "10px",
                                                    padding: "2px 6px",
                                                    backgroundColor: hexToRGBA({
                                                      hex: theme.colors.info,
                                                      alpha: 0.2,
                                                    }),
                                                    borderRadius: "8px",
                                                    color: theme.colors.info,
                                                    fontWeight: "600",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {canal}
                                                </span>
                                              ))}
                                            </div>
                                          )}

                                          {/* Sobrescribir y Bloqueados */}
                                          {(sobrescribirCount > 0 || bloqueados.length > 0) && (
                                            <div
                                              style={{
                                                fontSize: "10px",
                                                color: theme.colors.primary,
                                                opacity: 0.9,
                                              }}
                                            >
                                              {[
                                                sobrescribirCount > 0 && `Sob:${sobrescribirCount}`,
                                                bloqueados.length > 0 && `Bloq:${bloqueados.length}`,
                                              ].filter(Boolean).join(" ")}
                                            </div>
                                          )}
                                        </div>

                                        {/* Columna 2: Botones en columna */}
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "4px",
                                            flexShrink: 0,
                                          }}
                                        >
                                          <ButtonUI
                                            iconLeft="FaPenToSquare"
                                            onClick={() => handleIniciarEdicionContexto(item)}
                                            pcolor={theme.colors.primary}
                                            style={{ padding: "4px 8px", minWidth: "auto" }}
                                            title="Editar contexto"
                                            iconSize={18}
                                            width="28px"
                                            height="24px"
                                          />
                                          <ButtonUI
                                            iconLeft="FaTrash"
                                            onClick={() => handleAbrirModalEliminar(item.ID_USUARIO_ROL_CONTEXTO)}
                                            pcolor={theme.colors.error}
                                            style={{ padding: "4px 8px", minWidth: "auto" }}
                                            title="Eliminar contexto"
                                            iconSize={14}
                                            width="28px"
                                            height="24px"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        }
        theme={theme}
      />

      {/* Modal de confirmación de eliminación */}
      <ModalConfirmacionUI
        isOpen={mostrarModalEliminar}
        onClose={handleCerrarModalEliminar}
        onConfirm={handleEliminarUsuarioRolContexto}
        title="Confirmar eliminación"
        message="¿Está seguro de que desea eliminar este contexto de usuario-rol?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
};

