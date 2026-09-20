Arquitectura Técnica — Sitio del Juego de Pelota Mesoamericano
1. Principios

La arquitectura prioriza, en este orden:

Simplicidad técnica.
Mantenibilidad.
Rendimiento.
Accesibilidad.
Escalabilidad sin introducir complejidad prematura.

El sitio debe funcionar inicialmente sin backend ni base de datos. Las decisiones de arquitectura deben permitir incorporar servicios dinámicos posteriormente sin obligar a rehacer el frontend.

Se evitarán frameworks y dependencias innecesarias. El sitio utilizará HTML, CSS y JavaScript nativos, incluyendo Web Components para los componentes reutilizables.

2. Fase inicial: sitio estático

El sitio será completamente estático y vivirá en un repositorio de GitHub.

Hosting

Se utilizará GitHub Pages como hosting inicial.

No se incorporará un servidor, CDN externo ni backend mientras las necesidades del sitio puedan resolverse mediante archivos estáticos.

**Excepción vigente y decisión pendiente:** las páginas cargan la tipografía Ubuntu desde Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`), un recurso externo. Es la única dependencia externa del sitio público. La alternativa coherente con este principio (y mejor para la privacidad de quien visita) es autoalojar los archivos `woff2` en `assets/fonts/` con `@font-face`; queda como tarea de cierre de Fase 1.

El despliegue consistirá simplemente en publicar la rama principal del repositorio mediante GitHub Pages.

Tecnologías

La implementación inicial utilizará:

HTML5.
CSS3.
JavaScript moderno.
Web Components nativos.
Archivos JSON para datos.
SVG para iconos y elementos gráficos vectoriales.

No se utilizará un framework frontend en esta etapa.

No se utilizará npm ni un proceso de build salvo que posteriormente aparezca una necesidad concreta que lo justifique.

**Corrección respecto al plan original:** se descartaron los ES Modules
(`import`/`export`). En su lugar, cada archivo de `js/` es un script plano
que se carga con `<script src="...">` (sin `type="module"`) y expone su
API pública bajo un único namespace global compartido, `window.ULE`
(`ULE.theme`, `ULE.nav`, `ULE.loader`, `ULE.ads`). Motivo: los ES Modules
imponen CORS al abrir archivos con `file://` (sin servidor local) y exigen
cuidar el orden de carga con más ceremonia de la que este sitio necesita.
El orden de `<script>` en cada página sigue siendo el contrato: `main.js` →
`loader.js` → `components.js` → (`ads.js` si la página tiene anuncios) →
script propio de la página.

Estructura general

La estructura debe separar contenido, componentes, estilos y datos:

/
├── index.html
├── articulos.html
├── articulo.html                 (detalle de un artículo, vía ?id=)
├── bibliografia.html
├── catalogos.html
├── herramientas/                 (interna, transitoria — ver §14.8)
│   └── generador-json.html        genera JSON descargable; no es un CMS
├── scripts/                      validación (no forma parte del despliegue)
│   ├── validar_datos.py           JSON, IDs, manifiestos, relaciones, rutas
│   └── pruebas_navegador.py       comportamiento y modo API (Playwright)
├── docs/
├── data/
│   ├── articulos/
│   ├── bibliografia/
│   ├── catalogos/
│   └── anuncios.json
├── assets/
│   ├── img/                      recursos de identidad (greca)
│   ├── logo/
│   └── images/                   imágenes de contenido: articulos/, catalogos/, anuncios/
│                                 (aún sin crear: hoy las imágenes de ejemplo son remotas)
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── components.css
│   ├── theme.css
│   ├── ads.css
│   └── ...
└── js/
    ├── main.js
    ├── loader.js
    ├── components.js
    ├── ads.js
    └── ...

**Nota (corrección respecto al boceto original):** las páginas de contenido
(`articulos.html`, `catalogos.html`, etc.) son archivos HTML sueltos en la
raíz, no carpetas (`articulos/`, `catalogos/`) como se esbozó al inicio. No
existe una carpeta `components/` con HTML de navbar/footer: el **marcado** de la
navegación y del pie está repetido en cada página, y `js/main.js` sólo lo activa
(`aria-current`, tema, menú móvil). Al añadir una sección hay que actualizar la nav en
todas las páginas. Los componentes reutilizables son los Web Components de
`js/components.js`. `recursos/` sigue sin implementarse (era un boceto
para un simulador futuro, no confundir con `herramientas/`, que es interno).

La estructura podrá crecer, pero se evitará crear abstracciones o directorios que no correspondan a una necesidad real.

3. Contenido

El contenido editorial será estático.

Los artículos, páginas informativas y datos de los catálogos se almacenarán dentro del repositorio y serán versionados mediante Git.

Los artículos utilizarán HTML semántico para priorizar:

lectura;
accesibilidad;
indexación;
facilidad de edición.

No se incorporará inicialmente un CMS.

Si posteriormente la cantidad de contenido hace inconveniente mantener HTML manualmente, podrá incorporarse un generador de sitios estáticos, pero no se utilizará mientras no exista esa necesidad.

Internacionalización

La estructura deberá permitir versiones futuras en español, inglés y francés.

Los textos propios de la interfaz no deben estar escritos directamente dentro de la lógica de los componentes.

> **Estado:** todavía **no implementado**. Los textos de interfaz ("Limpiar filtros", "Cerrar", mensajes de error…) están en español dentro de `js/components.js` y de las páginas. Sólo `ULE.labels` (etiquetas de tipos) está centralizado. Se difiere a la fase en que se decida agregar un segundo idioma.

La estrategia inicial será mantener los textos de interfaz en archivos de traducción simples, por ejemplo:

data/i18n/
├── es.json
├── en.json
└── fr.json

El español será el idioma predeterminado.

El contenido editorial podrá organizarse posteriormente por idioma sin modificar la arquitectura de los componentes.

4. Anuncios

Los anuncios serán inicialmente datos estáticos almacenados en:

data/anuncios.json

El frontend no accede directamente a los archivos de anuncios. Los consume mediante `ULE.loader`, que encapsula la fuente local y queda preparado para sustituirla por la API Go. Hoy `ULE.loader.loadAds()` lee `data/anuncios.json`; `js/ads.js` no accede a `data/` directamente.

El contrato de datos será el mismo que utilizará posteriormente la API remota. Esto permitirá cambiar la fuente de datos sin modificar los componentes visuales ni la lógica de presentación.

Esquema inicial

Cada anuncio tendrá como mínimo:

{
  "id": "ejemplo-01",
  "imagen": "assets/images/anuncios/ejemplo.jpg",
  "contacto": "Información de contacto",
  "slogan": "Frase principal",
  "descripcion": "Información adicional",
  "vigencia_inicio": "2026-01-01",
  "vigencia_fin": "2026-12-31",
  "activo": true,
  "peso": 1
}

**El esquema completo y actualizado (campos opcionales como `imagen_alt`,
`tipo`, `paginas`, reglas de contenido y de colocación por página) vive en
`docs/politica_anuncios.md`, no aquí.** Ese documento evoluciona con más
frecuencia que esta arquitectura general; mantener el esquema duplicado en
dos archivos ya causó que este quedara desactualizado una vez. `imagen` es
recomendado, no obligatorio: si falta, o si la URL falla al cargar,
`<ad-card>` muestra un fallback visual (icono + degradado) en vez de dejar
un hueco o un ícono de imagen rota — la card nunca depende de que la
imagen exista para verse bien.

Selección

La selección de anuncios utilizará inicialmente un sistema aleatorio ponderado por peso, considerando únicamente anuncios activos y dentro de su periodo de vigencia.

Esto permite dar mayor exposición a determinados anuncios sin introducir un sistema de campañas complejo.

La selección se realizará del lado del cliente.

No se almacenará inicialmente información de impresiones, clics ni historial de exposición.

Contrato estable

El componente de anuncio no debe saber si los datos provienen de:

data/anuncios.json

o de:

https://api.example.com/anuncios

Ambas fuentes deberán entregar el mismo formato lógico.

La función encargada de obtener anuncios será la única parte del frontend que deberá cambiar cuando se sustituya la fuente local por una API.

5. Fase futura: API

> **Superado en parte por §14 y por `docs/primera_fase.md`:** la API ya no se plantea sólo para anuncios; en Fase 2 cubrirá artículos, bibliografía, catálogos y anuncios. Lo que sigue se conserva como contexto histórico.

Cuando el sitio necesite datos dinámicos, se incorporará un servidor independiente.

La primera responsabilidad de la API será proporcionar anuncios. Podrá ampliarse posteriormente para otros datos dinámicos únicamente si existe una necesidad real.

Stack

La API utilizará:

Go.
Docker.
HTTP/JSON.

La API será independiente del repositorio y del hosting del sitio estático.

El frontend continuará siendo un sitio estático.

Alcance inicial

La API comenzará únicamente con endpoints relacionados con anuncios.

Por ejemplo:

GET /api/anuncios

No se construirá desde el inicio una API genérica para artículos, catálogos, usuarios, autenticación u otros recursos que todavía no requieran comportamiento dinámico.

Migración

La migración desde los datos locales hacia la API debe ser transparente para los componentes.

La arquitectura será:

Componente
    ↓
servicio de datos
    ↓
fuente de datos
    ├── JSON local
    └── API remota

El componente solo recibe datos y los presenta.

Esto permitirá cambiar la fuente sin duplicar componentes ni modificar su presentación.

6. Catálogos y Web Components

Los catálogos utilizarán Web Components nativos.

El objetivo es implementar una sola vez la mecánica común de:

grid;
cards;
imágenes;
títulos;
badges;
filtrado;
ordenamiento básico.

Cada catálogo podrá proporcionar sus propios datos y categorías.

Componente principal

Se utilizará un componente reutilizable equivalente a:

<catalog-grid
    data-catalog="piezas-arqueologicas"
    categories="periodo,cultura">
</catalog-grid>

`data-catalog` es el id lógico y es lo que usan las páginas (el componente lo resuelve con
`ULE.loader.loadCatalog`, así que no sabe si viene de JSON o de API). `data-source` (URL de un
JSON) sigue aceptándose sólo por compatibilidad y **no** debe usarse en páginas nuevas.

**Convención de rutas (importante):** todas las rutas internas (`data/...`,
`assets/...`) son **relativas, sin `/` inicial**. El sitio se publica como
proyecto de GitHub Pages bajo un subpath
(`usuario.github.io/ule_educativo/`), no en la raíz del dominio; una ruta
absoluta como `/data/catalogos/piezas.json` resolvería contra la raíz del
dominio y rompería. Esta convención aplica a todo el sitio, no solo a
`catalog-grid`.

La API concreta del componente podrá modificarse durante la implementación, pero deberá mantenerse pequeña y predecible.

Datos

Los datos específicos de cada catálogo permanecerán separados de la implementación del componente.

Por ejemplo:

data/
└── catalogos/
    ├── piezas-arqueologicas.json
    ├── canchas.json
    └── ...

Cada elemento podrá definir sus propias categorías:

{
  "id": "pieza-001",
  "titulo": "Nombre de la pieza",
  "imagen": "assets/images/catalogos/pieza-001.jpg",
  "categorias": {
    "periodo": "preclasico",
    "cultura": "olmeca"
  }
}

El componente no asumirá que todos los catálogos utilizan las mismas categorías.

Configuración de categorías

Las categorías se definirán en los datos del catálogo y, cuando sea necesario, mediante una configuración sencilla del componente.

No se crearán componentes diferentes para cada catálogo.

La lógica común permanecerá en el Web Component y las diferencias entre catálogos estarán determinadas por sus datos.

Shadow DOM

Los componentes utilizarán Shadow DOM para encapsular su estructura y estilos internos.

Las variables globales de identidad definidas en :root se expondrán mediante custom properties y serán consumidas por los componentes.

Por ejemplo:

:root {
    --color-principal: #058A41;
}

El componente podrá utilizar:

color: var(--color-principal);

De esta manera se conserva el aislamiento de los componentes sin perder la capacidad de modificar globalmente la identidad visual.

Los estilos internos del componente se limitarán a la presentación que realmente le corresponde. Los estilos generales del documento permanecerán fuera del Shadow DOM.

**Excepción documentada — `<catalog-grid>`:** a diferencia del resto (`article-card`, `biblio-card`, `ad-card`, `ule-badge`), `<catalog-grid>` se implementó en **Light DOM** (sin Shadow Root). Es un componente grande, con su propia grilla responsive, filtros y estados de carga/vacío; encapsularlo hubiera significado duplicar buena parte de `components.css` dentro de un shadow root. Al quedar en Light DOM reutiliza directamente esas clases y se beneficia de cualquier ajuste futuro a esas reglas sin tocar el componente. Es una decisión aprobada, no una inconsistencia por corregir.

### Localización de archivos en un sitio 100% estático

Un detalle no cubierto en el plan original pero que ya es parte real de la arquitectura: un sitio estático **no puede listar el contenido de una carpeta** (no hay `ls` disponible para el navegador). Por eso cada carpeta de datos que crece con el tiempo (`data/articulos/`, `data/bibliografia/`, `data/catalogos/`) incluye un archivo `index.json` con la lista de nombres de archivo que contiene:

```
data/articulos/index.json → ["articulo-001.json", "articulo-002.json", ...]
```

`js/loader.js` lee ese manifiesto antes de pedir cada archivo individual. Si el manifiesto falta, cae a un sondeo secuencial (`prefijo-001.json`, `002`, …) como respaldo, pero el manifiesto es siempre el método soportado. **Agregar contenido nuevo implica dos pasos, no uno:** crear el `.json` del contenido y añadir su nombre a `index.json` de esa carpeta. Esto es relevante para el punto 13 (herramienta de generación de JSON): el formulario deberá recordarle a quien lo usa que el manifiesto también se actualiza.

7. Sistema de componentes

Los componentes reutilizables se limitarán inicialmente a los elementos que realmente aparezcan en varias partes del sitio.

Componentes iniciales (nombres reales — ver `js/components.js`):

navegación (`js/main.js`, no es un Web Component);
`<ad-card>` (anuncio);
`<catalog-grid>` (catálogo, Light DOM — ver excepción documentada arriba);
`<article-card>`, `<biblio-card>` (cards de contenido);
`<ule-badge>` (badge; se llama `ule-badge` y no `badge` porque el estándar de Custom Elements exige un guion en el nombre de la etiqueta).

No se creará una biblioteca de componentes propia ni un sistema de diseño JavaScript.

La identidad visual permanecerá principalmente en CSS mediante variables.

8. Modo claro y oscuro

El sitio tendrá únicamente dos modos:

claro;
oscuro.

Se utilizará un toggle manual visible en la interfaz.

No habrá un tercer estado denominado "automático".

Preferencia inicial

La primera visita utilizará prefers-color-scheme del sistema operativo para determinar el modo inicial.

Después de que el usuario cambie manualmente el modo, su elección tendrá prioridad.

Esto permite una experiencia adecuada sin añadir configuración adicional.

Persistencia

La elección manual se almacenará en:

localStorage

con una única clave para el tema.

No se utilizarán cookies porque el tema no requiere comunicación con el servidor.

Implementación

El estado se aplicará mediante un atributo en html:

<html data-theme="dark">

y CSS:

:root {
    /* variables modo claro */
}

:root[data-theme="dark"] {
    /* variables modo oscuro */
}

La lógica de cambio de tema estará aislada en un pequeño módulo JavaScript.

9. Accesibilidad

La accesibilidad será una consideración estructural desde el inicio, no una característica posterior.

Se utilizarán:

HTML semántico.
navegación mediante teclado;
estados :focus visibles;
alt descriptivo para imágenes relevantes;
alt="" para imágenes puramente decorativas;
botones reales para acciones;
etiquetas accesibles en controles;
contraste mínimo WCAG AA para texto de cuerpo;
respeto a prefers-reduced-motion cuando existan animaciones.

Las animaciones serán decorativas y nunca necesarias para comprender o utilizar el contenido.

10. Rendimiento

Al ser un sitio estático, se priorizará mantener una carga pequeña.

Se evitarán:

frameworks pesados;
librerías JavaScript innecesarias;
imágenes sin optimizar;
fuentes adicionales sin justificación;
dependencias que resuelvan problemas que puedan resolverse con HTML, CSS o JavaScript nativo.

Las imágenes de catálogos deberán utilizar formatos modernos cuando sea posible y dimensiones adecuadas al tamaño en que serán mostradas.

Se utilizará loading="lazy" para imágenes que no sean necesarias durante el primer renderizado.

11. Seguridad

Al no existir backend en la primera fase, la superficie de ataque será mínima.

El repositorio no contendrá:

contraseñas;
API keys privadas;
credenciales;
tokens;
información personal que no deba ser pública.

Todo lo que forme parte del sitio estático debe considerarse información pública.

Cuando exista una API, las credenciales y secretos permanecerán exclusivamente en el servidor.

12. Evolución de la arquitectura

La arquitectura evolucionará únicamente cuando aparezca una necesidad concreta.

Fase 1
GitHub
   ↓
GitHub Pages
   ↓
HTML + CSS + JS
   ↓
JSON local
Fase 2
GitHub
   ↓
GitHub Pages
   ↓
HTML + CSS + JS
   ↓
Servicio de datos
   ↓
API Go / Docker

La incorporación de la API no deberá obligar a migrar el sitio a un framework frontend.

Regla general

> Con la decisión de §14 y de `docs/primera_fase.md`, la API, la base de datos, la autenticación y el panel administrativo pasan a ser el objetivo explícito de la **Fase 2**. La lista siguiente sigue vigente para todo lo demás y para la Fase 1.

No se implementará anticipadamente:

base de datos;
autenticación;
CMS;
panel administrativo;
framework frontend;
backend;
sistema de usuarios;
analítica propia;
API genérica.

Cada uno podrá incorporarse posteriormente si una necesidad real lo justifica.


---

## 14. Modelo de transición de contenido: JSON → API Go + DB

La primera fase utiliza JSON porque GitHub Pages no dispone de backend. Sin embargo, el almacenamiento en archivos no debe convertirse en una dependencia del frontend.

### 14.1 Fuente de datos intercambiable

La frontera correcta es:

```text
Página / Web Component
        ↓
      ULE.loader
        ↓
   adaptador de datos
      ↙       ↘
 JSON local   API HTTP
                ↓
              Go
                ↓
               DB
```

`ULE.loader` conserva su API pública:

- `loadArticles()`
- `loadArticleById(id)`
- `loadBibliografia()`
- `loadBiblioById(id)`
- `loadBiblioForArticle(article)`
- `loadCatalog(id)`
- `listCatalogIds()`
- `loadAds()`
- `loadRelatedArticlesMap()` (artículos que citan cada referencia; relación derivada)

Contrato de errores (igual en ambas fuentes): recurso inexistente → `null`/`[]`; fallo de red o 5xx → lanza `Error`; `visible:false` → se descarta. Detalle y forma de las respuestas en `docs/contrato_datos.md`. `loadJSON`, `loadCollection` y `apiJSON` se exponen sólo por compatibilidad interna: las páginas y componentes deben usar las funciones de arriba.
La implementación interna podrá seleccionar la fuente.

Ejemplo conceptual:

```javascript
ULE.config.dataSource = 'local';
// posteriormente:
ULE.config.dataSource = 'api';
```

Las páginas no deben preguntar si la fuente es JSON o API.

### 14.2 JSON como adaptador temporal

Mientras el sitio siga en GitHub Pages:

```text
data/articulos/*.json
data/bibliografia/*.json
data/catalogos/*.json
data/anuncios.json
```

siguen siendo válidos.

Los `index.json` son una limitación del almacenamiento estático, no una parte del contrato futuro de la aplicación.

Cuando exista API, el frontend dejará de necesitar manifiestos para descubrir contenido.

### 14.3 Contrato de API

La API Go deberá devolver objetos de contenido equivalentes al modelo que actualmente consume el frontend.

Ejemplo:

```text
GET /api/articulos
GET /api/articulos/{id}
GET /api/bibliografia
GET /api/bibliografia/{id}
GET /api/catalogos
GET /api/catalogos/{id}
GET /api/anuncios
```

Los nombres definitivos de endpoints pueden cambiar durante Fase 2, pero el principio no:

> La API adapta la base de datos al contrato que necesita la interfaz.

No se debe exponer el esquema interno de la DB como si fuera automáticamente el contrato público.

### 14.4 Modelo inicial de persistencia

La DB deberá modelar relaciones, no archivos JSON completos.

Modelo conceptual mínimo:

```text
articles
    │
    ├──< article_bibliography >── bibliography
    │
    └──< article_tags >── tags

catalogs
    │
    └──< catalog_items
              │
              └──< catalog_item_categories

ads
```

La estructura exacta de tablas, claves, índices y motor se decidirá al comenzar Fase 2, después de revisar consultas reales y necesidades editoriales.

### 14.5 Alta de contenido

El flujo objetivo será:

```text
Panel editorial
      ↓
   API Go
      ↓
 validación
      ↓
      DB
```

Nunca:

```text
Panel → DB
```

Esto permitirá que las reglas de publicación, relaciones, validación y permisos estén centralizadas.

### 14.6 Imágenes

Las imágenes no deben almacenarse como blobs dentro de las tablas salvo que exista una razón concreta.

La Fase 2 deberá decidir entre:

- almacenamiento en el servidor/API;
- almacenamiento de objetos;
- repositorio para assets públicos.

La DB conservará normalmente la referencia necesaria para que la API construya la URL pública.

La decisión se tomará cuando exista el panel editorial; no se introduce ahora.

### 14.7 Compatibilidad durante la migración

La migración ideal es:

```text
Fase 1:
Frontend → ULE.loader → JSON

Fase 2:
Frontend → ULE.loader → API → DB
```

No debe ser:

```text
Fase 2:
Frontend → API
Frontend → nuevos componentes
Frontend → nuevas páginas
```

Si la migración obliga a modificar componentes visuales, se considerará una señal de que el contrato de datos o el adaptador están mal definidos.

### 14.8 Generador JSON

`herramientas/generador-json.html` es una herramienta transitoria.

Puede conservarse mientras los datos locales sean necesarios, pero no debe convertirse en un CMS.

Una vez que el panel editorial de Fase 2 permita alta de contenido mediante API, el generador podrá quedar obsoleto.

### 14.9 Primera responsabilidad de la API

La API no debe comenzar como una plataforma genérica.

El primer objetivo será resolver el contenido que necesita administración:

1. artículos;
2. bibliografía;
3. relaciones entre ambos;
4. catálogos y elementos;
5. anuncios.

Autenticación y panel administrativo serán parte de la misma evolución, pero los endpoints deberán mantenerse pequeños y explícitos.

