import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const interfaces = db.prepare(`
      SELECT i.*, e.name as equipment_name
      FROM interfaces i
      LEFT JOIN equipments e ON i.equipment_id = e.id
      ORDER BY e.name, i.name
    `).all();
    res.json(interfaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { equipment_id, name, type, description, speed_mbps, status, ip_address, mac_address, vlan_id } = req.body;
  try {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO interfaces (id, equipment_id, name, type, description, speed_mbps, status, ip_address, mac_address, vlan_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, equipment_id, name, type, description, speed_mbps, status, ip_address, mac_address, vlan_id);

    const interface_ = db.prepare('SELECT * FROM interfaces WHERE id = ?').get(id);
    res.status(201).json(interface_);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { equipment_id, name, type, description, speed_mbps, status, ip_address, mac_address, vlan_id } = req.body;
  try {
    db.prepare(`
      UPDATE interfaces SET equipment_id = ?, name = ?, type = ?, description = ?, speed_mbps = ?,
                          status = ?, ip_address = ?, mac_address = ?, vlan_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(equipment_id, name, type, description, speed_mbps, status, ip_address, mac_address, vlan_id, req.params.id);

    const interface_ = db.prepare('SELECT * FROM interfaces WHERE id = ?').get(req.params.id);
    res.json(interface_);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM interfaces WHERE id = ?').run(req.params.id);
    res.json({ message: 'Interface deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
