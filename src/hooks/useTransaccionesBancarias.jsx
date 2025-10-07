import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ActualizarEstadoTransaccion,
  ActualizarTransaccion,
  ConsultarClientesPorEmpresa,
  consultarTodasTransaccionesBancarias,
  ConsultarTransaccionesConFiltros,
  ConsultarTransaccionesUsuario,
  ConsultarTransaccionPorID,
  ConsultarVendedoresPorEmpresa,
} from "services/carteraService";

// Hook personalizado para manejar transacciones bancarias
export const useTransaccionesBancarias = (datos, bfiltro, setCargaDatos) => {
  // Estados principales
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState("");
  const [bancos, setBancos] = useState([]);

  // Obtener datos de transacciones
  const obtenerTransaccionesBancarias = useCallback(async () => {
    if (!datos || datos.length === 0) return;

    try {
      setLoading(true);
      setCargaDatos(1);

      const responseData = await consultarTodasTransaccionesBancarias();

      setData(responseData);
      console.log(responseData);
      obtenerBancosyEmpresa(responseData);

      setTimeout(() => {
        setLoading(false);
        setCargaDatos(0);
      }, 1000);
    } catch (error) {
      console.error("Error en la solicitud de transacciones:", error);
      setLoading(false);
      setCargaDatos(0);
    }
  }, [datos, setCargaDatos]);

  // Obtener bancos y empresa únicos
  const obtenerBancosyEmpresa = useCallback((dataf) => {
    const empresaSD = obtenerDatosSinDuplicados(dataf, "NOMBRE_EMPRESA");
    const bancosSD = obtenerDatosSinDuplicados(dataf, "NOMBRE_BANCO");
    setEmpresa(empresaSD);
    setBancos(bancosSD);
    console.log(empresaSD, bancosSD);
  }, []);

  // Obtener datos sin duplicados
  const obtenerDatosSinDuplicados = useCallback((data, columna) => {
    const datos = data.map((objeto) => objeto[columna]);
    return datos.filter(
      (valor, index, array) => array.indexOf(valor) === index
    );
  }, []);

  // Effect para cargar datos cuando cambian los filtros
  useEffect(() => {
    if (bfiltro !== 0) {
      obtenerTransaccionesBancarias();
    }
  }, [bfiltro, obtenerTransaccionesBancarias]);

  return {
    data,
    loading,
    empresa,
    bancos,
    obtenerTransaccionesBancarias,
  };
};

// Hook para manejar edición de transacciones
export const useEdicionTransacciones = () => {
  const [editId, setEditID] = useState(-1);
  const [editando, setEditando] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState(null);

  // Campos de edición
  const [camposEdicion, setCamposEdicion] = useState({
    fecha: "",
    valor: "",
    agencia: "",
    cliente: "",
    cliente_banco: "",
    cedula: "",
    comentario: "",
    refbanco: "",
    vendedor: "",
    ingreso: "",
    tipotransaccion: "",
    conceptotransaccion: "",
    identificadorvendedor: "",
    identificacion: 0,
  });

  // Iniciar edición
  const iniciarEdicion = useCallback(async (id, banco) => {
    try {
      const transaccion = await ConsultarTransaccionPorID(id);
      if (transaccion) {
        setCamposEdicion({
          fecha: transaccion.FECHA_TRANSACCION || "",
          valor: transaccion.VALOR || "",
          agencia: transaccion.AGENCIA || "",
          cliente: transaccion.CLIENTE || "",
          cliente_banco: transaccion.CLIENTE_BANCO || "",
          cedula: transaccion.CODIGO_SOCIO || "",
          comentario: transaccion.COMENTARIO || "",
          refbanco: transaccion.REFERENCIA_BANCO || "",
          vendedor: transaccion.VENDEDOR || "",
          ingreso: transaccion.INGRESO || "",
          tipotransaccion: transaccion.TIPO_TRANSACCION || "",
          conceptotransaccion: transaccion.CONCEPTO_TRANSACCION || "",
          identificadorvendedor: "",
          identificacion: 0,
        });
        setTransaccionEditando(transaccion);
      }
      setEditID(id);
      setEditando(true);
    } catch (error) {
      console.error(`Error al obtener transacción ${id}:`, error);
    }
  }, []);

  // Cancelar edición
  const cancelarEdicion = useCallback(() => {
    setEditID(-1);
    setEditando(false);
    setTransaccionEditando(null);
    setCamposEdicion({
      fecha: "",
      valor: "",
      agencia: "",
      cliente: "",
      cliente_banco: "",
      cedula: "",
      comentario: "",
      refbanco: "",
      vendedor: "",
      ingreso: "",
      tipotransaccion: "",
      conceptotransaccion: "",
      identificadorvendedor: "",
      identificacion: 0,
    });
  }, []);

  // Actualizar campo de edición
  const actualizarCampo = useCallback((campo, valor) => {
    setCamposEdicion((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }, []);

  // Guardar cambios
  const guardarCambios = useCallback(async () => {
    if (!editId) return false;

    try {
      if (
        camposEdicion.identificacion === "-1" ||
        camposEdicion.identificacion === "3" ||
        camposEdicion.identificacion === "4"
      ) {
        // Actualizar solo estado
        const resultado = await ActualizarEstadoTransaccion({
          id: editId,
          estado: camposEdicion.identificacion,
          comentario: camposEdicion.comentario.toUpperCase(),
          ingreso:
            camposEdicion.identificacion === "3"
              ? camposEdicion.ingreso.toUpperCase()
              : "",
        });
        return resultado;
      } else {
        // Actualizar datos completos
        const fechaConvertida = convertirAFecha(camposEdicion.fecha);
        const resultado = await ActualizarTransaccion({
          id: editId,
          fechatransaccion: fechaConvertida,
          agencia: camposEdicion.agencia,
          cliente: camposEdicion.cliente,
          codigosocio: camposEdicion.cedula,
          comentario: camposEdicion.refbanco,
          tipotransaccion: camposEdicion.tipotransaccion,
          conceptotransaccion: camposEdicion.conceptotransaccion,
          comentariousuario: camposEdicion.comentario,
          identificadorvendedor: camposEdicion.identificadorvendedor,
          vendedor: camposEdicion.vendedor,
          ingreso: camposEdicion.ingreso,
        });
        return resultado;
      }
    } catch (error) {
      console.error("Error al actualizar transacción:", error);
      return false;
    }
  }, [editId, camposEdicion]);

  // Función auxiliar para convertir fechas
  const convertirAFecha = useCallback((fecha) => {
    if (fecha instanceof Date) {
      return fecha;
    } else if (typeof fecha === "string") {
      const partesFecha = fecha.split("-");
      if (partesFecha.length === 3) {
        const dia = parseInt(partesFecha[0], 10);
        const mes = parseInt(partesFecha[1], 10) - 1;
        const anio = parseInt(partesFecha[2], 10);

        if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
          return new Date(anio, mes, dia);
        }
      }
    }
    return null;
  }, []);

  return {
    editId,
    editando,
    transaccionEditando,
    camposEdicion,
    iniciarEdicion,
    cancelarEdicion,
    actualizarCampo,
    guardarCambios,
  };
};

// Hook para manejar filtros y búsqueda
export const useFiltrosTransacciones = (data) => {
  const [filtroGlobal, setFiltroGlobal] = useState("");
  const [columnaFiltro, setColumnaFiltro] = useState("0");
  const [filtrosEstado, setFiltrosEstado] = useState({
    p: false,
    i: false,
    n: false,
    c: false,
    g: false,
    t: false,
    aux: [],
  });

  // Aplicar filtro por columna
  const aplicarFiltroColumna = useCallback(
    (opcion, datos) => {
      if (!datos || datos.length === 0) return [];

      const filtroLower = filtroGlobal.toLowerCase();

      switch (opcion) {
        case "ID":
          return datos.filter((item) =>
            item.IDENTIFICADOR_VERSION?.toString()
              .toLowerCase()
              .includes(filtroLower)
          );
        case "NDOCUMENTO":
          return datos.filter((item) =>
            item.NUMERO_DOCUMENTO?.toString()
              .toLowerCase()
              .includes(filtroLower)
          );
        case "FECHA":
          return datos.filter((item) =>
            item.FECHA_TRANSACCION?.toString()
              .toLowerCase()
              .includes(filtroLower)
          );
        case "VALOR":
          return datos.filter((item) =>
            item.VALOR?.toString().toLowerCase().includes(filtroLower)
          );
        case "CLIENTE":
          return datos.filter((item) => {
            const cliente = item.CLIENTE?.toString().toLowerCase() || "";
            const codigoSocio =
              item.CODIGO_SOCIO?.toString().toLowerCase() || "";
            return (
              cliente.includes(filtroLower) || codigoSocio.includes(filtroLower)
            );
          });
        default:
          return datos.filter((item) => {
            const valuesToSearch = Object.values(item).join(" ").toLowerCase();
            return valuesToSearch.includes(filtroLower);
          });
      }
    },
    [filtroGlobal]
  );

  // Datos filtrados
  const datosFiltrados = useMemo(() => {
    if (!data || data.length === 0) return [];

    let resultado = data;

    // Aplicar filtro global/columnar
    if (columnaFiltro === "0") {
      resultado = data.filter((item) => {
        const valuesToSearch = Object.values(item).join(" ").toLowerCase();
        return valuesToSearch.includes(filtroGlobal.toLowerCase());
      });
    } else {
      resultado = aplicarFiltroColumna(columnaFiltro, data);
    }

    // Aplicar filtros de estado
    if (filtrosEstado.aux.length > 0) {
      resultado = resultado.filter((item) =>
        filtrosEstado.aux.includes(parseInt(item.ESTADO))
      );
    }

    return resultado;
  }, [data, filtroGlobal, columnaFiltro, filtrosEstado, aplicarFiltroColumna]);

  // Manejar cambio de filtro de estado
  const manejarFiltroEstado = useCallback((event) => {
    const { name, checked } = event.target;

    const mapeoEstados = {
      p: 0,
      i: 1,
      c: 2,
      n: -1,
      g: 3,
      t: 4,
    };

    const valorEstado = mapeoEstados[name];
    if (valorEstado === undefined) return;

    setFiltrosEstado((prev) => ({
      ...prev,
      [name]: checked,
      aux: checked
        ? [...prev.aux, valorEstado]
        : prev.aux.filter((v) => v !== valorEstado),
    }));
  }, []);

  // Contar transacciones por estado
  const contarPorEstado = useCallback(
    (estado, datos = datosFiltrados) => {
      return datos.filter((item) => parseInt(item.ESTADO) === estado).length;
    },
    [datosFiltrados]
  );

  return {
    filtroGlobal,
    setFiltroGlobal,
    columnaFiltro,
    setColumnaFiltro,
    filtrosEstado,
    manejarFiltroEstado,
    datosFiltrados,
    contarPorEstado,
  };
};

// Hook para manejar paginación
export const usePaginacion = (datos, filasPorPagina = 15) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPagina, setFilasPagina] = useState(filasPorPagina);

  // Datos de la página actual
  const datosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPagina;
    const fin = inicio + filasPagina;
    return datos.slice(inicio, fin);
  }, [datos, paginaActual, filasPagina]);

  // Total de páginas
  const totalPaginas = useMemo(() => {
    return Math.ceil(datos.length / filasPagina);
  }, [datos.length, filasPagina]);

  // Cambiar página
  const cambiarPagina = useCallback((pagina) => {
    setPaginaActual(pagina);
  }, []);

  // Cambiar filas por página
  const cambiarFilasPagina = useCallback((filas) => {
    setFilasPagina(filas);
    setPaginaActual(1);
  }, []);

  return {
    paginaActual,
    filasPagina,
    datosPagina,
    totalPaginas,
    cambiarPagina,
    cambiarFilasPagina,
  };
};

// Hook para manejar autocompletado de clientes y vendedores
export const useAutocompletado = (empresa) => {
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [sugerenciasCliente, setSugerenciasCliente] = useState([]);
  const [sugerenciasVendedor, setSugerenciasVendedor] = useState([]);

  // Cargar clientes
  const cargarClientes = useCallback(async (empresaNombre) => {
    try {
      const responseData = await ConsultarClientesPorEmpresa(empresaNombre);
      setClientes(responseData);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  }, []);

  // Cargar vendedores
  const cargarVendedores = useCallback(async (empresaNombre) => {
    try {
      const responseData = await ConsultarVendedoresPorEmpresa(empresaNombre);
      setVendedores(responseData);
    } catch (error) {
      console.error("Error al cargar vendedores:", error);
    }
  }, []);

  // Filtrar sugerencias de cliente
  const filtrarSugerenciasCliente = useCallback(
    (texto) => {
      if (!texto || texto.length < 2) {
        setSugerenciasCliente([]);
        return;
      }

      const sugerencias = clientes.filter((cliente) => {
        const nombreCompleto = `${cliente.NOMBRE_SOCIO} - ${cliente.CODIGO_SOCIO}`;
        return nombreCompleto.toLowerCase().includes(texto.toLowerCase());
      });

      setSugerenciasCliente(sugerencias);
    },
    [clientes]
  );

  // Filtrar sugerencias de vendedor
  const filtrarSugerenciasVendedor = useCallback(
    (texto) => {
      if (!texto || texto.length < 2) {
        setSugerenciasVendedor([]);
        return;
      }

      const sugerencias = vendedores.filter((vendedor) =>
        vendedor.VENDEDOR.toLowerCase().includes(texto.toLowerCase())
      );

      setSugerenciasVendedor(sugerencias);
    },
    [vendedores]
  );

  // Effect para cargar datos cuando cambia la empresa
  useEffect(() => {
    if (empresa && empresa.length > 0) {
      cargarClientes(empresa[0]);
      cargarVendedores(empresa[0]);
    }
  }, [empresa, cargarClientes, cargarVendedores]);

  return {
    clientes,
    vendedores,
    sugerenciasCliente,
    sugerenciasVendedor,
    filtrarSugerenciasCliente,
    filtrarSugerenciasVendedor,
    setSugerenciasCliente,
    setSugerenciasVendedor,
  };
};
