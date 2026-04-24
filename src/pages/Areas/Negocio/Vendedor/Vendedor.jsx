import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "context/ThemeContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContenedorFlex } from "components/UI/Components/ContenedorFlex";
import { IconUI } from "components/UI/Components/IconsUI";
import { hexToRGBA } from "utils/colors";
import styled from "styled-components";
import { obtenerVendedoresParametros, crearLineaNegocio, obtenerLineaNegocioParametros } from "services/LineaNegocio";
import { toast } from "react-toastify";

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 15px;
  width: 100%;
  padding: 15px 25px;
  background-color: ${({ theme }) => theme?.colors?.background || "#fff"};
  border-bottom: 2px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.text || "#000", alpha: 0.05 })};
  position: relative;
  z-index: 10;
`;

const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 300px;
`;

const SearchInputContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme?.colors?.inputBackground || theme?.colors?.backgroundCard || "#fff"};
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 4px;
  padding: 0 10px;
  height: 38px;
  width: 100%;

  &:focus-within {
    border-color: ${({ theme }) => theme?.colors?.primary || "#3c3c3b"};
    box-shadow: 0 0 0 1px ${({ theme }) => theme?.colors?.primary || "#3c3c3b"};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: ${({ theme }) => theme?.colors?.text || "#212529"};
  font-size: 14px;
  margin-left: 8px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;
  table-layout: fixed;

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
    padding: 8px 10px;
    border-right: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#656565", alpha: 0.1 })};
    border-bottom: 1px solid ${({ theme }) => hexToRGBA({ hex: theme?.colors?.border || "#656565", alpha: 0.1 })};
    font-size: 13px;
    vertical-align: middle;
    overflow: visible; /* Allows select menus to overlap */
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
  border: 1px solid ${({ theme, disabled, $isNew }) => (disabled && !$isNew) ? "transparent" : theme?.colors?.border || "#dee2e6"};
  border-radius: 4px;
  background-color: ${({ theme, disabled }) => disabled ? "transparent" : theme?.colors?.inputBackground || "#fff"};
  color: ${({ theme }) => theme?.colors?.text || "#000"};
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme?.colors?.primary || "#3c3c3b"};
  }

  &:disabled {
    cursor: default;
  }
`;

export default function Vendedor() {
  const { theme } = useTheme();

  // Estados
  const [empresaFiltro, setEmpresaFiltro] = useState(null); // null = Todas
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParam, setSearchParam] = useState({ value: "TODOS", label: "Cualquier Campo" });

  const [listaCompleta, setListaCompleta] = useState([]);
  const [maestroParametros, setMaestroParametros] = useState([]);
  const [lineasComerciales, setLineasComerciales] = useState([]);
  const [loadingAPI, setLoadingAPI] = useState(false);

  // Opciones derivadas del maestro
  const opcionesLineas = useMemo(() => {
    return lineasComerciales.map(l => ({ value: l, label: l }));
  }, [lineasComerciales]);

  const opcionesCategoriasMaestro = useMemo(() => {
    const unique = [...new Set(maestroParametros.map(item => item.CATEGORIA).filter(c => c && c !== "UF"))];
    return unique.sort().map(c => ({ value: c, label: c }));
  }, [maestroParametros]);

  // Opciones base
  const opcionesEmpresas = [
    { value: "TODAS", label: "Todas las empresas" },
    { value: "AUTOLLANTA", label: "AUTOLLANTA" },
    { value: "MAXXIMUNDO", label: "MAXXIMUNDO" },
    { value: "STOX", label: "STOX" },
    { value: "IKONIX", label: "IKONIX" },
    { value: "AUTOMAX", label: "AUTOMAX" },
  ];

  const opcionesEmpresasAdd = [
    { value: "AUTOLLANTA", label: "AUTOLLANTA" },
    { value: "MAXXIMUNDO", label: "MAXXIMUNDO" },
    { value: "STOX", label: "STOX" },
    { value: "IKONIX", label: "IKONIX" },
    { value: "AUTOMAX", label: "AUTOMAX" },
  ];

  const opcionesSearchParam = [
    { value: "TODOS", label: "Cualquier Campo" },
    { value: "VENDEDOR", label: "Vendedor" },
    { value: "LINEA", label: "Línea de Negocio" },
    { value: "CATEGORIA", label: "Categoría" },
  ];

  // Cargar datos
  const fetchMaster = async () => {
    setLoadingAPI(true);
    const [resVendedores, resLineas] = await Promise.all([
      obtenerVendedoresParametros(),
      obtenerLineaNegocioParametros()
    ]);

    if (resLineas.success) {
      const distinctNames = [...new Set((resLineas.data || []).map(item => item.DLN_NOMBRE))];
      const formatted = distinctNames
        .filter(n => n && n !== "NO ASIGNADO")
        .sort();
      setLineasComerciales(formatted);
    }

    if (resVendedores.success) {
      setMaestroParametros(resVendedores.data);
      const convertidas = resVendedores.data.map((item, idx) => ({
        id: item.IDENTIFICADOR_PARAMETROS || `api_${item.CODIGOVENDEDOR}_${idx}`,
        EMPRESA: item.EMPRESA || "",
        VENDEDOR: item.VENDEDOR || "",
        CODIGOVENDEDOR: item.CODIGOVENDEDOR || "",
        linea: item.LINEANEGOCIO === "UF" ? "" : (item.LINEANEGOCIO || ""),
        categoria: item.CATEGORIA === "UF" ? "" : (item.CATEGORIA || ""),
        isEditing: false,
        isNew: false
      }));
      setListaCompleta(convertidas);
    }
    setLoadingAPI(false);
  };

  useEffect(() => {
    fetchMaster();
  }, []);

  // Manejadores Filtros
  const handleEmpresaChange = (val) => {
    if (val && val.value === "TODAS") setEmpresaFiltro(null);
    else setEmpresaFiltro(val);
  };

  // Filtrado final para la tabla
  const datosFiltrados = useMemo(() => {
    return listaCompleta.filter(row => {
      // Ignorar filtros para filas nuevas que se están añadiendo inline
      if (row.isNew) return true;

      const matchEmpresa = !empresaFiltro ||
        row.EMPRESA?.toUpperCase() === empresaFiltro.value.toUpperCase();
      if (!matchEmpresa) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const p = searchParam.value;

        const matchVend = row.VENDEDOR?.toLowerCase().includes(term);
        const matchLin = row.linea?.toLowerCase().includes(term);
        const matchCat = row.categoria?.toLowerCase().includes(term);

        if (p === "VENDEDOR") return matchVend;
        if (p === "LINEA") return matchLin;
        if (p === "CATEGORIA") return matchCat;

        const matchEmp = row.EMPRESA?.toLowerCase().includes(term);
        return matchVend || matchLin || matchCat || matchEmp;
      }
      return true;
    });
  }, [listaCompleta, empresaFiltro, searchTerm, searchParam]);

  // Manejador Nueva Fila
  const handleAddNewRow = () => {
    const newId = `new_${Date.now()}`;
    setListaCompleta(prev => [
      {
        id: newId,
        EMPRESA: "",
        VENDEDOR: "",
        CODIGOVENDEDOR: "",
        linea: "",
        categoria: "",
        isEditing: true,
        isNew: true
      },
      ...prev
    ]);
  };

  // Modificar fila en el estado
  const handleUpdateRowState = (id, field, value) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleChangeRowEmpresa = (id, val) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, EMPRESA: val.value, CODIGOVENDEDOR: "", VENDEDOR: "" } : row
    ));
  };

  const handleChangeRowVendedor = (id, val) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, CODIGOVENDEDOR: val.value, VENDEDOR: val.label, linea: "", categoria: "" } : row
    ));
  };

  const handleChangeRowLinea = (id, val, isNew) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, linea: val.value, categoria: "" } : row
    ));
  };

  const handleChangeRowCategoria = (id, val) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, categoria: val.value } : row
    ));
  };

  const handleToggleEdit = (id) => {
    setListaCompleta(prev => prev.map(row =>
      row.id === id ? { ...row, isEditing: !row.isEditing } : row
    ));
  };

  const handleCancelEdit = (row) => {
    if (row.isNew) {
      setListaCompleta(prev => prev.filter(item => item.id !== row.id));
    } else {
      // Buscamos el original en maestroParametros para revertir valores
      const idx = listaCompleta.findIndex(item => item.id === row.id);
      const original = maestroParametros[idx]; // Aproximación, ya que se usan en paralelo

      // Mejor buscar por IDENTIFICADOR_PARAMETROS ya que row.id lo contiene
      const actualOriginal = maestroParametros.find(m => m.IDENTIFICADOR_PARAMETROS === row.id);

      if (actualOriginal) {
        setListaCompleta(prev => prev.map(item =>
          item.id === row.id ? {
            ...item,
            linea: actualOriginal.LINEANEGOCIO === "UF" ? "" : (actualOriginal.LINEANEGOCIO || ""),
            categoria: actualOriginal.CATEGORIA === "UF" ? "" : (actualOriginal.CATEGORIA || ""),
            isEditing: false
          } : item
        ));
      } else {
        handleToggleEdit(row.id);
      }
    }
  };

  // Obtener vendedores dinámicamente para la empresa seleccionada al añadir una línea
  const getVendedoresParaEmpresa = (empresaValue) => {
    if (!empresaValue) return [];

    const filtrados = maestroParametros.filter(item => item.EMPRESA?.toUpperCase() === empresaValue.toUpperCase());
    const vendorsMap = new Map();
    filtrados.forEach(v => {
      const code = v.CODIGOVENDEDOR;
      if (code && !vendorsMap.has(code)) {
        vendorsMap.set(code, { value: code, label: `${v.VENDEDOR}` });
      }
    });

    return Array.from(vendorsMap.values());
  };

  // Obtener líneas disponibles (que el vendedor no tenga ya asignadas)
  const getLineasDisponibles = (codVendedor, currentRowId) => {
    if (!codVendedor) return [];

    const lineasOcupadas = listaCompleta
      .filter(row => row.id !== currentRowId && row.CODIGOVENDEDOR === codVendedor)
      .map(row => row.linea?.toUpperCase());

    return opcionesLineas.filter(opt => !lineasOcupadas.includes(opt.value.toUpperCase()));
  };

  // Obtener categorías disponibles para un vendedor y línea específicos
  const getCategoriasDisponibles = (codVendedor, lineaSel, currentRowId) => {
    if (!codVendedor || !lineaSel) return [];

    // Según requerimiento: mostrar solo las categorías que el vendedor no tenga en la línea seleccionada.
    // Como solo puede tener una por línea, si ya tiene una (en otra fila), no debería ver más.
    // Pero si estamos editando la misma fila, sí debe verla.
    const categoriasOcupadas = listaCompleta
      .filter(row => row.id !== currentRowId && row.CODIGOVENDEDOR === codVendedor && row.linea?.toUpperCase() === lineaSel.toUpperCase())
      .map(row => row.categoria?.toUpperCase());

    return opcionesCategoriasMaestro.filter(opt => !categoriasOcupadas.includes(opt.value.toUpperCase()));
  };

  const handleSaveRow = async (row) => {
    if (row.isNew && (!row.EMPRESA || !row.CODIGOVENDEDOR)) {
      toast.error("Debe seleccionar una Empresa y un Vendedor.");
      return;
    }

    const normalizedLinea = row.linea?.trim() || "";

    if (!normalizedLinea || !row.categoria?.trim()) {
      toast.error("Debe completar Línea y Categoría antes de guardar.");
      return;
    }

    // Verificar duplicado
    const isDuplicate = listaCompleta.some(item =>
      item.id !== row.id &&
      item.CODIGOVENDEDOR === row.CODIGOVENDEDOR &&
      item.EMPRESA === row.EMPRESA &&
      item.linea?.toString().toLowerCase().trim() === normalizedLinea.toLowerCase()
    );

    if (isDuplicate) {
      toast.warning(`La línea "${normalizedLinea}" ya existe para este vendedor.`);
      return;
    }

    // Preparar payload
    const dataPost = {
      DCP_CODIGOVENDEDOR: row.CODIGOVENDEDOR,
      DCP_LINEA: normalizedLinea.toUpperCase(),
      DCP_CATEGORIA: row.categoria.toUpperCase()
    };

    setLoadingAPI(true);
    const res = await crearLineaNegocio(dataPost);

    if (res.success) {
      toast.success("Asociación guardada correctamente");
      await fetchMaster(); // Refrescar para tener el IDENTIFICADOR real
    } else {
      toast.error(res.message || "Error al guardar la asociación");
    }
    setLoadingAPI(false);
  };

  return (
    <ContainerUI width="100%" height="100%" flexDirection="column" style={{ overflow: "hidden", background: theme?.colors?.background }}>
      <ContenedorFlex $width="100%" $padding="15px 25px 0 25px" $flexDirection="column" $alignItems="flex-start">
        <TextUI size="20px" weight="600">Gestión de Líneas por Vendedor</TextUI>
      </ContenedorFlex>

      <FilterBar theme={theme}>
        <FilterItem style={{ minWidth: "250px", maxWidth: "400px" }}>
          <TextUI size="13px" weight="500" color={theme?.colors?.textSecondary || "#6c757d"} style={{ marginBottom: "6px", display: "block" }}>
            Búsqueda
          </TextUI>
          <SearchInputContainer theme={theme}>
            <IconUI name="FaSearch" size={14} color={theme?.colors?.textSecondary || "#6c757d"} />
            <SearchInput
              theme={theme}
              placeholder="Escribe tu búsqueda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchInputContainer>
        </FilterItem>

        <FilterItem style={{ minWidth: "150px", maxWidth: "200px" }}>
          <SelectUI
            label="Buscar por"
            placeholder="Campo"
            options={opcionesSearchParam}
            value={searchParam}
            onChange={(val) => setSearchParam(val || opcionesSearchParam[0])}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </FilterItem>

        <FilterItem style={{ minWidth: "150px", maxWidth: "200px" }}>
          <SelectUI
            label="Empresa"
            placeholder="Todas"
            options={opcionesEmpresas}
            value={empresaFiltro || opcionesEmpresas[0]}
            onChange={handleEmpresaChange}
            isSearchable
            menuPortalTarget={document.body}
          />
        </FilterItem>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "flex-end" }}>
          <ButtonUI
            text="Agregar Nueva Línea"
            iconLeft="FaPlus"
            onClick={handleAddNewRow}
            pcolor={theme?.colors?.secondary}
            height="38px"
          />
        </div>
      </FilterBar>

      <div style={{ flex: 1, overflow: "auto", padding: "15px 25px" }}>
        {loadingAPI && listaCompleta.length === 0 ? (
          <ContenedorFlex style={{ height: "100%", alignItems: "center", justifyContent: "center" }}>
            <TextUI color="gray">Cargando datos...</TextUI>
          </ContenedorFlex>
        ) : (
          <div style={{ border: `1px solid ${theme?.colors?.border || "#dee2e6"}`, borderRadius: "5px", overflow: "auto", maxHeight: "100%" }}>
            <StyledTable theme={theme}>
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>Empresa</th>
                  <th style={{ width: "27%" }}>Vendedor</th>
                  <th style={{ width: "27%" }}>Línea de Negocio</th>
                  <th style={{ width: "18%" }}>Categoría</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "30px 0" }}>
                      <TextUI color={theme?.colors?.textSecondary || "gray"}>
                        {searchTerm ? "No se encontraron coincidencias." : "No hay registros disponibles."}
                      </TextUI>
                    </td>
                  </tr>
                ) : (
                  datosFiltrados.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.isNew ? (
                          <SelectUI
                            options={opcionesEmpresasAdd}
                            value={opcionesEmpresasAdd.find(o => o.value === row.EMPRESA)}
                            onChange={(val) => handleChangeRowEmpresa(row.id, val)}
                            placeholder="Empresa..."
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                          />
                        ) : (
                          <TextUI weight="500" size="13px">{row.EMPRESA}</TextUI>
                        )}
                      </td>
                      <td>
                        {row.isNew ? (
                          <SelectUI
                            options={getVendedoresParaEmpresa(row.EMPRESA)}
                            value={row.CODIGOVENDEDOR ? { value: row.CODIGOVENDEDOR, label: row.VENDEDOR } : null}
                            onChange={(val) => handleChangeRowVendedor(row.id, val)}
                            placeholder="Vendedor..."
                            isDisabled={!row.EMPRESA}
                            menuPlacement="auto"
                            isSearchable
                            menuPortalTarget={document.body}
                          />
                        ) : (
                          <>
                            <TextUI size="13px">{row.VENDEDOR}</TextUI>
                          </>
                        )}
                      </td>
                      <td>
                        {(row.isNew || row.isEditing) ? (
                          <SelectUI
                            options={getLineasDisponibles(row.CODIGOVENDEDOR, row.id)}
                            value={opcionesLineas.find(o => o.value === row.linea)}
                            onChange={(val) => handleChangeRowLinea(row.id, val, row.isNew)}
                            placeholder="Línea..."
                            isDisabled={!row.CODIGOVENDEDOR}
                            menuPlacement="auto"
                            isSearchable
                            menuPortalTarget={document.body}
                          />
                        ) : (
                          <TextUI size="13px">{row.linea}</TextUI>
                        )}
                      </td>
                      <td>
                        {(row.isNew || row.isEditing) ? (
                          <SelectUI
                            options={getCategoriasDisponibles(row.CODIGOVENDEDOR, row.linea, row.id)}
                            value={opcionesCategoriasMaestro.find(o => o.value === row.categoria)}
                            onChange={(val) => handleChangeRowCategoria(row.id, val)}
                            placeholder="Categoría..."
                            isDisabled={!row.linea}
                            menuPlacement="auto"
                            isSearchable
                            menuPortalTarget={document.body}
                          />
                        ) : (
                          <TextUI size="13px">{row.categoria}</TextUI>
                        )}
                      </td>
                      <td>
                        <ContenedorFlex $gap="8px" $justifyContent="center">
                          {row.isEditing ? (
                            <>
                              <ButtonUI
                                text=""
                                iconLeft="FaCheck"
                                pcolor={theme?.colors?.success || "#28a745"}
                                onClick={() => handleSaveRow(row)}
                                height="32px"
                                width="32px"
                                title="Guardar"
                              />
                              <ButtonUI
                                text=""
                                iconLeft="FaXmark"
                                pcolor={theme?.colors?.error || "#dc3545"}
                                onClick={() => handleCancelEdit(row)}
                                height="32px"
                                width="32px"
                                title="Cancelar"
                              />
                            </>
                          ) : (
                            <ButtonUI
                              text=""
                              iconLeft="FaPen"
                              pcolor={theme?.colors?.primary || "#007bff"}
                              onClick={() => handleToggleEdit(row.id)}
                              height="32px"
                              width="32px"
                              title="Editar"
                            />
                          )}
                        </ContenedorFlex>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </StyledTable>
          </div>
        )}
      </div>
    </ContainerUI>
  );
}
