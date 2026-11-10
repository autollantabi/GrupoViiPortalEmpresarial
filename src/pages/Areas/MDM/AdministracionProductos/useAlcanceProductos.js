import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "context/authContext";
import { ListarEmpresasAdmin } from "services/administracionService";
import {
  EMPRESAS_MDM,
  LINEAS_MDM,
  OPCIONES_LINEAS_MDM,
  RECURSO_ADMIN_PRODUCTOS,
} from "./compartido";

/**
 * Empresas y líneas de negocio que el usuario puede ver en Administración de
 * productos: las del alcance (ALCANCE.EMPRESAS / ALCANCE.LINEAS) de su
 * rol-contexto sobre el recurso (o sobre "mdm", que lo cubre por herencia). Si
 * todavía no hay alcance configurado se ofrecen todas las del MDM.
 *
 * @returns {{opcionesEmpresas: Array<{value: string, label: string}>, opcionesLineas: Array<{value: string, label: string}>, lineasRestringidas: boolean}}
 */
export function useAlcanceProductos() {
  const { user } = useAuthContext();
  const [diccionarioEmpresas, setDiccionarioEmpresas] = useState({});

  useEffect(() => {
    let activo = true;
    ListarEmpresasAdmin()
      .then((resp) => {
        if (!activo) return;
        const dict = {};
        (resp || []).forEach((emp) => {
          dict[emp.ID] = emp.NOMBRE;
        });
        setDiccionarioEmpresas(dict);
      })
      .catch((err) => console.error("Error obteniendo empresas:", err));
    return () => {
      activo = false;
    };
  }, []);

  const opcionesEmpresas = useMemo(() => {
    const contextos = Array.isArray(user?.CONTEXTOS) ? user.CONTEXTOS : [];
    const contexto =
      contextos.find((ctx) => ctx.RECURSO === RECURSO_ADMIN_PRODUCTOS) ||
      contextos.find((ctx) => ctx.RECURSO === "mdm");

    const empresasAlcance = contexto?.ALCANCE?.EMPRESAS;

    if (Array.isArray(empresasAlcance) && empresasAlcance.length) {
      const permitidas = empresasAlcance
        .map((id) => diccionarioEmpresas[id])
        .filter(Boolean)
        .map((nombre) => String(nombre).trim().toUpperCase())
        .filter((nombre) => EMPRESAS_MDM.includes(nombre));

      if (permitidas.length) {
        return permitidas.map((nombre) => ({ value: nombre, label: nombre }));
      }
    }

    return EMPRESAS_MDM.map((nombre) => ({ value: nombre, label: nombre }));
  }, [user, diccionarioEmpresas]);

  const { opcionesLineas, lineasRestringidas } = useMemo(() => {
    const contextos = Array.isArray(user?.CONTEXTOS) ? user.CONTEXTOS : [];
    const contexto =
      contextos.find((ctx) => ctx.RECURSO === RECURSO_ADMIN_PRODUCTOS) ||
      contextos.find((ctx) => ctx.RECURSO === "mdm");

    const lineasAlcance = contexto?.ALCANCE?.LINEAS;

    if (Array.isArray(lineasAlcance) && lineasAlcance.length) {
      const permitidas = lineasAlcance.map((id) => LINEAS_MDM[id]).filter(Boolean);
      if (permitidas.length) {
        return {
          opcionesLineas: permitidas.map((nombre) => ({ value: nombre, label: nombre })),
          lineasRestringidas: true,
        };
      }
    }

    return { opcionesLineas: OPCIONES_LINEAS_MDM, lineasRestringidas: false };
  }, [user]);

  return { opcionesEmpresas, opcionesLineas, lineasRestringidas };
}
