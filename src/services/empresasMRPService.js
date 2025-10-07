import { axiosInstance } from "config/axiosConfig";
import { v4 as uuidv4 } from "uuid";

export async function ListarEmpresas() {
  const res = await axiosInstance.get(
    `/usuario/datos/empresa/${localStorage.getItem("correo")}`
  );
  // console.log(res.data)
  return res.data;
}

export async function ListarMarcas(empresa) {
  const res = await axiosInstance.get(`/marca/${empresa}`);
  // console.table(res.data)
  return res.data;
}
export async function ListarProductos(empresa, marca) {
  const res = await axiosInstance.get(`/producto/obtener/${empresa}/${marca}`);
  // console.log(res.data)
  return res.data;
}
export async function ListarProductosAsignaciones(iempresa, imarca) {
  const res = await axiosInstance.get(
    `/producto/obtener/asignados/${iempresa}/${imarca}`
  );
  // console.log(res.data)
  return res.data;
}
export async function ListaParametrizacion() {
  const res = await axiosInstance.get(`/mrp`);
  // console.log(res.data)
  return res.data;
}
export async function Simular(iempresa, imarca) {
  const res = await axiosInstance.get(`/mrp/pedidos/${iempresa}/${imarca}`);
  // console.log(res.data)
  return res.data;
}
export async function ActualizarParametrizaciones(
  identificador,
  fecha,
  leadTime,
  NServicio,
  fetch
) {
  await axiosInstance.post(`/mrp/${identificador}`, {
    fechaMaxima: fecha,
    leadTime: leadTime,
    nivelServicio: NServicio,
  });
  fetch();
}

export async function GuardarPromocion(
  iempresa,
  nombre_empresa,
  nombrePromocion,
  FI,
  FF,
  Productos
) {
  try {
    await axiosInstance.post(`/promocion/${iempresa}`, {
      empresa: nombre_empresa,
      promocionNombre: nombrePromocion,
      fechaDesde: FI,
      fechaHasta: FF,
      productos: Productos,
    });

    return true;
  } catch (error) {
    console.error("Error al guardar la promoción:", error);
    return false;
  }
}

export async function ConsultarPromocion(iempresa) {
  try {
    const res = await axiosInstance.get(`/promocion/${iempresa}`);
    return res.data;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return "";
  }
}

export async function VerificarArchivoPromocion(fData) {
  try {
    const uuidCode = uuidv4();
    const res = await axiosInstance.post(`/promocion/archivo/${uuidCode}`, fData);
    // console.log(res.data);
    return res;
  } catch (error) {
    console.error("Error al recibir el archivo:", error);
    return error.response.data;
  }
}

export async function ConfirmarCargaArchivoPromocion(uuidCode) {
  try {
    await axiosInstance.post(`/promocion/archivo/subir/${uuidCode}`);
    // console.log(res.data);
    return true;
  } catch (error) {
    console.error("Error al recibir el archivo:", error);
    return false;
  }
}

export async function ConsultarAsignaciones(iempresa, imarca) {
  try {
    let res = "";
    if (imarca === "") {
      res = await axiosInstance.get(`/mrp/asignaciones/empresa/${iempresa}`);
    } else {
      res = await axiosInstance.get(
        `/mrp/asignaciones/empresa/marca/${iempresa}/${imarca}`
      );
    }
    return res.data;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return "";
  }
}

export async function AnadirAsignaciones(
  idProd1,
  idProd2,
  iempresa,
  nombreEmpresa,
  imarca,
  nombreMarca,
  fetch
) {
  try {
    await axiosInstance.post(
      `/mrp/asignaciones/${idProd1}/${idProd2}`,
      {
        empresa: nombreEmpresa,
        identificadorEmpresa: iempresa,
        marca: nombreMarca,
        identificadorMarca: imarca,
      }
    );
    fetch();
    return true;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}

export async function EliminarAsignaciones(idAsignacion, fetchD) {
  try {
    await axiosInstance.post(
      `/mrp/asignaciones/estado/${idAsignacion}/E`
    );
    fetchD();
    return true;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}

export async function EliminarPromocion(idPromo, estado, fetchD) {
  try {
    await axiosInstance.post(
      `/promocion/estado/${idPromo}/${estado}`
    );
    fetchD();
    return true;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}
export async function UpdatePedidoComercial({
  codItem,
  psugerido,
  usuario,
  bloqueado,
}) {
  try {
    const res = await axiosInstance.post(`/mrp/psugeridos`, {
      codItem,
      psugerido,
      usuario,
      bloqueado,
    });
    // console.log(res.status);
    if (res.status === 201) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}
export async function GetCodItemsPedidosComercial() {
  try {
    const res = await axiosInstance.get(`/mrp/items/sugeridos`);
    // console.log(res);
    if (res.status === 200) {
      return res.data;
    }
    return [];
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}
export async function FinalizarPedidoComercial({
  codigoEmpresa,
  codigoMarca,
  usuario,
  actualizar,
}) {
  try {
    const res = await axiosInstance.post(`/mrp/finalizarPedido/`, {
      codigoEmpresa,
      codigoMarca,
      usuario,
      actualizar,
    });
    if (res.status === 201) {
      if (res.data.update === 1) {
        return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}
export async function ConsultarEstadoPedidoComercial({
  codigoEmpresa,
  codigoMarca,
}) {
  try {
    const res = await axiosInstance.get(`/mrp/pedidoFinalizado/${codigoEmpresa}/${codigoMarca}`);
    if (res.status === 200) {
      if (res.data[0].finalizado === "SI") {
        return 1;
      } else {
        return 0;
      }
    }
  } catch (error) {
    console.error("Error al consultar la promoción:", error);
    return false;
  }
}
