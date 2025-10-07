import { axiosInstance, axiosInstanceNew } from "config/axiosConfig";

export const apiCargarArchivoTransferenciasBolivariano = async ({ empresa, archivos }) => {
  try {
    const formData = new FormData();
    archivos.forEach((file) => formData.append("archivos", file, file.name));

    const response = await axiosInstanceNew.post(
      `/cartera/archivos/bancoBolivariano/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Movimientos cargados correctamente." };
    }
    return { success: false, message: "Error al cargar el archivo" };
  } catch (error) {
    return { success: false, message: `Error Interno ${error}` };
  }
};

export const apiCargarArchivoTransferenciasPichincha = async ({ archivos }) => {
  try {
    const formData = new FormData();
    archivos.forEach((file) => formData.append("archivos", file, file.name));

    const response = await axiosInstanceNew.post(
      `/cartera/archivos/bancoPichincha/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (response.status === 200) {
      return { success: true, message: "Movimientos cargados correctamente." };
    }
    return { success: false, message: "Error al cargar el archivo" };
  } catch (error) {
    return { success: false, message: `Error Interno ${error}` };
  }
};
