import React, { useState } from "react";
import { Admin_ActualizarTransferencias } from "./Bancos/Admin_ActualizarTransferencias";
import { ListaModulos } from "./CrearModulo/CreacionSecciones";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { useTheme } from "context/ThemeContext";
import { TiposUsuario } from "./TiposUsuario/TiposUsuario";
import { GestionUsuarios } from "./GestionUsuarios/GestionUsuarios";

const EleccionAccion = (props) => {
  const [activo, setActivo] = useState(1);
  const { theme } = useTheme();

  const acciones = [
    { id: 1, label: "Gestion Usuarios" },
    { id: 2, label: "Tipos de Usuario" },
    { id: 3, label: "Creacion Secciones" },
    { id: 4, label: "Bancos" },
  ];

  const handleAccion = (id) => {
    setActivo(id);
    props.setAccion(id);
  };

  return (
    <CustomContainer flexDirection="row" width="100%" style={{ gap: "10px" }}>
      {acciones.map((accion) => (
        <CustomButton
          key={accion.id}
          text={accion.label}
          onClick={() => handleAccion(accion.id)}
          variant={activo === accion.id ? "contained" : "outlined"}
          pcolor={
            activo === accion.id ? theme.colors.secondary : theme.colors.primary
          }
        />
      ))}
    </CustomContainer>
  );
};

export const ComponenteAdministracionUsuario = () => {
  const [accion, setAccion] = useState(1);

  const componentes = {
    1: GestionUsuarios,
    2: TiposUsuario,
    3: ListaModulos,
    4: Admin_ActualizarTransferencias,
  };

  const ComponenteSeleccionado = componentes[accion];

  /*---------- Mostrar Acciones ------------*/
  const obtenerAccion = (variable) => {
    setAccion(variable);
  };

  return (
    <React.Fragment>
      <EleccionAccion setAccion={obtenerAccion} />
      <CustomContainer
        width="100%"
        height="100%"
        flexDirection="column"
        justifyContent="flex-start"
      >
        {ComponenteSeleccionado && <ComponenteSeleccionado />}
      </CustomContainer>
    </React.Fragment>
  );
};
