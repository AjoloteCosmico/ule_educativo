# Mejora del editor de contenido — captura por bloques, sin HTML visible

> Ámbito: solo `herramientas/editorial.html` (formulario de **Artículos**, campo `contenido_html`).
> No toca `docs/contrato_datos.md`: el JSON que se envía a `POST/PUT /articles` sigue siendo
> exactamente el mismo, con `contenido_html` como el mismo string de siempre. El contrato de
> datos del backend no se modifica en absoluto.

**Restricciones de diseño (dadas por el equipo):**
1. La persona que captura contenido **no debe ver ni escribir HTML** — solo cajas de texto y
   campos de formulario normales.
2. Las imágenes, por ahora, **solo aceptan una URL como fuente** — nada de carga de archivos.
3. El payload final hacia la API es idéntico al actual.

Basado en revisión del repo en el commit `12d1053` (`origin/master`).

---

## Fases

### Fase 1 — Modelo de bloques y campos de formulario — **HECHO**

El campo `contenido_html` deja de ser un `<textarea>`. Internamente pasa a ser un arreglo de
bloques tipados, cada uno con solo inputs normales:

| Bloque | Campos que ve el capturista |
|---|---|
| Encabezado | selector Sección (H2) / Subsección (H3) + caja de texto |
| Párrafo | caja de texto (multilínea, sin etiquetas) |
| Imagen | campo URL (obligatorio) + campo "Texto alternativo" (obligatorio) |
| Lista | caja de texto, un ítem por línea |
| Cita | caja de texto |

El HTML nunca se escribe a mano: cada tipo de bloque tiene su propio conjunto fijo de campos.

### Fase 2 — Alta, reordenar y eliminar bloques — **HECHO** (se implementó junto con la Fase 1, porque sin esto el editor no es utilizable)

- Selector de tipo + botón "+ Agregar bloque" al final de la lista.
- Cada tarjeta de bloque tiene botones **↑ / ↓** (reordenar) y **Eliminar**.
- Un artículo nuevo se prellena con un bloque de Encabezado + un bloque de Párrafo (mismo
  contenido de ejemplo que ya usaba el textarea anterior), para no empezar en blanco.

### Fase 3 — Vista previa en vivo — **PENDIENTE (no incluida en esta entrega)**

Queda como siguiente paso: un panel que compile los bloques actuales y los muestre con las
mismas clases visuales que usa `articulo.html`, actualizado con cada cambio. No se tocó nada de
esto todavía.

### Fase 4 — Compilar a HTML y enviar el mismo payload de siempre — **HECHO** (necesario para que la Fase 1 funcione de punta a punta)

Justo antes de guardar, una función pura (`compileBlocksToHtml`) recorre los bloques y genera
`<h2>`/`<h3>`, `<p>`, `<img src="…" alt="…">`, `<ul><li>…</li></ul>`, `<blockquote>` — siempre
desde plantillas fijas del propio código, nunca desde texto libre con etiquetas. El resultado se
guarda en un campo oculto `contenido_html` dentro del mismo `<form>`, así que
`payloadFromForm()` no cambió ni una línea: sigue leyendo `value('contenido_html')` como
siempre, y el objeto que llega a `POST/PUT /articles` es idéntico en forma al de antes.

Como el capturista ya no puede escribir una etiqueta, el viejo check
`contenido_html.indexOf('<script') !== -1` (fácil de evadir, ej. `<ScRipt>` o `<img onerror=…>`)
se reemplazó por validación de los propios bloques: encabezados/párrafos/citas no vacíos,
imágenes con URL `http(s)://` y alt no vacíos, listas con al menos un ítem. El botón "Guardar"
queda deshabilitado si algo no cumple.

**Compatibilidad con artículos existentes:** al editar un artículo que ya tiene HTML (escrito a
mano o por el generador anterior), una función `parseHtmlToBlocks` reconstruye los bloques desde
ese HTML: `h2`/`h3` → Encabezado, `p` → Párrafo, `img` → Imagen, `ul`/`ol` → Lista,
`blockquote` → Cita. Cualquier etiqueta que no encaje en ese vocabulario (por ejemplo un `<div>`
suelto) se conserva tal cual en un bloque "Contenido existente (no editable por bloques)" —
de solo lectura, que se puede eliminar pero no editar, para no perder ni corromper nada al abrir
un artículo antiguo.

---

## Qué se probó

Se armó una prueba de humo con `jsdom` (no queda en el repo, fue solo para verificar antes de
entregar) que confirmó:
- Crear un artículo nuevo arranca con 2 bloques (encabezado + párrafo) y el botón "Guardar" se
  habilita solo cuando todos los campos —los de arriba del formulario y los bloques— son
  válidos.
- Agregar un bloque de Imagen sin `alt` deshabilita "Guardar"; completarlo lo vuelve a habilitar.
- Editar un artículo existente con HTML mixto (`h2`, `p` con salto de línea, `img`, `ul` de 2
  ítems, `blockquote`, y un `<div>` desconocido) reconstruye 6 bloques correctamente, y volver a
  compilarlos reproduce el mismo contenido (el `<div>` desconocido se conserva íntegro en el
  bloque "legado").

## Limitaciones conocidas (no bloquean esta entrega, quedan anotadas)

- Un párrafo con saltos de línea se recompila usando `<br>` — es una simplificación razonable,
  no reconstruye párrafos separados.
- `<ul>` y `<ol>` existentes se leen igual (ambos se leen como "Lista") y **siempre se vuelven a
  guardar como `<ul>`** — un artículo viejo con lista numerada perdería la numeración si se
  vuelve a guardar desde el panel. Se puede resolver en la Fase 2/3 agregando un selector
  "con viñetas / numerada" al bloque de Lista; no se hizo ahora para no ampliar el alcance.
- La validación de bloques (URL con formato, alt no vacío, etc.) sigue siendo del lado del
  cliente, como guía para quien captura — el backend debe seguir siendo la autoridad real de
  saneamiento antes de guardar, igual que ya se documentó en `integracion_api.md`.

## Archivos modificados

- `herramientas/editorial.html` — reemplaza el campo `contenido_html` por el editor de bloques
  (funciones `parseHtmlToBlocks`, `compileBlocksToHtml`, `blockCard`, `renderBlockEditor`,
  `buildContentEditor`, y los ajustes correspondientes en `buildForm`, `populate` y
  `validateForm`).
- `css/herramientas.css` — estilos nuevos `.content-blocks`, `.content-block`,
  `.content-block__head`, `.content-block__actions`, reutilizando las variables de diseño ya
  existentes en el archivo.

Se entregan junto con este documento tanto los dos archivos completos ya modificados como un
`.patch` con el diff, por si prefieres aplicarlo con `git apply`.