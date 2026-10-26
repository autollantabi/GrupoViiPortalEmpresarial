import React, { createContext, useContext, useState } from "react";
import { getIsMobile } from "hooks/useIsMobile";

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
  // En móvil/tablet el menú inicia abierto; en web se expande con hover
  const [isExpanded, setIsExpanded] = useState(
    getIsMobile
  );
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isRightExpanded, setIsRightExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};
