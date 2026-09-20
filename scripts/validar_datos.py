#!/usr/bin/env python3
"""Valida los datos locales de ule educativo (sin dependencias, sólo librería estándar).

Uso:   python3 scripts/validar_datos.py          (desde la raíz del repo)
Salida: código 1 si hay ERRORES; las ADVERTENCIAS no rompen el resultado.

Comprueba: JSON válido, manifiestos ↔ archivos, IDs únicos y coherentes con el nombre
del archivo, relaciones artículo ↔ bibliografía, campos obligatorios, categorías de
catálogos, rutas de imagen (locales existentes / sin rutas absolutas) y anuncios.
Sirve mientras exista la fuente local; con la API, esta validación pasa a su backend.
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
errores, avisos = [], []
TIPOS_BIBLIO = {"libro", "capitulo_libro", "articulo", "articulo_web", "web"}


def cargar(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:  # JSON inválido o archivo ilegible
        errores.append(f"JSON inválido: {ruta}: {e}")
        return None


def revisar_imagen(ctx, ruta, obligatoria=False):
    if not ruta:
        (avisos if not obligatoria else errores).append(f"{ctx}: sin imagen")
        return
    if re.match(r"^https?://", ruta):
        avisos.append(f"{ctx}: imagen EXTERNA (hotlink frágil): {ruta[:70]}")
    elif ruta.startswith("/"):
        errores.append(f"{ctx}: ruta ABSOLUTA (rompe bajo el subpath de GitHub Pages): {ruta}")
    elif not os.path.exists(ruta):
        errores.append(f"{ctx}: la imagen no existe: {ruta}")


def revisar_manifiesto(carpeta, sufijo=".json"):
    manifiesto = cargar(f"data/{carpeta}/index.json") or []
    archivos = sorted(os.path.basename(p) for p in glob.glob(f"data/{carpeta}/*.json") if not p.endswith("index.json"))
    for nombre in manifiesto:
        if nombre not in archivos:
            errores.append(f"data/{carpeta}/index.json lista un archivo inexistente: {nombre}")
    for nombre in archivos:
        if nombre not in manifiesto:
            errores.append(f"data/{carpeta}/{nombre} no está en el manifiesto index.json")
    if len(set(manifiesto)) != len(manifiesto):
        errores.append(f"data/{carpeta}/index.json tiene entradas duplicadas")
    return archivos


def cargar_coleccion(carpeta, prefijo):
    items = {}
    for nombre in revisar_manifiesto(carpeta):
        ruta = f"data/{carpeta}/{nombre}"
        d = cargar(ruta)
        if d is None:
            continue
        esperado = nombre[:-5]
        if d.get("id") != esperado:
            errores.append(f"{ruta}: id '{d.get('id')}' no coincide con el nombre del archivo")
        if d.get("id") in items:
            errores.append(f"{ruta}: id duplicado '{d.get('id')}'")
        items[d.get("id")] = d
    return items


articulos = cargar_coleccion("articulos", "articulo")
biblio = cargar_coleccion("bibliografia", "biblio")
catalogos = cargar_coleccion("catalogos", "")

for i, a in articulos.items():
    for campo in ("titulo", "fecha", "resumen", "contenido_html"):
        if not a.get(campo):
            errores.append(f"{i}: falta '{campo}'")
    if a.get("fecha") and not re.match(r"^\d{4}-\d{2}-\d{2}$", a["fecha"]):
        errores.append(f"{i}: fecha con formato inválido (AAAA-MM-DD): {a['fecha']}")
    revisar_imagen(i, a.get("imagen_destacada"))
    if a.get("imagen_destacada") and not a.get("imagen_alt"):
        avisos.append(f"{i}: sin imagen_alt (se tratará como decorativa)")
    for b in a.get("bibliografía_relacionada", []) or []:
        if b not in biblio:
            errores.append(f"{i}: bibliografía_relacionada apunta a un id inexistente: {b}")
    html = a.get("contenido_html", "")
    if re.search(r"<script", html, re.I):
        errores.append(f"{i}: contenido_html contiene <script>")
    for ruta in re.findall(r'(?:src|href)="([^"]+)"', html):
        if ruta.startswith("/"):
            errores.append(f"{i}: contenido_html usa ruta absoluta: {ruta}")
    niveles = [int(n) for n in re.findall(r"<h([1-6])", html)]
    if niveles and niveles[0] < 2:
        errores.append(f"{i}: contenido_html no debe usar <h1> (la página ya tiene uno)")
    if niveles and niveles[0] > 2:
        avisos.append(f"{i}: contenido_html empieza en <h{niveles[0]}> (debería ser <h2>)")

for i, r in biblio.items():
    for campo in ("titulo", "tipo"):
        if not r.get(campo):
            errores.append(f"{i}: falta '{campo}'")
    if r.get("tipo") and r["tipo"] not in TIPOS_BIBLIO:
        errores.append(f"{i}: tipo '{r['tipo']}' no registrado (agregar a ULE.labels.tipoBiblio y al contrato)")
    if r.get("url") and not re.match(r"^https?://", r["url"]):
        errores.append(f"{i}: url inválida: {r['url']}")
    for a in r.get("articulos_relacionados", []) or []:
        if a not in articulos:
            errores.append(f"{i}: articulos_relacionados apunta a un id inexistente: {a}")

for cid, c in catalogos.items():
    disponibles = c.get("categorias_disponibles") or {}
    ids = [e.get("id") for e in c.get("elementos", [])]
    if not ids:
        avisos.append(f"{cid}: catálogo sin elementos")
    for dup in {x for x in ids if ids.count(x) > 1}:
        errores.append(f"{cid}: id de elemento duplicado: {dup}")
    for e in c.get("elementos", []):
        ctx = f"{cid}/{e.get('id')}"
        for campo in ("id", "titulo", "imagen"):
            if not e.get(campo):
                errores.append(f"{ctx}: falta '{campo}'")
        revisar_imagen(ctx, e.get("imagen"))
        for k, v in (e.get("categorias") or {}).items():
            if k not in disponibles:
                errores.append(f"{ctx}: categoría '{k}' ausente en categorias_disponibles")
            elif v not in disponibles[k]:
                errores.append(f"{ctx}: valor '{v}' no está en categorias_disponibles['{k}']")
    if c.get("imagen_portada"):
        revisar_imagen(f"{cid} (portada)", c["imagen_portada"])

anuncios = (cargar("data/anuncios.json") or {}).get("anuncios", [])
ids = [a.get("id") for a in anuncios]
for dup in {x for x in ids if ids.count(x) > 1}:
    errores.append(f"anuncios: id duplicado {dup}")
PAGINAS = {"home", "articulos", "articulo", "catalogos", "bibliografia", "todas"}
for a in anuncios:
    ctx = f"anuncio {a.get('id')}"
    if a.get("imagen"):
        revisar_imagen(ctx, a["imagen"])
        if not a.get("imagen_alt"):
            avisos.append(f"{ctx}: tiene imagen pero no imagen_alt")
    for pagina in a.get("paginas", []) or []:
        if pagina not in PAGINAS:
            errores.append(f"{ctx}: página desconocida en 'paginas': {pagina}")
    for campo in ("vigencia_inicio", "vigencia_fin"):
        if a.get(campo) and not re.match(r"^\d{4}-\d{2}-\d{2}$", a[campo]):
            errores.append(f"{ctx}: {campo} con formato inválido: {a[campo]}")

print(f"Artículos: {len(articulos)} · Referencias: {len(biblio)} · Catálogos: {len(catalogos)} · Anuncios: {len(anuncios)}")
for m in avisos:
    print("ADVERTENCIA:", m)
for m in errores:
    print("ERROR:", m)
print(f"\n{len(errores)} error(es), {len(avisos)} advertencia(s).")
sys.exit(1 if errores else 0)
