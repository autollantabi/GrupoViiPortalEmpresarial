import styled from "styled-components";

export const SectionImportacionesContainer = styled.div`
  width: 100%;
`;

export const SectionImportacionesTitle = styled.h5`
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${({ theme }) => theme.colors.boxShadow || "0 2px 4px rgba(0, 0, 0, 0.2)"};
  border-bottom: solid 1px ${({ theme }) => theme.colors.border || "#dee2e6"};
  color: ${({ theme }) => theme.colors.text || "#212529"};
  margin-bottom: 15px;
  padding-bottom: 10px;
`;

export const FormImportacionesGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 15px 20px;
  align-items: start;
  width: fit-content;
  padding: 20px 5px 150px 5px;

  .fila {
    display: contents;
  }
`;
