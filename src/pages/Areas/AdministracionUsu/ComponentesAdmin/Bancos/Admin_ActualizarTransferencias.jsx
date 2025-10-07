import React, { useEffect, useState } from "react";
import { obtenerFechaHoraEjecucionBatBancosTransaccionesCartera } from "services/transaccionesService";
import { CustomButton } from "components/UI/CustomComponents/CustomButtons";
import { CustomContainer } from "components/UI/CustomComponents/CustomComponents";

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
    <CustomContainer flexDirection="column" style={{ gap: "10px" }}>
      <span>Ultima Actualización: {horaFecha}</span>
      <CustomButton
        text="Actualizar Transacciones"
        onClick={handleActualizarTransacciones}
        isAsync
      />
    </CustomContainer>
  );
};
