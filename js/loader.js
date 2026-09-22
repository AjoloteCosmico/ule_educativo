/* ==========================================================================
   loader.js — Carga y mapeo de datos JSON
   ule educativo

   Namespace global: window.ULE.loader
   Sin dependencias externas, sin módulos ES (script plano <script src="js/loader.js">).

   CÓMO ESCALAR SIN TOCAR CÓDIGO
   ------------------------------
   Un sitio 100% estático (GitHub Pages, etc.) no puede listar el contenido
   de una carpeta por sí solo: el navegador no tiene "ls". Por eso cada
   carpeta de datos (data/articulos/, data/bibliografia/, data/catalogos/)
   debe incluir un pequeño archivo manifiesto `index.json` con la lista de
   archivos, por ejemplo:

     data/articulos/index.json
     ["articulo-001.json", "articulo-002.json"]

   Agregar contenido nuevo entonces es: crear el .json del artículo/pieza/
   referencia + agregar su nombre a index.json. Sigue sin tocar HTML/CSS/JS.

   Como respaldo (por si el manifiesto no existe todavía), este loader
   también puede "sondear" nombres numerados de forma secuencial
   (prefijo-001.json, prefijo-002.json, ...) hasta encontrar varios 404
   seguidos. Es más frágil (deja huecos en la numeración) por lo que el
   manifiesto es siempre el método recomendado.
   ========================================================================== */

window.ULE = window.ULE || {};

/* CONTRATO DE ERRORES (igual en fuente local y API)
   - Recurso inexistente  -> null (byId) / [] (listas). No lanza.
   - Fallo de red o de servidor (sólo API) -> lanza Error.
   Las páginas deben envolver las llamadas en try/catch y mostrar un mensaje de error. */

// Fuente de datos intercambiable. En Fase 1 usamos JSON local;
// en Fase 2 podrá cambiarse a un adaptador HTTP sin modificar los consumidores.
ULE.config = ULE.config || {};
ULE.config.dataSource = ULE.config.dataSource || 'api';
ULE.config.apiBaseUrl = ULE.config.apiBaseUrl || 'http://localhost:8080/api/v1';

ULE.loader = (function () {
  const cache = new Map();
  const PROBE_MAX = 200; // límite duro de sondeo para no colgar el navegador
  const PROBE_MAX_MISSES = 3; // huecos consecutivos tolerados antes de detener el sondeo

  /* ---------- Utilidades base ---------- */

  /**
   * Descarga y parsea un JSON. Usa una caché en memoria por sesión para
   * no repetir peticiones de red al mismo recurso.
   * @param {string} path - Ruta relativa al archivo JSON.
   * @param {{ useCache?: boolean }} [options]
   * @returns {Promise<any|null>} El JSON parseado, o null si no existe/falló.
   */
  async function loadJSON(path, options) {
    const useCache = !options || options.useCache !== false;

    if (useCache && cache.has(path)) {
      return cache.get(path);
    }

    try {
      const response = await fetch(path, { cache: 'no-cache' });
      if (!response.ok) {
        if (useCache) cache.set(path, null);
        return null;
      }
      const data = await response.json();
      if (useCache) cache.set(path, data);
      return data;
    } catch (err) {
      console.warn('[ULE.loader] No se pudo cargar "' + path + '":', err);
      if (useCache) cache.set(path, null);
      return null;
    }
  }

  function ensureTrailingSlash(folderPath) {
    return folderPath.endsWith('/') ? folderPath : folderPath + '/';
  }

  /**
   * Intenta leer data/<carpeta>/index.json con la lista de archivos.
   * @param {string} folderPath - p. ej. "data/articulos/"
   * @returns {Promise<string[]|null>}
   */
  async function loadManifest(folderPath) {
    const manifest = await loadJSON(ensureTrailingSlash(folderPath) + 'index.json');
    return Array.isArray(manifest) ? manifest : null;
  }

  /**
   * Respaldo sin manifiesto: sondea archivos "prefijo-NNN.json" de forma
   * secuencial hasta acumular PROBE_MAX_MISSES fallos consecutivos.
   * @param {string} folderPath
   * @param {string} prefix - p. ej. "articulo" (dará articulo-001.json, ...)
   * @returns {Promise<string[]>}
   */
  async function probeSequentialFiles(folderPath, prefix) {
    const base = ensureTrailingSlash(folderPath);
    const found = [];
    let misses = 0;

    for (let i = 1; i <= PROBE_MAX && misses < PROBE_MAX_MISSES; i++) {
      const filename = prefix + '-' + String(i).padStart(3, '0') + '.json';
      const data = await loadJSON(base + filename, { useCache: false });
      if (data) {
        found.push(filename);
        misses = 0;
      } else {
        misses++;
      }
    }
    return found;
  }

  /**
   * Lista los archivos de una colección: intenta manifiesto primero,
   * y si no existe recurre al sondeo secuencial (si se da un prefix).
   * @param {string} folderPath
   * @param {{ prefix?: string }} [options]
   * @returns {Promise<string[]>}
   */
  async function listCollectionFiles(folderPath, options) {
    const manifest = await loadManifest(folderPath);
    if (manifest) return manifest;

    const prefix = options && options.prefix;
    if (!prefix) return [];

    console.warn(
      '[ULE.loader] No hay index.json en "' + folderPath + '", usando sondeo secuencial.'
    );
    return probeSequentialFiles(folderPath, prefix);
  }

  /**
   * Carga todos los JSON de una colección y opcionalmente filtra por
   * el campo "visible".
   * @param {string} folderPath
   * @param {{ prefix?: string, visibleOnly?: boolean }} [options]
   * @returns {Promise<any[]>}
   */
  async function loadCollection(folderPath, options) {
    const opts = options || {};
    const visibleOnly = opts.visibleOnly !== false;
    const base = ensureTrailingSlash(folderPath);

    const files = await listCollectionFiles(folderPath, { prefix: opts.prefix });

    const items = await Promise.all(
      files.map(function (filename) {
        return loadJSON(base + filename);
      })
    );

    return items.filter(function (item) {
      if (!item) return false;
      if (visibleOnly && item.visible === false) return false;
      return true;
    });
  }

  /* ---------- Adaptador de fuente ---------- */

  /**
   * GET a la API. Contrato de errores (igual que la fuente local):
   *  - 404 -> null  (el recurso no existe; las páginas muestran "no encontrado")
   *  - otro error / red caída -> lanza Error (las páginas muestran "no fue posible cargar")
   */
  async function apiJSON(path) {
    const base = String(ULE.config.apiBaseUrl || '').replace(/\/+$/, '');
    if (!base) throw new Error('[ULE.loader] ULE.config.apiBaseUrl no está configurada.');
    const response = await fetch(base + path, { headers: { 'Accept': 'application/json' }, cache: 'no-cache' });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('[ULE.loader] API respondió HTTP ' + response.status + ' para ' + path);
    return response.json();
  }

  async function fromSource(localFn, apiFn) {
    if (ULE.config.dataSource === 'api') {
      if (typeof apiFn !== 'function') {
        throw new Error('[ULE.loader] La fuente API aún no está implementada.');
      }
      return apiFn();
    }
    return localFn();
  }

  /* ---------- Artículos ---------- */

  function loadArticles() {
    return fromSource(
      function () { return loadCollection('data/articulos/', { prefix: 'articulo' }); },
      function () { return apiJSON('/articles').then(normalizeVisible); }
    );
  }

  async function loadArticleById(id) {
    return fromSource(
      async function () {
        const articles = await loadArticles();
        return articles.find(function (a) { return a.id === id; }) || null;
      },
      function () { return apiJSON('/articles/' + encodeURIComponent(id)); }
    );
  }

  /* ---------- Bibliografía ---------- */

  function loadBibliografia() {
    return fromSource(
      function () { return loadCollection('data/bibliografia/', { prefix: 'biblio' }); },
      function () { return apiJSON('/bibliography').then(normalizeVisible); }
    );
  }

  async function loadBiblioById(id) {
    const refs = await loadBibliografia();
    return refs.find(function (b) { return b.id === id; }) || null;
  }

  /**
   * Dado un artículo, resuelve sus referencias bibliográficas completas
   * a partir de su campo "bibliografía_relacionada" (array de ids).
   * @param {object} articulo
   * @returns {Promise<any[]>}
   */
  async function loadBiblioForArticle(articulo) {
    const ids = (articulo && articulo['bibliografía_relacionada']) || [];
    if (!ids.length) return [];

    const refs = await loadBibliografia();
    const byId = new Map(refs.map(function (r) { return [r.id, r]; }));
    return ids.map(function (id) { return byId.get(id); }).filter(Boolean);
  }

  /**
   * Mapa id de referencia -> artículos que la citan: { [biblioId]: [{ id, titulo, fecha }] }.
   *
   * La fuente de verdad es articulo.bibliografía_relacionada (así lo modelará
   * la tabla article_bibliography en Fase 2). Si una referencia declara además
   * `articulos_relacionados`, se une sin duplicar. Ordena por fecha descendente.
   * Sólo considera artículos visibles.
   * @returns {Promise<Object<string, Array<{id:string,titulo:string,fecha:string}>>>}
   */
  async function loadRelatedArticlesMap() {
    const results = await Promise.all([loadArticles(), loadBibliografia()]);
    const articles = results[0];
    const refs = results[1];
    const byId = new Map(articles.map(function (a) { return [a.id, a]; }));
    const map = {};

    function add(biblioId, article) {
      if (!article || article.visible === false) return;
      const list = map[biblioId] || (map[biblioId] = []);
      if (!list.some(function (x) { return x.id === article.id; })) {
        list.push({ id: article.id, titulo: article.titulo || article.id, fecha: article.fecha || '' });
      }
    }

    articles.forEach(function (article) {
      (article['bibliografía_relacionada'] || []).forEach(function (biblioId) { add(biblioId, article); });
    });
    refs.forEach(function (ref) {
      (ref.articulos_relacionados || []).forEach(function (articleId) { add(ref.id, byId.get(articleId)); });
    });
    Object.keys(map).forEach(function (key) {
      map[key].sort(function (a, b) { return b.fecha.localeCompare(a.fecha); });
    });
    return map;
  }

  /* ---------- Catálogos ---------- */

  /**
   * Carga un catálogo específico por su id de archivo
   * (p. ej. "piezas-arqueologicas" → data/catalogos/piezas-arqueologicas.json).
   * @param {string} catalogId
   * @returns {Promise<object|null>}
   */
  function loadCatalog(catalogId) {
    // El id puede venir de la URL (?catalogo=...): sólo se aceptan ids lógicos,
    // nunca rutas ("../anuncios", "a/b").
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(String(catalogId || ''))) return Promise.resolve(null);
    return fromSource(
      function () { return loadJSON('data/catalogos/' + catalogId + '.json'); },
      function () { return apiJSON('/catalogs/' + encodeURIComponent(catalogId)); }
    );
  }

  /**
   * Lista los catálogos disponibles. Requiere data/catalogos/index.json
   * con los ids de catálogo (sin extensión), ya que los nombres de
   * catálogo no siguen una numeración secuencial predecible.
   * Ejemplo de index.json: ["piezas-arqueologicas", "canchas-modernas"]
   * @returns {Promise<string[]>}
   */
  async function listCatalogIds() {
    return fromSource(
      async function () {
        const manifest = await loadManifest('data/catalogos/');
        if (!manifest) return [];
        return manifest.map(function (name) { return name.replace(/\.json$/, ''); });
      },
      function () { return apiJSON('/catalogs').then(normalizeCollection).then(function (items) { return items.map(function (c) { return c.id; }); }); }
    );
  }

  function normalizeCollection(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  }

  // Misma regla que la fuente local (loadCollection): los elementos con visible:false no se muestran.
  // Así la interfaz se comporta igual aunque la API llegara a devolver borradores.
  function normalizeVisible(data) {
    return normalizeCollection(data).filter(function (item) { return item && item.visible !== false; });
  }

  async function loadAllCatalogs() {
    const ids = await listCatalogIds();
    const catalogs = await Promise.all(ids.map(loadCatalog));
    return catalogs.filter(function (c) { return c && c.visible !== false; });
  }

  /**
   * Filtra los elementos de un catálogo por una o más categorías activas.
   * @param {object} catalogo - resultado de loadCatalog()
   * @param {Object<string, string[]>} filtros - p. ej. { periodo: ['clasico'], cultura: ['maya'] }
   * @returns {any[]}
   */
  function filterCatalogItems(catalogo, filtros) {
    if (!catalogo || !Array.isArray(catalogo.elementos)) return [];
    const keys = Object.keys(filtros || {}).filter(function (k) {
      return filtros[k] && filtros[k].length;
    });
    if (!keys.length) return catalogo.elementos;

    return catalogo.elementos.filter(function (item) {
      return keys.every(function (key) {
        const valor = item.categorias && item.categorias[key];
        return filtros[key].includes(valor);
      });
    });
  }

  async function loadAds() {
    return fromSource(
      async function () {
        const data = await loadJSON('data/anuncios.json');
        return data && Array.isArray(data.anuncios) ? data.anuncios : [];
      },
      function () { return apiJSON('/ads').then(normalizeCollection); }
    );
  }

  /* ---------- API pública ---------- */

  return {
    loadJSON: loadJSON,
    loadAds: loadAds,
    apiJSON: apiJSON,
    loadCollection: loadCollection,
    listCollectionFiles: listCollectionFiles,

    loadArticles: loadArticles,
    loadArticleById: loadArticleById,

    loadBibliografia: loadBibliografia,
    loadBiblioById: loadBiblioById,
    loadBiblioForArticle: loadBiblioForArticle,
    loadRelatedArticlesMap: loadRelatedArticlesMap,

    loadCatalog: loadCatalog,
    listCatalogIds: listCatalogIds,
    loadAllCatalogs: loadAllCatalogs,
    filterCatalogItems: filterCatalogItems
  };
})();