import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const vlans = db.prepare('SELECT * FROM vlans ORDER BY vlan_id').all();
    res.json(vlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { vlan_id, name, description, type, scope } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO vlans (id, vlan_id, name, description, type, scope) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, vlan_id, name, description, type, scope);
    res.status(201).json(db.prepare('SELECT * FROM vlans WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { vlan_id, name, description, type, scope } = req.body;
  try {
    db.prepare('UPDATE vlans SET vlan_id = ?, name = ?, description = ?, type = ?, scope = ?, updated_at = datetime("now") WHERE id = ?')
      .run(vlan_id, name, description, type, scope, req.params.id);
    res.json(db.prepare('SELECT * FROM vlans WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM vlans WHERE id = ?').run(req.params.id);
    res.json({ message: 'VLAN deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
