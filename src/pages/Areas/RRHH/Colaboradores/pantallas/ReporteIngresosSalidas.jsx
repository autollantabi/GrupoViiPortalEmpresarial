import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { ListarEmpresas, ObtenerReporteIngresosSalidas } from "services/colaboradoresService";
import { CampoLabel } from "../componentes/CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Contenedor,
  Encabezado,
  EnlaceVolver,
  Filtros,
  Subtitulo,
  Tarjeta,
  Titulo,
} from "../componentes/piezas";
import { RUTA_BASE, nombreCortoEmpresa } from "../utils/constantes";
import { hoyIso } from "../utils/fechas";

/**
 * Reporte de ingresos y salidas: quién entró y quién salió del grupo en un
 * rango de fechas, con motivo de salida cuando aplica.
 *
 * A diferencia del resto del módulo, esta tabla SÍ usa TablaInfoUI (con excel):
 * es un reporte para exportar y revisar, no una pantalla de gestión con
 * paginación de servidor como ColListado, así que aquí conviene el filtrado y
 * ordenamiento de cliente que trae el componente del kit.
 *
 * El backend exige fechaInicio y fechaFin; empresaId es opcional. No se
 * consulta nada hasta que la persona pulsa "Consultar", para no disparar de
 * entrada un reporte sin rango definido.
 */

const primerDiaDelMes = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-01`;
};

const COLUMNAS = [
  { header: "Tipo", field: "tipo", visible: true, width: "90px" },
  { header: "Fecha", field: "fecha", visible: true, width: "100px" },
  { header: "Nombre", field: "nombresCompletos", visible: true, width: "220px" },
  { header: "Cédula", field: "cedula", visible: true, width: "110px" },
  { header: "Empresa", field: "empresa", visible: true, width: "160px" },
  { header: "Cargo", field: "cargo", visible: true, width: "150px" },
  { header: "Área", field: "area", visible: true, width: "130px" },
  { header: "Línea", field: "linea", visible: true, width: "130px" },
  { header: "Motivo", field: "motivoSalida", visible: true, width: "160px" },
];

const NOMBRES_EXCEL = {
  tipo: "Tipo",
  fecha: "Fecha",
  nombresCompletos: "Nombre",
  cedula: "Cédula",
  empresa: "Empresa",
  cargo: "Cargo",
  area: "Área",
  linea: "Línea",
  ciudad: "Ciudad",
  motivoSalida: "Motivo de salida",
};

export const ReporteIngresosSalidas = () => {
  const [empresaId, setEmpresaId] = useState("");
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
      const datos = await ObtenerReporteIngresosSalidas({
        empresaId: empresaId || undefined,
        fechaInicio,
        fechaFin,
      });
      setFilas(
        datos.map((fila, indice) => ({
          ID: indice + 1,
          ...fila,
        })),
      );
      setFiltrosAplicados({ empresaId, fechaInicio, fechaFin });
    } catch (e) {
      toast.error(e.message || "No se pudo obtener el reporte");
    } finally {
      setConsultando(false);
    }
  };

  const nombreEmpresaElegida =
    opcionesEmpresa.find((opcion) => opcion.value === empresaId)?.label ?? "Todas";

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={RUTA_BASE}>← Volver al tablero</EnlaceVolver>

      <Encabezado>
        <div>
          <Titulo>Ingresos y salidas</Titulo>
          <Subtitulo>Quién entró y quién salió del grupo en un rango de fechas.</Subtitulo>
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
          <div style={{ minWidth: 160 }}>
            <CampoLabel etiqueta="Desde" requerido>
              <InputUI type="date" value={fechaInicio} onChange={setFechaInicio} max={hoyIso()} />
            </CampoLabel>
          </div>
          <div style={{ minWidth: 160 }}>
            <CampoLabel etiqueta="Hasta" requerido>
              <InputUI type="date" value={fechaFin} onChange={setFechaFin} max={hoyIso()} />
            </CampoLabel>
          </div>
          <div style={{ paddingTop: 20 }}>
            <ButtonUI
              text={consultando ? "Consultando…" : "Consultar"}
              iconLeft="FaMagnifyingGlass"
              onClick={consultar}
              disabled={consultando}
            />
          </div>
        </Filtros>
      </Tarjeta>

      {filtrosAplicados && (
        <Tarjeta $sinRelleno>
          <div style={{ height: "calc(100vh - 340px)", minHeight: 360 }}>
            <TablaInfoUI
              data={filas}
              columns={COLUMNAS}
              defaultFilters={["tipo", "nombresCompletos"]}
              sortedInitial={{ column: "fecha", direction: "desc" }}
              uniqueKey="ID"
              excel
              filenameExcel={`Ingresos_Salidas_${nombreEmpresaElegida}_${filtrosAplicados.fechaInicio}_${filtrosAplicados.fechaFin}`}
              nombresColumnasPersonalizadosExcel={NOMBRES_EXCEL}
              columnasOcultasExcel={["ID", "ciudad"]}
            />
          </div>
        </Tarjeta>
      )}
    </Contenedor>
  );
};

export default ReporteIngresosSalidas;
