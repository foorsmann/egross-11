// assets/qty-guard.js
(function(){
  // expune global o functie sigura
  window.QtyGuard = {
    applyToCard(card) {
      if (!card || card.__qtyGuardApplied) return;
      const minQty = parseInt(card.getAttribute('data-min-qty') || '1', 10);
      const available = parseInt(card.getAttribute('data-available') || '0', 10);

      const valueEl = card.querySelector('[data-qty-value]');
      const doubleBtn = card.querySelector('[data-double-qty]');

      if (!valueEl) { card.__qtyGuardApplied = true; return; }

      // decide valoarea afisata initial
      const displayQty = (available > 0 && available < minQty) ? available : minQty;

      if ('value' in valueEl) {
        valueEl.value = String(displayQty);
      } else {
        valueEl.textContent = String(displayQty);
      }

      // stil rosu cand stoc < min
      valueEl.classList.toggle('is-low-stock', (available > 0 && available < minQty));

      // dezactiveaza dublarea cand stoc insuficient
      if (doubleBtn) {
        const disabled = !(available >= minQty);
        doubleBtn.toggleAttribute('disabled', disabled);
        doubleBtn.classList.toggle('is-disabled', disabled);
        // actualizeaza si textul, daca e nevoie
        const tpl = doubleBtn.getAttribute('data-label-template');
        if (tpl && !disabled) doubleBtn.textContent = tpl;
      }

      // NU schimba alte comportamente (plus/minus etc.)
      card.__qtyGuardApplied = true;
    },

    // aplica pe un container de slider
    applyToSliderRoot(root) {
      if (!root) return;
      const cards = root.querySelectorAll('[data-is-slider-card="true"]');
      cards.forEach(this.applyToCard);
    }
  };
})();

