// ============================================================
//  script.js — Rewind Luxury Place
// ============================================================

import {
  initAuth, handleSignUp, handleLogin, handleLogout,
  openModal, closeModal, switchTab
} from './auth.js';

// ── Mobile menu ───────────────────────────────────────────────
const burgerBtn  = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

burgerBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burgerBtn.setAttribute('aria-expanded', open);
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
  });
});

// ── Scroll reveals ─────────────────────────────────────────────
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── Auth modal wiring ──────────────────────────────────────────
// Open / close buttons
document.getElementById('navLoginLink')?.addEventListener('click',  e => { e.preventDefault(); openModal('authModal'); switchTab('login'); });
document.getElementById('navLogoutLink')?.addEventListener('click', e => { e.preventDefault(); handleLogout(); });
document.getElementById('modalClose')?.addEventListener('click',    ()  => closeModal('authModal'));
document.getElementById('authModal')?.addEventListener('click',     e  => { if (e.target.id === 'authModal') closeModal('authModal'); });

// Tab switching
document.querySelectorAll('.auth-tab').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

// Forms
document.getElementById('signupForm')?.addEventListener('submit',  handleSignUp);
document.getElementById('loginForm')?.addEventListener('submit',   handleLogin);

// Cross-links inside modal
document.getElementById('goToSignup')?.addEventListener('click', e => { e.preventDefault(); switchTab('signup'); });
document.getElementById('goToLogin')?.addEventListener('click',  e => { e.preventDefault(); switchTab('login');  });

// ── Init session ───────────────────────────────────────────────
initAuth();
