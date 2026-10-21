import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { ActualizarMembreteEmpresa, ObtenerEmpresas } from "services/empresasService";
import { CampoLabel } from "./CampoLabel";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  Aviso,
  Badge,
  Fila,
  FilaFormulario,
  Tabla,
  TablaScroll,
  Tarjeta,
  Td,
  TextoTenue,
  Th,
  TituloTarjeta,
} from "./piezas";

/**
 * Membrete de cada empresa del grupo (razón social, RUC, representante legal,
 * dirección, teléfono), lo que los certificados necesitan para su encabezado
 * y firma (ver CertificadosRrhhPdf.ts).
 *
 * No hay "nueva empresa": las del grupo son fijas y vienen sembradas; esto
 * solo completa su membrete. Sin razón social y RUC completos,
 * CertificadosRrhhService rechaza emitir un certificado de esa empresa.
 */

const soloDigitos = (valor) => valor.replace(/\D/g, "");

const ModalMembrete = ({ abierto, empresa, onCerrar, onGuardar }) => {
  const [valores, setValores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto || !empresa) return;
    setValores({
      razonSocial: empresa.razonSocial ?? "",
      ruc: empresa.ruc ?? "",
      representanteLegalNombre: empresa.representanteLegalNombre ?? "",
      representanteLegalCargo: empresa.representanteLegalCargo ?? "",
      direccion: empresa.direccion ?? "",
      telefono: empresa.telefono ?? "",
    });
    setError(null);
    setEnviando(false);
  }, [abierto, empresa]);

  const campo = (clave) => (valor) => setValores((previos) => ({ ...previos, [clave]: valor }));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    if (valores.ruc && valores.ruc.length !== 13) {
      setError("El RUC debe tener 13 dígitos.");
      return;
    }
    setError(null);

    const aTexto = (valor) => {
      const limpio = (valor ?? "").trim();
      return limpio.length === 0 ? null : limpio;
    };

    setEnviando(true);
    try {
      await onGuardar({
        razonSocial: aTexto(valores.razonSocial),
        ruc: aTexto(valores.ruc),
        representanteLegalNombre: aTexto(valores.representanteLegalNombre),
        representanteLegalCargo: aTexto(valores.representanteLegalCargo),
        direccion: aTexto(valores.direccion),
        telefono: aTexto(valores.telefono),
      });
    } catch (e) {
      toast.error(e.message || "No se pudo guardar el membrete");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !empresa) return null;

  return (
    <ModalUI
      isOpen={abierto}
      onClose={onCerrar}
      title={`Membrete de ${empresa.nombre}`}
      width="560px"
      maxWidth="94vw"
      noFooter
    >
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CampoLabel
            etiqueta="Razón social"
            ayuda="Como debe aparecer en los certificados. Si queda vacía, se usa el nombre corto."
          >
            <InputUI
              value={valores.razonSocial ?? ""}
              onChange={campo("razonSocial")}
              maxLength={200}
            />
          </CampoLabel>

          <CampoLabel etiqueta="RUC" error={error} ayuda="13 dígitos.">
            <InputUI
              value={valores.ruc ?? ""}
              onChange={(valor) => campo("ruc")(soloDigitos(valor))}
              maxLength={13}
            />
          </CampoLabel>

          <FilaFormulario>
            <CampoLabel etiqueta="Representante legal">
              <InputUI
                value={valores.representanteLegalNombre ?? ""}
                onChange={campo("representanteLegalNombre")}
                maxLength={150}
              />
            </CampoLabel>
            <CampoLabel etiqueta="Cargo del representante">
              <InputUI
                value={valores.representanteLegalCargo ?? ""}
                onChange={campo("representanteLegalCargo")}
                maxLength={100}
                placeholder="Gerente General"
              />
            </CampoLabel>
          </FilaFormulario>

          <CampoLabel etiqueta="Dirección">
            <InputUI value={valores.direccion ?? ""} onChange={campo("direccion")} maxLength={250} />
          </CampoLabel>

          <CampoLabel etiqueta="Teléfono">
            <InputUI value={valores.telefono ?? ""} onChange={campo("telefono")} maxLength={30} />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Guardando…" : "Guardar"}
              iconLeft="FaFloppyDisk"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export const EditorEmpresas = () => {
  const {
    datos: empresas,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerEmpresas({ signal }), []);

  const [enEdicion, setEnEdicion] = useState(null);

  const guardar = async (datos) => {
    await ActualizarMembreteEmpresa(enEdicion.id, datos);
    setEnEdicion(null);
    toast.success("Membrete actualizado.");
    recargar();
  };

  if (cargando) return <LoaderUI text="Cargando las empresas…" height="200px" />;

  if (error) {
    return (
      <Aviso $tono="peligro">
        {error} <ButtonUI text="Reintentar" variant="ghost" onClick={recargar} />
      </Aviso>
    );
  }

  return (
    <Tarjeta $sinRelleno>
      <div style={{ padding: 16 }}>
        <TituloTarjeta style={{ margin: 0 }}>Empresas — membrete para certificados</TituloTarjeta>
        <TextoTenue>
          Razón social, RUC y representante legal de cada empresa del grupo. Sin estos datos
          completos no se puede emitir un certificado de esa empresa.
        </TextoTenue>
      </div>

      <TablaScroll>
        <Tabla>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Razón social</Th>
              <Th>RUC</Th>
              <Th>Representante legal</Th>
              <Th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {(empresas ?? []).length === 0 ? (
              <tr>
                <Td colSpan={5}>
                  <TextoTenue>Sin empresas registradas.</TextoTenue>
                </Td>
              </tr>
            ) : (
              empresas.map((empresa) => {
                const completo = Boolean(empresa.razonSocial && empresa.ruc);
                return (
                  <Fila key={empresa.id}>
                    <Td>
                      {empresa.nombre}
                      {!completo && (
                        <>
                          {" "}
                          <Badge $tono="aviso">Membrete incompleto</Badge>
                        </>
                      )}
                    </Td>
                    <Td>{empresa.razonSocial || "—"}</Td>
                    <Td>{empresa.ruc || "—"}</Td>
                    <Td>
                      {empresa.representanteLegalNombre || "—"}
                      {empresa.representanteLegalCargo ? ` (${empresa.representanteLegalCargo})` : ""}
                    </Td>
                    <Td>
                      <Acciones>
                        <ButtonUI
                          text=""
                          iconLeft="FaPenToSquare"
                          variant="ghost"
                          title="Editar membrete"
                          onClick={() => setEnEdicion(empresa)}
                        />
                      </Acciones>
                    </Td>
                  </Fila>
                );
              })
            )}
          </tbody>
        </Tabla>
      </TablaScroll>

      <ModalMembrete
        abierto={enEdicion !== null}
        empresa={enEdicion}
        onCerrar={() => setEnEdicion(null)}
        onGuardar={guardar}
      />
    </Tarjeta>
  );
};

export default EditorEmpresas;
