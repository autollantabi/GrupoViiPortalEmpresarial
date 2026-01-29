import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { getSidebarItems } from "router/SimpleRouter";
import { hexToRGBA } from "utils/colors";
import { globalConst } from "config/constants";
import { useAuthContext } from "context/authContext";
import { useTheme } from "context/ThemeContext";
import { useSidebar } from "context/SidebarContext";
import { SeparatorUI } from "components/UI/Components/SeparatorUI";
import ToggleThemeButtonUI from "components/UI/Components/ToggleThemeButtonUI";
import IconUI from "components/UI/Components/IconsUI";

const SidebarContainer = styled.div`
  position: fixed;
  width: auto;
  min-width: 40px;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 1000;
`;

const MenuItemContainer = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    !["$isopen", "$isexpanded", "$level"].includes(prop),
})`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
  gap: 8px;
  height: 37px;
  width: ${(props) => {
    if (!props.$isexpanded) return "37px";
    if (props.$level === 0) return "100%";
    // Para niveles anidados, calcular el ancho restante después del margin
    const marginLeft = props.$level * 16;
    return `calc(100% - ${marginLeft}px)`;
  }};
  max-width: 100%;
  cursor: pointer;
  user-select: none;
  border-radius: 5px;
  text-decoration: none;
  background-color: ${(props) =>
    props.$isopen
      ? hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })
      : "transparent"};
  flex-shrink: 1;
  min-width: 0;
  box-sizing: border-box;
  transition: background-color 0.3s ease-in-out, width 0.4s ease-in-out, margin-left 0.3s ease-in-out;
  position: relative;
  margin-left: ${(props) => {
    if (!props.$isexpanded || props.$level === 0) return "0";
    return `${props.$level * 16}px`;
  }};
  margin-right: 0;

  margin-top: ${(props) =>
    props.$level ? 3 : 0}px; /* Espaciado superior por nivel */
  margin-bottom: ${(props) =>
    props.$level ? 3 : 0}px; /* Espaciado inferior por nivel */

  /* Línea vertical para mostrar jerarquía en niveles anidados */
  ${(props) => props.$level > 0 && props.$isexpanded ? `
    &::before {
      content: "";
      position: absolute;
      left: -2px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: ${hexToRGBA({ hex: props.theme.colors.white, alpha: 0.15 })};
      border-radius: 1px;
      z-index: 1;
    }
  ` : ""}

  &:hover {
    background-color: ${(props) =>
      hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })};
  }
`;

const Icon = styled.div`
  color: ${(props) => props.theme.colors.white};
  font-size: 15px;
  transition: transform 0.3s ease-in-out;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex: 0 0 auto;
`;

const Title = styled.span.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  white-space: nowrap;
  text-align: left;
  font-size: 15px;
  opacity: ${(props) => (props.$isexpanded ? 1 : 0)};
  max-width: ${(props) => (props.$isexpanded ? "100%" : "0")};
  overflow: hidden;
  text-overflow: ellipsis;
  transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
  color: ${(props) => props.theme.colors.white};
  flex: 1;
  min-width: 0;
`;

const ContenedorMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded"].includes(prop),
})`
  width: ${(props) => (props.$isexpanded ? "220px" : "40px")};
  height: 100vh;
  background: ${(props) => props.theme.colors.sidebarBackground || props.theme.colors.secondary};
  margin: 0px;
  padding: 2px;
  gap: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  transition: width 0.4s ease-in-out, align-items 0.4s ease-in-out;
  position: relative;
`;

const ContenedorFlex = styled.div`
  display: flex;
  flex-direction: ${(props) => props.$flexDirection || "column"};
  justify-content: ${(props) => props.$justifyContent || "flex-start"};
  align-items: ${(props) => props.$alignItems || "flex-start"};
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "auto"};
  gap: ${(props) => props.$gap || "0"};
  padding: ${(props) => props.$padding || "0"};
`;

const MenuItem = ({
  item,
  isexpanded,
  level = 0,
  activeMenu,
  setActiveMenu,
}) => {
  // const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Hook para navegación manual
  const { theme } = useTheme();
  const isOpen = activeMenu.has(item.title);

  // useEffect(() => {
  //   if (!isexpanded) setIsOpen(false);
  // }, [isexpanded]);

  const handleToggle = (e) => {
    e.stopPropagation();
    const newOpenMenus = new Set(activeMenu);

    if (level === 0) {
      // 🔹 Si es nivel `0`, cerrar cualquier otro menú principal antes de abrir uno nuevo
      if (isOpen) {
        newOpenMenus.delete(item.title);
      } else {
        // 🔹 Si no está abierto, cerramos los demás y abrimos este
        newOpenMenus.clear();
        newOpenMenus.add(item.title);
      }
    } else {
      // 🔹 Si es un submenú, solo abrir/cerrar sin afectar otros
      if (newOpenMenus.has(item.title)) {
        newOpenMenus.delete(item.title);
      } else {
        newOpenMenus.add(item.title);
      }
    }

    setActiveMenu(newOpenMenus);
  };

  const handleNavigation = () => {
    if (item.path) {
      navigate(item.path); // Navegación manual usando useNavigate
      setActiveMenu(new Set());
    }
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <MenuItemContainer
        onClick={item.path ? handleNavigation : handleToggle} // Usar handleNavigation si hay path
        $isopen={isOpen}
        $isexpanded={isexpanded}
        $level={level} // Nivel de anidación
      >
        <IconUI name={item?.icon || ""} color={theme.colors.white}/>
        {isexpanded && <Title $isexpanded={isexpanded}>{item.title}</Title>}
      </MenuItemContainer>
      {level === 0 && (
        <div style={{ 
          width: "100%",
          padding: "0px 20px",
          opacity: isexpanded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          boxSizing: "border-box"
        }}>
          <SeparatorUI
            color={hexToRGBA({ hex: theme.colors.white, alpha: 0.1 })}
            style={{ 
              margin: "0",
              width: "100%"
            }}
          />
        </div>
      )}

      {item.children && isOpen && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            boxSizing: "border-box",
          }}
        >
          {item.children.map((child, index) => (
            <React.Fragment key={index}>
              <MenuItem
                item={child}
                isexpanded={isexpanded}
                level={level + 1} // Incrementar el nivel para los submenús
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
              {isexpanded && index < item.children.length - 1 && (
                <div style={{ 
                  width: "100%",
                  padding: "0px 20px",
                  opacity: isexpanded ? 1 : 0,
                  transition: "opacity 0.3s ease-in-out",
                  boxSizing: "border-box"
                }}>
                  <SeparatorUI
                    color={hexToRGBA({ hex: theme.colors.white, alpha: 0.1 })}
                    style={{ 
                      margin: "0",
                      width: "100%"
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuSecondary = ({ item, isexpanded }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleNavigation = () => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick(); // Ejecutar la función si está definida
    }
  };
  return (
    <div style={{ width: "100%" }}>
      <MenuItemContainer
        onClick={handleNavigation}
        $isopen={false}
        $level={0}
        $isexpanded={isexpanded}
      >
        <IconUI name={item?.icon || ""} color={theme.colors.white}/>
        {isexpanded && <Title $isexpanded={isexpanded}>{item.title}</Title>}
      </MenuItemContainer>
      <SeparatorUI
        color={hexToRGBA({ hex: theme.colors.white, alpha: 0.1 })}
        style={{ 
          margin: "2px 0",
          opacity: isexpanded ? 1 : 0,
          transition: "opacity 0.3s ease-in-out"
        }}
      />
    </div>
  );
};

const Sidebar = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isExpanded, setIsExpanded } = useSidebar();

  const [activeMenu, setActiveMenu] = useState(new Set());
  // Obtener items del sidebar desde la configuración centralizada
  const { user } = useAuthContext();
  const userContexts = user?.data || [];
  const menuItems = getSidebarItems(userContexts);

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleCerrarSesion = () => {
    logout(navigate);
  };

  const itemsSecondary = {
    cierre_sesion: {
      icon: "FaDoorOpen",
      title: "Cerrar Sesión",
      onClick: handleCerrarSesion,
    },
  };
  useEffect(() => {
    if (!isExpanded) {
      setActiveMenu(new Set());
    }
  }, [isExpanded]);

  return (
    <SidebarContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ContenedorMenu $isexpanded={isExpanded}>
        <ContenedorFlex
          $flexDirection="column"
          $justifyContent="flex-start"
          $width="100%"
          $gap="5px"
        >
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              item={item}
              isexpanded={isExpanded}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
          ))}
        </ContenedorFlex>
        <ContenedorFlex
          $flexDirection="column"
          $justifyContent="flex-start"
          $width="100%"
          $gap="5px"
          $padding="0 0 10px 0"
        >
          <SeparatorUI
            color={hexToRGBA({ hex: theme.colors.white, alpha: 0.2 })}
          />
          <ToggleThemeButtonUI isexpanded={isExpanded} />
          <MenuSecondary
            isexpanded={isExpanded}
            item={itemsSecondary.cierre_sesion}
          />
        </ContenedorFlex>
      </ContenedorMenu>
    </SidebarContainer>
  );
};

export default Sidebar;
