import React from "react";
import { useSearchParams } from "react-router-dom";
import { EditorAreasResponsables } from "../componentes/EditorAreasResponsables";
import { EditorCatalogoItems } from "../componentes/EditorCatalogoItems";
import { EditorPlantillas } from "../componentes/EditorPlantillas";
import { EditorTiposDocumento } from "../componentes/EditorTiposDocumento";
import { FiltroPastillas } from "../componentes/FiltroPastillas";
import { Contenedor, Encabezado, EnlaceVolver, Subtitulo, Titulo } from "../componentes/piezas";
import { RUTA_BASE } from "../utils/constantes";
import { SECCION_CONFIGURACION } from "../utils/constantesDotacion";

/**
 * Configuración de dotación y documentación.
 *
 * Vive DENTRO de la sección Colaboradores y no como opción de menú aparte: con un
 * ítem propio habría que otorgarle un recurso nuevo a cada usuario de RRHH en
 * usuarios_rol_contexto antes de que la opción apareciera, y la herencia por
 * prefijo no ayuda porque va de padre a hijo. Reutilizando `rrhh.colaboradores`,
 * quien ya gestiona Colaboradores ve esto desde el primer día.
 *
 * La sección activa va en la QUERY STRING y no en estado local, el mismo idioma
 * que usa ColListado para sus filtros: así el enlace es compartible ("mira la
 * configuración de plantillas") y recargar no devuelve a la primera pestaña.
 */

const SECCIONES = [
  { valor: SECCION_CONFIGURACION.PLANTILLAS, etiqueta: "Plantillas" },
  { valor: SECCION_CONFIGURACION.ITEMS, etiqueta: "Catálogo de artículos" },
  { valor: SECCION_CONFIGURACION.DOCUMENTOS, etiqueta: "Tipos de documento" },
  { valor: SECCION_CONFIGURACION.AREAS, etiqueta: "Áreas y responsables" },
];

const DESCRIPCION = {
  [SECCION_CONFIGURACION.PLANTILLAS]: "Qué recibe cada cargo, por empresa, área y línea.",
  [SECCION_CONFIGURACION.ITEMS]: "Los grupos y artículos que se pueden entregar.",
  [SECCION_CONFIGURACION.DOCUMENTOS]: "Los papeles que se le piden a un colaborador.",
  [SECCION_CONFIGURACION.AREAS]: "A quién le llega el aviso de cada grupo.",
};

export const ColConfiguracion = () => {
  const [parametros, setParametros] = useSearchParams();

  const seccion = SECCIONES.some((opcion) => opcion.valor === parametros.get("seccion"))
    ? parametros.get("seccion")
    : SECCION_CONFIGURACION.PLANTILLAS;

  const cambiar = (valor) => {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("seccion", valor);
    // replace para que cambiar de sección no llene el historial de entradas: el
    // botón atrás debe volver al tablero, no recorrer las cuatro pestañas.
    setParametros(siguientes, { replace: true });
  };

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={RUTA_BASE}>← Volver al tablero</EnlaceVolver>

      <Encabezado>
        <div>
          <Titulo>Configuración de dotación y documentos</Titulo>
          <Subtitulo>{DESCRIPCION[seccion]}</Subtitulo>
        </div>
      </Encabezado>

      <FiltroPastillas
        leyenda="Sección"
        opciones={SECCIONES}
        value={seccion}
        onChange={cambiar}
      />

      {seccion === SECCION_CONFIGURACION.PLANTILLAS && <EditorPlantillas />}
      {seccion === SECCION_CONFIGURACION.ITEMS && <EditorCatalogoItems />}
      {seccion === SECCION_CONFIGURACION.DOCUMENTOS && <EditorTiposDocumento />}
      {seccion === SECCION_CONFIGURACION.AREAS && <EditorAreasResponsables />}
    </Contenedor>
  );
};

export default ColConfiguracion;
