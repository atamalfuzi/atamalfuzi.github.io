/* main.js — shared across all pages */

// Year in footer
document.querySelectorAll('.yr').forEach(el => el.textContent = new Date().getFullYear());

// Mobile nav toggle
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
}

// Scroll reveal (also fills the skill bars, via .visible .skill-bar-fill in CSS)
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// Project filter buttons — uses includes() so cards with multiple categories match correctly
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.proj-card').forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      card.style.display = filter === 'all' || cats.includes(filter) ? '' : 'none';
    });
  });
});
