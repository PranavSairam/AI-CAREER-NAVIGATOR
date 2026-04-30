/**
 * AI Career Navigator — Shared Frontend Utilities
 * Module 6: Frontend UI Module
 */

// ── Toast Notifications ──────────────────────────────────────
function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  t.className = type;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  t.classList.add('show');
  clearTimeout(t._tmr);
  t._tmr = setTimeout(() => t.classList.remove('show'), 3600);
}

// ── API Helper ───────────────────────────────────────────────
async function api(method, url, data = null) {
  const opts = { method, headers: {'Content-Type':'application/json'}, credentials:'include' };
  if (data) opts.body = JSON.stringify(data);
  const res  = await fetch(url, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Something went wrong.');
  return json;
}

// ── Auth Guard ───────────────────────────────────────────────
async function requireLogin() {
  try {
    const r = await api('GET', '/api/me');
    return r.user;
  } catch {
    window.location.href = '/login.html';
  }
}

// ── Sidebar Init ─────────────────────────────────────────────
async function initSidebar() {
  const user = await requireLogin();
  if (!user) return null;
  const nameEl   = document.getElementById('sb-name');
  const avatarEl = document.getElementById('sb-avatar');
  if (nameEl)   nameEl.textContent   = user.name;
  if (avatarEl) avatarEl.textContent = (user.name||'U')[0].toUpperCase();
  // Mark active link
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    if (l.getAttribute('href') === page) l.classList.add('active');
  });
  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api('POST', '/api/logout');
      window.location.href = '/login.html';
    });
  }
  return user;
}

// ── Career Icons & Colors ────────────────────────────────────
const careerIcons = {
  'Data Scientist':'📊','Software Developer':'💻','UI/UX Designer':'🎨',
  'Cybersecurity Analyst':'🔒','Cloud Engineer':'☁️','Product Manager':'🗂️',
  'Full Stack Developer':'🌐','AI / ML Engineer':'🤖','Business Analyst':'📈',
  'Mobile App Developer':'📱'
};

// ── Profile Completion Calculator ────────────────────────────
function calcCompletion(profile) {
  if (!profile) return 0;
  let n = 0;
  if (profile.skills    && profile.skills.trim())    n++;
  if (profile.interests && profile.interests.trim()) n++;
  if (profile.education && profile.education.trim()) n++;
  if (profile.age)                                   n++;
  return Math.round((n / 4) * 100);
}

// ── Build Tag HTML ───────────────────────────────────────────
function tagsHtml(text, max = 4) {
  const tags = (text||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0, max);
  return tags.map(t=>`<span class="tag">${t}</span>`).join('');
}
