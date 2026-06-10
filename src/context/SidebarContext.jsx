import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    return { 
      isExpanded: false, 
      setIsExpanded: () => {},
      isRightExpanded: false,
      setIsRightExpanded: () => {}
    };
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isRightExpanded, setIsRightExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

