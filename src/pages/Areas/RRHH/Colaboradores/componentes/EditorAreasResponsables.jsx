import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { SelectUI } from "components/UI/Components/SelectUI";
import { ListarAreas, ListarColaboradores } from "services/colaboradoresService";
import { ActualizarResponsableArea, ListarGruposDotacion } from "services/dotacionService";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  Badge,
  Fila,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
} from "./piezas";

/**
 * Quién recibe los avisos de cada área.
 *
 * Es la pantalla que hace que el correo de dotación tenga a dónde ir: hasta ahora
 * rrhh_areas era solo (id, nombre).
 *
 * Se puede fijar una persona, un buzón, o los dos. El buzón GANA sobre el correo
 * de la persona, y es lo recomendable: sobrevive a que esa persona se vaya de la
 * empresa, mientras que un responsable que se da de baja deja el área muda.
 */

/** El backend tope la página en 200; con más gente hay que usar el buzón. */
const MAXIMO_EMPLEADOS = 200;

export const EditorAreasResponsables = () => {
  const { datos: areas, cargando, error, recargar } = useConsulta(
    ({ signal }) => ListarAreas({ signal }),
    [],
  );

  const { datos: personal } = useConsulta(
    ({ signal }) =>
      ListarColaboradores({ estado: "Activo", pageSize: MAXIMO_EMPLEADOS }, { signal }),
    [],
  );

  // Los grupos se cargan para poder decir qué grupos dependen de cada área: sin
  // eso, "configure el área" no dice cuál ni por qué importa.
  const { datos: grupos, recargar: recargarGrupos } = useConsulta(
    ({ signal }) => ListarGruposDotacion({ signal }),
    [],
  );

  const [borrador, setBorrador] = useState({});
  const [guardando, setGuardando] = useState(null);

  // El borrador se siembra con lo que hay para que los campos no arranquen vacíos
  // y un guardado accidental no borre lo configurado.
  useEffect(() => {
    if (!areas) return;
    setBorrador(
      Object.fromEntries(
        areas.map((area) => [
          area.id,
          {
            responsableEmpleadoId: area.responsableEmpleadoId ?? null,
            correoNotificaciones: area.correoNotificaciones ?? "",
          },
        ]),
      ),
    );
  }, [areas]);

  const opcionesPersonal = (personal?.items ?? []).map((fila) => ({
    value: fila.id,
    label: `${fila.nombresCompletos}${fila.correoCorporativo ? ` · ${fila.correoCorporativo}` : ""}`,
  }));

  const guardar = async (area) => {
    const valores = borrador[area.id] ?? {};
    setGuardando(area.id);

    try {
      await ActualizarResponsableArea(area.id, {
        responsableEmpleadoId: valores.responsableEmpleadoId ?? null,
        correoNotificaciones: valores.correoNotificaciones?.trim() || null,
      });
      toast.success(`${area.nombre} actualizada.`);
      recargar();
      recargarGrupos();
    } catch (e) {
      toast.error(e.message || "No se pudo actualizar el área");
    } finally {
      setGuardando(null);
    }
  };

  if (cargando) return <LoaderUI text="Cargando las áreas…" height="200px" />;

  if (error) {
    return (
      <Aviso $tono="peligro">
        {error} <ButtonUI text="Reintentar" variant="ghost" onClick={recargar} />
      </Aviso>
    );
  }

  const gruposPorArea = new Map();
  (grupos ?? []).forEach((grupo) => {
    if (!grupo.areaResponsableId) return;
    const lista = gruposPorArea.get(grupo.areaResponsableId) ?? [];
    lista.push(grupo);
    gruposPorArea.set(grupo.areaResponsableId, lista);
  });

  const sinDestinatario = (grupos ?? []).filter((grupo) => !grupo.destinatarioEfectivo);

  return (
    <Tarjeta $sinRelleno>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <TituloTarjeta style={{ margin: 0 }}>Áreas y responsables</TituloTarjeta>
        <TextoTenue>
          De aquí sale el destinatario del aviso de dotación. El buzón gana sobre el correo
          del responsable: conviene usarlo, porque sobrevive a que esa persona se vaya.
        </TextoTenue>

        {sinDestinatario.length > 0 && (
          <Aviso $tono="aviso">
            Sin destinatario:{" "}
            <strong>{sinDestinatario.map((grupo) => grupo.nombre).join(", ")}</strong>. Los
            avisos de esos grupos quedarán registrados como no enviados hasta que el área
            responsable tenga un correo.
          </Aviso>
        )}

        {(personal?.total ?? 0) > MAXIMO_EMPLEADOS && (
          <Aviso $tono="neutro">
            En la lista de responsables solo aparecen los primeros {MAXIMO_EMPLEADOS}
            colaboradores activos. Si el jefe que busca no está, use el buzón del área.
          </Aviso>
        )}
      </div>

      <TablaScroll>
        <Tabla>
          <thead>
            <tr>
              <Th>Área</Th>
              <Th>Grupos que dependen</Th>
              <Th>Responsable</Th>
              <Th>Buzón de avisos</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(areas ?? []).map((area) => {
              const valores = borrador[area.id] ?? {};
              const dependientes = gruposPorArea.get(area.id) ?? [];

              return (
                <Fila key={area.id}>
                  <Td>
                    {area.nombre}
                    <TextoTenue> · {area.empleados} activo(s)</TextoTenue>
                  </Td>
                  <Td>
                    {dependientes.length === 0 ? (
                      <TextoTenue>—</TextoTenue>
                    ) : (
                      <Acciones>
                        {dependientes.map((grupo) => (
                          <Badge
                            key={grupo.id}
                            $tono={grupo.destinatarioEfectivo ? "exito" : "peligro"}
                          >
                            {grupo.nombre}
                          </Badge>
                        ))}
                      </Acciones>
                    )}
                  </Td>
                  <Td style={{ minWidth: 260 }}>
                    <SelectUI
                      options={opcionesPersonal}
                      value={
                        opcionesPersonal.find(
                          (opcion) => opcion.value === valores.responsableEmpleadoId,
                        ) ?? null
                      }
                      onChange={(opcion) =>
                        setBorrador((previo) => ({
                          ...previo,
                          [area.id]: { ...valores, responsableEmpleadoId: opcion?.value ?? null },
                        }))
                      }
                      isSearchable
                      isClearable
                      // El maxWidth por omisión de SelectUI es 250px y aquí el
                      // nombre más el correo no caben.
                      maxWidth="100%"
                      placeholder="Sin responsable"
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                    />
                  </Td>
                  <Td style={{ minWidth: 220 }}>
                    <InputUI
                      type="email"
                      value={valores.correoNotificaciones ?? ""}
                      onChange={(valor) =>
                        setBorrador((previo) => ({
                          ...previo,
                          [area.id]: { ...valores, correoNotificaciones: valor.toLowerCase() },
                        }))
                      }
                      maxLength={150}
                      placeholder="logistica@grupo.com"
                    />
                  </Td>
                  <Td>
                    <ButtonUI
                      text={guardando === area.id ? "Guardando…" : "Guardar"}
                      iconLeft="FaFloppyDisk"
                      variant="outlined"
                      disabled={guardando !== null}
                      onClick={() => guardar(area)}
                    />
                  </Td>
                </Fila>
              );
            })}
          </tbody>
        </Tabla>
      </TablaScroll>
    </Tarjeta>
  );
};

export default EditorAreasResponsables;
