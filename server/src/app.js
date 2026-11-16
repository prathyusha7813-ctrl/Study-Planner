const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.set('trust proxy', 1); // Render sits behind a proxy; needed for Secure cookies
  app.use(helmet());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/subjects', require('./routes/subjects'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/dashboard', require('./routes/dashboard'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
