# Contrato de datos — ule educativo

Este documento define **los objetos que recibe el frontend**, con independencia de dónde se
almacenen. Hoy salen de `data/*.json` (Fase 1); en Fase 2 los devolverá la API Go. La interfaz
no debe enterarse del cambio (ver `docs/arquitectura.md` §14 y el principio rector de
`docs/primera_fase.md`).

> Se derivó del código y de los datos reales (no de un diseño teórico) y lo vigila
> `scripts/validar_datos.py`. Si un campo cambia, se actualiza aquí, en el validador y en el
> generador editorial.

Convenciones: `*` = obligatorio · fechas `AAAA-MM-DD` · los nombres con acento
(`bibliografía_relacionada`, `año`, `año_descubrimiento`) **son parte del contrato**: la API
debe devolverlos exactamente así · `visible` por defecto es `true`.

## 1. Artículo

| Campo | Tipo | Notas |
|---|---|---|
| `id`* | string | Único; en fuente local coincide con el nombre del archivo (`articulo-001`). |
| `titulo`* | string | |
| `autor` | string | |
| `fecha`* | fecha | Ordena listados y la navegación anterior/siguiente. |
| `resumen`* | string | Se trunca a ~150 caracteres en las cards. |
| `contenido_html`* | string (HTML) | Secciones desde `<h2>` (la página ya tiene el `<h1>`). Sin `<script>`. Rutas relativas. **Se inserta como HTML**: si la API acepta HTML de más fuentes que el equipo editorial, debe sanearlo en el servidor. |
| `imagen_destacada` | ruta/URL | Relativa (`assets/images/...`) o absoluta `https://`. Nunca `/ruta`. |
| `imagen_alt` | string | Opcional. Sin él la imagen se trata como decorativa (`alt=""`). |
| `categoria` | string | Texto libre; alimenta el filtro y el badge. |
| `etiquetas` | string[] | Se buscan en el listado. |
| `bibliografía_relacionada` | string[] | Ids de referencias. **Fuente de verdad** de la relación. |
| `visible` | boolean | `false` = no se muestra (el loader lo filtra en ambas fuentes). |

## 2. Referencia bibliográfica

| Campo | Tipo | Notas |
|---|---|---|
| `id`* | string | `biblio-NNN`. |
| `titulo`* | string | |
| `autores` | string[] | Se tolera un string. |
| `año` | número/string | Ordena el listado. |
| `tipo`* | enum | `libro` · `capitulo_libro` · `articulo` · `articulo_web` · `web`. Un tipo nuevo requiere agregarlo a `ULE.labels.tipoBiblio` (components.js), al validador y al generador. |
| `editorial` | string | |
| `resumen` | string | |
| `url` | URL `http(s)` | Se abre en pestaña nueva. |
| `articulos_relacionados` | string[] | **Opcional y derivable.** El frontend calcula la relación inversa desde `bibliografía_relacionada` (`ULE.loader.loadRelatedArticlesMap()`); si además se declara aquí, se une sin duplicar. En la DB es la misma tabla `article_bibliography` leída en ambos sentidos. |
| `visible` | boolean | |

## 3. Catálogo (colección)

| Campo | Tipo | Notas |
|---|---|---|
| `id`* | string | Id lógico (`piezas-arqueologicas`). Sólo `[a-z0-9_-]`: el loader rechaza cualquier otro valor. |
| `titulo`* | string | |
| `descripcion` | string | |
| `imagen_portada` | ruta/URL | Reservado: el frontend actual no lo muestra. |
| `categorias_disponibles` | objeto | `{ "periodo": ["preclasico", ...], ... }` define los filtros y sus valores. |
| `elementos`* | Elemento[] | |
| `visible` | boolean | |

### Elemento de catálogo

| Campo | Tipo | Notas |
|---|---|---|
| `id`* | string | Único dentro del catálogo; se usa en el deep link `?catalogo=<id>&pieza=<id>`. |
| `titulo`* | string | |
| `imagen`* | ruta/URL | |
| `imagen_alt` | string | Opcional; por defecto el título. |
| `descripcion` | string | |
| `categorias` | objeto | `{ clave: valor }`; cada valor debe existir en `categorias_disponibles[clave]`. |
| `año_descubrimiento` | número | Opcional. Se muestra como "Descubierto en …". Es una etiqueta pensada para piezas arqueológicas; para otros catálogos conviene renombrarla (decisión pendiente para Fase 2). |
| `ubicacion` | string | Opcional. |

## 4. Anuncio

Esquema completo y reglas de contenido: `docs/politica_anuncios.md`. Resumen:
`id*`, `imagen`, `imagen_alt`, `contacto`, `slogan`, `descripcion`, `vigencia_inicio`,
`vigencia_fin` (vacío = sin fin), `activo` (`true` para mostrarse), `peso` (≥ 1),
`enlace`, `tipo` (`evento|taller|exhibicion|sponsor|comunidad|otro`),
`paginas` (`home|articulos|articulo|catalogos|bibliografia|todas`), `prioridad_slot`.

## 5. Endpoints y forma de las respuestas

Con `ULE.config.dataSource = 'api'` y `ULE.config.apiBaseUrl` (p. ej. `https://api.ejemplo.org/api`):

| Llamada del loader | Petición | Respuesta |
|---|---|---|
| `loadArticles()` | `GET /articulos` | Lista |
| `loadArticleById(id)` | `GET /articulos/{id}` | Objeto, o **404** |
| `loadBibliografia()` | `GET /bibliografia` | Lista |
| `listCatalogIds()` | `GET /catalogos` | Lista de objetos con al menos `id` |
| `loadCatalog(id)` | `GET /catalogos/{id}` | Catálogo completo con `elementos`, o **404** |
| `loadAds()` | `GET /anuncios` | Lista |

* **Lista** = un arreglo, o `{ "items": [...] }`, o `{ "data": [...] }` (el loader acepta las tres).
* Los nombres definitivos de rutas pueden cambiar en Fase 2 (§14.3 de la arquitectura); lo que
  no cambia es el **objeto** que llega a la interfaz.
* Fase 1 no pagina: el frontend pide la lista completa. Si Fase 2 introduce paginación,
  debe resolverse dentro del loader.

### Contrato de errores (idéntico en ambas fuentes)

| Situación | Resultado en el loader | Lo que ve la persona |
|---|---|---|
| Recurso inexistente (404 / archivo faltante) | `null` en consultas por id; `[]` en listas | "No encontrado" |
| Fallo de red o 5xx (sólo API) | lanza `Error` | Mensaje "No fue posible cargar…" (`role="alert"`) |
| Elemento con `visible: false` | se descarta en ambas fuentes | No aparece |

Las páginas envuelven las llamadas en `try/catch`; ninguna debe quedarse en "Cargando…".

## 6. Qué permanece inmutable en la migración a API

Sin cambios: `index.html`, `articulos.html`, `articulo.html`, `bibliografia.html`,
`catalogos.html`, todos los Web Components (`js/components.js`), `js/ads.js`, `js/main.js`, el
CSS y la API pública de `ULE.loader`.

Cambia: la configuración (`ULE.config`) y el interior de `js/loader.js` (adaptador). Los
`index.json` dejan de necesitarse; el generador JSON queda obsoleto.

Comprobación automática: `python3 scripts/pruebas_navegador.py` ejecuta todas las páginas con
`dataSource='api'` contra un API simulado (respuestas normales, 404, 500 y caída de red).
