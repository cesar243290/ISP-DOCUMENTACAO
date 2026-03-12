import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../utils/audit.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pops ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Get POPs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pops WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'POP not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get POP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, address, city, state, country, latitude, longitude, type, status, notes } = req.body;

    const [result] = await db.execute(
      `INSERT INTO pops (name, code, address, city, state, country, latitude, longitude, type, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, code, address, city, state, country, latitude, longitude, type, status || 'active', notes]
    );

    await logAudit(req.user.id, 'create', 'pop', result.insertId, { name, code }, req);

    const [newPop] = await db.execute('SELECT * FROM pops WHERE id = ?', [result.insertId]);
    res.status(201).json(newPop[0]);
  } catch (error) {
    console.error('Create POP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, code, address, city, state, country, latitude, longitude, type, status, notes } = req.body;

    await db.execute(
      `UPDATE pops SET name = ?, code = ?, address = ?, city = ?, state = ?, country = ?,
       latitude = ?, longitude = ?, type = ?, status = ?, notes = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, code, address, city, state, country, latitude, longitude, type, status, notes, req.params.id]
    );

    await logAudit(req.user.id, 'update', 'pop', req.params.id, { name, code }, req);

    const [updated] = await db.execute('SELECT * FROM pops WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Update POP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user.id, 'delete', 'pop', req.params.id, {}, req);
    await db.execute('DELETE FROM pops WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete POP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
