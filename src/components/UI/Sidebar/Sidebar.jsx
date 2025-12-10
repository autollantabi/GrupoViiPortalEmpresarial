import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

import { getSidebarItems } from "router/SimpleRouter";
import { hexToRGBA } from "utils/colors";
import { globalConst } from "config/constants";
import { useAuthContext } from "context/authContext";
import { CustomContainer } from "../CustomComponents/CustomComponents";
import { CustomSeparator } from "../CustomComponents/CustomAdditions";
import ToggleThemeButton from "../ToggleThemeButton";
import { useTheme } from "context/ThemeContext";

const SidebarContainer = styled.div`
  width: auto;
  min-width: 40px;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  height: 100%;
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
  gap: 10px;
  height: 37px;
  width: ${(props) =>
    props.$isexpanded ? `calc(216px - ${props.$level * 10}px)` : "37px"};
  cursor: pointer;
  user-select: none;
  border-radius: 5px;
  text-decoration: none;
  background-color: ${(props) =>
    props.$isopen
      ? hexToRGBA({ hex: props.theme.colors.white, alpha: 0.2 })
      : "transparent"};
  flex-grow: 1;
  flex-shrink: 0;
  transition: background-color 0.3s ease-in-out, width 0.4s ease-in-out;

  margin-top: ${(props) =>
    props.$level ? 5 : 0}px; /* Padding incremental por nivel */

  border: solid 1px
    ${(props) => hexToRGBA({ hex: `${props.theme.colors.white}`, alpha: 0.2 })};

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
  transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
  color: ${(props) => props.theme.colors.white};
  flex: 1;
`;

const ContenedorMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$isexpanded", "$height"].includes(prop),
})`
  width: ${(props) => (props.$isexpanded ? "220px" : "40px")};
  height: ${(props) => props.$height};
  background-color: ${(props) => props.theme.colors.primary};
  margin: 0px;
  padding: 2px;
  gap: 5px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;

  left: 0;
  position: fixed;
  transition: width 0.4s ease-in-out, align-items 0.4s ease-in-out;
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
    <div>
      <MenuItemContainer
        onClick={item.path ? handleNavigation : handleToggle} // Usar handleNavigation si hay path
        $isopen={isOpen}
        $isexpanded={isexpanded}
        $level={level} // Nivel de anidación
      >
        <Icon className={item.icon}></Icon>
        {isexpanded && <Title $isexpanded={isexpanded}>{item.title}</Title>}
      </MenuItemContainer>

      {item.children && isOpen && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          {item.children.map((child, index) => (
            <MenuItem
              key={index}
              item={child}
              isexpanded={isexpanded}
              level={level + 1} // Incrementar el nivel para los submenús
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuSecondary = ({ item, isexpanded }) => {
  const navigate = useNavigate(); // 🔹 Agregar useNavigate aquí

  const handleNavigation = () => {
    if (item.path) {
      navigate(item.path);
    } else if (item.onClick) {
      item.onClick(); // Ejecutar la función si está definida
    }
  };
  return (
    <div style={{ padding: 0 }}>
      <MenuItemContainer
        onClick={handleNavigation}
        $isopen={false}
        $level={0}
        $isexpanded={isexpanded}
      >
        <Icon className={item.icon}></Icon>
        {isexpanded && <Title $isexpanded={isexpanded}>{item.title}</Title>}
      </MenuItemContainer>
    </div>
  );
};

const Sidebar = () => {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState(new Set());
  // Obtener items del sidebar desde la configuración centralizada
  const menuItems = getSidebarItems();

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
      icon: "bi bi-box-arrow-left",
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
      <ContenedorMenu
        $isexpanded={isExpanded}
        $height={`calc(100vh - ${globalConst.alturaHeader} + 3px)`}
      >
        <CustomContainer
          flexDirection="column"
          justifyContent="flex-start"
          width="100%"
          style={{
            gap: "5px",
          }}
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
        </CustomContainer>
        <CustomContainer
          flexDirection="column"
          justifyContent="flex-start"
          width="100%"
          style={{
            gap: "5px",
            paddingBottom: "10px",
            height: "auto",
          }}
        >
          <CustomSeparator color={hexToRGBA({ hex: "#fff", alpha: 0.2 })} />
          <MenuSecondary
            isexpanded={isExpanded}
            item={itemsSecondary.cierre_sesion}
          />
          {/* <ToggleThemeButton /> */}
        </CustomContainer>
      </ContenedorMenu>
    </SidebarContainer>
  );
};

export default Sidebar;
