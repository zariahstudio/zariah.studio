(function () {
  'use strict';

  const KEY = 'zariah_cart_v1';
  const MAX_QTY = 10;
  const FALLBACK_IMAGE = '/images/brand/favicon.png';

  const number = value => {
    const parsed = Number(String(value ?? '').replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
  };

  const safeImage = value => {
    const raw = String(value || '');
    if (!raw) return FALLBACK_IMAGE;
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    try {
      const url = new URL(raw, window.location.origin);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : FALLBACK_IMAGE;
    } catch (_) {
      return FALLBACK_IMAGE;
    }
  };

  function normalize(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      id: String(item?.id || item?.sku || '').trim().toLowerCase().slice(0, 80),
      name: String(item?.name || 'ZARIAH Bag').trim().slice(0, 160),
      price: number(item?.price),
      image: safeImage(item?.image),
      qty: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(item?.qty) || 1)))
    })).filter(item => item.id && item.price > 0);
  }

  function read() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || '[]'));
    } catch (_) {
      return [];
    }
  }

  function count(items = read()) {
    return items.reduce((total, item) => total + item.qty, 0);
  }

  function subtotal(items = read()) {
    return items.reduce((total, item) => total + item.price * item.qty, 0);
  }

  function updateCount(items = read()) {
    const total = count(items);
    document.querySelectorAll('[data-cart-count]').forEach(node => {
      node.textContent = String(total);
    });
    return total;
  }

  function write(items) {
    const cleanItems = normalize(items);
    try {
      localStorage.setItem(KEY, JSON.stringify(cleanItems));
      const total = updateCount(cleanItems);
      window.dispatchEvent(new CustomEvent('zariah:cart-updated', {
        detail: { count: total, subtotal: subtotal(cleanItems), items: cleanItems }
      }));
      return true;
    } catch (_) {
      return false;
    }
  }

  function add(product) {
    if (!product || product.soldOut) return { ok: false, reason: 'unavailable' };
    const id = String(product.id || product.sku || '').trim().toLowerCase().slice(0, 80);
    const name = String(product.name || 'ZARIAH Bag').trim().slice(0, 160);
    const price = number(product.price);
    if (!id || !price) return { ok: false, reason: 'invalid-product' };

    const items = read();
    const found = items.find(item => item.id === id);
    if (found) {
      if (found.qty >= MAX_QTY) return { ok: false, reason: 'limit' };
      found.qty += 1;
      found.name = name;
      found.price = price;
      found.image = safeImage(product.image || found.image);
    } else {
      items.push({ id, name, price, image: safeImage(product.image), qty: 1 });
    }

    if (!write(items)) return { ok: false, reason: 'storage' };
    return { ok: true, count: count(items), items };
  }

  function setQuantity(id, quantity) {
    const key = String(id || '').trim().toLowerCase();
    if (!key) return { ok: false, reason: 'invalid-id' };
    const items = read();
    const item = items.find(entry => entry.id === key);
    if (!item) return { ok: false, reason: 'not-found' };
    item.qty = Math.max(1, Math.min(MAX_QTY, Math.floor(Number(quantity) || 1)));
    if (!write(items)) return { ok: false, reason: 'storage' };
    return { ok: true, count: count(items), items };
  }

  function remove(id) {
    const key = String(id || '').trim().toLowerCase();
    if (!key) return { ok: false, reason: 'invalid-id' };
    const items = read();
    const next = items.filter(item => item.id !== key);
    if (next.length === items.length) return { ok: false, reason: 'not-found' };
    if (!write(next)) return { ok: false, reason: 'storage' };
    return { ok: true, count: count(next), items: next };
  }

  function clear() {
    if (!write([])) return false;
    return true;
  }

  window.ZariahCart = {
    read,
    count,
    subtotal,
    updateCount,
    add,
    setQuantity,
    remove,
    clear,
    key: KEY,
    maxQuantity: MAX_QTY
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updateCount(), { once: true });
  } else {
    updateCount();
  }

  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) {
      updateCount();
      window.dispatchEvent(new CustomEvent('zariah:cart-updated', {
        detail: { count: count(), subtotal: subtotal(), items: read(), external: true }
      }));
    }
  });
})();
