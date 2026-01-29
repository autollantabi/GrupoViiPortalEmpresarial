/**
 * Utilidades para encriptar y desencriptar datos
 * Usa una clave del archivo .env para encriptar/desencriptar
 */

/**
 * Encripta un texto usando una clave
 * @param {string} text - Texto a encriptar
 * @param {string} key - Clave de encriptación
 * @returns {string} - Texto encriptado en base64
 */
export const encrypt = (text, key) => {
  if (!text || !key) return null;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(char ^ keyChar);
  }
  
  // Convertir a base64 para almacenamiento seguro
  return btoa(result);
};

/**
 * Desencripta un texto encriptado
 * @param {string} encryptedText - Texto encriptado en base64
 * @param {string} key - Clave de encriptación
 * @returns {string} - Texto desencriptado
 */
export const decrypt = (encryptedText, key) => {
  if (!encryptedText || !key) return null;
  
  try {
    // Convertir de base64
    const text = atob(encryptedText);
    let result = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(char ^ keyChar);
    }
    
    return result;
  } catch (error) {
    console.error("Error al desencriptar:", error);
    return null;
  }
};

/**
 * Obtiene la clave de encriptación desde las variables de entorno
 * @returns {string} - Clave de encriptación
 */
import { ENCRYPTION_KEY } from "config/env";

export const getEncryptionKey = () => {
  return ENCRYPTION_KEY;
};

