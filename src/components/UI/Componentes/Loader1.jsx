import React from "react";
import styled, { keyframes } from "styled-components";
import wheel from "assets/images/svg/wheel.svg";

const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(180deg);
  }
  50% {
    transform: rotate(90deg);
  }
  75% {
    transform: rotate(270deg);
  }
  100% {
    transform: rotate(0deg);
  }
`;

const LoaderCont = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
`;

const LoaderSmall = styled.div`
  position: absolute;
  width: 60%;
  height: 60%;
  inset: 0;
  margin: auto;
  background-color: var(--secondary);
  z-index: 2;
  border-radius: 10px;
  box-shadow: 0 0 4px 1px var(--box-shadow-intense);
  animation: ${rotateAnimation} 10s infinite reverse;
  display: flex;
  padding: 5px;

  img {
    object-fit: contain;
    aspect-ratio: 1;
  }
`;
const LoaderLarge = styled.div`
  position: absolute;
  inset: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  background-color: var(--color-3);
  border-radius: 15px;
  box-shadow: 0 0 8px 1px var(--box-shadow-intense);
  animation: ${rotateAnimation} 10s infinite;
`;

export const Loader1 = () => {
  return (
    <LoaderCont>
      <LoaderSmall>
        <img src={wheel} alt=".." />
      </LoaderSmall>
      <LoaderLarge />
    </LoaderCont>
  );
};
