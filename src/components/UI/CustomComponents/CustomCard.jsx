import React from "react";
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
  flex-direction: column;
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

export const CustomCard = ({
  title,
  description,
  body,
  footer,
  style,
  backgroundColor,
  headerBackgroundColor,
  footerBackgroundColor,
  minHeight,
  theme,
}) => {
  const cardStyle = {
    ...style,
  };

  const headerStyle = {
    backgroundColor:
      headerBackgroundColor ||
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.2 }),
  };

  const footerStyle = {
    backgroundColor:
      footerBackgroundColor ||
      hexToRGBA({ hex: theme?.colors?.primary || "#000", alpha: 0.05 }),
  };

  return (
    <CardContainer style={cardStyle}>
      {(title || description) && (
        <CardHeader style={headerStyle}>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      {body && <CardBody $minHeight={minHeight}>{body}</CardBody>}

      {footer && <CardFooter style={footerStyle}>{footer}</CardFooter>}
    </CardContainer>
  );
};
