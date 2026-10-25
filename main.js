/* main.js: shared across all pages */

// Year in footer
document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());

// Mobile nav toggle (aria-expanded drives the CSS); Escape closes it
const hamburger = document.getElementById('hamburger');
if (hamburger) {
  const setMenu = open => hamburger.setAttribute('aria-expanded', open);
  hamburger.addEventListener('click', () => setMenu(hamburger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
}
