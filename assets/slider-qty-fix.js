// assets/slider-qty-fix.js
(function () {
  const SLIDER_TYPES = new Set([
    'recently-viewed',
    'product-recommendations',
    'foxkit-related-products',
    'featured-collection',
    'product-tabs'
  ]);

  function isSliderInput(input) {
    const sec = input.closest('[data-section-type]');
    return sec && SLIDER_TYPES.has(sec.getAttribute('data-section-type'));
  }

  function findDoubleQtyButton(scope) {
    if (!scope) return null;
    // Detectie robusta pentru toate variantele intalnite in tema
    return (
      scope.querySelector('[data-collection-double-qty]') ||
      scope.querySelector('.collection-double-qty-btn') ||
      scope.querySelector('.double-qty-btn') ||
      scope.querySelector('button[name="addAnother"], button[data-add-another]')
    );
  }

  function setDoubleBtnDisabled(btn, disabled) {
    if (!btn) return;
    if (disabled) {
      btn.setAttribute('disabled', 'true');
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('is-disabled');
      // fortam si vizual, in caz ca CSS-ul nu este prezent
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    } else {
      btn.removeAttribute('disabled');
      btn.setAttribute('aria-disabled', 'false');
      btn.classList.remove('is-disabled');
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
  }

  function initInput(input) {
    if (!isSliderInput(input)) return;

    const step = parseInt(input.getAttribute('data-collection-min-qty'), 10) ||
                 parseInt(input.step || '1', 10) || 1;
    const max  = parseInt(input.max || '0', 10) || 0;

    // Ce afisam: stocul daca este sub pas, altfel pasul
    const display = (max > 0 && max < step) ? max : step;

    // Setam atat prop cat si atributul value (unele scripturi citesc atributul)
    input.value = String(display);
    input.setAttribute('value', String(display));

    // Low-stock styling
    const isLow = (max > 0 && max < step);
    if (isLow) {
      input.classList.add('text-red-600');
      input.style.color = '#e3342f';
    } else {
      input.classList.remove('text-red-600');
      input.style.color = '';
    }

    // Actualizam starea butoanelor +/-
    const wrap = input.closest('collection-quantity-input') || input.parentElement;
    if (wrap) {
      const plus  = wrap.querySelector('[data-collection-quantity-selector="increase"]');
      const minus = wrap.querySelector('[data-collection-quantity-selector="decrease"]');
      if (plus)  plus.disabled  = isFinite(max) && display >= max; // nu poti depasi stocul
      if (minus) minus.disabled = display <= step;                  // nu cobori sub pas
    }

    // „Adauga inca …” trebuie dezactivat cand stoc < pas
    const card = input.closest('.sf__pcard, .p-card, .product-card, .sf__col-item, [data-product-id], .swiper-slide, [data-section-type]');
    const dblBtn = findDoubleQtyButton(card);
    setDoubleBtnDisabled(dblBtn, isLow);
  }

  function processContainer(container) {
    container.querySelectorAll('input[data-collection-quantity-input]').forEach(initInput);
  }

  function init() {
    document.querySelectorAll('[data-section-type]').forEach(sec => {
      if (SLIDER_TYPES.has(sec.getAttribute('data-section-type'))) {
        processContainer(sec);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Supravegheaza injectarile dinamice (recent/recommendations/etc.)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches && node.matches('input[data-collection-quantity-input]')) {
          initInput(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('input[data-collection-quantity-input]').forEach(initInput);
        }
      });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
