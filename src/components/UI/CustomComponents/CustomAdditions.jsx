import React from "react";
import styled from "styled-components";
import { CustomText } from "./CustomComponents";

// 🎨 Estilos del Separador
const SeparatorContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 5px 0;
`;

const Line = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${(props) => props.color || "#ccc"};
  border-top: ${(props) =>
    `1px ${props.style || "solid"} ${props.color || "#ccc"}`};
`;

// 🎯 Componente CustomSeparator
export const CustomSeparator = ({ style, color, width, text }) => {
  return (
    <SeparatorContainer style={{ width: width || "100%" }}>
      <Line color={color} style={style} />
      {text && <CustomText color={color}>{text}</CustomText>}
      <Line color={color} style={style} />
    </SeparatorContainer>
  );
};
