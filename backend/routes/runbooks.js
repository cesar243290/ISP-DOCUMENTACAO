import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const runbooks = db.prepare('SELECT * FROM runbooks ORDER BY title').all();
    res.json(runbooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { title, category, content, tags } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO runbooks (id, title, category, content, tags, created_by) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, title, category, content, tags, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM runbooks WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { title, category, content, tags } = req.body;
  try {
    db.prepare('UPDATE runbooks SET title = ?, category = ?, content = ?, tags = ?, version = version + 1, updated_at = datetime("now") WHERE id = ?')
      .run(title, category, content, tags, req.params.id);
    res.json(db.prepare('SELECT * FROM runbooks WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM runbooks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Runbook deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
