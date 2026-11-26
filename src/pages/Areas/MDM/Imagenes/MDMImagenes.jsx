import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import { useTheme } from "context/ThemeContext";
import { useAuthContext } from "context/authContext";
import { ContainerUI } from "components/UI/Components/ContainerUI";
import { TextUI } from "components/UI/Components/TextUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { InputUI } from "components/UI/Components/InputUI";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { IconUI } from "components/UI/Components/IconsUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import {
  getImagenesMDM,
  getPngImagenMDM,
  nuevaVersionImagen,
  reemplazarImagenMDM,
} from "services/mdmImagenesService";
import { puedeEditarRecurso } from "utils/permisosRecurso";
import {
  CirculoIcono,
  Contenedor,
  Encabezado,
  Fila,
  FiltroGrupo,
  FiltrosContainer,
  OPCIONES_FILAS,
  PageInput,
  PiePaginacion,
  Tabla,
  TablaScroll,
  TarjetaFlexible,
  Td,
  Th,
  Vacio,
} from "../AdministracionProductos/compartido";

const RECURSO_MDM_IMAGENES = "mdm.imagenes";
const DEBOUNCE_BUSQUEDA_MS = 500;
const TAMANIO_MINIATURA = 40;

const TODAS = { value: "TODAS", label: "Todas" };
const OPCIONES_EMPRESAS = [TODAS, ...["AUTOLLANTA", "IKONIX", "MAXXIMUNDO", "STOX"].map((e) => ({ value: e, label: e }))];
const OPCIONES_LINEAS = [
  TODAS,
  ...["LLANTAS", "LLANTAS MOTO", "LUBRICANTES", "HERRAMIENTAS"].map((l) => ({ value: l, label: l })),
];
const OPCIONES_IMAGEN = [
  { value: "todas", label: "Todas" },
  { value: "con", label: "Con imágenes" },
  { value: "sin", label: "Sin imágenes" },
];

const TIPOS = {
  png: { mime: "image/png", titulo: "PNG", campoRuta: "RUTA_IMAGEN_PNG", campoExiste: "PNG_EXISTE" },
  webp: { mime: "image/webp", titulo: "WebP", campoRuta: "RUTA_IMAGEN_WEB", campoExiste: "WEBP_EXISTE" },
};

const claveItem = (item) => `${item.EMPRESA}|${item.IDENTIFICADOR}`;

/* ----------------------- Estilos ----------------------- */

const CeldaImagen = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Miniatura = styled.button`
  position: relative;
  width: ${TAMANIO_MINIATURA}px;
  height: ${TAMANIO_MINIATURA}px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $vacia }) => ($vacia ? "#e5e7eb" : "#fff")};
  color: #6b7280;
  font-size: 7px;
  line-height: 1.1;
  text-align: center;
  cursor: ${({ $vacia }) => ($vacia ? "default" : "zoom-in")};

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const BotonEditar = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary}14;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VisorImagen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: min(60vh, 480px);
  border-radius: 8px;
  background: #f3f4f6;
  overflow: hidden;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const RutaTexto = styled.code`
  display: block;
  padding: 8px 10px;
  margin-bottom: 12px;
  border-radius: 6px;
  font-size: 13px;
  word-break: break-all;
  background: ${({ theme }) => theme.colors.backgroundLight};
  color: ${({ theme }) => theme.colors.text};
`;

/* ----------------------- Fuente de la imagen ----------------------- */

/**
 * Origen mostrable de una imagen. WebP sale de la URL pública de R2 y PNG se
 * descarga del backend (SharePoint no tiene URL pública), ambos con un decimal
 * anti-caché que cambia cada vez que se recarga o se reemplaza la imagen.
 * Devuelve { src, estado } con estado "cargando" | "ok" | "no-disponible".
 */
function useFuenteImagen(item, tipo) {
  const existe = item[TIPOS[tipo].campoExiste];
  const ruta = item[TIPOS[tipo].campoRuta];
  const version = item[tipo === "png" ? "_vPng" : "_vWeb"];
  const [pngSrc, setPngSrc] = useState(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setFallo(false);
    if (tipo !== "png" || !ruta || existe === false) {
      setPngSrc(null);
      return undefined;
    }
    let activo = true;
    let urlObjeto = null;
    getPngImagenMDM({ empresa: item.EMPRESA, identificador: item.IDENTIFICADOR, version })
      .then((blob) => {
        if (!activo) return;
        urlObjeto = URL.createObjectURL(blob);
        setPngSrc(urlObjeto);
      })
      .catch(() => activo && setFallo(true));
    return () => {
      activo = false;
      if (urlObjeto) URL.revokeObjectURL(urlObjeto);
    };
  }, [tipo, ruta, existe, version, item.EMPRESA, item.IDENTIFICADOR]);

  if (!ruta || existe === false || fallo) return { src: null, estado: "no-disponible", setFallo };
  if (tipo === "webp") {
    return { src: item.URL_WEBP ? `${item.URL_WEBP}?${version}` : null, estado: item.URL_WEBP ? "ok" : "no-disponible", setFallo };
  }
  return { src: pngSrc, estado: pngSrc ? "ok" : "cargando", setFallo };
}

function ImagenCelda({ item, tipo, puedeEditar, subiendo, onVer, onEditar, theme }) {
  const { src, estado, setFallo } = useFuenteImagen(item, tipo);
  const vacia = estado === "no-disponible";

  return (
    <CeldaImagen>
      <Miniatura
        theme={theme}
        type="button"
        $vacia={vacia}
        disabled={vacia}
        title={vacia ? "Imagen no disponible" : "Ver imagen"}
        onClick={() => !vacia && src && onVer(item, tipo, src)}
      >
        {estado === "ok" && <img src={src} alt={item.NOMBRE} onError={() => setFallo(true)} />}
        {estado === "cargando" && <IconUI name="FaSpinner" size={12} color="#6b7280" />}
        {vacia && <IconUI name="FaFileImage" size={18} color="#9ca3af" />}
      </Miniatura>
      {puedeEditar && (
        <BotonEditar
          theme={theme}
          type="button"
          disabled={subiendo}
          title={`Reemplazar imagen ${TIPOS[tipo].titulo}`}
          onClick={() => onEditar(item, tipo)}
        >
          <IconUI name={subiendo ? "FaSpinner" : "FaPenToSquare"} size={13} color={theme.colors.primary} />
        </BotonEditar>
      )}
    </CeldaImagen>
  );
}

/* ----------------------- Pantalla ----------------------- */

function MDMImagenes() {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const puedeEditar = useMemo(() => puedeEditarRecurso(user, RECURSO_MDM_IMAGENES), [user]);

  const [empresa, setEmpresa] = useState(TODAS);
  const [linea, setLinea] = useState(TODAS);
  const [imagen, setImagen] = useState(OPCIONES_IMAGEN[0]);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(OPCIONES_FILAS[1]);

  const [items, setItems] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [subiendo, setSubiendo] = useState({}); // { "clave|tipo": true }
  const [visor, setVisor] = useState(null); // { item, tipo, src }
  const inputArchivoRef = useRef(null);
  const pendienteRef = useRef(null); // { item, tipo } elegido antes de abrir el selector

  /* La búsqueda se aplica con un pequeño retraso para no consultar por cada tecla */
  useEffect(() => {
    const timeout = setTimeout(() => {
      const texto = busquedaInput.trim();
      if (texto === busqueda) return;
      setBusqueda(texto);
      setPage(1);
    }, DEBOUNCE_BUSQUEDA_MS);
    return () => clearTimeout(timeout);
  }, [busquedaInput, busqueda]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getImagenesMDM({
        empresa: empresa.value,
        linea: linea.value,
        imagen: imagen.value,
        busqueda: busqueda || null,
        page,
        size: size.value,
      });
      /* Cada carga genera un decimal nuevo por imagen: nunca se reutiliza una versión en caché */
      setItems(
        (data?.Items || []).map((item) => ({
          ...item,
          _vPng: nuevaVersionImagen(),
          _vWeb: nuevaVersionImagen(),
        }))
      );
      setPaginacion(data?.Paginacion || null);
    } catch (err) {
      console.error("Error al consultar las imágenes del MDM:", err);
      setItems([]);
      setPaginacion(null);
      setError(true);
      toast.error("No se pudo obtener el listado de artículos");
    } finally {
      setLoading(false);
    }
  }, [empresa, linea, imagen, busqueda, page, size]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltro = (setter) => (opt) => {
    if (!opt) return;
    setter(opt);
    setPage(1);
  };

  /* ------------------------- Reemplazo de imagen ------------------------- */

  const pedirArchivo = (item, tipo) => {
    pendienteRef.current = { item, tipo };
    /* El tipo elegido limita el selector: PNG solo acepta .png y WebP solo .webp */
    inputArchivoRef.current.accept = `${TIPOS[tipo].mime},.${tipo}`;
    inputArchivoRef.current.value = "";
    inputArchivoRef.current.click();
  };

  const alElegirArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    const pendiente = pendienteRef.current;
    pendienteRef.current = null;
    if (!archivo || !pendiente) return;

    const { item, tipo } = pendiente;
    if (archivo.type !== TIPOS[tipo].mime) {
      toast.error(`Solo se permiten archivos ${TIPOS[tipo].titulo} para esta imagen`);
      return;
    }

    const clave = `${claveItem(item)}|${tipo}`;
    setSubiendo((prev) => ({ ...prev, [clave]: true }));
    try {
      const resultado = await reemplazarImagenMDM({
        empresa: item.EMPRESA,
        identificador: item.IDENTIFICADOR,
        tipo,
        archivo,
      });
      /* Actualización en caliente: se renueva el decimal anti-caché del artículo y de los que
         comparten el mismo archivo, sin recargar el listado. */
      const campoRuta = TIPOS[tipo].campoRuta;
      const campoVersion = tipo === "png" ? "_vPng" : "_vWeb";
      const campoExiste = TIPOS[tipo].campoExiste;
      const ruta = resultado.Item[campoRuta];
      const claveSubida = claveItem(item);
      setItems((prev) =>
        prev.map((fila) => {
          if (claveItem(fila) === claveSubida) {
            /* El propio artículo: toma la ruta (puede ser nueva) y la URL que devolvió el backend */
            return {
              ...fila,
              [campoRuta]: ruta,
              [campoExiste]: true,
              ...(tipo === "webp" ? { URL_WEBP: resultado.Item.URL_WEBP } : {}),
              [campoVersion]: nuevaVersionImagen(),
            };
          }
          return fila[campoRuta] === ruta
            ? { ...fila, [campoExiste]: true, [campoVersion]: nuevaVersionImagen() }
            : fila;
        })
      );
      const otros = (resultado.ArticulosCompartiendoArchivo || 1) - 1;
      toast.success(
        otros > 0
          ? `Imagen ${TIPOS[tipo].titulo} actualizada (también la usan ${otros} artículo${otros === 1 ? "" : "s"} más)`
          : `Imagen ${TIPOS[tipo].titulo} actualizada`
      );
    } catch (err) {
      console.error("Error al reemplazar la imagen:", err);
      toast.error(err?.response?.data?.message || "No se pudo reemplazar la imagen");
    } finally {
      setSubiendo((prev) => {
        const siguiente = { ...prev };
        delete siguiente[clave];
        return siguiente;
      });
    }
  };

  /* ------------------------- Visor ------------------------- */

  const abrirVisor = (item, tipo, src) => setVisor({ item, tipo, src });

  /* ------------------------- Contenido ------------------------- */

  const totalPaginas = paginacion?.totalPages || 1;

  const irAPagina = (nueva) => setPage(Math.min(Math.max(1, nueva), totalPaginas));

  const renderContenido = () => {
    if (loading) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.primary}>
            <IconUI name="FaSpinner" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Cargando artículos...</TextUI>
        </Vacio>
      );
    }

    if (error) {
      return (
        <Vacio>
          <CirculoIcono $color={theme.colors.error}>
            <IconUI name="FaTriangleExclamation" size={28} color={theme.colors.error} />
          </CirculoIcono>
          <TextUI weight="bold">No se pudo cargar la información</TextUI>
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={cargar} />
        </Vacio>
      );
    }

    if (!items.length) {
      return (
        <Vacio>
          <CirculoIcono>
            <IconUI name="FaImage" size={28} color={theme.colors.primary} />
          </CirculoIcono>
          <TextUI weight="bold">Sin artículos encontrados</TextUI>
          <TextUI color={theme.colors.textSecondary}>No hay artículos con los filtros seleccionados.</TextUI>
        </Vacio>
      );
    }

    return (
      <>
        <TablaScroll>
          <Tabla>
            <thead>
              <tr>
                <Th>Empresa</Th>
                <Th>Código SAP</Th>
                <Th>Artículo</Th>
                <Th>Imagen PNG</Th>
                <Th>Imagen WebP</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const clave = claveItem(item);
                return (
                  <Fila key={clave} $par={index % 2 === 0}>
                    <Td>{item.EMPRESA}</Td>
                    <Td>{item.IDENTIFICADOR}</Td>
                    <Td $wrap>{item.NOMBRE || "—"}</Td>
                    {["png", "webp"].map((tipo) => (
                      <Td key={tipo}>
                        <ImagenCelda
                          item={item}
                          tipo={tipo}
                          theme={theme}
                          puedeEditar={puedeEditar}
                          subiendo={Boolean(subiendo[`${clave}|${tipo}`])}
                          onVer={abrirVisor}
                          onEditar={pedirArchivo}
                        />
                      </Td>
                    ))}
                  </Fila>
                );
              })}
            </tbody>
          </Tabla>
        </TablaScroll>

        <PiePaginacion theme={theme}>
          <TextUI size="13px" color={theme.colors.textSecondary}>
            Mostrando {items.length} de {paginacion?.total ?? 0} registros
          </TextUI>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonUI iconLeft="FaArrowLeft" onClick={() => irAPagina(page - 1)} disabled={page <= 1} />
            <PageInput
              theme={theme}
              type="number"
              min={1}
              max={totalPaginas}
              value={page}
              onChange={(e) => irAPagina(Number(e.target.value) || 1)}
            />
            <TextUI size="13px" color={theme.colors.textSecondary}>
              de {totalPaginas}
            </TextUI>
            <ButtonUI iconLeft="FaArrowRight" onClick={() => irAPagina(page + 1)} disabled={page >= totalPaginas} />
          </div>

          <SelectUI
            options={OPCIONES_FILAS}
            value={size}
            onChange={cambiarFiltro((opt) => setSize(opt))}
            minWidth="140px"
            maxWidth="160px"
            isSearchable={false}
            menuPlacement="top"
          />
        </PiePaginacion>
      </>
    );
  };

  return (
    <ContainerUI
      width="100%"
      height="100%"
      justifyContent="flex-start"
      alignItems="flex-start"
      style={{ padding: 0, overflow: "hidden" }}
    >
      <Contenedor theme={theme}>
        <Encabezado>
          <TextUI weight="bold" size="22px">
            MDM Imágenes
          </TextUI>
        </Encabezado>

        <FiltrosContainer theme={theme}>
          <SelectUI
            label="Empresa"
            options={OPCIONES_EMPRESAS}
            value={empresa}
            onChange={cambiarFiltro(setEmpresa)}
            isSearchable={false}
            minWidth="180px"
            maxWidth="220px"
          />

          <SelectUI
            label="Línea de negocio"
            options={OPCIONES_LINEAS}
            value={linea}
            onChange={cambiarFiltro(setLinea)}
            isSearchable={false}
            minWidth="200px"
            maxWidth="240px"
          />

          <SelectUI
            label="Imagen"
            options={OPCIONES_IMAGEN}
            value={imagen}
            onChange={cambiarFiltro(setImagen)}
            isSearchable={false}
            minWidth="180px"
            maxWidth="220px"
          />

          <FiltroGrupo theme={theme} style={{ minWidth: "300px" }}>
            <label>Buscar</label>
            <InputUI
              placeholder="Código SAP, código de barras o nombre..."
              value={busquedaInput}
              onChange={setBusquedaInput}
              iconLeft="FaMagnifyingGlass"
            />
          </FiltroGrupo>

          <div>
            <ButtonUI
              iconLeft="FaRotateRight"
              variant="outlined"
              onClick={cargar}
              disabled={loading}
              title="Refrescar el listado con los filtros aplicados"
            />
          </div>
        </FiltrosContainer>

        <TarjetaFlexible theme={theme}>{renderContenido()}</TarjetaFlexible>
      </Contenedor>

      {/* Selector de archivo compartido: su `accept` se ajusta al tipo antes de abrirlo */}
      <input ref={inputArchivoRef} type="file" style={{ display: "none" }} onChange={alElegirArchivo} />

      <ModalUI
        isOpen={Boolean(visor)}
        onClose={() => setVisor(null)}
        title={visor ? `Imagen ${TIPOS[visor.tipo].titulo} · ${visor.item.IDENTIFICADOR}` : ""}
        maxWidth="640px"
        width="90%"
        showSaveButton={false}
        cancelText="Cerrar"
      >
        {visor && (
          <>
            <TextUI size="13px" color={theme.colors.textSecondary}>
              {visor.item.NOMBRE}
            </TextUI>
            <RutaTexto theme={theme}>{visor.item[TIPOS[visor.tipo].campoRuta]}</RutaTexto>
            <VisorImagen>
              <img src={visor.src} alt={visor.item.NOMBRE} />
            </VisorImagen>
          </>
        )}
      </ModalUI>
    </ContainerUI>
  );
}

export default MDMImagenes;
