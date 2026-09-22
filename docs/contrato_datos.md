# Contrato de datos — ule educativo

Este documento define **los objetos que recibe el frontend**, con independencia de dónde se
almacenen. Hoy salen de `data/*.json` (Fase 1); en Fase 2 los devolverá la API Go. La interfaz
no debe enterarse del cambio (ver `docs/arquitectura.md` §14 y el principio rector de
`docs/primera_fase.md`).

> Se derivó del código y de los datos reales (no de un diseño teórico) y lo vigila
> `scripts/validar_datos.py`. Si un campo cambia, se actualiza aquí, en el validador y en el
> generador editorial.

> **Contrato vinculante con `tonalmaster_backend` (Fase 7 — contenido Ule).** Esta versión fija
> las rutas de la API (§5) como acordado entre ambos equipos: nomenclatura de URL en inglés,
> igual que ya usa el backend en `calendars`/`auth`/`events`/`interpretations`; los **nombres de
> campo en el JSON siguen en español**, tal cual están definidos en este documento, sin
> excepción. Este archivo debe mantenerse idéntico en ambos repositorios
> (`ule_educativo/docs/contrato_datos.md` y `tonalmaster_backend/docs/contrato_datos.md`); ver el
> plan de implementación en `tonalmaster_backend/docs/plan_fase7_contenido_ule.md`.

Convenciones: `*` = obligatorio · fechas `AAAA-MM-DD` · los nombres con acento
(`bibliografía_relacionada`, `año`, `año_descubrimiento`) **son parte del contrato**: la API
debe devolverlos exactamente así · `visible` por defecto es `true`.

## 1. Artículo

| Campo | Tipo | Notas |
|---|---|---|
| `id`* | string | Único; en fuente local coincide con el nombre del archivo (`articulo-001`). |
| `titulo`* | string | |
| `autor`* | string | |
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
| `autor`* | string | Autor o autores de la referencia, en un único campo. |
| `año` | número/string | Ordena el listado. |
| `tipo`* | enum | `libro` · `capitulo_libro` · `articulo` · `articulo_web` · `web`. Un tipo nuevo requiere agregarlo a `ULE.labels.tipoBiblio` (components.js), al validador y al generador. |
| `editorial` | string | |
| `resumen` | string | |
| `url` | URL `http(s)` | Se abre en pestaña nueva. |
| `articulos_relacionados` | string[] | **Opcional y derivable.** El frontend calcula la relación inversa desde `bibliografía_relacionada` (`ULE.loader.loadRelatedArticlesMap()`); si además se declara aquí, se une sin duplicar. En la DB es la misma tabla `article_bibliography` leída en ambos sentidos. |
| `visible` | boolean | |

> **Nota para el backend:** el borrador de tabla `bibliography` en `docs/arquitectura.md` usa
> columnas `autor` (singular), `anio`, `referencia`, `enlace` y no tiene `visible`. El DTO de
> `GET /bibliography` debe mapear `autor → autores` (como arreglo de un elemento si la columna
> sigue siendo singular), `anio → año`, `referencia → resumen`/`editorial` (o separar la columna
> si se prefiere), `enlace → url`, y la tabla real necesita una columna `visible BOOLEAN DEFAULT
> TRUE` para que el filtrado público (§5) se pueda hacer a nivel de query.

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

> **Nota para el backend:** el borrador de `catalog_items` en `docs/arquitectura.md` guarda
> `categoria` (singular) como columna aparte y el resto en `detalles JSONB`. El DTO de
> `GET /catalogs/{id}` debe **reconstruir** `categorias_disponibles` (a nivel de catálogo) y
> `elementos[].categorias` (objeto `{clave: valor}`) a partir de ese JSONB — el frontend nunca
> debe ver las claves crudas de `detalles`. La tabla `catalogs` también necesita una columna
> `visible BOOLEAN DEFAULT TRUE`.

## 4. Anuncio

Esquema completo y reglas de contenido: `docs/politica_anuncios.md`. Resumen:
`id*`, `imagen`, `imagen_alt`, `contacto`, `slogan`, `descripcion`, `vigencia_inicio`,
`vigencia_fin` (vacío = sin fin), `activo` (`true` para mostrarse), `peso` (≥ 1),
`enlace`, `tipo` (`evento|taller|exhibicion|sponsor|comunidad|otro`),
`paginas` (`home|articulos|articulo|catalogos|bibliografia|todas`), `prioridad_slot`.

> **Nota para el backend — este es el ajuste más grande de los cuatro recursos:** el borrador de
> tabla `ads` en `docs/arquitectura.md` (`titulo, imagen, enlace, paginas, fecha_inicio,
> fecha_fin, activo`) **no cubre este contrato**. Faltan las columnas `imagen_alt`, `contacto`,
> `slogan`, `descripcion`, `peso`, `tipo`, `prioridad_slot`, y `fecha_inicio`/`fecha_fin` deben
> exponerse como `vigencia_inicio`/`vigencia_fin` (`vigencia_fin` nulo = sin fin). No basta con
> un DTO: se necesita ampliar el esquema real (ver plan de desarrollo).

## 5. Endpoints y forma de las respuestas

Con `ULE.config.dataSource = 'api'` y `ULE.config.apiBaseUrl = 'https://<host-backend>/api/v1'`
(el prefijo `/api/v1` va dentro de `apiBaseUrl`, igual que en el resto de la API de
`tonalmaster_backend`):

| Llamada del loader | Petición | Respuesta |
|---|---|---|
| `loadArticles()` | `GET /articles` | Lista |
| `loadArticleById(id)` | `GET /articles/{id}` | Objeto, o **404** |
| `loadBibliografia()` | `GET /bibliography` | Lista |
| `listCatalogIds()` | `GET /catalogs` | Lista de objetos con al menos `id` |
| `loadCatalog(id)` | `GET /catalogs/{id}` | Catálogo completo con `elementos`, o **404** |
| `loadAds()` | `GET /ads` | Lista |

* **Las rutas van en inglés** (`articles`, `bibliography`, `catalogs`, `ads`); es la nomenclatura
  que ya usa el resto de la API (`calendars`, `auth`, `events`, `interpretations`) y queda fijada
  como definitiva — no requiere traducción a español ni decisión adicional. **Los nombres de
  función del loader (`loadArticles`, `loadBibliografia`, …) y todas las claves del JSON
  permanecen en español**, sin cambio; el único ajuste en el frontend es la ruta que arma
  `apiJSON(...)` dentro de `js/loader.js` (ver §6).
* **Rutas públicas, sin sesión.** `articles`, `bibliography`, `catalogs` y `ads` (todas en
  método `GET`) deben quedar fuera del middleware `RequireAuth`: el sitio ule_educativo es de
  solo lectura y no envía cookie ni Bearer token en estas peticiones. La sesión
  `tonalmaster_session` sigue reservada para lo ya existente (`events`, `interpretations`) y para
  futura escritura (p. ej. comentarios).
* **Filtrado de visibilidad en servidor.** Cada endpoint de lista/detalle debe filtrar
  `WHERE visible = TRUE` (o `activo = TRUE` y vigencia vigente para `ads`) en la propia consulta
  SQL, no solo confiar en que el frontend descarte `visible:false` — el loader lo hace además,
  como segunda capa (ver contrato de errores).
* **Imágenes como URL absoluta.** Cuando el contenido venga de la API (no de `data/*.json`
  local), `imagen`, `imagen_destacada` e `imagen_portada` deben ser una URL `https://` que el
  navegador pueda resolver directamente (CDN o `/assets/...` de la propia API); nunca una ruta de
  filesystem del servidor.
* **Lista** = un arreglo, o `{ "items": [...] }`, o `{ "data": [...] }` (el loader acepta las tres).
* Fase 1 no pagina: el frontend pide la lista completa. Si una fase futura introduce paginación,
  debe resolverse dentro del loader, como parámetro opcional que no rompa a quien no lo use.

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

Cambia: la configuración (`ULE.config`) y el interior de `js/loader.js` (adaptador) — en
concreto, las cinco llamadas `apiJSON('/articulos'|'/bibliografia'|'/catalogos'|'/anuncios'|...)`
pasan a `apiJSON('/articles'|'/bibliography'|'/catalogs'|'/ads'|...)` una vez el backend tenga
esas rutas disponibles (§5). Ningún componente, página ni `ULE.ads` cambia: siguen recibiendo el
mismo objeto en español descrito en §1–§4. Los `index.json` dejan de necesitarse; el generador
JSON queda obsoleto.

Comprobación automática: `python3 scripts/pruebas_navegador.py` ejecuta todas las páginas con
`dataSource='api'` contra un API simulado (respuestas normales, 404, 500 y caída de red).