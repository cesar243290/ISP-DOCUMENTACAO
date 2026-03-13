import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const equipments = db.prepare(`
      SELECT e.*, p.name as pop_name
      FROM equipments e
      LEFT JOIN pops p ON e.pop_id = p.id
      ORDER BY e.name
    `).all();
    res.json(equipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, type, brand, model, serial_number, hostname, management_ip, pop_id, rack, position_u, status, criticality, notes, config } = req.body;
  try {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO equipments (id, name, type, brand, model, serial_number, hostname, management_ip, pop_id, rack, position_u, status, criticality, notes, config)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, type, brand, model, serial_number, hostname, management_ip, pop_id, rack, position_u, status, criticality, notes, config);

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(id);
    res.status(201).json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { name, type, brand, model, serial_number, hostname, management_ip, pop_id, rack, position_u, status, criticality, notes, config } = req.body;
  try {
    db.prepare(`
      UPDATE equipments SET name = ?, type = ?, brand = ?, model = ?, serial_number = ?, hostname = ?,
                           management_ip = ?, pop_id = ?, rack = ?, position_u = ?, status = ?,
                           criticality = ?, notes = ?, config = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, type, brand, model, serial_number, hostname, management_ip, pop_id, rack, position_u, status, criticality, notes, config, req.params.id);

    const equipment = db.prepare('SELECT * FROM equipments WHERE id = ?').get(req.params.id);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM equipments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Equipamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
