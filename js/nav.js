/**
 * nav.js — Inject consistent navbar + mobile menu on every page.
 */
export function injectNav() {
  // Some pages ship their own masthead. Do not stack a second nav on top.
  if (document.querySelector('.nav, #nav')) return;

  const isHome = location.pathname.endsWith('index.html') ||
                 location.pathname === '/' ||
                 location.pathname.endsWith('/');

  const href = (anchor) => isHome ? anchor : `index.html${anchor}`;

  const navHTML = `
  <nav class="nav${isHome ? '' : ' scrolled'}" aria-label="Main navigation">
    <a href="${isHome ? '#' : 'index.html'}" class="nav-logo">Tejal Desae</a>
    <ul class="nav-links">
      <li><a href="${href('#method')}">The Method</a></li>
      <li><a href="${href('#programs')}">Programs</a></li>
      <li><a href="${href('#about')}">About</a></li>
    </ul>
    <a href="index.html#book" class="nav-cta" data-specular>Book a Call</a>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="mobile-menu" aria-hidden="true">
    <a href="${href('#method')}">The Method</a>
    <a href="${href('#programs')}">Programs</a>
    <a href="${href('#about')}">About</a>
    <a href="${href('#contact')}">Contact</a>
  </div>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
}
