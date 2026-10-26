import React, { createContext, useContext, useState } from "react";
import { MOBILE_BREAKPOINT } from "hooks/useIsMobile";

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
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
  const [isRightExpanded, setIsRightExpanded] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isRightExpanded, setIsRightExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};
