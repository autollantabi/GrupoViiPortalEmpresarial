import { axiosInstance } from "config/axiosConfig";

export async function ListarEmpresasCartera() {
  try {
    const res = await axiosInstance.get(
      `/usuario/datos/empresa/${localStorage.getItem("correo")}`
    );
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
export async function ListarClientesPorEmpresaCartera({ empresaId }) {
  try {
    const res = await axiosInstance.get(
      `/transaccion/clientes/${localStorage.getItem("correo")}/${empresaId}`
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

// Añadir estas nuevas funciones al final del archivo existente

export async function consultarTodasTransaccionesBancarias() {
  try {
    const res = await axiosInstance.get(`/transaccion`);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (e) {
    return [];
  }
}
/**
 * Consulta el historial de transacciones de un usuario
 * @returns {Promise<Array>} Lista de transacciones del usuario
 */
export async function ConsultarHistorialUsuario() {
  try {
    const res = await axiosInstance.get(
      `/versionamiento/usuario/${localStorage.getItem("correo")}`
    );

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar historial de usuario:", error);
    return [];
  }
}

/**
 * Consulta el historial de transacciones con filtros
 * @param {Object} params - Parámetros de filtrado
 * @param {string} params.banco - ID del banco o "TODOS"
 * @param {string} params.empresa - ID de la empresa
 * @param {string|Date|null} params.fechaInicio - Fecha de inicio del filtro
 * @param {string|Date|null} params.fechaFin - Fecha de fin del filtro
 * @returns {Promise<Array>} Lista de transacciones filtradas
 */
export async function ConsultarHistorialConFiltros({
  banco,
  empresa,
  fechaInicio,
  fechaFin,
}) {
  try {
    const bancoParam = banco === "" ? "TODOS" : banco;

    // Si fechaInicio es null, usar un mes antes como fecha inicial
    let fechaInicioParam;
    if (fechaInicio === null) {
      const fechaActual = new Date();
      const fechaUnMesAtras = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() - 1,
        fechaActual.getDate()
      );
      fechaInicioParam = fechaUnMesAtras.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    } else {
      fechaInicioParam = fechaInicio;
    }

    // Si fechaFin es null, usar la fecha actual
    let fechaFinParam;
    if (fechaFin === null) {
      const fechaActual = new Date();
      fechaFinParam = fechaActual.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    } else {
      fechaFinParam = fechaFin;
    }

    const res = await axiosInstance.get(
      `/versionamiento/banco/fecha/${localStorage.getItem(
        "correo"
      )}/${bancoParam}/${empresa}/${fechaInicioParam}/${fechaFinParam}`
    );

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar historial con filtros:", error);
    return [];
  }
}

// Añade las siguientes funciones al final del archivo:

/**
 * Consulta las transacciones de un usuario
 * @returns {Promise<Array>} Lista de transacciones del usuario
 */
export async function ConsultarTransaccionesUsuario() {
  try {
    const res = await axiosInstance.get(
      `/transaccion/usuario/${localStorage.getItem("correo")}`
    );


    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar transacciones de usuario:", error);
    return [];
  }
}

/**
 * Consulta las transacciones con filtros
 * @param {Object} params - Parámetros de filtrado
 * @param {string} params.banco - ID del banco o "TODOS"
 * @param {string} params.empresa - ID de la empresa
 * @param {string|Date|null} params.fechaInicio - Fecha de inicio del filtro
 * @param {string|Date|null} params.fechaFin - Fecha de fin del filtro
 * @returns {Promise<Array>} Lista de transacciones filtradas
 */
export async function ConsultarTransaccionesConFiltros({
  banco,
  empresa,
  fechaInicio,
  fechaFin,
}) {
  try {
    const bancoParam = banco === "" ? "TODOS" : banco;

    // Si fechaInicio es null, usar un mes antes como fecha inicial
    let fechaInicioParam;
    if (fechaInicio === null) {
      const fechaActual = new Date();
      const fechaUnMesAtras = new Date(
        fechaActual.getFullYear(),
        fechaActual.getMonth() - 1,
        fechaActual.getDate()
      );
      fechaInicioParam = fechaUnMesAtras.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    } else {
      fechaInicioParam = fechaInicio;
    }

    // Si fechaFin es null, usar la fecha actual
    let fechaFinParam;
    if (fechaFin === null) {
      const fechaActual = new Date();
      fechaFinParam = fechaActual.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    } else {
      fechaFinParam = fechaFin;
    }

    const res = await axiosInstance.get(
      `/transaccion/banco/fecha/${localStorage.getItem(
        "correo"
      )}/${bancoParam}/${empresa}/${fechaInicioParam}/${fechaFinParam}`
    );
    console.log(res);

    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar transacciones con filtros:", error);
    return [];
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
 * @param {string} empresa - ID de la empresa
 * @returns {Promise<Array>} Lista de clientes
 */
export async function ConsultarClientesPorEmpresa(empresa) {
  try {
    const res = await axiosInstance.get(
      `/transaccion/clientes/${localStorage.getItem("correo")}/${empresa}`
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

/**
 * Consulta una transacción por su ID
 * @param {number} id - ID de la transacción
 * @returns {Promise<Object>} Detalles de la transacción
 */
export async function ConsultarTransaccionPorID(id) {
  try {
    const res = await axiosInstance.get(`/transaccion/${id}`);

    if (res.status === 200 && res.data.length > 0) {
      return res.data[0];
    }
    return null;
  } catch (error) {
    console.error(`Error al consultar transacción con ID ${id}:`, error);
    return null;
  }
}

/**
 * Actualiza el estado de una transacción
 * @param {Object} params - Parámetros para actualizar el estado
 * @param {number} params.id - ID de la transacción
 * @param {string} params.estado - Estado nuevo (-1, 0, 1, 2, 3, 4)
 * @param {string} params.comentario - Comentario sobre el cambio de estado
 * @param {string} params.ingreso - Información de ingreso (opcional)
 * @returns {Promise<boolean>} Resultado de la operación
 */
export async function ActualizarEstadoTransaccion({
  id,
  estado,
  comentario,
  ingreso = "",
  identificadorUsuario,
}) {
  try {
    const res = await axiosInstance.post(
        `/transaccion/estado/${id}/${estado}/${identificadorUsuario}`,
      {
        comentario: comentario.toUpperCase(),
        ingreso: estado === "3" ? ingreso.toUpperCase() : "",
      }
    );

    return res.status === 200;
  } catch (error) {
    console.error("Error al actualizar estado de transacción:", error);
    return false;
  }
}

/**
 * Actualiza los datos de una transacción
 * @param {Object} params - Parámetros para actualizar la transacción
 * @returns {Promise<boolean>} Resultado de la operación
 */
export async function ActualizarTransaccion(formData) {
  try {
    const res = await axiosInstance.post(
      `/transaccion/${formData.id}`,
      formData
    );
    console.log(res);

    return res.status === 200;
  } catch (error) {
    console.error("Error al actualizar transacción:", error);
    return false;
  }
}
