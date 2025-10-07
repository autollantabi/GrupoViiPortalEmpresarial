import React, { useEffect, useState } from "react";
import {
  ConsultarDataTransaccionesSegunPI,
  UpdateIngresoTransacciones,
} from "services/importacionesService";
import { consultarPermisosPorModuloRuta } from "utils/functionsPermissions";
import { ConfirmationDialog } from "components/common/FormComponents";
import {
  debeEstarBloqueado,
  renderField,
  renderizarCampoConPermisos,
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

export const Transacciones = ({
  datos,
  setDatos,
  actualizar,
  permisosProp,
}) => {
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    ESTADO_PAGO: {
      id: "ESTADO_PAGO",
      tipo: "select",
      label: "Estado del Pago:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "CON ANTICIPO" },
          { value: 2, name: "PAGADO" },
        ],
      },
      bloqueo: "siempre",
    },
    SALDO_POR_PAGAR: {
      id: "SALDO_POR_PAGAR",
      tipo: "input",
      label: "Saldo por pagar ($):",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
      bloqueo: "siempre",
    },
    FECHA_SALDO_PAGAR: {
      id: "FECHA_SALDO_PAGAR",
      tipo: "fecha",
      label: "Fecha Saldo por pagar:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
      bloqueo: "siempre",
    },
    FECHA_PAGO_TOTAL: {
      id: "FECHA_PAGO_TOTAL",
      tipo: "fecha",
      label: "Fecha Pago Total:",
      defaultValue: "",
      component: "SelectsFechas",
      props: { nombre: "Fecha", all: true },
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
  const [datosObtenidos, setDatosObtenidos] = useState(null);
  const [permisosCompras, setPermisosCompras] = useState([]);
  const [permisosComprasGerencias, setPermisosComprasGerencias] = useState([]);
  const [permisosBodega, setPermisosBodega] = useState([]);

  // Verificar si se deben mostrar los controles de edición
  // Solo COMPRAS (IMPORTACIONES) puede editar Transacciones, no GERENCIA
  const mostrarBotonEdicion =
    permisosComprasGerencias.length === 0 &&
    permisosCompras.length > 0 &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Guardar datos
  const guardarIngresoTransacciones = async () => {
    if (!campos) return false;

    try {
      const id = parseInt(datos.ID_CARGA);
      const estado_pago = datosForm.ESTADO_PAGO;

      // Calcular el saldo por pagar
      let saldo_por_pagar =
        datosForm.SALDO_POR_PAGAR === ""
          ? datosObtenidos?.SALDO_X_PAGAR || 0
          : stringToFloat(datosForm.SALDO_POR_PAGAR);

      // Convertir fechas
      // let fecha_saldo_pagar = null;
      // if (datosForm.FECHA_SALDO_PAGAR !== "") {
      //   fecha_saldo_pagar = fromDDMMYYYYToDate(datosForm.FECHA_SALDO_PAGAR);
      // }

      let fecha_pago_total = null;
      if (datosForm.FECHA_PAGO_TOTAL !== "") {
        fecha_pago_total = fromDDMMYYYYToDate(datosForm.FECHA_PAGO_TOTAL);
      }

      const res = await UpdateIngresoTransacciones({
        id,
        estado_pago,
        saldo_por_pagar,
        fecha_pago_total,
        etapa: 5,
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
      console.error("Error en guardarIngresoTransacciones:", error);
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

      const resDataAdicional = await ConsultarDataTransaccionesSegunPI(
        datos.EMPRESA,
        datos.NUMERO_PI
      );
      // console.log(resDataAdicional[0]);

      setDatosForm((prev) => ({
        ...prev,
        SALDO_POR_PAGAR: resDataAdicional[0]?.SALDO_X_PAGAR || "",
        ESTADO_PAGO: resDataAdicional[0]?.ESTADO_DEL_PAGO || "",
      }));

      // Usar permisos recibidos desde props
      setPermisosBodega(permisosProp?.bodega || []);
      setPermisosCompras(permisosProp?.compras || []);
      setPermisosComprasGerencias(permisosProp?.comprasGerencias || []);

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

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        TRANSACCIONES
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
            return renderizarCampoConPermisos(
              campo,
              { datos, datosForm, setDatosForm, camposBloqueados },
              { permisosCompras, permisosBodega },
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
        onConfirm={guardarIngresoTransacciones}
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
