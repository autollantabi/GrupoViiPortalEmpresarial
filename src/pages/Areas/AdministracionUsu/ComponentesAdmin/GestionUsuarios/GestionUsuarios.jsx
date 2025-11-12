import React, { useState, useEffect } from "react";
import {
  BloquearDesbloquearUsuario,
  ListarModulos,
  ListarPermisosUsuario,
  ListarUsuariosSistema,
  adminstracionService_crearUsuario,
} from "services/administracionService";
import { toast } from "react-toastify";
import { CustomInput } from "components/UI/CustomComponents/CustomInputs";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomCard } from "components/UI/CustomComponents/CustomCard";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { VentanaAsignar } from "./VentanaAsignar";
import styled from "styled-components";

// Styled components para evitar estilos duplicados (deben estar fuera del componente)
const HijoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background-color: ${({ theme }) =>
    hexToRGBA({ hex: theme.colors.secondary, alpha: 0.06 })};
  border: 1px solid
    ${({ theme }) => hexToRGBA({ hex: theme.colors.secondary, alpha: 0.12 })};
`;

const HijoTitle = styled.div`
  font-weight: 600;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 4px;
`;

const EmpresaChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const BaseChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text};
  position: relative;
`;

const LecturaChip = styled(BaseChip)`
  background-color: ${() => hexToRGBA({ hex: "#2196F3", alpha: 0.15 })};
  border: 1px solid ${() => hexToRGBA({ hex: "#2196F3", alpha: 0.4 })};
  & .empresa {
    font-weight: 600;
    color: #1976d2;
  }
  & .permisos {
    color: #1976d2;
  }
`;

const EscrituraChip = styled(BaseChip)`
  background-color: ${() => hexToRGBA({ hex: "#FF9800", alpha: 0.15 })};
  border: 1px solid ${() => hexToRGBA({ hex: "#FF9800", alpha: 0.4 })};
  & .empresa {
    font-weight: 600;
    color: #f57c00;
  }
  & .permisos {
    color: #f57c00;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: ${({ $color }) => $color};
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  padding-top: 2px;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
`;

export const GestionUsuarios = () => {
  const { theme } = useTheme();

  // Estados para crear usuario
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // Estados para listar usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mostrarDatosUsuario, setMostrarDatosUsuario] = useState(false);

  // Estados para módulos y permisos
  const [modulo, setModulo] = useState("");
  const [idModulo, setIdModulo] = useState("");
  const [permisosUsuario, setPermisosUsuario] = useState([]);
  const [todosLosModulos, setTodosLosModulos] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Cargar usuarios al montar
  useEffect(() => {
    listarUsuarios();
  }, []);

  // Obtener permisos cuando se selecciona un usuario
  useEffect(() => {
    if (usuarioSeleccionado?.IDENTIFICADOR) {
      obtenerPermisosDeUsuario();
    }
  }, [usuarioSeleccionado?.IDENTIFICADOR]);

  // Filtrar usuarios por búsqueda
  const filtrarUsuarios = () => {
    if (!busquedaUsuario.trim()) return usuarios;

    return usuarios.filter((user) =>
      user.CORREO.toLowerCase().includes(busquedaUsuario.toLowerCase())
    );
  };

  const listarUsuarios = async () => {
    try {
      const res = await ListarUsuariosSistema();
      setUsuarios(res || []);
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      toast.error("Error al cargar los usuarios");
    }
  };

  const obtenerPermisosDeUsuario = async () => {
    if (!usuarioSeleccionado?.IDENTIFICADOR) return;

    try {
      const modulos = await ListarModulos();
      // Guardar todos los módulos para mostrarlos en la lista
      setTodosLosModulos(modulos || []);

      const permisos = await ListarPermisosUsuario({
        idUsuario: parseInt(usuarioSeleccionado.IDENTIFICADOR),
      });
      console.log(permisos);

      const permisosMap = permisos.reduce((acc, curr) => {
        acc[curr.IDENTIFICADOR_MODULO] = acc[curr.IDENTIFICADOR_MODULO] || [];
        acc[curr.IDENTIFICADOR_MODULO].push({
          empresa: curr.NOMBRE_EMPRESA,
          permiso: curr.PERMISO,
        });
        return acc;
      }, {});

      const buildPermissions = (modulo) => {
        const permisosModulo = permisosMap[modulo.IDENTIFICADOR] || [];
        const children = modulos
          .filter((child) => child.PADRE === modulo.IDENTIFICADOR)
          .map(buildPermissions)
          .filter(
            (child) => child.permisos.length > 0 || child.children.length > 0
          );

        return {
          id: modulo.IDENTIFICADOR,
          modulo: modulo.MODULO,
          permisos: permisosModulo,
          children,
        };
      };

      const modulosRaiz = modulos
        .filter((modulo) => modulo.PADRE === 0)
        .map((modulo) => buildPermissions(modulo))
        .filter(
          (modulo) => modulo.permisos.length > 0 || modulo.children.length > 0
        );

      setPermisosUsuario(modulosRaiz);
    } catch (error) {
      console.error("Error al obtener permisos:", error);
      toast.error("Error al cargar los permisos del usuario");
    }
  };

  // Validar campos
  const validarCampos = (campo, tipo) => {
    campo = campo.trim();
    if (tipo === "correo") {
      if (
        !/^(?:[A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,})?$/i.test(campo)
      ) {
        return "Correo inválido";
      }
    } else if (tipo === "contrasena") {
      if (campo.length < 5) {
        return "Contraseña muy corta (mínimo 5 caracteres)";
      }
    } else if (tipo === "nombre") {
      if (campo.length <= 10) {
        return "Nombre muy corto (mínimo 10 caracteres)";
      }
    }
    return "";
  };

  // Crear nuevo usuario
  const handleCrearUsuario = async () => {
    let error = validarCampos(nombre, "nombre");
    if (error) {
      setMensajeError(error);
      return;
    }

    error = validarCampos(correo, "correo");
    if (error) {
      setMensajeError(error);
      return;
    }

    error = validarCampos(contrasena, "contrasena");
    if (error) {
      setMensajeError(error);
      return;
    }

    setCargando(true);
    setMensajeError("");
    try {
      const resCreacion = await adminstracionService_crearUsuario({
        correo,
        contrasena,
        nombre,
      });
      if (resCreacion.success) {
        toast.success(resCreacion.message);
        setCorreo("");
        setContrasena("");
        setNombre("");
        setMensajeError("");
        listarUsuarios();
      } else {
        toast.error(resCreacion.message);
      }
    } catch (error) {
      console.error("Error al crear usuario:", error);
      setMensajeError("Error al crear el usuario");
    } finally {
      setCargando(false);
    }
  };

  // Seleccionar usuario para modificar
  const handleSeleccionarUsuario = (usuario) => {
    if (usuario === usuarioSeleccionado) {
      setUsuarioSeleccionado(null);
      setMostrarDatosUsuario(false);
    } else {
      setUsuarioSeleccionado(usuario);
      setMostrarDatosUsuario(true);
    }
  };

  // Establecer módulo
  const establecerModulo = (item, itemid) => {
    setModulo(item);
    setIdModulo(itemid);
  };

  // Cambiar estado del usuario (bloquear/desbloquear)
  const handleCambiarEstado = async (usuario) => {
    try {
      await BloquearDesbloquearUsuario({
        usuario: usuario.CORREO,
        estado: usuario.ESTADO === "ACTIVO" ? false : true,
        actualizar: listarUsuarios,
      });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al cambiar el estado del usuario");
    }
  };

  // Abreviar nombres de empresas
  const abreviarEmpresa = (empresa) => {
    const abreviaciones = {
      AUTOLLANTA: "AU",
      MAXXIMUNDO: "MX",
      STOX: "ST",
      IKONIX: "IK",
      AUTOMAX: "AM",
    };
    return abreviaciones[empresa] || empresa;
  };

  // Determinar si un permiso es de escritura o lectura
  const esPermisoEscritura = (permiso) => {
    const permisosEscritura = ["W", "E", "M", "A", "I", "U", "D", "C"];
    return permisosEscritura.some((p) => permiso.toUpperCase().includes(p));
  };

  // Clasificar permisos en lectura y escritura
  const clasificarPermisos = (permisosArray) => {
    const lectura = [];
    const escritura = [];

    permisosArray.forEach((permiso) => {
      if (esPermisoEscritura(permiso)) {
        escritura.push(permiso);
      } else {
        lectura.push(permiso);
      }
    });

    return { lectura, escritura };
  };

  // Obtener permisos agrupados por módulo padre
  const obtenerPermisosAgrupadosPorPadre = () => {
    if (!permisosUsuario || permisosUsuario.length === 0) {
      return [];
    }

    return permisosUsuario.map((moduloPadre) => {
      // Recopilar todos los permisos del módulo padre y sus hijos
      const todosLosPermisosDelPadre = [];

      // Función recursiva para recopilar permisos
      const recopilarPermisos = (modulo, ruta = "") => {
        const rutaActual = ruta ? `${ruta}>${modulo.modulo}` : modulo.modulo;

        // Si tiene permisos en este nivel, agregarlos
        if (modulo.permisos.length > 0) {
          // Agrupar permisos por empresa
          const permisosPorEmpresa = modulo.permisos.reduce((acc, permiso) => {
            if (!acc[permiso.empresa]) {
              acc[permiso.empresa] = [];
            }
            acc[permiso.empresa].push(permiso.permiso);
            return acc;
          }, {});

          const empresas = Object.keys(permisosPorEmpresa);

          // Crear string con todas las empresas en una sola línea
          const partesEmpresa = empresas.map((empresa) => {
            const permisosStr = [...new Set(permisosPorEmpresa[empresa])].join(
              ","
            );
            const empresaAbrev = abreviarEmpresa(empresa);
            return `${empresaAbrev}:${permisosStr}`;
          });

          const empresasStr = partesEmpresa.join(",");
          todosLosPermisosDelPadre.push({
            ruta: rutaActual,
            permisos: empresasStr,
          });
        }

        // Procesar hijos recursivamente
        modulo.children.forEach((child) => {
          recopilarPermisos(child, rutaActual);
        });
      };

      recopilarPermisos(moduloPadre);

      return {
        moduloPadre: moduloPadre.modulo,
        idPadre: moduloPadre.id,
        permisos: todosLosPermisosDelPadre,
      };
    });
  };

  // Dado un string "AU:A,M,MX:E" retorna un mapa { AU:[A,M], MX:[E] }
  const parsePermisosPorEmpresa = (empresasStr) => {
    const mapa = {};
    if (!empresasStr) return mapa;
    empresasStr.split(",").forEach((parte) => {
      const [empresa, permisos] = parte.split(":");
      if (!empresa || !permisos) return;
      const letras = permisos
        .split(".")
        .join("")
        .split("")
        .filter((c) => c !== " ");
      const lista = permisos
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      mapa[empresa] = Array.from(new Set(lista.length > 1 ? lista : letras));
    });
    return mapa;
  };

  // A partir de un grupo (padre), agrupa por hijo inmediato y combina permisos por empresa
  const agruparPermisosPorHijo = (grupo) => {
    const acumulado = {};
    grupo.permisos.forEach((item) => {
      const partes = item.ruta.split(">").map((s) => s.trim());
      const hijo = partes.length > 1 ? partes[1] : partes[0];
      if (!acumulado[hijo]) {
        acumulado[hijo] = {};
      }
      const mapaEmpresas = parsePermisosPorEmpresa(item.permisos);
      Object.keys(mapaEmpresas).forEach((emp) => {
        if (!acumulado[hijo][emp]) acumulado[hijo][emp] = new Set();
        mapaEmpresas[emp].forEach((perm) => acumulado[hijo][emp].add(perm));
      });
    });

    // Convertir sets a arrays ordenadas
    return Object.keys(acumulado).map((hijo) => {
      const empresas = Object.keys(acumulado[hijo]).reduce((res, emp) => {
        res[emp] = Array.from(acumulado[hijo][emp]);
        return res;
      }, {});
      return { hijo, empresas };
    });
  };

  // Agrupa permisos por TODOS los descendientes (no solo el primer hijo)
  // Para una ruta A>B>C, generará filas para B y C
  const agruparPermisosPorTodosLosHijos = (grupo) => {
    const acumulado = {};

    grupo.permisos.forEach((item) => {
      const partes = item.ruta.split(">").map((s) => s.trim());
      // Excluir el padre (índice 0); incluir todos los descendientes
      for (let i = 1; i < partes.length; i += 1) {
        const nodo = partes[i];
        if (!acumulado[nodo]) {
          acumulado[nodo] = {};
        }
        const mapaEmpresas = parsePermisosPorEmpresa(item.permisos);
        Object.keys(mapaEmpresas).forEach((emp) => {
          if (!acumulado[nodo][emp]) acumulado[nodo][emp] = new Set();
          mapaEmpresas[emp].forEach((perm) => acumulado[nodo][emp].add(perm));
        });
      }
    });

    return Object.keys(acumulado).map((nodo) => {
      const empresas = Object.keys(acumulado[nodo]).reduce((res, emp) => {
        res[emp] = Array.from(acumulado[nodo][emp]);
        return res;
      }, {});
      return { hijo: nodo, empresas };
    });
  };

  // Agrupa solo por el último hijo de la ruta (nodos finales con permisos)
  const agruparPermisosSoloFinales = (grupo) => {
    const acumulado = {};

    grupo.permisos.forEach((item) => {
      const partes = item.ruta.split(">").map((s) => s.trim());
      if (partes.length === 0) return;
      const ultimoNodo = partes[partes.length - 1];
      if (!acumulado[ultimoNodo]) {
        acumulado[ultimoNodo] = {};
      }
      const mapaEmpresas = parsePermisosPorEmpresa(item.permisos);
      Object.keys(mapaEmpresas).forEach((emp) => {
        if (!acumulado[ultimoNodo][emp]) acumulado[ultimoNodo][emp] = new Set();
        mapaEmpresas[emp].forEach((perm) =>
          acumulado[ultimoNodo][emp].add(perm)
        );
      });
    });

    return Object.keys(acumulado).map((nodo) => {
      const empresas = Object.keys(acumulado[nodo]).reduce((res, emp) => {
        res[emp] = Array.from(acumulado[nodo][emp]);
        return res;
      }, {});
      return { hijo: nodo, empresas };
    });
  };

  // Obtener lista de todos los módulos principales (no solo los con permisos)
  const obtenerModulosUnicos = () => {
    // Obtener todos los módulos raíz (PADRE === 0)
    const modulosRaiz = todosLosModulos.filter((modulo) => modulo.PADRE === 0);

    // Crear un mapa de módulos que tienen permisos
    const modulosConPermisos = new Set();
    permisosUsuario.forEach((modulo) => {
      modulosConPermisos.add(modulo.id);
    });

    return modulosRaiz.map((modulo) => ({
      id: modulo.IDENTIFICADOR,
      nombre: modulo.MODULO,
      tienePermisos: modulosConPermisos.has(modulo.IDENTIFICADOR),
    }));
  };

  // Manejar clic en módulo
  const handleClickModulo = (moduloItem) => {
    establecerModulo(moduloItem.nombre, moduloItem.id);
  };

  return (
    <>
      <CustomContainer
        width="100%"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto auto",
          gap: "15px",
          padding: "10px",
        }}
      >
        {/* Primera fila: Crear usuario */}
        <div style={{ gridColumn: "1 / 2" }}>
          <CustomCard
            title="Crear Nuevo Usuario"
            description="Agrega un nuevo usuario al sistema"
            body={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {mensajeError && (
                  <div
                    style={{
                      backgroundColor: hexToRGBA({
                        hex: theme.colors.error,
                        alpha: 0.1,
                      }),
                      color: theme.colors.error,
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "13px",
                      border: `1px solid ${hexToRGBA({
                        hex: theme.colors.error,
                        alpha: 0.3,
                      })}`,
                    }}
                  >
                    {mensajeError}
                  </div>
                )}
                <CustomInput
                  placeholder="Nombre Completo"
                  value={nombre}
                  onChange={setNombre}
                  disabled={cargando}
                />
                <CustomInput
                  placeholder="Correo"
                  value={correo}
                  onChange={setCorreo}
                  disabled={cargando}
                />
                <CustomInput
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={setContrasena}
                  disabled={cargando}
                />
              </div>
            }
            footer={
              <CustomButton
                onClick={handleCrearUsuario}
                text="Crear Usuario"
                pcolor={theme.colors.secondary}
                disabled={
                  cargando ||
                  !nombre.trim() ||
                  !correo.trim() ||
                  !contrasena.trim()
                }
              />
            }
            theme={theme}
          />
        </div>

        {/* Primera fila: Listar usuarios */}
        <div style={{ gridColumn: "2 / 3" }}>
          <CustomCard
            title="Buscar y Listar Usuarios"
            description="Gestiona los usuarios del sistema"
            body={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <CustomInput
                  placeholder="Buscar por correo..."
                  value={busquedaUsuario}
                  onChange={setBusquedaUsuario}
                  disabled={cargando}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    overflowY: "auto",
                    maxHeight: "90px",
                  }}
                >
                  {filtrarUsuarios().length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: theme.colors.textSecondary,
                        fontSize: "14px",
                      }}
                    >
                      No se encontraron usuarios
                    </div>
                  ) : (
                    filtrarUsuarios().map((usuario, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          transition: "all 0.2s ease",
                          backgroundColor: hexToRGBA({
                            hex:
                              usuarioSeleccionado === usuario
                                ? theme.colors.primary
                                : theme.colors.primary,
                            alpha: usuarioSeleccionado === usuario ? 0.2 : 0.05,
                          }),
                          border: `1px solid ${hexToRGBA({
                            hex: theme.colors.primary,
                            alpha: usuarioSeleccionado === usuario ? 0.4 : 0.1,
                          })}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "500",
                              color: theme.colors.text,
                              fontSize: "13px",
                            }}
                          >
                            {usuario.CORREO}
                          </span>
                          {usuario.NOMBRE && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: theme.colors.textSecondary,
                              }}
                            >
                              {usuario.NOMBRE}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            onClick={() => handleCambiarEstado(usuario)}
                            style={{
                              cursor: "pointer",
                              fontSize: "14px",
                            }}
                            title={
                              usuario.ESTADO === "ACTIVO"
                                ? "Desbloquear"
                                : "Bloquear"
                            }
                          >
                            <i
                              className={
                                usuario.ESTADO === "ACTIVO"
                                  ? "bi bi-circle-fill"
                                  : "bi bi-circle"
                              }
                              style={{
                                color:
                                  usuario.ESTADO === "ACTIVO" ? "green" : "red",
                              }}
                            />
                          </span>
                          <CustomButton
                            iconLeft="FaEdit"
                            onClick={() => handleSeleccionarUsuario(usuario)}
                            pcolor={
                              usuarioSeleccionado === usuario
                                ? theme.colors.secondary
                                : theme.colors.primary
                            }
                            style={{ padding: "3px 6px" }}
                            disabled={cargando}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            }
            footer={
              <CustomButton
                onClick={listarUsuarios}
                text="Actualizar Lista"
                disabled={cargando}
                width="100%"
              />
            }
            theme={theme}
          />
        </div>

        {/* Segunda fila: Modificar usuario (si está seleccionado) */}
        {mostrarDatosUsuario && usuarioSeleccionado && (
          <div style={{ gridColumn: "1 / 3" }}>
            <CustomCard
              title="Gestión de Permisos del Usuario"
              description={`Usuario: ${usuarioSeleccionado.CORREO} - ${
                usuarioSeleccionado.NOMBRE || "Sin nombre"
              }`}
              body={
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    width: "100%",
                    minHeight: "400px",
                  }}
                >
                  {/* Columna izquierda: Lista de módulos */}
                  <div
                    style={{
                      flex: "0 0 250px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      padding: "10px",
                      backgroundColor: hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.05,
                      }),
                      borderRadius: "6px",
                      border: `1px solid ${hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.1,
                      })}`,
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    {/* Sección: Módulos asignados */}
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: theme.colors.primary,
                          marginBottom: "8px",
                        }}
                      >
                        Módulos:
                      </div>
                      {obtenerModulosUnicos().length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "15px",
                            color: theme.colors.textSecondary,
                            fontSize: "12px",
                          }}
                        >
                          No hay módulos asignados
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          {obtenerModulosUnicos().map((modulo, index) => (
                            <div
                              key={index}
                              onClick={() => handleClickModulo(modulo)}
                              style={{
                                padding: "10px 12px",
                                borderRadius: "4px",
                                backgroundColor: hexToRGBA({
                                  hex: theme.colors.primary,
                                  alpha: modulo.id === idModulo ? 0.2 : 0.1,
                                }),
                                border: `1px solid ${hexToRGBA({
                                  hex: theme.colors.primary,
                                  alpha: modulo.id === idModulo ? 0.4 : 0.2,
                                })}`,
                                fontSize: "13px",
                                fontWeight: "500",
                                color: theme.colors.text,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={(e) => {
                                if (modulo.id !== idModulo) {
                                  e.currentTarget.style.backgroundColor =
                                    hexToRGBA({
                                      hex: theme.colors.primary,
                                      alpha: 0.15,
                                    });
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (modulo.id !== idModulo) {
                                  e.currentTarget.style.backgroundColor =
                                    hexToRGBA({
                                      hex: theme.colors.primary,
                                      alpha: 0.1,
                                    });
                                }
                              }}
                            >
                              <span>{modulo.nombre}</span>
                              {modulo.tienePermisos && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    backgroundColor: hexToRGBA({
                                      hex: theme.colors.secondary,
                                      alpha: 0.2,
                                    }),
                                    color: theme.colors.secondary,
                                    fontWeight: "600",
                                  }}
                                  title="Este módulo tiene permisos asignados"
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Columna derecha: Permisos formateados */}
                  <div
                    style={{
                      flex: "1",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      padding: "10px",
                      backgroundColor: hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.02,
                      }),
                      borderRadius: "6px",
                      border: `1px solid ${hexToRGBA({
                        hex: theme.colors.primary,
                        alpha: 0.1,
                      })}`,
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: theme.colors.primary,
                        marginBottom: "8px",
                      }}
                    >
                      Permisos Asignados:
                    </div>
                    {obtenerPermisosAgrupadosPorPadre().length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: theme.colors.textSecondary,
                          fontSize: "13px",
                        }}
                      >
                        No hay permisos asignados
                      </div>
                    ) : (
                      obtenerPermisosAgrupadosPorPadre().map(
                        (grupo, grupoIndex) => (
                          <div
                            key={grupoIndex}
                            style={{
                              marginBottom: "16px",
                              padding: "12px",
                              borderRadius: "6px",
                              backgroundColor: hexToRGBA({
                                hex: theme.colors.primary,
                                alpha: 0.05,
                              }),
                              border: `1px solid ${hexToRGBA({
                                hex: theme.colors.primary,
                                alpha: 0.15,
                              })}`,
                            }}
                          >
                            {/* Título del módulo padre */}
                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                color: theme.colors.primary,
                                marginBottom: "10px",
                                paddingBottom: "8px",
                                borderBottom: `1px solid ${hexToRGBA({
                                  hex: theme.colors.primary,
                                  alpha: 0.2,
                                })}`,
                              }}
                            >
                              {grupo.moduloPadre}
                            </div>

                            {/* Lista de permisos del módulo padre */}
                            {grupo.permisos.length === 0 ? (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "10px",
                                  color: theme.colors.textSecondary,
                                  fontSize: "12px",
                                  fontStyle: "italic",
                                }}
                              >
                                Sin permisos específicos en este módulo
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "repeat(auto-fill, minmax(300px, 1fr))",
                                  gap: "10px",
                                }}
                              >
                                {agruparPermisosSoloFinales(grupo).map(
                                  (fila, idxFila) => (
                                    <HijoRow key={idxFila}>
                                      <HijoTitle>{fila.hijo}</HijoTitle>
                                      <EmpresaChips>
                                        {Object.keys(fila.empresas).map(
                                          (empresa, idxChip) => {
                                            const permisos =
                                              fila.empresas[empresa];
                                            const { lectura, escritura } =
                                              clasificarPermisos(permisos);
                                            return (
                                              <div
                                                key={idxChip}
                                                style={{
                                                  display: "inline-flex",
                                                  flexDirection: "column",
                                                  gap: "4px",
                                                }}
                                              >
                                                {lectura.length > 0 && (
                                                  <LecturaChip>
                                                    <Badge
                                                      $color="#2196F3"
                                                      title="Lectura"
                                                    >
                                                      L
                                                    </Badge>
                                                    <span className="empresa">
                                                      {empresa}
                                                    </span>
                                                    <span className="permisos">
                                                      {lectura.join(",")}
                                                    </span>
                                                  </LecturaChip>
                                                )}
                                                {escritura.length > 0 && (
                                                  <EscrituraChip>
                                                    <Badge
                                                      $color="#FF9800"
                                                      title="Escritura"
                                                    >
                                                      E
                                                    </Badge>
                                                    <span className="empresa">
                                                      {empresa}
                                                    </span>
                                                  </EscrituraChip>
                                                )}
                                              </div>
                                            );
                                          }
                                        )}
                                      </EmpresaChips>
                                    </HijoRow>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              }
              theme={theme}
            />
          </div>
        )}
      </CustomContainer>

      {/* Ventana para asignar permisos */}
      {modulo !== "" && usuarioSeleccionado && (
        <VentanaAsignar
          idmodulo={idModulo}
          modulo={modulo}
          usuario={usuarioSeleccionado.IDENTIFICADOR}
          setearmodulo={establecerModulo}
          actualizarDataUsuario={obtenerPermisosDeUsuario}
        />
      )}
    </>
  );
};
