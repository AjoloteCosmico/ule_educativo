window.ULE = window.ULE || {};

/* ads.js — selección y renderizado de anuncios vigentes. */
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
      return cache;
    } catch (error) {
      console.warn('[ULE.ads] No se pudieron cargar los anuncios:', error);
      cache = [];
      return cache;
    }
  }

  function fechaActual() {
    const ahora = new Date();
    const y = ahora.getFullYear();
    const m = String(ahora.getMonth() + 1).padStart(2, '0');
    const d = String(ahora.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function isVigente(ad, today) {
    if (!ad || ad.activo !== true) return false;
    if (ad.vigencia_inicio && ad.vigencia_inicio > today) return false;
    if (ad.vigencia_fin && ad.vigencia_fin < today) return false;
    return true;
  }

  function getValidAds(ads, today) {
    return ads.filter(function (ad) {
      return isVigente(ad, today);
    });
  }

  function weightedRandom(ads) {
    if (!ads.length) return null;

    const totalWeight = ads.reduce(function (sum, ad) {
      const peso = Number(ad.peso);
      return sum + (Number.isFinite(peso) && peso > 0 ? peso : 1);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const ad of ads) {
      const peso = Number(ad.peso);
      random -= Number.isFinite(peso) && peso > 0 ? peso : 1;
      if (random <= 0) return ad;
    }

    return ads[ads.length - 1];
  }

  async function getRandomAd() {
    const ads = await loadAds();
    return weightedRandom(getValidAds(ads, fechaActual()));
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
    if (ad.imagen) card.setAttribute('data-image', ad.imagen);
    if (ad.contacto) card.setAttribute('data-contacto', ad.contacto);
    if (ad.slogan) card.setAttribute('data-slogan', ad.slogan);
    if (ad.descripcion) card.setAttribute('data-descripcion', ad.descripcion);
    if (ad.vigencia_fin) card.setAttribute('data-vigencia-fin', ad.vigencia_fin);
    if (ad.enlace) card.setAttribute('data-enlace', ad.enlace);

    if (slot.dataset.adHorizontal === 'true') {
      card.setAttribute('horizontal', '');
    }

    slot.appendChild(card);
  }

  async function renderSlots(root) {
    const scope = root || document;
    const slots = Array.from(scope.querySelectorAll('[data-ad-slot]'));
    if (!slots.length) return [];

    const ads = await loadAds();
    const validAds = getValidAds(ads, fechaActual());

    slots.forEach(function (slot) {
      renderSlot(slot, weightedRandom(validAds));
    });

    return validAds;
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        renderSlots();
      }, { once: true });
    } else {
      renderSlots();
    }
  }

  init();

  return {
    loadAds: loadAds,
    getValidAds: getValidAds,
    getRandomAd: getRandomAd,
    renderSlot: renderSlot,
    renderSlots: renderSlots
  };
})();
