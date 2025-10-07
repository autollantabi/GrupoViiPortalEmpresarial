import React, { useEffect, useState } from "react";
import {
  ConsultarAgentesAduana,
  ConsultarTTRD,
  UpdateNacionalizacion,
} from "services/importacionesService";
import { consultarPermisosPorModuloRuta } from "utils/functionsPermissions";
import { ConfirmationDialog } from "components/common/FormComponents";
import {
  debeEstarBloqueado,
  renderField,
  fromDDMMYYYYToDate,
  actualizarDatosTrasGuardado,
  stringToFloat,
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

export const Nacionalizacion = ({ datos, setDatos, actualizar }) => {
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    ESTADO_MRN: {
      id: "ESTADO_MRN",
      tipo: "select",
      label: "Estado MRN (Manifest Reference Number):",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "RECIBIDO" },
        ],
      },
    },
    FECHA_PAGO_ARANCEL: {
      id: "FECHA_PAGO_ARANCEL",
      tipo: "fecha",
      label: "Fecha Pago Arancel:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    VALOR_ARANCEL: {
      id: "VALOR_ARANCEL",
      tipo: "input",
      label: "Valor por Pagar Aranceles:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
    },
    TIPO_AFORO: {
      id: "TIPO_AFORO",
      tipo: "select",
      label: "Tipo Aforo:",
      defaultValue: "",
      component: "SelectBasico",
      // Directamente obtener las opciones basadas en la empresa
      getDynamicProps: (datosForm, datos) => {        
        // Opciones para AUTOMAX
        if (datos && datos.EMPRESA === "AUTOMAX") {
          return {
            options: [
              { value: 0, name: "PENDIENTE" },
              { value: 1, name: "ROJO" },
              { value: 2, name: "AMARILLO" },
              { value: 3, name: "VERDE" },
            ],
          };
        }

        // Opciones para otras empresas
        return {
          options: [
            { value: 0, name: "PENDIENTE" },
            { value: 1, name: "FISICO INTRUSIVO" },
            { value: 2, name: "RAYOS X" },
            { value: 3, name: "AUTOMÁTICO" },
          ],
        };
      },
    },
    TIEMPO_TRANSITO_REAL: {
      id: "TIEMPO_TRANSITO_REAL",
      tipo: "input",
      label: "Tiempo de Tránsito Real (días)(T.T):",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", entero: true, readOption: true },
      bloqueo: "siempre",
    },
    AGENTE_ADUANERO: {
      id: "AGENTE_ADUANERO",
      tipo: "select",
      label: "Agente Aduanero:",
      defaultValue: "",
      component: "SelectsConInput",
      options: [],
    },
    ENTREGA_AGENTE: {
      id: "ENTREGA_AGENTE",
      tipo: "select",
      label: "Entrega Documentos Agente:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "ENTREGADO" },
        ],
      },
    },
    ESTADO_SALIDA_AUTORIZADA: {
      id: "ESTADO_SALIDA_AUTORIZADA",
      tipo: "select",
      label: "Estado Salida Autorizada:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "AUTORIZADA" },
        ],
      },
    },
    NUM_LIQUIDACION: {
      id: "NUM_LIQUIDACION",
      tipo: "input",
      label: "Nro. Liquidación:",
      defaultValue: "",
      component: "InputField",
    },
    FECHA_LIBERACION: {
      id: "FECHA_LIBERACION",
      tipo: "fecha",
      label: "Fecha Liberación:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
    },
    NUM_DAI: {
      id: "NUM_DAI",
      tipo: "input",
      label: "Nro. DAI (Declaración Aduanera de Importación):",
      defaultValue: "",
      component: "InputField",
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
  const [agentesAduana, setAgentesAduana] = useState([]);
  const [permisosCompras, setPermisosCompras] = useState([]);
  const [permisosComprasGerencias, setPermisosComprasGerencias] = useState([]);
  const [permisosBodega, setPermisosBodega] = useState([]);

  // Consultar agentes de aduana
  const consultarAgentesA = async () => {
    try {
      const response = await ConsultarAgentesAduana();
      if (response && response.data) {
        setAgentesAduana(response.data);

        // Actualizar las opciones del campo AGENTE_ADUANERO
        setCampos((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            AGENTE_ADUANERO: {
              ...prev.AGENTE_ADUANERO,
              options: response.data,
            },
          };
        });
      }
    } catch (error) {
      console.error("Error al consultar agentes de aduana:", error);
    }
  };

  // Consultar tiempo de tránsito real
  const handleConsultarTTRD = async () => {
    try {
      const id = parseInt(datos.ID_CARGA);
      const TTRD = await ConsultarTTRD({ codigo: id });

      // Actualizar datosForm
      setDatosForm((prev) => ({
        ...prev,
        TIEMPO_TRANSITO_REAL: TTRD,
      }));
    } catch (error) {
      console.error("Error al consultar tiempo de tránsito real:", error);
    }
  };

  // Verificar si se deben mostrar los controles de edición
  const mostrarBotonEdicion =
    permisosComprasGerencias.length === 0 &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
  };

  // Guardar datos
  const updateNacionalizacion = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);

      const estadoMRN = datosForm.ESTADO_MRN;

      let fechaArancel = null;
      if (datosForm.FECHA_PAGO_ARANCEL !== "") {
        fechaArancel = fromDDMMYYYYToDate(datosForm.FECHA_PAGO_ARANCEL);
      }

      const valorArancel = stringToFloat(datosForm.VALOR_ARANCEL);
      const tipoAforo = datosForm.TIPO_AFORO;
      const agente_aduanero = datosForm.AGENTE_ADUANERO;
      const entrega_docs_agente = datosForm.ENTREGA_AGENTE;
      const estadoSalida = datosForm.ESTADO_SALIDA_AUTORIZADA;
      const nroLiquidacion = datosForm.NUM_LIQUIDACION;

      let fechaLiberacion = null;
      if (datosForm.FECHA_LIBERACION !== "") {
        fechaLiberacion = fromDDMMYYYYToDate(datosForm.FECHA_LIBERACION);
      }

      const nroDAI = datosForm.NUM_DAI;

      const res = await UpdateNacionalizacion({
        id,
        estadoMRN,
        fechaArancel,
        valorArancel,
        tipoAforo,
        agente_aduanero,
        entrega_docs_agente,
        estadoSalida,
        nroLiquidacion,
        fechaLiberacion,
        nroDAI,
        etapa: 6,
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
      console.error("Error en updateNacionalizacion:", error);
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

      // Consultar datos adicionales solo una vez
      await consultarAgentesA();
      await handleConsultarTTRD();

      // Consultar permisos
      const permisosdeusuarioBOD = await consultarPermisosPorModuloRuta({
        rutaModulos: BODEGA,
      });
      const permisosdeusuarioCOMP = await consultarPermisosPorModuloRuta({
        rutaModulos: IMPORTACIONES,
      });
      const permisosdeusuarioCOMPG = await consultarPermisosPorModuloRuta({
        rutaModulos: COMPRASGERENCIA,
      });

      setPermisosBodega(permisosdeusuarioBOD);
      setPermisosCompras(permisosdeusuarioCOMP);
      setPermisosComprasGerencias(permisosdeusuarioCOMPG);

      // Marcar como ya inicializado
      setCargaInicial(false);
    };

    inicializarComponente();
    // Dependencias vacías: solo se ejecuta al montar
  }, []);

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
          datosIniciales
        );
      });

      setCamposBloqueados(nuevoEstado);
    };

    evaluarCamposBloqueados();
  }, [datos, datosForm, campos, datosIniciales]);

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        NACIONALIZACIÓN
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
            // Manejo especial para el campo AGENTE_ADUANERO que necesita los agentes cargados
            if (campo.id === "AGENTE_ADUANERO") {
              return renderField(
                {
                  ...campo,
                  options: agentesAduana,
                },
                { datos, datosForm, setDatosForm, camposBloqueados }
              );
            }

            return renderField(campo, {
              datos,
              datosForm,
              setDatosForm,
              camposBloqueados,
            });
          })}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={updateNacionalizacion}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
      >
        {campos &&
          Object.values(campos).map((campo) => {
            return (
              <div key={campo.id}>
                <b>{campo.label}</b> {datosForm[campo.id]}
              </div>
            );
          })}
      </ConfirmationDialog>
    </SectionImportacionesContainer>
  );
};
