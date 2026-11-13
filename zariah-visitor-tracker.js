/* ZARIAH first-party visitor event collector.
 * Stores a random session-scoped identifier only; does not collect IP, names,
 * phone numbers, precise location, form contents or full referrer URLs.
 */
(function(w,d){
  'use strict';
  if(w.__zariahVisitorTrackingStarted)return;
  w.__zariahVisitorTrackingStarted=true;
  var KEY='zariah_visitor_session_v1', visitorId='';
  try{
    visitorId=w.sessionStorage.getItem(KEY)||'';
    if(!/^[0-9a-f-]{36}$/i.test(visitorId)){
      visitorId=(w.crypto&&w.crypto.randomUUID)?w.crypto.randomUUID():'';
      if(visitorId)w.sessionStorage.setItem(KEY,visitorId);
    }
  }catch(e){}
  if(!visitorId||typeof w.ZARIAH_LOAD_SUPABASE!=='function')return;
  var path=(w.location.pathname||'/').slice(0,500);
  var sessionStarted=false;
  try{sessionStarted=w.sessionStorage.getItem('zariah_visitor_started_v1')==='1';}catch(e){}
  var eventType='page_view', productSlug=null;
  var productMatch=path.match(/^\/products\/([^/]+)/i);
  if(productMatch){eventType='product_view';productSlug=productMatch[1].slice(0,160);}
  else if(/^\/pages\/cart\/?/i.test(path))eventType='cart_view';
  else if(/^\/pages\/checkout\/?/i.test(path))eventType='checkout_view';
  var ua=navigator.userAgent||'';
  var device=/ipad|tablet/i.test(ua)?'tablet':/mobile|android|iphone/i.test(ua)?'mobile':'desktop';
  var referrerHost='';
  try{if(d.referrer){var u=new URL(d.referrer);if(u.origin!==w.location.origin)referrerHost=u.hostname;}}catch(e){}
  var activeRecord=null, queuedEvents=Array.isArray(w.ZARIAH_PENDING_TRACK_EVENTS)?w.ZARIAH_PENDING_TRACK_EVENTS.splice(0):[];
  var sending=false, sendAttempts=0, maxSendAttempts=3;
  function diagnostic(status,type,error){
    var detail={status:status,eventType:type||eventType,pagePath:path};
    if(error){detail.code=error.code||null;detail.message=String(error.message||error).slice(0,180);}
    try{w.dispatchEvent(new CustomEvent('zariah:analytics-status',{detail:detail}));}catch(e){}
    if(w.console&&typeof w.console.warn==='function')w.console.warn('[ZARIAH analytics]',detail);
  }
  function recordWithRetry(record,type,slug,attempt){
    return record(type,slug).then(function(result){
      if(result&&result.error)throw result.error;
      diagnostic('sent',type);
      return result;
    }).catch(function(error){
      if(attempt>=2){diagnostic('failed',type,error);throw error;}
      return new Promise(function(resolve){w.setTimeout(resolve,500*(attempt+1));})
        .then(function(){return recordWithRetry(record,type,slug,attempt+1);});
    });
  }
  w.ZARIAH_TRACK_EVENT=function(type,slug){
    if(!/^(product_view|product_click|cart_add)$/.test(type))return false;
    var item={type:type,slug:String(slug||'').slice(0,160)};
    if(activeRecord){recordWithRetry(activeRecord,item.type,item.slug,0).catch(function(){});}
    else queuedEvents.push(item);
    return true;
  };
  function send(){
    if(sending||sendAttempts>=maxSendAttempts)return;
    sending=true;sendAttempts++;
    w.ZARIAH_LOAD_SUPABASE().then(function(sdk){
      var config=w.ZARIAH_SUPABASE_CONFIG||{};
      if(!config.url||!config.publishableKey)throw new Error('Supabase storefront config is missing.');
      var client=sdk.createClient(config.url,config.publishableKey);
      function record(type,slug){
        return client.rpc('record_visitor_event',{
          p_visitor_id:visitorId,p_event_type:type,p_page_path:path,
          p_referrer_host:referrerHost||null,p_device_type:device,p_product_slug:slug||productSlug
        });
      }
      activeRecord=record;
      var chain=Promise.resolve();
      if(!sessionStarted){
        chain=recordWithRetry(record,'session_start',null,0).then(function(){
          sessionStarted=true;
          try{w.sessionStorage.setItem('zariah_visitor_started_v1','1');}catch(e){}
        });
      }
      return chain.then(function(){return recordWithRetry(record,eventType,productSlug,0);})
        .then(function flushQueued(){
          if(!queuedEvents.length)return;
          var item=queuedEvents[0];
          return recordWithRetry(record,item.type,item.slug,0).then(function(){
            queuedEvents.shift();
            return flushQueued();
          });
        });
    }).then(function(){
      diagnostic('ready',eventType);
      sending=false;
    }).catch(function(error){
      diagnostic('retrying',eventType,error);
      sending=false;
      if(sendAttempts<maxSendAttempts)w.setTimeout(send,1500*sendAttempts);
    });
  }

  // Track intentional clicks on product links/cards as separate events.
  d.addEventListener('click',function(event){
    var target=event.target;
    if(target&&target.nodeType===3)target=target.parentElement;
    var link=target&&target.closest?target.closest('a[href]'):null;
    if(!link)return;
    var match=(link.getAttribute('href')||'').match(/(?:^|\/)products\/([^/?#]+)/i);
    if(!match)return;
    var slug=match[1].slice(0,160);
    w.ZARIAH_TRACK_EVENT('product_click',slug);
  },true);

  // Privilege Club conversion prompt: 60 seconds of visible, recently active time.
  // Session-scoped dismissal; never interrupts cart, checkout, or the membership page.
  (function(){
    var currentPath=(w.location.pathname||'/').toLowerCase();
    if(/^\/pages\/(privilege-club|cart|checkout)(\/|$)/.test(currentPath))return;
    var dismissedKey='zariah_privilege_prompt_dismissed_v1';
    try{if(w.sessionStorage.getItem(dismissedKey)==='1')return;}catch(e){}
    var activeMs=0,lastTick=Date.now(),lastActivity=Date.now(),shown=false;
    var REQUIRED=60000,INACTIVITY=30000;
    function activity(){lastActivity=Date.now();}
    ['pointerdown','pointermove','keydown','scroll','touchstart'].forEach(function(name){
      d.addEventListener(name,activity,{passive:true});
    });
    function closePrompt(){
      var node=d.getElementById('zariah-privilege-prompt');
      if(node)node.remove();
      try{w.sessionStorage.setItem(dismissedKey,'1');}catch(e){}
    }
    function showPrompt(){
      if(shown)return;
      shown=true;
      // If the visitor is already signed in, do not show a membership acquisition prompt.
      function render(){
        if(d.hidden)return;
        var style=d.createElement('style');
        style.id='zariah-privilege-prompt-style';
        style.textContent='#zariah-privilege-prompt{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:18px;background:rgba(20,18,16,.58);backdrop-filter:blur(3px)}#zariah-privilege-prompt .zpc-card{position:relative;box-sizing:border-box;width:min(100%,440px);padding:34px 30px 28px;background:#f5f1ea;color:#302b25;border:1px solid #d4c4aa;box-shadow:0 24px 80px rgba(0,0,0,.25);text-align:center;font-family:Georgia,serif}#zariah-privilege-prompt .zpc-kicker{font:600 10px/1.5 Arial,sans-serif;letter-spacing:.2em;color:#9a7950}#zariah-privilege-prompt h2{margin:14px 0 12px;font:normal clamp(25px,6vw,32px)/1.2 Georgia,serif}#zariah-privilege-prompt p{margin:0 auto 22px;max-width:330px;font:14px/1.7 Arial,sans-serif;color:#62594f}#zariah-privilege-prompt .zpc-join{display:block;width:100%;box-sizing:border-box;padding:15px 18px;background:#302b25;color:#fff;text-decoration:none;font:600 10px/1.2 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase}#zariah-privilege-prompt .zpc-later{margin-top:16px;border:0;background:transparent;color:#766d62;font:12px Arial,sans-serif;text-decoration:underline;cursor:pointer;padding:8px 14px}#zariah-privilege-prompt .zpc-close{position:absolute;top:10px;right:12px;border:0;background:transparent;color:#62594f;font:24px/1 Arial,sans-serif;cursor:pointer;padding:6px}#zariah-privilege-prompt .zpc-join:focus-visible,#zariah-privilege-prompt button:focus-visible{outline:2px solid #9a7950;outline-offset:3px}@media(max-width:480px){#zariah-privilege-prompt .zpc-card{padding:32px 22px 24px}}';
        var wrap=d.createElement('div');
        wrap.id='zariah-privilege-prompt';
        wrap.setAttribute('role','dialog');
        wrap.setAttribute('aria-modal','true');
        wrap.setAttribute('aria-labelledby','zpc-title');
        wrap.innerHTML='<div class="zpc-card"><button class="zpc-close" type="button" aria-label="Close">×</button><div class="zpc-kicker">ZARIAH STUDIO · PRIVILEGE CLUB</div><h2 id="zpc-title">A little more luxury.<br>A little more privilege.</h2><p>Discover exclusive membership benefits, earn points and enjoy rewards as you shop.</p><a class="zpc-join" href="/pages/privilege-club/">Join the Privilege Club</a><button class="zpc-later" type="button">Maybe later</button></div>';
        (d.head||d.documentElement).appendChild(style);
        d.body.appendChild(wrap);
        wrap.querySelector('.zpc-close').addEventListener('click',closePrompt);
        wrap.querySelector('.zpc-later').addEventListener('click',closePrompt);
        wrap.addEventListener('click',function(event){if(event.target===wrap)closePrompt();});
        var join=wrap.querySelector('.zpc-join');
        join.addEventListener('click',function(){try{w.sessionStorage.setItem(dismissedKey,'1');}catch(e){}});
      }
      if(typeof w.ZARIAH_LOAD_SUPABASE==='function'){
        w.ZARIAH_LOAD_SUPABASE().then(function(sdk){
          var cfg=w.ZARIAH_SUPABASE_CONFIG||{};
          if(!cfg.url||!cfg.publishableKey){render();return;}
          var client=sdk.createClient(cfg.url,cfg.publishableKey);
          return client.auth.getSession().then(function(result){
            if(!result.error&&result.data&&result.data.session)return;
            render();
          }).catch(render);
        }).catch(render);
      }else render();
    }
    function tick(){
      var now=Date.now(),elapsed=Math.max(0,Math.min(now-lastTick,2000));
      lastTick=now;
      if(!d.hidden&&now-lastActivity<INACTIVITY)activeMs+=elapsed;
      if(activeMs>=REQUIRED){showPrompt();return;}
      w.setTimeout(tick,1000);
    }
    d.addEventListener('visibilitychange',function(){lastTick=Date.now();});
    w.addEventListener('focus',activity);
    tick();
  })();

  if('requestIdleCallback' in w)w.requestIdleCallback(send,{timeout:2500});
  else w.setTimeout(send,1200);
})(window,document);
