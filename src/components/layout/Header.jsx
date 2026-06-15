import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

import { globalConst } from "config/constants";
import Reloj from "../UI/Components/RelojUI";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";
import { useSidebar } from "context/SidebarContext";
import { useAuthContext } from "context/authContext";
import IconUI from "components/UI/Components/IconsUI";
import { postgresService } from "services/postgresService";

// 🎨 Estilos Comunes
const flexRowCenter = `
  display: flex;
  align-items: center;
`;

const EstructuraHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !["$sidebarExpanded", "$rightSidebarExpanded"].includes(prop),
})`
  position: sticky;
  top: 0;
  width: 100%;
  height: ${globalConst.alturaHeader};
  ${flexRowCenter};
  margin-left: ${(props) => (props.$sidebarExpanded ? "220px" : "40px")};
  margin-right: 0px;
  margin-right: ${(props) => (props.$rightSidebarExpanded ? "250px" : "40px")};
  width: ${(props) => {
    const left = props.$sidebarExpanded ? 220 : 40;
    return `calc(100vw - ${left}px)`;
    const right = props.$rightSidebarExpanded ? 250 : 40;
    return `calc(100vw - ${left + right}px)`;
  }};
  transition: margin-left 0.4s ease-in-out, width 0.4s ease-in-out;
  transition: margin-left 0.4s ease-in-out, margin-right 0.4s ease-in-out, width 0.4s ease-in-out;
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

const marqueeAnimation = keyframes`
  0%   { transform: translate(0, 0); }
  100% { transform: translate(-100%, 0); }
`;

const ContenedorMensaje = styled.div`
  ${flexRowCenter};
  width: 18vw;
  min-width: 250px;
  padding: 5px 15px;
  border-radius: 20px;
  background: ${(props) => {
    if (props.theme.name === "dark") {
      return hexToRGBA({ hex: props.theme.colors.background || "#1a1a1a", alpha: 0.8 });
    }
    return hexToRGBA({ hex: props.theme.colors.white, alpha: 0.6 });
  }};
  color: ${(props) => {
    if (props.theme.name === "dark") {
      return props.theme.colors.text || "#e9ecef";
    }
    return props.theme.colors.text || "#212529";
  }};
  font-size: 14px;
  overflow: hidden;
  position: relative;
  justify-content: flex-start;
`;

const TextoMarquee = styled.div`
  display: inline-block;
  white-space: nowrap;
  padding-left: 100%;
  animation: ${marqueeAnimation} 20s linear infinite;
`;

const Header = () => {
  const navigation = useNavigate();
  const { theme } = useTheme();
  const { isExpanded, isRightExpanded } = useSidebar();
  const [mostrarSubMenuUsuario, setMostrarSubMenuUsuario] = useState(false);

  // Obtener user y logout del contexto
  const { user, logout, isAuthenticated } = useAuthContext();

  // Extraer información del usuario de la nueva estructura
  const usuarioInfo = user?.USUARIO || {};
  const correoUsuario = usuarioInfo.USUA_CORREO || "";
  const nombreUsuario = usuarioInfo.USUA_NOMBRE || "Usuario";

  const [mensajeCompleto, setMensajeCompleto] = useState("");

  useEffect(() => {
    const fetchComunicados = async () => {
      try {
        const response = await postgresService.getComunicados();
        if (response && response.status === "Ok!" && response.data) {
          const currentMonth = new Date().getMonth() + 1; // 1 to 12

          const comunicadoEncontrado = response.data.find(item => {
            if (item.DCM_TIPO === 'COMUNICADO' && item.DCM_FECHA) {
              const parts = item.DCM_FECHA.split('-');
              if (parts.length >= 2) {
                const month = parseInt(parts[1], 10);
                return month === currentMonth;
              }
            }
            return false;
          });

          if (comunicadoEncontrado) {
            setMensajeCompleto(`${comunicadoEncontrado.DCM_MENSAJE}   `);
          }
        }
      } catch (error) {
        console.error("Error al obtener comunicados en el Header:", error);
      }
    };

    fetchComunicados();
  }, []);

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
    <EstructuraHeader $sidebarExpanded={isExpanded} $rightSidebarExpanded={isRightExpanded}>
      <ContenedorHeader>
        <ContenedorLogo>
          <Reloj />
        </ContenedorLogo>
        <ContenedorCentro>
          {mensajeCompleto && (
            <ContenedorMensaje>
              <TextoMarquee>
                {mensajeCompleto}
              </TextoMarquee>
            </ContenedorMensaje>
          )}
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
