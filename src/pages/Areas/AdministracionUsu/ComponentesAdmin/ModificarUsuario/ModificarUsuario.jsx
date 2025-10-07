import React, { useState, useEffect } from "react";
import { DatosUsuario } from "./DatosUsuario";
import {
  BloquearDesbloquearUsuario,
  ListarModulos,
  ListarPermisosUsuario,
  ListarUsuariosSistema,
} from "services/administracionService";
import {
  ContenedorFlex,
  ContenedorFlexColumn,
} from "../../CSS/ComponentesAdminSC";
import { GenericInputStyled } from "components/UI/ComponentesGenericos/Inputs";
import { GenericTableStyled } from "components/UI/ComponentesGenericos/Tablas";
import { BotonConEstadoIconos } from "components/UI/ComponentesGenericos/Botones";
import { VentanaAsignar } from "./VentanaAsignar";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";

export default function ModificarUsuario() {
  const { theme } = useTheme();
  const [mostrardatosusuario, setmostrardatosusuario] = useState(false);
  const [usuarioConsulta, setusuarioConsulta] = useState("");
  const [usuarios, setusuarios] = useState([]);
  const [busu, setbusu] = useState("");

  const [modulo, setmodulo] = useState("");
  const [idmodulo, setidmodulo] = useState("");

  const [permisosUsuario, setPermisosUsuario] = useState([]);
  //Obtener el usuario buscado
  const buscarUsuario = () => {
    const filteredData = getFilteredData(busu);
    return filteredData;
  };

  //Obtener data de los usuarios con un filtro para poder ponerlos en string a todos y en minusculas
  const getFilteredData = (valor) => {
    return usuarios.filter((user) => {
      const valuesToSearch = user.CORREO;
      return valuesToSearch.toLowerCase().includes(valor.toLowerCase());
    });
  };

  //Cada vez que escriba en el buscar Usuario debe cabiar la variable busu
  const handleChangeUsu = (texto) => {
    setbusu(texto);
  };

  async function ListarUsuarios() {
    const res = await ListarUsuariosSistema();

    setusuarios(res);
  }

  //definir que modulo se va a editar
  const establecerModulo = (item, itemid) => {
    setmodulo(item);
    setidmodulo(itemid);
  };

  //Consulta de los usuarios en el backend para listarlos
  useEffect(() => {
    ListarUsuarios();
  }, [setusuarios]);

  const obtenerPermisosDeUsuario = async () => {
    const modulos = await ListarModulos();
    const permisosUsuario = await ListarPermisosUsuario({
      idUsuario: parseInt(usuarioConsulta.IDENTIFICADOR),
    });

    // Crear un mapa de permisos basado en el IDENTIFICADOR_MODULO
    const permisosMap = permisosUsuario.reduce((acc, curr) => {
      acc[curr.IDENTIFICADOR_MODULO] = acc[curr.IDENTIFICADOR_MODULO] || [];
      acc[curr.IDENTIFICADOR_MODULO].push({
        empresa: curr.NOMBRE_EMPRESA,
        permiso: curr.PERMISO,
      });
      return acc;
    }, {});

    // Función recursiva para construir el árbol de módulos y permisos
    const buildPermissions = (modulo) => {
      const permisos = permisosMap[modulo.IDENTIFICADOR] || [];
      const children = modulos
        .filter((child) => child.PADRE === modulo.IDENTIFICADOR)
        .map(buildPermissions)
        .filter(
          (child) => child.permisos.length > 0 || child.children.length > 0
        ); // Solo mostrar hijos con permisos

      return {
        modulo: modulo.MODULO,
        permisos,
        children,
      };
    };

    // Recorrer los módulos raíz
    const modulosR = modulos
      .filter((modulo) => modulo.PADRE === 0)
      .map((modulo) => buildPermissions(modulo))
      .filter(
        (modulo) => modulo.permisos.length > 0 || modulo.children.length > 0
      ); // Solo mostrar módulos con permisos

    console.log(modulosR);

    setPermisosUsuario(modulosR);
  };

  useEffect(() => {
    obtenerPermisosDeUsuario();
  }, [usuarioConsulta.IDENTIFICADOR]);

  return (
    <CustomContainer
      height="100%"
      width="100%"
      alignItems="flex-start"
      style={{
        gap: "20px",
        position: "relative",
      }}
    >
      <ContenedorFlexColumn
        style={{
          boxShadow: "0 0 7px gray",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <ContenedorFlex>
          Buscar Usuario:
          <GenericInputStyled
            type="text"
            name="buscarusuario"
            id="buscarusuario"
            onChange={(e) => handleChangeUsu(e.target.value)}
          />
        </ContenedorFlex>
        <ContenedorFlex
          style={{
            alignItems: "flex-start",
            maxHeight: "75vh",
            overflowY: "auto",
          }}
        >
          <GenericTableStyled>
            <thead>
              <tr>
                <th colSpan="2">Usuario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {buscarUsuario().map((usuario, index) => (
                <tr key={index}>
                  <td>{usuario.CORREO}</td>
                  <td>
                    <CustomButton
                      iconLeft={"FaEdit"}
                      onClick={() => {
                        setusuarioConsulta(usuario);
                        if (usuario === usuarioConsulta) {
                          setmostrardatosusuario(false);
                          setusuarioConsulta("");
                        } else {
                          setmostrardatosusuario(true);
                        }
                      }}
                      pcolor={
                        usuarioConsulta === usuario
                          ? theme.colors.secondary
                          : theme.colors.primary
                      }
                      style={{ padding: "3px 6px" }}
                    />
                  </td>
                  <td>
                    <span
                      onClick={() =>
                        BloquearDesbloquearUsuario({
                          usuario: usuario.CORREO,
                          estado: usuario.ESTADO === "ACTIVO" ? false : true,
                          actualizar: ListarUsuarios,
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <i
                        className={
                          usuario.ESTADO === "ACTIVO"
                            ? "bi bi-circle-fill"
                            : "bi bi-circle"
                        }
                        style={{
                          color: usuario.ESTADO === "ACTIVO" ? "green" : "red",
                        }}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </GenericTableStyled>
        </ContenedorFlex>
      </ContenedorFlexColumn>
      <ContenedorFlexColumn>
        {mostrardatosusuario && (
          <DatosUsuario
            usuarioCORREO={usuarioConsulta.CORREO}
            establecerModulo={establecerModulo}
            dataPermisosUsuario={permisosUsuario}
          />
        )}
      </ContenedorFlexColumn>
      {modulo !== "" && (
        <VentanaAsignar
          idmodulo={idmodulo}
          modulo={modulo}
          usuario={usuarioConsulta.IDENTIFICADOR}
          setearmodulo={establecerModulo}
          actualizarDataUsuario={obtenerPermisosDeUsuario}
        />
      )}
    </CustomContainer>
  );
}
