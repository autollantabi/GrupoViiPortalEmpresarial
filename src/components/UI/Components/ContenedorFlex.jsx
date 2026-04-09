import styled from "styled-components";

/** Contenedor flex reutilizable con soporte para props dinámicas (transient props) */
export const ContenedorFlex = styled.div`
  display: flex;
  justify-content: ${({ $justifyContent }) => $justifyContent || "center"};
  align-items: ${({ $alignItems }) => $alignItems || "center"};
  flex-direction: ${({ $flexDirection }) => $flexDirection || "row"};
  gap: ${({ $gap }) => $gap || "5px"};
  padding: ${({ $padding }) => $padding || "0"};
  width: ${({ $width }) => $width || "auto"};
`;
