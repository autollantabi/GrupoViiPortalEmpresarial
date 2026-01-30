import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";

const Wrapper = styled.span`
  position: relative;
  display: inline-flex;
`;

/* Fondo más opaco: tono más oscuro/sólido para mejor legibilidad */
const tooltipBg = ({ theme }) => theme?.colors?.text || "#1e293b";

const TooltipBubble = styled.span`
  --tooltip-bg: ${tooltipBg};
  visibility: ${({ $visible }) => ($visible ? "visible" : "hidden")};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  position: absolute;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  max-width: 280px;
  white-space: ${({ $multiline }) => ($multiline ? "normal" : "nowrap")};
  text-align: center;
  background-color: var(--tooltip-bg);
  color: ${({ theme }) => theme?.colors?.backgroundLight || "#fff"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: opacity 0.2s ease, visibility 0.2s ease;
  pointer-events: none;
  z-index: 1000;

  /* Posición según prop: top, top-left, top-right, bottom, bottom-left, bottom-right, left, right */
  ${({ $position }) => {
    const gap = 8;
    const arrowSize = 5;
    const pos = String($position || "top").toLowerCase().replace(/\s+/, "-");
    switch (pos) {
      case "top-left":
        return `
          bottom: calc(100% + ${gap}px);
          left: 0;
          &::after {
            top: 100%;
            left: 12px;
            border: ${arrowSize}px solid transparent;
            border-top-color: var(--tooltip-bg);
            border-bottom: none;
          }
        `;
      case "top-right":
        return `
          bottom: calc(100% + ${gap}px);
          right: 0;
          left: auto;
          &::after {
            top: 100%;
            right: 12px;
            left: auto;
            border: ${arrowSize}px solid transparent;
            border-top-color: var(--tooltip-bg);
            border-bottom: none;
          }
        `;
      case "top":
        return `
          bottom: calc(100% + ${gap}px);
          left: 50%;
          transform: translateX(-50%);
          &::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize}px solid transparent;
            border-top-color: var(--tooltip-bg);
            border-bottom: none;
          }
        `;
      case "bottom-left":
        return `
          top: calc(100% + ${gap}px);
          left: 0;
          &::after {
            bottom: 100%;
            left: 12px;
            border: ${arrowSize}px solid transparent;
            border-bottom-color: var(--tooltip-bg);
            border-top: none;
          }
        `;
      case "bottom-right":
        return `
          top: calc(100% + ${gap}px);
          right: 0;
          left: auto;
          &::after {
            bottom: 100%;
            right: 12px;
            left: auto;
            border: ${arrowSize}px solid transparent;
            border-bottom-color: var(--tooltip-bg);
            border-top: none;
          }
        `;
      case "bottom":
        return `
          top: calc(100% + ${gap}px);
          left: 50%;
          transform: translateX(-50%);
          &::after {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize}px solid transparent;
            border-bottom-color: var(--tooltip-bg);
            border-top: none;
          }
        `;
      case "left":
        return `
          right: calc(100% + ${gap}px);
          top: 50%;
          transform: translateY(-50%);
          &::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize}px solid transparent;
            border-right-color: var(--tooltip-bg);
            border-left: none;
          }
        `;
      case "right":
        return `
          left: calc(100% + ${gap}px);
          top: 50%;
          transform: translateY(-50%);
          &::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize}px solid transparent;
            border-left-color: var(--tooltip-bg);
            border-right: none;
          }
        `;
      default:
        return `
          bottom: calc(100% + ${gap}px);
          left: 50%;
          transform: translateX(-50%);
          &::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize}px solid transparent;
            border-top-color: var(--tooltip-bg);
            border-bottom: none;
          }
        `;
    }
  }}

  &::after {
    content: "";
    position: absolute;
    background: transparent;
  }
`;

const Trigger = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: inherit;
`;

const StyledWrapper = styled(Wrapper)``;

/**
 * Tooltip reutilizable con styled-components.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Contenido que activa el tooltip al hacer hover
 * @param {string} props.title - Texto del tooltip
 * @param {"top"|"top-left"|"top-right"|"bottom"|"bottom-left"|"bottom-right"|"left"|"right"} [props.position="top"] - Posición del tooltip (acepta "top left", "top right", etc.)
 * @param {boolean} [props.multiline=false] - Si true, permite texto en varias líneas (max-width aplicado)
 * @param {number} [props.delay=0] - Retraso en ms antes de mostrar el tooltip (0 = inmediato)
 * @param {object} [props.style] - Estilos para el wrapper
 * @param {string} [props.className] - Clase CSS para el wrapper
 */
export function TooltipUI({
  children,
  title,
  position = "top",
  multiline = false,
  delay = 0,
  style,
  className,
}) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = useCallback(() => {
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(true);
    }
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  }, []);

  if (!title) {
    return <Trigger as="span">{children}</Trigger>;
  }

  return (
    <StyledWrapper
      style={style}
      className={className}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <TooltipBubble
        theme={theme}
        $position={position}
        $multiline={multiline}
        $visible={visible}
        role="tooltip"
      >
        {title}
      </TooltipBubble>
      <Trigger>{children}</Trigger>
    </StyledWrapper>
  );
}
