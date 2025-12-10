import { axiosInstance } from "config/axiosConfig";

export async function ListarEmpresas() {
  try {
    const res = await axiosInstance.get(`/empresas`);
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function ListarMarcas(idempresa, idproveedor) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/marcas/${idempresa}/${idproveedor}`
    );
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function ListarProveedores(idempresa) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/proveedor/${idempresa}`
    );
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
async function ListarPedidos(idempresa, proveedor, marca) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/pedidos/${idempresa}/${proveedor}/${marca}`
    );
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}

export async function ObtenerPedidosPorMarca(emp, pr, marcas) {
  try {
    const pedidosUnidos = []; // Aquí se almacenarán todos los pedidos acumulados

    // Itera sobre cada objeto de marca en el array de marcas
    for (const marca of marcas) {
      try {
        // Llama a ListarPedidos para cada marca individualmente
        const resultados = await ListarPedidos(emp, pr, marca.value);
        // console.log(resultados);
        // Modifica cada objeto en resultados para añadir marca.value a name
        const resultadosModificados = resultados.map((pedido) => ({
          ...pedido,
          name: `${marca.name} / ${pedido.name}`, // Concatena marca.value con el name actual
        }));
        // Agrega los resultados modificados al array acumulado de pedidos
        pedidosUnidos.push(...resultadosModificados); // Asegúrate de que resultados sea un array
      } catch (error) {
        console.error(
          `Error al obtener pedidos para la marca ${marca.name}:`,
          error
        );
      }
    }

    return pedidosUnidos; // Devuelve el array completo de pedidos acumulados
  } catch (e) {
    return [];
  }
}

export async function InsertarImportacion({
  idempresa,
  empresa,
  idproveedor,
  proveedor,
  idsmarcas,
  marcasN,
  clientesU,
  imp,
  // fetch,
}) {
  try {
    // Construir el objeto del body dinámicamente
    const body = {
      cod_empresa: idempresa,
      empresa: empresa,
      cod_proveedor: idproveedor,
      proveedor: proveedor,
      cod_marca: idsmarcas,
      marca: marcasN,
      imp,
    };

    // Solo agregar sociosNegocios si clientesU no es null o undefined
    if (clientesU !== null && clientesU !== undefined) {
      body.sociosNegocios = clientesU;
    }

    const res = await axiosInstance.post(
      `/importaciones/insertarimportacion/`,
      body
    );
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function ConsultarImportacionesQ() {
  try {
    const res = await axiosInstance.post(
      `/importaciones/consultarImportacion/`
    );
    fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function ConsultarAgentesForwarder() {
  try {
    const res = await axiosInstance.get(`/importaciones/navieras/`);
    return res;
  } catch (error) {
    return [];
  }
}
export async function ConsultarTransportistas() {
  try {
    const res = await axiosInstance.get(`/importaciones/transportistas/`);
    return res;
  } catch (error) {
    return [];
  }
}
export async function ConsultarAgentesAduana() {
  try {
    const res = await axiosInstance.get(`/importaciones/aduanero/`);
    return res;
  } catch (error) {
    return [];
  }
}
export async function InsertarNegociacionForwarder({
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
  etapa,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(
      `/importaciones/negociacionForwarder/`,
      {
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
        etapa,
      }
    );
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdateGeneralImportacion({
  codigo,
  estado,
  observacion,
  usuario_asignado,
  PI,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/updateGeneral/`, {
      id: parseInt(codigo),
      estado: estado,
      observacion: observacion,
      usuario_asignado: usuario_asignado,
      PI,
    });
    console.log(res);

    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdateIngresoTransacciones({
  id,
  estado_pago,
  saldo_por_pagar,
  fecha_pago_total,
  etapa,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/transaccion/`, {
      id,
      estado_pago,
      saldo_por_pagar,
      fecha_pago_total,
      etapa,
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdatePermisosImportacion({
  id,
  poliza,
  valor_poliza,
  per_INEN,
  per_ECA,
  per_MINSA,
  per_FAD,
  etapa,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(
      `/importaciones/permisosImportacion/`,
      {
        id,
        poliza,
        valor_poliza,
        per_INEN,
        per_ECA,
        per_MINSA,
        per_FAD,
        etapa,
      }
    );
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdateMovilizacion({
  id,
  fecha_salida_bodega,
  fecha_estimada_bodega,
  transportista_asignado,
  etapa,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/movilizacion/`, {
      id,
      fecha_salida_bodega,
      fecha_estimada_bodega,
      transportista_asignado,
      etapa,
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdateMercaderiaEnBodega({
  id,
  fecha_hora_llegada_bodega,
  fecha_hora_descarga_bodega,
  confirme_importacion,
  validacion_bodega_ventas,
  observacion_bodega,
  etapa,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/bodega/`, {
      id,
      fecha_hora_llegada_bodega,
      fecha_hora_descarga_bodega,
      confirme_importacion,
      validacion_bodega_ventas,
      observacion_bodega,
      etapa,
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function UpdateNacionalizacion({
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
  etapa,
  // fetch,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/nacionalizacion/`, {
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
      etapa,
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function InsertarIngresoFactProveedor({
  id,
  num_transito,
  num_pi,
  factura_reserva,
  estado_transito,
  estado_documentos,
  fecha_entrega_real,
  etd_real,
  eta_real,
  fecha_operacion,
  num_tracking,
  comentario1,
  comentario2,
  IMP,
  etapa,
}) {
  try {
    const res = await axiosInstance.post(`/importaciones/facturaProveedor/`, {
      id,
      num_transito,
      num_pi,
      factura_reserva,
      estado_transito,
      estado_documentos,
      fecha_entrega_real,
      etd_real,
      eta_real,
      fecha_operacion,
      num_tracking,
      comentario1,
      comentario2,
      IMP,
      etapa,
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function ObtenerArchivosPricing({ id, tipo }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/pricingOB/${id}/${tipo}`
    );
    return res;
  } catch (error) {
    return [];
  }
}
export async function ObtenerArchivosProveedor({ id, tipo }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/documentosOB/${id}/${tipo}`
    );
    // const res = []
    // console.log(res);

    return res;
  } catch (error) {
    return [];
  }
}
export async function DescargarArchivoProveedor({ id }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/descargarArchivo/${id}`,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      }
    );

    return {
      data: res.data,
    };
  } catch (error) {
    return [];
  }
}
export async function ObtenerArchivosBodega({ id }) {
  try {
    const res = await axiosInstance.get(`/importaciones/bodegaOB/${id}`);
    return res;
  } catch (error) {
    return [];
  }
}
export async function EliminarArchivo({ id_documento }) {
  try {
    const res = await axiosInstance.post(`/importaciones/eliminar/`, {
      id_documento,
    });
    return res;
  } catch (error) {
    return [];
  }
}
export async function RegistrarDocumentosProveedor({
  id,
  archivos,
  tipo,
  rutaBase,
  rutaCarpeta,
}) {
  // console.log(CARGA);
  // Crear un objeto FormData
  const formData = new FormData();

  // Añadir el archivo y el ID al FormData. Asegúrate de que CARGA[0] es un archivo.
  for (const arch of archivos) {
    formData.append("archivos", arch);
  }
  formData.append("id", id);
  formData.append("tipo", tipo);
  // console.log(archivos);
  try {
    const res = await axiosInstance.post(`/${rutaBase}`, formData, {
      headers: {
        // Esto es necesario para el envío de archivos
        "Content-Type": "multipart/form-data",
      },
    });
    await axiosInstance.post(`/${rutaCarpeta}`, formData, {
      headers: {
        // Esto es necesario para el envío de archivos
        "Content-Type": "multipart/form-data",
      },
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function RegistrarDocumentosBodega({ id, archivos }) {
  // console.log(CARGA);
  // Crear un objeto FormData
  const formData = new FormData();

  // Añadir el archivo y el ID al FormData. Asegúrate de que CARGA[0] es un archivo.
  for (const arch of archivos) {
    formData.append("archivos", arch);
  }
  formData.append("id", id);
  // console.log(archivos);
  try {
    const res = await axiosInstance.post(
      `/importaciones/documentosBodegaBD/`,
      formData,
      {
        headers: {
          // Esto es necesario para el envío de archivos
          "Content-Type": "multipart/form-data",
        },
      }
    );

    await axiosInstance.post(`/importaciones/documentosBodegaC/`, formData, {
      headers: {
        // Esto es necesario para el envío de archivos
        "Content-Type": "multipart/form-data",
      },
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}
export async function RegistrarDocumentosPricing({ id, archivo, tipo }) {
  // console.log(CARGA);
  // Crear un objeto FormData
  const formData = new FormData();

  // Añadir el archivo y el ID al FormData. Asegúrate de que CARGA[0] es un archivo.
  formData.append("archivo", archivo);
  formData.append("id", id);
  formData.append("tipo", tipo);
  try {
    const res = await axiosInstance.post(
      `/importaciones/pricingBD/`,
      formData,
      {
        headers: {
          // Esto es necesario para el envío de archivos
          "Content-Type": "multipart/form-data",
        },
      }
    );
    await axiosInstance.post(`/importaciones/pricingC/`, formData, {
      headers: {
        // Esto es necesario para el envío de archivos
        "Content-Type": "multipart/form-data",
      },
    });
    // fetch();
    return res;
  } catch (error) {
    return [];
  }
}

export async function ListarImportaciones() {
  try {
    const res = await axiosInstance.get(`/importaciones/consulta/`);
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function BuscarDatosPorIDCarga(idcarga) {
  try {
    const res = await axiosInstance.get(`/importaciones/consultaID/${idcarga}`);
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function Consultarpis(empresa) {
  try {
    const res = await axiosInstance.get(`/importaciones/PI/${empresa}`);
    // console.log(res.data)
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function ConsultarDataPI(empresa, PI) {
  try {
    // console.log(empresa, "-", PI);
    const res = await axiosInstance.post(
      `/importaciones/PI/detalle/${empresa}`,
      { PI: PI }
    );
    // console.log(res);
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function ConsultarTTED({ codigo }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/estimadotransito/${codigo}`
    );
    // console.log(res);
    if (res.status === 200) {
      return res.data[0].tiempo_estimado;
    } else {
      return "";
    }
  } catch (e) {
    return "";
  }
}
export async function ConsultarTTRD({ codigo }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/realtransito/${codigo}`
    );
    if (res.status === 200) {
      return res.data[0].tiempo_real;
    } else {
      return "";
    }
  } catch (e) {
    return "";
  }
}
export async function ConsultarDataTransaccionesSegunPI(empresa, PI) {
  try {
    // console.log(empresa, "-", PI);
    const res = await axiosInstance.post(
      `/importaciones/PI/transaccion/${empresa}`,
      { PI: PI }
    );
    // console.log(res.data);
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function ConsultarFechaSalgoPagar({ id, proveedor }) {
  try {
    console.log(id, proveedor);
    const res = await axiosInstance.post(
      `/importaciones/pagar/fecha/`,
      { id, proveedor }
    );

    console.log(res);
    return res.data;
  } catch (e) {
    return [];
  }
}
export async function FinalizarImportacion({ id }) {
  try {
    const res = await axiosInstance.post(`/importaciones/terminar/`, { id });
    console.log(res.data);
    return res.data;
  } catch (e) {
    return [];
  }
}

export async function EjecutarBatImportaciones() {
  try {
    const res = await axiosInstance.post(`/importaciones/cargaBat/`);
    if (res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
export async function ConsultarPGs({ empresa, PI }) {
  try {
    const res = await axiosInstance.post(
      `/importaciones/obtenerPG/${empresa}`,
      {
        PI,
      }
    );
    if (res.status === 200) {
      return res.data;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
}
export async function UpdatePGs({ codigo, pedidos }) {
  try {
    const res = await axiosInstance.post(`/importaciones/actualizarPG/`, {
      codigo,
      pedidos,
    });
    if (res.status === 201) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
export async function ObtenerEstadosdeFinalizacion() {
  try {
    const res = await axiosInstance.get(`/importaciones/estadosFinalizados/`);
    if (res.status === 200) {
      return res.data;
    } else {
      return [];
    }
  } catch (e) {
    return [];
  }
}
export async function ConsultarIMPSegunProveedor({ codigoProveedor, empresa }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/obtenerIMP/${codigoProveedor}/${empresa}`
    );
    console.log(res);

    if (res.status === 200) {
      return res.data[0].NEW_IMP;
    } else {
      return "";
    }
  } catch (e) {
    return "";
  }
}

export async function UpdatePricing({ id, correo }) {
  try {
    const res = await axiosInstance.post(`/importaciones/upItemsNuevos/`, {
      id,
      correo,
    });

    if (res.status === 201 || res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}

export async function ObtenerDatosPricing({ id }) {
  try {
    const res = await axiosInstance.get(
      `/importaciones/obtenerEnvioItem/${id}`
    );

    if (res.status === 200) {
      let itmN = res.data[0].ITEM_NUEVO;

      if (itmN != null) {
        return itmN;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}

export async function EnviarCorreoPricing({ idImportacion, destinatarios }) {
  try {
    const res = await axiosInstance.post(
      `/correo/enviarcorreoImportacionPricing/${idImportacion}`,
      {
        destinatarios,
      }
    );
    // console.log(res);

    if (res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
export async function EnviarCorreoBodega({ idImportacion, destinatarios }) {
  try {
    const res = await axiosInstance.post(
      `/correo/enviarcorreoImportacionBodega/${idImportacion}`,
      {
        destinatarios,
      }
    );
    // console.log(res);

    if (res.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
}
