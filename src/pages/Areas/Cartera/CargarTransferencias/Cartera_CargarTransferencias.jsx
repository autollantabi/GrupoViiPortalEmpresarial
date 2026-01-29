import React, { useState } from "react";

import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { useTheme } from "context/ThemeContext";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import {
  apiCargarArchivoTransferenciasPichincha,
  apiCargarArchivoTransferenciasBolivariano,
} from "services/cartera/cargarTransferencias";
import { toast } from "react-toastify";
import { apiEjecutarBancos } from "services/cartera/ejecutarbancos";
import { FileListUI } from "components/UI/Components/FileListUI";
import { useAuthContext } from "context/authContext";

export const Cartera_CargarTransferencias = () => {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("bolivariano"); // "bolivariano", "pichincha" o "ejecutar"

  // Verificar permisos para la pestaña de ejecutar bancos
  const tienePermisosAdministracion = () => {
    if (!user) {
      return false;
    }
    // Usar CONTEXTOS o data (ambos contienen los mismos datos)
    const contextos = user.CONTEXTOS || [];
    if (!Array.isArray(contextos) || contextos.length === 0) {
      return false;
    }
    // Revisar en todos los permisos si tienen uno que sea administracion
    return contextos.some(
      (contexto) => contexto.RECURSO?.toLowerCase() === "administracion"
    );
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
  // FileListUI llama setArchivo(nombreCampo, files), así que necesitamos adaptar la función
  const handleArchivoBolivariano = (nombreCampo, files) => {
    if (files === undefined) {
      // Si solo se pasa un parámetro, es el nombreCampo y necesitamos retornar una función
      return (files) => {
        setArchivosBolivariano((prev) => ({ ...prev, [nombreCampo]: files }));
      };
    }
    // Si se pasan ambos parámetros, actualizar directamente
    setArchivosBolivariano((prev) => ({ ...prev, [nombreCampo]: files }));
  };

  // Verificar si hay al menos un archivo cargado para Bolivariano
  const hayArchivosBolivariano = Object.values(archivosBolivariano).some(
    (archivos) => archivos && Array.isArray(archivos) && archivos.length > 0
  );

  // Subir archivos Bolivariano
  const cargarArchivosBolivariano = async () => {
    // Juntar archivos, cada uno con su nombre correspondiente

    const archivos = [];
    if (
      archivosBolivariano.bolivarianoau &&
      archivosBolivariano.bolivarianoau.length > 0
    ) {
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosBolivariano.bolivarianoau[0].doc || archivosBolivariano.bolivarianoau[0];
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
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosBolivariano.bolivarianoma[0].doc || archivosBolivariano.bolivarianoma[0];
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

  // Manejar archivos por empresa para Pichincha
  // FileListUI llama setArchivo(nombreCampo, files), así que necesitamos adaptar la función
  const handleArchivoPichincha = (nombreCampo, files) => {
    if (files === undefined) {
      // Si solo se pasa un parámetro, es el nombreCampo y necesitamos retornar una función
      return (files) => {
        setArchivosPichincha((prev) => ({ ...prev, [nombreCampo]: files }));
      };
    }
    // Si se pasan ambos parámetros, actualizar directamente
    setArchivosPichincha((prev) => ({ ...prev, [nombreCampo]: files }));
  };

  // Verificar si hay al menos un archivo cargado para Pichincha
  const hayArchivosPichincha = Object.values(archivosPichincha).some(
    (archivos) => archivos && Array.isArray(archivos) && archivos.length > 0
  );

  // Función para limpiar inputs de archivos Bolivariano
  const limpiarInputsArchivosBolivariano = () => {
    // Los archivos se limpian automáticamente al resetear el estado
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
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosPichincha.au[0].doc || archivosPichincha.au[0];
      const nuevoArchivo = new File([archivoOriginal], "au.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.ma && archivosPichincha.ma.length > 0) {
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosPichincha.ma[0].doc || archivosPichincha.ma[0];
      const nuevoArchivo = new File([archivoOriginal], "ma.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.st && archivosPichincha.st.length > 0) {
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosPichincha.st[0].doc || archivosPichincha.st[0];
      const nuevoArchivo = new File([archivoOriginal], "st.csv", {
        type: "text/csv",
      });
      archivos.push(nuevoArchivo);
    }
    if (archivosPichincha.ik && archivosPichincha.ik.length > 0) {
      // FileListUI devuelve archivos con estructura { doc: File, ... }
      const archivoOriginal = archivosPichincha.ik[0].doc || archivosPichincha.ik[0];
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

  return (
    <ContainerUI
      flexDirection="column"
      justifyContent="flex-start"
      height="100%"
      width="100%"
    >
      {/* PESTAÑAS */}
      <ContainerUI
        flexDirection="row"
        style={{ gap: "10px", marginBottom: "20px" }}
      >
        <ButtonUI
          text="Banco Bolivariano"
          onClick={() => setActiveTab("bolivariano")}
          variant={activeTab === "bolivariano" ? "contained" : "outlined"}
          pcolor={
            activeTab === "bolivariano"
              ? theme.colors.secondary
              : theme.colors.primary
          }
        />
        <ButtonUI
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
          <ButtonUI
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
      </ContainerUI>

      {/* CONTENIDO PESTAÑA BANCO BOLIVARIANO */}
      {activeTab === "bolivariano" && (
        <ContainerUI flexDirection="column">
          <ContainerUI flexDirection="column">
            <TextUI color={theme.colors.error}>¡IMPORTANTE!</TextUI>
            <TextUI style={{ maxWidth: "1000px" }} align={"center"}>
              El archivo de movimientos del <b>BANCO BOLIVARIANO</b> que subas
              en esta sección será procesado automáticamente y los movimientos
              se cargarán en Registros Bancarios. Ya no es necesario esperar
              para que se reflejen.
            </TextUI>
          </ContainerUI>
          <TextUI
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Subir archivos Banco Bolivariano
          </TextUI>
          <TextUI style={{ marginBottom: 16 }}>
            Sube un archivo TXT de movimientos para cada empresa
          </TextUI>
          <ContainerUI style={{ gap: 24, flexWrap: "wrap" }}>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Autollanta</TextUI>
              <FileListUI
                setArchivo={handleArchivoBolivariano}
                aceptados=".txt"
                nombreCampo="bolivarianoau"
                archivos={archivosBolivariano.bolivarianoau}
                impFinalizado={false}
                id="bolivariano-au"
                limite={1}
              />
            </ContainerUI>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Maxximundo</TextUI>
              <FileListUI
                setArchivo={handleArchivoBolivariano}
                aceptados=".txt"
                nombreCampo="bolivarianoma"
                archivos={archivosBolivariano.bolivarianoma}
                impFinalizado={false}
                id="bolivariano-ma"
                limite={1}
              />
            </ContainerUI>
          </ContainerUI>
          <ContainerUI style={{ marginTop: 24 }}>
            <ButtonUI
              isAsync
              text="Subir Archivos Bolivariano"
              onClick={cargarArchivosBolivariano}
              disabled={!hayArchivosBolivariano}
            />
          </ContainerUI>
        </ContainerUI>
      )}

      {/* CONTENIDO PESTAÑA BANCO PICHINCHA */}
      {activeTab === "pichincha" && (
        <ContainerUI flexDirection="column">
          <TextUI
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Subir archivos Banco Pichincha
          </TextUI>
          <TextUI style={{ marginBottom: 16 }}>
            Sube un archivo CSV de movimientos para cada empresa
          </TextUI>
          <ContainerUI style={{ gap: 24, flexWrap: "wrap" }}>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Autollanta</TextUI>
              <FileListUI
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="au"
                archivos={archivosPichincha.au}
                impFinalizado={false}
                id="au"
                limite={1}
              />
            </ContainerUI>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Maxximundo</TextUI>
              <FileListUI
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="ma"
                archivos={archivosPichincha.ma}
                impFinalizado={false}
                id="ma"
                limite={1}
              />
            </ContainerUI>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Stox</TextUI>
              <FileListUI
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="st"
                archivos={archivosPichincha.st}
                impFinalizado={false}
                id="st"
                limite={1}
              />
            </ContainerUI>
            <ContainerUI flexDirection="column" style={{ minWidth: 200 }}>
              <TextUI>Ikonix</TextUI>
              <FileListUI
                setArchivo={handleArchivoPichincha}
                aceptados=".csv"
                nombreCampo="ik"
                archivos={archivosPichincha.ik}
                impFinalizado={false}
                id="ik"
                limite={1}
              />
            </ContainerUI>
          </ContainerUI>
          <ContainerUI style={{ marginTop: 24 }}>
            <ButtonUI
              isAsync
              text="Subir Archivos Pichincha"
              onClick={cargarArchivosPichincha}
              disabled={!hayArchivosPichincha}
            />
          </ContainerUI>
        </ContainerUI>
      )}

      {/* CONTENIDO PESTAÑA EJECUTAR BANCOS */}
      {activeTab === "ejecutar" && tienePermisosAdministracion() && (
        <ContainerUI flexDirection="column">
          <TextUI
            color={theme.colors.primary}
            style={{ fontWeight: 700, marginBottom: 8 }}
          >
            Ejecutar Procesos de Bancos
          </TextUI>
          <TextUI style={{ marginBottom: 16 }}>
            Ejecuta los procesos de sincronización con los bancos. Tiempo
            aproximado: 2 minutos por proceso.
          </TextUI>

          <ContainerUI style={{ gap: 16, flexWrap: "wrap" }}>
            <ButtonUI
              isAsync
              text="Ejecutar Coop JEP"
              onClick={() => ejecutarBanco("jep")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />

            <ButtonUI
              isAsync
              text="Ejecutar Guayaquil"
              onClick={() => ejecutarBanco("guayaquil")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />

            <ButtonUI
              isAsync
              text="Ejecutar Produbanco"
              onClick={() => ejecutarBanco("produbanco")}
              pcolor={theme.colors.primary}
              style={{ minWidth: "200px" }}
            />
          </ContainerUI>

          <ContainerUI
            style={{
              marginTop: 24,
              padding: 16,
              backgroundColor: theme.colors.backgroundLight,
              borderRadius: 8,
              width: "fit-content",
            }}
            flexDirection="column"
          >
            <TextUI style={{ fontWeight: 600, marginBottom: 8 }}>
              ⚠️ Información Importante
            </TextUI>
            <TextUI style={{ fontSize: "14px", lineHeight: "1.4" }}>
              • Cada proceso puede tomar aproximadamente 2 minutos en
              completarse <br />
              • No cierres la ventana mientras se ejecutan los procesos <br />
              • Los procesos se ejecutan de forma secuencial para evitar
              conflictos <br />• Recibirás una notificación cuando cada proceso
              termine cada proceso termine
            </TextUI>
          </ContainerUI>
        </ContainerUI>
      )}
    </ContainerUI>
  );
};
