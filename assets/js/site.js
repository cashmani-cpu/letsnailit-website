(function () {
  'use strict';

  function getMenuParts() {
    return {
      menu: document.getElementById('mobile-menu'),
      content: document.getElementById('mobile-menu-content'),
      toggle: document.querySelector('[aria-controls="mobile-menu"]')
    };
  }

  function isMenuOpen(menu) {
    return menu && !menu.classList.contains('hidden');
  }

  function toggleMobileMenu(forceOpen) {
    var parts = getMenuParts();
    if (!parts.menu || !parts.content) return;
    var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isMenuOpen(parts.menu);

    if (shouldOpen) {
      parts.menu.classList.remove('hidden');
      void parts.content.offsetHeight;
      parts.content.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
      if (parts.toggle) parts.toggle.setAttribute('aria-expanded', 'true');
    } else {
      parts.content.classList.add('translate-x-full');
      if (parts.toggle) parts.toggle.setAttribute('aria-expanded', 'false');
      window.setTimeout(function () {
        parts.menu.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }
  }

  window.toggleMobileMenu = toggleMobileMenu;

  function updateMobileCta() {
    var bar = document.querySelector('.mobile-cta-bar');
    if (!bar) return;
    if (bar.hasAttribute('data-persistent-cta')) {
      bar.classList.add('is-visible');
      return;
    }
    var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    bar.classList.toggle('is-visible', y > 180);
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-toggle="mobile-menu"]');
    if (toggle) {
      event.preventDefault();
      toggleMobileMenu();
      return;
    }

    var close = event.target.closest('[data-close-menu]');
    if (close) {
      if (!close.matches('a[href]')) event.preventDefault();
      toggleMobileMenu(false);
    }
  });

  document.addEventListener('keydown', function (event) {
    var parts = getMenuParts();
    if (event.key === 'Escape' && isMenuOpen(parts.menu)) toggleMobileMenu(false);
  });

  window.addEventListener('scroll', updateMobileCta, { passive: true });
  document.addEventListener('scroll', updateMobileCta, { passive: true });
  updateMobileCta();
})();
