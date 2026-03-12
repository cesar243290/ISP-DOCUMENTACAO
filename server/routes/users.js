import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { email, full_name, role, is_active, password } = req.body;

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.execute(
        'UPDATE users SET email = ?, full_name = ?, role = ?, is_active = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
        [email, full_name, role, is_active, passwordHash, req.params.id]
      );
    } else {
      await db.execute(
        'UPDATE users SET email = ?, full_name = ?, role = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
        [email, full_name, role, is_active, req.params.id]
      );
    }

    await logAudit(req.user.id, 'update', 'user', req.params.id, { email, role }, req);

    const [updated] = await db.execute(
      'SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await logAudit(req.user.id, 'delete', 'user', req.params.id, {}, req);
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
