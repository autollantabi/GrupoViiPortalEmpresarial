import React, { useState } from "react";
import styled from "styled-components";
import { hexToRGBA } from "utils/colors";

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: visible;
  height: fit-content;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  user-select: none;
`;

const CardHeader = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid
    ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.1 })};
  border-radius: 8px 8px 0 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition: background-color 0.2s ease;
  background-color: ${({ theme }) =>
    theme?.colors?.backgroundLight || "#f5f5f5"};

  &:hover {
    background-color: ${({ $clickable, theme }) =>
      $clickable
        ? hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.06 })
        : theme?.colors?.backgroundLight || "#f5f5f5"};
  }
`;

const ExpandIcon = styled.i`
  font-size: 14px;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#666"};
  transition: transform 0.3s ease;
  transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "rotate(0deg)")};
`;

const CardHeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CardHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
`;

const CardTitle = styled.h4`
  color: ${({ theme }) => theme?.colors?.primary || "#000"};
  margin: 0;
  font-size: 16px;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 4px 0 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme?.colors?.textSecondary || "#666"};
`;

const CardBody = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: ${({ $minHeight }) => $minHeight || "auto"};
`;

const CardFooter = styled.div`
  padding: 12px 15px;
  border-top: 1px solid
    ${({ theme }) =>
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.2 })};
  display: flex;
  border-radius: 0 0 8px 8px;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
`;

export const CardUI = ({
  title,
  description,
  body,
  footer,
  headerActions,
  onHeaderClick,
  initialOpen = true,
  style,
  backgroundColor,
  headerBackgroundColor,
  footerBackgroundColor,
  minHeight,
  theme,
}) => {
  // Estado interno para manejar la expansión
  const [expanded, setExpanded] = useState(initialOpen);

  // Determinar si la card debe ser expandible (si tiene body o footer)
  const isExpandable = !!(body || footer);

  // Manejar el click en el header
  const handleHeaderClick = () => {
    if (isExpandable) {
      setExpanded(!expanded);
      // También llamar al callback si se proporciona
      if (onHeaderClick && typeof onHeaderClick === "function") {
        onHeaderClick(!expanded);
      }
    }
  };

  const cardStyle = {
    ...style,
  };

  const headerStyle = {
    backgroundColor: headerBackgroundColor || undefined,
  };

  const footerStyle = {
    backgroundColor:
      footerBackgroundColor ||
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }),
  };

  return (
    <CardContainer style={cardStyle}>
      {(title || description || headerActions) && (
        <CardHeader
          style={headerStyle}
          $clickable={isExpandable}
          onClick={handleHeaderClick}
        >
          <CardHeaderContent>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isExpandable && (
                <ExpandIcon
                  className="bi bi-chevron-down"
                  $expanded={expanded}
                  theme={theme}
                />
              )}
              {title && <CardTitle>{title}</CardTitle>}
            </div>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeaderContent>
          {headerActions && (
            <CardHeaderActions onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </CardHeaderActions>
          )}
        </CardHeader>
      )}

      {expanded && body && <CardBody $minHeight={minHeight}>{body}</CardBody>}

      {expanded && footer && <CardFooter style={footerStyle}>{footer}</CardFooter>}
    </CardContainer>
  );
};
