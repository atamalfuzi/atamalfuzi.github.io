/* main.js — shared across all pages */

// Year in footer
document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());

// Mobile nav toggle (aria-expanded drives the CSS); Escape closes it
const hamburger = document.getElementById('hamburger');
if (hamburger) {
  const setMenu = open => hamburger.setAttribute('aria-expanded', open);
  hamburger.addEventListener('click', () => setMenu(hamburger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
}

// Scroll reveal (also fills the skill bars, via .visible .skill-bar-fill in CSS)
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// Project filter buttons — uses includes() so cards with multiple categories match correctly
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.setAttribute('aria-pressed', b === btn));
    const filter = btn.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      card.style.display = filter === 'all' || cats.includes(filter) ? '' : 'none';
    });
  });
});
