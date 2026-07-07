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

function observeReveals(root = document) {
  root.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

observeReveals();

// ── Live hours clock ──────────────────────────────────────────
const schedule = [
  { day: 'Sunday', openHour: 12, openMinute: 30 },
  { day: 'Monday', openHour: 12, openMinute: 0 },
  { day: 'Tuesday', openHour: 12, openMinute: 0 },
  { day: 'Wednesday', openHour: 12, openMinute: 0 },
  { day: 'Thursday', openHour: 12, openMinute: 0 },
  { day: 'Friday', openHour: 12, openMinute: 0 },
  { day: 'Saturday', openHour: 8, openMinute: 0 }
];

const statusLabel = document.getElementById('hoursStatusLabel');
const timeValue = document.getElementById('hoursTimeValue');
const timeSub = document.getElementById('hoursTimeSub');
const hoursNote = document.getElementById('hoursNote');

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatClockTime(date) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function getHoursStatus(now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const candidates = [0, -1];
  for (const offset of candidates) {
    const base = new Date(today);
    base.setDate(base.getDate() + offset);
    const entry = schedule[base.getDay()];
    const start = new Date(base);
    start.setHours(entry.openHour, entry.openMinute, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(5, 0, 0, 0);

    if (now >= start && now < end) {
      return {
        isOpen: true,
        targetTime: end,
        label: 'Open now',
        sublabel: 'until closing',
        note: `${entry.day} • open ${formatClockTime(start)} to 5:00 AM`
      };
    }
  }

  const nextStart = new Date(now);
  nextStart.setSeconds(0, 0);
  for (let offset = 0; offset < 8; offset += 1) {
    const base = new Date(today);
    base.setDate(base.getDate() + offset);
    const entry = schedule[base.getDay()];
    const start = new Date(base);
    start.setHours(entry.openHour, entry.openMinute, 0, 0);
    if (start > now) {
      return {
        isOpen: false,
        targetTime: start,
        label: 'Closed now',
        sublabel: 'until opening',
        note: `${entry.day} • opens at ${formatClockTime(start)}`
      };
    }
  }

  return {
    isOpen: false,
    targetTime: new Date(now.getTime() + 60 * 60 * 1000),
    label: 'Closed now',
    sublabel: 'until opening',
    note: 'Check back soon for the next opening time.'
  };
}

function updateHoursClock() {
  const status = getHoursStatus();
  if (!statusLabel || !timeValue || !timeSub || !hoursNote) return;

  const countdown = formatCountdown(Math.max(0, status.targetTime.getTime() - Date.now()));
  statusLabel.textContent = status.label;
  timeValue.textContent = countdown;
  timeSub.textContent = status.sublabel;
  hoursNote.textContent = status.note;
}

updateHoursClock();
setInterval(updateHoursClock, 1000);

// ── Auth modal wiring ──────────────────────────────────────────
// Open / close buttons
document.getElementById('navLoginLink')?.addEventListener('click',  e => { e.preventDefault(); openModal('authModal'); switchTab('login'); });
document.getElementById('mobileLoginLink')?.addEventListener('click', e => { e.preventDefault(); openModal('authModal'); switchTab('login'); mobileMenu.classList.remove('open'); burgerBtn.setAttribute('aria-expanded', 'false'); });
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
const eventForm = document.getElementById('eventForm');
const eventSubmit = document.getElementById('eventSubmit');
const eventTypeSelect = document.getElementById('eventType');
const eventTitle = document.getElementById('eventTitle');
const eventDescription = document.getElementById('eventDescription');
const eventLocation = document.getElementById('eventLocation');
const eventStartTime = document.getElementById('eventStartTime');
const eventImage = document.getElementById('eventImage');
const eventImagePreviewWrap = document.getElementById('eventImagePreviewWrap');
const eventImagePreview = document.getElementById('eventImagePreview');
const superadminPanel = document.getElementById('superadminPanel');
const adminRequestsList = document.getElementById('adminRequestsList');
const eventList = document.getElementById('eventList');
const openEventFormBtn = document.getElementById('openEventFormBtn');
const EVENT_STORAGE_KEY = 'rewind-events';

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
    eventForm.style.display = 'block';
  } else {
    postForm.style.display = 'none';
    eventForm.style.display = 'none';
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
    const authorId = currentProfile?.id || await getCurrentUserId();
    const { error } = await supabase.from('posts').insert({ author_id: authorId, title: postTitle.value, body: postBody.value, image_url: imageUrl });
    if (error) throw error;
    postTitle.value = ''; postBody.value = ''; postImage.value = null;
    alert('Post created');
  } catch (err) { console.error(err); alert('Failed to create post'); }
  finally { postSubmit.disabled = false; }
});

function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatEventDate(value) {
  if (!value) return 'Details coming soon';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Details coming soon';
  return new Intl.DateTimeFormat([], {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date);
}

async function getCurrentUserId() {
  const supabase = (await import('./supabase.js')).supabase;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadOrConvertImage(file) {
  const supabase = (await import('./supabase.js')).supabase;
  try {
    const path = `event-images/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error } = await supabase.storage.from('event-images').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('event-images').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn('Storage upload failed, using data URL fallback:', err);
    return readFileAsDataUrl(file);
  }
}

async function saveEventEntry(entry) {
  try {
    const supabase = (await import('./supabase.js')).supabase;
    const organizerId = entry.organizer_id || await getCurrentUserId();
    if (!organizerId) throw new Error('No authenticated user');
    const { error } = await supabase.from('events').insert({
      organizer_id: organizerId,
      title: entry.title,
      description: entry.description,
      location: entry.location,
      start_time: entry.start_time || null,
      image_url: entry.image_url || null,
      kind: entry.kind,
      is_published: true
    });
    if (error) throw error;
    return { source: 'supabase' };
  } catch (err) {
    const existing = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || '[]');
    existing.unshift({ ...entry, created_at: new Date().toISOString() });
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(existing));
    console.warn('Falling back to local storage for event/flyer:', err);
    return { source: 'local' };
  }
}

function renderEventEntries(entries) {
  if (!eventList) return;
  if (!entries || entries.length === 0) {
    eventList.innerHTML = '<div class="event-empty">No events or flyers have been posted yet.</div>';
    observeReveals();
    return;
  }

  eventList.innerHTML = entries.map(entry => {
    const type = entry.kind === 'flyer' ? 'Flyer' : 'Event';
    const dateLabel = formatEventDate(entry.start_time || entry.created_at);
    const imageMarkup = entry.image_url ? `<img class="event-card-image" src="${escapeHtml(entry.image_url)}" alt="${escapeHtml(entry.title)}">` : '';
    const locationMarkup = entry.location ? `<p><strong>Location:</strong> ${escapeHtml(entry.location)}</p>` : '';
    return `
      <article class="event-card reveal">
        ${imageMarkup}
        <div class="event-card-body">
          <span class="event-pill">${escapeHtml(type)}</span>
          <div class="event-meta">${escapeHtml(dateLabel)}</div>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.description || 'More details coming soon.')}</p>
          ${locationMarkup}
        </div>
      </article>
    `;
  }).join('');
  observeReveals(eventList);
}

async function loadEventEntries() {
  if (!eventList) return;
  eventList.innerHTML = '<div class="event-empty">Loading events…</div>';
  try {
    const supabase = (await import('./supabase.js')).supabase;
    const { data, error } = await supabase.from('events').select('*').eq('is_published', true).order('created_at', { ascending: false });
    if (error) throw error;
    renderEventEntries(data || []);
  } catch (err) {
    const localEntries = JSON.parse(localStorage.getItem(EVENT_STORAGE_KEY) || '[]');
    renderEventEntries(localEntries);
  }
}

eventImage?.addEventListener('change', async () => {
  const file = eventImage.files?.[0];
  if (!file) {
    eventImagePreviewWrap.style.display = 'none';
    eventImagePreview.removeAttribute('src');
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  eventImagePreview.src = dataUrl;
  eventImagePreviewWrap.style.display = 'block';
});

eventForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  eventSubmit.disabled = true;
  try {
    let imageUrl = null;
    if (eventImage.files && eventImage.files[0]) {
      imageUrl = await uploadOrConvertImage(eventImage.files[0]);
    }
    const result = await saveEventEntry({
      title: eventTitle.value.trim(),
      description: eventDescription.value.trim(),
      location: eventLocation.value.trim(),
      start_time: eventStartTime.value || null,
      image_url: imageUrl,
      kind: eventTypeSelect.value
    });
    eventForm.reset();
    eventTypeSelect.value = 'event';
    eventImagePreviewWrap.style.display = 'none';
    eventImagePreview.removeAttribute('src');
    await loadEventEntries();
    alert(result.source === 'supabase' ? 'Event or flyer published.' : 'Event or flyer saved locally for preview.');
  } catch (err) {
    console.error(err);
    alert('Failed to publish event or flyer');
  } finally {
    eventSubmit.disabled = false;
  }
});

openEventFormBtn?.addEventListener('click', () => {
  eventTitle?.focus();
  eventForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Periodically update admin UI (and once now)
setTimeout(updateAdminUI, 700);
setInterval(updateAdminUI, 12000);
loadEventEntries();
