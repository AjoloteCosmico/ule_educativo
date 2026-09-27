window.ULE = window.ULE || {};

ULE.ads = (function () {
  'use strict';

  // Los anuncios se obtienen SIEMPRE a través de ULE.loader.loadAds(): este
  // módulo no sabe si vienen de data/anuncios.json o de la API (docs/arquitectura.md §4).
  let cache = null;
  // Mantiene la misma selección de hasta tres anuncios distintos durante la
  // vida de la página. La clave permite que cada página tenga su propio conjunto.
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
    // Deduplicamos por id por si la fuente entregara el mismo anuncio dos veces.
    const seen = new Set();
    return ads.filter(function (ad) {
      if (!isVigente(ad, today)) return false;
      const key = ad.id || JSON.stringify(ad);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
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

  /**
   * Selección ponderada SIN reemplazo: cada anuncio aparece a lo sumo una vez.
   * Nunca se inventan ni se duplican anuncios para rellenar slots
   * (docs/politica_anuncios.md).
   */
  function weightedSample(ads, cantidad) {
    const disponibles = ads.slice();
    const seleccion = [];
    const limite = Math.min(cantidad, disponibles.length);
    while (seleccion.length < limite) {
      const total = disponibles.reduce(function (sum, ad) {
        const peso = Number(ad.peso);
        return sum + (Number.isFinite(peso) && peso >= 1 ? peso : 1);
      }, 0);
      let random = Math.random() * total;
      let elegidoIndex = disponibles.length - 1;
      for (let i = 0; i < disponibles.length; i++) {
        const peso = Number(disponibles[i].peso);
        random -= Number.isFinite(peso) && peso >= 1 ? peso : 1;
        if (random <= 0) {
          elegidoIndex = i;
          break;
        }
      }
      seleccion.push(disponibles[elegidoIndex]);
      disponibles.splice(elegidoIndex, 1);
    }
    return seleccion;
  }

  async function getSelectedAds(pagina) {
    const ads = await loadAds();
    const validAds = getValidAds(ads, fechaActual());
    const key = pagina || '__all__';

    if (!selectionCache.has(key)) {
      // Hasta 3, siempre distintos. Con 1 o 2 vigentes se muestran solo esos;
      // no se reutilizan cíclicamente para completar tres espacios.
      const seleccion = weightedSample(validAds, 3);
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

    const seleccion = await getSelectedAds(pagina);

    // Asegura tantos slots como anuncios seleccionados (máx. 3), sin inventar
    // huecos que luego se rellenen con el mismo anuncio.
    let slots = Array.from(container.querySelectorAll(':scope > [data-ad-slot]'));
    while (slots.length < seleccion.length) {
      const slot = document.createElement('div');
      slot.setAttribute('data-ad-slot', '');
      slot.setAttribute('data-ad-horizontal', 'true');
      container.appendChild(slot);
      slots.push(slot);
    }

    // Oculta slots sobrantes si hay más marcados en el HTML que anuncios.
    slots.forEach(function (slot, index) {
      if (index < seleccion.length) {
        renderSlot(slot, seleccion[index]);
      } else {
        renderSlot(slot, null);
      }
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

  return { loadAds, getValidAds, getSelectedAds, getRandomAd, renderSlot, renderSlots, weightedSample };
})();
