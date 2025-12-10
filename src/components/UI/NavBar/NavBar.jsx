import React from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { APP_CONFIG, MODULE_CONFIG } from "router/SimpleRouter";
import { globalConst } from "config/constants";

// Styled components
const BreadcrumbContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${globalConst.alturaMenu};
  padding: 0 20px;
  background-color: ${({ theme }) => theme.colors.background};
  user-select: none;
`;

const BreadcrumbTitle = styled.span`
  margin: 0;
  padding: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BreadcrumbSeparator = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 400;
  margin: 0 4px;
`;

// Función para generar el breadcrumb desde la ruta actual
const getBreadcrumbFromPath = (currentPath) => {
  // Buscar el item actual en APP_CONFIG
  const currentItem = APP_CONFIG.find((item) => item.path === currentPath);

  if (!currentItem) {
    return "Portal";
  }

  // Construir breadcrumb basado en la configuración
  const breadcrumbParts = [];

  // Buscar el título del módulo padre en MODULE_CONFIG
  const parentModuleConfig = MODULE_CONFIG.find(
    (mod) => mod.modulo === currentItem.seccion
  );
  if (parentModuleConfig) {
    breadcrumbParts.push(parentModuleConfig.title);
  }

  // Agregar los títulos de la hierarchy si existe
  if (currentItem.hierarchy && currentItem.hierarchy.length > 0) {
    currentItem.hierarchy.forEach((level) => {
      breadcrumbParts.push(level.title);
    });
  }

  // Agregar el título del item actual
  breadcrumbParts.push(currentItem.title);

  return breadcrumbParts;
};

const Cabecera = ({ seccion }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const breadcrumbParts = getBreadcrumbFromPath(currentPath);

  return (
    <BreadcrumbContainer>
      <BreadcrumbTitle>
        {Array.isArray(breadcrumbParts)
          ? breadcrumbParts.map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index < breadcrumbParts.length - 1 && (
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))
          : breadcrumbParts}
      </BreadcrumbTitle>
    </BreadcrumbContainer>
  );
};

export default Cabecera;
