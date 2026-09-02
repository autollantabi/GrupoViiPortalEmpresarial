import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  ActualizarDocumentoEmpleado,
  CrearDocumentoEmpleado,
  DescargarArchivoDocumento,
  EliminarDocumentoEmpleado,
  ObtenerDocumentacionEmpleado,
  SubirArchivoDocumento,
} from "services/dotacionService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { ModalMarcarDocumento } from "../componentes/ModalMarcarDocumento";
import { ModalSubirDocumento } from "../componentes/ModalSubirDocumento";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaDocumentos } from "../componentes/TablaDocumentos";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  CirculoIcono,
  Contenedor,
  Kpi,
  KpiTitulo,
  KpiValor,
  Rejilla,
  Tarjeta,
  TextoTenue,
  Vacio,
} from "../componentes/piezas";
import { ETIQUETA_ESTADO_CIVIL } from "../utils/constantesDotacion";
import { RUTA_BASE } from "../utils/constantes";

/**
 * Pestaña Documentos de una ficha.
 *
 * La lista viene calculada por el backend como la unión de lo que se le exige con
 * lo que ya tiene, así que aquí no se decide nada sobre qué pedir: solo se
 * presenta y se actúa.
 */
export const ColDocumentos = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [ocupado, setOcupado] = useState(false);
  const [aSubir, setASubir] = useState(null);
  const [aMarcar, setAMarcar] = useState(null);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: documentacion,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerDocumentacionEmpleado(id, { signal }), [id]);

  const ejecutar = async (accion, exito) => {
    setOcupado(true);
    try {
      await accion();
      if (exito) toast.success(exito);
      recargar();
    } catch (e) {
      toast.error(e.message || "No se pudo completar la acción");
    } finally {
      setOcupado(false);
    }
  };

  /**
   * Guardar sirve para crear y para actualizar.
   *
   * El `id` nulo es lo que distingue los dos casos: significa que el documento se
   * le exige pero todavía no tiene fila en la base.
   */
  const guardar = async (carga) => {
    const esNuevo = aMarcar?.id === null;

    await (esNuevo
      ? CrearDocumentoEmpleado(id, carga)
      : ActualizarDocumentoEmpleado(aMarcar.id, carga));

    setAMarcar(null);
    toast.success(esNuevo ? "Documento registrado." : "Documento actualizado.");
    recargar();
  };

  /**
   * Subir necesita que el documento EXISTA, porque el archivo cuelga de su fila.
   *
   * Si viene con id nulo se crea primero, en Pendiente y sin fecha: la fecha la
   * pone el propio modal de subida si corresponde. Sin este paso, subir el
   * escaneo de un documento que nadie ha tocado fallaría con un 404 que el usuario
   * no podría interpretar.
   */
  const subir = async (archivo, opciones) => {
    let documentoId = aSubir?.id;

    if (documentoId === null || documentoId === undefined) {
      const creada = await CrearDocumentoEmpleado(id, {
        tipoId: aSubir.tipoId,
        etiqueta: aSubir.permiteMultiples ? aSubir.etiqueta : null,
        estado: "Pendiente",
      });

      documentoId = creada?.documentos?.find(
        (fila) =>
          fila.tipoId === aSubir.tipoId &&
          (fila.etiqueta ?? null) === (aSubir.etiqueta ?? null) &&
          fila.id !== null,
      )?.id;

      if (!documentoId) throw new Error("No se pudo preparar el documento para subir el archivo.");
    }

    await SubirArchivoDocumento(documentoId, archivo, opciones);
    setASubir(null);
    toast.success("Archivo subido.");
    recargar();
  };

  /**
   * Un documento de varios ejemplares necesita etiqueta ANTES de tener archivo.
   *
   * Sin este desvío se crearía una fila sin identificar, y con dos hijos nadie
   * podría saber de quién es cada partida. Se manda al modal de registro, que es
   * el que pide el nombre.
   */
  const pedirSubida = (documento) => {
    if (documento.permiteMultiples && documento.id === null) {
      toast.info("Primero registre de quién es este documento y luego suba el archivo.");
      setAMarcar(documento);
      return;
    }
    setASubir(documento);
  };

  const descargar = (documento) =>
    ejecutar(() =>
      DescargarArchivoDocumento(documento.id, {
        nombre: documento.archivo?.nombreOriginal,
      }),
    );

  const quitar = (documento) =>
    ejecutar(
      () => EliminarDocumentoEmpleado(documento.id),
      `${documento.tipoNombre} se quitó del expediente.`,
    );

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando la documentación…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !documentacion) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar la documentación</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const faltanDatos =
    documentacion.estadoCivil === null || documentacion.numeroHijos === null;

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} pendientesDocumentos={documentacion.pendientes} />

      {documentacion.avisos.map((aviso) => (
        <Aviso key={aviso} $tono="aviso">
          {aviso}
          {/* El aviso de datos faltantes se acompaña del atajo para arreglarlo:
              decir qué falta sin decir dónde obliga a buscarlo. */}
          {faltanDatos && aviso.startsWith("Falta registrar") && (
            <>
              {" "}
              <Link to={`${RUTA_BASE}/empleados/${id}/editar`}>Completar la ficha</Link>
            </>
          )}
        </Aviso>
      ))}

      <Rejilla $min={180}>
        <Kpi $tono="exito">
          <KpiTitulo>Entregados</KpiTitulo>
          <KpiValor $tono="exito">{documentacion.entregados}</KpiValor>
        </Kpi>
        <Kpi $tono="aviso">
          <KpiTitulo>Pendientes</KpiTitulo>
          <KpiValor $tono="aviso">{documentacion.pendientes}</KpiValor>
        </Kpi>
        <Kpi $tono="info">
          <KpiTitulo>Sin digitalizar</KpiTitulo>
          <KpiValor $tono="info">{documentacion.sinArchivo}</KpiValor>
        </Kpi>
        <Kpi $tono="neutro">
          <KpiTitulo>No aplican</KpiTitulo>
          <KpiValor $tono="neutro">{documentacion.noAplica}</KpiValor>
        </Kpi>
      </Rejilla>

      <Tarjeta>
        <Acciones>
          <TextoTenue>
            Estado civil:{" "}
            <strong>
              {documentacion.estadoCivil
                ? (ETIQUETA_ESTADO_CIVIL[documentacion.estadoCivil] ?? documentacion.estadoCivil)
                : "sin registrar"}
            </strong>
          </TextoTenue>
          <TextoTenue>
            Hijos:{" "}
            <strong>
              {documentacion.numeroHijos === null ? "sin registrar" : documentacion.numeroHijos}
            </strong>
          </TextoTenue>
          <TextoTenue>
            Conduce: <strong>{documentacion.conduce ? "sí" : "no"}</strong>
          </TextoTenue>
        </Acciones>
      </Tarjeta>

      <Tarjeta $sinRelleno>
        {documentacion.documentos.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaFolderOpen" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>No hay documentos configurados</strong>
            <TextoTenue>
              Defina los tipos de documento en Configuración para que empiecen a pedirse.
            </TextoTenue>
          </Vacio>
        ) : (
          <TablaDocumentos
            documentos={documentacion.documentos}
            ocupado={ocupado}
            onSubir={pedirSubida}
            onMarcar={setAMarcar}
            onDescargar={descargar}
            onQuitar={quitar}
          />
        )}
      </Tarjeta>

      <ModalSubirDocumento
        abierto={aSubir !== null}
        documento={aSubir}
        onCerrar={() => setASubir(null)}
        onConfirmar={subir}
      />

      <ModalMarcarDocumento
        abierto={aMarcar !== null}
        documento={aMarcar}
        onCerrar={() => setAMarcar(null)}
        onConfirmar={guardar}
      />
    </Contenedor>
  );
};

export default ColDocumentos;
