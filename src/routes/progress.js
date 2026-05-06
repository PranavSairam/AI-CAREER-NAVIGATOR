const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbRun, dbGet, dbAll, logActivity } = require('../db');

const router = express.Router();

router.get('/progress', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT career_title, step_index, done FROM learning_progress WHERE user_id = ?',
      [req.session.userId]
    );
    const byCareer = {};
    for (const row of rows) {
      if (!byCareer[row.career_title]) byCareer[row.career_title] = {};
      byCareer[row.career_title][row.step_index] = row.done === 1;
    }
    res.json({ success: true, progress: byCareer });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load progress.' });
  }
});

router.put('/progress', requireAuth, async (req, res) => {
  try {
    const { career_title, step_index, done } = req.body;
    if (!career_title || step_index === undefined) {
      return res.status(400).json({ success: false, error: 'career_title and step_index are required.' });
    }
    const si = parseInt(step_index, 10);
    if (Number.isNaN(si) || si < 0) {
      return res.status(400).json({ success: false, error: 'Invalid step_index.' });
    }
    const d = done === true || done === 1 || done === '1' ? 1 : 0;
    const title = String(career_title).trim();

    await dbRun(
      `INSERT INTO learning_progress (user_id, career_title, step_index, done, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, career_title, step_index) DO UPDATE SET
         done = excluded.done,
         updated_at = CURRENT_TIMESTAMP`,
      [req.session.userId, title, si, d]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('progress PUT:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update progress.' });
  }
});

router.post('/progress/clear', requireAuth, async (req, res) => {
  try {
    const { career_title } = req.body;
    if (!career_title || !String(career_title).trim()) {
      return res.status(400).json({ success: false, error: 'career_title is required.' });
    }
    const title = String(career_title).trim();
    await dbRun('DELETE FROM learning_progress WHERE user_id = ? AND career_title = ?', [
      req.session.userId,
      title
    ]);
    res.json({ success: true, message: 'Progress cleared.' });
  } catch (err) {
    console.error('progress clear:', err.message);
    res.status(500).json({ success: false, error: 'Failed to clear progress.' });
  }
});

router.post('/progress/sync', requireAuth, async (req, res) => {
  try {
    const { career_title, steps } = req.body;
    if (!career_title || !steps || typeof steps !== 'object') {
      return res.status(400).json({ success: false, error: 'career_title and steps object required.' });
    }
    const title = String(career_title).trim();

    await dbRun('DELETE FROM learning_progress WHERE user_id = ? AND career_title = ?', [req.session.userId, title]);

    const entries = Object.entries(steps);
    for (const [k, v] of entries) {
      const si = parseInt(k, 10);
      if (Number.isNaN(si) || si < 0) continue;
      const d = v === true || v === 1 ? 1 : 0;
      if (!d) continue;
      await dbRun(
        'INSERT INTO learning_progress (user_id, career_title, step_index, done) VALUES (?, ?, ?, 1)',
        [req.session.userId, title, si]
      );
    }

    await logActivity(req.session.userId, 'progress_sync', { career_title: title });

    res.json({ success: true, message: 'Progress synced.' });
  } catch (err) {
    console.error('progress sync:', err.message);
    res.status(500).json({ success: false, error: 'Sync failed.' });
  }
});

module.exports = router;
