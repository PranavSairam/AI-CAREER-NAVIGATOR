const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { validateEmail } = require('../utils');
const { dbRun, dbGet, logActivity } = require('../db');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields (name, email, password) are required.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = bcrypt.hashSync(password.trim(), 10);
    const result = await dbRun(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );
    await dbRun('INSERT INTO user_profiles (user_id) VALUES (?)', [result.lastID]);

    req.session.userId = result.lastID;
    req.session.userName = name.trim();
    await logActivity(result.lastID, 'register', { email: email.toLowerCase().trim() });

    res.status(201).json({ success: true, message: 'Account created successfully!', name: name.trim() });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, error: 'This email is already registered. Please login.' });
    }
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'No account found with this email.' });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    await logActivity(user.id, 'login', {});

    res.json({ success: true, message: 'Login successful!', name: user.name });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Server error. Please try again.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, error: 'Logout failed.' });
    res.json({ success: true, message: 'Logged out successfully.' });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Not logged in.' });
  }
  try {
    const user = await dbGet(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.session.userId]
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.post('/change-password', requireAuth, authLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [hash, req.session.userId]);
    await logActivity(req.session.userId, 'password_change', {});

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('change-password:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required to delete your account.' });
    }
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Incorrect password.' });
    }

    const uid = req.session.userId;
    await dbRun('DELETE FROM users WHERE id = ?', [uid]);
    req.session.destroy(() => {
      res.json({ success: true, message: 'Account deleted.' });
    });
  } catch (err) {
    console.error('delete account:', err.message);
    res.status(500).json({ success: false, error: 'Failed to delete account.' });
  }
});

module.exports = router;
