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
import { LoaderUI } from "components/UI/Components/LoaderUI";
import * as XLSX from "xlsx";
import { useAuthContext } from "context/authContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const CalculadoraPrecios = ({ availableCompanies = [] }) => {
  const { theme } = useTheme();
  const [data, setData] = useState([]);
  const [productos, setProductos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState("all");
  const { user } = useAuthContext();
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceEditId, setForceEditId] = useState(null);
  const [selectedProductos, setSelectedProductos] = useState([]);

  // Obtener opciones de empresas desde las empresas disponibles pasadas por el router
  const empresasOptions = useMemo(() => {
    return availableCompanies.map(emp => ({
      value: emp.id.toString(),
      label: emp.nombre
    }));
  }, [availableCompanies]);

  // Inicializar la empresa seleccionada si no hay una
  useEffect(() => {
    if (empresasOptions.length > 0 && !selectedEmpresa) {
      setSelectedEmpresa(empresasOptions[0]);
    }
  }, [empresasOptions, selectedEmpresa]);

  // Opciones para el selector de filtro
  const searchOptions = [
    { value: "all", label: "Todos los campos" },
    { value: "nombreItem", label: "Nombre" },
    { value: "codigoItem", label: "Código" },
    { value: "identificadorItem", label: "Identificador" },
  ];

  // Cargar todos los productos al montar el componente (eager loading)
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      try {
        // Llamamos a la API sin ID de empresa para intentar traer el catálogo completo
        const response = await getProductosCalculadora(null);
        if (response.status === "Ok!") {
          setProductos(response.data || []);
        }
      } catch (error) {
        console.error("Error al cargar el catálogo de productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // Filtrado de productos basado en la empresa, el campo seleccionado y el query
  const productosFiltrados = useMemo(() => {
    let filtered = productos;

    // 1. Filtrar por la empresa seleccionada (ya filtrado por API, pero aseguramos consistencia)
    if (selectedEmpresa) {
      filtered = filtered.filter(p =>
        p.empresa === selectedEmpresa.label ||
        p.NOMBRE_EMPRESA === selectedEmpresa.label ||
        p.ID_EMPRESA?.toString() === selectedEmpresa.value?.toString()
      );
    }

    if (!searchQuery) return filtered;
    const q = searchQuery.toLowerCase();

    return filtered.filter(p => {
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
  }, [productos, searchQuery, searchField, selectedEmpresa]);

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
      const cantidad = parseFloat(row.CANTIDAD) || 1;
      sumaTotales += parseFloat(row.TOTAL) || 0;
      sumaCostos += (parseFloat(row.COSTO_PROMEDIO) || 0) * cantidad;
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
    const cantidad = parseFloat(row.CANTIDAD) || 1;

    // Aplicar descuentos en cascada para obtener el precio unitario final
    const precioConD1 = precio * (1 - d1 / 100);
    const precioConD2 = precioConD1 * (1 - d2 / 100);
    const precioUnitarioFinal = precioConD2 * (1 - d3 / 100);

    const total = (precioUnitarioFinal * cantidad).toFixed(2);
    let mb = 0;
    if (precioUnitarioFinal > 0) {
      // MB = (Precio Unitario Final - costoPromedio) / Precio Unitario Final
      mb = (((precioUnitarioFinal - costo) / precioUnitarioFinal) * 100).toFixed(2);
    }

    return {
      PRECIO_UNITARIO: precioUnitarioFinal.toFixed(2),
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
      "Cant": parseFloat(item.CANTIDAD) || 0,
      "Precio Lista": parseFloat(item.PRECIO) || 0,
      "Descuento 1 (%)": parseFloat(item.DESCUENTO_1) || 0,
      "Descuento 2 (%)": parseFloat(item.DESCUENTO_2) || 0,
      "Descuento 3 (%)": parseFloat(item.DESCUENTO_3) || 0,
      "P. Unitario": parseFloat(item.PRECIO_UNITARIO) || 0,
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
      { wch: 10 }, // Cant
      { wch: 15 }, // Precio Lista
      { wch: 15 }, // D1
      { wch: 15 }, // D2
      { wch: 15 }, // D3
      { wch: 15 }, // P. Unitario
      { wch: 15 }, // Total
      { wch: 10 }, // MB
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Calculadora_Precios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    if (data.length === 0) return;

    const doc = new jsPDF();

    // Título del PDF
    doc.setFontSize(18);
    doc.text("Resumen de Calculadora de Precios", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
    if (selectedEmpresa) {
      doc.text(`Empresa: ${selectedEmpresa.label}`, 14, 34);
    }

    // Preparar columnas y datos para AutoTable
    const tableColumn = [
      "Código",
      "Nombre",
      "Stock",
      "Cant",
      "Precio",
      "D1 (%)",
      "D2 (%)",
      "D3 (%)",
      "P. Unitario",
      "Total",
      "MB (%)"
    ];

    const tableRows = data.map(item => [
      item.ID_PRODUCTO || "",
      item.NOMBRE || "",
      item.STOCK || 0,
      item.CANTIDAD || 0,
      item.PRECIO ? parseFloat(item.PRECIO).toFixed(2) : "0.00",
      item.DESCUENTO_1 || 0,
      item.DESCUENTO_2 || 0,
      item.DESCUENTO_3 || 0,
      item.PRECIO_UNITARIO ? parseFloat(item.PRECIO_UNITARIO).toFixed(2) : "0.00",
      item.TOTAL ? parseFloat(item.TOTAL).toFixed(2) : "0.00",
      item.MB ? parseFloat(item.MB).toFixed(2) : "0.00"
    ]);

    // Generar la tabla
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right', fontStyle: 'bold' },
        10: { halign: 'center' }
      }
    });

    // Agregar resumen del margen general
    const lastY = doc.lastAutoTable.finalY + 10;
    if (margenGeneral !== null) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`MARGEN GENERAL: ${margenGeneral}%`, 14, lastY);
    }

    doc.save("Calculadora_Precios.pdf");
  };

  const columnsConfig = [
    { header: "Código", field: "ID_PRODUCTO", isEditable: false, width: "120px" },
    { header: "Nombre", field: "NOMBRE", isEditable: false, width: "300px" },
    { header: "Stock", field: "STOCK", isEditable: false, width: "100px" },
    {
      header: "Cantidad",
      field: "CANTIDAD",
      isEditable: true,
      editType: "number",
      min: 1,
      width: "100px"
    },
    { header: "Precio", field: "PRECIO", isEditable: false, format: "money", width: "140px" },
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
    {
      header: "P. Unitario",
      field: "PRECIO_UNITARIO",
      isEditable: false,
      format: "money",
      width: "140px"
    },
    {
      header: "Total",
      field: "TOTAL",
      isEditable: true,
      editType: "number",
      step: 0.01,
      width: "140px"
    },
    {
      header: "MB (%)",
      field: "MB",
      isEditable: false,
      width: "100px",
      style: (row) => getMargenStyle(row.MB, true)
    },
  ];

  const handleRowChange = (updatedRow) => {
    // Encontrar la fila anterior para detectar qué campo cambió
    const prevRow = data.find(r => r.ID === updatedRow.ID);
    let rowToProcess = { ...updatedRow };
    let isTotalManual = false;

    // Validación de cantidad mínima
    const cantidadIngresada = parseFloat(updatedRow.CANTIDAD) || 0;

    if (cantidadIngresada < 1) {
      rowToProcess.CANTIDAD = 1;
    }

    // Si el usuario modificó manualmente el TOTAL
    if (prevRow && parseFloat(prevRow.TOTAL || 0).toFixed(2) !== parseFloat(updatedRow.TOTAL || 0).toFixed(2)) {
      isTotalManual = true;
      const precio = parseFloat(updatedRow.PRECIO) || 0;
      const d1 = parseFloat(updatedRow.DESCUENTO_1) || 0;
      const d2 = parseFloat(updatedRow.DESCUENTO_2) || 0;
      const totalManual = parseFloat(updatedRow.TOTAL) || 0;
      const cantidad = parseFloat(rowToProcess.CANTIDAD) || 1;

      // Calcular Base del Descuento 3: Precio * (1-D1) * (1-D2)
      const base3 = precio * (1 - d1 / 100) * (1 - d2 / 100);

      if (base3 > 0) {
        // Despejando D3 considerando cantidad: total = (base3 * (1 - d3/100)) * cantidad
        // total / cantidad = base3 * (1 - d3/100)
        // (total / cantidad) / base3 = 1 - d3/100
        // d3/100 = 1 - ((total / cantidad) / base3)
        const nuevoD3 = (1 - ((totalManual / cantidad) / base3)) * 100;
        rowToProcess.DESCUENTO_3 = nuevoD3.toFixed(2);
      }
    }

    const nuevosValores = calcularValores(rowToProcess);
    const rowWithCalculated = {
      ...rowToProcess,
      // Si el cambio fue manual, mantenemos el valor tal como lo escribió el usuario para no romper el input (ej. evitar que "1" se vuelva "1.00" mientras escribe)
      PRECIO_UNITARIO: nuevosValores.PRECIO_UNITARIO,
      TOTAL: isTotalManual ? updatedRow.TOTAL : nuevosValores.TOTAL,
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
      CANTIDAD: 1,
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
        DESCUENTO_3: 0,
        CANTIDAD: 1
      })
    };
    setData([...data, nuevaFila]);
    setIsModalOpen(false);
    setSelectedProductos([]);
    setSearchQuery("");
    setSearchField("all");

    setForceEditId(newId);
    setTimeout(() => setForceEditId(null), 100);
  };

  const handleAddMultipleProducts = () => {
    if (selectedProductos.length === 0) return;
    
    const baseId = Date.now();
    const nuevasFilas = selectedProductos.map((producto, index) => {
      const newId = baseId + index;
      return {
        ID: newId,
        ID_PRODUCTO: producto.codigoItem,
        IDENTIFICADOR: producto.identificadorItem,
        NOMBRE: producto.nombreItem,
        STOCK: producto.stock,
        CANTIDAD: 1,
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
          DESCUENTO_3: 0,
          CANTIDAD: 1
        })
      };
    });

    setData([...data, ...nuevasFilas]);
    setIsModalOpen(false);
    setSelectedProductos([]);
    setSearchQuery("");
    setSearchField("all");
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
            <div style={{ display: "flex", gap: "10px" }}>
              <ButtonUI
                text="Exportar a PDF"
                iconLeft="FaFilePdf"
                onClick={handleExportPDF}
                pcolor="#e74c3c"
                style={{ padding: "5px 15px" }}
                disabled={data.length === 0}
              />
              <ButtonUI
                text="Exportar a Excel"
                iconLeft="FaFileExcel"
                onClick={handleExportExcel}
                pcolor="#27ae60"
                style={{ padding: "5px 15px" }}
                disabled={data.length === 0}
              />
            </div>
          }
        />
      </ContainerUI>

      <ModalUI
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProductos([]);
        }}
        title="Búsqueda de Productos"
        maxWidth="1000px"
        width="95%"
        noFooter={selectedProductos.length === 0}
        noPadding
        footer={
          <ContainerUI justifyContent="flex-end" width="100%" style={{ padding: "10px 20px" }}>
            <ButtonUI
              text={`Agregar ${selectedProductos.length} productos`}
              onClick={handleAddMultipleProducts}
              pcolor={theme?.colors?.primary}
              iconLeft="FaPlus"
              disabled={selectedProductos.length === 0}
            />
          </ContainerUI>
        }
      >
        <ContainerUI flexDirection="column" style={{ padding: "20px", gap: "10px", height: "75vh" }}>
          {/* Fila de Búsqueda y Filtros Consolidada */}
          <ContainerUI flexDirection="row" width="100%" style={{ gap: "10px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <TextUI size="13px" weight="600" color={theme?.colors?.textSecondary} style={{ marginBottom: "4px" }}>Búsqueda:</TextUI>
              <InputUI
                placeholder="Ingrese nombre, código o ID..."
                value={searchQuery}
                onChange={setSearchQuery}
                iconLeft="FaSearch"
                autoFocus
              />
            </div>
            <div style={{ width: "180px" }}>
              <TextUI size="13px" weight="600" color={theme?.colors?.textSecondary} style={{ marginBottom: "4px" }}>Campo:</TextUI>
              <SelectUI
                options={searchOptions}
                value={searchOptions.find(opt => opt.value === searchField)}
                onChange={(opt) => setSearchField(opt.value)}
                placeholder="Seleccionar..."
              />
            </div>
            {empresasOptions.length > 0 && (
              <div style={{ width: "240px" }}>
                <TextUI size="13px" weight="600" color={theme?.colors?.textSecondary} style={{ marginBottom: "4px" }}>Empresa:</TextUI>
                <SelectUI
                  options={empresasOptions}
                  value={selectedEmpresa}
                  onChange={(opt) => setSelectedEmpresa(opt)}
                  placeholder="Seleccionar empresa..."
                  isSearchable={true}
                />
              </div>
            )}
          </ContainerUI>

          <div style={{ 
            flex: 1, 
            overflow: "hidden", 
            border: `1px solid ${theme?.colors?.border || "#dee2e6"}`, 
            borderRadius: "8px",
            position: "relative",
            display: "flex",
            flexDirection: "column"
          }}>
            {loading ? (
              <div style={{ 
                display: "flex", 
                flex: 1, 
                alignItems: "center", 
                justifyContent: "center",
                flexDirection: "column",
                gap: "15px",
                background: theme.name === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
                backdropFilter: "blur(4px)"
              }}>
                <LoaderUI 
                  text="Cargando catálogo de productos..." 
                  size="50px" 
                  primaryColor={theme?.colors?.primary} 
                />
              </div>
            ) : (
              <TablaInfoUI
                data={productosFiltrados}
                columns={modalColumns}
                defaultFilters={[]}
                includeModal={false}
                showFilters={false}
                selectionMode="multiple"
                selectedItems={selectedProductos}
                onSelectionChange={setSelectedProductos}
                uniqueKey="codigoItem"
              />
            )}
          </div>

          <ContainerUI justifyContent="center">
            <TextUI size="13px" color={theme?.colors?.textSecondary}>
              Doble clic sobre una fila para marcar/desmarcar producto
            </TextUI>
          </ContainerUI>
        </ContainerUI>
      </ModalUI>
    </ContainerUI>
  );
};
