import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const pops = db.prepare('SELECT * FROM pops ORDER BY name').all();
    res.json(pops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const pop = db.prepare('SELECT * FROM pops WHERE id = ?').get(req.params.id);
    if (!pop) return res.status(404).json({ error: 'POP não encontrado' });
    res.json(pop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, code, address, city, state, latitude, longitude } = req.body;
  try {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO pops (id, name, code, address, city, state, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code, address, city, state, latitude, longitude);

    const pop = db.prepare('SELECT * FROM pops WHERE id = ?').get(id);
    res.status(201).json(pop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, code, address, city, state, latitude, longitude } = req.body;
  try {
    db.prepare(`
      UPDATE pops SET name = ?, code = ?, address = ?, city = ?, state = ?,
                      latitude = ?, longitude = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, code, address, city, state, latitude, longitude, req.params.id);

    const pop = db.prepare('SELECT * FROM pops WHERE id = ?').get(req.params.id);
    res.json(pop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM pops WHERE id = ?').run(req.params.id);
    res.json({ message: 'POP deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
