import React, { useEffect, useState } from "react";

import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { useTheme } from "context/ThemeContext";
import { CustomSelect } from "components/UI/CustomComponents/CustomSelects";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomInputFile } from "components/UI/CustomComponents/CustomInputs";
import { toast } from "react-toastify";
import { withPermissions } from "../../../../hoc/withPermissions";
import {
  convertirArchivoBancos,
  obtenerListaBancos,
} from "services/contabilidadService";

const Contabilidad_ConversionArchivosBancosComponent = ({
  empresasAcceso,
  permissionsLoading,
}) => {
  const { theme } = useTheme();
  const [archivo, setArchivo] = useState([]);
  const [empresa, setEmpresa] = useState(null);
  const [banco, setBanco] = useState(null);
  const [opcionesEmpresas, setOpcionesEmpresas] = useState(null);
  const [opcionesBancos, setOpcionesBancos] = useState(null);

  const obtenerOpcionesListaEmpresas = async () => {
    if (empresasAcceso && empresasAcceso.length > 0) {
      const requestEmpresas = [...empresasAcceso];
      if (!requestEmpresas.some((item) => item.empresa === "URVI")) {
        requestEmpresas.push({ idempresa: 20, empresa: "URVI", permiso: "E" });
      }
      const newOpcionesEmpresas = requestEmpresas.map((item) => ({
        label: item.empresa,
        value: item.idempresa || 20,
      }));

      setOpcionesEmpresas(newOpcionesEmpresas);
    }
  };

  const handleArchivo = (archivos) => {
    // console.log(nombre);
    setArchivo(archivos);
  };

  const obtenerBancos = async (empid) => {
    const req_bancos = await obtenerListaBancos();
    let bancosList = req_bancos;
    console.log(req_bancos);

    if (empid === 20) {
      bancosList = req_bancos.filter(
        (item) => item.banc_nombre === "PRODUBANCO"
      );
    } else {
      // Añadir banco PACIFICO para todas las empresas excepto la que tiene empid === 20
      bancosList = [...req_bancos, { banc_id: 10, banc_nombre: "PACIFICO" }];
    }
    bancosList = bancosList.map((item) => ({
      value: item.banc_id,
      label: item.banc_nombre,
    }));
    setOpcionesBancos(bancosList);
  };

  const handleChangeEmpresa = async (selected) => {
    setBanco(null);
    setEmpresa(selected);
    await obtenerBancos(selected.value);
  };

  const cargarArchivoTransformacion = async () => {
    const res = await convertirArchivoBancos({
      empresa: empresa.label,
      banco: banco.label,
      archivos: archivo,
    });

    if (res.success) {
      setArchivo([]);
      setEmpresa(null);
      setBanco(null);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  // Todos los hooks deben ir antes de cualquier return condicional
  useEffect(() => {
    obtenerOpcionesListaEmpresas();
  }, [empresasAcceso]);

  // Mostrar mensaje si no hay permisos
  if (permissionsLoading) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>Cargando permisos...</div>
      </CustomContainer>
    );
  }

  if (!empresasAcceso || empresasAcceso.length === 0) {
    return (
      <CustomContainer
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>No tienes permisos para acceder a esta funcionalidad.</div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <CustomContainer flexDirection="column" style={{ gap: "20px" }}>
        <CustomInputFile
          prevFiles={archivo}
          setFileData={handleArchivo}
          maxFiles={1}
          validExtensions={["xlsx"]}
        />
        {/* <InputArchivo setarchivoname={handleNombreArchivoChange} /> */}
        <CustomContainer flexDirection="column" style={{ gap: "20px" }}>
          <CustomSelect
            options={opcionesEmpresas}
            value={empresa}
            onChange={handleChangeEmpresa}
            placeholder="Elije una empresa"
            minWidth="200px"
          />
          {empresa && (
            <CustomSelect
              options={opcionesBancos}
              value={banco}
              onChange={setBanco}
              placeholder="Elije un banco"
              minWidth="200px"
            />
          )}
          {empresa && banco && archivo.length > 0 && (
            <CustomContainer>
              <CustomButton
                text={"Transformar"}
                onClick={cargarArchivoTransformacion}
                isAsync
              />
            </CustomContainer>
          )}
        </CustomContainer>
      </CustomContainer>
    </CustomContainer>
  );
};

// Exportar el componente envuelto con withPermissions
export const Contabilidad_ConversionArchivosBancos = withPermissions(
  Contabilidad_ConversionArchivosBancosComponent
);
