
import { ListarEmpresasAdmin } from "services/administracionService";

export function validacionPermiso(modulo, empresa) {
  const JSONData = JSON.parse(localStorage.getItem("modulos"));
  const data = JSONData.data;
  let verificador = true;
  // Filtra los elementos de data que son iguales a modulo
  const modulosIgualesANombre = data.filter((item) => {
    return (
      item.MODULO.toString() === modulo.toString() &&
      item.NOMBRE_EMPRESA.toString() === empresa.toString()
    );
  });
  if (modulosIgualesANombre.length > 0) {
    const lengthModulos = modulosIgualesANombre.filter(
      (item) => item.PERMISO.toString() === "E"
    );
    lengthModulos.length > 0 ? (verificador = false) : (verificador = true);
  } else {
    verificador = true;
  }

  //Se devuelve true para poder bloquear el elemento y false para activar
  return verificador;
}
export const consultarPermisosPorModulo = async (modulo) => {
  // Obtén los datos del localStorage
  const modulosData = JSON.parse(localStorage.getItem("modulos")) || [];

  // Función recursiva para buscar el módulo y devolver sus permisos
  const buscarModulo = (modulos, nombreModulo) => {
    for (const mod of modulos) {
      // Si encontramos el módulo, devolvemos los permisos
      if (mod.modulo === nombreModulo) {
        return mod.permisos || []; // Si el módulo tiene permisos, los devolvemos
      }
      // Si tiene hijos, hacemos la búsqueda recursiva en los hijos
      if (mod.children && mod.children.length > 0) {
        const resultado = buscarModulo(mod.children, nombreModulo);
        if (resultado.length > 0) {
          return resultado;
        }
      }
    }
    return []; // Devolver array vacío si no se encuentra el módulo o no tiene permisos
  };

  // Llamamos a la función para buscar los permisos del módulo especificado
  const resultado = buscarModulo(modulosData, modulo);

  // Organiza los resultados por empresa y permisos
  return resultado.map((item) => ({
    empresa: item.empresa,
    permiso: item.permiso,
  }));
};

export const consultarPermisosPorModuloID = async ({ moduleid }) => {
  // Obtén los datos del localStorage
  const modulosData = JSON.parse(localStorage.getItem("modulos")) || [];

  // Obtener la lista de empresas
  const empresasAdmin = await ListarEmpresasAdmin();

  // Función recursiva para buscar el módulo y devolver sus permisos
  const buscarModulo = (modulos, idModulo) => {
    for (const mod of modulos) {
      // Si encontramos el módulo, devolvemos los permisos
      if (mod.id === idModulo) {
        return mod.permisos || []; // Si el módulo tiene permisos, los devolvemos
      }
      // Si tiene hijos, hacemos la búsqueda recursiva en los hijos
      if (mod.children && mod.children.length > 0) {
        const resultado = buscarModulo(mod.children, idModulo);
        if (resultado.length > 0) {
          return resultado;
        }
      }
    }
    return []; // Devolver array vacío si no se encuentra el módulo o no tiene permisos
  };

  // Llamamos a la función para buscar los permisos del módulo especificado
  const permisosModulo = buscarModulo(modulosData, moduleid);

  // Cruzar los permisos con la lista de empresas de ListarEmpresasAdmin
  const resultadoFinal = permisosModulo.map((permiso) => {
    const empresaInfo = empresasAdmin.find(
      (empresa) => empresa.NOMBRE === permiso.empresa
    );
    return {
      idempresa: empresaInfo ? empresaInfo.ID : null, // Asignar el ID de la empresa o null si no se encuentra
      empresa: permiso.empresa,
      permiso: permiso.permiso,
    };
  });

  return resultadoFinal;
};

export const consultarPermisosPorModuloRuta = async ({ rutaModulos }) => {
  // Obtén los datos del localStorage
  const modulosData = JSON.parse(localStorage.getItem("modulos")) || [];

  // Función recursiva para buscar el módulo a través de la ruta especificada
  const buscarModuloPorRuta = (modulos, ruta, index = 0) => {
    if (index >= ruta.length) {
      return null; // Se ha alcanzado el final de la ruta
    }

    const nombreModulo = ruta[index];
    for (const mod of modulos) {
      if (mod.modulo === nombreModulo) {
        if (index === ruta.length - 1) {
          // Si estamos en el último módulo de la ruta, devolvemos su ID
          return mod.id;
        } else if (mod.children && mod.children.length > 0) {
          // Si no es el último módulo, continuamos buscando en sus hijos
          return buscarModuloPorRuta(mod.children, ruta, index + 1);
        }
      }
    }
    return null; // No se encontró el módulo
  };

  // Llamamos a la función para buscar el último módulo de la ruta especificada
  const idModuloFinal = buscarModuloPorRuta(modulosData, rutaModulos);
  // console.log(idModuloFinal);
  
  const resPermisos = await consultarPermisosPorModuloID({ moduleid: idModuloFinal });

  return resPermisos; // Si no se encuentra, devolver 0
};
