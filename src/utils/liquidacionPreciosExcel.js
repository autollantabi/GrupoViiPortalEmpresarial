import * as XLSX from "xlsx";

/**
 * Lectura y validación previa del Excel "Liquidación de costos de importación"
 * (layout de SAP Business One) antes de mandarlo al backend.
 *
 * Cabecera (celdas de texto con el rótulo y el valor juntos, "Rótulo:   valor"):
 *   LIQUIDACIÓN DE COSTOS DE IMPORTACIÓN NRO: ...   Proveedor: ...
 *   Fecha de liquidación: dd/mm/aaaa                PI #: ...    DAI: ...
 *
 * Detalle: las columnas se ubican por el rótulo de la fila de encabezado (el
 * rótulo puede venir partido en dos filas: "Total" arriba y "FOB" abajo), no
 * por la letra de la columna. La "Descripción" no se lee: se muestra desde dim_item.
 */

/* Rótulo normalizado (sin tildes, minúsculas, solo letras y números) -> campo del backend */
const COLUMNAS = {
  codigo: "codigo_item",
  und: "unidad",
  cant: "cantidad",
  fob: "fob",
  totalfob: "total_fob",
  advfodinfa: "adv_fodinfa",
  totaladvfodinfa: "total_adv_fodinfa",
  gastos: "gastos",
  totalgastos: "total_gastos",
  costo: "costo",
  totalcosto: "total_costo",
  pvd: "pvd",
  ultimocosto: "ultimo_costo",
  variacion: "variacion",
};

const CAMPOS_NUMERICOS = [
  "cantidad",
  "fob",
  "total_fob",
  "adv_fodinfa",
  "total_adv_fodinfa",
  "gastos",
  "total_gastos",
  "costo",
  "total_costo",
  "pvd",
  "ultimo_costo",
  "variacion",
];

/* Sin estos dos el artículo no sirve; el resto de columnas deben existir pero pueden venir vacías */
const CAMPOS_OBLIGATORIOS_FILA = ["cantidad", "total_fob"];

const normalizar = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const textoCelda = (valor) => String(valor ?? "").replace(/\s+/g, " ").trim();

/** "1.234,56" / "1,234.56" / "18.5707" / 18.5707 -> number; vacío o texto -> null */
const aNumero = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let s = String(valor).trim().replace(/\s/g, "");
  if (!s || !/^[-+]?[\d.,]+$/.test(s)) return null;
  const ultimaComa = s.lastIndexOf(",");
  const ultimoPunto = s.lastIndexOf(".");
  if (ultimaComa > -1 && ultimoPunto > -1) {
    // El separador que aparece último es el decimal
    s = ultimaComa > ultimoPunto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (ultimaComa > -1) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** dd/mm/aaaa (o un Date de Excel) -> aaaa-mm-dd; null si no es una fecha válida */
const aFechaISO = (valor) => {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    const y = valor.getFullYear();
    const m = String(valor.getMonth() + 1).padStart(2, "0");
    const d = String(valor.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const m = String(valor ?? "").match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return null;
  const [, dia, mes, anio] = m;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  if (fecha.getFullYear() !== Number(anio) || fecha.getMonth() !== Number(mes) - 1 || fecha.getDate() !== Number(dia)) {
    return null;
  }
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};

/** Valor que sigue al rótulo en una celda tipo "Rótulo:   valor" */
const valorTrasRotulo = (texto, rotuloNormalizado) => {
  if (normalizar(texto).indexOf(rotuloNormalizado) === -1) return null;
  const idx = String(texto).indexOf(":");
  if (idx === -1) return null;
  return textoCelda(String(texto).slice(idx + 1));
};

const leerHoja = async (archivo) => {
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: "array", cellDates: true });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) throw new Error("El archivo no tiene hojas");
  // Matriz fila x columna; defval evita huecos para poder indexar por columna
  return XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true, defval: null });
};

const leerCabecera = (filas, errores) => {
  const cabecera = {
    numero_importacion: null,
    proveedor: null,
    fecha_liquidacion: null,
    numero_pi: null,
    dai: null,
  };
  const reglas = [
    ["numero_importacion", "liquidaciondecostosdeimportacionnro"],
    ["proveedor", "proveedor"],
    ["fecha_liquidacion", "fechadeliquidacion"],
    ["numero_pi", "pi"],
    ["dai", "dai"],
  ];

  // La cabecera está en las primeras filas; el detalle empieza más abajo
  filas.slice(0, 20).forEach((fila) => {
    (fila || []).forEach((celda) => {
      if (celda === null || celda === undefined) return;
      const texto = celda instanceof Date ? null : String(celda);
      if (!texto) return;
      reglas.forEach(([campo, rotulo]) => {
        if (cabecera[campo]) return;
        // "PI #" normaliza a "pi": se exige coincidencia exacta del rótulo para no confundirlo con otras celdas
        const antesDePuntos = normalizar(texto.split(":")[0]);
        if (antesDePuntos !== rotulo) return;
        const valor = valorTrasRotulo(texto, rotulo);
        if (valor) cabecera[campo] = valor;
      });
    });
  });

  const etiquetas = {
    numero_importacion: "LIQUIDACIÓN DE COSTOS DE IMPORTACIÓN NRO",
    proveedor: "Proveedor",
    fecha_liquidacion: "Fecha de liquidación",
    numero_pi: "PI #",
    dai: "DAI",
  };
  Object.entries(etiquetas).forEach(([campo, etiqueta]) => {
    if (!cabecera[campo]) errores.push(`No se encontró el dato "${etiqueta}"`);
  });

  if (cabecera.fecha_liquidacion) {
    const iso = aFechaISO(cabecera.fecha_liquidacion);
    if (!iso) errores.push(`La fecha de liquidación "${cabecera.fecha_liquidacion}" no es válida (se espera dd/mm/aaaa)`);
    cabecera.fecha_liquidacion = iso;
  }

  return cabecera;
};

const leerDetalle = (filas, errores) => {
  const idxEncabezado = filas.findIndex((fila) =>
    (fila || []).some((c) => normalizar(c) === "codigo")
  );
  if (idxEncabezado === -1) {
    errores.push('No se encontró la fila de encabezado de artículos (columna "Código")');
    return [];
  }

  // Rótulo de cada columna = fila anterior + fila del encabezado ("Total" + "FOB" -> totalfob)
  const previa = filas[idxEncabezado - 1] || [];
  const encabezado = filas[idxEncabezado] || [];
  const columnas = {};
  const ancho = Math.max(previa.length, encabezado.length);
  for (let col = 0; col < ancho; col += 1) {
    const rotulo = normalizar(`${previa[col] ?? ""}${encabezado[col] ?? ""}`);
    const campo = COLUMNAS[rotulo];
    if (campo && columnas[campo] === undefined) columnas[campo] = col;
  }

  const faltantes = Object.entries(COLUMNAS)
    .filter(([, campo]) => columnas[campo] === undefined)
    .map(([rotulo]) => rotulo);
  if (faltantes.length > 0) {
    errores.push(`Faltan columnas en el detalle: ${faltantes.join(", ")}`);
    return [];
  }

  const articulos = [];
  for (let i = idxEncabezado + 1; i < filas.length; i += 1) {
    const fila = filas[i] || [];
    const codigo = textoCelda(fila[columnas.codigo_item]);
    if (!codigo) continue;

    const articulo = { codigo_item: codigo, unidad: textoCelda(fila[columnas.unidad]) || null };
    CAMPOS_NUMERICOS.forEach((campo) => {
      articulo[campo] = aNumero(fila[columnas[campo]]);
    });

    // Debajo de los artículos el layout trae otros bloques (gastos, subtotales, firmas) con texto
    // en la primera columna: no son artículos porque no tienen cantidad ni total FOB.
    const esArticulo = CAMPOS_OBLIGATORIOS_FILA.every((campo) => articulo[campo] !== null);
    if (!esArticulo) continue;

    articulos.push({ ...articulo, _fila: i + 1 });
  }

  if (articulos.length === 0) errores.push("No se encontraron artículos en el detalle");
  return articulos;
};

/**
 * Tabla "Costos de liquidación" (debajo de los artículos, solo informativa): encabezado Costos / Importe /
 * Factor y una fila por costo hasta "Subtotal costos". Subtotal, Advaloren Fodinfa y Total
 * costos no se leen: se calculan al mostrar.
 */
const leerCostos = (filas, errores) => {
  const idxEncabezado = filas.findIndex((fila) => {
    const rotulos = (fila || []).map(normalizar);
    return rotulos.includes("costos") && rotulos.includes("importe") && rotulos.includes("factor");
  });
  // Los costos son solo informativos: sin tabla de costos el archivo es válido
  if (idxEncabezado === -1) return [];

  const encabezado = (filas[idxEncabezado] || []).map(normalizar);
  const colCosto = encabezado.indexOf("costos");
  const colImporte = encabezado.indexOf("importe");
  const colFactor = encabezado.indexOf("factor");

  const costos = [];
  for (let i = idxEncabezado + 1; i < filas.length; i += 1) {
    const fila = filas[i] || [];
    // El bloque termina en "Subtotal costos" (esa fila trae el texto en otra columna)
    if (fila.some((c) => normalizar(c).startsWith("subtotalcostos"))) break;

    const descripcion = textoCelda(fila[colCosto]);
    if (!descripcion) continue;

    const importe = aNumero(fila[colImporte]);
    // Una fila de costo sin importe numérico no es un costo: se omite (no bloquea la carga)
    if (importe === null) continue;
    costos.push({ costo: descripcion, importe, factor: aNumero(fila[colFactor]) });
  }

  return costos;
};

/**
 * Lee un archivo y devuelve { cabecera, detalle, costos, errores }. Si `errores` no está
 * vacío el archivo no debe enviarse al backend.
 */
export const leerExcelLiquidacion = async (archivo) => {
  const errores = [];
  try {
    const nombre = String(archivo?.name || "");
    if (!/\.(xlsx|xls)$/i.test(nombre)) {
      return { cabecera: null, detalle: [], costos: [], errores: ["Solo se admiten archivos de Excel (.xlsx)"] };
    }
    const filas = await leerHoja(archivo);
    const cabecera = leerCabecera(filas, errores);
    const detalle = leerDetalle(filas, errores);
    const costos = leerCostos(filas, errores);
    return { cabecera, detalle, costos, errores };
  } catch (error) {
    console.error("Error leyendo el Excel de liquidación:", error);
    return { cabecera: null, detalle: [], costos: [], errores: ["No se pudo leer el archivo de Excel"] };
  }
};

/**
 * Lee varios archivos; cada uno es una liquidación independiente (una importación
 * de hec_importaciones puede tener varios PI, cada uno con su Excel). No se exige
 * que coincidan número, PI ni DAI. Devuelve { liquidaciones, errores } con los
 * errores prefijados por archivo; si hay alguno no debe enviarse nada.
 */
export const leerExcelsLiquidacion = async (archivos) => {
  const errores = [];
  const liquidaciones = [];

  for (const archivo of archivos) {
    const r = await leerExcelLiquidacion(archivo);
    r.errores.forEach((e) => errores.push(`${archivo.name}: ${e}`));
    if (r.errores.length === 0) {
      liquidaciones.push({
        nombre_archivo: archivo.name,
        numero_importacion: r.cabecera.numero_importacion,
        numero_pi: r.cabecera.numero_pi,
        fecha_liquidacion: r.cabecera.fecha_liquidacion,
        dai: r.cabecera.dai,
        detalle: r.detalle.map(({ _fila, ...a }) => a),
        costos: r.costos,
      });
    }
  }

  return errores.length > 0 ? { liquidaciones: [], errores } : { liquidaciones, errores: [] };
};
