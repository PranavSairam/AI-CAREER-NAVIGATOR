const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { dbRun, dbGet, dbAll, logActivity } = require('../db');
const { getCareerByTitle } = require('../data/careers');

const router = express.Router();

router.get('/goals', requireAuth, async (req, res) => {
  try {
    const goals = await dbAll(
      'SELECT * FROM user_goals WHERE user_id = ? ORDER BY completed ASC, created_at DESC',
      [req.session.userId]
    );
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load goals.' });
  }
});

router.get('/goals/reminders', requireAuth, async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT id, title, career_title, due_date
       FROM user_goals
       WHERE user_id = ? AND completed = 0 AND due_date IS NOT NULL
       ORDER BY due_date ASC`,
      [req.session.userId]
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const reminders = rows.map(g => {
      const due = new Date(g.due_date);
      due.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return {
        ...g,
        status: daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'due_soon' : 'upcoming',
        days_left: daysLeft
      };
    });

    res.json({
      success: true,
      reminders,
      overdue_count: reminders.filter(r => r.status === 'overdue').length,
      due_soon_count: reminders.filter(r => r.status === 'due_soon').length
    });
  } catch (err) {
    console.error('goals reminders:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load goal reminders.' });
  }
});

router.post('/goals', requireAuth, async (req, res) => {
  try {
    const { title, career_title, due_date } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'title is required.' });
    }
    let ct = career_title ? String(career_title).trim() : null;
    if (ct && !getCareerByTitle(ct)) {
      return res.status(400).json({ success: false, error: 'Invalid career_title.' });
    }

    const r = await dbRun(
      'INSERT INTO user_goals (user_id, title, career_title, due_date) VALUES (?, ?, ?, ?)',
      [req.session.userId, String(title).trim().slice(0, 200), ct, due_date ? String(due_date).slice(0, 32) : null]
    );

    const row = await dbGet('SELECT * FROM user_goals WHERE id = ?', [r.lastID]);
    await logActivity(req.session.userId, 'goal_create', { id: r.lastID });

    res.status(201).json({ success: true, goal: row });
  } catch (err) {
    console.error('goals POST:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create goal.' });
  }
});

router.patch('/goals/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid id.' });
    }

    const existing = await dbGet('SELECT * FROM user_goals WHERE id = ? AND user_id = ?', [id, req.session.userId]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Goal not found.' });
    }

    const { title, career_title, due_date, completed } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(String(title).trim().slice(0, 200));
    }
    if (career_title !== undefined) {
      const ct = career_title ? String(career_title).trim() : null;
      if (ct && !getCareerByTitle(ct)) {
        return res.status(400).json({ success: false, error: 'Invalid career_title.' });
      }
      updates.push('career_title = ?');
      params.push(ct);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date ? String(due_date).slice(0, 32) : null);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      params.push(completed ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json({ success: true, goal: existing });
    }

    params.push(id, req.session.userId);
    await dbRun(`UPDATE user_goals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);

    const row = await dbGet('SELECT * FROM user_goals WHERE id = ?', [id]);
    res.json({ success: true, goal: row });
  } catch (err) {
    console.error('goals PATCH:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update goal.' });
  }
});

router.delete('/goals/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const r = await dbRun('DELETE FROM user_goals WHERE id = ? AND user_id = ?', [id, req.session.userId]);
    if (r.changes === 0) {
      return res.status(404).json({ success: false, error: 'Not found.' });
    }
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete.' });
  }
});

module.exports = router;
