import React from "react";

import {
  InputField,
  SelectBasico,
  SelectsConInput,
  SelectsFechas,
  CampoListaArchivos,
  TextArea,
} from "./Filtros/Selects";
import { FormRow } from "components/common/FormComponents";
import TimeInput from "components/UI/CustomComponents/TimeInput";
import { CustomCheckboxField } from "components/UI/CustomComponents/CustomComponents";

/**
 * Renderiza un campo de formulario según su definición
 * @param {Object} campo - Definición del campo
 * @param {Object} options - Opciones de configuración
 * @returns {JSX.Element} Componente renderizado
 */
export const renderField = (campo, options) => {
  const { datos, datosForm, setDatosForm, camposBloqueados = {} } = options;

  // Función que actualiza datosForm (y opcionalmente datos)
  const handleChange = (nombreCampo, valor) => {
    // Durante la edición, sólo actualizar datosForm
    if (setDatosForm) {
      setDatosForm((prev) => ({
        ...prev,
        [nombreCampo]: valor,
      }));
    }
  };

  // Propiedades comunes para todos los componentes
  const commonProps = {
    nombreCampo: campo.id,
    onChange: campo.onChange || handleChange,
  };

  // Propiedades específicas de cada componente
  let componentProps = {
    ...campo.props,
    ...commonProps,
  };

  // Añadir propiedades dinámicas si existen
  if (campo.getDynamicProps) {
    componentProps = {
      ...componentProps,
      ...campo.getDynamicProps(datosForm, datos, camposBloqueados),
    };
  }
  // Por este código corregido:
  if (
    campo.shouldRenderByDatosForm &&
    !campo.shouldRenderByDatosForm(datosForm)
  ) {
    // Si la función shouldRender existe y devuelve false, no renderizamos este campo
    return null;
  }
  // Por este código corregido:
  if (campo.shouldRenderByDatos && !campo.shouldRenderByDatos(datos)) {
    // Si la función shouldRender existe y devuelve false, no renderizamos este campo
    return null;
  }
  // Estado de bloqueo del campo actual
  const bloqueado = camposBloqueados[campo.id] || false;

  // Función helper para obtener el valor del campo (primero datosForm, luego datos)
  const getFieldValue = (fieldId) => {
    // Primero intentar obtener de datosForm, luego de datos como fallback
    return datosForm && datosForm[fieldId] !== undefined
      ? datosForm[fieldId]
      : (datos && datos[fieldId]) || "";
  };

  const getOptionsWithPriority = (componentProps, campo) => {
    return (
      componentProps?.options || // Primero opciones dinámicas
      campo.props?.options || // Luego opciones estáticas en props
      campo.options || // Luego opciones estáticas en campo
      [] // Array vacío como fallback
    );
  };

  let renderedComponent = null;

  // Propiedades específicas por tipo de componente
  switch (campo.component) {
    case "SelectsConInput":
      renderedComponent = (
        <SelectsConInput
          {...componentProps}
          options={getOptionsWithPriority(componentProps, campo)}
          valueInfo={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;
    case "InputField":
      renderedComponent = (
        <InputField
          {...componentProps}
          tipo={componentProps.tipo || "text"}
          valor={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;

    case "SelectsFechas":
      renderedComponent = (
        <SelectsFechas
          {...componentProps}
          value={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;

    case "SelectBasico":
      renderedComponent = (
        <SelectBasico
          {...componentProps}
          options={getOptionsWithPriority(componentProps, campo)}
          defaultValue={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;

    case "TextArea":
      renderedComponent = (
        <TextArea
          {...componentProps}
          setValue={handleChange}
          valor={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;

    case "CampoListaArchivos":
      renderedComponent = (
        <CampoListaArchivos
          {...componentProps}
          setArchivo={handleChange}
          archivos={getFieldValue(campo.id) || []}
          impFinalizado={componentProps.impFinalizado || bloqueado}
        />
      );
      break;

    case "TimeInput":
      renderedComponent = (
        <TimeInput
          {...componentProps}
          valor={getFieldValue(campo.id)}
          readOnly={bloqueado}
        />
      );
      break;
    case "CheckboxField":
      renderedComponent = (
        <CustomCheckboxField
          {...componentProps}
          id={campo.id}
          name={campo.id}
          checked={getFieldValue(campo.id) === true}
          disabled={bloqueado}
        />
      );
      break;

    default:
      console.warn(`Tipo de componente no soportado: ${campo.component}`);
      renderedComponent = <>Componente no soportado</>;
  }

  return (
    <FormRow key={campo.id} label={campo.label}>
      {renderedComponent}
    </FormRow>
  );
};

/**
 * Determina si un campo debe estar bloqueado según su configuración
 * @param {Object} campo - Definición del campo
 * @param {any} valor - Valor actual del campo
 * @param {string} estadoImportacion - Estado actual de la importación
 * @param {boolean} tieneID - Si el registro tiene ID (siempre true en tu caso)
 * @param {Object} datosIniciales - Valores iniciales cargados al principio
 */
export const debeEstarBloqueado = (
  campo,
  valor,
  estadoImportacion,
  tieneID,
  datosIniciales = null
) => {
  // Si está configurado como "siempre", bloqueado independientemente del valor
  if (campo.bloqueo === "siempre") {
    return true;
  }

  // Si está configurado como "nunca" o no tiene configuración, nunca bloqueado
  if (campo.bloqueo === "nunca" || !campo.bloqueo) {
    return false;
  }

  // Estado actual de la importación
  const estaEnProceso = estadoImportacion === "EN PROCESO";

  // Si está configurado como "conValor"
  if (campo.bloqueo === "conValor") {
    // Si no tiene valor, nunca se bloquea
    if (!valor) {
      return false;
    }

    // Si está en proceso, solo bloqueamos si el valor no ha cambiado desde la carga inicial
    // Esto indica que el valor ya existe en la base de datos
    if (estaEnProceso && datosIniciales) {
      const valorInicial = datosIniciales[campo.id];
      // Si el valor ha cambiado (es nuevo), no bloqueamos
      if (valor !== valorInicial) {
        return false;
      }
    }

    // En otros casos, bloqueamos si tiene valor
    return !!valor;
  }

  // Por defecto no bloqueamos
  return false;
};

/**
 * Convierte un valor de string a float, eliminando comas
 * @param {string} valor - Valor a convertir
 * @returns {number|null} Valor convertido a float o null si no es válido
 */
export const stringToFloat = (valor) => {
  if (!valor) return null;
  const valorN = valor.toString().replace(",", "");
  return parseFloat(valorN);
};

/**
 * Convierte una fecha en formato dd/mm/yyyy a un objeto Date
 * @param {string} dateString - Fecha en formato dd/mm/yyyy
 * @returns {Date|null} Objeto Date o null si el formato es incorrecto
 */
export const fromDDMMYYYYToDate = (dateString) => {
  if (!dateString) return null;

  // Verifica que el formato sea el correcto (dd/mm/yyyy)
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }

  const [day, month, year] = dateString.split("/").map(Number);
  // Los meses en JavaScript son indexados desde 0, así que restamos 1
  const fecha = new Date(year, month - 1, day);
  return new Date(fecha.getTime() + 12 * 60 * 60 * 1000); // Ajuste de zona horaria
};

/**
 * Actualiza los datos después de una operación exitosa de guardado
 * @param {Object} params - Parámetros para la actualización
 * @param {Object} params.datos - Datos actuales
 * @param {Object} params.datosForm - Datos del formulario editado
 * @param {Function} params.setDatos - Función para actualizar datos
 * @param {Function} params.setDatosIniciales - Función para actualizar datos iniciales
 * @param {Object} params.campos - Definición de los campos del formulario
 * @param {Function} params.setCamposBloqueados - Función para actualizar el estado de bloqueo
 * @returns {Object} - Objeto con los datos actualizados
 */
export const actualizarDatosTrasGuardado = ({
  datos,
  datosForm,
  setDatos,
  setDatosIniciales,
  campos,
  setCamposBloqueados,
}) => {
  // 1. Crear objeto con datos actualizados primero
  const nuevosDatos = {
    ...datos,
    ...datosForm,
  };

  // 2. Actualizar datos con este objeto completo
  Object.entries(datosForm).forEach(([key, value]) => {
    setDatos(key, value);
  });

  // 3. Actualizar los datos iniciales después de guardar
  setDatosIniciales(nuevosDatos);

  // 4. Re-evaluar todos los campos según sus reglas de bloqueo
  const nuevoEstado = {};
  Object.values(campos).forEach((campo) => {
    const valor = datosForm[campo.id] || datos[campo.id];
    nuevoEstado[campo.id] = debeEstarBloqueado(
      campo,
      valor,
      nuevosDatos.ESTADO_IMPORTACION,
      true,
      nuevosDatos
    );
  });

  // 5. Actualizar el estado de bloqueo
  setCamposBloqueados(nuevoEstado);

  return nuevosDatos;
};

/**
 * Separa una fecha en formato ISO en dos partes: fecha (DD/MM/YYYY) y hora (HH:MM AM/PM)
 * @param {string} fechaISO - Fecha en formato ISO (e.j. 2025-05-12T05:02:00.000Z)
 * @returns {Object} - Objeto con la fecha y hora separadas o valores vacíos si la entrada es inválida
 */
export const separarFechaHora = (fechaISO) => {
  // Si no hay fecha o no es válida, devolvemos valores vacíos
  if (!fechaISO) return { fecha: "", hora: "" };

  try {
    // Crear objeto Date a partir de la fecha ISO
    const fecha = new Date(fechaISO);

    // Verificar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
      return { fecha: "", hora: "" };
    }

    // Extraer componentes de la fecha
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0"); // +1 porque los meses van de 0 a 11
    const anio = fecha.getFullYear();

    // Extraer componentes de la hora
    let horas = fecha.getHours();
    const minutos = fecha.getMinutes().toString().padStart(2, "0");
    const ampm = horas >= 12 ? "PM" : "AM";

    // Convertir a formato 12 horas
    horas = horas % 12;
    horas = horas ? horas : 12; // Si es 0, mostramos como 12
    const horasStr = horas.toString();

    // Formatear fecha y hora
    const fechaFormateada = `${dia}/${mes}/${anio}`;
    const horaFormateada = `${horasStr}:${minutos} ${ampm}`;

    return {
      fecha: fechaFormateada,
      hora: horaFormateada,
    };
  } catch (error) {
    console.error("Error al separar fecha y hora:", error);
    return { fecha: "", hora: "" };
  }
};

export const formatoJSONArchivo = (archivo) => {
  return {
    nombreArchivo: archivo.NOMBRE_ARCHIVO,
    extensionArchivo: archivo.EXTENSION,
    idDocumento: archivo.ID_DOCUMENTO,
  };
};

/**
 * Determina si un campo debe renderizarse según los permisos del usuario
 * @param {Object} campo - Definición del campo
 * @param {Object} permisos - Objeto con arrays de permisos (permisosCompras, permisosBodega, etc.)
 * @param {Object} [reglas] - Reglas de visibilidad para diferentes tipos de usuarios
 * @returns {boolean} - True si el campo debe renderizarse, false en caso contrario
 */
const debeRenderizarCampo = (campo, permisos, reglas = {}) => {
  const { permisosCompras = [], permisosBodega = [] } = permisos;

  // Reglas por defecto si no se especifican
  const reglasFinales = {
    soloCompras: [], // Campos visibles solo para usuarios con permisos de compras
    soloBodega: [], // Campos visibles solo para usuarios con permisos de bodega
    siempreVisibles: [], // Campos visibles para todos los usuarios
    ...reglas, // Sobrescribir con reglas específicas del componente
  };

  // Siempre mostrar campos críticos que deben verse en todos los casos
  if (reglasFinales.siempreVisibles.includes(campo.id)) {
    return true;
  }

  // Si tiene permisos de compras, mostrar todos excepto los exclusivos de bodega
  if (permisosCompras.length > 0) {
    return !reglasFinales.soloBodega.includes(campo.id);
  }

  // Si tiene permisos de bodega, mostrar los campos específicos de bodega
  if (permisosBodega.length > 0) {
    return reglasFinales.soloBodega.includes(campo.id);
  }

  // Por defecto, no mostrar campos a usuarios sin permisos relevantes
  return false;
};

/**
 * Transforma un campo según los permisos del usuario
 * @param {Object} campo - Definición del campo
 * @param {Object} permisos - Objeto con arrays de permisos (permisosCompras, permisosBodega, etc.)
 * @param {Object} [transformaciones] - Reglas de transformación para diferentes campos
 * @returns {Object} - Campo transformado según permisos
 */
const transformarCampoSegunPermisos = (
  campo,
  permisos,
  transformaciones = {}
) => {
  const { permisosCompras = [], permisosBodega = [] } = permisos;

  // Si no hay reglas de transformación para este campo, devolver sin cambios
  if (!transformaciones[campo.id]) return campo;

  // Obtener la regla de transformación para este campo
  const regla = transformaciones[campo.id];

  // Aplicar transformaciones según permisos
  if (
    permisosCompras.length === 0 &&
    permisosBodega.length > 0 &&
    regla.bodega
  ) {
    // Transformación para usuarios de bodega
    return { ...campo, ...regla.bodega };
  }

  // Otras transformaciones según sea necesario
  if (permisosCompras.length > 0 && regla.compras) {
    return { ...campo, ...regla.compras };
  }

  // Si no aplica ninguna transformación, devolver sin cambios
  return campo;
};

/**
 * Renderiza un campo con todas las transformaciones y permisos aplicados
 */
export const renderizarCampoConPermisos = (
  campo,
  options,
  permisos,
  reglas,
  transformaciones,
  camposEspeciales = {}
) => {
  const { datos, datosForm, setDatosForm, camposBloqueados } = options;

  // 1. Verificar si el campo debe renderizarse según permisos
  if (!debeRenderizarCampo(campo, permisos, reglas)) {
    return null;
  }

  // 1.5 Verificar regla personalizada de visibilidad (para campos de hora)
  if (reglas.esVisible && !reglas.esVisible(campo)) {
    return null;
  }

  // 2. Aplicar transformaciones según permisos
  const campoTransformado = transformarCampoSegunPermisos(
    campo,
    permisos,
    transformaciones
  );

  // 3. Preparar bloqueos actualizados
  let bloqueosActualizados = { ...camposBloqueados };

  // Si el campo transformado tiene bloqueo="siempre", forzar el bloqueo
  if (campoTransformado.bloqueo === "siempre") {
    bloqueosActualizados[campoTransformado.id] = true;
  }

  // 4. Manejar campos especiales que requieren procesamiento adicional
  if (camposEspeciales[campoTransformado.id]) {
    return camposEspeciales[campoTransformado.id](campoTransformado, {
      ...options,
      camposBloqueados: bloqueosActualizados,
    });
  }

  // 5. Renderizar campo con configuración actualizada
  return renderField(campoTransformado, {
    datos,
    datosForm,
    setDatosForm,
    camposBloqueados: bloqueosActualizados,
  });
};
