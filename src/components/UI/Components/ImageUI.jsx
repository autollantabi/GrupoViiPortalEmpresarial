import React from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";

const StyledImage = styled.img`
  display: flex;
  border-radius: 8px;
  object-fit: ${({ $objectFit }) => $objectFit || "cover"};
  transition: all 0.3s ease;
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
  
  &:hover {
    ${({ onClick, theme }) =>
      onClick &&
      `
      opacity: 0.9;
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `}
  }
`;

export const ImageUI = ({
  src,
  alt = "Image",
  width = "100%",
  height = "auto",
  objectFit = "cover",
  style = {},
  placeholder = "https://placehold.co/600x400?text=No+Image",
  lazy = true,
  onClick,
  className,
}) => {
  const { theme } = useTheme();

  const handleError = (e) => {
    if (e.target.src !== placeholder) {
      e.target.src = placeholder;
    }
  };

  return (
    <StyledImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      $objectFit={objectFit}
      loading={lazy ? "lazy" : "eager"}
      onError={handleError}
      onClick={onClick}
      className={className}
      theme={theme}
    />
  );
};

export default ImageUI;

