(function () {
  'use strict';
  if (window.__ZARIAH_BUY_NOW_V2__) return;
  window.__ZARIAH_BUY_NOW_V2__ = true;

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'z-cart-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1800);
  }

  function addProduct(button, buyNow) {
    const cart = window.ZariahCart;
    if (!cart) { showToast('Your bag is temporarily unavailable. Please try again.'); return false; }
    const result = cart.add({
      id: button.dataset.productId,
      name: button.dataset.productName,
      price: button.dataset.productPrice,
      image: button.dataset.productImage,
      soldOut: button.disabled || button.classList.contains('disabled')
    });
    if (!result.ok) {
      showToast(result.reason === 'limit' ? 'Maximum quantity reached for this bag.' : 'This bag could not be added. Please try again.');
      return false;
    }
    if (typeof window.ZARIAH_TRACK_EVENT === 'function') {
      window.ZARIAH_TRACK_EVENT('cart_add', button.dataset.productId || button.dataset.productName || '');
    }
    if (buyNow) {
      buyNow.disabled = true;
      buyNow.textContent = 'PROCEEDING TO CHECKOUT…';
      window.location.assign('/pages/checkout/');
    } else {
      const original = button.dataset.originalLabel || button.textContent.trim() || 'ADD TO BAG';
      button.dataset.originalLabel = original;
      button.textContent = 'ADDED TO BAG';
      button.disabled = true;
      showToast('Added to your bag');
      window.dispatchEvent(new Event('zariah:open-cart'));
      window.setTimeout(() => {
        if (button.isConnected) { button.textContent = original; button.disabled = false; }
      }, 1200);
    }
    return true;
  }

  function mount() {
    document.querySelectorAll('.z-add-cart').forEach(button => {
      if (button.dataset.buyNowBound === 'true') return;
      button.dataset.buyNowBound = 'true';
      if (!button.disabled && !button.classList.contains('disabled')) {
        let buyNow = button.parentElement.querySelector('.z-product-buy-now');
        if (!buyNow) {
          buyNow = document.createElement('button');
          buyNow.type = 'button';
          buyNow.className = 'order-btn z-buy-now z-product-buy-now';
          buyNow.textContent = 'BUY NOW';
          buyNow.setAttribute('aria-label', 'Buy ' + (button.dataset.productName || 'this bag') + ' now');
          buyNow.style.setProperty('display', 'block', 'important');
          buyNow.style.setProperty('width', '100%', 'important');
          buyNow.style.setProperty('margin-top', '10px', 'important');
          buyNow.style.setProperty('background', '#b99768', 'important');
          buyNow.style.setProperty('color', '#ffffff', 'important');
          buyNow.style.setProperty('border', '1px solid #b99768', 'important');
          buyNow.style.setProperty('cursor', 'pointer', 'important');
          buyNow.style.setProperty('font', '500 10px Inter, sans-serif', 'important');
          buyNow.style.setProperty('letter-spacing', '.15em', 'important');
          buyNow.style.setProperty('padding', '16px 20px', 'important');
          buyNow.style.setProperty('text-transform', 'uppercase', 'important');
          button.insertAdjacentElement('afterend', buyNow);
        }
        buyNow.addEventListener('click', () => addProduct(button, buyNow));
      }
      button.addEventListener('click', () => addProduct(button, null));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();