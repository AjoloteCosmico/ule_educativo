/* ==========================================================================
   components.js — Web Components reutilizables
   ule educativo

   Define:
     <ule-badge>      — etiqueta de categoría (equivalente a <badge> del plan;
                         el spec de Custom Elements exige un guion en el
                         nombre de la etiqueta, por eso "ule-badge").
     <article-card>   — card de artículo para la grid de articulos.html
     <biblio-card>     — card de referencia bibliográfica
     <ad-card>          — card de anuncio (vertical u horizontal)
     <catalog-grid>    — buscador/filtro + grid de piezas de un catálogo

   Diseño de encapsulación:
     ule-badge, article-card, biblio-card y ad-card usan Shadow DOM: son
     piezas pequeñas y autocontenidas, así que replican en su <style>
     interno solo las reglas que necesitan, leyendo siempre las variables
     globales de variables.css (las custom properties SÍ atraviesan el
     límite del Shadow DOM).

     catalog-grid, en cambio, renderiza en Light DOM (sin shadow root) y
     reutiliza las clases ya definidas en components.css (.catalog-grid,
     .catalog-card, .catalog-header, .catalog-empty, .catalog-loading).
     Motivo: es un componente grande con su propia grilla responsive y
     estados de carga/filtro — duplicar esas reglas dentro de un shadow
     root sería repetir por completo components.css. Además, dejarlo en
     Light DOM permite que <article-card>/<ule-badge> (con su propio
     shadow) se aniden dentro sin conflicto de estilos.

   Este archivo depende opcionalmente de ULE.loader (js/loader.js) para
   <catalog-grid>. Si no está presente, cae a un fetch() simple.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Utilidades compartidas ---------- */

  function truncate(text, max) {
    if (!text) return '';
    const clean = String(text).trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function capitalize(value) {
    const str = String(value || '');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatFecha(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /* ==========================================================================
     <ule-badge>
     Atributos:
       type  — clave de categoría-valor, p. ej. "periodo-clasico",
               "cultura-maya". Se usa para leer --badge-<type>.
       label — texto a mostrar (si se omite, usa el textContent del elemento).
     ========================================================================== */
  class UleBadge extends HTMLElement {
    static get observedAttributes() {
      return ['type', 'label'];
    }

    connectedCallback() {
      if (!this._initialized) this._render();
    }

    attributeChangedCallback() {
      if (this._initialized) this._render();
    }

    _render() {
      const type = this.getAttribute('type') || 'default';
      const label = this.getAttribute('label') || this.textContent.trim() || type;

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

      this.shadowRoot.innerHTML =
        '<style>' +
        ':host { display: inline-flex; }' +
        '.badge {' +
        '  display: inline-flex; align-items: center; justify-content: center;' +
        '  height: 1.6rem; padding-inline: calc(var(--space-sm) + var(--space-xs));' +
        '  border-radius: var(--radius-pill); font-family: var(--font-principal);' +
        '  font-size: var(--fs-anotacion); font-weight: 500; letter-spacing: 0.03em;' +
        '  text-transform: uppercase; color: #fff; white-space: nowrap; line-height: 1;' +
        '  background-color: var(--badge-' + type + ', var(--color-secundario));' +
        '}' +
        '</style>' +
        '<span class="badge" part="badge"></span>';

      this.shadowRoot.querySelector('.badge').textContent = label;
      this._initialized = true;
    }
  }

  /* ==========================================================================
     <article-card>
     Atributos: data-id, data-title, data-summary, data-image, data-category,
     data-date, data-author (opcional), data-href (opcional, ruta al artículo
     completo; por defecto articulo.html?id=<id>).
     Emite el evento "article-card:leer-mas" con { id } en el detail.
     ========================================================================== */
  class ArticleCard extends HTMLElement {
    static get observedAttributes() {
      return ['data-id', 'data-title', 'data-summary', 'data-image', 'data-category', 'data-date', 'data-author', 'data-href'];
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    _render() {
      const id = this.getAttribute('data-id') || '';
      const title = this.getAttribute('data-title') || '';
      const summary = truncate(this.getAttribute('data-summary'), 150);
      const image = this.getAttribute('data-image') || '';
      const category = this.getAttribute('data-category') || '';
      const date = this.getAttribute('data-date') || '';
      const author = this.getAttribute('data-author') || '';
      const href = this.getAttribute('data-href') || ('articulo.html?id=' + encodeURIComponent(id));

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

      this.shadowRoot.innerHTML =
        '<style>' +
        ':host { display: block; }' +
        '.card {' +
        '  display: flex; flex-direction: column; height: 100%;' +
        '  background-color: var(--color-card); border-radius: var(--radius-md);' +
        '  box-shadow: var(--shadow-card); overflow: hidden;' +
        '  transition: box-shadow 0.2s ease, transform 0.15s ease;' +
        '}' +
        '.card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.12); transform: translateY(-2px); }' +
        'img { aspect-ratio: 16/10; width: 100%; object-fit: cover; display: block; border-radius: 0; }' +
        '.body { display: flex; flex-direction: column; gap: var(--space-sm); padding: var(--space-md); flex-grow: 1; }' +
        '.meta { font-family: var(--font-anotaciones); font-style: italic; font-size: var(--fs-anotacion); color: var(--color-cuerpo-card); opacity: 0.8; }' +
        'h3 { font-size: var(--fs-h3); font-weight: 500; color: var(--color-titulo-card); margin: 0; line-height: var(--lh-titulo); }' +
        'p.summary { font-size: var(--fs-cuerpo); color: var(--color-cuerpo-card); line-height: var(--lh-cuerpo); margin: 0; }' +
        '.footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }' +
        'a.leer-mas {' +
        '  font-family: var(--font-principal); font-weight: 500; text-decoration: none;' +
        '  color: var(--color-link); font-size: var(--fs-anotacion);' +
        '}' +
        'a.leer-mas:hover { color: var(--color-link-hover); text-decoration: underline; }' +
        'a.leer-mas:focus-visible { outline: 2px solid var(--color-link-focus); outline-offset: 2px; border-radius: var(--radius-sm); }' +
        '</style>' +
        '<article class="card" part="card">' +
        (image ? '<img part="imagen" loading="lazy" alt="">' : '') +
        '<div class="body">' +
        '<ule-badge type="' + this._escapeAttr(category) + '"></ule-badge>' +
        '<h3 part="titulo"></h3>' +
        '<p class="meta" part="meta"></p>' +
        '<p class="summary" part="resumen"></p>' +
        '<div class="footer">' +
        '<a class="leer-mas" part="link" href="' + this._escapeAttr(href) + '">Leer más →</a>' +
        '</div>' +
        '</div>' +
        '</article>';

      const root = this.shadowRoot;
      const imgEl = root.querySelector('img');
      if (imgEl) {
        imgEl.src = image;
        imgEl.alt = title ? 'Imagen destacada: ' + title : '';
      }
      root.querySelector('h3').textContent = title;
      const metaParts = [author, formatFecha(date)].filter(Boolean);
      root.querySelector('.meta').textContent = metaParts.join(' · ');
      root.querySelector('.summary').textContent = summary;
      const badge = root.querySelector('ule-badge');
      badge.setAttribute('label', category || 'General');
      badge.setAttribute('type', 'categoria-' + slugify(category));

      const link = root.querySelector('a.leer-mas');
      link.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('article-card:leer-mas', {
          detail: { id: id },
          bubbles: true,
          composed: true
        }));
      });
    }

    _escapeAttr(value) {
      return String(value || '').replace(/"/g, '&quot;');
    }
  }

  /* ==========================================================================
     <biblio-card>
     Atributos: data-id, data-title, data-authors (coma-separado), data-year,
     data-type (libro|articulo|web), data-editorial, data-url, data-summary.
     ========================================================================== */
  class BiblioCard extends HTMLElement {
    static get observedAttributes() {
      return ['data-id', 'data-title', 'data-authors', 'data-year', 'data-type', 'data-editorial', 'data-url', 'data-summary'];
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    static get TIPO_LABEL() {
      return { libro: 'Libro', articulo: 'Artículo', web: 'Sitio web' };
    }

    _render() {
      const title = this.getAttribute('data-title') || '';
      const authors = this.getAttribute('data-authors') || '';
      const year = this.getAttribute('data-year') || '';
      const type = this.getAttribute('data-type') || '';
      const editorial = this.getAttribute('data-editorial') || '';
      const url = this.getAttribute('data-url') || '';
      const summary = this.getAttribute('data-summary') || '';
      const tipoLabel = BiblioCard.TIPO_LABEL[type] || capitalize(type);

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

      this.shadowRoot.innerHTML =
        '<style>' +
        ':host { display: block; }' +
        '.card {' +
        '  background-color: var(--color-card); color: var(--color-cuerpo-card);' +
        '  border-radius: var(--radius-md); box-shadow: var(--shadow-card);' +
        '  padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm);' +
        '}' +
        'h3 { color: var(--color-titulo-card); font-weight: 500; font-size: var(--fs-h3); margin: 0; }' +
        '.meta { font-size: var(--fs-anotacion); color: var(--color-cuerpo-card); opacity: 0.85; }' +
        'p.summary { font-size: var(--fs-cuerpo); line-height: var(--lh-cuerpo); margin: 0; }' +
        'a.enlace { color: var(--color-link); font-size: var(--fs-anotacion); text-decoration: underline; text-underline-offset: 0.15em; }' +
        'a.enlace:hover { color: var(--color-link-hover); }' +
        'a.enlace:focus-visible { outline: 2px solid var(--color-link-focus); outline-offset: 2px; }' +
        '.header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm); }' +
        '</style>' +
        '<article class="card" part="card">' +
        '<div class="header-row">' +
        '<h3 part="titulo"></h3>' +
        '<ule-badge type="biblio-' + slugify(type) + '" label="' + this._escapeAttr(tipoLabel) + '"></ule-badge>' +
        '</div>' +
        '<p class="meta" part="meta"></p>' +
        '<p class="summary" part="resumen"></p>' +
        (url ? '<a class="enlace" part="enlace" target="_blank" rel="noopener noreferrer">Ver fuente <span class="sr-only"></span></a>' : '') +
        '</article>';

      const root = this.shadowRoot;
      root.querySelector('h3').textContent = title;
      const metaParts = [authors, year, editorial].filter(Boolean);
      root.querySelector('.meta').textContent = metaParts.join(' · ');
      root.querySelector('.summary').textContent = summary;

      const link = root.querySelector('a.enlace');
      if (link) {
        link.href = url;
        link.setAttribute('aria-label', 'Ver fuente de "' + title + '" (abre en pestaña nueva)');
      }
    }

    _escapeAttr(value) {
      return String(value || '').replace(/"/g, '&quot;');
    }
  }

  /* ==========================================================================
     <ad-card>
     Atributos: data-image, data-imagen-alt, data-contacto, data-slogan,
     data-descripcion, data-vigencia-fin, data-enlace. Atributo booleano
     "horizontal".

     Notas de diseño (ver docs/politica_anuncios.md):
     - La imagen SIEMPRE ocupa su espacio: si no hay data-image, o si la URL
       falla al cargar (onerror), se muestra un fallback visual (icono +
       degradado con los colores de identidad) en vez de dejar un hueco o un
       ícono de imagen rota. El tamaño de la card nunca depende de si la
       imagen cargó o no.
     - object-fit: cover asegura que la imagen se recorte de forma consistente
       sin importar sus dimensiones originales.
     - "horizontal" se controla por atributo, pero además el propio host es un
       contenedor de tamaño (container query): si el espacio real disponible
       cae por debajo de ~360px, se repliega a layout vertical aunque el
       atributo "horizontal" siga presente — así nunca se ve apachurrado en
       slots angostos o en mobile.
     - Contorno animado sutil (glow pulsante) para distinguir visualmente los
       anuncios del resto de las cards, respetando prefers-reduced-motion.
     ========================================================================== */
  class AdCard extends HTMLElement {
    static get observedAttributes() {
      return ['data-image', 'data-imagen-alt', 'data-contacto', 'data-slogan', 'data-descripcion', 'data-vigencia-fin', 'data-enlace', 'horizontal'];
    }

    connectedCallback() {
      this._render();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    _render() {
      const image = this.getAttribute('data-image') || '';
      const imageAlt = this.getAttribute('data-imagen-alt') || '';
      const contacto = this.getAttribute('data-contacto') || '';
      const slogan = this.getAttribute('data-slogan') || '';
      const descripcion = this.getAttribute('data-descripcion') || '';
      const vigenciaFin = this.getAttribute('data-vigencia-fin') || '';
      const enlace = this.getAttribute('data-enlace') || '';
      const horizontal = this.hasAttribute('horizontal');

      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

      this.shadowRoot.innerHTML =
        '<style>' +
        ':host {' +
        '  display: block; container-type: inline-size;' +
        '}' +
        '@keyframes ad-glow {' +
        '  0%, 100% { box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-principal) 55%, transparent), 0 0 0px 0px transparent, var(--shadow-card); }' +
        '  50% { box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-principal) 90%, transparent), 0 0 16px 2px color-mix(in srgb, var(--color-principal) 40%, transparent), var(--shadow-card); }' +
        '}' +
        '.card {' +
        '  position: relative; display: flex; flex-direction: ' + (horizontal ? 'row' : 'column') + ';' +
        '  background-color: var(--color-card); border-radius: var(--radius-md);' +
        '  overflow: hidden; text-decoration: none; color: inherit;' +
        '  animation: ad-glow 2.6s ease-in-out infinite;' +
        '}' +
        '@container (max-width: 360px) {' +
        '  .card { flex-direction: column; }' +
        '  .media { width: 100%; max-width: none; }' +
        '}' +
        '.media {' +
        '  position: relative; aspect-ratio: 4/5; display: block; flex-shrink: 0; overflow: hidden;' +
        '  width: ' + (horizontal ? '40%' : '100%') + ';' +
        (horizontal ? '  max-width: 200px;' : '') +
        '  background: linear-gradient(135deg, var(--color-principal), var(--color-secundario));' +
        '}' +
        '.media img {' +
        '  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;' +
        '}' +
        '.media__fallback {' +
        '  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff;' +
        '}' +
        '.media__fallback svg { width: 42%; height: 42%; opacity: 0.9; }' +
        '.media.is-empty img { display: none; }' +
        '.media:not(.is-empty) .media__fallback { display: none; }' +
        '.body { display: flex; flex-direction: column; gap: var(--space-sm); padding: var(--space-md); flex: 1; min-width: 0; }' +
        '.slogan { font-size: var(--fs-h3); font-weight: 700; color: var(--color-titulo-card); margin: 0; }' +
        '.contacto { font-size: var(--fs-cuerpo); color: var(--color-cuerpo-card); margin: 0; }' +
        '.legal { font-family: var(--font-anotaciones); font-style: italic; font-size: var(--fs-anotacion); color: var(--color-cuerpo-card); opacity: 0.8; margin: 0; margin-top: auto; }' +
        'a.wrap:focus-visible { outline: 2px solid var(--color-link-focus); outline-offset: 3px; }' +
        '@media (prefers-reduced-motion: reduce) {' +
        '  .card { animation: none; box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--color-principal) 65%, transparent), var(--shadow-card); }' +
        '}' +
        '</style>' +
        (enlace
          ? '<a class="card wrap" part="card" href="' + this._escapeAttr(enlace) + '" target="_blank" rel="noopener noreferrer">'
          : '<div class="card" part="card">') +
        '<div class="media" part="imagen">' +
        '<img loading="lazy" alt="">' +
        '<div class="media__fallback" aria-hidden="true">' +
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="36" r="15" fill="none" stroke="currentColor" stroke-width="5"></circle><path d="M12 88 Q50 55 88 88" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path></svg>' +
        '</div>' +
        '</div>' +
        '<div class="body">' +
        '<p class="slogan" part="slogan"></p>' +
        '<p class="contacto" part="contacto"></p>' +
        '<p class="legal" part="legal"></p>' +
        '</div>' +
        (enlace ? '</a>' : '</div>');

      const root = this.shadowRoot;
      const mediaEl = root.querySelector('.media');
      const imgEl = root.querySelector('.media img');
      const altText = imageAlt || (slogan ? 'Anuncio: ' + slogan : 'Anuncio');

      if (image) {
        imgEl.alt = altText;
        imgEl.addEventListener('error', function () {
          mediaEl.classList.add('is-empty');
        });
        imgEl.src = image;
      } else {
        mediaEl.classList.add('is-empty');
      }

      root.querySelector('.slogan').textContent = slogan;
      root.querySelector('.contacto').textContent = contacto;
      const legal = vigenciaFin ? 'Vigente hasta: ' + formatFecha(vigenciaFin) : descripcion;
      root.querySelector('.legal').textContent = legal;

      const link = root.querySelector('a.wrap');
      if (link && slogan) link.setAttribute('aria-label', slogan + (contacto ? ' — ' + contacto : ''));
    }

    _escapeAttr(value) {
      return String(value || '').replace(/"/g, '&quot;');
    }
  }

  /* ==========================================================================
     <catalog-grid>  (Light DOM — reutiliza css/components.css)
     Atributos:
       data-source    — URL del JSON del catálogo (obligatorio)
       categories     — lista separada por comas de categorías filtrables
                        (si se omite, se usan todas las de categorias_disponibles)
       allow-filter   — "true"/"false" (default: "true")
       hide-header    — si está presente, no renderiza título/descripción
     ========================================================================== */
  class CatalogGrid extends HTMLElement {
    static get observedAttributes() {
      return ['data-source', 'categories', 'allow-filter'];
    }

    connectedCallback() {
      this._activeFilters = this._activeFilters || {};
      this._load();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal || !this.isConnected) return;
      this._activeFilters = {};
      this._load();
    }

    async _load() {
      const source = this.getAttribute('data-source');
      if (!source) {
        this.innerHTML = '<div class="catalog-empty">Falta el atributo data-source en &lt;catalog-grid&gt;.</div>';
        return;
      }

      this.innerHTML = '<div class="catalog-loading" role="status">Cargando catálogo…</div>';

      let data;
      try {
        if (window.ULE && ULE.loader && typeof ULE.loader.loadJSON === 'function') {
          data = await ULE.loader.loadJSON(source);
        } else {
          const res = await fetch(source);
          data = res.ok ? await res.json() : null;
        }
      } catch (err) {
        data = null;
      }

      if (!data) {
        this.innerHTML = '<div class="catalog-empty">No se pudo cargar el catálogo.</div>';
        return;
      }

      this._catalog = data;
      this._renderShell();
    }

    _renderShell() {
      const catalog = this._catalog;
      const hideHeader = this.hasAttribute('hide-header');
      const allowFilter = this.getAttribute('allow-filter') !== 'false';

      const categoriesAttr = this.getAttribute('categories');
      const categoryKeys = categoriesAttr
        ? categoriesAttr.split(',').map((s) => s.trim()).filter(Boolean)
        : Object.keys(catalog.categorias_disponibles || {});

      this.innerHTML = '';

      if (!hideHeader && (catalog.titulo || catalog.descripcion)) {
        const header = document.createElement('header');
        header.className = 'catalog-header';
        if (catalog.titulo) {
          const h2 = document.createElement('h2');
          h2.className = 'catalog-header__titulo';
          h2.textContent = catalog.titulo;
          header.appendChild(h2);
        }
        if (catalog.descripcion) {
          const p = document.createElement('p');
          p.className = 'catalog-header__descripcion';
          p.textContent = catalog.descripcion;
          header.appendChild(p);
        }
        this.appendChild(header);
      }

      if (allowFilter && categoryKeys.length) {
        this.appendChild(this._buildFilters(categoryKeys));
      }

      this._gridEl = document.createElement('div');
      this._gridEl.className = 'catalog-grid';
      this.appendChild(this._gridEl);

      this._dialog = this._buildDialog();
      this.appendChild(this._dialog);

      this._renderGrid();
    }

    _buildFilters(categoryKeys) {
      const wrap = document.createElement('div');
      wrap.className = 'cluster';
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Filtros del catálogo');
      wrap.style.marginBlockEnd = 'var(--space-lg)';

      const available = this._catalog.categorias_disponibles || {};

      categoryKeys.forEach((key) => {
        const values = available[key] || [];
        if (!values.length) return;

        const fieldset = document.createElement('fieldset');
        fieldset.style.border = 'none';
        fieldset.style.padding = '0';
        fieldset.style.margin = '0';

        const legend = document.createElement('legend');
        legend.className = 'anotacion';
        legend.textContent = capitalize(key);
        fieldset.appendChild(legend);

        const cluster = document.createElement('div');
        cluster.className = 'cluster';

        values.forEach((value) => {
          const id = 'filtro-' + key + '-' + slugify(value) + '-' + Math.random().toString(36).slice(2, 7);
          const label = document.createElement('label');
          label.style.display = 'inline-flex';
          label.style.alignItems = 'center';
          label.style.gap = 'var(--space-xs)';

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.id = id;
          input.value = value;
          input.addEventListener('change', () => {
            const current = this._activeFilters[key] || [];
            this._activeFilters[key] = input.checked
              ? current.concat(value)
              : current.filter((v) => v !== value);
            this._renderGrid();
          });

          label.setAttribute('for', id);
          label.appendChild(input);
          label.appendChild(document.createTextNode(' ' + capitalize(value)));
          cluster.appendChild(label);
        });

        fieldset.appendChild(cluster);
        wrap.appendChild(fieldset);
      });

      return wrap;
    }

    _matchesFilters(item) {
      const keys = Object.keys(this._activeFilters).filter((k) => this._activeFilters[k].length);
      if (!keys.length) return true;
      return keys.every((key) => {
        const valor = item.categorias && item.categorias[key];
        return this._activeFilters[key].includes(valor);
      });
    }

    _renderGrid() {
      const elementos = (this._catalog.elementos || []).filter((item) => this._matchesFilters(item));
      this._gridEl.innerHTML = '';

      if (!elementos.length) {
        const empty = document.createElement('div');
        empty.className = 'catalog-empty';
        empty.textContent = 'No hay piezas que coincidan con los filtros seleccionados.';
        this._gridEl.appendChild(empty);
        return;
      }

      elementos.forEach((item) => {
        this._gridEl.appendChild(this._buildCard(item));
      });
    }

    _buildCard(item) {
      const card = document.createElement('article');
      card.className = 'catalog-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Ver detalle: ' + (item.titulo || ''));

      const img = document.createElement('img');
      img.className = 'catalog-card__imagen';
      img.loading = 'lazy';
      img.src = item.imagen || '';
      img.alt = item.titulo || '';

      const body = document.createElement('div');
      body.className = 'catalog-card__body';

      const h3 = document.createElement('h3');
      h3.className = 'catalog-card__titulo';
      h3.textContent = item.titulo || '';

      const badges = document.createElement('div');
      badges.className = 'catalog-card__badges';
      Object.keys(item.categorias || {}).forEach((key) => {
        const value = item.categorias[key];
        const badge = document.createElement('ule-badge');
        badge.setAttribute('type', key + '-' + slugify(value));
        badge.setAttribute('label', capitalize(value));
        badges.appendChild(badge);
      });

      body.appendChild(h3);
      body.appendChild(badges);
      card.appendChild(img);
      card.appendChild(body);

      const open = () => this._openDialog(item);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });

      return card;
    }

    _buildDialog() {
      const dialog = document.createElement('dialog');
      dialog.className = 'catalog-modal';
      dialog.style.border = 'none';
      dialog.style.borderRadius = 'var(--radius-lg)';
      dialog.style.padding = '0';
      dialog.style.maxWidth = '640px';
      dialog.style.width = '92vw';
      dialog.style.color = 'var(--color-texto)';
      dialog.style.backgroundColor = 'var(--color-fondo)';

      dialog.addEventListener('click', (e) => {
        // Cierra al hacer clic fuera del contenido (en el ::backdrop no aplica,
        // así que detectamos clic directo sobre el <dialog>)
        if (e.target === dialog) dialog.close();
      });

      return dialog;
    }

    _openDialog(item) {
      const dialog = this._dialog;
      dialog.innerHTML = '';

      const content = document.createElement('div');
      content.style.padding = 'var(--space-lg)';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn';
      closeBtn.textContent = 'Cerrar ✕';
      closeBtn.style.float = 'inline-end';
      closeBtn.addEventListener('click', () => dialog.close());

      const img = document.createElement('img');
      img.src = item.imagen || '';
      img.alt = item.titulo || '';
      img.style.width = '100%';
      img.style.marginBlockEnd = 'var(--space-md)';

      const h3 = document.createElement('h3');
      h3.textContent = item.titulo || '';

      const desc = document.createElement('p');
      desc.textContent = item.descripcion || '';

      const meta = document.createElement('p');
      meta.className = 'anotacion';
      const metaParts = [];
      if (item['año_descubrimiento']) metaParts.push('Descubierto en ' + item['año_descubrimiento']);
      if (item.ubicacion) metaParts.push(item.ubicacion);
      meta.textContent = metaParts.join(' · ');

      const badges = document.createElement('div');
      badges.className = 'cluster';
      badges.style.marginBlockStart = 'var(--space-sm)';
      Object.keys(item.categorias || {}).forEach((key) => {
        const value = item.categorias[key];
        const badge = document.createElement('ule-badge');
        badge.setAttribute('type', key + '-' + slugify(value));
        badge.setAttribute('label', capitalize(value));
        badges.appendChild(badge);
      });

      content.appendChild(closeBtn);
      content.appendChild(img);
      content.appendChild(h3);
      content.appendChild(meta);
      content.appendChild(desc);
      content.appendChild(badges);
      dialog.appendChild(content);

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }
  }

  /* ---------- Registro de elementos ---------- */
  const registry = [
    ['ule-badge', UleBadge],
    ['article-card', ArticleCard],
    ['biblio-card', BiblioCard],
    ['ad-card', AdCard],
    ['catalog-grid', CatalogGrid]
  ];

  registry.forEach(function (entry) {
    const name = entry[0];
    const ctor = entry[1];
    if (!customElements.get(name)) {
      customElements.define(name, ctor);
    }
  });
})();