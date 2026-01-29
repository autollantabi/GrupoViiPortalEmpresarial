import React from "react";
import * as XLSX from "xlsx";
import { ButtonUI } from "./ButtonUI";

//Codigo para poder exportar la tabla que hay en pantalla a excel
export const ExportToExcelUI = ({
  data = [],
  filename,
  columnasOcultas = [],
  nombresPersonalizados = {},
  filaFinal = [],
  habilitarBoton,
}) => {
  const cabeceras =
    data.length > 0 ? Object.keys(data[0]) : Object.keys(nombresPersonalizados);

  const columnasMostradas = columnasOcultas.length
    ? cabeceras.filter((columna) => !columnasOcultas.includes(columna))
    : cabeceras;

  const handleExport = () => {
    // Obtener los datos que se van a exportar
    const dataToExport = data.map((fila) =>
      Object.fromEntries(
        Object.entries(fila).filter(([columna]) =>
          columnasMostradas.includes(columna)
        )
      )
    );
    const finalRow = filaFinal.map((fila) =>
      Object.fromEntries(
        Object.entries(fila).filter(([columna]) =>
          columnasMostradas.includes(columna)
        )
      )
    );

    const dataToExportConFinal = dataToExport.concat(finalRow);

    const dataToExportConFinalConNombres = dataToExportConFinal.map((fila) =>
      Object.fromEntries(
        Object.entries(fila).map(([columna, valor]) => [
          nombresPersonalizados[columna] || columna,
          valor,
        ])
      )
    );

    const worksheet = XLSX.utils.json_to_sheet(dataToExportConFinalConNombres);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "FiltradoPagina");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <ButtonUI
      onClick={handleExport}
      title="Exportar Excel"
      disabled={habilitarBoton}
      iconLeft={"FaFileExcel"}      
      style={{ fontSize: "20px", padding:"5px 10px" }}
    />
  );
};
