import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { ListarEmpresas, ObtenerReportePermisos } from "services/colaboradoresService";
import { CampoLabel } from "../componentes/CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Contenedor,
  Encabezado,
  EnlaceVolver,
  Filtros,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
} from "../componentes/piezas";
import { RUTA_BASE, nombreCortoEmpresa } from "../utils/constantes";
import { formatearRangoPermiso, hoyIso } from "../utils/fechas";

/**
 * Reporte de permisos: quién tiene un permiso registrado que SOLAPA el rango
 * pedido, con su tipo, rango y estado. Calco de ReporteIngresosSalidas.jsx,
 * pero con un solo rango de fechas (no hay dos ramas que combinar).
 */

const primerDiaDelMes = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-01`;
};

const OPCIONES_ESTADO = [
  { value: "", label: "Todos los estados" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Aprobada", label: "Aprobada" },
  { value: "Rechazada", label: "Rechazada" },
];

const COLUMNAS = [
  { header: "Nombre", field: "nombresCompletos", visible: true, width: "220px" },
  { header: "Cédula", field: "cedula", visible: true, width: "110px" },
  { header: "Empresa", field: "empresa", visible: true, width: "160px" },
  { header: "Cargo", field: "cargo", visible: true, width: "150px" },
  { header: "Tipo", field: "tipoPermiso", visible: true, width: "150px" },
  { header: "Rango", field: "rango", visible: true, width: "200px" },
  { header: "Motivo", field: "motivo", visible: true, width: "220px" },
  { header: "Estado", field: "estado", visible: true, width: "110px" },
];

const NOMBRES_EXCEL = {
  nombresCompletos: "Nombre",
  cedula: "Cédula",
  empresa: "Empresa",
  cargo: "Cargo",
  tipoPermiso: "Tipo",
  rango: "Rango",
  motivo: "Motivo",
  estado: "Estado",
};

export const ReportePermisos = () => {
  const [empresaId, setEmpresaId] = useState("");
  const [estado, setEstado] = useState(OPCIONES_ESTADO[0]);
  const [fechaInicio, setFechaInicio] = useState(primerDiaDelMes());
  const [fechaFin, setFechaFin] = useState(hoyIso());

  const [filtrosAplicados, setFiltrosAplicados] = useState(null);
  const [consultando, setConsultando] = useState(false);
  const [filas, setFilas] = useState([]);

  const { datos: empresas } = useConsulta(({ signal }) => ListarEmpresas({ signal }), []);

  const opcionesEmpresa = useMemo(
    () => [
      { value: "", label: "Todas las empresas" },
      ...(empresas ?? []).map((empresa) => ({
        value: String(empresa.id),
        label: nombreCortoEmpresa(empresa.nombre),
      })),
    ],
    [empresas],
  );

  const consultar = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Indique el rango de fechas.");
      return;
    }
    if (fechaInicio > fechaFin) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha final.");
      return;
    }

    setConsultando(true);
    try {
      const datos = await ObtenerReportePermisos({
        empresaId: empresaId || undefined,
        estado: estado.value || undefined,
        fechaInicio,
        fechaFin,
      });
      setFilas(
        datos.map((fila, indice) => ({
          ID: indice + 1,
          ...fila,
          rango: formatearRangoPermiso(fila.fechaInicio, fila.horaInicio, fila.fechaFin, fila.horaFin),
        })),
      );
      setFiltrosAplicados({ empresaId, estado: estado.value, rango: `${fechaInicio}_a_${fechaFin}` });
    } catch (e) {
      toast.error(e.message || "No se pudo obtener el reporte");
    } finally {
      setConsultando(false);
    }
  };

  const nombreEmpresaElegida =
    opcionesEmpresa.find((opcion) => opcion.value === empresaId)?.label ?? "Todas";

  const nombreArchivo =
    filtrosAplicados &&
    ["Permisos", nombreEmpresaElegida, filtrosAplicados.estado || null, filtrosAplicados.rango]
      .filter(Boolean)
      .join("_");

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={RUTA_BASE}>← Volver al tablero</EnlaceVolver>

      <Encabezado>
        <div>
          <Titulo>Permisos</Titulo>
          <Subtitulo>Quién tiene un permiso registrado que solapa el rango de fechas elegido.</Subtitulo>
        </div>
      </Encabezado>

      <Tarjeta>
        <Filtros>
          <div style={{ minWidth: 220 }}>
            <CampoLabel etiqueta="Empresa">
              <SelectUI
                options={opcionesEmpresa}
                value={opcionesEmpresa.find((opcion) => opcion.value === empresaId) ?? null}
                onChange={(opcion) => setEmpresaId(opcion?.value ?? "")}
                isSearchable
                isClearable={false}
                minWidth="100%"
                maxWidth="100%"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
          </div>
          <div style={{ minWidth: 180 }}>
            <CampoLabel etiqueta="Estado">
              <SelectUI
                options={OPCIONES_ESTADO}
                value={estado}
                onChange={setEstado}
                isClearable={false}
                minWidth="100%"
                maxWidth="100%"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>
          </div>
          <div style={{ minWidth: 160 }}>
            <CampoLabel etiqueta="Desde" requerido>
              <InputUI type="date" value={fechaInicio} onChange={setFechaInicio} max={hoyIso()} />
            </CampoLabel>
          </div>
          <div style={{ minWidth: 160 }}>
            <CampoLabel etiqueta="Hasta" requerido>
              <InputUI type="date" value={fechaFin} onChange={setFechaFin} />
            </CampoLabel>
          </div>
        </Filtros>

        <div style={{ marginTop: 16 }}>
          <ButtonUI
            text={consultando ? "Consultando…" : "Consultar"}
            iconLeft="FaMagnifyingGlass"
            onClick={consultar}
            disabled={consultando}
          />
        </div>
      </Tarjeta>

      {filtrosAplicados && (
        <Tarjeta $sinRelleno>
          {filas.length === 0 && (
            <div style={{ padding: 16 }}>
              <TextoTenue>Sin permisos en el rango consultado.</TextoTenue>
            </div>
          )}
          <div style={{ height: "calc(100vh - 460px)", minHeight: 360 }}>
            <TablaInfoUI
              data={filas}
              columns={COLUMNAS}
              defaultFilters={["nombresCompletos", "tipoPermiso"]}
              sortedInitial={{ column: "nombresCompletos", direction: "asc" }}
              uniqueKey="ID"
              excel
              filenameExcel={nombreArchivo}
              nombresColumnasPersonalizadosExcel={NOMBRES_EXCEL}
              columnasOcultasExcel={["ID"]}
            />
          </div>
        </Tarjeta>
      )}
    </Contenedor>
  );
};

export default ReportePermisos;
