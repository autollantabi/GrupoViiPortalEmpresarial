import styled from "styled-components";

export const InputText = styled.input`
  padding: 4px 4px;
  width: ${(props) => (props.largo !== "" ? props.largo : "120px")};
  /* width: 120px; */
  border: none;
  outline: none;
  background-color: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(191, 191, 191, 0.65);
  transition: all 0.2s ease;
  text-align: left;

  &:focus {
    border-bottom: 1px solid rgba(0, 0, 0, 0.5);
    background-color: rgba(0, 0, 0, 0.08);
  }
`;

export const StyledInputDate = styled.input`
  padding: 0.5em;
  font-size: 16px;
`;
