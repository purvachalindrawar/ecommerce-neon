import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health endpoint (plain for now; DB check comes in Task 2)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'api' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
