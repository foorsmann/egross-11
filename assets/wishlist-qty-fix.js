// assets/wishlist-qty-fix.js
(function(){
  if (!/wishlist/.test(window.location.pathname)) return;
  function updateQty(){
    document.querySelectorAll('input[data-collection-quantity-input]').forEach(input=>{
      const minQty = parseInt(input.getAttribute('data-collection-min-qty') || input.step || '1', 10) || 1;
      const max    = parseInt(input.getAttribute('max') || '0', 10) || 0;
      const display = (max > 0 && max < minQty) ? max : minQty;
      input.value = String(display);
      input.setAttribute('value', String(display));
      const low = (max > 0 && max < minQty);
      input.classList.toggle('is-low-stock', low);
      input.classList.toggle('text-red-600', low);
      const card = input.closest('[data-product-id], .sf__col-item') || input.parentElement;
      const dblBtn = card && (card.querySelector('[data-collection-double-qty]') || card.querySelector('.collection-double-qty-btn'));
      if (dblBtn){
        const disabled = low;
        dblBtn.toggleAttribute('disabled', disabled);
        dblBtn.classList.toggle('is-disabled', disabled);
      }
    });
  }
  document.addEventListener('DOMContentLoaded', updateQty);
  new MutationObserver(updateQty).observe(document.documentElement, {childList: true, subtree: true});
})();
