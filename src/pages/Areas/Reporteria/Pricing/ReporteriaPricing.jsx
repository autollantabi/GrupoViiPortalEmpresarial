import React, { useMemo } from "react";
import { TemplateReporteria } from "../TemplateReporteria";
import { useAuthContext } from "context/authContext";

/**
 * Reporte de Pricing
 * Valida el acceso a la empresa 5 mediante el contexto de reportes.pricing
 */
export const ReporteriaPricing = ({
  routeConfig,
  availableCompanies = [],
  availableLines = [],
  availableCanales,
}) => {
  const { user } = useAuthContext();

  // El recurso configurado para esta ruta
  const recursoActual = routeConfig?.recurso || "reportes.pricing";

  // 1. Obtener todos los contextos que dan acceso a este recurso (soporta herencia)
  const contextosRelevantes = useMemo(() => {
    const contextos = user?.CONTEXTOS || user?.data || [];
    if (!Array.isArray(contextos)) return [];
    
    return contextos.filter((ctx) => {
      const contextResource = ctx.RECURSO?.toLowerCase();
      if (!contextResource) return false;
      
      return (
        contextResource === recursoActual.toLowerCase() ||
        (ctx.HERENCIA !== false && recursoActual.toLowerCase().startsWith(contextResource + "."))
      );
    });
  }, [user, recursoActual]);

  // 2. Validar que tenga acceso a la empresa con el id 5 en alguno de los contextos
  const tieneAccesoEmpresa5 = useMemo(() => {
    return contextosRelevantes.some((ctx) => {
      let scope = ctx.ALCANCE;
      if (typeof scope === "string") {
        try {
          scope = JSON.parse(scope);
        } catch (e) {
          scope = {};
        }
      }
      const empresas = scope?.EMPRESAS || scope?.empresas || [];
      return empresas.some((id) => Number(id) === 5);
    });
  }, [contextosRelevantes]);

  // 3. Forzar un rol válido para que TemplateReporteria no filtre el reporte
  // Si no hay un nombre de rol en routeConfig, usamos "reportes.pricing" como nombre de rol
  const effectiveRouteConfig = useMemo(() => {
    const config = { ...routeConfig };
    if (!config.rolDelRecurso) {
      // Intentamos buscar el nombre del rol en los contextos
      const ctxConRol = contextosRelevantes.find(ctx => ctx.ID_ROL);
      if (ctxConRol && user?.ROLES) {
        const rolObj = user.ROLES.find(r => r.ID_ROL === ctxConRol.ID_ROL);
        config.rolDelRecurso = rolObj?.NOMBRE_ROL?.toLowerCase();
      }
      
      // Si aún no hay rol, forzamos uno para que coincida con el reporte
      if (!config.rolDelRecurso) {
        config.rolDelRecurso = "reportes.pricing";
      }
    }
    return config;
  }, [routeConfig, contextosRelevantes, user?.ROLES]);

  const filteredReports = useMemo(() => {
    if (!tieneAccesoEmpresa5) return [];

    // Priorizar el nombre de la empresa que viene de availableCompanies para evitar fallos en el Set de comparación
    const empresa5FromAvailable = availableCompanies.find(c => Number(c.id) === 5);
    const empresaNombre = empresa5FromAvailable?.nombre || user?.EMPRESAS?.["5"] || "GRUPO VII";

    return [
      {
        id: "pricing-report-1",
        url: "https://app.powerbi.com/view?r=eyJrIjoiNTQ3M2NlZjItYjY0MS00OWU2LTgwMjctZDU4ODM3MTQ2NzAyIiwidCI6IjI0ODVhZjVjLWEzZTEtNGE4NS05MTBiLTc5NTIzOTQwYTk3MSJ9&pageName=ReportSectionb172c49450c6d34ddb56",
        titulo: `Pricing - ${empresaNombre}`,
        empresa: empresaNombre,
        linea: null,
        rol: effectiveRouteConfig.rolDelRecurso, // Usar el mismo rol que configuramos en el config
      },
    ];
  }, [tieneAccesoEmpresa5, availableCompanies, user?.EMPRESAS, effectiveRouteConfig.rolDelRecurso]);

  // Asegurar que la empresa 5 esté en la lista de empresas disponibles para el Template
  const effectiveCompanies = useMemo(() => {
    if (filteredReports.length === 0) return [];
    
    const hasEmpresa5 = availableCompanies.some(c => Number(c.id) === 5);
    if (hasEmpresa5) return availableCompanies;

    return [
      ...availableCompanies,
      { id: 5, nombre: filteredReports[0].empresa }
    ];
  }, [availableCompanies, filteredReports]);

  return (
    <TemplateReporteria
      reportes={filteredReports}
      routeConfig={effectiveRouteConfig}
      availableCompanies={effectiveCompanies}
      availableLines={availableLines}
      availableCanales={availableCanales}
    />
  );
};
