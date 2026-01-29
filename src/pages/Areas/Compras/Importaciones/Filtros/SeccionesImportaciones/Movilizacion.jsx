import React, { useEffect, useState } from "react";
import {
  ConsultarTransportistas,
  EnviarCorreoBodega,
  UpdateMovilizacion,
} from "services/importacionesService";
import { FormRow, ConfirmationDialog } from "components/common/FormComponents";
import {
  debeEstarBloqueado,
  renderField,
  fromDDMMYYYYToDate,
  actualizarDatosTrasGuardado,
  renderizarCampoConPermisos,
} from "../../UtilsImportaciones";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { obtenerCorreosAEnviar } from "../../PermisosModulo";
import { listCorreosEnvioBodega } from "../../CorreosTemporal";

const correosDestinatarios = listCorreosEnvioBodega();

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

export const Movilizacion = ({ datos, setDatos, actualizar, permisosProp, rolesUsuario = [] }) => {
  // Usar el rol que viene como prop (ya calculado en el router)
  const roles = rolesUsuario.length > 0 ? rolesUsuario : [];

  const tieneRolVentas = roles.includes("usuario");
  const tieneRolBodega = roles.includes("bodega");
  const tieneRolJefatura = roles.includes("jefatura");
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    FECHA_FECHA_SALIDA_BODEGA: {
      id: "FECHA_FECHA_SALIDA_BODEGA",
      tipo: "fecha",
      label: "Fecha Salida de Puerto a Bodega:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    HORA_FECHA_SALIDA_BODEGA: {
      id: "HORA_FECHA_SALIDA_BODEGA",
      tipo: "hora",
      label: "Hora Salida de Puerto a Bodega:",
      defaultValue: "",
      component: "InputTimeUI",
    },
    FECHA_LLEGADA_ESTIMADA_BODEGA: {
      id: "FECHA_LLEGADA_ESTIMADA_BODEGA",
      tipo: "fecha",
      label: "Fecha Llegada a Bodega:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      getDynamicProps: (datosForm) => ({
        minFecha: datosForm["FECHA_SALIDA_BODEGA"] || "",
      }),
    },
    HORA_LLEGADA_ESTIMADA_BODEGA: {
      id: "HORA_LLEGADA_ESTIMADA_BODEGA",
      tipo: "hora",
      label: "Hora Llegada a Bodega:",
      defaultValue: "",
      component: "InputTimeUI",
    },
    TRANSPORTE_ASIGNADO: {
      id: "TRANSPORTE_ASIGNADO",
      tipo: "select",
      label: "Transportista Asignado:",
      defaultValue: "",
      component: "SelectsConInput",
      options: [],
      shouldRenderByDatos: (datos) => datos.EMPRESA !== "AUTOMAX",
    },
  };

  // Estados principales
  const [campos, setCampos] = useState(null);
  const [datosForm, setDatosForm] = useState({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actualizacionExitosa, setActualizacionExitosa] = useState(0);

  // Estados específicos para este componente
  const [transportistas, setTransportistas] = useState([]);
  const [enviandoCorreos, setEnviandoCorreos] = useState(0);
  const [listaDeCorreosParaEnviar, setListaDeCorreosParaEnviar] = useState([]);
  const [todosLlenos, setTodosLlenos] = useState(false);

  // Verificar si todos los campos requeridos están llenos
  useEffect(() => {
    if (!datosForm) return;

    const esAutomax = datos.EMPRESA === "AUTOMAX";

    if (esAutomax) {
      // Validar formato de horas
      const horaSalidaBodega =
        !datosForm.HORA_FECHA_SALIDA_BODEGA ||
        esFormatoHoraValido(datosForm.HORA_FECHA_SALIDA_BODEGA);
      const horaLlegadaBodega =
        !datosForm.HORA_LLEGADA_ESTIMADA_BODEGA ||
        esFormatoHoraValido(datosForm.HORA_LLEGADA_ESTIMADA_BODEGA);

      // Función auxiliar para verificar pares fecha-hora
      const parCompletoFechaHora = (fecha, hora) => {
        // Ambos vacíos es válido
        if (fecha === "" && hora === "") return true;
        // Ambos llenos y hora con formato válido es válido
        if (fecha !== "" && hora !== "" && esFormatoHoraValido(hora))
          return true;
        // Cualquier otra combinación no es válida
        return false;
      };

      // Comprobar que todos los campos obligatorios estén llenos y con formato correcto
      const camposCompletos =
        parCompletoFechaHora(
          datosForm.FECHA_FECHA_SALIDA_BODEGA,
          datosForm.HORA_FECHA_SALIDA_BODEGA
        ) &&
        parCompletoFechaHora(
          datosForm.FECHA_LLEGADA_ESTIMADA_BODEGA,
          datosForm.HORA_LLEGADA_ESTIMADA_BODEGA
        );

      // Verificar que no haya inconsistencias en los pares fecha-hora
      const camposFechaHoraValidos =
        (datosForm.FECHA_FECHA_SALIDA_BODEGA === "" ||
          (datosForm.HORA_FECHA_SALIDA_BODEGA !== "" && horaSalidaBodega)) &&
        (datosForm.HORA_FECHA_SALIDA_BODEGA === "" ||
          datosForm.FECHA_FECHA_SALIDA_BODEGA !== "") &&
        (datosForm.FECHA_LLEGADA_ESTIMADA_BODEGA === "" ||
          (datosForm.HORA_LLEGADA_ESTIMADA_BODEGA !== "" &&
            horaLlegadaBodega)) &&
        (datosForm.HORA_LLEGADA_ESTIMADA_BODEGA === "" ||
          datosForm.FECHA_LLEGADA_ESTIMADA_BODEGA !== "");

      setTodosLlenos(
        camposCompletos &&
          camposFechaHoraValidos &&
          horaSalidaBodega &&
          horaLlegadaBodega &&
          datos.ESTADO_IMPORTACION === "EN PROCESO"
      );
    } else {
      // Para otras empresas: solo validar estado
      setTodosLlenos(datos.ESTADO_IMPORTACION === "EN PROCESO");
    }
  }, [datosForm, datos]);

  // Consultar transportistas
  const consultarTransportistas = async () => {
    try {
      const transportistasVar = await ConsultarTransportistas();
      if (transportistasVar && transportistasVar.data) {
        setTransportistas(transportistasVar.data);

        // Actualizar las opciones del campo TRANSPORTE_ASIGNADO
        setCampos((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            TRANSPORTE_ASIGNADO: {
              ...prev.TRANSPORTE_ASIGNADO,
              options: transportistasVar.data,
            },
          };
        });
      }
    } catch (error) {
      console.error("Error al consultar transportistas:", error);
    }
  };

  // Verificar si se deben mostrar los controles de edición
  // Para COMPRAS (ventas): pueden editar si no son gerencia, todos los campos están llenos y la importación está EN PROCESO
  const mostrarBotonEdicionCompras =
    !tieneRolJefatura &&
    tieneRolVentas &&
    !tieneRolBodega && // No debe tener rol de BODEGA
    todosLlenos &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Para BODEGA: pueden editar si tienen rol de bodega (sin necesidad de todos los campos llenos para AUTOMAX)
  const mostrarBotonEdicionBodega =
    tieneRolBodega &&
    !tieneRolVentas &&
    !tieneRolJefatura &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  const mostrarBotonEdicion =
    mostrarBotonEdicionCompras || mostrarBotonEdicionBodega;

  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
  };

  // Enviar correo a bodega
  const envioCorreoBodega = async (id) => {
    try {
      setEnviandoCorreos(1);
      await EnviarCorreoBodega({
        idImportacion: id,
        destinatarios: listaDeCorreosParaEnviar,
      });
      setEnviandoCorreos(2);
      return true;
    } catch (error) {
      console.error("Error al enviar correo a bodega:", error);
      setEnviandoCorreos(0);
      return false;
    }
  };

  // Guardar datos
  const uptMovilizacion = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);
      const esAutomax = datos.EMPRESA === "AUTOMAX";

      const horaDefecto = "12:00 AM";

      const fecha_salida_bodega = combinarFechaHora(
        datosForm.FECHA_FECHA_SALIDA_BODEGA,
        esAutomax ? datosForm.HORA_FECHA_SALIDA_BODEGA : horaDefecto
      );

      // Convertir fechas
      // let fecha_salida_bodega = null;
      // if (datosForm.FECHA_SALIDA_BODEGA !== "") {
      //   fecha_salida_bodega = fromDDMMYYYYToDate(datosForm.FECHA_SALIDA_BODEGA);
      // }

      const fecha_estimada_bodega = combinarFechaHora(
        datosForm.FECHA_LLEGADA_ESTIMADA_BODEGA,
        esAutomax ? datosForm.HORA_LLEGADA_ESTIMADA_BODEGA : horaDefecto
      );

      // let fecha_estimada_bodega = null;
      // if (datosForm.LLEGADA_ESTIMADA_BODEGA !== "") {
      //   fecha_estimada_bodega = fromDDMMYYYYToDate(
      //     datosForm.LLEGADA_ESTIMADA_BODEGA
      //   );
      // }

      const transportista_asignado = datosForm.TRANSPORTE_ASIGNADO;

      const res = await UpdateMovilizacion({
        id,
        fecha_salida_bodega,
        fecha_estimada_bodega,
        transportista_asignado,
        etapa: 7,
      });

      if (res?.data?.update === 1) {
        // 1. Primero actualizar el estado de éxito
        setActualizacionExitosa(1);

        // 2. Actualizar todos los datos inmediatamente
        actualizarDatosTrasGuardado({
          datos,
          datosForm,
          setDatos,
          setDatosIniciales,
          campos,
          setCamposBloqueados,
        });

        // 3. Verificar si se deben enviar correos
        const camposRequeridos =
          fecha_salida_bodega !== null &&
          fecha_estimada_bodega !== null &&
          transportista_asignado !== "";

        if (
          datos.DOCUMENTOS_PARA_BODEGA &&
          datos.DOCUMENTOS_PARA_BODEGA.length > 0 &&
          camposRequeridos &&
          !tieneRolJefatura &&
          tieneRolVentas
        ) {
          await envioCorreoBodega(id);
        }

        return true;
      } else {
        setActualizacionExitosa(2);
        return false;
      }
    } catch (error) {
      console.error("Error en uptMovilizacion:", error);
      setActualizacionExitosa(2);
      return false;
    }
  };

  // 1. EFECTO DE INICIALIZACIÓN - SE EJECUTA SOLO UNA VEZ AL MONTAR
  useEffect(() => {
    const inicializarComponente = async () => {
      if (!datos) return;

      // Establecer campos
      setCampos(CAMPOS_INICIALES);

      // Guardar datos iniciales
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

      const esAutomax = datos.EMPRESA === "AUTOMAX";

      if (!esAutomax) {
        // Consultar datos adicionales solo una vez
        await consultarTransportistas();
      }

      // Los permisos ahora se basan en roles, no necesitamos setear estados

      // Preparar correos
      const correosAEnviar = obtenerCorreosAEnviar(
        correosDestinatarios,
        datos.EMPRESA,
        datos.MARCA
      );
      setListaDeCorreosParaEnviar(correosAEnviar);

      // Marcar como ya inicializado
      setCargaInicial(false);
    };

    inicializarComponente();
  }, [permisosProp]);

  // 2. EFECTO PARA EVALUAR BLOQUEOS - SE EJECUTA CUANDO CAMBIAN LOS DATOS O EL FORMULARIO
  useEffect(() => {
    const evaluarCamposBloqueados = () => {
      if (!datos || !campos) return;

      // Obtener variables comunes para evaluación
      const tieneID = !!datos.ID_CARGA;
      const estadoImportacion = datos.ESTADO_IMPORTACION;

      // Evaluar bloqueo de cada campo
      const nuevoEstado = {};
      Object.values(campos).forEach((campo) => {
        // Preferir valor del formulario si existe
        const valor =
          datosForm && datosForm[campo.id] !== undefined
            ? datosForm[campo.id]
            : datos[campo.id];

        nuevoEstado[campo.id] = debeEstarBloqueado(
          campo,
          valor,
          estadoImportacion,
          tieneID,
          datosIniciales,
          { 
            permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
            permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : [],
            permisosComprasGerencias: tieneRolJefatura ? [{ empresa: "ALL" }] : []
          }
        );
      });

      setCamposBloqueados(nuevoEstado);
    };

    evaluarCamposBloqueados();
  }, [
    datos,
    datosForm,
    campos,
    datosIniciales,
    tieneRolVentas,
    tieneRolBodega,
    tieneRolJefatura,
  ]);

  // Definir reglas específicas para este componente
  const reglasVisibilidad = {
    soloCompras: [],
    soloBodega: [],
    siempreVisibles: [
      "FECHA_FECHA_SALIDA_BODEGA",
      "HORA_FECHA_SALIDA_BODEGA",
      "FECHA_LLEGADA_ESTIMADA_BODEGA",
      "HORA_LLEGADA_ESTIMADA_BODEGA",
      "TRANSPORTE_ASIGNADO",
    ], // Campos visibles para todos los usuarios
    // Nueva función para determinar visibilidad condicional basada en la empresa
    esVisible: (campo) => {
      // Campos de hora solo visibles para AUTOMAX
      if (
        (campo.id === "HORA_FECHA_SALIDA_BODEGA" ||
          campo.id === "HORA_LLEGADA_ESTIMADA_BODEGA") &&
        datos.EMPRESA !== "AUTOMAX"
      ) {
        return false;
      }
      return true;
    },
  };

  // Definir transformaciones para campos específicos
  const transformacionesCampos = {
    FECHA_SALIDA_BODEGA: {
      bodega: {
        component: "InputField",
        props: { tipo: "text", readOnly: true },
        bloqueo: "siempre",
        options: undefined,
      },
    },
    LLEGADA_ESTIMADA_BODEGA: {
      bodega: {
        component: "InputField",
        props: { tipo: "text", readOnly: true },
        bloqueo: "siempre",
        options: undefined,
      },
    },
    TRANSPORTE_ASIGNADO: {
      bodega: {
        component: "InputField",
        props: { tipo: "text", readOnly: true },
        bloqueo: "siempre",
        options: undefined,
      },
    },
  };

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        MOVILIZACIÓN
        {mostrarBotonEdicion && (
          <ButtonUI
            onClick={() => setMostrarConfirmacion(true)}
            pcolor={({ theme }) => theme.colors.secondary}
            iconLeft="FaFloppyDisk"
            width="35px"
            height="35px"
          />
        )}
      </SectionImportacionesTitle>

      {!campos ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <LoaderUI />
        </div>
      ) : (
        <FormImportacionesGrid>
          {Object.values(campos).map((campo) => {
            // Configuración de campos especiales
            const camposEspeciales = {
              // Manejo especial para TRANSPORTE_ASIGNADO
              TRANSPORTE_ASIGNADO: (campoTransformado, opciones) =>
                renderField(
                  { ...campoTransformado, options: transportistas },
                  opciones
                ),
            };
            // Usar la función utilitaria para renderizar
            return renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              { 
                permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
                permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : []
              },
              reglasVisibilidad,
              transformacionesCampos,
              camposEspeciales
            );
          })}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={uptMovilizacion}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
        loading={enviandoCorreos === 1}
        loadingMessage="Guardando y enviando correos en caso de ser necesario..."
      >
        {campos &&
          Object.values(campos) // Filtrar para mostrar solo los campos visibles según empresa
            .filter(
              (campo) =>
                !(
                  (campo.id === "HORA_FECHA_SALIDA_BODEGA" ||
                    campo.id === "HORA_LLEGADA_ESTIMADA_BODEGA") &&
                  datos.EMPRESA !== "AUTOMAX"
                )
            )
            .filter(
              (campo) =>
                !campo.shouldRenderByDatos || campo.shouldRenderByDatos(datos)
            )
            .map((campo) => {
              const valor = datosForm[campo.id];

              // Para el transportista, mostrar el nombre en lugar del ID
              if (campo.id === "TRANSPORTE_ASIGNADO" && valor !== "") {
                const transportista = transportistas.find(
                  (t) => t.value == valor
                );
                return (
                  <div key={campo.id}>
                    <b>{campo.label}</b>{" "}
                    {transportista ? transportista.name : valor}
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
