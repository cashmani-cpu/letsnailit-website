(function () {
  'use strict';

  var pixelId = '1121055437750097';
  var measurementId = 'G-QVYK1LYM7R';

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  var gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
  document.head.appendChild(gtagScript);

  if (!window.fbq) {
    window.fbq = function () {
      window.fbq.callMethod ?
        window.fbq.callMethod.apply(window.fbq, arguments) :
        window.fbq.queue.push(arguments);
    };
    window.fbq.queue = [];
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
  }

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');

  var pixelScript = document.createElement('script');
  pixelScript.async = true;
  pixelScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(pixelScript);
})();
