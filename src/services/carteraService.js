import { axiosInstance, axiosInstanceNew } from "config/axiosConfig";

export async function ListarEmpresasCartera(correo) {
  try {
    const res = await axiosInstance.get(
      `/usuario/datos/empresa/${correo}`
    );
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function ListarClientesPorEmpresaCartera({ correo, empresaId }) {
  try {
    const res = await axiosInstance.get(
      `/transaccion/clientes/${correo}/${empresaId}`
    );

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function ListarVendedoresPorEmpresaCartera({ empresaId }) {
  try {
    const res = await axiosInstance.get(`/vendedor/${empresaId}`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function ListarChequesCartera() {
  try {
    const res = await axiosInstance.get(`/cheques/obtenerCheques/`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function InsertarChequeCartera({ data }) {
  try {
    const res = await axiosInstance.post(`/cheques/insertarCheque/`, data);

    if (res.status === 200) {
      return { id: res.data.id, creacion: true };
    }
    return { creacion: false };
  } catch (e) {
    return { creacion: false };
  }
}

export async function ActualizarChequeCartera({ data }) {
  try {
    const res = await axiosInstance.post(`/cheques/actualizarCheque/`, data);

    if (res.status === 200) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function ConsultarListaBancos() {
  try {
    const res = await axiosInstance.get(`/bancos`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}

/** Transacciones Bancarias Nuevo BackEnd */

/**
 * Consultar transacciones bancarias *principal*
 * @param {Object} fechaInicio - Fecha de inicio del filtro
 * @param {Object} fechaFin - Fecha de fin del filtro
 * @returns {Promise<Array>} Lista de transacciones bancarias
 */

export async function consultarTodasTransaccionesBancarias({
  fechaInicio,
  fechaFin,
}) {
  try {
    const res = await axiosInstanceNew.get(
      `/transacciones/${fechaInicio}/${fechaFin}`
    );
    return {
      success: true,
      data: res.data.data || [],
      message: res.data.message || "Transacciones consultadas correctamente.",
    };
  } catch (e) {
    return {
      success: false,
      data: [],
      message: `Error al consultar transacciones bancarias: ${e.message}`,
    };
  }
}

/**
 * Actualizar transaccion por id
 * @param {Object} id - ID de la transaccion
 * @param {Object} data - Datos de la transaccion
 * @returns {Promise<Array>} Resultado de la operacion
 */
export async function actualizarTransaccionBancariaPorID(id, data) {
  try {
    const res = await axiosInstanceNew.patch(`/transacciones/${id}`, data);
    return {
      success: true,
      data: res.data.data || [],
      message: res.data.message || "Transaccion actualizada correctamente.",
    };
  } catch (e) {
    return {
      success: false,
      data: [],
      message: `Error al actualizar transaccion por id: ${e.message}`,
    };
  }
}

/**
 * Actualizar estado de transaccion por id
 * @param {number} id - ID de la transaccion
 * @param {string} estado - Estado nuevo (-1, 0, 1, 2, 3, 4)
 * @param {number} usuario - ID del usuario que está realizando la acción
 * @param {string} comentario - Comentario sobre el cambio de estado
 * @param {string} ingreso - Información de ingreso (opcional)
 * @returns {Promise<Array>} Resultado de la operacion
 */
export async function actualizarEstadoTransaccionBancariaPorID(
  id,
  estado,
  usuario,
  comentario,
  ingreso = ""
) {
  try {
    const res = await axiosInstanceNew.patch(
      `/transacciones/estado/${id}/${estado}/${usuario}`,
      {
        comentario,
        ingreso,
      }
    );
    return {
      success: true,
      data: res.data.data || [],
      message:
        res.data.message || "Estado de transaccion actualizado correctamente.",
    };
  } catch (e) {
    return {
      success: false,
      data: [],
      message: `Error al actualizar estado de transaccion por id: ${e.message}`,
    };
  }
}


/**
 * Consulta los vendedores de una empresa
 * @param {string} empresa - ID o nombre de la empresa
 * @returns {Promise<Array>} Lista de vendedores de la empresa
 */
export async function ConsultarVendedoresPorEmpresa(empresa) {
  try {
    const res = await axiosInstance.get(`/vendedor/${empresa}`);

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar vendedores de empresa:", error);
    return [];
  }
}

/**
 * Consulta los clientes para una empresa
 * @param {string} correo - Correo del usuario
 * @param {string} empresa - ID de la empresa
 * @returns {Promise<Array>} Lista de clientes
 */
export async function ConsultarClientesPorEmpresa(correo, empresa) {
  try {
    const res = await axiosInstance.get(
      `/transaccion/clientes/${correo}/${empresa}`
    );

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar clientes:", error);
    return [];
  }
}
