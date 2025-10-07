import styled from "styled-components";

export const SectionImportacionesContainer = styled.div`
  width: 100%;
`;

export const SectionImportacionesTitle = styled.h5`
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 10px;
`;

export const FormImportacionesGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  gap: 10px 10px;
  align-items: start;
  width: fit-content;
  padding: 20px 5px 150px 5px;

  .fila {
    display: contents;
  }
`;
