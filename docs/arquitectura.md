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
JavaScript moderno (ES Modules).
Web Components nativos.
Archivos JSON para datos.
SVG para iconos y elementos gráficos vectoriales.

No se utilizará un framework frontend en esta etapa.

No se utilizará npm ni un proceso de build salvo que posteriormente aparezca una necesidad concreta que lo justifique.

Estructura general

La estructura debe separar contenido, componentes, estilos y datos:

/
├── index.html
├── articulos/
|── docs/
├── catalogos/
├── recursos/
├── components/
├── data/
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
│   └── ...
└── js/
    ├── main.js
    ├── ads.js
    └── ...

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
  "imagen": "/assets/images/anuncios/ejemplo.jpg",
  "contacto": "Información de contacto",
  "slogan": "Frase principal",
  "descripcion": "Información adicional",
  "vigencia_inicio": "2026-01-01",
  "vigencia_fin": "2026-12-31",
  "activo": true,
  "peso": 1
}

Los campos podrán ampliarse cuando exista una necesidad concreta.

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
    data-source="/data/catalogos/piezas.json"
    categories="periodo,cultura">
</catalog-grid>

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
  "imagen": "/assets/images/catalogos/pieza-001.jpg",
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

7. Sistema de componentes

Los componentes reutilizables se limitarán inicialmente a los elementos que realmente aparezcan en varias partes del sitio.

Componentes iniciales:

navegación;
anuncio;
catálogo;
card de catálogo;
badge;
elementos interactivos de recursos.

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

La arquitectura debe permitir crecer, pero no debe cargar desde el inicio con infraestructura para problemas que todavía no existen.