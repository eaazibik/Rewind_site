// ============================================================
//  script.js — Rewind Luxury Place
// ============================================================

import {
  initAuth, handleSignUp, handleLogin, handleLogout,
  openModal, closeModal, switchTab
} from './auth.js';
import { currentProfile, loadProfile, requestAdminApproval, fetchAdminRequests, approveAdmin, revokeAdmin, canCreatePost, SUPERADMIN_EMAIL } from './auth.js';

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

// Admin UI wiring
const adminPanel = document.getElementById('adminPanel');
const adminGreet = document.getElementById('adminGreet');
const requestAdminBtn = document.getElementById('requestAdminBtn');
const postForm = document.getElementById('postForm');
const postSubmit = document.getElementById('postSubmit');
const postTitle = document.getElementById('postTitle');
const postBody = document.getElementById('postBody');
const postImage = document.getElementById('postImage');
const superadminPanel = document.getElementById('superadminPanel');
const adminRequestsList = document.getElementById('adminRequestsList');

async function updateAdminUI() {
  // Wait for profile to be loaded
  if (!window || !document) return;
  const { data: { session } } = await import('./supabase.js').then(m => m.supabase.auth.getSession());
  const user = session?.user;
  if (!user) {
    adminPanel.style.display = 'none';
    return;
  }
  // ensure profile loaded
  await loadProfile(user.id);

  adminPanel.style.display = 'block';
  adminGreet.textContent = `Signed in: ${user.email}`;

  // show request button if not admin
  if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'superadmin' && user.email !== SUPERADMIN_EMAIL)) {
    requestAdminBtn.style.display = 'block';
  } else {
    requestAdminBtn.style.display = 'none';
  }

  // show post form only if allowed
  if (canCreatePost()) {
    postForm.style.display = 'block';
  } else {
    postForm.style.display = 'none';
  }

  // show superadmin panel
  if (user.email === SUPERADMIN_EMAIL) {
    superadminPanel.style.display = 'block';
    await refreshAdminRequests();
  } else {
    superadminPanel.style.display = 'none';
  }
}

requestAdminBtn?.addEventListener('click', async () => {
  try {
    requestAdminBtn.disabled = true;
    await requestAdminApproval();
    requestAdminBtn.textContent = 'Requested ✓';
  } catch (err) {
    console.error(err);
    requestAdminBtn.textContent = 'Request failed';
  } finally { requestAdminBtn.disabled = false; }
});

async function refreshAdminRequests() {
  adminRequestsList.innerHTML = 'Loading...';
  try {
    const requests = await fetchAdminRequests();
    if (!requests || requests.length === 0) { adminRequestsList.innerHTML = '<div style="opacity:0.8">No pending requests</div>'; return; }
    adminRequestsList.innerHTML = '';
    for (const r of requests) {
      const el = document.createElement('div');
      el.style.padding = '8px'; el.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      el.innerHTML = `<div style="font-size:0.9rem;">${r.user_id}</div>`;
      const approve = document.createElement('button'); approve.textContent = 'Approve'; approve.className = 'btn btn-ghost'; approve.style.marginRight = '6px';
      const deny = document.createElement('button'); deny.textContent = 'Deny'; deny.className = 'btn';
      approve.addEventListener('click', async () => { await approveAdmin(r.user_id); await refreshAdminRequests(); });
      deny.addEventListener('click', async () => { await revokeAdmin(r.user_id); await refreshAdminRequests(); });
      el.appendChild(approve); el.appendChild(deny);
      adminRequestsList.appendChild(el);
    }
  } catch (err) { adminRequestsList.innerHTML = 'Error loading'; console.error(err); }
}

postForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  postSubmit.disabled = true;
  try {
    let imageUrl = null;
    if (postImage.files && postImage.files[0]) {
      // Read file as data URL and store in posts.image_url (simple approach)
      const f = postImage.files[0];
      imageUrl = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });
    }
    const supabase = (await import('./supabase.js')).supabase;
    const { data, error } = await supabase.from('posts').insert({ author_id: currentProfile.id, title: postTitle.value, body: postBody.value, image_url: imageUrl });
    if (error) throw error;
    postTitle.value = ''; postBody.value = ''; postImage.value = null;
    alert('Post created');
  } catch (err) { console.error(err); alert('Failed to create post'); }
  finally { postSubmit.disabled = false; }
});

// Periodically update admin UI (and once now)
setTimeout(updateAdminUI, 700);
setInterval(updateAdminUI, 12000);
