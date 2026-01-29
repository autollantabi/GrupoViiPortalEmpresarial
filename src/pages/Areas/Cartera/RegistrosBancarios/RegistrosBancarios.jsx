import React, { useState, useCallback, useMemo } from "react";
import TablaTransaccionesCompleto from "../ComponentesCartera/RegistrosBancarios/TablaTransaccionesCompleto";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { FiltrosUnificadosCartera } from "../ComponentesCartera/RegistrosBancarios/ComponentesUnificadosCartera";
import { ModalEdicionTransaccion } from "../ComponentesCartera/RegistrosBancarios/ModalEdicionTransaccion";
import {
  actualizarTransaccionBancariaPorID,
  actualizarEstadoTransaccionBancariaPorID,
} from "../../../../services/carteraService";
import { toast } from "react-toastify";
import { useAuthContext } from "context/authContext";
import { hasAccessToResource } from "utils/permissionsValidator";

export const RegistrosBancarios = ({
  routeConfig,
  availableCompanies, // Del nuevo sistema de recursos (ProtectedContent)
}) => {
  const { user } = useAuthContext();
  // Convertir availableCompanies al formato esperado por FiltrosUnificadosCartera
  const empresasDisponibles = useMemo(() => {
    if (availableCompanies && availableCompanies.length > 0) {
      // Convertir { id, nombre } a { empresa: nombre } para compatibilidad
      return availableCompanies.map((emp) => ({
        empresa: emp.nombre,
        idempresa: emp.id,
      }));
    }
    return [];
  }, [availableCompanies]);

  // Determinar los tipos de transacción permitidos según los recursos que realmente tiene acceso
  // C = Créditos (CARTERA), D = Débitos (CONTABILIDAD)
  const tiposTransaccionPermitidos = useMemo(() => {
    const tiposPermitidos = [];

    if (!routeConfig || !user || !user.data) return tiposPermitidos;

    const userContexts = user.data;
    const recursoPrincipal = routeConfig.recurso;
    const recursosAlternativos = routeConfig.recursosAlternativos || [];

    // Verificar qué recurso tiene acceso realmente
    let tieneAccesoCartera = false;
    let tieneAccesoContabilidad = false;

    // Verificar acceso al recurso principal
    if (recursoPrincipal === "cartera.registrosbancarios") {
      tieneAccesoCartera = hasAccessToResource(userContexts, recursoPrincipal);
    }

    // Verificar acceso a recursos alternativos
    if (recursosAlternativos.length > 0) {
      tieneAccesoContabilidad = recursosAlternativos.some((recursoAlt) => {
        if (recursoAlt === "contabilidad.registrosbancarios") {
          const tieneAcceso = hasAccessToResource(userContexts, recursoAlt);
          return tieneAcceso;
        }
        return false;
      });
    }

    // También verificar si tiene acceso mediante el recurso principal de contabilidad
    // (por si el usuario tiene acceso directo a "contabilidad.registrosbancarios" como recurso principal)
    if (recursoPrincipal === "contabilidad.registrosbancarios") {
      tieneAccesoContabilidad = hasAccessToResource(
        userContexts,
        recursoPrincipal
      );
    }

    // Determinar tipos permitidos basándose en los recursos con acceso
    if (tieneAccesoCartera) {
      tiposPermitidos.push("C");
    }

    if (tieneAccesoContabilidad) {
      tiposPermitidos.push("D");
      // Si tiene acceso a contabilidad, también puede ver créditos (C)
      if (!tiposPermitidos.includes("C")) {
        tiposPermitidos.push("C");
      }
    }

    return tiposPermitidos;
  }, [routeConfig, user]);
  // Estados para datos filtrados y configuración
  const [todosLosDatos, setTodosLosDatos] = useState([]); // Todos los datos sin filtrar
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [filasPorPagina, setFilasPorPagina] = useState(15);
  const [refrescarDatos, setRefrescarDatos] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Estados para el modal de edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null);

  // Callback para manejar cambios en los filtros
  const handleFiltersChange = useCallback((filtros) => {
    // Actualizar todos los datos sin filtrar (para los contadores)
    if (filtros.todosLosDatos) {
      setTodosLosDatos(filtros.todosLosDatos);
    }

    // Actualizar datos filtrados y aplicar filtro de tipo de transacción
    if (filtros.datosFiltrados) {
      let datosFiltradosPorTipo = filtros.datosFiltrados;

      // Los datos ya vienen filtrados por tipo de transacción desde FiltrosUnificadosCartera
      setDatosFiltrados(datosFiltradosPorTipo);
    }
    // Actualizar filas por página
    if (filtros.rowsPerPage) {
      setFilasPorPagina(filtros.rowsPerPage);
    }
    // Actualizar estado de carga
    if (filtros.cargando !== undefined) {
      setCargando(filtros.cargando);
    }
  }, []);

  // Abrir modal de edición
  const handleEdit = useCallback((transaccion) => {
    setTransaccionSeleccionada(transaccion);
    setModalAbierto(true);
  }, []);

  // Cerrar modal
  const handleCloseModal = useCallback(() => {
    setModalAbierto(false);
    setTransaccionSeleccionada(null);
  }, []);

  // Guardar cambios desde el modal
  const handleSaveModal = useCallback(
    async (formData) => {
      try {
        let resultado;
        const idTransaccion = transaccionSeleccionada.IDENTIFICADOR;

        // Obtener ID del usuario desde el contexto
        const idUsuario = user?.USUARIO?.USUA_ID || "";

        if (!idUsuario) {
          toast.error("No se pudo obtener la información del usuario");
          return;
        }

        const datosParaGuardar = {
          cliente: formData.cliente.toUpperCase(),
          codigosocio: formData.cedula,
          usuario: parseInt(idUsuario),
          comentariousuario: formData.comentario.toUpperCase(),
          vendedor: formData.vendedor.toUpperCase(),
          ingreso: formData.ingreso.toUpperCase(),
        };
        if(formData.estado) {
          datosParaGuardar.estado = formData.estado;
        }
        resultado = await actualizarTransaccionBancariaPorID(
          idTransaccion,
          datosParaGuardar
        );

        if (resultado.success) {
          // Actualizar solo el registro específico en ambos arrays
          const actualizarRegistro = (prevDatos) => {
            const index = prevDatos.findIndex(
              (item) => item.IDENTIFICADOR === idTransaccion
            );
            if (index === -1) return prevDatos;

            const nuevosDatos = [...prevDatos];
            nuevosDatos[index] = resultado.data;
            return nuevosDatos;
          };

          // Actualizar datos filtrados
          setDatosFiltrados(actualizarRegistro);

          // Actualizar todos los datos (para los contadores)
          setTodosLosDatos(actualizarRegistro);

          toast.success(resultado.message);

          handleCloseModal();
        } else {
          toast.error(resultado.message);
        }
      } catch (error) {
        toast.error(error.message || "Error al guardar los cambios");
      }
    },
    [transaccionSeleccionada, handleCloseModal, user]
  );

  // Verificar si realmente tiene acceso al recurso (principal o alternativo)
  const tieneAccesoReal = useMemo(() => {
    if (!user || !user.data || !routeConfig) return false;

    const userContexts = user.data;
    const recursoPrincipal = routeConfig.recurso;
    const recursosAlternativos = routeConfig.recursosAlternativos || [];

    // Verificar acceso al recurso principal
    if (
      recursoPrincipal &&
      hasAccessToResource(userContexts, recursoPrincipal)
    ) {
      return true;
    }

    // Verificar acceso a recursos alternativos
    if (recursosAlternativos.length > 0) {
      return recursosAlternativos.some((recursoAlt) =>
        hasAccessToResource(userContexts, recursoAlt)
      );
    }

    return false;
  }, [user, routeConfig]);

  // Mostrar mensaje si no hay permisos
  // Solo mostrar el mensaje si realmente no tiene acceso Y no hay empresas disponibles
  // Si tiene acceso pero no hay empresas, permitir el acceso (puede que no tenga empresas configuradas en el alcance)
  if (
    !tieneAccesoReal &&
    (!empresasDisponibles || empresasDisponibles.length === 0)
  ) {
    return (
      <ContainerUI
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div
          style={{
            fontSize: "16px",
            color: "#dc3545",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          No tienes permisos para acceder a los registros bancarios.
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#6c757d",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          Contacta al administrador para obtener acceso.
        </div>
      </ContainerUI>
    );
  }

  return (
    <ContainerUI
      flexDirection="column"
      width="100%"
      height="100%"
      justifyContent="flex-start"
    >
      <FiltrosUnificadosCartera
        empresasAcceso={empresasDisponibles}
        permissionsLoading={false}
        onFiltersChange={handleFiltersChange}
        refrescar={refrescarDatos}
        tiposTransaccionPermitidos={tiposTransaccionPermitidos}
        datosExternos={todosLosDatos.length > 0 ? todosLosDatos : null}
      />

      {/* Tabla de Transacciones Completa */}
      <TablaTransaccionesCompleto
        datosFiltrados={datosFiltrados}
        onEdit={handleEdit}
        filasPorPagina={filasPorPagina}
        cargando={cargando}
      />

      {/* Modal de Edición */}
      <ModalEdicionTransaccion
        isOpen={modalAbierto}
        transaccion={transaccionSeleccionada}
        onClose={handleCloseModal}
        onSave={handleSaveModal}
      />
    </ContainerUI>
  );
};
