# Documentación — Fase 1

Guía de referencia rápida de lo construido en la Fase 1: el sistema de diseño, la
lógica JS global y los Web Components. No repite el plan completo (ver
`primera_fase.md`), solo explica **cómo usar** cada pieza.

> Estado al momento de este documento: infraestructura CSS/JS, Web Components,
> `articulos.html` y `articulo.html` están listos. `bibliografia.html` y
> `catalogos.html` (resto de la Fase 1.3) y `ads.js` (Fase 1.4) siguen pendientes.

---

## 1. Sistema de diseño (CSS)

Cuatro archivos, en este orden de carga siempre:

```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/theme.css">
```

- **`variables.css`** — la única fuente de verdad para colores, tipografía,
  espaciado, radios y sombras. Todo lo demás consume `var(--algo)`, nunca
  valores fijos. Incluye los colores de modo oscuro bajo `:root[data-theme="dark"]`
  y la paleta fija de badges (`--badge-<categoria>-<valor>`, ej.
  `--badge-periodo-clasico`).
- **`base.css`** — reset, tipografía base, `.container`, `.skip-link`, botones,
  enlaces, header sticky (`.header--hidden` / `.header--visible`).
- **`components.css`** — todo lo reutilizable: `.card`, `.badge`, `.catalog-*`,
  `.articles-grid`, `.biblio-list`, `.filtros`, `.catalog-selector`, `.ad-card`,
  `.nav`, `.greca`, `.articulo`, utilidades `.stack`/`.cluster`.
- **`theme.css`** — la capa de *comportamiento* del tema: `color-scheme`,
  transición suave al cambiar, fallback por `prefers-color-scheme`, iconos
  sol/luna del botón de tema, ajuste de brillo de fotos en modo oscuro.

**Regla práctica:** si necesitas un color, tipografía o espaciado nuevo,
agrégalo en `variables.css` primero — nunca lo escribas a mano en una página.

---

## 2. `js/main.js` — Tema y navegación global

Se incluye en **todas** las páginas, sin `defer`, normalmente al final del
`<body>`. Expone `window.ULE.theme` y `window.ULE.nav`.

### Tema
- Aplica el tema guardado (o el del sistema operativo) apenas se ejecuta el
  script — no espera a `DOMContentLoaded`.
- Contrato HTML necesario para el botón de tema:
  ```html
  <button class="theme-toggle" type="button" id="theme-toggle" aria-label="Cambiar tema">
    <span class="theme-toggle__icon">
      <svg class="icon-sol">...</svg>
      <svg class="icon-luna">...</svg>
    </span>
    <span id="theme-label">Oscuro</span>
  </button>
  ```
- `ULE.theme.toggle()` y `ULE.theme.apply('dark' | 'light')` están disponibles
  para usarse desde cualquier otro script si hace falta.

### Navegación
Todo corre automáticamente en `DOMContentLoaded` — no requiere llamar nada:
- Resalta con `aria-current="page"` el link de `.nav__link` cuya URL coincide
  con la página actual.
- Oculta/muestra el `<header>` al hacer scroll (agrega/quita
  `.header--hidden` / `.header--visible`); reaparece si el mouse se acerca al
  borde superior.
- Mueve el foco al navegar por anclas internas (`href="#seccion"`), para
  accesibilidad de teclado.
- Menú móvil opcional: si agregas un botón `#nav-toggle` dentro de `.nav`, se
  activa solo; si no existe, no hace nada (no es obligatorio usarlo).

---

## 3. `js/loader.js` — Carga de datos JSON

Expone `window.ULE.loader`. Todas las funciones son `async` y usan una caché
en memoria (no repiten peticiones de red a la misma URL en la misma sesión).

**Cómo lista archivos sin backend:** cada carpeta de datos necesita un
`index.json` con la lista de archivos que contiene, por ejemplo:

```
data/articulos/index.json → ["articulo-001.json", "articulo-002.json", "articulo-003.json"]
```

Esto es porque un sitio estático (GitHub Pages) no puede "ver" el contenido de
una carpeta por sí solo. **Agregar contenido = crear el `.json` + agregarlo a
`index.json`.** Sigue sin tocar código.

Funciones más usadas:

| Función | Qué hace |
|---|---|
| `ULE.loader.loadArticles()` | Todos los artículos con `visible !== false` |
| `ULE.loader.loadArticleById(id)` | Un artículo por id |
| `ULE.loader.loadBibliografia()` | Todas las referencias bibliográficas |
| `ULE.loader.loadBiblioForArticle(articulo)` | Resuelve `bibliografía_relacionada` a objetos completos |
| `ULE.loader.loadCatalog(catalogId)` | Un catálogo completo por id de archivo |
| `ULE.loader.listCatalogIds()` | Ids disponibles (lee `data/catalogos/index.json`) |
| `ULE.loader.filterCatalogItems(catalogo, filtros)` | Filtra `elementos` por categorías, ej. `{ periodo: ['clasico'] }` |

Si no existe `index.json` en una carpeta, `loadArticles`/`loadBibliografia`
caen automáticamente a un sondeo secuencial (`articulo-001.json`,
`articulo-002.json`…) — funciona, pero es más frágil; el manifiesto siempre es
lo recomendado.

---

## 4. `js/components.js` — Web Components

Se incluyen después de `loader.js`. Se auto-registran al cargar el script, no
hace falta inicializarlos a mano.

### `<ule-badge>`
Etiqueta de categoría. Nombre con guion porque `<badge>` a secas no es válido
como Custom Element.
```html
<ule-badge type="periodo-clasico" label="Clásico"></ule-badge>
```
El color sale de `var(--badge-<type>)`; si esa variable no existe, cae al
color secundario por defecto — funciona con categorías nuevas sin tocar CSS.

### `<article-card>`
```html
<article-card
  data-id="articulo-001"
  data-title="Título"
  data-summary="Resumen…"
  data-image="/ruta/imagen.jpg"
  data-category="Historia"
  data-date="2026-01-15"
  data-author="Nombre (opcional)"
  data-href="articulo.html?id=articulo-001">
</article-card>
```
Trunca el resumen a 150 caracteres solo. Si omites `data-href`, apunta por
defecto a `articulo.html?id=<data-id>`.

### `<biblio-card>`
```html
<biblio-card
  data-id="biblio-001"
  data-title="Título"
  data-authors="Autor1, Autor2"
  data-year="2020"
  data-type="libro"
  data-editorial="Editorial X"
  data-url="https://ejemplo.com"
  data-summary="Resumen…">
</biblio-card>
```
`data-url` es opcional; si se da, agrega un enlace "Ver fuente" (nueva
pestaña, con `rel="noopener"`).

### `<ad-card>`
```html
<ad-card
  data-image="/ruta.jpg"
  data-slogan="Torneo 2026"
  data-contacto="info@x.com"
  data-vigencia-fin="2026-06-30"
  data-enlace="https://x.com"
  horizontal>
</ad-card>
```
El atributo `horizontal` (booleano, sin valor) cambia el layout de vertical a
horizontal. Si hay `data-enlace`, toda la card es un link.

### `<catalog-grid>`
El único que **no** usa Shadow DOM (reutiliza directamente las clases de
`components.css`, porque duplicarlas dentro de un shadow root sería repetir
todo el archivo).
```html
<catalog-grid data-source="data/catalogos/piezas-arqueologicas.json"></catalog-grid>
```
- Si omites `categories`, detecta automáticamente las categorías filtrables
  desde `categorias_disponibles` del JSON.
- Renderiza filtros (checkboxes), título/descripción del catálogo, grid
  responsive y un modal (`<dialog>` nativo) al hacer clic en una pieza.
- `allow-filter="false"` oculta los filtros; `hide-header` oculta
  título/descripción.
- Para cambiar de catálogo dinámicamente (selector/tabs), solo hay que
  actualizar el atributo `data-source` — el componente reacciona solo.

---

## 5. Esquema de datos (resumen)

Todos los campos exactos están en `primera_fase.md` (sección 2). Lo esencial:

- **Artículo**: `id`, `titulo`, `autor`, `fecha`, `resumen`, `contenido_html`
  (HTML de confianza, se inserta con `innerHTML`), `imagen_destacada`,
  `categoria`, `etiquetas[]`, `bibliografía_relacionada[]` (ids de biblio),
  `visible`.
- **Bibliografía**: `id`, `titulo`, `autores[]`, `año`, `editorial`, `tipo`
  (`libro`/`articulo`/`web`), `url`, `resumen`, `articulos_relacionados[]`,
  `visible`.
- **Catálogo**: `id`, `titulo`, `descripcion`, `imagen_portada`, `elementos[]`
  (cada uno con `categorias: {clave: valor}` libre), `categorias_disponibles`
  (qué valores existen por clave, para armar los filtros), `visible`.

**Importante:** todas las rutas en el HTML/JS usan rutas **relativas**
(`data/...`, `assets/...`, sin `/` inicial). El sitio se sirve como proyecto
de GitHub Pages bajo un subpath (`usuario.github.io/ule_educativo/`), así que
una ruta absoluta como `/data/...` apuntaría al dominio raíz y rompería.

---

## 6. Páginas ya construidas

- **`articulos.html`** — buscador de texto + filtro por categoría + orden por
  fecha, grid responsive (`articles-grid`: 1/2/3 columnas) de
  `<article-card>`.
- **`articulo.html`** — detalle de un artículo vía `?id=articulo-XXX`, muestra
  `contenido_html` completo y su bibliografía relacionada con `<biblio-card>`.

Pendientes de la Fase 1.3: `bibliografia.html` y `catalogos.html` (esta última
necesita además el selector de catálogo/tabs sobre `<catalog-grid>`).
