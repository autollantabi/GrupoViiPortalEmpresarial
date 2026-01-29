import { axiosInstanceNew } from "config/axiosConfig";

export async function Listar5w2hCabeceras() {
  try {
    const res = await axiosInstanceNew.get(`/5w2h/cabecera`);
    return {
      success: true,
      data: res.data?.data || res.data || [],
      message: res.data?.message || "Cabeceras obtenidas exitosamente",
    };
  } catch (e) {
    console.error("Error al listar cabeceras 5W2H:", e);
    return {
      success: false,
      data: [],
      message: e.response?.data?.message || "Error al cargar las cabeceras",
    };
  }
}

export async function Crear5w2hCabecera(cabecera) {
  try {
    const res = await axiosInstanceNew.post(`/5w2h/cabecera`, cabecera);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Cabecera creada exitosamente",
    };
  } catch (e) {
    console.error("Error al crear cabecera 5W2H:", e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al crear la cabecera",
    };
  }
}

export async function Crear5w2hDetalle(detalle) {
  try {
    const res = await axiosInstanceNew.post(`/5w2h/detalle`, detalle);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Detalle creado exitosamente",
    };
  } catch (e) {
    console.error("Error al crear detalle 5W2H:", e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al crear el detalle",
    };
  }
}

export async function Actualizar5w2hCabecera(id, cabecera) {
  try {
    const res = await axiosInstanceNew.put(`/5w2h/cabecera/${id}`, cabecera);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Cabecera actualizada exitosamente",
    };
  } catch (e) {
    console.error("Error al actualizar cabecera 5W2H:", e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al actualizar la cabecera",
    };
  }
}

export async function Actualizar5w2hDetalle(id, detalle) {
  try {
    const res = await axiosInstanceNew.patch(`/5w2h/detalle/${id}`, detalle);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Detalle actualizado exitosamente",
    };
  } catch (e) {
    console.error("Error al actualizar detalle 5W2H:", e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al actualizar el detalle",
    };
  }
}

export async function Eliminar5w2hDetalle(id) {
  try {
    const res = await axiosInstanceNew.delete(`/5w2h/detalle/${id}`);
    return {
      success: true,
      data: res.data?.data || res.data || null,
      message: res.data?.message || "Detalle eliminado exitosamente",
    };
  } catch (e) {
    console.error("Error al eliminar detalle 5W2H:", e);
    return {
      success: false,
      data: null,
      message: e.response?.data?.message || "Error al eliminar el detalle",
    };
  }
}

export async function Listar5w2hDetallesPorCabecera(cabeceraId) {
  try {
    const res = await axiosInstanceNew.get(`/5w2h/detalle/cabecera/${cabeceraId}`);
    return {
      success: true,
      data: res.data?.data || res.data || [],
      message: res.data?.message || "Detalles obtenidos exitosamente",
    };
  } catch (e) {
    console.error("Error al listar detalles 5W2H:", e);
    return {
      success: false,
      data: [],
      message: e.response?.data?.message || "Error al cargar los detalles",
    };
  }
}
