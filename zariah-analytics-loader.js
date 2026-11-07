/* ZARIAH Studio — deferred analytics bootstrap
 * Keeps GA4, Meta Pixel and Microsoft Clarity APIs/queues available immediately,
 * while postponing third-party network requests until the browser is idle.
 * Existing measurement IDs and PageView events are preserved.
 */
(function (window, document) {
  'use strict';
  if (window.__zariahAnalyticsBootstrapped) return;
  window.__zariahAnalyticsBootstrapped = true;

  var GA_ID = 'G-VWTCQTCSN1';
  var META_ID = '1765030204483711';
  var CLARITY_ID = 'wznd21x0gs';

  // GA4 queue: all events issued before gtag.js arrives remain queued.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href
  });

  // Meta Pixel queue: preserve PageView and any later commerce/lead events.
  if (!window.fbq) {
    var fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
  }
  window.fbq('init', META_ID);
  window.fbq('track', 'PageView');

  // Clarity's standard queue stub keeps calls safe until its script is loaded.
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  var started = false;
  function inject(src, id) {
    if (document.querySelector('script[data-zariah-analytics="' + id + '"]')) return;
    var script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.setAttribute('data-zariah-analytics', id);
    (document.head || document.documentElement).appendChild(script);
  }
  function loadThirdPartyAnalytics() {
    if (started) return;
    started = true;
    inject('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID), 'ga4');
    inject('https://connect.facebook.net/en_US/fbevents.js', 'meta-pixel');
    inject('https://www.clarity.ms/tag/' + encodeURIComponent(CLARITY_ID), 'clarity');
  }

  // Let the initial render/LCP get a head start, then use an idle slot.
  window.setTimeout(function () {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadThirdPartyAnalytics, { timeout: 1600 });
    } else {
      loadThirdPartyAnalytics();
    }
  }, 1500);
})(window, document);
