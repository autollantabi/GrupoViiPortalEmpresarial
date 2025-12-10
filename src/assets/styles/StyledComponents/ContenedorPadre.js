import styled from "styled-components";

export const ContenedorPadre = styled.div`
  display: flex;
  justify-content: center;
  padding: 10px;
  flex-direction: ${(props) =>
    props.direccion === "c" ? "column" : props.direccion === "r" && "row"};
  align-items: ${(props) =>
    props.alineacion !== "" ? props.alineacion : "center"};

  overflow-x: ${(props) => (props.ovx === "auto" ? props.ovx : "none")};
  overflow-y: ${(props) => (props.ovy === "auto" ? props.ovy : "none")};
`;
