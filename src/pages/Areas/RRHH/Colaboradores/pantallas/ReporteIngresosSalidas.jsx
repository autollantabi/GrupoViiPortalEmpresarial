import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
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
  TextoTenue,
  Titulo,
} from "../componentes/piezas";
import { RUTA_BASE, nombreCortoEmpresa } from "../utils/constantes";
import { hoyIso } from "../utils/fechas";

/**
 * Reporte de ingresos y salidas: quién entró y quién salió del grupo, CADA
 * UNO con su propio rango de fechas, con motivo de salida cuando aplica.
 *
 * Ingresos y salidas son dos consultas independientes del lado del backend
 * (ver ReportesRrhhRepo.retrieveIngresosSalidas): antes compartían un único
 * rango de fechas, lo que impedía, por ejemplo, pedir "ingresos de enero"
 * junto con "salidas de todo el año". Acá cada bloque tiene su propio
 * casillero de "incluir" + su propio Desde/Hasta; hay que incluir al menos
 * uno de los dos para poder consultar.
 *
 * A diferencia del resto del módulo, esta tabla SÍ usa TablaInfoUI (con excel):
 * es un reporte para exportar y revisar, no una pantalla de gestión con
 * paginación de servidor como ColListado, así que aquí conviene el filtrado y
 * ordenamiento de cliente que trae el componente del kit.
 *
 * No se consulta nada hasta que la persona pulsa "Consultar", para no
 * disparar de entrada un reporte sin rango definido.
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

  const [incluirIngresos, setIncluirIngresos] = useState(true);
  const [fechaInicioIngresos, setFechaInicioIngresos] = useState(primerDiaDelMes());
  const [fechaFinIngresos, setFechaFinIngresos] = useState(hoyIso());

  const [incluirSalidas, setIncluirSalidas] = useState(true);
  const [fechaInicioSalidas, setFechaInicioSalidas] = useState(primerDiaDelMes());
  const [fechaFinSalidas, setFechaFinSalidas] = useState(hoyIso());

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
    if (!incluirIngresos && !incluirSalidas) {
      toast.error("Incluya al menos ingresos o salidas.");
      return;
    }
    if (incluirIngresos && (!fechaInicioIngresos || !fechaFinIngresos)) {
      toast.error("Indique el rango de fechas de ingresos.");
      return;
    }
    if (incluirIngresos && fechaInicioIngresos > fechaFinIngresos) {
      toast.error("En ingresos, la fecha de inicio no puede ser posterior a la fecha final.");
      return;
    }
    if (incluirSalidas && (!fechaInicioSalidas || !fechaFinSalidas)) {
      toast.error("Indique el rango de fechas de salidas.");
      return;
    }
    if (incluirSalidas && fechaInicioSalidas > fechaFinSalidas) {
      toast.error("En salidas, la fecha de inicio no puede ser posterior a la fecha final.");
      return;
    }

    setConsultando(true);
    try {
      const datos = await ObtenerReporteIngresosSalidas({
        empresaId: empresaId || undefined,
        fechaInicioIngresos: incluirIngresos ? fechaInicioIngresos : undefined,
        fechaFinIngresos: incluirIngresos ? fechaFinIngresos : undefined,
        fechaInicioSalidas: incluirSalidas ? fechaInicioSalidas : undefined,
        fechaFinSalidas: incluirSalidas ? fechaFinSalidas : undefined,
      });
      setFilas(
        datos.map((fila, indice) => ({
          ID: indice + 1,
          ...fila,
        })),
      );
      setFiltrosAplicados({
        empresaId,
        ingresos: incluirIngresos ? `${fechaInicioIngresos}_a_${fechaFinIngresos}` : null,
        salidas: incluirSalidas ? `${fechaInicioSalidas}_a_${fechaFinSalidas}` : null,
      });
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
    [
      "Ingresos_Salidas",
      nombreEmpresaElegida,
      filtrosAplicados.ingresos ? `Ingresos_${filtrosAplicados.ingresos}` : null,
      filtrosAplicados.salidas ? `Salidas_${filtrosAplicados.salidas}` : null,
    ]
      .filter(Boolean)
      .join("_");

  return (
    <Contenedor translate="no" className="notranslate">
      <EnlaceVolver to={RUTA_BASE}>← Volver al tablero</EnlaceVolver>

      <Encabezado>
        <div>
          <Titulo>Ingresos y salidas</Titulo>
          <Subtitulo>Quién entró y quién salió del grupo, cada uno con su propio rango de fechas.</Subtitulo>
        </div>
      </Encabezado>

      <Tarjeta>
        <div style={{ minWidth: 220, marginBottom: 14 }}>
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

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <CheckboxUI
              name="incluir-ingresos"
              checked={incluirIngresos}
              onChange={(_nombre, marcado) => setIncluirIngresos(marcado)}
              label="Incluir ingresos"
            />
            {incluirIngresos && (
              <Filtros style={{ marginTop: 8 }}>
                <div style={{ minWidth: 160 }}>
                  <CampoLabel etiqueta="Desde" requerido>
                    <InputUI
                      type="date"
                      value={fechaInicioIngresos}
                      onChange={setFechaInicioIngresos}
                      max={hoyIso()}
                    />
                  </CampoLabel>
                </div>
                <div style={{ minWidth: 160 }}>
                  <CampoLabel etiqueta="Hasta" requerido>
                    <InputUI
                      type="date"
                      value={fechaFinIngresos}
                      onChange={setFechaFinIngresos}
                      max={hoyIso()}
                    />
                  </CampoLabel>
                </div>
              </Filtros>
            )}
          </div>

          <div>
            <CheckboxUI
              name="incluir-salidas"
              checked={incluirSalidas}
              onChange={(_nombre, marcado) => setIncluirSalidas(marcado)}
              label="Incluir salidas"
            />
            {incluirSalidas && (
              <Filtros style={{ marginTop: 8 }}>
                <div style={{ minWidth: 160 }}>
                  <CampoLabel etiqueta="Desde" requerido>
                    <InputUI
                      type="date"
                      value={fechaInicioSalidas}
                      onChange={setFechaInicioSalidas}
                      max={hoyIso()}
                    />
                  </CampoLabel>
                </div>
                <div style={{ minWidth: 160 }}>
                  <CampoLabel etiqueta="Hasta" requerido>
                    <InputUI
                      type="date"
                      value={fechaFinSalidas}
                      onChange={setFechaFinSalidas}
                      max={hoyIso()}
                    />
                  </CampoLabel>
                </div>
              </Filtros>
            )}
          </div>

          <div>
            <ButtonUI
              text={consultando ? "Consultando…" : "Consultar"}
              iconLeft="FaMagnifyingGlass"
              onClick={consultar}
              disabled={consultando}
            />
          </div>
        </div>
      </Tarjeta>

      {filtrosAplicados && (
        <Tarjeta $sinRelleno>
          {filas.length === 0 && (
            <div style={{ padding: 16 }}>
              <TextoTenue>Sin movimientos en el rango consultado.</TextoTenue>
            </div>
          )}
          <div style={{ height: "calc(100vh - 420px)", minHeight: 360 }}>
            <TablaInfoUI
              data={filas}
              columns={COLUMNAS}
              defaultFilters={["tipo", "nombresCompletos"]}
              sortedInitial={{ column: "fecha", direction: "desc" }}
              uniqueKey="ID"
              excel
              filenameExcel={nombreArchivo}
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
