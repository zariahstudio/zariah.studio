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
  let cachedProducts = null;
  let cachedSelections = {};
  function selectProducts(config) {
    if (cachedProducts !== PRODUCTS) {
      cachedProducts = PRODUCTS;
      cachedSelections = {};
    }
    if (cachedSelections[config.id]) return cachedSelections[config.id];
    const tagged = PRODUCTS.filter(function (product) {
      const badge = String(product.badge || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      if (config.badge === 'bestseller') {
        return product.isBestseller === true || badge === 'bestseller' || badge === 'bestsellers';
      }
      return product.isFeatured === true ||
        ['new', 'newarrival', 'newarrivals', 'justarrived', 'newcollection'].includes(badge);
    });
    const taggedIds = new Set(tagged.map(function (product) { return String(product.id); }));
    const remaining = PRODUCTS.filter(function (product) {
      return !taggedIds.has(String(product.id));
    });
    // Stable catalogue order prevents the homepage from reshuffling on refresh.
    cachedSelections[config.id] = tagged.concat(remaining).slice(0, 8);
    return cachedSelections[config.id];
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
      const matches = selectProducts(config);
      const taggedIdsForSection = new Set(PRODUCTS.filter(function (product) {
        const badge = String(product.badge || '').trim().toLowerCase().replace(/[\\s_-]+/g, '');
        return config.badge === 'bestseller'
          ? product.isBestseller === true || badge === 'bestseller' || badge === 'bestsellers'
          : product.isFeatured === true || ['new', 'newarrival', 'newarrivals', 'justarrived', 'newcollection'].includes(badge);
      }).map(function (product) { return String(product.id); }));
      section.hidden = matches.length === 0;
      if (!matches.length) { grid.replaceChildren(); return; }
      grid.innerHTML = matches.map(function (product) {
        const name = escapeHtml(product.name);
        const id = escapeHtml(product.id);
      const href = escapeHtml('/products/' + encodeURIComponent(String(product.id || product.sku || '').toLowerCase()) + '/');
        const image = escapeHtml(productImage(product));
        const price = escapeHtml(product.price);
        const soldOut = Boolean(product.soldOut);
        return '<a class="z-mobile-home-card" href="' + href + '" aria-label="View ' + name + '">' +
          '<span class="z-mobile-home-media"><span class="z-mobile-home-badge">' +
          (soldOut ? 'Sold Out' : (taggedIdsForSection.has(String(product.id)) ? escapeHtml(config.label) : 'Explore More')) + '</span><img src="' + image +
          '" alt="' + name + '" loading="lazy" decoding="async"></span>' +
          '<span class="z-mobile-home-name">' + name + '</span>' +
          '<span class="z-mobile-home-price">' + price + '</span></a>';
      }).join('');
    });
  }
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('zariah:catalogue-updated', function () { cachedProducts = null; cachedSelections = {}; render(); });
  window.addEventListener('resize', render);
  render();
})();
