import React, { useEffect, useRef, useState } from "react";
import { TablaInfoUI } from "components/UI/Components/TablaInfoUI";
import { ContenedorFlex } from "components/UI/Components/ContenedorFlex";
import IconUI from "components/UI/Components/IconsUI";
import { useTheme } from "context/ThemeContext";

const renderDataInfo = ({ text, label }) => {
  return (
    <ContenedorFlex
      style={{
        flexDirection: "column",
        gap: 0,
        justifyContent: "flex-start",
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: "12px", color: "rgba(0,0,0,0.5)" }}>
        {label}
      </span>
      <ContenedorFlex
        style={{
          padding: "2px 10px",
          border: "solid 1px rgba(0,0,0,0.2)",
          borderRadius: "5px",
          minWidth: "100px",
          justifyContent: "flex-start",
          fontSize: "14px",
        }}
      >
        {text}
      </ContenedorFlex>
    </ContenedorFlex>
  );
};

export const ModalData = ({ dataUsuario, onClose }) => {
  const { theme } = useTheme();
  const [dataPrincipal, setDataPrincipal] = useState(null);
  const [cuentasDesbloqueo, setCuentasDesbloqueo] = useState(null);
  const [sociosVinculados, setSociosVinculados] = useState(null);
  const dataUsuarioRef = useRef(null);

  const columnsConfigTables = {
    cuentasDesbloqueo: [
      { header: "ID", field: "codigo" },
      {
        header: "EMPRESA",
        field: "empresa",
        editType: "dropdown",
      },
      {
        header: "CODIGO SOCIO",
        field: "codigoSocio",
        editType: "text",
        // format: "money",
      },
    ],
    sociosVinculados: [
      { header: "ID", field: "codigo" },
      {
        header: "EMPRESA",
        field: "empresa",
        editType: "dropdown",
      },
      {
        header: "CODIGO SOCIO",
        field: "codigoSocio",
        editType: "text",
        // format: "money",
      },
      {
        header: "NOMBRE SOCIO",
        field: "nombreSocio",
        editType: "text",
      },
    ],
  };

  useEffect(() => {
    if (dataUsuario && dataUsuario !== dataUsuarioRef.current) {
      dataUsuarioRef.current = dataUsuario;
      setTimeout(() => {
        setDataPrincipal(dataUsuario);
        const resCuentasDesbloqueo = dataUsuario.cuentasDesbloqueo.map(
          (cuenta, index) => ({
            ...cuenta,
            codigo: index + 1,
          })
        );

        const resSociosVinculados = dataUsuario.sociosVinculados.map(
          (socios, index) => {
            const { CuentaSocio, ...resto } = socios;
            return {
              ...resto,
              nombreSocio: CuentaSocio.nombreSocio,
              codigo: index + 1,
            };
          }
        );

        setCuentasDesbloqueo(resCuentasDesbloqueo);
        setSociosVinculados(resSociosVinculados);
      }, 500);
    }
  }, [dataUsuario]);

  return (
    <ContenedorFlex
      style={{
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: 201,
        paddingTop: "10px",
      }}
    >
      <ContenedorFlex
        style={{
          backgroundColor: "#ffffff",
          width: "70%",
          height: "calc(95vh - var(--heigth-header))",
          borderRadius: "10px",
          position: "relative",
          justifyContent: dataPrincipal ? "flex-start" : "center",
          alignItems: dataPrincipal ? "flex-start" : "center",
          padding: "30px 40px",
        }}
      >
        <IconUI
          name="FaCircleXmark"
          size={14}
          color={theme.colors.text}
          style={{
            position: "absolute",
            top: "5px",
            right: "10px",
            color: "red",
            fontSize: "20px",
            cursor: "pointer",
          }}
          onClick={() => onClose(null)}
        />
        {dataPrincipal ? (
          <ContenedorFlex
            style={{
              flexDirection: "column",
              justifyContent: "flex-start",
              width: "100%",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <ContenedorFlex
              style={{
                gap: "35px",
                justifyContent: "flex-start",
                width: "85%",
                marginBottom: "10px",
              }}
            >
              {renderDataInfo({ text: dataPrincipal.codigo, label: "ID" })}
              {renderDataInfo({
                text: dataPrincipal.clientePorDesbloquear.empresa,
                label: "EMPRESA",
              })}
              {renderDataInfo({
                text: dataPrincipal.clientePorDesbloquear.codigo_socio,
                label: "SOCIO",
              })}
              {renderDataInfo({
                text: dataPrincipal.clientePorDesbloquear.nombre_semanal,
                label: "NOMBRE SOCIO",
              })}
            </ContenedorFlex>
            <ContenedorFlex
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                borderRadius: "10px",
                border: "solid 1px rgba(0,0,0,0.2)",
                width: "80%",
                marginBottom: "20px",
                height: "300px",
              }}
            >
              <ContenedorFlex
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  width: "100%",
                  alignItems: "center",
                  borderRadius: "8px 8px 0 0",
                  padding: "5px 10px",
                }}
              >
                <span>Cuentas a Desbloquear</span>
              </ContenedorFlex>
              <ContenedorFlex
                style={{
                  padding: "10px",
                  width: "75%",
                  maxHeight: "300px",
                  alignItems: "flex-start",
                  overflowY: "auto",
                }}
              >
                <TablaInfoUI
                  columns={columnsConfigTables.cuentasDesbloqueo}
                  data={cuentasDesbloqueo}
                  defaultFilters={["dcu_empresa"]}
                />
              </ContenedorFlex>
            </ContenedorFlex>
            <ContenedorFlex
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                borderRadius: "10px",
                border: "solid 1px rgba(0,0,0,0.2)",
                width: "80%",
                height: "300px",
              }}
            >
              <ContenedorFlex
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white",
                  width: "100%",
                  alignItems: "center",
                  borderRadius: "8px 8px 0 0",
                  padding: "5px 10px",
                }}
              >
                <span>Socios Vinculados a Desbloquear</span>
              </ContenedorFlex>
              <ContenedorFlex
                style={{
                  padding: "10px",
                  width: "75%",
                  maxHeight: "300px",
                  alignItems: "flex-start",
                  overflowY: "auto",
                }}
              >
                <TablaInfoUI
                  columns={columnsConfigTables.sociosVinculados}
                  data={sociosVinculados}
                  defaultFilters={["dcu_empresa"]}
                />
              </ContenedorFlex>
            </ContenedorFlex>
          </ContenedorFlex>
        ) : (
          <ContenedorFlex>Cargando Información ...</ContenedorFlex>
        )}
      </ContenedorFlex>
    </ContenedorFlex>
  );
};
