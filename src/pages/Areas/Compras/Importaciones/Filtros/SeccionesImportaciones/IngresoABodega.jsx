import React, { useEffect, useState } from "react";
import {
  ObtenerArchivosBodega,
  RegistrarDocumentosBodega,
  UpdateMercaderiaEnBodega,
} from "services/importacionesService";
import { consultarPermisosPorModuloRuta } from "utils/functionsPermissions";
import { FormRow, ConfirmationDialog } from "components/common/FormComponents";
import {
  debeEstarBloqueado,
  renderField,
  renderizarCampoConPermisos,
  actualizarDatosTrasGuardado,
  formatoJSONArchivo,
} from "../../UtilsImportaciones";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomLoader } from "components/UI/CustomComponents/CustomLoader";

const BODEGA = ["COMPRAS", "BODEGA"];
const COMPRASGERENCIA = ["COMPRAS", "COMPRAS-GERENCIA"];
const IMPORTACIONES = ["COMPRAS", "IMPORTACIONES"];

// Funciones de utilidad para fechas y horas
const convertirHora12a24 = (hora12) => {
  if (!hora12) return null;

  const [time, modifier] = hora12.split(" ");
  let [hours, minutes] = time.split(":");

  if (hours === "12") hours = "00";
  if (hours < 10 && hours > 0) hours = "0" + hours;
  if (modifier === "PM") hours = parseInt(hours, 10) + 12;

  return `${hours}:${minutes}`;
};

const combinarFechaHora = (fecha, hora) => {
  if (!fecha || !hora) return null;

  const [dia, mes, año] = fecha.split("/");
  const hora24 = convertirHora12a24(hora);

  return new Date(`${año}-${mes}-${dia}T${hora24}`);
};

const esFormatoHoraValido = (hora) => {
  if (!hora) return false;

  const regexHora = /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/;
  return regexHora.test(hora);
};

export const IngresoABodega = ({
  datos,
  setDatos,
  actualizar,
  permisosProp,
}) => {
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    FECHA_LLEGADA_REAL: {
      id: "FECHA_LLEGADA_REAL",
      tipo: "fecha",
      label: "Fecha Real Llegada Bodega:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    HORA_LLEGADA_REAL: {
      id: "HORA_LLEGADA_REAL",
      tipo: "hora",
      label: "Hora Real Llegada Bodega:",
      defaultValue: "",
      component: "TimeInput",
    },
    FECHA_FECHA_DESCARGA: {
      id: "FECHA_FECHA_DESCARGA",
      tipo: "fecha",
      label: "Fecha de Descarga en Bodega:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    HORA_FECHA_DESCARGA: {
      id: "HORA_FECHA_DESCARGA",
      tipo: "hora",
      label: "Hora de Descarga en Bodega:",
      defaultValue: "",
      component: "TimeInput",
    },
    CONFIRME_IMPORTACION: {
      id: "CONFIRME_IMPORTACION",
      tipo: "select",
      label: "Recibí Confirme de Importación:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "NORMAL" },
          { value: 2, name: "CON OBSERVACIONES" },
        ],
      },
    },
    ARCHIVOS_BODEGA: {
      id: "ARCHIVOS_BODEGA",
      tipo: "archivos",
      label: "Archivos de Bodega:",
      defaultValue: [],
      component: "CampoListaArchivos",
      props: {
        aceptados: ".docx,.xlsx,.pdf,.csv,.rar,.7z,.zip",
        id: 4,
        limite: 4,
      },
    },
    VALIDACION_INGRESO_BODEGA: {
      id: "VALIDACION_INGRESO_BODEGA",
      tipo: "select",
      label: "Validación de Ingreso a Bodega de Ventas:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "NORMAL" },
          { value: 2, name: "CON OBSERVACIONES" },
        ],
      },
    },
    OBSERVACION_BODEGA: {
      id: "OBSERVACION_BODEGA",
      tipo: "textarea",
      label: "Observaciones:",
      defaultValue: "",
      component: "TextArea",
      shouldRenderByDatosForm: (datos) =>
        datos.VALIDACION_INGRESO_BODEGA === "CON OBSERVACIONES",
    },
  };

  // Estados principales
  const [campos, setCampos] = useState(null);
  const [datosForm, setDatosForm] = useState({});
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actualizacionExitosa, setActualizacionExitosa] = useState(0);
  const [permisos, setPermisos] = useState({
    bodega: [],
    compras: [],
    comprasGerencias: [],
  });
  const [todosLlenos, setTodosLlenos] = useState(false);

  // Verificar si todos los campos requeridos están llenos
  useEffect(() => {
    if (!datosForm) return;

    // Validar formato de horas
    const horaLlegadaValida =
      !datosForm.HORA_LLEGADA_REAL ||
      esFormatoHoraValido(datosForm.HORA_LLEGADA_REAL);
    const horaDescargaValida =
      !datosForm.HORA_FECHA_DESCARGA ||
      esFormatoHoraValido(datosForm.HORA_FECHA_DESCARGA);

    // Función auxiliar para verificar pares fecha-hora
    const parCompletoFechaHora = (fecha, hora) => {
      // Ambos vacíos es válido
      if (fecha === "" && hora === "") return true;
      // Ambos llenos y hora con formato válido es válido
      if (fecha !== "" && hora !== "" && esFormatoHoraValido(hora)) return true;
      // Cualquier otra combinación no es válida
      return false;
    };

    // Comprobar que todos los campos obligatorios estén llenos y con formato correcto
    const camposCompletos =
      parCompletoFechaHora(
        datosForm.FECHA_LLEGADA_REAL,
        datosForm.HORA_LLEGADA_REAL
      ) &&
      parCompletoFechaHora(
        datosForm.FECHA_FECHA_DESCARGA,
        datosForm.HORA_FECHA_DESCARGA
      ) &&
      datosForm.VALIDACION_INGRESO_BODEGA !== "" &&
      // Si tiene observaciones, el campo de observaciones debe estar lleno
      (datosForm.VALIDACION_INGRESO_BODEGA !== "CON OBSERVACIONES" ||
        datosForm.OBSERVACION_BODEGA !== "");

    // Verificar que no haya inconsistencias en los pares fecha-hora
    const camposFechaHoraValidos =
      (datosForm.FECHA_LLEGADA_REAL === "" ||
        (datosForm.HORA_LLEGADA_REAL !== "" && horaLlegadaValida)) &&
      (datosForm.HORA_LLEGADA_REAL === "" ||
        datosForm.FECHA_LLEGADA_REAL !== "") &&
      (datosForm.FECHA_FECHA_DESCARGA === "" ||
        (datosForm.HORA_FECHA_DESCARGA !== "" && horaDescargaValida)) &&
      (datosForm.HORA_FECHA_DESCARGA === "" ||
        datosForm.FECHA_FECHA_DESCARGA !== "");

    setTodosLlenos(
      camposCompletos &&
        camposFechaHoraValidos &&
        horaLlegadaValida &&
        horaDescargaValida &&
        datos.ESTADO_IMPORTACION === "EN PROCESO"
    );
  }, [datosForm, datos]);

  const ConsultarArchivosBodega = async () => {
    try {
      const id = parseInt(datos.ID_CARGA);

      const respB = await ObtenerArchivosBodega({ id });
      const archivosBodega = respB.data.map(formatoJSONArchivo);

      return {
        bodega: archivosBodega,
      };
    } catch (error) {
      console.error("Error al consultar archivos de bodega:", error);
      return { bodega: [] };
    }
  };

  // Guardar datos
  const guardarMercaderiaBodega = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);

      // Combinar fechas y horas
      const fecha_hora_llegada_bodega = combinarFechaHora(
        datosForm.FECHA_LLEGADA_REAL,
        datosForm.HORA_LLEGADA_REAL
      );

      const fecha_hora_descarga_bodega = combinarFechaHora(
        datosForm.FECHA_FECHA_DESCARGA,
        datosForm.HORA_FECHA_DESCARGA
      );

      // Procesar archivos
      const archivos = datosForm.ARCHIVOS_BODEGA || [];
      const documentosDOCS = archivos.filter((item) => item.doc !== undefined);
      const documentosDOCS1 = documentosDOCS.map((item) => item.doc);

      // Actualizar información general
      const res = await UpdateMercaderiaEnBodega({
        id,
        fecha_hora_llegada_bodega,
        fecha_hora_descarga_bodega,
        confirme_importacion: datosForm.CONFIRME_IMPORTACION,
        validacion_bodega_ventas: datosForm.VALIDACION_INGRESO_BODEGA,
        observacion_bodega: datosForm.OBSERVACION_BODEGA || "",
        etapa: 8,
      });

      // Registrar documentos si los hay
      let res1 = { data: true };
      if (documentosDOCS.length > 0) {
        res1 = await RegistrarDocumentosBodega({
          id,
          archivos: documentosDOCS1,
        });
      }

      if (res?.data?.update === 1 && res1.data) {
        setActualizacionExitosa(1);

        actualizarDatosTrasGuardado({
          datos,
          datosForm,
          setDatos,
          setDatosIniciales,
          campos,
          setCamposBloqueados,
        });

        return true;
      } else {
        setActualizacionExitosa(2);
        return false;
      }
    } catch (error) {
      console.error("Error en guardarMercaderiaBodega:", error);
      setActualizacionExitosa(2);
      return false;
    }
  };

  // Inicialización del componente
  useEffect(() => {
    const inicializarComponente = async () => {
      if (!datos) return;

      setCampos(CAMPOS_INICIALES);
      setDatosIniciales({ ...datos });

      // Inicializar formulario con valores de datos
      const initialData = Object.values(CAMPOS_INICIALES).reduce(
        (acc, campo) => {
          acc[campo.id] = datos[campo.id] || campo.defaultValue;
          return acc;
        },
        {}
      );
      setDatosForm(initialData);

      // Obtener documentos existentes solo si hay un ID
      if (datos.ID_CARGA) {
        const respDocumentos = await ConsultarArchivosBodega();

        // Actualizar el estado del formulario con los documentos recuperados
        setDatosForm((prev) => ({
          ...prev,
          ARCHIVOS_BODEGA: respDocumentos.bodega || [],
        }));
      }

      // Usar permisos recibidos desde props
      setPermisos({
        bodega: permisosProp?.bodega || [],
        compras: permisosProp?.compras || [],
        comprasGerencias: permisosProp?.comprasGerencias || [],
      });
    };

    inicializarComponente();
  }, [permisosProp]);

  // Evaluar bloqueos de campos
  useEffect(() => {
    if (!datos || !campos) return;

    const nuevoEstado = {};
    Object.values(campos).forEach((campo) => {
      const valor =
        datosForm && datosForm[campo.id] !== undefined
          ? datosForm[campo.id]
          : datos[campo.id];

      nuevoEstado[campo.id] = debeEstarBloqueado(
        campo,
        valor,
        datos.ESTADO_IMPORTACION,
        !!datos.ID_CARGA,
        datosIniciales,
        {
          permisosCompras: permisos.compras,
          permisosBodega: permisos.bodega,
          permisosComprasGerencias: permisos.comprasGerencias,
        }
      );
    });

    setCamposBloqueados(nuevoEstado);
  }, [datos, datosForm, campos, datosIniciales, permisos]);

  // Determinar si mostrar botón de edición
  // Para BODEGA: pueden editar si tienen permisos de bodega y todos los campos están llenos
  const mostrarBotonEdicionBodega =
    permisos.bodega.length > 0 &&
    permisos.compras.length === 0 &&
    permisos.comprasGerencias.length === 0 &&
    todosLlenos &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Para COMPRAS: pueden editar si no son gerencia, todos los campos están llenos y la importación está EN PROCESO
  const mostrarBotonEdicionCompras =
    permisos.comprasGerencias.length === 0 &&
    permisos.compras.length > 0 &&
    permisos.bodega.length === 0 && // No debe tener permisos de BODEGA
    todosLlenos &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  const mostrarBotonEdicion =
    mostrarBotonEdicionBodega || mostrarBotonEdicionCompras;

  // Renderizado del componente
  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        INGRESO A BODEGA
        {mostrarBotonEdicion && (
          <CustomButton
            onClick={() => setMostrarConfirmacion(true)}
            pcolor={({ theme }) => theme.colors.secondary}
            iconLeft="FaSave"
            width="35px"
            height="35px"
          />
        )}
      </SectionImportacionesTitle>

      {!campos ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <CustomLoader />
        </div>
      ) : (
        <FormImportacionesGrid>
          {/* Usamos Object.values para mapear los campos de forma más limpia */}
          {Object.values(campos).map((campo) => {
            return renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              {
                permisosCompras: permisos.compras,
                permisosBodega: permisos.bodega,
              },
              {
                siempreVisibles: [
                  "FECHA_LLEGADA_REAL",
                  "HORA_LLEGADA_REAL",
                  "FECHA_FECHA_DESCARGA",
                  "HORA_FECHA_DESCARGA",
                  "CONFIRME_IMPORTACION",
                  "ARCHIVOS_BODEGA",
                  "VALIDACION_INGRESO_BODEGA",
                ],
              },
              {},
              {}
            );
          })}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={guardarMercaderiaBodega}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={() => {
          setMostrarConfirmacion(false);
          setActualizacionExitosa(0);
          actualizar();
        }}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
      >
        {campos &&
          Object.values(campos).map((campo) => {
            const valor = datosForm[campo.id];

            if (campo.tipo === "archivos") {
              return (
                <div key={campo.id}>
                  <b>{campo.label}</b>{" "}
                  {Array.isArray(valor) && valor.length > 0
                    ? valor
                        .map(
                          (file) =>
                            `${file.nombreArchivo || ""}${
                              file.extensionArchivo
                                ? "." + file.extensionArchivo
                                : ""
                            }`
                        )
                        .join(" / ")
                    : "Ninguno"}
                </div>
              );
            }

            return (
              <div key={campo.id}>
                <b>{campo.label}</b> {valor}
              </div>
            );
          })}
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
