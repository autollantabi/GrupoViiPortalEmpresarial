import React, { useState } from "react";

import {
  CustomContainer,
  CustomText,
} from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import {
  apiCargarArchivoTransferenciasPichincha,
  apiCargarArchivoTransferenciasBolivariano,
} from "services/cartera/cargarTransferencias";
import { toast } from "react-toastify";
import { CampoListaArchivosMejorado } from "../../../../components/UI/CustomComponents/CampoListaArchivosMejorado";
import { apiEjecutarBancos } from "services/cartera/ejecutarbancos";

export const Cartera_CargarTransferencias = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("bolivariano"); // "bolivariano", "pichincha" o "ejecutar"

  // Verificar permisos para la pestaña de ejecutar bancos
  const tienePermisosAdministracion = () => {
    const modulos = JSON.parse(localStorage.getItem("modulos") || "[]");
    return modulos.some((modulo) => modulo.modulo === "ADMINISTRACION");
  };
  // Estado para archivos de Bolivariano por empresa
  const [archivosBolivariano, setArchivosBolivariano] = useState({
    bolivarianoau: [],
    bolivarianoma: [],
  });

  // Estado para archivos de Pichincha por empresa
  const [archivosPichincha, setArchivosPichincha] = useState({
    au: [],
    ma: [],
    st: [],
    ik: [],
  });

  // Manejar archivos por empresa para Bolivariano
  const handleArchivoBolivariano = (empresaKey, files) => {
    setArchivosBolivariano((prev) => ({ ...prev, [empresaKey]: files }));
  };

  // Verificar si hay al menos un archivo cargado para Bolivariano
  const hayArchivosBolivariano = Object.values(archivosBolivariano).some(
    (archivos) => archivos && archivos.length > 0
  );

  // Subir archivos Bolivariano
  const cargarArchivosBolivariano = async () => {
    // Juntar archivos, cada uno con su nombre correspondiente

    const archivos = [];
    if (
      archivosBolivariano.bolivarianoau &&
      archivosBolivariano.bolivarianoau.length > 0
    ) {
      const archivoOriginal = archivosBolivariano.bolivarianoau[0].doc;
      const nuevoArchivo = new File(
        [archivoOriginal],
        "AutollantaBolivariano.txt",
        {
          type: "text/plain",
        }
      );
      archivos.push(nuevoArchivo);
    }
    if (
      archivosBolivariano.bolivarianoma &&
      archivosBolivariano.bolivarianoma.length > 0
    ) {
      const archivoOriginal = archivosBolivariano.bolivarianoma[0].doc;
      const nuevoArchivo = new File(
        [archivoOriginal],
        "MaxximundoBolivariano.txt",
        {
          type: "text/plain",
        }
      );
      archivos.push(nuevoArchivo);
    }
    const res = await apiCargarArchivoTransferenciasBolivariano({ archivos });
    if (res.success) {
      setArchivosBolivariano({ bolivarianoau: [], bolivarianoma: [] });
      limpiarInputsArchivosBolivariano(); // Limpiar los inputs de archivos
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  // Manejar archivos por empresa
  const handleArchivoPichincha = (empresaKey, files) => {
    setArchivosPichincha((prev) => ({ ...prev, [empresaKey]: files }));
  };

  // Verificar si hay al menos un archivo cargado
  const hayArchivosPichincha = Object.values(archivosPichincha).some(
    (archivos) => archivos && archivos.length > 0
  );

  // Función para limpiar inputs de archivos Bolivariano
  const limpiarInputsArchivosBolivariano = () => {
    const empresas = ["bolivarianoau", "bolivarianoma"];
    empresas.forEach((empresa) => {
      const fileInput = document.getElementById(
        `fileInputMB-bolivariano-${empresa}`
      );
      if (fileInput) {
        fileInput.value = "";
      }
    });
  };

  // Función para limpiar inputs de archivos Pichincha
  const limpiarInputsArchivos = () => {
    const empresas = ["au", "ma", "st", "ik"];
    empresas.forEach((empresa) => {
      const fileInput = document.getElementById(`fileInputMB-${empresa}`);
      if (fileInput) {
        fileInput.value = "";
      }
    });
  };

  // Subir archivos Pichincha
  const cargarArchivosPichincha = async () => {
    // Juntar archivos, cada uno con su nombre correspondiente
    const archivos = [];
    if (archivosPichincha.au && archivosPichincha.au.length > 0) {
      // Tomar el primer archivo del array y crear uno nuevo con el nombre deseado
      const archivoOriginal = archivosPichincha.au[0].doc;
      const nuevoArchivo = new File([archivoOriginal], "au.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.ma && archivosPichincha.ma.length > 0) {
      const archivoOriginal = archivosPichincha.ma[0].doc;
      const nuevoArchivo = new File([archivoOriginal], "ma.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.st && archivosPichincha.st.length > 0) {
      const archivoOriginal = archivosPichincha.st[0].doc;
      const nuevoArchivo = new File([archivoOriginal], "st.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.ik && archivosPichincha.ik.length > 0) {
      const archivoOriginal = archivosPichincha.ik[0].doc;
      const nuevoArchivo = new File([archivoOriginal], "ik.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    const res = await apiCargarArchivoTransferenciasPichincha({ archivos });
    if (res.success) {
      setArchivosPichincha({ au: [], ma: [], st: [], ik: [] });
      limpiarInputsArchivos(); // Limpiar los inputs de archivos
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  // Funciones para ejecutar bancos (solo para usuarios con permisos de ADMINISTRACION)
  const ejecutarBanco = async (banco) => {
    try {
      const res = await apiEjecutarBancos({ banco });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Error al ejecutar Banco");
    }
  };

  const ejecutarBancoPichincha = async () => {
    try {
      // Aquí iría la llamada a la API para ejecutar Banco Pichincha
      // const res = await apiEjecutarBancoPichincha();
      // Simulación de llamada a API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular 2 minutos
      toast.success("Banco Pichincha ejecutado correctamente");
    } catch (error) {
      toast.error("Error al ejecutar Banco Pichincha");
    }
  };

  const ejecutarTodosBancos = async () => {
    try {
      // Aquí iría la llamada a la API para ejecutar todos los bancos
      // const res = await apiEjecutarTodosBancos();
      // Simulación de llamada a API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular 2 minutos
      toast.success("Todos los bancos ejecutados correctamente");
    } catch (error) {
      toast.error("Error al ejecutar todos los bancos");
    }
  };
  return (
    <CustomContainer
      flexDirection="column"
      justifyContent="flex-start"
      height="100%"
      width="100%"
    >
      {/* PESTAÑAS */}
      <CustomContainer
        flexDirection="row"
        style={{ gap: "10px", marginBottom: "20px" }}
      >
        <CustomButton
          text="Banco Bolivariano"
          onClick={() => setActiveTab("bolivariano")}
          variant={activeTab === "bolivariano" ? "contained" : "outlined"}
          pcolor={
            activeTab === "bolivariano"
              ? theme.colors.secondary
              : theme.colors.primary
          }
        />
        <CustomButton
          text="Banco Pichincha"
          onClick={() => setActiveTab("pichincha")}
          variant={activeTab === "pichincha" ? "contained" : "outlined"}
          pcolor={
            activeTab === "pichincha"
              ? theme.colors.secondary
              : theme.colors.primary
          }
        />
        {tienePermisosAdministracion() && (
          <CustomButton
            text="Ejecutar Bancos"
            onClick={() => setActiveTab("ejecutar")}
            variant={activeTab === "ejecutar" ? "contained" : "outlined"}
            pcolor={
              activeTab === "ejecutar"
                ? theme.colors.secondary
                : theme.colors.primary
            }
          />
        )}
      </CustomContainer>

      {/* CONTENIDO PESTAÑA BANCO BOLIVARIANO */}
      {activeTab === "bolivariano" && (
        <CustomContainer flexDirection="column">
          <CustomContainer flexDirection="column">
            <CustomText color={theme.colors.error}>¡IMPORTANTE!</CustomText>
            <CustomText style={{ maxWidth: "1000px" }} align={"center"}>
              El archivo de movimientos del <b>BANCO BOLIVARIANO</b> que subas
              en esta sección será procesado automáticamente y los movimientos
              se cargarán en Registros Bancarios. Ya no es necesario esperar
              para que se reflejen.
            </CustomText>
          </CustomContainer>
          <CustomText
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Subir archivos Banco Bolivariano
          </CustomText>
          <CustomText style={{ marginBottom: 16 }}>
            Sube un archivo TXT de movimientos para cada empresa
          </CustomText>
          <CustomContainer style={{ gap: 24, flexWrap: "wrap" }}>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Autollanta</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoBolivariano}
                aceptados=".txt"
                nombreCampo="bolivarianoau"
                archivos={archivosBolivariano.au}
                impFinalizado={false}
                id="bolivariano-au"
                limite={1}
              />
            </CustomContainer>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Maxximundo</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoBolivariano}
                aceptados=".txt"
                nombreCampo="bolivarianoma"
                archivos={archivosBolivariano.ma}
                impFinalizado={false}
                id="bolivariano-ma"
                limite={1}
              />
            </CustomContainer>
          </CustomContainer>
          <CustomContainer style={{ marginTop: 24 }}>
            <CustomButton
              isAsync
              text="Subir Archivos Bolivariano"
              onClick={cargarArchivosBolivariano}
              disabled={!hayArchivosBolivariano}
            />
          </CustomContainer>
        </CustomContainer>
      )}

      {/* CONTENIDO PESTAÑA BANCO PICHINCHA */}
      {activeTab === "pichincha" && (
        <CustomContainer flexDirection="column">
          <CustomText
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Subir archivos Banco Pichincha
          </CustomText>
          <CustomText style={{ marginBottom: 16 }}>
            Sube un archivo CSV de movimientos para cada empresa
          </CustomText>
          <CustomContainer style={{ gap: 24, flexWrap: "wrap" }}>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Autollanta</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="au"
                archivos={archivosPichincha.au}
                impFinalizado={false}
                id="au"
                limite={1}
              />
            </CustomContainer>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Maxximundo</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="ma"
                archivos={archivosPichincha.ma}
                impFinalizado={false}
                id="ma"
                limite={1}
              />
            </CustomContainer>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Stox</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="st"
                archivos={archivosPichincha.st}
                impFinalizado={false}
                id="st"
                limite={1}
              />
            </CustomContainer>
            <CustomContainer flexDirection="column" style={{ minWidth: 200 }}>
              <CustomText>Ikonix</CustomText>
              <CampoListaArchivosMejorado
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="ik"
                archivos={archivosPichincha.ik}
                impFinalizado={false}
                id="ik"
                limite={1}
              />
            </CustomContainer>
          </CustomContainer>
          <CustomContainer style={{ marginTop: 24 }}>
            <CustomButton
              isAsync
              text="Subir Archivos Pichincha"
              onClick={cargarArchivosPichincha}
              disabled={!hayArchivosPichincha}
            />
          </CustomContainer>
        </CustomContainer>
      )}

      {/* CONTENIDO PESTAÑA EJECUTAR BANCOS */}
      {activeTab === "ejecutar" && tienePermisosAdministracion() && (
        <CustomContainer flexDirection="column">
          <CustomText
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Ejecutar Procesos de Bancos
          </CustomText>
          <CustomText style={{ marginBottom: 16 }}>
            Ejecuta los procesos de sincronización con los bancos. Tiempo
            aproximado: 2 minutos por proceso.
          </CustomText>

          <CustomContainer style={{ gap: 16, flexWrap: "wrap" }}>
            <CustomButton
              isAsync
              text="Ejecutar Coop JEP"
              onClick={() => ejecutarBanco("jep")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />

            <CustomButton
              isAsync
              text="Ejecutar Guayaquil"
              onClick={() => ejecutarBanco("guayaquil")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />

            <CustomButton
              isAsync
              text="Ejecutar Produbanco"
              onClick={() => ejecutarBanco("produbanco")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />
          </CustomContainer>

          <CustomContainer
            style={{
              marginTop: 24,
              padding: 16,
              backgroundColor: theme.colors.background,
              borderRadius: 8,
              width: "fit-content",
            }}
            flexDirection="column"
          >
            <CustomText style={{ fontWeight: 600, marginBottom: 8 }}>
              ⚠️ Información Importante
            </CustomText>
            <CustomText style={{ fontSize: "14px", lineHeight: "1.4" }}>
              • Cada proceso puede tomar aproximadamente 2 minutos en
              completarse <br />
              • No cierres la ventana mientras se ejecutan los procesos <br />
              • Los procesos se ejecutan de forma secuencial para evitar
              conflictos <br />• Recibirás una notificación cuando cada proceso
              termine cada proceso termine
            </CustomText>
          </CustomContainer>
        </CustomContainer>
      )}
    </CustomContainer>
  );
};
