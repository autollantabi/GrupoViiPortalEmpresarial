import React, { useState } from "react";
import styled from "styled-components";
import { LoaderCirculos } from "./Loaders";

const iconos = {
  update: "bi bi-arrow-repeat", // Actualizar
  save: "bi bi-floppy", // Guardar
  delete: "bi bi-trash", // Eliminar
  edit: "bi bi-pencil-square", // Editar
  cancel: "bi bi-x-circle", // Cancelar
  add: "bi bi-plus-circle", // Añadir
  view: "bi bi-eye", // Ver
  download: "bi bi-download", // Descargar
  upload: "bi bi-upload", // Subir
  search: "bi bi-search", // Buscar
  check: "bi bi-check-circle", // Confirmar / Aceptar
  warning: "bi bi-exclamation-triangle", // Advertencia
  info: "bi bi-info-circle", // Información
  settings: "bi bi-gear", // Configuración
  lock: "bi bi-lock", // Bloquear
  unlock: "bi bi-unlock", // Desbloquear
  share: "bi bi-share", // Compartir
  refresh: "bi bi-arrow-clockwise", // Refrescar
  home: "bi bi-house", // Inicio
  user: "bi bi-person", // Usuario
  cart: "bi bi-cart", // Carrito de compras
  heart: "bi bi-heart", // Favoritos / Me gusta
  star: "bi bi-star", // Destacado / Favorito
  message: "bi bi-chat-dots", // Mensaje
  email: "bi bi-envelope", // Correo electrónico
  phone: "bi bi-telephone", // Teléfono
  calendar: "bi bi-calendar", // Calendario
  clock: "bi bi-clock", // Reloj / Tiempo
  file: "bi bi-file-earmark", // Archivo
  folder: "bi bi-folder", // Carpeta
  chart: "bi bi-bar-chart", // Gráfico / Estadísticas
  map: "bi bi-map", // Mapa
  camera: "bi bi-camera", // Cámara / Foto
  music: "bi bi-music-note", // Música
  video: "bi bi-camera-video", // Video
  help: "bi bi-question-circle", // Ayuda
  power: "bi bi-power", // Encender / Apagar
  globe: "bi bi-globe", // Mundo / Internet
  filter: "bi bi-funnel", // Filtrar
  bell: "bi bi-bell", // Notificaciones
  tag: "bi bi-tag", // Etiqueta
  creditCard: "bi bi-credit-card", // Tarjeta de crédito
  gift: "bi bi-gift", // Regalo
  downloadCloud: "bi bi-cloud-download", // Descargar desde la nube
  uploadCloud: "bi bi-cloud-upload", // Subir a la nube
  arrowUp: "bi bi-arrow-up", // Flecha arriba
  arrowDown: "bi bi-arrow-down", // Flecha abajo
  arrowLeft: "bi bi-arrow-left", // Flecha izquierda
  arrowRight: "bi bi-arrow-right", // Flecha derecha
  play: "bi bi-play-circle", // Reproducir
  pause: "bi bi-pause-circle", // Pausar
  stop: "bi bi-stop-circle", // Detener
  rewind: "bi bi-skip-backward-circle", // Rebobinar
  forward: "bi bi-skip-forward-circle", // Avanzar
  alert: "bi bi-exclamation-octagon", // Alerta
  minuscircle: "bi bi-dash-circle",
  excel: "bi bi-filetype-xlsx",
  pdf: "bi bi-filetype-pdf",
};

const BotonS = styled.button`
  border: none;
  border-radius: 4px;
  outline: none;
  padding: 2px 6px;
  max-width: 220px;
  background-color: var(--secondary);
  color: var(--color-perla);

  &:disabled {
    background-color: var(--color-3);
  }
`;

export const BotonConEstadoTexto = ({
  textoInicial,
  textoActualizando,
  textoExito,
  textoError,
  onClickAction,
  time = 8000,
}) => {
  const [accionBoton, setAccionBoton] = useState(0);

  const handleClick = async () => {
    setAccionBoton(1);
    const res = await onClickAction();
    if (res) {
      setAccionBoton(2);
    } else {
      setAccionBoton(3);
    }
    setTimeout(() => {
      setAccionBoton(0);
    }, time);
  };

  return (
    <BotonS onClick={handleClick} disabled={accionBoton !== 0}>
      {accionBoton === 0
        ? textoInicial
        : accionBoton === 1
        ? textoActualizando
        : accionBoton === 2
        ? textoExito
        : textoError}
    </BotonS>
  );
};

export const BotonConEstadoIconos = ({
  tipo,
  onClickAction,
  invertir,
  customstyle,
  iconStyle = {}
}) => {
  const [accionBoton, setAccionBoton] = useState(0);

  const tipoIcono = (tipoB) => {
    const claseIcono = iconos[tipoB] || iconos["default"];
    return <i className={claseIcono} style={iconStyle}></i>;
  };

  const handleClick = async () => {
    setAccionBoton(1); // Estado de carga (Loader)
    
    try {
      const res = await onClickAction();
      setAccionBoton(res ? 2 : 3); // Si éxito, estado "check", si falla, estado "alert"
    } catch (error) {
      console.error("Error en onClickAction:", error);
      setAccionBoton(3); // Error, estado "alert"
    }

    setTimeout(() => {
      setAccionBoton(0); // Regresar a estado inicial después de 2 segundos
    }, 2000);
  };

  return (
    <BotonS
      onClick={handleClick}
      disabled={accionBoton !== 0}
      style={{
        ...(invertir && { background: "white", color: "var(--secondary)" }),
        ...customstyle, // Corregido: Spread en lugar de array
      }}
    >
      {accionBoton === 0 ? (
        tipoIcono(tipo)
      ) : accionBoton === 1 ? (
        <LoaderCirculos />
      ) : accionBoton === 2 ? (
        tipoIcono("check")
      ) : (
        tipoIcono("alert")
      )}
    </BotonS>
  );
};
