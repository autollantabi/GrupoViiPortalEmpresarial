import React, { useEffect, useState, useMemo } from "react";
import { TablaInputsUI } from "../../../../components/UI/Components/TablaInputsUI";

import {
  ActualizarChequeCartera,
  InsertarChequeCartera,
  ListarChequesCartera,
  ListarClientesPorEmpresaCartera,
  ListarEmpresasCartera,
  ListarVendedoresPorEmpresaCartera,
} from "services/carteraService";
import { transformarDataAValueLabel } from "utils/Utils";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { useAuthContext } from "context/authContext";

const correosAgregar = [
  "cartera@maxximundo.com",
  "tecnologia@autollanta.com",
  "asistentecartera2@maxximundo.com",
  "cmiranda@maxximundo.com",
  "pcabrera@autollanta.com",
  "caja@stox.com.ec",
  "cventas1@ikonix.ec",
  "vanessai@autollanta.com",
];
const defaultOptionsTransporte = [
  { value: "LAAR COURIER", label: "LAAR COURIER" },
  { value: "NATIONAL CARGO", label: "NATIONAL CARGO" },
];
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Asegura dos dígitos
  const day = String(date.getUTCDate()).padStart(2, "0"); // Asegura dos dígitos
  return `${year}-${month}-${day}`;
};

export const GestionCheques = ({
  routeConfig,
  availableCompanies, // Del nuevo sistema de recursos (ProtectedContent)
  availableLines, // Del nuevo sistema de recursos (ProtectedContent)
}) => {
  const { user } = useAuthContext();
  // Estado que mantiene los datos de la tabla
  const [data, setData] = useState(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false); // Indica si la configuración está cargada

  // Convertir availableCompanies al formato esperado
  const empresasDisponibles = useMemo(() => {
    if (availableCompanies && availableCompanies.length > 0) {
      // Convertir { id, nombre } a { empresa: nombre, idempresa: id } para compatibilidad
      return availableCompanies.map(emp => ({
        empresa: emp.nombre,
        idempresa: emp.id,
      }));
    }
    return [];
  }, [availableCompanies]);

  const consultarEmpresas = async () => {
    const consulta = await ListarEmpresasCartera(user.USUARIO.USUA_CORREO);
    const consultaconPermisos = consulta.filter((item) =>
      empresasDisponibles.some((permiso) => item.EMPRESA === permiso.empresa)
    );

    const consultaT = transformarDataAValueLabel({
      data: consultaconPermisos,
      valueField: "IDENTIFICADOR",
      labelField: "EMPRESA",
    });
    return consultaT;
  };

  const consultarCheques = async () => {
    const consulta = await ListarChequesCartera();
    let formattedData = [];

    if (consulta.length > 0) {
      // Mapea los datos y transforma la columna FECHA
      formattedData = consulta.map((item) => ({
        ...item,
        FECHA: formatDateToYYYYMMDD(item.FECHA), // Formatea la fecha a 'YYYY-MM-DD'
      }));
    }

    // const formattedDataconPermisos = formattedData.filter(
    //   (item) => permisos.some((permiso)=>item.EMPRESA === permiso.empresa
    // ));

    setData(formattedData);
  };

  const mergeUniqueValuesWithDefaults = (data, column, defaultOptions) => {
    // Extraer valores únicos de la columna especificada en la data
    const uniqueValuesFromData = Array.from(
      new Set(data.map((item) => item[column])).values()
    ).filter(Boolean); // Filtra valores nulos o indefinidos

    // Transformar valores únicos a formato { value, label }
    const uniqueOptions = uniqueValuesFromData.map((value) => ({
      value: value,
      label: value,
    }));

    // Combinar opciones predeterminadas con las opciones únicas de la data
    const combinedOptions = [
      ...defaultOptions,
      ...uniqueOptions.filter(
        (opt) => !defaultOptions.some((defOpt) => defOpt.value === opt.value)
      ),
    ];

    return combinedOptions;
  };
  const [columnsConfig, setColumnsConfig] = useState([
    { header: "ID", field: "ID", isEditable: false },
    {
      header: "Fecha",
      field: "FECHA",
      isEditable: true,
      editType: "date",
      required: true,
      format: "date",
    },
    {
      header: "Empresa",
      field: "EMPRESA",
      fieldID: "CODIGO_EMPRESA",
      isEditable: true,
      editType: "dropdown",
      options: [],
      required: true,
      columnsRelated: ["ASESOR", "CODIGO_ASESOR", "CLIENTE", "CODIGO_CLIENTE"],
      // Al seleccionar una empresa, actualiza el select de Asesor
      onDependentLoad: async (option) => {
        if (option.label) {
          // Consulta de asesores
          const asesoresData = await ListarVendedoresPorEmpresaCartera({
            empresaId: option.label,
          });

          // Consulta de clientes
          const clientesData = await ListarClientesPorEmpresaCartera({
            correo: user.USUARIO.USUA_CORREO,
            empresaId: option.label,
          });

          // Devuelve un arreglo con los datos para actualizar varias columnas
          return [
            {
              data: transformarDataAValueLabel({
                data: asesoresData,
                valueField: "CODIGO_VENDEDOR",
                labelField: "VENDEDOR",
              }),
              field: "ASESOR", // Campo que se va a actualizar
            },
            {
              data: transformarDataAValueLabel({
                data: clientesData,
                valueField: "CODIGO_SOCIO",
                labelField: "NOMBRE_SOCIO",
              }),
              field: "CLIENTE", // Campo que se va a actualizar
            },
          ];
        } else {
          return [];
        }
      },
    },
    {
      header: "IDEMP",
      field: "CODIGO_EMPRESA",
      isEditable: false,
      editType: "number",
      required: true,
      visible: false,
    },

    {
      header: "Asesor",
      field: "ASESOR",
      fieldID: "CODIGO_ASESOR",
      isEditable: true,
      editType: "dropdown",
      options: [],
      required: true,
    },
    {
      header: "IDAS",
      field: "CODIGO_ASESOR",
      isEditable: false,
      editType: "number",
      required: true,
      visible: false,
    },

    {
      header: "Cliente",
      field: "CLIENTE",
      fieldID: "CODIGO_CLIENTE",
      isEditable: true,
      editType: "dropdown",
      options: [],
      required: true,
    },
    {
      header: "IDCLI",
      field: "CODIGO_CLIENTE",
      isEditable: false,
      editType: "number",
      required: true,
      visible: false,
    },
    {
      header: "Número de cheque",
      field: "CHEQUE",
      isEditable: true,
      editType: "textarea",
      required: true,
    },
    {
      header: "Valor",
      field: "VALOR",
      isEditable: true,
      editType: "number",
      required: true,
      format: "money",
    },
    {
      header: "Estado1",
      field: "ESTADO1",
      isEditable: true,
      editType: "dropdown",
      options: [
        { value: "PROTESTADO", label: "PROTESTADO" },
        { value: "RETENIDO", label: "RETENIDO" },
      ],
      required: true,
    },
    {
      header: "Estado2",
      field: "ESTADO2",
      isEditable: true,
      editType: "dropdown",
      options: [
        { value: "CANCELADO", label: "CANCELADO" },
        { value: "PENDIENTE DE COBRO", label: "PENDIENTE DE COBRO" },
        { value: "RECIBIDO COURIER", label: "RECIBIDO COURIER" },
      ],
      required: true,
    },
    {
      header: "Responsable del envío",
      field: "RESPONSABLE_ENVIO",
      isEditable: true,
      editType: "dropdown",
      options: [
        { value: "AVILA PAOLA", label: "AVILA PAOLA" },
        { value: "ILLESCAS VANESSA", label: "ILLESCAS VANESSA" },
        { value: "CABRERA PAOLA", label: "CABRERA PAOLA" },
        { value: "MIRANDA CARLA", label: "MIRANDA CARLA" },
        { value: "RAMON ALEXANDRA", label: "RAMON ALEXANDRA" },
        { value: "PINO VERONICA", label: "PINO VERONICA" },
        { value: "MONTERO CRISTINA", label: "MONTERO CRISTINA" },
      ],
      required: true,
    },
    {
      header: "Transporte",
      field: "TRANSPORTE",
      isEditable: true,
      editType: "dropdown-text",
      options: [],
      required: false,
    },
    {
      header: "Nro. Guía",
      field: "NRO_GUIA",
      isEditable: true,
      editType: "text",
      required: false,
    },
    {
      header: "Estado",
      field: "ESTADO_CHEQUE",
      isEditable: false,
      editType: "text",
      required: false,
      estadofield: true,
      visible: false,
    },
    // más configuraciones de columnas según sea necesario
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      if (data !== null) {
        try {
          // Llamadas asíncronas
          const transportes = mergeUniqueValuesWithDefaults(
            data,
            "TRANSPORTE",
            defaultOptionsTransporte
          );
          const empresas = await consultarEmpresas();

          // Actualizar configuración de columnas con las opciones cargadas
          const updatedColumns = columnsConfig.map((col) => {
            if (col.field === "TRANSPORTE") {
              return {
                ...col,
                options: transportes,
              };
            }
            if (col.field === "EMPRESA") {
              return {
                ...col,
                options: empresas,
              };
            }
            return col;
          });

          setColumnsConfig(updatedColumns);

          // Marcar la configuración como cargada
          setIsConfigLoaded(true);
        } catch (error) {
          console.error("Error al cargar datos:", error);
        }
      }
    };

    cargarDatos(); // Llamar a la función asíncrona
  }, [data]);

  // const obtenerLabelPorValue = ({ arreglo, valueBuscado }) => {
  //   const elemento = arreglo.find(
  //     (elemento) => elemento.value === valueBuscado
  //   );
  //   return elemento ? elemento.label : null;
  // };

  // Los permisos vienen de routeConfig inyectado por SimpleRouter

  useEffect(() => {
    const cargarDatos = async () => {
      await consultarCheques(); // Luego carga los datos de los cheques
    };

    cargarDatos();
  }, []);

  const defaultFilters = ["EMPRESA", "ASESOR", "CLIENTE"];

  const newRow = (data) => {
    return {
      ID: "", // Generar un nuevo ID infinito
      FECHA: "",
      EMPRESA: "",
      CODIGO_EMPRESA: "",
      ASESOR: "",
      CODIGO_ASESOR: "",
      CLIENTE: "",
      CODIGO_CLIENTE: "",
      CHEQUE: "",
      VALOR: "",
      ESTADO1: "",
      ESTADO2: "",
      RESPONSABLE_ENVIO: "",
      TRANSPORTE: "",
      NRO_GUIA: "",
      ESTADO_CHEQUE: -1,
    };
  };

  // Manejar la edición de datos
  const handleEdit = (updatedData) => {
    setData(updatedData); // Actualiza el estado con los nuevos datos
  };

  // Manejar el guardado de datos
  const handleSave = async (item) => {
    let confirmT = false;
    const chequeData = {
      fecha: item.FECHA,
      id_empresa: parseInt(item.CODIGO_EMPRESA),
      nombre_empresa: item.EMPRESA,
      codigo_asesor: parseInt(item.CODIGO_ASESOR),
      nombre_asesor: item.ASESOR,
      codigo_cliente: item.CODIGO_CLIENTE,
      nombre_cliente: item.CLIENTE,
      num_cheque: item.CHEQUE,
      valor: parseFloat(item.VALOR),
      estado1: item.ESTADO1,
      estado2: item.ESTADO2,
      responsable_envio: item.RESPONSABLE_ENVIO,
      transporte: item.TRANSPORTE,
      nro_guia: item.NRO_GUIA,
    };

    if (item.ID !== null && item.ID !== undefined && item.ID !== "") {
      chequeData.id = item.ID;
      try {
        const update = await ActualizarChequeCartera({ data: chequeData });
        confirmT = { id: item.ID, res: update };
      } catch (error) {
        console.error("Error al actualizar el cheque:", error);
        confirmT = { id: item.ID, res: false }; // Respuesta fallida
      }
    } else {
      try {
        const insert = await InsertarChequeCartera({ data: chequeData });
        confirmT = { id: insert?.id, res: insert?.creacion ?? false };
      } catch (error) {
        console.error("Error al insertar el cheque:", error);
        confirmT = { id: null, res: false }; // Respuesta fallida
      }
    }
    return confirmT;

    // consultarCheques();
  };

  // Manejar la ordenación de columnas
  const handleSort = (column, direction) => {
  };

  // Manejar el doble clic en una fila
  const handleDoubleClickRow = (item) => {
  };

  const estadocondiciones = [{ 1: ["TRANSPORTE", "NRO_GUIA"] }];

  // Si no hay empresas con acceso, mostrar mensaje
  if (!empresasDisponibles || empresasDisponibles.length === 0) {
    return (
      <ContainerUI height="100%" width="100%">
        <p>No tienes permisos para acceder a la gestión de cheques.</p>
      </ContainerUI>
    );
  }

  return (
    <ContainerUI height="100%" width="100%">
      {isConfigLoaded ? (
        <TablaInputsUI
          data={data}
          newRow={newRow}
          columnsConfig={columnsConfig}
          defaultFilters={defaultFilters}
          onSort={handleSort}
          onDoubleClickRow={handleDoubleClickRow}
          onEdit={handleEdit}
          onSave={handleSave}
          nombreID={"ID"}
          permisos={empresasDisponibles}
          estadocondiciones={estadocondiciones}
          // permisoagregar={correosAgregar}
        />
      ) : (
        <p>Cargando configuración, por favor espera...</p>
      )}
    </ContainerUI>
  );
};

