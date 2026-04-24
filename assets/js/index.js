(function () {
  'use strict';

  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzgJ9BX5TKTlOTKqPf-cMGcd9ZXSPcPCB4zTN8PNhlns_kfpyxfuwV3LWRhYGoQe2K_/exec';
  const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const DISPATCH_IDS = ['dispatch1','dispatch2','dispatch3'];
  const MODAL_IDS = ['partyModal','privateModal'];
  const ALL_MODALS = MODAL_IDS.concat(DISPATCH_IDS);

  const lockedOpenCount = { n: 0 };
  let lastFocus = null;
  let activeKeyHandler = null;

  function updateMobileCta() {
    const bar = document.querySelector('.mobile-cta-bar');
    if (!bar) return;
    const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    bar.classList.toggle('is-visible', y > 180);
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

  function openModalFromHash() {
    let target = null;
    if (window.location.hash === '#reserve' || window.location.hash === '#book') {
      target = 'partyModal';
    } else if (window.location.hash === '#private-event') {
      target = 'privateModal';
    }
    if (!target) return;
    ALL_MODALS.forEach(id => {
      if (id !== target) closeModal(id);
    });
    window.setTimeout(() => openModal(target), 150);
  }

  /* Event delegation — no inline onclick */
  document.addEventListener('click', function (e) {
    const openModalTgt = e.target.closest('[data-open-modal]');
    if (openModalTgt) {
      e.preventDefault();
      const modalId = openModalTgt.dataset.openModal;
      if (openModalTgt.hasAttribute('data-close-menu') && typeof window.toggleMobileMenu === 'function') {
        window.toggleMobileMenu();
        window.setTimeout(() => openModal(modalId), 320);
      } else {
        openModal(modalId);
      }
      return;
    }

    const closeModalTgt = e.target.closest('[data-close-modal]');
    if (closeModalTgt) { closeModal(closeModalTgt.dataset.closeModal); return; }

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

  /* Waitlist form handler — called after sold-out screen is injected */
  function attachWaitlistHandler(waitlistForm) {
    waitlistForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!waitlistForm.checkValidity()) { waitlistForm.reportValidity(); return; }
      const btn = waitlistForm.querySelector('button[type="submit"]');
      const errorEl = waitlistForm.querySelector('[data-form-error]');
      if (errorEl) { errorEl.classList.add('hidden'); errorEl.textContent = ''; }
      const orig = btn.textContent;
      btn.textContent = 'Dispatching...';
      btn.disabled = true;
      try {
        const payload = Object.fromEntries(new FormData(waitlistForm));
        const url = FORM_ENDPOINT + '?' + new URLSearchParams({ ...payload, _t: Date.now() }).toString();
        const res = await fetch(url, { redirect: 'follow' });
        const json = await res.json();
        if (!json.ok) throw new Error('bad response');
        waitlistForm.innerHTML =
          '<div class="text-center py-6" role="status" aria-live="polite">' +
          '<p class="font-headline text-5xl font-black text-newsprint-accent mb-3" aria-hidden="true">✓</p>' +
          '<h3 class="font-headline text-2xl font-black uppercase mb-2">You\'re on the list.</h3>' +
          '<p class="text-sm italic text-newsprint-ink/80">We\'ll contact you the moment a seat opens up for 25 April 2026.</p>' +
          '</div>';
      } catch (err) {
        btn.textContent = orig; btn.disabled = false;
        if (errorEl) { errorEl.textContent = 'Dispatch failed — please try again or email hello@letsnailit.com.'; errorEl.classList.remove('hidden'); }
      }
    });
  }

  /* Real Formspree POST with success/error handling */
  document.querySelectorAll('form[data-form-flow]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      /* Reservation form: April 25 is sold out — capture data then offer one-click waitlist */
      if (form.dataset.formFlow === 'reservation') {
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const captured = Object.fromEntries(new FormData(form));
        /* Always save their details immediately — regardless of waitlist choice */
        const silentPayload = { ...captured, form_type: 'reservation_interest', date: '2026-04-25' };
        fetch(FORM_ENDPOINT + '?' + new URLSearchParams({ ...silentPayload, _t: Date.now() }).toString(), { redirect: 'follow' });
        const modal = form.closest('.gazette-modal');
        modal.innerHTML =
          '<button type="button" data-close-modal="partyModal"' +
          ' class="absolute top-3 right-4 text-2xl font-bold hover:text-newsprint-accent transition-colors" aria-label="Close">&times;</button>' +
          '<p class="text-[10px] uppercase tracking-widest font-bold text-newsprint-accent mb-1">SOLD OUT — 25 APRIL 2026</p>' +
          '<h2 class="font-headline text-3xl font-black uppercase leading-tight mb-1">This Evening is Full.</h2>' +
          '<p class="text-xs italic text-newsprint-ink/80 mb-6 border-b border-newsprint-ink/30 pb-4">Every seat for 25 April has been claimed. Would you like to join the waitlist? We\'ll reach out the moment something opens up — or when the next date is announced.</p>' +
          '<div data-form-error class="hidden mb-3 text-[11px] text-newsprint-accent font-bold uppercase tracking-widest"></div>' +
          '<button id="wl-confirm-btn" class="w-full bg-newsprint-ink text-newsprint-base py-3 font-black uppercase tracking-widest hover:bg-newsprint-accent transition-colors shadow-lg mb-3">YES, JOIN THE WAITLIST »</button>' +
          '<button type="button" data-close-modal="partyModal" class="w-full border border-newsprint-ink/40 py-3 font-black uppercase tracking-widest text-sm hover:border-newsprint-accent hover:text-newsprint-accent transition-colors">No thanks</button>';
        modal.querySelectorAll('[data-close-modal]').forEach(btn => {
          btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
        });
        const confirmBtn = modal.querySelector('#wl-confirm-btn');
        const errorEl = modal.querySelector('[data-form-error]');
        confirmBtn.addEventListener('click', async function () {
          confirmBtn.textContent = 'Dispatching...';
          confirmBtn.disabled = true;
          try {
            const payload = { ...captured, form_type: 'waitlist', date: '2026-04-25' };
            const url = FORM_ENDPOINT + '?' + new URLSearchParams({ ...payload, _t: Date.now() }).toString();
            const res = await fetch(url, { redirect: 'follow' });
            const json = await res.json();
            if (!json.ok) throw new Error('bad response');
            modal.innerHTML =
              '<div class="text-center py-6" role="status" aria-live="polite">' +
              '<p class="font-headline text-5xl font-black text-newsprint-accent mb-3" aria-hidden="true">✓</p>' +
              '<h3 class="font-headline text-2xl font-black uppercase mb-2">You\'re on the list.</h3>' +
              '<p class="text-sm italic text-newsprint-ink/80">We\'ll contact you the moment a seat opens up for 25 April 2026.</p>' +
              '</div>';
          } catch (err) {
            confirmBtn.textContent = 'YES, JOIN THE WAITLIST »';
            confirmBtn.disabled = false;
            if (errorEl) { errorEl.textContent = 'Dispatch failed — please try again or email hello@letsnailit.com.'; errorEl.classList.remove('hidden'); }
          }
        });
        return;
      }

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

  /* Refresh date bounds at load + whenever the page is revealed after midnight */
  refreshDateBounds();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDateBounds(); });
  window.addEventListener('scroll', updateMobileCta, { passive: true });
  document.addEventListener('scroll', updateMobileCta, { passive: true });
  updateMobileCta();
  window.setTimeout(() => {
    const bar = document.querySelector('.mobile-cta-bar');
    if (bar) bar.classList.add('is-visible');
  }, 1600);

  window.addEventListener('hashchange', openModalFromHash);
  openModalFromHash();
})();
