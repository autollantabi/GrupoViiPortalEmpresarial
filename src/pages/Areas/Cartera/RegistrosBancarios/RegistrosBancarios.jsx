import React, { useState, useCallback, useMemo } from "react";
import TablaTransaccionesCompleto from "../ComponentesCartera/RegistrosBancarios/TablaTransaccionesCompleto";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { withPermissions } from "../../../../hoc/withPermissions";
import { usePermissions } from "../../../../hooks/usePermissions";
import { FiltrosUnificadosCartera } from "../ComponentesCartera/RegistrosBancarios/ComponentesUnificadosCartera";
import { ModalEdicionTransaccion } from "../ComponentesCartera/RegistrosBancarios/ModalEdicionTransaccion";
import {
  actualizarTransaccionBancariaPorID,
  actualizarEstadoTransaccionBancariaPorID,
} from "../../../../services/carteraService";
import { toast } from "react-toastify";

const RegistrosBancariosComponent = ({
  empresasAcceso,
  permissionsLoading,
  routeConfig,
}) => {
  // Obtener permisos por módulo para saber desde dónde viene el usuario
  const { permissionsByModule } = usePermissions("REGISTROS BANCARIOS", null);

  // Determinar los tipos de transacción permitidos según los módulos padre
  const tiposTransaccionPermitidos = useMemo(() => {
    const modulosPermisos = JSON.parse(localStorage.getItem("modulos")) || [];
    const tiposPermitidos = [];

    // Función para buscar todos los módulos padre de REGISTROS BANCARIOS
    const findAllParentModules = (modules) => {
      for (const module of modules) {
        // Verificar si REGISTROS BANCARIOS está dentro de CARTERA
        if (module.modulo === "CARTERA" && module.children) {
          const hasRegistros = module.children.some(
            (child) => child.modulo === "REGISTROS BANCARIOS"
          );
          if (hasRegistros && !tiposPermitidos.includes("C")) {
            tiposPermitidos.push("C"); // CARTERA -> tipo C
          }
        }

        // Verificar si REGISTROS BANCARIOS está dentro de CONTABILIDAD
        if (module.modulo === "CONTABILIDAD" && module.children) {
          const hasRegistros = module.children.some(
            (child) => child.modulo === "REGISTROS BANCARIOS"
          );
          if (hasRegistros && !tiposPermitidos.includes("D")) {
            tiposPermitidos.push("D"); // CONTABILIDAD -> tipo D
          }
        }

        // Buscar recursivamente en children
        if (module.children && module.children.length > 0) {
          findAllParentModules(module.children);
        }
      }
    };

    findAllParentModules(modulosPermisos);
    return tiposPermitidos;
  }, [permissionsByModule]);
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

        if (
          formData.estado &&
          formData.estado !== undefined &&
          formData.estado !== null
        ) {
          resultado = await actualizarEstadoTransaccionBancariaPorID(
            idTransaccion,
            formData.estado,
            localStorage.getItem("identificador"),
            formData.comentario || "",
            formData.ingreso || ""
          );
        } else {
          const datosParaGuardar = {
            cliente: formData.cliente.toUpperCase(),
            codigosocio: formData.cedula,
            usuario: parseInt(localStorage.getItem("identificador")),
            comentariousuario: formData.comentario.toUpperCase(),
            vendedor: formData.vendedor.toUpperCase(),
            ingreso: formData.ingreso.toUpperCase(),
          };
          resultado = await actualizarTransaccionBancariaPorID(
            idTransaccion,
            datosParaGuardar
          );
        }

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
        console.error("Error al guardar:", error);
        toast.error(error.message);
      }
    },
    [transaccionSeleccionada, handleCloseModal]
  );

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
        style={{
          padding: "20px",
          backgroundColor: "rgba(248, 249, 250, 0.8)",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            color: "#6c757d",
            textAlign: "center",
          }}
        >
          Cargando permisos de acceso...
        </div>
      </CustomContainer>
    );
  }

  // Mostrar mensaje si no hay permisos
  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <CustomContainer
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
      </CustomContainer>
    );
  }

  return (
    <CustomContainer
      flexDirection="column"
      width="100%"
      height="100%"
      justifyContent="flex-start"
    >
      <FiltrosUnificadosCartera
        empresasAcceso={empresasAcceso}
        permissionsLoading={permissionsLoading}
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
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const RegistrosBancarios = withPermissions(RegistrosBancariosComponent);
