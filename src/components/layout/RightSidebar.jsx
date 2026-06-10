import React, { useState } from "react";
import styled from "styled-components";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";
import { useSidebar } from "context/SidebarContext";
import IconUI from "components/UI/Components/IconsUI";
import { globalConst } from "config/constants";

const RightSidebarContainer = styled.div`
  position: fixed;
  width: auto;
  min-width: 40px;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  height: calc(100vh - ${globalConst.alturaHeader});
  top: ${globalConst.alturaHeader};
  right: 0;
  z-index: 1000;
`;

const ContenedorMenuRight = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  width: ${(props) => (props.$isexpanded ? "250px" : "40px")};
  height: 100%;
  background: ${(props) => props.$isexpanded ? (props.theme.colors.sidebarBackground || props.theme.colors.secondary) : props.theme.colors.background};
  margin: 0px;
  padding: 2px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  transition: width 0.4s ease-in-out;
  position: relative;
  box-sizing: border-box;
`;

const CalendarWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  visibility: ${(props) => (props.$isexpanded ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  width: 100%;
  padding: 10px;
  margin-top: 50px;
  box-sizing: border-box;

  /* Estilos personalizados para el DatePicker */
  .react-datepicker {
    width: 100%;
    font-family: inherit;
    border: none;
    background: transparent;
  }
  .react-datepicker__month-container {
    float: none;
    width: 100%;
  }
  .react-datepicker__header {
    background: transparent;
    border-bottom: 1px solid ${(props) => hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })};
  }
  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: ${(props) => props.theme.colors.white};
  }
  .react-datepicker__day-name,
  .react-datepicker__day,
  .react-datepicker__time-name {
    color: ${(props) => props.theme.colors.white};
  }
  .react-datepicker__day:hover,
  .react-datepicker__month-text:hover,
  .react-datepicker__quarter-text:hover,
  .react-datepicker__year-text:hover {
    background-color: ${(props) => hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })};
  }
  .react-datepicker__day--selected,
  .react-datepicker__day--in-selecting-range,
  .react-datepicker__day--in-range,
  .react-datepicker__month-text--selected,
  .react-datepicker__month-text--in-selecting-range,
  .react-datepicker__month-text--in-range {
    background-color: ${(props) => props.theme.colors.primary};
  }
  .react-datepicker__day--keyboard-selected,
  .react-datepicker__month-text--keyboard-selected,
  .react-datepicker__quarter-text--keyboard-selected,
  .react-datepicker__year-text--keyboard-selected {
    background-color: ${(props) => hexToRGBA({ hex: props.theme.colors.primary, alpha: 0.6 })};
  }
  .react-datepicker-wrapper {
    width: 100%;
  }
`;

const ClosedIconWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  position: absolute;
  top: 15px;
  right: 12px;
  color: ${(props) => props.theme.colors.white};
  font-size: 15px;
  transition: opacity 0.3s ease-in-out;
  opacity: ${(props) => (props.$isexpanded ? 0 : 0.5)};
  pointer-events: none;
`;

const ExpandedHeaderWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  position: absolute;
  top: 15px;
  left: 15px;
  color: ${(props) => props.theme.colors.white};
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: opacity 0.3s ease-in-out;
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  pointer-events: none;
  white-space: nowrap;
`;

export default function RightSidebar() {
  const { isRightExpanded, setIsRightExpanded } = useSidebar();
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState(new Date());

  const handleMouseEnter = () => {
    setIsRightExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsRightExpanded(false);
  };

  return (
    <RightSidebarContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ContenedorMenuRight $isexpanded={isRightExpanded}>
        <ClosedIconWrapper $isexpanded={isRightExpanded}>
          <IconUI name="FaCalendarAlt" color={isRightExpanded ? theme.colors.white : theme.colors.textSecondary} />
        </ClosedIconWrapper>
        
        <ExpandedHeaderWrapper $isexpanded={isRightExpanded}>
          <IconUI name="FaCalendarAlt" color={theme.colors.white} />
          <span>Calendario</span>
        </ExpandedHeaderWrapper>

        <CalendarWrapper $isexpanded={isRightExpanded}>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            inline
          />
        </CalendarWrapper>
      </ContenedorMenuRight>
    </RightSidebarContainer>
  );
}
