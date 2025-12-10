import styled from "styled-components";

export const TablasOS = styled.table`
  border-collapse: collapse;
  margin: 0;

  

  thead {
    th {
      
      position: -webkit-sticky; // for safari
      position: sticky;
      top: -1px;
      left: 0;
      padding: 10px;
      z-index: 10;
      border-right: 1px solid var(--primary);
      font-size: 12px;

      &:first-child {
        z-index: 3;

      }
      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        border-bottom: solid 2px var(--primary);
        z-index: 2;
      }
    }
  }

  th,
  td {
    /* padding: 5px 8px; */
    text-transform: capitalize;
    border: none;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    font-size: 12px;
    word-break: break-all;
    max-width: 250px;

  }

  th {
    white-space: wrap;
    border-right: 1px solid rgba(0, 0, 0, 0.2);
  }

  tr {
    border: none;
    background-color: rgba(255, 255, 255, 0.6);
    /* &:nth-child(even) {
      background: rgba(255, 255, 255, 0.8);
    } */

    ${(props) =>
      props.final &&
      `
        &:last-child {
          position: sticky;
          bottom: 0px;
          background-color: #dedede;
          z-index: 3;
          width: fit-content;
          height: 10px;

          
          
        }
      `}
  }

  th,
  td {
    &:first-child {
      position: -webkit-sticky; // for safari
      position: sticky;
      left: -1px;
      font-weight: 600;
      background-color: rgba(244, 244, 244, 1);
      border-right: solid 1px black;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
      z-index: 2;
      width: fit-content;
      max-width: 160px;
      &:first-child {
        border: none;
      }
      &::before {
        content: "";
        position: absolute;
        bottom: 0;
        right: -1px; // Posicionar correctamente el borde derecho
        width: 1px; // Ancho del borde
        height: 100%;
        background: black; // Color del borde
        z-index: 3;
      }
    }
  }
  th {
    &::before {
      content: "";
      position: absolute;
      bottom: 0;
      right: -1px; // Posicionar correctamente el borde derecho
      width: 1px; // Ancho del borde
      height: 100%;
      background: black; // Color del borde
      z-index: 3;
    }
  }
  tr:hover{
    background-color: rgba(255, 255, 255, 0.6);
    cursor: default;

  }

  /* td:first-child {
    tr:nth-child(odd) & {
      background: hsl(0, 0%, 20%);
      box-shadow: inset -2px 0px rgba(black, 0.25);
    }

    tr:nth-child(even) & {
      background: hsl(0, 0%, 15%);
      box-shadow: inset -2px 0px rgba(black, 0.25);
    }
  } */
`;
