import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './lib/prisma';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    // simple connectivity check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'api', db: 'up' });
  } catch (e) {
    res.status(500).json({ ok: false, service: 'api', db: 'down' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
