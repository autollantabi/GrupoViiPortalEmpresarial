import React, { useState, useEffect } from "react";
import styled from "styled-components";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";
import { useSidebar } from "context/SidebarContext";
import IconUI from "components/UI/Components/IconsUI";
import { globalConst } from "config/constants";
import { postgresService } from "services/postgresService";

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
  margin-top: 10px;
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
    background-color: transparent;
  }
  .react-datepicker__day--keyboard-selected,
  .react-datepicker__month-text--keyboard-selected,
  .react-datepicker__quarter-text--keyboard-selected,
  .react-datepicker__year-text--keyboard-selected {
    background-color: transparent;
  }
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__day.feriado {
    background-color: #ee6b69ff !important;
    color: white !important;
  }
  .react-datepicker__day.festividad {
    background-color: #549dd9ff !important;
    color: white !important;
  }
  .react-datepicker__day.feriado:hover {
    background-color: #ee6b69ff !important;
  }
  .react-datepicker__day.festividad:hover {
    background-color: #549dd9ff !important;
  }
  .react-datepicker__day.today {
    background-color: green !important;
    color: white !important;
  }
  .react-datepicker__day.today:hover {
    background-color: darkgreen !important;
  }
`;

const ComunicadoInfoWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  visibility: ${(props) => (props.$isexpanded ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  padding: 10px;
  color: ${(props) => props.theme.colors.white};
  font-size: 12px;
  margin-top: 10px;
  width: 100%;
  box-sizing: border-box;

  h4 {
    margin: 0 0 5px 0;
    font-size: 13px;
  }
  p {
    margin: 0;
    line-height: 1.4;
  }
`;

const LegendWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  visibility: ${(props) => (props.$isexpanded ? "visible" : "hidden")};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
  width: 100%;
  padding: 0 10px;
  margin-top: 50px;
  display: flex;
  justify-content: center;
  gap: 15px;
  font-size: 11px;
  color: ${(props) => props.theme.colors.white};
  box-sizing: border-box;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .legend-color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
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

const Festividades = ['FESTIVIDAD', 'MADRE', 'PADRE'];

const Feriados = ['FERIADO', 'CARNAVAL', 'SANTA'];

const getEasterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

const getCarnavalDates = (year) => {
  const easter = getEasterSunday(year);
  const monday = new Date(easter);
  monday.setDate(easter.getDate() - 48);
  const tuesday = new Date(easter);
  tuesday.setDate(easter.getDate() - 47);
  return { monday, tuesday };
};

const getViernesSanto = (year) => {
  const easter = getEasterSunday(year);
  const friday = new Date(easter);
  friday.setDate(easter.getDate() - 2);
  return friday;
};

const isMothersDay = (date) => {
  if (date.getMonth() !== 4) return false;
  if (date.getDay() !== 0) return false;
  return date.getDate() >= 8 && date.getDate() <= 14;
};

const isFathersDay = (date) => {
  if (date.getMonth() !== 5) return false;
  if (date.getDay() !== 0) return false;
  return date.getDate() >= 15 && date.getDate() <= 21;
};

export default function RightSidebar() {
  const { isRightExpanded, setIsRightExpanded } = useSidebar();
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState(new Date());
  const [comunicados, setComunicados] = useState([]);

  useEffect(() => {
    postgresService.getComunicados()
      .then((res) => {
        if (res?.status === 'Ok!' && res?.data) {
          setComunicados(res.data);
        }
      })

      .catch((err) => console.error("Error fetching comunicados", err));
  }, []);

  const getComunicadosForDate = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const matched = [];
    for (const com of comunicados) {
      if (!com.DCM_TIPO) continue;
      const tipo = com.DCM_TIPO.toUpperCase();

      if (Festividades.includes(tipo)) {
        if (tipo === 'MADRE' && isMothersDay(date)) {
          matched.push(com);
        } else if (tipo === 'PADRE' && isFathersDay(date)) {
          matched.push(com);
        } else if (tipo === 'FESTIVIDAD' && com.DCM_FECHA) {
          const [yyyy, mm, dd] = com.DCM_FECHA.split('-');
          if (parseInt(mm, 10) - 1 === month && parseInt(dd, 10) === day) {
            matched.push(com);
          }
        }
      }

      if (Feriados.includes(tipo)) {
        if (tipo === 'CARNAVAL') {
          const { monday, tuesday } = getCarnavalDates(year);
          if ((month === monday.getMonth() && day === monday.getDate()) ||
            (month === tuesday.getMonth() && day === tuesday.getDate())) {
            matched.push(com);
          }
        } else if (tipo === 'SANTA') {
          const viernes = getViernesSanto(year);
          if (month === viernes.getMonth() && day === viernes.getDate()) {
            matched.push(com);
          }
        } else if (tipo === 'FERIADO' && com.DCM_FECHA) {
          const [yyyy, mm, dd] = com.DCM_FECHA.split('-');
          if (parseInt(mm, 10) - 1 === month && parseInt(dd, 10) === day) {
            matched.push(com);
          }
        }
      }
    }
    return matched;
  };

  const getDayClassName = (date) => {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) return "today";

    const matched = getComunicadosForDate(date);
    if (matched.length === 0) return null;

    const hasFeriado = matched.some(com => Feriados.includes(com.DCM_TIPO?.toUpperCase()));
    if (hasFeriado) return "feriado";

    const hasFestividad = matched.some(com => Festividades.includes(com.DCM_TIPO?.toUpperCase()));
    if (hasFestividad) return "festividad";

    return null;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!isRightExpanded) {
      setStartDate(new Date());
      setResetKey(prev => prev + 1);
    }
  }, [isRightExpanded]);

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

        <LegendWrapper $isexpanded={isRightExpanded}>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'green' }} /> Hoy
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#42a5f5' }} /> Festividad
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef5350' }} /> Feriado
          </div>
        </LegendWrapper>

        <CalendarWrapper $isexpanded={isRightExpanded}>
          <DatePicker
            key={resetKey}
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            onMonthChange={(date) => setCurrentMonth(date)}
            inline
            dayClassName={getDayClassName}
          />
        </CalendarWrapper>

        <ComunicadoInfoWrapper $isexpanded={isRightExpanded}>
          {getComunicadosForDate(startDate).map((com, idx) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(startDate);
            selectedDate.setHours(0, 0, 0, 0);
            const showMessage = selectedDate <= today;

            return (
              <div key={idx} style={{ marginBottom: "10px" }}>
                <h4 style={{ color: Feriados.includes(com.DCM_TIPO?.toUpperCase()) ? '#ef5350' : '#42a5f5' }}>
                  {com.DCM_MOTIVO}
                </h4>
                <p>
                  {showMessage && com.DCM_MENSAJE && com.DCM_MENSAJE.split(/(?:\\n|\n)/).map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            );
          })}
        </ComunicadoInfoWrapper>
      </ContenedorMenuRight>
    </RightSidebarContainer>
  );
}
