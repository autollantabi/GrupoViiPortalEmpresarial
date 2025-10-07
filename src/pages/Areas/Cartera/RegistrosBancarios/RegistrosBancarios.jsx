import React, { useState, useCallback } from "react";
import TablaTransaccionesCompleto from "../ComponentesCartera/RegistrosBancarios/TablaTransaccionesCompleto";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { withPermissions } from "../../../../hoc/withPermissions";
import { FiltrosUnificadosCartera } from "../ComponentesCartera/RegistrosBancarios/ComponentesUnificadosCartera";
import { ModalEdicionTransaccion } from "../ComponentesCartera/RegistrosBancarios/ModalEdicionTransaccion";
import {
  ActualizarTransaccion,
  ActualizarEstadoTransaccion,
} from "../../../../services/carteraService";
import { toast } from "react-toastify";

const RegistrosBancariosComponent = ({
  empresasAcceso,
  permissionsLoading,
}) => {
  // Estados para datos filtrados y configuración
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [filasPorPagina, setFilasPorPagina] = useState(15);
  const [refrescarDatos, setRefrescarDatos] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Estados para el modal de edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null);

  // Callback para manejar cambios en los filtros
  const handleFiltersChange = useCallback((filtros) => {
    // Actualizar datos filtrados
    if (filtros.datosFiltrados) {
      setDatosFiltrados(filtros.datosFiltrados);
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

        // Si se cambió el estado, usar ActualizarEstadoTransaccion
        if (
          formData.estado &&
          formData.estado !== undefined &&
          formData.estado !== null
        ) {
          resultado = await ActualizarEstadoTransaccion({
            id: formData.identificador,
            estado: formData.estado,
            identificadorUsuario: localStorage.getItem("identificador"),
            comentario: formData.comentario || "",
            ingreso: formData.ingreso || "",
          });
        } else {
          // Si NO cambió el estado, usar ActualizarTransaccion
          const datosParaGuardar = {
            id: formData.identificador,
            fechatransaccion: transaccionSeleccionada.FECHA_TRANSACCION,
            agencia: transaccionSeleccionada.AGENCIA,
            cliente: formData.cliente.toUpperCase(),
            codigosocio: formData.cedula,
            comentario: formData.comentario.toUpperCase(),
            tipotransaccion: transaccionSeleccionada.TIPO_TRANSACCION,
            ordenante: transaccionSeleccionada.ORDENANTE,
            moneda: transaccionSeleccionada.MONEDA,
            bancoordenante: transaccionSeleccionada.BANCO_ORDENANTE,
            cuentaordenante: transaccionSeleccionada.CUENTA_ORDENANTE,
            conceptotransaccion:
              transaccionSeleccionada.CONCEPTO_TRANSACCION.toUpperCase(),
            cuentadestino: transaccionSeleccionada.CUENTA_DESTINO,
            informacionadicional: transaccionSeleccionada.INFORMACION_ADICIONAL,
            canal: transaccionSeleccionada.CANAL,
            usuario: parseInt(localStorage.getItem("identificador")),
            comentariousuario: formData.comentario.toUpperCase(),
            codigovendedor: null,
            vendedor: formData.vendedor.toUpperCase(),
            ingreso: formData.ingreso.toUpperCase(),
          };
          resultado = await ActualizarTransaccion(datosParaGuardar);
        }

        if (resultado) {
          toast.success("Transacción actualizada correctamente");
          handleCloseModal();
          // Refrescar datos para mostrar cambios
          setRefrescarDatos((prev) => prev + 1);
        } else {
          toast.error("Error al actualizar la transacción");
        }
      } catch (error) {
        console.error("Error al guardar:", error);
        toast.error("Error al actualizar la transacción");
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
