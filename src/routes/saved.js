const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbRun, dbGet, dbAll, logActivity } = require('../db');
const { getCareerByTitle } = require('../data/careers');

const router = express.Router();

router.get('/saved-careers', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT * FROM saved_careers WHERE user_id = ? ORDER BY created_at DESC',
      [req.session.userId]
    );
    res.json({ success: true, saved: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load saved careers.' });
  }
});

router.post('/saved-careers', requireAuth, async (req, res) => {
  try {
    const { career_title, notes } = req.body;
    if (!career_title || !String(career_title).trim()) {
      return res.status(400).json({ success: false, error: 'career_title is required.' });
    }
    const title = String(career_title).trim();
    if (!getCareerByTitle(title)) {
      return res.status(400).json({ success: false, error: 'Unknown career title.' });
    }

    await dbRun(
      `INSERT INTO saved_careers (user_id, career_title, notes) VALUES (?, ?, ?)
       ON CONFLICT(user_id, career_title) DO UPDATE SET notes = excluded.notes`,
      [req.session.userId, title, notes ? String(notes).slice(0, 2000) : '']
    );

    const row = await dbGet(
      'SELECT * FROM saved_careers WHERE user_id = ? AND career_title = ?',
      [req.session.userId, title]
    );

    await logActivity(req.session.userId, 'saved_career', { career_title: title });

    res.status(201).json({ success: true, message: 'Saved.', saved: row });
  } catch (err) {
    console.error('saved-careers POST:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save.' });
  }
});

router.delete('/saved-careers/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id.' });
    }
    const r = await dbRun('DELETE FROM saved_careers WHERE id = ? AND user_id = ?', [id, req.session.userId]);
    if (r.changes === 0) {
      return res.status(404).json({ success: false, error: 'Not found.' });
    }
    res.json({ success: true, message: 'Removed from saved.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete.' });
  }
});

module.exports = router;
