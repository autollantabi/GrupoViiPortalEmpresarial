import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ConfirmarCargaMasivaEmpleados } from "services/colaboradoresService";
import { RUTA_BASE } from "../utils/constantes";
import {
  Acciones,
  Aviso,
  Badge,
  Contenedor,
  Encabezado,
  Fila,
  Subtitulo,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  Th,
  Titulo,
} from "../componentes/piezas";

const CeldaInput = styled.input`
  width: 100%;
  min-width: 110px;
  padding: 4px 6px;
  font-size: 13px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme?.colors?.border};
  background: ${({ theme }) => theme?.colors?.background};
  color: ${({ theme }) => theme?.colors?.text};
`;

const Nota = styled.div`
  font-size: 11px;
  margin-top: 2px;
  color: ${({ $tono, theme }) =>
    $tono === "error" ? theme?.colors?.error : theme?.colors?.warningDark};
`;

const TONO_ACCION = { nuevo: "info", cambia: "aviso", sin_cambios: "neutro" };
const ETIQUETA_ACCION = { nuevo: "Nuevo", cambia: "Cambia", sin_cambios: "Sin cambios" };

/**
 * Revisión y confirmación de una carga masiva, en pantalla completa.
 *
 * Vive en su propia ruta (no en el modal) porque con cientos de filas y una
 * columna de detalle por fila, el modal no daba el ancho ni el alto para
 * leerla bien. El modal (ModalCargaMasiva) solo sube y valida el archivo;
 * apenas valida, navega acá con el resultado en el state de la ruta.
 *
 * Si se entra sin ese state (refrescando la página o por URL directa), no hay
 * nada que mostrar: se manda de vuelta al listado para subir el archivo de
 * nuevo, en vez de mostrar una pantalla vacía.
 */
export const ColCargaMasiva = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const datosIniciales = location.state;

  const [filas, setFilas] = useState(datosIniciales?.filas ?? []);
  const [faltantes] = useState(datosIniciales?.faltantes ?? []);
  const [seleccionadas, setSeleccionadas] = useState(() =>
    Object.fromEntries(
      (datosIniciales?.filas ?? []).map((fila) => [
        fila.fila,
        fila.errores.length === 0 && fila.accion !== "sin_cambios",
      ]),
    ),
  );
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, setResultado] = useState(null);

  if (!datosIniciales?.filas) {
    return (
      <Contenedor>
        <Encabezado>
          <div>
            <Titulo>Carga masiva de colaboradores</Titulo>
            <Subtitulo>No hay ningún archivo validado para revisar.</Subtitulo>
          </div>
        </Encabezado>
        <Acciones>
          <ButtonUI text="Volver al listado" onClick={() => navigate(`${RUTA_BASE}/empleados`)} />
        </Acciones>
      </Contenedor>
    );
  }

  const editarCampo = (numeroFila, campo, valor) => {
    setFilas((previas) =>
      previas.map((fila) => (fila.fila === numeroFila ? { ...fila, [campo]: valor } : fila)),
    );
  };

  const alternarSeleccion = (numeroFila) => {
    setSeleccionadas((previas) => ({ ...previas, [numeroFila]: !previas[numeroFila] }));
  };

  const totalSeleccionadas = Object.values(seleccionadas).filter(Boolean).length;

  // Solo los campos que pide confirmarCargaMasivaSchema: `fila` en pantalla
  // trae ademas errores/avisos/accion/empleadoIdExistente/cambios (los puso
  // /carga-masiva/validar para esta revision), que no hace falta reenviar y
  // que con cientos de filas abultan el payload de sobra.
  const soloCamposDeEnvio = ({
    fila,
    nombreCompania,
    numeroDocumento,
    nombres,
    apellidos,
    nombreCompletoOriginal,
    fechaNacimiento,
    fechaIngreso,
    cargo,
    area,
    linea,
    ciudad,
  }) => ({
    fila,
    nombreCompania,
    numeroDocumento,
    nombres,
    apellidos,
    nombreCompletoOriginal,
    fechaNacimiento,
    fechaIngreso,
    cargo,
    area,
    linea,
    ciudad,
  });

  const confirmar = async () => {
    const aEnviar = filas.filter((fila) => seleccionadas[fila.fila]).map(soloCamposDeEnvio);
    if (aEnviar.length === 0 || confirmando) return;

    setConfirmando(true);
    try {
      const respuesta = await ConfirmarCargaMasivaEmpleados(aEnviar);
      setResultado(respuesta);
    } catch (error) {
      toast.error(error.message || "No se pudo procesar la carga masiva");
    } finally {
      setConfirmando(false);
    }
  };

  if (resultado) {
    return (
      <Contenedor>
        <Encabezado>
          <div>
            <Titulo>Carga masiva de colaboradores</Titulo>
            <Subtitulo>Resultado de la carga</Subtitulo>
          </div>
        </Encabezado>

        <Tarjeta>
          <Aviso $tono={resultado.resumen.errores > 0 ? "aviso" : "exito"}>
            {resultado.resumen.creados} colaborador{resultado.resumen.creados === 1 ? "" : "es"} creado
            {resultado.resumen.creados === 1 ? "" : "s"}
            {` · ${resultado.resumen.actualizados} actualizado${resultado.resumen.actualizados === 1 ? "" : "s"}`}
            {resultado.resumen.errores > 0 &&
              ` · ${resultado.resumen.errores} fila${resultado.resumen.errores === 1 ? "" : "s"} con error`}
          </Aviso>

          {resultado.resumen.errores > 0 && (
            <TablaScroll style={{ maxHeight: "50vh", marginTop: 12 }}>
              <Tabla>
                <thead>
                  <tr>
                    <Th>Fila</Th>
                    <Th>Error</Th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resultados
                    .filter((item) => !item.ok)
                    .map((item) => (
                      <Fila key={item.fila}>
                        <Td>{item.fila}</Td>
                        <Td>{item.error}</Td>
                      </Fila>
                    ))}
                </tbody>
              </Tabla>
            </TablaScroll>
          )}

          <Acciones style={{ marginTop: 16 }}>
            <ButtonUI text="Volver al listado" onClick={() => navigate(`${RUTA_BASE}/empleados`)} />
          </Acciones>
        </Tarjeta>
      </Contenedor>
    );
  }

  return (
    <Contenedor>
      <Encabezado>
        <div>
          <Titulo>Carga masiva de colaboradores</Titulo>
          <Subtitulo>Revise y corrija antes de confirmar</Subtitulo>
        </div>
        <Acciones>
          <ButtonUI
            text="Volver al listado"
            iconLeft="FaArrowLeft"
            variant="ghost"
            onClick={() => navigate(`${RUTA_BASE}/empleados`)}
            disabled={confirmando}
          />
        </Acciones>
      </Encabezado>

      <Tarjeta>
        <Aviso $tono={filas.some((fila) => fila.errores.length > 0) ? "aviso" : "exito"}>
          {filas.length} fila{filas.length === 1 ? "" : "s"} leída{filas.length === 1 ? "" : "s"}
          {" · "}
          {totalSeleccionadas} seleccionada{totalSeleccionadas === 1 ? "" : "s"} para aplicar. Corrija lo
          que haga falta directamente en la tabla; los avisos en ámbar no bloquean la creación. Las filas
          "Cambia" van a ACTUALIZAR la ficha existente, no a crear una nueva.
        </Aviso>

        <TablaScroll style={{ maxHeight: "65vh", marginTop: 12 }}>
          <Tabla>
            <thead>
              <tr>
                <Th></Th>
                <Th>Fila</Th>
                <Th>Acción</Th>
                <Th>Compañía</Th>
                <Th>Documento</Th>
                <Th>Apellidos</Th>
                <Th>Nombres</Th>
                <Th>Cargo</Th>
                <Th>Área</Th>
                <Th>Línea</Th>
                <Th>Ciudad</Th>
                <Th>F. Ingreso</Th>
                <Th>Detalle</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <Fila key={fila.fila}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={Boolean(seleccionadas[fila.fila])}
                      onChange={() => alternarSeleccion(fila.fila)}
                    />
                  </Td>
                  <Td>{fila.fila}</Td>
                  <Td>
                    <Badge $tono={TONO_ACCION[fila.accion] ?? "neutro"}>
                      {ETIQUETA_ACCION[fila.accion] ?? fila.accion}
                    </Badge>
                  </Td>
                  <Td>
                    <CeldaInput
                      value={fila.nombreCompania}
                      onChange={(evento) => editarCampo(fila.fila, "nombreCompania", evento.target.value)}
                    />
                  </Td>
                  <Td>
                    <CeldaInput
                      value={fila.numeroDocumento}
                      onChange={(evento) => editarCampo(fila.fila, "numeroDocumento", evento.target.value)}
                    />
                  </Td>
                  <Td>
                    <CeldaInput
                      value={fila.apellidos}
                      onChange={(evento) => editarCampo(fila.fila, "apellidos", evento.target.value)}
                    />
                  </Td>
                  <Td>
                    <CeldaInput
                      value={fila.nombres}
                      onChange={(evento) => editarCampo(fila.fila, "nombres", evento.target.value)}
                    />
                    {fila.nombreAmbiguo && <Nota $tono="aviso">revisar división del nombre</Nota>}
                  </Td>
                  <Td>
                    <CeldaInput value={fila.cargo} onChange={(evento) => editarCampo(fila.fila, "cargo", evento.target.value)} />
                  </Td>
                  <Td>
                    <CeldaInput value={fila.area ?? ""} onChange={(evento) => editarCampo(fila.fila, "area", evento.target.value)} />
                  </Td>
                  <Td>
                    <CeldaInput value={fila.linea ?? ""} onChange={(evento) => editarCampo(fila.fila, "linea", evento.target.value)} />
                  </Td>
                  <Td>
                    <CeldaInput value={fila.ciudad ?? ""} onChange={(evento) => editarCampo(fila.fila, "ciudad", evento.target.value)} />
                  </Td>
                  <Td>
                    <CeldaInput
                      value={fila.fechaIngreso}
                      onChange={(evento) => editarCampo(fila.fila, "fechaIngreso", evento.target.value)}
                    />
                  </Td>
                  <Td style={{ minWidth: 260 }}>
                    {fila.errores.map((error) => (
                      <Nota key={error} $tono="error">
                        {error}
                      </Nota>
                    ))}
                    {fila.avisos.map((aviso) => (
                      <Nota key={aviso} $tono="aviso">
                        {aviso}
                      </Nota>
                    ))}
                    {fila.cambios?.map((cambio) => (
                      <Nota key={cambio.campo} $tono="aviso">
                        {cambio.campo}: {cambio.actual ?? "(vacío)"} → {cambio.nuevo ?? "(vacío)"}
                      </Nota>
                    ))}
                  </Td>
                </Fila>
              ))}
            </tbody>
          </Tabla>
        </TablaScroll>

        <Acciones style={{ marginTop: 16 }}>
          <ButtonUI
            text={confirmando ? "Aplicando…" : `Confirmar carga (${totalSeleccionadas})`}
            onClick={confirmar}
            disabled={totalSeleccionadas === 0 || confirmando}
          />
          <ButtonUI
            text="Cancelar"
            variant="outlined"
            onClick={() => navigate(`${RUTA_BASE}/empleados`)}
            disabled={confirmando}
          />
        </Acciones>
      </Tarjeta>

      {faltantes.length > 0 && (
        <Tarjeta style={{ marginTop: 16 }}>
          <Aviso $tono="info">
            {faltantes.length} colaborador{faltantes.length === 1 ? "" : "es"} activo
            {faltantes.length === 1 ? "" : "s"} en el sistema, de las empresas de este archivo, no
            vinieron en esta carga. No se les toca nada automáticamente: revise a mano si alguno debe
            darse de baja.
          </Aviso>
          <TablaScroll style={{ maxHeight: "30vh", marginTop: 12 }}>
            <Tabla>
              <thead>
                <tr>
                  <Th>Compañía</Th>
                  <Th>Documento</Th>
                  <Th>Nombre</Th>
                </tr>
              </thead>
              <tbody>
                {faltantes.map((item) => (
                  <Fila key={`${item.empresaId}-${item.empleadoId}`}>
                    <Td>{item.empresa}</Td>
                    <Td>{item.cedula ?? "—"}</Td>
                    <Td>{item.nombresCompletos}</Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        </Tarjeta>
      )}
    </Contenedor>
  );
};

export default ColCargaMasiva;
