window.ULE = window.ULE || {};

ULE.ads = (function () {
  'use strict';

  const DATA_PATH = 'data/anuncios.json';
  let cache = null;

  async function loadAds() {
    if (cache) return cache;
    try {
      const response = await fetch(DATA_PATH, { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      cache = Array.isArray(data.anuncios) ? data.anuncios : [];
    } catch (error) {
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

  function getValidAds(ads, today, pagina) {
    return ads.filter(function (ad) {
      if (!isVigente(ad, today)) return false;
      if (!pagina || !Array.isArray(ad.paginas) || !ad.paginas.length) return true;
      return ad.paginas.includes('todas') || ad.paginas.includes(pagina);
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

  async function getRandomAd(pagina) {
    const ads = await loadAds();
    return weightedRandom(getValidAds(ads, fechaActual(), pagina));
  }

  function renderSlot(slot, ad) {
    if (!ad) {
      slot.hidden = true;
      slot.replaceChildren();
      return;
    }

    slot.hidden = false;
    slot.replaceChildren();

    const card = document.createElement('ad-card');
    // Mapeo explícito: los campos del JSON (español) no siempre coinciden
    // 1:1 con el nombre del atributo que lee <ad-card> (ver components.js).
    // "imagen" -> "data-image" es el caso importante: si se generaba como
    // "data-imagen" el componente nunca lo leía y la imagen no se mostraba.
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
    const slots = Array.from(scope.querySelectorAll('[data-ad-slot]'));
    if (!slots.length) return [];

    const ads = await loadAds();
    const validAds = getValidAds(ads, fechaActual(), pagina);
    slots.forEach(function (slot) {
      renderSlot(slot, weightedRandom(validAds));
    });
    return validAds;
  }

  function init() {
    const pagina = document.body && document.body.dataset.adPage;
    const start = function () { renderSlots(document, pagina); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  init();

  return { loadAds, getValidAds, getRandomAd, renderSlot, renderSlots };
})();
