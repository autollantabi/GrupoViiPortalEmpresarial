import styled from "styled-components";

export const LoaderC = styled.div`
  border: 14px solid #f3f3f3; /* Light grey */
  border-top: 14px solid var(--primary); /* Blue */
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const LoaderRueda = styled.div`
  border: 5px solid #f3f3f3; /* Light grey */
  border-top: 5px solid var(--primary); /* Blue */
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;