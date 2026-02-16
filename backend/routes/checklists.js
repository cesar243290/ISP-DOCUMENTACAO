import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const checklists = db.prepare('SELECT * FROM checklists ORDER BY created_at DESC').all();
    res.json(checklists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY display_order').all(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC', 'FIELD_TECH'), (req, res) => {
  const { title, description, type } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO checklists (id, title, description, type, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(id, title, description, type, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM checklists WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/items', requireRole('ADMIN', 'NOC', 'FIELD_TECH'), (req, res) => {
  const { item_text, display_order } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO checklist_items (id, checklist_id, item_text, display_order) VALUES (?, ?, ?, ?)')
      .run(id, req.params.id, item_text, display_order || 0);
    res.status(201).json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/items/:id', requireRole('ADMIN', 'NOC', 'FIELD_TECH'), (req, res) => {
  const { is_completed } = req.body;
  try {
    const completed_at = is_completed ? new Date().toISOString() : null;
    const completed_by = is_completed ? req.user.id : null;

    db.prepare('UPDATE checklist_items SET is_completed = ?, completed_by = ?, completed_at = ? WHERE id = ?')
      .run(is_completed, completed_by, completed_at, req.params.id);
    res.json(db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM checklists WHERE id = ?').run(req.params.id);
    res.json({ message: 'Checklist deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
