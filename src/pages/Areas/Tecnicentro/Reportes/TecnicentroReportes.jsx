import React, { useState } from "react";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { useTheme } from "context/ThemeContext";

export const TecnicentroReportes = () => {
  const { theme } = useTheme();

  // Estados
  const [reporteActivo, setReporteActivo] = useState(0);

  // Reportes disponibles
  const reportes = [
    {
      id: 0,
      tituloBtn: "Stock y Precios",
      titulo: "Stock y Precios - Tecnicentro",
      url: "https://app.powerbi.com/view?r=eyJrIjoiYTE2Mzc4MDMtMGE3ZS00NTFjLTk1ZjAtOGU1NTk5ZDIxODVkIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSection5ee1a0f34007764061eb",
    },
  ];

  // Obtener el reporte seleccionado
  const getReporteSeleccionado = () => {
    return reportes.find((reporte) => reporte.id === reporteActivo);
  };

  return (
    <ContainerUI
      flexDirection="column"
      height="100%"
      width="100%"
      style={{ padding: 0 }}
    >
      {/* Botones de selección de reportes */}
      <ContainerUI
        style={{ gap: "10px", padding: "10px", flexWrap: "wrap" }}
      >
        {reportes.map((reporte) => (
          <ButtonUI
            key={reporte.id}
            text={reporte.tituloBtn}
            onClick={() => setReporteActivo(reporte.id)}
            variant={reporteActivo === reporte.id ? "contained" : "outlined"}
            pcolor={theme.colors.primary}
          />
        ))}
      </ContainerUI>

      {/* Mostrar el iframe con el reporte seleccionado */}
      {(() => {
        const reporteSeleccionado = getReporteSeleccionado();
        if (reporteSeleccionado) {
          return (
            <iframe
              key={reporteSeleccionado.id}
              title={reporteSeleccionado.titulo}
              width="100%"
              height="100%"
              src={reporteSeleccionado.url}
              allowFullScreen
            />
          );
        }
        return null;
      })()}
    </ContainerUI>
  );
};
