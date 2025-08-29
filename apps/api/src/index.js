require('dotenv/config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { prisma } = require('./lib/prisma');

const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Friendly base
app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    service: 'api',
    message: 'E-commerce API',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET  /api/me'
    ]
  });
});

// Health (app + DB)
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'api', db: 'up' });
  } catch {
    res.status(500).json({ ok: false, service: 'api', db: 'down' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', meRoutes);

// JSON 404 for /api/*
app.use('/api/*', (_req, res) => res.status(404).json({ error: 'NotFound' }));

// Boot
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1'; // bind explicitly

app.listen(PORT, HOST, () => {
  console.log(`API running on http://${HOST}:${PORT}`);
});
