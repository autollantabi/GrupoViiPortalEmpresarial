import React, { useEffect, useState } from "react";
import {
  EnviarCorreoPricing,
  ObtenerArchivosPricing,
  ObtenerDatosPricing,
  RegistrarDocumentosPricing,
  UpdatePricing,
} from "services/importacionesService";
import { obtenerCorreosAEnviar } from "../../PermisosModulo";
import { listCorreosEnvioPricing } from "../../CorreosTemporal";
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
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";

const correosDestinatarios = listCorreosEnvioPricing();

export const Pricing = ({ datos, setDatos, actualizar, permisosProp, rolesUsuario = [] }) => {
  // Usar el rol que viene como prop (ya calculado en el router)
  const roles = rolesUsuario.length > 0 ? rolesUsuario : [];

  const tieneRolVentas = roles.includes("usuario");
  const tieneRolBodega = roles.includes("bodega");
  const tieneRolJefatura = roles.includes("jefatura");
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    CARGA: {
      id: "CARGA",
      tipo: "archivo",
      label: "CARGA EXCEL:",
      defaultValue: [],
      component: "CampoListaArchivos",
      props: {
        aceptados: ".xlsx",
        id: 1,
        limite: 20,
      },
      getDynamicProps: (datosForm, datos, camposBloqueados) => ({
        impFinalizado:
          camposBloqueados["CARGA"] || datos.ESTADO_IMPORTACION === "COMPLETO",
      }),
    },
    ENVIAR_CORREO: {
      id: "ENVIAR_CORREO",
      tipo: "checkbox",
      label: "¿Contienen items nuevos?",
      labelColor: ({ theme }) => theme.colors.white,
      defaultValue: false,
      component: "CheckboxField",
    },
    ENVIO: {
      id: "ENVIO",
      tipo: "archivo",
      label: "ENVIO EXCEL:",
      defaultValue: [],
      component: "CampoListaArchivos",
      props: {
        aceptados: ".xlsx",
        id: 2,
        limite: 5,
      },
      getDynamicProps: (datosForm, datos, camposBloqueados) => ({
        impFinalizado:
          camposBloqueados["ENVIO"] || datos.ESTADO_IMPORTACION === "COMPLETO",
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
  const [todosLlenos, setTodosLlenos] = useState(false);
  const [enviandoCorreos, setEnviandoCorreos] = useState(0);
  const [listaDeCorreosParaEnviar, setListaDeCorreosParaEnviar] = useState([]);

  // Verificar si todos los campos requeridos están llenos
  useEffect(() => {
    if (!datosForm) return;

    const camposCarga =
      Array.isArray(datosForm.CARGA) && datosForm.CARGA.length > 0;

    setTodosLlenos(camposCarga && datos.ESTADO_IMPORTACION === "EN PROCESO");
  }, [datosForm, datos]);

  // Consultar estado inicial de envío de correo
  const obtenerEnvioCorreo = async () => {
    const id = parseInt(datos.ID_CARGA);
    try {
      const enviar = await ObtenerDatosPricing({ id });
      setDatosForm((prev) => ({
        ...prev,
        ENVIAR_CORREO: enviar,
      }));
    } catch (error) {
      console.error("Error al obtener datos de pricing:", error);
    }
  };

  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
  };

  // Guardar documentos
  const guardarDocumentosPricing = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);

      // Procesar archivos de CARGA
      const documentosCARGA = datosForm.CARGA.filter(
        (item) => item.doc !== undefined
      );

      // Procesar archivos de ENVIO
      const documentosENVIO = datosForm.ENVIO.filter(
        (item) => item.doc !== undefined
      );

      // Estado del correo
      const enviarCorreo = datosForm.ENVIAR_CORREO;

      // Variable para controlar el resultado
      let resultadoExitoso = true;

      // Registrar documentos de CARGA
      if (documentosCARGA.length > 0) {
        for (const archivo of documentosCARGA) {
          const res = await RegistrarDocumentosPricing({
            id,
            archivo: archivo.doc,
            tipo: 1,
          });

          if (!res || !res.data) {
            resultadoExitoso = false;
          }
        }
      }

      // Registrar documentos de ENVIO
      if (documentosENVIO.length > 0) {
        for (const archivo of documentosENVIO) {
          const res = await RegistrarDocumentosPricing({
            id,
            archivo: archivo.doc,
            tipo: 2,
          });

          if (!res || !res.data) {
            resultadoExitoso = false;
          }
        }
      }

      // Enviar correo si es necesario
      if (
        !tieneRolJefatura &&
        tieneRolVentas &&
        enviarCorreo
      ) {
        setEnviandoCorreos(1);
        await EnviarCorreoPricing({
          idImportacion: id,
          destinatarios: listaDeCorreosParaEnviar,
        });
        setEnviandoCorreos(2);
      }

      // Actualizar estado de correo
      const resCorreo = await UpdatePricing({
        id,
        correo: enviarCorreo,
      });

      if (resultadoExitoso && resCorreo) {
        setActualizacionExitosa(1);

        // Actualizar datos en el estado
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
      console.error("Error en guardarDocumentosPricing:", error);
      setActualizacionExitosa(2);
      return false;
    }
  };

  const ConsultarArchivosPricing = async () => {
    try {
      const id = parseInt(datos.ID_CARGA);

      const resp = await ObtenerArchivosPricing({ id, tipo: 1 });
      const archivosPricingCarga = resp.data.map(formatoJSONArchivo);

      const resp1 = await ObtenerArchivosPricing({ id, tipo: 2 });
      const archivosPrincingEnvio = resp1.data.map(formatoJSONArchivo);

      return {
        carga: archivosPricingCarga,
        envio: archivosPrincingEnvio,
      };
    } catch (error) {
      console.error("Error al consultar archivos de pricing:", error);
      return { bodega: [] };
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

      // Consultar datos adicionales
      await obtenerEnvioCorreo();
      // Obtener documentos existentes solo si hay un ID
      if (datos.ID_CARGA) {
        const respDocumentos = await ConsultarArchivosPricing();

        // Actualizar el estado del formulario con los documentos recuperados
        setDatosForm((prev) => ({
          ...prev,
          CARGA: respDocumentos.carga || [],
          ENVIO: respDocumentos.envio || [],
        }));
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

        // Regla especial para el checkbox de correo
        if (campo.id === "ENVIAR_CORREO") {
          nuevoEstado[campo.id] = tieneRolJefatura;
          return;
        }

        nuevoEstado[campo.id] = debeEstarBloqueado(
          campo,
          valor,
          estadoImportacion,
          tieneID,
          datosIniciales,
          {
            permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
            permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : [],
            permisosComprasGerencias: tieneRolJefatura ? [{ empresa: "ALL" }] : [],
          }
        );
      });

      setCamposBloqueados(nuevoEstado);
    };

    evaluarCamposBloqueados();
  }, [datos, datosForm, campos, datosIniciales, tieneRolVentas, tieneRolBodega, tieneRolJefatura]);

  // Determinar si mostrar botón de edición
  // Solo COMPRAS (ventas) puede editar Pricing, no BODEGA ni GERENCIA (jefatura)
  const mostrarBotonEdicion =
    !tieneRolJefatura &&
    tieneRolVentas &&
    todosLlenos &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        PRICING - Excel Liquidación de Precios
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
          {Object.values(campos).map((campo) =>
            renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              {
                permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
                permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : [],
              },
              { siempreVisibles: [] },
              {},
              {}
            )
          )}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={guardarDocumentosPricing}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
        loading={enviandoCorreos === 1}
        loadingMessage="Guardando y enviando correos en caso de ser necesario..."
      >
        <div>
          <b>Docs CARGA:</b>{" "}
          {datosForm.CARGA?.length > 0
            ? datosForm.CARGA.map(
                (file) => `${file.nombreArchivo}.${file.extensionArchivo}`
              ).join(" / ")
            : "Ninguno"}
        </div>
        <div>
          <b>Docs ENVIO:</b>{" "}
          {datosForm.ENVIO?.length > 0
            ? datosForm.ENVIO.map(
                (file) => `${file.nombreArchivo}.${file.extensionArchivo}`
              ).join(" / ")
            : "Ninguno"}
        </div>
        <div>
          <b>¿Contiene Items Nuevos?:</b>{" "}
          {datosForm.ENVIAR_CORREO ? "Sí" : "No"}
        </div>
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
