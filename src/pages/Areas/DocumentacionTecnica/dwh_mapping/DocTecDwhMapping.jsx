import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { DocTec_ObtenerDwhMapping } from "./servicios";
import { RaizDoc } from "../estilos/RaizDoc";

/* =====================================================================================
   DWH mapping: cada columna del almacén de datos (core.dim_item) hacia su origen en SAP HANA,
   con diagrama de transformación, regla de cálculo, guía interactiva y valores reales.
   ===================================================================================== */

/** Ruta del Diccionario (mismo criterio del portal: recurso "documentaciontecnica.diccionario"). */
const RUTA_DICCIONARIO = "/documentaciontecnica/diccionario";

const Estilos = styled.div`
  display: grid;
  grid-template-columns: minmax(230px, 27%) 1fr;
  flex: 1;
  min-height: 0;

  /* ---------- Panel lateral ---------- */
  .dwh-sidebar {
    background: var(--panel);
    border-right: 1px solid var(--borde);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0;
  }
  .dwh-sidebar-header {
    padding: 16px 18px 14px;
    border-bottom: 1px solid var(--borde);
    background: var(--panel);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .dwh-db-badge-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 8px;
  }
  .dwh-db-etiqueta {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--suave);
  }
  .dwh-db-pill {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    font: 700 11.5px var(--fuente-mono);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .dwh-selector-tabla-wrap {
    margin-bottom: 10px;
  }
  .dwh-sidebar-subetiqueta {
    display: block;
    font-size: 11px;
    color: var(--suave);
    font-weight: 600;
    margin-bottom: 4px;
  }
  .dwh-select {
    width: 100%;
    padding: 7px 10px;
    border-radius: 6px;
    border: 1px solid var(--borde);
    background: var(--bg);
    color: var(--texto);
    font-family: var(--fuente-mono);
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
  }
  .dwh-select:focus {
    outline: 2px solid var(--acento);
    border-color: transparent;
    background: var(--panel);
  }
  .dwh-sidebar-buscar-wrap {
    position: relative;
  }
  .dwh-sidebar-buscar-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--suave);
    font-size: 12px;
    pointer-events: none;
  }
  .dwh-sidebar-buscar {
    width: 100%;
    padding: 7px 12px 7px 30px;
    border: 1px solid var(--borde);
    border-radius: 6px;
    background: var(--bg);
    color: var(--texto);
    font: inherit;
    font-size: 13px;
    transition: all 0.15s ease;
  }
  .dwh-sidebar-buscar:focus {
    outline: 2px solid var(--acento);
    background: var(--panel);
    border-color: transparent;
  }
  .dwh-modulo-titulo {
    padding: 14px 18px 4px;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 800;
    color: var(--suave);
  }
  .dwh-item-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    padding: 8px 18px;
    border: 0;
    background: none;
    color: var(--texto);
    cursor: pointer;
    font: inherit;
    border-left: 3px solid transparent;
    transition: background 0.12s, border-color 0.12s;
  }
  .dwh-item-nav:hover {
    background: var(--hover);
  }
  .dwh-item-nav.activo {
    background: var(--acento-fondo);
    border-left-color: var(--marca);
  }
  .dwh-item-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .dwh-item-nav b {
    font-size: 13px;
    color: var(--titulo);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dwh-item-nav .dwh-item-sub {
    color: var(--suave);
    font-size: 11.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dwh-item-count {
    font-size: 11px;
    font-family: var(--fuente-mono);
    color: var(--suave);
    background: var(--bg);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .dwh-item-nav.activo .dwh-item-count {
    background: var(--panel);
    color: var(--acento-texto);
    font-weight: 700;
  }

  /* ---------- Detalle ---------- */
  .dwh-detalle {
    padding: 24px 28px 64px;
    overflow-y: auto;
    min-height: 0;
  }
  .dwh-detalle-interno {
    max-width: 1060px;
  }
  .dwh-hero-card {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  }
  .dwh-hero-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 6px;
  }
  .dwh-hero-titulo-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .dwh-hero-titulo {
    margin: 0;
    font-size: 26px;
    font-weight: 800;
    font-family: var(--fuente-mono);
    color: var(--titulo);
    letter-spacing: 0.02em;
  }
  .dwh-hero-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .dwh-chip-badge {
    background: var(--bg);
    color: var(--suave);
    border: 1px solid var(--borde);
    border-radius: 4px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
  }
  .dwh-chip-badge.acento {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    border-color: transparent;
    font-family: var(--fuente-mono);
    font-weight: 700;
  }
  .dwh-contador-pill {
    background: var(--acento-fondo);
    color: var(--acento-texto);
    font: 700 11.5px var(--fuente-mono);
    padding: 3px 9px;
    border-radius: 999px;
  }
  .dwh-hero-sub {
    color: var(--suave);
    font-size: 13.5px;
    margin-bottom: 12px;
  }
  .dwh-hero-desc {
    font-size: 13.5px;
    color: var(--texto);
    line-height: 1.55;
    padding-top: 12px;
    border-top: 1px solid var(--borde);
  }
  .dwh-seccion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 28px 0 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .dwh-seccion-titulo {
    margin: 0;
    font-size: 13.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--titulo);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dwh-seccion-guia {
    font-size: 12px;
    color: var(--suave);
  }

  /* ---------- Tabla de columnas ---------- */
  .dwh-card-tabla {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    margin-bottom: 24px;
  }
  .dwh-tabla {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 13px;
    table-layout: fixed;
  }
  .dwh-tabla th {
    background: var(--bg);
    padding: 10px 14px;
    border-bottom: 1px solid var(--borde);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--suave);
    font-weight: 700;
  }
  .dwh-tabla td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--borde);
    vertical-align: top;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .dwh-tabla tr:last-child td {
    border-bottom: 0;
  }
  .dwh-tabla th:nth-child(1) {
    width: 210px;
  }
  .dwh-tabla th:nth-child(3) {
    width: 24%;
  }
  .dwh-tabla th:nth-child(4) {
    width: 44px;
    text-align: center;
  }
  .dwh-tabla td:first-child {
    overflow-wrap: normal;
    word-break: normal;
  }
  .dwh-fila {
    cursor: pointer;
    transition: background 0.1s ease;
  }
  .dwh-fila:hover td {
    background: var(--hover);
  }
  .dwh-fila.abierta td {
    background: var(--acento-fondo);
    border-bottom-color: transparent;
  }
  .dwh-col-nombre {
    font-family: var(--fuente-mono);
    font-weight: 700;
    color: var(--titulo);
    display: block;
    font-size: 13px;
  }
  .dwh-col-cat {
    font-size: 11px;
    color: var(--suave);
    display: inline-block;
    margin-top: 2px;
  }
  .dwh-badge-sap {
    font-family: var(--fuente-mono);
    font-size: 11.5px;
    font-weight: 700;
    color: var(--acento-texto);
    background: var(--bg);
    border: 1px solid var(--borde);
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
  }
  .dwh-chev-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: var(--bg);
    color: var(--suave);
    font-size: 10px;
    transition: transform 0.15s ease, background 0.15s;
  }
  .dwh-fila:hover .dwh-chev-icon {
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }
  .dwh-fila.abierta .dwh-chev-icon {
    transform: rotate(90deg);
    background: var(--acento-boton);
    color: var(--sobre-acento);
  }

  /* ---------- Detalle expandido ---------- */
  .dwh-detalle-fila > td {
    background: var(--detalle-fondo);
    padding: 16px 20px 20px 38px;
    border-bottom: 1px solid var(--borde);
  }
  .dwh-detalle-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .dwh-detalle-seccion-titulo {
    font-size: 10.5px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--suave);
    margin-bottom: 4px;
  }
  .dwh-dg {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 14px 16px;
  }
  .dwh-dg-box {
    background: var(--bg);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 8px 12px;
    flex: 1;
    min-width: 0;
  }
  .dwh-dg-titulo {
    font-family: var(--fuente-mono);
    font-weight: 800;
    font-size: 12px;
    color: var(--titulo);
  }
  .dwh-dg-sub {
    font-size: 10.5px;
    color: var(--suave);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dwh-dg-pill {
    font-family: var(--fuente-mono);
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
  }
  .dwh-dg-origen {
    background: var(--acento-fondo);
    color: var(--acento-texto);
  }
  .dwh-dg-destino {
    background: var(--ok-fondo);
    color: var(--ok);
  }
  .dwh-dg-tag {
    font-size: 9.5px;
    font-weight: 700;
    opacity: 0.8;
    white-space: nowrap;
  }
  .dwh-dg-conector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 140px;
  }
  .dwh-dg-badge {
    font-size: 10.5px;
    font-weight: 700;
    font-family: var(--fuente-mono);
    color: var(--acento-texto);
    background: var(--sub-fondo);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    border: 1px solid var(--borde);
  }
  .dwh-dg-flecha {
    width: 100%;
    height: 16px;
  }
  .dwh-regla-texto {
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--texto);
    margin: 0;
    padding: 10px 14px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
  }
  .dwh-regla-texto code {
    font-family: var(--fuente-mono);
  }
  .dwh-pasos {
    display: grid;
    gap: 12px;
  }
  .dwh-pasos-tabla {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
  }
  .dwh-pasos-tabla caption {
    caption-side: top;
    text-align: left;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--texto-suave, var(--texto));
    padding: 0 2px 6px;
  }
  .dwh-pasos-tabla th,
  .dwh-pasos-tabla td {
    text-align: left;
    padding: 7px 12px;
    border-bottom: 1px solid var(--borde);
    vertical-align: top;
  }
  .dwh-pasos-tabla thead th {
    font-size: 11.5px;
    font-weight: 600;
  }
  .dwh-pasos-tabla tbody tr:last-child td {
    border-bottom: 0;
  }
  .dwh-pasos-n {
    width: 52px;
    font-weight: 700;
  }
  .dwh-enlaces {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .dwh-enlace {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--fuente-mono);
    font-size: 11.5px;
    font-weight: 700;
    color: var(--acento-texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    padding: 4px 10px;
    border-radius: 4px;
    text-decoration: none;
    transition: all 0.12s ease;
  }
  .dwh-enlace:hover {
    background: var(--acento-boton);
    color: var(--sobre-acento);
    border-color: var(--acento);
  }
  .dwh-enlace-apoyo {
    font-weight: 600;
    color: var(--suave);
  }
  .dwh-tabla-muestras {
    width: auto;
    min-width: 280px;
    max-width: 100%;
    border-collapse: collapse;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    overflow: hidden;
    font-size: 12px;
  }
  .dwh-tabla-muestras th {
    background: var(--sub-fondo);
    padding: 7px 12px;
    border-bottom: 1px solid var(--borde);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--suave);
    text-align: left;
  }
  .dwh-tabla-muestras td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--borde);
    font-family: var(--fuente-mono);
    color: var(--texto);
  }
  .dwh-tabla-muestras tr:last-child td {
    border-bottom: 0;
  }

  /* ---------- Guía interactiva (regla lookup) ---------- */
  .dwh-guia {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .dwh-guia-pasos {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    align-items: stretch;
    gap: 8px;
  }
  .dwh-guia-paso {
    position: relative;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 12px 14px 12px 44px;
    font-size: 12.5px;
    line-height: 1.45;
    color: var(--texto);
  }
  .dwh-guia-paso p {
    margin: 4px 0 0;
    color: var(--suave);
  }
  .dwh-guia-paso b {
    color: var(--texto);
  }
  .dwh-guia-num {
    position: absolute;
    left: 12px;
    top: 12px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--acento-boton);
    color: var(--sobre-acento);
    font-size: 12px;
    font-weight: 700;
    display: grid;
    place-items: center;
  }
  .dwh-guia-sig {
    align-self: center;
    color: var(--suave);
    font-size: 18px;
  }
  .dwh-guia-prueba {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .dwh-guia-prueba label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 700;
    color: var(--suave);
    min-width: 220px;
  }
  .dwh-guia-prueba select {
    font: inherit;
    font-size: 13px;
    font-weight: 400;
    color: var(--texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 7px 10px;
    cursor: pointer;
  }
  .dwh-guia-prueba select:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 1px;
  }
  .dwh-guia-prueba input[type="number"],
  .dwh-guia-prueba input[type="text"],
  .dwh-guia-prueba input[type="date"],
  .dwh-docs select {
    font: inherit;
    font-size: 13px;
    font-weight: 400;
    color: var(--texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 7px 10px;
  }
  .dwh-guia-prueba input:focus-visible,
  .dwh-docs select:focus-visible,
  .dwh-guia-atajos button:focus-visible {
    outline: 2px solid var(--acento);
    outline-offset: 1px;
  }
  .dwh-guia-atajos {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-self: flex-end;
  }
  .dwh-guia-atajos button {
    font: inherit;
    font-size: 12px;
    font-family: var(--fuente-mono);
    color: var(--texto);
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 999px;
    padding: 6px 12px;
    cursor: pointer;
  }
  .dwh-guia-atajos button:hover {
    border-color: var(--acento);
  }
  .dwh-guia-atajos button.activo {
    border-color: var(--acento);
    background: color-mix(in srgb, var(--acento) 14%, var(--panel));
    font-weight: 700;
  }
  .dwh-pasos-tabla tr.marcada td {
    background: color-mix(in srgb, var(--acento) 14%, var(--panel));
    font-weight: 600;
  }
  .dwh-pasos-tabla tr.marcada-2 td {
    background: color-mix(in srgb, var(--acento) 7%, var(--panel));
  }
  .dwh-pasos-tabla tr.tachada td {
    color: var(--suave);
    text-decoration: line-through;
  }
  .dwh-pasos-tabla tr.tachada td:last-child,
  .dwh-pasos-tabla tr.tachada td:nth-child(4) {
    text-decoration: none;
  }
  .dwh-guia-nota {
    margin: 0;
    font-size: 12px;
    color: var(--suave);
  }
  .dwh-guia-resultado {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--panel);
    border: 1px solid var(--borde);
    border-left-width: 4px;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
  }
  .dwh-guia-resultado.ok {
    border-left-color: var(--ok);
  }
  .dwh-guia-resultado.sin {
    border-left-color: var(--aviso);
  }
  .dwh-guia-etq {
    display: inline-block;
    min-width: 96px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--suave);
  }
  .dwh-guia-resultado small {
    color: var(--suave);
  }
  .dwh-guia-final {
    font-size: 14px;
  }
  .dwh-guia-orig {
    color: var(--suave);
    font-size: 12px;
  }
  .dwh-guia code,
  .dwh-guia-codigo {
    font-family: var(--fuente-mono);
  }
  .dwh-guia-det {
    background: var(--panel);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 12.5px;
  }
  .dwh-guia-det summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--acento-texto);
  }
  .dwh-guia-nota {
    margin: 10px 0 4px;
    color: var(--suave);
  }
  .dwh-guia-codigo {
    margin: 0;
    padding: 10px 12px;
    background: var(--acento-fondo);
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.5;
    overflow-x: auto;
    white-space: pre;
  }
  .dwh-guia-tabla-wrap {
    max-height: 260px;
    overflow: auto;
    margin-top: 10px;
    border: 1px solid var(--borde);
    border-radius: 6px;
  }
  .dwh-guia-tabla {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .dwh-guia-tabla th,
  .dwh-guia-tabla td {
    text-align: left;
    padding: 5px 10px;
    border-bottom: 1px solid var(--borde);
  }
  .dwh-guia-tabla th {
    position: sticky;
    top: 0;
    background: var(--panel);
    color: var(--suave);
  }
  .dwh-guia-tabla tr.marcada td {
    background: var(--acento-fondo);
    font-weight: 700;
  }

  @media (max-width: 1100px) {
    .dwh-guia-pasos {
      grid-template-columns: 1fr;
    }
    .dwh-guia-sig {
      display: none;
    }
  }
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: 40% 1fr;
    .dwh-sidebar {
      border-right: 0;
      border-bottom: 1px solid var(--borde);
    }
    .dwh-detalle {
      padding: 16px;
    }
    .dwh-dg {
      flex-direction: column;
      gap: 8px;
    }
  }
`;

/* ----------------------------- utilidades ----------------------------- */

/** Renderiza un texto con etiquetas <code>…</code> y <b>…</b> como elementos React (sin HTML crudo). */
function TextoRico({ texto }) {
  const partes = String(texto || "").split(/(<code>.*?<\/code>|<b>.*?<\/b>)/g);
  return (
    <>
      {partes.map((p, i) => {
        const code = /^<code>(.*)<\/code>$/.exec(p);
        if (code) return <code key={i} className="mono">{code[1]}</code>;
        const b = /^<b>(.*)<\/b>$/.exec(p);
        if (b) return <b key={i}>{b[1]}</b>;
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

/* ----------------------------- bloques ----------------------------- */

function Diagrama({ item, nombreTabla }) {
  return (
    <div className="dwh-dg">
      <div className="dwh-dg-box">
        <div className="dwh-dg-titulo">{item.tabla}</div>
        <div className="dwh-dg-sub">{item.tabla_desc || "Origen SAP"}</div>
        <div className="dwh-dg-pill dwh-dg-origen">
          <span>{item.campo}</span>
        </div>
      </div>

      <div className="dwh-dg-conector">
        <span className="dwh-dg-badge">{item.regla_corta || "directo"}</span>
        <svg className="dwh-dg-flecha" viewBox="0 0 140 16" preserveAspectRatio="none">
          <line x1="2" y1="8" x2="128" y2="8" stroke="var(--acento)" strokeWidth="2" />
          <polygon points="136,8 126,4 126,12" fill="var(--acento)" />
        </svg>
      </div>

      <div className="dwh-dg-box">
        <div className="dwh-dg-titulo">{item.dest_tabla || nombreTabla}</div>
        <div className="dwh-dg-sub">{item.dest_desc || "Data Warehouse"}</div>
        <div className="dwh-dg-pill dwh-dg-destino">
          <span>{item.col}</span>
          <span className="dwh-dg-tag">{item.dest_tag || "CAMPO"}</span>
        </div>
      </div>
    </div>
  );
}

/** Enlaces a la sección Diccionario: una tabla por cada código de SAP del origen (p. ej. «OPQT + OPOR» da dos). */
function EnlacesDiccionario({ item, codigos }) {
  const enDiccionario = (t) => codigos.includes(t);
  const principales = (item.tabla || "").split("+").map((t) => t.trim()).filter(enDiccionario);
  const apoyo = (item.apoyo || []).filter((t) => enDiccionario(t) && !principales.includes(t));
  if (!principales.length && !apoyo.length) return null;
  const destino = (t) => `${RUTA_DICCIONARIO}#${encodeURIComponent(t)}`;
  return (
    <div className="dwh-enlaces">
      {principales.map((t) => (
        <Link key={t} className="dwh-enlace" to={destino(t)}>
          {`Ver ${t} en el diccionario`}
        </Link>
      ))}
      {apoyo.map((t) => (
        <Link key={t} className="dwh-enlace dwh-enlace-apoyo" to={destino(t)}>
          {`+ Tabla de apoyo: ver ${t} en el diccionario`}
        </Link>
      ))}
    </div>
  );
}

/** Guía interactiva de una regla de tipo «lookup» (tabla de correspondencias + excepción). */
function GuiaLookup({ guia }) {
  const ex = guia.excepcion;
  const [grupo, setGrupo] = useState(guia.filas[0]?.ext ?? "");
  const [categoria, setCategoria] = useState("otra");

  const porExcepcion = categoria === "excepcion";
  const llave = porExcepcion ? ex.llave : grupo;
  const fila = guia.filas.find((f) => f.ext === llave);
  const resultado = fila ? fila.nombre : guia.sin_coincidencia;
  const motivo = porExcepcion
    ? `la categoría es ${ex.valor}, así que se ignora el grupo de SAP`
    : "es el grupo de SAP en mayúsculas";

  return (
    <div className="dwh-guia">
      <div className="dwh-detalle-seccion-titulo">CÓMO SE ASIGNA, PASO A PASO</div>
      <div className="dwh-guia-pasos">
        <div className="dwh-guia-paso">
          <span className="dwh-guia-num">1</span>
          <strong>Se arma la llave</strong>
          <p>
            Es el grupo de SAP en mayúsculas.
            <br />
            Si la categoría es <b>{ex.valor}</b>, la llave es <b>{ex.llave}</b>.
          </p>
        </div>
        <span className="dwh-guia-sig">→</span>
        <div className="dwh-guia-paso">
          <span className="dwh-guia-num">2</span>
          <strong>Se busca en la tabla</strong>
          <p>Se compara la llave, igual y exacta, con la columna «Nombre en SAP» de la tabla de correspondencias.</p>
        </div>
        <span className="dwh-guia-sig">→</span>
        <div className="dwh-guia-paso">
          <span className="dwh-guia-num">3</span>
          <strong>Resultado</strong>
          <p>
            Se guarda la «Línea de negocio» encontrada.
            <br />
            Si no hay coincidencia, <b>{guia.sin_coincidencia}</b>.
          </p>
        </div>
      </div>

      <div className="dwh-detalle-seccion-titulo">PRUÉBALO</div>
      <div className="dwh-guia-prueba">
        <label>
          Grupo en SAP
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <optgroup label="Están en la tabla">
              {guia.filas.map((f) => (
                <option key={f.ext} value={f.ext}>
                  {f.ext}
                </option>
              ))}
            </optgroup>
            {guia.ejemplos_sin_tabla?.length > 0 && (
              <optgroup label="No están en la tabla (ejemplos reales)">
                {guia.ejemplos_sin_tabla.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label>
          {ex.campo === "Categoria" ? "Categoría" : ex.campo}
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="otra">Cualquier otra</option>
            <option value="excepcion">{ex.valor}</option>
          </select>
        </label>
      </div>

      <div className={`dwh-guia-resultado ${fila ? "ok" : "sin"}`} aria-live="polite">
        <div>
          <span className="dwh-guia-etq">1 · Llave</span> <b>{llave}</b> <small>({motivo})</small>
        </div>
        <div>
          <span className="dwh-guia-etq">2 · Búsqueda</span>{" "}
          {fila ? (
            <>
              <b>{llave}</b> sí está en la tabla: línea de negocio <b>{fila.nombre}</b> (abrev. {fila.abrev}).
            </>
          ) : (
            <>
              <b>{llave}</b> no está en la tabla.
            </>
          )}
        </div>
        <div className="dwh-guia-final">
          <span className="dwh-guia-etq">3 · Resultado</span> <code>dit_grupo</code> = <b>{resultado}</b>{" "}
          <span className="dwh-guia-orig">
            · <code>dit_grupo_original</code> = {grupo}
          </span>
        </div>
      </div>

      <details className="dwh-guia-det">
        <summary>Ver la tabla de correspondencias completa ({guia.filas.length} filas)</summary>
        <div className="dwh-guia-tabla-wrap">
          <table className="dwh-guia-tabla">
            <thead>
              <tr>
                <th>Nombre en SAP</th>
                <th>Línea de negocio</th>
                <th>Abrev.</th>
              </tr>
            </thead>
            <tbody>
              {guia.filas.map((f) => (
                <tr key={f.ext} className={fila && f.ext === llave ? "marcada" : ""}>
                  <td>{f.ext}</td>
                  <td>{f.nombre}</td>
                  <td>{f.abrev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="dwh-guia-det">
        <summary>Cómo está escrito en Talend</summary>
        <p className="dwh-guia-nota">
          Llave del lookup en el <code>tMap</code> (<code>X</code> es la fila de entrada de cada empresa):
        </p>
        <pre className="dwh-guia-codigo">{guia.talend}</pre>
        <p className="dwh-guia-nota">Salida de la columna de destino:</p>
        <pre className="dwh-guia-codigo">{guia.talend_salida}</pre>
      </details>
    </div>
  );
}

/* ----------------------------- simuladores interactivos ----------------------------- */

// Los espacios al inicio o al final se muestran como puntos medios (·), uno por espacio, para que se vean
const verEspacios = (t) => String(t).replace(/^ +| +$/g, (m) => "·".repeat(m.length));

/** Tres tarjetas numeradas («1 → 2 → 3») con el mismo estilo de la guía de dit_grupo. */
function PasosTarjetas({ pasos }) {
  return (
    <div className="dwh-guia-pasos">
      {pasos.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="dwh-guia-sig">→</span>}
          <div className="dwh-guia-paso">
            <span className="dwh-guia-num">{i + 1}</span>
            <strong>{p.titulo}</strong>
            <p>{p.texto}</p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/** dit_antiguedad: días desde la creación → rango de meses. */
function SimuladorRangos({ item, sim }) {
  const [dias, setDias] = useState(String(sim.ejemplo ?? 120));
  const valido = /^\d+$/.test(dias.trim());
  const n = valido ? Number(dias) : null;
  const idx = valido ? sim.rangos.findIndex((r) => r.hasta === null || n < r.hasta) : -1;
  const rango = idx >= 0 ? sim.rangos[idx] : null;
  const desde = (i) => (i === 0 ? 0 : sim.rangos[i - 1].hasta);
  const texto = (i) => {
    const r = sim.rangos[i];
    return r.hasta === null ? `${desde(i)} días o más` : `de ${desde(i)} a ${r.hasta - 1} días`;
  };

  return (
    <div className="dwh-guia">
      <div className="dwh-detalle-seccion-titulo">CÓMO SE CALCULA, PASO A PASO</div>
      <PasosTarjetas
        pasos={[
          { titulo: "Se cuentan los días", texto: "Desde la fecha de creación del artículo en SAP hasta hoy." },
          { titulo: "Se ubica el rango", texto: "Cada rango abarca 90 días; el límite de arriba no se incluye (90 días ya cae en el siguiente)." },
          { titulo: "Se guarda el rango", texto: "El texto del rango (meses) es lo que queda en la columna." },
        ]}
      />

      <div className="dwh-detalle-seccion-titulo">PRUÉBALO</div>
      <div className="dwh-guia-prueba">
        <label>
          Días desde que se creó el artículo
          <input type="number" inputMode="numeric" min="0" step="1" value={dias} onChange={(e) => setDias(e.target.value)} />
        </label>
        <div className="dwh-guia-atajos" role="group" aria-label="Ejemplos rápidos">
          {sim.atajos.map((a) => (
            <button key={a} type="button" className={String(a) === dias.trim() ? "activo" : ""} onClick={() => setDias(String(a))}>
              {a} días
            </button>
          ))}
        </div>
      </div>

      <div className={`dwh-guia-resultado ${rango ? "ok" : "sin"}`} aria-live="polite">
        {rango ? (
          <>
            <div>
              <span className="dwh-guia-etq">1 · Días</span> <b>{n}</b> días desde la creación
            </div>
            <div>
              <span className="dwh-guia-etq">2 · Rango</span> {n} está {texto(idx)}
            </div>
            <div className="dwh-guia-final">
              <span className="dwh-guia-etq">3 · Resultado</span> <code>{item.col}</code> = <code>{verEspacios(rango.valor)}</code>
            </div>
          </>
        ) : (
          <div>Escribe un número entero de días (0 o más).</div>
        )}
      </div>

      <table className="dwh-pasos-tabla">
        <caption>Todos los rangos</caption>
        <thead>
          <tr>
            <th scope="col">Si el artículo tiene…</th>
            <th scope="col">Se guarda</th>
          </tr>
        </thead>
        <tbody>
          {sim.rangos.map((r, i) => (
            <tr key={i} className={i === idx ? "marcada" : ""}>
              <td>{texto(i)}</td>
              <td><code className="mono">{verEspacios(r.valor)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
      {sim.nota && <p className="dwh-guia-nota">{sim.nota}</p>}
    </div>
  );
}

/** dit_creacion_sap / dit_actualizacion_sap: la hora de SAP (número sin ceros a la izquierda) + la fecha. */
function interpretarHora(texto) {
  const d = texto.trim();
  if (!/^\d{1,6}$/.test(d)) return null;
  if (d.length === 6) return { caso: 0, hora: `${d.slice(0, 2)}:${d.slice(2, 4)}:${d.slice(4)}`, completa: d };
  if (d.length === 5) {
    const c = `0${d}`;
    return { caso: 1, hora: `${c.slice(0, 2)}:${c.slice(2, 4)}:${c.slice(4)}`, completa: c };
  }
  return { caso: 2, hora: "00:00:00", completa: d };
}

function SimuladorHora({ item, sim }) {
  const [hora, setHora] = useState(sim.hora_ejemplo);
  const [fecha, setFecha] = useState(sim.fecha_ejemplo);
  const r = interpretarHora(hora);
  const casos = [
    { si: "6 dígitos", ej: "223205", que: "Ya está completa: se lee HH:MM:SS.", res: "22:32:05" },
    { si: "5 dígitos", ej: "93015", que: "Falta el cero de las horas de un solo dígito: se le antepone un 0.", res: "09:30:15" },
    { si: "Menos de 5 dígitos", ej: "800", que: "No se interpreta: la hora queda en medianoche.", res: "00:00:00" },
  ];

  return (
    <div className="dwh-guia">
      <div className="dwh-detalle-seccion-titulo">CÓMO SE ARMA, PASO A PASO</div>
      <PasosTarjetas
        pasos={[
          { titulo: "Se lee la hora", texto: `${sim.campo_hora} llega como número: HHMMSS pero sin ceros a la izquierda.` },
          { titulo: "Se completa", texto: "Según cuántos dígitos tenga (ver la tabla de abajo)." },
          { titulo: "Se une a la fecha", texto: `Con ${sim.campo_fecha} se forma la fecha y hora completas.` },
        ]}
      />

      <div className="dwh-detalle-seccion-titulo">PRUÉBALO</div>
      <div className="dwh-guia-prueba">
        <label>
          {sim.campo_fecha} (fecha)
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label>
          {sim.campo_hora} (hora que entrega SAP)
          <input type="text" inputMode="numeric" maxLength={6} value={hora} onChange={(e) => setHora(e.target.value.replace(/\D/g, ""))} />
        </label>
        <div className="dwh-guia-atajos" role="group" aria-label="Ejemplos rápidos">
          {sim.atajos.map((a) => (
            <button key={a} type="button" className={a === hora ? "activo" : ""} onClick={() => setHora(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className={`dwh-guia-resultado ${r ? "ok" : "sin"}`} aria-live="polite">
        {r ? (
          <>
            <div>
              <span className="dwh-guia-etq">1 · Llega</span> <code>{sim.campo_hora}</code> = <b>{hora.trim()}</b> ({hora.trim().length} {hora.trim().length === 1 ? "dígito" : "dígitos"})
            </div>
            <div>
              <span className="dwh-guia-etq">2 · Hora</span>{" "}
              {r.caso === 0 && <>tiene 6 dígitos: se lee tal cual → <b>{r.hora}</b></>}
              {r.caso === 1 && <>tiene 5 dígitos: se le antepone un 0 (<b>{r.completa}</b>) → <b>{r.hora}</b></>}
              {r.caso === 2 && <>tiene menos de 5 dígitos: no se interpreta → <b>{r.hora}</b></>}
            </div>
            <div className="dwh-guia-final">
              <span className="dwh-guia-etq">3 · Resultado</span> <code>{item.col}</code> = <b>{fecha ? `${fecha} ${r.hora}` : `(elige una fecha) ${r.hora}`}</b>
            </div>
          </>
        ) : (
          <div>Escribe la hora como número de 1 a 6 dígitos (por ejemplo 93015).</div>
        )}
      </div>

      <table className="dwh-pasos-tabla">
        <caption>Los tres casos</caption>
        <thead>
          <tr>
            <th scope="col">Si la hora tiene…</th>
            <th scope="col">Qué se hace</th>
            <th scope="col">Ejemplo</th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c, i) => (
            <tr key={i} className={r && r.caso === i ? "marcada" : ""}>
              <td>{c.si}</td>
              <td>{c.que}</td>
              <td><code className="mono">{c.ej}</code> → <code className="mono">{c.res}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** dit_proveedorsecundario: segundo documento de compra más reciente (sin cancelados). */
function SimuladorDocumentos({ item, sim }) {
  const [docs, setDocs] = useState(sim.documentos);
  const cambia = (i, campo, valor) => setDocs((ds) => ds.map((d, k) => (k === i ? { ...d, [campo]: valor } : d)));
  const validos = docs.filter((d) => !d.cancelado); // ya vienen del más reciente al más antiguo
  const primero = validos[0];
  const segundo = validos[1];
  const resultado = !segundo ? null : segundo.proveedor === primero.proveedor ? "UF" : segundo.proveedor;

  return (
    <div className="dwh-guia">
      <div className="dwh-detalle-seccion-titulo">CÓMO SE ELIGE, PASO A PASO</div>
      <PasosTarjetas
        pasos={[
          { titulo: "Se juntan los documentos", texto: "Ofertas (OPQT) y pedidos (OPOR) de la bodega 99 que no estén cancelados." },
          { titulo: "Se ordenan por fecha", texto: "Por TaxDate, del más reciente al más antiguo." },
          { titulo: "Se toma el segundo", texto: "Su proveedor es el resultado, salvo que sea el mismo del primero: entonces queda UF." },
        ]}
      />

      <div className="dwh-detalle-seccion-titulo">PRUÉBALO: cambia el proveedor o cancela un documento</div>
      <table className="dwh-pasos-tabla dwh-docs">
        <caption>Documentos del artículo (ejemplo), del más reciente al más antiguo</caption>
        <thead>
          <tr>
            <th scope="col">Orden</th>
            <th scope="col">Documento</th>
            <th scope="col">Fecha</th>
            <th scope="col">Proveedor</th>
            <th scope="col">Cancelado</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d, i) => {
            const pos = d.cancelado ? -1 : validos.indexOf(d);
            return (
              <tr key={i} className={`${pos === 0 ? "marcada" : ""} ${pos === 1 ? "marcada-2" : ""} ${d.cancelado ? "tachada" : ""}`}>
                <td className="dwh-pasos-n">{pos === 0 ? "1.º" : pos === 1 ? "2.º" : "—"}</td>
                <td>{d.tipo}</td>
                <td>{d.fecha}</td>
                <td>
                  <select aria-label={`Proveedor del documento ${i + 1}`} value={d.proveedor} onChange={(e) => cambia(i, "proveedor", e.target.value)}>
                    {sim.proveedores.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input type="checkbox" aria-label={`Documento ${i + 1} cancelado`} checked={d.cancelado} onChange={(e) => cambia(i, "cancelado", e.target.checked)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className={`dwh-guia-resultado ${resultado ? "ok" : "sin"}`} aria-live="polite">
        {!segundo ? (
          <div>
            Con menos de dos documentos no cancelados no hay un «segundo documento». Qué se guarda en ese caso no está descrito en la regla (por confirmar).
          </div>
        ) : (
          <>
            <div>
              <span className="dwh-guia-etq">1.º más reciente</span> <b>{primero.proveedor}</b> <small>({primero.fecha})</small>
            </div>
            <div>
              <span className="dwh-guia-etq">2.º más reciente</span> <b>{segundo.proveedor}</b> <small>({segundo.fecha})</small>
            </div>
            <div className="dwh-guia-final">
              <span className="dwh-guia-etq">Resultado</span> <code>{item.col}</code> = <b>{resultado}</b>{" "}
              <small>
                {resultado === "UF" ? "· el segundo documento es del mismo proveedor que el primero" : "· el segundo documento es de otro proveedor"}
              </small>
            </div>
          </>
        )}
      </div>
      {sim.nota && <p className="dwh-guia-nota">{sim.nota}</p>}
    </div>
  );
}

function Simulador({ item }) {
  const sim = item.simulador;
  if (sim.tipo === "rangos") return <SimuladorRangos item={item} sim={sim} />;
  if (sim.tipo === "hora") return <SimuladorHora key={item.col} item={item} sim={sim} />;
  if (sim.tipo === "documentos") return <SimuladorDocumentos item={item} sim={sim} />;
  return null;
}

function DetalleColumna({ item, nombreTabla, codigos }) {
  const muestras = item.muestras || [];
  return (
    <tr className="dwh-detalle-fila">
      <td colSpan={4}>
        <div className="dwh-detalle-card">
          <div className="dwh-detalle-seccion-titulo">RELACIÓN CON SAP HANA</div>
          <Diagrama item={item} nombreTabla={nombreTabla} />

          <p className="dwh-regla-texto">
            <strong>Regla de cálculo / Transformación:</strong> <TextoRico texto={item.regla_texto} />
          </p>

          {Array.isArray(item.pasos) && item.pasos.length > 0 && (
            <div className="dwh-pasos">
              <table className="dwh-pasos-tabla">
                <caption>Se revisa de arriba hacia abajo; gana la primera que se cumple</caption>
                <thead>
                  <tr>
                    <th scope="col">Orden</th>
                    <th scope="col">Si…</th>
                    <th scope="col">El valor en {item.col} es</th>
                  </tr>
                </thead>
                <tbody>
                  {item.pasos.map((p, i) => (
                    <tr key={i}>
                      <td className="dwh-pasos-n">{i + 1}</td>
                      <td>{p.si}</td>
                      <td><code className="mono">{p.entonces}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {Array.isArray(item.ejemplos) && item.ejemplos.length > 0 && (
                <table className="dwh-pasos-tabla dwh-pasos-ejemplos">
                  <caption>Ejemplos</caption>
                  <thead>
                    <tr>
                      <th scope="col">Rin</th>
                      <th scope="col">Categoría</th>
                      <th scope="col">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.ejemplos.map((e, i) => (
                      <tr key={i}>
                        <td>{e.rin}</td>
                        <td>{e.categoria}</td>
                        <td><code className="mono">{e.resultado}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {item.simulador && <Simulador key={item.col} item={item} />}

          {item.guia && item.guia.tipo === "lookup" && <GuiaLookup guia={item.guia} />}

          <EnlacesDiccionario item={item} codigos={codigos} />

          {muestras.length > 0 && (
            <div>
              <div className="dwh-detalle-seccion-titulo">
                {`VALORES MUESTRA EN ${item.dest_tabla || nombreTabla} (${muestras.length} REGISTROS REALES)`}
              </div>
              <table className="dwh-tabla-muestras">
                <thead>
                  <tr>
                    <th>{item.col}</th>
                  </tr>
                </thead>
                <tbody>
                  {muestras.map((v, i) => (
                    <tr key={i}>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ----------------------------- pantalla ----------------------------- */

export const DocTecDwhMapping = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [idTabla, setIdTabla] = useState(null);
  const [categoria, setCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filaAbierta, setFilaAbierta] = useState(null);

  useEffect(() => {
    let vivo = true;
    DocTec_ObtenerDwhMapping()
      .then((d) => {
        if (!vivo) return;
        setDatos(d);
        setIdTabla(d.tablas?.[0]?.id ?? null);
        setFilaAbierta(d.tablas?.[0]?.columnas?.[0]?.col ?? null);
      })
      .catch((e) => vivo && setError(e.response?.data?.error ?? "No se pudo cargar el mapeo del DWH. Revisa que la API esté disponible."));
    return () => {
      vivo = false;
    };
  }, []);

  const tabla = useMemo(() => datos?.tablas.find((t) => t.id === idTabla) ?? datos?.tablas[0], [datos, idTabla]);
  const columnas = tabla?.columnas ?? [];

  const conteos = useMemo(() => {
    const c = {};
    columnas.forEach((col) => {
      const cat = col.cat || "Otros";
      c[cat] = (c[cat] || 0) + 1;
    });
    return c;
  }, [columnas]);

  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return columnas.filter((item) => {
      const coincideCat = categoria === "todas" || item.cat === categoria;
      const coincideTexto =
        !q ||
        [item.col, item.desc, item.tabla, item.campo, item.regla_corta, item.cat].some(
          (v) => v && String(v).toLowerCase().includes(q)
        );
      return coincideCat && coincideTexto;
    });
  }, [columnas, categoria, busqueda]);

  const cambiarTabla = (id) => {
    const nueva = datos.tablas.find((t) => t.id === id);
    setIdTabla(id);
    setCategoria("todas");
    setBusqueda("");
    setFilaAbierta(nueva?.columnas?.[0]?.col ?? null);
  };

  if (error)
    return (
      <RaizDoc>
        <div style={{ padding: 28, color: "var(--suave)" }}>{error}</div>
      </RaizDoc>
    );
  if (!datos || !tabla)
    return (
      <RaizDoc>
        <div style={{ padding: 28, color: "var(--suave)" }}>Cargando mapeo del DWH…</div>
      </RaizDoc>
    );

  const varias = datos.tablas.length > 1;

  return (
    <RaizDoc>
      <Estilos>
        <aside className="dwh-sidebar">
          <div className="dwh-sidebar-header">
            <div className="dwh-db-badge-container">
              <span className="dwh-db-etiqueta">Almacén de Datos (DWH)</span>
              <span className="dwh-db-pill">PostgreSQL</span>
            </div>

            {varias && (
              <div className="dwh-selector-tabla-wrap">
                <label htmlFor="sel-tabla-dwh" className="dwh-sidebar-subetiqueta">
                  Tabla DWH seleccionada:
                </label>
                <select
                  id="sel-tabla-dwh"
                  className="dwh-select"
                  value={tabla.id}
                  onChange={(e) => cambiarTabla(e.target.value)}
                >
                  {datos.tablas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="dwh-sidebar-buscar-wrap">
              <span className="dwh-sidebar-buscar-icon">🔍</span>
              <input
                type="text"
                className="dwh-sidebar-buscar"
                placeholder="Buscar columna o campo SAP..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="dwh-modulo-titulo">Dominios / Categorías</div>

            <button
              type="button"
              className={`dwh-item-nav${categoria === "todas" ? " activo" : ""}`}
              onClick={() => setCategoria("todas")}
            >
              <div className="dwh-item-info">
                <b>Todas las columnas</b>
                <span className="dwh-item-sub">Vista completa</span>
              </div>
              <span className="dwh-item-count">{columnas.length}</span>
            </button>

            {tabla.categorias.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`dwh-item-nav${categoria === cat ? " activo" : ""}`}
                onClick={() => setCategoria(cat)}
              >
                <div className="dwh-item-info">
                  <b>{cat}</b>
                  <span className="dwh-item-sub">Filtrar dominio</span>
                </div>
                <span className="dwh-item-count">{conteos[cat] || 0}</span>
              </button>
            ))}

            {varias && (
              <>
                <div className="dwh-modulo-titulo" style={{ marginTop: 18 }}>
                  Tablas del Almacén
                </div>
                {datos.tablas.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`dwh-item-nav${t.id === tabla.id ? " activo" : ""}`}
                    onClick={() => cambiarTabla(t.id)}
                  >
                    <div className="dwh-item-info">
                      <b>{t.nombre}</b>
                      <span className="dwh-item-sub">{t.columnas.length} columnas mapeadas</span>
                    </div>
                    <span className="dwh-item-count">{t.columnas.length}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </aside>

        <main className="dwh-detalle">
          <div className="dwh-detalle-interno">
            <section className="dwh-hero-card">
              <div className="dwh-hero-header">
                <div className="dwh-hero-titulo-wrap">
                  <h1 className="dwh-hero-titulo">{tabla.nombre}</h1>
                  <div className="dwh-hero-badges">
                    <span className="dwh-chip-badge acento">Esquema: {tabla.esquema}</span>
                    <span className="dwh-chip-badge">Origen: SAP HANA</span>
                    <span className="dwh-chip-badge">
                      {categoria === "todas" ? "Dominio: Todos" : `Dominio: ${categoria}`}
                    </span>
                  </div>
                </div>
                <span className="dwh-contador-pill">{columnas.length} columnas</span>
              </div>
              <div className="dwh-hero-sub">
                Almacén de datos Autollanta · <i>{tabla.id}</i>
              </div>
              <div className="dwh-hero-desc">
                Mapeo técnico detallado de cada columna del Data Warehouse (<strong className="mono">{tabla.nombre}</strong>)
                hacia sus campos de origen en SAP HANA (<code className="mono">OITM</code>, <code className="mono">OMRC</code>,{" "}
                <code className="mono">OITB</code>, <code className="mono">OITW</code>, etc.), con diagrama de
                transformación, reglas de cálculo y valores reales.
              </div>
            </section>

            <section>
              <div className="dwh-seccion-header">
                <h2 className="dwh-seccion-titulo">
                  Columnas del almacén <span className="dwh-contador-pill">{visibles.length}</span>
                </h2>
                <span className="dwh-seccion-guia">Haz clic en una fila para desplegar relación con SAP y valores reales</span>
              </div>

              <div className="dwh-card-tabla">
                <table className="dwh-tabla">
                  <thead>
                    <tr>
                      <th>Columna en {tabla.id}</th>
                      <th>Atributo / Negocio</th>
                      <th>Origen en SAP HANA</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: "36px 16px", textAlign: "center", color: "var(--suave)" }}>
                          No se encontraron columnas para el filtro aplicado.
                        </td>
                      </tr>
                    )}
                    {visibles.map((item) => {
                      const abierta = filaAbierta === item.col;
                      return (
                        <React.Fragment key={item.col}>
                          <tr
                            className={`dwh-fila${abierta ? " abierta" : ""}`}
                            onClick={() => setFilaAbierta(abierta ? null : item.col)}
                          >
                            <td>
                              <span className="dwh-col-nombre">{item.col}</span>
                              <span className="dwh-col-cat">{item.cat || ""}</span>
                            </td>
                            <td>{item.desc || ""}</td>
                            <td>
                              <span className="dwh-badge-sap">{`${item.tabla}.${item.campo}`}</span>
                            </td>
                            <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                              <span className="dwh-chev-icon">{abierta ? "▾" : "▸"}</span>
                            </td>
                          </tr>
                          {abierta && (
                            <DetalleColumna
                              item={item}
                              nombreTabla={tabla.nombre}
                              codigos={datos.codigos_diccionario || []}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </Estilos>
    </RaizDoc>
  );
};
