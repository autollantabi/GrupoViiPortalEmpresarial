// Función para formatear valores con punto para decimales (sin separación de miles)
const formatearValor = (valor) => {
  const numero = parseFloat(valor || 0);
  return numero.toFixed(2);
};

// Configuración de columnas para la tabla de transacciones bancarias
export const columnasTablaTransacciones = [
  {
    key: "IDENTIFICADOR",
    header: "ID",
    className: "uns",
    width: "50px",
  },
  {
    key: "NUMERO_DOCUMENTO",
    header: "N. DOCUMENTO",
    className: "uns",
    width: "80px",
  },
  {
    key: "FECHA_TRANSACCION",
    header: "FECHA",
    className: "uns",
    width: "70px",
  },
  {
    key: "VALOR",
    header: "VALOR",
    className: "uns",
    width: "70px",
    format: (valor) => `$ ${formatearValor(valor)}`,
  },
  {
    key: "AGENCIA",
    header: "AGENCIA",
    className: "uns",
    width: "70px",
  },
  {
    key: "TIPO_TRANSACCION",
    header: "TIPO",
    className: "uns",
    width: "40px",
  },
  {
    key: "CONCEPTO_TRANSACCION",
    header: "CONCEPTO TRANSACCIÓN",
    className: "uns",
    width: "180px",
  },
  {
    key: "REFERENCIA_BANCO",
    header: "REF. BANCO",
    className: "uns",
    width: "80px",
  },
  {
    key: "CLIENTE_BANCO",
    header: "CLIENTE BANCO",
    className: "uns",
    width: "110px",
  },
  {
    key: "CLIENTE",
    header: "CLIENTE",
    className: "uns",
    width: "130px",
    format: (valor, transaccion) => {
      if (!valor) return "";
      return `${valor}${
        transaccion.CODIGO_SOCIO ? ` - ${transaccion.CODIGO_SOCIO}` : ""
      }`;
    },
  },
  {
    key: "COMENTARIO",
    header: "COMENTARIO",
    className: "uns",
    width: "70px",
  },
  {
    key: "VENDEDOR",
    header: "VENDEDOR",
    className: "uns",
    width: "100px",
  },
  {
    key: "INGRESO",
    header: "INGRESO",
    className: "uns",
    width: "50px",
  },
  {
    key: "ESTADO",
    header: "ESTADO",
    className: "",
    width: "20px",
    isEstado: true,
  },
];

// Mapeo de clases CSS para estados
export const clasesEstado = {
  2: "fila-verde",
  1: "fila-amarillo",
  "-1": "fila-roja",
  3: "fila-rosa",
  4: "fila-azul",
  0: "fila-default",
};

// Función para obtener nombre del estado
export const getNombreEstado = (estado) => {
  const nombres = {
    0: "Pendiente",
    1: "Incompleto",
    "-1": "No Identificado",
    2: "Completo",
    3: "Garantía",
    4: "Tarjeta",
  };
  return nombres[estado] || "";
};

// Función para obtener colores del chip de estado
export const getColorEstado = (estado) => {
  const colores = {
    0: { bg: "#e9ecef", text: "#495057" }, // Pendiente - Gris
    1: { bg: "#fff3cd", text: "#856404" }, // Incompleto - Amarillo
    "-1": { bg: "#f8d7da", text: "#721c24" }, // No Ident. - Rojo
    2: { bg: "#d4edda", text: "#155724" }, // Completo - Verde
    3: { bg: "#e2d9f3", text: "#5a2a82" }, // Garantía - Púrpura
    4: { bg: "#d1ecf1", text: "#0c5460" }, // Tarjeta - Azul
  };
  return colores[estado] || { bg: "#e9ecef", text: "#495057" };
};
