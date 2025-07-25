
import express from 'express';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '../utils/verifyUser.js';
import { isAdmin } from '../utils/verifyRoles.js';
import { getAllReports } from '../controllers/admin.controller.js';

const router = express.Router();

/**
 * GET /admin/logs - Admin only: View paginated activity logs
 */
router.get('/logs', verifyToken, isAdmin, async (req, res) => {
  const logPath = path.join(process.cwd(), 'logs', 'activity.log');

  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    const paginated = lines.slice(skip, skip + limit).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line }; // fallback for malformed lines
      }
    });

    res.status(200).json(paginated);
  } catch (err) {
    console.error('File read error:', err.message);
    res.status(500).json({ error: 'Could not read logs' });
  }
});

// ⛔️ Reject all other HTTP methods for /logs
router.all('/logs', (_req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

/**
 * GET /admin/reports - Admin only: View all reports
 */
router.get('/reports', verifyToken, isAdmin, getAllReports);

// ⛔️ Reject all other HTTP methods for /reports
router.all('/reports', (_req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});

export default router;
