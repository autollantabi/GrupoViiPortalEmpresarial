import styled from "styled-components";

export const GenericTableStyled = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 5px;

  & > thead {
    position: sticky;
    top: 0;
    z-index: 1;
    th {
      user-select: none;
      background-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.white};
      font-weight: 100;
      word-wrap: break-word;
      border-right: 1px solid rgba(101, 101, 101, 0.45);
      &:first-child {
        border-top-left-radius: 5px;
      }
      &:last-child {
        border-top-right-radius: 5px;
      }
    }
  }

  & tr {
    height: 30px;
    &:last-child {
      td:first-child {
        border-bottom-left-radius: 5px;
      }
      td:last-child {
        border-bottom-right-radius: 5px;
      }
    }

    td {
      padding: 5px 10px;
      border-right: 1px solid rgba(101, 101, 101, 0.45);
      border-bottom: 1px solid rgba(101, 101, 101, 0.45);
      &:first-child {
        border-left: 1px solid rgba(101, 101, 101, 0.45);
      }
      &:last-child {
        border-right: 1px solid rgba(101, 101, 101, 0.45);
      }
    }
  }
`;
