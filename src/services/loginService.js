import { ObtenerIDUsuario } from "./usuariosService";
import { ListarModulos, ListarPermisosUsuario } from "./administracionService";
import { axiosInstance } from "config/axiosConfig";

export async function obtenerUsuario(correo, contrasena) {
  try {
    const response = await axiosInstance.get(
      `/usuario/validarUsuario/${correo}/${contrasena}`
    );

    if (response.status === 200) {
      return { success: true, correcto: response.data.mensaje };
    }

    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

export const verificarInicioSesion = async ({ correo, contrasena }) => {
  try {
    const req_usuario = await obtenerUsuario(correo, contrasena);
    const req_session = await ObtenerIDUsuario(correo);
    // console.log(req_session);

    if (req_usuario.success) {
      if (req_usuario.correcto) {
        const dataUsuario = req_session.map(
          ({ CORREO, IDENTIFICADOR, NOMBRE, PRIMERASESION }) => ({
            correo: CORREO,
            id: IDENTIFICADOR,
            nombre: NOMBRE,
            psesion: PRIMERASESION,
          })
        );

        return {
          success: true,
          data: dataUsuario[0],
        };
      } else {
        return {
          success: false,
          message: "Credenciales incorrectas para el usuario.",
        };
      }
    }
    return {
      success: false,
      message: "Usuario no existe ",
    };
  } catch (error) {
    console.log("Error al verificar sesión");
    return { success: false, message: "Error en el servidor" };
  }
};

export const getPermisosDeUsuarioArbol = async ({ usuarioID }) => {
  const modulos = await ListarModulos();
  const permisosUsuario = await ListarPermisosUsuario({
    idUsuario: parseInt(usuarioID),
  });

  // Crear un mapa de permisos basado en el IDENTIFICADOR_MODULO
  const permisosMap = permisosUsuario.reduce((acc, curr) => {
    acc[curr.IDENTIFICADOR_MODULO] = acc[curr.IDENTIFICADOR_MODULO] || [];
    acc[curr.IDENTIFICADOR_MODULO].push({
      empresa: curr.NOMBRE_EMPRESA,
      permiso: curr.PERMISO,
    });
    return acc;
  }, {});

  // Función recursiva para construir el árbol de módulos y permisos
  const buildTree = (modulo) => {
    // Buscar los hijos de este módulo
    const children = modulos
      .filter((child) => child.PADRE === modulo.IDENTIFICADOR)
      .map(buildTree)
      .filter((child) => child !== null); // Filtrar los hijos que tienen permisos

    // Verificar si es un módulo final (sin hijos)
    const permisos = permisosMap[modulo.IDENTIFICADOR] || [];
    const tienePermisos = permisos.length > 0;

    if (children.length === 0) {
      // Si no tiene hijos, solo incluir si tiene permisos
      return tienePermisos
        ? {
            id: modulo.IDENTIFICADOR,
            modulo: modulo.MODULO, // Nombre del módulo
            permisos, // Permisos asociados (empresas y permisos)
            children: [], // No tendrá hijos ya que es final
          }
        : null; // Si no tiene permisos, no devolver nada
    }

    // Si tiene hijos, devolver el módulo con los hijos que tienen permisos
    return children.length > 0 || tienePermisos
      ? {
          id: modulo.IDENTIFICADOR,
          modulo: modulo.MODULO,
          children, // Incluir solo los hijos que tienen permisos
          ...(tienePermisos ? { permisos } : {}), // Incluir permisos si tiene
        }
      : null; // Si no tiene hijos con permisos y no tiene permisos, devolver null
  };

  // Construir el árbol comenzando por los módulos raíz (PADRE === 0)
  const tree = modulos
    .filter((modulo) => modulo.PADRE === 0) // Filtrar por los módulos raíz
    .map(buildTree)
    .filter((modulo) => modulo !== null); // Construir el árbol para cada módulo raíz

  return tree; // Devolver el árbol completo
};
