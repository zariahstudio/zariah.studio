/* ZARIAH mobile homepage merchandising.
   Uses the same published PRODUCTS catalogue and existing product-detail route. */
(function () {
  'use strict';

  const sections = [
    { id: 'zMobileNewCollection', gridId: 'zMobileNewCollectionGrid', badge: 'new', label: 'New Collection' },
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

  function renderSection(config, products) {
    const section = document.getElementById(config.id);
    const grid = document.getElementById(config.gridId);
    if (!section || !grid) return;

    const matches = products.filter(function (product) {
      // Normalize CMS labels consistently (including spaces) and prefer the
      // explicit merchandising flags supplied by the published catalogue.
      const badge = String(product.badge || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      if (config.badge === 'bestseller') {
        return product.isBestseller === true || badge === 'bestseller' || badge === 'bestsellers';
      }
      return product.isFeatured === true ||
        ['new', 'newarrival', 'newarrivals', 'justarrived', 'newcollection'].includes(badge);
    }).slice(0, 4);

    section.hidden = matches.length === 0;
    if (!matches.length) {
      grid.replaceChildren();
      return;
    }

    grid.innerHTML = matches.map(function (product) {
      const name = escapeHtml(product.name);
      const id = escapeHtml(product.id);
      const href = escapeHtml('/products/' + encodeURIComponent(String(product.id || product.sku || '').toLowerCase()) + '/');
      const image = escapeHtml(productImage(product));
      const price = escapeHtml(product.price);
      const soldOut = Boolean(product.soldOut);
      return '<a class="z-mobile-home-card" href="' + href + '" aria-label="View ' + name + '">' +
        '<span class="z-mobile-home-media">' +
          '<span class="z-mobile-home-badge">' + (soldOut ? 'Sold Out' : escapeHtml(config.label)) + '</span>' +
          '<img src="' + image + '" alt="' + name + '" loading="lazy" decoding="async">' +
        '</span>' +
        '<span class="z-mobile-home-name">' + name + '</span>' +
        '<span class="z-mobile-home-price">' + price + '</span>' +
      '</a>';
    }).join('');

  }

  function render() {
    const isHome = window.location.pathname === '/' && !new URLSearchParams(window.location.search).has('product') && !document.body.classList.contains('z-product-route');
    document.body.classList.toggle('z-homepage-route', isHome);
    if (!isHome) {
      sections.forEach(function (config) {
        const section = document.getElementById(config.id);
        if (section) section.hidden = true;
      });
      return;
    }
    if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) return;
    sections.forEach(function (section) {
      renderSection(section, PRODUCTS);
    });
  }

  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('zariah:catalogue-updated', render);
  render();
})();
