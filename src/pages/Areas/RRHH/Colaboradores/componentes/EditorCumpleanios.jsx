import React, { useState } from "react";
import { toast } from "react-toastify";
import styled from "styled-components";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import {
  EjecutarCumpleanios,
  HistorialCumpleanios,
  VistaPreviaCumpleanios,
} from "services/cumpleaniosService";
import { useConsulta } from "../hooks/useConsulta";
import { FiltroPastillas } from "./FiltroPastillas";
import {
  Acciones,
  Aviso,
  Badge,
  Fila,
  Rejilla,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
  Vacio,
} from "./piezas";

/**
 * Los correos de cumpleaños: verlos antes de mandarlos, mandarlos y ver qué pasó.
 *
 * La vista previa es el punto de esta pantalla. Un correo con imágenes y CSS en
 * línea no se puede revisar leyendo código, y estos salen a 184 personas: hay que
 * poder verlo tal como va a llegar, con los nombres de verdad, antes de apretar
 * el botón.
 *
 * De ahí también el envío de prueba a un correo propio. Es lo primero que hay que
 * hacer, y por eso está antes del envío real y con el mismo tamaño.
 */

const TIPOS = [
  { valor: "Saludo", etiqueta: "Tarjeta al colaborador" },
  { valor: "Mensual", etiqueta: "Afiche del mes" },
  { valor: "Anticipado", etiqueta: "Aviso anticipado a RRHH" },
];

const EXPLICACION = {
  Saludo:
    "Le llega al colaborador el día de su cumpleaños, a su correo corporativo. Sale un " +
    "correo por persona.",
  Mensual: "Le llega a Talento Humano una vez al mes, con todos los cumpleañeros.",
  Anticipado:
    "Le llega a Talento Humano unos días antes, para preparar el saludo. Es una tabla de " +
    "trabajo, no una tarjeta.",
};

/** Hoy como AAAA-MM-DD, sin pasar por toISOString (que se va a UTC). */
const hoyTexto = () => {
  const ahora = new Date();
  return [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
};

/* El iframe aísla el correo del CSS de la aplicación. Sin eso, los estilos del
   Portal se le meterían al HTML del correo y la vista previa mentiría. */
const MarcoCorreo = styled.iframe`
  width: 100%;
  height: 640px;
  border: 1px solid ${({ theme }) => theme?.colors?.border || "#dee2e6"};
  border-radius: 8px;
  background: #eef0f3;
`;

const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  > span {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme?.colors?.textSecondary};
  }
`;

export const EditorCumpleanios = () => {
  const [tipo, setTipo] = useState("Saludo");
  const [fecha, setFecha] = useState(hoyTexto());
  const [dias, setDias] = useState("2");
  const [correoPrueba, setCorreoPrueba] = useState("");
  const [enviando, setEnviando] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const {
    datos: vista,
    cargando,
    error,
    recargar,
  } = useConsulta(
    ({ signal }) =>
      VistaPreviaCumpleanios(
        { tipo, fecha, dias: tipo === "Anticipado" ? Number(dias) || 0 : undefined },
        { signal },
      ),
    [tipo, fecha, dias],
  );

  const {
    datos: historial,
    cargando: cargandoHistorial,
    recargar: recargarHistorial,
  } = useConsulta(({ signal }) => HistorialCumpleanios({ cantidad: 20 }, { signal }), []);

  const enviar = async ({ prueba }) => {
    setEnviando(prueba ? "prueba" : "real");
    setResultados(null);

    try {
      const salida = await EjecutarCumpleanios({
        hoy: fecha,
        tipos: [tipo],
        // Una prueba se fuerza siempre: si no, el control de duplicados contesta
        // "ya se envió" y no se ve nada, que es lo contrario de lo que se pidió.
        forzar: prueba,
        destinatariosPrueba: prueba ? correoPrueba.trim() : undefined,
      });

      setResultados(salida);
      const enviados = salida.filter((renglon) => renglon.enviado).length;

      if (enviados > 0) {
        toast.success(
          prueba
            ? `Prueba enviada a ${correoPrueba.trim()}.`
            : `Se enviaron ${enviados} correo(s).`,
        );
      } else {
        // No es un error: casi siempre es "ya se envió" o "nadie cumple". El
        // detalle de abajo lo explica renglón por renglón.
        toast.info("No se envió ningún correo. Revise el detalle.");
      }

      recargarHistorial();
    } catch (e) {
      toast.error(e.message || "No se pudieron enviar los avisos");
    } finally {
      setEnviando(null);
      setConfirmando(false);
    }
  };

  const destinatarios = vista?.destinatarios ?? [];
  const personas = vista?.personas ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Tarjeta>
        <TituloTarjeta>Qué correo revisar</TituloTarjeta>

        <FiltroPastillas leyenda="Correo" opciones={TIPOS} value={tipo} onChange={setTipo} />

        <TextoTenue style={{ display: "block", marginTop: 6 }}>{EXPLICACION[tipo]}</TextoTenue>

        <Rejilla style={{ marginTop: 12 }}>
          <Campo>
            <span>{tipo === "Mensual" ? "Mes (cualquier día de ese mes)" : "Día"}</span>
            <InputUI type="date" value={fecha} onChange={setFecha} />
          </Campo>

          {tipo === "Anticipado" && (
            <Campo>
              <span>Días de anticipación</span>
              <InputUI
                type="number"
                min={0}
                max={60}
                value={dias}
                onChange={(valor) => setDias(valor.replace(/\D/g, ""))}
              />
            </Campo>
          )}
        </Rejilla>
      </Tarjeta>

      {error && (
        <Aviso $tono="peligro">
          {error} <ButtonUI text="Reintentar" variant="ghost" onClick={recargar} />
        </Aviso>
      )}

      {cargando && <LoaderUI text="Armando el correo…" height="200px" />}

      {!cargando && vista && (
        <>
          <Tarjeta>
            <TituloTarjeta>Así va a llegar</TituloTarjeta>

            {vista.aviso && <Aviso $tono="aviso">{vista.aviso}</Aviso>}

            <Rejilla style={{ marginBottom: 10 }}>
              <Campo>
                <span>Asunto</span>
                <strong style={{ fontSize: 13 }}>{vista.asunto}</strong>
              </Campo>
              <Campo>
                <span>Para</span>
                {destinatarios.length === 0 ? (
                  <TextoTenue>Nadie — ver el aviso de arriba</TextoTenue>
                ) : (
                  <span style={{ fontSize: 13 }}>{destinatarios.join(", ")}</span>
                )}
              </Campo>
              <Campo>
                <span>Cumpleañeros</span>
                <span style={{ fontSize: 13 }}>{vista.cantidadPersonas}</span>
              </Campo>
            </Rejilla>

            <MarcoCorreo
              title={`Vista previa del correo ${vista.tipo}`}
              srcDoc={vista.cuerpoNavegador}
              // Sin scripts ni formularios: es HTML que viene de la base y se
              // pinta sin más, así que no hay razón para darle capacidades.
              sandbox=""
            />

            {vista.adjuntos?.length > 0 && (
              <TextoTenue style={{ display: "block", marginTop: 8 }}>
                El correo lleva {vista.adjuntos.length} imagen(es) incrustada(s):{" "}
                {vista.adjuntos.join(", ")}. Van dentro del mensaje y no como enlace, para que
                Outlook no las bloquee.
              </TextoTenue>
            )}
          </Tarjeta>

          <Tarjeta>
            <TituloTarjeta>Enviar</TituloTarjeta>

            <TextoTenue style={{ display: "block", marginBottom: 10 }}>
              Primero una prueba a un correo propio. La prueba desvía el correo: no le llega a
              nadie más, ni siquiera al cumpleañero.
            </TextoTenue>

            <Rejilla>
              <Campo>
                <span>Correo de prueba</span>
                <Acciones>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <InputUI
                      type="email"
                      value={correoPrueba}
                      onChange={(valor) => setCorreoPrueba(valor.toLowerCase())}
                      maxLength={150}
                      placeholder="usted@grupo.com"
                    />
                  </div>
                  <ButtonUI
                    text={enviando === "prueba" ? "Enviando…" : "Enviar prueba"}
                    iconLeft="FaPaperPlane"
                    variant="outlined"
                    disabled={enviando !== null || correoPrueba.trim().length === 0}
                    onClick={() => enviar({ prueba: true })}
                  />
                </Acciones>
              </Campo>
            </Rejilla>

            <hr
              style={{ border: 0, borderTop: "1px solid rgba(0,0,0,.08)", margin: "14px 0" }}
            />

            {!confirmando ? (
              <ButtonUI
                text="Enviar de verdad"
                iconLeft="FaEnvelope"
                disabled={enviando !== null || vista.cantidadPersonas === 0}
                onClick={() => setConfirmando(true)}
              />
            ) : (
              <Aviso $tono="aviso">
                {tipo === "Saludo"
                  ? `Se van a enviar ${vista.cantidadPersonas} tarjeta(s), una a cada cumpleañero.`
                  : `Se va a enviar a ${destinatarios.join(", ") || "nadie"}.`}{" "}
                <Acciones style={{ marginTop: 8 }}>
                  <ButtonUI
                    text={enviando === "real" ? "Enviando…" : "Sí, enviar"}
                    disabled={enviando !== null}
                    onClick={() => enviar({ prueba: false })}
                  />
                  <ButtonUI
                    text="Cancelar"
                    variant="ghost"
                    disabled={enviando !== null}
                    onClick={() => setConfirmando(false)}
                  />
                </Acciones>
              </Aviso>
            )}

            {vista.cantidadPersonas === 0 && (
              <TextoTenue style={{ display: "block", marginTop: 8 }}>
                No hay a quién felicitar en esa fecha, así que no hay nada que enviar.
              </TextoTenue>
            )}

            {resultados && (
              <TablaScroll style={{ marginTop: 14 }}>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Resultado</Th>
                      <Th>Para</Th>
                      <Th>Detalle</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((renglon, indice) => (
                      <Fila key={`${renglon.tipo}-${renglon.persona ?? indice}`}>
                        <Td data-etiqueta="Resultado">
                          <Badge $tono={renglon.enviado ? "exito" : "aviso"}>
                            {renglon.enviado ? "Enviado" : "No enviado"}
                          </Badge>
                        </Td>
                        <Td data-etiqueta="Para">
                          {renglon.persona && <div>{renglon.persona}</div>}
                          <TextoTenue>{renglon.destinatarios.join(", ") || "—"}</TextoTenue>
                        </Td>
                        <Td data-etiqueta="Detalle">{renglon.mensaje}</Td>
                      </Fila>
                    ))}
                  </tbody>
                </Tabla>
              </TablaScroll>
            )}
          </Tarjeta>

          <Tarjeta $sinRelleno>
            <div style={{ padding: 16 }}>
              <TituloTarjeta style={{ margin: 0 }}>
                Quién cumple ({vista.cantidadPersonas})
              </TituloTarjeta>
            </div>

            {personas.length === 0 ? (
              <div style={{ padding: "0 16px 16px" }}>
                <Vacio>Nadie en esa fecha.</Vacio>
              </div>
            ) : (
              <TablaScroll>
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Colaborador</Th>
                      <Th>Cumpleaños</Th>
                      <Th>Cargo</Th>
                      <Th>Empresa</Th>
                      <Th>Correo</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((persona) => (
                      <Fila key={persona.personaId}>
                        <Td data-etiqueta="Colaborador">{persona.nombre}</Td>
                        <Td data-etiqueta="Cumpleaños">
                          {String(persona.dia).padStart(2, "0")}/
                          {String(persona.mes).padStart(2, "0")}
                        </Td>
                        <Td data-etiqueta="Cargo">
                          {persona.cargo ?? <TextoTenue>—</TextoTenue>}
                        </Td>
                        <Td data-etiqueta="Empresa">{persona.empresa}</Td>
                        <Td data-etiqueta="Correo">
                          {persona.correos?.length > 0 ? (
                            persona.correos.join(", ")
                          ) : (
                            /* Sin correo no hay tarjeta, y es lo único que hay que
                               arreglar para que la haya: se marca en rojo. */
                            <Badge $tono="peligro">Sin correo</Badge>
                          )}
                        </Td>
                      </Fila>
                    ))}
                  </tbody>
                </Tabla>
              </TablaScroll>
            )}
          </Tarjeta>
        </>
      )}

      <Tarjeta $sinRelleno>
        <div
          style={{
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <TituloTarjeta style={{ margin: 0 }}>Últimos envíos</TituloTarjeta>
          <ButtonUI
            text="Actualizar"
            iconLeft="FaRotate"
            variant="ghost"
            onClick={recargarHistorial}
          />
        </div>

        {cargandoHistorial ? (
          <LoaderUI text="Cargando el historial…" height="140px" />
        ) : (historial ?? []).length === 0 ? (
          <div style={{ padding: "0 16px 16px" }}>
            <Vacio>Todavía no se ha enviado ningún aviso de cumpleaños.</Vacio>
          </div>
        ) : (
          <TablaScroll>
            <Tabla>
              <thead>
                <tr>
                  <Th>Cuándo</Th>
                  <Th>Correo</Th>
                  <Th>Para</Th>
                  <Th>Resultado</Th>
                  <Th>Detalle</Th>
                </tr>
              </thead>
              <tbody>
                {(historial ?? []).map((renglon) => (
                  <Fila key={renglon.id}>
                    <Td data-etiqueta="Cuándo">
                      {String(renglon.fechaEnvio ?? "").slice(0, 16).replace("T", " ")}
                      <TextoTenue> · {renglon.disparadoPor}</TextoTenue>
                    </Td>
                    <Td data-etiqueta="Correo">
                      {renglon.tipo}
                      {renglon.tipo === "Anticipado" && (
                        <TextoTenue> · {renglon.diasAnticipacion} día(s)</TextoTenue>
                      )}
                    </Td>
                    <Td data-etiqueta="Para">
                      {renglon.persona && <div>{renglon.persona}</div>}
                      <TextoTenue>{renglon.destinatarios}</TextoTenue>
                    </Td>
                    <Td data-etiqueta="Resultado">
                      <Badge $tono={renglon.exitoso ? "exito" : "peligro"}>
                        {renglon.exitoso ? "Enviado" : "Falló"}
                      </Badge>
                    </Td>
                    <Td data-etiqueta="Detalle">{renglon.mensaje}</Td>
                  </Fila>
                ))}
              </tbody>
            </Tabla>
          </TablaScroll>
        )}
      </Tarjeta>
    </div>
  );
};

export default EditorCumpleanios;
