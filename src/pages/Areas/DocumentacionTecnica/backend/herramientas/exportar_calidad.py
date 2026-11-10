"""Regenera backend/calidad/datos/calidad.json a partir del proyecto Django «documentacion y calidad».

Uso (con el Python del entorno virtual de ese proyecto, que ya tiene Django y el motor de calidad):

    <proyecto-django>/.venv/Scripts/python.exe backend/herramientas/exportar_calidad.py <ruta-del-proyecto-django>

Solo lee la base SQLite del proyecto Django (modo solo lectura). Del proveedor solo viaja el nombre del proveedor
principal: la base nunca guarda su código ni su RUC.
"""
import json
import os
import sqlite3
import sys
from pathlib import Path

if len(sys.argv) != 2:
    sys.exit("Uso: exportar_calidad.py <ruta-del-proyecto-django>")

DJANGO = Path(sys.argv[1]).resolve()
DESTINO = Path(__file__).resolve().parents[1] / "calidad" / "datos"
DESTINO.mkdir(parents=True, exist_ok=True)

# Se importa el motor de calidad del proyecto Django para obtener los atributos que evalúa cada tipo de producto.
sys.path.insert(0, str(DJANGO))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["DJANGO_DEBUG"] = "True"
import django

django.setup()
from apps.calidad.motor import calidad_llantas as cl

con = sqlite3.connect(f"file:{(DJANGO / 'db.sqlite3').as_posix()}?mode=ro", uri=True)
con.row_factory = sqlite3.Row

corridas = [dict(r) for r in con.execute("select id, semana, fecha_hora, origen, registros, indice_general from calidad_corrida order by semana, id")]
resumen_atributos = [dict(r) for r in con.execute(
    "select corrida_id, atributo, registros, correcto, inconsistente, sin_clasificar, no_verificable, no_evaluable, pct_correcto from calidad_resumenatributo")]
resumen_empresas = [dict(r) for r in con.execute("select corrida_id, empresa, registros, indice from calidad_resumenempresa")]
historial = [[r["corrida_id"], r["empresa"], r["codigo"], r["score"]] for r in con.execute(
    "select corrida_id, empresa, codigo, score from calidad_detallehistorial order by corrida_id, empresa, codigo")]

# Atributos de cada producto: { item_id: { ATRIBUTO: [bd, extraido, estado, extra] } }
atributos = {}
for r in con.execute("select item_id, atributo, bd, extraido, estado, extra from calidad_atributoitem"):
    atributos.setdefault(r["item_id"], {})[r["atributo"]] = [r["bd"], r["extraido"], r["estado"], r["extra"]]

items = []
corrida_detalle = None
for r in con.execute(
    "select id, corrida_id, fecha_creacion, empresa, codigo, nombre, tipo_producto, es_llanta, grupo, marca, proveedor, score "
    "from calidad_item order by empresa, codigo"
):
    if corrida_detalle is None:
        corrida_detalle = r["corrida_id"]
    items.append({
        "fecha_creacion": r["fecha_creacion"],
        "empresa": r["empresa"],
        "codigo": r["codigo"],
        "nombre": r["nombre"],
        "tipo_producto": r["tipo_producto"],
        "es_llanta": bool(r["es_llanta"]),
        "grupo": r["grupo"],
        "marca": r["marca"],
        "proveedor": r["proveedor"],
        "score": r["score"],
        "a": atributos.get(r["id"], {}),
    })
if not items:
    sys.exit("La base no tiene datos de calidad: ejecuta `manage.py cargar_calidad` en el proyecto Django.")

tipos = sorted({i["tipo_producto"] for i in items} | {"LLANTAS", "LLANTAS MOTO", "TUBO", "MOUSSE", "ARO"})
perfiles = {t: list(cl.atributos_del_perfil(t)) for t in tipos}

salida = {
    "corrida_detalle": corrida_detalle,
    "atributos_indice": [n for n, _ in cl.ATRIBUTOS_VALIDADOS],
    "atributos_aparte": [n for n, _ in cl.ATRIBUTOS_CLASIFICACION],
    "perfiles": perfiles,
    "corridas": corridas,
    "resumen_atributos": resumen_atributos,
    "resumen_empresas": resumen_empresas,
    "historial": historial,
    "items": items,
}
(DESTINO / "calidad.json").write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("items:", len(items), "| atributos:", sum(len(i["a"]) for i in items), "| corridas:", len(corridas), "| historial:", len(historial))
