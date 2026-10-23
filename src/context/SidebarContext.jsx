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
      isHidden: false,
      setIsHidden: () => {}
    };
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  const [isHidden, setIsHiddenState] = useState(() => {
    try {
      return localStorage.getItem("sidebarHidden") === "true";
    } catch {
      return false;
    }
  });

  const setIsHidden = (value) => {
    setIsHiddenState(value);
    try {
      localStorage.setItem("sidebarHidden", String(value));
    } catch {
      // sin persistencia
    }
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isRightExpanded, setIsRightExpanded, isHidden, setIsHidden }}>
      {children}
    </SidebarContext.Provider>
  );
};

