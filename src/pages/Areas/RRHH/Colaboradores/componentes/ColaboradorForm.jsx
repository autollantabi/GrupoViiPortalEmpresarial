import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import {
  ListarAreas,
  ListarCargos,
  ListarCiudades,
  ListarEmpresas,
  ListarLineas,
} from "services/colaboradoresService";
import { CampoLabel } from "./CampoLabel";
import { ComboLibreUI } from "./ComboLibreUI";
import {
  Acciones,
  AreaTexto,
  Aviso,
  FilaFormulario,
  Separador,
  Tarjeta,
  TituloTarjeta,
} from "./piezas";
import { hoyIso } from "../utils/fechas";

/**
 * Formulario único de alta y edición de una ficha.
 *
 * ── LO MÁS IMPORTANTE DE ESTE ARCHIVO ───────────────────────────────────────
 * Cargo, área, línea y ciudad se envían SIEMPRE por nombre (`cargoNombre`, etc.)
 * y NUNCA por id. Eso es lo que hace que el backend cree la fila del catálogo al
 * paso cuando el valor no existe todavía, y es la razón por la que esos cuatro
 * campos usan ComboLibreUI (un combobox de texto libre) y no un select.
 *
 * Transformaciones al teclear, heredadas del Intranet para que la base quede
 * consistente: apellidos, nombres y los cuatro catálogos a MAYÚSCULAS, el correo
 * a minúsculas, y cédula y extensión solo dígitos.
 */

const soloDigitos = (valor) => valor.replace(/\D/g, "");

const VACIO = {
  apellidos: "",
  nombres: "",
  cedula: "",
  empresaId: null,
  cargoNombre: "",
  areaNombre: "",
  lineaNombre: "",
  ciudadNombre: "",
  fechaNacimiento: "",
  correoCorporativo: "",
  extension: "",
  telefonoEmpresarial: "",
  fechaIngreso: "",
  observacion: "",
};

const desdeFicha = (ficha) =>
  !ficha
    ? VACIO
    : {
        apellidos: ficha.apellidos ?? "",
        nombres: ficha.nombres ?? "",
        cedula: ficha.cedula ?? "",
        empresaId: ficha.empresaId ?? null,
        cargoNombre: ficha.cargo ?? "",
        areaNombre: ficha.area ?? "",
        lineaNombre: ficha.linea ?? "",
        ciudadNombre: ficha.ciudad ?? "",
        fechaNacimiento: ficha.fechaNacimiento ?? "",
        correoCorporativo: ficha.correoCorporativo ?? "",
        extension: ficha.extension ?? "",
        telefonoEmpresarial: ficha.telefonoEmpresarial ?? "",
        fechaIngreso: ficha.fechaIngreso ?? "",
        observacion: ficha.observacion ?? "",
      };

export const ColaboradorForm = ({ modo = "crear", ficha, onGuardar, onCancelar }) => {
  const [valores, setValores] = useState(() => desdeFicha(ficha));
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [catalogos, setCatalogos] = useState(null);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  // Los cinco catálogos en paralelo. Los cuatro de texto libre solo alimentan
  // sugerencias, así que si alguno falla el formulario sigue sirviendo.
  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargandoCatalogos(true);
      try {
        const [empresas, cargos, areas, lineas, ciudades] = await Promise.all([
          ListarEmpresas(),
          ListarCargos(),
          ListarAreas(),
          ListarLineas(),
          ListarCiudades(),
        ]);
        if (!cancelado) setCatalogos({ empresas, cargos, areas, lineas, ciudades });
      } catch (error) {
        if (!cancelado) {
          setCatalogos({ empresas: [], cargos: [], areas: [], lineas: [], ciudades: [] });
          toast.error(error.message || "No se pudieron cargar los catálogos");
        }
      } finally {
        if (!cancelado) setCargandoCatalogos(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  const campo = (clave) => (valor) => {
    setValores((previos) => ({ ...previos, [clave]: valor }));
    setErrores((previos) => (previos[clave] ? { ...previos, [clave]: undefined } : previos));
  };

  const opcionesEmpresa = useMemo(
    () => (catalogos?.empresas ?? []).map((e) => ({ value: e.id, label: e.nombre })),
    [catalogos],
  );

  const empresaElegida = useMemo(
    () => opcionesEmpresa.find((o) => o.value === valores.empresaId) ?? null,
    [opcionesEmpresa, valores.empresaId],
  );

  const nombres = (lista) => (lista ?? []).map((item) => item.nombre);

  const validar = () => {
    const nuevos = {};
    if (valores.apellidos.trim().length < 2) nuevos.apellidos = "Escriba los apellidos.";
    if (valores.nombres.trim().length < 2) nuevos.nombres = "Escriba los nombres.";
    if (!valores.empresaId) nuevos.empresaId = "Elija la empresa.";
    // Solo obligatoria en el alta: hay fichas viejas cargadas desde Excel que no
    // la tienen, y al editarlas no se puede exigir un dato que nadie conoce.
    if (modo === "crear" && !valores.fechaIngreso) {
      nuevos.fechaIngreso = "Indique la fecha de ingreso.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;

    if (!validar()) {
      toast.warning("Revise los campos marcados.");
      return;
    }

    const aTexto = (valor) => {
      const limpio = (valor ?? "").trim();
      return limpio.length === 0 ? null : limpio;
    };

    const carga = {
      apellidos: valores.apellidos.trim(),
      nombres: valores.nombres.trim(),
      cedula: aTexto(valores.cedula),
      empresaId: valores.empresaId,
      cargoNombre: aTexto(valores.cargoNombre),
      areaNombre: aTexto(valores.areaNombre),
      lineaNombre: aTexto(valores.lineaNombre),
      ciudadNombre: aTexto(valores.ciudadNombre),
      fechaNacimiento: aTexto(valores.fechaNacimiento),
      correoCorporativo: aTexto(valores.correoCorporativo),
      extension: aTexto(valores.extension),
      telefonoEmpresarial: aTexto(valores.telefonoEmpresarial),
      fechaIngreso: aTexto(valores.fechaIngreso),
      observacion: aTexto(valores.observacion),
    };

    setGuardando(true);
    try {
      await onGuardar(carga);
    } catch (error) {
      toast.error(error.message || "No se pudo guardar la ficha");
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoCatalogos) return <LoaderUI text="Cargando los catálogos…" height="240px" />;

  return (
    <form onSubmit={enviar} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Tarjeta>
          <TituloTarjeta>Identificación</TituloTarjeta>
          <FilaFormulario>
            <CampoLabel etiqueta="Apellidos" requerido error={errores.apellidos}>
              <InputUI
                value={valores.apellidos}
                onChange={(valor) => campo("apellidos")(valor.toUpperCase())}
                maxLength={120}
                placeholder="PEREZ LOPEZ"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Nombres" requerido error={errores.nombres}>
              <InputUI
                value={valores.nombres}
                onChange={(valor) => campo("nombres")(valor.toUpperCase())}
                maxLength={120}
                placeholder="JUAN CARLOS"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Cédula" ayuda="Solo números.">
              <InputUI
                value={valores.cedula}
                onChange={(valor) => campo("cedula")(soloDigitos(valor))}
                maxLength={20}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Fecha de nacimiento">
              {/* InputUI type=date y NO DateSelectorUI: ese último trabaja con
                  objetos Date y reintroduce el corrimiento de un día por zona
                  horaria que todo este módulo evita usando strings ISO. */}
              <InputUI
                type="date"
                value={valores.fechaNacimiento}
                onChange={campo("fechaNacimiento")}
                max={hoyIso()}
              />
            </CampoLabel>
          </FilaFormulario>
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Puesto</TituloTarjeta>
          <Aviso $tono="info">
            Cargo, área, línea y ciudad aceptan valores nuevos: si escribe uno que
            no está en la lista, se crea al guardar.
          </Aviso>
          <Separador />
          <FilaFormulario>
            <CampoLabel etiqueta="Empresa" requerido error={errores.empresaId}>
              <SelectUI
                options={opcionesEmpresa}
                value={empresaElegida}
                onChange={(opcion) => campo("empresaId")(opcion?.value ?? null)}
                placeholder="Seleccione la empresa"
                minWidth="100%"
                maxWidth="100%"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Cargo">
              <ComboLibreUI
                value={valores.cargoNombre}
                onChange={campo("cargoNombre")}
                opciones={nombres(catalogos?.cargos)}
                mayusculas
                maxLength={150}
                placeholder="JEFE DE BODEGA"
              />
            </CampoLabel>
            <CampoLabel etiqueta="Área">
              <ComboLibreUI
                value={valores.areaNombre}
                onChange={campo("areaNombre")}
                opciones={nombres(catalogos?.areas)}
                mayusculas
                maxLength={120}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Línea de negocio">
              <ComboLibreUI
                value={valores.lineaNombre}
                onChange={campo("lineaNombre")}
                opciones={nombres(catalogos?.lineas)}
                mayusculas
                maxLength={120}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Ciudad">
              <ComboLibreUI
                value={valores.ciudadNombre}
                onChange={campo("ciudadNombre")}
                opciones={nombres(catalogos?.ciudades)}
                mayusculas
                maxLength={100}
              />
            </CampoLabel>
          </FilaFormulario>
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Contacto</TituloTarjeta>
          <FilaFormulario>
            <CampoLabel etiqueta="Correo corporativo">
              <InputUI
                type="email"
                value={valores.correoCorporativo}
                onChange={(valor) => campo("correoCorporativo")(valor.toLowerCase())}
                maxLength={150}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Extensión" ayuda="Solo números.">
              <InputUI
                value={valores.extension}
                onChange={(valor) => campo("extension")(soloDigitos(valor))}
                maxLength={20}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Teléfono empresarial">
              <InputUI
                value={valores.telefonoEmpresarial}
                onChange={campo("telefonoEmpresarial")}
                maxLength={40}
              />
            </CampoLabel>
          </FilaFormulario>
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>{modo === "crear" ? "Ingreso" : "Datos del ingreso"}</TituloTarjeta>
          <FilaFormulario $min={260}>
            <CampoLabel
              etiqueta="Fecha de ingreso"
              requerido={modo === "crear"}
              error={errores.fechaIngreso}
              ayuda={
                modo === "editar"
                  ? "Si la ficha vino de la carga inicial puede estar vacía."
                  : undefined
              }
            >
              <InputUI
                type="date"
                value={valores.fechaIngreso}
                onChange={campo("fechaIngreso")}
                max={hoyIso()}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Observación">
              <AreaTexto
                value={valores.observacion}
                onChange={(evento) => campo("observacion")(evento.target.value)}
                maxLength={1000}
                rows={3}
              />
            </CampoLabel>
          </FilaFormulario>
        </Tarjeta>

        <Acciones>
          {/* disabled + texto que cambia, y no isAsync: el isAsync de ButtonUI se
              engancha a onClick y un submit no pasa por ahí, así que no haría
              nada y encima perderíamos el Enter para enviar. */}
          <ButtonUI
            type="submit"
            text={guardando ? "Guardando…" : "Guardar"}
            iconLeft="FaFloppyDisk"
            disabled={guardando}
          />
          <ButtonUI
            text="Cancelar"
            variant="outlined"
            onClick={onCancelar}
            disabled={guardando}
          />
        </Acciones>
      </div>
    </form>
  );
};

export default ColaboradorForm;
