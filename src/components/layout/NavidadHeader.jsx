import React, { useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { MOBILE_MEDIA_QUERY } from "hooks/useIsMobile";

/**
 * Decoración navideña del Header (nieve + arbolito).
 * Solo es visual: pointer-events none, no altera el layout ni la funcionalidad.
 * Para desactivarla basta con retornar false en `esTemporadaNavidena`.
 */
export const esTemporadaNavidena = (fecha = new Date()) => {
  const mes = fecha.getMonth() + 1; // 1-12
  const dia = fecha.getDate();
  return (mes === 11 && dia >= 20) || mes === 12 || (mes === 1 && dia <= 10);
};

const caer = keyframes`
  0%   { transform: translateY(-12px); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(100%); opacity: 0; }
`;

const balanceo = keyframes`
  0%, 100% { transform: translateX(-5px); }
  50%      { transform: translateX(5px); }
`;

const CapaNieve = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden; /* la nieve no se sale del header */
  pointer-events: none;
  z-index: 0;

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const Copo = styled.span`
  position: absolute;
  top: 0;
  left: var(--x);
  height: 100%;
  width: var(--s);
  animation: ${caer} var(--d) linear var(--delay) infinite;

  &::before {
    content: "";
    display: block;
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 3px rgba(255, 255, 255, 0.7);
    animation: ${balanceo} var(--sway) ease-in-out var(--delay) infinite;
  }

  /* En móvil/espacios reducidos, menos copos */
  @media ${MOBILE_MEDIA_QUERY} {
    &:nth-child(n + 16) {
      display: none;
    }
  }
`;

const TOTAL_COPOS = 48;

export const NieveHeader = () => {
  const copos = useMemo(
    () =>
      Array.from({ length: TOTAL_COPOS }, (_, i) => ({
        x: `${((i * 37) % 100) + (i % 3)}%`,
        s: `${2 + (i % 4)}px`,
        d: `${5 + ((i * 7) % 6)}s`,
        delay: `-${(i * 1.3) % 8}s`,
        sway: `${2 + (i % 3)}s`,
      })),
    []
  );

  return (
    <CapaNieve aria-hidden="true">
      {copos.map((c, i) => (
        <Copo
          key={i}
          style={{ "--x": c.x, "--s": c.s, "--d": c.d, "--delay": c.delay, "--sway": c.sway }}
        />
      ))}
    </CapaNieve>
  );
};

const brillo = keyframes`
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.35; }
`;

const ArbolSvg = styled.svg`
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));

  .luz-a { animation: ${brillo} 1.4s ease-in-out infinite; }
  .luz-b { animation: ${brillo} 1.4s ease-in-out 0.7s infinite; }

  @media (prefers-reduced-motion: reduce) {
    .luz-a, .luz-b { animation: none; }
  }
`;

export const ArbolNavidad = () => (
  <ArbolSvg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {/* estrella */}
    <polygon points="12,0.8 13.3,3.6 16.2,3.9 14,5.8 14.7,8.6 12,7.1 9.3,8.6 10,5.8 7.8,3.9 10.7,3.6" fill="#FFD93B" />
    {/* copas */}
    <polygon points="12,5 18,12 6,12" fill="#2E9E4F" />
    <polygon points="12,9 20,17.5 4,17.5" fill="#25883F" />
    <polygon points="12,13 22,21 2,21" fill="#1E7434" />
    {/* tronco */}
    <rect x="10.4" y="21" width="3.2" height="2.6" rx="0.6" fill="#8B5A2B" />
    {/* esferas */}
    <circle className="luz-a" cx="12" cy="10.5" r="1.1" fill="#FF4D4D" />
    <circle className="luz-b" cx="8.5" cy="16" r="1.2" fill="#4DA6FF" />
    <circle className="luz-a" cx="15.5" cy="16" r="1.2" fill="#FFD93B" />
    <circle className="luz-b" cx="6.2" cy="19.8" r="1.1" fill="#FF7BD5" />
    <circle className="luz-a" cx="12" cy="19" r="1.2" fill="#FF4D4D" />
    <circle className="luz-b" cx="17.8" cy="19.8" r="1.1" fill="#4DA6FF" />
  </ArbolSvg>
);
