/**
 * Validación de identificaciones ecuatorianas: cédula (10 dígitos) y RUC (13).
 * Misma lógica que valida el backend al crear el cliente
 * (services/IdentificacionEcuadorService.ts).
 *
 * Devuelve el "Tipo de Identificación" de Localización Ecuador > ATS:
 * "01" = RUC, "02" = Cédula.
 */

export const TIPO_DOCUMENTO_RUC = "01";
export const TIPO_DOCUMENTO_CEDULA = "02";

const COEFICIENTES_MODULO10 = [2, 1, 2, 1, 2, 1, 2, 1, 2];
const COEFICIENTES_SOCIEDAD_PRIVADA = [4, 3, 2, 7, 6, 5, 4, 3, 2];
const COEFICIENTES_SECTOR_PUBLICO = [3, 2, 7, 6, 5, 4, 3, 2];

const digitos = (texto) => texto.split("").map(Number);

/* Provincias 01-24 y 30 (ecuatorianos registrados en el exterior) */
const provinciaValida = (identificacion) => {
  const provincia = Number(identificacion.slice(0, 2));
  return (provincia >= 1 && provincia <= 24) || provincia === 30;
};

const cedulaValida = (diez) => {
  if (!/^\d{10}$/.test(diez) || !provinciaValida(diez)) return false;

  const d = digitos(diez);
  if (d[2] > 5) return false;

  const suma = COEFICIENTES_MODULO10.reduce((acc, coef, i) => {
    const producto = d[i] * coef;
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);

  return (10 - (suma % 10)) % 10 === d[9];
};

const verificadorModulo11 = (base, coeficientes) => {
  const suma = coeficientes.reduce((acc, coef, i) => acc + base[i] * coef, 0);
  const residuo = suma % 11;
  return residuo === 0 ? 0 : 11 - residuo;
};

const invalida = (mensaje) => ({ valida: false, tipo: null, tipoDocumento: null, mensaje });

/**
 * @param {string} identificacion Sin la "C" inicial
 * @returns {{valida: boolean, tipo: ("RUC"|"CEDULA"|null), tipoDocumento: ("01"|"02"|null), mensaje: (string|null)}}
 */
export function validarIdentificacionEcuador(identificacion) {
  const valor = String(identificacion ?? "").trim();

  if (!valor) return invalida("La identificación es requerida");
  if (!/^\d+$/.test(valor)) return invalida("La identificación solo puede contener números");

  if (valor.length === 10) {
    return cedulaValida(valor)
      ? { valida: true, tipo: "CEDULA", tipoDocumento: TIPO_DOCUMENTO_CEDULA, mensaje: null }
      : invalida("La cédula no es válida");
  }

  if (valor.length !== 13) {
    return invalida("La identificación debe ser una cédula (10 dígitos) o un RUC (13 dígitos)");
  }

  if (!provinciaValida(valor)) return invalida("El RUC no es válido: código de provincia incorrecto");

  const d = digitos(valor);
  const ruc = { valida: true, tipo: "RUC", tipoDocumento: TIPO_DOCUMENTO_RUC, mensaje: null };

  if (d[2] <= 5) {
    if (!cedulaValida(valor.slice(0, 10)) || Number(valor.slice(10)) < 1) {
      return invalida("El RUC de persona natural no es válido");
    }
    return ruc;
  }

  if (d[2] === 9) {
    if (
      verificadorModulo11(d, COEFICIENTES_SOCIEDAD_PRIVADA) !== d[9] ||
      Number(valor.slice(10)) < 1
    ) {
      return invalida("El RUC de sociedad privada no es válido");
    }
    return ruc;
  }

  if (d[2] === 6) {
    if (
      verificadorModulo11(d, COEFICIENTES_SECTOR_PUBLICO) !== d[8] ||
      Number(valor.slice(9)) < 1
    ) {
      return invalida("El RUC de entidad pública no es válido");
    }
    return ruc;
  }

  return invalida(
    "El RUC no es válido: el tercer dígito no corresponde a ningún tipo de contribuyente"
  );
}
