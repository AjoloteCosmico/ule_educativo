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
├── herramientas/                 (planeado — ver §13; formularios internos
│   └── generador-json.html        que generan JSON descargable, no público)
├── docs/
├── data/
│   ├── articulos/
│   ├── bibliografia/
│   ├── catalogos/
│   ├── anuncios.json
│   └── ...
├── assets/
│   ├── images/
│   ├── icons/
│   └── logo/
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
existe una carpeta `components/` con HTML de navbar/footer — la navegación
vive en `js/main.js` y los componentes reutilizables son los Web Components
de `js/components.js`. `recursos/` sigue sin implementarse (era un boceto
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

El frontend consumirá estos datos mediante fetch().

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
    data-source="data/catalogos/piezas.json"
    categories="periodo,cultura">
</catalog-grid>

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

13. Próximos ajustes de experiencia (planeación, pre-Fase 2)

Esta sección es solo planeación. El detalle operativo y el checklist de
ejecución viven en `docs/primera_fase.md` (Fase 1.6); aquí se documenta el
razonamiento arquitectónico de cada decisión para que no se pierda.

13.1 Auditoría de clics / fricción actual

Revisando el flujo real del sitio (no solo el plan) se identificaron estos
puntos de fricción, de mayor a menor impacto:

1. **Terminar un artículo es un callejón sin salida.** `articulo.html` no
   ofrece ninguna forma de continuar leyendo: hay que volver a
   `articulos.html` (1 clic) y elegir otro de la grilla (2º clic) para leer
   el siguiente. Un enlace "Artículo siguiente" lo reduce a 1 clic. Ver §13.2.
2. **La bibliografía no enlaza de vuelta a los artículos que la citan.**
   El esquema de `biblio-XXX.json` ya tiene `articulos_relacionados`, pero
   ningún componente lo consume — hoy es un campo muerto. Añadir "Aparece
   en: [artículo]" en `<biblio-card>` es una mejora de navegación barata
   (el dato ya existe, falta consumirlo) que además funciona en ambas
   direcciones junto con `bibliografía_relacionada` en el artículo.
3. **Home no expone contenido reciente.** Hoy `index.html` solo tiene 3
   accesos genéricos (Artículos / Bibliografía / Colecciones) más una
   sección "Acerca de". Alguien que solo quiere "ver lo último" tiene que
   entrar a `articulos.html` igual. Mostrar 2–3 artículos recientes
   directamente en home ahorra un clic para el caso de uso más común.
4. **Las piezas de catálogo no tienen URL propia.** El modal de
   `<catalog-grid>` es puramente de estado JS (no hay deep link); no se
   puede compartir ni recargar la página en una pieza específica. Es un
   tema de riqueza de experiencia más que de clics, pero vale resolverlo
   junto con lo anterior si se toca el componente.

Fuera de estos puntos, el resto del sitio ya cumple el principio de "todo a
un clic desde el nav": los filtros de artículos/bibliografía/catálogos son
visibles sin interacción previa (no hay que "abrir" un panel de filtros), y
el selector de catálogo ya preselecciona el primero automáticamente.

13.2 "Artículo siguiente" — especificación

- Vive en `articulo.html`, debajo del cuerpo del artículo (antes o junto a
  la sección de bibliografía relacionada).
- Criterio de "siguiente": el artículo con `fecha` inmediatamente posterior
  dentro de la lista completa cargada por `ULE.loader.loadArticles()`
  (mismo orden que usa `articulos.html` por defecto). Si el artículo actual
  es el más reciente, no mostrar "siguiente" (o hacer wrap-around al más
  antiguo — decidir en implementación, no bloqueante).
- Se aprovecha para agregar también "Artículo anterior" en el mismo bloque,
  ya que el costo de calcularlo es el mismo (misma lista ordenada).
- No requiere cambios de esquema de datos ni de `loader.js`: se resuelve
  enteramente en el script de `articulo.html` con los artículos ya
  cargados. Es la mejora de más impacto por menos esfuerzo de esta lista.

13.3 Herramienta de generación de JSON — especificación

**Problema que resuelve:** hoy, agregar un artículo/referencia/pieza de
catálogo implica escribir el JSON a mano siguiendo el esquema de memoria (o
copiando un archivo existente y editándolo), con riesgo de errores de
sintaxis o de campos faltantes/mal nombrados — exactamente el tipo de bug
que ya causó problemas en la integración de anuncios (ver
`docs/politica_anuncios.md` y el historial de correcciones de Fase 1.4).

**Qué es y qué no es:**
- Una página **interna** (no enlazada desde el nav público) con un
  formulario HTML por tipo de contenido: artículo, referencia bibliográfica,
  elemento de catálogo, anuncio.
- Al enviarlo, genera el JSON correspondiente en memoria (siguiendo
  exactamente el esquema de `docs/primera_fase.md` §2 / `politica_anuncios.md`
  §2) y dispara una descarga (`Blob` + `<a download>`), con el nombre de
  archivo sugerido según la convención (`articulo-00N.json`, etc.).
- **No escribe al repositorio ni hace commit.** Quien la usa descarga el
  archivo, lo coloca a mano en la carpeta correcta y hace push, igual que
  hoy — coherente con el principio de "sin backend" de la sección 1. No es
  un CMS ni un panel administrativo (evitar ambos está explícitamente en la
  "Regla general" de esta arquitectura); es un generador de texto con forma
  de formulario, nada más.
- Debe recordar explícitamente el paso del manifiesto (§ "Localización de
  archivos en un sitio 100% estático" arriba): junto con el JSON, mostrar
  en pantalla el nombre exacto que hay que añadir a `index.json` de esa
  carpeta, ya que ese paso es fácil de olvidar y no puede automatizarse sin
  backend.

**Ubicación propuesta:** `herramientas/generador-json.html` (ver árbol en
§2). Reutiliza todo el sistema de diseño (`variables.css`, `base.css`,
`components.css`, `theme.css`) y `js/main.js` para el toggle de tema — es
una página interna, pero no hay razón para que no sea cómoda de usar de
noche. No necesita `js/loader.js`, `js/components.js` ni `js/ads.js`: no
consume datos existentes ni Web Components de contenido, solo genera texto.

**Validación:** validación de formulario nativa de HTML (`required`,
`pattern`, `type="date"`, etc.) más una capa mínima de JS para campos
compuestos (arrays como `etiquetas` o `autores`, que se escriben como texto
separado por comas y se convierten a array antes de serializar). Sin
librerías de validación — coherente con "evitar dependencias innecesarias".

**Fuera de alcance de esta herramienta (no implementar ahora):** edición de
JSON existentes (solo creación), subida de imágenes (se sigue haciendo por
fuera, a mano, a `assets/images/...`), y cualquier automatización de
Git/GitHub — todo eso requeriría backend y no es necesario para el problema
que se está resolviendo (reducir errores al escribir el JSON a mano).

Cada uno podrá incorporarse posteriormente si una necesidad real lo justifica.

La arquitectura debe permitir crecer, pero no debe cargar desde el inicio con infraestructura para problemas que todavía no existen.