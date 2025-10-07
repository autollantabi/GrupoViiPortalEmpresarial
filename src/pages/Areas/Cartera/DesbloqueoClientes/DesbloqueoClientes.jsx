import React, { useEffect, useState } from "react";
import { ContenedorFlex } from "pages/Areas/AdministracionUsu/CSS/ComponentesAdminSC";
import { TablaInfo } from "components/UI/ComponentesGenericos/TablaInfo";
import { BotonConEstadoTexto } from "components/UI/ComponentesGenericos/Botones";
import {
  EnviarConfirmacionDesbloqueoClientes,
  ListarDesbloqueoClientes,
} from "services/carteraDesbloqueoClientesService";

import { toast } from "react-toastify";
import { ModalData } from "./ModalData";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { withPermissions } from "../../../../hoc/withPermissions";

const DesbloqueoClientesComponent = ({
  empresasAcceso,
  permissionsLoading,
}) => {
  // Estado que mantiene los datos de la tabla
  const [data, setData] = useState(null);
  const [dataGlobal, setDataGlobal] = useState(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [staticData, setStaticData] = useState(null);
  const [idModalMostrar, setIdModalMostrar] = useState(null);
  const [dataModal, setDataModal] = useState(null);

  const consultarDesbloqueoDeClientes = async () => {
    const desbloqClientes = await ListarDesbloqueoClientes();
    setStaticData(desbloqClientes);
    // const res1 = example.data;

    const clientesUnificados = Object.values(desbloqClientes).flat();
    // const clientesUnificados = Object.values(res1).flat();

    const clientesUnificadosConCodigo = clientesUnificados.map(
      (clientes, index) => ({
        ...clientes,
        codigo: index + 1,
      })
    );
    // console.log(clientesUnificadosConCodigo);

    setDataGlobal(clientesUnificadosConCodigo);
    const clientesDesbloquearClientePorDesbloquear =
      clientesUnificadosConCodigo.map((item) => ({
        ...item.clientePorDesbloquear,
        desbloqueo: item.desbloqueo,
        codigo: item.codigo,
      }));
    // console.log(clientesDesbloquearClientePorDesbloquear);

    setData(clientesDesbloquearClientePorDesbloquear);
  };

  const handleBuscarDataCliente = ({ id }) => {
    const busqueda = dataGlobal.find((item) => item.codigo === id);

    return busqueda;
  };

  const handleMostrarClientes = async () => {
    await consultarDesbloqueoDeClientes();
    setMostrarLista(true);
  };

  const handleEnviarConfirmacionData = async () => {
    if (staticData) {
      const dataEnvio = {
        data: staticData,
      };

      await EnviarConfirmacionDesbloqueoClientes({
        data: dataEnvio,
      });

      toast.success("Clientes debloqueados con éxito.");
    } else {
      toast.error("Error en la verificación");
    }
    setMostrarLista(false);
    setData(null);
    setStaticData(null);
  };

  useEffect(() => {
    setDataModal(null);
    if (idModalMostrar) {
      const dataParaModal = handleBuscarDataCliente({ id: idModalMostrar });
      setDataModal(dataParaModal);
    }
  }, [idModalMostrar]);

  // Mostrar loading mientras se cargan los permisos
  if (permissionsLoading) {
    return (
      <CustomContainer>
        <p>Cargando permisos, por favor espera...</p>
      </CustomContainer>
    );
  }

  // Si no hay empresas con acceso, mostrar mensaje
  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <CustomContainer>
        <p>No tienes permisos para acceder al desbloqueo de clientes.</p>
      </CustomContainer>
    );
  }

  const columnsConfig = [
    { header: "ID", field: "codigo" },
    {
      header: "Cuenta Semanal",
      field: "codigo_cuenta_semanal",
      editType: "text",
      visible: false,
    },
    {
      header: "EMPRESA",
      field: "empresa",
      editType: "dropdown",
    },
    {
      header: "CODIGO SOCIO",
      field: "codigo_socio",
      editType: "text",
      // format: "money",
    },
    {
      header: "SOCIO NEGOCIO",
      field: "nombre_semanal",
      editType: "text",
    },
    {
      header: "DÍAS ATRASO SÁBADO",
      field: "dias_atraso_sabado",
      editType: "text",
    },
    {
      header: "VALOR VENCIDO SÁBADO",
      field: "valor_vencido_sabado",
      editType: "text",
      format: "money",
    },
    {
      header: "DÍAS ATRASO ACTUAL",
      field: "dias_atraso_diario",
      editType: "text",
    },
    {
      header: "VALOR VENCIDO ACTUAL",
      field: "valor_vencido_diario",
      editType: "text",
      format: "money",
    },

    {
      header: "DÍAS ATRASO ACTUAL",
      field: "dias_atraso_diario",
      editType: "text",
      visible: false,
    },
    {
      header: "PROMEDIO DÍAS ATRASO HISTORICO",
      field: "promedio_dias_atraso_cheques",
      editType: "text",
    },
    {
      header: "TIPO",
      field: "tipo_desbloqueo",
      editType: "text",
    },

    // más configuraciones de columnas según sea necesario
  ];

  const defaultFilters = ["empresa"];

  return (
    <CustomContainer
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
    >
      {/* Botón para añadir una nueva fila */}
      {/* <button onClick={handleAddRow}>Añadir Fila</button> */}
      {!mostrarLista && (
        <CustomButton
          text="Generar Lista de Clientes a Checkear"
          onClick={handleMostrarClientes}
          isAsync
        />
      )}

      <CustomContainer
        flexDirection="column"
        width="100%"
        style={{ padding: 0 }}
      >
        {idModalMostrar && (
          <ModalData dataUsuario={dataModal} onClose={setIdModalMostrar} />
        )}
        {mostrarLista && data && (
          <TablaInfo
            data={data}
            columns={columnsConfig}
            defaultFilters={defaultFilters}
            sortedInitial={{ column: "CODIGO", direction: "asc" }}
            excel={false}
            idTable="codigo"
            includeModal
            setIdModal={setIdModalMostrar}
          />
        )}
        {mostrarLista && data && (
          <ContenedorFlex
            style={{
              width: "100%",
              marginRight: "10px",
              marginBottom: "20px",
              justifyContent: "flex-end",
            }}
          >
            <CustomButton
              text="Finalizar Verificación"
              onClick={handleEnviarConfirmacionData}
            />
          </ContenedorFlex>
        )}
      </CustomContainer>
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const DesbloqueoClientes = withPermissions(DesbloqueoClientesComponent);
