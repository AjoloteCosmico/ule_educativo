# ule educativo

Sitio educativo sobre el juego de pelota mesoamericano. HTML, CSS y JavaScript nativos
(Web Components, sin framework ni build), publicado en GitHub Pages bajo un subpath.

## Ejecutar en local

```bash
python3 -m http.server 8000      # y abrir http://localhost:8000
```

Las páginas cargan datos con `fetch`, así que no funcionan abriendo el HTML con `file://`.

## Verificar antes de hacer push

```bash
python3 scripts/validar_datos.py         # datos: JSON, IDs, manifiestos, relaciones, rutas
python3 scripts/pruebas_navegador.py     # navegador (requiere: pip install playwright && playwright install chromium)
```

## Documentación (`docs/`)

| Documento | Para qué |
|---|---|
| `primera_fase.md` | Objetivo de la Fase 1, checklist verificado y pendientes reales |
| `arquitectura.md` | Decisiones técnicas y transición JSON → API Go + DB (§14) |
| `contrato_datos.md` | Objetos que recibe el frontend y respuestas que deberá dar la API |
| `GUIA_CONTENIDO.md` | Cómo agregar artículos, bibliografía, catálogos y anuncios |
| `identidad.md` | Sistema de diseño (color, tipografía, contraste AA) |
| `politica_anuncios.md` | Reglas de contenido y colocación de anuncios |
| `docs_fase1.md` | Referencia rápida de lo construido |

Principio rector: *el contenido cambia; la interfaz no debería enterarse de dónde viene.*
