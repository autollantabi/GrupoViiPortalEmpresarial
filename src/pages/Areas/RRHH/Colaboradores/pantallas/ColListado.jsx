import React, { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import IconUI from "components/UI/Components/IconsUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { useTheme } from "context/ThemeContext";
import { ListarColaboradores, ListarEmpresas } from "services/colaboradoresService";
import { TablaColaboradores } from "../componentes/TablaColaboradores";
import { FiltroPastillas } from "../componentes/FiltroPastillas";
import { useConsulta, useDebounce } from "../hooks/useConsulta";
import { usePermisosColaboradores } from "../hooks/usePermisos";
import {
  ESTADO,
  ESTADO_TODOS,
  POR_PAGINA,
  RUTA_BASE,
  nombreCortoEmpresa,
} from "../utils/constantes";
import {
  Acciones,
  CirculoIcono,
  Contenedor,
  Encabezado,
  Filtros,
  PiePaginacion,
  Subtitulo,
  Tarjeta,
  TextoTenue,
  Titulo,
  Vacio,
} from "../componentes/piezas";

/**
 * Listado de colaboradores.
 *
 * Los filtros y la página viven en la QUERY STRING, no en el estado del
 * componente. Es deliberado y es la razón por la que la sección necesita URLs
 * reales: así /rrhh/colaboradores/empleados?q=perez&empresaId=2&page=3 es un
 * enlace que se puede compartir, el botón atrás recorre los filtros, y los
 * enlaces del tablero por empresa llegan con el filtro ya aplicado.
 *
 * La paginación es de SERVIDOR: la página va al API, no se recorta en memoria.
 */

const ESTADOS_FILTRO = [
  { valor: ESTADO_TODOS, etiqueta: "Todos" },
  { valor: ESTADO.ACTIVO, etiqueta: "Activos" },
  { valor: ESTADO.INACTIVO, etiqueta: "De baja" },
];

/** Con qué estado abre el listado si la URL no dice otra cosa. */
const ESTADO_POR_DEFECTO = ESTADO.ACTIVO;

export const ColListado = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { puedeGestionar: puedeGestionarSegunContexto } = usePermisosColaboradores();

  const q = params.get("q") ?? "";
  const estado = params.get("estado") ?? ESTADO_POR_DEFECTO;
  const empresaId = params.get("empresaId") ?? "";
  const pagina = Math.max(1, Number(params.get("page")) || 1);

  // El texto se escribe en estado local y se lleva a la URL con retraso: así no
  // se ensucia el historial con una entrada por tecla ni se dispara una petición
  // por carácter.
  const [texto, setTexto] = useState(q);
  const textoRetrasado = useDebounce(texto, 350);

  const empresas = useConsulta(({ signal }) => ListarEmpresas({ signal }), []);

  const filtros = useMemo(
    () => ({
      buscar: textoRetrasado.trim() || undefined,
      estado: estado === ESTADO_TODOS ? undefined : estado,
      empresaId: empresaId || undefined,
      page: pagina,
      pageSize: POR_PAGINA,
    }),
    [textoRetrasado, estado, empresaId, pagina],
  );

  const { datos, cargando, error, recargar } = useConsulta(
    ({ signal }) => ListarColaboradores(filtros, { signal }),
    [textoRetrasado, estado, empresaId, pagina],
  );

  // El servidor manda: devuelve puedeGestionar en el listado, y para quien es de
  // consulta ya viene filtrado a activos aunque se pida otra cosa en la URL. El
  // contexto local solo evita que la pantalla parpadee antes de la primera
  // respuesta.
  const puedeGestionar = datos?.puedeGestionar ?? puedeGestionarSegunContexto;

  /** Todo cambio de filtro vuelve a la página 1. */
  const cambiarFiltro = useCallback(
    (cambios, { reiniciarPagina = true } = {}) => {
      setParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos);
          Object.entries(cambios).forEach(([clave, valor]) => {
            if (valor === undefined || valor === null || valor === "") siguientes.delete(clave);
            else siguientes.set(clave, String(valor));
          });
          if (reiniciarPagina) siguientes.delete("page");
          return siguientes;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // El texto retrasado se sincroniza con la URL cuando deja de cambiar.
  const qEnUrl = q;
  React.useEffect(() => {
    if (textoRetrasado.trim() !== qEnUrl) cambiarFiltro({ q: textoRetrasado.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoRetrasado]);

  const opcionesEmpresa = useMemo(
    () => [
      { valor: "", etiqueta: "Todas" },
      ...(empresas.datos ?? []).map((empresa) => ({
        valor: String(empresa.id),
        etiqueta: nombreCortoEmpresa(empresa.nombre),
      })),
    ],
    [empresas.datos],
  );

  const totalPaginas = datos?.totalPages ?? 0;
  const total = datos?.total ?? 0;
  const desde = total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, total);

  const renderContenido = () => {
    if (cargando) return <LoaderUI text="Cargando el personal…" height="260px" />;

    if (error) {
      return (
        <Vacio>
          <CirculoIcono $tono="peligro">
            <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
          </CirculoIcono>
          <strong>No se pudo cargar el listado</strong>
          <TextoTenue>{error}</TextoTenue>
          <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
        </Vacio>
      );
    }

    if (!datos || datos.items.length === 0) {
      const hayFiltros = Boolean(textoRetrasado.trim()) || empresaId || estado !== ESTADO_TODOS;
      return (
        <Vacio>
          <CirculoIcono $tono="neutro">
            <IconUI name="FaMagnifyingGlass" size={24} color={theme?.colors?.textSecondary} />
          </CirculoIcono>
          <strong>
            {hayFiltros
              ? "Ningún colaborador coincide con los filtros"
              : "Todavía no hay colaboradores registrados"}
          </strong>
          {hayFiltros && (
            <ButtonUI
              text="Quitar filtros"
              variant="outlined"
              iconLeft="FaXmark"
              onClick={() => {
                setTexto("");
                setParams({}, { replace: true });
              }}
            />
          )}
        </Vacio>
      );
    }

    return (
      <>
        <TablaColaboradores
          filas={datos.items}
          puedeGestionar={puedeGestionar}
          onAbrir={(fila) => navigate(`${RUTA_BASE}/empleados/${fila.id}`)}
        />
        <PiePaginacion>
          <span>
            Mostrando {desde}–{hasta} de {total}
          </span>
          <Acciones>
            <ButtonUI
              text="Anterior"
              iconLeft="FaArrowLeft"
              variant="outlined"
              disabled={pagina <= 1}
              onClick={() => cambiarFiltro({ page: pagina - 1 }, { reiniciarPagina: false })}
            />
            <span>
              Página {pagina} de {Math.max(1, totalPaginas)}
            </span>
            <ButtonUI
              text="Siguiente"
              iconRight="FaArrowRight"
              variant="outlined"
              disabled={pagina >= totalPaginas}
              onClick={() => cambiarFiltro({ page: pagina + 1 }, { reiniciarPagina: false })}
            />
          </Acciones>
        </PiePaginacion>
      </>
    );
  };

  return (
    <Contenedor translate="no" className="notranslate">
      <Encabezado>
        <div>
          <Titulo>Personal</Titulo>
          <Subtitulo>
            {total > 0 ? `${total} ficha${total === 1 ? "" : "s"}` : "Listado de colaboradores"}
          </Subtitulo>
        </div>
        <Acciones>
          <ButtonUI
            text="Volver al tablero"
            iconLeft="FaArrowLeft"
            variant="ghost"
            onClick={() => navigate(RUTA_BASE)}
          />
          {puedeGestionar && (
            <ButtonUI
              text="Registrar ingreso"
              iconLeft="FaUserPlus"
              onClick={() => navigate(`${RUTA_BASE}/empleados/nuevo`)}
            />
          )}
        </Acciones>
      </Encabezado>

      <Tarjeta>
        <Filtros>
          <div style={{ minWidth: 240, flex: "1 1 240px" }}>
            <InputUI
              type="search"
              placeholder="Buscar por nombre, cédula, correo, extensión o teléfono"
              value={texto}
              onChange={setTexto}
              iconLeft="FaMagnifyingGlass"
            />
          </div>
          {/* Con acceso de consulta no hay filtro de estado: el servidor solo
              devuelve activos, así que ofrecerlo sería mentir. */}
          {puedeGestionar && (
            <FiltroPastillas
              leyenda="Estado"
              opciones={ESTADOS_FILTRO}
              value={estado}
              // Se borra el parámetro solo cuando coincide con el valor por
              // omisión, así la URL queda limpia en el caso normal. "Todos" SÍ se
              // guarda explícito: si se borrara, el valor por omisión lo
              // devolvería a "Activos" y el filtro no se podría desactivar.
              onChange={(valor) =>
                cambiarFiltro({ estado: valor === ESTADO_POR_DEFECTO ? "" : valor })
              }
            />
          )}
          <FiltroPastillas
            leyenda="Empresa"
            opciones={opcionesEmpresa}
            value={empresaId}
            onChange={(valor) => cambiarFiltro({ empresaId: valor })}
            disabled={empresas.cargando}
          />
        </Filtros>
      </Tarjeta>

      <Tarjeta $sinRelleno>{renderContenido()}</Tarjeta>
    </Contenedor>
  );
};

export default ColListado;
