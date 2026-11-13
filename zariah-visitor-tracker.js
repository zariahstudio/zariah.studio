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
  var eventType='page_view', productSlug=null;
  var productMatch=path.match(/^\/products\/([^/]+)/i);
  if(productMatch){eventType='product_view';productSlug=productMatch[1].slice(0,160);}
  else if(/^\/pages\/cart\/?/i.test(path))eventType='cart_view';
  else if(/^\/pages\/checkout\/?/i.test(path))eventType='checkout_view';
  var ua=navigator.userAgent||'';
  var device=/ipad|tablet/i.test(ua)?'tablet':/mobile|android|iphone/i.test(ua)?'mobile':'desktop';
  var referrerHost='';
  try{if(d.referrer){var u=new URL(d.referrer);if(u.origin!==w.location.origin)referrerHost=u.hostname;}}catch(e){}
  var sent=false;
  function send(){
    if(sent)return;
    sent=true;
    w.ZARIAH_LOAD_SUPABASE().then(function(sdk){
      var client=sdk.createClient(w.ZARIAH_SUPABASE_URL,w.ZARIAH_SUPABASE_ANON_KEY);
      return client.rpc('record_visitor_event',{
        p_visitor_id:visitorId,p_event_type:eventType,p_page_path:path,
        p_referrer_host:referrerHost||null,p_device_type:device,p_product_slug:productSlug
      });
    }).catch(function(){});
  }
  if('requestIdleCallback' in w)w.requestIdleCallback(send,{timeout:2500});
  else w.setTimeout(send,1200);
})(window,document);
