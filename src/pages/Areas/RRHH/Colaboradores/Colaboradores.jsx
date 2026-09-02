import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ColTablero } from "./pantallas/ColTablero";
import { ColListado } from "./pantallas/ColListado";
import { ColFicha } from "./pantallas/ColFicha";
import { ColNuevo } from "./pantallas/ColNuevo";
import { ColEditar } from "./pantallas/ColEditar";
import { ColDotacion } from "./pantallas/ColDotacion";
import { ColDocumentos } from "./pantallas/ColDocumentos";
import { ColConfiguracion } from "./pantallas/ColConfiguracion";
import { usePermisosColaboradores } from "./hooks/usePermisos";
import { RUTA_BASE } from "./utils/constantes";

/**
 * Punto de entrada de Colaboradores (RRHH).
 *
 * Es UNA sola opción de menú, pero por dentro son cinco pantallas con URLs
 * reales, igual que funcionaba el Intranet: al entrar se ve el tablero y desde
 * ahí se navega al resto. Eso conserva los enlaces compartibles, el botón atrás
 * del navegador y los filtros en la query string.
 *
 * Para que las <Routes> anidadas funcionen, la entrada de este módulo en
 * src/router/Routes.js lleva `subrutas: true`, que hace que generateRoutes()
 * registre la ruta como /rrhh/colaboradores/*. Si eso faltara, React Router
 * avisa en consola: "You rendered descendant <Routes> ... no trailing *".
 *
 * Las props que inyecta cloneElement en SimpleRouter solo llegan a este
 * componente raíz, así que se reparten a mano a cada pantalla.
 *
 * No renderiza cabecera ni menús: de eso se encarga TemplatePaginas.
 */
export const Colaboradores = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
  availableCanales = [],
}) => {
  const { puedeGestionar } = usePermisosColaboradores();
  const contexto = { routeConfig, availableCompanies, availableLines, availableCanales };

  /**
   * Con acceso de consulta las rutas de gestión no existen: la ficha, el alta y
   * la edición redirigen al listado. Sin esto, escribir la URL a mano seguiría
   * abriendo la pantalla (aunque el API la rechazaría con 403).
   */
  const soloGestion = (elemento) =>
    puedeGestionar ? elemento : <Navigate to={`${RUTA_BASE}/empleados`} replace />;

  return (
    <Routes>
      <Route index element={<ColTablero {...contexto} />} />
      <Route path="empleados" element={<ColListado {...contexto} />} />
      {/* "nuevo" antes que ":id" por legibilidad; React Router ya prioriza el estático. */}
      <Route path="empleados/nuevo" element={soloGestion(<ColNuevo {...contexto} />)} />
      <Route path="empleados/:id" element={soloGestion(<ColFicha {...contexto} />)} />
      <Route path="empleados/:id/editar" element={soloGestion(<ColEditar {...contexto} />)} />
      {/* Pestañas de la ficha. Tienen URL propia para que el enlace sea
          compartible y el botón atrás recorra las pestañas, igual que los filtros
          del listado viven en la query string. */}
      <Route path="empleados/:id/dotacion" element={soloGestion(<ColDotacion {...contexto} />)} />
      <Route path="empleados/:id/documentos" element={soloGestion(<ColDocumentos {...contexto} />)} />
      {/* La configuración de dotación y documentos vive DENTRO de esta sección y
          no como opción de menú aparte: así no hay que otorgar un recurso nuevo a
          cada usuario de RRHH para que la vea. Sus secciones van en la query
          string (?seccion=), el mismo idioma que usa ColListado. */}
      <Route path="configuracion" element={soloGestion(<ColConfiguracion {...contexto} />)} />
      <Route path="*" element={<Navigate to={RUTA_BASE} replace />} />
    </Routes>
  );
};

export default Colaboradores;
