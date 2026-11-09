/* ZARIAH Studio — practical mini bag drawer */
(()=>{
'use strict';
const cart=window.ZariahCart;if(!cart)return;
const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/css/mini-bag-drawer.css?v=20261109';document.head.appendChild(style);
const overlay=document.createElement('div');overlay.className='zbag-overlay';overlay.hidden=true;
overlay.innerHTML='<aside class="zbag-drawer" role="dialog" aria-modal="true" aria-labelledby="zbag-title"><div class="zbag-head"><div><span class="zbag-kicker">YOUR SELECTION</span><h2 id="zbag-title">Your Bag <span class="zbag-head-count" data-zbag-count>0</span></h2></div><button type="button" class="zbag-close" aria-label="Close bag">×</button></div><div class="zbag-content"></div><div class="zbag-footer"><div class="zbag-subtotal"><span>Subtotal</span><strong data-zbag-subtotal>৳0</strong></div><p class="zbag-delivery">Delivery charge and availability will be confirmed before dispatch.</p><a class="zbag-checkout" href="/pages/checkout/">PROCEED TO CHECKOUT <span>→</span></a><a class="zbag-view" href="/pages/cart/">VIEW FULL BAG</a></div></aside>';
document.body.appendChild(overlay);
const content=overlay.querySelector('.zbag-content'),countNode=overlay.querySelector('[data-zbag-count]'),subtotalNode=overlay.querySelector('[data-zbag-subtotal]');
const money=n=>'৳'+Number(n||0).toLocaleString('en-BD');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lastFocus=null;
function render(){
 const items=cart.read(),total=cart.subtotal(items);
 countNode.textContent=String(cart.count(items));subtotalNode.textContent=money(total);
 if(!items.length){content.innerHTML='<div class="zbag-empty"><span class="zbag-empty-mark">♧</span><h3>Your next favourite is waiting.</h3><p>Your bag is currently empty. Explore the collection and find a piece to carry beautifully.</p><a href="/collections/all-bags/">EXPLORE ALL BAGS →</a></div>';return;}
 content.innerHTML=items.map(item=>'<article class="zbag-item"><a class="zbag-item-image" href="/products/'+encodeURIComponent(item.id)+'/"><img src="'+esc(item.image)+'" alt="'+esc(item.name)+'" loading="lazy"></a><div class="zbag-item-info"><a class="zbag-item-name" href="/products/'+encodeURIComponent(item.id)+'/">'+esc(item.name)+'</a><span class="zbag-item-sku">'+esc(item.id.toUpperCase())+'</span><strong class="zbag-item-price">'+money(item.price)+'</strong><div class="zbag-qty" aria-label="Quantity controls"><button type="button" data-zbag-action="minus" data-id="'+esc(item.id)+'" aria-label="Decrease quantity">−</button><span>'+item.qty+'</span><button type="button" data-zbag-action="plus" data-id="'+esc(item.id)+'" aria-label="Increase quantity" '+(item.qty>=cart.maxQuantity?'disabled':'')+'>+</button></div></div><div class="zbag-item-end"><strong>'+money(item.price*item.qty)+'</strong><button type="button" class="zbag-remove" data-zbag-action="remove" data-id="'+esc(item.id)+'">REMOVE</button></div></article>').join('');
}
function open(){lastFocus=document.activeElement;render();overlay.hidden=false;requestAnimationFrame(()=>{overlay.classList.add('is-open');document.body.classList.add('zbag-lock');overlay.querySelector('.zbag-close').focus();});}
function close(){overlay.classList.remove('is-open');document.body.classList.remove('zbag-lock');setTimeout(()=>{overlay.hidden=true;if(lastFocus?.isConnected)lastFocus.focus();},220);}
document.addEventListener('click',e=>{
 const trigger=e.target.closest('.z-floating-bag,[data-open-your-bag]');
 if(trigger){e.preventDefault();open();return;}
 if(e.target.closest('.zbag-close')||e.target===overlay){close();return;}
 const btn=e.target.closest('[data-zbag-action]');if(!btn)return;
 const item=cart.read().find(x=>x.id===btn.dataset.id);if(!item)return;
 if(btn.dataset.zbagAction==='plus')cart.setQuantity(item.id,item.qty+1);
 if(btn.dataset.zbagAction==='minus'){if(item.qty<=1)cart.remove(item.id);else cart.setQuantity(item.id,item.qty-1);}
 if(btn.dataset.zbagAction==='remove')cart.remove(item.id);
 render();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)close();});
window.addEventListener('zariah:cart-updated',()=>{render();});
window.addEventListener('zariah:open-cart',open);
render();
})();