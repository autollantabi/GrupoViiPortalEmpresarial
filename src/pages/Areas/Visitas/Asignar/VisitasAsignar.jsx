import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ContenedorPadre } from "assets/styles/StyledComponents/ContenedorPadre";
import { TextUI } from "components/UI/Components/TextUI";
import { TablaInputsUI } from "components/UI/Components/TablaInputsUI";
import { ListarUsuariosSistema } from "services/administracionService";
import { useTheme } from "context/ThemeContext";
import { InputUI } from "components/UI/Components/InputUI";

const Container = styled.div`
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: calc(100vh - 80px);
  box-sizing: border-box;
`;

export const VisitasAsignar = () => {
  const { theme } = useTheme();
  const [data, setData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const users = await ListarUsuariosSistema();
        const options = users.map((u) => ({
          value: u.NOMBRE_COMPLETO || u.NOMBRE || u.USUARIO,
          label: u.NOMBRE_COMPLETO || u.NOMBRE || u.USUARIO,
        }));
        setUsuarios(options);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  const columnsConfig = [
    {
      header: "Fecha",
      field: "fecha",
      width: "20%",
      isEditable: false,
      editType: "date", // Esto activará el calendario en el filtro
    },
    {
      header: "Vendedor",
      field: "vendedor",
      width: "40%",
      isEditable: false,
      editType: "dropdown", // Esto activará el selector en el filtro
    },
    {
      header: "Asignado A",
      field: "asignado",
      fieldID: "asignadoID",
      width: "40%",
      isEditable: true,
      editType: "dropdown",
      options: usuarios,
    },
  ];

  const handleRowChange = (updatedRow) => {
    setData((prev) =>
      prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  const filteredData = data.filter((item) => {
    const searchString = `${item.fecha} ${item.vendedor} ${item.asignado}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <ContenedorPadre direccion="c" ovy="auto" style={{ height: "100%", width: "100%", padding: "0", alignItems: "stretch" }}>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 24px' }}>
          <TextUI variant="h1" weight="bold">
            Asignar Visitas
          </TextUI>
        </div>

        <div style={{ flex: 1, width: "100%", overflow: "hidden", display: 'flex', flexDirection: 'column' }}>
          <TablaInputsUI
            data={filteredData}
            columnsConfig={columnsConfig}
            nombreID="id"
            alwaysEditable={true}
            hideActions={true}
            onRowChange={handleRowChange}
            showFilters={true}
            defaultFilters={["fecha", "vendedor"]}
            hideOptionalFilters={true} // Ocultar el botón "Agregar Filtro"
            permisoagregar={[]}
            extraHeaderContent={
              <div style={{ flex: 1, minWidth: '400px', maxWidth: '600px' }}>
                <InputUI
                  placeholder="Buscar por fecha, vendedor, o asignado..."
                  value={searchTerm}
                  onChange={(val) => setSearchTerm(val)}
                  iconLeft="FaMagnifyingGlass"
                />
              </div>
            }
          />
          {filteredData.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: theme.colors.textSecondary }}>
              Sin datos
            </div>
          )}
        </div>
      </Container>
    </ContenedorPadre>
  );
};
