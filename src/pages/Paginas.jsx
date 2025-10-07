import React, { useEffect, useState } from "react";
import { MODULES_FLAT, MODULES_TREE } from "config/constantsModulePermissions";

import TemplatePaginas from "components/layout/TemplatePaginas";
import Portal from "./home/Portal";
import InicioSesion from "./auth/InicioSesion";
import PasswordRecovery from "./auth/PasswordRecovery";
import { ComponenteAdministracionUsuario } from "./Areas/AdministracionUsu/ComponentesAdmin/EleccionAccion";
import { RegistrosBancarios } from "./Areas/Cartera/RegistrosBancarios/RegistrosBancarios";
import { DesbloqueoClientes } from "./Areas/Cartera/DesbloqueoClientes/DesbloqueoClientes";
import { GestionCheques } from "./Areas/Cartera/GestionCheques/GestionCheques";
import { RegistrosBancariosHistorial } from "./Areas/Cartera/RegistrosBancariosHistorial/RegistrosBancariosHistorial";
import { Cartera_CargarTransferencias } from "./Areas/Cartera/CargarTransferencias/Cartera_CargarTransferencias";
import { Compras_Reportes } from "./Areas/Compras/Reportes/Compras_Reportes";
import { Importaciones } from "./Areas/Compras/Importaciones/Importaciones";
import { Creditos } from "./Areas/Compras/Creditos/Creditos";
import { Anticipos } from "./Areas/Compras/Anticipos/Anticipos";
import { ComisionesMayoristas } from "./Areas/Contabilidad/Comisiones/Mayoristas/ReporteComisionesMayoristas";
import { ComisionesTecnicentroContainer } from "./Areas/Contabilidad/Comisiones/Tecnicentro/ComisionesTecnicentro";
import { ComisionesTecnicentroCategoriasContainer } from "./Areas/Contabilidad/Comisiones/Tecnicentro/ComisionesTecnicentroCategorias";
import { ReportesGestionClientes } from "./Areas/Gestion de Clientes/Reportes/ReportesGestionClientes";
import GeneralMaestros from "./Areas/Gobierno de Datos/Maestros/GeneralMaestros";
import { ConsultaMarketing } from "./Areas/Marketing/ConsultaMarketing";
import { Asignacion } from "./Areas/MRP/ComponentesMRP/Asignacion/Asignacion";
import { Parametrizaciones } from "./Areas/MRP/ComponentesMRP/Parametrizacion/Parametrizaciones";
import { Promociones } from "./Areas/MRP/ComponentesMRP/Promociones/Promociones";
import { FileUpload } from "./Areas/MRP/ComponentesMRP/Promociones/Nivel1/CargarArchivo";
import { ConsultaPromociones } from "./Areas/MRP/ComponentesMRP/Promociones/Nivel1/ConsultaPromociones";
import { Simulacion } from "./Areas/MRP/ComponentesMRP/Simulacion/Simulacion";
import { SimulacionComercial } from "./Areas/MRP/ComponentesMRP/SimulacionComercial/SimulacionComercial";
import { Contabilidad_ConversionArchivosBancos } from "./Areas/Contabilidad/ConversionArchivosBancos/Contabilidad_ConversionArchivosBancos";

import { useNavigate } from "react-router-dom";
import { ROUTES_FLAT } from "config/constantsRoutes";
import { consultarPermisosPorModuloID } from "utils/functionsPermissions";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";
import { useAuthContext } from "context/authContext";
import NewInicioSesion from "./auth/NewInicioSesion";
import { Documentacion } from "./Areas/RRHH/Documentacion";
import NotFound from "./NotFound";
import { FacturacionMarketing } from "./Areas/Marketing/FacturacionMarketing";
import { ComercialMarketing } from "./Areas/Marketing/ComercialMarketing";
import { Contabilidad_ReporteFlujoCaja } from "./Areas/Contabilidad/FlujoDeCaja/ReporteFlujoCaja";
import { ComisionesLubricantes } from "./Areas/Contabilidad/Comisiones/Lubricantes/ReporteComisionesLubricantes";
import { TecnicentroReportes } from "./Areas/Tecnicentro/Reportes/TecnicentroReportes";
import { ReportesCYMC } from "./Areas/CYMC/ReportesCYMC";

// Función para buscar el módulo exacto
const buscarModuloExacto = (modulos, moduloBuscado) => {
  for (const modulo of modulos) {
    if (modulo.modulo === moduloBuscado) {
      return modulo.id;
    }

    if (modulo.children && modulo.children.length > 0) {
      const encontrado = buscarModuloExacto(modulo.children, moduloBuscado);
      if (encontrado) {
        return encontrado;
      }
    }
  }
  return null;
};

// Función para obtener los permisos del módulo exacto
const obtenerPermisosDelModulo = (modulos, moduloBuscado) => {
  for (const modulo of modulos) {
    if (modulo.modulo === moduloBuscado) {
      return modulo.permisos || [];
    }

    if (modulo.children && modulo.children.length > 0) {
      const permisos = obtenerPermisosDelModulo(modulo.children, moduloBuscado);
      if (permisos) {
        return permisos;
      }
    }
  }
  return [];
};

const paginas = {
  notFound: {
    componente: <NotFound />,
  },
  homePage: {
    componente: <Portal />,
  },
  inicioSesion: {
    componente: <NewInicioSesion />,
  },
  passwordRecovery: {
    componente: <PasswordRecovery />,
  },
  administracion: {
    seccion: MODULES_FLAT.ADMINISTRACION,
    componente: <ComponenteAdministracionUsuario />,
  },
  cartera_registrosBancarios: {
    seccion: MODULES_FLAT.CARTERA,
    componente: <RegistrosBancarios />,
  },
  cartera_desbloqueoClient: {
    seccion: MODULES_FLAT.CARTERA,
    componente: <DesbloqueoClientes />,
  },
  cartera_gestionCheques: {
    seccion: MODULES_FLAT.CARTERA,
    componente: <GestionCheques />,
  },
  cartera_registrosBancariosHistorial: {
    seccion: MODULES_FLAT.CARTERA,
    componente: <RegistrosBancariosHistorial />,
  },
  cartera_subirArchivo: {
    seccion: MODULES_FLAT.CARTERA,
    componente: <Cartera_CargarTransferencias />,
  },
  compras_reportes: {
    seccion: MODULES_FLAT.COMPRAS,
    componente: <Compras_Reportes />,
  },
  compras_importaciones: {
    seccion: MODULES_FLAT.COMPRAS,
    componente: <Importaciones />,
  },
  compras_creditos: {
    seccion: MODULES_FLAT.COMPRAS,
    componente: <Creditos />,
  },
  compras_anticipos: {
    seccion: MODULES_FLAT.COMPRAS,
    componente: <Anticipos />,
  },
  contabilidad_conversion: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <Contabilidad_ConversionArchivosBancos />,
  },
  contabilidad_reporteFlujoCaja: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <Contabilidad_ReporteFlujoCaja />,
  },
  contabilidad_comisionesMayoristas: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <ComisionesMayoristas />,
  },
  contabilidad_comisionesTecnicentro: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <ComisionesTecnicentroContainer />,
  },
  contabilidad_comisionesTecnicentroCategorias: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <ComisionesTecnicentroCategoriasContainer />,
  },
  contabilidad_comisionesLubricantes: {
    seccion: MODULES_FLAT.CONTABILIDAD,
    componente: <ComisionesLubricantes />,
  },
  gestionClientes_reporte: {
    seccion: MODULES_FLAT.GESTION_CLIENTES,
    componente: <ReportesGestionClientes />,
  },
  gobiernoDatos_maestros: {
    seccion: MODULES_FLAT.GOBIERNO_DATOS,
    componente: <GeneralMaestros />,
  },
  marketing_reportes: {
    seccion: MODULES_FLAT.MARKETING,
    componente: <ConsultaMarketing />,
  },
  marketing_reportes_facturacionMP: {
    seccion: MODULES_FLAT.MARKETING,
    componente: <FacturacionMarketing />,
  },
  marketing_reportes_comercial: {
    seccion: MODULES_FLAT.MARKETING,
    componente: <ComercialMarketing />,
  },
  mrp_asignaciones: {
    seccion: MODULES_FLAT.MRP,
    componente: <Asignacion />,
  },
  mrp_parametrizaciones: {
    seccion: MODULES_FLAT.MRP,
    componente: <Parametrizaciones />,
  },
  mrp_promociones: {
    seccion: MODULES_FLAT.MRP,
    componente: <Promociones />,
  },
  mrp_promocionesArchivo: {
    seccion: MODULES_FLAT.MRP,
    componente: <FileUpload />,
  },
  mrp_promocionesConsulta: {
    seccion: MODULES_FLAT.MRP,
    componente: <ConsultaPromociones />,
  },
  mrp_simulacion: {
    seccion: MODULES_FLAT.MRP,
    componente: <Simulacion />,
  },
  mrp_simulacionComercial: {
    seccion: MODULES_FLAT.MRP,
    componente: <SimulacionComercial />,
  },
  rrhh_documentacion: {
    seccion: MODULES_FLAT.RRHH,
    componente: <Documentacion />,
  },
  tecnicentro_reportes: {
    seccion: MODULES_FLAT.TECNICENTRO,
    componente: <TecnicentroReportes />,
  },
  cymc_reportes: {
    seccion: MODULES_FLAT.CYMC,
    componente: <ReportesCYMC />,
  },
};

export default function Paginas({ tipo, moduleName, internalPage = false }) {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate(); // Hook para redirigir
  const [permisos, setPermisos] = useState(null);
  const [permisos_m, setPermisos_m] = useState(null);
  const [moduleid, setModuleid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!isAuthenticated) {
        navigate(ROUTES_FLAT[MODULES_TREE.LOGIN], { replace: true });
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const modulos = JSON.parse(localStorage.getItem("modulos")) || [];
        let req_moduleid = null;
        let req_permisos = null;
        let permisos_por_modulo = {};

        if (Array.isArray(moduleName)) {
          for (const name of moduleName) {
            const idEncontrado = buscarModuloExacto(modulos, name);
            if (idEncontrado) {
              const permisos = await consultarPermisosPorModuloID({
                moduleid: idEncontrado,
              });

              if (permisos && permisos.length > 0) {
                permisos_por_modulo[name] = permisos;

                if (!req_moduleid) {
                  req_moduleid = idEncontrado;
                  req_permisos = permisos;
                }
              }
            }
          }
          
          setPermisos_m(permisos_por_modulo);
        } else {
          req_moduleid = moduleName
            ? buscarModuloExacto(modulos, moduleName)
            : null;
          req_permisos = await consultarPermisosPorModuloID({
            moduleid: req_moduleid,
          });

          // Para mantener consistencia, también usamos la misma estructura con un solo módulo
          if (moduleName && req_permisos) {
            permisos_por_modulo[moduleName] = req_permisos;
            setPermisos_m(permisos_por_modulo);
          } else {
            setPermisos_m(req_permisos);
          }
        }
        setModuleid(req_moduleid);

        if (!req_moduleid) {
          navigate(ROUTES_FLAT[MODULES_TREE.PORTAL], { replace: true });
          return;
        }

        setPermisos(req_permisos);
        if (!req_moduleid || req_permisos.length === 0) {
          navigate(ROUTES_FLAT[MODULES_TREE.PORTAL], { replace: true });
          return;
        }
      } catch (error) {
        console.log("Error obteniendo permisos: ", error);
        navigate(ROUTES_FLAT[MODULES_TREE.PORTAL], { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isAuthenticated, navigate, moduleName]);

  if (loading) {
    return (
      <CustomContainer width="100%" height="100vh">
        Cargando...
      </CustomContainer>
    );
  }

  const pagina = paginas[tipo] || paginas.notFound; // Si no encuentra, muestra el Home

  return internalPage ? (
    React.cloneElement(pagina.componente, { moduleid, permisos_m })
  ) : (
    <TemplatePaginas seccion={pagina.seccion}>
      {React.cloneElement(pagina.componente, {
        moduleid,
        permisos,
        permisos_m,
      })}
    </TemplatePaginas>
  );
}
