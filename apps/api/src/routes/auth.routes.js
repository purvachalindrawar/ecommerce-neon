const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require('../lib/tokens');
const { loginSchema, signupSchema, refreshSchema } = require('./auth.schemas');

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name ?? null, password: hash },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    const payload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const decoded = verifyRefreshToken(refreshToken);
    const expMs = (decoded.exp || 0) * 1000;

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(expMs) }
    });

    return res.status(201).json({ user, accessToken, refreshToken });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { sub: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const decoded = verifyRefreshToken(refreshToken);
    const expMs = (decoded.exp || 0) * 1000;

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(expMs) }
    });

    return res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt },
      accessToken,
      refreshToken
    });
  } catch (e) { next(e); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    await prisma.refreshToken.update({ where: { token: refreshToken }, data: { revoked: true } });

    const payload = { sub: user.id, role: user.role };
    const newAccess = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);
    const newDecoded = verifyRefreshToken(newRefresh);
    const expMs = (newDecoded.exp || 0) * 1000;

    await prisma.refreshToken.create({
      data: { token: newRefresh, userId: user.id, expiresAt: new Date(expMs) }
    });

    return res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) { next(e); }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, revoked: false },
      data: { revoked: true }
    });
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
