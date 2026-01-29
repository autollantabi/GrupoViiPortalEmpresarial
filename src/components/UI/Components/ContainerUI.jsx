import styled from "styled-components";

const CustomDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  padding: 10px;
  margin: 0;
  width: 100%;
`;


export const ContainerUI = ({
  style,
  children,
  justifyContent = "row",
  alignItems = "center",
  flexDirection = "center",
  height = "auto",
  width = "auto",
}) => {
  return (
    <CustomDiv
      style={{
        ...style,
        justifyContent: justifyContent,
        alignItems: alignItems,
        flexDirection: flexDirection,
        height: height,
        width: width,
      }}
    >
      {children}
    </CustomDiv>
  );
};