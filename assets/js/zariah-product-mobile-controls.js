(()=>{'use strict';
const sku=String(document.querySelector('[data-product-id]')?.dataset.productId||location.pathname.split('/').filter(Boolean).pop()||'').toLowerCase();
const key='zariah_wishlist_v1';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch(_){return[]}};
const write=v=>{try{localStorage.setItem(key,JSON.stringify([...new Set(v)]));window.dispatchEvent(new CustomEvent('zariah:wishlist-updated',{detail:{items:read()}}));return true}catch(_){return false}};
const count=()=>{const n=read().length;document.querySelectorAll('[data-wishlist-count]').forEach(el=>el.textContent=String(n));return n};
function mount(){
 const header=document.querySelector('body:has(.product-layout)>header');
 if(header&&!header.querySelector('.z-product-mobile-tools')){
  const tools=document.createElement('div');tools.className='z-product-mobile-tools';
  tools.innerHTML='<a href="/pages/search/" aria-label="Search">⌕</a><button type="button" id="zProductWishlistHeader" aria-label="Wishlist">♡ <span class="z-product-tool-count" data-wishlist-count>0</span></button><a href="/pages/cart/" aria-label="Shopping bag">♧ <span class="z-product-tool-count" data-cart-count>0</span></a>';
  const menu=header.querySelector('.z-mobile-menu-toggle');header.insertBefore(tools,menu||null);
 }
 const ann=document.querySelector('body:has(.product-layout) .ann');
 if(ann&&!ann.dataset.mobileTrustReady){
  ann.dataset.mobileTrustReady='true';
  ann.innerHTML='<span>COMPLIMENTARY DELIVERY ACROSS BANGLADESH</span><span class="ann-separator" aria-hidden="true">•</span><span>DOORSTEP INSPECTION &amp; CASH ON DELIVERY</span>';
 }
 const add=document.querySelector('.z-add-cart');
 if(add&&!document.querySelector('.z-product-quantity')){
  const qty=document.createElement('div');qty.className='z-product-quantity';
  qty.innerHTML='<label for="zProductQuantity">QUANTITY</label><div class="z-product-qty-control"><button type="button" data-qty-step="-1" aria-label="Decrease quantity">−</button><input id="zProductQuantity" type="number" min="1" max="10" step="1" value="1" inputmode="numeric" aria-label="Quantity"><button type="button" data-qty-step="1" aria-label="Increase quantity">+</button></div>';
  add.parentNode.insertBefore(qty,add);
  qty.addEventListener('click',e=>{const b=e.target.closest('[data-qty-step]');if(!b)return;const input=qty.querySelector('input');input.value=String(Math.max(1,Math.min(10,(Number(input.value)||1)+Number(b.dataset.qtyStep))));});
  qty.querySelector('input').addEventListener('change',e=>{e.target.value=String(Math.max(1,Math.min(10,Math.floor(Number(e.target.value)||1))));});
 }
 if(add&&!document.querySelector('.z-product-actions')){
  const actions=document.createElement('div');actions.className='z-product-actions';
  add.parentNode.insertBefore(actions,add);
  actions.appendChild(add);
  const buy=add.parentNode.querySelector('.z-product-buy-now');if(buy)actions.appendChild(buy);
  const wa=add.parentNode.querySelector('.z-wa-enquire');if(wa)actions.appendChild(wa);
 }
 const copy=document.querySelector('.product-copy');
 if(copy&&!copy.querySelector('.z-product-wishlist')){
  const btn=document.createElement('button');btn.type='button';btn.className='z-product-wishlist';btn.id='zProductWishlist';btn.setAttribute('aria-pressed',String(read().includes(sku)));btn.innerHTML='<span aria-hidden="true">♡</span><span>Save to Wishlist</span>';
  const anchor=copy.querySelector('.z-product-actions')||copy.querySelector('.z-add-cart');
  if(anchor)anchor.insertAdjacentElement('afterend',btn);
  btn.addEventListener('click',()=>{const current=read();const active=current.includes(sku);const next=active?current.filter(x=>x!==sku):[...current,sku];if(!write(next))return;btn.setAttribute('aria-pressed',String(!active));btn.querySelector('span:last-child').textContent=active?'Save to Wishlist':'Saved to Wishlist';btn.querySelector('span:first-child').textContent=active?'♡':'♥';count();});
 }
 if(copy&&!copy.querySelector('.z-product-trust')){
  const trust=document.createElement('div');trust.className='z-product-trust';
  trust.innerHTML='<p><b>✓</b><span><strong>Doorstep Verification:</strong> Inspect your bag upon delivery anywhere in Bangladesh before completing payment.</span></p><p><b>♧</b><span><strong>Nationwide Delivery:</strong> Dispatched in protective dustbag &amp; custom carton box.</span></p><p><b>◷</b><span><strong>Cash on Delivery &amp; MFS:</strong> Pay comfortably with cash, bKash or Nagad.</span></p>';
  const wa=copy.querySelector('.z-wa-enquire');(wa||copy.querySelector('.note')||copy.lastElementChild)?.insertAdjacentElement('afterend',trust);
 }
 const headBtn=document.getElementById('zProductWishlistHeader');
 if(headBtn&&!headBtn.dataset.bound){headBtn.dataset.bound='true';headBtn.addEventListener('click',()=>document.getElementById('zProductWishlist')?.click());}
 count();if(window.ZariahCart)window.ZariahCart.updateCount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.addEventListener('storage',e=>{if(e.key===key||e.key===null)count();});
window.addEventListener('zariah:wishlist-updated',count);
})();