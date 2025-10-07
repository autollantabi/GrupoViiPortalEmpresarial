import styled from "styled-components";

export const BotonEditar = styled.button`
  padding: 7px 10px;
  border-radius: 15px;
  border: none;
  outline: none;

  background-color: ${(props) =>
    props.variant === "e" ? "var(--primary)" : "white"};
  color: ${(props) =>
    props.variant === "e" ? "white" : "var(--primary)"};
  box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  transition: all 0.5s ease;

  &:hover {
    background-color: ${(props) => (props.variant === "e" ? "white" : "")};
    color: ${(props) => (props.variant === "e" ? "var(--primary)" : "")};
  }
`;

export const Boton = styled.button`
  padding: 8px 12px ;
  border-radius: 15px;
  border: none;
  outline: none;
  background-color: var(--primary);
  box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  transition: all 0.5s ease;
  color: white;
  height: fit-content;

  &:hover {
    box-shadow: none;
  }
`;

export const BotonExcel = styled.button`
  padding: 4px 6px;
  border-radius: 6px;
  border: none;
  outline: none;
  background-color: var(--primary);
  box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  transition: all 0.5s ease;
  color: white;
  height: fit-content;
  width: fit-content;
  cursor: pointer;

  &:hover {
    box-shadow: none;
    background-color: var(--secondary);
    transform: translateY(-5px);
  }
`;
export const BotonEliminar = styled.button`
  background-color: white;
  border: none;
  color: red;
  font-size: 16px;
  border-radius: 8px;
  padding: 2px 8px 1px;
  transition: all 0.5s ease;
  margin: 0 5px;
  &:hover {
    background-color: var(--primary);
    color: white;
  }
`;
