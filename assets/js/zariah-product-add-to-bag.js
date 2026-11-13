(function () {
  'use strict';

  const buttons = document.querySelectorAll('.z-add-cart');

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'z-cart-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1800);
  }

  buttons.forEach(button => {
    if (!button.disabled && !button.classList.contains('disabled')) {
      const buyNow = document.createElement('button');
      buyNow.type = 'button';
      buyNow.className = 'order-btn z-buy-now';
      buyNow.textContent = 'BUY NOW';
      buyNow.setAttribute('aria-label', 'Buy ' + (button.dataset.productName || 'this bag') + ' now');
      buyNow.style.cssText = 'display:block;width:100%;margin-top:10px;background:#b99768;color:#fff;border:1px solid #b99768;cursor:pointer;font:500 10px Inter,sans-serif;letter-spacing:.15em;padding:16px 20px;text-transform:uppercase;';
      button.insertAdjacentElement('afterend', buyNow);
      buyNow.addEventListener('click', () => {
        const cart = window.ZariahCart;
        if (!cart) {
          showToast('Your bag is temporarily unavailable. Please try again.');
          return;
        }
        const result = cart.add({
          id: button.dataset.productId,
          name: button.dataset.productName,
          price: button.dataset.productPrice,
          image: button.dataset.productImage,
          soldOut: button.disabled || button.classList?.contains?.('disabled')
        });
        if (!result.ok) {
          showToast(result.reason === 'limit' ? 'Maximum quantity reached for this bag.' : 'This bag could not be added. Please try again.');
          return;
        }
        buyNow.disabled = true;
        buyNow.textContent = 'PROCEEDING TO CHECKOUT…';
        window.location.assign('/pages/checkout/');
      });
    }
    button.addEventListener('click', () => {
      const cart = window.ZariahCart;
      if (!cart) {
        showToast('Your bag is temporarily unavailable. Please try again.');
        return;
      }

      const result = cart.add({
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: button.dataset.productPrice,
        image: button.dataset.productImage,
        soldOut: button.disabled || button.classList?.contains?.('disabled')
      });

      if (!result.ok) {
        showToast(result.reason === 'limit'
          ? 'Maximum quantity reached for this bag.'
          : 'This bag could not be added. Please try again.');
        return;
      }

      const originalLabel = button.dataset.originalLabel || button.textContent.trim() || 'ADD TO BAG';
      button.dataset.originalLabel = originalLabel;
      button.textContent = 'ADDED TO BAG';
      button.disabled = true;
      showToast('Added to your bag');
      window.dispatchEvent(new Event('zariah:open-cart'));
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = originalLabel;
        button.disabled = false;
      }, 1200);
    });
  });
})();
