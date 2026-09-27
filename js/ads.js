window.ULE = window.ULE || {};

ULE.ads = (function () {
  'use strict';

  // Los anuncios se obtienen SIEMPRE a través de ULE.loader.loadAds(): este
  // módulo no sabe si vienen de data/anuncios.json o de la API (docs/arquitectura.md §4).
  let cache = null;
  // Mantiene la misma selección de hasta tres anuncios durante la vida de la página.
  // La clave permite que cada página tenga su propio conjunto seleccionado.
  const selectionCache = new Map();

  async function loadAds() {
    if (cache) return cache;
    try {
      const ads = await ULE.loader.loadAds();
      cache = Array.isArray(ads) ? ads : [];
    } catch (error) {
      // Los anuncios son complementarios: si fallan, el slot simplemente se oculta.
      console.warn('[ULE.ads] No se pudieron cargar los anuncios:', error);
      cache = [];
    }
    return cache;
  }

  function fechaActual() {
    const ahora = new Date();
    return ahora.getFullYear() + '-' +
      String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
      String(ahora.getDate()).padStart(2, '0');
  }

  function isVigente(ad, today) {
    if (!ad || ad.activo !== true) return false;
    if (ad.vigencia_inicio && ad.vigencia_inicio > today) return false;
    if (ad.vigencia_fin && ad.vigencia_fin < today) return false;
    return true;
  }

  function getValidAds(ads, today) {
    // Regla editorial vigente: los anuncios activos y vigentes forman un
    // conjunto global. No se filtran por "paginas": los seleccionados se
    // muestran en todas las páginas que tengan sección de anuncios.
    return ads.filter(function (ad) {
      return isVigente(ad, today);
    });
  }

  function weightedRandom(ads) {
    if (!ads.length) return null;
    const total = ads.reduce(function (sum, ad) {
      const peso = Number(ad.peso);
      return sum + (Number.isFinite(peso) && peso >= 1 ? peso : 1);
    }, 0);
    let random = Math.random() * total;
    for (const ad of ads) {
      const peso = Number(ad.peso);
      random -= Number.isFinite(peso) && peso >= 1 ? peso : 1;
      if (random <= 0) return ad;
    }
    return ads[ads.length - 1];
  }

  function weightedSample(ads, cantidad) {
    const disponibles = ads.slice();
    const seleccion = [];
    while (seleccion.length < Math.min(cantidad, disponibles.length)) {
      const total = disponibles.reduce(function (sum, ad) {
        const peso = Number(ad.peso);
        return sum + (Number.isFinite(peso) && peso >= 1 ? peso : 1);
      }, 0);
      let random = Math.random() * total;
      let elegido = disponibles[disponibles.length - 1];
      for (const ad of disponibles) {
        const peso = Number(ad.peso);
        random -= Number.isFinite(peso) && peso >= 1 ? peso : 1;
        if (random <= 0) { elegido = ad; break; }
      }
      seleccion.push(elegido);
      disponibles.splice(disponibles.indexOf(elegido), 1);
    }
    return seleccion;
  }

  async function getSelectedAds(pagina) {
    const ads = await loadAds();
    const validAds = getValidAds(ads, fechaActual());
    const key = pagina || '__all__';

    if (!selectionCache.has(key)) {
      const seleccion = weightedSample(validAds, 3);

      // La regla editorial pide tres espacios visibles. Si la DB tiene
      // menos de tres anuncios vigentes, reutilizamos cíclicamente los
      // anuncios disponibles para ocupar los tres slots; no se inventa
      // contenido y, cuando existen 3+, la selección sigue siendo sin
      // reemplazo y por tanto son tres anuncios distintos.
      if (seleccion.length > 0 && seleccion.length < 3) {
        const base = seleccion.slice();
        let i = 0;
        while (seleccion.length < 3) {
          seleccion.push(base[i % base.length]);
          i++;
        }
      }

      selectionCache.set(key, seleccion);
    }

    return selectionCache.get(key);
  }

  async function getRandomAd(pagina) {
    const seleccion = await getSelectedAds(pagina);
    return seleccion.length ? seleccion[Math.floor(Math.random() * seleccion.length)] : null;
  }

  // Si no hay anuncio, se oculta también la sección contenedora.
  function toggleSection(slot, visible) {
    const section = slot.closest('.ad-section');
    if (section) section.hidden = !visible;
  }

  function renderSlot(slot, ad) {
    if (!ad) {
      slot.hidden = true;
      slot.replaceChildren();
      return;
    }
    slot.hidden = false;
    toggleSection(slot, true);
    slot.replaceChildren();
    const card = document.createElement('ad-card');
    const attrMap = {
      imagen: 'image',
      imagen_alt: 'imagen-alt',
      contacto: 'contacto',
      slogan: 'slogan',
      descripcion: 'descripcion',
      vigencia_fin: 'vigencia-fin',
      enlace: 'enlace',
      tipo: 'tipo'
    };
    Object.keys(attrMap).forEach(function (campo) {
      if (ad[campo]) card.setAttribute('data-' + attrMap[campo], ad[campo]);
    });
    if (slot.dataset.adHorizontal === 'true') card.setAttribute('horizontal', '');
    slot.appendChild(card);
  }

  async function renderSlots(root, pagina) {
    const scope = root || document;
    const container = scope.querySelector('[data-ad-slots]');
    if (!container) return [];

    // La cantidad de slots es una regla del componente, no una responsabilidad
    // de cada página. Así una página antigua o cacheada no puede degradar la
    // sección a un solo anuncio.
    let slots = Array.from(container.querySelectorAll(':scope > [data-ad-slot]'));
    while (slots.length < 3) {
      const slot = document.createElement('div');
      slot.setAttribute('data-ad-slot', '');
      slot.setAttribute('data-ad-horizontal', 'true');
      container.appendChild(slot);
      slots.push(slot);
    }

    const seleccion = await getSelectedAds(pagina);

    slots.slice(0, 3).forEach(function (slot, index) {
      renderSlot(slot, seleccion[index] || null);
    });

    const section = container.closest('.ad-section');
    if (section) section.hidden = seleccion.length === 0;
    return seleccion;
  }

  function init() {
    const pagina = document.body && document.body.dataset.adPage;
    const start = function () { renderSlots(document, pagina); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else start();
  }

  init();

  return { loadAds, getValidAds, getSelectedAds, getRandomAd, renderSlot, renderSlots };
})();
