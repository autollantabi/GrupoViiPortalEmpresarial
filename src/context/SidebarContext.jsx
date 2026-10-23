import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { 
      isExpanded: false, 
      setIsExpanded: () => {},
      isRightExpanded: false,
      setIsRightExpanded: () => {},
      isMinimized: false,
      setIsMinimized: () => {}
    };
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  const [isMinimized, setIsMinimizedState] = useState(() => {
    try {
      return localStorage.getItem("sidebarMinimized") === "true";
    } catch {
      return false;
    }
  });

  const setIsMinimized = (value) => {
    setIsMinimizedState(value);
    try {
      localStorage.setItem("sidebarMinimized", String(value));
    } catch {
      // sin persistencia
    }
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isRightExpanded, setIsRightExpanded, isMinimized, setIsMinimized }}>
      {children}
    </SidebarContext.Provider>
  );
};

