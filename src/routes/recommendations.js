const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbRun, dbGet, dbAll, logActivity } = require('../db');
const { generateRecommendations } = require('../services/recommendationEngine');

const router = express.Router();

router.post('/recommendations/generate', requireAuth, async (req, res) => {
  try {
    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);

    if (!profile || (!profile.skills && !profile.interests)) {
      return res.status(400).json({
        success: false,
        error: 'Please complete your profile with skills and interests first.'
      });
    }

    const recommendations = generateRecommendations(
      profile.skills || '',
      profile.interests || '',
      profile.education || '',
      req.session.userId
    );

    await dbRun('DELETE FROM career_recommendations WHERE user_id = ?', [req.session.userId]);

    let totalScore = 0;
    for (const rec of recommendations) {
      totalScore += rec.match_score;
      await dbRun(
        'INSERT INTO career_recommendations (user_id, career_title, match_score, description, learning_path) VALUES (?, ?, ?, ?, ?)',
        [req.session.userId, rec.career_title, rec.match_score, rec.description, rec.learning_path]
      );
    }

    if (recommendations.length > 0) {
      const avgScore = Math.round(totalScore / recommendations.length);
      await dbRun(
        'INSERT INTO recommendation_runs (user_id, top_career, average_score, recommendation_count) VALUES (?, ?, ?, ?)',
        [req.session.userId, recommendations[0].career_title, avgScore, recommendations.length]
      );
    }

    const result = recommendations.map(r => ({
      ...r,
      learning_path: JSON.parse(r.learning_path)
    }));

    await logActivity(req.session.userId, 'recommendations_generate', { count: result.length });

    res.json({ success: true, message: 'Recommendations generated!', recommendations: result });
  } catch (err) {
    console.error('Recommendation error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate recommendations.' });
  }
});

router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      'SELECT * FROM career_recommendations WHERE user_id = ? ORDER BY match_score DESC',
      [req.session.userId]
    );
    const parsed = rows.map(r => ({ ...r, learning_path: JSON.parse(r.learning_path || '[]') }));
    res.json({ success: true, recommendations: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load recommendations.' });
  }
});

router.get('/recommendations/history', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT id, top_career, average_score, recommendation_count, created_at
       FROM recommendation_runs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.session.userId]
    );
    res.json({ success: true, history: rows });
  } catch (err) {
    console.error('recommendations history:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load recommendation history.' });
  }
});

router.post('/recommendations/:id/feedback', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rating, comment } = req.body;

    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid recommendation id.' });
    }

    const row = await dbGet(
      'SELECT id FROM career_recommendations WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: 'Recommendation not found.' });
    }

    let r = rating;
    if (r !== undefined && r !== null) {
      r = parseInt(r, 10);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be 1–5.' });
      }
    }

    await dbRun(
      `INSERT INTO recommendation_feedback (user_id, recommendation_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, recommendation_id) DO UPDATE SET
         rating = excluded.rating,
         comment = excluded.comment`,
      [req.session.userId, id, r ?? null, comment ? String(comment).slice(0, 500) : null]
    );

    await logActivity(req.session.userId, 'recommendation_feedback', { recommendation_id: id });

    res.json({ success: true, message: 'Thanks for your feedback!' });
  } catch (err) {
    console.error('feedback:', err.message);
    res.status(500).json({ success: false, error: 'Failed to save feedback.' });
  }
});

module.exports = router;
