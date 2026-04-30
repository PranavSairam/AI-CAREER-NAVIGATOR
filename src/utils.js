function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Stable 0–4 bonus from user id + career title (replaces random jitter). */
function stableBonus(userId, careerTitle) {
  const s = `${userId}:${careerTitle}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 5;
}

module.exports = { validateEmail, slugify, stableBonus };
