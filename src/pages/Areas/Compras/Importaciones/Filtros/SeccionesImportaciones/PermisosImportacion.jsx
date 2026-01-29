import React, { useEffect, useState } from "react";
import { UpdatePermisosImportacion } from "services/importacionesService";
import { FormRow, ConfirmationDialog } from "components/common/FormComponents";
import {
  actualizarDatosTrasGuardado,
  debeEstarBloqueado,
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


export const PermisosImportacion = ({
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
    POLIZA: {
      id: "POLIZA",
      tipo: "select",
      label: "Poliza (Aplicación Seguro):",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "PENDIENTE" },
          { value: 1, name: "APLICADO" },
        ],
      },
    },
    VALOR_POLIZA: {
      id: "VALOR_POLIZA",
      tipo: "input",
      label: "Valor Poliza Seguro:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", formatoNumero: true },
    },
    INEN: {
      id: "INEN",
      tipo: "select",
      label: "Permisos INEN:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "NINGUNO" },
          { value: 1, name: "AUTORIZADO" },
          { value: 2, name: "SUBSANADO" },
          { value: 3, name: "APROBADO" },
        ],
      },
      shouldRenderByDatos: (datos) => datos.EMPRESA !== "AUTOMAX",
    },
    PERMISOS_ECA: {
      id: "PERMISOS_ECA",
      tipo: "select",
      label: "Permisos E.C.A.:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "NINGUNO" },
          { value: 1, name: "AUTORIZADO" },
          { value: 2, name: "SUBSANADO" },
          { value: 3, name: "APROBADO" },
        ],
      },
      shouldRenderByDatos: (datos) => datos.EMPRESA === "AUTOMAX",
    },
    PERMISOS_MINSA: {
      id: "PERMISOS_MINSA",
      tipo: "select",
      label: "Permisos MINSA:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "NINGUNO" },
          { value: 1, name: "AUTORIZADO" },
          { value: 2, name: "SUBSANADO" },
          { value: 3, name: "APROBADO" },
        ],
      },
      shouldRenderByDatos: (datos) => datos.EMPRESA === "AUTOMAX",
    },
    PERMISOS_FAD: {
      id: "PERMISOS_FAD",
      tipo: "select",
      label: "Permisos FAD:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "NINGUNO" },
          { value: 1, name: "AUTORIZADO" },
          { value: 2, name: "SUBSANADO" },
          { value: 3, name: "APROBADO" },
        ],
      },
      shouldRenderByDatos: (datos) => datos.EMPRESA === "AUTOMAX",
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


  // Cerrar confirmación y actualizar
  const handleConfirmationSuccess = () => {
    setMostrarConfirmacion(false);
    setActualizacionExitosa(0);
    actualizar();
  };

  // Verificar si se deben mostrar los controles de edición
  // Solo COMPRAS (ventas) puede editar Permisos Importación, no GERENCIA (jefatura)
  const mostrarBotonEdicion =
    !tieneRolJefatura &&
    tieneRolVentas &&
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  // Guardar datos
  const updatePermisosImportacion = async () => {
    if (!campos) return false;

    try {
      const id = datos.ID_CARGA === "" ? null : parseInt(datos.ID_CARGA);
      const poliza = datosForm.POLIZA;
      const valor_poliza = stringToFloat(datosForm.VALOR_POLIZA);
      const per_INEN = datosForm.INEN || null;
      const per_ECA = datosForm.PERMISOS_ECA || null;
      const per_MINSA = datosForm.PERMISOS_MINSA || null;
      const per_FAD = datosForm.PERMISOS_FAD || null;

      const res = await UpdatePermisosImportacion({
        id,
        poliza,
        valor_poliza,
        per_INEN,
        per_ECA,
        per_MINSA,
        per_FAD,
        etapa: 4,
      });

      if (res?.data?.update === 1) {
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
      console.error("Error en updatePermisosImportacion:", error);
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
        PERMISOS IMPORTACIÓN
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
        onConfirm={updatePermisosImportacion}
        title="¿Desea guardar la siguiente información?"
        successState={actualizacionExitosa}
        onSuccess={handleConfirmationSuccess}
        successMessage="Actualización Exitosa"
        errorMessage="Ha ocurrido un error"
      >
        {campos &&
          Object.values(campos)
            // Filtrar campos que no deben renderizarse
            .filter(
              (campo) =>
                !campo.shouldRenderByDatos || campo.shouldRenderByDatos(datos)
            )
            .map((campo) => {
              // Obtener valor desde datosForm
              const valor = datosForm[campo.id];

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
