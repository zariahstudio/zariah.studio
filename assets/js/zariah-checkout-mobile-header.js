(()=>{'use strict';
const key='zariah_wishlist_v1';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string'):[]}catch(_){return[]}};
function init(){
 const header=document.querySelector('body.z-commerce-checkout>header');if(!header||header.querySelector('.z-checkout-mobile-tools'))return;
 const tools=document.createElement('div');tools.className='z-checkout-mobile-tools';
 tools.innerHTML='<button type="button" class="z-checkout-wishlist-toggle" aria-label="View saved wishlist items">♡ <span data-wishlist-count>0</span></button><a href="/pages/cart/" aria-label="Shopping bag">♧ <span data-cart-count>0</span></a>';
 const menu=header.querySelector('.z-mobile-menu-toggle');header.insertBefore(tools,menu||null);
 const panel=document.createElement('section');panel.className='z-checkout-wishlist-panel';panel.hidden=true;panel.setAttribute('aria-label','Saved wishlist items');panel.innerHTML='<div class="z-checkout-wishlist-panel-head"><strong>Saved Wishlist</strong><button type="button" aria-label="Close wishlist">×</button></div><div class="z-checkout-wishlist-items"></div>';
 document.body.appendChild(panel);
 const toggle=tools.querySelector('button'),close=panel.querySelector('button'),items=panel.querySelector('.z-checkout-wishlist-items');
 function render(){const saved=read();tools.querySelector('[data-wishlist-count]').textContent=String(saved.length);items.innerHTML=saved.length?saved.map(sku=>'<a href="/products/'+encodeURIComponent(sku)+'/">'+sku.replace(/([a-z]+)(\d+)/i,'$1 $2')+' <span>View bag →</span></a>').join(''):'<p>No saved bags yet. Save a bag from its product page to see it here.</p>';}
 toggle.addEventListener('click',()=>{render();panel.hidden=!panel.hidden;});
 close.addEventListener('click',()=>{panel.hidden=true;});
 window.addEventListener('storage',e=>{if(e.key===key||e.key===null)render();});
 window.addEventListener('zariah:wishlist-updated',render);
 render();if(window.ZariahCart)window.ZariahCart.updateCount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();