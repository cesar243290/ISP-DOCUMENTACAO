import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY name').all();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, type, description, equipment_id, endpoint, port, status } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO services (id, name, type, description, equipment_id, endpoint, port, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, type, description, equipment_id, endpoint, port, status);
    res.status(201).json(db.prepare('SELECT * FROM services WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, type, description, equipment_id, endpoint, port, status } = req.body;
  try {
    db.prepare('UPDATE services SET name = ?, type = ?, description = ?, equipment_id = ?, endpoint = ?, port = ?, status = ?, updated_at = datetime("now") WHERE id = ?')
      .run(name, type, description, equipment_id, endpoint, port, status, req.params.id);
    res.json(db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.json({ message: 'Serviço deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
