document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());

// aria-expanded drives the menu's CSS
const hamburger = document.getElementById('hamburger');
if (hamburger) {
  const setMenu = open => hamburger.setAttribute('aria-expanded', open);
  hamburger.addEventListener('click', () => setMenu(hamburger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
}
