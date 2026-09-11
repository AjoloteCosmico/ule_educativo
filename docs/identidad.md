# Identidad Gráfica — Sitio del Juego de Pelota Mesoamericano

## 1. Brief de marca

Sitio educativo dedicado a difundir la práctica y el conocimiento del juego de pelota mesoamericano en todas sus variantes (cadera, mazo, antebrazo), cubriendo dos vertientes:

- **Histórica**: desde los olmecas hasta el periodo posclásico.
- **Contemporánea**: asociaciones, reglamentos y práctica actual del deporte.

El diseño debe verse amigable, agradable a la vista y llamativo, pero siempre priorizando la lectura del texto. Debe conservar cierta seriedad: un sitio educativo agradable, **no** una red social. La estética debe invitar a explorar el contenido.

**Referencia visual/textural**: evocar textura de piedra (superficies, fondos o detalles decorativos con esa sensación material, sin perder legibilidad).

## 2. Voz y tono

- Educativo ligero: no somos "la academia" (no acartonado, no jerga excesiva), pero tampoco una red social (no informal en exceso, no clickbait).
- Nos dirigimos siempre en segunda persona ("tú").
- No afirmamos verdades absolutas ni tomamos postura fija en debates o temas políticos/controvertidos: documentamos y estamos abiertos a observaciones para mejorar la información.

- Idioma principal: español.
- Versiones futuras: inglés y francés (estructura y componentes deben contemplar i18n desde el inicio, sin hardcodear textos en CSS o componentes).

## 3. Estructura del sitio

**Home / `index.html`**: hasta arriba, el icono principal (que funciona como logo) y debajo el nombre del sitio. Es el primer punto de contacto con la identidad.

Secciones principales:

1. **Índice**: listado de todo el contenido. Debe incluir elementos destacados/llamativos que puedan actualizarse con el tiempo (ej. contenido reciente o curado).
2. **Artículo / Blog**: texto plano, formato de lectura larga.
3. **Catálogos**: pensados sobre todo para colecciones de imágenes (ej. piezas arqueológicas). Estructura:
   - Encabezado de colección: descripción general.
   - Grid dinámico (cuadrícula tipo flex/grid) de elementos, cuadrados medianos.
   - Cada card: imagen + título + badges de categoría (ej. periodo: preclásico/clásico/posclásico; cultura: golfo, olmeca, cacaxtla, etc.).
   - El mismo mecanismo de catálogo debe poder reutilizarse para distintos catálogos, cada uno con su propio lote de categorías (ver sección 6, componentes nativos).
4. **Recursos dinámicos**: contenido interactivo (simulador de tiro parabólico actualmente; a futuro, minijuegos y otras herramientas interactivas).

## 4. Sistema de diseño (CSS)

Modos: **claro** y **oscuro** únicamente. Todo declarado como variables CSS en `:root` para poder modificarse o experimentar sin tocar el resto del código.

### 4.1 Color

```css
:root {
  /* Base ya definida */
  --color-principal: #058A41;
  --color-secundario: #63372C;
  --color-fondo-claro: #fdfdff;
  --color-fondo-oscuro: #1E352F;
  --color-texto-claro: #282828;
  --color-texto-oscuro: #c3d4d0;

  /* Fondos de card */
  --color-card-claro: #F7F3EB;          /* tono hueso / piedra clara */
  --color-card-oscuro: #162A25;         /* gris muy oscuro, ligeramente más profundo que el fondo */

  /* Texto sobre cards */
  --color-titulo-card: var(--color-principal);   /* títulos y resaltados usan el verde principal */
  --color-cuerpo-card-claro: #2C2C2C;            /* contraste AA garantizado sobre #F7F3EB */
  --color-cuerpo-card-oscuro: #D0DDD9;           /* contraste AA garantizado sobre #162A25 */

  /* Estados de link */
  --color-link: var(--color-principal);
  --color-link-hover: #046B32;                   /* verde un poco más oscuro */
  --color-link-visitado: #4A6B5A;                /* verde apagado */
  --color-link-focus: #058A41;                   /* mismo principal + outline visible */

  /* Paleta fija de badges por tipo de categoría */
  /* Periodo */
  --badge-periodo-preclasico: #8B5E3C;
  --badge-periodo-clasico: #C17A3A;
  --badge-periodo-posclasico: #5C3A21;

  /* Cultura (ejemplos base; se pueden ampliar manteniendo la misma lógica) */
  --badge-cultura-olmeca: #3A5F4A;
  --badge-cultura-golfo: #4A7A6A;
  --badge-cultura-cacaxtla: #6B4A3A;
  --badge-cultura-maya: #2E5A4A;
  --badge-cultura-azteca: #5A3A2A;
}

Regla de contraste: todo texto de cuerpo sobre cards debe cumplir mínimo WCAG AA (4.5:1). Los títulos pueden usar el color principal porque su tamaño y peso lo permiten.
4.2 Tipografía
Familia principal (títulos y cuerpo): Ubuntu.
Familia para anotaciones: Helvetica, siempre en cursiva.
CSS:root {
  --font-principal: "Ubuntu", system-ui, sans-serif;
  --font-anotaciones: "Helvetica", Arial, sans-serif;
}
Pesos tipográficos

Título de sección (h1/h2): Ubuntu Bold (700)
Título de card / subtítulo (h3): Ubuntu Medium (500)
Cuerpo de texto: Ubuntu Regular (400)
Anotaciones / pie de foto / notas: Helvetica Italic (400 italic)

Escala tipográfica (mobile-first)
CSS:root {
  /* Mobile */
  --fs-h1: 1.75rem;      /* 28px */
  --fs-h2: 1.375rem;     /* 22px */
  --fs-h3: 1.125rem;     /* 18px */
  --fs-cuerpo: 1rem;     /* 16px */
  --fs-anotacion: 0.875rem; /* 14px */
  --lh-cuerpo: 1.6;
  --lh-titulo: 1.25;

  /* Desktop (≥ 768px) */
  --fs-h1-desktop: 2.25rem;   /* 36px */
  --fs-h2-desktop: 1.75rem;   /* 28px */
  --fs-h3-desktop: 1.25rem;   /* 20px */
  --fs-cuerpo-desktop: 1.0625rem; /* 17px */
}
4.3 Bordes, espaciado y sombras

Bordes: redondeados.
Márgenes: suficientemente espaciados, que las cosas "respiren".
Sombras: ligeras.

CSS:root {
  /* Radios */
  --radius-sm: 0.375rem;   /* 6px — badges, botones pequeños */
  --radius-md: 0.75rem;    /* 12px — cards */
  --radius-lg: 1rem;       /* 16px — contenedores grandes */

  /* Escala de espaciado */
  --space-xs: 0.25rem;     /* 4px */
  --space-sm: 0.5rem;      /* 8px */
  --space-md: 1rem;        /* 16px */
  --space-lg: 1.5rem;      /* 24px */
  --space-xl: 2.5rem;      /* 40px */
  --space-2xl: 4rem;       /* 64px */

  /* Sombras ligeras */
  --shadow-card-claro: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-card-oscuro: 0 2px 10px rgba(0, 0, 0, 0.35);
}

### 4.4 Responsive
Mobile first, obligatorio.
Breakpoints
CSS:root {
  --bp-sm: 480px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
}
Comportamiento del grid de catálogo

< 480px (default): 1 columna
≥ 480px (sm): 2 columnas
≥ 768px (md): 3 columnas
≥ 1024px (lg): 4 columnas
≥ 1280px (xl): 4 columnas (máximo; no se fuerza más para mantener tamaño de card legible)

Gap del grid: siempre var(--space-md) o var(--space-lg) según el tamaño de pantalla.
4.5 Componentes
Cards de texto (artículo/blog)

Fondo: var(--color-card-claro) / var(--color-card-oscuro)
Título: var(--color-titulo-card) + peso 500 o 700
Cuerpo: var(--color-cuerpo-card-claro) / var(--color-cuerpo-card-oscuro)

Catálogos
Contenedor flex/grid con cards que contienen:

imagen
título
badges de categoría

Badges de categoría

Forma: píldora (border-radius: 999px) o ligeramente redondeada (var(--radius-sm))
Tamaño: altura ≈ 1.5–1.75rem, padding horizontal var(--space-sm) + var(--space-xs)
Texto: mayúsculas, letter-spacing ligero (0.03em), peso 500, tamaño var(--fs-anotacion)
Sin iconos internos por ahora (mantener minimalista)
Color de fondo según la paleta de la sección 4.1; texto blanco o muy claro para contraste

Cards de anuncio

Imagen/banner con proporción 4:5 vertical (definitivo).
Elementos: dato de contacto, frase/slogan, texto pequeño adicional (condiciones, vigencia, etc.).
Layout flexible según el contenedor (columna o fila).
Prioridad visual fija:
Imagen (mayor peso visual)
Contacto + slogan
Texto legal / condiciones (siempre el más discreto)


Iconos

Minimalistas, en PNG o vector (preferible SVG).
Color base: blanco cuando se colocan sobre el color principal.
Set inicial (solo estos dos por ahora):
Icono principal: cancha de pelota (símbolo del sitio / logo)
Unidad de greca: módulo horizontal que se puede repetir para formar líneas divisorias

Más iconos se agregarán más adelante.

Color de iconos cuando NO están sobre el color principal

Usar var(--color-principal) en modo claro
Usar var(--color-texto-oscuro) o un verde claro derivado del principal en modo oscuro
Nunca usar negro puro ni blanco puro fuera del contexto del color principal

Tratamiento visual de fotografías (piezas arqueológicas y juego actual)

Color natural (sin duotono ni blanco y negro forzados)
Ligera desaturación opcional (máximo 10–15 %) para evocar piedra sin perder realismo
Bordes redondeados con var(--radius-md)
Sin filtros pesados ni overlays que dificulten la lectura de detalles

## 5. Logo / Icono principal

No existe un wordmark independiente: el icono de la cancha de pelota es el logo.
Nombre definitivo del sitio: ule educativo
Uso en Home: icono principal centrado arriba + nombre del sitio debajo (lockup vertical).
El mismo icono se usa como favicon.

Versiones del logo (máximo 3, mantener minimalista)

Icono solo (cancha de pelota) — uso general y favicon
Icono + nombre “ule educativo” (lockup vertical para home)
Icono + nombre en formato horizontal compacto (opcional, solo si se necesita en header estrecho)

Favicon — variantes requeridas

16×16 px (favicon.ico / png)
32×32 px
180×180 px (apple-touch-icon)
Formato de exportación: PNG con transparencia + un .ico que contenga 16 y 32

Espacio de protección

Mínimo de 0.25× el ancho del icono alrededor de todos los lados cuando se usa como logo.
Nunca colocar texto ni otros elementos dentro de esa zona de respiro.