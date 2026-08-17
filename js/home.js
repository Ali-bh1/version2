/* ============================================================
   home.js — Homepage + program-page interactions (Revamp 2026)
   Plain script (no modules). Safe to load on any .h26 page.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Image fallbacks (portraits you haven't dropped in yet) ── */
  function initFallbacks() {
    document.querySelectorAll('img[data-fallback]').forEach(function (img) {
      var swap = function () {
        if (img.dataset.fbDone) return;
        img.dataset.fbDone = '1';
        img.src = img.dataset.fallback;
      };
      img.addEventListener('error', swap);
      // the error may already have fired before this script ran
      if (img.complete && img.naturalWidth === 0) swap();
    });
  }

  /* ── Word-by-word headline split ── */
  function splitWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (!node.textContent.trim()) return;
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'w';
        s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    Array.prototype.forEach.call(el.querySelectorAll('.w'), function (w, i) {
      w.style.transitionDelay = (i * 55) + 'ms';
    });
    el.classList.add('split-w');
  }

  function initSplits() {
    if (reduced) return;
    document.querySelectorAll('[data-split]').forEach(splitWords);
  }

  /* ── Scroll reveal (text, figures, hairlines, headlines) ── */
  function initReveals() {
    var els = document.querySelectorAll('.reveal, .fig, .hair, .split-w');
    if (!('IntersectionObserver' in window) || !els.length) {
      Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }

  /* ── Parallax on figure interiors ── */
  function initParallax() {
    if (reduced) return;
    var items = Array.prototype.map.call(
      document.querySelectorAll('[data-plx]'),
      function (el) { return { el: el, sp: parseFloat(el.dataset.plx) || 0.15 }; }
    );
    if (!items.length) return;

    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var host = it.el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var delta = ((r.top + r.height / 2) - vh / 2) / vh; // -1 … 1
        it.el.style.transform = 'translate3d(0,' + (delta * it.sp * 100).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ── Count-up figures ── */
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var pre = el.dataset.prefix || '';
      var suf = el.dataset.suffix || '';
      if (reduced || !('IntersectionObserver' in window)) {
        el.textContent = pre + target + suf;
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.disconnect();
          var t0 = performance.now(), dur = 1500;
          (function step(t) {
            var p = Math.min(1, (t - t0) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = pre + Math.round(target * eased) + suf;
            if (p < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      }, { threshold: 0.15 });
      io.observe(el);
    });
  }

  /* ── Scroll progress hairline ── */
  function initProgress() {
    var bar = document.querySelector('.sprog i');
    if (!bar) return;
    var doc = document.documentElement;
    function upd() {
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? doc.scrollTop / max : 0) + ')';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  /* ── Mobile nav ── */
  function initNav() {
    var burger = document.querySelector('.nav-burger');
    var menu = document.querySelector('.mobile-nav');
    if (!burger || !menu) return;
    burger.addEventListener('click', function () {
      var open = menu.hasAttribute('hidden');
      if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.setAttribute('hidden', '');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Contact form (sends to hello@tejaldesae.com + Google Sheet) ── */
  function initContact() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstName = (document.getElementById('cn').value || '').trim();
      var lastName  = (document.getElementById('cl').value || '').trim();
      var email     = (document.getElementById('cm').value || '').trim();
      var phone     = (document.getElementById('cp').value || '').trim();
      var program   = (document.getElementById('cg').value || '').trim();
      var message   = (document.getElementById('cx').value || '').trim();
      var agreed    = document.getElementById('cc').checked;
      var err       = document.getElementById('cerr');
      var submitBtn = form.querySelector('button[type="submit"]');
      err.style.color = '';
      if (!firstName) { err.textContent = 'Please add your first name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please add a valid email.'; return; }
      if (!agreed) { err.textContent = 'Please tick the box so we can reply to you.'; return; }

      // Disable form while sending
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      import('./js/lead-service.js').then(function (mod) {
        return mod.sendLead({
          source:    'Contact Form',
          firstName: firstName,
          lastName:  lastName,
          email:     email,
          phone:     phone,
          program:   program,
          message:   message,
        });
      }).then(function (result) {
        err.style.color = 'var(--forest)';
        if (result && result.email) {
          err.textContent = 'Thank you \u2014 I\'ll be in touch within 24\u201348 hours, Mon\u2013Fri.';
        } else {
          err.textContent = 'Thank you \u2014 I\'ll be in touch within 24\u201348 hours, Mon\u2013Fri.';
        }
        form.querySelectorAll('input,select,textarea,button').forEach(function (x) { x.disabled = true; });
      }).catch(function () {
        err.style.color = 'var(--forest)';
        err.textContent = 'Thank you \u2014 I\'ll be in touch within 24\u201348 hours, Mon\u2013Fri.';
        form.querySelectorAll('input,select,textarea,button').forEach(function (x) { x.disabled = true; });
      });
    });
  }

  /* ── Program page: payment + quiz gate ── */
  function initBooking() {
    var book = document.querySelector('.book[data-program]');
    if (!book) return;

    var slug = book.getAttribute('data-program');
    var quizDone = localStorage.getItem('tejal_eq_done') === '1';

    // The quiz is free and public, so this is a courtesy thank-you — NOT a
    // paywall. It shows only when Razorpay itself redirects back with
    // ?paid=1 after a real checkout. (A static page cannot verify payment;
    // Razorpay is the source of truth for the booking.)
    var params = new URLSearchParams(location.search);
    if (params.get('paid') !== '1') return;
    history.replaceState(null, '', location.pathname + location.hash);

    var unlock = book.querySelector('.unlock');
    var unlockBtn = book.querySelector('[data-unlock-btn]');
    var unlockText = book.querySelector('[data-unlock-text]');

    book.classList.add('paid');
    if (unlock) unlock.classList.add('on');
    if (quizDone) {
      if (unlockText) unlockText.textContent = 'I’ll be in touch to schedule it. You’ve already found your Expansion Quotient — revisit it any time before we speak.';
      if (unlockBtn) {
        unlockBtn.textContent = 'See your results →';
        var id = localStorage.getItem('tejal_submission_id');
        unlockBtn.href = id ? ('report.html?id=' + encodeURIComponent(id)) : 'report.html';
      }
    } else if (unlockBtn) {
      unlockBtn.href = 'assessment.html?program=' + encodeURIComponent(slug);
    }
  }

  function boot() {
    initFallbacks();
    initSplits();
    initReveals();
    initParallax();
    initCounters();
    initProgress();
    initNav();
    initContact();
    initBooking();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})();
