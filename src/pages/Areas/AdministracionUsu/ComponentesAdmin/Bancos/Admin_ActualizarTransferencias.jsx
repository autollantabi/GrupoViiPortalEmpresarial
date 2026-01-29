import React, { useEffect, useState } from "react";
import { obtenerFechaHoraEjecucionBatBancosTransaccionesCartera } from "services/transaccionesService";
import { ButtonUI } from "components/UI/Components/ButtonUI";
import { ContainerUI } from "components/UI/Components/ContainerUI";

export const Admin_ActualizarTransferencias = () => {
  const [horaFecha, setHoraFecha] = useState("consultando...");

  const ultimaHoraFecha = async () => {
    setHoraFecha("consultando...");
    const horafecha =
      await obtenerFechaHoraEjecucionBatBancosTransaccionesCartera();
    setHoraFecha(horafecha);
  };

  const handleActualizarTransacciones = async () => {
    const res = await EjecutarBatBancosTransaccionesCartera();
    await ultimaHoraFecha();
    return res;
  };

  useEffect(() => {
    ultimaHoraFecha();
  }, []);

  return (
    <ContainerUI flexDirection="column" style={{ gap: "10px" }}>
      <span>Ultima Actualización: {horaFecha}</span>
      <ButtonUI
        text="Actualizar Transacciones"
        onClick={handleActualizarTransacciones}
        isAsync
      />
    </ContainerUI>
  );
};
