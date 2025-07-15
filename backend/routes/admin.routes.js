import express from 'express';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../utils/verifyUser.js';
import { isAdmin } from '../utils/verifyRoles.js';

const router = express.Router();

// GET /api/admin/logs
router.get('/logs', verifyToken, isAdmin, (req, res) => {
  const logFilePath = path.join(process.cwd(), 'logs', 'activity.log');

  try {
    if (!fs.existsSync(logFilePath)) return res.status(404).json({ message: 'Log file not found' });

    const raw = fs.readFileSync(logFilePath, 'utf-8');
    const lines = raw.trim().split('\n');
    const logs = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null; // ignore bad lines
      }
    }).filter(Boolean).reverse(); // latest first

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ message: 'Error reading logs' });
  }
});

export default router;
