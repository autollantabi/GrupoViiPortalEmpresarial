import { axiosInstanceNew } from "config/axiosConfig";

/**
 * Iniciar sesión
 * @param {string} correo - Correo electrónico del usuario
 * @param {string} contrasena - Contraseña del usuario
 * @returns {Promise<{success: boolean, message: string}>} - Resultado de la operación
 */
export async function authService_login({ correo, contrasena }) {
  try {
    const response = await axiosInstanceNew.post("/auth/login", {
      correo,
      contrasena,
    });
    return {
      success: true,
      message: response.data.message,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return { success: false, message: error.response.data.message };
  }
}

/**
 * Enviar correo de recuperación de contraseña
 * @param {string} correo - Correo electrónico del usuario
 * @returns {Promise<{success: boolean, message: string}>} - Resultado de la operación
 */
export async function authService_enviarCorreoRecuperacion({ correo }) {
  try {
    const response = await axiosInstanceNew.post(
      "/reset-password/request",
      { correo }
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return { success: false, message: error.response.data.message };
  }
}

/**
 * Verificar token de recuperación de contraseña
 * @param {string} token - Token de recuperación de contraseña
 * @param {string} otp - OTP de recuperación de contraseña
 * @returns {Promise<{success: boolean, message: string}>} - Resultado de la operación
 */
export async function authService_verificarTokenRecuperacion({
  token,
  otp,
}) {
  try {
    const response = await axiosInstanceNew.post(
      "/reset-password/verify-otp",
      { token, otp }
    );

    return {
      success: true,
      message: response.data.message,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return { success: false, message: error.response.data.message };
  }
}



/**
 * Actualizar contraseña
 * @param {string} token - Token de recuperación de contraseña
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<{success: boolean, message: string}>} - Resultado de la operación
 */
export async function authService_actualizarContrasena({
  token,
  newPassword,
}) {
  try {
    const response = await axiosInstanceNew.post(
      "/reset-password/resPss",
      { token, newPassword }
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return { success: false, message: error.response.data.message };
  }
}
