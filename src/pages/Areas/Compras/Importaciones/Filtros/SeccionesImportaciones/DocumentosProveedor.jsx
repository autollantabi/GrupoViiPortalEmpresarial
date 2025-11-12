import React, { useEffect, useState } from "react";
import {
  ConsultarDataPI,
  ConsultarFechaSalgoPagar,
  ConsultarPGs,
  Consultarpis,
  ConsultarTTED,
  EnviarCorreoBodega,
  InsertarIngresoFactProveedor,
  ListarImportaciones,
  ObtenerArchivosProveedor,
  RegistrarDocumentosProveedor,
  UpdatePGs,
} from "services/importacionesService";
import { obtenerCorreosAEnviar } from "../../PermisosModulo";
import { listCorreosEnvioBodega } from "../../CorreosTemporal";
import { consultarPermisosPorModuloRuta } from "utils/functionsPermissions";
import { ConfirmationDialog } from "components/common/FormComponents";
import {
  debeEstarBloqueado,
  renderField,
  fromDDMMYYYYToDate,
  actualizarDatosTrasGuardado,
  formatoJSONArchivo,
  renderizarCampoConPermisos,
} from "../../UtilsImportaciones";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomLoader } from "components/UI/CustomComponents/CustomLoader";

const correosDestinatarios = listCorreosEnvioBodega();
const BODEGA = ["COMPRAS", "BODEGA"];
const COMPRASGERENCIA = ["COMPRAS", "COMPRAS-GERENCIA"];
const IMPORTACIONES = ["COMPRAS", "IMPORTACIONES"];

// Ruta para documentos
const rutaBase = "importaciones/documentosBD/";
const rutaCarpeta = "importaciones/documentosC/";

export const DocumentosProveedor = ({
  datos,
  setDatos,
  actualizar,
  permisosProp,
}) => {
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    NUMERO_PI: {
      id: "NUMERO_PI",
      tipo: "select",
      label: "PI:",
      defaultValue: "",
      component: "SelectsConInput",
    },
    IMP: {
      id: "IMP",
      tipo: "input",
      label: "IMP:",
      defaultValue: "",
      component: "InputField",
    },
    FACTURA_RESERVA: {
      id: "FACTURA_RESERVA",
      tipo: "input",
      label: "Número Factura de Reserva:",
      defaultValue: "",
      component: "InputField",
      bloqueo: "siempre",
    },
    TIEMPO_TRANSITO_ESTIMADO: {
      id: "TIEMPO_TRANSITO_ESTIMADO",
      tipo: "input",
      label: "Tiempo de días de tránsito estimado:",
      defaultValue: "",
      component: "InputField",
      bloqueo: "siempre",
      props: { tipo: "number", entero: true },
    },
    FECHA_ENTREGA_REAL: {
      id: "FECHA_ENTREGA_REAL",
      tipo: "fecha",
      label: "Fecha Entrega Real Prov:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    ATD: {
      id: "ATD",
      tipo: "fecha",
      label: "ETD Real:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    ATA: {
      id: "ATA",
      tipo: "fecha",
      label: "ETA Real:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      getDynamicProps: (datosForm) => ({
        minFecha: datosForm["ATD"] || "",
      }),
    },
    FECHA_OPERACION: {
      id: "FECHA_OPERACION",
      tipo: "fecha",
      label: "Fecha Operación:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      shouldRenderByDatos: (datos) => datos.EMPRESA === "AUTOMAX",
    },
    ESTADO_DOCUMENTOS: {
      id: "ESTADO_DOCUMENTOS",
      tipo: "select",
      label: "Estado Liberación Documentos",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "FALTANTE" },
          { value: 1, name: "COMPLETO" },
        ],
      },
    },
    NUMERO_TRACKING: {
      id: "NUMERO_TRACKING",
      tipo: "input",
      label: "Número Tracking Documentos:",
      defaultValue: "",
      component: "InputField",
    },
    COMENTARIO_1: {
      id: "COMENTARIO_1",
      tipo: "textarea",
      label: "Comentario:",
      defaultValue: "",
      component: "TextArea",
      bloqueo: "siempre",
    },
    DOCUMENTOS_PARA_BODEGA: {
      id: "DOCUMENTOS_PARA_BODEGA",
      tipo: "archivo",
      label: "Documentos Bodega (PackingList):",
      defaultValue: [],
      component: "CampoListaArchivos",
      props: {
        aceptados: ".docx,.xlsx,.pdf,.csv,.rar,.7z,.zip",
        id: 4,
        limite: 5,
      },
      getDynamicProps: (datosForm, datos, camposBloqueados) => ({
        impFinalizado:
          camposBloqueados["DOCUMENTOS_PARA_BODEGA"] ||
          datos.ESTADO_IMPORTACION === "COMPLETO",
      }),
    },
    DOCUMENTOS: {
      id: "DOCUMENTOS",
      tipo: "archivo",
      label: "Documentos Restantes:",
      defaultValue: [],
      component: "CampoListaArchivos",
      props: {
        aceptados: ".docx,.xlsx,.pdf,.csv,.rar,.7z,.zip",
        id: 3,
        limite: 5,
      },
      getDynamicProps: (datosForm, datos, camposBloqueados) => ({
        impFinalizado:
          camposBloqueados["DOCUMENTOS"] ||
          datos.ESTADO_IMPORTACION === "COMPLETO",
      }),
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
  const [PIs, setPIs] = useState([]);
  const [permisosBodega, setPermisosBodega] = useState([]);
  const [permisosCompras, setPermisosCompras] = useState([]);
  const [permisosComprasGerencias, setPermisosComprasGerencias] = useState([]);
  const [enviandoCorreos, setEnviandoCorreos] = useState(0);
  const [listaDeCorreosParaEnviar, setListaDeCorreosParaEnviar] = useState([]);

  console.log(datos);

  // Consultar PIs disponibles
  const ConsultarPIs = async () => {
    const pis = await Consultarpis(datos.EMPRESA);

    const transformedData = pis.map((item, index) => ({
      value: item.PI,
      name: item.PI,
    }));
    const dataImportaciones = await ListarImportaciones();

    const filteredData = transformedData.filter(
      (item) =>
        !dataImportaciones.some(
          (importacion) =>
            importacion.NUMERO_PI && item.name === importacion.NUMERO_PI
        )
    );

    setPIs(filteredData);
  };

  // Consultar TTED
  const handleConsultarTTED = async () => {
    const id = parseInt(datos.ID_CARGA);
    const TTED = await ConsultarTTED({ codigo: id });
    // Actualizar datosForm
    setDatosForm((prev) => ({
      ...prev,
      TIEMPO_TRANSITO_ESTIMADO: TTED,
    }));
  };

  // Verificar si se deben mostrar los controles de edición
  // Para COMPRAS: pueden editar si no son gerencia y la importación está EN PROCESO
  const mostrarBotonEdicionCompras =
    permisosComprasGerencias.length === 0 &&
    permisosCompras.length > 0 &&
    permisosBodega.length === 0 && // No debe tener permisos de BODEGA
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Para BODEGA: pueden guardar si suben archivos en DOCUMENTOS_PARA_BODEGA
  const mostrarBotonEdicionBodega =
    permisosBodega.length > 0 &&
    permisosCompras.length === 0 &&
    permisosComprasGerencias.length === 0 &&
    datos.ESTADO_IMPORTACION === "EN PROCESO" &&
    Array.isArray(datosForm.DOCUMENTOS_PARA_BODEGA) &&
    datosForm.DOCUMENTOS_PARA_BODEGA.length > 0;

  const mostrarBotonEdicion =
    mostrarBotonEdicionCompras || mostrarBotonEdicionBodega;

  const ConsultarArchivosDocuementosProveedor = async () => {
    try {
      const id = parseInt(datos.ID_CARGA);

      const respP1 = await ObtenerArchivosProveedor({ id, tipo: 1 });
      const archivosProveedorBodega = respP1.data.map(formatoJSONArchivo);

      const respP2 = await ObtenerArchivosProveedor({ id, tipo: 2 });
      const archivosProveedorRestantes = respP2.data.map(formatoJSONArchivo);

      return {
        bodega: archivosProveedorBodega,
        restantes: archivosProveedorRestantes,
      };
    } catch (error) {
      console.error(
        "Error al consultar archivos de documentos proveedor:",
        error
      );
      return { bodega: [], restantes: [] };
    }
  };

  // Guardar datos
  const InsertarFacProveedor = async () => {
    if (!campos) return false;

    try {
      const id = datos.ID_CARGA === "" ? null : parseInt(datos.ID_CARGA);
      const num_transito = "";
      const num_pi = datosForm["NUMERO_PI"];
      const factura_reserva = datosForm["FACTURA_RESERVA"];
      const estado_transito = "";

      let fecha_entrega_real = null;
      if (datosForm["FECHA_ENTREGA_REAL"] !== "") {
        fecha_entrega_real = fromDDMMYYYYToDate(
          datosForm["FECHA_ENTREGA_REAL"]
        );
      }

      let etd_real = null;
      if (datosForm["ATD"] !== "") {
        etd_real = fromDDMMYYYYToDate(datosForm["ATD"]);
      }

      let eta_real = null;
      if (datosForm["ATA"] !== "") {
        eta_real = fromDDMMYYYYToDate(datosForm["ATA"]);
      }
      let fecha_operacion = null;
      if (datosForm["FECHA_OPERACION"] !== "") {
        fecha_operacion = fromDDMMYYYYToDate(datosForm["FECHA_OPERACION"]);
      }

      const estado_documentos = datosForm["ESTADO_DOCUMENTOS"];
      const num_tracking = datosForm["NUMERO_TRACKING"];
      const comentario1 = datosForm["COMENTARIO_1"];
      const comentario2 = datosForm.COMENTARIO_2;
      const IMP = datosForm["IMP"];
      const archivos = datosForm["DOCUMENTOS"];
      const archivosBodega = datosForm["DOCUMENTOS_PARA_BODEGA"];

      const documentosDOCS = archivos.filter((item) => item.doc !== undefined);
      const documentosDOCS1 = documentosDOCS.map((item) => item.doc);
      const documentosDOCS_BODEGA = archivosBodega.filter(
        (item) => item.doc !== undefined
      );
      const documentosDOCS_BODEGA1 = documentosDOCS_BODEGA.map(
        (item) => item.doc
      );

      let fecha_saldo_pagar = null;
      if (eta_real || etd_real) {
        const fechaSaldoPagar = await ConsultarFechaSalgoPagar({
          id: datos.ID_CARGA,
          proveedor: datos.CODIGO_PROVEEDOR,
        });
        if (fechaSaldoPagar.length > 0) {
          fecha_saldo_pagar = fechaSaldoPagar[0].fecha_saldo_pagar || null;
        }
      }

      const res = await InsertarIngresoFactProveedor({
        id,
        num_transito,
        num_pi,
        factura_reserva,
        estado_transito,
        estado_documentos,
        fecha_entrega_real,
        etd_real,
        eta_real,
        fecha_operacion,
        num_tracking,
        comentario1,
        comentario2,
        IMP,
        fecha_saldo_pagar,
        etapa: 3,
      });

      if (documentosDOCS1.length > 0) {
        await RegistrarDocumentosProveedor({
          id,
          archivos: documentosDOCS1,
          tipo: 2,
          rutaBase,
          rutaCarpeta,
        });
      }

      if (documentosDOCS_BODEGA1.length > 0) {
        await RegistrarDocumentosProveedor({
          id,
          archivos: documentosDOCS_BODEGA1,
          tipo: 1,
          rutaBase,
          rutaCarpeta,
        });
      }

      // Preparar datos para correo bodega
      let fecha_salida_bodega = null;
      if (
        datos.FECHA_SALIDA_BODEGA !== "" &&
        datos.FECHA_SALIDA_BODEGA !== null
      ) {
        fecha_salida_bodega = datos.FECHA_SALIDA_BODEGA;
      }

      let fecha_estimada_bodega = null;
      if (
        datos.LLEGADA_ESTIMADA_BODEGA !== "" &&
        datos.LLEGADA_ESTIMADA_BODEGA !== null
      ) {
        fecha_estimada_bodega = datos.LLEGADA_ESTIMADA_BODEGA;
      }

      const transportista_asignado = datos.TRANSPORTE_ASIGNADO;

      // Función para enviar correo a bodega
      const envioCorreoBodegaF = async () => {
        const validarLleno =
          fecha_salida_bodega !== null &&
          fecha_estimada_bodega !== null &&
          transportista_asignado !== "";

        if (archivosBodega.length > 0 && validarLleno === true) {
          if (
            permisosComprasGerencias.length === 0 &&
            permisosCompras.length > 0
          ) {
            setEnviandoCorreos(1);
            await EnviarCorreoBodega({
              idImportacion: id,
              destinatarios: listaDeCorreosParaEnviar,
            });
            setEnviandoCorreos(2);
          }
        }
      };

      if (res && res.data && res.data.update === 1) {
        setActualizacionExitosa(1);
        // Reemplazar todo el bloque de actualización con una sola llamada
        actualizarDatosTrasGuardado({
          datos,
          datosForm,
          setDatos,
          setDatosIniciales,
          campos,
          setCamposBloqueados,
        });

        const resPGs = await ConsultarPGs({
          empresa: datos.EMPRESA,
          PI: num_pi,
        });
        const pgArray = resPGs.map((item) => item.PG);
        const pgArrayToString = pgArray.join(",");
        await UpdatePGs({ codigo: id, pedidos: pgArrayToString });
        await envioCorreoBodegaF();

        return true;
      } else {
        setActualizacionExitosa(2);
        return false;
      }
    } catch (error) {
      console.error("Error en InsertarFacProveedor:", error);
      setActualizacionExitosa(2);
      return false;
    }
  };

  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
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

      // Consultar datos adicionales solo una vez
      await ConsultarPIs();
      await handleConsultarTTED();
      // Obtener documentos existentes solo si hay un ID
      if (datos.ID_CARGA) {
        const id = parseInt(datos.ID_CARGA);
        const respDocumentos = await ConsultarArchivosDocuementosProveedor();

        // Actualizar el estado del formulario con los documentos recuperados
        setDatosForm((prev) => ({
          ...prev,
          DOCUMENTOS_PARA_BODEGA: respDocumentos.bodega || [],
          DOCUMENTOS: respDocumentos.restantes || [],
        }));
      }

      // Usar permisos recibidos desde props
      setPermisosBodega(permisosProp?.bodega || []);
      setPermisosCompras(permisosProp?.compras || []);
      setPermisosComprasGerencias(permisosProp?.comprasGerencias || []);

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
          { permisosCompras, permisosBodega, permisosComprasGerencias }
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
    permisosCompras,
    permisosBodega,
    permisosComprasGerencias,
  ]);

  // 3. EFECTO PARA RESPONDER A CAMBIOS EN EL PI
  useEffect(() => {
    // Si hay un valor de PI, consultar sus datos
    if (datosForm && datosForm["NUMERO_PI"]) {
      const consultarDatosDelPI = async () => {
        const res = await ConsultarDataPI(
          datos.EMPRESA,
          datosForm["NUMERO_PI"]
        );
        console.log(res);

        if (res && res.length > 0) {
          // Actualizar datosForm
          setDatosForm((prev) => ({
            ...prev,
            NUMERO_TRANSITO: "",
            FACTURA_RESERVA: res[0].NumFacturaReserva || "",
            TIEMPO_TRANSITO_ESTIMADO: datos["TIEMPO_TRANSITO_ESTIMADO"] || "",
            COMENTARIO_1: res[0].Comentario1 || "",
            COMENTARIO_2: res[0].Comentario2 || "",
          }));
        }
      };

      consultarDatosDelPI();
    }
  }, [datosForm?.NUMERO_PI]); // Dependencia más segura con verificación opcional

  // Definir reglas específicas para este componente
  const reglasVisibilidad = {
    soloCompras: [
      "IMP",
      "FACTURA_RESERVA",
      "TIEMPO_TRANSITO_ESTIMADO",
      "FECHA_ENTREGA_REAL",
      "ATD",
      "ATA",
      "FECHA_OPERACION",
      "ESTADO_DOCUMENTOS",
      "NUMERO_TRACKING",
      "COMENTARIO_1",
      "DOCUMENTOS",
    ],
    soloBodega: [],
    siempreVisibles: ["NUMERO_PI", "DOCUMENTOS_PARA_BODEGA"], // Campos visibles para todos los usuarios
  };

  // Definir transformaciones para campos específicos
  const transformacionesCampos = {
    NUMERO_PI: {
      bodega: {
        component: "InputField",
        props: { tipo: "text", readOnly: true },
        bloqueo: "siempre",
        options: undefined,
      },
      compras: {
        // No modificar el componente, solo añadir opciones
        options: PIs,
      },
    },
  };

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        DOCUMENTOS PROVEEDOR
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
          {Object.values(campos).map((campo) => {
            const camposEspeciales = {};
            return renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              { permisosCompras, permisosBodega },
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
        onConfirm={InsertarFacProveedor}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
        loading={enviandoCorreos === 1}
        loadingMessage="Guardando y enviando correos en caso de ser necesario..."
      >
        {campos &&
          Object.values(campos).map((campo) => {
            // Aplicar la misma lógica de filtrado que en renderField
            if (
              campo.shouldRenderByDatos &&
              !campo.shouldRenderByDatos(datos)
            ) {
              return null;
            }

            const valor = datosForm[campo.id];

            if (campo.tipo === "archivo") {
              return (
                <div key={campo.id}>
                  <b>{campo.label}</b>{" "}
                  {Array.isArray(valor)
                    ? valor.map((file) => file.nombreArchivo).join(" / ")
                    : ""}
                </div>
              );
            }

            return (
              <div key={campo.id}>
                <b>{campo.label}</b> {datosForm[campo.id] || datos[campo.id]}
              </div>
            );
          })}
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
