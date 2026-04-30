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

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const notifications = [];

    const profile = await dbGet('SELECT * FROM user_profiles WHERE user_id = ?', [req.session.userId]);
    const pct = profileCompletion(profile);
    if (pct < 75) {
      notifications.push({
        type: 'profile',
        severity: 'medium',
        title: 'Complete your profile',
        message: `Your profile is ${pct}% complete. Add more details for stronger recommendations.`
      });
    }

    const latestRun = await dbGet(
      'SELECT created_at FROM recommendation_runs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.session.userId]
    );
    if (!latestRun) {
      notifications.push({
        type: 'recommendations',
        severity: 'high',
        title: 'Generate your first recommendations',
        message: 'No recommendation run found yet. Generate one from your profile page.'
      });
    } else {
      const ageMs = Date.now() - new Date(latestRun.created_at).getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      if (ageDays >= 14) {
        notifications.push({
          type: 'recommendations',
          severity: 'low',
          title: 'Recommendations are getting old',
          message: `Last run was ${ageDays} days ago. Regenerate to reflect your latest skills.`
        });
      }
    }

    const goals = await dbAll(
      `SELECT title, due_date
       FROM user_goals
       WHERE user_id = ? AND completed = 0 AND due_date IS NOT NULL
       ORDER BY due_date ASC LIMIT 5`,
      [req.session.userId]
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const goal of goals) {
      const due = new Date(goal.due_date);
      due.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) {
        notifications.push({
          type: 'goal',
          severity: 'high',
          title: 'Goal overdue',
          message: `"${goal.title}" is overdue by ${Math.abs(daysLeft)} day(s).`
        });
      } else if (daysLeft <= 3) {
        notifications.push({
          type: 'goal',
          severity: 'medium',
          title: 'Goal due soon',
          message: `"${goal.title}" is due in ${daysLeft} day(s).`
        });
      }
    }

    res.json({
      success: true,
      notifications: notifications.slice(0, 8),
      unread_count: notifications.length
    });
  } catch (err) {
    console.error('notifications:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load notifications.' });
  }
});

module.exports = router;
