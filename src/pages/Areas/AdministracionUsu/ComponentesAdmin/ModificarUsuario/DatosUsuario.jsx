import React, { useState } from "react";
import { Modulo } from "./Modulo";
import { ContenedorFlexColumn } from "../../CSS/ComponentesAdminSC";
import { GenericTableStyled } from "components/UI/ComponentesGenericos/Tablas";
// import { Card, CardBody, CardTitle, CardText, CardGroup } from "reactstrap";
import { Accordion, Card, Button } from "react-bootstrap";

export const DatosUsuario = ({
  usuarioCORREO,
  establecerModulo,
  dataPermisosUsuario,
}) => {
  const [activeKeys, setActiveKeys] = useState([]); // Para manejar múltiples secciones activas

  // Función para alternar la expansión de una sección
  const toggleAccordion = (key) => {
    if (activeKeys.includes(key)) {
      // Si la clave ya está activa, la removemos para cerrarla
      setActiveKeys(activeKeys.filter((k) => k !== key));
    } else {
      // Si la clave no está activa, la agregamos para expandirla
      setActiveKeys([...activeKeys, key]);
    }
  };

  // Función recursiva para renderizar los módulos y submódulos
  const renderModulo = (modulo, parentKey = "") => {
    const currentKey = `${parentKey}${modulo.modulo}`; // Crear una clave única para cada sección

    return (
      <div key={currentKey} style={{ display: "flex" }}>
        <Card style={{ height: "max-content" }}>
          <Card.Header
            onClick={() => toggleAccordion(currentKey)}
            style={{ cursor: "pointer" }}
          >
            <span
              variant="link"
              // Manejar la expansión de la sección
              aria-controls={`${modulo.modulo}-collapse`}
              aria-expanded={activeKeys.includes(currentKey)} // Verificar si está expandido
            >
              {modulo.modulo}
            </span>
          </Card.Header>
          <Accordion.Collapse
            eventKey={currentKey}
            in={activeKeys.includes(currentKey)}
          >
            <Card.Body style={{ padding: "10px" }}>
              {modulo.permisos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                  }}
                >
                  <strong>Permisos:</strong>
                  <div
                    style={{
                      display: "flex",
                      gap: "5px",
                    }}
                  >
                    {modulo.permisos.map((permiso, index) => (
                      <span key={index}>
                        {permiso.empresa === "AUTOLLANTA"
                          ? "AU"
                          : permiso.empresa === "MAXXIMUNDO"
                          ? "MX"
                          : permiso.empresa === "STOX"
                          ? "ST"
                          : permiso.empresa === "IKONIX"
                          ? "IK"
                          : permiso.empresa === "AUTOMAX"
                          ? "AM"
                          : permiso.empresa}
                        ({permiso.permiso})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {modulo.children.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: "5px",
                    flexDirection: "column",
                  }}
                >
                  {modulo.children.map((child) =>
                    renderModulo(child, `${currentKey}-`)
                  )}{" "}
                  {/* Llamada recursiva para hijos */}
                </div>
              )}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </div>
    );
  };

  return (
    <ContenedorFlexColumn >
      <ContenedorFlexColumn
        style={{
          boxShadow: "0 0 7px gray",
          padding: "10px",
          borderRadius: "5px",
          width: "100%",
          gap:"10px"
        }}
      >
        <span>Usuario seleccionado: {usuarioCORREO}</span>
        <Accordion
          activeKey={activeKeys}
          style={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            maxWidth: "55vw",
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {dataPermisosUsuario.length > 0 ? (
            dataPermisosUsuario.map((modulo) => renderModulo(modulo)) // Llamar renderModulo para cada módulo raíz
          ) : (
            <Card>
              <Card.Body>No dispone de permisos.</Card.Body>
            </Card>
          )}
        </Accordion>
      </ContenedorFlexColumn>
      <Modulo setearModulo={establecerModulo} />
    </ContenedorFlexColumn>
  );
};
