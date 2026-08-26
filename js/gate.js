/**
 * gate.js — keeps the assessment and the report behind a paid booking.
 *
 * This is a convenience layer, not the security boundary. It hides the page
 * until /api/me confirms the visitor's cookie, and offers a way back in if
 * they no longer have their link. Anything that must actually stay private
 * has to be checked server-side before it is sent.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('gated');

  var style = document.createElement('style');
  style.textContent = [
    'html.gated body > *:not(.gate-panel){visibility:hidden}',
    'html.gate-open body > *:not(.gate-panel){visibility:visible}',
    '.gate-panel{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;',
    'justify-content:center;padding:24px;background:#0B2A1D;',
    "font-family:'Jost',Montserrat,system-ui,sans-serif}",
    '.gate-card{width:100%;max-width:460px;background:rgba(255,255,255,.05);',
    'border:1px solid rgba(199,172,109,.42);padding:clamp(26px,5vw,40px);text-align:center}',
    ".gate-card h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;",
    'font-size:clamp(26px,5vw,34px);line-height:1.15;color:#e6d3a3;margin:0 0 14px}',
    '.gate-card p{font-size:15px;line-height:1.7;color:rgba(255,255,255,.88);margin:0 0 20px}',
    '.gate-card input{width:100%;box-sizing:border-box;padding:15px 16px;font-size:16px;',
    'font-family:inherit;color:#fff;background:rgba(0,0,0,.25);',
    'border:1px solid rgba(199,172,109,.42);margin-bottom:12px}',
    '.gate-card input:focus{outline:2px solid #C7AC6D;outline-offset:1px}',
    '.gate-card button{width:100%;padding:16px 22px;font-family:inherit;font-size:12.5px;',
    'font-weight:700;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;',
    'color:#0B2A1D;background:linear-gradient(135deg,#F2E7C6,#E6D3A3 46%,#C7AC6D);',
    'border:1px solid #C7AC6D}',
    '.gate-card button[disabled]{opacity:.6;cursor:default}',
    '.gate-note{font-size:13.5px;color:rgba(255,255,255,.66);margin:16px 0 0}',
    '.gate-note a{color:#C7AC6D}',
    '.gate-msg{font-size:14px;line-height:1.6;margin:14px 0 0;color:#e6d3a3;min-height:1.2em}',
  ].join('');
  document.head.appendChild(style);

  function open() {
    root.classList.add('gate-open');
    root.classList.remove('gated');
    var panel = document.querySelector('.gate-panel');
    if (panel) panel.remove();
  }

  function lock(reason) {
    var panel = document.createElement('div');
    panel.className = 'gate-panel';
    panel.innerHTML = [
      '<div class="gate-card">',
      '<h1>This part is for people who have booked</h1>',
      '<p>', reason, '</p>',
      '<form id="gate-form" novalidate>',
      '<label for="gate-email" class="sr-only" style="position:absolute;left:-9999px">Email address</label>',
      '<input id="gate-email" type="email" name="email" placeholder="The email you paid with"',
      ' autocomplete="email" inputmode="email" required>',
      '<button type="submit">Email me my link</button>',
      '</form>',
      '<p class="gate-msg" id="gate-msg" role="status" aria-live="polite"></p>',
      '<p class="gate-note">Haven’t booked yet? <a href="/index.html#book">Book your call</a>.</p>',
      '</div>',
    ].join('');
    document.body.appendChild(panel);

    var form = panel.querySelector('#gate-form');
    var msg = panel.querySelector('#gate-msg');
    var button = form.querySelector('button');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      if (!email) { msg.textContent = 'Please enter your email address.'; return; }

      button.disabled = true;
      msg.textContent = 'Sending…';

      fetch('/api/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.message) {
            msg.textContent = data.message;
          } else if (data && data.error === 'too_many_requests') {
            msg.textContent = 'Too many attempts. Please try again in an hour.';
            button.disabled = false;
          } else {
            msg.textContent = 'Something went wrong. Email hello@tejaldesae.com and we’ll sort it out.';
            button.disabled = false;
          }
        })
        .catch(function () {
          msg.textContent = 'Could not reach the server. Please try again in a moment.';
          button.disabled = false;
        });
    });
  }

  /* If the page names a localStorage key and that key is set, this visitor
     already has their own result on this device — there is nothing to
     recover and nothing to protect them from. Someone who has just finished
     the assessment must never be told the page is "for people who have
     booked"; the gate is only for a device that has no result on it. */
  var openIf = document.currentScript && document.currentScript.dataset.openIf;
  if (openIf) {
    var stored = null;
    try { stored = localStorage.getItem(openIf); } catch (e) { /* storage blocked */ }
    /* open() only toggles classes on documentElement and removes a panel
       that cannot exist yet, so it is safe to call before the body parses —
       and calling it now avoids a flash of hidden content. */
    if (stored) { open(); return; }
  }

  /* Local preview escape hatch. Restricted to loopback hostnames so it can
     never do anything on the live site — it exists purely so the gated
     pages can be looked at while designing them. */
  var LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\])$/;
  if (LOOPBACK.test(location.hostname) && /[?&]preview=1/.test(location.search)) {
    open();
    return;
  }

  fetch('/api/me', { credentials: 'same-origin' })
    .then(function (r) { return r.ok ? open() : r.status; })
    .then(function (status) {
      if (status === undefined) return; // already opened
      var invalid = /[?&]link=invalid\b/.test(location.search);
      lock(invalid
        ? 'That link didn’t work — it may have been copied incompletely. Put in the email you paid with and we’ll send a fresh one.'
        : 'Put in the email you paid with and we’ll send your private link straight over.');
    })
    .catch(function () {
      lock('We couldn’t check your access just now. Put in the email you paid with and we’ll send your link.');
    });
})();
