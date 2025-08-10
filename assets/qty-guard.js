// assets/qty-guard.js
(function () {
  // === CONFIG: radacini posibile pentru slidere ===
  const ROOT_SELECTORS = [
    // cele observate in raport
    '.recently-viewed',
    '.product-recommendations',
    '.foxkit-related-products',
    '.sf__featured-collection',
    '.featured-slider',
    '.sf__ms--slider',
    // fallback-uri generice
    '.sf__product-recommendations',
    '.rvp-section',
    '[data-slider]',
    '[data-section-type*="slider"]',
    '[data-section-type*="recommend"]',
    '[data-section-type*="recent"]'
  ];

  function $q(root, sel) { return root ? root.querySelector(sel) : null; }
  function $qa(root, sel) { return root ? root.querySelectorAll(sel) : []; }

  // ruleaza "la sigur" dupa ce alte scripturi au apucat sa modifice DOM
  function scheduleAfterFrame(fn) {
    // 2 x rAF ca sa treaca si layout/reflow-urile intermediare
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  function findQtyValueEl(card) {
    // hook-ul nostru
    let el = $q(card, '[data-qty-value]');
    if (el) return el;
    // fallback-uri (nu schimbam stilurile existente)
    el = $q(card, '.qty-value, .collection-qty-element, .quantity-input__element, [data-quantity-display]');
    return el;
  }

  function findDoubleBtn(card) {
    let el = $q(card, '[data-double-qty]');
    if (el) return el;
    el = $q(card, '.double-qty-btn, .collection-double-qty-btn, button[data-collection-double-qty]');
    return el;
  }

  function readData(card) {
    // preferam JSON-ul inline din card
    const jsonEl = $q(card, 'script[type="application/json"][data-slider-product]');
    if (jsonEl) {
      try {
        const data = JSON.parse(jsonEl.textContent.trim());
        return {
          minQty: parseInt(data.min_qty || 1, 10),
          available: parseInt(data.available || 0, 10)
        };
      } catch (e) { /* ignore */ }
    }
    // fallback pe data-atribute daca exista
    const minAttr = card.getAttribute('data-min-qty');
    const avAttr  = card.getAttribute('data-available');
    return {
      minQty: parseInt(minAttr || '1', 10),
      available: parseInt(avAttr || '0', 10)
    };
  }

  function applyToCard(card, report) {
    if (!card) return;
    // permitem rerulari (nu blocam cu __applied) pentru ca alte scripturi pot reseta valoarea
    const { minQty, available } = readData(card);
    const valueEl  = findQtyValueEl(card);
    const doubleBt = findDoubleBtn(card);

    const lowStock = available > 0 && available < minQty;
    const display  = lowStock ? available : (minQty > 0 ? minQty : 1);

    if (valueEl) {
      if ('value' in valueEl) {
        valueEl.value = String(display);
        // unele scripturi citesc atributul value, nu prop-ul
        valueEl.setAttribute('value', String(display));
      } else {
        valueEl.textContent = String(display);
      }
      valueEl.classList.toggle('is-low-stock', lowStock);
      // marcaj pt debug
      valueEl.setAttribute('data-qg-display', String(display));
    }

    if (doubleBt) {
      const disabled = !(available >= minQty);
      doubleBt.toggleAttribute('disabled', disabled);
      doubleBt.setAttribute('aria-disabled', String(disabled));
      doubleBt.classList.toggle('is-disabled', disabled);
      const tpl = doubleBt.getAttribute('data-label-template');
      if (tpl && !disabled) doubleBt.textContent = tpl;
    }

    if (report) {
      report.cards.push({
        id: card.getAttribute('data-product-id') || null,
        minQty, available, display, lowStock,
        hadValueEl: !!valueEl, hadDoubleBtn: !!doubleBt
      });
    }
  }

  function getSliderRoots() {
    const roots = new Set();
    ROOT_SELECTORS.forEach(sel => document.querySelectorAll(sel).forEach(n => roots.add(n)));

    // fallback: daca vedem swiper/splide wrappers, urcam la sectiune/container
    document.querySelectorAll('.swiper, .swiper-container, .swiper-wrapper, .splide, .splide__track').forEach(w => {
      const root = w.closest('[data-section-type], section, .shopify-section, .sf-section') || w.parentElement;
      if (root) roots.add(root);
    });

    return Array.from(roots);
  }

  function runAll() {
    const report = { ranAt: new Date().toISOString(), roots: [], cards: [] };
    const roots = getSliderRoots();
    roots.forEach(root => {
      report.roots.push(root.className || root.id || root.tagName);
      root.querySelectorAll('[data-is-slider-card="true"]').forEach(card => applyToCard(card, report));
    });
    window.__qtyguard_report = report;
  }

  // ruleaza la momente cheie, dar intotdeauna "dupa cadru"
  function safeRunAll() { scheduleAfterFrame(runAll); }

  document.addEventListener('DOMContentLoaded', safeRunAll);
  window.addEventListener('load', safeRunAll);
  document.addEventListener('shopify:section:load', safeRunAll);
  document.addEventListener('shopify:section:unload', safeRunAll);
  window.addEventListener('slider:init', safeRunAll);
  window.addEventListener('slider:updated', safeRunAll);

  // cand colectia reinitiaza cantitatile, rescrie; relansam dupa
  window.addEventListener('collectionQuickAdd:initialized', safeRunAll);
  window.addEventListener('collectionQuickAdd:mutated', safeRunAll);

  // supraveghere generala pt injectari (recommendations/recent viewed etc.)
  const mo = new MutationObserver(() => safeRunAll());
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.QtyGuard = { runAll: safeRunAll };
})();

