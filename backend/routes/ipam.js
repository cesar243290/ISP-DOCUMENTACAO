import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/subnets', (req, res) => {
  try {
    const subnets = db.prepare('SELECT * FROM subnets ORDER BY network').all();
    res.json(subnets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/subnets', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { network, cidr, description, vlan_id, vrf, gateway, usage_type } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO subnets (id, network, cidr, description, vlan_id, vrf, gateway, usage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, network, cidr, description, vlan_id, vrf, gateway, usage_type);
    res.status(201).json(db.prepare('SELECT * FROM subnets WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/allocations', (req, res) => {
  try {
    const allocations = db.prepare('SELECT * FROM ip_allocations ORDER BY ip_address').all();
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/allocations', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { subnet_id, ip_address, hostname, description, equipment_id, interface_id } = req.body;
  try {
    const id = randomUUID();
    db.prepare('INSERT INTO ip_allocations (id, subnet_id, ip_address, hostname, description, equipment_id, interface_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, subnet_id, ip_address, hostname, description, equipment_id, interface_id);
    res.status(201).json(db.prepare('SELECT * FROM ip_allocations WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subnets/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM subnets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Subnet deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/allocations/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM ip_allocations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Alocação deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
