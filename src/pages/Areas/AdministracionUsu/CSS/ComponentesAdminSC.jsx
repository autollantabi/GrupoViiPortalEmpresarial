import styled from "styled-components";

export const Contenedor1 = styled.div`
  display: flex;
  justify-content: center;
  align-items: start;
  padding: 10px;
`;

export const ContenedorFlex = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
`;

export const ContenedorFlexColumn = styled(ContenedorFlex)`
  flex-direction: column;
`;
export const ContenedorFlexRow = styled(ContenedorFlex)`
  flex-direction: row;
`;

export const ContenedorGrid = styled.div`
  display: grid;
  width: max-content;
  grid-template-columns: ${({ columns }) =>
    `repeat(${columns}, auto) `}; // Si hay más de 2 columnas, se utiliza el valor por defecto
  grid-template-rows: ${({ rows }) => `repeat(${rows}, auto)`};
  gap: ${({ gap }) => gap || "5px"};
  place-items: center;
  // Asegura que el texto se ajuste dentro de la celda
`;

export const ContenedorGridCelda = styled.div`
  width: ${({ max }) => max || "150px"};
  overflow-wrap: break-word; // Rompe la palabra si es muy larga
  word-wrap: break-word; // Compatibilidad con versiones anteriores
  overflow: hidden; // Oculta el desbordamiento si lo hubiera
  text-overflow: ellipsis; // Muestra "..." si el texto es demasiado largo y no cabe en una línea
  white-space: normal; // Permite que el texto se ajuste a múltiples líneas
`;

export const SelectStyled = styled.select`
  padding: 3px 6px;
  border-radius: 5px;
  border: solid 1px gray;
  outline: none;
`;

export const InputStyled = styled.input`
  width: ${({ maxw }) => maxw || "200px"};
  padding: 2px 6px;
  border-radius: 5px;
  border: solid 1px gray;
  outline: none;
`;

export const IconoGeneral = styled.i`
  padding: 4px;
  cursor: pointer;
  border-radius: 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.12);
  }
`;
