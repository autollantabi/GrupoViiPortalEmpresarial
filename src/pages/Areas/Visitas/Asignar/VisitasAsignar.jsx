import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { TextUI } from "components/UI/Components/TextUI";
import { TablaInputsUI } from "components/UI/Components/TablaInputsUI";
import { ListarUsuariosSistema } from "services/administracionService";
import { useTheme } from "context/ThemeContext";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";

const Container = styled.div`
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: calc(100vh - 80px);
  box-sizing: border-box;
`;

const MOTIVO_OPTIONS = [
  { value: "Falta Laboral", label: "Falta Laboral" },
  { value: "Permiso Medico", label: "Permiso Medico" },
  { value: "Vacaciones", label: "Vacaciones" },
  { value: "Cartera", label: "Cartera" },
  { value: "Siniestro", label: "Siniestro" },
  { value: "Otros", label: "Otros" },
];

import { toast } from "react-toastify";

import { ContainerUI } from "components/UI/Components/ContainerUI";
import { useAuthContext } from "context/authContext";
import { getAvailableCompanies } from "utils/permissionsValidator";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarVendedoresReemplazosVisitas, CrearReemplazoVisita } from "services/visitasService";

const EMPRESA_DICT = {
  "AUTOLLANTA": 1,
  "MAXXIMUNDO": 2,
  "STOX": 3,
  "IKONIX": 4,
  "AUTOMAX": 5
};

const LINEA_OPTIONS = [
  { value: "LUBRICANTES", label: "LUBRICANTES" },
  { value: "LLANTAS", label: "LLANTAS" },
  { value: "LLANTAS MOTO", label: "LLANTAS MOTO" }
];

const generateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  const dates = [];
  let current = new Date(startDate);
  const last = new Date(endDate);
  // Reset time to avoid issues with daylight savings or hour offsets
  current.setHours(12, 0, 0, 0);
  last.setHours(12, 0, 0, 0);

  while (current <= last) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const VisitasAsignar = () => {
  const { theme } = useTheme();
  const { user } = useAuthContext();

  const [data, setData] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Este estado ahora guardará los reemplazos (opciones del selector)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedLinea, setSelectedLinea] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener empresas disponibles según el alcance del rol para visitas.asignar
  const empresasOptions = useMemo(() => {
    if (!user) return [];
    const contexts = user.data || user.CONTEXTOS || [];
    const companies = getAvailableCompanies(contexts, "visitas.asignar", user.EMPRESAS);
    return companies.map(emp => ({
      value: emp.id,
      label: emp.nombre
    }));
  }, [user]);

  const isMaxximundo = selectedEmpresa?.label?.toUpperCase() === "MAXXIMUNDO";

  // Efecto para cargar datos cuando cambian los filtros
  useEffect(() => {
    const cargarDatos = async () => {
      // Validar si se deben mostrar datos
      const readyToLoad = isMaxximundo
        ? (selectedEmpresa && selectedLinea)
        : !!selectedEmpresa;

      if (!readyToLoad) {
        setData([]);
        return;
      }

      setIsLoading(true);
      try {
        const idEmpresaApi = EMPRESA_DICT[selectedEmpresa.label.toUpperCase()] || selectedEmpresa.value;
        const result = await ListarVendedoresReemplazosVisitas(idEmpresaApi);

        let reemplazosOptions = [];
        if (isMaxximundo) {
          // Filtrar reemplazos por línea de negocio para Maxximundo (case-insensitive)
          reemplazosOptions = result.reemplazos
            .filter(r => r.lineaNegocio?.toUpperCase() === selectedLinea.value.toUpperCase())
            .map(r => ({ value: r.nombre, label: r.nombre }));
        } else {
          // Para otras empresas, todos los reemplazos
          reemplazosOptions = result.reemplazos.map(r => ({ value: r.nombre, label: r.nombre }));
        }
        setUsuarios(reemplazosOptions);

        // Transformar vendedores en filas de la tabla
        const initialRows = result.vendedores.map((v, index) => ({
          id: v.codigo || index,
          vendedor: v.nombre,
          asignado: "",
          asignadoID: null,
          motivo: "",
          motivoID: null,
          justificacion: "",
          fecha_desde: "",
          fecha_hasta: ""
        }));
        setData(initialRows);
      } catch (error) {
        console.error("Error cargando vendedores y reemplazos:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [selectedEmpresa, selectedLinea, isMaxximundo]);

  // Si solo hay una empresa, seleccionarla por defecto
  useEffect(() => {
    if (empresasOptions.length === 1 && !selectedEmpresa) {
      setSelectedEmpresa(empresasOptions[0]);
    }
  }, [empresasOptions, selectedEmpresa]);

  // Persistir en localStorage cada vez que los datos cambian
  useEffect(() => {
    localStorage.setItem("visitas_asignar_data", JSON.stringify(data));
  }, [data]);

  const handleGlobalSave = async () => {
    // Filtrar solo las filas que tengan un reemplazo asignado
    const rowsToSave = data.filter(row => row.asignado && row.motivo && row.fecha_desde && row.fecha_hasta);

    if (rowsToSave.length === 0) {
      toast.warning("No hay filas completas para guardar.");
      return;
    }

    setIsLoading(true);
    let successCount = 0;

    for (const row of rowsToSave) {
      const payload = {
        EMPRESA: selectedEmpresa.label.toUpperCase(),
        VENDEDOR_REEMPLAZADO: row.vendedor,
        PERSONA_REEMPLAZANTE: row.asignado,
        RAZON_REEMPLAZO: row.motivo,
        FECHAS_REEMPLAZO: generateDateRange(row.fecha_desde, row.fecha_hasta),
        ESTADO: "PENDIENTE",
        OBSERVACIONES: row.justificacion || ""
      };

      const success = await CrearReemplazoVisita(payload);
      if (success) successCount++;
    }

    setIsLoading(false);
    if (successCount === rowsToSave.length) {
      setHasChanges(false);
      toast.success("Todos los cambios se guardaron correctamente");
    } else if (successCount > 0) {
      toast.warning(`Se guardaron ${successCount} de ${rowsToSave.length} registros`);
    } else {
      toast.error("Error al guardar los cambios");
    }
  };

  const handleSave = async (row) => {
    // Validar campos requeridos
    if (!row.asignado || !row.motivo || !row.fecha_desde || !row.fecha_hasta) {
      toast.error("Por favor complete todos los campos obligatorios de la fila");
      return { res: false };
    }

    if (row.motivoID === "Otros" && !row.justificacion) {
      toast.error("La observación es obligatoria cuando el motivo es 'Otros'");
      return { res: false };
    }

    const payload = {
      EMPRESA: selectedEmpresa.label.toUpperCase(),
      VENDEDOR_REEMPLAZADO: row.vendedor,
      PERSONA_REEMPLAZANTE: row.asignado,
      RAZON_REEMPLAZO: row.motivo,
      FECHAS_REEMPLAZO: generateDateRange(row.fecha_desde, row.fecha_hasta),
      ESTADO: "PENDIENTE",
      OBSERVACIONES: row.justificacion || ""
    };

    const success = await CrearReemplazoVisita(payload);
    if (success) {
      toast.success(`Asignación para ${row.vendedor} guardada`);
      return { res: true, id: row.id };
    } else {
      toast.error(`Error al guardar la asignación de ${row.vendedor}`);
      return { res: false };
    }
  };

  const columnsConfig = [
    {
      header: "Vendedor",
      field: "vendedor",
      width: "15%",
      isEditable: false,
    },
    {
      header: "Asignado A",
      field: "asignado",
      fieldID: "asignadoID",
      width: "20%",
      isEditable: true,
      editType: "dropdown",
      options: usuarios,
    },
    {
      header: "Motivo",
      field: "motivo",
      fieldID: "motivoID",
      width: "15%",
      isEditable: true,
      editType: "dropdown",
      options: MOTIVO_OPTIONS,
    },
    {
      header: "Observación",
      field: "justificacion",
      width: "20%",
      isEditable: true,
      required: (item) => item.motivoID === "Otros",
    },
    {
      header: "Desde",
      field: "fecha_desde",
      width: "15%",
      isEditable: true,
      editType: "date",
    },
    {
      header: "Hasta",
      field: "fecha_hasta",
      width: "15%",
      isEditable: true,
      editType: "date",
      min: (item) => item.fecha_desde,
      validate: (item) => {
        if (item.fecha_desde && item.fecha_hasta) {
          if (new Date(item.fecha_hasta) < new Date(item.fecha_desde)) {
            return "La fecha 'Hasta' no puede ser anterior a 'Desde'";
          }
        }
        return null;
      }
    },
  ];

  const handleRowChange = (updatedRow) => {
    setHasChanges(true);
    setData((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const filteredData = data.filter((item) => {
    const searchString = `${item.vendedor} ${item.asignado} ${item.motivo} ${item.justificacion} ${item.fecha_desde} ${item.fecha_hasta}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <ContainerUI height="100%" width="100%" translate="no" className="notranslate" id="visitas-asignar-container">
      <ContenedorPadre direccion="c" ovy="auto" style={{ height: "100%", width: "100%", padding: "0", alignItems: "stretch" }}>
        <Container>
          <div style={{ flex: 1, width: "100%", overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
            <TablaInputsUI
              key={`tabla-asignar-${selectedEmpresa?.value}-${selectedLinea?.value}`}
              data={filteredData}
              columnsConfig={columnsConfig}
              nombreID="id"
              alwaysEditable={true}
              hideActions={false}
              onRowChange={handleRowChange}
              onSave={handleSave}
              showFilters={true}
              defaultFilters={[]}
              hideOptionalFilters={true}
              hideCancel={true}
              saveIcon="FaCheck"
              permisoagregar={[]}
              extraHeaderContent={
                <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}>
                    <InputUI
                      placeholder="Búsqueda rápida..."
                      value={searchTerm}
                      onChange={(val) => setSearchTerm(val)}
                      iconLeft="FaMagnifyingGlass"
                    />
                  </div>
                  <div style={{ width: '200px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: theme.colors.text }}>Empresa</label>
                    <SelectUI
                      placeholder="Seleccione Empresa"
                      options={empresasOptions}
                      value={selectedEmpresa}
                      onChange={(val) => {
                        setSelectedEmpresa(val);
                        setSelectedLinea(null);
                      }}
                      isClearable={true}
                    />
                  </div>
                  {isMaxximundo && (
                    <div style={{ width: '200px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: theme.colors.text }}>Línea de Negocio</label>
                      <SelectUI
                        placeholder="Seleccione Línea"
                        options={LINEA_OPTIONS}
                        value={selectedLinea}
                        onChange={(val) => setSelectedLinea(val)}
                        isClearable={true}
                      />
                    </div>
                  )}
                </div>
              }
            />
            {isLoading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p>Cargando vendedores y reemplazos...</p>
              </div>
            )}
            {!isLoading && data.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: theme.colors.textSecondary }}>
                {!selectedEmpresa
                  ? "Por favor, seleccione una empresa para ver los datos."
                  : (isMaxximundo && !selectedLinea)
                    ? "Por favor, seleccione una línea de negocio para Maxximundo."
                    : "No se encontraron vendedores para los filtros seleccionados."}
              </div>
            )}
          </div>
        </Container>
      </ContenedorPadre>
    </ContainerUI>
  );
};
