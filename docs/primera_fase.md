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
listCatalogs()
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

- [ ] Permitir URL identificable para una pieza, por ejemplo:
  `catalogos.html?catalogo=piezas-arqueologicas&pieza=pieza-001`.
- [ ] Abrir automáticamente la pieza cuando la URL la indique.
- [ ] Mantener navegación razonable al cerrar el modal.
- [ ] No romper el funcionamiento sin JavaScript adicional.

## 7.2 Filtros

- [ ] Añadir acción clara de “Limpiar filtros” cuando haya filtros activos.
- [ ] Mostrar filtros activos de manera comprensible.
- [ ] Conservar filtros al utilizar navegación atrás cuando sea razonable.
- [ ] Revisar que los estados de cero resultados sean informativos.

## 7.3 Portada

- [ ] Revisar jerarquía visual de la portada.
- [ ] Dar mayor protagonismo a los tres caminos principales:
  **Artículos / Bibliografía / Catálogos**.
- [ ] Revisar ritmo vertical y separación entre secciones.
- [ ] Mantener la identidad visual sin añadir colores o efectos innecesarios.

## 7.4 Catálogos

- [ ] Revisar interacción de las cards.
- [ ] Hacer evidente que una pieza es interactiva.
- [ ] Revisar modal en móvil.
- [ ] Revisar imágenes y proporciones.
- [ ] Preparar el componente para recibir datos de API sin modificar su presentación.

## 7.5 Estados

- [ ] Unificar estados de carga.
- [ ] Unificar estados vacíos.
- [ ] Unificar mensajes de error.
- [ ] Evitar pantallas visualmente “rotas” cuando falten imágenes o datos opcionales.

---

# 8. Auditoría final de accesibilidad

Antes de cerrar la Fase 1:

- [ ] Navegación completa solo con teclado.
- [ ] Orden lógico de foco.
- [ ] Focus visible.
- [ ] Diálogos accesibles.
- [ ] Escape cierra modales.
- [ ] Imágenes con `alt` adecuado.
- [ ] Decorativas con `alt=""`.
- [ ] Formularios con labels.
- [ ] Estados dinámicos anunciados cuando sea necesario.
- [ ] Contraste WCAG AA.
- [ ] No depender únicamente del color.
- [ ] Revisar zoom al 200%.
- [ ] Revisar móvil.
- [ ] Revisar modo claro y oscuro.

---

# 9. Auditoría técnica final

- [ ] Todas las rutas internas son relativas.
- [ ] No quedan URLs absolutas accidentales para recursos propios.
- [ ] No quedan hotlinks frágiles donde deba existir un asset local.
- [ ] Todos los JSON son válidos.
- [ ] Los IDs son únicos.
- [ ] Los manifiestos coinciden con los archivos mientras exista la fuente local.
- [ ] No hay errores de consola.
- [ ] No hay imágenes rotas.
- [ ] No hay scripts duplicados.
- [ ] No hay CSS muerto evidente.
- [ ] Los componentes conservan responsabilidades claras.
- [ ] `ULE.loader` queda preparado para intercambiar fuente local/API.

---

# 10. Documentación

- [x] `docs/identidad.md`.
- [x] `docs/arquitectura.md`.
- [x] `docs/politica_anuncios.md`.
- [x] `docs/GUIA_CONTENIDO.md`.
- [ ] Actualizar esta documentación después de la refactorización del loader.
- [ ] Documentar el contrato de datos que deberá respetar la futura API.
- [ ] Documentar claramente qué parte del frontend permanece inmutable durante la migración a API.

---

# 11. Criterio para declarar cerrada la Fase 1

La Fase 1 estará cerrada cuando:

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

# 12. Transición a Fase 2

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

# 13. Principio rector

> **El contenido cambia; la interfaz no debería enterarse de dónde viene.**

La Fase 1 termina construyendo una buena interfaz estática.

La Fase 2 no debe reconstruir esa interfaz: debe sustituir la fuente de datos y proporcionar las herramientas para administrarla.
