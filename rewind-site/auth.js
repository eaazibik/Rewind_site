// ============================================================
//  auth.js — Rewind Luxury Place
//  Handles: sign-up, login, logout, session state
// ============================================================

import { supabase } from './supabase.js';

// Current user's profile cached here after sign-in
export let currentProfile = null;
export const SUPERADMIN_EMAIL = 'agucharles667@gmail.com';

// ── Helpers ──────────────────────────────────────────────────
function showMsg(elId, text, isError = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.style.color  = isError ? '#e07070' : '#7ec87e';
  el.style.display = text ? 'block' : 'none';
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled     = loading;
  btn.dataset.orig = btn.dataset.orig || btn.textContent;
  btn.textContent  = loading ? 'Please wait…' : btn.dataset.orig;
}

// ── Session: update nav on load ───────────────────────────────
export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  updateNavForSession(session);

  if (session?.user) await loadProfile(session.user.id);

  supabase.auth.onAuthStateChange((_event, session) => {
    updateNavForSession(session);
    if (session?.user) loadProfile(session.user.id);
    else currentProfile = null;
  });
}

export async function loadProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) { console.warn('loadProfile:', error.message); currentProfile = null; return null; }
  currentProfile = data;
  return currentProfile;
}

export async function requestAdminApproval() {
  if (!currentProfile) throw new Error('Not signed in');
  const { error } = await supabase.from('admin_requests').insert({ user_id: currentProfile.id, status: 'pending' });
  if (error) throw error;
  return true;
}

export async function fetchAdminRequests() {
  // only intended for superadmin front-end use
  const { data, error } = await supabase.from('admin_requests').select('*').eq('status', 'pending');
  if (error) throw error;
  return data;
}

export async function approveAdmin(userId) {
  // Only superadmin should call this from UI
  const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
  if (error) throw error;
  // mark request handled if exists
  await supabase.from('admin_requests').update({ status: 'approved' }).eq('user_id', userId);
  return true;
}

export async function revokeAdmin(userId) {
  // Only superadmin should call this from UI
  const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', userId);
  if (error) throw error;
  return true;
}

export function canCreatePost() {
  if (!currentProfile) return false;
  if (currentProfile.email === SUPERADMIN_EMAIL) return true;
  return currentProfile.role === 'admin' || currentProfile.role === 'superadmin';
}

function updateNavForSession(session) {
  const loginLink  = document.getElementById('navLoginLink');
  const logoutLink = document.getElementById('navLogoutLink');
  const greet      = document.getElementById('navGreet');

  if (!loginLink) return;

  if (session?.user) {
    const name = session.user.user_metadata?.full_name || session.user.email;
    if (greet)      { greet.textContent = `Hi, ${name.split(' ')[0]}`; greet.style.display = 'inline'; }
    if (loginLink)  loginLink.style.display  = 'none';
    if (logoutLink) logoutLink.style.display = 'inline';
  } else {
    if (greet)      greet.style.display      = 'none';
    if (loginLink)  loginLink.style.display  = 'inline';
    if (logoutLink) logoutLink.style.display = 'none';
  }
}

// ── Sign Up ───────────────────────────────────────────────────
export async function handleSignUp(e) {
  e.preventDefault();
  const name     = document.getElementById('su-name').value.trim();
  const email    = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const confirm  = document.getElementById('su-confirm').value;

  if (password !== confirm) { showMsg('su-msg', 'Passwords do not match.', true); return; }
  if (password.length < 8)  { showMsg('su-msg', 'Password must be at least 8 characters.', true); return; }

  setLoading('su-btn', true);
  showMsg('su-msg', '');

  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) { showMsg('su-msg', error.message, true); setLoading('su-btn', false); return; }

  // 2. Save to profiles table (also done by DB trigger if you set one up)
  if (data.user) {
    const { error: dbErr } = await supabase.from('profiles').upsert({
      id:         data.user.id,
      email:      data.user.email,
      full_name:  name,
      created_at: new Date().toISOString()
    });
    if (dbErr) console.warn('Profile insert:', dbErr.message);
  }

  setLoading('su-btn', false);
  showMsg('su-msg', '✓ Account created! Check your email to confirm, then log in.');
  document.getElementById('signupForm')?.reset();
}

// ── Login ─────────────────────────────────────────────────────
export async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-password').value;

  setLoading('li-btn', true);
  showMsg('li-msg', '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) { showMsg('li-msg', error.message, true); setLoading('li-btn', false); return; }

  setLoading('li-btn', false);
  closeModal('authModal');
}

// ── Logout ────────────────────────────────────────────────────
export async function handleLogout() {
  await supabase.auth.signOut();
}

// ── Modal helpers ─────────────────────────────────────────────
export function openModal(id)  {
  const m = document.getElementById(id);
  if (m) {
    m.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const box = m.querySelector('.modal-box');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
export function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.style.display = 'none'; document.body.style.overflow = ''; }
}
export function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.style.display = 'none');
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`panel-${tab}`).style.display = 'block';
}
