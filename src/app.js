const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { initDatabase, createTables } = require('./db');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const recommendationsRoutes = require('./routes/recommendations');
const dashboardRoutes = require('./routes/dashboard');
const careersRoutes = require('./routes/careers');
const savedRoutes = require('./routes/saved');
const progressRoutes = require('./routes/progress');
const goalsRoutes = require('./routes/goals');
const statsRoutes = require('./routes/stats');
const notificationsRoutes = require('./routes/notifications');

const PORT = parseInt(process.env.PORT || '3000', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'ai-career-nav-dev-secret-change-in-production';

function resolveDbPath() {
  const root = path.join(__dirname, '..');
  const dataDir = path.join(root, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'career_navigator.db');
  const legacy = path.join(root, 'career_navigator.db');
  if (fs.existsSync(legacy) && !fs.existsSync(dbPath)) {
    try {
      fs.copyFileSync(legacy, dbPath);
    } catch (e) {
      console.error('Could not migrate legacy database:', e.message);
    }
  }
  return dbPath;
}

async function buildApp() {
  const dbPath = resolveDbPath();
  initDatabase(dbPath);
  await createTables();

  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      }
    })
  );

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      service: 'ai-career-navigator',
      time: new Date().toISOString()
    });
  });

  app.use('/api', authRoutes);
  app.use('/api', profileRoutes);
  app.use('/api', recommendationsRoutes);
  app.use('/api', dashboardRoutes);
  app.use('/api', careersRoutes);
  app.use('/api', savedRoutes);
  app.use('/api', progressRoutes);
  app.use('/api', goalsRoutes);
  app.use('/api', statsRoutes);
  app.use('/api', notificationsRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error.' });
  });

  return app;
}

async function start() {
  const app = await buildApp();
  app.listen(PORT, () => {
    console.log(`\n🚀 AI Career Navigator is running!`);
    console.log(`📌 Open: http://localhost:${PORT}/login.html\n`);
  });
}

module.exports = { buildApp, start };
