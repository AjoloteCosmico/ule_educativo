# Guía de contenido — ule educativo

Esta guía explica cómo agregar contenido al sitio estático sin modificar el código de las páginas.

## 1. Artículos

1. Crear `data/articulos/articulo-NNN.json`.
2. Seguir el esquema de `docs/contrato_datos.md` §1.
3. Añadir el nombre exacto del archivo a `data/articulos/index.json`.
4. Si el artículo tiene bibliografía, colocar sus IDs en `bibliografía_relacionada`. Con eso basta: la referencia mostrará "Aparece en: …" automáticamente.
5. Subir las imágenes a `assets/images/articulos/` (crear la carpeta con la primera imagen) y usar rutas relativas. Añadir `imagen_alt` si la imagen aporta información; sin él se trata como decorativa.
6. En `contenido_html` empezar las secciones con `<h2>` (la página ya tiene el `<h1>`); no usar `<h1>`.

## 2. Bibliografía

1. Crear `data/bibliografia/biblio-NNN.json`.
2. Seguir el esquema de `docs/contrato_datos.md` §2. Tipos válidos: `libro`, `capitulo_libro`, `articulo`, `articulo_web`, `web`.
3. Añadir el archivo a `data/bibliografia/index.json`.
4. No hace falta completar `articulos_relacionados`: la relación se deriva de `bibliografía_relacionada` en el artículo.

## 3. Catálogos

Los catálogos son archivos completos dentro de `data/catalogos/`.

1. Crear o editar el JSON del catálogo.
2. Mantener el objeto `id`, `titulo`, `descripcion`, `elementos` y `visible`.
3. Cada elemento debe tener al menos `id`, `titulo`, `imagen`, `descripcion` y `categorias` cuando corresponda.
4. Añadir imágenes a `assets/images/catalogos/`.
5. Si se crea un catálogo nuevo, añadir su nombre a `data/catalogos/index.json`.

## 4. Anuncios

Antes de agregar un anuncio, consultar **`docs/politica_anuncios.md`**.

1. Subir la imagen a `assets/images/anuncios/` cuando exista.
2. Agregar el objeto a `data/anuncios.json`.
3. Definir `activo`, `vigencia_inicio`, `vigencia_fin` y `peso`.
4. Usar `imagen_alt` para describir la imagen.
5. Usar `paginas` solo con las páginas permitidas por la política.
6. No utilizar URLs de imágenes externas si pueden evitarse: es preferible almacenar la imagen en el repositorio.
7. Un anuncio con `enlace` se abre en una pestaña nueva.

## 5. Rutas

Todas las rutas internas deben ser relativas:

- Correcto: `assets/images/articulos/foto.jpg`
- Correcto: `data/articulos/articulo-005.json`
- Incorrecto: `/assets/images/articulos/foto.jpg`
- Incorrecto: `/data/articulos/articulo-005.json`

Esto es necesario porque el sitio se publica bajo el subpath de GitHub Pages.

## 6. Manifiestos

El navegador no puede listar carpetas de GitHub Pages. Por eso cada carpeta de contenido utiliza un `index.json`.

**Agregar un archivo de contenido siempre implica actualizar su manifiesto.**

## 7. Antes de hacer push

Comprobar:

- JSON válido y correctamente indentado.
- IDs únicos y iguales al nombre del archivo.
- Nombre del archivo incluido en el manifiesto.
- Rutas relativas.
- `visible: true` cuando el contenido deba aparecer.
- Imágenes disponibles y con texto alternativo cuando sean relevantes.
- En anuncios, vigencia y campos de la política correctos.
- **Ejecutar `python3 scripts/validar_datos.py`**: detecta JSON inválido, manifiestos desalineados, IDs duplicados, relaciones rotas y rutas de imagen inexistentes o absolutas. Debe terminar sin errores.

## 8. Herramienta interna

La herramienta `herramientas/generador-json.html` facilita la creación de estos archivos. No sustituirá el paso de colocar el archivo en su carpeta, actualizar el manifiesto y hacer push.
