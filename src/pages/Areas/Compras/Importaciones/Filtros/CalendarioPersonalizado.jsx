import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import IconUI from "components/UI/Components/IconsUI";

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  height: fit-content;
  padding: 10px;
`;

const DaysContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  padding: 5px;
`;

const Day = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  border-radius: 5px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ $isSelected, theme, $isDisabled }) =>
      $isDisabled 
        ? theme.colors.backgroundLight
        : $isSelected 
          ? theme.colors.secondary 
          : theme.colors.hover || theme.colors.backgroundLight};
  }
  
  background-color: ${({ $isSelected, theme, $isDisabled }) =>
    $isDisabled
      ? theme.colors.backgroundLight
      : $isSelected 
        ? theme.colors.secondary 
        : theme.colors.backgroundCard || theme.colors.background};
  
  color: ${({ $isSelected, theme, $isDisabled }) =>
    $isDisabled
      ? theme.colors.textDisabled || theme.colors.textSecondary
      : $isSelected 
        ? theme.colors.white 
        : theme.colors.text};
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px;
  color: ${({ theme }) => theme.colors.text};
`;

const Button = styled.button`
  cursor: pointer;
  border: solid 1px ${({ theme }) => theme.colors.border};
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.backgroundCard || theme.colors.background};
  color: ${({ theme }) => theme.colors.secondary};
  padding: 5px 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.hover || theme.colors.backgroundLight};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const YearInput = styled.input`
  width: 75px;
  outline: none;
  border: solid 1px ${({ theme }) => theme.colors.border};
  border-radius: 5px;
  padding: 2px 5px;
  background-color: ${({ theme }) => theme.colors.inputBackground || theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.text};
  
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const MonthYearDisplay = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.hover || theme.colors.backgroundLight};
  }
`;

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const CalendarioPersonalizado = ({
  setDate,
  selectedDateP,
  minDate,
}) => {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(selectedDateP);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [editYear, setEditYear] = useState(currentYear);
  const days = getDaysInMonth(currentYear, currentMonth);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
    }
  }, [selectedDate]);

  const handleYearEdit = (e) => {
    setEditYear(e.target.value);
  };
  const finishYearEdit = () => {
    setCurrentYear(parseInt(editYear, 10) || currentYear);
    setIsEditingYear(false);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  function formatFecha(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const handleDate = (day) => {
    if (!minDate || day >= minDate) {
      setSelectedDate(day);
      let newDate = formatFecha(day);
      setDate(newDate);
    }
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <Button onClick={handlePrevMonth}>
          <IconUI name="FaCaretLeft" size={14} color={theme.colors.text} />
        </Button>
        <MonthYearDisplay onClick={() => setIsEditingYear(true)}>
          {isEditingYear ? (
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {new Date(currentYear, currentMonth).toLocaleString("default", {
                month: "long",
              })}
              <YearInput
                type="number"
                value={editYear}
                onChange={handleYearEdit}
                onBlur={finishYearEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    finishYearEdit();
                    e.target.blur(); // Opcional: forzar el desenfoque del input
                  }
                }}
                autoFocus
              />
            </span>
          ) : (
            `${new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
            })} ${currentYear}`
          )}
        </MonthYearDisplay>
        <Button onClick={handleNextMonth}>
          <IconUI name="FaCaretRight" size={14} color={theme.colors.text} />
        </Button>
      </CalendarHeader>
      <DaysContainer>
        {days.map((day, index) => {
          const isDisabled = minDate && day < minDate;
          return (
            <Day
              key={index}
              $isSelected={
                selectedDate &&
                selectedDate.getDate() === day.getDate() &&
                selectedDate.getMonth() === day.getMonth() &&
                selectedDate.getFullYear() === day.getFullYear()
              }
              $isDisabled={isDisabled}
              onClick={() => handleDate(day)}
              style={{
                cursor: !isDisabled ? "pointer" : "not-allowed",
              }}
            >
              {day.getDate()}
            </Day>
          );
        })}
      </DaysContainer>
    </CalendarContainer>
  );
};
