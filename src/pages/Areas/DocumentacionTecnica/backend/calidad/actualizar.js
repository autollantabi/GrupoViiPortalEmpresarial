/**
 * Arma el conjunto de datos de Calidad (el mismo formato de datos/calidad.json) después de calcular una corrida nueva.
 * Port de `_guardar` y de `--reemplazar-semana` del comando `cargar_calidad` del proyecto Django, pero sobre un archivo:
 * la base de TI es de solo lectura, así que el historial semanal vive en datos/calidad_vivo.json.
 *
 * Función pura (no lee ni escribe archivos): recibe los datos vigentes y el cálculo, y devuelve los datos nuevos.
 */
import { ATRIBUTOS_VALIDADOS, ATRIBUTOS_CLASIFICACION } from "./motor.js";

/** El viernes de la semana del día dado (como `viernes_de_la_semana` de Django): la evolución usa una corrida por viernes. */
export function viernesDeLaSemana(dia) {
  const lunes = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() - ((dia.getDay() + 6) % 7));
  const viernes = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 4);
  const dos = (n) => String(n).padStart(2, "0");
  return `${viernes.getFullYear()}-${dos(viernes.getMonth() + 1)}-${dos(viernes.getDate())}`;
}

/**
 * @param base    datos vigentes (corridas, resúmenes e historial anteriores)
 * @param calculo resultado de calcularCalidad(filas)
 * @param ahora   fecha de la corrida (se inyecta para poder probar)
 */
export function armarDatos(base, calculo, ahora = new Date()) {
  const semana = viernesDeLaSemana(ahora);
  const id = Math.max(0, ...base.corridas.map((c) => c.id)) + 1;
  // Una corrida por semana: las anteriores de la misma semana que vinieron de la base se reemplazan (las de CSV no cuentan)
  const reemplazadas = new Set(base.corridas.filter((c) => c.semana === semana && !c.origen.startsWith("CSV")).map((c) => c.id));
  const quedan = (corridaId) => !reemplazadas.has(corridaId);

  return {
    corrida_detalle: id,
    atributos_indice: [...ATRIBUTOS_VALIDADOS],
    atributos_aparte: [...ATRIBUTOS_CLASIFICACION],
    perfiles: calculo.perfiles,
    corridas: [
      ...base.corridas.filter((c) => quedan(c.id)),
      {
        id,
        semana,
        fecha_hora: ahora.toISOString().replace("T", " ").replace("Z", ""), // UTC, como lo guarda Django
        origen: "PostgreSQL",
        registros: calculo.registros,
        indice_general: calculo.indice,
      },
    ],
    resumen_atributos: [
      ...base.resumen_atributos.filter((r) => quedan(r.corrida_id)),
      ...calculo.resumenAtributos.map((r) => ({ corrida_id: id, ...r })),
    ],
    resumen_empresas: [
      ...base.resumen_empresas.filter((r) => quedan(r.corrida_id)),
      ...calculo.resumenEmpresas.map((r) => ({ corrida_id: id, ...r })),
    ],
    historial: [
      ...base.historial.filter((h) => quedan(h[0])),
      ...calculo.historial.map(([empresa, codigo, score]) => [id, empresa, codigo, score]),
    ],
    items: calculo.items,
  };
}
