# Primera Fase — Sitio estático y contrato de contenido

## Objetivo

Cerrar una primera versión sólida de **ule educativo** como sitio estático, pero dejando preparada la arquitectura para que la fuente de contenido pueda cambiar de archivos locales a una **API en Go ejecutándose en Docker y respaldada por una base de datos**, sin rehacer el frontend.

La prioridad para cerrar esta fase es:

1. UX y navegación coherentes.
2. Accesibilidad y responsive.
3. Un contrato de datos estable.
4. Eliminar la fricción actual para dar de alta contenido.
5. Evitar que la futura migración a base de datos obligue a cambiar los componentes visuales.

### Decisión arquitectónica importante

Los archivos JSON dejan de considerarse el modelo definitivo de almacenamiento.

En Fase 1 son únicamente el **adaptador/fuente local de desarrollo y despliegue estático**.

El contrato que debemos conservar es el **objeto de contenido que recibe el frontend**, no la forma física en que se almacena.

En Fase 2 la fuente podrá cambiar:

```
Frontend
   ↓
Servicio de datos
   ↓
┌─────────────────┐
│ JSON local      │  ← Fase 1
│ API Go + DB     │  ← Fase 2
└─────────────────┘
```

Los Web Components no deben saber cuál de las dos fuentes está activa.

---

# 1. Estado actual de la Fase 1

## 1.1 Infraestructura

- [x] Sitio HTML/CSS/JS sin framework frontend.
- [x] GitHub Pages como despliegue inicial.
- [x] Rutas internas relativas para funcionar bajo un subpath.
- [x] Sistema de variables visuales.
- [x] Modo claro/oscuro.
- [x] Responsive en los breakpoints definidos.
- [x] Namespace global `ULE`.
- [x] Carga de datos mediante `js/loader.js`.
- [x] Web Components reutilizables.
- [x] Documentación de identidad y arquitectura.

## 1.2 Contenido implementado

- [x] Artículos.
- [x] Detalle individual de artículo mediante `articulo.html?id=`.
- [x] Bibliografía.
- [x] Catálogos.
- [x] Anuncios.
- [x] Relación artículo ↔ bibliografía.
- [x] Índices/manifiestos JSON necesarios para el sitio estático.

## 1.3 UX implementada

- [x] Navegación principal.
- [x] Skip link.
- [x] Estados de carga y vacío.
- [x] Buscador y filtros de bibliografía.
- [x] Filtrado de catálogos.
- [x] Artículos recientes en portada.
- [x] Navegación anterior/siguiente dentro de artículos.
- [x] Enlace desde bibliografía hacia artículos relacionados.
- [x] Modal para elementos de catálogo.
- [x] Estados `:focus-visible`.
- [x] Respeto de `prefers-reduced-motion` donde corresponde.
- [x] Anuncios integrados sin interrumpir la lectura.

## 1.4 Anuncios

- [x] `data/anuncios.json`.
- [x] `js/ads.js`.
- [x] Selección ponderada.
- [x] Vigencia.
- [x] Filtro por página.
- [x] Fallback cuando una imagen no existe o falla.
- [x] Layout vertical/horizontal.
- [x] Política documentada en `docs/politica_anuncios.md`.
- [x] Separación entre estilos del componente y posicionamiento del slot.

**Pendiente:** sustituir cualquier imagen externa frágil por un archivo local del repositorio cuando el material esté disponible.

## 1.5 Herramienta editorial actual

- [x] `herramientas/generador-json.html`.
- [x] Generación de artículos.
- [x] Generación de bibliografía.
- [x] Generación de elementos de catálogo.
- [x] Generación de anuncios.
- [x] Copiar y descargar JSON.
- [x] Validación básica.
- [x] Recordatorio de actualizar manifiestos.

### Limitación que NO consideramos resuelta

El generador reduce errores, pero **no resuelve el problema principal**: todavía hay que crear/subir archivos, actualizar `index.json` y hacer push.

Por ello no vamos a invertir más esfuerzo en perfeccionar el generador como solución permanente.

---

# 2. Cambio prioritario antes de cerrar la Fase 1

## El contenido debe poder cambiar de fuente sin cambiar la interfaz

El frontend debe consumir funciones conceptuales como:

```text
loadArticles()
loadArticleById(id)
loadBibliografia()
loadBiblioById(id)
loadCatalog(id)
listCatalogIds()
loadAds()
```

Estas funciones ya existen en `ULE.loader`.

La siguiente refactorización debe conservar esa API pública y cambiar únicamente la implementación interna de la fuente.

### Fuente local

```text
ULE.loader
   ↓
adaptador local
   ↓
data/*.json
```

### Fuente futura

```text
ULE.loader
   ↓
adaptador API
   ↓
HTTP
   ↓
API Go
   ↓
Base de datos
```

Los componentes no deben cambiar.

---

# 3. Modelo de datos y base de datos futura

## 3.1 El JSON no es la base de datos

No se debe diseñar la futura DB pensando en almacenar literalmente los archivos JSON.

La DB tendrá entidades normalizadas y relaciones apropiadas.

Como punto de partida:

```text
articles
bibliography
article_bibliography
catalogs
catalog_items
catalog_item_categories
ads
```

Las tablas y columnas definitivas se diseñarán durante la Fase 2 según las consultas reales.

## 3.2 La API es la única puerta de acceso a la DB

El navegador **no** tendrá acceso directo a la base de datos.

```text
GitHub Pages
     ↓ HTTPS
API Go
     ↓
DB
```

La API será responsable de:

- validación;
- consultas;
- relaciones;
- paginación cuando sea necesaria;
- filtros;
- publicación/visibilidad;
- escritura futura;
- autenticación del panel administrativo.

## 3.3 Contrato estable

Aunque la DB cambie, la API debe devolver objetos compatibles con los que hoy consume el frontend.

Ejemplo conceptual:

```json
{
  "id": "articulo-001",
  "titulo": "...",
  "autor": "...",
  "fecha": "2026-01-15",
  "resumen": "...",
  "contenido_html": "...",
  "imagen_destacada": "assets/images/articulos/imagen.jpg",
  "categoria": "Historia",
  "etiquetas": ["olmeca", "clásico"],
  "bibliografía_relacionada": ["biblio-001"],
  "visible": true
}
```

El frontend no debe saber si este objeto provino de JSON o PostgreSQL/otra DB.

---

# 4. Refactorización del loader

Antes de terminar la Fase 1 se debe introducir una separación explícita:

```text
ULE.loader
    ↓
ULE.data
    ├── local
    └── api (preparado)
```

O equivalente, siempre que la API pública de `ULE.loader` se mantenga estable.

Debe existir una configuración sencilla:

```javascript
ULE.config.dataSource = 'local';
```

y posteriormente:

```javascript
ULE.config.dataSource = 'api';
```

No se debe duplicar la lógica de renderizado.

### Regla

Si para pasar de JSON a API tenemos que modificar `index.html`, `articulos.html`, `bibliografia.html`, `catalogos.html` o los Web Components, la abstracción está mal hecha.

---

# 5. Alta de contenido: objetivo de Fase 2

El flujo actual:

```text
crear JSON
   ↓
subir imagen
   ↓
actualizar index.json
   ↓
hacer commit
   ↓
hacer push
```

debe evolucionar a:

```text
Panel editorial
   ↓
formulario
   ↓
API Go
   ↓
DB
```

La imagen será posteriormente gestionada por el API o por almacenamiento de archivos/objetos, según se defina en Fase 2.

### Importante

El panel administrativo **no debe escribir directamente en la DB**.

```text
Panel → API → DB
```

Esto permite validar reglas, permisos, relaciones y futuras migraciones en un solo lugar.

---

# 6. Qué NO hacer todavía

No implementar antes de que exista una necesidad concreta:

- CMS de terceros.
- framework frontend.
- edición directa de SQL desde el navegador.
- conexión del navegador a la DB.
- API genérica para cualquier cosa.
- autenticación compleja.
- sistema de usuarios públicos.
- comentarios.
- analítica propia.
- almacenamiento de imágenes complejo.
- microservicios.
- GraphQL.

La API Go será inicialmente un servicio pequeño y orientado al contenido que realmente necesita ser dinámico.

---

# 7. UX — pendientes para cerrar Fase 1

## 7.1 Deep links de catálogo

- [x] Permitir URL identificable para una pieza, por ejemplo:
  `catalogos.html?catalogo=piezas-arqueologicas&pieza=pieza-001`.
- [x] Abrir automáticamente la pieza cuando la URL la indique.
- [x] Mantener navegación razonable al cerrar el modal.
- [ ] No romper el funcionamiento sin JavaScript adicional. *(El deep-link del modal requiere JavaScript por definición, así que no aplica a él. En el resto, el contenido es dinámico: sin JS las páginas se quedan en "Cargando…"; pendiente decidir si se añade `<noscript>`.)*

## 7.2 Filtros

- [x] Añadir acción clara de “Limpiar filtros” cuando haya filtros activos.
- [x] Mostrar filtros activos de manera comprensible. *(Región `role="status"`: "Mostrando N de M elementos · Filtros activos — …".)*
- [ ] Conservar filtros al utilizar navegación atrás cuando sea razonable.
- [x] Revisar que los estados de cero resultados sean informativos. *(Catálogo: explica el motivo y ofrece "Limpiar filtros".)*

## 7.3 Portada

- [x] Revisar jerarquía visual de la portada.
- [x] Dar mayor protagonismo a los tres caminos principales:
  **Artículos / Bibliografía / Colecciones** *(cards con título, texto y botón; nombre público unificado como "Colecciones")*.
- [x] Revisar ritmo vertical y separación entre secciones.
- [x] Mantener la identidad visual sin añadir colores o efectos innecesarios. *(Única variación: tonos de verde de texto y badge "clásico" ajustados por contraste; ver `docs/identidad.md` §4.1.)*

## 7.4 Catálogos

- [x] Revisar interacción de las cards. *(Botón real en el título; toda la card es clicable.)*
- [x] Hacer evidente que una pieza es interactiva. *(Cursor, elevación al pasar el mouse y aro de foco.)*
- [x] Revisar modal en móvil. *(Centrado, con scroll interno y botón "Cerrar" visible a 375×667.)*
- [ ] Revisar imágenes y proporciones. *(Sólo hay imágenes de ejemplo remotas; se revisa cuando existan las reales.)*
- [x] Preparar el componente para recibir datos de API sin modificar su presentación.

## 7.5 Estados

- [x] Unificar estados de carga.
- [x] Unificar estados vacíos. *(`.catalog-empty`.)*
- [x] Unificar mensajes de error. *("No fue posible cargar …" con `role="alert"`; probado con API caída y con 500.)*
- [x] Evitar pantallas visualmente “rotas” cuando falten imágenes o datos opcionales. *(Imagen con 404 queda oculta en cards, catálogo y artículo.)*

---

# 8. Auditoría final de accesibilidad

Antes de cerrar la Fase 1:

- [ ] Navegación completa solo con teclado. *(Probado: skip link, cards, diálogo con Enter/Escape, filtros. Falta un recorrido humano completo, incluido el generador JSON.)*
- [ ] Orden lógico de foco. *(Recorrido de 65 elementos por tema sin `tabindex` positivo; falta revisión humana del orden visual.)*
- [x] Focus visible. *(Los 65 elementos enfocables recorridos por tema —claro y oscuro— muestran indicador.)*
- [x] Diálogos accesibles.
- [x] Escape cierra modales.
- [ ] Imágenes con `alt` adecuado. *(Falta el campo editorial `imagen_alt` en artículos y catálogos: hoy las imágenes de artículo se tratan como decorativas.)*
- [x] Decorativas con `alt=""`. *(Grecas con `aria-hidden`, miniaturas de cards con `alt=""`.)*
- [x] Formularios con labels. *(Páginas públicas; axe sin violaciones. El generador JSON no se ha auditado.)*
- [x] Estados dinámicos anunciados cuando sea necesario. *(Verificado a nivel de marcado: `role="status"` en conteos y `role="alert"` en errores. Falta probar con lector de pantalla.)*
- [x] Contraste WCAG AA. *(axe-core: 0 violaciones en 5 páginas × claro/oscuro; tokens calculados. No cubre `:hover` ni texto sobre imágenes reales.)*
- [x] No depender únicamente del color. *(Página actual en negrita además de color; enlaces de lectura subrayados; badges con texto.)*
- [x] Revisar zoom al 200%. *(Sin desbordes horizontales a 640 px y a 320 px, equivalentes a 200 % y 400 % de zoom en escritorio.)*
- [x] Revisar móvil.
- [x] Revisar modo claro y oscuro.

---

# 9. Auditoría técnica final

- [x] Todas las rutas internas son relativas. *(Sin rutas `/…`; las pruebas corren bajo el subpath `/ule_educativo/`.)*
- [x] No quedan URLs absolutas accidentales para recursos propios.
- [ ] No quedan hotlinks frágiles donde deba existir un asset local. *(20 advertencias de `validar_datos.py`: imágenes remotas de ejemplo; la del anuncio 002 es una URL de Facebook con expiración ya vencida.)*
- [x] Todos los JSON son válidos. *(`scripts/validar_datos.py`.)*
- [x] Los IDs son únicos. *(Se eliminó `biblio-0.json`, duplicado de `biblio-021.json`.)*
- [x] Los manifiestos coinciden con los archivos mientras exista la fuente local.
- [x] No hay errores de consola. *(0 en 8 páginas × claro/oscuro/320 px. Excluye los recursos externos —Google Fonts, imágenes remotas—, que no se pudieron medir en el entorno de prueba.)*
- [ ] No hay imágenes rotas. *(Ninguna local; las imágenes remotas de ejemplo no se pudieron verificar.)*
- [x] No hay scripts duplicados.
- [ ] No hay CSS muerto evidente. *(Quedan bloques `.ad-card*`, `.badge*` y utilidades que sólo usan los prototipos de la raíz; se limpian al mover o retirar esos prototipos.)*
- [ ] Los componentes conservan responsabilidades claras. *(Los componentes sí; pero `articulos.html` y `bibliografia.html` llevan su lógica de filtros en scripts minificados en una línea. Conviene extraerla a `js/paginas/`.)*
- [x] `ULE.loader` queda preparado para intercambiar fuente local/API. *(Probado: `scripts/pruebas_navegador.py` ejecuta todas las páginas con `dataSource='api'` contra un API simulado —respuestas normales, 404, 500 y caída— sin modificar páginas ni componentes.)*

---

# 10. Documentación

- [x] `docs/identidad.md`.
- [x] `docs/arquitectura.md`.
- [x] `docs/politica_anuncios.md`.
- [x] `docs/GUIA_CONTENIDO.md`.
- [x] Actualizar esta documentación después de la refactorización del loader.
- [x] Documentar el contrato de datos que deberá respetar la futura API. *(`docs/contrato_datos.md`.)*
- [x] Documentar claramente qué parte del frontend permanece inmutable durante la migración a API.

---

# 10 bis. Cómo se verifica y qué sigue abierto

**Verificación automática (repetible):**

```text
python3 scripts/validar_datos.py         # JSON, IDs, manifiestos, relaciones, rutas (sin dependencias)
python3 scripts/pruebas_navegador.py     # comportamiento + modo API (Playwright/Chromium)
```

Además se pasó **axe-core** (WCAG 2.0/2.1/2.2 A-AA y buenas prácticas) sobre 8 páginas/estados en
claro, oscuro y 320 px, con 0 violaciones. Esto no está en el script para no exigir `npm`.

> Historial de lección aprendida: `js/loader.js` estuvo roto (regex inválida → `SyntaxError`)
> desde `9c77d93` hasta `399c810` sin que el checklist lo detectara, porque nada se ejecutaba en
> un navegador. Ningún ítem de UX/accesibilidad/técnica debe marcarse `[x]` sin haberse
> ejecutado en un navegador.

**Pendiente real antes de cerrar la Fase 1:**

1. Sustituir las imágenes remotas por assets locales (`assets/images/…`) y añadir `imagen_alt`.
2. Autoalojar la tipografía (Google Fonts es la única dependencia externa; ver `arquitectura.md` §2).
3. Revisión humana: teclado completo, orden de foco y lector de pantalla (NVDA/VoiceOver).
4. Decidir qué hacer con los prototipos de la raíz (`simulador.html`, `claude02.html`,
   `presnetacion tiro.html`, `test_identidad.html`, `prueba_identidad.html`, `sierra.png` de 5 MB).
5. Extraer los scripts de página a `js/paginas/` y retirar CSS muerto.
6. Logo en modo oscuro (trazo negro sobre `#1E352F` casi no se distingue): definir variante clara.
7. Decidir `<noscript>` y conservación de filtros al volver atrás (§7.1, §7.2).

---

# 11. Criterio para declarar cerrada la Fase 1

**Estado:** la Fase 1 se declaró cerrada antes de comprobarse en un navegador y, en ese momento, el sitio publicado no cargaba nada (`js/loader.js` tenía un `SyntaxError` desde `9c77d93`; todas las páginas se quedaban en "Cargando…"). Se da por cerrada cuando `scripts/pruebas_navegador.py` y `scripts/validar_datos.py` terminan en verde sobre `master` **y** los pendientes de §10 bis están resueltos o aceptados por escrito. La revisión con lector de pantalla puede quedar como validación posterior.

La Fase 1 se da por cerrada cuando:

1. El sitio sea visualmente coherente en móvil y escritorio.
2. La navegación principal y secundaria sea clara.
3. Artículos, bibliografía y catálogos funcionen sin intervención manual en el HTML.
4. Los estados de carga, error y vacío sean consistentes.
5. El sitio sea accesible en un nivel razonable WCAG AA.
6. No existan dependencias de rutas absolutas incompatibles con GitHub Pages.
7. El alta de contenido local esté documentada.
8. El frontend tenga una frontera clara entre **presentación** y **fuente de datos**.
9. Cambiar de JSON local a API no requiera modificar los componentes visuales.
10. El contrato de datos para la futura API Go esté documentado.

La Fase 1 **no requiere que la API esté construida**.

La meta es que la API pueda construirse después sin rehacer lo que ya funciona.

---

# 13. Transición a Fase 2

La Fase 2 comenzará con:

### Backend

- API Go.
- Docker.
- Base de datos.
- Migraciones.
- Endpoints de contenido.
- Validación.
- Autenticación para administración.

### Editorial

- Panel de administración.
- Alta/edición/borrado lógico.
- Relaciones artículo ↔ bibliografía.
- Gestión de catálogos.
- Gestión de anuncios.

### Frontend

El frontend deberá cambiar únicamente:

```text
fuente local
    ↓
fuente API
```

Los componentes y páginas deberán permanecer conceptualmente iguales.

---

# 14. Principio rector

> **El contenido cambia; la interfaz no debería enterarse de dónde viene.**

La Fase 1 termina construyendo una buena interfaz estática.

La Fase 2 no debe reconstruir esa interfaz: debe sustituir la fuente de datos y proporcionar las herramientas para administrarla.
