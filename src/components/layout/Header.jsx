import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { getSidebarItems } from "router/SimpleRouter";
import { globalConst } from "config/constants";
import Reloj from "../UI/Components/RelojUI";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";
import { useSidebar } from "context/SidebarContext";
import { useAuthContext } from "context/authContext";
import IconUI from "components/UI/Components/IconsUI";

// 🎨 Estilos Comunes
const flexRowCenter = `
  display: flex;
  align-items: center;
`;

const EstructuraHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$sidebarExpanded"].includes(prop),
})`
  position: sticky;
  top: 0;
  width: 100%;
  height: ${globalConst.alturaHeader};
  ${flexRowCenter};
  margin-left: ${(props) => (props.$sidebarExpanded ? "220px" : "40px")};
  width: ${(props) => (props.$sidebarExpanded ? "calc(100vw - 220px)" : "calc(100vw - 40px)")};
  transition: margin-left 0.4s ease-in-out, width 0.4s ease-in-out;
  background: ${(props) => {
    const start = props.theme.colors.headerGradientStart || props.theme.colors.primary;
    const end = props.theme.colors.headerGradientEnd || props.theme.colors.secondary;
    return `linear-gradient(
      135deg,
      ${start} 15%,
      ${end} 45%,
      ${end} 76%,
      ${start} 76%
    )`;
  }};
  z-index: 3;
`;

const ContenedorHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  width: 100%;
  padding: 0 15px;
  align-items: center;
`;

const ContenedorInformacion = styled.div`
  ${flexRowCenter};
  column-gap: 10px;
  justify-content: flex-end;
`;

const ContenedorLogo = styled.div`
  ${flexRowCenter};
  column-gap: 20px;
  color: ${(props) => props.theme.colors.white};
  justify-content: flex-start;
`;

const ContenedorCentro = styled.div`
  ${flexRowCenter};
  justify-content: center;
  gap: 20px;
`;

const NombreUsuario = styled.span`
  ${flexRowCenter};
  color: ${(props) => props.theme.colors.white};
  gap: 8px;
  cursor: default;
  position: relative;
`;

const ContenedorBuscar = styled.div`
  ${flexRowCenter};
  width: 18vw;
  min-width: 250px;
  padding: 2px 8px;
  border-radius: 20px;
  background: ${(props) => {
    // En modo oscuro, usar un fondo más oscuro para el buscador
    if (props.theme.name === "dark") {
      return hexToRGBA({ hex: props.theme.colors.background || "#1a1a1a", alpha: 0.8 });
    }
    return hexToRGBA({ hex: props.theme.colors.white, alpha: 0.6 });
  }};
  position: relative;

  & > i {
    font-size: 14px;
    padding-left: 2px;
  }
`;

const InputBuscar = styled.input`
  width: 85%;
  font-size: 14px;
  outline: none;
  color: ${(props) => {
    // En modo oscuro, el texto debe ser claro para contrastar con el fondo oscuro
    if (props.theme.name === "dark") {
      return props.theme.colors.text || "#e9ecef";
    }
    return props.theme.colors.text || "#212529";
  }};
  border: none;
  background: transparent;
  
  &::placeholder {
    color: ${(props) => {
      if (props.theme.name === "dark") {
        return props.theme.colors.textSecondary || "#adb5bd";
      }
      return props.theme.colors.textSecondary || "#6c757d";
    }};
  }
`;

const Lista = styled.div`
  display: ${(props) => (props.$isvisible ? "flex" : "none")};
  flex-direction: column;
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: ${(props) => {
    // En modo oscuro, usar un fondo oscuro para el dropdown
    if (props.theme.name === "dark") {
      return props.theme.colors.backgroundCard || props.theme.colors.backgroundLight || "#2a2a2a";
    }
    return props.theme.colors.primary || "#3c3c3b";
  }};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  z-index: 2;
  animation: fadeIn 1s ease;
`;

const ElementoLista = styled.div`
  padding: 5px 10px;
  width: 100%;
  color: ${(props) => {
    // En modo oscuro, usar texto claro
    if (props.theme.name === "dark") {
      return props.theme.colors.text || "#e9ecef";
    }
    return props.theme.colors.white || "#ffffff";
  }};
  text-decoration: none;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  .shortcut {
    font-size: 10px;
    color: ${(props) => {
      if (props.theme.name === "dark") {
        return props.theme.colors.textSecondary || "#adb5bd";
      }
      return "var(--color-letra-shortcut)";
    }};
  }

  &:hover {
    background-color: ${(props) => {
      if (props.theme.name === "dark") {
        return props.theme.colors.hover || "#353535";
      }
      return "var(--color-hover-menu-sidebar)";
    }};
  }
`;

const Header = () => {
  const navigation = useNavigate();
  const { theme } = useTheme();
  const { isExpanded } = useSidebar();
  const [inputValue, setInputValue] = useState("");
  const [isListVisible, setIsListVisible] = useState(false);
  const [mostrarSubMenuUsuario, setMostrarSubMenuUsuario] = useState(false);
  const [listaPaginas, setListaPaginas] = useState([]);
  const [filteredPages, setFilteredPages] = useState(listaPaginas);
  // Lógica para cerrar sesión y eliminar el token del localStorage

  const handleNavigate = (path) => {
    navigation.navigate(path);
  };

  // Obtener user y logout del contexto
  const { user, logout, isAuthenticated } = useAuthContext();
  const userContexts = user?.data || [];
  
  // Extraer información del usuario de la nueva estructura
  const usuarioInfo = user?.USUARIO || {};
  const correoUsuario = usuarioInfo.USUA_CORREO || "";
  const nombreUsuario = usuarioInfo.USUA_NOMBRE || "Usuario";

  // 🔍 Obtención y filtrado de páginas
  const ObtenerPaginas = useCallback(() => {
    const menuItems = getSidebarItems(userContexts);
    let extractedData = [];

    const extract = (data, parentModulo = "") => {
      data.forEach(({ title, path, children }) => {
        const modulo = parentModulo ? `${parentModulo} > ${title}` : title;
        if (path) extractedData.push({ title, acortado: modulo, path });
        if (children) extract(children, modulo);
      });
    };

    extract(menuItems);
    return extractedData;
  }, [userContexts]);

  useEffect(() => {
    setFilteredPages(
      inputValue
        ? listaPaginas.filter(({ title, acortado }) =>
            `${title} ${acortado}`
              .toLowerCase()
              .includes(inputValue.toLowerCase())
          )
        : listaPaginas
    );
  }, [inputValue, listaPaginas]);

  useEffect(() => {
    setListaPaginas(ObtenerPaginas());
  }, [ObtenerPaginas]);

  const handleLogout = () => {
    logout(navigation);
    setMostrarSubMenuUsuario(false);
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  const userInitials = getInitials(nombreUsuario);

  if (!isAuthenticated || !correoUsuario) {
    return null;
  }

  return (
    <EstructuraHeader $sidebarExpanded={isExpanded}>
      <ContenedorHeader>
        <ContenedorLogo>
          <Reloj />
        </ContenedorLogo>
        <ContenedorCentro>
          <ContenedorBuscar>
            <IconUI name="FaSistrix" size={14} color={theme.colors.text} />
            <InputBuscar
              type="text"
              id="input-buscar-paginas"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsListVisible(true)}
              onBlur={() => setTimeout(() => setIsListVisible(false), 100)}
              placeholder="Buscar página..."
            />
            <Lista $isvisible={isListVisible}>
              {filteredPages.length ? (
                filteredPages.map(({ title, acortado, path }, index) => (
                  <ElementoLista
                    key={index}
                    onClick={() => handleNavigate(path)}
                  >
                    <div className="shortcut">{acortado}</div>
                    <div className="pagina">{title}</div>
                  </ElementoLista>
                ))
              ) : (
                <ElementoLista>No hay coincidencias</ElementoLista>
              )}
            </Lista>
          </ContenedorBuscar>
        </ContenedorCentro>
        <ContenedorInformacion>
          <NombreUsuario
            onClick={() => setMostrarSubMenuUsuario(!mostrarSubMenuUsuario)}
            onMouseLeave={() => setMostrarSubMenuUsuario(false)}
            style={{ position: "relative" }}
          >
            <IconUI name="FaUser" size={14} color={theme.colors.white} />
            {nombreUsuario}
            {mostrarSubMenuUsuario && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "5px",
                  backgroundColor: theme.colors.backgroundCard,
                  borderRadius: "8px",
                  boxShadow: theme.colors.boxShadow,
                  padding: "10px",
                  minWidth: "200px",
                  zIndex: 10,
                }}
                onMouseEnter={() => setMostrarSubMenuUsuario(true)}
                onMouseLeave={() => setMostrarSubMenuUsuario(false)}
              >
                <div
                  style={{
                    padding: "8px",
                    color: theme.colors.text,
                    fontSize: "14px",
                    borderBottom: `1px solid ${theme.colors.border}`,
                    marginBottom: "5px",
                  }}
                >
                  {correoUsuario}
                </div>
                <div
                  onClick={handleLogout}
                  style={{
                    padding: "8px",
                    color: theme.colors.error || "#dc3545",
                    fontSize: "14px",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = theme.colors.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                  }}
                >
                  Cerrar Sesión
                </div>
              </div>
            )}
          </NombreUsuario>
        </ContenedorInformacion>
      </ContenedorHeader>
    </EstructuraHeader>
  );
};

export default Header;
