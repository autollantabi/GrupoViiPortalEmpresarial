import { axiosInstance, axiosInstanceNew } from "config/axiosConfig";

const environment = import.meta.env.MODE === "development" ? "d" : "p";

export async function ListarEmpresas() {
  try {
    const res = await axiosInstance.get(
      `/usuario/datos/empresa/${localStorage.getItem("correo")}`
    );
    if (res.status === 200) {
      return res.data;
    }
    return;
  } catch (e) {
    return [];
  }
}

export async function ObtenerReporteComisionesMayoristas({
  codigoEmpresa,
  mes,
  anio,
}) {
  try {
    const res = await axiosInstance.get(
      `/comisiones/obtenerComisiones/${codigoEmpresa}/${mes}/${anio}`
    );
    if (res.status === 200) {
      return res.data;
    }

    return [];
  } catch (e) {
    return [];
  }
}
export async function ObtenerReporteComisionesLubricantes({
  codigoEmpresa,
  mes,
  anio,
}) {
  try {
    const res = await axiosInstanceNew.get(
      `/contabilidad/comisionesLubricantes/${codigoEmpresa}/${mes}/${anio}`
    );
    if (res.status === 200) {
      return res.data.data || res.data;
    }

    return [];
  } catch (e) {
    return [];
  }
}

export const obtenerListaBancos = async () => {
  try {
    const res = await axiosInstance.get(`/bancos`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const convertirArchivoBancos = async ({ empresa, banco, archivos }) => {
  try {
    const formData = new FormData();
    archivos.forEach((file) => formData.append("file", file, file.name));

    const res = await axiosInstance.post(
      `/contabilidad/subirArchivo/${empresa}/${banco}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    );
    if (res.status === 200) {
      const blob = new Blob([res.data], {
        type: res.headers["content-type"],
      });
      // Nombre del archivo: banco + empresa
      const nombreArchivo = `${empresa}-${banco}.xlsx`;

      // Crear enlace de descarga
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = nombreArchivo; // Asignar el nombre al archivo
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, message: "Archivo transformado correctamente" };
    }
    return { success: false, message: "Error al transfomar el archivo" };
  } catch (e) {
    return { success: false, message: `Error interno ${e}` };
  }
};

export async function ObtenerReporteComisionesTecnicentroVendedores({
  mes,
  anio,
  data,
  idUsu,
}) {
  try {
    const res = await axiosInstance.post(
      `/comisiones/tecnicentro/comision-cabecera/${anio}/${mes}`,
      { vendedores: data, idUsu }
    );
    console.log(res);

    if (res.status === 200) {
      return res.data.data;
    }

    return [];
  } catch (e) {
    return [];
  }
}

export async function ObtenerProductosTecnicentro({ mes, anio }) {
  try {
    console.log(mes,anio);
    
    const res = await axiosInstance.get(
      `/producto/obtener-tecnicentro/${mes}/${anio}`
    );
    console.log(res);
    

    if (res.status === 200) {
      return res.data.productos;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function ObtenerCategoriasSubcategoriasTecnicentro() {
  const def = { CATEGORIAS: [], SUBCATEGORIAS: [] };
  try {
    const res = await axiosInstance.get(`/producto/categoria/subCategoria/`);

    if (res.status === 200) {
      return res.data;
    }
    return def;
  } catch (e) {
    return def;
  }
}
export async function UpdateCategoriasSubcategoriasTecnicentro({ data }) {
  try {
    const res = await axiosInstance.post(
      `/producto/update/categoria/subcategoria/`,
      data
    );

    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function consultarSiExistenCategoriasPendientes({ data }) {
  try {
    const res = await axiosInstance.post(
      `/producto/update/categoria/subcategoria/`,
      data
    );

    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function obtenerBonificacionesManuales({ mes, anio }) {
  try {
    const res = await axiosInstance.get(
      `/comisiones/tecnicentro/agrupacion-vendedor-manual/${anio}/${mes}`
    );

    if (res.status === 200) {
      return res.data.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function obtenerVerificaciondeCategorizaciones({ mes, anio }) {
  try {
    const res = await axiosInstance.get(
      `/producto/obtener-tecnicentro/verificacion/${mes}/${anio}`
    );

    if (res.status === 200) {
      if (environment === "d") {
        return true;
      }
      return res.data.data;
    }
    return false;
  } catch (e) {
    return false;
  }
}
