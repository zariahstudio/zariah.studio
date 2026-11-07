/* ZARIAH Studio — on-demand Supabase SDK loader.
   Keeps the third-party SDK off the parser-blocking path.
   The first feature that needs Supabase calls window.ZARIAH_LOAD_SUPABASE(). */
(function (w, d) {
  'use strict';
  var sdkUrl = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var pending = null;

  w.ZARIAH_LOAD_SUPABASE = function () {
    if (w.supabase && typeof w.supabase.createClient === 'function') {
      return Promise.resolve(w.supabase);
    }
    if (pending) return pending;

    pending = new Promise(function (resolve, reject) {
      var script = d.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.onload = function () {
        if (w.supabase && typeof w.supabase.createClient === 'function') {
          resolve(w.supabase);
        } else {
          pending = null;
          reject(new Error('Supabase SDK loaded but createClient is unavailable.'));
        }
      };
      script.onerror = function () {
        pending = null;
        reject(new Error('Could not load the Supabase SDK.'));
      };
      d.head.appendChild(script);
    });
    return pending;
  };
})(window, document);
