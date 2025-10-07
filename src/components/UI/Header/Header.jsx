import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { getSidebarItems } from "router/SimpleRouter";
import { globalConst } from "config/constants";
import Reloj from "../Componentes/Reloj";
import { hexToRGBA } from "utils/colors";
import { useTheme } from "context/ThemeContext";

// 🎨 Estilos Comunes
const flexRowCenter = `
  display: flex;
  align-items: center;
`;

const EstructuraHeader = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  height: ${globalConst.alturaHeader};
  ${flexRowCenter};
  background: ${(props) => `linear-gradient(
    135deg,
    ${props.theme.colors.primary} 15%,
    ${props.theme.colors.secondary} 45%,
    ${props.theme.colors.secondary} 76%,
    ${props.theme.colors.primary} 76%
  )`};
  z-index: 3;
`;

const ContenedorHeader = styled.div`
  ${flexRowCenter};
  width: 100%;
  padding: 0 15px;
  justify-content: space-between;
`;

const ContenedorInformacion = styled.div`
  ${flexRowCenter};
  column-gap: 10px;
  padding-left: 100px;
`;

const ContenedorLogo = styled.div`
  ${flexRowCenter};
  column-gap: 20px;
  padding-left: 10px;
  color: ${(props) => props.theme.colors.white};
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
  background: ${(props) =>
    hexToRGBA({ hex: props.theme.colors.white, alpha: 0.6 })};
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
  color: ${(props) => props.theme.colors.textPrimary};
  border: none;
  background: transparent;
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
  background: ${(props) => props.theme.colors.primary};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  z-index: 2;
  animation: fadeIn 1s ease;
`;

const ElementoLista = styled.div`
  padding: 5px 10px;
  width: 100%;
  color: ${(props) => props.theme.colors.white};
  text-decoration: none;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  .shortcut {
    font-size: 10px;
    color: var(--color-letra-shortcut);
  }

  &:hover {
    background-color: var(--color-hover-menu-sidebar);
  }
`;

const Header = () => {
  const navigation = useNavigate();
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState("");
  const [isListVisible, setIsListVisible] = useState(false);
  const [mostrarSubMenuUsuario, setMostrarSubMenuUsuario] = useState(false);
  const [listaPaginas, setListaPaginas] = useState([]);
  const [filteredPages, setFilteredPages] = useState(listaPaginas);
  // Lógica para cerrar sesión y eliminar el token del localStorage

  const handleNavigate = (path) => {
    navigation.navigate(path);
  };

  // 🔍 Obtención y filtrado de páginas
  const ObtenerPaginas = useCallback(() => {
    const menuItems = getSidebarItems();
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
  }, []);

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

  return (
    <EstructuraHeader>
      {localStorage?.getItem("correo") ? (
        <ContenedorHeader>
          <ContenedorLogo>
            Portal Empresarial
            <ContenedorBuscar>
              <i
                className="bi bi-search"
                style={{ color: theme.colors.textPrimary }}
              />
              <InputBuscar
                type="text"
                id="input-buscar-paginas"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsListVisible(true)}
                onBlur={() => setTimeout(() => setIsListVisible(false), 100)}
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
            <Reloj />
          </ContenedorLogo>
          <ContenedorInformacion>
            <NombreUsuario
              onClick={() => setMostrarSubMenuUsuario(!mostrarSubMenuUsuario)}
              onMouseLeave={() => setMostrarSubMenuUsuario(false)}
            >
              <i className="bi bi-person-circle"></i>
              {localStorage.getItem("correo")}
            </NombreUsuario>
          </ContenedorInformacion>
        </ContenedorHeader>
      ) : (
        <></>
      )}
    </EstructuraHeader>
  );
};

export default Header;
