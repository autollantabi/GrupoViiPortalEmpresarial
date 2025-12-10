import styled from "styled-components";

export const Tablas = styled.table`
  border-collapse: collapse;
  width: 100%;
  position: relative;
  table-layout: fixed;
  //user-select: none;
  margin-top: -0;

  th,
  td {
    border: 1px solid #ddd;
    padding: 4px 8px; /* Ajusta el padding según tus necesidades */
    cursor: pointer;
  }
  thead {
    th {
      position: -webkit-sticky; // for safari
      position: sticky;
      top: -0.01rem;
      left: 0;

      padding: 0x;
      ${(props) => props.tipo === "consulta" && `
      z-index: 50;
      border: none;
      `}

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        border-bottom: solid 2px var(--primary);
        z-index: 2;
      }

      ${(props) =>
        props.tipo !== "consulta" &&
        `
        &:first-child {
          z-index: 3;
        }
      `}
    }
  }
`;

export const TablaPProd = styled.table`
  border-collapse: collapse;
  width: 100%;
  position: relative;
  table-layout: fixed;
  //user-select: none;
  margin: 0;
  border: none;

  tr {
    &:first-child {
      border-top: none;
    }
  }
  td {
    padding: 4px 8px; /* Ajusta el padding según tus necesidades */
    cursor: pointer;
    &:first-child {
      border: none;
    }
  }
  thead {
    th {
      position: -webkit-sticky; // for safari
      position: sticky;
      top: 0;
      left: 0;
      background-color: var(--primary-bajo);
      color: white;
      z-index: 50 !important;

      padding: 2px;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        border-bottom: solid 1px var(--primary);
        z-index: 2;
      }
    }
  }
  tbody {
    & > * {
      border: none;
    }
  }
`;

export const ExpandableRow = styled.tr`
  overflow: hidden;
  max-height: ${(props) => (props.expanded ? "1000px" : "0")};
  transition: max-height 0.3s ease-out;
  border-bottom: solid 2px var(--primary);

  td {
    padding: 0;
    opacity: ${(props) => (props.expanded ? "1" : "0")};
    transition: opacity 0.3s ease-out;
  }
`;

export const StyledRow = styled.tr`
  background-color: ${(props) =>
    props.expanded ? "var(--primary)" : "transparent"};
  color: ${(props) => (props.expanded ? "white" : "black")};
  transition: background-color 0.3s ease-out;
  border-top: ${(props) =>
    props.expanded ? "solid 2px var(--primary)" : "none"};
  transition: color 0.3s ease, background-color 0.3s ease;

  ${(props) =>
    props.expanded &&
    `
    position: sticky;
    top: 28px;
    z-index: 100;
    `}

  &:hover {
    background-color: ${(props) =>
      props.expanded ? "var(--primary)" : "var(--primary-bajo)"};
    color: whitesmoke;
    transition: color 0.25s ease, background-color 0.3s ease;
  }
  td {
    border: ${(props) => props.expanded && "none"};
  }
`;
