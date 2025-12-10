import React, { useState , useEffect } from "react";
// import "./VentanaEmergente.css";

function Carga(iniciador) {
  const [anchoBarraTiempo, setAnchoBarraTiempo] = useState("95%");
  console.log(iniciador.iniciador);

  useEffect(() => {
    if (iniciador.iniciador === true) {
      setAnchoBarraTiempo("0%");
    }
  }, [iniciador.iniciador]);

  return (
    <div>
      <div id="ventana-emergente" className="ventana-emergente">
        <span>*Usuario no valido*</span>
        <div className="barra-tiempo" style={{ width: anchoBarraTiempo }}></div>
      </div>
    </div>
  );
}

export default Carga;
