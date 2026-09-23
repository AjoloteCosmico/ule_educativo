# Integración con la API — autenticación y captura editorial

> Plan de implementación para `ule_educativo`. Complementa `docs/contrato_datos.md` (que ya
> fija el contrato de lectura, vinculante con `tonalmaster_backend`) y adopta la guía de
> integración entregada por el equipo de backend. **No se propone ningún cambio de estructura o
> comportamiento del backend**: donde el contrato o la guía dejan algo pendiente del lado
> backend, se lista como nota separada, no como bloqueante de este plan.

## 0. Punto de partida (ya resuelto, no tocar)

`js/loader.js` y `ULE.loader` **ya están completos para lectura** y ya usan exactamente las
rutas que fija la guía (`/articles`, `/bibliography`, `/catalogs`, `/ads`, en inglés; campos en
español). No hace falta escribir código nuevo para leer artículos, bibliografía, catálogos o
anuncios — solo apuntar la configuración a la API real (paso 1). Todo lo que sigue es **nuevo**:
sesión, login/registro, y que la herramienta editorial deje de generar JSON para copiar a mano y
empiece a escribir contra la API.

Alcance de este documento: **autenticación** + **captura editorial** (escritura). No repite el
contrato de lectura, que ya vive en `docs/contrato_datos.md`.

---

## Pasos

### 1. Apuntar el loader a la API (config, no código)

En cada página (o en un `js/config.js` nuevo cargado antes de `loader.js`, ya que el sitio no
tiene build step ni `import.meta.env`):

```js
ULE.config.dataSource = 'api';
ULE.config.apiBaseUrl = 'https://<host-tonalmaster>/api/v1'; // por entorno
```

- Local: `http://localhost:8080/api/v1` (backend corriendo local) mientras el frontend sigue en
  `http://localhost:8000` (`python3 -m http.server 8000`, README actual).
- Producción: el host real de `tonalmaster_backend` — falta confirmar cuál es (ver nota CORS
  abajo).

No se toca `apiJSON()` ni ninguna función de `ULE.loader`: ya arman las rutas correctas y ya
implementan el contrato de errores (404 → `null`/`[]`, 5xx/red → `Error`).

**Nota para backend (no bloqueante, ya documentada en `contrato_datos.md`):** los endpoints de
lectura deben quedar fuera de `RequireAuth` (públicos, sin cookie) y filtrar `visible=TRUE` en la
propia consulta. Si eso ya está así, este paso es puramente de configuración.

### 2. Cliente HTTP central (`js/api/client.js`)

Una sola función, siguiendo la guía del backend, análoga a `apiJSON()` pero para las llamadas
autenticadas (session-aware, sin bundler así que sin `import`/`export` de módulos ES — mismo
patrón `window.ULE` que ya usa el resto del sitio):

```js
ULE.api = ULE.api || {};

ULE.api.request = async function (path, options = {}) {
  const base = String(ULE.config.apiBaseUrl || '').replace(/\/+$/, '');
  const response = await fetch(base + path, {
    ...options,
    credentials: 'include', // cookie tonalmaster_session
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const err = new Error('[ULE.api] HTTP ' + response.status + ' en ' + path);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
};
```

Reglas tomadas directamente de la guía: `credentials: 'include'` en toda petición que dependa de
sesión; nunca `Authorization: Bearer` (la sesión es por cookie `tonalmaster_session`, `HttpOnly`
— no se lee `document.cookie`); nunca `mode: 'no-cors'`; `response.ok` siempre se revisa antes de
tratar la operación como éxito.

### 3. Módulo de autenticación (`js/api/auth.js`)

Tres funciones sobre `ULE.api.request`, tal como las define la guía (§20):

```js
ULE.auth = {
  login: (email, password) =>
    ULE.api.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (username, email, password, registrationCode) =>
    ULE.api.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, registration_code: registrationCode })
    }),

  logout: () => ULE.api.request('/auth/logout', { method: 'POST' })
};
```

Más un método para reconstruir la sesión al abrir la página (la guía §7/§22: nunca confiar en
`localStorage.getItem('loggedIn')`, la autoridad es siempre el backend):

```js
ULE.auth.me = async function () {
  try {
    return await ULE.api.request('/auth/me'); // o el endpoint que exponga el backend para esto
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
};
```

> **Nota para backend:** confirmar el endpoint exacto para "quién soy" al recargar la página
> (`GET /auth/me` o equivalente ya existente en `tonalmaster_backend` para `calendars`/`events`).
> Si ya existe uno para el resto de la plataforma, se reutiliza — no se pide uno nuevo.

El campo `registration_code` solo se muestra en la UI cuando corresponde al flujo autorizado
(guía §3): el formulario de registro no se enlaza desde la navegación pública del sitio.

### 4. Estado de sesión mínimo (sin framework)

Como el sitio es Web Components + JS plano, el "AuthProvider" de la guía se resuelve como un
objeto de estado simple en `window.ULE.auth`, con un patrón `checking → sesión válida | 401`
(guía §22), aplicado **solo** en las páginas que lo necesitan (login y panel editorial; el resto
del sitio sigue siendo de solo lectura y no llama a `/auth/*`):

```text
Panel editorial inicia
        │
        ▼
  ULE.auth.me()
        │
   ┌────┴────┐
   ▼         ▼
usuario     401
   │         │
   ▼         ▼
mostrar    redirigir
panel      a login
```

- `401` en cualquier petición editorial → limpiar estado, redirigir a login, mensaje "tu sesión
  expiró" (guía §11, §23). No hay reintento automático en loop.
- `403` en cualquier petición editorial → **no** se trata como sesión expirada; se muestra "no
  tienes permisos para esta operación" (guía §11).
- El rol (`reader`/`contributor`/`admin`) solo decide qué botones se muestran; el backend vuelve
  a validar siempre (guía §12, §24) — esto ya está alineado con `arquitectura.md` §14.5
  (`Panel editorial → API → validación → DB`, nunca `Panel → DB`).

### 5. Migrar la captura editorial: de "generar JSON" a "escribir contra la API"

`herramientas/generador-json.html` hoy termina en "descarga el JSON y haz push a mano"
(`docs/primera_fase.md` §1.5, ya marcado como limitación no resuelta). El cambio mínimo:

1. Formularios existentes (artículo, bibliografía, elemento de catálogo, anuncio) **se
   conservan tal cual** — mismos campos, misma validación básica.
2. El botón "Descargar JSON" se reemplaza (o se acompaña) por "Publicar", que arma el mismo
   objeto que ya arma hoy y lo envía con `ULE.api.request`, mapeando 1:1 a los endpoints de
   `contrato_datos.md` §5 / guía §13:

   | Acción en el formulario | Petición |
   |---|---|
   | Nuevo artículo | `POST /articles` |
   | Editar artículo | `PUT /articles/{id}` |
   | Nueva referencia | `POST /bibliography` |
   | Nuevo elemento de catálogo | `POST /catalogs/{id}/items` |
   | Nuevo anuncio | `POST /ads` |

   El `id` va dentro del JSON al crear (nunca en header, guía §14); al editar/eliminar va en la
   URL — mismo patrón que ya sigue el contrato de lectura.
3. La herramienta pasa a requerir sesión (`contributor`/`admin`): se envuelve con la misma
   comprobación del paso 4, y no se enlaza públicamente (ya es así hoy — `noindex, nofollow`).
4. Fechas siempre `AAAA-MM-DD` (ya es el formato que usa el generador actual — sin cambios).
5. Los `index.json` de manifiesto (`data/*/index.json`) **dejan de ser necesarios** para el
   contenido que ya vive en la API, tal como anticipa `contrato_datos.md` §6. No hace falta
   borrarlos de inmediato: el loader simplemente deja de leerlos en cuanto `dataSource = 'api'`.
6. Toda respuesta de error (`400/401/403/404/500`) se muestra en el mismo formato `role="alert"`
   que ya usan `articulos.html`/`catalogos.html` para errores de carga — mismo componente visual,
   nuevo caso de uso.

Esto cierra exactamente la limitación descrita en `docs/arquitectura.md` §14.8: el generador
queda obsoleto como "hay que subir el archivo a mano", sin construir un CMS nuevo desde cero.

### 6. Rutas editoriales confirmadas en backend (guía para el frontend)

La implementación actual de `tonalmaster_backend` ya registra estas rutas protegidas. Todas usan
sesión por cookie `tonalmaster_session` y requieren rol `contributor` o `admin` para escribir.

| Recurso | Crear | Leer lista | Leer detalle | Actualizar | Eliminar |
|---|---|---|---|---|---|
| Artículos | `POST /articles` | `GET /articles` | `GET /articles/{id}` | `PUT /articles/{id}` | `DELETE /articles/{id}` |
| Bibliografía | `POST /bibliography` | `GET /bibliography` | `GET /bibliography/{id}` | `PUT /bibliography/{id}` | `DELETE /bibliography/{id}` |
| Colecciones | `POST /catalogs` | `GET /catalogs` | `GET /catalogs/{id}` | `PUT /catalogs/{id}` | `DELETE /catalogs/{id}` |
| Elementos de colección | `POST /catalogs/{id}/items` | incluido en `GET /catalogs/{id}` | incluido en catálogo | `PUT /catalogs/{id}/items/{item_id}` | `DELETE /catalogs/{id}/items/{item_id}` |
| Anuncios | `POST /ads` | `GET /ads` | — | `PUT /ads/{id}` | `DELETE /ads/{id}` |

**Autenticación:**

- `POST /auth/login` → 200 + usuario + cookie.
- `POST /auth/register` → 201 + usuario + cookie.
- `GET /auth/me` → 200 + usuario; 401 sin sesión.
- `POST /auth/logout` → 204.
- El frontend debe usar `credentials: 'include'`; no necesita leer la cookie HttpOnly.

**Contrato de escritura que debe respetar el panel editorial:**

- Artículos y bibliografía reciben directamente el DTO descrito en `contrato_datos.md`.
- Los artículos aceptan `bibliografía_relacionada` como arreglo de ids; el backend lo recibe como
  `BibliographyIDs`.
- Bibliografía acepta `autores` como arreglo. Una referencia puede tener múltiples autores.
- Colecciones se almacenan internamente mediante `detalles` JSONB. El DTO público expone
  `categorias_disponibles` y `elementos`; el panel debe convertir esos campos a `detalles`
  cuando haga POST/PUT.
- Un elemento de colección usa `id`, `titulo`, `imagen` y el resto de sus propiedades dentro
  de `detalles`. Al editarlo, el frontend debe separar nuevamente esos campos antes del PUT.
- Anuncios usan `id` dentro del JSON de creación y `/ads/{id}` para PUT/DELETE.

**Rutas que todavía debe consumir/ajustar el frontend:** ninguna ruta CRUD nueva es necesaria en
este punto; el backend ya tiene el CRUD completo. Lo que queda del lado frontend es implementar
la presentación y el mapeo de DTO ↔ `detalles` para colecciones/elementos, además de las pruebas
de sesión, 401 y 403.

### 7. Checklist de salida

- [ ] `ULE.config.dataSource='api'` funciona contra el backend real para los 4 recursos de
      lectura (ya cubierto por `scripts/pruebas_navegador.py`, sin cambios).
- [ ] Login / registro (con `registration_code`) / logout funcionan con `credentials: 'include'`.
- [ ] La sesión sobrevive a un reload del panel editorial (`ULE.auth.me()` al iniciar).
- [ ] `401` limpia estado y redirige a login; `403` muestra "sin permisos" (no se confunden).
- [ ] `reader` no ve controles editoriales; `contributor`/`admin` sí — y el backend rechaza a
      `reader` aunque fuerce la petición.
- [ ] Crear/editar/eliminar desde el panel para los 4 tipos de contenido, contra la API real.
- [ ] No hay contraseñas ni sesión duplicada en `localStorage`.
- [ ] No hay `Authorization: Bearer` en las peticiones de sesión normal.

---

## Notas abiertas / últimos ajustes

> Estado revisado contra `utopia-development/tonalmaster_backend` en `main` el 23-09-2026.
> El CRUD editorial y `GET /auth/me` ya están registrados; por tanto, no se requieren nuevas
> rutas CRUD para continuar el frontend.

1. **CORS:** confirmar/fijar los orígenes reales de producción y desarrollo. El backend actualmente
   permite credenciales para los orígenes configurados; el frontend necesita el dominio de
   producción vigente y `http://localhost:8000` durante desarrollo.
2. **Colecciones:** el panel editorial debe mapear el DTO público
   `categorias_disponibles`/elementos al `detalles` JSONB que espera POST/PUT de `/catalogs`.
3. **Elementos de colección:** el CRUD del panel debe usar
   `/catalogs/{id}/items` y separar `id`, `titulo`, `imagen` de las demás propiedades del
   elemento, que van en `detalles`.
4. **Pruebas de integración:** verificar login, reload de sesión, logout, 401, 403 y las operaciones
   CRUD contra el backend real antes de entregar el contrato como cerrado.

### Estado de implementación del frontend

- [x] Cliente autenticado con `credentials: include`.
- [x] `ULE.auth`: login, register, logout y `me`.
- [x] `<auth-modal>` reutilizable.
- [x] Botón **Sign-in / Sign-out** en la navegación principal.
- [x] Enlace **Editorial** visible únicamente para `contributor`/`admin`.
- [x] Panel editorial protegido por `ULE.auth.requireRole()`.
- [x] Rutas CRUD confirmadas y documentadas.
- [ ] Completar mapeo UI ↔ DTO para colecciones y elementos.
- [ ] Ejecutar pruebas navegador contra el backend real.

