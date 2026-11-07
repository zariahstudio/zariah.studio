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
      window.setTimeout(() => {
        if (!button.isConnected) return;
        button.textContent = originalLabel;
        button.disabled = false;
      }, 1200);
    });
  });
})();
