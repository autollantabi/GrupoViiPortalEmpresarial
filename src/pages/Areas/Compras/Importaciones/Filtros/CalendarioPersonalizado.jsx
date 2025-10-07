import React, { useEffect, useState } from "react";
import styled from "styled-components";

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
  &:hover {
    background-color: ${({ $isSelected }) =>
      $isSelected ? "var(--secondary)" : "lightgray"};
  }
  background-color: ${({ $isSelected }) =>
    $isSelected ? "var(--secondary)" : "white"};
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.white : "black"};
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 5px;
`;

const Button = styled.button`
  cursor: pointer;
  border: solid 1px #cfcfcf;
  border-radius: 5px;
  color: var(--secondary);
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
  const [selectedDate, setSelectedDate] = useState(selectedDateP);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [editYear, setEditYear] = useState(currentYear);
  const days = getDaysInMonth(currentYear, currentMonth);
  // console.log(minDate);

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
      // console.log("kkak");
      // console.log("min: ",minDate);
      // console.log("select: ",day);
      setSelectedDate(day);
      let newDate = formatFecha(day);
      setDate(newDate);
    }
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <Button onClick={handlePrevMonth}>
          <i className="bi bi-caret-left-fill" />
        </Button>
        <div onClick={() => setIsEditingYear(true)}>
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
              <input
                style={{
                  width: "75px",
                  outline: "none",
                  border: "solid 1px gray",
                  padding: " 2px 5px",
                }}
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
        </div>
        <Button onClick={handleNextMonth}>
          <i className="bi bi-caret-right-fill" />
        </Button>
      </CalendarHeader>
      <DaysContainer>
        {days.map((day, index) => (
          <Day
            key={index}
            $isSelected={
              selectedDate &&
              selectedDate.getDate() === day.getDate() &&
              selectedDate.getMonth() === day.getMonth() &&
              selectedDate.getFullYear() === day.getFullYear()
            }
            onClick={() => handleDate(day)}
            style={{
              cursor: !minDate || day >= minDate ? "pointer" : "not-allowed",
              color: minDate && day < minDate ? "#ccc" : "",
              backgroundColor: minDate && day < minDate ? "#f0f0f0" : "",
            }}
          >
            {day.getDate()}
          </Day>
        ))}
      </DaysContainer>
    </CalendarContainer>
  );
};
