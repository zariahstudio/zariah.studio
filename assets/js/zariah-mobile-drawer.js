/* ZARIAH Studio — accessible mobile navigation drawer.
   Isolated controller for the existing homepage hamburger; no third-party dependencies. */
(function(){
  'use strict';
  function init(){
    const trigger=document.getElementById('hamburger')||document.getElementById('zMobileMenuToggle')||document.getElementById('menuToggle');
    const drawer=document.getElementById('zMobileDrawer');
    if(!trigger||!drawer||drawer.dataset.navigationReady==='true')return;
    drawer.dataset.navigationReady='true';

    const panel=drawer.querySelector('.z-mobile-drawer-panel');
    const closeButton=drawer.querySelector('.z-mobile-drawer-close');
    const focusableSelector='a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';
    let previousOverflow='';

    function openDrawer(){
      if(drawer.classList.contains('is-open'))return;
      previousOverflow=document.body.style.overflow;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden','false');
      trigger.setAttribute('aria-expanded','true');
      trigger.setAttribute('aria-label','Close navigation menu');
      document.body.style.overflow='hidden';
      window.requestAnimationFrame(()=>closeButton&&closeButton.focus());
    }
    function closeDrawer(restoreFocus){
      if(!drawer.classList.contains('is-open'))return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden','true');
      trigger.setAttribute('aria-expanded','false');
      trigger.setAttribute('aria-label','Open navigation menu');
      document.body.style.overflow=previousOverflow;
      if(restoreFocus!==false)trigger.focus();
    }

    trigger.addEventListener('click',function(event){
      event.preventDefault();
      if(drawer.classList.contains('is-open'))closeDrawer(false);
      else openDrawer();
    });
    drawer.querySelectorAll('[data-close-drawer]').forEach(function(el){
      el.addEventListener('click',function(event){
        event.preventDefault();
        closeDrawer(true);
      });
    });
    drawer.querySelectorAll('.z-mobile-drawer-links a').forEach(function(link){
      link.addEventListener('click',function(){closeDrawer(false);});
    });
    const wishlistAction=drawer.querySelector('[data-open-wishlist]');
    if(wishlistAction){
      wishlistAction.addEventListener('click',function(event){
        event.preventDefault();
        closeDrawer(false);
        const wishlistTrigger=document.getElementById('zWishlistOpen');
        if(wishlistTrigger){wishlistTrigger.focus();wishlistTrigger.click();}
      });
    }

    document.addEventListener('keydown',function(event){
      if(!drawer.classList.contains('is-open'))return;
      if(event.key==='Escape'){
        event.preventDefault();
        closeDrawer(true);
        return;
      }
      if(event.key!=='Tab'||!panel)return;
      const items=Array.from(panel.querySelectorAll(focusableSelector))
        .filter(el=>el.getClientRects().length>0);
      if(!items.length){event.preventDefault();closeButton&&closeButton.focus();return;}
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();first.focus();
      }
    });

    const wishlistCount=document.getElementById('zWishlistCount');
    const drawerWishlistCount=drawer.querySelector('[data-wishlist-count]');
    if(wishlistCount&&drawerWishlistCount){
      const syncWishlistCount=()=>{drawerWishlistCount.textContent=wishlistCount.textContent.trim()||'0';};
      syncWishlistCount();
      new MutationObserver(syncWishlistCount).observe(wishlistCount,{childList:true,subtree:true,characterData:true});
    }

    window.addEventListener('pageshow',function(){
      if(drawer.classList.contains('is-open'))closeDrawer(false);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
