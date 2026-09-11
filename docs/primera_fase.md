# Primera Fase — Plan de Acción

## Objetivo
Implementar una estructura escalable basada en JSON para que las secciones de **Artículos**, **Bibliografía** y **Catálogos** sean alimentadas dinámicamente sin tocar el código. Solo cargar más archivos JSON en las carpetas correspondientes.

---

## 1. Estructura de directorios

Crear la siguiente estructura en el repositorio:

```
/
├── index.html                    (Home principal)
├── articulos.html               (Página de artículos)

├── bibliografia.html            (Página de bibliografía)
├── catalogos.html               (Página de catálogos)
│
├── css/
│   ├── variables.css            (Sistema de diseño: colores, tipografía, espaciado)
│   ├── base.css                 (Estilos globales: reset, tipografía base)
│   ├── components.css           (Componentes reutilizables: cards, badges, grid)
│   └── theme.css                (Modo claro/oscuro)
│
├── js/
│   ├── main.js                  (Lógica global: tema, navegación)
│   ├── loader.js                (Carga de JSON y renderizado dinámico)
│   ├── components.js            (Web Components: catalog-grid, card, badge)
│   └── ads.js                   (Gestión de anuncios)
│
├── data/
│   ├── articulos/               📁 Carpeta de artículos
│   │   ├── articulo-001.json    (Ejemplo: "Historia del Juego de Pelota")
│   │   ├── articulo-002.json
│   │   └── ...
│   ├── bibliografia/            📁 Carpeta de bibliografía
│   │   ├── biblio-001.json      (Ejemplo: referencias de un artículo)
│   │   ├── biblio-002.json
│   │   └── ...
│   ├── catalogos/               📁 Carpeta de catálogos
│   │   ├── piezas-arqueologicas.json
│   │   ├── canchas-modernas.json
│   │   └── ...
│   ├── anuncios.json            (Anuncios globales con vigencia)
│   └── i18n/                    (Traducciones futuras)
│       ├── es.json
│       ├── en.json
│       └── fr.json
│
├── components/
│   ├── navbar.html              (Componente de navegación)
│   └── footer.html              (Pie de página)
│
├── assets/
│   ├── images/
│   │   ├── articulos/           (Imágenes de artículos)
│   │   ├── catalogos/           (Imágenes de catálogos)
│   │   └── anuncios/            (Imágenes de anuncios)
│   ├── icons/
│   │   ├── logo.svg
│   │   ├── cancha.svg           (Icono de cancha de pelota)
│   │   └── greca.svg            (Unidad de greca para divisorias)
│   └── logo/
│       ├── logo-simple.svg
│       └── logo-completo.svg
├── docs/
│       ├── primera_fase.md
│       └── docs_fase1.md
│       ├── arquitectura.md
│       └── identidad.md
```

---

## 2. Esquema de datos JSON

### 2.1 Artículos (`data/articulos/articulo-001.json`)

```json
{
  "id": "articulo-001",
  "titulo": "Historia del Juego de Pelota Mesoamericano",
  "autor": "Nombre del autor",
  "fecha": "2026-01-15",
  "resumen": "Breve introducción al tema del artículo",
  "contenido_html": "<p>Contenido HTML del artículo...</p>",
  "imagen_destacada": "/assets/images/articulos/imagen-001.jpg",
  "categoria": "Historia",
  "etiquetas": ["olmeca", "clásico", "rituales"],
  "bibliografía_relacionada": ["biblio-001", "biblio-002"],
  "visible": true
}
```

### 2.2 Bibliografía (`data/bibliografia/biblio-001.json`)

```json
{
  "id": "biblio-001",
  "titulo": "The Ball Game of the Ancient Mesoamerica",
  "autores": ["Nombre Autor 1", "Nombre Autor 2"],
  "año": 2020,
  "editorial": "Editorial X",
  "tipo": "libro",
  "url": "https://ejemplo.com",
  "resumen": "Descripción breve del contenido",
  "articulos_relacionados": ["articulo-001", "articulo-003"],
  "visible": true
}
```

### 2.3 Catálogos (`data/catalogos/piezas-arqueologicas.json`)

```json
{
  "id": "piezas-arqueologicas",
  "titulo": "Piezas Arqueológicas",
  "descripcion": "Colección de artefactos relacionados con el juego de pelota",
  "imagen_portada": "/assets/images/catalogos/portada.jpg",
  "elementos": [
    {
      "id": "pieza-001",
      "titulo": "Collar de Piedra",
      "imagen": "/assets/images/catalogos/pieza-001.jpg",
      "descripcion": "Descripción de la pieza",
      "categorias": {
        "periodo": "preclasico",
        "cultura": "olmeca",
        "material": "piedra"
      },
      "año_descubrimiento": 1980,
      "ubicacion": "Museo X"
    },
    {
      "id": "pieza-002",
      "titulo": "Marcador de Cancha",
      "imagen": "/assets/images/catalogos/pieza-002.jpg",
      "descripcion": "Descripción de la pieza",
      "categorias": {
        "periodo": "clasico",
        "cultura": "maya",
        "material": "piedra caliza"
      },
      "año_descubrimiento": 1995,
      "ubicacion": "Museo Y"
    }
  ],
  "categorias_disponibles": {
    "periodo": ["preclasico", "clasico", "posclasico"],
    "cultura": ["olmeca", "maya", "azteca", "golfo", "cacaxtla"],
    "material": ["piedra", "cerámica", "obsidiana"]
  },
  "visible": true
}
```

### 2.4 Anuncios (`data/anuncios.json`)

```json
{
  "anuncios": [
    {
      "id": "anuncio-001",
      "imagen": "/assets/images/anuncios/evento-001.jpg",
      "contacto": "info@eventos.com | Tel: +123 456 7890",
      "slogan": "Torneo de Pelota 2026",
      "descripcion": "Competencia regional de juego de pelota. Participación abierta.",
      "vigencia_inicio": "2026-03-01",
      "vigencia_fin": "2026-06-30",
      "activo": true,
      "peso": 2,
      "enlace": "https://eventos.com/torneo-2026"
    },
    {
      "id": "anuncio-002",
      "imagen": "/assets/images/anuncios/taller-002.jpg",
      "contacto": "talleres@ule.org",
      "slogan": "Taller de Técnica: Golpe de Cadera",
      "descripcion": "Aprende las bases del tiro de cadera con maestros locales.",
      "vigencia_inicio": "2026-02-01",
      "vigencia_fin": "2026-12-31",
      "activo": true,
      "peso": 1,
      "enlace": "https://ule.org/talleres"
    }
  ]
}
```

---

## 3. Implementación de componentes y funcionalidad

### 3.1 Estructura CSS (`css/variables.css`)

Ya existe en `identidad.md`. Implementar:
- Variables de color (claro/oscuro)
- Tipografía (Ubuntu, Helvetica)
- Escala de espaciado
- Radios de borde
- Sombras
- Breakpoints responsive

### 3.2 Componentes Web (`js/components.js`)

Crear Web Components reutilizables:

#### `<article-card>`
```html
<article-card 
  data-id="articulo-001"
  data-title="Título"
  data-summary="Resumen..."
  data-image="/ruta/imagen.jpg"
  data-category="Historia"
  data-date="2026-01-15">
</article-card>
```

#### `<catalog-grid>`
```html
<catalog-grid 
  data-source="/data/catalogos/piezas-arqueologicas.json"
  categories="periodo,cultura,material"
  allow-filter="true">
</catalog-grid>
```

#### `<biblio-card>`
```html
<biblio-card 
  data-id="biblio-001"
  data-title="Título"
  data-authors="Autor1, Autor2"
  data-year="2020"
  data-type="libro">
</biblio-card>
```

#### `<ad-card>`
Mostrar anuncio con imagen, contacto, slogan y descripción.

### 3.3 Módulo de carga (`js/loader.js`)

```javascript
// Cargar y parsear JSON
async function loadJSON(path) {
  const response = await fetch(path);
  return response.json();
}

// Renderizar artículos desde JSON
async function renderArticles() {
  const files = await getFilesInFolder('/data/articulos/');
  const articles = [];
  for (const file of files) {
    const data = await loadJSON(`/data/articulos/${file}`);
    if (data.visible) articles.push(data);
  }
  return articles;
}

// Renderizar catálogos desde JSON
async function renderCatalog(catalogId) {
  const data = await loadJSON(`/data/catalogos/${catalogId}.json`);
  return data;
}
```

---

## 4. Vistas de páginas

### 4.1 Página de Artículos (`articulos.html`)

**Layout:**
1. **Header** con navegación
2. **Buscador/Filtrador** (categoría, etiqueta, fecha)
3. **Grid de cards** (artículos)
   - Imagen destacada
   - Título
   - Autor y fecha
   - Resumen (primeras 150 caracteres)
   - Badges de categoría/etiquetas
   - Botón "Leer más"
4. **Sidebar** (futuro): artículos relacionados
5. **Footer**

**Responsive:**
- Mobile: 1 columna
- Tablet (≥768px): 2 columnas
- Desktop (≥1024px): 3 columnas

### 4.2 Página de Bibliografía (`bibliografia.html`)

**Layout:**
1. **Header** con navegación
2. **Filtrador** (tipo: libro, artículo, web; año; autor)
3. **Lista/Grid de referencias**
   - Título
   - Autores
   - Año
   - Editorial/Fuente
   - Tipo (icono)
   - Resumen
   - Enlace (si aplica)
4. **Opción de exportación** (futuro: BibTeX, RIS)
5. **Footer**

**Ordenamiento:**
- Por año (descendente, predeterminado)
- Por autor
- Por título

### 4.3 Página de Catálogos (`catalogos.html`)

**Layout:**
1. **Header** con navegación
2. **Selector de catálogo** (dropdown/tabs para elegir entre piezas-arqueologicas, canchas-modernas, etc.)
3. **Descripción del catálogo** (imagen de portada, texto introductorio)
4. **Filtrador dinámico**
   - Por cada categoría disponible en el catálogo (período, cultura, material, etc.)
   - Checkboxes o dropdown
5. **Grid de piezas** (cards con imagen, título, categorías en badges)
6. **Modal/Lightbox** al hacer clic en una pieza (imagen, descripción completa, metadata)
7. **Footer**

**Responsive grid:**
- Mobile: 1 columna
- Tablet (≥480px): 2 columnas
- Desktop (≥768px): 3 columnas
- Wide (≥1024px): 4 columnas

---

## 5. Carga de anuncios en cards

### 5.1 Componente `<ad-card>`

**Ubicación:** En la home o como rotativo en distintas páginas.

**Estructura visual:**
```
┌─────────────────────────┐
│      IMAGEN (4:5)       │  ← Imagen destacada del anuncio
├─────────────────────────┤
│   SLOGAN (grande)       │  ← Frase principal (bold)
│   contacto@email.com    │  ← Info de contacto
├─────────────────────────┤
│ Vigente hasta: 30/06    │  ← Texto legal pequeño
└─────────────────────────┘
```

### 5.2 Lógica de selección

**En `js/ads.js`:**

1. Cargar `data/anuncios.json`
2. Filtrar por:
   - `activo === true`
   - Fecha actual está en rango `[vigencia_inicio, vigencia_fin]`
3. Seleccionar aleatoriamente con ponderación por `peso`
4. Renderizar en el/los contenedores designados

```javascript
async function getRandomAd() {
  const data = await loadJSON('/data/anuncios.json');
  const validAds = data.anuncios.filter(ad => {
    const today = new Date().toISOString().split('T')[0];
    return ad.activo && ad.vigencia_inicio <= today && today <= ad.vigencia_fin;
  });
  
  if (validAds.length === 0) return null;
  
  // Selección ponderada por peso
  const totalWeight = validAds.reduce((sum, ad) => sum + ad.peso, 0);
  let random = Math.random() * totalWeight;
  
  for (const ad of validAds) {
    random -= ad.peso;
    if (random <= 0) return ad;
  }
}
```

---

## 6. Tareas inmediatas (checklist)

### Fase 1.1: Infraestructura CSS y JS

- [x] Crear `css/variables.css` con todas las variables de la identidad
- [x] Crear `css/base.css` con reset y estilos globales
- [x] Crear `css/components.css` con componentes base (cards, badges, grid)
- [x] Crear `css/theme.css` para modo claro/oscuro
- [x] Crear `js/main.js` con lógica de tema y navegación global
- [x] Crear `js/loader.js` con funciones de fetch y mapeo de JSON

### Fase 1.2: Web Components

- [x] Crear `js/components.js` con:
  - `<article-card>`
  - `<catalog-grid>`
  - `<biblio-card>`
  - `<ad-card>`
  - `<badge>`

### Fase 1.3: Páginas y datos

- [x] Crear `articulos.html` (estructura base + script de carga)
- [x] Crear `bibliografia.html` (estructura base + script de carga)
- [x] Crear `catalogos.html` (estructura base + script de carga)
- [x] Crear carpetas de datos:
  - [x] `data/articulos/`
  - [x] `data/bibliografia/`
  - [x] `data/catalogos/`
- [x] Crear 2-3 archivos JSON ejemplo en cada carpeta

### Fase 1.4: Anuncios

> **Estado actual (post 1.3):** ya existen `data/anuncios.json`, `js/ads.js`, el Web Component `<ad-card>` y 2 slots en `index.html`.  
> Esta sub-fase se centra en **alinear con la política de anuncios** y cerrar huecos de datos/accesibilidad.

- [x] Crear `data/anuncios.json` con anuncios de ejemplo
- [x] Crear `js/ads.js` con lógica de selección ponderada + vigencia
- [x] Integrar anuncios en `index.html` (slots `data-ad-slot`)
- [ ] Revisar y aplicar `docs/politica_anuncios.md`
- [ ] Ampliar el esquema JSON con campos opcionales recomendados (`imagen_alt`, `tipo`, `paginas`)
- [ ] Actualizar `<ad-card>` para preferir `imagen_alt` cuando exista
- [ ] Decidir y documentar número de slots y páginas permitidas (ver política §4)
- [ ] Añadir 1–2 anuncios de ejemplo que cumplan la política de contenido

### Fase 1.5: Testing y documentación

- [ ] Verificar que JSON se carga correctamente
- [ ] Verificar responsividad en mobile, tablet, desktop
- [ ] Verificar contraste WCAG AA (incluyendo cards de anuncio en ambos temas)
- [ ] Verificar navegación por teclado y `aria-label` de anuncios con enlace
- [ ] Crear `GUIA_CONTENIDO.md` con instrucciones para agregar artículos/catálogos **y anuncios**
- [ ] Enlazar `politica_anuncios.md` desde la documentación principal

---

## 7. Escalabilidad: Cómo agregar contenido

### Agregar un artículo nuevo

1. Crear archivo `data/articulos/articulo-NNN.json` siguiendo el esquema
2. Hacer push a GitHub
3. ✅ El artículo aparecerá automáticamente en `articulos.html`

### Agregar una pieza al catálogo

1. Subir imagen a `assets/images/catalogos/`
2. Agregar objeto a `data/catalogos/piezas-arqueologicas.json` en el array `elementos`
3. Hacer push a GitHub
4. ✅ La pieza aparecerá automáticamente en `catalogos.html`

### Agregar una referencia bibliográfica

1. Crear archivo `data/bibliografia/biblio-NNN.json` siguiendo el esquema
2. Si pertenece a un artículo, agregar su ID en `articulos_relacionados`
3. Hacer push a GitHub
4. ✅ La referencia aparecerá automáticamente en `bibliografia.html`

### Agregar un anuncio

Consultar primero `docs/politica_anuncios.md` (requisitos de contenido, campos y reglas de colocación).

1. Subir imagen a `assets/images/anuncios/` (preferible proporción 4:5)
2. Agregar objeto a `data/anuncios.json` siguiendo el esquema (campos obligatorios + opcionales recomendados)
3. Establecer `vigencia_inicio`, `vigencia_fin`, `activo` y `peso`
4. (Opcional) Completar `imagen_alt`, `tipo` y `paginas`
5. Hacer push a GitHub
6. ✅ El anuncio será seleccionado automáticamente si está activo y dentro del rango de vigencia

---

## 8. Notas de implementación

- **Sin backend requerido**: Todo funciona con archivos estáticos
- **i18n desde el inicio**: Estructura lista para traducción sin cambiar componentes
- **Shadow DOM**: Los Web Components encapsulan sus estilos pero respetan variables globales
- **Accesibilidad**: Alt descriptivo, navegación por teclado, contraste WCAG AA
- **Rendimiento**: `loading="lazy"` para imágenes no visibles, minimizar bundle JS
- **Versionado**: Todos los datos en Git, historial completo de cambios

---

## 9. Siguiente fase (Fase 2)

Una vez completada la Fase 1:
- Integración con API Go para anuncios dinámicos (sin tocar frontend)
- Panel administrativo (futura)
- Estadísticas de lectura (futura)
- Sistema de comentarios (futura)

