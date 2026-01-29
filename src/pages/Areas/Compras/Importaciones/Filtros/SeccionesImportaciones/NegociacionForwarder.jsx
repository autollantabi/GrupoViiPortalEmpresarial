import React, { useEffect, useState } from "react";

import {
  ConsultarAgentesForwarder,
  InsertarNegociacionForwarder,
} from "services/importacionesService";
import { FormRow, ConfirmationDialog } from "components/common/FormComponents";
import { useAuthContext } from "context/authContext";
import {
  actualizarDatosTrasGuardado,
  debeEstarBloqueado,
  fromDDMMYYYYToDate,
  renderField,
  renderizarCampoConPermisos,
  stringToFloat,
} from "../../UtilsImportaciones";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";


export const NegociacionForwarder = ({
  datos,
  setDatos,
  actualizar,
  permisosProp,
  rolesUsuario = [],
}) => {
  // Usar el rol que viene como prop (ya calculado en el router)
  const roles = rolesUsuario.length > 0 ? rolesUsuario : [];

  const tieneRolVentas = roles.includes("usuario");
  const tieneRolBodega = roles.includes("bodega");
  const tieneRolJefatura = roles.includes("jefatura");
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    FECHA_ENTREGA_OFRECIDA: {
      id: "FECHA_ENTREGA_OFRECIDA",
      tipo: "fecha",
      label: "Fecha Ofrecida Prov:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      bloqueo: "conValor",
    },
    ETD: {
      id: "ETD",
      tipo: "fecha",
      label: "ETD Ofrecido:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      bloqueo: "conValor",
    },
    ETA: {
      id: "ETA",
      tipo: "fecha",
      label: "ETA Ofrecido:",
      defaultValue: "",
      component: "SelectsFechas",
      // bloqueo: "conValor",
      props: { nombre: "Fecha", all: true },
      getDynamicProps: (datosForm) => ({
        minFecha: datosForm["ETD"] || "",
      }),
    },
    CONTENEDORES_ESTIMADOS: {
      id: "CONTENEDORES_ESTIMADOS",
      tipo: "input",
      label: "Cant Estimada Contenedores:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", entero: true, min: 1 },
    },
    DIAS_LIBRES: {
      id: "DIAS_LIBRES",
      tipo: "input",
      label: "Días Libres:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", entero: true, min: 1 },
    },
    CODIGO_FORWARDER: {
      id: "CODIGO_FORWARDER",
      tipo: "input",
      label: "Código Trámite Forwarder:",
      defaultValue: "",
      component: "InputField",
    },
    AGENTE_FORWARDER: {
      id: "AGENTE_FORWARDER",
      tipo: "select",
      label: "Agente Forwarder:",
      defaultValue: "",
      component: "SelectsConInput",
      options: [],
    },
    FLETE_ESTIMADO: {
      id: "FLETE_ESTIMADO",
      tipo: "input",
      label: "Flete Estimado ($):",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
      bloqueo: "conValor",
    },
    FLETE_DEFINITIVO: {
      id: "FLETE_DEFINITIVO",
      tipo: "input",
      label: "Flete Definitivo ($):",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
    },
    THC: {
      id: "THC",
      tipo: "input",
      label: "Valor THC:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
    },
    ESTADO_FORWARDER: {
      id: "ESTADO_FORWARDER",
      tipo: "select",
      label: "Estado Movilización:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "VIA DIRECTA" },
          { value: 2, name: "TRANSBORDO" },
        ],
      },
    },
  };

  const [campos, setCampos] = useState(null);
  const [datosForm, setDatosForm] = useState({});
  const [cargaInicial, setCargaInicial] = useState(true);
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actualizacionExitosa, setActualizacionExitosa] = useState(0);

  // Estados específicos para este componente
  const [agentesForwarder, setAgentesForwarder] = useState([]);

  // Verificar si se deben mostrar los controles de edición
  // Solo COMPRAS (ventas) puede editar Negociación Forwarder, no GERENCIA (jefatura)
  const mostrarBotonEdicion =
    !tieneRolJefatura &&
    tieneRolVentas &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
  };

  // Guardar datos
  const insertarNegociacion = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);

      // Usar datosForm en lugar de datos para los valores del formulario
      let fecha_entrega = null;
      if (datosForm["FECHA_ENTREGA_OFRECIDA"] !== "") {
        fecha_entrega = fromDDMMYYYYToDate(datosForm["FECHA_ENTREGA_OFRECIDA"]);
      }

      let etd_prov = null;
      if (datosForm["ETD"] !== "") {
        etd_prov = fromDDMMYYYYToDate(datosForm["ETD"]);
      }

      let eta_prov = null;
      if (datosForm["ETA"] !== "") {
        eta_prov = fromDDMMYYYYToDate(datosForm["ETA"]);
      }

      const contenedores_estimados =
        datosForm["CONTENEDORES_ESTIMADOS"] === ""
          ? null
          : parseInt(datosForm["CONTENEDORES_ESTIMADOS"]);

      const dias_libres =
        datosForm["DIAS_LIBRES"] === ""
          ? null
          : parseInt(datosForm["DIAS_LIBRES"]);

      const cod_forwarder = datosForm["CODIGO_FORWARDER"];
      const agente = datosForm["AGENTE_FORWARDER"];
      const flete_estimado = stringToFloat(datosForm["FLETE_ESTIMADO"]);
      const flete_definitivo = stringToFloat(datosForm["FLETE_DEFINITIVO"]);
      const THC = stringToFloat(datosForm["THC"]);
      const mov_forwarder = datosForm["ESTADO_FORWARDER"];

      const res = await InsertarNegociacionForwarder({
        id,
        fecha_entrega,
        etd_prov,
        eta_prov,
        contenedores_estimados,
        dias_libres,
        cod_forwarder,
        agente,
        flete_estimado,
        flete_definitivo,
        THC,
        mov_forwarder,
        etapa: 2,
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

        return true;
      } else {
        setActualizacionExitosa(2);
        return false;
      }
    } catch (error) {
      console.error("Error en insertarNegociacion:", error);
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

      // Los permisos ahora se basan en roles, no necesitamos setear estados

      // Consultar agentes forwarder
      const respuestaAgentes = await ConsultarAgentesForwarder();
      setAgentesForwarder(respuestaAgentes.data || []);

      // Actualizar las opciones del campo AGENTE_FORWARDER
      setCampos((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          AGENTE_FORWARDER: {
            ...prev.AGENTE_FORWARDER,
            options: respuestaAgentes.data || [],
          },
        };
      });

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

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        NEGOCIACIÓN FORWARDER
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
            // Manejo especial para el campo AGENTE_FORWARDER que necesita los agentes cargados
            if (campo.id === "AGENTE_FORWARDER") {
              return renderizarCampoConPermisos(
                {
                  ...campo,
                  options: agentesForwarder,
                },
                { datos, datosForm, setDatosForm, camposBloqueados },
                { 
                  permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
                  permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : []
                },
                { siempreVisibles: [] },
                {},
                {}
              );
            }

            return renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              { 
                permisosCompras: tieneRolVentas ? [{ empresa: "ALL" }] : [],
                permisosBodega: tieneRolBodega ? [{ empresa: "ALL" }] : []
              },
              { siempreVisibles: [] },
              {},
              {}
            );
          })}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={insertarNegociacion}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
      >
        {campos &&
          Object.values(campos).map((campo) => (
            <div key={campo.id}>
              <b>{campo.label}</b> {datosForm[campo.id] || datos[campo.id]}
            </div>
          ))}
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
