import React from "react";
import styled from "styled-components";
import { PsRecovery } from "components/UI/Componentes/RecoveryPassword/PsRecovery";

const Contenedor1 = styled.div`
  height: 100vh;
  width: 100%;
  background-color: var(--primary);
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default function PasswordRecovery() {
  return (
    <Contenedor1>
      <PsRecovery />
    </Contenedor1>
  );
}
