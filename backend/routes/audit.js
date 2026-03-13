import express from 'express';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('ADMIN', 'NOC'));

router.get('/', (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = db.prepare(`
      SELECT a.*, u.email as user_email, u.full_name as user_name
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get();

    res.json({
      logs,
      pagination: {
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_log
      WHERE created_at > datetime('now', '-30 days')
      GROUP BY action
      ORDER BY count DESC
    `).all();

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
