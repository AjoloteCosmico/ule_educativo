# Documentación — Fase 1

Guía de referencia rápida de lo construido en la Fase 1: sistema de diseño, lógica JS global, Web Components, páginas de contenido y gestor de anuncios.

> **Estado:** Fase 1.3 concluida. Fase 1.4 concluida a nivel de infraestructura: `data/anuncios.json` y `js/ads.js` están listos. La publicación de anuncios concretos queda como contenido administrable.

---

## 1. Sistema de diseño (CSS)

Cuatro archivos, en este orden de carga siempre:

```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/theme.css">
```

- **`variables.css`** — colores, tipografía, espaciado, radios y sombras.
- **`base.css`** — reset, tipografía base, contenedores, accesibilidad y botones.
- **`components.css`** — cards, badges, catálogo, anuncios, navegación y grids.
- **`theme.css`** — comportamiento del modo claro/oscuro.

---

## 2. `js/main.js` — Tema y navegación global

Se incluye en todas las páginas, sin `defer`, normalmente al final del `<body>`. Expone `window.ULE.theme` y `window.ULE.nav`.

---

## 3. `js/loader.js` — Carga de datos JSON

Expone `window.ULE.loader`. Las funciones usan caché en memoria y trabajan con manifiestos `index.json` cuando están disponibles.

Todas las rutas del sitio deben ser **relativas** (`data/...`, `assets/...`, sin `/` inicial) para que GitHub Pages funcione correctamente bajo un subpath.

---

## 4. `js/components.js` — Web Components

Incluye:

- `<ule-badge>` — etiquetas de categoría.
- `<article-card>` — tarjetas de artículos.
- `<biblio-card>` — referencias bibliográficas.
- `<ad-card>` — tarjeta de anuncio vertical u horizontal.
- `<catalog-grid>` — filtros, grid y modal de piezas de catálogo.

`<ad-card>` recibe `data-image`, `data-slogan`, `data-contacto`, `data-vigencia-fin` y `data-enlace`. Si existe `data-enlace`, la tarjeta funciona como enlace externo.

---

## 5. Páginas

- **`index.html`** — página de inicio y acceso a las secciones principales.
- **`articulos.html`** — buscador, filtro y ordenamiento de artículos.
- **`articulo.html`** — lectura individual y bibliografía relacionada.
- **`bibliografia.html`** — búsqueda, filtro por tipo y ordenamiento de referencias.
- **`catalogos.html`** — selector de colecciones y `<catalog-grid>` dinámico.

Los datos de artículos, bibliografía y catálogos se administran mediante JSON, sin modificar la lógica de las páginas.

---

## 6. Fase 1.4 — Gestión de anuncios

### Datos: `data/anuncios.json`

El archivo contiene un objeto con una propiedad `anuncios`, formada por elementos con esta estructura:

```json
{
  "id": "anuncio-001",
  "imagen": "assets/images/anuncios/ejemplo.jpg",
  "contacto": "contacto@example.org",
  "slogan": "Actividad de ejemplo",
  "descripcion": "Descripción breve.",
  "vigencia_inicio": "2026-01-01",
  "vigencia_fin": "2026-12-31",
  "activo": true,
  "peso": 1,
  "enlace": "https://example.org"
}
```

### Lógica: `js/ads.js`

El módulo `window.ULE.ads`:

1. Carga `data/anuncios.json` una sola vez por sesión mediante caché.
2. Considera únicamente anuncios con `activo: true`.
3. Comprueba `vigencia_inicio` y `vigencia_fin` contra la fecha local del navegador.
4. Selecciona anuncios mediante **ponderación por `peso`**.
5. Puede renderizar múltiples espacios de anuncio de forma independiente.
6. Oculta el espacio si no existe ningún anuncio vigente.

Para crear un espacio en cualquier página:

```html
<div data-ad-slot></div>
```

Para solicitar la variante horizontal:

```html
<div data-ad-slot data-ad-horizontal="true"></div>
```

La página debe cargar `js/components.js` antes de `js/ads.js` para que `<ad-card>` esté registrado cuando se renderice el anuncio.

Ejemplo de carga:

```html
<script src="js/main.js"></script>
<script src="js/loader.js"></script>
<script src="js/components.js"></script>
<script src="js/ads.js"></script>
```

### Contenido publicitario

`anuncios.json` es contenido, no lógica. Para publicar un anuncio real se sustituyen los datos de ejemplo por información real y, si corresponde, se agrega su imagen dentro de `assets/images/anuncios/`.

---

## 7. Regla de mantenimiento

Para agregar contenido nuevo, prioriza modificar JSON y manifiestos antes que JavaScript o HTML. La lógica debe permanecer genérica siempre que sea posible.
