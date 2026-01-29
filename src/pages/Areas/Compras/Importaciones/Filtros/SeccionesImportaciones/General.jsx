import React, { useEffect, useState } from "react";
import { UpdateGeneralImportacion } from "services/importacionesService";
import {
  FormRow,
  ConfirmationDialog,
  ItemList,
} from "components/common/FormComponents";
import {
  actualizarDatosTrasGuardado,
  debeEstarBloqueado,
  renderField,
  renderizarCampoConPermisos,
} from "../../UtilsImportaciones";
import {
  FormImportacionesGrid,
  SectionImportacionesContainer,
  SectionImportacionesTitle,
} from "../../StylesImportaciones";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import styled from "styled-components";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";


// Componentes adicionales específicos para General
const SectionSubtitle = styled.h6`
  margin: 10px 0;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
`;

const ClientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px;
  background-color: ${({ theme }) => theme.colors.backgroundLight || theme.colors.background};
`;

const ClientItem = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  padding: 4px 0;
`;

export const General = ({ datos, setDatos, actualizar, permisosProp, rolesUsuario = [] }) => {
  const { theme } = useTheme();
  
  // Usar el rol que viene como prop (ya calculado en el router)
  const roles = rolesUsuario.length > 0 ? rolesUsuario : [];

  const tieneRolVentas = roles.includes("usuario");
  const tieneRolBodega = roles.includes("bodega");
  const tieneRolJefatura = roles.includes("jefatura");
  // Definición centralizada de campos
  const CAMPOS_INICIALES = {
    PLAZO_PROVEEDOR: {
      id: "PLAZO_PROVEEDOR",
      tipo: "input",
      label: "Plazo del Proveedor (días):",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "number", entero: true },
      bloqueo: "siempre", // Siempre bloqueado
    },
    ESTADO_CARGA: {
      id: "ESTADO_CARGA",
      tipo: "select",
      label: "Estado de la Carga:",
      defaultValue: "",
      component: "SelectBasico",
      props: {
        options: [
          { value: 0, name: "ABIERTO" },
          { value: 1, name: "CERRADO POR PAGAR" },
          { value: 2, name: "CERRADO" },
        ],
      },
    },
    ESTADO_IMPORTACION: {
      id: "ESTADO_IMPORTACION",
      tipo: "input",
      label: "Estado de Importación:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "text" },
      bloqueo: "siempre", // Siempre bloqueado
    },
    OBSERVACION: {
      id: "OBSERVACION",
      tipo: "textarea",
      label: "Observación:",
      defaultValue: "",
      component: "TextArea",
    },
    NUMERO_PIP: {
      id: "NUMERO_PIP",
      tipo: "input",
      label: "PI Provisional:",
      defaultValue: "",
      component: "InputField",
      props: { tipo: "text" },
    },
  };

  // Estados principales
  const [campos, setCampos] = useState(null);
  const [datosForm, setDatosForm] = useState({});
  const [datosIniciales, setDatosIniciales] = useState(null);
  const [camposBloqueados, setCamposBloqueados] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [actualizacionExitosa, setActualizacionExitosa] = useState(0);

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

  // Actualizar datos generales
  const updateGeneral = async () => {
    if (!campos) return false;

    try {
      const codigo = datos.ID_CARGA === "" ? null : parseInt(datos.ID_CARGA);
      const estado = datosForm.ESTADO_CARGA;
      const observacion = datosForm.OBSERVACION;
      const usuario_asignado =
        datosForm.USUARIO_ASIGNADO === ""
          ? null
          : parseInt(datosForm.USUARIO_ASIGNADO);
      const PI = datosForm.NUMERO_PIP;

      const res = await UpdateGeneralImportacion({
        codigo,
        estado,
        observacion,
        usuario_asignado,
        PI,
      });

      if (res?.data?.update === 1) {
        setActualizacionExitosa(1);

        // Actualizar datos de forma unificada
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
      console.error("Error en updateGeneral:", error);
      setActualizacionExitosa(2);
      return false;
    }
  };

  // Verificar si se deben mostrar los controles de edición
  // Solo COMPRAS (IMPORTACIONES) puede editar General, no BODEGA ni GERENCIA
  const mostrarBotonEdicion =
    !tieneRolJefatura &&
    tieneRolVentas &&
    !tieneRolBodega && // BODEGA no puede editar General
    datos.ESTADO_IMPORTACION === "EN PROCESO";

  return (
    <SectionImportacionesContainer>
      <SectionImportacionesTitle>
        GENERAL
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

      <SectionSubtitle>
        {datos.EMPRESA} - {datos.PROVEEDOR} - {datos.MARCA}
      </SectionSubtitle>

      <span style={{ textDecoration: "underline", color: theme.colors.text, fontWeight: 500, marginTop: "15px", display: "block" }}>Pedido/s:</span>
      {!datos.PEDIDO ? (
        <div style={{ color: theme.colors.error, fontSize: "14px", paddingLeft: "10px", marginTop: "5px" }}>
          No hay pedidos asociados.
        </div>
      ) : (
        <ItemList
          items={(datos.PEDIDO || "").split(",")}
          renderItem={(pedido) => <div style={{ color: theme.colors.text }}>{pedido.trim()}</div>}
        />
      )}

      <span style={{ textDecoration: "underline", color: theme.colors.text, fontWeight: 500, marginTop: "15px", display: "block" }}>Datos adicionales:</span>

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

          {datos.CLIENTES && datos.CLIENTES.length > 0 && (
            <FormRow label="Clientes:">
              <ClientList>
                {datos.CLIENTES.map((cliente, index) => (
                  <ClientItem key={`cliente-${index}`}>
                    {cliente.NOMBRE_SOCIO_NEGOCIO}
                  </ClientItem>
                ))}
              </ClientList>
            </FormRow>
          )}
        </FormImportacionesGrid>
      )}

      <ConfirmationDialog
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={updateGeneral}
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
            if (!datosForm) return null;

            const valor = datosForm[campo.id];
            if (valor === undefined || valor === null) return null;

            // Para campos tipo select (mostrar nombre en lugar de valor)
            if (campo.tipo === "select" && campo.props?.options) {
              const opcion = campo.props.options.find(
                (opt) => opt.value == parseInt(valor)
              );
              return (
                <div key={campo.id}>
                  <b>{campo.label}</b> {opcion ? opcion.name : valor}
                </div>
              );
            }

            // Caso por defecto para otros tipos de campos
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
