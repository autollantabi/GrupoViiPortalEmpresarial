import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { DescargarPlantillaCargaMasiva, ValidarCargaMasivaEmpleados } from "services/colaboradoresService";
import { RUTA_BASE } from "../utils/constantes";
import { Acciones, Aviso } from "./piezas";

const ZonaArchivo = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px;
  border: 1px dashed ${({ theme }) => theme?.colors?.border};
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme?.colors?.textSecondary};

  &:hover {
    border-color: ${({ theme }) => theme?.colors?.primary};
  }
`;

/**
 * Carga masiva de colaboradores: este modal SOLO descarga la plantilla, recibe
 * el archivo y lo valida contra el backend. La revisión fila por fila (con
 * cientos de filas y una columna de detalle larga) no entra bien en un modal,
 * así que apenas el archivo valida, se navega a ColCargaMasiva (pantalla
 * completa) con el resultado en el state de la ruta.
 */
export const ModalCargaMasiva = ({ abierto, onCerrar }) => {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [validando, setValidando] = useState(false);
  const inputArchivoRef = useRef(null);

  const cerrar = () => {
    setArchivo(null);
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    onCerrar?.();
  };

  const descargarPlantilla = async () => {
    try {
      await DescargarPlantillaCargaMasiva();
    } catch (error) {
      toast.error(error.message || "No se pudo descargar la plantilla");
    }
  };

  const validarArchivo = async () => {
    if (!archivo || validando) return;
    setValidando(true);
    try {
      const resultadoValidacion = await ValidarCargaMasivaEmpleados(archivo);
      cerrar();
      navigate(`${RUTA_BASE}/empleados/carga-masiva`, {
        state: {
          filas: resultadoValidacion.filas ?? [],
          faltantes: resultadoValidacion.faltantes ?? [],
        },
      });
    } catch (error) {
      toast.error(error.message || "No se pudo validar el archivo");
    } finally {
      setValidando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI isOpen={abierto} onClose={cerrar} title="Carga masiva de colaboradores" width="560px" noFooter>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Aviso $tono="info">
          Descargue la plantilla, complétela con una fila por colaborador y súbala aquí. La columna
          "Nombres Completos" se parte automáticamente en nombres y apellidos; en la siguiente pantalla
          se revisa y corrige antes de crear o actualizar nada.
        </Aviso>

        <Acciones>
          <ButtonUI text="Descargar plantilla" iconLeft="FaDownload" variant="outlined" onClick={descargarPlantilla} />
        </Acciones>

        <ZonaArchivo htmlFor="archivo-carga-masiva">
          <span>{archivo ? archivo.name : "Haga clic para elegir el archivo .xlsx completado"}</span>
          <input
            id="archivo-carga-masiva"
            ref={inputArchivoRef}
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={(evento) => setArchivo(evento.target.files?.[0] ?? null)}
          />
        </ZonaArchivo>

        <Acciones>
          <ButtonUI
            text={validando ? "Validando…" : "Validar archivo"}
            onClick={validarArchivo}
            disabled={!archivo || validando}
          />
          <ButtonUI text="Cancelar" variant="outlined" onClick={cerrar} disabled={validando} />
        </Acciones>
      </div>
    </ModalUI>
  );
};

export default ModalCargaMasiva;
