import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import IconUI from "components/UI/Components/IconsUI";
import { InputUI } from "components/UI/Components/InputUI";
import { LoaderUI } from "components/UI/Components/LoaderUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { useTheme } from "context/ThemeContext";
import { ObtenerColaborador } from "services/colaboradoresService";
import {
  EmitirCertificadoAntiguedad,
  EmitirCertificadoIngresos,
  EmitirCertificadoPazSalvo,
  EmitirCertificadoTrabajo,
  ObtenerCertificadosEmpleado,
  ObtenerUrlCertificado,
} from "services/certificadosService";
import { CabeceraFicha } from "../componentes/CabeceraFicha";
import { CampoLabel } from "../componentes/CampoLabel";
import { ModalVerActa } from "../componentes/ModalVerActa";
import { PestanasFicha } from "../componentes/PestanasFicha";
import { TablaCertificados } from "../componentes/TablaCertificados";
import { useConsulta } from "../hooks/useConsulta";
import {
  Acciones,
  CirculoIcono,
  Contenedor,
  Rejilla,
  Tarjeta,
  TextoTenue,
  TituloTarjeta,
  Vacio,
} from "../componentes/piezas";
import { ESTADO } from "../utils/constantes";

const TITULOS = {
  Trabajo: "Certificado de trabajo",
  Ingresos: "Certificado de ingresos",
  Antiguedad: "Certificado de antigüedad",
  PazYSalvo: "Certificado de paz y salvo",
};

/** Pide destino (siempre) y monto (solo Ingresos, porque este módulo no tiene nómina integrada). */
const ModalEmitirCertificado = ({ abierto, tipo, onCerrar, onConfirmar }) => {
  const [destino, setDestino] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setDestino("");
    setMonto("");
    setError(null);
    setEnviando(false);
  }, [abierto, tipo]);

  const esIngresos = tipo === "Ingresos";

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const numero = Number(monto);
    if (esIngresos && (!monto || !Number.isFinite(numero) || numero <= 0)) {
      setError("Indique un monto válido, mayor a 0.");
      return;
    }
    setError(null);

    setEnviando(true);
    try {
      await onConfirmar({
        destino: destino.trim() || null,
        ...(esIngresos ? { monto: numero } : {}),
      });
    } catch (e) {
      toast.error(e.message || "No se pudo emitir el certificado");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto || !tipo) return null;

  return (
    <ModalUI isOpen={abierto} onClose={onCerrar} title={TITULOS[tipo]} width="460px" noFooter>
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {esIngresos && (
            <CampoLabel
              etiqueta="Monto mensual (USD)"
              requerido
              error={error}
              ayuda="Se tipea a mano: este módulo no integra nómina."
            >
              <InputUI
                type="number"
                value={monto}
                onChange={setMonto}
                min={0.01}
                step="0.01"
                placeholder="450.00"
              />
            </CampoLabel>
          )}

          <CampoLabel etiqueta="Destino / motivo" ayuda="Opcional. Ej: trámite bancario, IESS, visa.">
            <InputUI value={destino} onChange={setDestino} maxLength={200} placeholder="Trámite bancario" />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Generando…" : "Generar certificado"}
              iconLeft="FaFilePdf"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

/**
 * Pestaña Certificados: emite y lista los certificados laborales y de paz y
 * salvo de un colaborador.
 *
 * El de paz y salvo solo se ofrece para fichas Inactivas (igual criterio que
 * la pestaña Paz y salvo): el backend igual lo rechazaría para un activo, por
 * no tener checklist de baja, pero no tiene sentido ni mostrar el botón.
 */
export const ColCertificados = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const [tipoAEmitir, setTipoAEmitir] = useState(null);
  const [certificadoUrl, setCertificadoUrl] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const { datos: ficha } = useConsulta(({ signal }) => ObtenerColaborador(id, { signal }), [id]);

  const {
    datos: certificados,
    cargando,
    error,
    recargar,
  } = useConsulta(({ signal }) => ObtenerCertificadosEmpleado(id, { signal }), [id]);

  const verCertificado = async (certificado) => {
    setOcupado(true);
    try {
      const url = await ObtenerUrlCertificado(certificado.id);
      setCertificadoUrl(url);
    } catch (e) {
      toast.error(e.message || "No se pudo abrir el certificado");
    } finally {
      setOcupado(false);
    }
  };

  const cerrarCertificado = () => {
    if (certificadoUrl) window.URL.revokeObjectURL(certificadoUrl);
    setCertificadoUrl(null);
  };

  const EMISORES = {
    Trabajo: EmitirCertificadoTrabajo,
    Ingresos: EmitirCertificadoIngresos,
    Antiguedad: EmitirCertificadoAntiguedad,
    PazYSalvo: EmitirCertificadoPazSalvo,
  };

  const confirmarEmision = async (datos) => {
    const emitir = EMISORES[tipoAEmitir];
    const creado = await emitir(id, datos);
    setTipoAEmitir(null);
    toast.success("Certificado generado.");
    recargar();
    await verCertificado(creado);
  };

  if (cargando) {
    return (
      <Contenedor>
        <Tarjeta>
          <LoaderUI text="Cargando los certificados…" height="240px" />
        </Tarjeta>
      </Contenedor>
    );
  }

  if (error || !certificados) {
    return (
      <Contenedor>
        <CabeceraFicha ficha={ficha} />
        <PestanasFicha id={id} />
        <Tarjeta>
          <Vacio>
            <CirculoIcono $tono="peligro">
              <IconUI name="FaTriangleExclamation" size={26} color={theme?.colors?.error} />
            </CirculoIcono>
            <strong>No se pudo cargar los certificados</strong>
            <TextoTenue>{error ?? "Vuelva a intentarlo."}</TextoTenue>
            <ButtonUI text="Reintentar" iconLeft="FaRotateRight" onClick={recargar} />
          </Vacio>
        </Tarjeta>
      </Contenedor>
    );
  }

  const mostrarPazSalvo = ficha && ficha.estado !== ESTADO.ACTIVO;

  return (
    <Contenedor translate="no" className="notranslate">
      <CabeceraFicha ficha={ficha} />

      <PestanasFicha id={id} />

      <Tarjeta>
        <TituloTarjeta>Emitir certificado</TituloTarjeta>
        <Rejilla $min={200}>
          <ButtonUI
            text="Certificado de trabajo"
            iconLeft="FaFileLines"
            variant="outlined"
            onClick={() => setTipoAEmitir("Trabajo")}
          />
          <ButtonUI
            text="Certificado de ingresos"
            iconLeft="FaFileInvoiceDollar"
            variant="outlined"
            onClick={() => setTipoAEmitir("Ingresos")}
          />
          <ButtonUI
            text="Certificado de antigüedad"
            iconLeft="FaCalendarCheck"
            variant="outlined"
            onClick={() => setTipoAEmitir("Antiguedad")}
          />
          {mostrarPazSalvo && (
            <ButtonUI
              text="Certificado de paz y salvo"
              iconLeft="FaClipboardCheck"
              variant="outlined"
              onClick={() => setTipoAEmitir("PazYSalvo")}
            />
          )}
        </Rejilla>
      </Tarjeta>

      <Tarjeta $sinRelleno>
        {certificados.length === 0 ? (
          <Vacio>
            <CirculoIcono $tono="info">
              <IconUI name="FaFileCircleCheck" size={26} color={theme?.colors?.info} />
            </CirculoIcono>
            <strong>Todavía no se ha emitido ningún certificado</strong>
            <TextoTenue>Use los botones de arriba para generar el primero.</TextoTenue>
          </Vacio>
        ) : (
          <TablaCertificados certificados={certificados} ocupado={ocupado} onVer={verCertificado} />
        )}
      </Tarjeta>

      <ModalEmitirCertificado
        abierto={tipoAEmitir !== null}
        tipo={tipoAEmitir}
        onCerrar={() => setTipoAEmitir(null)}
        onConfirmar={confirmarEmision}
      />

      <ModalVerActa
        abierto={certificadoUrl !== null}
        url={certificadoUrl}
        titulo="Certificado"
        onCerrar={cerrarCertificado}
      />
    </Contenedor>
  );
};

export default ColCertificados;
