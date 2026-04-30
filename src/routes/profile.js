const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbRun, dbGet, dbAll, logActivity } = require('../db');

const router = express.Router();

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email FROM users WHERE id = ?', [req.session.userId]);
    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);
    res.json({ success: true, user, profile: profile || {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load profile.' });
  }
});

router.post('/profile', requireAuth, async (req, res) => {
  try {
    const { name, age, education, skills, interests } = req.body;

    if (age && (isNaN(age) || age < 10 || age > 100)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid age (10–100).' });
    }

    if (name && name.trim().length >= 2) {
      await dbRun('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.session.userId]);
      req.session.userName = name.trim();
    }

    await dbRun(
      `
      INSERT INTO user_profiles (user_id, age, education, skills, interests, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        age        = excluded.age,
        education  = excluded.education,
        skills     = excluded.skills,
        interests  = excluded.interests,
        updated_at = CURRENT_TIMESTAMP
    `,
      [req.session.userId, age || null, education || '', skills || '', interests || '']
    );

    await logActivity(req.session.userId, 'profile_update', {});

    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

router.delete('/profile', requireAuth, async (req, res) => {
  try {
    await dbRun(
      `
      UPDATE user_profiles SET age = NULL, education = '', skills = '', interests = '', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `,
      [req.session.userId]
    );
    await dbRun('DELETE FROM career_recommendations WHERE user_id = ?', [req.session.userId]);
    await logActivity(req.session.userId, 'profile_clear', {});
    res.json({ success: true, message: 'Profile data cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear profile.' });
  }
});

router.get('/export', requireAuth, async (req, res) => {
  try {
    const user = await dbGet('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.session.userId]);
    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);
    const recommendations = await dbAll(
      'SELECT career_title, match_score, description, learning_path, generated_at FROM career_recommendations WHERE user_id = ? ORDER BY match_score DESC',
      [req.session.userId]
    );
    const goals = await dbAll('SELECT * FROM user_goals WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
    const saved = await dbAll('SELECT * FROM saved_careers WHERE user_id = ?', [req.session.userId]);

    const parsed = recommendations.map(r => ({
      ...r,
      learning_path: JSON.parse(r.learning_path || '[]')
    }));

    res.json({
      success: true,
      exported_at: new Date().toISOString(),
      user,
      profile: profile || {},
      recommendations: parsed,
      goals,
      saved_careers: saved
    });
  } catch (err) {
    console.error('export:', err.message);
    res.status(500).json({ success: false, error: 'Export failed.' });
  }
});

module.exports = router;
