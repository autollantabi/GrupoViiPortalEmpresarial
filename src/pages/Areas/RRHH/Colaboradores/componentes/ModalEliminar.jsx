import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ModalUI } from "components/UI/Components/ModalUI";
import { CampoLabel } from "./CampoLabel";
import { Acciones, AreaTexto, Aviso } from "./piezas";

/**
 * Confirmación de borrado de una ficha.
 *
 * Usa ModalUI y no ModalConfirmacionUI porque el API exige un motivo de al menos
 * 5 caracteres, y ModalConfirmacionUI solo acepta un mensaje de texto: no tiene
 * dónde poner el campo.
 */
export const ModalEliminar = ({ abierto, ficha, onCerrar, onConfirmar }) => {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setMotivo("");
    setError(null);
    setEnviando(false);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCerrar?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto, onCerrar]);

  const enviar = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const limpio = motivo.trim();
    if (limpio.length < 5) {
      setError("Escriba por qué se elimina la ficha (mínimo 5 caracteres).");
      return;
    }

    setEnviando(true);
    try {
      await onConfirmar(limpio);
    } catch (e) {
      toast.error(e.message || "No se pudo eliminar la ficha");
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <ModalUI isOpen={abierto} onClose={onCerrar} title="Eliminar ficha" width="520px" noFooter>
      <form onSubmit={enviar} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Aviso $tono="neutro">
            Eliminar no es lo mismo que dar de baja. <strong>Dar de baja</strong> deja
            constancia de que la persona salió de la empresa. <strong>Eliminar</strong> se
            usa cuando la ficha nunca debió existir, por ejemplo si se creó por error
            o está duplicada.
          </Aviso>

          <Aviso $tono="aviso">
            Se eliminará la ficha de {ficha?.nombresCompletos} en {ficha?.empresa}. El
            registro se conserva en la bitácora y la cédula queda libre para volver a
            usarse.
          </Aviso>

          <CampoLabel etiqueta="Motivo" requerido error={error}>
            <AreaTexto
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value);
                setError(null);
              }}
              maxLength={500}
              rows={3}
              placeholder="Ficha duplicada por error de carga"
            />
          </CampoLabel>

          <Acciones>
            <ButtonUI
              type="submit"
              text={enviando ? "Eliminando…" : "Eliminar"}
              iconLeft="FaTrashCan"
              disabled={enviando}
            />
            <ButtonUI text="Cancelar" variant="outlined" onClick={onCerrar} disabled={enviando} />
          </Acciones>
        </div>
      </form>
    </ModalUI>
  );
};

export default ModalEliminar;
