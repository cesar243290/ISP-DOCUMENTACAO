import express from 'express';
import { randomUUID } from 'crypto';
import { db } from '../server.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const circuits = db.prepare('SELECT * FROM circuits ORDER BY carrier').all();
    res.json(circuits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { carrier, circuit_id, description, bandwidth_mbps, monthly_cost, pop_a_id, pop_b_id, status, sla_percentage, contract_end } = req.body;
  try {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO circuits (id, carrier, circuit_id, description, bandwidth_mbps, monthly_cost, pop_a_id, pop_b_id, status, sla_percentage, contract_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, carrier, circuit_id, description, bandwidth_mbps, monthly_cost, pop_a_id, pop_b_id, status, sla_percentage, contract_end);
    res.status(201).json(db.prepare('SELECT * FROM circuits WHERE id = ?').get(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  const { carrier, circuit_id, description, bandwidth_mbps, monthly_cost, pop_a_id, pop_b_id, status, sla_percentage, contract_end } = req.body;
  try {
    db.prepare(`
      UPDATE circuits SET carrier = ?, circuit_id = ?, description = ?, bandwidth_mbps = ?, monthly_cost = ?,
                         pop_a_id = ?, pop_b_id = ?, status = ?, sla_percentage = ?, contract_end = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(carrier, circuit_id, description, bandwidth_mbps, monthly_cost, pop_a_id, pop_b_id, status, sla_percentage, contract_end, req.params.id);
    res.json(db.prepare('SELECT * FROM circuits WHERE id = ?').get(req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole('ADMIN', 'NOC'), (req, res) => {
  try {
    db.prepare('DELETE FROM circuits WHERE id = ?').run(req.params.id);
    res.json({ message: 'Circuito deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
