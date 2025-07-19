import express from 'express';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// GET /api/admin/logs
router.get('/logs', verifyToken, async (req, res) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Forbidden' });

  const logPath = path.join(process.cwd(), 'logs', 'activity.log');
  try {
    const logs = fs.readFileSync(logPath, 'utf8').trim().split('\n').reverse().slice(0, 100);
    const parsed = logs.map(line => JSON.parse(line));
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Could not read logs' });
  }
});

export default router;
