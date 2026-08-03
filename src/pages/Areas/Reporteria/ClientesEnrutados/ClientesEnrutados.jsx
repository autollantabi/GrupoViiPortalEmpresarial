import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";
import { ListarClientesEnrutados } from "services/clientesEnrutadosService";

// El endpoint recibe el nombre de la empresa, mientras que los permisos entregan el ID
const DICCIONARIO_EMPRESAS = {
  1: "AUTOLLANTA",
  2: "MAXXIMUNDO",
  3: "STOX",
  4: "IKONIX",
  5: "AUTOMAX",
};

const EMPRESA_POR_DEFECTO = "STOX";

const COLUMNAS = [
  { header: "Vendedor", field: "vendedor" },
  { header: "Código Socio", field: "codigoSocio" },
  { header: "Nombre", field: "nombre" },
  { header: "Latitud", field: "latitud", align: "right" },
  { header: "Longitud", field: "longitud", align: "right" },
  { header: "Estado", field: "estado", align: "center" },
  { header: "Fecha Visita", field: "fechaVisita", align: "center" },
  { header: "Hora Inicio", field: "horaInicio", align: "center" },
  { header: "Hora Fin", field: "horaFin", align: "center" },
];

const OPCIONES_FILAS = [10, 25, 50, 100].map((n) => ({
  value: n,
  label: `${n} por página`,
}));

const Contenedor = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.text};
`;

const Encabezado = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
`;

const Filtros = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`;

const Tarjeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

const TablaScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 4px;
  }
`;

const Tabla = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
`;

const Th = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 10px;
  text-align: ${({ $align }) => $align || "left"};
  white-space: nowrap;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${({ theme }) => theme.colors.textInverse};
  background: ${({ theme }) => theme.colors.secondary};
`;

const Td = styled.td`
  padding: 10px;
  text-align: ${({ $align }) => $align || "left"};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
`;

const Fila = styled.tr`
  background: ${({ theme, $par }) =>
    $par ? theme.colors.backgroundLight : "transparent"};

  &:hover {
    background: ${({ theme }) => theme.colors.primary}12;
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1a;
  border: 1px solid ${({ $color }) => $color}55;
`;

const PiePaginacion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundLight};
`;

const Vacio = styled.div`
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
`;

const CirculoIcono = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => $color || theme.colors.primary}15;
`;

export const ClientesEnrutados = ({ availableCompanies = [] }) => {
  const { theme } = useTheme();

  // Empresas permitidas para el recurso; si el permiso no trae empresas se usa STOX
  const opcionesEmpresas = useMemo(() => {
    const nombres = (availableCompanies || [])
      .map((emp) => DICCIONARIO_EMPRESAS[emp.id] || emp.nombre)
      .filter(Boolean);

    const unicos = Array.from(
      new Set(nombres.length ? nombres : [EMPRESA_POR_DEFECTO])
    );
    return unicos.map((nombre) => ({ value: nombre, label: nombre }));
  }, [availableCompanies]);

  const [empresa, setEmpresa] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(OPCIONES_FILAS[1]);

  // Empresa inicial: STOX si está disponible, sino la primera permitida
  useEffect(() => {
    if (empresa) return;
    const porDefecto =
      opcionesEmpresas.find((opt) => opt.value === EMPRESA_POR_DEFECTO) ||
      opcionesEmpresas[0];
    if (porDefecto) setEmpresa(porDefecto);
  }, [opcionesEmpresas, empresa]);

  useEffect(() => {
    if (!empresa?.value) return;

    let cancelado = false;

    const consultar = async () => {
      setLoading(true);
      setError(false);
      try {
        const clientes = await ListarClientesEnrutados(empresa.value);
        if (cancelado) return;
        setData(Array.isArray(clientes) ? clientes : []);
      } catch (err) {
        if (cancelado) return;
        console.error("Error al consultar clientes enrutados:", err);
        setData([]);
        setError(true);
        toast.error("No se pudo obtener los clientes enrutados");
      } finally {
        if (!cancelado) {
          setLoading(false);
          setConsultado(true);
        }
      }
    };

    consultar();

    return () => {
      cancelado = true;
    };
  }, [empresa]);

  // ================= Paginación en frontend =================
  const totalPaginas = Math.max(
    1,
    Math.ceil(data.length / filasPorPagina.value)
  );

  useEffect(() => {
    setPaginaActual(1);
  }, [empresa, filasPorPagina]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [paginaActual, totalPaginas]);

  const opcionesPaginas = useMemo(
    () =>
      Array.from({ length: totalPaginas }, (_, i) => ({
        value: i + 1,
        label: `Página ${i + 1}`,
      })),
    [totalPaginas]
  );

  const inicio = (paginaActual - 1) * filasPorPagina.value;
  const datosPagina = useMemo(
    () => data.slice(inicio, inicio + filasPorPagina.value),
    [data, inicio, filasPorPagina]
  );

  const colorEstado = (estado) => {
    const valor = (estado || "").toUpperCase();
    if (valor === "ENRUTADO") return theme.colors.success;
    if (valor === "NO ENRUTADO" || valor === "NO_ENRUTADO")
      return theme.colors.error;
    return theme.colors.info;
  };

  const renderCelda = (item, columna) => {
    const valor = item[columna.field];

    if (valor === null || valor === undefined || valor === "") return "—";

    if (columna.field === "estado") {
      return <Badge $color={colorEstado(valor)}>{valor}</Badge>;
    }

    return valor;
  };

  const renderContenido = () => {
    if (loading) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando clientes enrutados...</TextUI>
        </Vacio>
      );
    }

    if (error) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.error}>
            <IconUI
              name="FaTriangleExclamation"
              size={28}
              color={theme.colors.error}
            />
          </CirculoIcono>
          <TextUI weight="bold">No se pudo cargar la información</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            Ocurrió un error al consultar los clientes enrutados de{" "}
            {empresa?.label}. Intente nuevamente.
          </TextUI>
          <ButtonUI
            text="Reintentar"
            iconLeft="FaRotateRight"
            onClick={() => setEmpresa({ ...empresa })}
          />
        </Vacio>
      );
    }

    if (!data.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI
              name="FaMapLocationDot"
              size={28}
              color={theme.colors.primary}
            />
          </CirculoIcono>
          <TextUI weight="bold">Sin clientes enrutados</TextUI>
          <TextUI color={theme.colors.textSecondary}>
            {consultado
              ? `No se encontraron clientes enrutados para ${
                  empresa?.label || "la empresa seleccionada"
                }.`
              : "Seleccione una empresa para consultar la información."}
          </TextUI>
        </Vacio>
      );
    }

    return (
      <>
        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                {COLUMNAS.map((columna) => (
                  <Th key={columna.field} $align={columna.align}>
                    {columna.header}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datosPagina.map((item, index) => (
                <Fila
                  key={`${item.codigoSocio}-${item.fechaVisita}-${
                    inicio + index
                  }`}
                  $par={index % 2 === 0}
                >
                  {COLUMNAS.map((columna) => (
                    <Td key={columna.field} $align={columna.align}>
                      {renderCelda(item, columna)}
                    </Td>
                  ))}
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {datosPagina.length} de {data.length} registros
          </TextUI>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <SelectUI
              options={OPCIONES_FILAS}
              value={filasPorPagina}
              onChange={(opt) => opt && setFilasPorPagina(opt)}
              minWidth="140px"
              maxWidth="160px"
              isSearchable={false}
              menuPlacement="top"
            />
            <ButtonUI
              iconLeft="FaArrowLeft"
              onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
              disabled={paginaActual === 1}
            />
            <SelectUI
              options={opcionesPaginas}
              value={opcionesPaginas.find((opt) => opt.value === paginaActual)}
              onChange={(opt) => opt?.value && setPaginaActual(opt.value)}
              placeholder="Página"
              minWidth="130px"
              maxWidth="160px"
              menuMaxHeight="200px"
              isSearchable={false}
              menuPlacement="top"
            />
            <ButtonUI
              iconLeft="FaArrowRight"
              onClick={() =>
                setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))
              }
              disabled={paginaActual === totalPaginas}
            />
          </div>

          <TextUI size="13px" color={theme.colors.textSecondary}>
            Página {paginaActual} de {totalPaginas}
          </TextUI>
        </PiePaginacion>
      </>
    );
  };

  return (
    <ContainerUI
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 0, overflow: "hidden" }}
      translate="no"
      className="notranslate"
    >
      <Contenedor>
        <Encabezado>
          <TextUI weight="bold" size="22px">
            Clientes Enrutados
          </TextUI>

          <Filtros>
            <SelectUI
              label="Empresa"
              options={opcionesEmpresas}
              value={empresa}
              onChange={(opt) => opt && setEmpresa(opt)}
              placeholder="Seleccione empresa"
              isDisabled={loading || opcionesEmpresas.length <= 1}
              minWidth="180px"
              maxWidth="220px"
            />
            <ButtonUI
              text="Actualizar"
              iconLeft="FaRotateRight"
              onClick={() => empresa && setEmpresa({ ...empresa })}
              disabled={loading || !empresa}
            />
          </Filtros>
        </Encabezado>

        <Tarjeta>{renderContenido()}</Tarjeta>
      </Contenedor>
    </ContainerUI>
  );
};
