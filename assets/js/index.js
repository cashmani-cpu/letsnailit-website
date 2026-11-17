(function () {
  'use strict';

  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzgJ9BX5TKTlOTKqPf-cMGcd9ZXSPcPCB4zTN8PNhlns_kfpyxfuwV3LWRhYGoQe2K_/exec';
  const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const DISPATCH_IDS = ['dispatch1','dispatch2','dispatch3'];
  const MODAL_IDS = ['bookModal'];
  const MIN_GUESTS = 10;
  const PRICE_PER_PERSON = 1500;
  const ALL_MODALS = MODAL_IDS.concat(DISPATCH_IDS);

  const lockedOpenCount = { n: 0 };
  let lastFocus = null;
  let activeKeyHandler = null;

  /* Fire a lead-conversion signal to both ad platforms so campaigns have something to optimize toward */
  function trackLead(formType) {
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: formType });
    if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form_type: formType });
  }

  function lockScroll() {
    lockedOpenCount.n++;
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    lockedOpenCount.n = Math.max(0, lockedOpenCount.n - 1);
    if (lockedOpenCount.n === 0) document.body.style.overflow = '';
  }

  function refreshDateBounds() {
    const today = new Date().toISOString().split('T')[0];
    const max = new Date();
    max.setMonth(max.getMonth() + 6);
    const maxStr = max.toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(inp => {
      inp.min = today;
      inp.max = maxStr;
    });
  }

  function trapFocus(container) {
    const focusables = container.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    activeKeyHandler = function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    container.addEventListener('keydown', activeKeyHandler);
    // Prefer close button, fall back to first field
    const preferred = container.querySelector('[data-close-modal], [data-close-dispatch], [aria-label="Close"]');
    const firstField = container.querySelector('input:not([type="hidden"]), select, textarea');
    (firstField || preferred || first).focus();
  }
  function releaseFocus(container) {
    if (activeKeyHandler) {
      container.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m || !m.classList.contains('hidden')) return;
    lastFocus = document.activeElement;
    m.classList.remove('hidden');
    lockScroll();
    refreshDateBounds();
    requestAnimationFrame(() => trapFocus(m));
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m || m.classList.contains('hidden')) return;
    m.classList.add('hidden');
    unlockScroll();
    releaseFocus(m);
  }

  /* Event delegation — no inline onclick */
  document.addEventListener('click', function (e) {
    /* Drawer backdrop / nav links carry data-close-menu; handle before modals and
       don't return — the drawer CTA pairs data-close-menu with data-open-modal */
    const closeMenuTgt = e.target.closest('[data-close-menu]');
    if (closeMenuTgt) {
      const menu = document.getElementById('mobile-menu');
      if (menu && !menu.classList.contains('hidden')) window.toggleMobileMenu();
    }

    const openModalTgt = e.target.closest('[data-open-modal]');
    const closeModalTgt = e.target.closest('[data-close-modal]');
    /* An element may carry both (e.g. "switch to another modal") — close, then open, don't short-circuit */
    if (openModalTgt || closeModalTgt) {
      if (closeModalTgt) closeModal(closeModalTgt.dataset.closeModal);
      if (openModalTgt) openModal(openModalTgt.dataset.openModal);
      return;
    }

    const openDispatchTgt = e.target.closest('[data-open-dispatch]');
    if (openDispatchTgt) { openModal(openDispatchTgt.dataset.openDispatch); return; }

    const closeDispatchTgt = e.target.closest('[data-close-dispatch]');
    if (closeDispatchTgt) { closeModal(closeDispatchTgt.dataset.closeDispatch); return; }
  });

  /* Escape closes whichever modal is open */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    ALL_MODALS.forEach(id => {
      const m = document.getElementById(id);
      if (m && !m.classList.contains('hidden')) closeModal(id);
    });
    const menu = document.getElementById('mobile-menu');
    if (menu && !menu.classList.contains('hidden')) toggleMobileMenu();
  });

  /* Group booking form: venue toggle, 10-guest minimum, running estimate */
  document.querySelectorAll('form[data-group-booking]').forEach(form => {
    const areaWrap = form.querySelector('[data-venue-area]');
    const areaInput = areaWrap ? areaWrap.querySelector('input') : null;
    const guests = form.querySelector('[data-min-guests]');
    const total = form.querySelector('[data-guest-total]');

    function syncVenue() {
      const picked = form.querySelector('input[name="venue"]:checked');
      const theirs = picked && picked.dataset.venue === 'yours';
      if (!areaWrap || !areaInput) return;
      areaWrap.classList.toggle('hidden', !theirs);
      areaInput.disabled = !theirs;
      areaInput.required = theirs;
    }
    function syncGuests() {
      if (!guests) return;
      const n = parseInt(guests.value, 10);
      if (guests.value !== '' && (isNaN(n) || n < MIN_GUESTS)) {
        guests.setCustomValidity('We need at least ' + MIN_GUESTS + ' suspects. Gather a few more, or message us on WhatsApp.');
      } else {
        guests.setCustomValidity('');
      }
      if (total) {
        total.textContent = (!isNaN(n) && n >= MIN_GUESTS)
          ? 'Estimate: ₹' + (n * PRICE_PER_PERSON).toLocaleString('en-IN') + ' for ' + n + ' guests (food and drinks not included).'
          : 'Minimum ' + MIN_GUESTS + ' guests · ₹' + PRICE_PER_PERSON.toLocaleString('en-IN') + ' per person.';
      }
    }
    form.querySelectorAll('input[name="venue"]').forEach(r => r.addEventListener('change', syncVenue));
    if (guests) guests.addEventListener('input', syncGuests);
    syncVenue();
    syncGuests();
  });

  /* Form POST with success/error handling */
  document.querySelectorAll('form[data-form-flow]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const errorEl = form.querySelector('[data-form-error]');
      if (errorEl) { errorEl.classList.add('hidden'); errorEl.textContent = ''; }

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'Dispatching...';
      submitBtn.disabled = true;

      try {
        const payload = Object.fromEntries(new FormData(form));
        const url = FORM_ENDPOINT + '?' + new URLSearchParams({ ...payload, _t: Date.now() }).toString();
        const response = await fetch(url, { redirect: 'follow' });
        const json = await response.json();
        if (!json.ok) throw new Error('Bad response');
        trackLead(payload.form_type || form.dataset.formFlow);
        const successMsg = form.dataset.success || "We'll be in touch shortly to confirm your booking.";
        form.innerHTML =
          '<div class="text-center py-6" role="status" aria-live="polite">' +
          '<p class="font-headline text-5xl font-black text-newsprint-accent mb-3" aria-hidden="true">✓</p>' +
          '<h3 class="font-headline text-2xl font-black uppercase mb-2">Dispatch Received.</h3>' +
          '<p class="text-sm italic text-newsprint-ink/80">' + successMsg + '</p>' +
          '</div>';
      } catch (err) {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        if (errorEl) {
          errorEl.textContent = 'Dispatch failed — please try again or email hello@letsnailit.com.';
          errorEl.classList.remove('hidden');
        }
      }
    });
  });

  /* Mobile menu toggle */
  window.toggleMobileMenu = function () {
    const menu = document.getElementById('mobile-menu');
    const content = document.getElementById('mobile-menu-content');
    const toggle = document.getElementById('mobile-menu-toggle');
    if (!menu || !content) return;

    if (menu.classList.contains('hidden')) {
      lastFocus = document.activeElement;
      menu.classList.remove('hidden');
      void content.offsetHeight; // force reflow so the transform animates
      content.classList.remove('translate-x-full');
      lockScroll();
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => trapFocus(content));
    } else {
      content.classList.add('translate-x-full');
      setTimeout(() => {
        menu.classList.add('hidden');
        unlockScroll();
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        releaseFocus(content);
      }, 300);
    }
  };

  /* Wire the mobile menu toggle (no inline onclick) */
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', window.toggleMobileMenu);
  document.querySelectorAll('[data-toggle="mobile-menu"]').forEach(el => {
    el.addEventListener('click', window.toggleMobileMenu);
  });

  /* Classifieds: one notice on phones, the rest behind a "More notices" toggle */
  document.querySelectorAll('[data-toggle-notices]').forEach(btn => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    const closedLabel = btn.innerHTML;
    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = open ? 'Fewer notices&nbsp;«' : closedLabel;
    });
  });

  /* Refresh date bounds at load + whenever the page is revealed after midnight */
  refreshDateBounds();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDateBounds(); });
})();
