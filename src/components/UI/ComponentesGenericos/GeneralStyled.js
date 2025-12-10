import styled from "styled-components";

export const ContenedorContenidoPagina = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* overflow-y: auto; */
`;

export const ContenedorCuerpoPagina = styled.div`
  height: 100%;
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: auto;
  background-color: transparent;
`;

export const ContenedorCuerpoPaginaHorizontal = styled.div`
  height: 100%;
  width: 100%;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  overflow-y: auto;
`;
