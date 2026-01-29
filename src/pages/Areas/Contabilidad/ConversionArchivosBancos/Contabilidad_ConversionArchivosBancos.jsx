import React, { useEffect, useState, useMemo } from "react";

import { ContainerUI } from "components/UI/Components/ContainerUI";
import { useTheme } from "context/ThemeContext";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { FileListUI } from "components/UI/Components/FileListUI";
import { toast } from "react-toastify";
import {
  convertirArchivoBancos,
  obtenerListaBancos,
} from "services/contabilidadService";

export const Contabilidad_ConversionArchivosBancos = ({
  availableCompanies = [],
  availableLines = [],
}) => {
  const { theme } = useTheme();
  const [archivosList, setArchivosList] = useState([]); // Estructura que FileListUI espera
  const [empresa, setEmpresa] = useState(null);
  const [banco, setBanco] = useState(null);
  const [opcionesEmpresas, setOpcionesEmpresas] = useState(null);
  const [opcionesBancos, setOpcionesBancos] = useState(null);

  // Convertir availableCompanies de { id, nombre } a { idempresa, empresa } para compatibilidad
  const empresasDisponibles = useMemo(() => {
    if (!availableCompanies || availableCompanies.length === 0) {
      return [];
    }
    return availableCompanies.map(emp => ({
      idempresa: emp.id,
      empresa: emp.nombre,
    }));
  }, [availableCompanies]);

  const obtenerOpcionesListaEmpresas = async () => {
    if (empresasDisponibles && empresasDisponibles.length > 0) {
      const requestEmpresas = [...empresasDisponibles];
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

  const handleArchivo = (nombreCampo, archivos) => {
    // FileListUI devuelve archivos con estructura { doc: File, ... }
    setArchivosList(archivos || []);
  };

  const obtenerBancos = async (empid) => {
    const req_bancos = await obtenerListaBancos();
    let bancosList = req_bancos;

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
    // Extraer solo los archivos File de la estructura de FileListUI
    const archivosFile = archivosList.map((item) => item.doc || item);
    
    const res = await convertirArchivoBancos({
      empresa: empresa.label,
      banco: banco.label,
      archivos: archivosFile,
    });

    if (res.success) {
      setArchivosList([]);
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
  }, [empresasDisponibles]);

  // Verificar si hay empresas disponibles
  if (!empresasDisponibles || empresasDisponibles.length === 0) {
    return (
      <ContainerUI
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="100%"
      >
        <div>No tienes permisos para acceder a esta funcionalidad.</div>
      </ContainerUI>
    );
  }

  return (
    <ContainerUI
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      width="100%"
      height="100%"
    >
      <ContainerUI flexDirection="column" style={{ gap: "20px" }}>
        <FileListUI
          setArchivo={handleArchivo}
          aceptados=".xlsx"
          nombreCampo="archivo"
          archivos={archivosList}
          impFinalizado={false}
          id="archivo-conversion"
          limite={1}
        />
        <ContainerUI flexDirection="column" style={{ gap: "20px" }}>
          <SelectUI
            options={opcionesEmpresas}
            value={empresa}
            onChange={handleChangeEmpresa}
            placeholder="Elije una empresa"
            minWidth="200px"
          />
          {empresa && (
            <SelectUI
              options={opcionesBancos}
              value={banco}
              onChange={setBanco}
              placeholder="Elije un banco"
              minWidth="200px"
            />
          )}
          {empresa && banco && archivosList && archivosList.length > 0 && (
            <ContainerUI>
              <ButtonUI
                text={"Transformar"}
                onClick={cargarArchivoTransformacion}
                isAsync
              />
            </ContainerUI>
          )}
        </ContainerUI>
      </ContainerUI>
    </ContainerUI>
  );
};
