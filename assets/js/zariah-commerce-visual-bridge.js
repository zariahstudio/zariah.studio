/* Maps existing production-tested commerce markup to the new visual system.
   This file only adds presentation classes; it does not read or modify commerce data. */
(()=>{'use strict';
const body=document.body;
const page=body.classList.contains('z-commerce-cart')?'cart':body.classList.contains('z-commerce-checkout')?'checkout':body.classList.contains('z-commerce-track')?'track':'';
if(!page)return;
const add=(el,...names)=>{if(el)el.classList.add(...names)};
const all=(root,selector)=>{const found=[...all(root,selector)];if(root.nodeType===1&&root.matches(selector))found.unshift(root);return found};
function decorate(root=document){
 if(page==='cart'){
  all(root,'.cart-layout').forEach(e=>add(e,'z-cart-layout'));
  all(root,'.item').forEach(e=>{
   add(e,'z-cart-item');
   add(e.querySelector(':scope > a:first-child'),'z-cart-item-img');
   add(e.querySelector(':scope > div:nth-child(2)'),'z-cart-item-info');
   add(e.querySelector('.name'),'z-cart-item-title');
   add(e.querySelector('.meta'),'z-cart-item-meta');
   add(e.querySelector('.price'),'z-cart-item-price');
   add(e.querySelector('.qty'),'z-cart-item-qty');
   add(e.querySelector('.item-end'),'z-cart-item-end');
   add(e.querySelector('.line-total'),'z-cart-item-line-total');
   add(e.querySelector('.remove'),'z-cart-item-remove');
  });
  all(root,'.summary').forEach(e=>add(e,'z-order-summary-box'));
  all(root,'.summary h2').forEach(e=>add(e,'z-summary-title'));
  all(root,'.summary .sumrow').forEach(e=>add(e,'z-summary-row'));
  all(root,'.summary .delivery-note').forEach(e=>add(e,'z-summary-note'));
 }
 if(page==='checkout'){
  all(root,'.layout').forEach(e=>add(e,'z-checkout-layout'));
  all(root,'.form-section').forEach(e=>add(e,'z-form-section'));
  all(root,'.section-heading').forEach(e=>add(e,'z-form-section-head'));
  all(root,'.section-number').forEach(e=>add(e,'z-form-section-num'));
  all(root,'.section-title').forEach(e=>add(e,'z-form-section-title'));
  all(root,'.fields').forEach(e=>add(e,'z-form-grid'));
  all(root,'.field').forEach(e=>add(e,'z-form-field'));
  all(root,'.field label').forEach(e=>add(e,'z-form-label'));
  all(root,'.field input,.field textarea,.field select').forEach(e=>add(e,'z-form-input'));
  all(root,'.payment-options').forEach(e=>add(e,'z-radio-cards'));
  all(root,'.payment-option').forEach(e=>add(e,'z-radio-card'));
  all(root,'.payment-option strong').forEach(e=>add(e,'z-radio-title'));
  all(root,'.payment-option small').forEach(e=>add(e,'z-radio-subtitle'));
  all(root,'.summary').forEach(e=>add(e,'z-order-summary-box'));
  all(root,'.summary h2').forEach(e=>add(e,'z-summary-title'));
  all(root,'.summary .row').forEach(e=>add(e,'z-summary-row'));
  all(root,'.submit').forEach(e=>add(e,'z-btn-primary','z-btn-full'));
 }
 if(page==='track'){
  all(root,'.intro').forEach(e=>add(e,'z-content-hero'));
  all(root,'.intro p').forEach(e=>add(e,'z-coll-desc'));
  all(root,'.lookup').forEach(e=>add(e,'z-content-body','z-track-card'));
  all(root,'.track-card').forEach(e=>add(e,'z-track-card'));
  all(root,'.field').forEach(e=>add(e,'z-form-field'));
  all(root,'.field label').forEach(e=>add(e,'z-form-label'));
  all(root,'.field input').forEach(e=>add(e,'z-form-input'));
  all(root,'.submit').forEach(e=>add(e,'z-btn-primary','z-btn-full'));
 }
}
decorate();
const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)decorate(n);});
observer.observe(document.body,{childList:true,subtree:true});
})();
