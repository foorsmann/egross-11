// assets/slider-qty-fix.js
(function () {
  // Tipurile de secțiuni în care există slidere de produse
  const SLIDER_TYPES = new Set([
    'recently-viewed',
    'product-recommendations',
    'foxkit-related-products',
    'featured-collection',
    'product-tabs'
  ]);

  // Verifică dacă inputul aparține unui slider (secțiunea are data-section-type din listă)
  function isSliderInput(input) {
    const sec = input.closest('[data-section-type]');
    return sec && SLIDER_TYPES.has(sec.getAttribute('data-section-type'));
  }

  // Ajustează afişarea și starea pentru un input de cantitate din slider
  function initInput(input) {
    if (!isSliderInput(input)) return;
    // Cantitatea minimă (pasul) – din data-collection-min-qty sau atributul step
    const step = parseInt(input.getAttribute('data-collection-min-qty'), 10) ||
                 parseInt(input.step || '1', 10) || 1;
    // Stocul disponibil – din atributul max (setat de template)
    const max = parseInt(input.max || '0', 10) || 0;
    // Valoarea ce trebuie afişată: stocul dacă e mai mic decât pasul, altfel pasul
    const display = (max > 0 && max < step) ? max : step;
    // Setează atât proprietatea cât şi atributul value
    input.value = String(display);
    input.setAttribute('value', String(display));
    // Colorează roşu dacă stocul este sub pas
    if (max > 0 && max < step) {
      input.classList.add('text-red-600');
      input.style.color = '#e3342f';
    } else {
      input.classList.remove('text-red-600');
      input.style.color = '';
    }
    // Actualizează starea butoanelor +/–
    const wrap = input.closest('collection-quantity-input') || input.parentElement;
    if (wrap) {
      const plus  = wrap.querySelector('[data-collection-quantity-selector="increase"]');
      const minus = wrap.querySelector('[data-collection-quantity-selector="decrease"]');
      const val = display;
      if (plus)  plus.disabled  = isFinite(max) && val >= max;
      if (minus) minus.disabled = val <= step;
    }
    // Dezactivează butonul „Adaugă încă …” dacă stocul este sub pas
    const card  = input.closest('[data-product-id], [data-collection-product-id]') ||
                  input.closest('[data-section-type]');
    const dblBtn = card && card.querySelector('.collection-double-qty-btn[data-collection-product-id]');
    if (dblBtn) dblBtn.disabled = (max > 0 && max < step);
  }

  // Procesează toate inputurile relevante dintr‑un container
  function processContainer(container) {
    container.querySelectorAll('input[data-collection-quantity-input]').forEach(initInput);
  }

  // Iniţializează la încărcarea DOM-ului
  function init() {
    document.querySelectorAll('[data-section-type]').forEach(sec => {
      if (SLIDER_TYPES.has(sec.getAttribute('data-section-type'))) {
        processContainer(sec);
      }
    });
  }

  // Rulează init imediat după DOMContentLoaded sau direct dacă DOM-ul e gata
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Observă mutaţiile DOM (sliderele injectează HTML dinamic)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        // Dacă nodul adăugat este un input de colecţie
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
