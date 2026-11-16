/* Maps existing production-tested commerce markup to the new visual system.
   This file only adds presentation classes; it does not read or modify commerce data. */
(()=>{'use strict';
const body=document.body;
const page=body.classList.contains('z-commerce-cart')?'cart':body.classList.contains('z-commerce-checkout')?'checkout':body.classList.contains('z-commerce-track')?'track':'';
if(!page)return;
const add=(el,...names)=>{if(el)el.classList.add(...names)};
function decorate(root=document){
 if(page==='cart'){
  root.querySelectorAll('.cart-layout').forEach(e=>add(e,'z-cart-layout'));
  root.querySelectorAll('.item').forEach(e=>{
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
  root.querySelectorAll('.summary').forEach(e=>add(e,'z-order-summary-box'));
  root.querySelectorAll('.summary h2').forEach(e=>add(e,'z-summary-title'));
  root.querySelectorAll('.summary .sumrow').forEach(e=>add(e,'z-summary-row'));
  root.querySelectorAll('.summary .delivery-note').forEach(e=>add(e,'z-summary-note'));
 }
 if(page==='checkout'){
  root.querySelectorAll('.form-section').forEach(e=>add(e,'z-form-section'));
  root.querySelectorAll('.section-heading').forEach(e=>add(e,'z-form-section-head'));
  root.querySelectorAll('.section-number').forEach(e=>add(e,'z-form-section-num'));
  root.querySelectorAll('.section-title').forEach(e=>add(e,'z-form-section-title'));
  root.querySelectorAll('.fields').forEach(e=>add(e,'z-form-grid'));
  root.querySelectorAll('.field').forEach(e=>add(e,'z-form-field'));
  root.querySelectorAll('.field label').forEach(e=>add(e,'z-form-label'));
  root.querySelectorAll('.field input,.field textarea,.field select').forEach(e=>add(e,'z-form-input'));
  root.querySelectorAll('.payment-options').forEach(e=>add(e,'z-radio-cards'));
  root.querySelectorAll('.payment-option').forEach(e=>add(e,'z-radio-card'));
  root.querySelectorAll('.payment-option strong').forEach(e=>add(e,'z-radio-title'));
  root.querySelectorAll('.payment-option small').forEach(e=>add(e,'z-radio-subtitle'));
  root.querySelectorAll('.summary').forEach(e=>add(e,'z-order-summary-box'));
  root.querySelectorAll('.summary h2').forEach(e=>add(e,'z-summary-title'));
  root.querySelectorAll('.summary .row').forEach(e=>add(e,'z-summary-row'));
  root.querySelectorAll('.submit').forEach(e=>add(e,'z-btn-primary','z-btn-full'));
 }
 if(page==='track'){
  root.querySelectorAll('.track-card').forEach(e=>add(e,'z-track-card'));
  root.querySelectorAll('.field').forEach(e=>add(e,'z-form-field'));
  root.querySelectorAll('.field label').forEach(e=>add(e,'z-form-label'));
  root.querySelectorAll('.field input').forEach(e=>add(e,'z-form-input'));
  root.querySelectorAll('.submit').forEach(e=>add(e,'z-btn-primary','z-btn-full'));
 }
}
decorate();
const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)decorate(n);});
observer.observe(document.body,{childList:true,subtree:true});
})();
