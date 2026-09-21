import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { CheckboxUI } from "components/UI/Components/CheckboxUI";
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
import {
  ESTADO_CIVIL,
  ETIQUETA_ESTADO_CIVIL,
  ETIQUETA_PARENTESCO_SUSTITUTO,
  ETIQUETA_TIPO_DISCAPACIDAD,
  PARENTESCO_SUSTITUTO,
  RUTA_CARGAS_FAMILIARES,
  TIPO_DISCAPACIDAD,
} from "../utils/constantesDotacion";

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

/** Los mismos valores que el CHECK de la base; las etiquetas salen del módulo. */
const OPCIONES_ESTADO_CIVIL = ESTADO_CIVIL.map((valor) => ({
  value: valor,
  label: ETIQUETA_ESTADO_CIVIL[valor] ?? valor,
}));

const OPCIONES_TIPO_DISCAPACIDAD = TIPO_DISCAPACIDAD.map((valor) => ({
  value: valor,
  label: ETIQUETA_TIPO_DISCAPACIDAD[valor] ?? valor,
}));

const OPCIONES_PARENTESCO = PARENTESCO_SUSTITUTO.map((valor) => ({
  value: valor,
  label: ETIQUETA_PARENTESCO_SUSTITUTO[valor] ?? valor,
}));

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
  estadoCivil: null,
  numeroHijos: "",
  conduce: false,
  tieneDiscapacidad: false,
  porcentajeDiscapacidad: "",
  tipoDiscapacidad: null,
  esSustitutoDiscapacidad: false,
  sustitutoCedula: "",
  sustitutoNombre: "",
  sustitutoParentesco: null,
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
        estadoCivil: ficha.estadoCivil ?? null,
        // Cadena vacía y no 0: null significa "no se sabe", y un 0 puesto por
        // omisión afirmaría que no tiene hijos.
        numeroHijos:
          ficha.numeroHijos === null || ficha.numeroHijos === undefined
            ? ""
            : String(ficha.numeroHijos),
        conduce: ficha.conduce === true,
        tieneDiscapacidad: ficha.tieneDiscapacidad === true,
        porcentajeDiscapacidad:
          ficha.porcentajeDiscapacidad === null || ficha.porcentajeDiscapacidad === undefined
            ? ""
            : String(ficha.porcentajeDiscapacidad),
        tipoDiscapacidad: ficha.tipoDiscapacidad ?? null,
        esSustitutoDiscapacidad: ficha.esSustitutoDiscapacidad === true,
        sustitutoCedula: ficha.sustitutoCedula ?? "",
        sustitutoNombre: ficha.sustitutoNombre ?? "",
        sustitutoParentesco: ficha.sustitutoParentesco ?? null,
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

  // Una vez que la persona tiene cargas familiares registradas en su propia
  // pestaña, "Número de hijos" deja de ser un campo libre: lo calcula el
  // backend a partir de esa lista, y editarlo acá lo desincronizaría.
  const cargasGestionadas = ficha?.cargasFamiliaresGestionadas === true;

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

  /**
   * Discapacidad propia y ser sustituto son mutuamente excluyentes: marcar una
   * apaga la otra, además de deshabilitar su casilla mientras tanto. Sin esto el
   * checkbox deshabilitado de la UI podría desincronizarse del estado si alguien
   * marca las dos casi al mismo tiempo.
   */
  const marcarDiscapacidad = (marcado) => {
    setValores((previos) => ({
      ...previos,
      tieneDiscapacidad: marcado,
      esSustitutoDiscapacidad: marcado ? false : previos.esSustitutoDiscapacidad,
    }));
    setErrores((previos) => ({
      ...previos,
      tieneDiscapacidad: undefined,
      esSustitutoDiscapacidad: undefined,
    }));
  };

  const marcarSustituto = (marcado) => {
    setValores((previos) => ({
      ...previos,
      esSustitutoDiscapacidad: marcado,
      tieneDiscapacidad: marcado ? false : previos.tieneDiscapacidad,
    }));
    setErrores((previos) => ({
      ...previos,
      esSustitutoDiscapacidad: undefined,
      tieneDiscapacidad: undefined,
    }));
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

    // Mismas tres reglas que valida el backend, repetidas acá para que el error
    // aparezca junto al campo en vez de esperar el rechazo del API.
    if (valores.tieneDiscapacidad) {
      const porcentaje = Number(valores.porcentajeDiscapacidad);
      if (
        valores.porcentajeDiscapacidad === "" ||
        !Number.isFinite(porcentaje) ||
        porcentaje <= 0 ||
        porcentaje > 100
      ) {
        nuevos.porcentajeDiscapacidad = "Indique el porcentaje de discapacidad.";
      }
    }

    if (valores.esSustitutoDiscapacidad) {
      if (!valores.sustitutoCedula.trim()) {
        nuevos.sustitutoCedula = "Indique la cédula de la persona sustituida.";
      }
      if (!valores.sustitutoNombre.trim()) {
        nuevos.sustitutoNombre = "Indique el nombre de la persona sustituida.";
      }
    }

    if (valores.tieneDiscapacidad && valores.esSustitutoDiscapacidad) {
      nuevos.tieneDiscapacidad = "No puede tener discapacidad propia y ser sustituto a la vez.";
      nuevos.esSustitutoDiscapacidad =
        "No puede ser sustituto y tener discapacidad propia a la vez.";
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
      estadoCivil: valores.estadoCivil ?? null,
      numeroHijos: valores.numeroHijos === "" ? null : Number(valores.numeroHijos),
      conduce: valores.conduce === true,
      tieneDiscapacidad: valores.tieneDiscapacidad === true,
      porcentajeDiscapacidad:
        valores.tieneDiscapacidad && valores.porcentajeDiscapacidad !== ""
          ? Number(valores.porcentajeDiscapacidad)
          : null,
      tipoDiscapacidad: valores.tieneDiscapacidad ? (valores.tipoDiscapacidad ?? null) : null,
      esSustitutoDiscapacidad: valores.esSustitutoDiscapacidad === true,
      sustitutoCedula: valores.esSustitutoDiscapacidad ? aTexto(valores.sustitutoCedula) : null,
      sustitutoNombre: valores.esSustitutoDiscapacidad ? aTexto(valores.sustitutoNombre) : null,
      sustitutoParentesco: valores.esSustitutoDiscapacidad
        ? (valores.sustitutoParentesco ?? null)
        : null,
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
          <TituloTarjeta>Situación personal</TituloTarjeta>
          <Aviso $tono="info">
            Estos tres datos deciden qué documentos se le piden: el acta de matrimonio solo
            si es casado, las partidas de nacimiento solo si tiene hijos, y la licencia y la
            matrícula solo si conduce. Mientras estén vacíos no se le reclama ninguno de
            ellos.
          </Aviso>
          <FilaFormulario>
            <CampoLabel etiqueta="Estado civil">
              <SelectUI
                options={OPCIONES_ESTADO_CIVIL}
                value={
                  OPCIONES_ESTADO_CIVIL.find((opcion) => opcion.value === valores.estadoCivil) ??
                  null
                }
                onChange={(opcion) => campo("estadoCivil")(opcion?.value ?? null)}
                isClearable
                placeholder="Sin registrar"
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              />
            </CampoLabel>

            <CampoLabel
              etiqueta="Número de hijos"
              ayuda={
                cargasGestionadas ? (
                  <>
                    Se calcula desde la pestaña{" "}
                    <Link to={RUTA_CARGAS_FAMILIARES(ficha.id)}>Cargas familiares</Link>.
                  </>
                ) : (
                  "Déjelo vacío si no se sabe. Un 0 afirma que no tiene."
                )
              }
            >
              <InputUI
                type="number"
                value={valores.numeroHijos}
                onChange={(valor) => campo("numeroHijos")(soloDigitos(valor))}
                min={0}
                max={30}
                disabled={cargasGestionadas}
              />
            </CampoLabel>

            <div style={{ display: "flex", alignItems: "center", paddingTop: 18 }}>
              <CheckboxUI
                name="conduce"
                checked={valores.conduce === true}
                // CheckboxUI del kit entrega (name, checked), no el evento.
                onChange={(_nombre, marcado) => campo("conduce")(marcado)}
                label="Conduce por trabajo"
              />
            </div>
          </FilaFormulario>
        </Tarjeta>

        <Tarjeta>
          <TituloTarjeta>Discapacidad</TituloTarjeta>
          <Aviso $tono="info">
            Estos datos habilitan los beneficios legales de discapacidad. Si marca cualquiera
            de las dos casillas, se le pedirá el documento de respaldo en la pestaña
            Documentos una vez guardada la ficha.
          </Aviso>

          <FilaFormulario>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CheckboxUI
                name="tieneDiscapacidad"
                checked={valores.tieneDiscapacidad === true}
                onChange={(_nombre, marcado) => marcarDiscapacidad(marcado)}
                label="Tiene discapacidad"
                disabled={valores.esSustitutoDiscapacidad === true}
              />
            </div>

            {valores.tieneDiscapacidad && (
              <CampoLabel
                etiqueta="% de discapacidad"
                requerido
                error={errores.porcentajeDiscapacidad}
              >
                <InputUI
                  type="number"
                  value={valores.porcentajeDiscapacidad}
                  onChange={campo("porcentajeDiscapacidad")}
                  min={0.01}
                  max={100}
                  step="0.01"
                />
              </CampoLabel>
            )}

            {valores.tieneDiscapacidad && (
              <CampoLabel etiqueta="Tipo de discapacidad">
                <SelectUI
                  options={OPCIONES_TIPO_DISCAPACIDAD}
                  value={
                    OPCIONES_TIPO_DISCAPACIDAD.find(
                      (opcion) => opcion.value === valores.tipoDiscapacidad,
                    ) ?? null
                  }
                  onChange={(opcion) => campo("tipoDiscapacidad")(opcion?.value ?? null)}
                  isClearable
                  placeholder="Sin registrar"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                />
              </CampoLabel>
            )}
          </FilaFormulario>

          <Separador />

          <div>
            <CheckboxUI
              name="esSustitutoDiscapacidad"
              checked={valores.esSustitutoDiscapacidad === true}
              onChange={(_nombre, marcado) => marcarSustituto(marcado)}
              label="Sustituto de persona con discapacidad"
              disabled={valores.tieneDiscapacidad === true}
            />
          </div>
          <Aviso $tono="neutro">
            El sustituto es una figura legal: una persona SIN discapacidad propia que tiene
            bajo su cuidado o dependencia económica a alguien que sí la tiene, y por eso
            recibe los mismos beneficios laborales que un colaborador con discapacidad.
          </Aviso>

          {valores.esSustitutoDiscapacidad && (
            <>
              <FilaFormulario>
                <CampoLabel
                  etiqueta="Cédula de la persona sustituida"
                  requerido
                  error={errores.sustitutoCedula}
                  ayuda="Solo números."
                >
                  <InputUI
                    value={valores.sustitutoCedula}
                    onChange={(valor) => campo("sustitutoCedula")(soloDigitos(valor))}
                    maxLength={20}
                  />
                </CampoLabel>
                <CampoLabel
                  etiqueta="Nombre de la persona sustituida"
                  requerido
                  error={errores.sustitutoNombre}
                >
                  <InputUI
                    value={valores.sustitutoNombre}
                    onChange={(valor) => campo("sustitutoNombre")(valor.toUpperCase())}
                    maxLength={150}
                  />
                </CampoLabel>
                <CampoLabel etiqueta="Parentesco">
                  <SelectUI
                    options={OPCIONES_PARENTESCO}
                    value={
                      OPCIONES_PARENTESCO.find(
                        (opcion) => opcion.value === valores.sustitutoParentesco,
                      ) ?? null
                    }
                    onChange={(opcion) => campo("sustitutoParentesco")(opcion?.value ?? null)}
                    isClearable
                    placeholder="Sin registrar"
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  />
                </CampoLabel>
              </FilaFormulario>

              <Aviso $tono="aviso">
                Se solicitará el documento de validación de sustituto en la pestaña
                Documentos una vez guardada la ficha.
              </Aviso>
            </>
          )}
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
