import React, { useState, useEffect, useMemo } from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TablaInputsUI } from "components/UI/Components/TablaInputsUI";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { TextUI } from "components/UI/Components/TextUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { useTheme } from "context/ThemeContext";
import { getProductosCalculadora } from "services/calculadoraService";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import * as XLSX from "xlsx";

export const CalculadoraPrecios = () => {
  const { theme } = useTheme();
  const [data, setData] = useState([]);
  const [productos, setProductos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [loading, setLoading] = useState(false);
  const [forceEditId, setForceEditId] = useState(null);

  // Opciones para el selector de filtro
  const searchOptions = [
    { value: "all", label: "Todos los campos" },
    { value: "nombreItem", label: "Nombre" },
    { value: "codigoItem", label: "Código" },
    { value: "identificadorItem", label: "Identificador" },
  ];

  // Cargar productos al montar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        const response = await getProductosCalculadora();
        if (response.status === "Ok!") {
          setProductos(response.data || []);
        }
      } catch (error) {
        console.error("Error al cargar productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // Filtrado de productos basado en el campo seleccionado y el query
  const productosFiltrados = useMemo(() => {
    if (!searchQuery) return productos;
    const q = searchQuery.toLowerCase();

    return productos.filter(p => {
      if (searchField === "all") {
        return (
          p.nombreItem?.toLowerCase().includes(q) ||
          p.codigoItem?.toString().includes(q) ||
          p.identificadorItem?.toLowerCase().includes(q)
        );
      }

      const valueToSearch = p[searchField]?.toString().toLowerCase() || "";
      return valueToSearch.includes(q);
    });
  }, [productos, searchQuery, searchField]);

  const getMargenStyle = (valor, onlyText = false) => {
    const v = parseFloat(valor);
    if (isNaN(v)) return {};

    let backgroundColor = "transparent";
    let color = "inherit";

    if (v < 23) {
      backgroundColor = "#e74c3c"; // Rojo
      color = onlyText ? "#e74c3c" : "#fff";
    } else if (v >= 23 && v <= 26) {
      backgroundColor = "#f1c40f"; // Amarillo
      color = onlyText ? "#d4ac0d" : "#000"; // Color un poco más oscuro para legibilidad en texto
    } else if (v > 26) {
      backgroundColor = "#2ecc71"; // Verde
      color = onlyText ? "#27ae60" : "#fff";
    }

    if (onlyText) {
      return { color, fontWeight: "800" };
    }

    return {
      backgroundColor,
      color,
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      width: "100%"
    };
  };

  // Cálculo del Margen General (MB General)
  const margenGeneral = useMemo(() => {
    if (data.length === 0) return null;

    let sumaTotales = 0;
    let sumaCostos = 0;

    data.forEach(row => {
      sumaTotales += parseFloat(row.TOTAL) || 0;
      sumaCostos += parseFloat(row.COSTO_PROMEDIO) || 0;
    });

    if (sumaTotales === 0) return 0;
    return (((sumaTotales - sumaCostos) / sumaTotales) * 100).toFixed(2);
  }, [data]);

  // Función para calcular Total y MB
  const calcularValores = (row) => {
    const precio = parseFloat(row.PRECIO) || 0;
    const costo = parseFloat(row.COSTO_PROMEDIO) || 0;
    const d1 = parseFloat(row.DESCUENTO_1) || 0;
    const d2 = parseFloat(row.DESCUENTO_2) || 0;
    const d3 = parseFloat(row.DESCUENTO_3) || 0;

    // Aplicar descuentos en cascada
    const precioConD1 = precio * (1 - d1 / 100);
    const precioConD2 = precioConD1 * (1 - d2 / 100);
    const precioFinal = precioConD2 * (1 - d3 / 100);

    const total = precioFinal.toFixed(2);
    let mb = 0;
    if (precioFinal > 0) {
      // MB = (Precio Final - costoPromedio) / Precio Final
      mb = (((precioFinal - costo) / precioFinal) * 100).toFixed(2);
    }

    return {
      TOTAL: total,
      MB: mb
    };
  };

  const handleExportExcel = () => {
    if (data.length === 0) return;

    // Preparar los datos para Excel (nombres de columnas amigables)
    const excelData = data.map(item => ({
      "Código": item.ID_PRODUCTO,
      "Identificador": item.IDENTIFICADOR,
      "Nombre": item.NOMBRE,
      "Stock": item.STOCK,
      "Precio Lista": parseFloat(item.PRECIO) || 0,
      "Costo Promedio": parseFloat(item.COSTO_PROMEDIO) || 0,
      "Descuento 1 (%)": parseFloat(item.DESCUENTO_1) || 0,
      "Descuento 2 (%)": parseFloat(item.DESCUENTO_2) || 0,
      "Descuento 3 (%)": parseFloat(item.DESCUENTO_3) || 0,
      "Total": parseFloat(item.TOTAL) || 0,
      "MB (%)": parseFloat(item.MB) || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calculadora");

    // Ajustar anchos de columna (opcional pero mejor estética)
    const wscols = [
      { wch: 15 }, // Código
      { wch: 20 }, // Identificador
      { wch: 40 }, // Nombre
      { wch: 10 }, // Stock
      { wch: 15 }, // Precio Lista
      { wch: 15 }, // Costo Promedio
      { wch: 15 }, // D1
      { wch: 15 }, // D2
      { wch: 15 }, // D3
      { wch: 15 }, // Total
      { wch: 10 }, // MB
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Calculadora_Precios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const columnsConfig = [
    { header: "Nombre", field: "NOMBRE", isEditable: false, width: "300px" },
    { header: "Stock", field: "STOCK", isEditable: false, width: "100px" },
    { header: "Precio", field: "PRECIO", isEditable: false, format: "money", width: "140px" },
    { header: "Costo promedio", field: "COSTO_PROMEDIO", isEditable: false, format: "money", width: "140px" },
    {
      header: "Descuento 1",
      field: "DESCUENTO_1",
      isEditable: true,
      editType: "number",
      min: 0,
      max: 100,
      step: 0.01,
      width: "110px"
    },
    {
      header: "Descuento 2",
      field: "DESCUENTO_2",
      isEditable: true,
      editType: "number",
      min: 0,
      max: 100,
      step: 0.01,
      width: "110px"
    },
    {
      header: "Descuento 3",
      field: "DESCUENTO_3",
      isEditable: true,
      editType: "number",
      min: 0,
      max: 100,
      step: 0.01,
      width: "110px"
    },
    { header: "Total", field: "TOTAL", isEditable: false, format: "money", width: "140px" },
    {
      header: "MB (%)",
      field: "MB",
      isEditable: false,
      width: "100px",
      style: (row) => getMargenStyle(row.MB, true)
    },
  ];

  const handleRowChange = (updatedRow) => {
    const nuevosValores = calcularValores(updatedRow);
    const rowWithCalculated = {
      ...updatedRow,
      TOTAL: nuevosValores.TOTAL,
      MB: nuevosValores.MB
    };

    // Actualizar el estado global data automáticamente
    setData((prev) => prev.map(row => row.ID === rowWithCalculated.ID ? rowWithCalculated : row));
  };

  const handleAddProductFromModal = (producto) => {
    const newId = Date.now();
    const nuevaFila = {
      ID: newId,
      ID_PRODUCTO: producto.codigoItem,
      IDENTIFICADOR: producto.identificadorItem,
      NOMBRE: producto.nombreItem,
      STOCK: producto.stock,
      PRECIO: producto.listaPreciosA,
      COSTO_PROMEDIO: producto.costoPromedio,
      DESCUENTO_1: 0,
      DESCUENTO_2: 0,
      DESCUENTO_3: 0,
      ...calcularValores({
        PRECIO: producto.listaPreciosA,
        COSTO_PROMEDIO: producto.costoPromedio,
        DESCUENTO_1: 0,
        DESCUENTO_2: 0,
        DESCUENTO_3: 0
      })
    };
    setData([...data, nuevaFila]);
    setIsModalOpen(false);
    setSearchQuery("");
    setSearchField("all");

    setForceEditId(newId);
    setTimeout(() => setForceEditId(null), 100);
  };

  const handleDelete = (item) => {
    setData((prev) => prev.filter((row) => row.ID !== item.ID));
  };

  const handleSave = async (item) => {
    // Cuando el usuario guarda, actualizamos el estado global data
    setData((prev) => prev.map(row => row.ID === item.ID ? item : row));
    return { res: true, id: item.ID || Date.now() };
  };

  const modalColumns = [
    { header: "Código", field: "codigoItem", width: "100px" },
    { header: "Identificador", field: "identificadorItem", width: "150px" },
    { header: "Nombre del Producto", field: "nombreItem" },
  ];

  return (
    <ContainerUI
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="flex-start"
      width="100%"
      height="100%"
      style={{ padding: "20px" }}
    >
      <ContainerUI flexDirection="row" width="100%" justifyContent="space-between" alignItems="center" style={{ marginBottom: "20px" }}>
        <TextUI
          size="24px"
          weight="700"
          color={theme?.colors?.primary}
        >
          Calculadora de Precios
        </TextUI>

        <ContainerUI flexDirection="row" style={{ gap: "10px" }}>
          <ContainerUI
            flexDirection="column"
            alignItems="flex-end"
            style={{
              backgroundColor: margenGeneral === null ? "transparent" : getMargenStyle(margenGeneral).backgroundColor,
              padding: "10px 20px",
              borderRadius: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: `1px solid ${theme?.colors?.border || "#eee"}`,
              transition: "all 0.3s ease",
              minWidth: "150px"
            }}
          >
            <TextUI 
              size="12px" 
              weight="500" 
              color={margenGeneral === null 
                ? (theme.name === "dark" ? "#aaa" : "#666") 
                : (getMargenStyle(margenGeneral).color)}
            >
              MARGEN GENERAL
            </TextUI>
            <TextUI
              size="22px"
              weight="800"
              color={margenGeneral === null 
                ? (theme.name === "dark" ? "#fff" : "#000") 
                : (getMargenStyle(margenGeneral).color)}
            >
              {margenGeneral === null ? "S/D" : `${margenGeneral}%`}
            </TextUI>
          </ContainerUI>
        </ContainerUI>
      </ContainerUI>

      <ContainerUI width="100%" height="calc(100% - 100px)">
        <TablaInputsUI
          data={data}
          columnsConfig={columnsConfig}
          onSave={handleSave}
          onRowChange={handleRowChange}
          onDelete={handleDelete}
          nombreID="ID"
          showFilters={false}
          addButtonText="Agregar un producto"
          onAddRowClick={() => setIsModalOpen(true)}
          externalEditingRowId={forceEditId}
          alwaysEditable={true}
          hideActions={true}
          oddRowColor={theme.name === "dark" ? "#111" : "#ffffff"}
          evenRowColor={theme.name === "dark" ? "#222" : "#f8f9fa"}
          extraHeaderContent={
            <ButtonUI
              text="Exportar a Excel"
              iconLeft="FaFileExcel"
              onClick={handleExportExcel}
              pcolor="#27ae60"
              style={{ padding: "5px 15px" }}
              disabled={data.length === 0}
            />
          }
        />
      </ContainerUI>

      <ModalUI
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Búsqueda de Productos"
        maxWidth="1000px"
        width="95%"
        noFooter
        noPadding
      >
        <ContainerUI flexDirection="column" style={{ padding: "20px", gap: "15px", height: "70vh" }}>
          <ContainerUI flexDirection="row" width="100%" style={{ gap: "0px", alignItems: "stretch" }}>
            <div style={{ flex: 1 }}>
              <InputUI
                placeholder="Ingrese nombre, código o ID..."
                value={searchQuery}
                onChange={setSearchQuery}
                iconLeft="FaSearch"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                autoFocus
              />
            </div>
            <div style={{ width: "220px" }}>
              <SelectUI
                options={searchOptions}
                value={searchOptions.find(opt => opt.value === searchField)}
                onChange={(opt) => setSearchField(opt.value)}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              />
            </div>
          </ContainerUI>

          <div style={{ flex: 1, overflow: "hidden", border: `1px solid ${theme?.colors?.border || "#dee2e6"}`, borderRadius: "8px" }}>
            <TablaInfoUI
              data={productosFiltrados}
              columns={modalColumns}
              defaultFilters={[]}
              onRowDoubleClick={(item) => handleAddProductFromModal(item)}
              includeModal={false}
              showFilters={false}
            />
          </div>

          <ContainerUI justifyContent="center">
            <TextUI size="13px" color={theme?.colors?.textSecondary}>
              Doble clic para seleccionar producto
            </TextUI>
          </ContainerUI>
        </ContainerUI>
      </ModalUI>
    </ContainerUI>
  );
};
