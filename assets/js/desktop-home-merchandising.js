/* ZARIAH desktop homepage merchandising — desktop-only renderer.
   Intentionally separate from homepage-mobile-home.js to keep mobile behavior unchanged. */
(function () {
  'use strict';
  const desktop = window.matchMedia('(min-width: 769px)');
  const sections = [
    { id: 'zMobileNewCollection', gridId: 'zMobileNewCollectionGrid', badge: 'new', label: 'New Arrivals' },
    { id: 'zMobileBestSellers', gridId: 'zMobileBestSellersGrid', badge: 'bestseller', label: 'Best Sellers' }
  ];
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function productImage(product) {
    const folder = String(product.assetFolder || product.sku || product.id || '').toLowerCase();
    return product.remoteImages && product.remoteImages.front
      ? product.remoteImages.front
      : 'images/products/' + encodeURIComponent(folder) + '/front.webp';
  }
  function render() {
    if (!desktop.matches || window.location.pathname !== '/' ||
        new URLSearchParams(window.location.search).has('product') ||
        !document.body.classList.contains('z-homepage-route') ||
        typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return;
    sections.forEach(function (config) {
      const section = document.getElementById(config.id);
      const grid = document.getElementById(config.gridId);
      if (!section || !grid) return;
      const matches = PRODUCTS.filter(function (product) {
        const badge = String(product.badge || '').trim().toLowerCase().replace(/[\\s_-]+/g, '');
        if (config.badge === 'bestseller') {
          return product.isBestseller === true || badge === 'bestseller' || badge === 'bestsellers';
        }
        return product.isFeatured === true ||
          ['new', 'newarrival', 'newarrivals', 'justarrived', 'newcollection'].includes(badge);
      }).slice(0, 8);
      section.hidden = matches.length === 0;
      if (!matches.length) { grid.replaceChildren(); return; }
      grid.innerHTML = matches.map(function (product) {
        const name = escapeHtml(product.name);
        const id = escapeHtml(product.id);
        const image = escapeHtml(productImage(product));
        const price = escapeHtml(product.price);
        const soldOut = Boolean(product.soldOut);
        return '<button class="z-mobile-home-card" type="button" data-z-mobile-product="' + id + '" aria-label="View ' + name + '">' +
          '<span class="z-mobile-home-media"><span class="z-mobile-home-badge">' +
          (soldOut ? 'Sold Out' : escapeHtml(config.label)) + '</span><img src="' + image +
          '" alt="' + name + '" loading="lazy" decoding="async"></span>' +
          '<span class="z-mobile-home-name">' + name + '</span>' +
          '<span class="z-mobile-home-price">' + price + '</span></button>';
      }).join('');
      grid.querySelectorAll('[data-z-mobile-product]').forEach(function (card) {
        card.addEventListener('click', function () {
          const id = card.getAttribute('data-z-mobile-product');
          if (typeof window.navigateToProduct === 'function') window.navigateToProduct(id);
          else window.location.href = window.location.pathname + '?product=' + encodeURIComponent(id);
        });
      });
    });
  }
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('zariah:catalogue-updated', render);
  window.addEventListener('resize', render);
  render();
})();
