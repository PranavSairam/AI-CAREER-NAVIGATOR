const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbGet, dbAll } = require('../db');

const router = express.Router();

function profileCompletion(profile) {
  if (!profile) return 0;
  let n = 0;
  if (profile.skills && profile.skills.trim()) n++;
  if (profile.interests && profile.interests.trim()) n++;
  if (profile.education && profile.education.trim()) n++;
  if (profile.age) n++;
  return Math.round((n / 4) * 100);
}

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);
    const user = await dbGet('SELECT id, created_at FROM users WHERE id = ?', [req.session.userId]);

    const recCount = await dbGet(
      'SELECT COUNT(*) AS c FROM career_recommendations WHERE user_id = ?',
      [req.session.userId]
    );
    const savedCount = await dbGet('SELECT COUNT(*) AS c FROM saved_careers WHERE user_id = ?', [req.session.userId]);
    const goalsOpen = await dbGet(
      'SELECT COUNT(*) AS c FROM user_goals WHERE user_id = ? AND completed = 0',
      [req.session.userId]
    );
    const top = await dbGet(
      'SELECT MAX(match_score) AS m FROM career_recommendations WHERE user_id = ?',
      [req.session.userId]
    );

    const recent = await dbAll(
      `SELECT action, created_at FROM activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`,
      [req.session.userId]
    );

    const pct = profileCompletion(profile);

    res.json({
      success: true,
      stats: {
        profile_completion_percent: pct,
        recommendation_count: recCount?.c || 0,
        saved_career_count: savedCount?.c || 0,
        open_goals_count: goalsOpen?.c || 0,
        top_match_score: top?.m ?? null,
        member_since: user?.created_at || null
      },
      recent_activity: recent
    });
  } catch (err) {
    console.error('stats:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load stats.' });
  }
});

module.exports = router;
