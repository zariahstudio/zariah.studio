/* ═══════════════════════════════════════
   BAG ILLUSTRATION SYSTEM
═══════════════════════════════════════ */
function getStroke(collection) {
  return collection === 'Noir' ? 'rgba(160,140,200,0.55)' : 'rgba(184,150,90,0.5)';
}
function getCardBg(p) {
  if (p.collection === 'Essence')   return 'linear-gradient(145deg,#A69C94 0%,#77716D 100%)';
  if (p.collection === 'Signature') return 'linear-gradient(145deg,#9A9088 0%,#625D59 100%)';
  return 'linear-gradient(145deg,#18181e 0%,#0e0e14 100%)';
}
const BAG_SVGS = {
  'Shoulder Bag': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:75%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><rect x="18" y="110" width="264" height="255" rx="5" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><path d="M18 110 Q18 64 60 52 L240 52 Q282 52 282 110" fill="rgba(184,150,90,0.04)" stroke="${s}" stroke-width="1.5"/><path d="M80 52 Q80 20 100 16 Q130 12 130 52" stroke="${s}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M170 52 Q170 20 200 16 Q220 12 220 52" stroke="${s}" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="125" y="95" width="50" height="28" rx="3" fill="rgba(184,150,90,0.15)" stroke="${s}" stroke-width="1.5"/><circle cx="150" cy="109" r="7" fill="rgba(184,150,90,0.4)"/><line x1="18" y1="240" x2="282" y2="240" stroke="${s}" stroke-width="1" opacity="0.5"/><rect x="30" y="123" width="240" height="228" rx="2" fill="none" stroke="${s}" stroke-width="0.8" stroke-dasharray="4 5" opacity="0.5"/></svg>`,
  'Crossbody': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" aria-hidden="true"><rect x="40" y="100" width="220" height="190" rx="7" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><path d="M70 100 Q70 68 100 62 Q150 56 200 62 Q230 68 230 100" fill="none" stroke="${s}" stroke-width="1.5"/><path d="M40 175 Q14 175 12 200 Q10 240 12 280 Q14 300 40 300" fill="none" stroke="${s}" stroke-width="1.2" opacity="0.4"/><circle cx="150" cy="197" r="14" fill="rgba(184,150,90,0.18)" stroke="${s}" stroke-width="1.5"/><circle cx="150" cy="197" r="6" fill="${s}"/><rect x="54" y="112" width="192" height="164" rx="3" fill="none" stroke="${s}" stroke-width="0.8" stroke-dasharray="4 5" opacity="0.4"/></svg>`,
  'Tote': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:78%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><rect x="16" y="140" width="268" height="220" rx="4" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><line x1="90" y1="140" x2="80" y2="100" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><line x1="210" y1="140" x2="220" y2="100" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><path d="M80 100 Q80 68 110 64 Q150 60 190 64 Q220 68 220 100" fill="none" stroke="${s}" stroke-width="2"/><line x1="16" y1="200" x2="284" y2="200" stroke="${s}" stroke-width="1" opacity="0.4"/></svg>`,
  'Top Handle': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:74%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><rect x="22" y="110" width="256" height="250" rx="4" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><line x1="95" y1="110" x2="95" y2="75" stroke="${s}" stroke-width="3" stroke-linecap="round"/><line x1="205" y1="110" x2="205" y2="75" stroke="${s}" stroke-width="3" stroke-linecap="round"/><path d="M95 75 Q95 50 120 48 Q150 45 180 48 Q205 50 205 75" fill="none" stroke="${s}" stroke-width="2"/><line x1="22" y1="165" x2="278" y2="165" stroke="${s}" stroke-width="1" opacity="0.4"/><rect x="34" y="122" width="232" height="225" rx="2" fill="none" stroke="${s}" stroke-width="0.8" stroke-dasharray="4 5" opacity="0.4"/><circle cx="150" cy="148" r="10" fill="rgba(184,150,90,0.2)" stroke="${s}" stroke-width="1.2"/></svg>`,
  'East-West': (s) => `<svg viewBox="0 0 380 260" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:85%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" aria-hidden="true"><rect x="16" y="60" width="348" height="175" rx="6" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><path d="M80 60 Q80 32 110 28 Q190 22 270 28 Q300 32 300 60" fill="none" stroke="${s}" stroke-width="1.5"/><line x1="16" y1="140" x2="364" y2="140" stroke="${s}" stroke-width="1" opacity="0.4"/><circle cx="190" cy="110" r="12" fill="rgba(184,150,90,0.2)" stroke="${s}" stroke-width="1.5"/><rect x="28" y="72" width="324" height="150" rx="2" fill="none" stroke="${s}" stroke-width="0.8" stroke-dasharray="4 5" opacity="0.4"/></svg>`,
  'Flap Bag': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><rect x="24" y="130" width="252" height="215" rx="4" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><path d="M24 130 Q24 78 68 66 L232 66 Q276 66 276 130" fill="rgba(184,150,90,0.04)" stroke="${s}" stroke-width="1.5"/><path d="M88 66 Q88 36 108 32 Q150 28 192 32 Q212 36 212 66" fill="none" stroke="${s}" stroke-width="1.5"/><rect x="120" y="118" width="60" height="26" rx="4" fill="rgba(184,150,90,0.18)" stroke="${s}" stroke-width="1.5"/><circle cx="150" cy="131" r="8" fill="rgba(184,150,90,0.45)"/></svg>`,
  'Bucket Bag': (s) => `<svg viewBox="0 0 300 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:70%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><path d="M50 120 Q40 180 38 240 Q36 310 150 330 Q264 310 262 240 Q260 180 250 120 Z" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><path d="M90 120 Q90 75 110 70 Q150 64 190 70 Q210 75 210 120" fill="none" stroke="${s}" stroke-width="1.5"/><path d="M80 95 Q80 60 100 56 Q150 50 200 56 Q220 60 220 95" stroke="${s}" stroke-width="2" fill="none"/><line x1="60" y1="165" x2="240" y2="165" stroke="${s}" stroke-width="1" opacity="0.4"/></svg>`,
  'Satchel': (s) => `<svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:76%;position:absolute;top:50%;left:50%;transform:translate(-50%,-52%)" aria-hidden="true"><rect x="18" y="110" width="284" height="240" rx="3" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><line x1="90" y1="110" x2="90" y2="76" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><line x1="230" y1="110" x2="230" y2="76" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><path d="M90 76 Q90 48 110 44 Q160 38 210 44 Q230 48 230 76" fill="none" stroke="${s}" stroke-width="2"/><rect x="18" y="175" width="284" height="80" rx="0" fill="rgba(184,150,90,0.04)" stroke="${s}" stroke-width="1" opacity="0.5"/><rect x="120" y="190" width="80" height="50" rx="2" fill="rgba(184,150,90,0.1)" stroke="${s}" stroke-width="1"/></svg>`,
  'Bowling Bag': (s) => `<svg viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:82%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" aria-hidden="true"><ellipse cx="170" cy="185" rx="155" ry="100" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><line x1="90" y1="140" x2="80" y2="100" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><line x1="250" y1="140" x2="260" y2="100" stroke="${s}" stroke-width="2.5" stroke-linecap="round"/><path d="M80 100 Q80 68 110 62 Q170 56 230 62 Q260 68 260 100" fill="none" stroke="${s}" stroke-width="2"/><line x1="40" y1="185" x2="300" y2="185" stroke="${s}" stroke-width="1" opacity="0.4" stroke-dasharray="4 4"/><rect x="142" y="65" width="56" height="18" rx="3" fill="rgba(184,150,90,0.15)" stroke="${s}" stroke-width="1.2"/></svg>`,
  'Underarm Bag': (s) => `<svg viewBox="0 0 300 280" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:72%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)" aria-hidden="true"><rect x="20" y="80" width="260" height="165" rx="8" fill="rgba(184,150,90,0.06)" stroke="${s}" stroke-width="1.5"/><rect x="32" y="92" width="236" height="141" rx="5" fill="none" stroke="${s}" stroke-width="0.8" stroke-dasharray="4 5" opacity="0.5"/><line x1="20" y1="155" x2="280" y2="155" stroke="${s}" stroke-width="1" opacity="0.3"/><circle cx="150" cy="130" r="16" fill="rgba(184,150,90,0.12)" stroke="${s}" stroke-width="1.5"/><circle cx="150" cy="130" r="7" fill="${s}" opacity="0.5"/><path d="M90 80 Q90 55 108 50 Q150 44 192 50 Q210 55 210 80" fill="none" stroke="${s}" stroke-width="1.5"/></svg>`,
};

function getBagSVG(product, variant) {
  const s = getStroke(product.collection);
  const fn = BAG_SVGS[product.type] || BAG_SVGS['Shoulder Bag'];
  const svg = fn(s);
  if (variant === 'side') {
    return svg.replace('transform:translate(-50%,-52%)', 'transform:translate(-52%,-50%) rotate(-8deg) scale(0.88)')
              .replace('transform:translate(-50%,-50%)', 'transform:translate(-52%,-48%) rotate(-8deg) scale(0.88)');
  }
  return svg;
}

function getGalleryImages(product) {
  const views = ['front', 'side', 'back', 'detail', 'lifestyle', 'inside'];
  const folder = (product.assetFolder || product.id).toLowerCase();
  if (product.remoteImages) {
    return views.map((view, idx) => product.remoteImages[view] || getGalleryImagesFallback(product, idx));
  }
  return views.map(view => `images/products/${folder}/${view}.webp`);
}

function getGalleryImagesFallback(product, idx) {
  const labels = ['Front','Side','Back','Detail','Lifestyle','Inside'];
  const c1 = product.collection === 'Noir' ? '%2318181e' : '%231e3828';
  const c2 = product.collection === 'Noir' ? '%230e0e14' : '%230e2218';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g${idx}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1};stop-opacity:1"/><stop offset="100%" style="stop-color:${c2};stop-opacity:1"/></linearGradient></defs><rect width="600" height="750" fill="url(%23g${idx})"/><text x="300" y="460" text-anchor="middle" fill="rgba(184,150,90,0.2)" font-family="serif" font-size="64" font-style="italic" letter-spacing="8">${product.name.charAt(0)}</text><text x="300" y="710" text-anchor="middle" fill="rgba(184,150,90,0.3)" font-family="sans-serif" font-size="11" letter-spacing="6">${labels[idx].toUpperCase()}</text><rect x="60" y="60" width="480" height="640" rx="4" fill="none" stroke="rgba(184,150,90,0.14)" stroke-width="1"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let activeCollection = (() => {
  const path = location.pathname.toLowerCase();
  if (path.startsWith('/collections/essence')) return 'Essence';
  if (path.startsWith('/collections/signature')) return 'Signature';
  if (path.startsWith('/collections/noir')) return 'Noir';
  return 'all';
})();
let activeType = 'all';
let activeSortOrder = 'featured';
let currentProductModal = null;
let currentGalleryIdx = 0;
let lastFocusedElement = null;
const Z_WISHLIST_KEY='zariah_wishlist_v1';let zWishlist=[];try{const v=JSON.parse(localStorage.getItem(Z_WISHLIST_KEY)||'[]');zWishlist=Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch(e){}function zSaveWishlist(){try{localStorage.setItem(Z_WISHLIST_KEY,JSON.stringify(zWishlist))}catch(e){console.warn('[ZARIAH] Wishlist storage unavailable',e)}}function zIsWishlisted(id){return zWishlist.includes(String(id))}function zRenderWishlist(){const host=document.getElementById('zWishlistItems');if(!host)return;const items=zWishlist.map(id=>PRODUCTS.find(p=>String(p.id)===id||String(p.sku)===id)).filter(Boolean);host.innerHTML=items.length?items.map(p=>'<article class="z-wishlist-row"><img src="'+zEscape(p.remoteImages?.front||'images/products/'+String(p.assetFolder||p.id).toLowerCase()+'/front.webp')+'" alt="'+zEscape(p.name)+'" decoding="async"><div><strong>'+zEscape(p.name)+'</strong><small>'+zEscape(p.price)+'</small></div><button type="button" data-wishlist-remove="'+zEscape(p.id)+'">Remove</button></article>').join(''):'<p class="z-wishlist-empty">Your wishlist is waiting for something beautiful.<br>Save the bags you love and find them here.</p>';host.querySelectorAll('[data-wishlist-remove]').forEach(b=>b.addEventListener('click',()=>zToggleWishlist(b.dataset.wishlistRemove)))}function zUpdateWishlistUI(){const c=document.getElementById('zWishlistCount');if(c)c.textContent=String(zWishlist.length);document.querySelectorAll('[data-wishlist]').forEach(b=>{const on=zIsWishlisted(b.dataset.wishlist);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Remove from wishlist':'Add to wishlist');if(b.id==='zDetailWishlist')b.querySelector('span').textContent=on?'Saved to Wishlist':'Add to Wishlist'})}function zToggleWishlist(id){id=String(id);zWishlist=zIsWishlisted(id)?zWishlist.filter(x=>x!==id):[...zWishlist,id];zSaveWishlist();zUpdateWishlistUI();zRenderWishlist()}function zOpenWishlist(){const p=document.getElementById('zWishlistPanel');if(!p)return;zRenderWishlist();p.classList.add('open');p.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}function zCloseWishlist(){const p=document.getElementById('zWishlistPanel');if(!p)return;p.classList.remove('open');p.setAttribute('aria-hidden','true');document.body.style.overflow=''}

/* ═══════════════════════════════════════
   RENDER PRODUCTS
═══════════════════════════════════════ */
function renderProducts() {
  const grid = document.getElementById('prodGrid');
  let filtered = PRODUCTS.filter(p => {
    const collMatch = activeCollection === 'all' || p.collection === activeCollection;
    const typeMatch = activeType === 'all' || p.type === activeType;
    return collMatch && typeMatch;
  });

  // ── TASK 1: Sort ─────────────────────────────────
  if (activeSortOrder === 'price-asc') {
    filtered = filtered.slice().sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (activeSortOrder === 'price-desc') {
    filtered = filtered.slice().sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  }
  // 'featured' = natural PRODUCTS array order (already filtered above)

  // ── TASK 4: Live counts ──────────────────────────
  updateFilterCounts();

  // ── TASK 5: Active filter indicator ─────────────
  updateFilterStatus(filtered.length);

  const frag = document.createDocumentFragment();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'prod-empty';
    empty.setAttribute('role', 'status');
    empty.textContent = 'No bags found in this combination. Try adjusting your filters.';
    frag.appendChild(empty);
    grid.innerHTML = '';
    grid.appendChild(frag);
    return;
  }

  filtered.forEach((p, i) => {
    const bg = getCardBg(p);
    const frontSVG = getBagSVG(p, 'front');
    const sideSVG  = getBagSVG(p, 'side');
    const folder = (p.assetFolder || p.id).toLowerCase();
    const frontImg = p.remoteImages?.front || `images/products/${folder}/front.webp`;
    const sideImg  = p.remoteImages?.side || p.remoteImages?.back || p.remoteImages?.front || `images/products/${folder}/side.webp`;

    const art = document.createElement('article');
    art.className = 'pcard reveal' + (p.soldOut ? ' sold-out' : '');
    art.setAttribute('role', 'listitem');
    art.setAttribute('aria-label', `${p.name} — ${p.price}${p.soldOut ? ' — Sold Out' : ''}`);
    art.style.transitionDelay = `${(i % 3) * 80}ms`;

    art.innerHTML = `
      <div class="pcard-img" style="background:${bg}" id="pcimg-${p.id}">
        ${p.badge ? `<div class="badge ${p.badgeClass}" aria-label="${p.badge}">${p.badge}</div>` : ''}
        <div class="coll-badge" aria-label="${p.collection} collection">${p.collection}</div><button class="z-wishlist-heart" type="button" data-wishlist="${p.id}" aria-pressed="${zIsWishlisted(p.id)}" aria-label="Add to wishlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button>
        ${p.soldOut ? `<div class="soldout-stamp" aria-label="Sold out">Sold Out</div>` : (p.preOrder ? `<div class="z-preorder-stamp" aria-label="Pre-order available">Pre-order</div>` : '')}
        <img class="pcard-img-real pcard-img-front" src="${frontImg}" alt="${p.name} — front view" loading="lazy" data-product="${p.id}" decoding="async">
        <img class="pcard-img-real pcard-img-side" data-src="${sideImg}" alt="${p.name} — side view" loading="lazy" aria-hidden="true" data-product="${p.id}" decoding="async">
        <div class="pcard-front" aria-hidden="true">${frontSVG}</div>
        <div class="pcard-side" aria-hidden="true">${sideSVG}</div>
        <div class="pcard-overlay" aria-hidden="true">
          <button class="pcard-overlay-btn" tabindex="-1" aria-hidden="true">View Details</button>
        </div>
      </div>
      <div class="pcard-info">
        <div class="pcard-top">
          <h3 class="pcard-name">${p.name}</h3>
          <span class="pcard-price">${p.price}</span>
        </div>
        <p class="pcard-type">${p.type}</p>
        <p class="pcard-size">${p.size}</p>
        ${p.soldOut
          ? `<button class="btn-notify" type="button" aria-label="Notify me when ${p.name} is back in stock">
               <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
               Notify Me
             </button>`
          : `<button class="btn-order" type="button" aria-label="Order ${p.name} via WhatsApp">
               <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
               Order Now
             </button>`
        }
      </div>
    `;

    art.querySelector('[data-wishlist]').addEventListener('click',e=>{e.stopPropagation();zToggleWishlist(p.id);});
    // Attach real image load/error handlers
    const imgContainer = art.querySelector('.pcard-img');
    const frontImgEl = art.querySelector('.pcard-img-front');
    const sideImgEl  = art.querySelector('.pcard-img-side');

    // Load the alternate image only when a desktop pointer can actually use it.
    // This avoids downloading a second image for every card on touch devices.
    let sideImageRequested = false;
    function onSideLoad() {
      if (sideImgEl.naturalWidth > 0) imgContainer.classList.add('side-loaded');
      else onSideError();
    }
    function loadSideImageOnDemand() {
      if (sideImageRequested) return;
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const sideSrc = sideImgEl.dataset.src;
      if (!sideSrc) return;
      sideImageRequested = true;
      sideImgEl.addEventListener('load', onSideLoad, { once: true });
      sideImgEl.addEventListener('error', onSideError, { once: true });
      sideImgEl.src = sideSrc;
    }
    function onFrontLoad() {
      imgContainer.classList.add('has-images');
    }
    function onFrontError() {
      frontImgEl.style.display = 'none';
      // SVG fallback stays visible — has-images never added, which is correct
    }
    function onSideError() {
      sideImgEl.style.display = 'none';
      // Mark as error so CSS hover guard shows front image instead of blank
      imgContainer.classList.add('side-error');
    }

    // Handle already-cached images (complete before listener attaches)
    if (frontImgEl.complete) {
      if (frontImgEl.naturalWidth > 0) { onFrontLoad(); }
      else { onFrontError(); }
    } else {
      frontImgEl.addEventListener('load',  onFrontLoad);
      frontImgEl.addEventListener('error', onFrontError);
    }
    imgContainer.addEventListener('pointerenter', loadSideImageOnDemand, { passive: true });
    imgContainer.addEventListener('focusin', loadSideImageOnDemand);

    // Product image: open details on the first tap/click on every device.
    // Side-view hover remains available on desktop; mobile users do not need a double tap.
    art.querySelector('.pcard-img').addEventListener('click', function() {
      navigateToProduct(p.id);
    });
    art.querySelector('.pcard-overlay-btn').addEventListener('click', (e) => { e.stopPropagation(); navigateToProduct(p.id); });

    if (p.soldOut) {
      art.querySelector('.btn-notify').addEventListener('click', (e) => {
        e.stopPropagation();
        fbTrack('Contact', { content_name: 'Notify Me — ' + p.name, content_category: 'Back In Stock' });
        fbTrackCustom('WhatsAppClick', { location: 'notify_btn', product: p.name, collection: p.collection });
        if (typeof gtag !== 'undefined') {
          gtag('event', 'whatsapp_click', { method: 'WhatsApp', location: 'notify_btn', item_name: p.name, item_category: p.collection });
        }
        const msg = encodeURIComponent(`Hello ZARIAH Studio! 🌿\n\nI'd like to be notified when the *${p.name}* (${p.collection} Collection) is back in stock.\n\nPlease let me know as soon as it's available. Thank you!`);
        window.open(`https://wa.me/8801642779056?text=${msg}`, '_blank', 'noopener,noreferrer');
      });
    } else {
      art.querySelector('.btn-order').addEventListener('click', (e) => { e.stopPropagation(); openOModal(p.id); });
    }

    frag.appendChild(art);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ═══════════════════════════════════════
   FAQ
═══════════════════════════════════════ */
const FAQ_DATA = [
  { q: 'What types of bags does ZARIAH Studio offer?', a: 'Our selection includes bags from distinctive brands and selected independent suppliers. Product listings provide the available brand and product details.' },
  { q: 'Are all bags from original brands?', a: 'No. Our selection includes branded products as well as unbranded styles from independent suppliers. We identify products clearly and only describe branded merchandise as authentic when verified.' },
  { q: 'How can I confirm product details?', a: 'Check the individual product listing or contact us on WhatsApp for available information, additional photos and current availability.' },
  { q: 'How does Cash on Delivery work?', a: 'For eligible orders, you pay the courier when your order is delivered. Payment arrangements are confirmed when your order is placed.' },
  { q: 'How long does delivery take?', a: 'Delivery timing depends on your location and product availability. Our team will confirm the estimated timeline when confirming your order.' },
  { q: 'Can I exchange my purchase?', a: 'A 7-day exchange policy applies subject to the published exchange terms and product eligibility. Contact our team within the policy period for assistance.' },
  { q: 'Can I see more photos before ordering?', a: 'Yes. Contact us on WhatsApp to request additional product photos and available details.' }
];

function renderFAQ() {
  const list = document.getElementById('faqList');
  list.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item">
      <button class="faq-q" type="button" aria-expanded="false" aria-controls="faq-ans-${i}" id="faq-q-${i}">
        <span class="faq-qt">${item.q}</span>
        <div class="faq-toggle" aria-hidden="true">+</div>
      </button>
      <div class="faq-a" id="faq-ans-${i}" role="region" aria-labelledby="faq-q-${i}">
        <p class="faq-a-inner">${item.a}</p>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => toggleFaq(btn));
  });
}

function toggleFaq(btn) {
  const isOpen = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q[aria-expanded="true"]').forEach(q => {
    q.setAttribute('aria-expanded', 'false');
    document.getElementById(q.getAttribute('aria-controls')).classList.remove('open');
  });
  if (!isOpen) {
    btn.setAttribute('aria-expanded', 'true');
    document.getElementById(btn.getAttribute('aria-controls')).classList.add('open');
  }
}

/* ═══════════════════════════════════════
   FILTER SYSTEM
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   TASK 4 — LIVE PRODUCT COUNTS
═══════════════════════════════════════ */
function updateFilterCounts() {
  const countFor = (collection) => collection === 'all'
    ? PRODUCTS.length
    : PRODUCTS.filter(p => p.collection === collection).length;

  document.querySelectorAll('.fcol-tab').forEach(tab => {
    const count = tab.querySelector('.fcol-tab-count');
    if (count) count.textContent = ` (${countFor(tab.dataset.coll)})`;
  });
  document.querySelectorAll('.dftab').forEach(tab => {
    const count = tab.querySelector('.dftab-count');
    if (count) count.textContent = ` (${countFor(tab.dataset.dfcoll)})`;
  });
}

/* ═══════════════════════════════════════
   TASK 5 — ACTIVE FILTER INDICATOR
   TASK 6 — RESET FILTERS
═══════════════════════════════════════ */
function updateFilterStatus(visibleCount) {
  const statusBar = document.getElementById('filterStatusBar');
  const statusTxt = document.getElementById('filterStatusTxt');
  const resetBtn  = document.getElementById('filterResetBtn');
  if (!statusBar || !statusTxt) return;

  const collLabels = { all: 'All Collections', Essence: 'Essence Collection', Signature: 'Signature Collection', Noir: 'Noir Collection' };
  const collLabel = collLabels[activeCollection] || (activeCollection === 'all' ? 'All Collections' : `${activeCollection} Collection`);
  const isFiltered = activeCollection !== 'all' || activeType !== 'all' || activeSortOrder !== 'featured';

  statusTxt.innerHTML = `Showing <em>${collLabel}</em> &mdash; <strong>${visibleCount} ${visibleCount === 1 ? 'Product' : 'Products'}</strong>`;
  if (resetBtn) resetBtn.classList.toggle('hidden', !isFiltered);
  statusBar.classList.toggle('visible', true);
  // Sync heading count line
  const countLine = document.getElementById('prodCountLine');
  if (countLine) {
    if (isFiltered) {
      const collShort = { all: 'All', Essence: 'Essence', Signature: 'Signature', Noir: 'Noir' }[activeCollection] || activeCollection;
      const typeLabel = activeType !== 'all' ? ' — ' + activeType : '';
      countLine.textContent = 'Showing ' + collShort + typeLabel + ' — ' + visibleCount + ' ' + (visibleCount === 1 ? 'Product' : 'Products');
    } else {
      countLine.textContent = 'Showing ' + visibleCount + ' Products';
    }
  }
}

/* ═══════════════════════════════════════
   TASK 1 — SORT STATE
═══════════════════════════════════════ */
function setSortOrder(order) {
  activeSortOrder = order;
  // Sync all sort selects
  ['dfbarSort', 'mobileSortSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = order;
  });
}

function setCollFilter(coll) {
  activeCollection = coll;
  // Sync hidden fcol-tabs (DOM state)
  document.querySelectorAll('.fcol-tab').forEach(t => {
    const active = t.dataset.coll === coll;
    t.classList.toggle('active', active);
    t.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  // Sync mobile collection tab bar
  document.querySelectorAll('.mob-coll-tab').forEach(t => {
    const active = t.dataset.mobcoll === coll;
    t.classList.toggle('active', active);
    t.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  // Sync desktop bar tabs
  document.querySelectorAll('.dftab').forEach(t => {
    const active = t.dataset.dfcoll === coll;
    t.classList.toggle('active', active);
    t.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}
function setTypeFilter(type) {
  activeType = type;
  document.querySelectorAll('.ftab').forEach(t => {
    const active = t.dataset.type === type;
    t.classList.toggle('active', active);
    t.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  // Sync desktop Type dropdown
  const dfType = document.getElementById('dfbarType');
  if (dfType) dfType.value = type;
  // Sync mobile type select
  const mType = document.getElementById('mobileTypeSelect');
  if (mType) mType.value = type;
  // Keep mobile trigger in sync
  if (window.__mobileFilterSync) window.__mobileFilterSync();
}
document.querySelectorAll('.fcol-tab').forEach(tab => {
  tab.addEventListener('click', () => { setCollFilter(tab.dataset.coll); renderProducts(); });
});
document.querySelectorAll('.ftab').forEach(tab => {
  tab.addEventListener('click', () => { setTypeFilter(tab.dataset.type); renderProducts(); });
});

/* ── Desktop filter bar tab clicks ── */
document.querySelectorAll('.dftab').forEach(tab => {
  tab.addEventListener('click', () => {
    setCollFilter(tab.dataset.dfcoll);
    setTypeFilter('all'); // reset type when switching collection
    renderProducts();
  });
});

/* ── Sort select event listeners ── */
(function initSortControls() {
  const dfSort = document.getElementById('dfbarSort');
  const mSort  = document.getElementById('mobileSortSelect');
  function onSortChange(e) {
    setSortOrder(e.target.value);
    renderProducts();
  }
  if (dfSort)  dfSort.addEventListener('change', onSortChange);
  if (mSort)   mSort.addEventListener('change', onSortChange);
})();

/* ── Mobile collection tabs ── */
(function initMobileColl() {
  document.querySelectorAll('.mob-coll-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      setCollFilter(tab.dataset.mobcoll);
      setTypeFilter('all');
      // Sync mobile type select back to all
      var mType = document.getElementById('mobileTypeSelect');
      if (mType) mType.value = 'all';
      renderProducts();
    });
  });
})();

/* ── Mobile type select ── */
(function initMobileType() {
  var mType = document.getElementById('mobileTypeSelect');
  if (!mType) return;
  mType.addEventListener('change', function() {
    setTypeFilter(this.value);
    renderProducts();
  });
})();

/* ── Desktop Type dropdown ── */
(function initTypeDropdown() {
  var dfType = document.getElementById("dfbarType");
  if (!dfType) return;
  dfType.addEventListener("change", function() {
    setTypeFilter(this.value);
    renderProducts();
  });
  // Reset type dropdown when collection tab switches
  document.querySelectorAll(".dftab").forEach(function(tab) {
    tab.addEventListener("click", function() { dfType.value = "all"; });
  });
})();

/* ── Reset button — Task 6 ── */
(function initResetButton() {
  const btn = document.getElementById('filterResetBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    setCollFilter('all');
    setTypeFilter('all');
    setSortOrder('featured');
    renderProducts();
  });
})();
function filterCollection(coll) {
  setCollFilter(coll);
  setTypeFilter('all');
  renderProducts();
  requestAnimationFrame(() => {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ═══════════════════════════════════════
   MOBILE FILTER BOTTOM SHEET
═══════════════════════════════════════ */
(function initFilterSheet() {
  const overlay   = document.getElementById('filterSheetOverlay');
  const sheet     = document.getElementById('filterSheet');
  const closeBtn  = document.getElementById('filterSheetClose');
  const triggerBtn= document.getElementById('filterBtnMobile');
  const activeLabel = document.getElementById('filterActiveLabel');

  if (!overlay || !sheet || !triggerBtn) return;

  function openSheet() {
    overlay.classList.add('open');
    sheet.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    sheet.setAttribute('aria-hidden', 'false');
    lockScroll();
    syncSheetTabs();
    OverlayManager.push('filtersheet', closeSheet);
  }

  function closeSheet() {
    overlay.classList.remove('open');
    sheet.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('aria-hidden', 'true');
    unlockScroll();
    OverlayManager.pop('filtersheet');
  }

  function syncSheetTabs() {
    // Sync sheet tab active states with current activeType
    sheet.querySelectorAll('.fsheet-tab').forEach(tab => {
      const active = tab.dataset.type === activeType;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateMobileTrigger() {
    // Show active type name on trigger button
    if (activeLabel) {
      activeLabel.textContent = (activeType !== 'all') ? ': ' + activeType : '';
    }
    if (triggerBtn) {
      triggerBtn.classList.toggle('has-active', activeType !== 'all');
    }
  }

  triggerBtn.addEventListener('click', openSheet);
  closeBtn.addEventListener('click', closeSheet);
  overlay.addEventListener('click', closeSheet);

  // Sheet tab selection
  sheet.querySelectorAll('.fsheet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setTypeFilter(tab.dataset.type);
      updateMobileTrigger();
      renderProducts();
      closeSheet();
    });
  });

  // Keep sheet in sync when desktop tabs change type
  const origSetTypeFilter = setTypeFilter;
  window.__mobileFilterSync = updateMobileTrigger;
})();

/* ═══════════════════════════════════════
   ✅ TESTIMONIAL CAROUSEL — COMPLETE REWRITE
   Fixed: prev/next buttons, swipe, dots,
   responsive card widths, all reviews visible
═══════════════════════════════════════ */
(function initTestimonialCarousel() {
  const track       = document.getElementById('testiTrack');
  const carousel    = document.getElementById('testiCarousel');
  const btnPrev     = document.getElementById('testiBtnPrev');
  const btnNext     = document.getElementById('testiBtnNext');
  const dotsEl      = document.getElementById('testiDots');
  const progressLbl = document.getElementById('testiProgressLabel');
  const progressFill= document.getElementById('testiProgressFill');

  const cards = Array.from(track.querySelectorAll('.tcard'));
  const total = cards.length;
  let current = 0;
  let visibleCount = 3; // recalculated on resize
  let cardWidth = 0;
  let gap = 20;
  let isAnimating = false;

  /* ── Calculate layout ──────────────────── */
  function calcLayout() {
    const w = carousel.offsetWidth;
    if (w <= 600) {
      visibleCount = 1;
    } else if (w <= 960) {
      visibleCount = 2;
    } else {
      visibleCount = 3;
    }
    gap = 20;
    cardWidth = (w - gap * (visibleCount - 1)) / visibleCount;

    // Apply width to each card
    cards.forEach(card => {
      card.style.width = cardWidth + 'px';
      card.style.flexShrink = '0';
    });

    // Clamp current index after resize
    const maxIndex = Math.max(0, total - visibleCount);
    if (current > maxIndex) current = maxIndex;

    applyTransform(false);
    updateUI();
  }

  /* ── Apply transform to track ──────────── */
  function applyTransform(animate) {
    const offset = current * (cardWidth + gap);
    track.style.transition = animate ? 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;

    // Mark active card
    cards.forEach((c, i) => {
      c.classList.toggle('active-card', i === current);
    });
  }

  /* ── Update buttons + dots + progress ──── */
  function updateUI() {
    const maxIndex = Math.max(0, total - visibleCount);

    btnPrev.disabled = current <= 0;
    btnNext.disabled = current >= maxIndex;

    // Progress bar
    const pct = total <= visibleCount ? 100 : ((current + visibleCount) / total) * 100;
    if (progressFill) progressFill.style.width = Math.min(100, pct) + '%';
    if (progressLbl)  progressLbl.textContent = `${current + 1} / ${Math.ceil(total / visibleCount)}`;

    // Dots
    const dotCount = Math.ceil(total / visibleCount);
    const activeDot = Math.floor(current / (total / dotCount));
    dotsEl.querySelectorAll('.testi-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === Math.min(activeDot, dotCount - 1));
      dot.setAttribute('aria-selected', i === Math.min(activeDot, dotCount - 1) ? 'true' : 'false');
    });
  }

  /* ── Navigate ───────────────────────────── */
  function goTo(idx, animate) {
    if (isAnimating) return;
    const maxIndex = Math.max(0, total - visibleCount);
    current = Math.max(0, Math.min(idx, maxIndex));
    applyTransform(animate !== false);
    updateUI();
    isAnimating = true;
    setTimeout(() => { isAnimating = false; }, 600);
  }

  function prev() { goTo(current - 1, true); }
  function next() { goTo(current + 1, true); }

  /* ── Build dots ─────────────────────────── */
  function buildDots() {
    dotsEl.innerHTML = '';
    const dotCount = Math.ceil(total / visibleCount);
    for (let i = 0; i < dotCount; i++) {
      const btn = document.createElement('button');
      btn.className = 'testi-dot' + (i === 0 ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Go to review ${i + 1}`);
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => goTo(i * visibleCount, true));
      dotsEl.appendChild(btn);
    }
  }

  /* ── Button event listeners ─────────────── */
  btnPrev.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    prev();
  });
  btnNext.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    next();
  });

  /* ── Touch / Swipe support ──────────────── */
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragOffset = 0;

  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    dragStartX  = touchStartX;
    isDragging  = true;
    dragOffset  = 0;
    // Pause CSS transition during drag
    track.style.transition = 'none';
  }, { passive: true });

  let touchMoveFrame = 0;
  let pendingTouchX = 0;
  let pendingTouchY = 0;

  carousel.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    pendingTouchX = e.touches[0].clientX;
    pendingTouchY = e.touches[0].clientY;
    if (touchMoveFrame) return;
    touchMoveFrame = requestAnimationFrame(() => {
      touchMoveFrame = 0;
      if (!isDragging) return;
      const dx = pendingTouchX - touchStartX;
      const dy = pendingTouchY - touchStartY;

      // If scrolling vertically, abort drag
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        isDragging = false;
        applyTransform(true);
        return;
      }

      dragOffset = dx;
      const baseOffset = current * (cardWidth + gap);
      // Apply live drag with resistance at edges
      let liveOffset = baseOffset - dx;
      const maxDrag = (total - visibleCount) * (cardWidth + gap);
      if (liveOffset < 0)        liveOffset = liveOffset * 0.3;
      if (liveOffset > maxDrag)  liveOffset = maxDrag + (liveOffset - maxDrag) * 0.3;

      track.style.transform = `translateX(-${liveOffset}px)`;
    });
  }, { passive: true });

  carousel.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    if (touchMoveFrame) cancelAnimationFrame(touchMoveFrame);
    touchMoveFrame = 0;
    isDragging = false;
    const dx = e.changedTouches[0].clientX - dragStartX;
    const threshold = cardWidth * 0.25; // 25% of card width to trigger slide

    if (Math.abs(dx) > threshold) {
      if (dx < 0) next();
      else         prev();
    } else {
      // Snap back
      applyTransform(true);
    }
  }, { passive: true });

  /* ── Mouse drag (desktop) ───────────────── */
  let mouseDown = false;
  let mouseStartX = 0;
  let mouseMoveFrame = 0;
  let pendingMouseX = 0;

  track.addEventListener('mousedown', (e) => {
    mouseDown  = true;
    mouseStartX = e.clientX;
    track.style.cursor = 'grabbing';
    track.style.transition = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    pendingMouseX = e.clientX;
    if (mouseMoveFrame) return;
    mouseMoveFrame = requestAnimationFrame(() => {
      mouseMoveFrame = 0;
      if (!mouseDown) return;
      const dx = pendingMouseX - mouseStartX;
      const baseOffset = current * (cardWidth + gap);
      track.style.transform = `translateX(-${baseOffset - dx}px)`;
    });
  }, { passive: true });

  window.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    if (mouseMoveFrame) cancelAnimationFrame(mouseMoveFrame);
    mouseMoveFrame = 0;
    mouseDown = false;
    track.style.cursor = '';
    const dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > cardWidth * 0.2) {
      if (dx < 0) next();
      else         prev();
    } else {
      applyTransform(true);
    }
  });

  /* ── Keyboard navigation ────────────────── */
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  });

  /* ── Auto-advance ───────────────────────── */
  let autoTimer = null;
  let carouselInView = false;
  let carouselHovered = false;
  let carouselFocused = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function startAuto() {
    stopAuto();
    if (!carouselInView || document.hidden || carouselHovered || carouselFocused || reduceMotion.matches) return;
    autoTimer = window.setInterval(() => {
      const maxIndex = Math.max(0, total - visibleCount);
      if (current >= maxIndex) goTo(0, true);
      else next();
    }, 5500);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function syncAuto() { if (carouselInView && !document.hidden && !carouselHovered && !carouselFocused && !reduceMotion.matches) startAuto(); else stopAuto(); }

  // Do not spend CPU advancing an off-screen carousel.
  const carouselVisibilityObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    carouselInView = !!entries[0]?.isIntersecting;
    syncAuto();
  }, { threshold: 0.12 }) : null;
  if (carouselVisibilityObserver) carouselVisibilityObserver.observe(carousel);
  else carouselInView = true;
  document.addEventListener('visibilitychange', syncAuto);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', syncAuto);
  else if (reduceMotion.addListener) reduceMotion.addListener(syncAuto);

  // Pause auto on user interaction
  carousel.addEventListener('mouseenter', () => { carouselHovered = true; syncAuto(); });
  carousel.addEventListener('mouseleave', () => { carouselHovered = false; syncAuto(); });
  carousel.addEventListener('focusin', () => { carouselFocused = true; syncAuto(); });
  carousel.addEventListener('focusout', () => { carouselFocused = false; syncAuto(); });
  btnPrev.addEventListener('mousedown', stopAuto);
  btnNext.addEventListener('mousedown', stopAuto);

  /* ── Resize observer ────────────────────── */
  let _roFrame;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(_roFrame);
    _roFrame = requestAnimationFrame(() => {
      buildDots();
      calcLayout();
    });
  });
  ro.observe(carousel);

  /* ── Init ───────────────────────────────── */
  buildDots();
  calcLayout();
  startAuto();

  // Expose for keyboard handler at page level
  window._testiCarousel = { prev, next };
})();

/* ═══════════════════════════════════════
   PRODUCT MODAL
═══════════════════════════════════════ */
function openPModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  /* ── Analytics: ViewContent (fires reliably on every path) ── */
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ViewContent', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      content_category: p.collection + ' > ' + p.type,
      value: parsePrice(p.price),
      currency: 'BDT'
    });
  }
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_item', {
      currency: 'BDT',
      value: parsePrice(p.price),
      items: [{ item_id: p.id, item_name: p.name, item_category: p.collection, price: parsePrice(p.price) }]
    });
  }

  currentProductModal = p;
  currentGalleryIdx = 0;

  const imgs = getGalleryImages(p);
  const labels = ['Front','Side','Back','Detail','Lifestyle','Inside'];

  document.getElementById('pmodalColl').textContent = p.collection + ' Collection';
  document.getElementById('pmodalName').textContent = p.name;
  document.getElementById('pmodalType').textContent = p.type;
  document.getElementById('pmodalPrice').textContent = p.price;
  document.getElementById('pmodalDesc').textContent = p.desc;
  document.getElementById('pmodalSize').textContent = '📐 ' + p.size + (p.color ? '  ·  🎨 ' + p.color : '');

  const mainImg = document.getElementById('pmodalMainImg');
  mainImg.src = imgs[0];
  mainImg.alt = `${p.name} — Front view`;
  mainImg.onerror = function() { this.src = getGalleryImagesFallback(p, 0); this.onerror = null; };

  const thumbsEl = document.getElementById('pmodalThumbs');
  thumbsEl.innerHTML = labels.map((lbl, i) =>
    `<img class="pthumb${i === 0 ? ' active' : ''}" src="${imgs[i]}" alt="${p.name} — ${lbl} view" data-idx="${i}" data-fallback="${getGalleryImagesFallback(p, i)}" role="listitem" decoding="async">`
  ).join('');
  thumbsEl.querySelectorAll('.pthumb').forEach(thumb => {
    thumb.addEventListener('click', () => setGalleryImg(parseInt(thumb.dataset.idx)));
    thumb.addEventListener('error', function() { this.src = this.dataset.fallback; this.onerror = null; });
  });

  const featuresEl = document.getElementById('pmodalFeatures');
  if (featuresEl) {
    const materialLabel = p.collection === 'Noir' ? 'Top-grain genuine cowhide' : 'Premium vegan leather';
    featuresEl.innerHTML = `
      <span class="pfeat">${materialLabel}</span>
      <span class="pfeat">Gold-tone hardware</span>
      <span class="pfeat">Interior pockets</span>
      <span class="pfeat">Checked before dispatch</span>
      <span class="pfeat">Luxury gift packaging</span>
      <span class="pfeat">Pay on delivery</span>
    `;
  }

  const addBagBtn = document.getElementById('pmodalAddBagBtn');
  if (addBagBtn) {
    addBagBtn.disabled = !!p.soldOut;
    addBagBtn.textContent = p.soldOut ? 'CURRENTLY UNAVAILABLE' : 'ADD TO BAG';
    addBagBtn.onclick = () => {
      if (!window.ZariahCart) return;
      const result = window.ZariahCart.add({
        id: p.id, name: p.name, price: p.price,
        image: p.remoteImages?.front || getGalleryImages(p)[0],
        soldOut: !!p.soldOut
      });
      if (!result.ok) {
        addBagBtn.textContent = result.reason === 'limit' ? 'QUANTITY LIMIT REACHED' : 'UNAVAILABLE';
        return;
      }
      addBagBtn.textContent = 'ADDED TO BAG';
      const toast = document.createElement('div');
      toast.className = 'z-cart-toast';
      toast.setAttribute('role', 'status');
      toast.textContent = p.name + ' added to your bag · ' + result.count + ' item(s)';
      document.body.appendChild(toast);
      window.setTimeout(() => toast.remove(), 2200);
      window.setTimeout(() => { if (addBagBtn.isConnected) addBagBtn.textContent = 'ADD TO BAG'; }, 1400);
    };
  }

  document.getElementById('pmodalOrderBtn').onclick = () => {
    // Safe transition: hide product modal visually without popping OverlayManager
    // (avoids history.back() race condition that would close the order modal).
    const pov = document.getElementById('pmodalOverlay');
    pov.classList.remove('open');
    pov.setAttribute('aria-hidden', 'true');
    // openOModal with fromPModal=true swaps the OverlayManager slot and
    // skips lockScroll (already locked) and OverlayManager.push (already in stack).
    openOModal(id, true);
  };

  // Product-specific enquiry: opens WhatsApp without collecting order details.
  const inquiryBtn = document.getElementById('pmodalInquiryBtn');
  if (inquiryBtn) {
    inquiryBtn.onclick = () => {
      const message = encodeURIComponent(
        `Hello ZARIAH Studio! 🌿\n\nI have a question about this bag:\n\n` +
        `📦 Product: ${p.name}\n` +
        `🏷 Collection: ${p.collection}\n` +
        `🔖 Code: ${p.id}\n` +
        `🎨 Color: ${p.color || 'Please advise'}\n` +
        `💰 Price: ${p.price}\n\n` +
        `Could you please share more details? Thank you!`
      );
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Contact', { content_name: p.name, content_category: p.collection, content_ids: [p.id] });
      }
      if (typeof gtag !== 'undefined') {
        gtag('event', 'whatsapp_click', { method: 'WhatsApp', location: 'product_enquiry', item_id: p.id, item_name: p.name, item_category: p.collection });
      }
      openWhatsApp(`https://wa.me/8801642779056?text=${message}`);
    };
  }

  lastFocusedElement = document.activeElement;
  const overlay = document.getElementById('pmodalOverlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  lockScroll();
  OverlayManager.push('pmodal', closePModal);
  requestAnimationFrame(() => document.getElementById('pmodalClose').focus());
}

function closePModal() {
  const overlay = document.getElementById('pmodalOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  OverlayManager.pop('pmodal');
  if (lastFocusedElement) lastFocusedElement.focus();
}

function setGalleryImg(idx) {
  if (!currentProductModal) return;
  const imgs = getGalleryImages(currentProductModal);
  const labels = ['Front','Side','Back','Detail','Lifestyle','Inside'];
  currentGalleryIdx = idx;
  const mainImg = document.getElementById('pmodalMainImg');
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = imgs[idx];
    mainImg.alt = `${currentProductModal.name} — ${labels[idx]} view`;
    mainImg.onerror = function() { this.src = getGalleryImagesFallback(currentProductModal, idx); this.onerror = null; };
    mainImg.style.opacity = '1';
  }, 180);
  document.querySelectorAll('.pthumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

function galleryPrev() { setGalleryImg((currentGalleryIdx - 1 + 6) % 6); }
function galleryNext() { setGalleryImg((currentGalleryIdx + 1) % 6); }

document.getElementById('galleryPrevBtn').addEventListener('click', galleryPrev);
document.getElementById('galleryNextBtn').addEventListener('click', galleryNext);
document.getElementById('pmodalClose').addEventListener('click', closePModal);

/* ═══════════════════════════════════════
   ORDER MODAL
═══════════════════════════════════════ */
function openOModal(id, fromPModal) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  /* ── Analytics: InitiateCheckout (fires reliably on every path) ── */
  if (typeof fbq !== 'undefined') {
    fbq('track', 'InitiateCheckout', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      value: parsePrice(p.price),
      currency: 'BDT',
      num_items: 1
    });
  }
  if (typeof gtag !== 'undefined') {
    gtag('event', 'begin_checkout', {
      currency: 'BDT',
      value: parsePrice(p.price),
      items: [{ item_id: p.id, item_name: p.name, item_category: p.collection, price: parsePrice(p.price) }]
    });
  }

  document.getElementById('oProductName').textContent = `${p.name} (${p.collection})`;
  document.getElementById('oProductPrice').textContent = p.price;
  ['oName','oPhone','oAddress'].forEach(field => { document.getElementById(field).value = ''; });
  document.getElementById('oQty').value = '1';

  lastFocusedElement = fromPModal ? lastFocusedElement : document.activeElement;
  const overlay = document.getElementById('omodalOverlay');
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  if (fromPModal) {
    // Swap pmodal → omodal in OverlayManager without touching browser history.
    // This prevents history.back() race condition where the async popstate
    // from closePModal() would immediately close the newly-opened order modal.
    OverlayManager.swap('pmodal', 'omodal', closeOModal);
  } else {
    lockScroll();
    OverlayManager.push('omodal', closeOModal);
  }
  requestAnimationFrame(() => document.getElementById('oName').focus());
}

function closeOModal() {
  // Reset success state and restore form sections on close
  const formSection    = document.querySelector('.omodal-hdr');
  const bodySection    = document.querySelector('.omodal-body');
  const footerSection  = document.querySelector('.omodal-ftr');
  const successSection = document.getElementById('omodalSuccess');
  if (formSection)    formSection.style.display = '';
  if (bodySection)    bodySection.style.display = '';
  if (footerSection)  footerSection.style.display = '';
  if (successSection) successSection.style.display = 'none';
  ['oName','oPhone','oAddress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = '';
  });

  const overlay = document.getElementById('omodalOverlay');
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  unlockScroll();
  OverlayManager.pop('omodal');
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.getElementById('omodalClose').addEventListener('click', closeOModal);

/* ═══════════════════════════════════════
   GOOGLE FORM SILENT SUBMISSION
   ─────────────────────────────────────
   HOW TO GET YOUR ENTRY IDs:
   1. Open your Google Form in a browser
   2. Right-click > View Page Source
   3. Search for "entry." — you'll find
      patterns like entry.1234567890
   4. Replace the ENTRY_XXXXX values below
      with your actual entry IDs.
   ─────────────────────────────────────
   FORM URL (Tanjil): 1FAIpQLSdboOf5IbffkEJzfWGkwk7-Fol-4D7X70dPuHsnmGZsps4AJg
═══════════════════════════════════════ */
const GFORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdboOf5IbffkEJzfWGkwk7-Fol-4D7X70dPuHsnmGZsps4AJg/formResponse';

/* ─────────────────────────────────────────────
   GOOGLE FORM ENTRY ID MAPPING
   ─────────────────────────────────────────────
   Each key maps to the Google Form field that
   should receive that value.

   Entry IDs confirmed from the form's page source
   (entry.1763700777 = Product Name,
    entry.1834361909 = Product Code).

   HOW TO VERIFY YOUR OWN IDs:
   1. Open your Google Form in Chrome (not the editor — the public form URL)
   2. Right-click → View Page Source
   3. Ctrl+F / Cmd+F and search for "entry."
   4. Each visible question has an entry.XXXXXXXXXX attribute
   ───────────────────────────────────────────── */
const GFORM_FIELDS = {
  name:        'entry.1581991692',  // Customer full name
  phone:       'entry.1842706937',  // Customer phone number
  address:     'entry.669354498',   // Delivery address
  district:    'entry.1796616796',  // Area / District
  productName: 'entry.1763700777',  // Product name (e.g. "The Maison Tote")
  productCode: 'entry.1834361909',  // Product code (e.g. "Noir01")
  notes:       'entry.648796592',   // Customer notes ONLY — no product data
};

function submitToGoogleForm(data) {
  // Fire-and-forget: no-cors means we get no response, but data arrives in Google Sheets.
  // This is the only cross-origin submission method that works in all browsers/WebViews.
  try {
    const body = new URLSearchParams();
    body.append(GFORM_FIELDS.name,        data.name);
    body.append(GFORM_FIELDS.phone,       data.phone);
    body.append(GFORM_FIELDS.address,     data.address);
    body.append(GFORM_FIELDS.district,    data.district || '');
    body.append(GFORM_FIELDS.productName, data.productName);   // e.g. "Crescent Shoulder Bag"
    body.append(GFORM_FIELDS.productCode, data.productCode);   // e.g. "Essence01"
    body.append(GFORM_FIELDS.notes,       data.notes || '');   // customer notes only

    fetch(GFORM_ACTION, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).catch(() => {}); // silently handle any network error
  } catch(e) {
    // Never let form submission failure break the UX
  }
}

/* ── Messenger/WebView safe WhatsApp opener ── */
function openWhatsApp(url) {
  // Strategy: try window.open first, fall back to location, then anchor click.
  // In Facebook in-app browser on Android, window.open is blocked for external apps.
  // On iOS Facebook browser, wa.me links work via Safari handoff.
  // This cascade handles all cases.
  try {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (popup && !popup.closed) return;
  } catch(e) {}

  // Fallback: anchor click (works in most in-app browsers)
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); } catch(e) {} }, 1000);
    return;
  } catch(e) {}

  // Last resort: direct navigation (leaves site, but ensures WhatsApp opens)
  window.location.href = url;
}

document.getElementById('btnSubmitOrder').addEventListener('click', () => {
  const name    = document.getElementById('oName').value.trim();
  const phone   = document.getElementById('oPhone').value.trim();
  const address = document.getElementById('oAddress').value.trim();
  const qty     = document.getElementById('oQty').value;

  // Inline validation with focus
  if (!name)    { document.getElementById('oName').focus();    document.getElementById('oName').style.borderColor = 'var(--gold)';    return; }
  if (!phone)   { document.getElementById('oPhone').focus();   document.getElementById('oPhone').style.borderColor = 'var(--gold)';   return; }
  if (!address) { document.getElementById('oAddress').focus(); document.getElementById('oAddress').style.borderColor = 'var(--gold)'; return; }

  // Parse product info stored in modal
  const fullProductText = document.getElementById('oProductName').textContent; // "Crescent Shoulder Bag (Essence)"
  const price    = document.getElementById('oProductPrice').textContent;
  // Extract name and collection from "Name (Collection)" format
  const parenMatch = fullProductText.match(/^(.+?)\s+\((.+?)\)$/);
  const productName  = parenMatch ? parenMatch[1].trim() : fullProductText;
  const collection   = parenMatch ? parenMatch[2].trim() : '';
  // Find product code from PRODUCTS array
  const productObj = PRODUCTS.find(p => p.name === productName && p.collection === collection);
  const productCode  = productObj ? productObj.id : fullProductText;

  // WhatsApp message
  const waMsg = encodeURIComponent(
    `Hello ZARIAH Studio! 🌿\n\nI'd like to place an order:\n\n` +
    `📦 Product: ${productName}\n` +
    `🏷 Collection: ${collection}\n` +
    `🔖 Code: ${productCode}\n` +
    `🎨 Color: ${productObj ? productObj.color : 'Please advise'}\n` +
    `💰 Price: ${price}\n` +
    `🔢 Quantity: ${qty}\n\n` +
    `👤 Name: ${name}\n` +
    `📞 Phone: ${phone}\n` +
    `📍 Address: ${address}\n\n` +
    `Please confirm my order. Thank you!`
  );
  const waUrl = `https://wa.me/8801642779056?text=${waMsg}`;

  // 1. Submit silently to Google Form (background)
  submitToGoogleForm({
    name:        name,
    phone:       phone,
    address:     address,
    district:    '',          // district field not in current form UI — left empty
    productName: productName, // e.g. "Crescent Shoulder Bag"
    productCode: productCode, // e.g. "Essence01"
    quantity:    qty,
    notes:       '',          // no customer notes field in current UI
  });

  // 2. Show success state in modal (better UX than closing)
  const formSection = document.querySelector('.omodal-hdr');
  const bodySection = document.querySelector('.omodal-body');
  const footerSection = document.querySelector('.omodal-ftr');
  const successSection = document.getElementById('omodalSuccess');
  if (formSection) formSection.style.display = 'none';
  if (bodySection) bodySection.style.display = 'none';
  if (footerSection) footerSection.style.display = 'none';
  if (successSection) {
    successSection.style.display = 'flex';
    // Populate order summary
    const detail = document.getElementById('osuccessDetail');
    if (detail) {
      detail.innerHTML = `<strong>${productName}</strong> · ${collection} Collection<br>` +
        `${price} · Qty: ${qty}<br>` +
        `<span style="opacity:.6;font-size:11px">Delivery to: ${address.substring(0,60)}${address.length > 60 ? '...' : ''}</span>`;
    }
  }

  // 3. Attach WhatsApp button listener
  const waBtn = document.getElementById('btnWaConfirm');
  if (waBtn) {
    waBtn.onclick = () => openWhatsApp(waUrl);
  }

  // 4. Auto-open WhatsApp after brief delay (gives modal success animation time to show)
  setTimeout(() => openWhatsApp(waUrl), 1200);
});

// (closeOModal function above already handles success state reset natively)

/* ═══════════════════════════════════════
   IOS-SAFE SCROLL LOCK HELPERS
   overflow:hidden does not prevent scroll
   on iOS Safari. This position:fixed
   approach works across all browsers.
═══════════════════════════════════════ */
let _scrollY = 0;
function lockScroll() {
  _scrollY = window.scrollY;
  document.body.style.top = `-${_scrollY}px`;
  document.body.classList.add('body-locked');
}
function unlockScroll() {
  document.body.classList.remove('body-locked');
  document.body.style.top = '';
  window.scrollTo(0, _scrollY);
}

/* ═══════════════════════════════════════
   HEADER SCROLL
═══════════════════════════════════════ */
const hdr = document.getElementById('hdr');
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      hdr.classList.toggle('scrolled', window.scrollY > 80);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

/* ═══════════════════════════════════════
   MOBILE NAV
═══════════════════════════════════════ */
const mnav = document.getElementById('mnav');
const hamburger = document.getElementById('hamburger');

function openMnav() {
  mnav.classList.add('open');
  mnav.setAttribute('aria-hidden', 'false');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mnav-open');
  lockScroll();
  OverlayManager.push('mnav', closeMnav);
}
function closeMnav() {
  mnav.classList.remove('open');
  mnav.setAttribute('aria-hidden', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mnav-open');
  unlockScroll();
  OverlayManager.pop('mnav');
}

hamburger.addEventListener('click', () => {
  if (mnav.classList.contains('open')) {
    closeMnav();
  } else {
    openMnav();
  }
});
document.getElementById('mnavClose').addEventListener('click', closeMnav);

/* ═══════════════════════════════════════
   MOBILE NAV ANCHOR LINKS
   ─────────────────────────────────────
   Root cause of broken anchor nav:
   The old onclick="closeMnav()" + native
   href="#section" created a race condition.
   unlockScroll() restores window.scrollTo()
   at the SAME tick as the browser fires the
   native anchor jump — they fight and the
   anchor loses.

   Fix: intercept clicks on [data-mnav-target]
   links, prevent the native href jump,
   close the menu (which calls unlockScroll),
   then after one rAF (body-locked removed,
   scroll position restored), smoothly scroll
   to the target section — accounting for the
   fixed header height.
═══════════════════════════════════════ */
document.querySelectorAll('.mnav-links a[data-mnav-target]').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-mnav-target');
    // Close menu + unlock scroll first
    closeMnav();
    // Wait two animation frames: one for unlockScroll to restore
    // window.scrollY, one for the browser to repaint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (!target) return;
        // scroll-margin-top handles the offset via CSS,
        // but we use scrollIntoView for maximum browser compat
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  });
});

document.querySelectorAll('.coll-panel[role="button"]').forEach(panel => {
  panel.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panel.click(); }
  });
});

/* ═══════════════════════════════════════
   REVEAL OBSERVER
═══════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('vis'), i * 70);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ═══════════════════════════════════════
   MODAL OVERLAY CLICK CLOSE
═══════════════════════════════════════ */
document.getElementById('pmodalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('pmodalOverlay')) closePModal();
});
document.getElementById('omodalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('omodalOverlay')) closeOModal();
});

/* ═══════════════════════════════════════
   GLOBAL KEYBOARD
═══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('pmodalOverlay').classList.contains('open')) { closePModal(); return; }
    if (document.getElementById('omodalOverlay').classList.contains('open')) { closeOModal(); return; }
    if (mnav.classList.contains('open')) { closeMnav(); return; }
  }
  // Product gallery keyboard nav (only when modal open)
  if (document.getElementById('pmodalOverlay').classList.contains('open')) {
    if (e.key === 'ArrowLeft')  galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  }
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */

/* ── Analytics helpers ── */
function fbTrack(event, params) {
  if (typeof fbq !== 'undefined') {
    fbq('track', event, params || {});
  }
}
function fbTrackCustom(event, params) {
  if (typeof fbq !== 'undefined') {
    fbq('trackCustom', event, params || {});
  }
}

// Helper: extract numeric price from '৳3,800' → 3800
function parsePrice(priceStr) {
  return parseFloat((priceStr || '').replace(/[^\d.]/g, '')) || 0;
}

// NOTE: ViewContent fires inside openPModal(); InitiateCheckout fires inside openOModal().
// Both are inlined directly into those functions so they fire on every call path,
// including direct card button clicks and product modal → order button.

renderProducts();
renderFAQ();

/* Product detail route: query-based URLs preserve static-host compatibility. */
function zEscape(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function zColourHex(name){const n=String(name).toLowerCase();const map={black:'#282725',noir:'#282725',camel:'#b58b62',tan:'#b98e68',cognac:'#89563a',olive:'#74745a',green:'#52624e',forest:'#344b3c',burgundy:'#632c3c',plum:'#56374f',ivory:'#eee5d4',cream:'#e9ddc9',beige:'#d8c4a8',rose:'#bd8d91',mauve:'#9b7b88',blue:'#344c68',navy:'#252e46',wine:'#642c3b'};return Object.entries(map).find(([k])=>n.includes(k))?.[1]||'#c9b9a5';}
const Z_RECENTLY_VIEWED_KEY='zariah_recently_viewed_v1';
let zRecentlyViewed=[];
try { const stored=JSON.parse(localStorage.getItem(Z_RECENTLY_VIEWED_KEY)||'[]'); zRecentlyViewed=Array.isArray(stored)?stored.filter(x=>typeof x==='string').slice(0,6):[]; } catch(e) {}
function zSaveRecentlyViewed(){try{localStorage.setItem(Z_RECENTLY_VIEWED_KEY,JSON.stringify(zRecentlyViewed));}catch(e){console.warn('[ZARIAH] Recently viewed storage unavailable',e);}}
function zRenderRecentlyViewed(){
  const section=document.getElementById('zRecentlyViewed'),grid=document.getElementById('zRecentlyViewedGrid');
  if(!section||!grid)return;
  const items=zRecentlyViewed.map(id=>PRODUCTS.find(p=>String(p.id)===id||String(p.sku)===id)).filter(Boolean).slice(0,4);
  section.hidden=items.length===0;
  grid.innerHTML=items.map(p=>{
    const folder=String(p.assetFolder||p.id).toLowerCase();
    const image=p.remoteImages?.front||'images/products/'+folder+'/front.webp';
    return '<button class="z-recently-card" type="button" data-recent-product="'+zEscape(p.id)+'"><img src="'+zEscape(image)+'" alt="'+zEscape(p.name)+'" loading="lazy" decoding="async"><strong>'+zEscape(p.name)+'</strong><span>'+zEscape(p.price)+'</span></button>';
  }).join('');
  grid.querySelectorAll('[data-recent-product]').forEach(button=>button.addEventListener('click',()=>navigateToProduct(button.dataset.recentProduct)));
}
function zTrackRecentlyViewed(product){
  const id=String(product.id);
  zRecentlyViewed=[id,...zRecentlyViewed.filter(x=>x!==id)].slice(0,6);
  zSaveRecentlyViewed();
  zRenderRecentlyViewed();
}
zRenderRecentlyViewed();

function renderProductDetailsPage(id){
 const p=PRODUCTS.find(item=>String(item.id)===String(id)||String(item.sku)===String(id));
 const host=document.getElementById('zProductPage');if(!host)return;
 if(!p){host.hidden=true;document.body.classList.remove('z-product-route');zRenderRecentlyViewed();return;}
 zTrackRecentlyViewed(p);
 const imgs=getGalleryImages(p).filter(Boolean);
 const unique=[...new Set(imgs)];
  const gallery='<div class="z-gallery-stage"><img id="zGalleryImage" src="'+zEscape(unique[0]||'')+'" alt="'+zEscape(p.name)+' — Front view" loading="eager" decoding="async"></div>'+(unique.length>1?'<button class="z-gallery-arrow prev" id="zGalleryPrev" type="button" aria-label="Previous product image">‹</button><button class="z-gallery-arrow next" id="zGalleryNext" type="button" aria-label="Next product image">›</button><span class="z-gallery-count" id="zGalleryCount">1 / '+unique.length+'</span><div class="z-gallery-dots" id="zGalleryDots" aria-label="Choose product image">'+unique.map((_,i)=>'<button type="button" class="z-gallery-dot'+(i===0?' active':'')+'" data-gallery-index="'+i+'" aria-label="Show image '+(i+1)+'"></button>').join('')+'</div>':'');
 const related=PRODUCTS.filter(item=>item.collection===p.collection&&item.id!==p.id).slice(0,4);
 host.innerHTML='<div class="z-detail-top"><button class="z-detail-back" type="button" id="zDetailBack">← Back to collection</button><span class="z-detail-collection">ZARIAH Studio</span></div><div class="z-detail-grid"><div class="z-detail-gallery">'+gallery+'</div><section class="z-detail-info"><span class="z-detail-collection">'+zEscape(p.collection)+' Collection</span><h1 class="z-detail-name">'+zEscape(p.name)+'</h1><p class="z-detail-sku">'+zEscape(p.sku||p.id)+'</p><p class="z-detail-price">'+zEscape(p.price)+'</p><button class="z-detail-wishlist" id="zDetailWishlist" data-wishlist="'+zEscape(p.id)+'" type="button" aria-pressed="'+zIsWishlisted(p.id)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg><span>'+(zIsWishlisted(p.id)?'Saved to Wishlist':'Add to Wishlist')+'</span></button><p class="z-detail-availability'+(p.soldOut?' soldout':(p.preOrder?' preorder':''))+'">'+(p.soldOut?'Currently unavailable':(p.preOrder?'Pre-order available':'In stock — Available to reserve'))+'</p><p class="z-detail-desc">'+zEscape(p.desc||'')+'</p>'+(p.color?'<div class="z-detail-colours"><div class="z-detail-colours-label">Available colours</div><div class="z-detail-swatches">'+String(p.color).split('/').map((c,i)=>'<button type="button" class="z-detail-swatch" data-colour="'+zEscape(c.trim())+'" aria-label="'+zEscape(c.trim())+'" aria-pressed="'+(i===0?'true':'false')+'" style="background:'+zColourHex(c.trim())+'"></button>').join('')+'</div><p class="z-detail-selected-colour" id="zSelectedColour">'+zEscape(String(p.color).split('/')[0].trim())+'</p></div>':'')+'<section class="z-detail-specs"><h2>Product Specifications</h2>'+[['Bag type',p.type],['Dimensions',p.size],['Material',p.material],['Strap',p.strap],['Compartments',p.compartments]].filter(([k,v])=>v).map(([k,v])=>'<div class="z-detail-spec-row"><span>'+zEscape(k)+'</span><span>'+zEscape(v)+'</span></div>').join('')+'</section>'+(p.deliveryInfo?'<p class="z-detail-desc" style="margin-top:18px">'+zEscape(p.deliveryInfo)+'</p>':'')+'<button class="z-detail-add-bag" id="zDetailAddBag" type="button"'+(p.soldOut?' disabled':'')+'>'+(p.soldOut?'Currently Unavailable':'Add to Bag')+'</button><button class="z-detail-reserve" id="zDetailReserve" type="button"'+(p.soldOut?' disabled':'')+'>Reserve Your Bag</button></section></div><div class="z-image-zoom" id="zImageZoom" role="dialog" aria-modal="true" aria-label="Product image zoom"><button class="z-image-zoom-close" id="zImageZoomClose" type="button" aria-label="Close image zoom">×</button><img id="zImageZoomFull" alt="'+zEscape(p.name)+' enlarged view" decoding="async"></div>'+(related.length?'<section class="z-detail-related"><h2>Complete the Collection</h2><div class="z-related-grid">'+related.map(item=>'<article class="z-related-item" data-related="'+zEscape(item.id)+'"><img src="'+zEscape(item.remoteImages?.front||'images/products/'+String(item.assetFolder||item.id).toLowerCase()+'/front.webp')+'" alt="'+zEscape(item.name)+'" loading="lazy" decoding="async"><p>'+zEscape(item.name)+'</p><small>'+zEscape(item.price)+'</small></article>').join('')+'</div></section>':'');
 host.hidden=false;document.body.classList.add('z-product-route');window.scrollTo(0,0);
 document.getElementById('zDetailBack').addEventListener('click',()=>{if(location.search.includes('product=')){history.pushState({},'',location.pathname+location.hash);renderProductDetailsPage(null);}else{renderProductDetailsPage(null);}});
 if(unique.length>1){
   let galleryIndex=0;const galleryImg=document.getElementById('zGalleryImage');
   const showGalleryImage=(next)=>{galleryIndex=(next+unique.length)%unique.length;galleryImg.src=unique[galleryIndex];galleryImg.alt=p.name+' — '+(galleryIndex===0?'Front':'Gallery')+' view';document.getElementById('zGalleryCount').textContent=(galleryIndex+1)+' / '+unique.length;host.querySelectorAll('.z-gallery-dot').forEach((dot,i)=>dot.classList.toggle('active',i===galleryIndex));};
   document.getElementById('zGalleryPrev').addEventListener('click',()=>showGalleryImage(galleryIndex-1));
   document.getElementById('zGalleryNext').addEventListener('click',()=>showGalleryImage(galleryIndex+1));
   host.querySelectorAll('[data-gallery-index]').forEach(dot=>dot.addEventListener('click',()=>showGalleryImage(Number(dot.dataset.galleryIndex))));
   const stage=host.querySelector('.z-gallery-stage');let touchStartX=0;
   stage.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;},{passive:true});
   stage.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchStartX;if(Math.abs(delta)>40)showGalleryImage(galleryIndex+(delta<0?1:-1));},{passive:true});
  }
  const stageImg=document.getElementById('zGalleryImage');const zoom=document.getElementById('zImageZoom');const zoomImg=document.getElementById('zImageZoomFull');
  stageImg.addEventListener('click',()=>{zoomImg.src=stageImg.src;zoom.classList.add('open');});
  document.getElementById('zImageZoomClose').addEventListener('click',()=>zoom.classList.remove('open'));
  zoom.addEventListener('click',e=>{if(e.target===zoom)zoom.classList.remove('open');});
  document.addEventListener('keydown',function zZoomEsc(e){if(e.key==='Escape'){zoom.classList.remove('open');document.removeEventListener('keydown',zZoomEsc);}});
  host.querySelectorAll('[data-colour]').forEach((swatch,i)=>swatch.addEventListener('click',()=>{host.querySelectorAll('[data-colour]').forEach(el=>el.setAttribute('aria-pressed','false'));swatch.setAttribute('aria-pressed','true');document.getElementById('zSelectedColour').textContent=swatch.dataset.colour;const variantImage=p.variantImages?.[swatch.dataset.colour];if(variantImage){stageImg.src=variantImage;}}));
  document.getElementById('zDetailWishlist').addEventListener('click',()=>zToggleWishlist(p.id));
 const addDetailBag=document.getElementById('zDetailAddBag');if(addDetailBag)addDetailBag.addEventListener('click',()=>{const result=window.ZariahCart?.add({id:p.id,name:p.name,price:p.price,image:p.remoteImages?.front||imgs[0],soldOut:!!p.soldOut});if(!result?.ok){addDetailBag.textContent=result?.reason==='limit'?'Quantity limit reached':'Unavailable';return;}addDetailBag.textContent='Added to Bag';const toast=document.createElement('div');toast.className='z-cart-toast';toast.setAttribute('role','status');toast.textContent=p.name+' added to your bag';document.body.appendChild(toast);window.setTimeout(()=>toast.remove(),2000);window.setTimeout(()=>{if(addDetailBag.isConnected)addDetailBag.textContent='Add to Bag'},1400);});
 document.getElementById('zDetailReserve').addEventListener('click',()=>openOModal(p.id));
 host.querySelectorAll('[data-related]').forEach(el=>el.addEventListener('click',()=>navigateToProduct(el.dataset.related)));
 if(typeof fbq!=='undefined')fbq('track','ViewContent',{content_ids:[p.id],content_name:p.name,content_type:'product',value:parsePrice(p.price),currency:'BDT'});
 if(typeof gtag!=='undefined')gtag('event','view_item',{currency:'BDT',value:parsePrice(p.price),items:[{item_id:p.id,item_name:p.name,item_category:p.collection,price:parsePrice(p.price)}]});
 document.title=p.name+' | ZARIAH Studio';
}
function navigateToProduct(id){history.pushState({zProduct:id},'',location.pathname+'?product='+encodeURIComponent(id));renderProductDetailsPage(id);}
function syncIndividualCollectionRoute(){
 const path=location.pathname.toLowerCase();
 const collection=path.includes('/essence')?'Essence':path.includes('/signature')?'Signature':path.includes('/noir')?'Noir':null;
 document.body.classList.toggle('z-individual-collection-route',!!collection);
 if(collection){
   activeCollection=collection;
   document.title=collection+' Collection | ZARIAH Studio';
   const meta=document.querySelector('meta[name=description]');
   if(meta)meta.content='Explore the '+collection+' handbag collection by ZARIAH Studio.';
   const canonical=document.querySelector('link[rel=canonical]');
   if(canonical)canonical.href='https://www.zariahstudio.com/collections/'+collection.toLowerCase()+'/';
 }
}
function syncCollectionsRoute(){
 const isCollections=location.pathname.replace(/\/+$/,'')==='/collections' && !location.search.includes('product=');
 document.body.classList.toggle('z-collections-route',isCollections);
 if(isCollections){document.title='Collections | ZARIAH Studio';const meta=document.querySelector('meta[name=description]');if(meta)meta.content='Explore Essence, Signature and Noir handbag collections by ZARIAH Studio.';const canonical=document.querySelector('link[rel=canonical]');if(canonical)canonical.href='https://www.zariahstudio.com/collections/';}
 else if(!new URLSearchParams(location.search).get('product')){document.title='ZARIAH Studio — Quiet Luxury Handbags Bangladesh';const meta=document.querySelector('meta[name=description]');if(meta)meta.content="ZARIAH Studio crafts refined women\'s handbags for quiet luxury. Premium bags delivered across Bangladesh. Cash on delivery.";const canonical=document.querySelector('link[rel=canonical]');if(canonical)canonical.href='https://www.zariahstudio.com/';}
}
window.addEventListener('popstate',syncCollectionsRoute);
syncCollectionsRoute();
syncIndividualCollectionRoute();
function syncProductRoute(){const id=new URLSearchParams(location.search).get('product');if(id)renderProductDetailsPage(id);else{const host=document.getElementById('zProductPage');if(host)host.hidden=true;document.body.classList.remove('z-product-route');document.title='ZARIAH Studio — Quiet Luxury Handbags Bangladesh';zRenderRecentlyViewed();}}
window.addEventListener('popstate',syncProductRoute);

syncProductRoute();
syncCollectionsRoute();
document.getElementById('zWishlistOpen')?.addEventListener('click',zOpenWishlist);document.getElementById('zWishlistClose')?.addEventListener('click',zCloseWishlist);document.getElementById('zWishlistPanel')?.addEventListener('click',e=>{if(e.target.id==='zWishlistPanel')zCloseWishlist()});document.addEventListener('keydown',e=>{if(e.key==='Escape')zCloseWishlist()});zUpdateWishlistUI();

// Load the published catalogue without changing the existing storefront components.
// The embedded 18-product catalogue remains the fail-safe if Supabase is unavailable.
function syncDynamicStorefrontFilters() {
  const collectionNames = [...new Set(PRODUCTS.map(p => p.collection).filter(Boolean))];
  const knownCollections = new Set([...document.querySelectorAll('.dftab')].map(el => el.dataset.dfcoll));
  const hiddenFilterHost = document.querySelector('.products-header > div[aria-hidden="true"]');
  const mobileCollectionHost = document.querySelector('.mob-coll-track');
  const desktopCollectionHost = document.querySelector('.dftabs');

  collectionNames.forEach(name => {
    if (knownCollections.has(name)) return;
    if (hiddenFilterHost) {
      const hidden = document.createElement('button');
      hidden.className = 'fcol-tab';
      hidden.dataset.coll = name;
      hidden.setAttribute('aria-pressed', 'false');
      hidden.textContent = name;
      hiddenFilterHost.appendChild(hidden);
      hidden.addEventListener('click', () => { setCollFilter(name); setTypeFilter('all'); renderProducts(); });
    }
    if (mobileCollectionHost) {
      const mobile = document.createElement('button');
      mobile.className = 'mob-coll-tab';
      mobile.dataset.mobcoll = name;
      mobile.setAttribute('aria-pressed', 'false');
      mobile.textContent = name;
      mobileCollectionHost.appendChild(mobile);
      mobile.addEventListener('click', () => { setCollFilter(name); setTypeFilter('all'); renderProducts(); });
    }
    if (desktopCollectionHost) {
      const desktop = document.createElement('button');
      desktop.className = 'dftab';
      desktop.dataset.dfcoll = name;
      desktop.setAttribute('aria-pressed', 'false');
      desktop.setAttribute('aria-label', 'Show ' + name + ' collection');
      const title = document.createElement('span');
      title.className = 'dftab-name';
      title.textContent = name;
      const description = document.createElement('span');
      description.className = 'dftab-desc';
      description.textContent = 'Collection';
      const count = document.createElement('span');
      count.className = 'dftab-count';
      desktop.append(title, description, count);
      desktopCollectionHost.appendChild(desktop);
      desktop.addEventListener('click', () => { setCollFilter(name); setTypeFilter('all'); renderProducts(); });
    }
  });

  const typeNames = [...new Set(PRODUCTS.map(p => p.type).filter(Boolean))];
  const hiddenTypeHost = document.querySelector('.products-header > div[aria-hidden="true"]');
  const hiddenTypes = new Set([...document.querySelectorAll('.ftab')].map(el => el.dataset.type));
  typeNames.forEach(type => {
    if (hiddenTypes.has(type)) return;
    if (hiddenTypeHost) {
      const button = document.createElement('button');
      button.className = 'ftab';
      button.dataset.type = type;
      button.setAttribute('aria-pressed', 'false');
      button.textContent = type;
      hiddenTypeHost.appendChild(button);
      button.addEventListener('click', () => { setTypeFilter(type); renderProducts(); });
    }
    ['mobileTypeSelect', 'dfbarType'].forEach(id => {
      const select = document.getElementById(id);
      if (select && ![...select.options].some(option => option.value === type)) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
      }
    });
  });

  const names = document.querySelector('.coll-names');
  if (names && collectionNames.length) names.textContent = collectionNames.join(' • ');
}

async function loadPublishedProductsFromSupabase() {
  const config = window.ZARIAH_SUPABASE_CONFIG;
  if (!config || !window.supabase || typeof window.supabase.createClient !== 'function') return;

  try {
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    // Load optional CMS-managed images. If unavailable, the original static assets remain untouched.
    try {
      const { data: mediaRows, error: mediaError } = await client.from('site_media').select('slot_key,public_url,alt_text').eq('is_published', true);
      if (!mediaError && Array.isArray(mediaRows)) {
        const media = Object.fromEntries(mediaRows.map(item => [item.slot_key, item]));
        const desktop = media['hero.desktop']?.public_url;
        const mobile = media['hero.mobile']?.public_url || desktop;
        const heroPicture = document.querySelector('.hero picture');
        const heroImage = heroPicture?.querySelector('img');
        if (heroPicture && heroImage) {
          const sources = heroPicture.querySelectorAll('source');
          if (sources[0] && mobile) sources[0].srcset = mobile;
          if (sources[1] && desktop) sources[1].srcset = desktop;
          if (desktop) heroImage.src = desktop;
          if (media['hero.desktop']?.alt_text) heroImage.alt = media['hero.desktop'].alt_text;
        }
        const collectionSlots = [['essence','collection.essence.cover'],['signature','collection.signature.cover'],['noir','collection.noir.cover']];
        collectionSlots.forEach(([slug,key]) => { const node=document.querySelector('.bg-'+slug); if(node && media[key]?.public_url) node.style.backgroundImage='url("'+media[key].public_url.replace(/"/g,'%22')+'")'; });
        const campaign = media['campaign.main'];
        const campaignNode = document.querySelector('[data-media-slot="campaign.main"]');
        if (campaignNode && campaign?.public_url) campaignNode.style.backgroundImage='url("'+campaign.public_url.replace(/"/g,'%22')+'")';
        const lookbook = media['lookbook.main']; const lookbookNode=document.querySelector('[data-media-slot="lookbook.main"]');
        if(lookbookNode && lookbook?.public_url) { if(lookbookNode.matches('img')) {lookbookNode.src=lookbook.public_url;lookbookNode.alt=lookbook.alt_text||'';} else lookbookNode.style.backgroundImage='url("'+lookbook.public_url.replace(/"/g,'%22')+'")'; }
        const about = media['about.main']; const aboutNode=document.querySelector('[data-media-slot="about.main"]');
        if(aboutNode && about?.public_url) { if(aboutNode.matches('img')) {aboutNode.src=about.public_url;aboutNode.alt=about.alt_text||'';} else aboutNode.style.backgroundImage='url("'+about.public_url.replace(/"/g,'%22')+'")'; }
      }
    } catch (mediaError) { console.warn('[ZARIAH] Media CMS unavailable; keeping static images.', mediaError); }

    const { data, error } = await client.rpc('get_storefront_catalogue');
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[ZARIAH] Published catalogue is empty; keeping the embedded fallback catalogue.');
      return;
    }

    const fallbackBySku = new Map(FALLBACK_PRODUCTS.map(product => [product.id.toLowerCase(), product]));
    PRODUCTS = data.map(row => {
      const fallback = fallbackBySku.get(String(row.sku || '').toLowerCase());
      const remoteImages = {};
      const extraImages = [];
      (Array.isArray(row.images) ? row.images : []).forEach(image => {
        if (!image || !image.url) return;
        const role = String(image.role || 'gallery').toLowerCase();
        if (['front', 'side', 'back', 'detail', 'lifestyle', 'inside'].includes(role) && !remoteImages[role]) {
          remoteImages[role] = image.url;
        } else {
          extraImages.push(image.url);
        }
      });
      const galleryOrder = ['front', 'side', 'back', 'detail', 'lifestyle', 'inside'];
      extraImages.forEach(url => {
        const missingRole = galleryOrder.find(role => !remoteImages[role]);
        if (missingRole) remoteImages[missingRole] = url;
      });

      return {
        id: row.slug || row.sku,
        sku: row.sku,
        assetFolder: String(row.sku || '').toLowerCase(),
        name: row.name,
        collection: row.collection_name,
        type: row.product_type || 'Shoulder Bag',
        color: row.color || '',
        desc: row.description || '',
        size: row.size_text || '',
        price: '৳' + new Intl.NumberFormat('en-BD', { maximumFractionDigits: 0 }).format(Number(row.price_bdt || 0)),
        badge: row.badge || null,
        badgeClass: row.badge_style || '',
        isBestseller: Boolean(row.is_bestseller),
        isFeatured: Boolean(row.is_featured),
        preOrder: row.availability_mode === 'pre_order',
        soldOut: row.availability_mode === 'pre_order' ? false : (row.stock_counted ? Boolean(row.is_sold_out) : Boolean(fallback?.soldOut)),
        remoteImages
      };
    });

    syncDynamicStorefrontFilters();
    renderProducts();
    zRenderRecentlyViewed();
    syncProductRoute();
    window.dispatchEvent(new CustomEvent('zariah:catalogue-updated'));
    console.info('[ZARIAH] Published catalogue loaded from Supabase:', PRODUCTS.length);
  } catch (error) {
    console.warn('[ZARIAH] Could not load Supabase catalogue; using embedded products.', error);
  }
}

window.ZARIAH_LOAD_SUPABASE().then(loadPublishedProductsFromSupabase).catch(function(error){console.warn("[ZARIAH] Supabase unavailable; using embedded products.",error);});

/* Four-banner homepage carousel */
(function(){
 const root=document.getElementById('zHeroSlides'); if(!root)return;
 const slides=[...root.querySelectorAll('.z-hero-slide')], dots=[...document.querySelectorAll('.z-hero-dots button')];
 const carousel=document.querySelector('.z-hero-carousel');
 if(!slides.length || !carousel)return;
 let active=0,timer=null,inView=false,hovered=false;
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function show(n){active=(n+slides.length)%slides.length;slides.forEach((el,i)=>el.classList.toggle('is-active',i===active));dots.forEach((el,i)=>{el.classList.toggle('active',i===active);el.setAttribute('aria-pressed',String(i===active));});}
 function stop(){if(timer){clearInterval(timer);timer=null;}}
 function sync(){stop();if(inView&&!document.hidden&&!hovered&&!reduceMotion.matches&&slides.length>1)timer=window.setInterval(()=>show(active+1),4500);}
 document.querySelector('.z-hero-arrow.prev')?.addEventListener('click',()=>{show(active-1);sync()});
 document.querySelector('.z-hero-arrow.next')?.addEventListener('click',()=>{show(active+1);sync()});
 dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);sync()}));
 slides.forEach(slide=>slide.addEventListener('click',()=>{const c=slide.dataset.collection;if(c&&typeof filterCollection==='function')filterCollection(c);}));
 let x0=0;
 carousel.addEventListener('touchstart',e=>{x0=e.changedTouches[0].clientX;},{passive:true});
 carousel.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>45){show(active+(dx<0?1:-1));sync();}},{passive:true});
 carousel.addEventListener('mouseenter',()=>{hovered=true;sync()});carousel.addEventListener('mouseleave',()=>{hovered=false;sync()});
 document.addEventListener('visibilitychange',sync);
 if(reduceMotion.addEventListener)reduceMotion.addEventListener('change',sync);else if(reduceMotion.addListener)reduceMotion.addListener(sync);
 if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{inView=!!entries[0]?.isIntersecting;sync();},{threshold:0.1});io.observe(carousel);}else{inView=true;sync();}
})();


/* ═══════════════════════════════════════
   TASK 7 — STICKY DESKTOP FILTER BAR
   Only appears when user scrolls the
   products header OUT of the viewport.
   Never shown on page load.
═══════════════════════════════════════ */
(function initStickyFilterBar() {
  const bar       = document.getElementById('desktopFilterBar');
  const spacer    = document.getElementById('dfbarSpacer');
  const productsSection = document.getElementById('products');
  if (!bar || !spacer || !productsSection) return;

  const mq = window.matchMedia('(min-width: 769px)');
  if (!mq.matches) return;

  let isSticky = false;
  let ticking  = false;

  function checkSticky() {
    if (!window.matchMedia('(min-width: 769px)').matches) {
      if (isSticky) {
        isSticky = false;
        bar.classList.remove('is-sticky');
        spacer.style.display = 'none';
      }
      return;
    }
    // The bar should stick only after the products section header
    // has scrolled above the collapsed nav (62px).
    const productsTop = productsSection.getBoundingClientRect().top;
    const shouldStick = productsTop < 62;

    if (shouldStick === isSticky) return;
    isSticky = shouldStick;
    bar.classList.toggle('is-sticky', shouldStick);
    spacer.style.display = shouldStick ? 'block' : 'none';
  }

  if (window.matchMedia('(min-width: 769px)').matches) {
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { checkSticky(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  window.addEventListener('resize', checkSticky, { passive: true });
})();

/* ═══════════════════════════════════════
   META PIXEL EVENT TRACKING ARCHITECTURE
   All events fire after user interaction —
   no ghost events. Safe for Advantage+,
   Lookalike Audiences, and Retargeting.
═══════════════════════════════════════ */

/* ── Product card image click → ViewContent ── */
document.addEventListener('click', (e) => {
  const pcardImg = e.target.closest('.pcard-img');
  if (pcardImg) {
    const pcard = pcardImg.closest('.pcard');
    if (pcard) {
      const label = pcard.getAttribute('aria-label') || '';
      fbTrackCustom('ProductCardClick', { label });
    }
  }
});

/* ── Collection panel click ── */
document.querySelectorAll('.coll-panel').forEach(panel => {
  panel.addEventListener('click', () => {
    const title = panel.querySelector('.coll-title');
    fbTrackCustom('CollectionClick', {
      collection: title ? title.textContent.trim().replace(/\s+/g,' ') : ''
    });
    if (typeof gtag !== 'undefined') {
      gtag('event', 'collection_view', { content_type: 'collection', item_id: title ? title.textContent.trim().replace(/\s+/g,' ') : '' });
    }
  });
});

/* ── Hero CTA clicks ── */
document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
  btn.addEventListener('click', () => {
    fbTrackCustom('HeroCTAClick', { label: btn.textContent.trim() });
  });
});

/* ── Header WhatsApp button ── */
const headerWaBtn = document.querySelector('.btn-wa');
if (headerWaBtn) {
  headerWaBtn.addEventListener('click', () => {
    fbTrack('Contact', { content_name: 'Header WhatsApp' });
    fbTrackCustom('WhatsAppClick', { location: 'header' });
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact', { method: 'WhatsApp', location: 'header' });
    }
  });
}

/* ── Mobile nav WhatsApp button ── */
const mnavWaBtn = document.querySelector('.btn-wa-mobile');
if (mnavWaBtn) {
  mnavWaBtn.addEventListener('click', () => {
    fbTrack('Contact', { content_name: 'Mobile Nav WhatsApp' });
    fbTrackCustom('WhatsAppClick', { location: 'mobile_nav' });
    if (typeof gtag !== 'undefined') {
      gtag('event', 'whatsapp_click', { method: 'WhatsApp', location: 'mobile_nav' });
    }
  });
}

/* ── Floating WhatsApp button ── */
const floatWaBtn = document.querySelector('.wa-btn');
if (floatWaBtn) {
  floatWaBtn.addEventListener('click', () => {
    fbTrack('Contact', { content_name: 'Floating WhatsApp' });
    fbTrackCustom('WhatsAppClick', { location: 'floating_button' });
    if (typeof gtag !== 'undefined') {
      gtag('event', 'contact', { method: 'WhatsApp', location: 'floating' });
    }
  });
}

/* ── Mobile menu open ── */
hamburger.addEventListener('click', () => {
  fbTrackCustom('MobileMenuOpen', {});
}, { once: false });

/* ── WhatsApp order submit → Lead — fires before the main handler (capture phase) ── */
document.getElementById('btnSubmitOrder').addEventListener('click', () => {
  // Only fires if validation will pass (checked inside main handler too)
  const name    = document.getElementById('oName').value.trim();
  const phone   = document.getElementById('oPhone').value.trim();
  const address = document.getElementById('oAddress').value.trim();
  if (!name || !phone || !address) return;
  const pName  = document.getElementById('oProductName').textContent;
  const pPrice = document.getElementById('oProductPrice').textContent;
  fbTrack('Lead', {
    content_name: pName,
    content_category: 'WhatsApp Order',
    value: parsePrice(pPrice),
    currency: 'BDT'
  });
  if (typeof gtag !== 'undefined') {
    gtag('event', 'generate_lead', { currency: 'BDT', value: parsePrice(pPrice) });
  }
}, { capture: true }); // capture phase ensures pixel fires before main handler opens WhatsApp

/* ═══════════════════════════════════════
   COLLECTION PANEL IMAGE DETECTION
   Adds has-image class when real images load
═══════════════════════════════════════ */
document.querySelectorAll('.coll-panel-img').forEach(img => {
  const panel = img.closest('.coll-panel');
  if (img.complete && img.naturalWidth > 0) {
    panel.classList.add('has-image');
  } else {
    img.addEventListener('load', () => panel.classList.add('has-image'));
    img.addEventListener('error', () => img.style.display = 'none');
  }
});

/* ═══════════════════════════════════════
   HERO IMAGE MOBILE SWAP
   On small screens, switch hero to mobile image
═══════════════════════════════════════ */
(function() {
  const heroImg = document.querySelector('.hero-bg-img');
  if (!heroImg) return;
  function swapHeroImg() {
    if (window.innerWidth <= 768) {
      if (heroImg.currentSrc !== heroImg.src) return; // srcset handles it
      heroImg.src = 'images/hero/hero-mobile.webp';
    } else {
      heroImg.src = 'images/hero/hero-desktop.jpg';
    }
  }
  // Only swap if srcset not supported
  if (!('srcset' in heroImg)) {
    swapHeroImg();
    window.addEventListener('resize', swapHeroImg, { passive: true });
  }
})();
