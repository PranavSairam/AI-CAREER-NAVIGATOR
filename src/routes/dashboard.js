const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbGet, dbAll } = require('../db');

const router = express.Router();

router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.session.userId]);
    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);
    const recs = await dbAll(
      'SELECT * FROM career_recommendations WHERE user_id = ? ORDER BY match_score DESC LIMIT 3',
      [req.session.userId]
    );
    const parsedRecs = recs.map(r => ({ ...r, learning_path: JSON.parse(r.learning_path || '[]') }));

    res.json({ success: true, user, profile: profile || {}, recommendations: parsedRecs });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load dashboard.' });
  }
});

module.exports = router;
