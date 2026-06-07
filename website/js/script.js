'use strict';

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Mobile burger menu ──
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav__mobile-link, .nav__mobile .btn').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── Preview tabs ──
document.querySelectorAll('.preview__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.preview__tab').forEach(t => t.classList.remove('preview__tab--active'));
    document.querySelectorAll('.preview__panel').forEach(p => p.classList.remove('preview__panel--active'));
    tab.classList.add('preview__tab--active');
    const id = 'tab-' + tab.dataset.tab;
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('preview__panel--active');
  });
});

// ── FAQ accordion ──
document.querySelectorAll('.faq__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── Toast notification ──
function showToast(msg, duration = 3500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Notify form ──
const notifyForm = document.getElementById('notifyForm');
if (notifyForm) {
  notifyForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('notifyEmail').value.trim();
    if (!email) return;
    notifyForm.reset();
    showToast('✓ Danke! Wir benachrichtigen dich sobald die App verfügbar ist.');
  });
}

// ── Download button click feedback ──
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
  downloadBtn.addEventListener('click', e => {
    setTimeout(() => showToast('⬇️ Download wurde gestartet!'), 300);
  });
}

// ── Intersection Observer: fade-in on scroll ──
const fadeEls = document.querySelectorAll(
  '.feature-card, .platform-card, .step, .faq__item, .notify-box, .download-box'
);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.55s ease both';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.animationDelay = `${i * 0.05}s`;
    io.observe(el);
  });
}

// Inject keyframe if not already in CSS (fallback)
if (!document.getElementById('lc-keyframes')) {
  const style = document.createElement('style');
  style.id = 'lc-keyframes';
  style.textContent = `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
