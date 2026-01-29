import React, { useState, useEffect } from 'react';

const Reloj = () => {
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraActual(new Date());
    }, 1000);

    // Limpieza al desmontar el componente
    return () => clearInterval(intervalo);
  }, []);

  // Formatea la hora a hh:mm:ss
  const formatearHora = (hora) => {
    return hora.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div>{formatearHora(horaActual)}</div>
  );
}

export default Reloj;