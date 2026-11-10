"""Regenera backend/completitud/datos/corte.json y config.json a partir del proyecto Django «documentacion y calidad».

Uso (con el Python del entorno virtual de ese proyecto, que ya tiene PyYAML):

    <proyecto-django>/.venv/Scripts/python.exe backend/herramientas/exportar_completitud.py <ruta-del-proyecto-django>

Solo lee la base SQLite del proyecto Django (modo solo lectura). No se exporta ningún valor de campos sensibles:
la base ya guarda solo 1 (lleno) / 0 (vacío) por campo.
"""
import json
import sqlite3
import sys
from pathlib import Path

import yaml

if len(sys.argv) != 2:
    sys.exit("Uso: exportar_completitud.py <ruta-del-proyecto-django>")

DJANGO = Path(sys.argv[1]).resolve()
DESTINO = Path(__file__).resolve().parents[1] / "completitud" / "datos"
DESTINO.mkdir(parents=True, exist_ok=True)

con = sqlite3.connect(f"file:{(DJANGO / 'db.sqlite3').as_posix()}?mode=ro", uri=True)
con.row_factory = sqlite3.Row

corte = con.execute("select id, fecha_hora, origen, total from completitud_corte order by id desc limit 1").fetchone()
if corte is None:
    sys.exit("La base no tiene ningún corte de completitud: ejecuta `manage.py cargar_completitud` en el proyecto Django.")

productos = [
    {
        "empresa": r["empresa"],
        "codigo": r["codigo"],
        "grupo": r["grupo"],
        "nombre": r["nombre"],
        "fabricante": r["fabricante"],
        "campos": json.loads(r["campos"]),
        "revisar": json.loads(r["revisar"]),
    }
    for r in con.execute(
        "select empresa, codigo, grupo, nombre, fabricante, campos, revisar "
        "from completitud_producto where corte_id = ? order by empresa, codigo",
        (corte["id"],),
    )
]
duplicados = [
    dict(r)
    for r in con.execute(
        "select campo, valor, repeticiones, empresa, codigo, grupo, nombre "
        "from completitud_duplicado where corte_id = ? order by campo, empresa, valor, codigo",
        (corte["id"],),
    )
]

salida = {
    "fecha_hora": corte["fecha_hora"],
    "origen": corte["origen"],
    "total": corte["total"],
    "productos": productos,
    "duplicados": duplicados,
}
(DESTINO / "corte.json").write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

cfg = yaml.safe_load((DJANGO / "apps" / "completitud" / "config.yaml").read_text(encoding="utf-8"))
# Se guarda TODA la configuración (columnas, grupos a los que aplica cada campo, unicidad, filtro de la consulta…):
# la usa tanto la pantalla como la carga en vivo desde PostgreSQL. Se añade `fuente_tabla` por comodidad.
config = {**cfg, "fuente_tabla": cfg["fuente"]["tabla"]}
(DESTINO / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")

print("productos:", len(productos), "| duplicados:", len(duplicados), "| corte:", corte["fecha_hora"], corte["origen"])
