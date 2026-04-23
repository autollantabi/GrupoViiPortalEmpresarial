import React, { useState, useMemo, useEffect } from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContenedorFlex } from "components/UI/Components/ContenedorFlex";
import { useTheme } from "context/ThemeContext";
import { hexToRGBA } from "utils/colors";
import { toast } from "react-toastify";
import styled from "styled-components";
import { obtenerLineaNegocioParametros, actualizarNombreComercial } from "services/LineaNegocio";

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;
  table-layout: fixed;
  margin-top: 10px;

  th {
    background-color: ${({ theme }) => theme?.name === "dark"
    ? (theme?.colors?.backgroundCard || theme?.colors?.backgroundLight || "#333")
    : (theme?.colors?.secondary || "#3c3c3b")};
    color: ${({ theme }) => theme?.name === "dark"
    ? (theme?.colors?.text || "#fff")
    : (theme?.colors?.white || "#ffffff")};
    font-weight: 500;
    padding: 12px 10px;
    text-align: left;
    border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#656565", alpha: 0.2 })};
    position: sticky;
    top: 0;
    z-index: 1;
    font-size: 13px;
  }

  td {
    color: ${({ theme }) => theme?.colors?.text || "#212529"};
    padding: 5px 10px;
    border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#656565", alpha: 0.1 })};
    border-bottom: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#656565", alpha: 0.1 })};
    font-size: 13px;
    vertical-align: middle;
  }

  tr:nth-child(even) {
    background-color: ${({ theme }) => theme?.colors?.backgroundCard || theme?.colors?.backgroundLight || "#fafafa"};
  }
  tr:nth-child(odd) {
    background-color: ${({ theme }) => theme?.colors?.backgroundDark || theme?.colors?.background || "#f5f5f5"};
  }

  tr:hover {
    background-color: ${({ theme }) => hexToRGBA({ hex: theme?.colors?.primary || "#007bff", alpha: 0.05 })} !important;
  }
`;

const CleanInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1px solid ${({ theme, disabled }) => disabled ? "transparent" : theme?.colors?.border || "#dee2e6"};
  border-radius: 4px;
  background-color: ${({ theme, disabled }) => disabled ? "transparent" : theme?.colors?.inputBackground || "#fff"};
  color: ${({ theme, disabled }) => disabled ? theme?.colors?.textSecondary || "#6c757d" : theme?.colors?.text || "#000"};
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme?.colors?.primary || "#3c3c3b"};
  }

  &:disabled {
    cursor: default;
    background-color: transparent !important;
  }
`;

const mockData = [
  { id: 1, linea: "LLANTAS", valorDerecha: "", isEditing: false },
  { id: 2, linea: "LLANTAS", valorDerecha: "", isEditing: false },
  { id: 3, linea: "LLANTAS", valorDerecha: "", isEditing: false },
  { id: 4, linea: "LUBRICANTES", valorDerecha: "MOCK_VALUE", isEditing: false },
  { id: 5, linea: "LUBRICANTES", valorDerecha: "", isEditing: false },
  { id: 6, linea: "BATERIAS", valorDerecha: "", isEditing: false },
];

export default function Linea() {
  const { theme } = useTheme();
  const [selectedOption, setSelectedOption] = useState(null);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gruposOriginales, setGruposOriginales] = useState([]);
  const [appliedFilterIds, setAppliedFilterIds] = useState(null);

  const updateFilteredIds = (currentRows, currentFilter) => {
    if (!currentFilter || currentFilter.value === "TODOS") {
      setAppliedFilterIds(null); // null means show all
      return;
    }
    const filtered = currentRows.filter(row => row.DLN_NOMBRE === currentFilter.value);
    setAppliedFilterIds(filtered.map(row => row.DLN_CODIGO));
  };

  const fetchData = async () => {
    setLoading(true);
    const response = await obtenerLineaNegocioParametros();
    if (response.success) {
      const data = response.data || [];
      const newRows = data.map(item => ({ 
        ...item, 
        isEditing: false,
        isInitialUnassigned: item.DLN_NOMBRE === "NO ASIGNADO"
      }));
      setTableRows(newRows);

      // Extract distinct commercial names for the select in the table
      const distinctNames = [...new Set(data.map(item => item.DLN_NOMBRE))];
      const formatted = distinctNames
        .filter(n => n && n !== "NO ASIGNADO")
        .sort()
        .map(n => ({ value: n, label: n }));
      setGruposOriginales(formatted);

      updateFilteredIds(newRows, selectedOption);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const options = useMemo(() => {
    const distinctNames = [...new Set(tableRows.map(row => row.DLN_NOMBRE))];
    const sortedNames = distinctNames.filter(n => n).sort();
    return [
      { value: "TODOS", label: "TODOS" },
      ...sortedNames.map(n => ({ value: n, label: n }))
    ];
  }, [tableRows]);

  const filteredData = useMemo(() => {
    if (!appliedFilterIds) return tableRows;
    return tableRows.filter(row => appliedFilterIds.includes(row.DLN_CODIGO));
  }, [appliedFilterIds, tableRows]);

  const handleFilterChange = (val) => {
    const filter = val || options[0];
    setSelectedOption(filter);
    updateFilteredIds(tableRows, filter);
  };

  const handleInputChange = (codigo, value) => {
    setTableRows(prev => prev.map(row =>
      row.DLN_CODIGO === codigo ? { ...row, DLN_NOMBRE: value } : row
    ));
  };

  const handleToggleEdit = (codigo) => {
    setTableRows(prev => prev.map(row =>
      row.DLN_CODIGO === codigo ? { ...row, isEditing: !row.isEditing } : row
    ));
  };

  const handleCancelEdit = async () => {
    await fetchData();
  };

  const handleSaveRow = async (row) => {
    if (!row.DLN_NOMBRE || row.DLN_NOMBRE === "NO ASIGNADO") {
      toast.error("Debe seleccionar un Nombre Comercial válido.");
      return;
    }

    setLoading(true);
    const res = await actualizarNombreComercial(row.DLN_CODIGO, { DLN_NOMBRE: row.DLN_NOMBRE });
    if (res.success) {
      toast.success(res.message);
      await fetchData();
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <ContainerUI width="100%" height="100%" padding="25px" flexDirection="column" style={{ overflow: "hidden", background: theme?.colors?.background }}>
      <div style={{ width: "100%", position: "relative", display: "flex", alignItems: "center", marginBottom: "30px", zIndex: 10 }}>
        <TextUI size="24px" weight="600">Monitoreo de Líneas</TextUI>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "400px" }}>
          <SelectUI
            label="Filtrar por Línea Comercial"
            placeholder="Seleccione..."
            options={options}
            value={selectedOption || options[0]}
            onChange={handleFilterChange}
            isSearchable
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", border: `1px solid ${theme?.colors?.border || "#dee2e6"}`, borderRadius: "5px" }}>
        <StyledTable theme={theme}>
          <thead>
            <tr>
              <th style={{ width: "42%" }}>Nombre SAP</th>
              <th style={{ width: "42%" }}>Nombre Comercial</th>
              <th style={{ width: "16%", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && tableRows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "30px 0" }}>
                  <TextUI color="gray">Cargando datos...</TextUI>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "30px 0" }}>
                  <TextUI color="gray">No hay registros disponibles.</TextUI>
                </td>
              </tr>
            ) : (
              filteredData.map((row) => {
                const isDisabled = row.DLN_NOMBRE !== "NO ASIGNADO" && !row.isEditing && !row.isInitialUnassigned;
                const isEditingMode = row.isEditing || row.isInitialUnassigned;

                return (
                  <tr key={row.DLN_CODIGO}>
                    <td>
                      <CleanInput
                        theme={theme}
                        disabled
                        value={row.DLN_NOMBRE_EXTENSO}
                        placeholder="Nombre SAP..."
                      />
                    </td>
                    <td>
                      {isDisabled ? (
                        <CleanInput
                          theme={theme}
                          disabled
                          value={row.DLN_NOMBRE}
                          placeholder="Nombre Comercial..."
                        />
                      ) : (
                        <SelectUI
                          options={gruposOriginales}
                          value={gruposOriginales.find(opt => opt.value === row.DLN_NOMBRE) || null}
                          onChange={(val) => handleInputChange(row.DLN_CODIGO, val?.value || "")}
                          placeholder={gruposOriginales.length === 0 ? "No existen datos" : "Seleccione..."}
                          minWidth="100%"
                          maxWidth="100%"
                        />
                      )}
                    </td>
                    <td>
                      <ContenedorFlex $gap="8px" $justifyContent="center">
                        {isEditingMode ? (
                          <>
                            <ButtonUI
                              text=""
                              iconLeft="FaCheck"
                              pcolor={theme?.colors?.success || "#28a745"}
                              onClick={() => handleSaveRow(row)}
                              height="32px"
                              width="32px"
                              title="Guardar"
                              isLoading={loading}
                            />
                            <ButtonUI
                              text=""
                              iconLeft="FaXmark"
                              pcolor={theme?.colors?.error || "#dc3545"}
                              onClick={() => handleCancelEdit()}
                              height="32px"
                              width="32px"
                              title="Cancelar"
                              style={{ display: row.isEditing ? "flex" : "none" }}
                            />
                          </>
                        ) : (
                          <ButtonUI
                            text=""
                            iconLeft="FaPen"
                            pcolor={theme?.colors?.primary || "#007bff"}
                            onClick={() => handleToggleEdit(row.DLN_CODIGO)}
                            height="32px"
                            width="32px"
                            title="Editar"
                          />
                        )}
                      </ContenedorFlex>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </StyledTable>
      </div>
    </ContainerUI>
  );
}
